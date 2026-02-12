import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import { prefetchSpeaker, prefetchParseBrief } from '../utils/prefetch'
import './SpeakerDetailPage.css'

function formatFollowers(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}

const platformIcons = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
}

function SpeakerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const brief = searchParams.get('brief') || ''

  const enquiryPath = `/enquiry/${id}${brief ? `?brief=${encodeURIComponent(brief)}` : ''}`

  const [speaker, setSpeaker] = useState(null)
  const [relatedSpeakers, setRelatedSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [briefReasoning, setBriefReasoning] = useState('')
  const [briefScore, setBriefScore] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setSpeaker(null)
    setRelatedSpeakers([])

    fetch(`/api/speakers/${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          setRelatedSpeakers(data.relatedSpeakers || [])
          // Fire-and-forget view tracking
          fetch(`/api/speakers/${encodeURIComponent(id)}/view`, { method: 'POST' })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load speaker:', err)
        setLoading(false)
      })
  }, [id])

  // Fetch AI reasoning when arriving from search
  useEffect(() => {
    if (!brief || !id) return
    const controller = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(brief)}&limit=8`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.reasonings?.[id]) setBriefReasoning(data.reasonings[id])
          if (data.scores?.[id] != null) setBriefScore(data.scores[id])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [brief, id])

  // Prefetch on hover over any "Enquire" button
  const handleEnquireHover = useCallback(() => {
    prefetchSpeaker(id)
    if (brief) prefetchParseBrief(brief)
  }, [id, brief])

  // Navigate with speaker data in route state
  const handleEnquireClick = useCallback(() => {
    navigate(enquiryPath, { state: { speaker } })
  }, [navigate, enquiryPath, speaker])

  if (loading) {
    return (
      <div className="speaker-detail-page">
        <div className="container">
          <motion.div
            className="speaker-not-found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>Loading speaker...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!speaker) {
    return (
      <div className="speaker-detail-page">
        <div className="container">
          <motion.div
            className="speaker-not-found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Speaker Not Found</h1>
            <p>The speaker you're looking for doesn't exist or may have moved.</p>
            <Link to="/" className="btn btn-primary">Browse All Speakers</Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="speaker-detail-page">
      {/* Back nav */}
      <motion.div
        className="speaker-nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="container">
          <Link to="/" className="speaker-nav__back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All Speakers
          </Link>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="speaker-hero">
        <div className="container">
          <div className="speaker-hero__grid">
            {/* Image Side */}
            <motion.div
              className="speaker-hero__image-col"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="speaker-hero__image-wrapper">
                <img
                  src={speaker.photo}
                  alt={speaker.name}
                  className="speaker-hero__image"
                />
              </div>
              {speaker.featured && (
                <span className="speaker-hero__badge">Featured</span>
              )}
            </motion.div>

            {/* Content Side */}
            <motion.div
              className="speaker-hero__content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="speaker-hero__label">Speaker Profile</span>

              <h1 className="speaker-hero__name">{speaker.name}</h1>

              <p className="speaker-hero__headline">{speaker.headline}</p>

              {speaker.socialStats && Object.keys(speaker.socialStats).length > 0 && (
                <div className="speaker-hero__social">
                  {Object.entries(speaker.socialStats).map(([platform, data]) => {
                    const count = data.followers ?? data.subscribers ?? 0
                    if (!count) return null
                    return (
                      <span key={platform} className={`speaker-hero__social-pill speaker-hero__social-pill--${platform}`}>
                        {platformIcons[platform]}
                        {formatFollowers(count)}
                      </span>
                    )
                  })}
                </div>
              )}

              <div className="speaker-hero__topics">
                {speaker.topics.map((topic, index) => (
                  <span key={index} className="speaker-hero__topic">
                    {topic}
                  </span>
                ))}
              </div>

              <div className="speaker-hero__actions">
                <motion.button
                  onClick={handleEnquireClick}
                  onMouseEnter={handleEnquireHover}
                  className="btn btn-primary btn-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enquire Now
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>

                {speaker.videoUrl && (
                  <a href="#video" className="btn btn-secondary btn-lg">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 2.5V11.5L11.5 7L3 2.5Z" fill="currentColor"/>
                    </svg>
                    Watch Reel
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section speaker-bio-section">
        <div className="container">
          <div className="speaker-bio-grid">
            <motion.div
              className="speaker-bio"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>About {speaker.name}</h2>

              <div className="speaker-bio__content">
                {speaker.bio.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {briefReasoning && (
                <motion.div
                  className="speaker-bio__reasoning"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="speaker-bio__reasoning-header">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
                    </svg>
                    <span>Why {speaker.name} matches your brief</span>
                    {briefScore != null && (
                      <span className="speaker-bio__reasoning-score">{briefScore}% match</span>
                    )}
                  </div>
                  <p className="speaker-bio__reasoning-text">{briefReasoning}</p>
                </motion.div>
              )}
            </motion.div>

            <motion.aside
              className="speaker-sidebar"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="sidebar-card">
                <h3>Key Topics</h3>
                <ul className="sidebar-list">
                  {speaker.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>

              {speaker.audiences && (
                <div className="sidebar-card">
                  <h3>Ideal Audiences</h3>
                  <ul className="sidebar-list">
                    {speaker.audiences.map((audience, index) => (
                      <li key={index}>{audience}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="sidebar-card sidebar-card--cta">
                <h3>Ready to Book?</h3>
                <p>Get in touch to discuss your event.</p>
                <button
                  onClick={handleEnquireClick}
                  onMouseEnter={handleEnquireHover}
                  className="btn btn-primary w-full"
                >
                  Submit Enquiry
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {speaker.videoUrl && (
        <section id="video" className="section speaker-video-section">
          <div className="container">
            <motion.div
              className="video-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2>{speaker.name.split(' ')[0]} in Action</h2>
            </motion.div>

            <motion.div
              className="video-wrapper"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <iframe
                src={speaker.videoUrl}
                title={`${speaker.name} Speaker Reel`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </motion.div>
          </div>
        </section>
      )}

      {/* Related Speakers */}
      {relatedSpeakers.length > 0 && (
        <section className="section related-speakers-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-label">Explore More</span>
              <h2 className="section-title">Similar Speakers</h2>
              <p className="section-subtitle">Speakers with complementary expertise</p>
            </motion.div>
            <SpeakerGrid speakers={relatedSpeakers} />
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="section speaker-final-cta">
        <div className="container">
          <motion.div
            className="final-cta__content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to elevate your event?</h2>
            <p>Let's discuss how {speaker.name} can inspire your audience.</p>
            <motion.button
              onClick={handleEnquireClick}
              onMouseEnter={handleEnquireHover}
              className="btn btn-primary btn-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Your Enquiry
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default SpeakerDetailPage
