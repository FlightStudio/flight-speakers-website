import { getSpeakerProfilesForSearch, fullTextSearch, getAllSpeakers, vectorSearch, getEmbeddingCount } from '../db/queries.js'
import { generateQueryEmbedding } from './embeddings.js'
import { getAnthropic } from '../clients/anthropic.js'

const SYSTEM_PROMPT = `You are a speaker recommendation engine for Flight Speakers, a premium speaker booking agency.

Given a client's event brief and a list of speaker profiles, return the most relevant speakers ranked by fit.

Rules:
- Analyse the client's intent, audience, themes, and tone
- Rank speakers by genuine relevance to the brief — not by order presented
- Return between 1 and the requested limit of speakers, only including those with a credible match
- For each speaker, write a specific 1-2 sentence reasoning explaining the connection between the client's needs and that speaker's expertise
- For each speaker, provide a matchScore from 0 to 100 representing how well they fit the brief. Be calibrated: a perfect topical match with relevant experience should be 90-99, a good thematic fit 75-89, a reasonable but not ideal match 60-74
- Do not invent or fabricate details about speakers — only reference information provided in their profiles
- If a client budget is provided, prefer speakers whose fee fits within budget. Lower matchScore by 10-15 points for speakers whose minimum fee significantly exceeds the stated budget.
- When a client's brief references demographic preferences (e.g., 'women in business', 'diverse voices', 'Black speakers'), boost speakers whose demographic attributes match. Never penalise speakers for not matching a demographic — only boost those who do.
- Respond with valid JSON only, no other text

Response format:
{
  "matches": [
    { "id": "speaker-id", "reasoning": "Why this speaker matches the brief.", "matchScore": 95 }
  ]
}`

// Simple in-memory cache with TTL
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX_SIZE = 100

