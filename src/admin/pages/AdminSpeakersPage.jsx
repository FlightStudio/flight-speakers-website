import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SpeakerCardGrid from '../components/SpeakerCardGrid'

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
  { key: 'budgetEnquiries', label: 'Most Budget Fwd' },
]

import { EASE } from '../../constants/animation'

export default function AdminSpeakersPage() {
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('all')
  const [sortBy, setSortBy] = useState('enquiries')

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

  const sorted = useMemo(() => {
    return [...analytics].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
  }, [analytics, sortBy])

  return (
    <motion.div
      className="admin-page admin-page--wide"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="speakers-page__header">
        <div>
          <h1 className="admin-page__title">Speakers</h1>
          <p className="admin-page__subtitle">{analytics.length} speakers</p>
        </div>
        <Link to="/admin/speakers/new" className="speakers-page__add-btn">
          + Add Speaker
        </Link>
      </div>

      {/* Clean toolbar: period tabs left, sort dropdown right */}
      <div className="speakers-toolbar">
        <div className="speakers-toolbar__tabs">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`speakers-toolbar__tab ${period === p.key ? 'speakers-toolbar__tab--active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="speakers-toolbar__sort">
          <label className="speakers-toolbar__sort-label" htmlFor="speaker-sort">
            Sort by
          </label>
          <select
            id="speaker-sort"
            className="speakers-toolbar__sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          Loading speaker analytics...
        </div>
      ) : analytics.length === 0 ? (
        <div className="speaker-analytics">
          <p className="admin-page__subtitle" style={{ textAlign: 'center', padding: '3rem 0' }}>
            {error ? `Error: ${error}` : 'No analytics data available yet'}
          </p>
        </div>
      ) : (
        <SpeakerCardGrid speakers={sorted} />
      )}
    </motion.div>
  )
}
