import pool from './connection.js'

export async function createEnquiry(data) {
  const id = `enq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { rows } = await pool.query(
    `INSERT INTO enquiries (id, name, email, organization, phone, event_date, event_location,
       audience_size, budget_range, event_type, brief, speaker_id, speaker_name, newsletter,
       additional_speaker_ids, currency, engagement_type, has_budget, recommendations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING *`,
    [
      id,
      data.name,
      data.email,
      data.organization,
      data.phone || null,
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
      data.hasBudget || null,
      JSON.stringify(data.recommendations || []),
    ]
  )

  return rows[0]
}

export async function getEnquiries({ status, page = 1, limit = 20, sort = 'newest' } = {}) {
  const conditions = []
  const params = []
  let paramIndex = 1

  if (status && status !== 'all') {
    conditions.push(`e.status = $${paramIndex++}`)
    params.push(status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderBy = sort === 'oldest' ? 'created_at ASC' : 'created_at DESC'
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
     ${where} ORDER BY e.${orderBy} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  )

  return { enquiries: rows, total, page, limit }
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
    if (['accepted', 'rejected', 'responded'].includes(updates.status)) {
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

  if (fields.length === 0) return getEnquiryById(id)

  fields.push('updated_at = NOW()')
  params.push(id)

  const { rows } = await pool.query(
    `UPDATE enquiries SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )

  return rows[0] || null
}

export async function getEnquiryStats() {
  const { rows } = await pool.query(`
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'new') AS new,
      count(*) FILTER (WHERE status = 'reviewed') AS reviewed,
      count(*) FILTER (WHERE status = 'accepted') AS accepted,
      count(*) FILTER (WHERE status = 'rejected') AS rejected,
      count(*) FILTER (WHERE status = 'responded') AS responded,
      count(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS this_week
    FROM enquiries
  `)

  const stats = rows[0]
  return {
    total: parseInt(stats.total, 10),
    new: parseInt(stats.new, 10),
    reviewed: parseInt(stats.reviewed, 10),
    accepted: parseInt(stats.accepted, 10),
    rejected: parseInt(stats.rejected, 10),
    responded: parseInt(stats.responded, 10),
    thisWeek: parseInt(stats.this_week, 10),
  }
}

export async function getSpeakerAnalytics(period = 'all') {
  const timeFilters = {
    day: "AND created_at > NOW() - INTERVAL '24 hours'",
    week: "AND created_at > NOW() - INTERVAL '7 days'",
    all: '',
  }
  const viewTimeFilters = {
    day: "AND viewed_at > NOW() - INTERVAL '24 hours'",
    week: "AND viewed_at > NOW() - INTERVAL '7 days'",
    all: '',
  }
  const recTimeFilters = {
    day: "AND recommended_at > NOW() - INTERVAL '24 hours'",
    week: "AND recommended_at > NOW() - INTERVAL '7 days'",
    all: '',
  }

  const tf = timeFilters[period] || ''
  const vtf = viewTimeFilters[period] || ''
  const rtf = recTimeFilters[period] || ''

  const { rows } = await pool.query(`
    SELECT s.id, s.name, s.photo, s.headline, s.featured,
      s.fee_min,
      COALESCE(v.view_count, 0) AS views,
      COALESCE(e.enquiry_count, 0) AS enquiries,
      COALESCE(r.rec_count, 0) AS recommendations,
      COALESCE(a.added_count, 0) AS added_as_extra,
      CASE WHEN COALESCE(v.view_count, 0) > 0
        THEN ROUND(COALESCE(e.enquiry_count, 0)::numeric / v.view_count * 100, 1)
        ELSE 0 END AS conversion_rate,
      ai.avg_score AS avg_ai_score,
      COALESCE(b.budget_count, 0) AS budget_enquiries,
      b.budget_list AS budget_ranges
    FROM speakers s
    LEFT JOIN (
      SELECT speaker_id, COUNT(*) AS view_count FROM speaker_views WHERE 1=1 ${vtf} GROUP BY speaker_id
    ) v ON v.speaker_id = s.id
    LEFT JOIN (
      SELECT speaker_id, COUNT(*) AS enquiry_count FROM enquiries WHERE speaker_id IS NOT NULL ${tf} GROUP BY speaker_id
    ) e ON e.speaker_id = s.id
    LEFT JOIN (
      SELECT speaker_id, COUNT(*) AS rec_count FROM speaker_recommendations WHERE 1=1 ${rtf} GROUP BY speaker_id
    ) r ON r.speaker_id = s.id
    LEFT JOIN (
      SELECT aid AS speaker_id, COUNT(*) AS added_count
      FROM enquiries, unnest(additional_speaker_ids) AS aid
      WHERE 1=1 ${tf}
      GROUP BY aid
    ) a ON a.speaker_id = s.id
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG((rec->>'score')::numeric)) AS avg_score
      FROM enquiries eq, jsonb_array_elements(eq.recommendations) AS rec
      WHERE rec->>'speakerId' = s.id AND (rec->>'score') IS NOT NULL
    ) ai ON true
    LEFT JOIN (
      SELECT speaker_id,
        COUNT(*) FILTER (WHERE budget_range IS NOT NULL AND budget_range != '') AS budget_count,
        string_agg(DISTINCT budget_range, ', ') AS budget_list
      FROM enquiries WHERE speaker_id IS NOT NULL ${tf}
      GROUP BY speaker_id
    ) b ON b.speaker_id = s.id
    ORDER BY enquiries DESC, views DESC
  `)

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    photo: r.photo,
    headline: r.headline,
    featured: r.featured,
    feeMin: r.fee_min != null ? parseInt(r.fee_min, 10) : null,
    views: parseInt(r.views, 10),
    enquiries: parseInt(r.enquiries, 10),
    recommendations: parseInt(r.recommendations, 10),
    addedAsExtra: parseInt(r.added_as_extra, 10),
    conversionRate: parseFloat(r.conversion_rate),
    avgAiScore: r.avg_ai_score != null ? parseInt(r.avg_ai_score, 10) : null,
    budgetEnquiries: parseInt(r.budget_enquiries, 10),
    budgetRanges: r.budget_ranges || null,
  }))
}

