const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const db = require('../db')
const prisma = require('../prisma')
const { parseLayout } = require('../utils/layoutParse')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const { requireAdmin } = require('../middleware/admin')
const { PLAN_LIMITS } = require('../config/subscriptionConfig')

const router = express.Router()
const uploadDir = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const layoutId = req.body?.layoutId || req.params?.id || 'temp'
    const dir = path.join(uploadDir, String(layoutId))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, 'plot.png'),
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
  },
})

const floorUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadDir, String(req.params.id))
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const floorId =
        String(req.query?.floorId || req.body?.floorId || 'floor').replace(/[^a-zA-Z0-9_-]/g, '') || 'floor'
      cb(null, `floor-${floorId}.png`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
  },
})

const facadeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadDir, String(req.params.id))
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      if (file.originalname.match(/\.(glb|gltf)$/i)) {
        cb(null, 'facade.glb')
      } else {
        cb(null, 'facade.png')
      }
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype) || file.originalname.match(/\.(glb|gltf)$/i)) cb(null, true)
    else cb(new Error('Invalid file type'))
  },
})

const apartmentMediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const layoutId = String(req.params.id)
      const dir = path.join(uploadDir, 'Apartment', layoutId)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const floorId =
        String(req.query?.floorId || req.body?.floorId || 'floor').replace(/[^a-zA-Z0-9_-]/g, '') || 'floor'
      const configId =
        String(req.query?.configId || req.body?.configId || 'cfg').replace(/[^a-zA-Z0-9_-]/g, '') || 'cfg'
      const kind = String(req.query?.kind || req.body?.kind || 'image').toLowerCase()
      const ext =
        kind === 'video'
          ? /^video\/webm/.test(file.mimetype)
            ? 'webm'
            : 'mp4'
          : /^image\/webp/.test(file.mimetype)
            ? 'webp'
            : 'png'
      cb(null, `f-${floorId}-${configId}-${Date.now()}.${ext}`)
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const kind = String(req.query?.kind || req.body?.kind || 'image').toLowerCase()
    if (kind === 'video') {
      if (/^video\/(mp4|webm)$/.test(file.mimetype)) cb(null, true)
      else cb(new Error('Invalid video type (use mp4 or webm)'))
    } else if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
  },
})

function defaultBuildingJson() {
  return JSON.stringify({
    floors: [],
    towers: [{ id: 'A', label: 'Tower A' }],
    embed3dUrl: null,
    facadeImagePath: null,
  })
}

function normalizeConfigEntry(c) {
  if (!c || typeof c !== 'object') return null
  const id = String(c.id || '').replace(/[^a-zA-Z0-9_-]/g, '') || 'cfg'
  return {
    id,
    label: c.label != null ? String(c.label) : id,
    imagePath: c.imagePath != null ? String(c.imagePath) : null,
    images: Array.isArray(c.images) ? c.images.map(String) : (c.imagePath ? [String(c.imagePath)] : []),
    videoPath: c.videoPath != null ? String(c.videoPath) : null,
    areaSqft: typeof c.areaSqft === 'number' ? c.areaSqft : (parseFloat(c.areaSqft) || 0),
    areaSqm: typeof c.areaSqm === 'number' ? c.areaSqm : (parseFloat(c.areaSqm) || 0),
    pricePerSqft: typeof c.pricePerSqft === 'number' ? c.pricePerSqft : (parseInt(c.pricePerSqft, 10) || 0),
    description: c.description != null ? String(c.description) : null,
    rooms: c.rooms && typeof c.rooms === 'object' ? c.rooms : {},
  }
}

function normalizeFloorEntry(f) {
  if (!f || typeof f !== 'object') return null
  const id = String(f.id || '').replace(/[^a-zA-Z0-9_-]/g, '') || 'floor'
  const configurations = Array.isArray(f.configurations)
    ? f.configurations.map(normalizeConfigEntry).filter(Boolean)
    : []
  return {
    id,
    label: f.label != null ? String(f.label) : id,
    sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : Number(f.sortOrder) || 0,
    imagePath: f.imagePath != null ? String(f.imagePath) : null,
    configurations,
  }
}



