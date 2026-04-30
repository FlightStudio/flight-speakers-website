// AI article generation service.
// Produces SEO-optimised speaker-roundup articles for the News section.
// Uses Claude Sonnet for writing and Unsplash for cover images.

import { getAnthropic } from '../clients/anthropic.js'
import { getAllSpeakers } from '../db/queries.js'
import { createArticle, getRecentTopicAngles } from '../db/article-queries.js'
import { fetchImageForTopic } from './unsplash.js'

// --- Angle pool (24 entries, Mon+Thu twice/week = ~12 weeks before any angle repeats) ---

export const ANGLE_POOL = [
  { region: 'UK', year: 2026, focus: 'Best Keynote Speakers', audience: 'corporate' },
  { region: 'US', year: 2026, focus: 'Top Keynote Speakers', audience: 'tech' },
  { region: 'UK', year: 2026, focus: 'Top Women Speakers', audience: 'leadership' },
  { region: 'US', year: 2026, focus: 'Best Motivational Speakers', audience: 'sales kickoffs' },
  { region: 'UK', year: 2026, focus: 'Best AI Keynote Speakers', audience: 'technology summits' },
  { region: 'UK', year: 2026, focus: 'Best Wellbeing Keynote Speakers', audience: 'HR conferences' },
  { region: 'UK', year: 2026, focus: 'Top Finance Speakers', audience: 'financial services' },
  { region: 'UK', year: 2026, focus: 'Best Diversity and Inclusion Speakers', audience: 'corporate' },
  { region: 'US', year: 2026, focus: 'Top Marketing Speakers', audience: 'CMO summits' },
  { region: 'UK', year: 2026, focus: 'Best Entrepreneurship Speakers', audience: 'founder events' },
  { region: 'UK', year: 2026, focus: 'Top Health and Performance Speakers', audience: 'corporate health programmes' },
  { region: 'UK', year: 2026, focus: 'Best Leadership Speakers', audience: 'executive offsites' },
  { region: 'US', year: 2026, focus: 'Best Leadership Speakers', audience: 'Fortune 500 offsites' },
  { region: 'US', year: 2026, focus: 'Top Women in Business Speakers', audience: 'corporate leadership' },
  { region: 'UK', year: 2026, focus: 'Best Resilience Speakers', audience: 'HR and wellbeing events' },
  { region: 'US', year: 2026, focus: 'Best AI and Technology Speakers', audience: 'enterprise tech events' },
  { region: 'UK', year: 2026, focus: 'Top Startup and Innovation Speakers', audience: 'venture and startup events' },
  { region: 'US', year: 2026, focus: 'Best Health and Longevity Speakers', audience: 'healthcare and life sciences' },
  { region: 'UK', year: 2026, focus: 'Best Behavioural Science Speakers', audience: 'business and leadership events' },
  { region: 'US', year: 2026, focus: 'Top Entrepreneurship Speakers', audience: 'startup and scale-up events' },
  { region: 'UK', year: 2026, focus: 'Best Sales and Persuasion Speakers', audience: 'revenue and sales conferences' },
  { region: 'US', year: 2026, focus: 'Top Finance and Investment Speakers', audience: 'financial services events' },
  { region: 'UK', year: 2026, focus: 'Best Culture and Engagement Speakers', audience: 'people and culture teams' },
  { region: 'US', year: 2026, focus: 'Best Diversity and Inclusion Speakers', audience: 'DEI summits' },
]

// Tile gradient options for fallback when no image is available.
// Dark, neutral palettes only — no purple/violet.
const TILE_GRADIENTS = [
  { c1: '#0F172A', c2: '#1E3A5F' }, // slate to navy
  { c1: '#1A1A1A', c2: '#3D1419' }, // charcoal to deep burgundy
  { c1: '#0F2A2E', c2: '#134E4A' }, // dark teal
  { c1: '#1E40AF', c2: '#0B2554' }, // blue
  { c1: '#0F1F14', c2: '#14452F' }, // forest
  { c1: '#1A1A1A', c2: '#0F172A' }, // mono dark
]

// --- Speaker filtering ---

