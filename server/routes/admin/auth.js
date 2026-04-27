import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { signToken, requireAdmin, revokeJti } from '../../middleware/auth.js'
import { getAdminUser } from '../../db/admin-queries.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' })
    }

    const user = await getAdminUser(username)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = signToken({ sub: user.id, username: user.username })

    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
    })

    // CSRF token: NOT httpOnly so the frontend can read it and echo via header.
    const csrfToken = crypto.randomBytes(32).toString('hex')
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    })

    res.json({ success: true, user: { username: user.username } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Login failed' })
  }
})

router.post('/logout', async (req, res) => {
  // Revoke the JWT server-side so a stolen copy can't be reused for the
  // remainder of the 24h window. Decode without verifying signature: the
  // token is in our cookie, we already trust it; we just need the jti and exp.
  const token = req.cookies?.admin_token
  if (token) {
    try {
      const decoded = jwt.decode(token)
      if (decoded?.jti && decoded?.exp) {
        await revokeJti(decoded.jti, new Date(decoded.exp * 1000))
      }
    } catch (err) {
      console.warn('[logout] failed to decode token for revocation:', err.message)
    }
  }
  res.clearCookie('admin_token')
  res.clearCookie('csrf_token')
  res.json({ success: true })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, user: req.admin })
})

export default router