export async function getSpeakerDetailAnalytics(speakerId) {
  // Get enquiries where this speaker was requested
  const { rows: requestedEnquiries } = await pool.query(
    `SELECT id, name, organization, event_date, status, created_at, budget_range, recommendations
     FROM enquiries
     WHERE speaker_id = $1
     ORDER BY created_at DESC`,
    [speakerId]
  )

  // Get enquiries where this speaker was added as extra
  const { rows: addedAsExtraEnquiries } = await pool.query(
    `SELECT id, name, organization, event_date, status, created_at, budget_range, recommendations
     FROM enquiries
     WHERE $1 = ANY(additional_speaker_ids)
     ORDER BY created_at DESC`,
    [speakerId]
  )

  // Get view count
  const { rows: viewRows } = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days') AS this_week,
            COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '24 hours') AS today
     FROM speaker_views WHERE speaker_id = $1`,
    [speakerId]
  )

  // Get recommendation count
  const { rows: recRows } = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE recommended_at > NOW() - INTERVAL '7 days') AS this_week,
            COUNT(*) FILTER (WHERE recommended_at > NOW() - INTERVAL '24 hours') AS today
     FROM speaker_recommendations WHERE speaker_id = $1`,
    [speakerId]
  )

  // Extract AI scores from all enquiries that have recommendations for this speaker
  const { rows: scoreRows } = await pool.query(
    `SELECT id, name, created_at, recommendations
     FROM enquiries
     WHERE recommendations::text LIKE $1
     ORDER BY created_at DESC`,
    [`%${speakerId}%`]
  )

  const aiScores = []
  for (const row of scoreRows) {
    const recs = row.recommendations || []
    const match = recs.find(r => r.speakerId === speakerId)
    if (match && match.score != null) {
      aiScores.push({
        enquiryId: row.id,
        enquiryName: row.name,
        date: row.created_at,
        score: match.score,
        reasoning: match.reasoning,
        selected: match.selected,
      })
    }
  }

  const views = viewRows[0]
  const recs = recRows[0]

  return {
    requestedEnquiries,
    addedAsExtraEnquiries,
    views: {
      total: parseInt(views.total, 10),
      thisWeek: parseInt(views.this_week, 10),
      today: parseInt(views.today, 10),
    },
    recommendations: {
      total: parseInt(recs.total, 10),
      thisWeek: parseInt(recs.this_week, 10),
      today: parseInt(recs.today, 10),
    },
    aiScores,
    avgAiScore: aiScores.length > 0
      ? Math.round(aiScores.reduce((sum, s) => sum + s.score, 0) / aiScores.length)
      : null,
  }
}

