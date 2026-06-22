import { getSpeakerProfilesForSearch, getAllSpeakers } from '../../db/queries.js'

import { vectorRetrieveThenRerank } from "./vectorRetriveThenRerank.js"
import { buildSpeakerSummaries } from "./buildSpeakerSummaries.js";
import { fullTextFallback } from './fullTextFallback.js';
import { callClaude } from './callClaude.js';

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

export function sortIdsByScoreDesc(ids, scores) {
  return [...ids].sort((a, b) => {
    const sa = typeof scores[a] === 'number' ? scores[a] : -Infinity
    const sb = typeof scores[b] === 'number' ? scores[b] : -Infinity
    return sb - sa
  })
}

export async function semanticSearch(query, limit = 8, budget) {
  if (!query || !query.trim()) {
    return { speakers: [], reasonings: {} }
  }

  // Check cache
  const cacheKey = getCacheKey(query, limit, budget)
  const cached = getCached(cacheKey)
  if (cached)
    return cached

  // Try vector retrieve-then-rerank first
  try {
    console.time("vector");
    const vectorResult = await vectorRetrieveThenRerank(query, limit, budget)
    console.timeEnd("vector");
    console.log({ vectorResult });
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
