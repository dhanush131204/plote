/**
 * Usage: node server/scripts/create-user.js <email> <password>
 * Creates a company user (role user) or updates password if email exists.
 */
const bcrypt = require('bcrypt')
const prisma = require('../prisma')

async function main() {
  const email = (process.argv[2] || '').toLowerCase().trim()
  const password = process.argv[3] || ''
  if (!email || !password) {
    console.error('Usage: node server/scripts/create-user.js <email> <password>')
    process.exit(1)
  }
  const hash = await bcrypt.hash(password, 10)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: hash },
    })
    console.log('Updated password for', email)
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'user',
        autoWebhookOnSubmit: 0,
      },
    })
    console.log('Created user', email)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
