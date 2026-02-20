const SESSION_KEY = 'speakerShuffleSeed'

function getOrCreateSeed() {
  let seed = sessionStorage.getItem(SESSION_KEY)
  if (!seed) {
    seed = String(Math.floor(Math.random() * 2147483647))
    sessionStorage.setItem(SESSION_KEY, seed)
  }
  return parseInt(seed, 10)
}

// Simple seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Returns a shuffled copy of the array using a session-stable seed.
 * Same seed → same shuffle order every time within the session.
 */
export function sessionShuffle(arr) {
  const seed = getOrCreateSeed()
  const rng = mulberry32(seed)
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
