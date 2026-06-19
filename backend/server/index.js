const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or set to default in production mode.')
  }
  const cookieSecret = process.env.COOKIE_SECRET
  if (!cookieSecret || cookieSecret.includes('super-secret-password') || cookieSecret.includes('super-secret-session')) {
    throw new Error('FATAL: COOKIE_SECRET environment variable is missing or set to default in production mode.')
  }
}

const http = require('http')
const express = require('express')
const cors = require('cors')
const fs = require('fs')
require('./db')

const { bootstrapAdmin } = require('./bootstrapAdmin')
const authRoutes = require('./routes/auth')
const layoutsRoutes = require('./routes/layouts')
const leadsRoutes = require('./routes/leads')
const activityRoutes = require('./routes/activity')
const adminRoutes = require('./routes/admin')

const app = express()
const httpServer = http.createServer(app)
const PORT = process.env.PORT || 3002
const projectRoot = path.join(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

const isProd = process.env.NODE_ENV === 'production'
const serveBuiltSpa =
  (isProd || process.env.SERVE_SPA === '1') && fs.existsSync(distPath)

/** Allow any localhost / 127.0.0.1 port in dev so split Vite (5173) + API still works with credentials. */
function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true)
  const fixed = process.env.FRONTEND_URL
  if (fixed && origin === fixed) return callback(null, true)
  if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return callback(null, true)
  }
  return callback(null, false)
}

const { adminJs, adminRouter } = require('../admin/admin')

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Mount AdminJS dashboard
app.use(adminJs.options.rootPath, adminRouter)

app.use('/api/auth', authRoutes)
app.use('/api/layouts', layoutsRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/admin', adminRoutes)
const subscriptionRoutes = require('./routes/subscription')
app.use('/api/subscription', subscriptionRoutes)

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
  })
})

app.use('/uploads', express.static(path.join(projectRoot, 'uploads')))

;(async () => {
  try {
    await bootstrapAdmin()
  } catch (err) {
    console.error('bootstrapAdmin failed:', err)
  }

  if (serveBuiltSpa) {
    app.use(express.static(distPath))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else if (isProd) {
    app.use((_req, res) => {
      res.status(503).type('html').send('<p>Production build missing. Run <code>npm run build</code> then <code>npm start</code>.</p>')
    })
  } else {
    app.get('/', (_req, res) => {
      res
        .type('html')
        .send(
          '<p>API server is running. Start the frontend separately in development mode using <code>npm run dev:client</code>.</p>'
        )
    })
  }

  httpServer.listen(PORT, () => {
    if (serveBuiltSpa) {
      console.log(`Plot app: http://localhost:${PORT}/ (API + static build)`)
    } else {
      console.log(`Plot API server: http://localhost:${PORT}/ (Development API only)`)
    }
  })
})()

