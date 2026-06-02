const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const { JWT_SECRET, authMiddleware } = require('../middleware/auth')

const router = express.Router()

function userPublicRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    role: row.role || 'user',
    autoWebhookOnSubmit: Boolean(row.autoWebhookOnSubmit),
  }
}

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, role: true, autoWebhookOnSubmit: true }
    })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ user: userPublicRow(user) })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/signup', async (req, res) => {
  if (process.env.ALLOW_PUBLIC_SIGNUP !== 'true') {
    return res.status(403).json({ error: 'Registration is disabled. Contact your administrator.' })
  }
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'user',
        autoWebhookOnSubmit: 0,
      }
    })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ user: userPublicRow(user), token })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      user: userPublicRow(user),
      token,
    })
  } catch (err) {
    console.error("Login error details:", err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
