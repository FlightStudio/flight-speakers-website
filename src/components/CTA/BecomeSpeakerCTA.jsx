import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'
import './BecomeSpeakerCTA.css'

// Public entry point to the speaker waitlist form (/join). Rendered at the
// bottom of the speakers listing and each speaker profile so prospective
// speakers can put themselves forward. The form itself lives at /join and
// feeds the admin waitlist board.
export default function BecomeSpeakerCTA() {
  return (
    <section className="become-speaker-cta" aria-labelledby="become-speaker-cta-title">
      <div className="container">
        <motion.div
          className="become-speaker-cta__panel"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <span className="become-speaker-cta__eyebrow">Join our roster</span>
          <h2 id="become-speaker-cta-title" className="become-speaker-cta__title">
            Are you a speaker?
          </h2>
          <p className="become-speaker-cta__subtitle">
            Join the voices trusted by the world&rsquo;s leading events. Tell us a
            little about yourself and our team will be in touch.
          </p>
          <Link
            to="/join"
            className="hero-search__button book-a-speaker__btn become-speaker-cta__btn"
          >
            <span>Express Interest</span>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}