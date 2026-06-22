import { fullTextSearch, getAllSpeakers } from "../../db/queries.js"
import { buildSpeakerSummaries } from "./buildSpeakerSummaries.js"
import { callClaude } from "./callClaude.js"

export async function fullTextFallback(query, limit) {
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
