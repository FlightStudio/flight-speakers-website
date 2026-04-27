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
import pool from './db/connection.js'
import { runMigrations } from './db/migrate.js'
import { startDailyRefresh } from './services/socialStats.js'

const app = express()
const PORT = process.env.PORT || 3001

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

// API dashboard
app.get('/api', async (req, res) => {
  let dbStatus = 'disconnected'
  let speakerCount = 0
  let enquiryCount = 0
  try {
    await pool.query('SELECT 1')
    dbStatus = 'connected'
    const { rows } = await pool.query('SELECT count(*) AS count FROM speakers')
    speakerCount = parseInt(rows[0].count, 10)
  } catch { /* db offline */ }

  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const mins = Math.floor((uptime % 3600) / 60)
  const secs = Math.floor(uptime % 60)
  const uptimeStr = `${hours}h ${mins}m ${secs}s`
  const isOk = dbStatus === 'connected'

  const endpoints = [
    { method: 'GET', path: '/api/speakers', desc: 'List all speakers', params: 'topic, audience, limit' },
    { method: 'GET', path: '/api/speakers/meta/topics', desc: 'List all topics', params: '' },
    { method: 'GET', path: '/api/speakers/meta/audiences', desc: 'List all audiences', params: '' },
    { method: 'GET', path: '/api/speakers/:id', desc: 'Speaker detail + related', params: '' },
    { method: 'GET', path: '/api/search?q=', desc: 'AI semantic search', params: 'q, limit' },
    { method: 'GET', path: '/api/search/suggest?q=', desc: 'Search suggestions', params: 'q' },
    { method: 'POST', path: '/api/enquiry', desc: 'Submit enquiry', params: 'body: name, email, organization, brief...' },
    { method: 'GET', path: '/api/enquiry', desc: 'List enquiries (admin)', params: '' },
    { method: 'GET', path: '/api/health', desc: 'Health check', params: '' },
  ]

  const endpointRows = endpoints.map(ep => `
    <tr>
      <td><span class="method ${ep.method.toLowerCase()}">${ep.method}</span></td>
      <td><a href="${ep.method === 'GET' ? ep.path.split('/:')[0] : '#'}" class="path">${ep.path}</a></td>
      <td>${ep.desc}</td>
      <td class="params">${ep.params || '—'}</td>
    </tr>
  `).join('')

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Speakers API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a; color: #e0e0e0; padding: 2rem; min-height: 100vh;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header { margin-bottom: 2.5rem; }
    h1 { font-size: 1.75rem; font-weight: 600; color: #fff; margin-bottom: .25rem; }
    h1 span { color: #666; font-weight: 400; font-size: 0.9rem; margin-left: .5rem; }
    .subtitle { color: #888; font-size: 0.9rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
    .card {
      background: #141414; border: 1px solid #222; border-radius: 10px; padding: 1.25rem;
    }
    .card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: .08em; color: #666; margin-bottom: .5rem; }
    .card .value { font-size: 1.5rem; font-weight: 600; color: #fff; }
    .card .value.ok { color: #22c55e; }
    .card .value.degraded { color: #ef4444; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; background: #141414; border-radius: 10px; overflow: hidden; border: 1px solid #222; }
    th { text-align: left; padding: .75rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: .08em; color: #666; background: #111; border-bottom: 1px solid #222; }
    td { padding: .6rem 1rem; border-bottom: 1px solid #1a1a1a; font-size: 0.875rem; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #1a1a1a; }
    .method {
      display: inline-block; padding: .15rem .5rem; border-radius: 4px;
      font-size: 0.7rem; font-weight: 700; letter-spacing: .04em;
    }
    .method.get { background: #0d3320; color: #22c55e; }
    .method.post { background: #332b0d; color: #eab308; }
    .path { color: #93c5fd; text-decoration: none; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.8rem; }
    .path:hover { text-decoration: underline; }
    .params { color: #666; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.75rem; }
    footer { margin-top: 2.5rem; color: #444; font-size: 0.75rem; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Flight Speakers API <span>v0.0.1</span></h1>
      <p class="subtitle">Speaker booking platform backend</p>
    </header>

    <div class="cards">
      <div class="card">
        <div class="label">Status</div>
        <div class="value ${isOk ? 'ok' : 'degraded'}">${isOk ? 'Operational' : 'Degraded'}</div>
      </div>
      <div class="card">
        <div class="label">Database</div>
        <div class="value ${isOk ? 'ok' : 'degraded'}">${dbStatus}</div>
      </div>
      <div class="card">
        <div class="label">Speakers</div>
        <div class="value">${speakerCount}</div>
      </div>
      <div class="card">
        <div class="label">Uptime</div>
        <div class="value">${uptimeStr}</div>
      </div>
    </div>

    <h2>Endpoints</h2>
    <table>
      <thead>
        <tr><th>Method</th><th>Path</th><th>Description</th><th>Params</th></tr>
      </thead>
      <tbody>${endpointRows}</tbody>
    </table>

    <footer>Flight Story &middot; ${new Date().toISOString()}</footer>
  </div>
</body>
</html>`)
})

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
})

export default app
