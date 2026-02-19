import { Link } from 'react-router-dom'

export default function DashboardTopSpeakers({ speakers = [] }) {
  if (speakers.length === 0) return null

  return (
    <div className="dash-top-speakers">
      <h3 className="dash-panel__title">Top Speakers</h3>
      <div className="dash-top-speakers__list">
        {speakers.map((s, i) => (
          <Link
            key={s.id}
            to={`/admin/speakers/${s.id}`}
            className="dash-top-speakers__item"
          >
            <span className="dash-top-speakers__rank">#{i + 1}</span>
            <img src={s.photo} alt={s.name} className="dash-top-speakers__avatar" />
            <div className="dash-top-speakers__info">
              <div className="dash-top-speakers__name">
                {s.name}
              </div>
              <div className="dash-top-speakers__meta">
                {s.enquiries} enquiries &middot; {s.views} views
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
