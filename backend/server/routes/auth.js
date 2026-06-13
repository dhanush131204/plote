const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const db = require('../db')
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
    const userRow = db.prepare('SELECT id, email, role, autoWebhookOnSubmit, name, companyName, logo, phone, alternatePhone, address, city, state, country, gst, rera, website, about, facebook, instagram, linkedin, youtube, documents, status FROM users WHERE id = ?').get(req.userId)
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
      gst, rera, website, about, facebook, instagram, linkedin, youtube, documents
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
        website: website || null,
        about: about || null,
        facebook: facebook || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        youtube: youtube || null,
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
