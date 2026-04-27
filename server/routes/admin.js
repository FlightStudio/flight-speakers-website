import express from 'express'
import bcrypt from 'bcrypt'
import multer from 'multer'
import { Storage } from '@google-cloud/storage'
import { signToken, requireAdmin } from '../middleware/auth.js'
import {
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  getEnquiryStats,
  getEnquiryAnalytics,
  getAdminUser,
  getSpeakerAnalytics,
  getSpeakerDetailAnalytics,
  deleteSpeaker,
  getDashboardAnalytics,
} from '../db/enquiry-queries.js'
import { getSpeakerById, getRelatedSpeakers, createSpeaker, updateSpeaker } from '../db/queries.js'
import { createDraft, getPendingDrafts, getDraftById, approveDraft, rejectDraft, getDraftCounts } from '../db/draft-queries.js'
import { getAllTemplates, getTemplateByReasonKey, updateTemplate } from '../db/template-queries.js'
import { createToken } from '../db/token-queries.js'
import { semanticSearch } from '../services/claude.js'
import { notifyEnquiryResponse } from '../services/notifications.js'
import { refreshAllSpeakerStats } from '../services/socialStats.js'
import { getAccountInfo, getList, trackEvent, createOrUpdateProfile } from '../services/klaviyo.js'

const router = express.Router()

// GCS upload config
const GCS_BUCKET = process.env.GCS_BUCKET || 'flight-speakers-photos'
const bucket = new Storage().bucket(GCS_BUCKET)

const MAX_IMAGE_SIZE = 5 * 1024 * 1024     // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024    // 100 MB
const CACHE_ONE_YEAR = 'public, max-age=31536000'

const ALLOWED_IMAGES = /^image\/(jpeg|png|webp|gif)$/
const ALLOWED_VIDEOS = /^video\/(mp4|webm|quicktime|mov)$/

// Pin output extension to the validated MIME, never trust client filename.
const IMAGE_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const VIDEO_EXT_BY_MIME = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/mov': '.mov',
}

// Speaker IDs are slugs (see db/queries.js createSpeaker). Reject anything else
// before it reaches the GCS path to block traversal and object overwrite.
const SPEAKER_ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/

// Fields accepted on speaker create/update endpoints. camelCase to match
// SpeakerForm state and queries.js createSpeaker/updateSpeaker (which map
// camelCase -> snake_case DB columns internally).
const SPEAKER_FIELDS = [
  'name', 'headline', 'photo', 'bio',
  'topics', 'audiences', 'keynotes',
  'speakingFormat', 'videoUrl', 'socialProfiles', 'feeMin',
  'gender', 'ethnicity', 'nationality', 'location',
]

function pickSpeakerFields(body) {
  const out = {}
  for (const key of SPEAKER_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key]
  }
  return out
}

function createUpload(fieldName, mimePattern, maxSize, errorMsg) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      mimePattern.test(file.mimetype) ? cb(null, true) : cb(new Error(errorMsg))
    },
  }).single(fieldName)
}

const imageUpload = createUpload('photo', ALLOWED_IMAGES, MAX_IMAGE_SIZE, 'Only image files are allowed')
const videoUpload = createUpload('video', ALLOWED_VIDEOS, MAX_VIDEO_SIZE, 'Only video files (MP4, WebM, MOV) are allowed')

async function uploadToGCS(file, gcsPath) {
  const blob = bucket.file(gcsPath)
  await blob.save(file.buffer, {
    contentType: file.mimetype,
    metadata: { cacheControl: CACHE_ONE_YEAR },
  })
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}

router.post('/speakers/:id/photo', requireAdmin, imageUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!SPEAKER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid speaker id' })
  }
  const ext = IMAGE_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported image type' })
  try {
    const gcsPath = `speakers/${req.params.id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    await updateSpeaker(req.params.id, { photo: url })
    res.json({ success: true, photo: url })
  } catch (err) {
    console.error('Photo upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

router.post('/speakers/:id/video', requireAdmin, videoUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!SPEAKER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid speaker id' })
  }
  const ext = VIDEO_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported video type' })
  try {
    const gcsPath = `speakers/videos/${req.params.id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    await updateSpeaker(req.params.id, { videoUrl: url })
    res.json({ success: true, videoUrl: url })
  } catch (err) {
    console.error('Video upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' })
    }

    const user = await getAdminUser(username)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = signToken({ sub: user.id, username: user.username })

    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
    })

    res.json({ success: true, user: { username: user.username } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Login failed' })
  }
})

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token')
  res.json({ success: true })
})

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, user: req.admin })
})

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await getEnquiryStats(req.query.engagementType)
    res.json({ success: true, stats })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
})

