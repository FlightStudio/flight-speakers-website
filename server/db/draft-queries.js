import pool from './connection.js'
import { createSpeaker, updateSpeaker, getSpeakerById } from './queries.js'

export async function createDraft({ speakerId, type, data, submittedBy = 'admin' }) {
  const { rows } = await pool.query(
    `INSERT INTO speaker_drafts (speaker_id, type, data, submitted_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [speakerId || null, type, JSON.stringify(data), submittedBy]
  )
  return rows[0]
}

export async function getPendingDrafts(type) {
  const conditions = [`d.status = 'pending'`]
  const params = []
  let idx = 1

  if (type) {
    conditions.push(`d.type = $${idx++}`)
    params.push(type)
  }

  const { rows } = await pool.query(
    `SELECT d.*,
            s.name AS current_name,
            s.photo AS current_photo,
            s.headline AS current_headline
     FROM speaker_drafts d
     LEFT JOIN speakers s ON d.speaker_id = s.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.created_at DESC`,
    params
  )

  return rows.map(r => ({
    ...r,
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
  }))
}

export async function getDraftById(id) {
  const { rows } = await pool.query(
    `SELECT d.*,
            s.name AS current_name,
            s.photo AS current_photo,
            s.headline AS current_headline
     FROM speaker_drafts d
     LEFT JOIN speakers s ON d.speaker_id = s.id
     WHERE d.id = $1`,
    [id]
  )
  if (!rows[0]) return null
  const r = rows[0]
  return { ...r, data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data }
}

export async function approveDraft(id, editedData) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Lock the draft row so concurrent approvals serialise. Re-check status
    // under the lock to avoid double-approval.
    const { rows } = await client.query(
      `SELECT * FROM speaker_drafts WHERE id = $1 FOR UPDATE`,
      [id]
    )
    const draft = rows[0]
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'pending') throw new Error('Draft already reviewed')

    const draftData = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data
    const data = editedData || draftData

    if (editedData) {
      await client.query(
        `UPDATE speaker_drafts SET data = $1 WHERE id = $2`,
        [JSON.stringify(editedData), id]
      )
    }

    let speaker
    if (draft.type === 'new') {
      speaker = await createSpeaker(data, client)
    } else {
      speaker = await updateSpeaker(draft.speaker_id, data, client)
    }

    await client.query(
      `UPDATE speaker_drafts SET status = 'approved', reviewed_at = NOW() WHERE id = $1`,
      [id]
    )

    await client.query('COMMIT')
    return { draft: { ...draft, data, status: 'approved' }, speaker }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function rejectDraft(id) {
  const draft = await getDraftById(id)
  if (!draft) throw new Error('Draft not found')
  if (draft.status !== 'pending') throw new Error('Draft already reviewed')

  await pool.query(
    `UPDATE speaker_drafts SET status = 'rejected', reviewed_at = NOW() WHERE id = $1`,
    [id]
  )

  return { ...draft, status: 'rejected' }
}

export async function getDraftCounts() {
  const { rows } = await pool.query(
    `SELECT type, COUNT(*) AS count
     FROM speaker_drafts
     WHERE status = 'pending'
     GROUP BY type`
  )
  const counts = { new: 0, update: 0 }
  rows.forEach(r => { counts[r.type] = parseInt(r.count, 10) })
  return counts
}
