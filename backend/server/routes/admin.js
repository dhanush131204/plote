const express = require('express')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const prisma = require('../prisma')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireAdmin, requireSuperAdmin } = require('../middleware/admin')
const { sendLeadWebhook } = require('../leadWebhook')
const { sendBuilderWelcomeEmail } = require('../utils/email')

const router = express.Router()

const normalizeLeadDate = (value) => {
  if (value === null || value === undefined || value === '') return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null

  return value
}

router.use(authMiddleware)
router.use(requireAdmin)

router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
        phone: true,
        companyName: true,
        autoWebhookOnSubmit: true,
        createdAt: true,
        _count: {
          select: { layouts: true }
        }
      }
    })
    const usersWithStats = await Promise.all(users.map(async u => {
      const leadsCount = await prisma.lead.count({
        where: { layout: { userId: u.id } }
      })
      return {
        ...u,
        totalLayouts: u._count.layouts,
        totalLeads: leadsCount,
        autoWebhookOnSubmit: Boolean(u.autoWebhookOnSubmit),
      }
    }))

    res.json(usersWithStats)
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, role, autoWebhookOnSubmit, companyName, name, phone, plan } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' })
    }
    const hash = await bcrypt.hash(password, 10)
    const aw = autoWebhookOnSubmit ? 1 : 0
    const nextRole = String(role) === 'admin' ? 'admin' : 'user'

    // Generate magic login token for the welcome email (valid 24h)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash: hash,
        role: nextRole,
        name: name || null,
        phone: phone || null,
        companyName: companyName || null,
        autoWebhookOnSubmit: aw,
        // Store magic token temporarily in documents field
        documents: nextRole === 'admin'
          ? JSON.stringify({ verificationToken, tokenExpiry, plan: plan || null })
          : null,
      },
    })

    // Send welcome email with magic link for admin/builder accounts
    if (nextRole === 'admin') {
      try {
        await sendBuilderWelcomeEmail({
          to: String(email).toLowerCase().trim(),
          name: name || email,
          token: verificationToken,
          plan: plan || null,
        })
      } catch (emailErr) {
        console.error('Failed to send welcome email to builder:', emailErr.message)
      }
    }

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      autoWebhookOnSubmit: Boolean(user.autoWebhookOnSubmit),
      createdAt: user.createdAt,
      emailSent: nextRole === 'admin',
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})


router.patch('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })

    const { role, autoWebhookOnSubmit, status, companyName } = req.body
    const updateData = {}
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (companyName !== undefined) updateData.companyName = companyName
    if (autoWebhookOnSubmit !== undefined) {
      updateData.autoWebhookOnSubmit = autoWebhookOnSubmit ? 1 : 0
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Fetch all layouts for this user
    const layouts = await prisma.layout.findMany({ where: { userId: id } })

    for (const layout of layouts) {
      // Delete leads & events
      await prisma.lead.deleteMany({ where: { layoutId: layout.id } })
      await prisma.activityEvent.deleteMany({ where: { layoutId: layout.id } })
      
      // Delete filesystem dirs
      const imgDir = path.join(__dirname, '..', '..', 'uploads', String(layout.id))
      if (fs.existsSync(imgDir)) fs.rmSync(imgDir, { recursive: true })
      const aptDir = path.join(__dirname, '..', '..', 'uploads', 'Apartment', String(layout.id))
      if (fs.existsSync(aptDir)) fs.rmSync(aptDir, { recursive: true })
    }

    // Delete the layouts
    await prisma.layout.deleteMany({ where: { userId: id } })

    // Deleting the user:
    await prisma.user.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user. Please check server logs.' })
  }
})

