import { Link } from 'react-router-dom'
import './AboutPage.css'

const COMPARE_ROWS = [
  {
    label: 'Audience data',
    flight: 'Verified audience intelligence on every speaker — reach, demographics, engagement, region-level performance.',
    traditional: 'A bio, a showreel, and a fee. You’re booking on vibes.',
  },
  {
    label: 'Speed',
    flight: 'Shortlist in 24 hours. Direct line to the team that manages the talent.',
    traditional: 'Days of back-and-forth through layers of agents and assistants.',
  },
  {
    label: 'Roster strategy',
    flight: 'Curated, not commoditised. We represent talent we actively work with — not a directory of 5,000 names.',
    traditional: 'Wide catalogues, thin relationships. Most bureaus have never met half their roster.',
  },
  {
    label: 'Content & creative',
    flight: 'In-house production from the team behind The Diary Of A CEO. Sizzle reels, briefing decks, custom content built around your event.',
    traditional: 'A speaker headshot and a paragraph bio.',
  },
  {
    label: 'Booking experience',
    flight: 'One point of contact, end-to-end. From first enquiry through to post-event wrap.',
    traditional: 'Handed off between sales, contracts, and logistics. You re-explain yourself three times.',
  },
  {
    label: 'Post-event value',
    flight: 'Performance recap, audience reach data, content amplification across the speaker’s channels.',
    traditional: 'Invoice sent. Relationship ends.',
  },
]

function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero__content">
            <h1 className="about-hero__title">
              We're rethinking the speaker bureau
            </h1>
            <p className="about-hero__subtitle">
              Flight Speakers combines curated talent with AI-powered matching
              to help you find the perfect voice for your event.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: how Flight Speakers differs from traditional bureaus. */}
      <section className="section about-compare">
        <div className="container">
          <div className="section-header about-compare__header">
            <span className="about-compare__eyebrow">Why Flight Speakers</span>
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
                  <th scope="col" className="compare-table__col compare-table__col--us">
                    <span className="compare-table__col-flag">Flight Speakers</span>
                  </th>
                  <th scope="col" className="compare-table__col compare-table__col--them">
                    <span className="compare-table__col-name">Traditional Bureaus</span>
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
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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

          <div className="about-compare__footnote">
            Built inside <strong>Flight Story</strong> — the media company behind <strong>The Diary Of A CEO</strong>. We understand audiences because we build them.
          </div>
        </div>
      </section>


      {/* Story Section */}
      <section className="section about-story">
        <div className="container">
          <div className="about-story__grid">
            <div className="about-story__content">
              <h2>Built by Flight Story</h2>
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
            <div className="about-story__values">
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
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="section about-difference">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Makes Us Different</h2>
          </div>

          <div className="difference-grid">
            <div className="difference-card">
              <div className="difference-card__icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L19.5 13.5L29 16L19.5 18.5L16 28L12.5 18.5L3 16L12.5 13.5L16 4Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>AI-Powered Matching</h3>
              <p>
                Describe your event in natural language and our AI surfaces speakers
                who actually fit. Not just keyword matches, but genuine alignment.
              </p>
            </div>

            <div className="difference-card">
              <div className="difference-card__icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 10V16L20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>24-Hour Response</h3>
              <p>
                Every enquiry gets a human response within 24 hours. No waiting,
                no chasing, no endless email chains.
              </p>
            </div>

            <div className="difference-card">
              <div className="difference-card__icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 28V4L26 16L6 28Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Video-First Profiles</h3>
              <p>
                See speakers in action before you book. Every profile includes
                video so you know exactly what you're getting.
              </p>
            </div>

            <div className="difference-card">
              <div className="difference-card__icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M27 9L13 23L5 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Quality Guarantee</h3>
              <p>
                If a speaker doesn't deliver, we make it right. Our reputation
                depends on every engagement being exceptional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta__content">
            <h2>Ready to find your speaker?</h2>
            <p>
              Tell us about your event and we'll match you with speakers who'll
              make it unforgettable.
            </p>
            <div className="about-cta__buttons">
              <Link to="/search" className="btn btn-primary btn-lg">
                Find a Speaker
              </Link>
              <Link to="/enquiry" className="btn btn-secondary btn-lg">
                Submit a Brief
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
