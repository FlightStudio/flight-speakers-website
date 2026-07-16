import pool from './connection.js'

export async function createEnquiry(data) {
  const id = `enq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { rows } = await pool.query(
    `INSERT INTO enquiries (id, name, email, organization, is_speakers_agency, phone, event_name, event_date, event_location,
       audience_size, budget_range, event_type, brief, speaker_id, speaker_name, newsletter,
       additional_speaker_ids, currency, engagement_type, pro_bono_flexible, recommendations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     RETURNING *`,
    [
      id,
      data.name,
      data.email,
      data.organization,
      data.isSpeakersAgency || false,
      data.phone || null,
      data.eventName || null,
      data.eventDate || null,
      data.eventLocation || null,
      data.audienceSize || null,
      data.budgetRange || null,
      data.eventType || null,
      data.brief,
      data.speakerId || null,
      data.speakerName || null,
      data.newsletter || false,
      data.additionalSpeakerIds || [],
      data.currency || null,
      data.engagementType || null,
      data.proBonoFlexible || false,
      JSON.stringify(data.recommendations || []),
    ]
  )

  return rows[0]
}

// Event start date (before any '|' range separator) falls within the next
// month. CASE guards the ::date cast against malformed event_date strings.
const URGENT_CONDITION = (col = 'e.event_date') => `CASE
  WHEN ${col} ~ '^\\d{4}-\\d{2}-\\d{2}'
  THEN split_part(${col}, '|', 1)::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 month'
  ELSE false END`

export async function getEnquiries({ status, engagementType, rejectionReason, urgent = false, page = 1, limit = 20, sort = 'newest' } = {}) {
  const conditions = []
  const params = []
  let paramIndex = 1

  if (status && status !== 'all') {
    conditions.push(`e.status = $${paramIndex++}`)
    params.push(status)
  }

  if (engagementType && engagementType !== 'all') {
    conditions.push(`e.engagement_type = $${paramIndex++}`)
    params.push(engagementType)
  }

  if (rejectionReason) {
    conditions.push(`e.rejection_reason = $${paramIndex++}`)
    params.push(rejectionReason)
  }

  if (urgent) {
    conditions.push(URGENT_CONDITION())
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sortMap = {
    oldest: 'e.created_at ASC',
    newest: 'e.created_at DESC',
    budget_high: `CASE
      WHEN e.budget_range IS NULL OR e.budget_range = '' THEN NULL
      WHEN e.budget_range ~ '^\\d+$' THEN e.budget_range::numeric
      WHEN e.budget_range ~ '^[£$€]?[\\d,]+\\s*[-–]\\s*[£$€]?[\\d,]+$' THEN
        (regexp_replace(split_part(e.budget_range, '-', 1), '[^0-9.]', '', 'g')::numeric
         + regexp_replace(split_part(e.budget_range, '-', 2), '[^0-9.]', '', 'g')::numeric) / 2
      WHEN e.budget_range ~ '^[£$€]?[\\d,]+$' THEN
        regexp_replace(e.budget_range, '[^0-9.]', '', 'g')::numeric
      ELSE NULL END DESC NULLS LAST`,
    budget_low: `CASE
      WHEN e.budget_range IS NULL OR e.budget_range = '' THEN NULL
      WHEN e.budget_range ~ '^\\d+$' THEN e.budget_range::numeric
      WHEN e.budget_range ~ '^[£$€]?[\\d,]+\\s*[-–]\\s*[£$€]?[\\d,]+$' THEN
        (regexp_replace(split_part(e.budget_range, '-', 1), '[^0-9.]', '', 'g')::numeric
         + regexp_replace(split_part(e.budget_range, '-', 2), '[^0-9.]', '', 'g')::numeric) / 2
      WHEN e.budget_range ~ '^[£$€]?[\\d,]+$' THEN
        regexp_replace(e.budget_range, '[^0-9.]', '', 'g')::numeric
      ELSE NULL END ASC NULLS LAST`,
    event_date_newest: `CASE WHEN e.event_date IS NULL OR e.event_date = '' THEN NULL ELSE split_part(e.event_date, '|', 1)::date END DESC NULLS LAST`,
    event_date_oldest: `CASE WHEN e.event_date IS NULL OR e.event_date = '' THEN NULL ELSE split_part(e.event_date, '|', 1)::date END ASC NULLS LAST`,
  }
  const orderBy = sortMap[sort] || sortMap.newest
  const offset = (page - 1) * limit

  const countResult = await pool.query(
    `SELECT count(*) AS total FROM enquiries e ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].total, 10)

  const { rows } = await pool.query(
    `SELECT e.*, s.photo AS speaker_photo
     FROM enquiries e
     LEFT JOIN speakers s ON e.speaker_id = s.id
     ${where} ORDER BY ${orderBy} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  )

  return { enquiries: rows, total, page, limit }
}

// Remember which Monday item a lead was pushed to, so later pipeline steps
// (deals board, webhooks) can find it again.
export async function setEnquiryMondayItem(id, mondayItemId, mondayBoardId) {
  await pool.query(
    `UPDATE enquiries SET monday_item_id = $2, monday_board_id = $3, updated_at = NOW() WHERE id = $1`,
    [id, mondayItemId, mondayBoardId]
  )
}

export async function getEnquiryById(id) {
  const { rows } = await pool.query('SELECT * FROM enquiries WHERE id = $1', [id])
  return rows[0] || null
}

export async function updateEnquiry(id, updates) {
  const fields = []
  const params = []
  let paramIndex = 1

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    params.push(updates.status)

    if (updates.status === 'reviewed') {
      fields.push(`reviewed_at = NOW()`)
    }
    if (['calendar_meeting', 'negotiation', 'confirmed', 'contract_sent', 'closed_won', 'closed_lost', 'completed_event', 'declined'].includes(updates.status)) {
      fields.push(`responded_at = NOW()`)
    }
  }

  if (updates.admin_notes !== undefined) {
    fields.push(`admin_notes = $${paramIndex++}`)
    params.push(updates.admin_notes)
  }

  if (updates.response_message !== undefined) {
    fields.push(`response_message = $${paramIndex++}`)
    params.push(updates.response_message)
  }

  if (updates.rejection_reason !== undefined) {
    fields.push(`rejection_reason = $${paramIndex++}`)
    params.push(updates.rejection_reason)
  }

  if (fields.length === 0) return getEnquiryById(id)

  fields.push('updated_at = NOW()')
  params.push(id)

  const { rows } = await pool.query(
    `UPDATE enquiries SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )

  return rows[0] || null
}

