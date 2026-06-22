const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

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
