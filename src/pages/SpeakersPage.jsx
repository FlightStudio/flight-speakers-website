import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import { EASE } from '../constants/animation'

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/speakers')
      .then(res => res.json())
      .then(data => {
        if (data.speakers) setSpeakers(data.speakers)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="section" style={{ paddingTop: 'calc(var(--header-height) + var(--space-10))' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
              Our Speakers
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-gray-600)', maxWidth: 560, marginBottom: 'var(--space-10)' }}>
              Browse our full roster of world-class speakers across every topic and industry.
            </p>
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
              <SpeakerGrid speakers={speakers} />
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}
