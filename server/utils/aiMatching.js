/**
 * Server-side AI-Powered Speaker Matching Utility
 *
 * This is the backend version of the matching algorithm.
 * In production, this would integrate with a proper vector database
 * and embedding service (e.g., OpenAI embeddings + Pinecone).
 */

// Keyword mappings for common search intents
const keywordMappings = {
  women: ['Women in Business', 'Women in STEM', 'Women Founders', 'Women in Finance', 'Diversity & Inclusion'],
  diversity: ['Diversity & Inclusion', 'Women in Business', 'Women in STEM'],
  female: ['Women in Business', 'Women in STEM', 'Women Founders'],
  inclusion: ['Diversity & Inclusion', 'Company Culture'],
  ai: ['AI & Future of Work', 'Ethics in Technology', 'Digital Transformation', 'AI in Medicine', 'AI Security'],
  artificial: ['AI & Future of Work', 'AI in Medicine'],
  technology: ['AI & Future of Work', 'Digital Transformation', 'Innovation', 'Cybersecurity'],
  tech: ['AI & Future of Work', 'Digital Transformation', 'Innovation'],
  digital: ['Digital Transformation', 'AI & Future of Work'],
  cyber: ['Cybersecurity', 'Data Privacy', 'Digital Trust'],
  security: ['Cybersecurity', 'Data Privacy', 'Risk Management'],
  leadership: ['Leadership', 'CEO Leadership', 'Remote Leadership', 'Leadership in Tech'],
  ceo: ['CEO Leadership', 'Corporate Governance', 'Board Excellence'],
  executive: ['CEO Leadership', 'Corporate Governance', 'Executive Leadership'],
  management: ['Leadership', 'Team Performance', 'Organizational Culture'],
  board: ['Board Excellence', 'Corporate Governance'],
  performance: ['Peak Performance', 'Mental Toughness', 'Team Performance'],
  motivation: ['Peak Performance', 'Resilience', 'Leadership'],
  sales: ['Peak Performance', 'Team Performance', 'Leadership'],
  kickoff: ['Peak Performance', 'Team Performance', 'Leadership', 'Resilience'],
  entrepreneurship: ['Entrepreneurship', 'Startup Scaling', 'Innovation', 'Women Founders'],
  startup: ['Entrepreneurship', 'Startup Scaling', 'Venture Capital'],
  business: ['Entrepreneurship', 'Leadership', 'Innovation'],
  finance: ['Fintech', 'Financial Inclusion', 'Impact Investing'],
  investment: ['Impact Investing', 'Venture Capital', 'Fintech'],
  sustainability: ['Sustainability', 'Climate Innovation', 'Impact Investing', 'Sustainability in Logistics'],
  climate: ['Climate Innovation', 'Sustainability'],
  green: ['Sustainability', 'Climate Innovation'],
  environment: ['Sustainability', 'Climate Innovation'],
  wellness: ['Wellness', 'Mental Performance', 'Stress Management', 'Sleep Optimization'],
  health: ['Wellness', 'Healthcare Innovation', 'Longevity', 'Mental Performance'],
  mental: ['Mental Performance', 'Wellness', 'Stress Management', 'Mental Toughness'],
  wellbeing: ['Wellness', 'Mental Performance', 'Stress Management'],
  healthcare: ['Healthcare Innovation', 'AI in Medicine', 'Longevity', 'Biotech'],
  medical: ['Healthcare Innovation', 'AI in Medicine'],
  pharma: ['Healthcare Innovation', 'Biotech'],
  supply: ['Supply Chain', 'Operations Excellence', 'Crisis Resilience'],
  logistics: ['Supply Chain', 'Operations Excellence', 'Sustainability in Logistics'],
  marketing: ['Brand Strategy', 'Marketing Innovation', 'Cultural Marketing'],
  brand: ['Brand Strategy', 'Marketing Innovation'],
  conference: ['Leadership', 'Innovation', 'AI & Future of Work'],
  summit: ['Leadership', 'Innovation', 'Geopolitics'],
  retreat: ['Wellness', 'Team Performance', 'Leadership'],
  offsite: ['Team Performance', 'Leadership', 'Company Culture'],
  corporate: ['Leadership', 'Company Culture', 'Corporate Governance'],
  government: ['Geopolitics', 'Risk Management', 'National Security'],
  education: ['STEM Education', 'Innovation', 'Leadership'],
  future: ['AI & Future of Work', 'Future of Work', 'Future of Health', 'Innovation'],
  innovation: ['Innovation', 'Entrepreneurship', 'Digital Transformation'],
  culture: ['Company Culture', 'Organizational Culture', 'Cultural Marketing'],
  resilience: ['Resilience', 'Crisis Resilience', 'Mental Toughness'],
  space: ['Innovation', 'STEM Education', 'Exploration'],
  geopolitics: ['Geopolitics', 'Global Strategy', 'Risk Management'],
  risk: ['Risk Management', 'Geopolitics', 'Cybersecurity'],
}

