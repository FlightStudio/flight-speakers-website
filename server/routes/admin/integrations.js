import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import {
  getAccountInfo,
  getList,
  trackEvent,
  createOrUpdateProfile,
} from '../../services/klaviyo.js'

const router = express.Router()

router.get('/integrations/monday', requireAdmin, async (req, res) => {
  if (!process.env.MONDAY_API_TOKEN) {
    return res.json({ success: true, connected: false, error: 'No API token configured' })
  }

  try {
    const boardId = process.env.MONDAY_BOARD_ID || '1153323847'
    const query = `query ($boardIds: [ID!]) { boards(ids: $boardIds) { id name groups { id title } } }`
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.MONDAY_API_TOKEN,
      },
      body: JSON.stringify({ query, variables: { boardIds: [String(boardId)] } }),
    })
    const data = await response.json()

    if (data.errors?.length) {
      return res.json({ success: true, connected: false, error: data.errors[0].message })
    }

    const board = data.data?.boards?.[0]
    if (!board) {
      return res.json({ success: true, connected: false, error: `Board ${boardId} not found` })
    }

    const targetGroup = board.groups?.find(g => g.id === 'group_mkvnqw22')
    res.json({
      success: true,
      connected: true,
      board: { id: board.id, name: board.name },
      group: targetGroup ? { id: targetGroup.id, title: targetGroup.title } : null,
    })
  } catch (err) {
    console.error('Monday.com health check error:', err.message)
    res.json({ success: true, connected: false, error: err.message })
  }
})

router.get('/integrations/klaviyo', requireAdmin, async (req, res) => {
  if (!process.env.KLAVIYO_API_KEY) {
    return res.json({ success: true, connected: false, error: 'No API key configured' })
  }

  try {
    const account = await getAccountInfo()

    const lists = []
    const enquiryListId = process.env.KLAVIYO_ENQUIRY_LIST_ID
    const newsletterListId = process.env.KLAVIYO_NEWSLETTER_LIST_ID

    if (enquiryListId) {
      try {
        const list = await getList(enquiryListId)
        lists.push({ ...list, type: 'enquiry' })
      } catch (err) {
        lists.push({ id: enquiryListId, type: 'enquiry', error: err.message })
      }
    }

    if (newsletterListId) {
      try {
        const list = await getList(newsletterListId)
        lists.push({ ...list, type: 'newsletter' })
      } catch (err) {
        lists.push({ id: newsletterListId, type: 'newsletter', error: err.message })
      }
    }

    res.json({ success: true, connected: true, account, lists })
  } catch (err) {
    console.error('Klaviyo health check error:', err.message)
    res.json({ success: true, connected: false, error: err.message })
  }
})

router.post('/integrations/klaviyo/test', requireAdmin, async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address required' })
  }

  if (!process.env.KLAVIYO_API_KEY) {
    return res.status(400).json({ success: false, message: 'Klaviyo API key not configured' })
  }

  try {
    await createOrUpdateProfile({
      email,
      name: 'Test User',
      organization: 'Flight Speakers (Test)',
      properties: { source: 'admin_test' },
    })

    await trackEvent('Enquiry Submitted', email, {
      name: 'Test User',
      organization: 'Flight Speakers (Test)',
      speaker_name: 'Test Speaker',
      event_date: new Date().toISOString().split('T')[0],
      brief: 'This is a test enquiry sent from the admin panel to verify Klaviyo integration.',
    })

    res.json({ success: true, message: `Test event sent to ${email}` })
  } catch (err) {
    console.error('Klaviyo test error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
