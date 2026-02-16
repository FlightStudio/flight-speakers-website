import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

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

function shortDateSingle(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const day = d.getDate()
  const mon = d.toLocaleDateString('en-GB', { month: 'short' })
  const yr = d.getFullYear()
  return yr === new Date().getFullYear() ? `${day} ${mon}` : `${day} ${mon} ${yr}`
}

function shortDate(dateStr) {
  if (!dateStr) return null
  // Handle pipe-delimited date ranges (e.g. "2025-03-15|2025-03-20")
  if (dateStr.includes('|')) {
    const [start, end] = dateStr.split('|')
    return `${shortDateSingle(start)} — ${shortDateSingle(end)}`
  }
  return shortDateSingle(dateStr)
}

function shortLocation(loc) {
  if (!loc) return null
  const abbrevs = {
    'London': 'Ldn',
    'Manchester': 'Manc',
    'Birmingham': 'Bham',
    'Edinburgh': 'Edin',
    'New York': 'NYC',
    'Los Angeles': 'LA',
    'San Francisco': 'SF',
    'United Kingdom': 'UK',
    'United States': 'US',
  }
  let s = loc
  for (const [full, short] of Object.entries(abbrevs)) {
    s = s.replace(new RegExp(full, 'gi'), short)
  }
  return s
}

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

function shortBudget(budget, currency) {
  if (!budget) return null
  // Format plain numeric custom budgets with currency symbol
  if (/^\d+$/.test(budget)) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$'
    return `${symbol}${parseInt(budget, 10).toLocaleString()}`
  }
  return budget
}

export default function EnquiryCard({ enquiry }) {
  const parts = [
    enquiry.event_date && { icon: '📅', text: shortDate(enquiry.event_date) },
    enquiry.event_location && { icon: '📍', text: shortLocation(enquiry.event_location) },
    enquiry.budget_range && { icon: '💰', text: shortBudget(enquiry.budget_range, enquiry.currency) },
  ].filter(Boolean)

  return (
    <Link to={`/admin/enquiries/${enquiry.id}`} className="enquiry-card">
      <div className="enquiry-card__top">
        <div className="enquiry-card__avatar-col">
          {enquiry.speaker_photo ? (
            <img
              src={enquiry.speaker_photo}
              alt={enquiry.speaker_name || ''}
              className="enquiry-card__avatar"
            />
          ) : (
            <div className="enquiry-card__avatar enquiry-card__avatar--placeholder">
              {(enquiry.speaker_name || enquiry.name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="enquiry-card__header-info">
          <span className="enquiry-card__speaker-name">
            {enquiry.speaker_name || 'No speaker selected'}
          </span>
          <StatusBadge status={enquiry.status} />
        </div>
      </div>

      {parts.length > 0 && (
        <div className="enquiry-card__summary">
          {parts.map((p, i) => (
            <span key={i} className="enquiry-card__summary-item">
              <span className="enquiry-card__summary-icon">{p.icon}</span>
              {p.text}
            </span>
          ))}
        </div>
      )}

      <div className="enquiry-card__bottom">
        <span className="enquiry-card__client">
          {enquiry.name}
          {enquiry.organization ? ` — ${enquiry.organization}` : ''}
        </span>
        <span className="enquiry-card__time">{timeAgo(enquiry.created_at)}</span>
      </div>
    </Link>
  )
}
