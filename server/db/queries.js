import pool from './connection.js'

const SPEAKER_COLUMNS = `
  id, name, headline, photo, bio, topics, audiences, keynotes,
  speaking_format AS "speakingFormat",
  video_url AS "videoUrl",
  featured
`

export async function getAllSpeakers({ featured, topic, audience, limit } = {}) {
  const conditions = []
  const params = []
  let paramIndex = 1

  if (featured !== undefined) {
    conditions.push(`featured = $${paramIndex++}`)
    params.push(featured)
  }

  if (topic) {
    conditions.push(`$${paramIndex++} = ANY(topics)`)
    params.push(topic)
  }

  if (audience) {
    conditions.push(`$${paramIndex++} = ANY(audiences)`)
    params.push(audience)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limitClause = limit ? `LIMIT $${paramIndex++}` : ''
  if (limit) params.push(limit)

  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS} FROM speakers ${where} ORDER BY featured DESC, name ASC ${limitClause}`,
    params
  )

  return rows
}

export async function getSpeakerById(id) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS} FROM speakers WHERE id = $1`,
    [id]
  )

  return rows[0] || null
}

export async function getRelatedSpeakers(speakerId, topics, limit = 4) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS}
     FROM speakers
     WHERE id != $1
       AND topics && $2::text[]
     ORDER BY array_length(
       ARRAY(SELECT unnest(topics) INTERSECT SELECT unnest($2::text[])),
       1
     ) DESC NULLS LAST
     LIMIT $3`,
    [speakerId, topics, limit]
  )

  return rows
}

export async function getSpeakerProfilesForSearch() {
  const { rows } = await pool.query(
    `SELECT id, name, headline, bio, topics, audiences, keynotes
     FROM speakers
     ORDER BY featured DESC, name ASC`
  )

  return rows
}

export async function fullTextSearch(query, limit = 8) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS},
            ts_rank(
              to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, '')),
              plainto_tsquery('english', $1)
            ) AS rank
     FROM speakers
     WHERE to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, ''))
           @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [query, limit]
  )

  return rows
}

export async function getAllTopics() {
  const { rows } = await pool.query(
    `SELECT DISTINCT unnest(topics) AS topic FROM speakers ORDER BY topic`
  )

  return rows.map(r => r.topic)
}

export async function getAllAudiences() {
  const { rows } = await pool.query(
    `SELECT DISTINCT unnest(audiences) AS audience FROM speakers ORDER BY audience`
  )

  return rows.map(r => r.audience)
}

export async function vectorSearch(queryEmbedding, limit = 12) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS},
            (embedding <=> $1::vector) AS distance
     FROM speakers
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), limit]
  )

  return rows
}

export async function updateSpeakerEmbedding(id, embedding) {
  await pool.query(
    `UPDATE speakers SET embedding = $1::vector WHERE id = $2`,
    [JSON.stringify(embedding), id]
  )
}

export async function getEmbeddingCount() {
  const { rows } = await pool.query(
    `SELECT count(*) AS count FROM speakers WHERE embedding IS NOT NULL`
  )

  return parseInt(rows[0].count, 10)
}

export async function searchSuggest(term, limit = 10) {
  const pattern = `%${term}%`

  const { rows } = await pool.query(
    `SELECT DISTINCT suggestion FROM (
       SELECT unnest(topics) AS suggestion FROM speakers
       UNION
       SELECT name AS suggestion FROM speakers
     ) suggestions
     WHERE suggestion ILIKE $1
     ORDER BY suggestion
     LIMIT $2`,
    [pattern, limit]
  )

  return rows.map(r => r.suggestion)
}