// GET /api/admin/enquiry-analytics
router.get('/enquiry-analytics', requireAdmin, async (req, res) => {
  try {
    const analytics = await getEnquiryAnalytics(req.query.engagementType)
    res.json({ success: true, analytics })
  } catch (err) {
    console.error('Enquiry analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry analytics' })
  }
})

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 365)
    const data = await getDashboardAnalytics(days)
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('Dashboard analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' })
  }
})

// GET /api/admin/speakers/analytics
router.get('/speakers/analytics', requireAdmin, async (req, res) => {
  try {
    const validPeriods = ['day', 'week', 'all']
    const period = validPeriods.includes(req.query.period) ? req.query.period : 'all'
    const analytics = await getSpeakerAnalytics(period)
    res.json({ success: true, analytics })
  } catch (err) {
    console.error('Speaker analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch speaker analytics' })
  }
})

// POST /api/admin/speakers — creates a draft for review
router.post('/speakers', requireAdmin, async (req, res) => {
  try {
    const { name, headline, photo, bio } = req.body
    if (!name || !headline || !photo || !bio) {
      return res.status(400).json({ success: false, message: 'Name, headline, photo, and bio are required' })
    }
    const filtered = pickSpeakerFields(req.body)
    const draft = await createDraft({ type: 'new', data: filtered, submittedBy: req.admin.username })
    res.status(201).json({ success: true, draft })
  } catch (err) {
    console.error('Speaker draft create error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit speaker for review' })
  }
})

// PATCH /api/admin/speakers/:id — creates an update draft for review
router.patch('/speakers/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await getSpeakerById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const filtered = pickSpeakerFields(req.body)
    const draft = await createDraft({
      speakerId: req.params.id,
      type: 'update',
      data: filtered,
      submittedBy: req.admin.username,
    })
    res.json({ success: true, draft })
  } catch (err) {
    console.error('Speaker draft update error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit update for review' })
  }
})

// GET /api/admin/review — list pending drafts
router.get('/review', requireAdmin, async (req, res) => {
  try {
    const type = req.query.type || null
    const drafts = await getPendingDrafts(type)
    const counts = await getDraftCounts()
    res.json({ success: true, drafts, counts })
  } catch (err) {
    console.error('Review list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch review queue' })
  }
})

// GET /api/admin/review/counts — just counts for sidebar badge
router.get('/review/counts', requireAdmin, async (req, res) => {
  try {
    const counts = await getDraftCounts()
    res.json({ success: true, counts })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch counts' })
  }
})

// POST /api/admin/invite/new — generate link for new speaker submission
router.post('/invite/new', requireAdmin, async (req, res) => {
  try {
    const token = await createToken({ type: 'new', expiresInDays: 7 })
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    const link = `${baseUrl}/speaker-portal/${token.token}`
    res.json({ success: true, link, token: token.token, expiresAt: token.expires_at })
  } catch (err) {
    console.error('Invite new error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate link' })
  }
})

// POST /api/admin/invite/:speakerId — generate link for speaker to update their profile
router.post('/invite/:speakerId', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.speakerId)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const token = await createToken({ speakerId: req.params.speakerId, type: 'update', expiresInDays: 7 })
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    const link = `${baseUrl}/speaker-portal/${token.token}`
    res.json({ success: true, link, token: token.token, expiresAt: token.expires_at, speakerName: speaker.name })
  } catch (err) {
    console.error('Invite update error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate link' })
  }
})

// POST /api/admin/review/:id/approve
router.post('/review/:id/approve', requireAdmin, async (req, res) => {
  try {
    let editedData = null
    if (req.body && Object.keys(req.body).length > 0) {
      editedData = pickSpeakerFields(req.body)
      if (Object.keys(editedData).length === 0) editedData = null
    }
    const result = await approveDraft(parseInt(req.params.id, 10), editedData)
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Approve error:', err)
    res.status(400).json({ success: false, message: 'Failed to approve draft' })
  }
})

// POST /api/admin/review/:id/reject
router.post('/review/:id/reject', requireAdmin, async (req, res) => {
  try {
    const draft = await rejectDraft(parseInt(req.params.id, 10))
    res.json({ success: true, draft })
  } catch (err) {
    console.error('Reject error:', err)
    res.status(400).json({ success: false, message: 'Failed to reject draft' })
  }
})

