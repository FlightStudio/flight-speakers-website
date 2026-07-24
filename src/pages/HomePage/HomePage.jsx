import './HomePage.css'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useMagneticEffect } from '../../hooks/useMagneticEffect'
import { EASE } from '../../constants/animation'
import { sessionShuffle } from '../../utils/shuffle'

import Hero from './components/Hero/Hero'
import Cursor from '../../components/Cursor/Cursor'
import HowItWorks from './components/HowItWorks/HowItWorks'
import OurSpeakers from './components/OurSpeakers/OurSpeakers'
import SocialProof from './components/SocialProof/SocialProof'
import CTA from '../../components/CTA/CTA'

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

function HomePage() {
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

      <CTA speakers={speakers} />
    </div>
  )
}

export default HomePage
