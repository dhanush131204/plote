const express = require('express')
const db = require('../db')
const { throttle } = require('../throttle')

const router = express.Router()

const ALLOWED_EVENTS = new Set(['page_view', 'plot_select', 'unit_select', 'filter_change'])

const postThrottle = throttle({ windowMs: 60_000, max: 120 })

router.post('/', postThrottle, (req, res) => {
  try {
    const { layoutId, sessionId, eventType, payload } = req.body
    const lid = Number(layoutId)
    if (!lid || !sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'layoutId and sessionId required' })
    }
    if (sessionId.length > 64) {
      return res.status(400).json({ error: 'Invalid sessionId' })
    }
    if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' })
    }
    const layout = db.prepare('SELECT id FROM layouts WHERE id = ?').get(lid)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })

    let payloadStr = null
    if (payload != null) {
      try {
        payloadStr = JSON.stringify(payload).slice(0, 4000)
      } catch {
        return res.status(400).json({ error: 'Invalid payload' })
      }
    }

    const ua = String(req.headers['user-agent'] || '').slice(0, 512)
    db.prepare(
      'INSERT INTO activity_events (layoutId, sessionId, eventType, payload, userAgent) VALUES (?, ?, ?, ?, ?)'
    ).run(lid, sessionId, eventType, payloadStr, ua || null)

    if (eventType === 'page_view') {
      db.prepare('UPDATE layouts SET viewCount = viewCount + 1 WHERE id = ?').run(lid)
    }

    res.status(201).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
