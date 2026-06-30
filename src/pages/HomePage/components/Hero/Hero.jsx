import "./Hero.css";

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'

import GradientMesh from '../../../../components/effects/GradientMesh'
import { EASE } from '../../../../constants/animation'

import SearchBar from './components/SearchBar/SearchBar'

import heroBgTop from '../../../../assets/hero-bg-top.png';
import heroBgBottom from '../../../../assets/hero-bg-bottom.png';

// Animated text reveal
function RevealText({ children, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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
  );
}

function Hero() {
  const heroRef = useRef(null)

  // Parallax scrolling
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <section className="hero" ref={heroRef}>

      <div className="hero__background">
        <img className="hero__spotlight top" src={heroBgTop} alt="hero-bg-top" />
        <GradientMesh />
        <img className="hero__spotlight bottom" src={heroBgBottom} alt="hero-bg-bottom" />
      </div>

      <motion.div
        className="hero__content"
        style={{ opacity: heroOpacity, y: springY }}
      >
        <div className="container">
          {/* Title with reveal animation — copy from home.html */}
          <h1 className="hero__title">
            <span className="hero__title-line">
              <RevealText delay={0.3}>Bring the bold voice</RevealText>
            </span>
            <span className="hero__title-line">
              <RevealText delay={0.4}>to your stage.</RevealText>
            </span>
          </h1>

          {/* Cue line — leads into the search bar */}
          <motion.p
            className="hero__cue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Type it in.
          </motion.p>

          {/* Search Bar */}
          <SearchBar />

          {/* Example Queries */}
          {/* <motion.div
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
                    // inputRef.current?.focus()
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div> */}

        </div>
      </motion.div>
    </section>
  );
}

export default Hero;