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

  const hasAdmin = db.prepare("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1").get()
  if (hasAdmin) return

  const normalized = String(email).toLowerCase().trim()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized)
  const hash = await bcrypt.hash(password, 10)

  if (existing) {
    db.prepare("UPDATE users SET role = 'super_admin' WHERE id = ?").run(existing.id)
    console.log(`[bootstrap] Promoted existing user ${normalized} to super_admin`)
    return
  }

  db.prepare('INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)').run(normalized, hash, 'super_admin')
  console.log(`[bootstrap] Created super_admin user ${normalized}`)
}

module.exports = { bootstrapAdmin }
