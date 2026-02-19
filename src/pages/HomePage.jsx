import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import SpeakerCard from '../components/speakers/SpeakerCard'
import GradientMesh from '../components/effects/GradientMesh'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useMagneticEffect } from '../hooks/useMagneticEffect'
import { EASE } from '../constants/animation'
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

// Enhanced AI Matching Demo with WebGL - Interactive Hover with Sequential Animations
function EnhancedAIDemo() {
  const steps = [
    {
      number: '01',
      title: 'Describe Your Event',
      description: 'Tell us about your audience, goals, and ideal speaker.',
    },
    {
      number: '02',
      title: 'AI Finds Matches',
      description: 'Our AI analyzes your brief to find the best speakers.',
    },
    {
      number: '03',
      title: 'Book With Confidence',
      description: 'Review recommendations and book directly.',
    },
  ]

  return (
    <div className="ai-demo-simple">
      <div className="ai-demo-simple__steps">
        {steps.map((step, i) => (
          <div key={i} className="ai-demo-step">
            <div className="ai-demo-step__number">{step.number}</div>
            <div className="ai-demo-step__content">
              <h4 className="ai-demo-step__title">{step.title}</h4>
              <p className="ai-demo-step__description">{step.description}</p>
            </div>
            {i < steps.length - 1 && <div className="ai-demo-step__arrow">→</div>}
          </div>
        ))}
      </div>

      <div className="ai-demo-simple__mockup">
        <div className="ai-demo-mockup__panel ai-demo-mockup__panel--input">
          <div className="ai-demo-mockup__header">
            <span className="ai-demo-mockup__dot"></span>
            <span>Your Brief</span>
          </div>
          <div className="ai-demo-mockup__body">
            <div className="ai-demo-mockup__placeholder-line ai-demo-mockup__placeholder-line--long"></div>
            <div className="ai-demo-mockup__placeholder-line ai-demo-mockup__placeholder-line--medium"></div>
            <div className="ai-demo-mockup__placeholder-line ai-demo-mockup__placeholder-line--short"></div>
          </div>
        </div>

        <div className="ai-demo-mockup__arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="ai-demo-mockup__panel ai-demo-mockup__panel--results">
          <div className="ai-demo-mockup__header">
            <span className="ai-demo-mockup__dot ai-demo-mockup__dot--blue"></span>
            <span>Matched Speakers</span>
          </div>
          <div className="ai-demo-mockup__body">
            {[98, 94, 91].map((match, i) => (
              <div key={i} className="ai-demo-mockup__result">
                <div className="ai-demo-mockup__avatar"></div>
                <div className="ai-demo-mockup__result-lines">
                  <div className="ai-demo-mockup__placeholder-line ai-demo-mockup__placeholder-line--name"></div>
                  <div className="ai-demo-mockup__placeholder-line ai-demo-mockup__placeholder-line--topic"></div>
                </div>
                <div className="ai-demo-mockup__match">{match}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ai-demo-simple__cta">
        <Link to="/search" className="btn btn-primary">
          Try It Yourself
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

// Social Proof Bar Component
function SocialProofBar() {
  const logos = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta',
    'Netflix', 'Spotify', 'Salesforce', 'Adobe', 'Tesla'
  ]

  const stats = [
    { value: '500', suffix: '+', label: 'Events Delivered' },
    { value: '50', suffix: 'M+', label: 'Audience Reached' },
    { value: '98', suffix: '%', label: 'Satisfaction' },
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


function HomePage() {
  // Initialize smooth scrolling
  useSmoothScroll()

  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const inputRef = useRef(null)
  const heroRef = useRef(null)

  // Parallax scrolling
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 })

  const [speakers, setSpeakers] = useState([])

  useEffect(() => {
    fetch('/api/speakers?limit=8')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSpeakers(data.speakers)
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

            {/* How It Works — compact inline strip */}
            <motion.div
              className="hero-how"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
            >
              {[
                { num: '1', label: 'Describe your event', icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M2 8H10M2 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )},
                { num: '2', label: 'AI matches speakers', icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.76 5.58L14.71 6.15L11.35 9.45L12.18 14.38L8 12.02L3.82 14.38L4.65 9.45L1.29 6.15L6.24 5.58L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )},
                { num: '3', label: 'Book with confidence', icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )},
              ].map((step, i) => (
                <div key={i} className="hero-how__step">
                  <span className="hero-how__icon">{step.icon}</span>
                  <span className="hero-how__label">{step.label}</span>
                  {i < 2 && (
                    <span className="hero-how__connector">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  )}
                </div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ========== AI MATCHING DEMO (How It Works) ========== */}
      <section className="section ai-demo-section">
        <div className="container">
          <motion.div
            className="section-header section-header--center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">How It Works</span>
            <h2 className="section-title">How our AI search works</h2>
            <p className="section-subtitle">
              Three simple steps powered by cutting-edge AI technology.
            </p>
          </motion.div>

          <EnhancedAIDemo />
        </div>
      </section>

      {/* ========== TRUSTED PARTNERS ========== */}
      <SocialProofBar />

      {/* ========== SPEAKER GRID (Bento/Masonry) ========== */}
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

          {/* Speaker Grid */}
          <div className="speakers-grid">
            {filteredSpeakers.slice(0, 6).map((speaker, i) => (
              <motion.div
                key={speaker.id}
                className="speaker-grid-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <SpeakerCard speaker={speaker} />
              </motion.div>
            ))}
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

      {/* ========== CTA ========== */}
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
            <div className="cta-buttons">
              <MagneticButton
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/search')}
              >
                Try AI Search
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticButton>
              <Link to="/enquiry" className="btn btn-secondary btn-lg">
                Submit a Brief
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