export async function deleteSpeaker(speakerId) {
  const { rowCount } = await pool.query(
    `DELETE FROM speakers WHERE id = $1`,
    [speakerId]
  )
  return rowCount > 0
}

export async function getDashboardAnalytics(days = 14) {
  const intervalDays = Math.max(7, Math.min(days, 90))
  // Enquiries by day
  const { rows: byDay } = await pool.query(`
    SELECT d::date AS date, COALESCE(c.count, 0) AS count
    FROM generate_series(
      (NOW() - INTERVAL '1 day' * ($1 - 1))::date,
      NOW()::date,
      '1 day'
    ) AS d
    LEFT JOIN (
      SELECT created_at::date AS day, COUNT(*) AS count
      FROM enquiries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY day
    ) c ON c.day = d::date
    ORDER BY d
  `, [intervalDays])

  // Top 5 speakers by enquiry count
  const { rows: topSpeakers } = await pool.query(`
    SELECT s.id, s.name, s.photo, s.headline, s.featured,
      COUNT(e.id) AS enquiries,
      COALESCE(v.views, 0) AS views
    FROM speakers s
    LEFT JOIN enquiries e ON e.speaker_id = s.id
    LEFT JOIN (
      SELECT speaker_id, COUNT(*) AS views FROM speaker_views GROUP BY speaker_id
    ) v ON v.speaker_id = s.id
    GROUP BY s.id, s.name, s.photo, s.headline, s.featured, v.views
    ORDER BY enquiries DESC, views DESC
    LIMIT 5
  `)

  // Popular topics across enquiries (from requested speakers)
  const { rows: topicRows } = await pool.query(`
    SELECT t AS topic, COUNT(*) AS count
    FROM speakers s
    JOIN enquiries e ON e.speaker_id = s.id
    CROSS JOIN unnest(s.topics) AS t
    GROUP BY t
    ORDER BY count DESC
    LIMIT 8
  `)

  // Response metrics
  const { rows: [metrics] } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected', 'responded')) AS responded_count,
      COUNT(*) AS total_count,
      AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600)
        FILTER (WHERE responded_at IS NOT NULL) AS avg_response_hours,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS this_week,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '14 days'
                   AND created_at <= NOW() - INTERVAL '7 days') AS last_week
    FROM enquiries
  `)

  // Popular event types
  const { rows: eventTypes } = await pool.query(`
    SELECT event_type, COUNT(*) AS count
    FROM enquiries
    WHERE event_type IS NOT NULL AND event_type != ''
    GROUP BY event_type
    ORDER BY count DESC
    LIMIT 5
  `)

  // Recent activity (last 8 enquiries with status changes)
  const { rows: recentActivity } = await pool.query(`
    SELECT id, name, organization, status, speaker_name,
      created_at, reviewed_at, responded_at
    FROM enquiries
    ORDER BY GREATEST(
      created_at,
      COALESCE(reviewed_at, '1970-01-01'),
      COALESCE(responded_at, '1970-01-01')
    ) DESC
    LIMIT 8
  `)

  const total = parseInt(metrics.total_count, 10)
  const responded = parseInt(metrics.responded_count, 10)

  return {
    enquiriesByDay: byDay.map(r => ({
      date: r.date,
      count: parseInt(r.count, 10),
    })),
    topSpeakers: topSpeakers.map(r => ({
      id: r.id,
      name: r.name,
      photo: r.photo,
      headline: r.headline,
      featured: r.featured,
      enquiries: parseInt(r.enquiries, 10),
      views: parseInt(r.views, 10),
    })),
    popularTopics: topicRows.map(r => ({
      topic: r.topic,
      count: parseInt(r.count, 10),
    })),
    eventTypes: eventTypes.map(r => ({
      type: r.event_type,
      count: parseInt(r.count, 10),
    })),
    responseMetrics: {
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      avgResponseHours: metrics.avg_response_hours
        ? Math.round(parseFloat(metrics.avg_response_hours))
        : null,
      thisWeek: parseInt(metrics.this_week, 10),
      lastWeek: parseInt(metrics.last_week, 10),
    },
    recentActivity: recentActivity.map(r => ({
      id: r.id,
      name: r.name,
      organization: r.organization,
      status: r.status,
      speakerName: r.speaker_name,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      respondedAt: r.responded_at,
    })),
  }
}

export async function getAdminUser(username) {
  const { rows } = await pool.query(
    'SELECT * FROM admin_users WHERE username = $1',
    [username]
  )
  return rows[0] || null
}
