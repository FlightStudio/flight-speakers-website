const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

export function buildSpeakerText(speaker) {
  const parts = [
    speaker.name,
    speaker.headline,
    speaker.bio,
  ]

  if (speaker.topics && speaker.topics.length > 0) {
    parts.push(`Topics: ${speaker.topics.join(', ')}`)
  }

  if (speaker.keynotes && speaker.keynotes.length > 0) {
    parts.push(`Keynotes: ${speaker.keynotes.join(', ')}`)
  }

  if (speaker.audiences && speaker.audiences.length > 0) {
    parts.push(`Audiences: ${speaker.audiences.join(', ')}`)
  }

  if (speaker.gender) parts.push(`Gender: ${speaker.gender}`)
  if (speaker.ethnicity) parts.push(`Ethnicity: ${speaker.ethnicity}`)
  if (speaker.nationality) parts.push(`Nationality: ${speaker.nationality}`)
  if (speaker.location) parts.push(`Location: ${speaker.location}`)

  if (speaker.boostNotes && speaker.boostNotes.trim()) {
    parts.push(`Internal notes: ${speaker.boostNotes.trim()}`)
  }

  return parts.filter(Boolean).join('\n')
}

async function callVoyageAPI(texts, inputType) {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not configured')
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Voyage API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.data.map(item => item.embedding)
}

export async function generateEmbeddings(texts) {
  return callVoyageAPI(texts, 'document')
}

export async function generateQueryEmbedding(query) {
  const embeddings = await callVoyageAPI([query], 'query')
  return embeddings[0]
}
