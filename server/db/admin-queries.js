// Admin-only queries — operations not surfaced on the public side.
import pool from './connection.js'

export async function getAdminUser(username) {
  const { rows } = await pool.query(
    'SELECT * FROM admin_users WHERE username = $1',
    [username]
  )
  return rows[0] || null
}

export async function deleteSpeaker(speakerId) {
  const { rowCount } = await pool.query(
    `DELETE FROM speakers WHERE id = $1`,
    [speakerId]
  )
  return rowCount > 0
}