const audienceMappings = {
  women: ['Women in Business'],
  executives: ['C-Suite', 'Executive Leadership', 'Board Directors'],
  tech: ['Technology', 'Tech Companies', 'Tech Industry'],
  sales: ['Sales Organizations', 'Sales Teams'],
  hr: ['HR Leaders'],
  marketing: ['Marketing Teams', 'Brand Leaders'],
  finance: ['Financial Services', 'Investors'],
  healthcare: ['Healthcare Leaders', 'Pharma & Biotech'],
}

function extractQueryFeatures(query) {
  const normalizedQuery = query.toLowerCase()
  const words = normalizedQuery.split(/\s+/)

  const matchedTopics = new Set()
  const matchedAudiences = new Set()

  for (const word of words) {
    if (keywordMappings[word]) {
      keywordMappings[word].forEach(topic => matchedTopics.add(topic))
    }
    if (audienceMappings[word]) {
      audienceMappings[word].forEach(aud => matchedAudiences.add(aud))
    }
    for (const [keyword, topics] of Object.entries(keywordMappings)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        topics.forEach(topic => matchedTopics.add(topic))
      }
    }
  }

  const phrases = [
    { phrase: 'women in business', topics: ['Women in Business', 'Women Founders'] },
    { phrase: 'future of work', topics: ['Future of Work', 'AI & Future of Work', 'Remote Leadership'] },
    { phrase: 'sales kickoff', topics: ['Peak Performance', 'Team Performance', 'Leadership'] },
    { phrase: 'leadership summit', topics: ['Leadership', 'CEO Leadership'] },
    { phrase: 'tech conference', topics: ['AI & Future of Work', 'Innovation', 'Digital Transformation'] },
    { phrase: 'corporate retreat', topics: ['Wellness', 'Team Performance', 'Company Culture'] },
    { phrase: 'product launch', topics: ['Brand Strategy', 'Innovation', 'Marketing Innovation'] },
    { phrase: 'internal training', topics: ['Leadership', 'Team Performance', 'Company Culture'] },
  ]

  for (const { phrase, topics } of phrases) {
    if (normalizedQuery.includes(phrase)) {
      topics.forEach(topic => matchedTopics.add(topic))
    }
  }

  return {
    topics: Array.from(matchedTopics),
    audiences: Array.from(matchedAudiences),
    query: normalizedQuery,
  }
}

function calculateRelevance(speaker, queryFeatures) {
  let score = 0
  const matchedReasons = []

  const topicMatches = speaker.topics.filter(t =>
    queryFeatures.topics.includes(t)
  )
  score += topicMatches.length * 25

  if (topicMatches.length > 0) {
    matchedReasons.push(`Expertise in ${topicMatches.slice(0, 2).join(', ')}`)
  }

  const audienceMatches = (speaker.audiences || []).filter(a =>
    queryFeatures.audiences.includes(a)
  )
  score += audienceMatches.length * 15

  if (audienceMatches.length > 0) {
    matchedReasons.push(`ideal for ${audienceMatches[0]} audiences`)
  }

  const bioLower = speaker.bio.toLowerCase()
  const queryWords = queryFeatures.query.split(/\s+/).filter(w => w.length > 3)
  const bioMatches = queryWords.filter(word => bioLower.includes(word))
  score += bioMatches.length * 5

  if (speaker.featured) {
    score += 10
  }

  let reasoning = matchedReasons.length > 0
    ? matchedReasons.join('; ')
    : 'Broad expertise that may align with your needs'

  return { score, reasoning }
}

export function matchSpeakers(query, speakers, maxResults = 8) {
  if (!query || !query.trim()) {
    return { speakers: [], reasonings: {} }
  }

  const queryFeatures = extractQueryFeatures(query)

  const scoredSpeakers = speakers.map(speaker => {
    const { score, reasoning } = calculateRelevance(speaker, queryFeatures)
    return { speaker, score, reasoning }
  })

  const relevantSpeakers = scoredSpeakers
    .filter(s => s.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  if (relevantSpeakers.length < 3) {
    const featuredBackfill = scoredSpeakers
      .filter(s => s.speaker.featured && !relevantSpeakers.find(r => r.speaker.id === s.speaker.id))
      .slice(0, 3 - relevantSpeakers.length)

    featuredBackfill.forEach(s => {
      s.reasoning = 'Featured speaker who may bring valuable perspective'
    })

    relevantSpeakers.push(...featuredBackfill)
  }

  const reasonings = {}
  relevantSpeakers.forEach(({ speaker, reasoning }) => {
    reasonings[speaker.id] = reasoning
  })

  return {
    speakers: relevantSpeakers.map(s => s.speaker),
    reasonings,
  }
}

export default matchSpeakers
