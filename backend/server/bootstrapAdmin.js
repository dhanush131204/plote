const bcrypt = require('bcrypt')
const db = require('./db')

/**
 * If ADMIN_EMAIL and ADMIN_PASSWORD are set and no admin user exists, create one.
 * If the email already exists, promote that user to admin.
 */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return

  const hasAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()
  if (hasAdmin) return

  const normalized = String(email).toLowerCase().trim()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized)
  const hash = await bcrypt.hash(password, 10)

  if (existing) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id)
    console.log(`[bootstrap] Promoted existing user ${normalized} to admin`)
    return
  }

  db.prepare('INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)').run(normalized, hash, 'admin')
  console.log(`[bootstrap] Created admin user ${normalized}`)
}

module.exports = { bootstrapAdmin }
