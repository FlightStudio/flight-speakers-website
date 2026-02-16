import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEnquiries } from '../hooks/useEnquiries'
import EnquiryCard from './EnquiryCard'
import StatusBadge from './StatusBadge'

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

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

export default function EnquiryList({ initialFilter = 'all' }) {
  const [status, setStatus] = useState(initialFilter)
  const [page, setPage] = useState(1)
  const [view, setView] = useState('cards')
  const { enquiries, total, isLoading } = useEnquiries({ status, page })

  // Sync with external filter (stat card clicks)
  useEffect(() => {
    if (initialFilter !== status) {
      setStatus(initialFilter)
      setPage(1)
    }
  }, [initialFilter])

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="enquiry-list__toolbar">
        <div className="enquiry-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`enquiry-filter-pill ${status === f ? 'enquiry-filter-pill--active' : ''}`}
              onClick={() => { setStatus(f); setPage(1) }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="speakers-page__view-toggle">
          <button
            className={`speakers-page__view-btn ${view === 'cards' ? 'speakers-page__view-btn--active' : ''}`}
            onClick={() => setView('cards')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
            </svg>
            Cards
          </button>
          <button
            className={`speakers-page__view-btn ${view === 'table' ? 'speakers-page__view-btn--active' : ''}`}
            onClick={() => setView('table')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="12" width="14" height="2" rx="0.5" fill="currentColor"/>
            </svg>
            Table
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
                      <th>Event Date</th>
                      <th>Location</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th className="enquiry-table__th-right">Received</th>
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
    </div>
  )
}
