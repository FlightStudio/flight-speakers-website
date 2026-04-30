import crypto from 'crypto'
import pool from './connection.js'

export async function createToken({ speakerId, type, expiresInDays = 7, expiresAt = null, prefillData = null }) {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const { rows } = await pool.query(
    `INSERT INTO speaker_tokens (speaker_id, token, type, expires_at, prefill_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [speakerId || null, token, type, expires, prefillData ? JSON.stringify(prefillData) : null]
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

  const isExpired = new Date(row.expires_at) < new Date()
  const isRevoked = row.revoked_at !== null && row.revoked_at !== undefined
  if (isExpired || isRevoked) {
    return { valid: false, error: 'Invalid or expired link' }
  }
  // 'availability' tokens are multi-use; only 'new' / 'update' are consumed.
  if (row.type !== 'availability' && row.used_at) {
    return { valid: false, error: 'Invalid or expired link' }
  }

  // Build speaker data for pre-fill
  let speaker = null
  if ((row.type === 'update' || row.type === 'availability') && row.speaker_id) {
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
      feeMin: row.speaker_feeMin,
      gender: row.speaker_gender,
      ethnicity: row.speaker_ethnicity,
      nationality: row.speaker_nationality,
      location: row.speaker_location,
      socialProfiles: row.speaker_socialProfiles,
    }
  } else if (row.type === 'new' && row.prefill_data) {
    // Waitlist-invite tokens carry pre-mapped applicant data
    speaker = typeof row.prefill_data === 'string'
      ? JSON.parse(row.prefill_data)
      : row.prefill_data
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

// Atomic validate + consume. Locks the token row (FOR UPDATE), checks
// validity, marks used, and returns the speaker prefill data — all inside a
// single transaction. Eliminates the race where two concurrent submissions
// from the same token both pass validation before either marks-used.
//
// Returns { valid: true, token, speaker } on success or
//         { valid: false, error } on failure.
// Caller is responsible for the actual draft creation (which can run after
// the transaction since the token is already consumed).
export async function validateAndConsumeToken(token) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT t.*, s.name AS speaker_name, s.headline AS speaker_headline,
              s.photo AS speaker_photo, s.bio AS speaker_bio,
              s.topics AS speaker_topics, s.audiences AS speaker_audiences,
              s.keynotes AS speaker_keynotes,
              s.speaking_format AS "speaker_speakingFormat",
              s.video_url AS "speaker_videoUrl",
              s.fee_min AS "speaker_feeMin",
              s.gender AS speaker_gender,
              s.ethnicity AS speaker_ethnicity,
              s.nationality AS speaker_nationality,
              s.location AS speaker_location,
              s.social_profiles AS "speaker_socialProfiles"
       FROM speaker_tokens t
       LEFT JOIN speakers s ON t.speaker_id = s.id
       WHERE t.token = $1
       FOR UPDATE OF t`,
      [token]
    )

    const row = rows[0]
    if (!row) {
      await client.query('ROLLBACK')
      return { valid: false, error: 'Invalid or expired link' }
    }
    // validateAndConsumeToken is for single-use tokens only. Availability
    // tokens must never go through this path — they'd be marked used_at and
    // permanently broken.
    if (row.type === 'availability') {
      await client.query('ROLLBACK')
      return { valid: false, error: 'Wrong token type' }
    }
    const isExpired = new Date(row.expires_at) < new Date()
    const isRevoked = row.revoked_at !== null && row.revoked_at !== undefined
    if (isExpired || isRevoked || row.used_at) {
      await client.query('ROLLBACK')
      return { valid: false, error: 'Invalid or expired link' }
    }

    await client.query(
      `UPDATE speaker_tokens SET used_at = NOW() WHERE token = $1`,
      [token]
    )
    await client.query('COMMIT')

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
        feeMin: row.speaker_feeMin,
        gender: row.speaker_gender,
        ethnicity: row.speaker_ethnicity,
        nationality: row.speaker_nationality,
        location: row.speaker_location,
        socialProfiles: row.speaker_socialProfiles,
      }
    } else if (row.type === 'new' && row.prefill_data) {
      // Waitlist-invite tokens carry pre-mapped applicant data
      speaker = typeof row.prefill_data === 'string'
        ? JSON.parse(row.prefill_data)
        : row.prefill_data
    }
    return { valid: true, token: row, speaker }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getActiveAvailabilityToken(speakerId) {
  const { rows } = await pool.query(
    `SELECT * FROM speaker_tokens
     WHERE speaker_id = $1
       AND type = 'availability'
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [speakerId]
  )
  return rows[0] || null
}

export async function revokeToken(token) {
  await pool.query(
    `UPDATE speaker_tokens SET revoked_at = NOW()
     WHERE token = $1 AND revoked_at IS NULL`,
    [token]
  )
}
