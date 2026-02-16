import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardNewRequests from '../components/DashboardNewRequests'
import DashboardTopSpeakers from '../components/DashboardTopSpeakers'
import DashboardInsights from '../components/DashboardInsights'
import { EASE } from '../../constants/animation'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setDashboard(data)
      })
      .catch(() => {})
  }, [])

  if (!dashboard) {
    return (
      <div className="admin-loading" style={{ minHeight: '60vh' }}>
        <div className="admin-loading__spinner" />
        Loading dashboard...
      </div>
    )
  }

  const greeting = getGreeting()

  return (
    <motion.div
      className="admin-page admin-page--wide"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div className="dash-welcome" variants={fadeUp}>
        <div className="dash-welcome__text">
          <h1 className="dash-welcome__greeting">{greeting}, Talya</h1>
          <p className="dash-welcome__subtitle">Here's what's happening with your speakers</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <DashboardNewRequests />
      </motion.div>

      <motion.div className="dash-row" variants={fadeUp}>
        <DashboardInsights
          responseMetrics={dashboard.responseMetrics}
          popularTopics={dashboard.popularTopics}
          eventTypes={dashboard.eventTypes}
        />
        <DashboardTopSpeakers speakers={dashboard.topSpeakers} />
      </motion.div>
    </motion.div>
  )
}
