import crypto from 'crypto'
import pool from './connection.js'

export async function createToken({ speakerId, type, expiresInDays = 7 }) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const { rows } = await pool.query(
    `INSERT INTO speaker_tokens (speaker_id, token, type, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [speakerId || null, token, type, expiresAt]
  )
  return rows[0]
}

export async function validateToken(token) {
  const { rows } = await pool.query(
    `SELECT t.*, s.name AS speaker_name, s.headline AS speaker_headline,
            s.photo AS speaker_photo, s.bio AS speaker_bio,
            s.topics AS speaker_topics, s.audiences AS speaker_audiences,
            s.keynotes AS speaker_keynotes,
            s.speaking_format AS "speaker_speakingFormat",
            s.video_url AS "speaker_videoUrl",
            s.featured AS speaker_featured,
            s.fee_min AS "speaker_feeMin",
            s.gender AS speaker_gender,
            s.ethnicity AS speaker_ethnicity,
            s.nationality AS speaker_nationality,
            s.location AS speaker_location,
            s.social_profiles AS "speaker_socialProfiles"
     FROM speaker_tokens t
     LEFT JOIN speakers s ON t.speaker_id = s.id
     WHERE t.token = $1`,
    [token]
  )

  if (!rows[0]) return { valid: false, error: 'Invalid or expired link' }

  const row = rows[0]

  if (row.used_at || new Date(row.expires_at) < new Date()) {
    return { valid: false, error: 'Invalid or expired link' }
  }

  // Build speaker data for pre-fill if update type
  let speaker = null
  if (row.type === 'update' && row.speaker_id) {
    speaker = {
      id: row.speaker_id,
      name: row.speaker_name,
      headline: row.speaker_headline,
      photo: row.speaker_photo,
      bio: row.speaker_bio,
      topics: row.speaker_topics,
      audiences: row.speaker_audiences,
      keynotes: row.speaker_keynotes,
      speakingFormat: row.speaker_speakingFormat,
      videoUrl: row.speaker_videoUrl,
      featured: row.speaker_featured,
      feeMin: row.speaker_feeMin,
      gender: row.speaker_gender,
      ethnicity: row.speaker_ethnicity,
      nationality: row.speaker_nationality,
      location: row.speaker_location,
      socialProfiles: row.speaker_socialProfiles,
    }
  }

  return {
    valid: true,
    token: row,
    speaker,
  }
}

export async function markTokenUsed(token) {
  await pool.query(
    `UPDATE speaker_tokens SET used_at = NOW() WHERE token = $1`,
    [token]
  )
}
