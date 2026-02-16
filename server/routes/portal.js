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

    if (name.length > 200 || headline.length > 300 || bio.length > 5000) {
      return res.status(400).json({ success: false, message: 'One or more fields exceed maximum length' })
    }
    if ((req.body.photo && req.body.photo.length > 1000) || (req.body.video_url && req.body.video_url.length > 500)) {
      return res.status(400).json({ success: false, message: 'URL fields exceed maximum length' })
    }

    // Whitelist allowed fields
    const allowedFields = ['name', 'headline', 'bio', 'photo', 'topics', 'audiences', 'keynotes', 'speaking_format', 'video_url', 'social_profiles', 'gender', 'ethnicity', 'nationality', 'location']
    const filtered = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) filtered[key] = req.body[key]
    }

    const draft = await createDraft({
      speakerId: result.token.speaker_id || null,
      type: result.token.type,
      data: filtered,
      submittedBy: 'portal',
    })

    await markTokenUsed(req.params.token)

    res.json({ success: true, draft })
  } catch (err) {
    console.error('Portal submit error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit' })
  }
})

export default router
