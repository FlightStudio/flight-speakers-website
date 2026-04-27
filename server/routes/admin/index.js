// Admin router — composed of domain sub-routers under server/routes/admin/.
// Top-level CSRF gate runs before any sub-router; /login is exempt because
// the cookie pair doesn't exist yet at first sign-in.
import express from 'express'
import { requireCsrf } from '../../middleware/auth.js'

import authRouter from './auth.js'
import analyticsRouter from './analytics.js'
import speakersRouter from './speakers.js'
import enquiriesRouter from './enquiries.js'
import reviewRouter from './review.js'
import templatesRouter from './templates.js'
import integrationsRouter from './integrations.js'
import socialStatsRouter from './socialStats.js'

const router = express.Router()

// CSRF gate for mutating admin requests. Login bypasses (no cookie yet).
// GET/HEAD/OPTIONS bypass (no state change).
router.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  if (req.path === '/login') return next()
  return requireCsrf(req, res, next)
})

// All sub-routers are mounted at the root so their internal paths line up
// with /api/admin/<path> when this router is mounted at /api/admin.
router.use('/', authRouter)
router.use('/', analyticsRouter)
router.use('/', speakersRouter)
router.use('/', enquiriesRouter)
router.use('/', reviewRouter)
router.use('/', templatesRouter)
router.use('/', integrationsRouter)
router.use('/', socialStatsRouter)

export default router