function parseBuildingInput(raw) {
  if (raw == null || raw === '') return null
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!obj || typeof obj !== 'object') return null
    const towers = Array.isArray(obj.towers) && obj.towers.length
        ? obj.towers.map((t) => ({ id: String(t.id || 'A'), label: t.label != null ? String(t.label) : String(t.id || 'A') }))
        : [{ id: 'A', label: 'Tower A' }]
    const floors = Array.isArray(obj.floors) ? obj.floors.map(normalizeFloorEntry).filter(Boolean) : []
    
    let embed3dUrl = obj.embed3dUrl != null ? String(obj.embed3dUrl) : null
    if (embed3dUrl && !/^https?:\/\//i.test(embed3dUrl) && !/^\/\//.test(embed3dUrl)) {
      embed3dUrl = null
    }

    const out = {
      floors,
      towers,
      embed3dUrl,
      facadeImagePath: obj.facadeImagePath != null ? String(obj.facadeImagePath) : null,
    }
    return JSON.stringify(out)
  } catch {
    return null
  }
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'layout'
}

async function checkLayoutLimit(userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { plan: true },
  })
  if (!user) {
    return { allowed: false, error: 'User not found' }
  }

  const limits = PLAN_LIMITS[user.plan || 'FREE'] || PLAN_LIMITS.FREE
  if (limits.layouts === Infinity) {
    return { allowed: true }
  }

  const currentCount = await prisma.layout.count({ where: { userId: Number(userId) } })
  if (currentCount >= limits.layouts) {
    return {
      allowed: false,
      error: 'Layout limit reached. Upgrade your plan.',
    }
  }

  return { allowed: true }
}

