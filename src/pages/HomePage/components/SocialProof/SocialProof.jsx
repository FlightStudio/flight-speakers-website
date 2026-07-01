import "./SocialProof.css";

import { motion } from 'framer-motion'

import AnimatedCounter from "./components/AnimatedCounter/AnimatedCounter";

import spotlight from "../../../../assets/white-spotlight.png";

function SocialProof() {
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
    <div className="section">
      <div className="section-left">
        <div className="section-label">Our Reach</div>
      </div>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Trusted by leading,<br />organizations</h2>
        </motion.div>

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

        <div className="social-proof__metrics">
          <div className="social-proof__metric left">
            <div className="metric-container" style={{
              border: "1px solid #2CC56D"
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[0].value} suffix={stats[0].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[0].label}</span>
              {/* spotlight */}
            </div>
          </div>
          <div className="social-proof__metric right">
            <div className="metric-container" style={{
              border: "1px solid #FFCD37"
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[1].value} suffix={stats[1].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[1].label}</span>
            </div>
            <div className="metric-container" style={{
              border: "1px solid #519BFF"
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[2].value} suffix={stats[2].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[2].label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialProof;