const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function isExpired(entry) {
  return Date.now() - entry.timestamp > CACHE_TTL
}

function getEntry(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (isExpired(entry)) {
    cache.delete(key)
    return null
  }
  return entry.promise
}

function setEntry(key, promise) {
  cache.set(key, { promise, timestamp: Date.now() })
}

export function prefetchSpeaker(speakerId) {
  const key = `speaker:${speakerId}`
  if (getEntry(key)) return

  const promise = fetch(`/api/speakers/${encodeURIComponent(speakerId)}`)
    .then(res => res.json())
    .then(data => data.success ? data.speaker : null)
    .catch(() => null)

  setEntry(key, promise)
}

export function prefetchParseBrief(brief) {
  if (!brief) return
  const key = `brief:${brief}`
  if (getEntry(key)) return

  const promise = fetch('/api/parse-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief }),
  })
    .then(res => res.json())
    .catch(() => ({ success: true, extracted: {}, brief }))

  setEntry(key, promise)
}

export async function getCachedSpeaker(speakerId) {
  return getEntry(`speaker:${speakerId}`)
}

export async function getCachedParseBrief(brief) {
  return getEntry(`brief:${brief}`)
}
