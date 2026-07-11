import "./SocialProof.css";

import { motion } from 'framer-motion'

import AnimatedCounter from "./components/AnimatedCounter/AnimatedCounter";

import spotlight from "../../../../assets/white-spotlight.png";
import forbesLogo from "../../../../assets/forbes-logo.png";
import googleLogo from "../../../../assets/google-logo.png";
import snapchatLogo from "../../../../assets/snapchat-logo.png";
import spotifyLogo from "../../../../assets/spotify-logo.png";
import youtubeLogo from "../../../../assets/youtube-logo.png";

function SocialProof() {
  const logos = [
    forbesLogo, googleLogo,
    snapchatLogo, spotifyLogo,
    youtubeLogo
  ]

  const stats = [
    { value: '260', suffix: 'K+', label: 'People Reached' },
    { value: '98', suffix: '%', label: 'Satisfaction' },
    { value: '176', suffix: '', label: 'Speaking Engagements' },
  ]

  return (
    <div className="section">
      <div className="section-left">
        <motion.span
          className="section-label"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >Our reach</motion.span>
      </div>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Trusted by leading<br />organizations</h2>
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
                  <img src={logo} alt="logo" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="social-proof__metrics">
          <div className="social-proof__metric left">
            <div className="metric-container green" style={{
              '--accent': '#D24BFF'
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[0].value} suffix={stats[0].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[0].label}</span>
              <motion.img
                alt="spotlight"
                className="social-proof__spotlight green"
                style={{
                  WebkitMaskImage: `url(${spotlight})`,
                  maskImage: `url(${spotlight})`,
                }}
              />
            </div>
          </div>
          <div className="social-proof__metric right">
            <div className="metric-container yellow" style={{
              '--accent': "#FF234B"
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[1].value} suffix={stats[1].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[1].label}</span>
              <motion.img
                src={null}
                alt="spotlight"
                className="social-proof__spotlight yellow"
                style={{
                  WebkitMaskImage: `url(${spotlight})`,
                  maskImage: `url(${spotlight})`,
                }}
              />
            </div>
            <div className="metric-container blue" style={{
              '--accent': "#519BFF"
            }}>
              <span className="social-proof__metric-value">
                <AnimatedCounter value={stats[2].value} suffix={stats[2].suffix} />
              </span>
              <span className="social-proof__metric-label">{stats[2].label}</span>
              <motion.img
                src={null}
                alt="spotlight"
                className="social-proof__spotlight blue"
                style={{
                  WebkitMaskImage: `url(${spotlight})`,
                  maskImage: `url(${spotlight})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialProof;