import express from 'express'
import { createWaitlistEntry } from '../db/waitlist-queries.js'
import { validate, waitlistSchema } from '../schemas/index.js'

const router = express.Router()

// POST /api/waitlist — submit speaker waitlist application
router.post('/', async (req, res) => {
  const data = validate(req, res, waitlistSchema)
  if (!data) return

  try {
    const entry = await createWaitlistEntry(data)
    console.log('Waitlist entry created:', entry.id)

    res.status(201).json({
      success: true,
      id: entry.id,
    })
  } catch (error) {
    console.error('Waitlist submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.',
    })
  }
})

export default router
