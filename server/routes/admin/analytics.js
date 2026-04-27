import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import {
  getEnquiryStats,
  getEnquiryAnalytics,
  getDashboardAnalytics,
} from '../../db/enquiry-queries.js'

const router = express.Router()

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await getEnquiryStats(req.query.engagementType)
    res.json({ success: true, stats })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
})

router.get('/enquiry-analytics', requireAdmin, async (req, res) => {
  try {
    const analytics = await getEnquiryAnalytics(req.query.engagementType)
    res.json({ success: true, analytics })
  } catch (err) {
    console.error('Enquiry analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry analytics' })
  }
})

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 365)
    const data = await getDashboardAnalytics(days)
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('Dashboard analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' })
  }
})

export default router
