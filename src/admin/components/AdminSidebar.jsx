import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function AdminSidebar({ user, newCount = 0, onLogout }) {
  const [reviewCount, setReviewCount] = useState(0)
  const [articleDraftCount, setArticleDraftCount] = useState(0)

  useEffect(() => {
    async function fetchReviewCount() {
      try {
        const res = await fetch('/api/admin/review/counts', { credentials: 'include' })
        const data = await res.json()
        if (data.success) setReviewCount((data.counts.new || 0) + (data.counts.update || 0))
      } catch { /* ignore */ }
    }
    fetchReviewCount()
    const interval = setInterval(fetchReviewCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchArticleCounts() {
      try {
        const res = await fetch('/api/admin/articles/counts', { credentials: 'include' })
        const data = await res.json()
        if (data.success) setArticleDraftCount(data.counts.draft || 0)
      } catch { /* ignore */ }
    }
    fetchArticleCounts()
    const interval = setInterval(fetchArticleCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__logo">
        <h2>Flight Story</h2>
        <span>Admin Panel</span>
      </div>

      <div className="admin-sidebar__nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/enquiries"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Enquiries
          {newCount > 0 && <span className="admin-sidebar__badge">{newCount}</span>}
        </NavLink>

        {/* Speaker pipeline — parent is the live roster, sub-items show the
            upstream stages someone passes through to become one. Reading the
            list top-down: Speakers (destination) → Waitlist (intake) →
            New & Updates (review queue). */}
        <NavLink
          to="/admin/speakers"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Speakers
        </NavLink>

        <NavLink
          to="/admin/waitlist"
          className={({ isActive }) =>
            `admin-sidebar__link admin-sidebar__link--sub ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Waitlist
        </NavLink>

        <NavLink
          to="/admin/review"
          className={({ isActive }) =>
            `admin-sidebar__link admin-sidebar__link--sub ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          New & Updates
          {reviewCount > 0 && <span className="admin-sidebar__badge">{reviewCount}</span>}
        </NavLink>

        <NavLink
          to="/admin/articles"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          Articles
          {articleDraftCount > 0 && <span className="admin-sidebar__badge">{articleDraftCount}</span>}
        </NavLink>

        <NavLink
          to="/admin/integrations"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <svg className="admin-sidebar__icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Integrations
        </NavLink>
      </div>

      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="admin-sidebar__username">{user?.username || 'Admin'}</div>
            <div className="admin-sidebar__role">Administrator</div>
          </div>
        </div>
        <button className="admin-sidebar__logout" onClick={onLogout}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  )
}
