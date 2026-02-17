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
          className="speaker-card-admin"
          onClick={() => navigate(`/admin/speakers/${s.id}`)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
        >
          <img src={s.photo} alt={s.name} className="speaker-card-admin__photo" />
          <div className="speaker-card-admin__body">
            <div className="speaker-card-admin__name">
              {s.name}
              {s.featured && <span className="speaker-analytics__featured">Featured</span>}
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
