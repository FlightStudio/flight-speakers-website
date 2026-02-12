import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const EASE = [0.16, 1, 0.3, 1]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function generateAvailability(speakerId, year, month) {
  const seed = hashString(`${speakerId}-${year}-${month}`)
  const rand = seededRandom(seed)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const availability = {}

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const r = rand()

    if (isWeekend) {
      availability[d] = r < 0.6 ? 'unavailable' : r < 0.85 ? 'limited' : 'available'
    } else {
      availability[d] = r < 0.2 ? 'unavailable' : r < 0.45 ? 'limited' : 'available'
    }
  }

  return availability
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function AvailabilityCalendar({ value, onChange, speakerId = '' }) {
  const today = new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value)
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    return { year: today.getFullYear(), month: today.getMonth() }
  })
  const [slideDir, setSlideDir] = useState(1)
  const containerRef = useRef(null)
  const calendarRef = useRef(null)

  const { year, month } = viewDate

  const availability = useMemo(
    () => generateAvailability(speakerId, year, month),
    [speakerId, year, month]
  )

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7
  const selectedDate = value ? new Date(value) : null

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
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange({ target: { name: 'eventDate', value: dateStr } })
    setIsOpen(false)
    // Scroll the date input back to center after calendar closes
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const isPast = (day) => {
    const d = new Date(year, month, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < todayStart
  }

  const isSelected = (day) => {
    if (!selectedDate) return false
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    )
  }

  const isToday = (day) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())

  // Availability summary for selected date
  const selectedAvail = selectedDate
    ? availability[selectedDate.getDate()]
    : null

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
          {value ? formatDisplayDate(value) : 'Select a date'}
        </span>
        {value && selectedAvail && (
          <span className={`cal-input__badge cal-input__badge--${selectedAvail}`}>
            {selectedAvail === 'available' ? 'Likely available' : selectedAvail === 'limited' ? 'Limited' : 'Booked'}
          </span>
        )}
        <svg className={`cal-input__chevron ${isOpen ? 'cal-input__chevron--open' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

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
                  const avail = availability[day]
                  const selected = isSelected(day)
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
                <span className="cal__legend-dot cal__legend-dot--limited" />
                Limited
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
