import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEnquiries } from '../hooks/useEnquiries'
import EnquiryCard from './EnquiryCard'
import EnquiryAnalyticsModal from './EnquiryAnalyticsModal'
import StatusBadge from './StatusBadge'

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

const REJECTION_LABELS = {
  pro_bono: 'Pro Bono',
  no_availability: 'No Availability',
  exclusivity: 'Exclusivity',
}

function formatTableBudget(budget, currency) {
  if (!budget) return null
  if (/^\d+$/.test(budget)) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$'
    return `${symbol}${parseInt(budget, 10).toLocaleString()}`
  }
  return budget
}

function formatTableDate(dateStr) {
  if (!dateStr) return '—'
  function fmt(s) {
    const d = new Date(s + 'T00:00:00')
    if (isNaN(d)) return s
    const day = d.getDate()
    const mon = d.toLocaleDateString('en-GB', { month: 'short' })
    const yr = d.getFullYear()
    return yr === new Date().getFullYear() ? `${day} ${mon}` : `${day} ${mon} ${yr}`
  }
  if (dateStr.includes('|')) {
    const [start, end] = dateStr.split('|')
    return `${fmt(start)} — ${fmt(end)}`
  }
  return fmt(dateStr)
}

const FILTERS = ['all', 'new', 'reviewed', 'accepted', 'rejected', 'responded']

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function SortArrows({ column, sort }) {
  const upActive = (column === 'date' && sort === 'event_date_oldest')
    || (column === 'budget' && sort === 'budget_low')
    || (column === 'received' && sort === 'oldest')
  const downActive = (column === 'date' && sort === 'event_date_newest')
    || (column === 'budget' && sort === 'budget_high')
    || (column === 'received' && sort === 'newest')

  return (
    <span className="enquiry-table__sort-arrows">
      <span className={`enquiry-table__sort-arrow ${upActive ? 'enquiry-table__sort-arrow--active' : ''}`}>▲</span>
      <span className={`enquiry-table__sort-arrow ${downActive ? 'enquiry-table__sort-arrow--active' : ''}`}>▼</span>
    </span>
  )
}

