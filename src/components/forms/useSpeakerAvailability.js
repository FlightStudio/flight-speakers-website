import { useEffect, useState } from 'react'

// Fetches blocked dates for a speaker over a forward window and caches per
// (speakerId, from, to) for the session. Falls back to an empty set on any
// error so the calendar still renders.
const cache = new Map()

function cacheKey(speakerId, from, to) {
  return `${speakerId}|${from}|${to}`
}

export function useSpeakerAvailability(speakerId, from, to) {
  const [blocked, setBlocked] = useState(() => new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!speakerId || !from || !to) {
      setBlocked(new Set())
      return
    }
    const key = cacheKey(speakerId, from, to)
    if (cache.has(key)) {
      setBlocked(cache.get(key))
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/speakers/${encodeURIComponent(speakerId)}/availability?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const set = new Set(data?.blocked || [])
        cache.set(key, set)
        setBlocked(set)
      })
      .catch(() => {
        cache.set(key, new Set())
        if (!cancelled) setBlocked(new Set())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [speakerId, from, to])

  return { blocked, loading }
}
