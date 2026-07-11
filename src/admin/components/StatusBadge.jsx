import { useState, useRef, useEffect } from 'react'
import { ENQUIRY_STATUSES, STATUS_LABELS } from '../constants/statuses'

// Renders a static badge by default. Pass `onChange(status)` to make it a
// dropdown that lets the admin move the enquiry to any status.
export default function StatusBadge({ status, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const label = STATUS_LABELS[status] || status

  if (!onChange) {
    return (
      <span className={`status-badge status-badge--${status}`}>
        <span className="status-badge__dot" />
        {label}
      </span>
    )
  }

  async function handleSelect(e, next) {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false)
    if (next === status) return
    setIsSaving(true)
    try {
      await onChange(next)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <span className="status-badge__wrap" ref={wrapRef}>
      <button
        type="button"
        className={`status-badge status-badge--${status} status-badge--btn`}
        disabled={isSaving}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(o => !o)
        }}
      >
        <span className="status-badge__dot" />
        {isSaving ? 'Saving...' : label}
        <svg className="status-badge__chevron" width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="status-badge__menu" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
          {ENQUIRY_STATUSES.map(s => (
            <button
              key={s}
              type="button"
              className={`status-badge__option ${s === status ? 'status-badge__option--active' : ''}`}
              onClick={e => handleSelect(e, s)}
            >
              <span className={`status-badge status-badge--${s}`}>
                <span className="status-badge__dot" />
                {STATUS_LABELS[s]}
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
