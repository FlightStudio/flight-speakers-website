import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from './StatusBadge'
import { EASE } from '../../constants/animation'

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

const REJECTION_LABELS = {
  pro_bono: 'Pro Bono',
  no_availability: 'No Availability',
  exclusivity: 'Exclusivity',
}

const EMAIL_LABELS = {
  enquiry_received: 'Enquiry Received',
  enquiry_processing: 'Enquiry Processing',
  exclusivity: 'Exclusivity',
  match_expired: 'Match Expired',
  post_event_feedback: 'Post Event Feedback',
  pro_bono: 'Pro Bono',
  reengagement: 'Reengagement',
  no_availability: 'No Availability',
}

function formatSentAt(ts) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatEventDate(dateStr) {
  if (!dateStr) return null
  function fmt(s) {
    const d = new Date(s + 'T00:00:00')
    if (isNaN(d)) return s
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (dateStr.includes('|')) {
    const [start, end] = dateStr.split('|')
    return `${fmt(start)} – ${fmt(end)}`
  }
  return fmt(dateStr)
}

function formatBudget(budgetRange, currency) {
  if (!budgetRange) return null
  // If it's a plain number (custom budget), format with currency symbol
  if (/^\d+$/.test(budgetRange)) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$'
    return `${symbol}${parseInt(budgetRange, 10).toLocaleString()}`
  }
  return budgetRange
}

export default function EnquiryDetail({ enquiry, additionalSpeakers = [], sentEmails = [] }) {
  const [showRecs, setShowRecs] = useState(false)

  if (!enquiry) return null

  const fields = [
    { label: 'Name', value: enquiry.name },
    { label: 'Email', value: enquiry.email },
    { label: 'Organization', value: enquiry.organization },
    { label: 'Phone', value: enquiry.phone },
    { label: 'Event Date', value: formatEventDate(enquiry.event_date) },
    { label: 'Location', value: enquiry.event_location },
    { label: 'Audience Size', value: enquiry.audience_size },
    { label: 'Budget', value: formatBudget(enquiry.budget_range, enquiry.currency) },
    { label: 'Event Type', value: enquiry.event_type },
    { label: 'Engagement Type', value: enquiry.engagement_type },
    { label: 'Currency', value: enquiry.currency },
    { label: 'Pro Bono Flexible', value: enquiry.pro_bono_flexible ? 'Yes' : null },
    { label: 'Newsletter', value: enquiry.newsletter ? 'Yes' : 'No' },
  ]

  const recommendations = enquiry.recommendations || []

  return (
    <div className="enquiry-detail">
      <div className="enquiry-detail__header">
        <div>
          <div className="enquiry-detail__title">{enquiry.name}</div>
          <div className="enquiry-detail__subtitle">
            {enquiry.organization}{enquiry.email ? ` / ${enquiry.email}` : ''}
          </div>
        </div>
        <div className="enquiry-detail__status-col">
          <StatusBadge status={enquiry.status} />
          {enquiry.status === 'rejected' && enquiry.rejection_reason && (
            <span className="enquiry-detail__rejection-badge">
              {REJECTION_LABELS[enquiry.rejection_reason] || enquiry.rejection_reason}
            </span>
          )}
        </div>
      </div>

      <div className="enquiry-detail__grid">
        {fields.map(f => (
          <div key={f.label} className="enquiry-detail__field">
            <div className="enquiry-detail__label">{f.label}</div>
            <div className={`enquiry-detail__value ${!f.value ? 'enquiry-detail__value--empty' : ''}`}>
              {f.value || '-'}
            </div>
          </div>
        ))}
      </div>

      {enquiry.brief && (
        <>
          <div className="enquiry-detail__section-title">Brief</div>
          <div className="enquiry-detail__brief">{enquiry.brief}</div>
        </>
      )}

      {enquiry.speaker_name && (
        <div className="enquiry-detail__speaker-section">
          <div className="enquiry-detail__section-title">Requested Speaker</div>
          <div className="enquiry-detail__speaker-card enquiry-detail__speaker-card--primary">
            <div className="enquiry-detail__value">{enquiry.speaker_name}</div>
            <span className="enquiry-detail__badge enquiry-detail__badge--primary">Primary</span>
          </div>
        </div>
      )}

      {additionalSpeakers.length > 0 && (
        <div className="enquiry-detail__speaker-section">
          <div className="enquiry-detail__section-title">
            Additional Speakers Requested ({additionalSpeakers.length})
          </div>
          <div className="enquiry-detail__additional-speakers">
            {additionalSpeakers.map(s => (
              <div key={s.id} className="enquiry-detail__additional-speaker">
                <img src={s.photo} alt={s.name} className="enquiry-detail__additional-avatar" />
                <div className="enquiry-detail__additional-info">
                  <div className="enquiry-detail__value">{s.name}</div>
                  <div className="enquiry-detail__label" style={{ marginBottom: 0 }}>{s.headline}</div>
                </div>
                <span className="enquiry-detail__badge enquiry-detail__badge--added">Added</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentEmails.length > 0 && (
        <div className="enquiry-detail__speaker-section">
          <div className="enquiry-detail__section-title">
            Emails Sent ({sentEmails.length})
          </div>
          <div className="enquiry-detail__emails">
            {sentEmails.map(e => (
              <div key={e.id} className="enquiry-detail__email-row">
                <div className="enquiry-detail__email-info">
                  <div className="enquiry-detail__value">
                    {EMAIL_LABELS[e.template_key] || e.template_key}
                  </div>
                  <div className="enquiry-detail__label" style={{ marginBottom: 0 }}>
                    To {e.recipient}
                  </div>
                </div>
                <div className="enquiry-detail__email-time">{formatSentAt(e.sent_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <button
          className="enquiry-detail__recs-link"
          onClick={() => setShowRecs(true)}
        >
          View AI Recommendations & Scores ({recommendations.length})
        </button>
      )}

      {/* AI Recommendations Modal */}
      <AnimatePresence>
        {showRecs && recommendations.length > 0 && (
          <motion.div
            className="enquiry-detail__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowRecs(false)}
          >
            <motion.div
              className="enquiry-detail__recs-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              <div className="enquiry-detail__recs-modal-header">
                <h3 className="enquiry-detail__recs-modal-title">
                  AI Recommendations & Scores
                </h3>
                <button
                  className="enquiry-detail__recs-modal-close"
                  onClick={() => setShowRecs(false)}
                >
                  &times;
                </button>
              </div>
              <div className="enquiry-detail__recs-modal-body">
                {recommendations.map((rec, i) => (
                  <div
                    key={rec.speakerId || i}
                    className={`enquiry-detail__rec ${rec.selected ? 'enquiry-detail__rec--selected' : ''}`}
                  >
                    <div className="enquiry-detail__rec-header">
                      <div className="enquiry-detail__rec-name">{rec.speakerName}</div>
                      <div className="enquiry-detail__rec-meta">
                        {rec.score != null && (
                          <span className="enquiry-detail__rec-score">{rec.score}%</span>
                        )}
                        <span className={`enquiry-detail__badge ${rec.selected ? 'enquiry-detail__badge--added' : 'enquiry-detail__badge--skipped'}`}>
                          {rec.selected ? 'Selected' : 'Not selected'}
                        </span>
                      </div>
                    </div>
                    {rec.reasoning && (
                      <div className="enquiry-detail__rec-reasoning">{rec.reasoning}</div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
