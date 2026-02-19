import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'day', label: 'Today' },
]

const SORT_OPTIONS = [
  { key: 'enquiries', label: 'Top Chosen' },
  { key: 'recommendations', label: 'Top Recommended' },
  { key: 'views', label: 'Most Viewed' },
  { key: 'addedAsExtra', label: 'Most Added' },
  { key: 'avgAiScore', label: 'Highest AI Score' },
]

export default function SpeakerAnalyticsTable() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [sortBy, setSortBy] = useState('enquiries')
  const [fees, setFees] = useState({})

  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback((p) => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/speakers/analytics?period=${p}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Not authenticated' : 'Failed to load')
        return res.json()
      })
      .then(data => {
        if (data.success) {
          setAnalytics(data.analytics)
          const initialFees = {}
          data.analytics.forEach(s => {
            initialFees[s.id] = { feeMin: s.feeMin ?? '' }
          })
          setFees(initialFees)
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchAnalytics(period)
  }, [period, fetchAnalytics])

  function handleFeeChange(speakerId, value) {
    setFees(prev => ({
      ...prev,
      [speakerId]: { feeMin: value },
    }))
  }

  async function handleFeeBlur(speakerId) {
    const current = fees[speakerId]
    if (!current) return

    try {
      const res = await fetch(`/api/admin/speakers/${speakerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feeMin: current.feeMin === '' ? null : parseInt(current.feeMin, 10),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAnalytics(prev => prev.map(s =>
          s.id === speakerId ? { ...s, feeMin: data.speaker.feeMin } : s
        ))
      }
    } catch {
      // silently fail, local state remains
    }
  }

  const sorted = useMemo(() => {
    return [...analytics].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
  }, [analytics, sortBy])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        Loading speaker analytics...
      </div>
    )
  }

  if (analytics.length === 0) {
    return (
      <div className="speaker-analytics">
        <div className="speaker-analytics__header">
          <div>
            <h2 className="speaker-analytics__title">Speaker Performance</h2>
            <p className="speaker-analytics__subtitle">
              {error ? `Error: ${error}` : 'No analytics data available yet'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="speaker-analytics">
      <div className="speaker-analytics__header">
        <div>
          <h2 className="speaker-analytics__title">Speaker Performance</h2>
          <p className="speaker-analytics__subtitle">Views, enquiries, and conversion by speaker</p>
        </div>
        <div className="speaker-analytics__filters">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`enquiry-filter-pill ${period === p.key ? 'enquiry-filter-pill--active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="speaker-analytics__sort">
        <span className="speaker-analytics__sort-label">Sort by</span>
        {SORT_OPTIONS.map(s => (
          <button
            key={s.key}
            className={`speaker-analytics__sort-pill ${sortBy === s.key ? 'speaker-analytics__sort-pill--active' : ''}`}
            onClick={() => setSortBy(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="speaker-analytics__table-wrapper">
        <table className="speaker-analytics__table">
          <thead>
            <tr>
              <th>Speaker</th>
              <th className="speaker-analytics__th-num">Views</th>
              <th className="speaker-analytics__th-num">Enquiries</th>
              <th className="speaker-analytics__th-num">Recs</th>
              <th className="speaker-analytics__th-num">Added Extra</th>
              <th className="speaker-analytics__th-num">Conversion</th>
              <th className="speaker-analytics__th-num">AI Score</th>
              <th className="speaker-analytics__th-num">Fee Min</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(speaker => (
              <tr
                key={speaker.id}
                className="speaker-analytics__row"
                onClick={() => navigate(`/admin/speakers/${speaker.id}`)}
              >
                <td>
                  <div className="speaker-analytics__speaker">
                    <img
                      src={speaker.photo}
                      alt={speaker.name}
                      className="speaker-analytics__avatar"
                    />
                    <div>
                      <div className="speaker-analytics__name">
                        {speaker.name}
                      </div>
                      <div className="speaker-analytics__headline">{speaker.headline}</div>
                    </div>
                  </div>
                </td>
                <td className="speaker-analytics__td-num">{speaker.views.toLocaleString()}</td>
                <td className="speaker-analytics__td-num">
                  <span className={speaker.enquiries > 0 ? 'speaker-analytics__enquiry-count' : ''}>
                    {speaker.enquiries}
                  </span>
                </td>
                <td className="speaker-analytics__td-num">{speaker.recommendations ?? 0}</td>
                <td className="speaker-analytics__td-num">{speaker.addedAsExtra ?? 0}</td>
                <td className="speaker-analytics__td-num">
                  <span className={`speaker-analytics__rate ${speaker.conversionRate > 5 ? 'speaker-analytics__rate--high' : ''}`}>
                    {speaker.conversionRate}%
                  </span>
                </td>
                <td className="speaker-analytics__td-num">
                  {speaker.avgAiScore != null ? (
                    <span className="speaker-analytics__ai-score">{speaker.avgAiScore}%</span>
                  ) : (
                    <span className="speaker-analytics__rate">—</span>
                  )}
                </td>
                <td className="speaker-analytics__td-num" onClick={e => e.stopPropagation()}>
                  <input
                    type="number"
                    className="speaker-analytics__fee-input"
                    value={fees[speaker.id]?.feeMin ?? ''}
                    onChange={e => handleFeeChange(speaker.id, e.target.value)}
                    onBlur={() => handleFeeBlur(speaker.id)}
                    placeholder="—"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
