import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import SpeakerCard from '../components/speakers/SpeakerCard'
import GradientMesh from '../components/effects/GradientMesh'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useMagneticEffect } from '../hooks/useMagneticEffect'
import { EASE } from '../constants/animation'
import { sessionShuffle } from '../utils/shuffle'
import './HomePage.css'

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

// Animated text reveal
function RevealText({ children, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <span ref={ref} className="reveal-text">
      <motion.span
        initial={{ y: '100%' }}
        animate={isInView ? { y: 0 } : { y: '100%' }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}

// Animated counter with spring physics
function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const numericValue = parseInt(value.replace(/\D/g, ''))
    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(numericValue * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value])

  return <span ref={ref}>{count}{suffix}</span>
}

// Cursor follower glow
function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <motion.div
      className="cursor-glow"
      animate={{
        x: position.x - 200,
        y: position.y - 200,
        opacity: isVisible ? 0.6 : 0,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
    />
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

// Enhanced AI Matching Demo — pipeline inside window
function EnhancedAIDemo({ speakers: allSpeakers = [] }) {
  const containerRef = useRef(null)
  const svgWrapRef = useRef(null)
  const tokenElRefs = useRef([])
  const isInView = useInView(containerRef, { once: true, amount: 0.5 })
  const [phase, setPhase] = useState(0)
  // Real pixel-space SVG geometry. Tracks the SVG wrap's actual size and
  // recomputes paths from measured token positions, so curves don't stretch
  // when the window resizes — they follow the pills exactly.
  const [geom, setGeom] = useState({ w: 0, h: 0, paths: [] })
  const timersRef = useRef([])
  const runIdRef = useRef(0)

  // Non-purple palette: brand accent + slate / sky / teal / gold.
  const tokens = [
    { label: 'Leadership', color: '#94a3b8' },     // slate
    { label: '500 execs', color: '#38bdf8' },      // sky
    { label: 'Sales kickoff', color: '#14b8a6' },  // teal
    { label: 'Motivational', color: '#E85D4C' },   // brand accent
    { label: 'Q3', color: '#C9A227' },             // brand gold
  ]

  const demoConfig = [
    { id: 'nir-eyal', topic: 'Behaviour Design & Focus', score: 98 },
    { id: 'evy-poumpouras', topic: 'Leadership & Decision Making', score: 94 },
    { id: 'paul-c-brunson', topic: 'Emotional Intelligence', score: 91 },
  ]
  const results = demoConfig.map(d => {
    const sp = allSpeakers.find(s => s.id === d.id)
    return { name: sp?.name || d.id, topic: d.topic, score: d.score, photo: sp?.photo || '' }
  })

  const brief = 'We need a high-energy leadership speaker for our Q3 sales kickoff with 500 executives...'
  const [typedText, setTypedText] = useState('')

  // Timing constants
  const TOKEN_STAGGER = 600      // ms between each token appearing
  const PATH_DRAW_DUR = 1.0      // seconds for each path line to draw
  const DOT_DUR = 2.2            // seconds for each dot to travel
  const DOT_STAGGER = 0.55       // seconds between each dot dispatching

  // When everything is visible (all tokens + all paths drawn)
  const LAST_TOKEN_DELAY = (tokens.length - 1) * (TOKEN_STAGGER / 1000) // 2.4s
  const ALL_VISIBLE_AT = LAST_TOKEN_DELAY + 0.45 + PATH_DRAW_DUR       // ~3.85s after phase 2
  // Dots dispatch after everything is visible
  const DOTS_START = ALL_VISIBLE_AT + 0.3                               // ~4.15s after phase 2
  const LAST_DOT_DONE = DOTS_START + (tokens.length - 1) * DOT_STAGGER + DOT_DUR // ~8.55s after phase 2

  // Build a smooth bezier in pixel coords, from (sx, 0) → (endX, endY).
  // Outer tokens get more dramatic S-curves. Pure pixels — no viewBox warp.
  const buildPath = useCallback((sx, w, h) => {
    const endX = w / 2
    const endY = h - 4
    const dx = Math.abs(sx - endX)
    const spread = w === 0 ? 0 : dx / (w / 2) // 0 = center, 1 = edge
    const cp1x = sx
    const cp1y = endY * (0.55 + spread * 0.15)
    const cp2x = endX
    const cp2y = endY * (0.35 + spread * 0.1)
    return `M${sx.toFixed(1)},0 C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
  }, [])

  // Measure SVG wrap + token centres → pixel-space paths.
  const measurePaths = useCallback(() => {
    const wrap = svgWrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0) return

    const w = rect.width
    const h = rect.height

    const measured = tokenElRefs.current.map((el) => {
      if (!el) return null
      const elRect = el.getBoundingClientRect()
      const sx = (elRect.left + elRect.width / 2) - rect.left
      return buildPath(sx, w, h)
    })

    if (measured.every(Boolean)) setGeom({ w, h, paths: measured })
  }, [buildPath])

  // ResizeObserver on the SVG wrap is much smoother than a window resize
  // listener — fires per-element with browser-coalesced rAF cadence, so the
  // curves stay glued to the pills throughout the gesture.
  useEffect(() => {
    const wrap = svgWrapRef.current
    if (!wrap || typeof ResizeObserver === 'undefined') {
      // Legacy fallback (very old browsers).
      const fallback = () => requestAnimationFrame(measurePaths)
      window.addEventListener('resize', fallback)
      fallback()
      return () => window.removeEventListener('resize', fallback)
    }
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measurePaths)
    })
    ro.observe(wrap)
    // Also re-measure when each token element changes size (font load, etc.)
    tokenElRefs.current.forEach(el => el && ro.observe(el))
    document.fonts?.ready?.then(() => requestAnimationFrame(measurePaths))
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [measurePaths])

  // Fallback paths until first measurement lands (avoids a flash of nothing).
  const paths = geom.paths.length === tokens.length
    ? geom.paths
    : tokens.map((_, i) => {
        const w = geom.w || 600
        const h = geom.h || 140
        const sx = (i + 1) * (w / (tokens.length + 1))
        return buildPath(sx, w, h)
      })

  useEffect(() => {
    if (isInView) {
      runIdRef.current++
      setPhase(0)
      setTypedText('')
      timersRef.current.forEach(clearTimeout)
      // Re-measure paths after reset (tokens still in DOM at opacity 0)
      requestAnimationFrame(() => requestAnimationFrame(measurePaths))
      const phase2At = 2800
      const t = []
      t.push(setTimeout(() => setPhase(1), 300))
      t.push(setTimeout(() => {
        setPhase(2)
        // Re-measure again when tokens animate into position
        requestAnimationFrame(measurePaths)
      }, phase2At))
      // Star pulses when dots start traveling
      t.push(setTimeout(() => setPhase(3), phase2At + DOTS_START * 1000))
      // Results appear right after last dot arrives
      t.push(setTimeout(() => setPhase(4), phase2At + LAST_DOT_DONE * 1000 + 200))
      timersRef.current = t
    } else {
      timersRef.current.forEach(clearTimeout)
      setPhase(0)
      setTypedText('')
    }
    return () => timersRef.current.forEach(clearTimeout)
  }, [isInView, measurePaths])

  useEffect(() => {
    if (phase !== 1) return
    let i = 0
    const iv = setInterval(() => { i++; setTypedText(brief.slice(0, i)); if (i >= brief.length) clearInterval(iv) }, 26)
    return () => clearInterval(iv)
  }, [phase])

  return (
    <div className="ai-pipe" ref={containerRef}>
      {/* Search bar — starts compact and centered, expands to full width */}
      <motion.div
        className="ai-pipe__search"
        initial={{ width: '60%' }}
        animate={phase >= 1 ? { width: '100%' } : { width: '60%' }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ margin: '0 auto' }}
      >
        <svg className="ai-pipe__search-icon" width="14" height="14" viewBox="0 0 22 22" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div className="ai-pipe__search-text">
          {typedText || <span className="ai-pipe__placeholder">Describe your ideal speaker...</span>}
          {phase === 1 && <span className="ai-pipe__cursor" />}
        </div>
      </motion.div>

      {/* Visualization — tokens, paths, convergence */}
      <motion.div
        className="ai-pipe__viz"
        initial={{ height: 0, opacity: 0 }}
        animate={phase >= 2
          ? { height: 'auto', opacity: 1 }
          : { height: 0, opacity: 0 }
        }
        transition={{ duration: 0.6, ease: EASE }}
        onAnimationComplete={() => {
          if (phase >= 2) requestAnimationFrame(measurePaths)
        }}
      >
        {/* Token pills */}
        <div className="ai-pipe__token-row">
          {tokens.map((tk, i) => (
            <motion.span
              key={`${tk.label}-${runIdRef.current}`}
              ref={el => { tokenElRefs.current[i] = el }}
              className="ai-pipe__token"
              style={{ '--tk': tk.color }}
              initial={{ opacity: 0, y: -6 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * (TOKEN_STAGGER / 1000), duration: 0.45, ease: EASE }}
            >
              {tk.label}
            </motion.span>
          ))}
        </div>

        {/* SVG wrap — sized by CSS, paths use pixel coords matching this rect.
            No viewBox = no aspect-ratio stretch when window resizes. */}
        <div className="ai-pipe__paths-wrap" ref={svgWrapRef}>
          <svg className="ai-pipe__paths" width="100%" height="100%">
            {/* Lines — draw with each token, staggered */}
            {paths.map((d, i) => (
              <motion.path
                key={`line-${i}-${runIdRef.current}`}
                d={d}
                stroke={tokens[i].color}
                strokeWidth="1.5"
                strokeOpacity="0"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={phase >= 2 ? { pathLength: 1, strokeOpacity: 0.4 } : {}}
                transition={{
                  pathLength: { delay: i * (TOKEN_STAGGER / 1000) + 0.3, duration: PATH_DRAW_DUR, ease: EASE },
                  strokeOpacity: { delay: i * (TOKEN_STAGGER / 1000) + 0.3, duration: 0.3 },
                }}
              />
            ))}

            {/* Dots — dispatch AFTER all tokens + paths are visible */}
            {phase >= 2 && paths.length === tokens.length && tokens.map((tk, i) => {
              const begin = `${DOTS_START + i * DOT_STAGGER}s`
              const dur = `${DOT_DUR}s`
              return (
                <circle
                  key={`dot-${i}-${runIdRef.current}-${geom.w}`}
                  r="4" fill={tk.color} opacity="0"
                >
                  <animateMotion
                    dur={dur} begin={begin} fill="freeze" path={paths[i]}
                    calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1"
                  />
                  <animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.04;0.75;1" dur={dur} begin={begin} fill="freeze" />
                  <animate attributeName="r" values="3;4.5;4;2" keyTimes="0;0.05;0.8;1" dur={dur} begin={begin} fill="freeze" />
                </circle>
              )
            })}
          </svg>
        </div>

        {/* Analyzing orb at convergence */}
        <motion.div
          className="ai-pipe__orb"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            phase >= 3 ? { opacity: 1, scale: 1 } :
            phase >= 2 ? { opacity: 0.15, scale: 0.8 } :
            { opacity: 0, scale: 0.5 }
          }
          transition={{ duration: 0.5, ease: EASE }}
        >
          {phase >= 3 && (
            <motion.div
              className="ai-pipe__orb-ring ai-pipe__orb-ring--outer"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {phase >= 3 && (
            <motion.div
              className="ai-pipe__orb-ring ai-pipe__orb-ring--inner"
              animate={{ rotate: -360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <motion.div
            className="ai-pipe__orb-core"
            animate={phase >= 3 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Results */}
        <div className="ai-pipe__results">
          {results.map((s, i) => (
            <motion.div
              key={s.name}
              className="ai-pipe__result"
              initial={{ opacity: 0, y: 12 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ delay: i * 0.12, duration: 0.4, ease: EASE }}
            >
              <img className="ai-pipe__result-av" src={s.photo} alt={s.name} />
              <div className="ai-pipe__result-info">
                <span className="ai-pipe__result-name">{s.name}</span>
                <span className="ai-pipe__result-topic">{s.topic}</span>
              </div>
              <motion.span
                className="ai-pipe__result-score"
                initial={{ scale: 0 }}
                animate={phase >= 4 ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 300, damping: 15 }}
              >
                {s.score}%
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        className="ai-pipe__footer"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link to="/search" className="ai-pipe__cta">
          Try it yourself
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </motion.div>
    </div>
  )
}

// Social Proof Bar Component
function SocialProofBar() {
  const logos = [
    'Adobe', 'Spotify', 'Google', 'LinkedIn', 'Meta',
    'Microsoft', 'PwC', 'Deloitte', 'Mastercard', 'Revolut'
  ]

  const stats = [
    { value: '260', suffix: 'K+', label: 'People Reached' },
    { value: '98', suffix: '%', label: 'Satisfaction' },
    { value: '176', suffix: '', label: 'Speaking Engagements' },
  ]

  return (
    <div className="social-proof">
      <div className="social-proof__metrics">
        {stats.map((stat, i) => (
          <div key={i} className="social-proof__metric">
            <span className="social-proof__metric-value">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </span>
            <span className="social-proof__metric-label">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="social-proof__label">Trusted by leading organizations</div>
      <div className="social-proof__track">
        <motion.div
          className="social-proof__logos"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...logos, ...logos].map((logo, i) => (
            <div key={i} className="social-proof__logo">
              {/* Grey placeholder box for logo */}
              <div className="social-proof__logo-placeholder">
                <span>{logo}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [hoveredStep, setHoveredStep] = useState(null)
  const inputRef = useRef(null)
  const heroRef = useRef(null)

  // Parallax scrolling
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 })

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

  const filterOptions = ['all', 'leadership', 'entrepreneurship', 'performance', 'wellness']

  const filteredSpeakers = useMemo(() => {
    if (activeFilter === 'all') return speakers
    return speakers.filter(s =>
      s.topics?.some(t => t.toLowerCase().includes(activeFilter.toLowerCase()))
    )
  }, [speakers, activeFilter])

  // Typing animation for placeholder
  const placeholders = [
    "I need a leadership speaker for 500 executives...",
    "Inspirational women in business for our conference...",
    "High-energy performance speaker for sales kickoff...",
    "Wellness and resilience expert for corporate retreat...",
  ]

  useEffect(() => {
    if (searchQuery || isFocused) return

    let currentIndex = 0
    let currentChar = 0
    let isDeleting = false
    let timeout

    const type = () => {
      const currentText = placeholders[currentIndex]

      if (!isDeleting) {
        setTypingText(currentText.slice(0, currentChar + 1))
        currentChar++
        if (currentChar === currentText.length) {
          timeout = setTimeout(() => { isDeleting = true; type() }, 2000)
          return
        }
      } else {
        setTypingText(currentText.slice(0, currentChar))
        currentChar--
        if (currentChar === 0) {
          isDeleting = false
          currentIndex = (currentIndex + 1) % placeholders.length
        }
      }
      timeout = setTimeout(type, isDeleting ? 20 : 40)
    }

    timeout = setTimeout(type, 1000)
    return () => clearTimeout(timeout)
  }, [searchQuery, isFocused])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="home-page">
      <CursorGlow />
      <FloatingParticles />

      {/* ========== HERO ========== */}
      <section className="hero" ref={heroRef}>
        <div className="hero__background">
          <GradientMesh />
        </div>

        <motion.div
          className="hero__content"
          style={{ opacity: heroOpacity, y: springY }}
        >
          <div className="container">
            {/* Title with reveal animation */}
            <h1 className="hero__title">
              <span className="hero__title-line">
                <RevealText delay={0.3}>Find the voice that</RevealText>
              </span>
              <span className="hero__title-line hero__title-emphasis">
                <RevealText delay={0.4}>transforms your event</RevealText>
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              className="hero__subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Describe your event in natural language. Our AI matches you with
              world-class speakers who will captivate your audience.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              className="hero-search"
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className={`hero-search__container ${isFocused ? 'hero-search__container--focused' : ''}`}>
                <div className="hero-search__icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="hero-search__input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="hero-search__input"
                    placeholder=""
                  />
                  {!searchQuery && (
                    <span className="hero-search__placeholder">
                      {isFocused ? 'Describe your event and ideal speaker...' : typingText}
                      {!isFocused && <span className="hero-search__cursor">|</span>}
                    </span>
                  )}
                </div>

                <motion.button
                  type="submit"
                  className="hero-search__button"
                  disabled={!searchQuery.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Find Speakers</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              </div>
            </motion.form>

            {/* Example Queries */}
            <motion.div
              className="hero-examples"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <span className="hero-examples__label">Try an example:</span>
              <div className="hero-examples__list">
                {[
                  'Women in business conference for 500 attendees',
                  'Leadership keynote for executive summit',
                  'Motivational speaker for sales kickoff',
                  'Corporate wellness retreat for executives'
                ].map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    className="hero-examples__item"
                    onClick={() => {
                      setSearchQuery(example)
                      inputRef.current?.focus()
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ========== HOW IT WORKS — Pipeline in window ========== */}
      <section className="section ai-demo-section">
        <div className="container">
          <div className="ai-demo-layout">
            <motion.div
              className="ai-demo-layout__text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-label">How It Works</span>
              <h2 className="section-title">AI-powered<br/>speaker matching</h2>
              <p className="section-subtitle">
                Describe your event in plain language. Our AI extracts what matters, scans our curated roster, and surfaces the speakers who'll make the biggest impact.
              </p>
              <div className="ai-demo-layout__steps">
                {[
                  { num: '01', title: 'Describe', desc: 'Tell us about your event, audience & goals', detail: 'Share your event type, audience size, dates, location, and what you want the speaker to achieve' },
                  { num: '02', title: 'Extract', desc: 'AI identifies key themes and requirements', detail: 'Our AI pulls out key themes (topics, tone, budget range, audience level) to build a smart search profile' },
                  { num: '03', title: 'Match', desc: 'Semantic search ranks the best speakers', detail: 'Semantic search ranks speakers by relevance, availability, and fit, surfacing the best matches in seconds' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className={`ai-demo-layout__step${hoveredStep === i ? ' ai-demo-layout__step--active' : ''}`}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: EASE }}
                    onHoverStart={() => setHoveredStep(i)}
                    onHoverEnd={() => setHoveredStep(null)}
                    layout
                  >
                    <span className="ai-demo-layout__step-num">{s.num}</span>
                    <div>
                      <div className="ai-demo-layout__step-header">
                        <span className="ai-demo-layout__step-title">{s.title}</span>
                        <motion.svg
                          className="ai-demo-layout__step-arrow"
                          width="12" height="12" viewBox="0 0 14 14" fill="none"
                          animate={{ rotate: hoveredStep === i ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                          <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      </div>
                      <span className="ai-demo-layout__step-desc">{s.desc}</span>
                      <AnimatePresence>
                        {hoveredStep === i && (
                          <motion.div
                            className="ai-demo-layout__step-detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: EASE }}
                          >
                            <p>{s.detail}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="ai-demo-layout__window"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            >
              {/* Window chrome */}
              <div className="ai-window__bar">
                <div className="ai-window__dots">
                  <span /><span /><span />
                </div>
                <span className="ai-window__title">flight-speakers / AI matching</span>
              </div>
              <div className="ai-window__body">
                <EnhancedAIDemo speakers={speakers} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SPEAKER CATALOGUE ========== */}
      <section className="section speakers-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Our Speakers</span>
            <h2 className="section-title">Exceptional talent, vetted for excellence</h2>
            <p className="section-subtitle">
              Each speaker is personally selected for their ability to captivate and inspire.
            </p>
          </motion.div>

          {/* Filter Chips */}
          <motion.div
            className="filter-chips"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`filter-chip ${activeFilter === filter ? 'filter-chip--active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Speaker Carousel */}
          <div className="speakers-carousel">
            <button
              className="speakers-carousel__arrow speakers-carousel__arrow--left"
              onClick={() => {
                const track = document.querySelector('.speakers-carousel__track')
                if (track) track.scrollBy({ left: -track.offsetWidth * 0.75, behavior: 'smooth' })
              }}
              aria-label="Previous speakers"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="speakers-carousel__track">
              {filteredSpeakers.map((speaker, i) => (
                <motion.div
                  key={speaker.id}
                  className="speakers-carousel__item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <SpeakerCard speaker={speaker} />
                </motion.div>
              ))}
            </div>
            <button
              className="speakers-carousel__arrow speakers-carousel__arrow--right"
              onClick={() => {
                const track = document.querySelector('.speakers-carousel__track')
                if (track) track.scrollBy({ left: track.offsetWidth * 0.75, behavior: 'smooth' })
              }}
              aria-label="Next speakers"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <motion.div
            className="section-cta"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/speakers" className="btn btn-secondary btn-lg">
              Explore All Speakers
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== TRUSTED BY ========== */}
      <SocialProofBar />

      {/* ========== CTA ========== */}
      <CtaSection speakers={speakers} />
    </div>
  )
}

export default HomePage
