import pool from './connection.js'

// Returns blocked dates as 'YYYY-MM-DD' strings, sorted ascending.
// Inclusive on both ends. Caller validates the range size.
export async function getBlockedDates(speakerId, from, to) {
  const { rows } = await pool.query(
    `SELECT to_char(blocked_date, 'YYYY-MM-DD') AS date
     FROM speaker_blocked_dates
     WHERE speaker_id = $1
       AND blocked_date >= $2::date
       AND blocked_date <= $3::date
     ORDER BY blocked_date ASC`,
    [speakerId, from, to]
  )
  return rows.map(r => r.date)
}

// Replaces the speaker's future blocked dates atomically. Past dates are
// untouched — we don't want a stale UI to wipe historic records.
export async function replaceFutureBlockedDates(speakerId, dates) {
  const today = new Date().toISOString().slice(0, 10)
  const futureOnly = (dates || []).filter(d => d >= today)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `DELETE FROM speaker_blocked_dates
       WHERE speaker_id = $1 AND blocked_date >= CURRENT_DATE`,
      [speakerId]
    )
    if (futureOnly.length) {
      await client.query(
        `INSERT INTO speaker_blocked_dates (speaker_id, blocked_date)
         SELECT $1, unnest($2::date[])
         ON CONFLICT DO NOTHING`,
        [speakerId, futureOnly]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
