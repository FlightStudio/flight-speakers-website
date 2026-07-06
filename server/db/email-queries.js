import pool from './connection.js'

export async function logSentEmail({ enquiryId, templateKey, recipient, resendId }) {
  const { rows } = await pool.query(
    `INSERT INTO sent_emails (enquiry_id, template_key, recipient, resend_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [enquiryId || null, templateKey, recipient, resendId || null]
  )
  return rows[0]
}

export async function getSentEmailsByEnquiryId(enquiryId) {
  const { rows } = await pool.query(
    `SELECT * FROM sent_emails WHERE enquiry_id = $1 ORDER BY sent_at DESC`,
    [enquiryId]
  )
  return rows
}
