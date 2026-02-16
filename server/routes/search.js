import express from 'express'
import { semanticSearch } from '../services/claude.js'
import { searchSuggest } from '../db/queries.js'
import pool from '../db/connection.js'

const router = express.Router()

// Semantic search via Claude
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 8, budget } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      })
    }

    if (q.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Search query exceeds maximum length',
      })
    }

    const parsedBudget = budget ? parseInt(budget, 10) : undefined
    if (parsedBudget !== undefined && (isNaN(parsedBudget) || parsedBudget < 0 || parsedBudget > 100000000)) {
      return res.status(400).json({ success: false, message: 'Invalid budget value' })
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 50)

    const results = await semanticSearch(q, parsedLimit, parsedBudget)

    console.log('SEARCH:', {
      query: q,
      resultsCount: results.speakers.length,
      timestamp: new Date().toISOString(),
    })

    // Fire-and-forget: track recommendations
    if (results.speakers.length > 0) {
      const values = results.speakers.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')
      const params = results.speakers.flatMap(s => [s.id, q])
      pool.query(`INSERT INTO speaker_recommendations (speaker_id, query) VALUES ${values}`, params)
        .catch(err => console.error('Failed to track recommendations:', err.message))
    }

    res.json({
      success: true,
      query: q,
      count: results.speakers.length,
      speakers: results.speakers,
      reasonings: results.reasonings,
      scores: results.scores || {},
    })
  } catch (err) {
    next(err)
  }
})

// Search suggestions based on partial query
router.get('/suggest', async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      })
    }

    const suggestions = await searchSuggest(q)

    res.json({
      success: true,
      suggestions: suggestions.map(s => ({ type: 'suggestion', value: s })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
