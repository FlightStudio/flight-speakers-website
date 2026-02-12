import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = { id: decoded.sub, username: decoded.username }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
