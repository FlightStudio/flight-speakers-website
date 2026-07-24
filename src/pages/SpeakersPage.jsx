import { useState, useCallback, useMemo } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import { EASE } from '../constants/animation'
import { sessionShuffle } from '../utils/shuffle'
import './SpeakersPage.css'
import Cursor from '../components/Cursor/Cursor'

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('selectedSpeakerIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const toggleSpeakerSelect = useCallback((speakerId) => {
    setSelectedSpeakerIds(prev => {
      const next = new Set(prev)
      if (next.has(speakerId)) next.delete(speakerId)
      else next.add(speakerId)
      sessionStorage.setItem('selectedSpeakerIds', JSON.stringify([...next]))
      return next
    })
  }, [])

  const selectedSpeakers = useMemo(
    () => speakers.filter(s => selectedSpeakerIds.has(s.id)),
    [speakers, selectedSpeakerIds]
  )

  useEffect(() => {
    fetch('/api/speakers')
      .then(res => res.json())
      .then(data => {
        if (data.speakers) {
          // Same session seed as homepage, but rotate so homepage preview speakers
          // (first 6) aren't at the top of this catalogue
          const shuffled = sessionShuffle(data.speakers)
          const rotated = [...shuffled.slice(6), ...shuffled.slice(0, 6)]
          setSpeakers(rotated)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Cursor />

      <section className="section speakers-page" style={{ paddingTop: 'calc(var(--header-height) + var(--space-10))' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <motion.h1
              className='section-title'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >Our Speakers</motion.h1>

            <motion.p
              className='section-subtitle'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                marginBottom: "36px"
              }}
            >Browse our full roster of world-class speakers across every topic and industry.</motion.p>
          </motion.div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gray-400)' }}>
              Loading speakers...
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
            >
              <SpeakerGrid
                speakers={speakers}
                selectable={true}
                selectedIds={selectedSpeakerIds}
                onToggleSelect={toggleSpeakerSelect}
              />
            </motion.div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedSpeakerIds.size > 0 && (
          <motion.div
            className="speakers-page__sticky-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="speakers-page__sticky-info">
              <div className="speakers-page__sticky-avatars">
                {selectedSpeakers.slice(0, 4).map((s, i) => (
                  <img
                    key={s.id}
                    src={s.photo}
                    alt={s.name}
                    className="speakers-page__sticky-avatar"
                    style={{ zIndex: 4 - i }}
                  />
                ))}
              </div>
              <span className="speakers-page__sticky-count">
                {selectedSpeakerIds.size} speaker{selectedSpeakerIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Link
              to="/enquiry"
              state={{ selectedSpeakers }}
              className="speakers-page__sticky-cta"
            >
              Continue to Enquiry
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
