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

// Clean up expired rate limiting buckets every 5 minutes to prevent unbounded memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, b] of buckets.entries()) {
    // Evict bucket if it has been inactive longer than 10 minutes
    if (now - b.start > 10 * 60_000) {
      buckets.delete(ip)
    }
  }
}, 5 * 60_000).unref()

module.exports = { throttle }
