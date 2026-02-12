import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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

export default function DashboardNewRequests() {
  const [enquiries, setEnquiries] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/admin/enquiries?status=new&limit=4', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnquiries(data.enquiries || [])
          setTotal(data.total || 0)
        }
      })
      .catch(() => {})
  }, [])

  if (total === 0) return null

  return (
    <motion.div
      className="dash-new-requests"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dash-new-requests__header">
        <div className="dash-new-requests__title-row">
          <span className="dash-new-requests__pulse" />
          <h3 className="dash-new-requests__title">New Requests</h3>
          <span className="dash-new-requests__count">{total}</span>
        </div>
        <Link to="/admin/enquiries" className="dash-new-requests__view-all">
          View all &rarr;
        </Link>
      </div>

      <div className="dash-new-requests__cards">
        {enquiries.map((e, i) => (
          <Link
            key={e.id}
            to={`/admin/enquiries/${e.id}`}
            className="dash-new-request-card"
          >
            <div className="dash-new-request-card__top">
              <span className="dash-new-request-card__name">{e.name}</span>
              <span className="dash-new-request-card__time">{timeAgo(e.created_at)}</span>
            </div>
            {e.organization && (
              <span className="dash-new-request-card__org">{e.organization}</span>
            )}
            {e.speaker_name && (
              <span className="dash-new-request-card__speaker">{e.speaker_name}</span>
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
