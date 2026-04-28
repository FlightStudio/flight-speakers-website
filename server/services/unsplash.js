// Unsplash image lookup for article cover images.
// Requires UNSPLASH_ACCESS_KEY env var (free tier: 50 req/hour).
// Returns null gracefully when no key is set or on any failure.

const UNSPLASH_API = 'https://api.unsplash.com'

/**
 * Fetch a random landscape image from Unsplash for the given query.
 * @param {string} query  Search term, e.g. "keynote speaker conference stage"
 * @returns {{ url: string, credit: string, photographerName: string, photographerUrl: string } | null}
 */
export async function fetchImageForTopic(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    console.log('[Unsplash] No UNSPLASH_ACCESS_KEY set, skipping image fetch')
    return null
  }

  try {
    const params = new URLSearchParams({
      query,
      per_page: '10',
      orientation: 'landscape',
    })

    const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${key}`,
        'Accept-Version': 'v1',
      },
    })

    if (!res.ok) {
      console.warn(`[Unsplash] API error ${res.status} for query "${query}"`)
      return null
    }

    const data = await res.json()
    const results = data?.results
    if (!results || results.length === 0) {
      console.log(`[Unsplash] No results for query "${query}"`)
      return null
    }

    // Pick a random result from the top 10 to avoid serving the same image repeatedly
    const photo = results[Math.floor(Math.random() * results.length)]

    return {
      url: photo.urls?.regular || null,
      credit: photo.description || photo.alt_description || null,
      photographerName: photo.user?.name || null,
      photographerUrl: photo.user?.links?.html || null,
    }
  } catch (err) {
    console.warn(`[Unsplash] Failed to fetch image for "${query}":`, err.message)
    return null
  }
}
