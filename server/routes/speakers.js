import express from 'express'
import { speakers, allTopics, allAudiences } from '../data/speakers.js'

const router = express.Router()

// Get all speakers
router.get('/', (req, res) => {
  const { featured, topic, audience, limit } = req.query

  let filteredSpeakers = [...speakers]

  // Filter by featured
  if (featured === 'true') {
    filteredSpeakers = filteredSpeakers.filter(s => s.featured)
  }

  // Filter by topic
  if (topic) {
    filteredSpeakers = filteredSpeakers.filter(s =>
      s.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
    )
  }

  // Filter by audience
  if (audience) {
    filteredSpeakers = filteredSpeakers.filter(s =>
      (s.audiences || []).some(a => a.toLowerCase().includes(audience.toLowerCase()))
    )
  }

  // Limit results
  if (limit) {
    filteredSpeakers = filteredSpeakers.slice(0, parseInt(limit, 10))
  }

  res.json({
    success: true,
    count: filteredSpeakers.length,
    speakers: filteredSpeakers,
  })
})

// Get speaker by ID
router.get('/:id', (req, res) => {
  const speaker = speakers.find(s => s.id === req.params.id)

  if (!speaker) {
    return res.status(404).json({
      success: false,
      message: 'Speaker not found',
    })
  }

  // Get related speakers (same topics)
  const relatedSpeakers = speakers
    .filter(s => s.id !== speaker.id)
    .filter(s => s.topics.some(t => speaker.topics.includes(t)))
    .slice(0, 4)

  res.json({
    success: true,
    speaker,
    relatedSpeakers,
  })
})

// Get all topics
router.get('/meta/topics', (req, res) => {
  res.json({
    success: true,
    topics: allTopics,
  })
})

// Get all audiences
router.get('/meta/audiences', (req, res) => {
  res.json({
    success: true,
    audiences: allAudiences,
  })
})

export default router
