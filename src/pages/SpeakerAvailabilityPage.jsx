import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../constants/animation'
import './SpeakerAvailabilityPage.css'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function readToken() {
  if (typeof window === 'undefined') return ''
  return window.location.hash.replace(/^#/, '')
}

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildMonths(today) {
  const months = []
  for (let i = 0; i < 12; i++) {
    const m = (today.getMonth() + i) % 12
    const y = today.getFullYear() + Math.floor((today.getMonth() + i) / 12)
    months.push({ year: y, month: m })
  }
  return months
}

export default function SpeakerAvailabilityPage() {
  const [token] = useState(readToken)
  const [status, setStatus] = useState('loading') // loading | valid | invalid | saving | saved
  const [error, setError] = useState('')
  const [speaker, setSpeaker] = useState(null)
  const [blocked, setBlocked] = useState(() => new Set())
  const [savedBlocked, setSavedBlocked] = useState(() => new Set())

  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => today.toISOString().slice(0, 10), [today])
  const months = useMemo(() => buildMonths(today), [today])

  const dirty = useMemo(() => {
    if (blocked.size !== savedBlocked.size) return true
    for (const d of blocked) if (!savedBlocked.has(d)) return true
    return false
  }, [blocked, savedBlocked])

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid link.')
      setStatus('invalid')
      return
    }
    fetch('/api/availability/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          const set = new Set(data.blocked || [])
          setBlocked(set)
          setSavedBlocked(new Set(set))
          setStatus('valid')
        } else {
          setError(data.message || 'Invalid link')
          setStatus('invalid')
        }
      })
      .catch(() => {
        setError('Unable to load. Please try again.')
        setStatus('invalid')
      })
  }, [token])

  const toggleDay = (iso) => {
    if (iso < todayIso) return
    setBlocked(prev => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  const handleSave = async () => {
    setStatus('saving')
    try {
      const res = await fetch('/api/availability/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, blocked: Array.from(blocked) }),
      })
      const data = await res.json()
      if (data.success) {
        const set = new Set(data.blocked || [])
        setBlocked(set)
        setSavedBlocked(new Set(set))
        setStatus('saved')
        setTimeout(() => setStatus('valid'), 1800)
      } else {
        setError(data.message || 'Failed to save')
        setStatus('valid')
      }
    } catch {
      setError('Failed to save. Please try again.')
      setStatus('valid')
    }
  }

  if (status === 'loading') {
    return (
      <div className="avail-page">
        <div className="avail-page__loading">Loading…</div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="avail-page">
        <div className="avail-page__invalid">
          <h1>Link expired</h1>
          <p>{error}</p>
          <p>Please contact Flight Speakers for a fresh link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="avail-page">
      <motion.header
        className="avail-page__header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {speaker?.photo && (
          <img className="avail-page__photo" src={speaker.photo} alt="" />
        )}
        <div>
          <h1 className="avail-page__title">
            {speaker?.name ? `${speaker.name}'s availability` : 'Availability'}
          </h1>
          <p className="avail-page__subtitle">
            Tap any future day to mark it as <strong>booked</strong>. We'll only show
            clients dates you can actually do.
          </p>
        </div>
      </motion.header>

      <main className="avail-page__months">
        {months.map(({ year, month }) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7
          return (
            <section key={`${year}-${month}`} className="avail-month">
              <h2 className="avail-month__label">{MONTHS[month]} {year}</h2>
              <div className="avail-month__days-header">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="avail-month__grid">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${i}`} className="avail-cell avail-cell--empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const iso = toIso(year, month, day)
                  const past = iso < todayIso
                  const isBlocked = blocked.has(iso)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        'avail-cell',
                        past && 'avail-cell--past',
                        isBlocked && 'avail-cell--blocked',
                      ].filter(Boolean).join(' ')}
                      onClick={() => toggleDay(iso)}
                      disabled={past}
                    >
                      <span>{day}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      <div className="avail-page__save-bar">
        <span className="avail-page__count">
          {blocked.size === 0
            ? 'No dates blocked'
            : `${blocked.size} date${blocked.size === 1 ? '' : 's'} blocked`}
        </span>
        <button
          className="avail-page__save-btn"
          onClick={handleSave}
          disabled={!dirty || status === 'saving'}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