router.get('/analytics', requireSuperAdmin, async (req, res) => {
  try {
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } })
    const activeAdmins = await prisma.user.count({ where: { role: 'admin', status: 'active' } })
    const disabledAdmins = await prisma.user.count({ where: { role: 'admin', status: { not: 'active' } } })
    const totalProjects = await prisma.layout.count()
    const totalPlotMaps = await prisma.layout.count({ where: { layoutKind: 'plot' } })
    const totalBuildings = await prisma.layout.count({ where: { layoutKind: 'building' } })
    const totalLeads = await prisma.lead.count()
    const convertedLeads = await prisma.lead.count({ where: { status: 'sold' } })
    
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const isoDate = thirtyDaysAgo.toISOString()

    const recentLeads = await prisma.lead.count({
      where: { createdAt: { gte: isoDate } }
    })

    const recentProjects = await prisma.layout.count({
      where: { createdAt: { gte: isoDate } }
    })

    res.json({
      totalAdmins,
      activeAdmins,
      disabledAdmins,
      totalProjects,
      totalPlotMaps,
      totalBuildings,
      totalLeads,
      convertedLeads,
      conversionRate,
      recentLeads,
      recentProjects
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/leads', async (req, res) => {
  try {
    const layoutId = req.query.layoutId ? Number(req.query.layoutId) : null
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const offset = (page - 1) * limit

    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true },
    })
    const isSuperAdmin = user?.role === 'super_admin'

    let whereObj = {}
    if (layoutId) {
      whereObj.layoutId = layoutId
    }
    
    if (!isSuperAdmin) {
      whereObj.layout = { userId: req.userId }
    }

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
        layoutName: r.layout?.name || 'Deleted Project',
        layoutSlug: r.layout?.slug || '',
        plotId: r.plotId,
        unitId: r.unitId || null,
        unitFloor: meta.floor ?? null,
        unitTower: meta.tower ?? null,
        inventoryType: meta.inventoryType || null,
        inquiryType: meta.inquiryType || null,
        message: meta.message || null,
        customerName: r.customerName,
        contactNumber: r.contactNumber,
        status: r.status || 'new',
        statusUpdatedAt: normalizeLeadDate(r.statusUpdatedAt),
        customerEmail: meta.email || null,
        webhookDeliveredAt: normalizeLeadDate(r.webhookDeliveredAt),
        webhookLastError: r.webhookLastError || null,
        createdAt: normalizeLeadDate(r.createdAt),
      }
    })

    res.json({ leads, total, page, limit })
  } catch (err) {
    console.error("GET /admin/leads error:", err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/leads/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    const { status } = req.body
    const allowed = ['new', 'pending', 'approved', 'rejected', 'sold']
    if (!status || !allowed.includes(String(status))) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true }
    })
    const isSuperAdmin = user?.role === 'super_admin'

    const lead = await prisma.lead.findUnique({ 
      where: { id },
      include: { layout: true }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (!isSuperAdmin && lead.layout.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: String(status), statusUpdatedAt: new Date().toISOString() },
    })

    if (lead.layout) {
      let plotsList = []
      try {
        plotsList = lead.layout.plots ? JSON.parse(lead.layout.plots) : []
      } catch (e) {
        plotsList = []
      }

      let plotUpdated = false
      const mappedPlots = plotsList.map(p => {
        if (String(p.id) === String(lead.plotId) || String(p.number) === String(lead.plotId)) {
          plotUpdated = true
          if (status === 'sold') {
            return { ...p, status: 'Sold' }
          } else if (status === 'approved' || status === 'pending') {
            return { ...p, status: 'Booked' }
          } else {
            return { ...p, status: 'Available' }
          }
        }
        return p
      })

      if (plotUpdated) {
        await prisma.layout.update({
          where: { id: lead.layoutId },
          data: { plots: JSON.stringify(mappedPlots) }
        })
      }
    }

    res.json({ success: true, lead: {
      id: updated.id,
      status: updated.status,
      statusUpdatedAt: updated.statusUpdatedAt,
    } })
  } catch (err) {
    console.error("PATCH /leads/:id/status error:", err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/leads/:id/push-webhook', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true }
    })
    const isSuperAdmin = user?.role === 'super_admin'

    const lead = await prisma.lead.findUnique({ 
      where: { id },
      include: { layout: true }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (!isSuperAdmin && lead.layout.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

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

router.delete('/leads/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })

    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true },
    })
    const isSuperAdmin = user?.role === 'super_admin'

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { layout: true }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (!isSuperAdmin && lead.layout.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.lead.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete lead error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})


router.get('/activity', async (req, res) => {
  try {
    const layoutId = req.query.layoutId ? Number(req.query.layoutId) : undefined
    const sessionId = req.query.sessionId ? String(req.query.sessionId).slice(0, 64) : undefined
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))

    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true },
    })
    const isSuperAdmin = user?.role === 'super_admin'

    const whereObj = {}
    if (layoutId) whereObj.layoutId = layoutId
    if (sessionId) whereObj.sessionId = sessionId
    
    if (!isSuperAdmin) {
      whereObj.layout = { userId: req.userId }
    }

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
