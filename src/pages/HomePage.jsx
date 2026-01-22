import { useState, useMemo } from 'react'
import AISearchBar from '../components/search/AISearchBar'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import { speakers, allTopics } from '../data/speakers'
import './HomePage.css'

function HomePage() {
  const [activeFilter, setActiveFilter] = useState('all')

  const featuredSpeakers = useMemo(() =>
    speakers.filter(s => s.featured),
    []
  )

  const filteredSpeakers = useMemo(() => {
    if (activeFilter === 'all') return speakers
    if (activeFilter === 'featured') return featuredSpeakers
    return speakers.filter(s => s.topics.includes(activeFilter))
  }, [activeFilter, featuredSpeakers])

  const topicFilters = ['AI & Future of Work', 'Leadership', 'Sustainability', 'Innovation', 'Wellness']

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__badge">Curated Talent. AI-Powered Matching.</div>
            <h1 className="hero__title">
              Find the perfect speaker for your next event
            </h1>
            <p className="hero__subtitle">
              Tell us about your event and our AI will match you with exceptional speakers
              from our curated roster of industry leaders, innovators, and storytellers.
            </p>
            <AISearchBar variant="hero" />
          </div>
        </div>
        <div className="hero__bg"></div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <span className="stat__number">16</span>
              <span className="stat__label">Curated Speakers</span>
            </div>
            <div className="stat">
              <span className="stat__number">50+</span>
              <span className="stat__label">Topics Covered</span>
            </div>
            <div className="stat">
              <span className="stat__number">24hr</span>
              <span className="stat__label">Response Time</span>
            </div>
            <div className="stat">
              <span className="stat__number">AI</span>
              <span className="stat__label">Smart Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Speakers Section */}
      <section className="section speakers-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Speakers</h2>
            <p className="section-subtitle">
              Hand-picked experts who deliver transformative experiences
            </p>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            <button
              className={`filter-pill ${activeFilter === 'all' ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Speakers
            </button>
            <button
              className={`filter-pill ${activeFilter === 'featured' ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter('featured')}
            >
              Featured
            </button>
            {topicFilters.map(topic => (
              <button
                key={topic}
                className={`filter-pill ${activeFilter === topic ? 'filter-pill--active' : ''}`}
                onClick={() => setActiveFilter(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          <SpeakerGrid speakers={filteredSpeakers} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              From brief to booking in three simple steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step__number">1</div>
              <h3 className="step__title">Share Your Brief</h3>
              <p className="step__description">
                Tell us about your event, audience, and what you're looking for.
                Our AI analyzes your needs instantly.
              </p>
            </div>
            <div className="step">
              <div className="step__number">2</div>
              <h3 className="step__title">Get Matched</h3>
              <p className="step__description">
                Receive personalized speaker recommendations with clear reasoning
                for why each speaker fits your event.
              </p>
            </div>
            <div className="step">
              <div className="step__number">3</div>
              <h3 className="step__title">Book & Brief</h3>
              <p className="step__description">
                We handle the details. From contracts to content briefing,
                we ensure your speaker delivers impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to find your speaker?</h2>
            <p className="cta-subtitle">
              Submit your brief and we'll get back to you within 24 hours
              with personalized recommendations.
            </p>
            <a href="/enquiry" className="btn btn-primary btn-lg">
              Submit Your Brief
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
