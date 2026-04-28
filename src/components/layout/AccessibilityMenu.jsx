import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE } from '../../constants/animation'
import './AccessibilityMenu.css'

const STORAGE_KEY = 'a11y-prefs'

const TOGGLES = [
  { key: 'largeText', label: 'Larger text', hint: 'Increase base font size by ~12%' },
  { key: 'highContrast', label: 'High contrast', hint: 'Boost text contrast site-wide' },
  { key: 'reduceMotion', label: 'Reduce motion', hint: 'Minimise animations and transitions' },
  { key: 'underlineLinks', label: 'Underline links', hint: 'Add underlines to all links' },
]

function readPrefs() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function applyPrefs(prefs) {
  const html = document.documentElement
  html.classList.toggle('a11y-large-text', !!prefs.largeText)
  html.classList.toggle('a11y-high-contrast', !!prefs.highContrast)
  html.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion)
  html.classList.toggle('a11y-underline-links', !!prefs.underlineLinks)
}

function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState(() => readPrefs())
  const wrapRef = useRef(null)

  useEffect(() => { applyPrefs(prefs) }, [prefs])

  // Allow other UI (e.g. the footer link) to open this panel.
  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('open-a11y-menu', onOpen)
    return () => window.removeEventListener('open-a11y-menu', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function reset() {
    setPrefs({})
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const activeCount = Object.values(prefs).filter(Boolean).length

  return (
    <div className="a11y-menu" ref={wrapRef}>
      <button
        type="button"
        className="a11y-menu__trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Accessibility options"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Accessibility options"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="12" cy="7" r="1.4" fill="currentColor"/>
          <path d="M7.5 10.5C9 11 10.5 11.2 12 11.2C13.5 11.2 15 11 16.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 11.2V14M12 14L9.5 18M12 14L14.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {activeCount > 0 && <span className="a11y-menu__dot" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Accessibility options"
            className="a11y-menu__panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <div className="a11y-menu__heading">Accessibility</div>
            <ul className="a11y-menu__list">
              {TOGGLES.map(t => {
                const checked = !!prefs[t.key]
                return (
                  <li key={t.key} className="a11y-menu__item">
                    <button
                      type="button"
                      className={`a11y-menu__toggle${checked ? ' a11y-menu__toggle--on' : ''}`}
                      onClick={() => toggle(t.key)}
                      role="switch"
                      aria-checked={checked}
                    >
                      <span className="a11y-menu__toggle-text">
                        <span className="a11y-menu__toggle-label">{t.label}</span>
                        <span className="a11y-menu__toggle-hint">{t.hint}</span>
                      </span>
                      <span className="a11y-menu__switch" aria-hidden="true">
                        <span className="a11y-menu__switch-thumb" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="a11y-menu__footer">
              <button type="button" className="a11y-menu__reset" onClick={reset} disabled={activeCount === 0}>
                Reset
              </button>
              <span className="a11y-menu__os-hint">
                Respects your OS preferences for motion and contrast
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccessibilityMenu
