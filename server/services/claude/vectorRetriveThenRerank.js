import { getEmbeddingCount, vectorSearch } from "../../db/queries.js";
import { generateQueryEmbedding } from "../voyage/index.js";
import { callClaude } from "../claude/callClaude.js";
import { buildSpeakerSummaries } from "./buildSpeakerSummaries.js";
import { sortIdsByScoreDesc } from "./claude.js";

export async function vectorRetrieveThenRerank(query, limit, budget) {
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
  console.time("summaries");
  const speakerSummaries = buildSpeakerSummaries(candidates)
  const result = await callClaude(query, speakerSummaries, limit, budget)
  console.log({ result })
  console.timeEnd("summaries");

  if (!result.matches || !Array.isArray(result.matches)) {
    throw new Error('Invalid response structure from Claude')
  }

  const validIds = new Set(candidates.map(s => s.id))
  const matchedIds = []
  const reasonings = {}
  const scores = {}

  for (const match of result.matches) {
    if (
      match.id &&
      validIds.has(match.id) &&
      typeof match.reasoning === 'string'
    ) {
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
      if (!s)
        return null
      // Remove distance field from the response
      const { distance, ...speaker } = s
      return speaker
    })
    .filter(Boolean)
    .slice(0, limit)

  return { speakers, reasonings, scores }
}