const TOPIC_FILTERS = {
  // focus keyword -> topic strings to match (case-insensitive substring)
  'women': ['gender', 'female', 'women', 'diversity'],
  'ai': ['technology', 'ai', 'innovation', 'future'],
  'wellbeing': ['health', 'wellbeing', 'performance', 'mental'],
  'finance': ['finance', 'money', 'investment', 'wealth'],
  'diversity': ['diversity', 'inclusion', 'dei', 'belonging'],
  'marketing': ['marketing', 'brand', 'creator', 'media'],
  'entrepreneurship': ['entrepreneurship', 'startup', 'business', 'founder'],
  'health': ['health', 'performance', 'wellbeing', 'longevity'],
  'leadership': ['leadership', 'culture', 'management', 'team'],
  'resilience': ['resilience', 'mental', 'performance', 'wellbeing'],
  'behavioural': ['behavioural', 'behavior', 'psychology', 'science'],
  'sales': ['sales', 'persuasion', 'negotiation', 'influence'],
  'culture': ['culture', 'engagement', 'leadership', 'team'],
  'innovation': ['innovation', 'technology', 'startup', 'future'],
  'startup': ['startup', 'entrepreneurship', 'innovation', 'founder'],
  'investment': ['finance', 'investment', 'venture', 'business'],
  'technology': ['technology', 'ai', 'innovation', 'digital'],
  'longevity': ['health', 'longevity', 'performance', 'wellbeing'],
  'motivational': ['motivation', 'resilience', 'performance', 'leadership'],
  'keynote': ['leadership', 'business', 'strategy', 'entrepreneurship'],
}

const REGION_LOCATION_MAP = {
  'UK': ['UK', 'United Kingdom', 'British', 'England', 'London'],
  'US': ['US', 'USA', 'United States', 'American', 'New York', 'Los Angeles', 'San Francisco'],
}

/**
 * Filter and rank speakers relevant to the given angle.
 * Returns 6-8 speakers, falling back to full roster if fewer match.
 */
export function filterSpeakersForAngle(speakers, angle) {
  const focusLower = angle.focus.toLowerCase()
  const regionKeywords = REGION_LOCATION_MAP[angle.region] || []

  // Find matching topic keywords
  let matchingTopicKeywords = []
  for (const [keyword, topics] of Object.entries(TOPIC_FILTERS)) {
    if (focusLower.includes(keyword)) {
      matchingTopicKeywords = matchingTopicKeywords.concat(topics)
    }
  }
  // Fallback: match on focus words directly
  if (matchingTopicKeywords.length === 0) {
    matchingTopicKeywords = focusLower.split(' ').filter(w => w.length > 3)
  }

  function matchesTopics(speaker) {
    const allText = [
      ...(speaker.topics || []),
      ...(speaker.keynotes || []),
      speaker.bio || '',
      speaker.headline || '',
    ].join(' ').toLowerCase()

    return matchingTopicKeywords.some(kw => allText.includes(kw.toLowerCase()))
  }

  function matchesRegion(speaker) {
    if (regionKeywords.length === 0) return true
    const locationText = [
      speaker.nationality || '',
      speaker.location || '',
      speaker.bio || '',
    ].join(' ')
    return regionKeywords.some(kw => locationText.toLowerCase().includes(kw.toLowerCase()))
  }

  function matchesGender(speaker) {
    if (!focusLower.includes('women') && !focusLower.includes('female')) return true
    return speaker.gender === 'Female'
  }

  // Score: +2 for topic match, +1 for region match, +1 for gender match
  const scored = speakers.map(s => {
    let score = 0
    if (matchesTopics(s)) score += 2
    if (matchesRegion(s)) score += 1
    if (matchesGender(s)) score += 1
    return { speaker: s, score }
  })

  const filtered = scored.filter(s => s.score >= 2).sort((a, b) => b.score - a.score)

  const pool = filtered.length >= 6
    ? filtered.slice(0, 8).map(s => s.speaker)
    : speakers.slice(0, 8)

  // Return 6-8
  return pool.slice(0, Math.min(8, Math.max(6, pool.length)))
}

/**
 * Pick an angle not used in the last 30 days.
 * Falls back to the least-recently-used if all have been used.
 */
export function pickAngle(recentAngles) {
  const recentSet = new Set(recentAngles)

  const unused = ANGLE_POOL.filter(a => !recentSet.has(JSON.stringify(a)))
  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)]
  }

  // All angles used recently: pick a random one (fallback)
  return ANGLE_POOL[Math.floor(Math.random() * ANGLE_POOL.length)]
}

// --- Slug generation ---

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function shortRandom() {
  return Math.random().toString(36).slice(2, 6)
}

// --- Main generator ---

/**
 * Generate a new article draft.
 * Picks an angle, filters speakers, calls Claude, saves to DB.
 * @returns {Promise<object>} The created article row
 */
