// Rate-limiter factory. Backed by Redis when REDIS_URL is configured,
// otherwise falls back to express-rate-limit's in-memory store.
//
// In-memory works fine for a single Cloud Run instance but the limit is
// per-instance, so 3 running instances effectively triple the cap. Redis
// makes the limit cluster-wide.
//
// Provider-agnostic: any redis:// or rediss:// URL works (Cloud Memorystore
// via VPC connector, Upstash, ElastiCache, local docker, etc.).

import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

let redisClient = null

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      // Don't throw on initial connect failure — we'll log and fall back.
      lazyConnect: false,
    })
    redisClient.on('error', (err) => {
      console.warn('[rate-limit] Redis error:', err.message)
    })
    console.log('[rate-limit] Using Redis store')
  } catch (err) {
    console.warn('[rate-limit] Failed to init Redis, falling back to memory:', err.message)
    redisClient = null
  }
} else {
  console.log('[rate-limit] No REDIS_URL set — using in-memory store (per-instance)')
}

export function createLimiter(options = {}) {
  const store = redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: options.prefix || 'rl:',
      })
    : undefined
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    store,
  })
}
