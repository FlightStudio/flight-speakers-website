import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import SpeakerForm from '../admin/components/SpeakerForm'
import './SpeakerPortalPage.css'

const EASE = [0.16, 1, 0.3, 1]

export default function SpeakerPortalPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | valid | invalid | submitted
  const [type, setType] = useState(null)
  const [speaker, setSpeaker] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/portal/${token}`)
        const data = await res.json()
        if (data.success) {
          setType(data.type)
          setSpeaker(data.speaker)
          setStatus('valid')
        } else {
          setError(data.message)
          setStatus('invalid')
        }
      } catch {
        setError('Unable to validate this link. Please try again.')
        setStatus('invalid')
      }
    }
    validate()
  }, [token])

  async function handleSubmit(formData) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('submitted')
      } else {
        setError(data.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  if (status === 'loading') {
    return (
      <div className="portal-page">
        <div className="portal-page__loading">
          <div className="portal-page__spinner" />
          Validating your link...
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="portal-page">
        <motion.div
          className="portal-page__card portal-page__card--center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h1 className="portal-page__title">Link unavailable</h1>
          <p className="portal-page__text">{error}</p>
          <p className="portal-page__text portal-page__text--muted">
            Please contact the Flight Speakers team for a new link.
          </p>
        </motion.div>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="portal-page">
        <motion.div
          className="portal-page__card portal-page__card--center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h1 className="portal-page__title">Submitted successfully</h1>
          <p className="portal-page__text">
            {type === 'new'
              ? 'Your speaker profile has been submitted for review. The Flight Speakers team will review and publish it shortly.'
              : 'Your profile updates have been submitted. The team will review and apply the changes shortly.'}
          </p>
          <p className="portal-page__text portal-page__text--muted">
            You can close this page now.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="portal-page">
      <motion.div
        className="portal-page__card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="portal-page__header">
          <div className="portal-page__logo">Flight Speakers</div>
          <h1 className="portal-page__title">
            {type === 'new' ? 'Submit your speaker profile' : 'Update your profile'}
          </h1>
          <p className="portal-page__text">
            {type === 'new'
              ? 'Fill in your details below. Your profile will be reviewed before going live.'
              : 'Make changes to your profile below. Updates will be reviewed before being published.'}
          </p>
        </div>

        {error && (
          <div className="portal-page__error">{error}</div>
        )}

        <SpeakerForm
          initialData={speaker}
          onSubmit={handleSubmit}
          saving={saving}
          portalMode
        />
      </motion.div>
    </div>
  )
}
