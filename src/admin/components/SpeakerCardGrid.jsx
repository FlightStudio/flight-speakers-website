import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function SpeakerCardGrid({ speakers = [] }) {
  const navigate = useNavigate()

  if (speakers.length === 0) return null

  return (
    <div className="speaker-cards">
      {speakers.map((s, i) => (
        <motion.button
          key={s.id}
          className={`speaker-card-admin${s.hidden ? ' speaker-card-admin--hidden' : ''}`}
          onClick={() => navigate(`/admin/speakers/${s.id}`)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
        >
          <div className="speaker-card-admin__photo-wrap">
            <img src={s.photo} alt={s.name} className="speaker-card-admin__photo" />
            {s.hidden && (
              <span className="speaker-card-admin__hidden-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Hidden
              </span>
            )}
          </div>
          <div className="speaker-card-admin__body">
            <div className="speaker-card-admin__name">
              {s.name}
            </div>
            <div className="speaker-card-admin__headline">{s.headline}</div>
            <div className="speaker-card-admin__stats">
              <span className="speaker-card-admin__stat">
                <strong>{s.enquiries}</strong> enquiries
              </span>
              <span className="speaker-card-admin__stat">
                <strong>{s.views}</strong> views
              </span>
              {s.avgAiScore != null && (
                <span className="speaker-card-admin__stat">
                  <span className="speaker-analytics__ai-score">{s.avgAiScore}%</span> AI
                </span>
              )}
            </div>
            <div className="speaker-card-admin__bottom">
              {s.recommendations > 0 && (
                <span className="speaker-card-admin__tag">{s.recommendations} recs</span>
              )}
              {s.addedAsExtra > 0 && (
                <span className="speaker-card-admin__tag">{s.addedAsExtra} added</span>
              )}
              {s.conversionRate > 0 && (
                <span className={`speaker-card-admin__tag ${s.conversionRate > 5 ? 'speaker-card-admin__tag--green' : ''}`}>
                  {s.conversionRate}% conv.
                </span>
              )}
              {s.feeMin != null && (
                <span className="speaker-card-admin__tag">${s.feeMin.toLocaleString()}</span>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
