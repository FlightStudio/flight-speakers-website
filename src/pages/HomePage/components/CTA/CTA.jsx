import './CTA.css';

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'

import findSpeakers from "../../../../assets/find-speakers.png";
import browseSpeakers from "../../../../assets/browse-speakers.png";

function CTA({ speakers }) {
  const navigate = useNavigate()
  const [browseHovered, setBrowseHovered] = useState(false)

  return (
    <section className="section cta-section">
      <div className="section-left">
        <span className="section-label">Get Started</span>
      </div>
      <div className="container">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Ready to find your perfect speaker?</h2>
          <p className="section-subtitle">
            Use our AI for instant recommendations, or submit a brief for personalized service within 24 hours.
          </p>
          <div className="cta-cards">
            <motion.div
              className="cta-card cta-card--ai"
              whileHover={{ y: -6 }}
              onClick={() => navigate('/search')}
            >
              <h3 className="cta-card__title">AI-Powered Search</h3>
              <p className="cta-card__subtitle">
                Describe your event and let our AI<br />find the perfect match
              </p>
              <div style={{ height: "120px" }}></div>
              <img src={findSpeakers} alt=""
                style={{
                  position: "absolute",
                  top: "0",
                  bottom: "0",
                  right: "0",
                  margin: "auto"
                }}
              />
              <motion.button
                type="submit"
                className="hero-search__button book-a-speaker__btn hide-mobile"
                whileTap={{ scale: 0.97 }}
                style={{
                  zIndex: "2",
                  padding: "8px 12px",
                  fontSize: "12px"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20.022 20.022" fill="none" aria-hidden="true">
                  <path d="M 9.451 1.29 C 9.664 0.8 10.358 0.8 10.571 1.29 L 12.945 6.76 C 13.006 6.902 13.119 7.015 13.261 7.077 L 18.732 9.451 C 19.221 9.664 19.221 10.358 18.732 10.571 L 13.261 12.945 C 13.119 13.006 13.006 13.119 12.945 13.261 L 10.571 18.732 C 10.358 19.221 9.664 19.221 9.451 18.732 L 7.077 13.261 C 7.015 13.119 6.902 13.006 6.76 12.945 L 1.29 10.571 C 0.8 10.358 0.8 9.664 1.29 9.451 L 6.76 7.077 C 6.902 7.015 7.015 6.902 7.077 6.76 L 9.451 1.29 Z" fill="currentColor" />
                </svg>
                <span className="comet-search__btn-label">Start Searching</span>
              </motion.button>
            </motion.div>

            <motion.div
              className="cta-card cta-card--browse"
              whileHover={{ y: -6 }}
              onClick={() => navigate('/speakers')}
              onHoverStart={() => setBrowseHovered(true)}
              onHoverEnd={() => setBrowseHovered(false)}
            >
              <h3 className="cta-card__title">Browse Speakers</h3>
              <p className="cta-card__subtitle">
                Explore our full roster and<br/>discover the perfect fit
              </p>
              <div style={{ height: "120px" }}></div>

              <img src={browseSpeakers} alt=""
                style={{
                  position: "absolute",
                  top: "0",
                  bottom: "0",
                  right: "0",
                  height: "100%"
                }}
              />

              <motion.button
                type="submit"
                className="hero-search__button book-a-speaker__btn hide-mobile"
                whileTap={{ scale: 0.97 }}
                style={{
                  zIndex: "2",
                  padding: "8px 12px",
                  fontSize: "12px"
                }}
              >
                <span
                  className="comet-search__btn-label"
                >View All Speakers</span>
                  
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
