/** Simple sliding-window rate limiter per IP (in-memory). */
const buckets = new Map()

function throttle({ windowMs = 60_000, max = 60 }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    let b = buckets.get(ip)
    if (!b || now - b.start > windowMs) {
      b = { start: now, count: 0 }
      buckets.set(ip, b)
    }
    b.count += 1
    if (b.count > max) {
      return res.status(429).json({ error: 'Too many requests' })
    }
    next()
  }
}

module.exports = { throttle }
