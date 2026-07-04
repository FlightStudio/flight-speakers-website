import { Link } from 'react-router-dom'
import './AboutPage.css'
import { COMPARE_ROWS } from './config'

import { motion } from 'framer-motion';

import browseSpeakers from "../../assets/browse-speakers.png";

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

function AboutPage() {
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
          <div className="about-hero__content" style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "36px"
          }}>
            <div>
              <h1 className="about-hero__title" style={{
                fontSize: "5rem",
                fontWeight: "400",
                textAlign: "left",
                lineHeight: "0.9",
              }}>
                We're rethinking the speaker bureau
              </h1>
            </div>
            <p className="about-hero__subtitle" style={{
              textAlign: "left",
              color: "#C2C2C2",
              fontSize: "1.2rem",
              width: "350px",
            }}>
              Flight Speakers combines curated talent with AI-powered matching
              to help you find the perfect voice for your event.
            </p>
            <motion.button
              type="submit"
              className="hero-search__button"
              whileTap={{ scale: 0.98 }}
              style={{
                marginRight: "auto"
              }}
            >
              <img src={star} alt="star" />
              <span>Explore All Speakers</span>
            </motion.button>
          </div>
          <div className="speakers-slider" style={{
            flex: 1,
            position: "relative"
          }}>
            <img src={browseSpeakers} alt="" style={{
              height: "100%",
              position: "relative",
              right: "0",
              left: "auto",
              marginLeft: "auto",
            }} />
          </div>
        {/* </div> */}
      </section>

      {/* Comparison: how Flight Speakers differs from traditional bureaus. */}
      <section className="section about-compare">
        <div className="section-left">
            <span className="section-label">Why Flight Speakers</span>
        </div>
        <div className="container">
          <div className="section-header about-compare__header">
            <h2 className="section-title about-compare__title">
              Built for how brands actually book speakers today.
            </h2>
            <p className="section-subtitle">
              Most bureaus run on rolodexes, gut feel, and PDF one-sheets. We don't. Here's the difference.
            </p>
          </div>

          <div className="compare-table-wrap">
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
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="section">
        <div className="section-left">
          <div className="section-label">THE DIFFERENCE</div>
        </div>
        <div className="container">
          <h2 className="section-title">Not just another bureau.<br />A performance partner.</h2>

          <div className="social-proof__metrics">
            <div className="social-proof__metric left">
              <div className="metric-container red" style={{
                '--accent': "#FF234B"
              }}>
                <img src={starsIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">
                  AI-Powered Matching
                </span>
                <span className="social-proof__metric-label">Describe your event in natural language and our AI surfaces speakers who actually fit. Not just keyword matches, but genuine alignment.</span>
                <motion.img
                  // src={spotlight}
                  alt="spotlight"
                  className="social-proof__spotlight red"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
              <div className="metric-container blue" style={{
                '--accent': "#519BFF"
              }}>
                <img src={playIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">Video-First Profiles</span>
                <span className="social-proof__metric-label">See speakers in action before you book. Every profile includes
                video so you know exactly what you're getting.</span>
                <motion.img
                  // src={spotlight}
                  alt="spotlight"
                  className="social-proof__spotlight blue"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
            </div>
            <div className="social-proof__metric right">
              <div className="metric-container yellow" style={{
                '--accent': '#FFCD37'
              }}>
                <img src={clockIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">
                  24-Hour Response
                </span>
                <span className="social-proof__metric-label">Every enquiry gets a human response within 24 hours. No waiting, no chasing, no endless email chains.</span>
                <motion.img
                  alt="spotlight"
                  className="social-proof__spotlight yellow"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
              <div className="metric-container purple" style={{
                '--accent': '#D24BFF'
              }}>
                <img src={checkIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">Quality Guarantee</span>
                <span className="social-proof__metric-label">If a speaker doesn't deliver, we make it right. Our reputation depends on every engagement being exceptional.</span>
                <motion.img
                  alt="spotlight"
                  className="social-proof__spotlight purple"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section">
        <div className="section-left">
          <div className="section-label">About Us</div>
        </div>
        <div className="container">
          <h2 class="section-title">Built by Flight Story</h2>
          <div className="about-story__content">
            <p>
              Flight Story is a communications agency that works with the world's
              most ambitious leaders and companies. We've spent years understanding
              what makes a great speaker, and what makes a great event.
            </p>
            <p>
              We built Flight Speakers because we saw a gap: traditional
              speaker bureaus are slow, opaque, and built for volume over quality.
              We wanted something better.
            </p>
            <p>
              Our roster is intentionally small. Every speaker is someone we'd
              personally recommend. And our AI-powered matching ensures you find
              the right fit for your specific audience and objectives.
            </p>
          </div>
          <div className="social-proof__metrics">
            <div className="social-proof__metric left">
              <div className="metric-container red" style={{
                '--accent': "#FF234B"
              }}>
                <img src={starIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">
                  Curated, Not Catalogued
                </span>
                <span className="social-proof__metric-label">We say no to most speakers so we can say yes to the exceptional ones.</span>
                <motion.img
                  // src={spotlight}
                  alt="spotlight"
                  className="social-proof__spotlight red"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
            </div>
            <div className="social-proof__metric right">
              <div className="metric-container yellow" style={{
                '--accent': '#FFCD37'
              }}>
                <img src={lightningIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">
                  Transparent & Fast
                </span>
                <span className="social-proof__metric-label">No black boxes. Clear pricing, quick responses, honest advice.</span>
                <motion.img
                  alt="spotlight"
                  className="social-proof__spotlight yellow"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
              <div className="metric-container purple" style={{
                '--accent': '#D24BFF'
              }}>
                <img src={targetIcon} alt="" class="metric-icon" />
                <span className="social-proof__metric-value">Impact-Focused</span>
                <span className="social-proof__metric-label">We measure success by the impact our speakers have on your audience  .</span>
                <motion.img
                  alt="spotlight"
                  className="social-proof__spotlight purple"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />
              </div>
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
