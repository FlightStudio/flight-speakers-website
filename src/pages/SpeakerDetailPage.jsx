import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import './SpeakerDetailPage.css'

function SpeakerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [speaker, setSpeaker] = useState(null)
  const [relatedSpeakers, setRelatedSpeakers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setSpeaker(null)
    setRelatedSpeakers([])

    fetch(`/api/speakers/${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          setRelatedSpeakers(data.relatedSpeakers || [])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load speaker:', err)
        setLoading(false)
      })
  }, [id])

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

              <div className="speaker-hero__topics">
                {speaker.topics.map((topic, index) => (
                  <span key={index} className="speaker-hero__topic">
                    {topic}
                  </span>
                ))}
              </div>

              <div className="speaker-hero__actions">
                <motion.button
                  onClick={() => navigate(`/enquiry/${speaker.id}`)}
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
                  onClick={() => navigate(`/enquiry/${speaker.id}`)}
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
              onClick={() => navigate(`/enquiry/${speaker.id}`)}
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
