/**
 * Usage: ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=secret node server/scripts/create-admin.js
 * Creates admin user or promotes existing email to admin.
 */
const bcrypt = require('bcrypt')
const prisma = require('../prisma')

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD')
    process.exit(1)
  }
  const normalized = String(email).toLowerCase().trim()
  const hash = await bcrypt.hash(password, 10)
  const existing = await prisma.user.findUnique({ where: { email: normalized } })
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin' },
    })
    console.log('Promoted to admin:', normalized)
  } else {
    await prisma.user.create({
      data: {
        email: normalized,
        passwordHash: hash,
        role: 'admin',
        autoWebhookOnSubmit: 0,
      },
    })
    console.log('Created admin:', normalized)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
