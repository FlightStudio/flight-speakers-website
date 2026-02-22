import { useState, useCallback, useRef, useEffect } from 'react'

const REJECTION_REASONS = [
  { key: 'pro_bono', label: 'Pro Bono' },
  { key: 'no_availability', label: 'No Availability' },
  { key: 'exclusivity', label: 'Exclusivity' },
]

function formatEventDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function mergeTemplate(body, enquiry) {
  return body
    .replaceAll('{{name}}', enquiry?.name || '')
    .replaceAll('{{speaker_name}}', enquiry?.speaker_name || 'the speaker')
    .replaceAll('{{event_date}}', formatEventDate(enquiry?.event_date) || 'your event')
    .replaceAll('{{organization}}', enquiry?.organization || '')
}

export default function EnquiryActions({ enquiry, onUpdate }) {
  const [responseMsg, setResponseMsg] = useState('')
  const [notes, setNotes] = useState(enquiry?.admin_notes || '')
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showRejectMenu, setShowRejectMenu] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState(null)
  const [acceptPending, setAcceptPending] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateSubject, setTemplateSubject] = useState('')
  const rejectRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rejectRef.current && !rejectRef.current.contains(e.target)) {
        setShowRejectMenu(false)
      }
    }
    if (showRejectMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRejectMenu])

  const isInFlow = !!selectedRejection || acceptPending

  const handleAction = useCallback(async (updates) => {
    setIsSaving(true)
    setFeedback(null)
    const result = await onUpdate(updates)
    setIsSaving(false)
    if (result.success) {
      setFeedback({ type: 'success', message: 'Updated successfully' })
      setResponseMsg('')
      setSelectedRejection(null)
      setAcceptPending(false)
    } else {
      setFeedback({ type: 'error', message: result.message || 'Update failed' })
    }
  }, [onUpdate])

  const handleAcceptClick = async () => {
    setSelectedRejection(null)
    setAcceptPending(true)
    setTemplateLoading(true)

    try {
      const res = await fetch('/api/admin/templates/accepted', { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.template) {
        setResponseMsg(mergeTemplate(data.template.body, enquiry))
        setTemplateSubject(data.template.subject)
      }
    } catch {
      // Template fetch failed — admin can type manually
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleSendAcceptance = () => {
    handleAction({
      status: 'accepted',
      response_message: responseMsg.trim(),
      email_subject: templateSubject,
    })
  }

  const handleSelectReason = async (reason) => {
    setShowRejectMenu(false)
    setAcceptPending(false)
    setSelectedRejection(reason)
    setTemplateLoading(true)

    try {
      const res = await fetch(`/api/admin/templates/${reason.key}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.template) {
        setResponseMsg(mergeTemplate(data.template.body, enquiry))
        setTemplateSubject(data.template.subject)
      }
    } catch {
      // Template fetch failed — admin can type manually
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedRejection(null)
    setAcceptPending(false)
    setResponseMsg('')
    setTemplateSubject('')
  }

  const handleSendRejection = () => {
    handleAction({
      status: 'rejected',
      rejection_reason: selectedRejection.key,
      response_message: responseMsg.trim(),
      email_subject: templateSubject,
    })
  }

  const handleRespond = () => {
    if (!responseMsg.trim()) return
    handleAction({ status: 'responded', response_message: responseMsg.trim() })
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
            onClick={() => setShowRejectMenu(v => !v)}
            disabled={isSaving || isInFlow}
          >
            Reject
          </button>
          {showRejectMenu && (
            <div className="enquiry-actions__reject-menu">
              {REJECTION_REASONS.map(r => (
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
      </div>

      {acceptPending && (
        <div className="enquiry-actions__acceptance-banner">
          <span>Accepting enquiry</span>
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
          <span>Rejecting: <strong>{selectedRejection.label}</strong></span>
          <button
            className="enquiry-actions__rejection-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="enquiry-actions__respond">
        <textarea
          className="enquiry-actions__textarea"
          placeholder={
            acceptPending ? 'Edit acceptance message...'
            : selectedRejection ? 'Edit rejection message...'
            : 'Write a custom response...'
          }
          value={responseMsg}
          onChange={e => setResponseMsg(e.target.value)}
          disabled={templateLoading}
        />
        {acceptPending ? (
          <button
            className="enquiry-actions__send enquiry-actions__send--accept"
            onClick={handleSendAcceptance}
            disabled={isSaving || templateLoading}
          >
            {templateLoading ? 'Loading...' : 'Send Acceptance'}
          </button>
        ) : selectedRejection ? (
          <button
            className="enquiry-actions__send enquiry-actions__send--reject"
            onClick={handleSendRejection}
            disabled={isSaving || templateLoading}
          >
            {templateLoading ? 'Loading...' : 'Send Rejection'}
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
