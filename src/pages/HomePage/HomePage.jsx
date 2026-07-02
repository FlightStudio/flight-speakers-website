import './HomePage.css'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import { useMagneticEffect } from '../../hooks/useMagneticEffect'
import { EASE } from '../../constants/animation'
import { sessionShuffle } from '../../utils/shuffle'

import Hero from './components/Hero/Hero'
import Cursor from './components/Cursor/Cursor'
import HowItWorks from './components/HowItWorks/HowItWorks'
import OurSpeakers from './components/OurSpeakers/OurSpeakers'
import SocialProof from './components/SocialProof/SocialProof'

// Magnetic button wrapper
function MagneticButton({ children, className, ...props }) {
  const magneticRef = useMagneticEffect(0.25)
  return (
    <div ref={magneticRef} className="magnetic-wrapper">
      <motion.button
        className={className}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    </div>
  )
}

// CTA Orb Animation (matches BookPage)
function CtaOrbAnimation() {
  return (
    <svg className="cta-card__orb" viewBox="0 0 160 160">
      <motion.circle
        className="cta-card__orb-ring cta-card__orb-ring--outer"
        cx="80" cy="80" r="72"
        strokeDasharray="8 12"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="cta-card__orb-ring cta-card__orb-ring--mid"
        cx="80" cy="80" r="52"
        strokeDasharray="6 10"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="cta-card__orb-ring cta-card__orb-ring--inner"
        cx="80" cy="80" r="32"
        strokeDasharray="4 8"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <motion.circle
        className="cta-card__orb-core"
        cx="80" cy="80" r="8"
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 80px' }}
      />
    </svg>
  )
}

// CTA Speaker Preview grid (matches BookPage)
const CTA_SCATTER = [
  { x: -6, y: -5 }, { x: 4, y: -7 }, { x: 7, y: -4 },
  { x: -5, y: 6 }, { x: 6, y: 5 }, { x: -4, y: 7 },
]

function CtaSpeakerPreview({ speakers, isHovered }) {
  return (
    <div className="cta-card__preview">
      {Array.from({ length: 6 }).map((_, i) => {
        const speaker = speakers[i]
        const scatter = CTA_SCATTER[i]
        return (
          <motion.div
            key={i}
            className="cta-card__thumb-slot"
            animate={isHovered ? { x: scatter.x, y: scatter.y } : { x: 0, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {speaker?.photo ? (
              <img className="cta-card__thumb" src={speaker.photo} alt={speaker.name} loading="lazy" />
            ) : (
              <div className="cta-card__thumb-placeholder" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Floating particles
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
    }))
  , [])

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -window.innerHeight],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

function CtaSection({ speakers }) {
  const navigate = useNavigate()
  const [browseHovered, setBrowseHovered] = useState(false)

  return (
    <section className="section cta-section">
      <div className="container">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Get Started</span>
          <h2 className="cta-title">Ready to find your perfect speaker?</h2>
          <p className="cta-subtitle">
            Use our AI for instant recommendations, or submit a brief for personalized service within 24 hours.
          </p>
          <div className="cta-cards">
            <motion.div
              className="cta-card cta-card--ai"
              whileHover={{ y: -6 }}
              onClick={() => navigate('/search')}
            >
              <div className="cta-card__visual">
                <CtaOrbAnimation />
              </div>
              <h3 className="cta-card__title">AI-Powered Search</h3>
              <p className="cta-card__subtitle">
                Describe your event and let our AI find the perfect match
              </p>
              <span className="cta-card__cta cta-card__cta--green">
                Start Searching
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </motion.div>

            <motion.div
              className="cta-card cta-card--browse"
              whileHover={{ y: -6 }}
              onClick={() => navigate('/speakers')}
              onHoverStart={() => setBrowseHovered(true)}
              onHoverEnd={() => setBrowseHovered(false)}
            >
              <div className="cta-card__visual">
                <CtaSpeakerPreview speakers={speakers.slice(0, 6)} isHovered={browseHovered} />
              </div>
              <h3 className="cta-card__title">Browse Speakers</h3>
              <p className="cta-card__subtitle">
                Explore our full roster and discover the perfect fit
              </p>
              <span className="cta-card__cta cta-card__cta--dark">
                View All Speakers
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function HomePage() {
  // Initialize smooth scrolling
  useSmoothScroll()

  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [speakers, setSpeakers] = useState([])

  useEffect(() => {
    fetch('/api/speakers?limit=20')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpeakers(sessionShuffle(data.speakers))
        }
      })
      .catch(err => console.error('Failed to load speakers:', err))
  }, [])

  return (
    <div className="home-page">
      <Cursor />

      <FloatingParticles />

      <Hero />

      <HowItWorks speakers={speakers} />

      <OurSpeakers speakers={speakers} />

      <SocialProof />

      <CtaSection speakers={speakers} />
    </div>
  )
}

export default HomePage
