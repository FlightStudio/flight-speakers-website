import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import {
  getWaitlistEntries,
  getWaitlistEntryById,
  updateWaitlistEntry,
  getWaitlistCounts,
} from '../../db/waitlist-queries.js'
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

export default router
