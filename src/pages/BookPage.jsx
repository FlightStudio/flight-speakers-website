import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE } from '../constants/animation'
import './BookPage.css'

const SCATTER = [
  { x: -6, y: -5 },
  { x: 4, y: -7 },
  { x: 7, y: -4 },
  { x: -5, y: 6 },
  { x: 6, y: 5 },
  { x: -4, y: 7 },
]

function OrbAnimation() {
  return (
    <svg className="book-card__orb" viewBox="0 0 160 160">
      <motion.circle
        className="book-card__orb-ring book-card__orb-ring--outer"
        cx="80" cy="80" r="72"
        strokeDasharray="8 12"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="book-card__orb-ring book-card__orb-ring--mid"
        cx="80" cy="80" r="52"
        strokeDasharray="6 10"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="book-card__orb-ring book-card__orb-ring--inner"
        cx="80" cy="80" r="32"
        strokeDasharray="4 8"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="book-card__orb-core"
        cx="80" cy="80" r="8"
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 80px' }}
      />
    </svg>
  )
}

function SpeakerPreview({ speakers, isHovered }) {
  return (
    <div className="book-card__preview">
      {Array.from({ length: 6 }).map((_, i) => {
        const speaker = speakers[i]
        const scatter = SCATTER[i]
        return (
          <motion.div
            key={i}
            className="book-card__thumb-slot"
            animate={isHovered ? { x: scatter.x, y: scatter.y } : { x: 0, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {speaker?.photo ? (
              <img
                className="book-card__thumb"
                src={speaker.photo}
                alt={speaker.name}
                loading="lazy"
              />
            ) : (
              <div className="book-card__thumb-placeholder" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function BookPage() {
  const navigate = useNavigate()
  const [speakers, setSpeakers] = useState([])
  const [browseHovered, setBrowseHovered] = useState(false)

  useEffect(() => {
    fetch('/api/speakers?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpeakers(data.speakers.filter(s => s.photo))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="book-page">
      <motion.div
        className="book-page__header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <h1 className="book-page__title">Book a Speaker</h1>
        <p className="book-page__subtitle">Choose how you'd like to find the perfect speaker</p>
      </motion.div>

      <div className="book-options">
        {/* AI Search Card */}
        <motion.div
          className="book-card book-card--ai"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          whileHover={{ y: -6 }}
          onClick={() => navigate('/search')}
        >
          <div className="book-card__visual">
            <OrbAnimation />
          </div>
          <h2 className="book-card__title">AI-Powered Search</h2>
          <p className="book-card__subtitle">
            Describe your event and let our AI find the perfect match
          </p>
          <span className="book-card__cta">
            Start Searching
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </motion.div>

        {/* Browse Card */}
        <motion.div
          className="book-card book-card--browse"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          whileHover={{ y: -6 }}
          onClick={() => navigate('/speakers')}
          onHoverStart={() => setBrowseHovered(true)}
          onHoverEnd={() => setBrowseHovered(false)}
        >
          <div className="book-card__visual">
            <SpeakerPreview speakers={speakers} isHovered={browseHovered} />
          </div>
          <h2 className="book-card__title">Browse Speakers</h2>
          <p className="book-card__subtitle">
            Explore our full roster and discover the perfect fit
          </p>
          <span className="book-card__cta">
            View All Speakers
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </motion.div>
      </div>
    </div>
  )
}

export default BookPage
