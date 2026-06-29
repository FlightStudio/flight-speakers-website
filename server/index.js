import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { createLimiter } from './middleware/rateLimit.js'
import speakersRouter from './routes/speakers.js'
import enquiryRouter from './routes/enquiry.js'
import searchRouter from './routes/search.js'
import parseBriefRouter from './routes/parseBrief.js'
import adminRouter from './routes/admin/index.js'
import portalRouter from './routes/portal.js'
import availabilityRouter from './routes/availability.js'
import waitlistRouter from './routes/waitlist.js'
import pool from './db/connection.js'
import { runMigrations } from './db/migrate.js'
import { startDailyRefresh } from './services/socialStats.js'
import { startArticleScheduler } from './services/articleScheduler.js'
import articlesRouter from './routes/articles.js'

const app = express()
const PORT = process.env.PORT || 3001

// Trust the first proxy hop — Cloud Run terminates TLS at the load balancer
// and forwards the real client IP via X-Forwarded-For. Required for
// express-rate-limit to key by client IP rather than the LB IP.
app.set('trust proxy', 1)

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : ['http://localhost:3000']

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com", "https://images.unsplash.com"],
      mediaSrc: ["'self'", "blob:", "https://storage.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      frameSrc: ["https://www.youtube.com", "https://www.youtube-nocookie.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Rate limiters — Redis-backed when REDIS_URL is set, memory otherwise.
const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  prefix: 'rl:search:',
  skipBots: true,
  message: { success: false, message: 'Too many requests, please try again later' },
})

const enquiryLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'rl:enquiry:',
  message: { success: false, message: 'Too many enquiries submitted, please try again later' },
})

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'rl:login:',
  message: { success: false, message: 'Too many login attempts, please try again later' },
})

const portalLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'rl:portal:',
  message: { success: false, message: 'Too many requests, please try again later' },
})

// API Routes
app.use('/api/speakers', speakersRouter)
app.use('/api/enquiry', enquiryLimiter, enquiryRouter)
app.use('/api/search', searchLimiter, searchRouter)
app.use('/api/parse-brief', searchLimiter, parseBriefRouter)
app.use('/api/admin/login', loginLimiter)
app.use('/api/admin', adminRouter)
app.use('/api/portal', portalLimiter, portalRouter)
app.use('/api/availability', portalLimiter, availabilityRouter)
app.use('/api/waitlist', enquiryLimiter, waitlistRouter)
app.use('/api/articles', articlesRouter)

// API dashboard
app.get('/api', (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    now: new Date().toISOString()
  })
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() })
  }
})

// Error handling — never leak internal details to client
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
  })
})

// 404 handler
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  })
})

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
  try {
    await runMigrations()
    console.log('Migrations applied')
  } catch (err) {
    console.error('Migration failed:', err.message)
  }
  startDailyRefresh()
  startArticleScheduler()
})

export default app
