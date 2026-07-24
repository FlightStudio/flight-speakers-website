import cron from 'node-cron'
import pool from '../db/connection.js'

const API_KEY = process.env.INFLUENCERS_CLUB_API_KEY
const API_BASE = 'https://api-dashboard.influencers.club'

// Map our internal platform names to Influencers Club platform values
const PLATFORM_MAP = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  youtube: 'youtube',
  x: 'twitter',
  
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch follower counts for a single platform/handle via Influencers Club API.
 * Uses the "enrich by handle full" endpoint (1 credit per lookup).
 */
async function fetchFollowerCounts(platform, handle) {
  if (!API_KEY) return null

  const apiPlatform = PLATFORM_MAP[platform]
  if (!apiPlatform) return null

  // LinkedIn is not supported for full enrichment on this API
  if (apiPlatform === 'linkedin') return null

  try {
    const res = await fetch(`${API_BASE}/public/v1/creators/enrich/handle/full/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle,
        platform: apiPlatform,
        email_required: 'preferred',
        include_lookalikes: false,
        include_audience_data: false,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      console.warn(`[SocialStats] API error ${res.status} for ${platform}/${handle}: ${errorBody.slice(0, 200)}`)
      return null
    }

    const data = await res.json()

    // Response is nested under result.{apiPlatform}
    // Log a sample for debugging
    if (!fetchFollowerCounts._logged) {
      console.log(`[SocialStats] Sample keys for ${platform}/${handle}:`, JSON.stringify(Object.keys(data?.result?.[apiPlatform] || data?.result || data || {})))
      const platformData = data?.result?.[apiPlatform] || {}
      // Log all numeric fields to find follower count
      const numericFields = Object.entries(platformData).filter(([, v]) => typeof v === 'number')
      console.log(`[SocialStats] Numeric fields:`, JSON.stringify(numericFields.slice(0, 15)))
      fetchFollowerCounts._logged = true
    }

    // Navigate into the nested response structure
    const platformData = data?.result?.[apiPlatform] || data?.data?.[apiPlatform] || data?.result || data?.data || data
    const count = platformData.follower_count
      ?? platformData.followers
      ?? platformData.subscriber_count
      ?? platformData.subscribers
      ?? platformData.followers_count
      ?? platformData.total_followers
      ?? platformData.fans
      ?? null

    if (count === null || count === undefined) {
      console.warn(`[SocialStats] No follower count found for ${platform}/${handle}`)
      return null
    }

    const key = platform === 'youtube' ? 'subscribers' : 'followers'
    return { [key]: typeof count === 'number' ? count : parseInt(count, 10) || null }
  } catch (err) {
    console.warn(`[SocialStats] Failed to fetch ${platform}/${handle}:`, err.message)
    return null
  }
}

/**
 * Refresh social stats for all speakers that have social profiles.
 * Adds a small delay between requests to avoid rate limiting.
 */
let refreshInProgress = false

export async function refreshAllSpeakerStats() {
  if (refreshInProgress) {
    console.log('[SocialStats] Refresh already in progress, skipping')
    return
  }
  refreshInProgress = true

  try {
    return await _doRefresh()
  } finally {
    refreshInProgress = false
  }
}

async function _doRefresh() {
  console.log('[SocialStats] Starting refresh...')

  if (!API_KEY) {
    console.log('[SocialStats] No INFLUENCERS_CLUB_API_KEY set, skipping refresh')
    return
  }

  const { rows: speakers } = await pool.query(
    `SELECT id, social_profiles FROM speakers WHERE social_profiles != '{}'::jsonb`
  )

  let updated = 0
  for (const speaker of speakers) {
    const profiles = speaker.social_profiles || {}
    const stats = {}

    for (const [platform, handle] of Object.entries(profiles)) {
      try {
        if (!handle) continue
        const result = await fetchFollowerCounts(platform, handle)
        if (result) {
          stats[platform] = result
        }
        // 300ms delay between API calls to be respectful of rate limits
      } catch (err) { }
      await delay(300)
    }

    if (Object.keys(stats).length > 0) {
      await pool.query(
        `UPDATE speakers SET social_stats = $1, social_stats_updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(stats), speaker.id]
      )
      updated++
    }
  }

  console.log(`[SocialStats] Refresh complete. Updated ${updated}/${speakers.length} speakers.`)
}

/**
 * Schedule daily refresh at 3am. Also runs an initial refresh
 * if any speaker has never been updated.
 */
export function startDailyRefresh() {
  // Schedule at 3:00 AM daily
  cron.schedule('0 3 * * *', () => {
    refreshAllSpeakerStats().catch(err => {
      console.error('[SocialStats] Scheduled refresh failed:', err.message)
    })
  })

  console.log('[SocialStats] Daily refresh scheduled at 3:00 AM')

  // Run initial refresh if any speaker is missing stats
  pool.query(
    `SELECT count(*) AS count FROM speakers WHERE social_stats_updated_at IS NULL AND social_profiles != '{}'::jsonb`
  ).then(({ rows }) => {
    if (parseInt(rows[0].count, 10) > 0) {
      console.log(`[SocialStats] ${rows[0].count} speakers need initial refresh`)
      refreshAllSpeakerStats().catch(err => {
        console.error('[SocialStats] Initial refresh failed:', err.message)
      })
    }
  }).catch(() => {
    // DB not ready yet, skip initial refresh
  })
}
