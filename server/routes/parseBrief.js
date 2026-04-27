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
- customBudget: IMPORTANT — whenever a specific budget number appears (e.g. "20k", "£30,000", "$50k", "budget of 20000"), you MUST include this field with JUST the numeric value as a string (e.g. "20000", "30000", "50000"). "20k" = "20000", "30k" = "30000", "1.5m" = "1500000".
- budgetCurrency: If a currency symbol or name is mentioned with the budget (£, $, €, GBP, USD, EUR), return the ISO code. Only include if explicitly stated.

Rules:
- Only include fields you are confident about — do not guess
- For eventType, pick the closest match from the list
- For budgetRange, map the numeric amount to the closest range (ignore currency — just match the number)
- CRITICAL: When ANY specific budget number is mentioned (like "20k", "£30,000", etc.), you MUST include BOTH budgetRange AND customBudget
- Return valid JSON only, no other text

Response format:
{ "extracted": { ...only confident fields... } }`

router.post('/', async (req, res) => {
  try {
    const { brief } = req.body

    if (!brief || !brief.trim()) {
      return res.status(400).json({ success: false, message: 'Brief is required' })
    }

    if (brief.length > 5000) {
      return res.status(400).json({ success: false, message: 'Brief exceeds maximum length' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ success: true, extracted: {}, brief })
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Brief: "${brief}"` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock) return res.json({ success: true, extracted: {}, brief })

    const reviver = (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
      return value
    }
    const trimmed = textBlock.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    let parsed
    try {
      parsed = JSON.parse(trimmed, reviver)
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/)
      if (!match) return res.json({ success: true, extracted: {}, brief })
      parsed = JSON.parse(match[0], reviver)
    }
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
    // Validate customBudget is a numeric string
    if (extracted.customBudget) {
      const num = Number(extracted.customBudget)
      if (isNaN(num) || num <= 0) {
        delete extracted.customBudget
      } else {
        extracted.customBudget = String(num)
      }
    }
    // Validate budgetCurrency is a known ISO code
    if (extracted.budgetCurrency && !/^[A-Z]{3}$/.test(extracted.budgetCurrency)) {
      delete extracted.budgetCurrency
    }

    // Fallback: if Haiku returned a budgetRange but missed customBudget,
    // try to extract an exact number from the brief text
    if (extracted.budgetRange && !extracted.customBudget) {
      const budgetMatch = brief.match(/(?:[\$£€])\s*(\d[\d,.]*)\s*k\b/i)
        || brief.match(/(?:[\$£€])\s*(\d[\d,.]*)\s*(?:thousand|million)?/i)
        || brief.match(/\b(\d[\d,.]*)\s*k\b(?:\s*budget|\s*fee)?/i)
        || brief.match(/budget\s*(?:of|is|:)?\s*(?:[\$£€])?\s*(\d[\d,.]*)\s*k?\b/i)
      if (budgetMatch) {
        let num = parseFloat(budgetMatch[1].replace(/,/g, ''))
        // Check if the match included 'k' suffix
        const fullMatch = budgetMatch[0].toLowerCase()
        if (fullMatch.includes('k')) num *= 1000
        if (fullMatch.includes('million') || fullMatch.includes('m')) num *= 1000000
        if (num > 0 && num < 100000000) {
          extracted.customBudget = String(num)
        }
        // Also try to detect currency from the brief
        if (!extracted.budgetCurrency) {
          if (brief.includes('£')) extracted.budgetCurrency = 'GBP'
          else if (brief.includes('€')) extracted.budgetCurrency = 'EUR'
        }
      }
    }

    // If budget is extracted, ensure engagementType is set
    if ((extracted.budgetRange || extracted.customBudget) && !extracted.engagementType) {
      extracted.engagementType = 'Paid'
    }

    res.json({ success: true, extracted, brief })
  } catch (error) {
    console.error('Parse brief error:', error.message)
    res.json({ success: true, extracted: {}, brief: req.body.brief || '' })
  }
})

export default router
