import pool from './connection.js'

export async function getAllTemplates() {
  const { rows } = await pool.query(
    'SELECT * FROM response_templates ORDER BY reason_key'
  )
  return rows
}

export async function getTemplateByReasonKey(reasonKey) {
  const { rows } = await pool.query(
    'SELECT * FROM response_templates WHERE reason_key = $1',
    [reasonKey]
  )
  return rows[0] || null
}

export async function updateTemplate(reasonKey, fields) {
  const sets = []
  const values = []
  let idx = 1

  if (fields.label !== undefined) {
    sets.push(`label = $${idx++}`)
    values.push(fields.label)
  }
  if (fields.subject !== undefined) {
    sets.push(`subject = $${idx++}`)
    values.push(fields.subject)
  }
  if (fields.body !== undefined) {
    sets.push(`body = $${idx++}`)
    values.push(fields.body)
  }

  if (sets.length === 0) return null

  sets.push(`updated_at = NOW()`)
  values.push(reasonKey)

  const { rows } = await pool.query(
    `UPDATE response_templates SET ${sets.join(', ')} WHERE reason_key = $${idx} RETURNING *`,
    values
  )
  return rows[0] || null
}
