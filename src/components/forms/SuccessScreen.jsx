import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import SpeakerBrief from '../brief/SpeakerBrief'
import { EASE } from '../../constants/animation'

function SuccessScreen({ name, speaker, brief, selectedSpeakers = [], aiRecommendations = [] }) {
  const firstName = name ? name.split(' ')[0] : ''
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!speaker) return
    setGenerating(true)
    try {
      const doc = (
        <SpeakerBrief
          speaker={speaker}
          selectedSpeakers={selectedSpeakers}
          aiRecommendations={aiRecommendations}
          query={brief}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${speaker.name.replace(/\s+/g, '-')}-Speaker-Brief.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
      setShowShareMenu(false)
    }
  }, [speaker, selectedSpeakers, aiRecommendations, brief])

  const handleShareEmail = useCallback(() => {
    if (!speaker) return
    const subject = encodeURIComponent(`Speaker Recommendation: ${speaker.name} | Flight Speakers`)
    const topicsList = (speaker.topics || []).slice(0, 4).join(', ')
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I'd like to share a speaker recommendation with you.\n\n` +
      `${speaker.name} / ${speaker.headline}\n` +
      (topicsList ? `Topics: ${topicsList}\n` : '') +
      `\nBest regards`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setShowShareMenu(false)
  }, [speaker])

  return (
    <motion.div
      className="mstep-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="mstep-success__icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <motion.circle
            cx="32"
            cy="32"
            r="30"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          <motion.path
            d="M20 32L28 40L44 24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
          />
        </svg>
      </div>

      <motion.h2
        className="mstep-success__title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
      >
        Thank you{firstName ? `, ${firstName}` : ''}!
      </motion.h2>

      <motion.p
        className="mstep-success__message"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
      >
        We've received your enquiry and will be in touch within 24 hours with availability and recommendations.
      </motion.p>

      <motion.div
        className="mstep-success__actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1, ease: EASE }}
      >
        <Link to="/" className="mstep-success__action-btn" aria-label="Return home">
          <svg viewBox="0 0 32 32" fill="none" width="20" height="20">
            <path d="M8 24L16 6L24 24L16 18L8 24Z" fill="currentColor"/>
          </svg>
        </Link>

        {speaker && (
          <div className="mstep-success__share-wrap">
            <button
              type="button"
              className="mstep-success__action-btn"
              onClick={() => setShowShareMenu(!showShareMenu)}
              aria-label="Share brief"
              disabled={generating}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  className="mstep-success__share-menu"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <button className="mstep-success__share-option" onClick={handleDownload} disabled={generating}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {generating ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button className="mstep-success__share-option" onClick={handleShareEmail}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Share via Email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default SuccessScreen
