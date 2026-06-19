const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../prisma')
const db = require('../db')
const { JWT_SECRET, authMiddleware } = require('../middleware/auth')
const { sendBuilderWelcomeEmail } = require('../utils/email')

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
    const userRow = db.prepare('SELECT id, email, role, autoWebhookOnSubmit, name, companyName, logo, phone, alternatePhone, address, city, state, country, gst, rera, website, about, documents, status FROM users WHERE id = ?').get(req.userId)
    if (!userRow) return res.status(401).json({ error: 'Unauthorized' })
    if (userRow.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the super admin.' })
    }
    const userProfile = {
      ...userRow,
      autoWebhookOnSubmit: Boolean(userRow.autoWebhookOnSubmit)
    }
    res.json({ user: userProfile })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const {
      name, companyName, phone, alternatePhone, address, city, state, country,
      gst, rera, experience, projectsDelivered, website, about, documents
    } = req.body
    
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name || null,
        companyName: companyName || null,
        phone: phone || null,
        alternatePhone: alternatePhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        gst: gst || null,
        rera: rera || null,
        experience: experience ? parseInt(experience, 10) : null,
        projectsDelivered: projectsDelivered ? parseInt(projectsDelivered, 10) : null,
        website: website || null,
        about: about || null,
        documents: documents || null,
      }
    })
    
    res.json({ user: updated })
  } catch (err) {
    console.error("Profile update error:", err)
    res.status(500).json({ error: 'Failed to update profile' })
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

// ─── Builder Self-Registration ───────────────────────────────────────────────
router.post('/register-builder', async (req, res) => {
  try {
    const { name, companyName, phone, email, password, plan } = req.body

    // Validate required fields
    if (!name || !companyName || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' })
    }
    // Validate phone — exactly 10 digits
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' })
    }
    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Generate a unique magic login token (valid 24h)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        name: name.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
        autoWebhookOnSubmit: 0,
        status: 'active',
        // Store token in documents field temporarily (no schema migration needed)
        documents: JSON.stringify({ verificationToken, tokenExpiry, plan: plan || null }),
      },
    })

    // Send welcome email with magic link
    try {
      await sendBuilderWelcomeEmail({
        to: normalizedEmail,
        name: name.trim(),
        token: verificationToken,
        plan: plan || null,
      })
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr.message)
      // Don't fail registration if email fails — user is already created
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the login link.',
      email: normalizedEmail,
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'This email is already registered.' })
    }
    console.error('Builder register error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ─── Verify Magic Token (email link click) ────────────────────────────────────
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' })
    }

    // Find user where verificationToken matches inside documents JSON
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, role: true, name: true, documents: true, status: true },
    })

    let matchedUser = null
    let planFromToken = null

    for (const u of users) {
      try {
        if (!u.documents) continue
        const parsed = JSON.parse(u.documents)
        if (parsed.verificationToken === token) {
          // Check expiry
          if (new Date(parsed.tokenExpiry) < new Date()) {
            return res.status(400).json({ error: 'This login link has expired. Please contact your administrator.' })
          }
          matchedUser = u
          planFromToken = parsed.plan || null
          break
        }
      } catch (_) {}
    }

    if (!matchedUser) {
      return res.status(400).json({ error: 'Invalid or already used login link.' })
    }

    if (matchedUser.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled.' })
    }

    // Clear the token after use (one-time use)
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: { documents: null },
    })

    // Issue a real JWT session token
    const jwtToken = jwt.sign({ userId: matchedUser.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        role: matchedUser.role,
        name: matchedUser.name,
      },
      plan: planFromToken,
    })
  } catch (err) {
    console.error('Verify token error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
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
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the super admin.' })
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

// Multer and routes for user logo upload/delete
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, 'logos')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `user-${req.userId}${ext}`)
  }
})

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
  }
})

router.put('/me/logo', authMiddleware, (req, res, next) => {
  logoUpload.single('logo')(req, res, (err) => {
    if (err) {
      console.error("Multer error during logo upload:", err)
      return res.status(400).json({ error: err.message || 'File upload error' })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' })
    const logoPath = `logos/${req.file.filename}`
    await prisma.user.update({
      where: { id: req.userId },
      data: { logo: logoPath }
    })
    res.json({ success: true, logo: logoPath })
  } catch (err) {
    console.error("Logo upload error:", err)
    res.status(500).json({ error: 'Failed to upload logo' })
  }
})

router.delete('/me/logo', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (user && user.logo) {
      const filePath = path.join(uploadDir, user.logo)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    await prisma.user.update({
      where: { id: req.userId },
      data: { logo: null }
    })
    res.json({ success: true })
  } catch (err) {
    console.error("Logo delete error:", err)
    res.status(500).json({ error: 'Failed to delete logo' })
  }
})

module.exports = router
