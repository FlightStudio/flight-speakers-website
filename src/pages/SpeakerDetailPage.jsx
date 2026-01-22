import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { speakers } from '../data/speakers'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import './SpeakerDetailPage.css'

function SpeakerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const speaker = useMemo(() =>
    speakers.find(s => s.id === id),
    [id]
  )

  const relatedSpeakers = useMemo(() => {
    if (!speaker) return []
    return speakers
      .filter(s => s.id !== speaker.id)
      .filter(s => s.topics.some(t => speaker.topics.includes(t)))
      .slice(0, 4)
  }, [speaker])

  if (!speaker) {
    return (
      <div className="speaker-detail-page">
        <div className="container">
          <div className="speaker-not-found">
            <h1>Speaker Not Found</h1>
            <p>The speaker you're looking for doesn't exist.</p>
            <Link to="/" className="btn btn-primary">Browse All Speakers</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="speaker-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="container">
          <Link to="/">Speakers</Link>
          <span className="breadcrumb__separator">/</span>
          <span>{speaker.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="speaker-hero">
        <div className="container">
          <div className="speaker-hero__grid">
            <div className="speaker-hero__image-wrapper">
              <img
                src={speaker.photo}
                alt={speaker.name}
                className="speaker-hero__image"
              />
              {speaker.featured && (
                <span className="speaker-hero__badge">Featured Speaker</span>
              )}
            </div>

            <div className="speaker-hero__content">
              <h1 className="speaker-hero__name">{speaker.name}</h1>
              <p className="speaker-hero__headline">{speaker.headline}</p>

              <div className="speaker-hero__topics">
                {speaker.topics.map((topic, index) => (
                  <span key={index} className="tag tag-accent">{topic}</span>
                ))}
              </div>

              <div className="speaker-hero__actions">
                <button
                  onClick={() => navigate(`/enquiry/${speaker.id}`)}
                  className="btn btn-primary btn-lg"
                >
                  Enquire About {speaker.name.split(' ')[0]}
                </button>
                <a href="#video" className="btn btn-secondary btn-lg">
                  Watch Reel
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section speaker-bio-section">
        <div className="container">
          <div className="speaker-bio-grid">
            <div className="speaker-bio">
              <h2>About {speaker.name}</h2>
              {speaker.bio.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <aside className="speaker-sidebar">
              <div className="sidebar-card">
                <h3>Key Topics</h3>
                <ul className="sidebar-list">
                  {speaker.topics.map((topic, index) => (
                    <li key={index}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              {speaker.audiences && (
                <div className="sidebar-card">
                  <h3>Ideal Audiences</h3>
                  <ul className="sidebar-list sidebar-list--simple">
                    {speaker.audiences.map((audience, index) => (
                      <li key={index}>{audience}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="sidebar-card sidebar-card--cta">
                <h3>Interested in {speaker.name.split(' ')[0]}?</h3>
                <p>Get in touch to check availability and discuss your event needs.</p>
                <button
                  onClick={() => navigate(`/enquiry/${speaker.id}`)}
                  className="btn btn-primary"
                >
                  Submit Enquiry
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {speaker.videoUrl && (
        <section id="video" className="section speaker-video-section">
          <div className="container">
            <h2 className="section-title text-center">Watch {speaker.name.split(' ')[0]} in Action</h2>
            <div className="video-wrapper">
              <iframe
                src={speaker.videoUrl}
                title={`${speaker.name} Speaker Reel`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>
      )}

      {/* Related Speakers */}
      {relatedSpeakers.length > 0 && (
        <section className="section related-speakers-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">You Might Also Like</h2>
              <p className="section-subtitle">Speakers with similar expertise</p>
            </div>
            <SpeakerGrid speakers={relatedSpeakers} />
          </div>
        </section>
      )}
    </div>
  )
}

export default SpeakerDetailPage
