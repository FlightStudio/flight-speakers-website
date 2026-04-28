import express from 'express'
import { getPublishedArticles, getPublishedArticleBySlug } from '../db/article-queries.js'

const router = express.Router()

// GET /api/articles — published articles, newest first
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const offset = parseInt(req.query.offset, 10) || 0
    const { articles, total } = await getPublishedArticles({ limit, offset })
    res.json({ success: true, articles, total })
  } catch (err) {
    next(err)
  }
})

// GET /api/articles/:slug — single published article
router.get('/:slug', async (req, res, next) => {
  try {
    const article = await getPublishedArticleBySlug(req.params.slug)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }
    res.json({ success: true, article })
  } catch (err) {
    next(err)
  }
})

export default router
