import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = express.Router()

const anthropic = new Anthropic()

const EVENT_TYPES = [
  'Conference / Summit',
  'Corporate Offsite',
  'Leadership Event',
  'Product Launch',
  'Sales Kickoff',
  'Awards / Gala',
  'Internal Training',
  'Virtual Event',
  'Other',
]

const BUDGET_RANGES = [
  'Under $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000 - $100,000',
  'Over $100,000',
]

const SYSTEM_PROMPT = `You extract structured event details from a natural language brief.

Given a brief, extract any of these fields you are confident about:
- eventType: Must be one of: ${EVENT_TYPES.join(', ')}
- eventDate: In YYYY-MM-DD format if a specific date is mentioned
- eventLocation: City, country, or "Virtual"
- audienceSize: A number as a string (e.g. "500")
- engagementType: Must be "Paid" or "Pro Bono" — only if explicitly mentioned
- budgetRange: Must be one of: ${BUDGET_RANGES.join(', ')} — map any mentioned budget to the closest option regardless of currency

Rules:
- Only include fields you are confident about — do not guess
- For eventType, pick the closest match from the list
- For budgetRange, map the numeric amount to the closest range (ignore currency — just match the number)
- Return valid JSON only, no other text

Response format:
{ "extracted": { ...only confident fields... } }`

router.post('/', async (req, res) => {
  try {
    const { brief } = req.body

    if (!brief || !brief.trim()) {
      return res.status(400).json({ success: false, message: 'Brief is required' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ success: true, extracted: {}, brief })
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Brief: "${brief}"` }],
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return res.json({ success: true, extracted: {}, brief })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const extracted = parsed.extracted || {}

    // Validate extracted values
    if (extracted.eventType && !EVENT_TYPES.includes(extracted.eventType)) {
      delete extracted.eventType
    }
    if (extracted.budgetRange && !BUDGET_RANGES.includes(extracted.budgetRange)) {
      delete extracted.budgetRange
    }
    if (extracted.engagementType && !['Paid', 'Pro Bono'].includes(extracted.engagementType)) {
      delete extracted.engagementType
    }

    // If budget is extracted, ensure engagementType is set
    if (extracted.budgetRange && !extracted.engagementType) {
      extracted.engagementType = 'Paid'
    }

    res.json({ success: true, extracted, brief })
  } catch (error) {
    console.error('Parse brief error:', error.message)
    res.json({ success: true, extracted: {}, brief: req.body.brief || '' })
  }
})

export default router