function getCacheKey(query, limit, budget) {
  return `${query.toLowerCase().trim()}:${limit}:${budget || ''}`
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setCache(key, value) {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
  cache.set(key, { value, timestamp: Date.now() })
}

function sortIdsByScoreDesc(ids, scores) {
  return [...ids].sort((a, b) => {
    const sa = typeof scores[a] === 'number' ? scores[a] : -Infinity
    const sb = typeof scores[b] === 'number' ? scores[b] : -Infinity
    return sb - sa
  })
}

function buildSpeakerSummaries(speakers) {
  return speakers.map((s, i) => {
    const parts = [
      `${i + 1}. ${s.name} [id: ${s.id}]`,
      `   Headline: ${s.headline}`,
      `   Bio: ${s.bio}`,
      `   Topics: ${s.topics.join(', ')}`,
    ]

    if (s.keynotes && s.keynotes.length > 0) {
      parts.push(`   Keynotes: ${s.keynotes.join(', ')}`)
    }

    if (s.audiences && s.audiences.length > 0) {
      parts.push(`   Audiences: ${s.audiences.join(', ')}`)
    }

    if (s.feeMin != null) {
      parts.push(`   Fee Range: $${s.feeMin.toLocaleString()}+`)
    }

    if (s.gender) parts.push(`   Gender: ${s.gender}`)
    if (s.nationality) parts.push(`   Nationality: ${s.nationality}`)
    if (s.location) parts.push(`   Location: ${s.location}`)

    if (s.boostNotes && s.boostNotes.trim()) {
      parts.push(`   Internal Notes (for AI consideration): ${s.boostNotes.trim()}`)
    }

    return parts.join('\n')
  }).join('\n\n')
}

async function callClaude(query, speakerSummaries, limit, budget) {
  const budgetLine = budget ? `\nClient budget: $${budget}\n` : ''
  const userMessage = `Client brief: "${query}"
${budgetLine}
Available speakers:

${speakerSummaries}

Return the top ${limit} most relevant speakers as JSON.`

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('Claude response had no text block')
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

async function vectorRetrieveThenRerank(query, limit, budget) {
  const embeddingCount = await getEmbeddingCount()

  if (embeddingCount === 0 || !process.env.VOYAGE_API_KEY) {
    return null // signal caller to use full-speaker fallback
  }

  const queryEmbedding = await generateQueryEmbedding(query)
  const candidateLimit = Math.max(limit + 4, 12)
  const candidates = await vectorSearch(queryEmbedding, candidateLimit)

  if (candidates.length === 0) {
    return null
  }

  console.log(`Vector search found ${candidates.length} candidates`)

  // Rerank candidates with Claude
  const speakerSummaries = buildSpeakerSummaries(candidates)
  const result = await callClaude(query, speakerSummaries, limit, budget)

  if (!result.matches || !Array.isArray(result.matches)) {
    throw new Error('Invalid response structure from Claude')
  }

  const validIds = new Set(candidates.map(s => s.id))
  const matchedIds = []
  const reasonings = {}
  const scores = {}

  for (const match of result.matches) {
    if (match.id && validIds.has(match.id) && typeof match.reasoning === 'string') {
      matchedIds.push(match.id)
      reasonings[match.id] = match.reasoning
      if (typeof match.matchScore === 'number') {
        scores[match.id] = match.matchScore
      }
    }
  }

  if (matchedIds.length === 0) {
    return null
  }

  const sortedIds = sortIdsByScoreDesc(matchedIds, scores)

  // Build full speaker objects from candidates, sorted by matchScore desc
  const candidateMap = new Map(candidates.map(s => [s.id, s]))
  const speakers = sortedIds
    .map(id => {
      const s = candidateMap.get(id)
      if (!s) return null
      // Remove distance field from the response
      const { distance, ...speaker } = s
      return speaker
    })
    .filter(Boolean)
    .slice(0, limit)

  return { speakers, reasonings, scores }
}

export async function semanticSearch(query, limit = 8, budget) {
  if (!query || !query.trim()) {
    return { speakers: [], reasonings: {} }
  }

  // Check cache
  const cacheKey = getCacheKey(query, limit, budget)
  const cached = getCached(cacheKey)
  if (cached) return cached

  // Try vector retrieve-then-rerank first
  try {
    const vectorResult = await vectorRetrieveThenRerank(query, limit, budget)
    if (vectorResult) {
      setCache(cacheKey, vectorResult)
      return vectorResult
    }
  } catch (err) {
    console.error('Vector search failed, falling back to full-speaker Claude search:', err.message)
  }

  // Fallback: send all speakers to Claude (current behavior)
  const speakerProfiles = await getSpeakerProfilesForSearch()

  if (speakerProfiles.length === 0) {
    return { speakers: [], reasonings: {} }
  }

  let matchedIds = []
  let reasonings = {}
  let scores = {}

  try {
    const speakerSummaries = buildSpeakerSummaries(speakerProfiles)
    const result = await callClaude(query, speakerSummaries, limit, budget)

    if (!result.matches || !Array.isArray(result.matches)) {
      throw new Error('Invalid response structure from Claude')
    }

    const validIds = new Set(speakerProfiles.map(s => s.id))

    for (const match of result.matches) {
      if (match.id && validIds.has(match.id) && typeof match.reasoning === 'string') {
        matchedIds.push(match.id)
        reasonings[match.id] = match.reasoning
        if (typeof match.matchScore === 'number') {
          scores[match.id] = match.matchScore
        }
      }
    }
  } catch (err) {
    console.error('Claude search failed, falling back to full-text search:', err.message)
    return fullTextFallback(query, limit)
  }

  if (matchedIds.length === 0) {
    return fullTextFallback(query, limit)
  }

  matchedIds = sortIdsByScoreDesc(matchedIds, scores)

  // Fetch full speaker objects for matched IDs, sorted by matchScore desc
  const allSpeakers = await getAllSpeakers()
  const speakerMap = new Map(allSpeakers.map(s => [s.id, s]))
  const speakers = matchedIds
    .map(id => speakerMap.get(id))
    .filter(Boolean)
    .slice(0, limit)

  const result = { speakers, reasonings, scores }
  setCache(cacheKey, result)

  return result
}

async function generateReasoningsAndScores(query, speakers) {
  try {
    const speakerSummaries = buildSpeakerSummaries(speakers)
    const result = await callClaude(query, speakerSummaries, speakers.length)

    if (!result.matches || !Array.isArray(result.matches)) {
      return null
    }

    const reasonings = {}
    const scores = {}
    for (const match of result.matches) {
      if (match.id && typeof match.reasoning === 'string') {
        reasonings[match.id] = match.reasoning
        if (typeof match.matchScore === 'number') {
          scores[match.id] = match.matchScore
        }
      }
    }

    return Object.keys(reasonings).length > 0 ? { reasonings, scores } : null
  } catch (err) {
    console.error('Failed to generate reasonings:', err.message)
    return null
  }
}

export const _internal = { buildSpeakerSummaries }

async function fullTextFallback(query, limit) {
  const speakers = await fullTextSearch(query, limit)

  // If full-text search returns nothing, return a sample of speakers
  if (speakers.length === 0) {
    const sample = await getAllSpeakers({ limit })
    const result = await generateReasoningsAndScores(query, sample)
    const reasonings = result?.reasonings
      || Object.fromEntries(sample.map(s => [s.id, 'Speaker who may bring valuable perspective.']))
    const scores = result?.scores || {}
    return { speakers: sample, reasonings, scores }
  }

  const result = await generateReasoningsAndScores(query, speakers)
  const reasonings = result?.reasonings
    || Object.fromEntries(speakers.map(s => [s.id, 'Matched based on relevance to your search.']))
  const scores = result?.scores || {}

  return { speakers, reasonings, scores }
}
