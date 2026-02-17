import { Outlet } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import { useState, useEffect } from 'react'

export default function AdminLayout({ user, onLogout }) {
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    async function fetchNewCount() {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        const data = await res.json()
        if (data.success) setNewCount(data.stats.new || 0)
      } catch { /* ignore */ }
    }
    fetchNewCount()
    const interval = setInterval(fetchNewCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="admin-layout">
      <div className="admin-layout__sidebar">
        <AdminSidebar user={user} newCount={newCount} onLogout={onLogout} />
      </div>
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  )
}
