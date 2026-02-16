import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h', algorithm: 'HS256' })
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    req.admin = { id: decoded.sub, username: decoded.username }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
