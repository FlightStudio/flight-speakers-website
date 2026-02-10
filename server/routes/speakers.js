import express from 'express'
import {
  getAllSpeakers,
  getSpeakerById,
  getRelatedSpeakers,
  getAllTopics,
  getAllAudiences,
} from '../db/queries.js'

const router = express.Router()

// Get all speakers (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { featured, topic, audience, limit } = req.query

    const speakers = await getAllSpeakers({
      featured: featured === 'true' ? true : undefined,
      topic: topic || undefined,
      audience: audience || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
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

export default router
