import express from 'express'
import { validateToken, markTokenUsed } from '../db/token-queries.js'
import { createDraft } from '../db/draft-queries.js'

const router = express.Router()

// GET /api/portal/:token — validate token and return speaker data
router.get('/:token', async (req, res) => {
  try {
    const result = await validateToken(req.params.token)
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

// POST /api/portal/:token — submit profile data as draft
router.post('/:token', async (req, res) => {
  try {
    const result = await validateToken(req.params.token)
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.error })
    }

    const { name, headline, bio } = req.body
    if (!name || !headline || !bio) {
      return res.status(400).json({ success: false, message: 'Name, headline, and bio are required' })
    }

    const draft = await createDraft({
      speakerId: result.token.speaker_id || null,
      type: result.token.type,
      data: req.body,
      submittedBy: name,
    })

    await markTokenUsed(req.params.token)

    res.json({ success: true, draft })
  } catch (err) {
    console.error('Portal submit error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit' })
  }
})

export default router
