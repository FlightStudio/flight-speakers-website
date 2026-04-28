import pool from './connection.js'
import crypto from 'crypto'

function generateId() {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `art_${timestamp}_${random}`
}

// Map DB snake_case row to camelCase-friendly shape
function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    image: row.image,
    imageCredit: row.image_credit,
    tile: { c1: row.tile_c1 || '#0F172A', c2: row.tile_c2 || '#1E3A5F' },
    body: row.body,
    readTime: row.read_time,
    status: row.status,
    generatedBy: row.generated_by,
    topicAngle: row.topic_angle,
    generatedAt: row.generated_at,
    publishedAt: row.published_at,
    reviewedAt: row.reviewed_at,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createArticle(data) {
  const id = generateId()
  const {
    slug, title, category = 'Rankings', excerpt,
    image = null, imageCredit = null,
    tileC1 = '#0F172A', tileC2 = '#1E3A5F',
    body, readTime = 8,
    status = 'draft', generatedBy = 'auto', topicAngle = null,
  } = data

  const { rows } = await pool.query(
    `INSERT INTO articles (
      id, slug, title, category, excerpt, image, image_credit,
      tile_c1, tile_c2, body, read_time, status, generated_by, topic_angle
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *`,
    [
      id, slug, title, category, excerpt, image, imageCredit,
      tileC1, tileC2, JSON.stringify(body), readTime, status, generatedBy, topicAngle,
    ]
  )
  return mapRow(rows[0])
}

export async function getPublishedArticles({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM articles
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM articles WHERE status = 'published'`
  )
  return {
    articles: rows.map(mapRow),
    total: parseInt(countRows[0].total, 10),
  }
}

export async function getPublishedArticleBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT * FROM articles WHERE slug = $1 AND status = 'published'`,
    [slug]
  )
  return mapRow(rows[0])
}

export async function getArticles({ status, limit = 50, offset = 0 } = {}) {
  const params = []
  let where = ''

  if (status) {
    params.push(status)
    where = `WHERE status = $1`
  }

  params.push(limit, offset)
  const limitParam = params.length - 1
  const offsetParam = params.length

  const { rows } = await pool.query(
    `SELECT * FROM articles
     ${where}
     ORDER BY created_at DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params
  )

  const countParams = status ? [status] : []
  const countWhere = status ? `WHERE status = $1` : ''
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM articles ${countWhere}`,
    countParams
  )

  return {
    articles: rows.map(mapRow),
    total: parseInt(countRows[0].total, 10),
  }
}

export async function getArticleById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM articles WHERE id = $1`,
    [id]
  )
  return mapRow(rows[0])
}

export async function updateArticle(id, data) {
  const ALLOWED_FIELDS = {
    title: 'title',
    excerpt: 'excerpt',
    body: 'body',
    image: 'image',
    imageCredit: 'image_credit',
    tileC1: 'tile_c1',
    tileC2: 'tile_c2',
    readTime: 'read_time',
    category: 'category',
    adminNotes: 'admin_notes',
    slug: 'slug',
  }

  const sets = []
  const params = [id]

  for (const [key, col] of Object.entries(ALLOWED_FIELDS)) {
    if (key in data) {
      const val = key === 'body' ? JSON.stringify(data[key]) : data[key]
      params.push(val)
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getArticleById(id)

  sets.push('updated_at = NOW()')
  const { rows } = await pool.query(
    `UPDATE articles SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )
  return mapRow(rows[0])
}

export async function publishArticle(id) {
  const { rows } = await pool.query(
    `UPDATE articles
     SET status = 'published', published_at = NOW(), reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  )
  return mapRow(rows[0])
}

export async function rejectArticle(id, notes) {
  const { rows } = await pool.query(
    `UPDATE articles
     SET status = 'rejected', reviewed_at = NOW(), admin_notes = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, notes || null]
  )
  return mapRow(rows[0])
}

export async function getRecentTopicAngles({ days = 30 } = {}) {
  const { rows } = await pool.query(
    `SELECT DISTINCT topic_angle FROM articles
     WHERE topic_angle IS NOT NULL
       AND created_at > NOW() - INTERVAL '${days} days'`
  )
  return rows.map(r => r.topic_angle).filter(Boolean)
}

export async function getArticleCounts() {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) AS count FROM articles GROUP BY status`
  )
  const counts = { draft: 0, published: 0, rejected: 0 }
  for (const row of rows) {
    counts[row.status] = parseInt(row.count, 10)
  }
  return counts
}