// GET /api/admin/speakers/:id
router.get('/speakers/:id', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.id)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const analytics = await getSpeakerDetailAnalytics(req.params.id)
    res.json({ success: true, speaker, analytics })
  } catch (err) {
    console.error('Speaker detail error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch speaker details' })
  }
})

// DELETE /api/admin/speakers/:id
router.delete('/speakers/:id', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.id)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const deleted = await deleteSpeaker(req.params.id)
    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete speaker' })
    }
    res.json({ success: true, message: `Speaker "${speaker.name}" deleted` })
  } catch (err) {
    console.error('Speaker delete error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete speaker' })
  }
})

// GET /api/admin/enquiries
router.get('/enquiries', requireAdmin, async (req, res) => {
  try {
    const { status, engagementType, rejectionReason, page = 1, limit = 20, sort = 'newest' } = req.query
    const result = await getEnquiries({
      status,
      engagementType,
      rejectionReason,
      page: Math.max(parseInt(page, 10) || 1, 1),
      limit: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
      sort,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Enquiries list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries' })
  }
})

// GET /api/admin/enquiries/:id
router.get('/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    const enquiry = await getEnquiryById(req.params.id)
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' })
    }

    // Auto-mark as reviewed if new
    if (enquiry.status === 'new') {
      await updateEnquiry(enquiry.id, { status: 'reviewed' })
      enquiry.status = 'reviewed'
      enquiry.reviewed_at = new Date().toISOString()
    }

    // Fetch speaker recommendations
    let requestedSpeaker = null
    let relatedSpeakers = []
    let semanticMatches = []
    let additionalSpeakers = []

    if (enquiry.speaker_id) {
      try {
        requestedSpeaker = await getSpeakerById(enquiry.speaker_id)
        if (requestedSpeaker) {
          relatedSpeakers = await getRelatedSpeakers(enquiry.speaker_id, requestedSpeaker.topics, 6)
        }
      } catch (err) { console.warn('[admin enquiry detail] requested-speaker lookup failed:', err.message) }
    }

    if (enquiry.brief) {
      try {
        const searchResult = await semanticSearch(enquiry.brief, enquiry.speaker_id ? 4 : 8)
        semanticMatches = (searchResult.speakers || []).filter(
          s => s.id !== enquiry.speaker_id
        )
      } catch (err) { console.warn('[admin enquiry detail] semantic search failed:', err.message) }
    }

    // Resolve additional speaker IDs to full objects
    const additionalIds = enquiry.additional_speaker_ids || []
    if (additionalIds.length > 0) {
      try {
        const resolved = await Promise.all(additionalIds.map(id => getSpeakerById(id)))
        additionalSpeakers = resolved.filter(Boolean)
      } catch (err) { console.warn('[admin enquiry detail] additional-speaker lookup failed:', err.message) }
    }

    res.json({
      success: true,
      enquiry,
      speakers: {
        requested: requestedSpeaker,
        related: relatedSpeakers,
        semantic: semanticMatches,
        additional: additionalSpeakers,
      },
    })
  } catch (err) {
    console.error('Enquiry detail error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry' })
  }
})

// PATCH /api/admin/enquiries/:id
router.patch('/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    const enquiry = await getEnquiryById(req.params.id)
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' })
    }

    const { status, admin_notes, response_message, rejection_reason, email_subject } = req.body
    const updates = {}

    const VALID_STATUSES = ['new', 'reviewed', 'accepted', 'rejected', 'responded']
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' })
      }
      updates.status = status
    }
    if (admin_notes !== undefined) updates.admin_notes = admin_notes
    if (response_message !== undefined) updates.response_message = response_message
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason

    const updated = await updateEnquiry(req.params.id, updates)

    // Trigger notification (Klaviyo events for rejected/responded, log-only for accepted)
    if (status && ['accepted', 'rejected', 'responded'].includes(status)) {
      await notifyEnquiryResponse(updated, status, { response_message, rejection_reason, email_subject })
    }

    res.json({ success: true, enquiry: updated })
  } catch (err) {
    console.error('Enquiry update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update enquiry' })
  }
})

