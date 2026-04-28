import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import {
  getWaitlistEntries,
  getWaitlistEntryById,
  updateWaitlistEntry,
  getWaitlistCounts,
} from '../../db/waitlist-queries.js'
import { createToken } from '../../db/token-queries.js'
import { mapWaitlistToSpeakerPrefill } from '../../services/waitlistMapper.js'
import { validate, waitlistUpdateSchema } from '../../schemas/index.js'

const router = express.Router()

// All routes require admin auth
router.use(requireAdmin)

// GET /api/admin/waitlist — paginated list with optional status filter
router.get('/waitlist', async (req, res) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query
    const result = await getWaitlistEntries({
      status: status || undefined,
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      offset: parseInt(offset, 10) || 0,
    })
    const counts = await getWaitlistCounts()
    res.json({ success: true, ...result, counts })
  } catch (error) {
    console.error('Waitlist list error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch waitlist' })
  }
})

// GET /api/admin/waitlist/:id — single entry
router.get('/waitlist/:id', async (req, res) => {
  try {
    const entry = await getWaitlistEntryById(req.params.id)
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, entry })
  } catch (error) {
    console.error('Waitlist entry error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch entry' })
  }
})

// PATCH /api/admin/waitlist/:id — update status / admin_notes
router.patch('/waitlist/:id', async (req, res) => {
  const data = validate(req, res, waitlistUpdateSchema)
  if (!data) return

  try {
    const entry = await updateWaitlistEntry(req.params.id, data)
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, entry })
  } catch (error) {
    console.error('Waitlist update error:', error)
    res.status(500).json({ success: false, message: 'Failed to update entry' })
  }
})

// POST /api/admin/waitlist/:id/invite — generate a pre-filled portal link from waitlist entry
router.post('/waitlist/:id/invite', async (req, res) => {
  try {
    const entry = await getWaitlistEntryById(req.params.id)
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' })
    }
    if (entry.status === 'declined') {
      return res.status(400).json({ success: false, message: 'Cannot invite a declined entry — change status first' })
    }

    const prefillData = mapWaitlistToSpeakerPrefill(entry)
    const token = await createToken({ type: 'new', expiresInDays: 14, prefillData })

    const updated = await updateWaitlistEntry(req.params.id, {
      status: 'invited',
      invited_at: new Date(),
      invited_token: token.token,
    })

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    const link = `${baseUrl}/speaker-portal#${token.token}`

    res.json({
      success: true,
      link,
      token: token.token,
      expiresAt: token.expires_at,
      entry: updated,
    })
  } catch (err) {
    console.error('Waitlist invite error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate invite link' })
  }
})

export default router
