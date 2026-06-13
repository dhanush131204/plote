const db = require('../db')

function requireSuperAdmin(req, res, next) {
  try {
    const row = db.prepare('SELECT role, status FROM users WHERE id = ?').get(req.userId)
    if (!row || row.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Super Admin only' })
    }
    if (row.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the super admin.' })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

function requireAdmin(req, res, next) {
  try {
    const row = db.prepare('SELECT role, status FROM users WHERE id = ?').get(req.userId)
    if (!row || (row.role !== 'admin' && row.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin only' })
    }
    if (row.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the super admin.' })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { requireAdmin, requireSuperAdmin }
