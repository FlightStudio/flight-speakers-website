import { useState, useCallback, useRef, useEffect } from 'react'

// Sent when accepting an enquiry, alongside the status change
const ACCEPT_EMAIL = { key: 'enquiry_processing', label: 'Enquiry Processing' }

// Rejections send the matching Resend template and set rejection_reason
const REJECTION_EMAILS = [
  { key: 'pro_bono', label: 'Pro Bono' },
  { key: 'exclusivity', label: 'Exclusivity' },
  { key: 'no_availability', label: 'No Availability' },
]

// Standalone emails — sent without changing the enquiry status
const STANDALONE_EMAILS = [
  { key: 'match_expired', label: 'Match Expired' },
  { key: 'post_event_feedback', label: 'Post Event Feedback' },
  { key: 'reengagement', label: 'Reengagement' },
]

export default function EnquiryActions({ enquiry, onUpdate }) {
  const [responseMsg, setResponseMsg] = useState('')
  const [notes, setNotes] = useState(enquiry?.admin_notes || '')
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [openMenu, setOpenMenu] = useState(null) // 'reject' | 'email' | null
  const [selectedRejection, setSelectedRejection] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [acceptPending, setAcceptPending] = useState(false)
  const rejectRef = useRef(null)
  const emailRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        (!rejectRef.current || !rejectRef.current.contains(e.target)) &&
        (!emailRef.current || !emailRef.current.contains(e.target))
      ) {
        setOpenMenu(null)
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])

  const isInFlow = !!selectedRejection || !!selectedEmail || acceptPending

  const handleAction = useCallback(async (updates) => {
    setIsSaving(true)
    setFeedback(null)
    const result = await onUpdate(updates)
    setIsSaving(false)
    if (result.success) {
      if (updates.email_template && result.emailSent === false) {
        setFeedback({ type: 'error', message: 'Saved, but the email failed to send' })
      } else if (updates.email_template) {
        setFeedback({ type: 'success', message: 'Email sent' })
      } else {
        setFeedback({ type: 'success', message: 'Updated successfully' })
      }
      setResponseMsg('')
      setSelectedRejection(null)
      setSelectedEmail(null)
      setAcceptPending(false)
    } else {
      setFeedback({ type: 'error', message: result.message || 'Update failed' })
    }
  }, [onUpdate])

  const handleAcceptClick = () => {
    setSelectedRejection(null)
    setSelectedEmail(null)
    setAcceptPending(true)
    setResponseMsg('')
  }

  const handleSendAcceptance = () => {
    handleAction({
      status: 'confirmed',
      email_template: ACCEPT_EMAIL.key,
    })
  }

  const handleSelectReason = (reason) => {
    setOpenMenu(null)
    setAcceptPending(false)
    setSelectedEmail(null)
    setSelectedRejection(reason)
    setResponseMsg('')
  }

  const handleSelectEmail = (email) => {
    setOpenMenu(null)
    setAcceptPending(false)
    setSelectedRejection(null)
    setSelectedEmail(email)
    setResponseMsg('')
  }

  const handleCancel = () => {
    setSelectedRejection(null)
    setSelectedEmail(null)
    setAcceptPending(false)
    setResponseMsg('')
  }

  const handleSendRejection = () => {
    handleAction({
      status: 'rejected',
      rejection_reason: selectedRejection.key,
      email_template: selectedRejection.key,
    })
  }

  const handleSendEmail = () => {
    handleAction({ email_template: selectedEmail.key })
  }

  const handleRespond = () => {
    if (!responseMsg.trim()) return
    handleAction({ status: 'contacted', response_message: responseMsg.trim() })
  }

  const handleSaveNotes = () => handleAction({ admin_notes: notes })

  return (
    <div className="enquiry-actions">
      <div className="enquiry-actions__title">Actions</div>

      <div className="enquiry-actions__buttons">
        <button
          className="enquiry-actions__btn enquiry-actions__btn--accept"
          onClick={handleAcceptClick}
          disabled={isSaving || isInFlow}
        >
          Accept – Live
        </button>
        <div className="enquiry-actions__reject-wrap" ref={rejectRef}>
          <button
            className="enquiry-actions__btn enquiry-actions__btn--reject"
            onClick={() => setOpenMenu(m => m === 'reject' ? null : 'reject')}
            disabled={isSaving || isInFlow}
          >
            Reject
          </button>
          {openMenu === 'reject' && (
            <div className="enquiry-actions__reject-menu">
              {REJECTION_EMAILS.map(r => (
                <button
                  key={r.key}
                  className="enquiry-actions__reject-option"
                  onClick={() => handleSelectReason(r)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="enquiry-actions__reject-wrap" ref={emailRef}>
          <button
            className="enquiry-actions__btn"
            onClick={() => setOpenMenu(m => m === 'email' ? null : 'email')}
            disabled={isSaving || isInFlow}
          >
            Send Email
          </button>
          {openMenu === 'email' && (
            <div className="enquiry-actions__reject-menu">
              {STANDALONE_EMAILS.map(e => (
                <button
                  key={e.key}
                  className="enquiry-actions__reject-option"
                  onClick={() => handleSelectEmail(e)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {acceptPending && (
        <div className="enquiry-actions__acceptance-banner">
          <span>
            Accepting — sends the "{ACCEPT_EMAIL.label}" email to {enquiry?.email}
          </span>
          <button
            className="enquiry-actions__acceptance-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {selectedRejection && (
        <div className="enquiry-actions__rejection-banner">
          <span>
            Rejecting: <strong>{selectedRejection.label}</strong> — sends the "{selectedRejection.label}" email to {enquiry?.email}
          </span>
          <button
            className="enquiry-actions__rejection-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {selectedEmail && (
        <div className="enquiry-actions__acceptance-banner">
          <span>
            Sends the "{selectedEmail.label}" email to {enquiry?.email}
          </span>
          <button
            className="enquiry-actions__acceptance-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="enquiry-actions__respond">
        {!isInFlow && (
          <textarea
            className="enquiry-actions__textarea"
            placeholder="Write a custom response..."
            value={responseMsg}
            onChange={e => setResponseMsg(e.target.value)}
          />
        )}
        {acceptPending ? (
          <button
            className="enquiry-actions__send enquiry-actions__send--accept"
            onClick={handleSendAcceptance}
            disabled={isSaving}
          >
            {isSaving ? 'Sending...' : 'Send Acceptance'}
          </button>
        ) : selectedRejection ? (
          <button
            className="enquiry-actions__send enquiry-actions__send--reject"
            onClick={handleSendRejection}
            disabled={isSaving}
          >
            {isSaving ? 'Sending...' : 'Send Rejection'}
          </button>
        ) : selectedEmail ? (
          <button
            className="enquiry-actions__send"
            onClick={handleSendEmail}
            disabled={isSaving}
          >
            {isSaving ? 'Sending...' : `Send "${selectedEmail.label}"`}
          </button>
        ) : (
          <button
            className="enquiry-actions__send"
            onClick={handleRespond}
            disabled={isSaving || !responseMsg.trim()}
          >
            Send Response
          </button>
        )}
      </div>

      {feedback && (
        <div className={`enquiry-actions__status-msg enquiry-actions__status-msg--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="enquiry-actions__notes">
        <div className="enquiry-actions__notes-label">Internal Notes</div>
        <textarea
          className="enquiry-actions__notes-input"
          placeholder="Add private notes about this enquiry..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (enquiry?.admin_notes || '')) handleSaveNotes()
          }}
        />
      </div>
    </div>
  )
}
