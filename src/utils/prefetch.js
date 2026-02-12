// Simple prefetch cache for enquiry page data
const cache = new Map()

export function prefetchSpeaker(speakerId) {
  const key = `speaker:${speakerId}`
  if (cache.has(key)) return

  const promise = fetch(`/api/speakers/${encodeURIComponent(speakerId)}`)
    .then(res => res.json())
    .then(data => data.success ? data.speaker : null)
    .catch(() => null)

  cache.set(key, promise)
}

export function prefetchParseBrief(brief) {
  if (!brief) return
  const key = `brief:${brief}`
  if (cache.has(key)) return

  const promise = fetch('/api/parse-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief }),
  })
    .then(res => res.json())
    .catch(() => ({ success: true, extracted: {}, brief }))

  cache.set(key, promise)
}

export async function getCachedSpeaker(speakerId) {
  const key = `speaker:${speakerId}`
  if (cache.has(key)) return cache.get(key)
  return null
}

export async function getCachedParseBrief(brief) {
  const key = `brief:${brief}`
  if (cache.has(key)) return cache.get(key)
  return null
}
