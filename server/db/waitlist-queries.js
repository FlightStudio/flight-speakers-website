import pool from './connection.js'
import crypto from 'crypto'

function generateId() {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `wait_${timestamp}_${random}`
}

export async function createWaitlistEntry(data) {
  const id = generateId()
  const {
    fullName, email, phone, basedIn, titleCompany,
    speaksAbout, topics, speakingExperience, feeCurrency, feeBracket,
    website, linkedin, showreel, instagram, notableEngagements,
    representationStatus, whyFlightspeakers,
  } = data

  const { rows } = await pool.query(
    `INSERT INTO speaker_waitlist (
      id, full_name, email, phone, based_in, title_company,
      speaks_about, topics, speaking_experience, fee_currency, fee_bracket,
      website, linkedin, showreel, instagram, notable_engagements,
      representation_status, why_flightspeakers
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16,
      $17, $18
    ) RETURNING *`,
    [
      id, fullName, email, phone || null, basedIn, titleCompany,
      speaksAbout, topics, speakingExperience, feeCurrency, feeBracket,
      website || null, linkedin || null, showreel || null, instagram || null, notableEngagements || null,
      representationStatus, whyFlightspeakers || null,
    ]
  )
  return rows[0]
}

export async function getWaitlistEntries({ status, limit = 50, offset = 0 } = {}) {
  const conditions = []
  const params = []

  if (status) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT * FROM speaker_waitlist
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  const countParams = status ? [status] : []
  const countWhere = status ? 'WHERE status = $1' : ''
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM speaker_waitlist ${countWhere}`,
    countParams
  )

  return { entries: rows, total: parseInt(countRows[0].total, 10) }
}

export async function getWaitlistEntryById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM speaker_waitlist WHERE id = $1',
    [id]
  )
  return rows[0] || null
}

export async function updateWaitlistEntry(id, { status, admin_notes }) {
  const sets = []
  const params = [id]

  if (status !== undefined) {
    params.push(status)
    sets.push(`status = $${params.length}`)
  }

  if (admin_notes !== undefined) {
    params.push(admin_notes)
    sets.push(`admin_notes = $${params.length}`)
  }

  if (sets.length === 0) return null

  sets.push('updated_at = NOW()')
  if (status) sets.push('reviewed_at = NOW()')

  const { rows } = await pool.query(
    `UPDATE speaker_waitlist SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )
  return rows[0] || null
}

export async function getWaitlistCounts() {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) AS count FROM speaker_waitlist GROUP BY status`
  )
  const counts = { new: 0, reviewed: 0, invited: 0, declined: 0 }
  for (const row of rows) {
    counts[row.status] = parseInt(row.count, 10)
  }
  return counts
}
