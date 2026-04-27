import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from '../db/connection.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const TOKEN_TTL_SECONDS = 24 * 60 * 60

// jti is a unique id per token, used by the revocation list. Without it,
// `logout` can only clear the cookie — a copied JWT would remain valid for
// the full 24h. With jti + revoked_jwts table, logout invalidates the token
// server-side too.
export function signToken(payload) {
  const jti = crypto.randomBytes(16).toString('hex')
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: 'HS256',
    jwtid: jti,
  })
}

export async function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }

  if (decoded.jti) {
    try {
      const { rows } = await pool.query(
        'SELECT 1 FROM revoked_jwts WHERE jti = $1 LIMIT 1',
        [decoded.jti]
      )
      if (rows.length > 0) {
        return res.status(401).json({ success: false, message: 'Session has been revoked' })
      }
    } catch (err) {
      console.error('[requireAdmin] revocation check failed:', err.message)
      // If the DB is unreachable, fail closed (treat as unauthenticated).
      return res.status(503).json({ success: false, message: 'Auth unavailable' })
    }
  }

  req.admin = { id: decoded.sub, username: decoded.username, jti: decoded.jti }
  next()
}

// Double-submit CSRF token check. The csrf_token cookie is set on login
// (not httpOnly so the frontend can read it). The frontend echoes the value
// back via the X-CSRF-Token header on every mutating admin request. A
// cross-site forgery attempt would have the cookie (carried automatically)
// but couldn't read it to set the header — so the check fails.
export function requireCsrf(req, res, next) {
  const header = req.headers['x-csrf-token']
  const cookie = req.cookies?.csrf_token
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' })
  }
  next()
}

// Mark a JWT's jti as revoked. Used by the logout handler. Best-effort:
// if the DB write fails, we still clear the cookie client-side — but the
// token would remain server-valid until expiry. Worth logging.
export async function revokeJti(jti, expiresAt) {
  if (!jti) return
  try {
    await pool.query(
      'INSERT INTO revoked_jwts (jti, expires_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING',
      [jti, expiresAt]
    )
  } catch (err) {
    console.error('[revokeJti] insert failed:', err.message)
  }
}
