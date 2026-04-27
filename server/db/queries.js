import pool from './connection.js'

const SPEAKER_COLUMNS = `
  id, name, headline, photo, bio, topics, audiences, keynotes,
  speaking_format AS "speakingFormat",
  video_url AS "videoUrl",
  social_stats AS "socialStats",
  social_profiles AS "socialProfiles",
  fee_min AS "feeMin",
  gender, ethnicity, nationality, location
`

export async function getAllSpeakers({ topic, audience, limit } = {}) {
  const conditions = []
  const params = []
  let paramIndex = 1

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
    `SELECT ${SPEAKER_COLUMNS} FROM speakers ${where} ORDER BY name ASC ${limitClause}`,
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
    `SELECT id, name, headline, bio, topics, audiences, keynotes,
            fee_min AS "feeMin",
            gender, ethnicity, nationality, location
     FROM speakers
     ORDER BY name ASC`
  )

  return rows
}

export async function updateSpeakerFees(id, feeMin) {
  const { rows } = await pool.query(
    `UPDATE speakers SET fee_min = $1, updated_at = NOW() WHERE id = $2 RETURNING id, fee_min AS "feeMin"`,
    [feeMin, id]
  )
  return rows[0] || null
}

export async function createSpeaker(data, executor = pool) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const id = `${slug}-${Date.now().toString(36)}`

  const { rows } = await executor.query(
    `INSERT INTO speakers (id, name, headline, photo, bio, topics, audiences, keynotes,
       speaking_format, video_url, social_profiles, fee_min,
       gender, ethnicity, nationality, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING ${SPEAKER_COLUMNS}`,
    [
      id,
      data.name,
      data.headline,
      data.photo,
      data.bio,
      data.topics || [],
      data.audiences || [],
      data.keynotes || [],
      data.speakingFormat || null,
      data.videoUrl || null,
      JSON.stringify(data.socialProfiles || {}),
      data.feeMin != null ? data.feeMin : null,
      data.gender || null,
      data.ethnicity || null,
      data.nationality || null,
      data.location || null,
    ]
  )

  return rows[0]
}

export async function updateSpeaker(id, data, executor = pool) {
  const fields = []
  const params = []
  let paramIndex = 1

  const fieldMap = {
    name: 'name',
    headline: 'headline',
    photo: 'photo',
    bio: 'bio',
    topics: 'topics',
    audiences: 'audiences',
    keynotes: 'keynotes',
    speakingFormat: 'speaking_format',
    videoUrl: 'video_url',
    feeMin: 'fee_min',
    gender: 'gender',
    ethnicity: 'ethnicity',
    nationality: 'nationality',
    location: 'location',
  }

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      fields.push(`${dbCol} = $${paramIndex++}`)
      params.push(data[jsKey])
    }
  }

  if (data.socialProfiles !== undefined) {
    fields.push(`social_profiles = $${paramIndex++}`)
    params.push(JSON.stringify(data.socialProfiles))
  }

  if (fields.length === 0) return getSpeakerById(id)

  fields.push('updated_at = NOW()')
  params.push(id)

  const { rows } = await executor.query(
    `UPDATE speakers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${SPEAKER_COLUMNS}`,
    params
  )

  return rows[0] || null
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
