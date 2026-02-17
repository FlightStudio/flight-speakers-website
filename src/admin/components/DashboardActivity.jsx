import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function DashboardActivity({ activity = [] }) {
  if (activity.length === 0) return null

  return (
    <div className="dash-activity">
      <h3 className="dash-panel__title">Recent Activity</h3>
      <div className="dash-activity__list">
        {activity.map(a => {
          const latestDate = a.respondedAt || a.reviewedAt || a.createdAt
          return (
            <Link
              key={a.id}
              to={`/admin/enquiries/${a.id}`}
              className="dash-activity__item"
            >
              <div className="dash-activity__dot-col">
                <span className={`dash-activity__dot dash-activity__dot--${a.status}`} />
                <span className="dash-activity__line" />
              </div>
              <div className="dash-activity__content">
                <div className="dash-activity__row">
                  <span className="dash-activity__name">{a.name}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="dash-activity__sub">
                  {a.speakerName && <span>{a.speakerName}</span>}
                  {a.organization && <span>{a.organization}</span>}
                </div>
                <span className="dash-activity__time">{timeAgo(latestDate)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
