import { useState, useEffect } from 'react'

export default function AdminStatCards({ activeFilter = 'all', onFilterChange }) {
  const [stats, setStats] = useState({ total: 0, new: 0, reviewed: 0, accepted: 0 })

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        const data = await res.json()
        if (data.success) setStats(data.stats)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    { label: 'Total Enquiries', value: stats.total, modifier: '', filter: 'all' },
    { label: 'New', value: stats.new, modifier: 'new', filter: 'new' },
    { label: 'Reviewed', value: stats.reviewed, modifier: 'reviewed', filter: 'reviewed' },
    { label: 'Accepted', value: stats.accepted, modifier: 'accepted', filter: 'accepted' },
  ]

  return (
    <div className="admin-stats">
      {cards.map(card => (
        <button
          key={card.label}
          className={`admin-stat-card ${card.modifier ? `admin-stat-card--${card.modifier}` : ''} ${activeFilter === card.filter ? 'admin-stat-card--active' : ''}`}
          onClick={() => onFilterChange?.(card.filter)}
        >
          <div className="admin-stat-card__label">{card.label}</div>
          <div className="admin-stat-card__value">{card.value}</div>
        </button>
      ))}
    </div>
  )
}
