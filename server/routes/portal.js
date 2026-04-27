import express from 'express'
import { validateToken, validateAndConsumeToken } from '../db/token-queries.js'
import { createDraft } from '../db/draft-queries.js'
import { validate, portalDraftSchema } from '../schemas/index.js'

const router = express.Router()

// Tokens move via request body now (not URL path) so they don't leak into
// server access logs or the Referer header.

// POST /api/portal/validate — validate token and return speaker data
router.post('/validate', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  try {
    const result = await validateToken(token)
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.error })
    }
    res.json({
      success: true,
      type: result.token.type,
      speaker: result.speaker,
      expiresAt: result.token.expires_at,
    })
  } catch (err) {
    console.error('Portal validate error:', err)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
})

// POST /api/portal/submit — submit profile data as draft.
// Token validated + consumed atomically in one transaction.
router.post('/submit', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  // Strip token from body before schema validation (it's not part of the schema).
  const { token: _, ...rest } = req.body
  const data = validate({ body: rest }, res, portalDraftSchema)
  if (!data) return
  try {
    const result = await validateAndConsumeToken(token)
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.error })
    }

    const draft = await createDraft({
      speakerId: result.token.speaker_id || null,
      type: result.token.type,
      data,
      submittedBy: 'portal',
    })

    res.json({ success: true, draft })
  } catch (err) {
    console.error('Portal submit error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit' })
  }
})

export default router
