import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function WhyWeAsk({ text }) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)

  const handleEnter = () => {
    clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div
      className="mstep-why"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="mstep-why__toggle" aria-expanded={isOpen}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
          <path d="M6 8.5V8M6 3.5C4.9 3.5 4.5 4.2 4.5 4.8C4.5 5.5 5.2 6 6 6V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        Why we ask
      </span>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mstep-why__tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="mstep-why__text">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WhyWeAsk
