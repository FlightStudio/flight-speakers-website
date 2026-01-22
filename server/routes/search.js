import express from 'express'
import { speakers } from '../data/speakers.js'
import { matchSpeakers } from '../utils/aiMatching.js'

const router = express.Router()

// Search/match speakers
router.get('/', (req, res) => {
  const { q, limit = 8 } = req.query

  if (!q || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    })
  }

  const results = matchSpeakers(q, speakers, parseInt(limit, 10))

  // Log search for analytics (would go to analytics service in production)
  console.log('SEARCH:', {
    query: q,
    resultsCount: results.speakers.length,
    timestamp: new Date().toISOString(),
  })

  res.json({
    success: true,
    query: q,
    count: results.speakers.length,
    speakers: results.speakers,
    reasonings: results.reasonings,
  })
})

// Get search suggestions based on partial query
router.get('/suggest', (req, res) => {
  const { q } = req.query

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      suggestions: [],
    })
  }

  const queryLower = q.toLowerCase()

  // Collect matching topics
  const matchingTopics = []
  speakers.forEach(speaker => {
    speaker.topics.forEach(topic => {
      if (topic.toLowerCase().includes(queryLower) && !matchingTopics.includes(topic)) {
        matchingTopics.push(topic)
      }
    })
  })

  // Collect matching speaker names
  const matchingSpeakers = speakers
    .filter(s => s.name.toLowerCase().includes(queryLower))
    .map(s => ({ type: 'speaker', value: s.name, id: s.id }))
    .slice(0, 3)

  const suggestions = [
    ...matchingTopics.slice(0, 5).map(t => ({ type: 'topic', value: t })),
    ...matchingSpeakers,
  ]

  res.json({
    success: true,
    suggestions,
  })
})

export default router
