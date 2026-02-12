import cron from 'node-cron'
import pool from '../db/connection.js'

const SOCIAL_API_KEY = process.env.SOCIAL_API_KEY

/**
 * Fetch follower counts for a single platform/handle.
 * Currently uses a placeholder that returns null if no API key is configured.
 * Designed to be swappable — replace the fetch logic per platform as needed.
 */
async function fetchFollowerCounts(platform, handle) {
  if (!SOCIAL_API_KEY) return null

  try {
    const url = `https://social-api-aggregator.p.rapidapi.com/v1/${platform}/${encodeURIComponent(handle)}`
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': SOCIAL_API_KEY,
        'X-RapidAPI-Host': 'social-api-aggregator.p.rapidapi.com',
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    const key = platform === 'youtube' ? 'subscribers' : 'followers'
    const count = data.followers ?? data.subscribers ?? data.follower_count ?? null
    if (count === null) return null

    return { [key]: count }
  } catch {
    return null
  }
}

/**
 * Refresh social stats for all speakers that have social profiles.
 */
export async function refreshAllSpeakerStats() {
  console.log('[SocialStats] Starting refresh...')

  const { rows: speakers } = await pool.query(
    `SELECT id, social_profiles FROM speakers WHERE social_profiles != '{}'::jsonb`
  )

  let updated = 0
  for (const speaker of speakers) {
    const profiles = speaker.social_profiles || {}
    const stats = {}

    for (const [platform, handle] of Object.entries(profiles)) {
      if (!handle) continue
      const result = await fetchFollowerCounts(platform, handle)
      if (result) {
        stats[platform] = result
      }
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