export async function generateArticle() {
  const recentAngles = await getRecentTopicAngles({ days: 30 })
  const angle = pickAngle(recentAngles)

  const speakers = await getAllSpeakers()
  const selectedSpeakers = filterSpeakersForAngle(speakers, angle)

  if (selectedSpeakers.length === 0) {
    throw new Error('No speakers found for angle: ' + JSON.stringify(angle))
  }

  const anthropic = getAnthropic()
  const isUK = angle.region === 'UK'
  const langNote = isUK
    ? 'Use UK English spelling throughout (colour, organise, behaviour, programme, etc.).'
    : 'Use US English spelling throughout (color, organize, behavior, program, etc.).'

  const speakerProfiles = selectedSpeakers.map((s, i) => `
Speaker ${i + 1}: ${s.name}
Headline: ${s.headline}
Bio excerpt: ${s.bio ? s.bio.slice(0, 400) : ''}
Topics: ${(s.topics || []).join(', ')}
Keynotes: ${(s.keynotes || []).slice(0, 3).join(', ')}
Nationality: ${s.nationality || 'Not specified'}
Location: ${s.location || 'Not specified'}
`.trim()).join('\n\n')

  const prompt = `You are a skilled editorial writer producing SEO-optimised speaker-roundup articles for Flight Speakers, a premium speaker booking agency.

Write an article following this exact structure:
1. Title: 10-12 words, includes focus theme, region, and year. Format: "The [Focus] to Hire in [Region] for [Year]" or similar natural variation.
2. Opening paragraph: 50-80 words. Establishes authority, describes the market, states what the guide delivers. No hype.
3. Question H2: "What makes a strong [speaker type] for [audience type]?" — followed by 100-200 word direct answer.
4. Listicle intro H2 with one-sentence setup paragraph.
5. One H2 + paragraph per speaker (format "1. [Name]", "2. [Name]" etc.) — 100-150 words each. Structure: credentials line, what they cover and why audiences value them, closing implicit value statement ("organisations book them for X events").
6. Soft CTA H2 at the close ("Hire One of the Best [X] Speakers Today" or similar). Include [Submit a brief](/enquiry) as a markdown link.

RULES:
- ${langNote}
- Third-person editorial voice, active verbs, concrete details.
- No pricing references. No superlatives (amazing, incredible). No marketing speak (thought leader, deep dive, actionable insights). No exclamation marks. No em dashes — use hyphens, commas, or full stops.
- Year ${angle.year} must appear in the title and at least twice in the body.
- Internal links: use markdown link format [label](/path) for /enquiry, /speakers, or /search.

ANGLE:
Region: ${angle.region}
Year: ${angle.year}
Focus: ${angle.focus}
Target audience: ${angle.audience}

SPEAKERS TO FEATURE (use all of them, in a sensible order):
${speakerProfiles}

Respond with ONLY a valid JSON object, no markdown code fences, in this exact shape:
{
  "slug": "url-safe-slug-10-to-14-words",
  "title": "Article title",
  "excerpt": "One sentence summary, 25-40 words, no trailing period needed",
  "readTime": 9,
  "body": [
    { "type": "p", "text": "Opening paragraph..." },
    { "type": "h2", "text": "Question heading..." },
    { "type": "p", "text": "Answer paragraph..." },
    ...
  ]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = response.content[0]?.text || ''

  let parsed
  try {
    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${err.message}\n\nRaw:\n${rawText.slice(0, 500)}`)
  }

  // Ensure slug is URL-safe; deduplicate if needed
  let slug = parsed.slug
    ? parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 80)
    : toSlug(parsed.title || 'article')

  // Try Unsplash for cover image
  const unsplashQuery = `${angle.focus} keynote speaker conference`
  let image = null
  let imageCredit = null

  const unsplashResult = await fetchImageForTopic(unsplashQuery)
  if (unsplashResult?.url) {
    image = unsplashResult.url
    imageCredit = unsplashResult.photographerName
      ? `Photo by ${unsplashResult.photographerName} on Unsplash`
      : 'Unsplash'
  } else if (selectedSpeakers[0]?.photo) {
    // Fallback: use first speaker's photo
    image = selectedSpeakers[0].photo
  }

  // Pick a tile gradient
  const tile = TILE_GRADIENTS[Math.floor(Math.random() * TILE_GRADIENTS.length)]

  const article = await createArticle({
    slug,
    title: parsed.title,
    category: 'Rankings',
    excerpt: parsed.excerpt,
    image,
    imageCredit,
    tileC1: tile.c1,
    tileC2: tile.c2,
    body: parsed.body,
    readTime: parsed.readTime || 8,
    status: 'draft',
    generatedBy: 'auto',
    topicAngle: JSON.stringify(angle),
  })

  console.log(`[ArticleGenerator] Created draft article: ${article.id} — "${article.title}"`)
  return article
}

// Expose internals for testing
export const _internal = {
  ANGLE_POOL,
  pickAngle,
  filterSpeakersForAngle,
}
