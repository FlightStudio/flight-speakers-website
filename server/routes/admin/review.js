import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { getSpeakerById } from '../../db/queries.js'
import {
  getPendingDrafts,
  approveDraft,
  rejectDraft,
  getDraftCounts,
} from '../../db/draft-queries.js'
import { createToken } from '../../db/token-queries.js'
import { validate, speakerPatchSchema } from '../../schemas/index.js'

const router = express.Router()

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

router.get('/review/counts', requireAdmin, async (req, res) => {
  try {
    const counts = await getDraftCounts()
    res.json({ success: true, counts })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch counts' })
  }
})

router.post('/invite/new', requireAdmin, async (req, res) => {
  try {
    const token = await createToken({ type: 'new', expiresInDays: 7 })
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    // URL fragment (after #) — never sent to the server, never logged.
    const link = `${baseUrl}/speaker-portal#${token.token}`
    res.json({ success: true, link, token: token.token, expiresAt: token.expires_at })
  } catch (err) {
    console.error('Invite new error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate link' })
  }
})

router.post('/invite/:speakerId', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.speakerId)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const token = await createToken({ speakerId: req.params.speakerId, type: 'update', expiresInDays: 7 })
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    // URL fragment (after #) — never sent to the server, never logged.
    const link = `${baseUrl}/speaker-portal#${token.token}`
    res.json({ success: true, link, token: token.token, expiresAt: token.expires_at, speakerName: speaker.name })
  } catch (err) {
    console.error('Invite update error:', err)
    res.status(500).json({ success: false, message: 'Failed to generate link' })
  }
})

router.post('/review/:id/approve', requireAdmin, async (req, res) => {
  let editedData = null
  if (req.body && Object.keys(req.body).length > 0) {
    editedData = validate(req, res, speakerPatchSchema)
    if (!editedData) return
    if (Object.keys(editedData).length === 0) editedData = null
  }
  try {
    const result = await approveDraft(parseInt(req.params.id, 10), editedData)
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Approve error:', err)
    res.status(400).json({ success: false, message: 'Failed to approve draft' })
  }
})

router.post('/review/:id/reject', requireAdmin, async (req, res) => {
  try {
    const draft = await rejectDraft(parseInt(req.params.id, 10))
    res.json({ success: true, draft })
  } catch (err) {
    console.error('Reject error:', err)
    res.status(400).json({ success: false, message: 'Failed to reject draft' })
  }
})

export default router
