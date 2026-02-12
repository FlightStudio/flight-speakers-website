import express from 'express'
import bcrypt from 'bcrypt'
import { signToken, requireAdmin } from '../middleware/auth.js'
import {
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  getEnquiryStats,
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
    const stats = await getEnquiryStats()
    res.json({ success: true, stats })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
})

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 14
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
    const draft = await createDraft({ type: 'new', data: req.body, submittedBy: req.admin.username })
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
    const draft = await createDraft({
      speakerId: req.params.id,
      type: 'update',
      data: req.body,
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
    const link = `${req.protocol}://${req.get('host')}/speaker-portal/${token.token}`
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
    const link = `${req.protocol}://${req.get('host')}/speaker-portal/${token.token}`
    res.json({ success: true, link, token: token.token, expiresAt: token.expires_at, speakerName: speaker.name })
  } catch (err) {
    console.error('Invite update error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate link' })
  }
})

// POST /api/admin/review/:id/approve
router.post('/review/:id/approve', requireAdmin, async (req, res) => {
  try {
    const editedData = req.body && Object.keys(req.body).length > 0 ? req.body : null
    const result = await approveDraft(parseInt(req.params.id, 10), editedData)
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Approve error:', err)
    res.status(400).json({ success: false, message: err.message })
  }
})

// POST /api/admin/review/:id/reject
router.post('/review/:id/reject', requireAdmin, async (req, res) => {
  try {
    const draft = await rejectDraft(parseInt(req.params.id, 10))
    res.json({ success: true, draft })
  } catch (err) {
    console.error('Reject error:', err)
    res.status(400).json({ success: false, message: err.message })
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
    const { status, page = 1, limit = 20, sort = 'newest' } = req.query
    const result = await getEnquiries({
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
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

    const { status, admin_notes, response_message } = req.body
    const updates = {}

    if (status) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes
    if (response_message !== undefined) updates.response_message = response_message

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

export default router
