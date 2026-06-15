const jwt = require('jsonwebtoken')
const db = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const actualUserId = decoded.userId

    // Check if impersonation is requested
    const impersonateHeader = req.headers['x-impersonate-user-id']
    console.log('[AuthMiddleware] x-impersonate-user-id header:', impersonateHeader)
    if (impersonateHeader) {
      const impersonateUserId = Number(impersonateHeader)
      console.log('[AuthMiddleware] parsed impersonateUserId:', impersonateUserId, 'actualUserId:', actualUserId)
      if (impersonateUserId && impersonateUserId !== actualUserId) {
        // Verify that the actual user is a super admin
        const actualUser = db.prepare('SELECT role, status FROM users WHERE id = ?').get(actualUserId)
        console.log('[AuthMiddleware] actualUser role:', actualUser?.role, 'status:', actualUser?.status)
        if (actualUser && actualUser.role === 'super_admin' && actualUser.status !== 'disabled') {
          // Verify that the target user exists
          const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(impersonateUserId)
          console.log('[AuthMiddleware] targetUser exists:', Boolean(targetUser))
            if (targetUser) {
              console.warn(`[SECURITY] [IMPERSONATION] Super Admin (ID: ${actualUserId}) is impersonating User (ID: ${targetUser.id}) on path ${req.method} ${req.path}`)
              req.userId = targetUser.id
              return next()
            }
        }
      }
    }

    req.userId = actualUserId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
