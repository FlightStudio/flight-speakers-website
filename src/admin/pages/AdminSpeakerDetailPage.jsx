import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '../components/StatusBadge'
import { EASE } from '../../constants/animation'

export default function AdminSpeakerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [speaker, setSpeaker] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [feeMin, setFeeMin] = useState('')
  const [showScores, setShowScores] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [availLink, setAvailLink] = useState('')
  const [availCopied, setAvailCopied] = useState(false)
  const [availRotating, setAvailRotating] = useState(false)
  const [rotateConfirm, setRotateConfirm] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoDragOver, setPhotoDragOver] = useState(false)
  const photoInputRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/speakers/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Speaker not found' : 'Failed to load')
        return res.json()
      })
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          setAnalytics(data.analytics)
          setFeeMin(data.speaker.feeMin ?? '')
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/speakers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        navigate('/admin/speakers', { replace: true })
      } else {
        setError(data.message || 'Failed to delete')
        setShowDeleteConfirm(false)
      }
    } catch {
      setError('Failed to delete speaker')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }, [id, navigate])

  const handleFeeBlur = useCallback(async () => {
    try {
      await fetch(`/api/admin/speakers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feeMin: feeMin === '' ? null : parseInt(feeMin, 10) }),
      })
    } catch { /* silent */ }
  }, [id, feeMin])

  // Generate a fresh invite link AND copy it to the clipboard in one click.
  // No URL field shown — admins just want the link on their clipboard, not on
  // their screen. Button flashes "Copied!" briefly to confirm.
  const handleGenerateLink = useCallback(async () => {
    setInviteLoading(true)
    try {
      const res = await fetch(`/api/admin/invite/${id}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        const link = `${window.location.origin}/speaker-portal/${data.token}`
        try { await navigator.clipboard.writeText(link) } catch { /* clipboard blocked */ }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* ignore */ }
    setInviteLoading(false)
  }, [id])

  // Speaker availability link — long-lived, rotatable.
  useEffect(() => {
    fetch(`/api/admin/speakers/${id}/availability-link`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvailLink(`${window.location.origin}/speaker-availability#${data.token}`)
        }
      })
      .catch(() => { /* silent — panel just won't render */ })
  }, [id])

  const handleCopyAvailLink = useCallback(() => {
    navigator.clipboard.writeText(availLink)
    setAvailCopied(true)
    setTimeout(() => setAvailCopied(false), 2000)
  }, [availLink])

  const handleRotateAvailLink = useCallback(async () => {
    setAvailRotating(true)
    try {
      const res = await fetch(`/api/admin/speakers/${id}/availability-link/rotate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setAvailLink(`${window.location.origin}/speaker-availability#${data.token}`)
      }
    } catch { /* ignore */ }
    setAvailRotating(false)
    setRotateConfirm(false)
  }, [id])

  const handlePhotoUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`/api/admin/speakers/${id}/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setSpeaker(prev => ({ ...prev, photo: data.photo }))
      }
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setPhotoUploading(false)
      setPhotoDragOver(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="admin-loading" style={{ minHeight: '60vh' }}>
        <div className="admin-loading__spinner" />
        Loading speaker...
      </div>
    )
  }

  if (error || !speaker) {
    return (
      <div className="admin-detail">
        <button className="admin-detail__back" onClick={() => navigate('/admin/speakers')}>
          &larr; Back to Speakers
        </button>
        <div className="speaker-detail__empty">{error || 'Speaker not found'}</div>
      </div>
    )
  }

  const allEnquiries = [
    ...(analytics?.requestedEnquiries || []).map(e => ({ ...e, relation: 'Requested' })),
    ...(analytics?.addedAsExtraEnquiries || []).map(e => ({ ...e, relation: 'Added Extra' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const aiScores = analytics?.aiScores || []
  const avgScore = analytics?.avgAiScore

  // Parse budget ranges from enquiries to compute total budget enquired
  const totalBudget = allEnquiries.reduce((sum, e) => {
    if (!e.budget_range) return sum
    const nums = e.budget_range.replace(/[$,£€]/g, '').match(/\d+/g)
    if (!nums || nums.length === 0) return sum
    // Use midpoint of range, or single value
    const values = nums.map(Number)
    const mid = values.length >= 2
      ? Math.round((values[0] + values[1]) / 2)
      : values[0]
    return sum + mid
  }, 0)

  return (
    <motion.div
      className="admin-detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <button className="admin-detail__back" onClick={() => navigate('/admin/speakers')}>
        &larr; Back to Speakers
      </button>

      <div className="speaker-detail">
        {/* Profile header */}
        <div className="speaker-detail__header">
          <div className="speaker-detail__header-left">
            <div
              className={`speaker-detail__photo-wrap${photoDragOver ? ' speaker-detail__photo-wrap--drag' : ''}`}
              onClick={() => photoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true) }}
              onDragLeave={() => setPhotoDragOver(false)}
              onDrop={(e) => { e.preventDefault(); handlePhotoUpload(e.dataTransfer.files[0]) }}
            >
              <img src={speaker.photo} alt={speaker.name} className="speaker-detail__photo" />
              <div className="speaker-detail__photo-overlay">
                {photoUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1v10M4 5l4-4 4 4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Change photo</span>
                  </>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
              />
            </div>
            <div>
              <h1 className="speaker-detail__name">
                {speaker.name}
              </h1>
              <p className="speaker-detail__headline">{speaker.headline}</p>
              {speaker.topics && speaker.topics.length > 0 && (
                <div className="speaker-detail__topics">
                  {speaker.topics.map(t => (
                    <span key={t} className="speaker-detail__topic">{t}</span>
                  ))}
                </div>
              )}
              {(speaker.gender || speaker.nationality || speaker.location) && (
                <div className="speaker-detail__demographics">
                  {speaker.gender && <span className="speaker-detail__demo-item">Gender: {speaker.gender}</span>}
                  {speaker.nationality && <span className="speaker-detail__demo-item">Nationality: {speaker.nationality}</span>}
                  {speaker.location && <span className="speaker-detail__demo-item">Location: {speaker.location}</span>}
                  {speaker.ethnicity && <span className="speaker-detail__demo-item">Ethnicity: {speaker.ethnicity}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="speaker-detail__actions">
            <div className="speaker-detail__fee-group">
              <span className="speaker-detail__fee-icon">$</span>
              <input
                type="number"
                className="speaker-detail__fee-input"
                value={feeMin}
                onChange={e => setFeeMin(e.target.value)}
                onBlur={handleFeeBlur}
                placeholder="Fee min"
              />
            </div>
            <div className="speaker-detail__action-btns">
              <Link to={`/admin/speakers/${id}/edit`} className="speaker-detail__edit-btn" title="Edit speaker profile">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10 1.5L12.5 4M1.5 12.5L2 10L10 2L12 4L4 12L1.5 12.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </Link>
              <button
                className="speaker-detail__invite-btn"
                onClick={handleGenerateLink}
                disabled={inviteLoading}
                title="Generate a one-time profile-edit link and copy to clipboard"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                {inviteLoading ? 'Generating…' : copied ? 'Copied!' : 'Invite link'}
              </button>
              <button
                className="speaker-detail__invite-btn"
                onClick={handleCopyAvailLink}
                disabled={!availLink}
                title="Copy the speaker's long-lived availability calendar link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {availCopied ? 'Copied!' : 'Availability link'}
              </button>
              <button
                className="speaker-detail__rotate-btn"
                onClick={() => setRotateConfirm(true)}
                disabled={!availLink}
                title="Rotate availability link — invalidates the previous URL"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Rotate
              </button>
              <button
                className="speaker-detail__delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete this speaker"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M3 4v8.5h8V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Rotate confirmation overlay — explicit step because rotating
            invalidates the previous link, which is a one-way action. */}
        {rotateConfirm && (
          <div className="speaker-detail__confirm-overlay" onClick={() => !availRotating && setRotateConfirm(false)}>
            <div className="speaker-detail__confirm-card" onClick={e => e.stopPropagation()}>
              <h3>Rotate availability link?</h3>
              <p>The current link will stop working immediately. The speaker will need the new URL to continue managing their calendar.</p>
              <div className="speaker-detail__confirm-actions">
                <button
                  type="button"
                  className="speaker-detail__edit-btn"
                  onClick={() => setRotateConfirm(false)}
                  disabled={availRotating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="speaker-detail__delete-btn"
                  onClick={handleRotateAvailLink}
                  disabled={availRotating}
                >
                  {availRotating ? 'Rotating…' : 'Yes, rotate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="speaker-detail__stats">
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value">{analytics?.views?.total ?? 0}</div>
            <div className="speaker-detail__stat-label">Views</div>
          </div>
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value">{(analytics?.requestedEnquiries || []).length}</div>
            <div className="speaker-detail__stat-label">Enquiries</div>
          </div>
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value">{analytics?.recommendations?.total ?? 0}</div>
            <div className="speaker-detail__stat-label">AI Recs</div>
          </div>
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value">{(analytics?.addedAsExtraEnquiries || []).length}</div>
            <div className="speaker-detail__stat-label">Added Extra</div>
          </div>
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value">
              {avgScore != null ? `${avgScore}%` : '-'}
            </div>
            <div className="speaker-detail__stat-label">Avg AI Score</div>
          </div>
          <div className="speaker-detail__stat">
            <div className="speaker-detail__stat-value speaker-detail__stat-value--green">
              {totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : '-'}
            </div>
            <div className="speaker-detail__stat-label">Total Enquired</div>
          </div>
        </div>

        {/* AI Score History — underlined link opens modal */}
        {aiScores.length > 0 && (
          <button
            className="speaker-detail__scores-link"
            onClick={() => setShowScores(true)}
          >
            View AI Score History ({aiScores.length})
          </button>
        )}

        {/* AI Score History Modal */}
        <AnimatePresence>
          {showScores && aiScores.length > 0 && (
            <motion.div
              className="speaker-detail__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowScores(false)}
            >
              <motion.div
                className="speaker-detail__scores-modal"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={e => e.stopPropagation()}
              >
                <div className="speaker-detail__scores-modal-header">
                  <h3 className="speaker-detail__scores-modal-title">
                    AI Score History
                  </h3>
                  <button
                    className="speaker-detail__scores-modal-close"
                    onClick={() => setShowScores(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="speaker-detail__score-list">
                  {aiScores.map((s, i) => (
                    <div key={i} className={`speaker-detail__score-row ${s.selected ? 'speaker-detail__score-row--selected' : ''}`}>
                      <div className="speaker-detail__score-info">
                        <Link
                          to={`/admin/enquiries/${s.enquiryId}`}
                          className="speaker-detail__score-enquiry"
                        >
                          {s.enquiryName}
                        </Link>
                        <span className="speaker-detail__score-date">
                          {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="speaker-detail__score-meta">
                        <span className="enquiry-detail__rec-score">{s.score}%</span>
                        <span className={`enquiry-detail__badge ${s.selected ? 'enquiry-detail__badge--added' : 'enquiry-detail__badge--skipped'}`}>
                          {s.selected ? 'Selected' : 'Not selected'}
                        </span>
                      </div>
                      {s.reasoning && (
                        <div className="speaker-detail__score-reasoning">{s.reasoning}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enquiries */}
        {allEnquiries.length > 0 && (
          <div className="speaker-detail__section">
            <h3 className="speaker-detail__section-title">
              Related Enquiries ({allEnquiries.length})
            </h3>
            <div className="speaker-detail__enquiry-list">
              {allEnquiries.map(e => (
                <Link
                  key={`${e.id}-${e.relation}`}
                  to={`/admin/enquiries/${e.id}`}
                  className="speaker-detail__enquiry-row"
                >
                  <div className="speaker-detail__enquiry-info">
                    <span className="speaker-detail__enquiry-name">{e.name}</span>
                    {e.organization && (
                      <span className="speaker-detail__enquiry-org">{e.organization}</span>
                    )}
                  </div>
                  <div className="speaker-detail__enquiry-meta">
                    <span className={`enquiry-detail__badge enquiry-detail__badge--${e.relation === 'Requested' ? 'primary' : 'added'}`}>
                      {e.relation}
                    </span>
                    <StatusBadge status={e.status} />
                    <span className="speaker-detail__enquiry-date">
                      {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {allEnquiries.length === 0 && aiScores.length === 0 && (
          <div className="speaker-detail__empty-section">
            No enquiries or AI recommendations yet for this speaker.
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="speaker-detail__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              className="speaker-detail__modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="speaker-detail__modal-title">Delete Speaker</h3>
              <p className="speaker-detail__modal-text">
                Are you sure you want to delete <strong>{speaker.name}</strong>? This will remove
                all their analytics, recommendations, and view history. Existing enquiries will
                keep references but lose the speaker link.
              </p>
              <div className="speaker-detail__modal-actions">
                <button
                  className="speaker-detail__modal-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="speaker-detail__modal-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Speaker'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
