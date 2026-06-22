import { getAnthropic } from "../../clients/anthropic.js"
import { SYSTEM_PROMPT } from "./systemPrompt.js"

export async function callClaude(query, speakerSummaries, limit, budget) {
  const budgetLine = budget ? `\nClient budget: $${budget}\n` : ''
  const userMessage = `Client brief: "${query}"
${budgetLine}
Available speakers:

${speakerSummaries}

Return the top ${limit} most relevant speakers as JSON.`

  const response = await getAnthropic().messages.create({
    // model: 'claude-sonnet-4-5-20250929',
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock)
    throw new Error('Claude response had no text block')
  const text = textBlock.text

  return parseLlmJson(text)
}

// Robust JSON extraction for LLM output. Tries direct JSON.parse first; falls
// back to a regex extraction if Claude wraps the JSON in prose or fences.
// Uses a reviver that drops prototype-pollution keys.
function parseLlmJson(text) {
  const reviver = (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
    return value
  }
  const trimmed = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  try {
    return JSON.parse(trimmed, reviver)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Claude response did not contain valid JSON')
    return JSON.parse(match[0], reviver)
  }
}
