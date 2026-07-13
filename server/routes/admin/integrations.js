import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'

const router = express.Router()

router.get('/integrations/monday', requireAdmin, async (req, res) => {
  if (!process.env.MONDAY_API_TOKEN) {
    return res.json({ success: true, connected: false, error: 'No API token configured' })
  }

  try {
    const boardId = process.env.MONDAY_LEADS_BOARD_ID || '5089018278'
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

    // 'topics' = "New Leads" group, where website enquiries land
    const targetGroup = board.groups?.find(g => g.id === 'topics')
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

export default router
