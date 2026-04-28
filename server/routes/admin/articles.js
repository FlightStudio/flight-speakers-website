import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { imageUpload, uploadToGCS, IMAGE_EXT_BY_MIME } from './_uploads.js'
import {
  getArticles,
  getArticleById,
  updateArticle,
  publishArticle,
  rejectArticle,
  getArticleCounts,
} from '../../db/article-queries.js'
import { generateArticle } from '../../services/articleGenerator.js'
import { validate, articlePatchSchema, articleRejectSchema } from '../../schemas/index.js'

const router = express.Router()

// All routes require admin auth
router.use(requireAdmin)

// GET /api/admin/articles — list with optional status filter
router.get('/articles', async (req, res) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query
    const result = await getArticles({
      status: status || undefined,
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      offset: parseInt(offset, 10) || 0,
    })
    const counts = await getArticleCounts()
    res.json({ success: true, ...result, counts })
  } catch (err) {
    console.error('Admin articles list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch articles' })
  }
})

// GET /api/admin/articles/counts — for sidebar badge
router.get('/articles/counts', async (req, res) => {
  try {
    const counts = await getArticleCounts()
    res.json({ success: true, counts })
  } catch (err) {
    console.error('Admin articles counts error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch counts' })
  }
})

// POST /api/admin/articles/generate — manually trigger generation
router.post('/articles/generate', async (req, res) => {
  try {
    const article = await generateArticle()
    res.json({ success: true, article })
  } catch (err) {
    console.error('Admin articles generate error:', err)
    res.status(500).json({ success: false, message: `Generation failed: ${err.message}` })
  }
})

// GET /api/admin/articles/:id — single article
router.get('/articles/:id', async (req, res) => {
  try {
    const article = await getArticleById(req.params.id)
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' })
    res.json({ success: true, article })
  } catch (err) {
    console.error('Admin article detail error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch article' })
  }
})

// PATCH /api/admin/articles/:id — edit fields
router.patch('/articles/:id', async (req, res) => {
  const data = validate(req, res, articlePatchSchema)
  if (!data) return

  try {
    const article = await updateArticle(req.params.id, data)
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' })
    res.json({ success: true, article })
  } catch (err) {
    console.error('Admin article update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update article' })
  }
})

// POST /api/admin/articles/:id/publish
router.post('/articles/:id/publish', async (req, res) => {
  try {
    const article = await publishArticle(req.params.id)
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' })
    res.json({ success: true, article })
  } catch (err) {
    console.error('Admin article publish error:', err)
    res.status(500).json({ success: false, message: 'Failed to publish article' })
  }
})

// POST /api/admin/articles/:id/reject
router.post('/articles/:id/reject', async (req, res) => {
  const data = validate(req, res, articleRejectSchema)
  if (!data) return

  try {
    const article = await rejectArticle(req.params.id, data.notes || null)
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' })
    res.json({ success: true, article })
  } catch (err) {
    console.error('Admin article reject error:', err)
    res.status(500).json({ success: false, message: 'Failed to reject article' })
  }
})

// POST /api/admin/articles/:id/image — upload cover image to GCS
router.post('/articles/:id/image', (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' })
    }

    try {
      const article = await getArticleById(req.params.id)
      if (!article) return res.status(404).json({ success: false, message: 'Article not found' })

      const ext = IMAGE_EXT_BY_MIME[req.file.mimetype] || '.jpg'
      const gcsPath = `articles/${article.slug}${ext}`
      const imageUrl = await uploadToGCS(req.file, gcsPath)

      // Strip image_credit since this is an admin upload, not Unsplash
      const updated = await updateArticle(req.params.id, { image: imageUrl, imageCredit: null })
      res.json({ success: true, image: imageUrl, article: updated })
    } catch (uploadErr) {
      console.error('Admin article image upload error:', uploadErr)
      res.status(500).json({ success: false, message: 'Upload failed' })
    }
  })
})

export default router
