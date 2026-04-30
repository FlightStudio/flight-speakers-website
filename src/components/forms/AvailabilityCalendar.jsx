import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../constants/animation'
import { formatEventDate } from '../../utils/dateFormat'
import { useSpeakerAvailability } from './useSpeakerAvailability'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Generate month pills: current month + next 11 months
function getMonthPills(today) {
  const pills = []
  for (let i = 0; i < 12; i++) {
    const m = (today.getMonth() + i) % 12
    const y = today.getFullYear() + Math.floor((today.getMonth() + i) / 12)
    pills.push({ year: y, month: m })
  }
  return pills
}

function AvailabilityCalendar({ value, onChange, speakerId = '' }) {
  const today = new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [rangeMode, setRangeMode] = useState(() => value?.includes('|') || false)
  const [rangeStart, setRangeStart] = useState(() => {
    if (value?.includes('|')) return value.split('|')[0]
    return null
  })
  const [viewDate, setViewDate] = useState(() => {
    const dateStr = value?.includes('|') ? value.split('|')[0] : value
    if (dateStr) {
      const d = new Date(dateStr)
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    return { year: today.getFullYear(), month: today.getMonth() }
  })
  const [slideDir, setSlideDir] = useState(1)
  const containerRef = useRef(null)
  const calendarRef = useRef(null)
  const monthScrollRef = useRef(null)

  const { year, month } = viewDate
  const monthPills = useMemo(() => getMonthPills(today), [])

  // Real availability — fetch once per speaker for a 12-month forward window.
  const fromIso = useMemo(() => today.toISOString().slice(0, 10), [])
  const toIso = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }, [])
  const { blocked: blockedSet } = useSpeakerAvailability(speakerId, fromIso, toIso)

  const dayState = (day) => {
    const iso = toDateStr(year, month, day)
    return blockedSet.has(iso) ? 'unavailable' : 'available'
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7

  // Parse current value for selection highlighting
  const selectedStart = value?.includes('|') ? value.split('|')[0] : value || null
  const selectedEnd = value?.includes('|') ? value.split('|')[1] : null

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Scroll calendar into view when opened — center it on screen
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Scroll active month pill into view
  useEffect(() => {
    if (!isOpen || !monthScrollRef.current) return
    const active = monthScrollRef.current.querySelector('.cal__month-pill--active')
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [isOpen, year, month])

  const goToMonth = (y, m) => {
    const target = y * 12 + m
    const current = year * 12 + month
    setSlideDir(target > current ? 1 : -1)
    setViewDate({ year: y, month: m })
  }

  const goToPrevMonth = () => {
    setSlideDir(-1)
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setSlideDir(1)
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const handleSelectDate = (day) => {
    const dateStr = toDateStr(year, month, day)

    if (!rangeMode) {
      // Single date mode
      onChange({ target: { name: 'eventDate', value: dateStr } })
      setIsOpen(false)
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    // Range mode
    if (!rangeStart) {
      // First click — set start
      setRangeStart(dateStr)
      onChange({ target: { name: 'eventDate', value: dateStr } })
    } else {
      // Second click — set end (ensure start < end)
      let start = rangeStart
      let end = dateStr
      if (end < start) {
        ;[start, end] = [end, start]
      }
      onChange({ target: { name: 'eventDate', value: `${start}|${end}` } })
      setRangeStart(null)
      setIsOpen(false)
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  const handleToggleMode = (newMode) => {
    setRangeMode(newMode)
    setRangeStart(null)
    onChange({ target: { name: 'eventDate', value: '' } })
  }

  const isPast = (day) => {
    const d = new Date(year, month, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < todayStart
  }

  const isSelectedDay = (day) => {
    const dateStr = toDateStr(year, month, day)
    return dateStr === selectedStart || dateStr === selectedEnd
  }

  const isInRange = (day) => {
    if (!selectedStart || !selectedEnd) return false
    const dateStr = toDateStr(year, month, day)
    return dateStr > selectedStart && dateStr < selectedEnd
  }

  const isToday = (day) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())

  // Availability summary for selected date (single mode only)
  const selectedAvail = (!rangeMode && selectedStart && !selectedEnd)
    ? (() => {
        const d = new Date(selectedStart)
        if (d.getFullYear() === year && d.getMonth() === month) {
          return dayState(d.getDate())
        }
        return null
      })()
    : null

  // Display text for the trigger button
  const displayText = value ? formatEventDate(value) : 'Select a date'

  return (
    <div className="cal-wrap" ref={containerRef}>
      {/* Date input */}
      <button
        type="button"
        className={`cal-input ${isOpen ? 'cal-input--active' : ''} ${value ? 'cal-input--filled' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <svg className="cal-input__icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 7H16" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className={`cal-input__text ${!value ? 'cal-input__text--placeholder' : ''}`}>
          {displayText}
        </span>
        {value && selectedAvail && (
          <span className={`cal-input__badge cal-input__badge--${selectedAvail}`}>
            {selectedAvail === 'available' ? 'Likely available' : 'Booked'}
          </span>
        )}
        <svg className={`cal-input__chevron ${isOpen ? 'cal-input__chevron--open' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Range hint when picking */}
      {rangeMode && isOpen && rangeStart && !selectedEnd && (
        <div className="cal-range-hint">Select the end date</div>
      )}

      {/* Calendar dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cal"
            ref={calendarRef}
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.97 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ transformOrigin: 'top center' }}
          >
            {/* Mode toggle + month navigation */}
            <div className="cal__top-bar">
              <div className="cal__mode-toggle">
                <button
                  type="button"
                  className={`cal__mode-btn ${!rangeMode ? 'cal__mode-btn--active' : ''}`}
                  onClick={() => handleToggleMode(false)}
                >
                  Single
                </button>
                <button
                  type="button"
                  className={`cal__mode-btn ${rangeMode ? 'cal__mode-btn--active' : ''}`}
                  onClick={() => handleToggleMode(true)}
                >
                  Range
                </button>
              </div>
            </div>

            {/* Month scroll pills */}
            <div className="cal__month-scroll" ref={monthScrollRef}>
              {monthPills.map((pill) => {
                const isActive = pill.year === year && pill.month === month
                const label = pill.year === today.getFullYear()
                  ? SHORT_MONTHS[pill.month]
                  : `${SHORT_MONTHS[pill.month]} '${String(pill.year).slice(2)}`
                return (
                  <button
                    key={`${pill.year}-${pill.month}`}
                    type="button"
                    className={`cal__month-pill ${isActive ? 'cal__month-pill--active' : ''}`}
                    onClick={() => goToMonth(pill.year, pill.month)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Month navigation */}
            <div className="cal__header">
              <button
                type="button"
                className="cal__nav"
                onClick={goToPrevMonth}
                disabled={!canGoPrev}
                aria-label="Previous month"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="cal__month-label">{MONTHS[month]} {year}</span>
              <button
                type="button"
                className="cal__nav"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="cal__days-header">
              {DAYS.map(d => (
                <span key={d} className="cal__day-label">{d}</span>
              ))}
            </div>

            {/* Day grid */}
            <AnimatePresence mode="wait" custom={slideDir}>
              <motion.div
                key={`${year}-${month}`}
                className="cal__grid"
                custom={slideDir}
                initial={{ opacity: 0, x: slideDir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -30 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${i}`} className="cal__cell cal__cell--empty" />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const past = isPast(day)
                  const avail = dayState(day)
                  const selected = isSelectedDay(day)
                  const inRange = isInRange(day)
                  const todayMark = isToday(day)

                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        'cal__cell',
                        past && 'cal__cell--past',
                        !past && `cal__cell--${avail}`,
                        selected && 'cal__cell--selected',
                        inRange && 'cal__cell--in-range',
                        todayMark && 'cal__cell--today',
                      ].filter(Boolean).join(' ')}
                      onClick={() => !past && handleSelectDate(day)}
                      disabled={past}
                    >
                      <span className="cal__day-num">{day}</span>
                      {!past && <span className={`cal__avail-dot cal__avail-dot--${avail}`} />}
                    </button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="cal__legend">
              <span className="cal__legend-item">
                <span className="cal__legend-dot cal__legend-dot--available" />
                Likely available
              </span>
              <span className="cal__legend-item">
                <span className="cal__legend-dot cal__legend-dot--unavailable" />
                Booked
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AvailabilityCalendar
