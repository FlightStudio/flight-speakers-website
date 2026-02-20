import express from 'express'
import bcrypt from 'bcrypt'
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
import { getSpeakerById, getRelatedSpeakers, updateSpeakerFees, createSpeaker, updateSpeaker } from '../db/queries.js'
import { createDraft, getPendingDrafts, getDraftById, approveDraft, rejectDraft, getDraftCounts } from '../db/draft-queries.js'
import { createToken } from '../db/token-queries.js'
import { semanticSearch } from '../services/claude.js'
import { notifyEnquiryResponse } from '../services/notifications.js'
import { refreshAllSpeakerStats } from '../services/socialStats.js'
import { getAccountInfo, getList, trackEvent, createOrUpdateProfile } from '../services/klaviyo.js'

const router = express.Router()

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
    const SPEAKER_FIELDS = ['name', 'headline', 'photo', 'bio', 'topics', 'audiences', 'keynotes', 'speaking_format', 'video_url', 'social_profiles', 'fee_min', 'gender', 'ethnicity', 'nationality', 'location']
    const filtered = {}
    for (const key of SPEAKER_FIELDS) {
      if (req.body[key] !== undefined) filtered[key] = req.body[key]
    }
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
    const SPEAKER_FIELDS = ['name', 'headline', 'photo', 'bio', 'topics', 'audiences', 'keynotes', 'speaking_format', 'video_url', 'social_profiles', 'fee_min', 'gender', 'ethnicity', 'nationality', 'location']
    const filtered = {}
    for (const key of SPEAKER_FIELDS) {
      if (req.body[key] !== undefined) filtered[key] = req.body[key]
    }
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
      const SPEAKER_FIELDS = ['name', 'headline', 'photo', 'bio', 'topics', 'audiences', 'keynotes', 'speaking_format', 'video_url', 'social_profiles', 'fee_min', 'gender', 'ethnicity', 'nationality', 'location']
      editedData = {}
      for (const key of SPEAKER_FIELDS) {
        if (req.body[key] !== undefined) editedData[key] = req.body[key]
      }
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
      } catch { /* speaker lookup failed gracefully */ }
    }

    if (enquiry.brief) {
      try {
        const searchResult = await semanticSearch(enquiry.brief, enquiry.speaker_id ? 4 : 8)
        semanticMatches = (searchResult.speakers || []).filter(
          s => s.id !== enquiry.speaker_id
        )
      } catch { /* semantic search failed gracefully */ }
    }

    // Resolve additional speaker IDs to full objects
    const additionalIds = enquiry.additional_speaker_ids || []
    if (additionalIds.length > 0) {
      try {
        const resolved = await Promise.all(additionalIds.map(id => getSpeakerById(id)))
        additionalSpeakers = resolved.filter(Boolean)
      } catch { /* additional speaker lookup failed gracefully */ }
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

    const { status, admin_notes, response_message, rejection_reason } = req.body
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

    // Trigger notification stub
    if (status && ['accepted', 'rejected', 'responded'].includes(status)) {
      await notifyEnquiryResponse(updated, status, response_message)
    }

    res.json({ success: true, enquiry: updated })
  } catch (err) {
    console.error('Enquiry update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update enquiry' })
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
