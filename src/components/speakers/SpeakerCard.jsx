import { Link } from 'react-router-dom'
import './SpeakerCard.css'

function SpeakerCard({ speaker, showReasoning = false, reasoning = '' }) {
  const topicsToShow = speaker.topics.slice(0, 3)

  return (
    <Link to={`/speakers/${speaker.id}`} className="speaker-card">
      <div className="speaker-card__image-wrapper">
        <img
          src={speaker.photo}
          alt={speaker.name}
          className="speaker-card__image"
          loading="lazy"
        />
        {speaker.featured && (
          <span className="speaker-card__featured-badge">Featured</span>
        )}
      </div>

      <div className="speaker-card__content">
        <h3 className="speaker-card__name">{speaker.name}</h3>
        <p className="speaker-card__headline">{speaker.headline}</p>

        <div className="speaker-card__topics">
          {topicsToShow.map((topic, index) => (
            <span key={index} className="tag tag-accent">{topic}</span>
          ))}
          {speaker.topics.length > 3 && (
            <span className="speaker-card__more">+{speaker.topics.length - 3}</span>
          )}
        </div>

        {showReasoning && reasoning && (
          <p className="speaker-card__reasoning">{reasoning}</p>
        )}
      </div>

      <div className="speaker-card__cta">
        <span className="speaker-card__view-link">View Profile</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}

export default SpeakerCard
