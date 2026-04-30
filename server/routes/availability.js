import express from 'express'
import { validateToken } from '../db/token-queries.js'
import {
  getBlockedDates,
  replaceFutureBlockedDates,
} from '../db/availability-queries.js'
import { validate, availabilitySaveSchema } from '../schemas/index.js'

const router = express.Router()

function forwardWindow() {
  const today = new Date()
  const from = today.toISOString().slice(0, 10)
  const horizon = new Date(today)
  horizon.setFullYear(horizon.getFullYear() + 1)
  return { from, to: horizon.toISOString().slice(0, 10) }
}

router.post('/validate', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  try {
    const result = await validateToken(token)
    if (!result.valid || result.token.type !== 'availability' || !result.token.speaker_id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired link' })
    }
    const { from, to } = forwardWindow()
    const blocked = await getBlockedDates(result.token.speaker_id, from, to)
    res.json({
      success: true,
      speaker: result.speaker
        ? {
            id: result.speaker.id,
            name: result.speaker.name,
            headline: result.speaker.headline,
            photo: result.speaker.photo,
          }
        : null,
      blocked,
    })
  } catch (err) {
    console.error('Availability validate error:', err)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
})

router.post('/save', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  const { token: _t, ...rest } = req.body || {}
  const data = validate({ body: rest }, res, availabilitySaveSchema)
  if (!data) return
  try {
    const result = await validateToken(token)
    if (!result.valid || result.token.type !== 'availability' || !result.token.speaker_id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired link' })
    }
    await replaceFutureBlockedDates(result.token.speaker_id, data.blocked)
    const { from, to } = forwardWindow()
    const blocked = await getBlockedDates(result.token.speaker_id, from, to)
    res.json({ success: true, blocked })
  } catch (err) {
    console.error('Availability save error:', err)
    res.status(500).json({ success: false, message: 'Failed to save' })
  }
})

export default router
