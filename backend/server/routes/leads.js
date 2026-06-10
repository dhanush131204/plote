const express = require('express')
const db = require('../db')
const prisma = require('../prisma')
const { sendLeadWebhook } = require('../leadWebhook')
const { throttle } = require('../throttle')
const { authMiddleware } = require('../middleware/auth')

function generateTrackingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'PV-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

const router = express.Router()

const postThrottle = throttle({ windowMs: 60_000, max: 60 })

const normalizeLeadDate = (value) => {
  if (value === null || value === undefined || value === '') return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null

  return value
}

router.get('/track/:trackingId', async (req, res) => {
  try {
    const lead = db.prepare(`
      SELECT l.*, layouts.name AS layoutName, layouts.slug AS layoutSlug 
      FROM leads l 
      JOIN layouts ON layouts.id = l.layoutId 
      WHERE l.trackingId = ?
    `).get(req.params.trackingId)
    
    if (!lead) return res.status(404).json({ error: 'Tracking ID not found' })

    let meta = {}
    try {
      meta = lead.metadata ? JSON.parse(lead.metadata) : {}
    } catch {
      meta = {}
    }

    res.json({
      id: lead.id,
      trackingId: lead.trackingId,
      layoutId: lead.layoutId,
      layoutName: lead.layoutName,
      layoutSlug: lead.layoutSlug,
      plotId: lead.plotId,
      unitId: lead.unitId || null,
      unitFloor: meta.floor ?? null,
      unitTower: meta.tower ?? null,
      inventoryType: meta.inventoryType || null,
      customerName: lead.customerName,
      status: lead.status || 'new',
      statusUpdatedAt: normalizeLeadDate(lead.statusUpdatedAt),
      createdAt: normalizeLeadDate(lead.createdAt),
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { email: true },
    })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const email = String(user.email || '').toLowerCase().trim()
    const rows = db.prepare(
      `SELECT l.*, layouts.name AS layoutName, layouts.slug AS layoutSlug
       FROM leads l
       JOIN layouts ON layouts.id = l.layoutId
       ORDER BY l.createdAt DESC`
    ).all()

    const leads = rows
      .map((lead) => {
        let meta = {}
        try {
          meta = lead.metadata ? JSON.parse(lead.metadata) : {}
        } catch {
          meta = {}
        }
        return {
          id: lead.id,
          layoutId: lead.layoutId,
          layoutName: lead.layoutName,
          layoutSlug: lead.layoutSlug,
          plotId: lead.plotId,
          unitId: lead.unitId || null,
          unitFloor: meta.floor ?? null,
          unitTower: meta.tower ?? null,
          inventoryType: meta.inventoryType || null,
          customerName: lead.customerName,
          contactNumber: lead.contactNumber,
          status: lead.status || 'new',
          statusUpdatedAt: normalizeLeadDate(lead.statusUpdatedAt),
          customerEmail: meta.email || null,
          createdAt: normalizeLeadDate(lead.createdAt),
        }
      })
      .filter((lead) => String(lead.customerEmail || '').toLowerCase().trim() === email)

    res.json({ leads, total: leads.length })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', postThrottle, async (req, res) => {
  try {
    const { layoutId, plotId, customerName, contactNumber, customerEmail } = req.body
    if (!layoutId || !plotId || !customerName || !contactNumber || !customerEmail?.trim()) {
      return res.status(400).json({ error: 'layoutId, plotId, customerName, contactNumber, customerEmail required' })
    }
    const emailTrim = String(customerEmail).trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return res.status(400).json({ error: 'Valid email required' })
    }
    const layout = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layoutId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    const plots = layout.plots ? JSON.parse(layout.plots) : []
    const plot = plots.find((p) => p.id == plotId || p.number == plotId)
    if (!plot) return res.status(400).json({ error: 'Invalid plot' })

    const layoutKind = layout.layoutKind || 'plot'
    const meta = { email: emailTrim }
    let unitId = null
    if (layoutKind === 'building') {
      meta.inventoryType = 'unit'
      meta.floor = plot.floor ?? null
      meta.tower = plot.tower ?? null
      meta.unitNumber = plot.number
      unitId = String(plot.id ?? plot.number)
    }

    const trackingId = generateTrackingId()

    const createdAt = new Date().toISOString()
    const stmt = db.prepare(
      'INSERT INTO leads (layoutId, plotId, customerName, contactNumber, customerEmail, trackingId, metadata, unitId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(layoutId, plotId, customerName, contactNumber, emailTrim, trackingId, JSON.stringify(meta), unitId, createdAt)
    const lead = db.prepare('SELECT * FROM leads WHERE id = last_insert_rowid()').get()

    const owner = db.prepare('SELECT autoWebhookOnSubmit FROM users WHERE id = ?').get(layout.userId)
    const auto = owner && Number(owner.autoWebhookOnSubmit) === 1

    if (layout.webhookUrl && auto) {
      try {
        await sendLeadWebhook(lead.id)
      } catch (err) {
        console.error('Lead webhook error:', err.message)
      }
    }

    res.status(201).json({ success: true, leadId: lead.id, trackingId: lead.trackingId })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
