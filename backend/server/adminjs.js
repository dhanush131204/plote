const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const { Database, Resource } = require('@adminjs/prisma')
const prisma = require('./prisma')
const bcrypt = require('bcrypt')

// Register the Prisma adapter
AdminJS.registerAdapter({ Database, Resource })

// Mock _baseDmmf on the prisma client to bridge the gap with Prisma v5
const modelMap = {}
for (const [key, value] of Object.entries(prisma._runtimeDataModel.models)) {
  modelMap[key] = {
    ...value,
    name: key
  }
}
prisma._baseDmmf = {
  modelMap: modelMap,
  datamodelEnumMap: prisma._runtimeDataModel.enums || {}
}

const adminJS = new AdminJS({
  databases: [prisma],
  rootPath: '/adminjs',
  branding: {
    companyName: 'Plot Project Admin',
  }
})

// Build authenticated router
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(adminJS, {
  authenticate: async (email, password) => {
    try {
      if (!email || !password) return null
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
      if (!user || user.role !== 'admin') return null
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (valid) return { email: user.email, role: user.role }
    } catch (err) {
      console.error('AdminJS auth error:', err)
    }
    return null
  },
  cookiePassword: process.env.COOKIE_PASSWORD || 'some-secret-password-at-least-32-chars-long',
  cookieName: 'adminjs_session'
}, null, {
  secret: process.env.SESSION_SECRET || 'some-other-secret-session-key-at-least-32-chars',
  resave: false,
  saveUninitialized: true
})

module.exports = {
  adminJS,
  adminRouter
}
