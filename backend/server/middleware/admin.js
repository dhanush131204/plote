const db = require('../db')

function requireAdmin(req, res, next) {
  try {
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId)
    if (!row || row.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { requireAdmin }
