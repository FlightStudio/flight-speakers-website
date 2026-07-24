import { Link, useNavigate } from 'react-router-dom'
import './AboutPage.css'
import { COMPARE_ROWS } from './config'

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { EASE } from '../../constants/animation';
import ScrollLetterReveal, { SECTION_TITLE_GRADIENT } from '../../components/ScrollLetterReveal/ScrollLetterReveal';

import browseSpeakers from "../../assets/browse-speakers.png";
import speaker0 from "../../assets/about-us-speakers/speaker0.png";

import star from "../../assets/star.png";
import clockIcon from "../../assets/clock-icon.png";
import starsIcon from "../../assets/stars-icon.png";
import playIcon from "../../assets/play-icon.png";
import checkIcon from "../../assets/check-icon.png";
import starIcon from "../../assets/star-icon.png";
import targetIcon from "../../assets/target-icon.png";
import lightningIcon from "../../assets/lightning-icon.png";
import spotlight from "../../assets/white-spotlight.png";
import Cursor from '../../components/Cursor/Cursor';
import CTA from '../../components/CTA/CTA';

// Animated text reveal
function RevealText({ children, delay = 0, y = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <span ref={ref} className="reveal-text">
      <motion.span
        initial={{ y: '100%' }}
        animate={isInView ? { y } : { y: '100%' }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

const sliderSpeakers = [
  speaker0,
];
const SLIDE_INTERVAL = 4_000_000_000;

function AboutPage() {
  const navigate = useNavigate();

  // Hero speaker slider — cycles through sliderSpeakers, wrapping at the end
  const [currentSpeaker, setCurrentSpeaker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeaker((i) => (i + 1) % sliderSpeakers.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Parallax scrolling
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <div className="about-page">
      <Cursor />

      {/* Hero Section */}
      <section className="about-hero" style={{
        display: "flex",
      }}>
        {/* <div className="container" style={{
          display: "flex",
          height: "100%"
        }}> */}
          <motion.div className="about-hero__content" style={{
            opacity: heroOpacity,
            y: springY,
          }}>
            <div>
              <h1 className="about-hero__title">
                <span style={{ display: "block" }}>
                  <RevealText delay={0.3}>We're rethinking</RevealText>
                </span>
                <span style={{ display: "block" }}>
                  <RevealText delay={0.4} y={-10}>the speaker bureau</RevealText>
                </span>
              </h1>
            </div>
            <motion.p
              className="about-hero__subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{
                textAlign: "left",
                color: "#C2C2C2",
                fontSize: "1.2rem",
                width: "450px",
              }}
            >
              We built Flight Speakers because we saw a gap: traditional speaker bureaus are slow, opaque, and built for volume over quality. We wanted something better. Flight Speakers combines curated talent with AI-powered matching
              to help you find the perfect voice for your event.
            </motion.p>
            <motion.button
              type="submit"
              className="hero-search__button book-a-speaker__btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                marginRight: "auto"
              }}
              onClick={() => {
                navigate('/speakers')
              }}
            >
              <img src={star} alt="star" />
              <span>Explore All Speakers</span>
            </motion.button>
          </motion.div>
          <motion.div className="speakers-slider" style={{
            flex: 1,
            position: "relative",
            opacity: heroOpacity,
            y: springY,
            maxWidth: "800px",
            zIndex: "2",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}>
            <AnimatePresence>
              <motion.img
                className='about-page-slide-speaker-image'
                key={currentSpeaker}
                src={sliderSpeakers[currentSpeaker]}
                alt=""
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  x: 60,
                  opacity: "0",
                  transition: { duration: 2, ease: EASE } }}
                transition={{ duration: 2, delay: 1.4, ease: EASE }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "right center",
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                  zIndex: 1,
                }}
              />
            </AnimatePresence>
            <motion.img
              src={null}
              alt=""
              className='hero-spotlight'
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
              style={{
                WebkitMaskImage: `url(${spotlight})`,
                maskImage: `url(${spotlight})`,
                scale: "1.5",
              }}
            />
          </motion.div>
        {/* </div> */}
      </section>

      {/* Comparison: how Flight Speakers differs from traditional bureaus. */}
      <section className="section about-compare">
        <div className="section-left">
            <motion.span
              className="section-label"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >Why Flight Speakers</motion.span>
        </div>
        <div className="container">
          <div className="section-header about-compare__header">
            <ScrollLetterReveal
              as="h2"
              className="section-title about-compare__title"
              gradient={SECTION_TITLE_GRADIENT}
              text={"Built for how brands\nactually book speakers\ntoday."}
            />
            <ScrollLetterReveal
              className="section-subtitle"
              text="Most bureaus run on rolodexes, gut feel, and PDF one-sheets. We don't. Here's the difference."
            />
          </div>

          <motion.div
            className="compare-table-wrap"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <table className="compare-table" aria-label="Flight Speakers vs traditional bureaus">
              <thead>
                <tr>
                  <th scope="col" className="compare-table__corner" aria-hidden="true"></th>
                  <th scope="col" className="compare-table__col compare-table__col--us" style={{
                    // background: "#101010",
                    // zIndex: "1",
                  }}>
                    <span className="compare-table__col-flag" style={{
                      borderBottom: "2px solid var(--color-gold)",
                      width: "80%",
                      paddingBottom: "8px",
                  }}>Flight Speakers</span>
                  </th>
                  <th scope="col" className="compare-table__col compare-table__col--them" style={{
                    // background: "#101010",
                    // zIndex: "1",
                  }}>
                    <span className="compare-table__col-name" style={{
                      borderBottom: "2px solid #4B5563",
                      width: "80%",
                      paddingBottom: "8px",
                    }}>Traditional Bureaus</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="compare-table__rowlabel">{row.label}</th>
                    <td className="compare-table__cell compare-table__cell--us">
                      <span className="compare-table__icon compare-table__icon--check" aria-label="Yes">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{row.flight}</span>
                    </td>
                    <td className="compare-table__cell compare-table__cell--them">
                      <span className="compare-table__icon compare-table__icon--cross" aria-label="No">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </span>
                      <span>{row.traditional}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="section">
        <div className="section-left">
          <motion.div
            className="section-label"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >THE DIFFERENCE</motion.div>
        </div>
        <div className="container">
          <div>
            <ScrollLetterReveal
              as="h2"
              className="section-title"
              gradient={SECTION_TITLE_GRADIENT}
              text={"Not just another bureau.\nA performance partner."}
            />
          </div>

          <div className="about-page__metrics">
            <div className="about-page__metric left">
              <motion.div
                className="metric-container red"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                style={{
                  '--accent': "#FF234B"
                }}
              >
                <img src={starsIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">
                  AI-Powered Matching
                </span>
                <span className="about-page__metric-label">Describe your event in natural language and our AI surfaces speakers who actually fit. Not just keyword matches, but genuine alignment.</span>
                <motion.img
                  src={null}
                  alt="spotlight"
                  className="about-page__spotlight red"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
              <motion.div
                className="metric-container blue"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                style={{
                  '--accent': "#519BFF"
                }}
              >
                <img src={playIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">Video-First Profiles</span>
                <span className="about-page__metric-label">See speakers in action before you book. Every profile includes
                video so you know exactly what you're getting.</span>
                <motion.img
                  src={null}
                  alt="spotlight"
                  className="about-page__spotlight blue"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
            </div>
            <div className="about-page__metric right">
              <motion.div
                className="metric-container yellow"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                style={{
                  '--accent': '#FFCD37'
                }}
              >
                <img src={clockIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">
                  24-Hour Response
                </span>
                <span className="about-page__metric-label">Every enquiry gets a human response within 24 hours. No waiting, no chasing, no endless email chains.</span>
                <motion.img
                  alt="spotlight"
                  className="about-page__spotlight yellow"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
              <motion.div
                className="metric-container purple"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                style={{
                  '--accent': '#D24BFF'
                }}
              >
                <img src={checkIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">Quality Guarantee</span>
                <span className="about-page__metric-label">We believe extraordinary events begin with extraordinary people. That's why every speaker we represent has been handpicked for their expertise, storytelling, and ability to leave a lasting impact.</span>
                <motion.img
                  alt="spotlight"
                  className="about-page__spotlight purple"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section">
        <div className="section-left">
          <motion.div
            className="section-label"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >About Us</motion.div>
        </div>
        <div className="container">
          <div>
            <ScrollLetterReveal
              as="h2"
              className="section-title"
              gradient={SECTION_TITLE_GRADIENT}
              text="Built by Flight Story"
            />
          </div>
          <div className="about-story__content">
            <ScrollLetterReveal text="Co-founded by Steven Bartlett, Flight Story believes the next generation of media companies won't be built around studios, they'll be built around creators. Flight Story Creator Media exists to help the world's most ambitious talent grow audiences, build businesses, and create lasting cultural impact. Flight Story provides the strategy, infrastructure, and opportunities that transform creators into global brands." />
            <ScrollLetterReveal text="Our experience building Steven Bartlett into one of the world's most sought-after speakers gives us a unique understanding of what event organisers value, what audiences remember, and what it takes to build a world-class speakers business." />

            {/* <ScrollLetterReveal text="Flight Story is a communications agency that works with the world's most ambitious leaders and companies. We've spent years understanding what makes a great speaker, and what makes a great event." />
            <ScrollLetterReveal text="We built Flight Speakers because we saw a gap: traditional speaker bureaus are slow, opaque, and built for volume over quality. We wanted something better." />
            <ScrollLetterReveal text="Our roster is intentionally small. Every speaker is someone we'd personally recommend. And our AI-powered matching ensures you find the right fit for your specific audience and objectives." /> */}
          </div>
          <div className="about-page__metrics">
            <div className="about-page__metric left">
              <motion.div
                className="metric-container red"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                style={{
                  '--accent': "#FF234B"
                }}
              >
                <img src={starIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">
                  Curated, Not Catalogued
                </span>
                <span className="about-page__metric-label">We say no to most speakers so we can say yes to the exceptional ones.</span>
                <motion.img
                  src={null}
                  alt="spotlight"
                  className="about-page__spotlight red"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
            </div>
            <div className="about-page__metric right flex2">
              <motion.div
                className="metric-container yellow"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                style={{
                  '--accent': '#FFCD37'
                }}
              >
                <img src={lightningIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">
                  Transparent & Fast
                </span>
                <span className="about-page__metric-label">No black boxes. Clear pricing, quick responses, honest advice.</span>
                <motion.img
                  alt="spotlight"
                  className="about-page__spotlight yellow"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
              <motion.div
                className="metric-container purple"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                style={{
                  '--accent': '#D24BFF'
                }}
              >
                <img src={targetIcon} alt="" className="metric-icon" />
                <span className="about-page__metric-value">Impact-Focused</span>
                <span className="about-page__metric-label">We measure success by the impact our speakers have on your audience  .</span>
                <motion.img
                  alt="spotlight"
                  className="about-page__spotlight purple"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* <div className="about-story__values">
            <div className="value-card">
              <h3>Curated, Not Catalogued</h3>
              <p>We say no to most speakers so we can say yes to the exceptional ones.</p>
            </div>
            <div className="value-card">
              <h3>Transparent & Fast</h3>
              <p>No black boxes. Clear pricing, quick responses, honest advice.</p>
            </div>
            <div className="value-card">
              <h3>Impact-Focused</h3>
              <p>We measure success by the impact our speakers have on your audience.</p>
            </div>
          </div> */}
        </div>
      </section>

      <CTA />
    </div>
  )
}

export default AboutPage
