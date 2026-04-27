import { Link } from 'react-router-dom'
import './AboutPage.css'

// Local-demo-only competitor table. `import.meta.env.DEV` is true during `npm run dev`
// and false in any production build, so this section never ships with `npm run build`.
const COMPARE_ROWS = [
  {
    label: 'Roster size',
    traditional: 'Hundreds of names, thinly known',
    flight: '13, hand-picked and personally backed',
    directory: 'Open marketplace, anyone can list',
  },
  {
    label: 'Matching method',
    traditional: 'Agent’s rolodex and best guess',
    flight: 'AI-surfaced shortlist, human reviewed',
    directory: 'Keyword / algorithm only',
  },
  {
    label: 'Response time',
    traditional: '24–48 hours for a quote',
    flight: 'Seconds to match, human follow-up same day',
    directory: 'Instant, but no follow-up',
  },
  {
    label: 'Speaker vetting',
    traditional: 'Some — depends on the agent',
    flight: 'Every speaker vetted and personally booked',
    directory: 'Self-declared only',
  },
  {
    label: 'Pricing transparency',
    traditional: 'Opaque commission, fee on request',
    flight: 'Clear fee ranges, no hidden margin',
    directory: 'Self-serve, no pricing guidance',
  },
  {
    label: 'Brief understanding',
    traditional: 'Human judgement, often surface-level',
    flight: 'AI extracts the brief, humans sense-check',
    directory: 'Keyword match only',
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
              Flight Story Speakers combines curated talent with AI-powered matching
              to help you find the perfect voice for your event.
            </p>
          </div>
        </div>
      </section>

      {/* DEV-ONLY: Competitor table for stakeholder demo. Placed at the top
          of the content (right after the hero) so it opens the argument.
          Remove the `import.meta.env.DEV &&` wrapper to ship, or delete the
          whole section. */}
      {import.meta.env.DEV && (
        <section className="section about-compare">
          <div className="container">
            <div className="section-header about-compare__header">
              <span className="about-compare__badge">Demo preview</span>
              <h2 className="section-title">How we compare</h2>
              <p className="section-subtitle">
                The speaker bureau category, rethought. Human curation meets AI speed — without the trade-offs of either extreme.
              </p>
            </div>

            <div className="compare-table-wrap">
              <table className="compare-table" aria-label="Comparison of speaker sourcing options">
                <thead>
                  <tr>
                    <th scope="col" className="compare-table__corner" aria-hidden="true"></th>
                    <th scope="col" className="compare-table__col compare-table__col--side">
                      <span className="compare-table__col-name">Traditional Bureau</span>
                      <span className="compare-table__col-sub">The old way</span>
                    </th>
                    <th scope="col" className="compare-table__col compare-table__col--center">
                      <span className="compare-table__col-flag">Flight Speakers</span>
                      <span className="compare-table__col-sub compare-table__col-sub--center">Curated + AI-powered</span>
                    </th>
                    <th scope="col" className="compare-table__col compare-table__col--side">
                      <span className="compare-table__col-name">AI Directory</span>
                      <span className="compare-table__col-sub">Self-serve marketplace</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="compare-table__rowlabel">{row.label}</th>
                      <td className="compare-table__cell compare-table__cell--side">{row.traditional}</td>
                      <td className="compare-table__cell compare-table__cell--center">{row.flight}</td>
                      <td className="compare-table__cell compare-table__cell--side">{row.directory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="about-compare__disclaimer">
              Placeholder copy for stakeholder review. Final positioning, competitors named or kept generic, and row content all still open.
            </p>
          </div>
        </section>
      )}

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
                We built Flight Story Speakers because we saw a gap: traditional
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
