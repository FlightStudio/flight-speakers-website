import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

const TABS = [
  { key: 'new', label: 'New Speakers' },
  { key: 'update', label: 'Updates' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function DraftCard({ draft, onClick }) {
  const d = draft.data
  const isNew = draft.type === 'new'

  return (
    <motion.div
      className="review-card review-card--clickable"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: EASE }}
      onClick={onClick}
    >
      <div className="review-card__header">
        <div className="review-card__photo">
          {d.photo ? (
            <img src={d.photo} alt={d.name} />
          ) : (
            <div className="review-card__photo-placeholder">
              {(d.name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="review-card__info">
          <h3 className="review-card__name">{d.name}</h3>
          <p className="review-card__headline">{d.headline}</p>
          {!isNew && draft.current_name && (
            <span className="review-card__current">
              Updating: {draft.current_name}
            </span>
          )}
        </div>
        <div className="review-card__meta">
          <span className="review-card__badge-type">
            {isNew ? 'New' : 'Update'}
          </span>
          <span className="review-card__time">{timeAgo(draft.created_at)}</span>
          <span className="review-card__by">by {draft.submitted_by}</span>
        </div>
      </div>

      <div className="review-card__preview">
        {d.topics && d.topics.length > 0 && (
          <div className="review-card__tags">
            {d.topics.slice(0, 4).map(t => <span key={t} className="review-card__tag">{t}</span>)}
            {d.topics.length > 4 && <span className="review-card__tag review-card__tag--more">+{d.topics.length - 4}</span>}
          </div>
        )}
        <span className="review-card__view-link">
          View full details
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </motion.div>
  )
}

function DetailField({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="review-detail__field">
      <span className="review-detail__label">{label}</span>
      {Array.isArray(value) ? (
        <div className="review-card__tags">
          {value.map(v => <span key={v} className="review-card__tag">{v}</span>)}
        </div>
      ) : (
        <p className="review-detail__value">{value}</p>
      )}
    </div>
  )
}

function DraftDetailModal({ draft, onApprove, onEdit, onReject, onClose, loading }) {
  const d = draft.data
  const isNew = draft.type === 'new'
  const socials = d.socialProfiles || {}
  const hasSocials = Object.values(socials).some(v => v)

  return (
    <motion.div
      className="review-detail__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="review-detail__modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="review-detail__header">
          <div className="review-detail__header-left">
            <div className="review-detail__photo">
              {d.photo ? (
                <img src={d.photo} alt={d.name} />
              ) : (
                <div className="review-card__photo-placeholder" style={{ width: '100%', height: '100%' }}>
                  {(d.name || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="review-detail__name">{d.name}</h2>
              <p className="review-detail__headline">{d.headline}</p>
              {!isNew && draft.current_name && (
                <span className="review-card__current">Updating: {draft.current_name}</span>
              )}
            </div>
          </div>
          <button className="review-detail__close" onClick={onClose}>&times;</button>
        </div>

        {/* Submitted info */}
        <div className="review-detail__submitted-info">
          <span className={`review-detail__type-badge review-detail__type-badge--${draft.type}`}>
            {isNew ? 'New Speaker' : 'Profile Update'}
          </span>
          <span>Submitted by <strong>{draft.submitted_by}</strong> &middot; {timeAgo(draft.created_at)}</span>
        </div>

        {/* Full details */}
        <div className="review-detail__body">
          <DetailField label="Bio" value={d.bio} />

          <div className="review-detail__grid">
            <DetailField label="Topics" value={d.topics} />
            <DetailField label="Audiences" value={d.audiences} />
            <DetailField label="Keynotes" value={d.keynotes} />
          </div>

          <div className="review-detail__grid">
            <DetailField label="Speaking Format" value={d.speakingFormat} />
            <DetailField label="Video URL" value={d.videoUrl} />
            {d.feeMin != null && <DetailField label="Fee Min" value={`$${Number(d.feeMin).toLocaleString()}`} />}
          </div>

          {(d.gender || d.ethnicity || d.nationality || d.location) && (
            <div className="review-detail__grid">
              <DetailField label="Gender" value={d.gender} />
              <DetailField label="Ethnicity" value={d.ethnicity} />
              <DetailField label="Nationality" value={d.nationality} />
              <DetailField label="Location" value={d.location} />
            </div>
          )}

          {hasSocials && (
            <div className="review-detail__grid">
              {socials.instagram && <DetailField label="Instagram" value={socials.instagram} />}
              {socials.x && <DetailField label="X (Twitter)" value={socials.x} />}
              {socials.linkedin && <DetailField label="LinkedIn" value={socials.linkedin} />}
              {socials.youtube && <DetailField label="YouTube" value={socials.youtube} />}
              {socials.tiktok && <DetailField label="TikTok" value={socials.tiktok} />}
            </div>
          )}

          {d.photo && (
            <div className="review-detail__field">
              <span className="review-detail__label">Photo</span>
              <img src={d.photo} alt="Speaker" className="review-detail__photo-full" />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="review-detail__footer">
          <button
            className="review-card__btn review-card__btn--reject"
            onClick={() => onReject(draft.id)}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
          <div className="review-detail__footer-spacer" />
          <button
            className="review-card__btn review-card__btn--edit"
            onClick={() => onEdit(draft)}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit & Deploy
          </button>
          <button
            className="review-card__btn review-card__btn--approve review-card__btn--lg"
            onClick={() => onApprove(draft.id)}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {loading ? 'Processing...' : isNew ? 'Accept & Deploy' : 'Accept & Deploy'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminReviewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('new')
  const [drafts, setDrafts] = useState([])
  const [counts, setCounts] = useState({ new: 0, update: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [newLink, setNewLink] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const fetchDrafts = useCallback(async (type) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/review?type=${type}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setDrafts(data.drafts)
        setCounts(data.counts)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDrafts(tab)
  }, [tab, fetchDrafts])

  async function handleGenerateNewLink() {
    setLinkLoading(true)
    try {
      const res = await fetch('/api/admin/invite/new', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        const link = `${window.location.origin}/speaker-portal/${data.token}`
        setNewLink(link)
      }
    } catch { /* ignore */ }
    setLinkLoading(false)
  }

  function handleCopyNewLink() {
    navigator.clipboard.writeText(newLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleApprove(id) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/review/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setSelectedDraft(null)
        fetchDrafts(tab)
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function handleReject(id) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/review/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setSelectedDraft(null)
        fetchDrafts(tab)
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  function handleEdit(draft) {
    setSelectedDraft(null)
    navigate('/admin/speakers/new', {
      state: { draftId: draft.id, draftData: draft.data, draftType: draft.type, speakerId: draft.speaker_id },
    })
  }

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">New & Updates</h1>
          <p className="admin-page__subtitle">Review and approve speaker additions and profile changes</p>
        </div>
        <div className="review-header__actions">
          <button
            className="review-header__generate-btn"
            onClick={handleGenerateNewLink}
            disabled={linkLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {linkLoading ? 'Generating...' : 'New Speaker Link'}
          </button>
        </div>
      </div>

      {newLink && (
        <div className="review-invite-bar">
          <input
            className="review-invite-bar__input"
            value={newLink}
            readOnly
            onClick={e => e.target.select()}
          />
          <button className="review-invite-bar__copy" onClick={handleCopyNewLink}>
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
          <button className="review-invite-bar__close" onClick={() => setNewLink('')}>&times;</button>
        </div>
      )}

      <div className="review-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`review-tabs__tab ${tab === t.key ? 'review-tabs__tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className="review-tabs__count">{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '30vh' }}>
          <div className="admin-loading__spinner" />
          Loading...
        </div>
      ) : drafts.length === 0 ? (
        <div className="review-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>No pending {tab === 'new' ? 'new speakers' : 'updates'} to review</p>
        </div>
      ) : (
        <div className="review-list">
          <AnimatePresence mode="popLayout">
            {drafts.map(d => (
              <DraftCard
                key={d.id}
                draft={d}
                onClick={() => setSelectedDraft(d)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedDraft && (
          <DraftDetailModal
            draft={selectedDraft}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onReject={handleReject}
            onClose={() => setSelectedDraft(null)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
