import express from 'express'
import { semanticSearch } from '../services/claude.js'
import { searchSuggest } from '../db/queries.js'

const router = express.Router()

// Semantic search via Claude 4.5 Sonnet
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 8 } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      })
    }

    const results = await semanticSearch(q, parseInt(limit, 10))

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