export async function getEnquiryStats(engagementType) {
  const conditions = []
  const params = []
  let paramIndex = 1

  if (engagementType && engagementType !== 'all') {
    conditions.push(`engagement_type = $${paramIndex++}`)
    params.push(engagementType)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(`
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'new') AS new,
      count(*) FILTER (WHERE status = 'reviewed') AS reviewed,
      count(*) FILTER (WHERE status = 'calendar_meeting') AS calendar_meeting,
      count(*) FILTER (WHERE status = 'negotiation') AS negotiation,
      count(*) FILTER (WHERE status = 'confirmed') AS confirmed,
      count(*) FILTER (WHERE status = 'contract_sent') AS contract_sent,
      count(*) FILTER (WHERE status = 'closed_won') AS closed_won,
      count(*) FILTER (WHERE status = 'closed_lost') AS closed_lost,
      count(*) FILTER (WHERE status = 'completed_event') AS completed_event,
      count(*) FILTER (WHERE status = 'declined') AS declined,
      count(*) FILTER (WHERE ${URGENT_CONDITION('event_date')}) AS urgent,
      count(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS this_week
    FROM enquiries
    ${where}
  `, params)

  const stats = rows[0]
  return {
    total: parseInt(stats.total, 10),
    new: parseInt(stats.new, 10),
    reviewed: parseInt(stats.reviewed, 10),
    calendar_meeting: parseInt(stats.calendar_meeting, 10),
    negotiation: parseInt(stats.negotiation, 10),
    confirmed: parseInt(stats.confirmed, 10),
    contract_sent: parseInt(stats.contract_sent, 10),
    closed_won: parseInt(stats.closed_won, 10),
    closed_lost: parseInt(stats.closed_lost, 10),
    completed_event: parseInt(stats.completed_event, 10),
    declined: parseInt(stats.declined, 10),
    urgent: parseInt(stats.urgent, 10),
    thisWeek: parseInt(stats.this_week, 10),
  }
}

export async function getEnquiryAnalytics(engagementType) {
  const conditions = []
  const params = []
  let paramIndex = 1

  if (engagementType && engagementType !== 'all') {
    conditions.push(`engagement_type = $${paramIndex++}`)
    params.push(engagementType)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(`
    WITH parsed AS (
      SELECT
        id, status, engagement_type, currency, pro_bono_flexible,
        CASE
          WHEN budget_range IS NULL OR budget_range = '' THEN NULL
          WHEN budget_range ~ '^\\d+$' THEN budget_range::numeric
          WHEN budget_range ~ '^[£$€]?[\\d,]+\\s*[-–]\\s*[£$€]?[\\d,]+$' THEN
            (regexp_replace(split_part(budget_range, '-', 1), '[^0-9.]', '', 'g')::numeric
             + regexp_replace(split_part(budget_range, '-', 2), '[^0-9.]', '', 'g')::numeric) / 2
          WHEN budget_range ~ '^[£$€]?[\\d,]+$' THEN
            regexp_replace(budget_range, '[^0-9.]', '', 'g')::numeric
          ELSE NULL
        END AS parsed_budget
      FROM enquiries
      ${where}
    ),
    dominant AS (
      SELECT currency FROM parsed
      WHERE currency IS NOT NULL AND engagement_type = 'Paid'
      GROUP BY currency ORDER BY count(*) DESC LIMIT 1
    )
    SELECT
      -- Revenue by currency (confirmed/closed-won paid)
      json_agg(DISTINCT jsonb_build_object('currency', sub_rev.currency, 'total', sub_rev.total))
        FILTER (WHERE sub_rev.currency IS NOT NULL) AS revenue_by_currency,
      -- Rejected value by currency
      json_agg(DISTINCT jsonb_build_object('currency', sub_rej.currency, 'total', sub_rej.total))
        FILTER (WHERE sub_rej.currency IS NOT NULL) AS rejected_by_currency,
      -- Acceptance rate (confirmed or closed won)
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE status IN ('confirmed', 'contract_sent', 'closed_won', 'completed_event'))::numeric / count(*) * 100, 1)
        ELSE 0 END AS acceptance_rate,
      -- Average budget (paid with budget, scoped to dominant currency to avoid mixing GBP/USD/EUR)
      round(avg(parsed_budget) FILTER (
        WHERE engagement_type = 'Paid'
          AND parsed_budget IS NOT NULL
          AND currency = (SELECT currency FROM dominant)
      )) AS average_budget,
      -- Pro bono counts
      count(*) FILTER (WHERE engagement_type = 'Pro Bono') AS pro_bono_count,
      count(*) FILTER (WHERE engagement_type = 'Pro Bono' AND pro_bono_flexible = true) AS pro_bono_flexible_count,
      -- Paid count
      count(*) FILTER (WHERE engagement_type = 'Paid') AS paid_count,
      -- Dominant currency
      (SELECT currency FROM dominant) AS dominant_currency
    FROM parsed
    LEFT JOIN LATERAL (
      SELECT p2.currency, round(sum(p2.parsed_budget)) AS total
      FROM parsed p2
      WHERE p2.status IN ('confirmed', 'contract_sent', 'closed_won', 'completed_event') AND p2.engagement_type = 'Paid' AND p2.parsed_budget IS NOT NULL AND p2.currency IS NOT NULL
      GROUP BY p2.currency
    ) sub_rev ON true
    LEFT JOIN LATERAL (
      SELECT p3.currency, round(sum(p3.parsed_budget)) AS total
      FROM parsed p3
      WHERE p3.status IN ('declined', 'closed_lost') AND p3.engagement_type = 'Paid' AND p3.parsed_budget IS NOT NULL AND p3.currency IS NOT NULL
      GROUP BY p3.currency
    ) sub_rej ON true
  `, params)

  const row = rows[0]

  // Rejection reason breakdown
  const rejConditions = [...conditions]
  const rejParams = [...params]
  rejConditions.push(`status = 'declined'`)
  rejConditions.push(`rejection_reason IS NOT NULL`)
  const rejWhere = `WHERE ${rejConditions.join(' AND ')}`

  const { rows: rejectionRows } = await pool.query(`
    SELECT rejection_reason, count(*) AS count
    FROM enquiries
    ${rejWhere}
    GROUP BY rejection_reason
    ORDER BY count DESC
  `, rejParams)

  return {
    revenueByCurrency: row.revenue_by_currency || [],
    rejectedByCurrency: row.rejected_by_currency || [],
    acceptanceRate: parseFloat(row.acceptance_rate) || 0,
    averageBudget: row.average_budget ? parseInt(row.average_budget, 10) : 0,
    proBonoCount: parseInt(row.pro_bono_count, 10),
    proBonoFlexibleCount: parseInt(row.pro_bono_flexible_count, 10),
    paidCount: parseInt(row.paid_count, 10),
    dominantCurrency: row.dominant_currency || 'USD',
    rejectionReasons: rejectionRows.map(r => ({
      reason: r.rejection_reason,
      count: parseInt(r.count, 10),
    })),
  }
}