export default function EnquiryList({ engagementType = 'all' }) {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('cards')
  const [sort, setSort] = useState('newest')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [stats, setStats] = useState(null)
  const { enquiries, total, isLoading } = useEnquiries({ status, engagementType, rejectionReason, sort, page })

  // Fetch stats for filter pill counts
  useEffect(() => {
    async function fetchStats() {
      try {
        const params = new URLSearchParams()
        if (engagementType && engagementType !== 'all') params.set('engagementType', engagementType)
        const res = await fetch(`/api/admin/stats?${params}`, { credentials: 'include' })
        const data = await res.json()
        if (data.success) setStats(data.stats)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [engagementType])

  // Reset page when engagement type changes
  useEffect(() => {
    setPage(1)
  }, [engagementType])

  const totalPages = Math.ceil(total / 20)

  function pillLabel(f) {
    const label = f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)
    if (!stats) return label
    const count = f === 'all' ? stats.total : stats[f]
    return count != null ? `${label} (${count})` : label
  }

  return (
    <div>
      <div className="enquiry-list__toolbar">
        <div className="enquiry-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`enquiry-filter-pill ${status === f ? 'enquiry-filter-pill--active' : ''}`}
              onClick={() => { setStatus(f); setRejectionReason(''); setPage(1) }}
            >
              {pillLabel(f)}
            </button>
          ))}
          {rejectionReason && (
            <button
              className="enquiry-filter-pill enquiry-filter-pill--active enquiry-filter-pill--reason"
              onClick={() => { setRejectionReason(''); setPage(1) }}
            >
              {REJECTION_LABELS[rejectionReason] || rejectionReason} &times;
            </button>
          )}
        </div>
        <div className="enquiry-list__controls">
          <button
            className={`enquiry-list__icon-btn ${view === 'cards' ? 'enquiry-list__icon-btn--active' : ''}`}
            onClick={() => setView('cards')}
            title="Card view"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
            </svg>
          </button>
          <button
            className={`enquiry-list__icon-btn ${view === 'table' ? 'enquiry-list__icon-btn--active' : ''}`}
            onClick={() => setView('table')}
            title="Table view"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="12" width="14" height="2" rx="0.5" fill="currentColor"/>
            </svg>
          </button>
          <div className="enquiry-list__controls-divider" />
          <button
            className="enquiry-list__icon-btn"
            onClick={() => setShowAnalytics(true)}
            title="Analytics"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" />
              <rect x="6.5" y="5" width="3" height="10" rx="1" fill="currentColor" />
              <rect x="12" y="1" width="3" height="14" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          Loading enquiries...
        </div>
      ) : enquiries.length === 0 ? (
        <div className="enquiry-list__empty">No enquiries found</div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'cards' ? (
            <motion.div
              key={`cards-${status}-${page}`}
              className="enquiry-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {enquiries.map(enquiry => (
                <EnquiryCard key={enquiry.id} enquiry={enquiry} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`table-${status}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="enquiry-table__wrapper">
                <table className="enquiry-table">
                  <thead>
                    <tr>
                      <th>Speaker</th>
                      <th>Client</th>
                      <th
                        className="enquiry-table__th-sortable"
                        onClick={() => {
                          setSort(s => s === 'event_date_newest' ? 'event_date_oldest' : s === 'event_date_oldest' ? 'newest' : 'event_date_newest')
                          setPage(1)
                        }}
                      >
                        Event Date
                        <SortArrows column="date" sort={sort} />
                      </th>
                      <th>Location</th>
                      <th
                        className="enquiry-table__th-sortable"
                        onClick={() => {
                          setSort(s => s === 'budget_high' ? 'budget_low' : s === 'budget_low' ? 'newest' : 'budget_high')
                          setPage(1)
                        }}
                      >
                        Budget
                        <SortArrows column="budget" sort={sort} />
                      </th>
                      <th>Status</th>
                      <th
                        className="enquiry-table__th-sortable enquiry-table__th-right"
                        onClick={() => {
                          setSort(s => s === 'newest' ? 'oldest' : 'newest')
                          setPage(1)
                        }}
                      >
                        Received
                        <SortArrows column="received" sort={sort} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map(enquiry => (
                      <tr key={enquiry.id} className="enquiry-table__row">
                        <td>
                          <Link to={`/admin/enquiries/${enquiry.id}`} className="enquiry-table__speaker">
                            {enquiry.speaker_photo ? (
                              <img src={enquiry.speaker_photo} alt="" className="enquiry-table__avatar" />
                            ) : (
                              <div className="enquiry-table__avatar enquiry-table__avatar--placeholder">
                                {(enquiry.speaker_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <span className="enquiry-table__speaker-name">
                              {enquiry.speaker_name || 'No speaker'}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <div className="enquiry-table__client-name">{enquiry.name}</div>
                          {enquiry.organization && (
                            <div className="enquiry-table__client-org">{enquiry.organization}</div>
                          )}
                        </td>
                        <td className="enquiry-table__muted">
                          {formatTableDate(enquiry.event_date)}
                        </td>
                        <td className="enquiry-table__muted">
                          {enquiry.event_location || '—'}
                        </td>
                        <td>
                          {enquiry.budget_range ? (
                            <span className="enquiry-table__budget">{formatTableBudget(enquiry.budget_range, enquiry.currency)}</span>
                          ) : (
                            <span className="enquiry-table__muted">—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={enquiry.status} />
                        </td>
                        <td className="enquiry-table__th-right enquiry-table__muted">
                          {timeAgo(enquiry.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {totalPages > 1 && (
        <div className="enquiry-list__pagination">
          <button
            className="enquiry-list__page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="enquiry-list__page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="enquiry-list__page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <EnquiryAnalyticsModal
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        engagementType={engagementType}
        onFilterByReason={(reason) => {
          setStatus('rejected')
          setRejectionReason(reason)
          setPage(1)
          setShowAnalytics(false)
        }}
      />
    </div>
  )
}
