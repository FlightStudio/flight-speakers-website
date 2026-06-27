import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function AdminSettingsPage() {
  const [monday, setMonday] = useState({ loading: true })

  useEffect(() => {
    fetch('/api/admin/integrations/monday', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setMonday({ loading: false, ...data }))
      .catch(() => setMonday({ loading: false, connected: false, error: 'Failed to fetch' }))
  }, [])

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <h1 className="admin-page__title">Settings</h1>
        <p className="admin-page__subtitle">Manage integrations, templates, and preferences</p>
      </div>

      {/* Integrations */}
      <div className="admin-settings-section">
        <h2 className="admin-settings-section__title">Integrations</h2>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-settings-card">
          <div className="admin-settings-card__icon admin-settings-card__icon--monday">
            M
          </div>
          <div className="admin-settings-card__title">Monday.com</div>
          <div className="admin-settings-card__desc">
            Sync accepted enquiries to Monday.com boards for project management and team collaboration.
          </div>

          {monday.loading ? (
            <div className="admin-settings-card__status">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--loading" />
              Checking...
            </div>
          ) : monday.connected ? (
            <>
              <div className="admin-settings-card__status admin-settings-card__status--connected">
                <span className="admin-settings-card__status-dot admin-settings-card__status-dot--connected" />
                Connected
              </div>
              <div className="admin-settings-card__lists">
                {monday.board && (
                  <div className="admin-settings-card__list-item">
                    <span className="admin-settings-card__list-label">Board</span>
                    <span className="admin-settings-card__list-value">{monday.board.name}</span>
                  </div>
                )}
                {monday.group && (
                  <div className="admin-settings-card__list-item">
                    <span className="admin-settings-card__list-label">Group</span>
                    <span className="admin-settings-card__list-value">{monday.group.title}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="admin-settings-card__status admin-settings-card__status--disconnected">
              <span className="admin-settings-card__status-dot admin-settings-card__status-dot--disconnected" />
              {monday.error || 'Not connected'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