router.get('/by-slug/:slug', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT l.id, l.userId, l.name, l.slug, l.shareToken, l.imagePath, l.model3dPath, l.overlayConfig, l.plots, l.phaseInfo, l.webhookUrl, l.layoutKind, l.building, l.status,
             u.companyName, u.name as builderName, u.logo as logoPath, u.rera, u.experience, u.projectsDelivered, u.phone as builderPhone, u.alternatePhone as builderAlternatePhone
      FROM layouts l
      LEFT JOIN users u ON l.userId = u.id
      WHERE l.slug = ?
    `).get(req.params.slug)
    
    if (!row) return res.status(404).json({ error: 'Layout not found' })

    let isOwner = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(jwtToken, JWT_SECRET);
        console.log('[DEBUG] decoded.userId:', decoded.userId, 'type:', typeof decoded.userId, 'row.userId:', row.userId, 'type:', typeof row.userId);
        if (String(decoded.userId) === String(row.userId)) {
          isOwner = true;
        }
      } catch (err) {
        console.log('[DEBUG] JWT Verify error:', err.message);
      }
    } else {
      console.log('[DEBUG] No authHeader found in request');
    }

    if (!isOwner) {
      const token = req.query.token;
      console.log('[DEBUG] Not owner. Provided token:', token, 'Expected:', row.shareToken);
      if (row.shareToken && row.shareToken !== token) {
        return res.status(403).json({ error: 'Access denied. Invalid or missing token.' })
      }
    }
    
    const parsed = parseLayout(row)
    parsed.owner = {
      id: row.userId,
      companyName: row.companyName || null,
      name: row.builderName || null,
      logoPath: row.logoPath || null,
      rera: row.rera || null,
      experience: row.experience != null ? Number(row.experience) : null,
      projectsDelivered: row.projectsDelivered != null ? Number(row.projectsDelivered) : null,
      phone: row.builderPhone || null,
      alternatePhone: row.builderAlternatePhone || null
    }
    
    res.json(parsed)
  } catch (err) {
    console.error('Error in /by-slug/:slug:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.use(authMiddleware)

async function getLayoutForUser(layoutId, userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { role: true }
  })
  if (!user) return null
  if (user.role === 'super_admin') {
    return db.prepare('SELECT * FROM layouts WHERE id = ?').get(layoutId)
  }
  return db.prepare('SELECT * FROM layouts WHERE id = ? AND userId = ?').get(layoutId, userId)
}

router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true },
    })
    const isAdmin = user?.role === 'super_admin';
    const rows = isAdmin 
      ? db.prepare(
        'SELECT l.id, l.name, l.slug, l.shareToken, l.imagePath, l.model3dPath, l.layoutKind, l.building, l.plots, l.overlayConfig, l.phaseInfo, l.createdAt, l.userId, l.status, u.companyName, u.name as builderName, u.role as builderRole FROM layouts l LEFT JOIN users u ON l.userId = u.id ORDER BY l.createdAt DESC'
      ).all()
      : db.prepare(
        'SELECT l.id, l.name, l.slug, l.shareToken, l.imagePath, l.model3dPath, l.layoutKind, l.building, l.plots, l.overlayConfig, l.phaseInfo, l.createdAt, l.userId, l.status, u.companyName, u.name as builderName, u.role as builderRole FROM layouts l LEFT JOIN users u ON l.userId = u.id WHERE l.userId = ? ORDER BY l.createdAt DESC'
      ).all(req.userId);

    const layouts = rows.map((row) => {
      const parsed = {
        layoutKind: row.layoutKind || 'plot',
        building: row.building ? JSON.parse(row.building) : null,
        plots: row.plots ? JSON.parse(row.plots) : [],
        phaseInfo: row.phaseInfo ? JSON.parse(row.phaseInfo) : {},
      }
      const cardImagePath =
        parsed.layoutKind === 'building' && parsed.building?.facadeImagePath
          ? parsed.building.facadeImagePath
          : row.imagePath
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        shareToken: row.shareToken,
        imagePath: cardImagePath,
        layoutKind: parsed.layoutKind,
        plots: parsed.plots,
        floors: parsed.building?.floors || [],
        phaseInfo: parsed.phaseInfo,
        createdAt: row.createdAt,
        userId: row.userId,
        status: row.status || 'draft',
        companyName: row.builderRole === 'super_admin' ? 'Super Admin' : row.companyName,
        builderName: row.builderRole === 'super_admin' ? 'Super Admin' : row.builderName,
      }
    })
    res.json(layouts)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    res.json(parseLayout(layout))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function postLayoutHandler(req, res) {
  try {
    const { name, slug: slugInput, layoutKind: kindInput, building: buildingRaw } = req.body || {}
    const layoutKind = String(kindInput || 'plot').toLowerCase() === 'building' ? 'building' : 'plot'
    const layoutName = name || (layoutKind === 'building' ? 'Untitled building' : 'Untitled Layout')
    let slug = (slugInput || slugify(layoutName)).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (db.prepare('SELECT id FROM layouts WHERE slug = ?').get(slug)) {
      slug = `${slug}-${Date.now()}`
    }
    const buildingJson = layoutKind === 'building' ? parseBuildingInput(buildingRaw) || defaultBuildingJson() : null
    const overlayDefault =
      layoutKind === 'building' ? JSON.stringify({ byFloor: {}, facadeByFloor: {} }) : '{}'

    const shareToken = crypto.randomBytes(4).toString('hex')
    if (req.file) {
      const stmt = db.prepare(
        'INSERT INTO layouts (userId, name, slug, shareToken, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      stmt.run(req.userId, layoutName, slug, shareToken, '{}', '[]', '{}', null, 'plot', null, 'draft', new Date().toISOString())
      const layout = db.prepare('SELECT id FROM layouts WHERE id = last_insert_rowid()').get()
      const finalDir = path.join(uploadDir, String(layout.id))
      if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true })
      const destPath = path.join(finalDir, 'plot.png')
      fs.renameSync(req.file.path, destPath)
      const imagePath = `${layout.id}/plot.png`
      db.prepare('UPDATE layouts SET imagePath = ? WHERE id = ?').run(imagePath, layout.id)
      const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
      return res.status(201).json(parseLayout(full))
    }
    const stmt = db.prepare(
      'INSERT INTO layouts (userId, name, slug, shareToken, imagePath, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(req.userId, layoutName, slug, shareToken, null, overlayDefault, '[]', '{}', null, layoutKind, buildingJson, 'draft', new Date().toISOString())
    const layout = db.prepare('SELECT * FROM layouts WHERE id = last_insert_rowid()').get()
    res.status(201).json(parseLayout(layout))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
}

router.post(
  '/',
  requireAdmin, (req, res, next) => {
    if (req.is('multipart/form-data')) {
      upload.single('image')(req, res, next)
    } else {
      next()
    }
  },
  async (req, res) => {
    const limitCheck = await checkLayoutLimit(req.userId)
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: limitCheck.error })
    }
    return postLayoutHandler(req, res)
  }
)

router.post('/:id/convert-to-building', requireAdmin, async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    const buildingObj = {
      floors: [],
      towers: [{ id: 'A', label: 'Tower A' }],
      embed3dUrl: null,
      facadeImagePath: layout.imagePath || null,
    }
    const buildingJson = parseBuildingInput(buildingObj) || JSON.stringify(buildingObj)
    const overlayJson = JSON.stringify({ byFloor: {}, facadeByFloor: {} })
    db.prepare(
      'UPDATE layouts SET layoutKind = ?, building = ?, overlayConfig = ? WHERE id = ?'
    ).run('building', buildingJson, overlayJson, req.params.id)
    const updated = db.prepare('SELECT * FROM layouts WHERE id = ?').get(req.params.id)
    res.json(parseLayout(updated))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })

    const { name, slug, layoutKind, building, overlayConfig, plots, phaseInfo, webhookUrl, status } = req.body || {}

    const nameVal = name !== undefined ? name : layout.name
    let slugVal = slug !== undefined ? slug : layout.slug
    if (slugVal && slugVal !== layout.slug) {
      slugVal = slugify(slugVal).toLowerCase().replace(/[^a-z0-9-]/g, '-')
      if (db.prepare('SELECT id FROM layouts WHERE slug = ? AND id != ?').get(slugVal, layout.id)) {
        slugVal = `${slugVal}-${Date.now()}`
      }
    }
    const layoutKindVal = layoutKind !== undefined ? layoutKind : (layout.layoutKind || 'plot')
    
    let buildingVal = layout.building
    if (building !== undefined) {
      if (layoutKindVal === 'building') {
        let parsed = null
        try {
          parsed = typeof building === 'string' ? JSON.parse(building) : building
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON format in building layout configuration data' })
        }
        if (!parsed || typeof parsed !== 'object') {
          return res.status(400).json({ error: 'Building layout config must be a JSON object structure' })
        }
        buildingVal = parseBuildingInput(building) || defaultBuildingJson()
      } else {
        buildingVal = null
      }
    }

    let overlayConfigVal = layout.overlayConfig
    if (overlayConfig !== undefined) {
      try {
        const parsed = typeof overlayConfig === 'string' ? JSON.parse(overlayConfig) : overlayConfig
        if (parsed && typeof parsed !== 'object') {
          return res.status(400).json({ error: 'Overlay Configuration must be a valid JSON object structure' })
        }
        overlayConfigVal = JSON.stringify(parsed)
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format in overlay configuration' })
      }
    }

    let plotsVal = layout.plots
    if (plots !== undefined) {
      try {
        const parsed = typeof plots === 'string' ? JSON.parse(plots) : plots
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ error: 'Plots layout data must be a valid JSON Array list structure' })
        }
        plotsVal = JSON.stringify(parsed)
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format in plots layout data' })
      }
    }

    let phaseInfoVal = layout.phaseInfo
    if (phaseInfo !== undefined) {
      try {
        const parsed = typeof phaseInfo === 'string' ? JSON.parse(phaseInfo) : phaseInfo
        if (parsed && typeof parsed !== 'object') {
          return res.status(400).json({ error: 'Phase information must be a valid JSON object structure' })
        }
        phaseInfoVal = JSON.stringify(parsed)
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format in phase information' })
      }
    }

    const webhookUrlVal = webhookUrl !== undefined ? webhookUrl : layout.webhookUrl
    if (webhookUrlVal && webhookUrlVal.trim() !== '' && !/^https?:\/\//i.test(webhookUrlVal)) {
      return res.status(400).json({ error: 'Invalid webhook URL protocol. Must start with http:// or https://' })
    }
    const statusVal = status !== undefined ? status : layout.status

    db.prepare(`
      UPDATE layouts 
      SET name = ?, slug = ?, layoutKind = ?, building = ?, overlayConfig = ?, plots = ?, phaseInfo = ?, webhookUrl = ?, status = ?
      WHERE id = ?
    `).run(
      nameVal, 
      slugVal, 
      layoutKindVal, 
      buildingVal, 
      overlayConfigVal, 
      plotsVal, 
      phaseInfoVal, 
      webhookUrlVal, 
      statusVal, 
      layout.id
    )

    const updated = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
    res.json(parseLayout(updated))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.put('/:id/image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    if (!req.file) return res.status(400).json({ error: 'No image file' })
    const destDir = path.join(uploadDir, String(layout.id))
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
    const destPath = path.join(destDir, 'plot.png')
    fs.renameSync(req.file.path, destPath)
    db.prepare('UPDATE layouts SET imagePath = ? WHERE id = ?').run(`${layout.id}/plot.png`, layout.id)
    res.json({ imagePath: `${layout.id}/plot.png` })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.put('/:id/floor-image', requireAdmin, floorUpload.single('image'), async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    if (!req.file) return res.status(400).json({ error: 'No image file' })
    const floorId = String(req.query?.floorId || req.body?.floorId || '').replace(/[^a-zA-Z0-9_-]/g, '')
    if (!floorId) return res.status(400).json({ error: 'floorId required (query or body)' })

    let building = {}
    try {
      building = layout.building ? JSON.parse(layout.building) : {}
    } catch {
      building = {}
    }
    const floors = Array.isArray(building.floors) ? building.floors : []
    const relPath = `${layout.id}/floor-${floorId}.png`
    const idx = floors.findIndex((f) => f && f.id === floorId)
    if (idx >= 0) {
      floors[idx] = { ...floors[idx], imagePath: relPath }
    } else {
      floors.push({
        id: floorId,
        label: floorId,
        sortOrder: floors.length,
        imagePath: relPath,
      })
    }
    building.floors = floors
    if (!Array.isArray(building.towers) || !building.towers.length) {
      building.towers = [{ id: 'A', label: 'Tower A' }]
    }
    db.prepare('UPDATE layouts SET building = ?, layoutKind = ? WHERE id = ?').run(
      JSON.stringify(building),
      'building',
      layout.id
    )
    res.json({ imagePath: relPath, building })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.put('/:id/facade-image', requireAdmin, facadeUpload.single('image'), async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    if (!req.file) return res.status(400).json({ error: 'No file' })
    let building = {}
    try {
      building = layout.building ? JSON.parse(layout.building) : {}
    } catch {
      building = {}
    }
    
    const is3DFile = req.file.originalname.match(/\.(glb|gltf)$/i) || req.file.filename.endsWith('.glb')
    const is3DTarget = req.body.target === '3d' || is3DFile
    
    if (is3DTarget) {
      const ext = req.file.originalname.split('.').pop() || 'glb'
      const relPath = `${layout.id}/facade.${ext}`
      db.prepare('UPDATE layouts SET model3dPath = ?, layoutKind = ? WHERE id = ?').run(relPath, 'building', layout.id)
    } else {
      const ext = req.file.originalname.split('.').pop() || 'png'
      const relPath = `${layout.id}/facade.${ext}`
      building.facadeImagePath = relPath
      if (!Array.isArray(building.towers) || !building.towers.length) {
        building.towers = [{ id: 'A', label: 'Tower A' }]
      }
      const buildingJson = parseBuildingInput(building)
      db.prepare('UPDATE layouts SET building = ?, layoutKind = ? WHERE id = ?').run(buildingJson, 'building', layout.id)
    }
    
    const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
    res.json({ model3dPath: full.model3dPath, building: parseLayout(full).building })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.put('/:id/apartment-media', requireAdmin, apartmentMediaUpload.single('file'), async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const floorId = String(req.query?.floorId || req.body?.floorId || '').replace(/[^a-zA-Z0-9_-]/g, '')
    const configId = String(req.query?.configId || req.body?.configId || '').replace(/[^a-zA-Z0-9_-]/g, '')
    const kind = String(req.query?.kind || req.body?.kind || 'image').toLowerCase()
    const plotId = String(req.query?.plotId || req.body?.plotId || '')
    if (!floorId || !configId) return res.status(400).json({ error: 'floorId and configId required' })
    if (kind !== 'image' && kind !== 'video') return res.status(400).json({ error: 'kind must be image or video' })

    const relPath = `Apartment/${layout.id}/${req.file.filename}`
    const roomId = String(req.query?.roomId || req.body?.roomId || '').replace(/[^a-zA-Z0-9_-]/g, '')

    if (plotId) {
      // Save on individual plot/unit level
      let plots = []
      try {
        plots = layout.plots ? JSON.parse(layout.plots) : []
      } catch {
        plots = []
      }
      const pidx = plots.findIndex((p) => String(p.id) === String(plotId))
      if (pidx >= 0) {
        const p = { ...plots[pidx] }
        if (roomId) {
          if (!p.rooms) p.rooms = {}
          p.rooms[roomId] = relPath
        }
        if (kind === 'video') {
          p.videoPath = relPath
        } else {
          p.imagePath = relPath
          if (!Array.isArray(p.images)) {
            p.images = p.imagePath ? [p.imagePath] : []
          }
          if (!p.images.includes(relPath)) {
            p.images.push(relPath)
          }
        }
        plots[pidx] = p
      }
      db.prepare('UPDATE layouts SET plots = ? WHERE id = ?').run(JSON.stringify(plots), layout.id)
    } else {
      // Fallback: Save on configuration template level
      let building = {}
      try {
        building = layout.building ? JSON.parse(layout.building) : {}
      } catch {
        building = {}
      }
      const floors = Array.isArray(building.floors) ? [...building.floors] : []
      let idx = floors.findIndex((f) => f && f.id === floorId)
      if (idx < 0) {
        return res.status(400).json({ error: 'Floor not found on layout' })
      }
      const floor = { ...floors[idx] }
      const configs = Array.isArray(floor.configurations) ? [...floor.configurations] : []
      let cidx = configs.findIndex((c) => c && c.id === configId)
      if (cidx < 0) {
        configs.push({ id: configId, label: configId, imagePath: null, videoPath: null })
        cidx = configs.length - 1
      }
      const cfg = { ...configs[cidx] }
      if (roomId) {
        if (!cfg.rooms) cfg.rooms = {}
        cfg.rooms[roomId] = relPath
      }
      if (kind === 'video') {
        cfg.videoPath = relPath
      } else {
        cfg.imagePath = relPath
        if (!Array.isArray(cfg.images)) {
          cfg.images = cfg.imagePath ? [cfg.imagePath] : []
        }
        if (!cfg.images.includes(relPath)) {
          cfg.images.push(relPath)
        }
      }
      configs[cidx] = cfg
      floor.configurations = configs
      floors[idx] = floor
      building.floors = floors
      const buildingJson = parseBuildingInput(building)
      db.prepare('UPDATE layouts SET building = ?, layoutKind = ? WHERE id = ?').run(buildingJson, 'building', layout.id)
    }

    const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
    const parsed = parseLayout(full)
    res.json({ path: relPath, kind, building: parsed.building, plots: parsed.plots })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    db.prepare('DELETE FROM leads WHERE layoutId = ?').run(layout.id)
    db.prepare('DELETE FROM activity_events WHERE layoutId = ?').run(layout.id)
    db.prepare('DELETE FROM layouts WHERE id = ?').run(layout.id)
    const imgDir = path.join(uploadDir, String(layout.id))
    if (fs.existsSync(imgDir)) fs.rmSync(imgDir, { recursive: true })
    const aptDir = path.join(uploadDir, 'Apartment', String(layout.id))
    if (fs.existsSync(aptDir)) fs.rmSync(aptDir, { recursive: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