// GET /api/admin/integrations/monday — health check
router.get('/integrations/monday', requireAdmin, async (req, res) => {
  if (!process.env.MONDAY_API_TOKEN) {
    return res.json({ success: true, connected: false, error: 'No API token configured' })
  }

  try {
    const boardId = process.env.MONDAY_BOARD_ID || '1153323847'
    const query = `{ boards(ids: [${boardId}]) { id name groups { id title } } }`
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.MONDAY_API_TOKEN,
      },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()

    if (data.errors?.length) {
      return res.json({ success: true, connected: false, error: data.errors[0].message })
    }

    const board = data.data?.boards?.[0]
    if (!board) {
      return res.json({ success: true, connected: false, error: `Board ${boardId} not found` })
    }

    const targetGroup = board.groups?.find(g => g.id === 'group_mkvnqw22')
    res.json({
      success: true,
      connected: true,
      board: { id: board.id, name: board.name },
      group: targetGroup ? { id: targetGroup.id, title: targetGroup.title } : null,
    })
  } catch (err) {
    console.error('Monday.com health check error:', err.message)
    res.json({ success: true, connected: false, error: err.message })
  }
})

// GET /api/admin/integrations/klaviyo — health check + list stats
router.get('/integrations/klaviyo', requireAdmin, async (req, res) => {
  if (!process.env.KLAVIYO_API_KEY) {
    return res.json({ success: true, connected: false, error: 'No API key configured' })
  }

  try {
    const account = await getAccountInfo()

    const lists = []
    const enquiryListId = process.env.KLAVIYO_ENQUIRY_LIST_ID
    const newsletterListId = process.env.KLAVIYO_NEWSLETTER_LIST_ID

    if (enquiryListId) {
      try {
        const list = await getList(enquiryListId)
        lists.push({ ...list, type: 'enquiry' })
      } catch (err) {
        lists.push({ id: enquiryListId, type: 'enquiry', error: err.message })
      }
    }

    if (newsletterListId) {
      try {
        const list = await getList(newsletterListId)
        lists.push({ ...list, type: 'newsletter' })
      } catch (err) {
        lists.push({ id: newsletterListId, type: 'newsletter', error: err.message })
      }
    }

    res.json({ success: true, connected: true, account, lists })
  } catch (err) {
    console.error('Klaviyo health check error:', err.message)
    res.json({ success: true, connected: false, error: err.message })
  }
})

// POST /api/admin/integrations/klaviyo/test — send test event
router.post('/integrations/klaviyo/test', requireAdmin, async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address required' })
  }

  if (!process.env.KLAVIYO_API_KEY) {
    return res.status(400).json({ success: false, message: 'Klaviyo API key not configured' })
  }

  try {
    await createOrUpdateProfile({
      email,
      name: 'Test User',
      organization: 'Flight Speakers (Test)',
      properties: { source: 'admin_test' },
    })

    await trackEvent('Enquiry Submitted', email, {
      name: 'Test User',
      organization: 'Flight Speakers (Test)',
      speaker_name: 'Test Speaker',
      event_date: new Date().toISOString().split('T')[0],
      brief: 'This is a test enquiry sent from the admin panel to verify Klaviyo integration.',
    })

    res.json({ success: true, message: `Test event sent to ${email}` })
  } catch (err) {
    console.error('Klaviyo test error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/admin/templates — list all response templates
router.get('/templates', requireAdmin, async (req, res) => {
  try {
    const templates = await getAllTemplates()
    res.json({ success: true, templates })
  } catch (err) {
    console.error('Templates list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch templates' })
  }
})

// GET /api/admin/templates/:reasonKey — single template lookup
router.get('/templates/:reasonKey', requireAdmin, async (req, res) => {
  try {
    const template = await getTemplateByReasonKey(req.params.reasonKey)
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }
    res.json({ success: true, template })
  } catch (err) {
    console.error('Template lookup error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch template' })
  }
})

// PUT /api/admin/templates/:reasonKey — update template
router.put('/templates/:reasonKey', requireAdmin, async (req, res) => {
  try {
    const { label, subject, body } = req.body || {}
    if (label === undefined && subject === undefined && body === undefined) {
      return res.status(400).json({ success: false, message: 'No fields to update' })
    }
    const updated = await updateTemplate(req.params.reasonKey, { label, subject, body })
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }
    res.json({ success: true, template: updated })
  } catch (err) {
    console.error('Template update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update template' })
  }
})

// POST /api/admin/social-stats/refresh — manually trigger social stats refresh
router.post('/social-stats/refresh', requireAdmin, async (req, res) => {
  try {
    refreshAllSpeakerStats().catch(err => {
      console.error('[SocialStats] Manual refresh failed:', err.message)
    })
    res.json({ success: true, message: 'Social stats refresh started' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to start refresh' })
  }
})

export default router
