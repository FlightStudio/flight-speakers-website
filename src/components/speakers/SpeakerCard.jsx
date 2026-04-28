import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import { prefetchSpeaker, prefetchParseBrief } from '../../utils/prefetch'
import { EASE } from '../../constants/animation'
import './SpeakerCard.css'

function SpeakerCard({ speaker, showReasoning = false, reasoning = '', matchScore, searchBrief = '', selectable = false, isSelected = false, onToggleSelect }) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)
  const prefetchedRef = useRef(false)
  const topicsToShow = speaker.topics.slice(0, 2)

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <Link
        ref={cardRef}
        to={`/speakers/${speaker.id}${searchBrief ? `?brief=${encodeURIComponent(searchBrief)}` : ''}`}
        className={`speaker-card${isSelected ? ' speaker-card--selected' : ''}`}
        onMouseEnter={() => {
          setIsHovered(true)
          if (!prefetchedRef.current) {
            prefetchedRef.current = true
            prefetchSpeaker(speaker.id)
            if (searchBrief) prefetchParseBrief(searchBrief)
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Spotlight glow effect */}
        <motion.div
          className="speaker-card__spotlight"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          style={{
            background: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0.04), transparent 60%)`,
          }}
          transition={{ duration: 0.2 }}
        />

        <div className="speaker-card__image-container">
          <motion.img
            src={speaker.photo}
            alt={speaker.name}
            className="speaker-card__image"
            loading="lazy"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          {/* Video preview overlay - shows before video loads */}
          <motion.div
            className="speaker-card__video-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="speaker-card__video-indicator">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3V13L13 8L5 3Z" fill="currentColor"/>
              </svg>
              <span>Playing preview...</span>
            </div>
          </motion.div>

          {selectable && (
            <button
              type="button"
              className={`speaker-card__select${isSelected ? ' speaker-card__select--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onToggleSelect?.(speaker.id)
              }}
              aria-label={isSelected ? `Remove ${speaker.name} from brief` : `Add ${speaker.name} to brief`}
            >
              {isSelected ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </button>
          )}
        </div>

        <div className="speaker-card__content">
          <div className="speaker-card__name-row">
            <h3 className="speaker-card__name">{speaker.name}</h3>
            {matchScore != null && (
              <span className="speaker-card__match" title="AI semantic match score">
                <svg className="speaker-card__match-star" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
                </svg>
                {matchScore}% match
              </span>
            )}
          </div>

          <p className="speaker-card__headline">{speaker.headline}</p>

          {speaker.location && (
            <p className="speaker-card__location">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1.5C4.07 1.5 2.5 3.07 2.5 5C2.5 7.5 6 10.5 6 10.5S9.5 7.5 9.5 5C9.5 3.07 7.93 1.5 6 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="6" cy="5" r="1.3" fill="currentColor"/>
              </svg>
              {speaker.location}
            </p>
          )}

          <div className="speaker-card__topics">
            {topicsToShow.map((topic, idx) => (
              <motion.span
                key={idx}
                className="speaker-card__topic"
                animate={{
                  backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                }}
                transition={{ duration: 0.2 }}
              >
                {topic}
              </motion.span>
            ))}
            {speaker.topics.length > 2 && (
              <span className="speaker-card__more">+{speaker.topics.length - 2}</span>
            )}
          </div>

          {showReasoning && reasoning && (
            <div className="speaker-card__reasoning-section">
              <span className="speaker-card__reasoning-label">Custom Why</span>
              <p className="speaker-card__reasoning">{reasoning}</p>
            </div>
          )}

          <motion.div
            className="speaker-card__footer"
            animate={{ opacity: isHovered ? 1 : 0.6 }}
          >
            <span className="speaker-card__link">
              View profile
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}

export default SpeakerCard
