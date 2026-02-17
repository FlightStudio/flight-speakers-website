import { useState, useCallback } from 'react'

export default function EnquiryActions({ enquiry, onUpdate }) {
  const [responseMsg, setResponseMsg] = useState('')
  const [notes, setNotes] = useState(enquiry?.admin_notes || '')
  const [feedback, setFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleAction = useCallback(async (updates) => {
    setIsSaving(true)
    setFeedback(null)
    const result = await onUpdate(updates)
    setIsSaving(false)
    if (result.success) {
      setFeedback({ type: 'success', message: 'Updated successfully' })
      setResponseMsg('')
    } else {
      setFeedback({ type: 'error', message: result.message || 'Update failed' })
    }
  }, [onUpdate])

  const handleAccept = () => handleAction({ status: 'accepted' })
  const handleReject = () => handleAction({ status: 'rejected' })
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
          onClick={handleAccept}
          disabled={isSaving || enquiry?.status === 'accepted'}
        >
          Accept
        </button>
        <button
          className="enquiry-actions__btn enquiry-actions__btn--reject"
          onClick={handleReject}
          disabled={isSaving || enquiry?.status === 'rejected'}
        >
          Reject
        </button>
      </div>

      <div className="enquiry-actions__respond">
        <textarea
          className="enquiry-actions__textarea"
          placeholder="Write a custom response..."
          value={responseMsg}
          onChange={e => setResponseMsg(e.target.value)}
        />
        <button
          className="enquiry-actions__send"
          onClick={handleRespond}
          disabled={isSaving || !responseMsg.trim()}
        >
          Send Response
        </button>
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
