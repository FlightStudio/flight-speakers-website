import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { refreshAllSpeakerStats } from '../../services/socialStats.js'

const router = express.Router()

router.post('/social-stats/refresh', requireAdmin, async (req, res) => {
  try {
    refreshAllSpeakerStats().catch(err => {
      console.error('[SocialStats] Manual refresh failed:', err.message)
    })
    res.json({ success: true, message: 'Social stats refresh started' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to start refresh' })
  }
})

export default router
