const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('../prisma')
const { authMiddleware } = require('../middleware/auth')
const { requireAdmin } = require('../middleware/admin')
const { sendLeadWebhook } = require('../leadWebhook')

const router = express.Router()

router.use(authMiddleware)
router.use(requireAdmin)

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        autoWebhookOnSubmit: true,
        createdAt: true,
      },
    })
    res.json(
      users.map((u) => ({
        ...u,
        autoWebhookOnSubmit: Boolean(u.autoWebhookOnSubmit),
      }))
    )
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/users', async (req, res) => {
  try {
    const { email, password, autoWebhookOnSubmit } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' })
    }
    const hash = await bcrypt.hash(password, 10)
    const aw = autoWebhookOnSubmit ? 1 : 0
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash: hash,
        role: 'user',
        autoWebhookOnSubmit: aw,
      },
    })
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      autoWebhookOnSubmit: Boolean(user.autoWebhookOnSubmit),
      createdAt: user.createdAt,
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    const target = await prisma.user.findUnique({
      where: { id },
    })
    if (!target) return res.status(404).json({ error: 'User not found' })

    const { email, role, autoWebhookOnSubmit, password } = req.body
    const dataObj = {}

    if (email !== undefined) {
      const nextEmail = String(email).toLowerCase().trim()
      if (!nextEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' })
      }
      const taken = await prisma.user.findFirst({
        where: { email: nextEmail, NOT: { id } },
      })
      if (taken) return res.status(400).json({ error: 'Email already in use' })
      dataObj.email = nextEmail
    }

    if (role !== undefined) {
      const nextRole = String(role) === 'admin' ? 'admin' : 'user'
      if (target.role === 'admin' && nextRole === 'user') {
        const adminCount = await prisma.user.count({
          where: { role: 'admin' },
        })
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the last administrator' })
        }
      }
      dataObj.role = nextRole
    }

    if (autoWebhookOnSubmit !== undefined) {
      dataObj.autoWebhookOnSubmit = autoWebhookOnSubmit ? 1 : 0
    }
    if (password !== undefined && String(password).trim() !== '') {
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }
      const hash = await bcrypt.hash(String(password), 10)
      dataObj.passwordHash = hash
    }

    if (Object.keys(dataObj).length === 0) {
      const u = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, autoWebhookOnSubmit: true, createdAt: true },
      })
      return res.json({ ...u, autoWebhookOnSubmit: Boolean(u.autoWebhookOnSubmit) })
    }

    const u = await prisma.user.update({
      where: { id },
      data: dataObj,
      select: { id: true, email: true, role: true, autoWebhookOnSubmit: true, createdAt: true },
    })
    res.json({ ...u, autoWebhookOnSubmit: Boolean(u.autoWebhookOnSubmit) })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/leads', async (req, res) => {
  try {
    const layoutId = req.query.layoutId ? Number(req.query.layoutId) : null
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const offset = (page - 1) * limit

    const whereObj = layoutId ? { layoutId } : {}
    const total = await prisma.lead.count({ where: whereObj })
    const rows = await prisma.lead.findMany({
      where: whereObj,
      include: {
        layout: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const leads = rows.map((r) => {
      let meta = {}
      try {
        meta = r.metadata ? JSON.parse(r.metadata) : {}
      } catch {
        meta = {}
      }
      return {
        id: r.id,
        layoutId: r.layoutId,
        layoutName: r.layout.name,
        layoutSlug: r.layout.slug,
        plotId: r.plotId,
        unitId: r.unitId || null,
        unitFloor: meta.floor ?? null,
        unitTower: meta.tower ?? null,
        inventoryType: meta.inventoryType || null,
        customerName: r.customerName,
        contactNumber: r.contactNumber,
        customerEmail: meta.email || null,
        webhookDeliveredAt: r.webhookDeliveredAt || null,
        webhookLastError: r.webhookLastError || null,
        createdAt: r.createdAt,
      }
    })

    res.json({ leads, total, page, limit })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/leads/:id/push-webhook', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    const result = await sendLeadWebhook(id)
    if (!result.ok && result.error === 'Layout has no webhook URL') {
      return res.status(400).json({ error: result.error })
    }
    if (!result.ok) {
      return res.status(422).json({ error: result.error || 'Webhook request failed' })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.get('/activity', async (req, res) => {
  try {
    const layoutId = req.query.layoutId ? Number(req.query.layoutId) : undefined
    const sessionId = req.query.sessionId ? String(req.query.sessionId).slice(0, 64) : undefined
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))

    const whereObj = {}
    if (layoutId) whereObj.layoutId = layoutId
    if (sessionId) whereObj.sessionId = sessionId

    const rows = await prisma.activityEvent.findMany({
      where: whereObj,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const events = rows.map((r) => {
      let payload = null
      if (r.payload) {
        try {
          payload = JSON.parse(r.payload)
        } catch {
          payload = null
        }
      }
      return {
        id: r.id,
        layoutId: r.layoutId,
        sessionId: r.sessionId,
        eventType: r.eventType,
        payload,
        userAgent: r.userAgent,
        createdAt: r.createdAt,
      }
    })

    res.json({ events })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
