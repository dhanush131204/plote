const express = require('express')
const db = require('../db')
const { sendLeadWebhook } = require('../leadWebhook')
const { throttle } = require('../throttle')

const router = express.Router()

const postThrottle = throttle({ windowMs: 60_000, max: 60 })

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

    const stmt = db.prepare(
      'INSERT INTO leads (layoutId, plotId, customerName, contactNumber, metadata, unitId) VALUES (?, ?, ?, ?, ?, ?)'
    )
    stmt.run(layoutId, plotId, customerName, contactNumber, JSON.stringify(meta), unitId)
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

    res.status(201).json({ success: true, leadId: lead.id })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
