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

// Legitimate search, social, and AI crawlers we want to keep indexing the site
// (for SEO ranking + GEO/answer-engine ranking on the News content).
// UA spoofing is possible but the only abuse it enables is "claim to be
// Googlebot to bypass rate limits" — the tradeoff favours discoverability on
// safe (GET) endpoints. Mutating endpoints (login, enquiry, portal) should
// NOT skip — pass `skipBots: false` (default).
//
// SEO crawlers: Google, Bing, DuckDuckGo, Yahoo, Yandex, Baidu, Apple, social.
// GEO crawlers: ChatGPT (GPTBot, ChatGPT-User, OAI-SearchBot), Anthropic
// (ClaudeBot, Claude-Web, anthropic-ai), Perplexity (PerplexityBot),
// Google Gemini (Google-Extended), Amazon (Amazonbot), Apple AI
// (Applebot-Extended), TikTok (Bytespider), Common Crawl (CCBot),
// You.com (YouBot), Cohere (cohere-ai), Meta AI (Meta-ExternalAgent).
const KNOWN_CRAWLERS = /(Googlebot|Bingbot|DuckDuckBot|Slurp|YandexBot|Baiduspider|AppleBot|FacebookExternalHit|Twitterbot|LinkedInBot|Mediapartners-Google|AdsBot-Google|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Google-Extended|Amazonbot|Applebot-Extended|Bytespider|CCBot|YouBot|cohere-ai|Meta-ExternalAgent)/i

// Strip `prefix` from options before passing to rateLimit — express-rate-limit
// v8 validates options strictly and treats unknown keys as errors. The prefix
// is only meaningful for the Redis store, not the limiter itself.
export function createLimiter({ skipBots = false, prefix, ...options } = {}) {
  const store = redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: prefix || 'rl:',
      })
    : undefined
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipBots
      ? (req) => KNOWN_CRAWLERS.test(req.headers['user-agent'] || '')
      : undefined,
    ...options,
    store,
  })
}
