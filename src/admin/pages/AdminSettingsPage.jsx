import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function AdminSettingsPage() {
  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <h1 className="admin-page__title">Integrations</h1>
        <p className="admin-page__subtitle">Manage integrations and preferences</p>
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
          <div className="admin-settings-card__status">
            <span className="admin-settings-card__status-dot" />
            Not connected
          </div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-card__icon admin-settings-card__icon--klaviyo">
            K
          </div>
          <div className="admin-settings-card__title">Klaviyo</div>
          <div className="admin-settings-card__desc">
            Add newsletter subscribers and trigger automated email sequences for enquiry follow-ups.
          </div>
          <div className="admin-settings-card__status">
            <span className="admin-settings-card__status-dot" />
            Not connected
          </div>
        </div>
      </div>
    </motion.div>
  )
}
