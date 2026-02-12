import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import SpeakerForm from '../components/SpeakerForm'
import { useSpeaker } from '../hooks/useSpeaker'

const EASE = [0.16, 1, 0.3, 1]

export default function AdminSpeakerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { speaker, loading, error: hookError, saving: hookSaving, saveSpeaker } = useSpeaker(id)
  const [submitted, setSubmitted] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState(null)

  // "Edit & Deploy" mode — came from review page with draft data
  const draftState = location.state
  const isDeploy = !!draftState?.draftId
  const draftId = draftState?.draftId
  const draftData = draftState?.draftData
  const isEdit = !!id

  const initialData = isDeploy ? draftData : speaker

  async function handleSubmit(data) {
    if (isDeploy) {
      // Deploy mode: approve the draft with edited data
      setDeploying(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/review/${draftId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.message || 'Deploy failed')
        setSubmitted(true)
      } catch (err) {
        setError(err.message)
      } finally {
        setDeploying(false)
      }
    } else {
      try {
        await saveSpeaker(data)
        setSubmitted(true)
      } catch {
        // error is set in the hook
      }
    }
  }

  const isSaving = isDeploy ? deploying : hookSaving
  const displayError = error || hookError

  if (isEdit && loading) {
    return (
      <div className="admin-loading" style={{ minHeight: '60vh' }}>
        <div className="admin-loading__spinner" />
        Loading speaker...
      </div>
    )
  }

  if (isEdit && !speaker && !loading && !isDeploy) {
    return (
      <div className="admin-detail">
        <button className="admin-detail__back" onClick={() => navigate('/admin/speakers')}>
          &larr; Back to Speakers
        </button>
        <div className="speaker-detail__empty-section">{displayError || 'Speaker not found'}</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <motion.div
        className="admin-detail"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="review-submitted">
          <div className="review-submitted__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="review-submitted__title">
            {isDeploy ? 'Deployed to site' : 'Submitted for review'}
          </h2>
          <p className="review-submitted__text">
            {isDeploy
              ? 'Changes have been approved and are now live on the site.'
              : isEdit
                ? `Updates to ${speaker?.name || 'this speaker'} have been queued for approval.`
                : 'New speaker has been queued for approval.'}
          </p>
          <div className="review-submitted__actions">
            <button className="btn btn--primary" onClick={() => navigate('/admin/review')}>
              {isDeploy ? 'Back to Review Queue' : 'Go to Review Queue'}
            </button>
            {!isDeploy && (
              <button className="btn btn--secondary" onClick={() => { setSubmitted(false) }}>
                {isEdit ? 'Make More Changes' : 'Add Another Speaker'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="admin-detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <button className="admin-detail__back" onClick={() => navigate(isDeploy ? '/admin/review' : '/admin/speakers')}>
        &larr; {isDeploy ? 'Back to Review' : 'Back to Speakers'}
      </button>

      <div className="spkr-form__card">
        <h1 className="admin-page__title">
          {isDeploy
            ? `Edit & Deploy — ${draftData?.name || 'Speaker'}`
            : isEdit ? `Edit ${speaker?.name || 'Speaker'}` : 'Add New Speaker'}
        </h1>
        <p className="admin-page__subtitle">
          {isDeploy
            ? 'Make your edits below, then deploy directly to the live site.'
            : isEdit ? 'Changes will be submitted for review before going live.' : 'New speaker will be submitted for review before being published.'}
        </p>

        {displayError && (
          <div className="enquiry-actions__status-msg enquiry-actions__status-msg--error">
            {displayError}
          </div>
        )}

        <SpeakerForm
          initialData={initialData}
          onSubmit={handleSubmit}
          saving={isSaving}
          submitLabel={isDeploy ? 'Deploy to Site' : undefined}
        />
      </div>
    </motion.div>
  )
}
