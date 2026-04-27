import express from 'express'
import { createLimiter } from '../middleware/rateLimit.js'
import {
  getAllSpeakers,
  getSpeakerById,
  getRelatedSpeakers,
  getAllTopics,
  getAllAudiences,
} from '../db/queries.js'
import pool from '../db/connection.js'

const router = express.Router()

const viewLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: 'rl:view:',
  message: { success: false, message: 'Too many view events' },
})

// Get all speakers (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { topic, audience, limit } = req.query

    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 50) : undefined

    const speakers = await getAllSpeakers({
      topic: topic || undefined,
      audience: audience || undefined,
      limit: parsedLimit,
    })

    res.json({
      success: true,
      count: speakers.length,
      speakers,
    })
  } catch (err) {
    next(err)
  }
})

// Get all topics (must be before /:id to avoid matching 'meta')
router.get('/meta/topics', async (req, res, next) => {
  try {
    const topics = await getAllTopics()
    res.json({ success: true, topics })
  } catch (err) {
    next(err)
  }
})

// Get all audiences
router.get('/meta/audiences', async (req, res, next) => {
  try {
    const audiences = await getAllAudiences()
    res.json({ success: true, audiences })
  } catch (err) {
    next(err)
  }
})

// Get speaker by ID
router.get('/:id', async (req, res, next) => {
  try {
    const speaker = await getSpeakerById(req.params.id)

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      })
    }

    const relatedSpeakers = await getRelatedSpeakers(speaker.id, speaker.topics, 4)

    res.json({
      success: true,
      speaker,
      relatedSpeakers,
    })
  } catch (err) {
    next(err)
  }
})

// Track speaker view (fire-and-forget from frontend)
router.post('/:id/view', viewLimiter, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO speaker_views (speaker_id) VALUES ($1)',
      [req.params.id]
    )
    res.json({ success: true })
  } catch {
    res.json({ success: false })
  }
})

export default router
