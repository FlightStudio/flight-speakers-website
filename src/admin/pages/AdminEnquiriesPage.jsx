import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'
import EnquiryList from '../components/EnquiryList'

const ENGAGEMENT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'Paid', label: '$ Fee' },
  { key: 'Pro Bono', label: 'Pro Bono' },
]

export default function AdminEnquiriesPage() {
  const [engagementType, setEngagementType] = useState('all')

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <h1 className="admin-page__title">Enquiries</h1>
        <p className="admin-page__subtitle">Manage speaker enquiries and requests</p>
      </div>

      <div className="enq-type-tabs">
        {ENGAGEMENT_TABS.map(tab => (
          <button
            key={tab.key}
            className={`enq-type-tabs__tab ${engagementType === tab.key ? 'enq-type-tabs__tab--active' : ''}`}
            onClick={() => setEngagementType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <EnquiryList engagementType={engagementType} />
    </motion.div>
  )
}
