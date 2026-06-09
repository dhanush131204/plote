const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db')
const prisma = require('../prisma')
const { parseLayout } = require('../utils/layoutParse')
const { authMiddleware } = require('../middleware/auth')
const { requireAdmin } = require('../middleware/admin')

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
    filename: (req, file, cb) => cb(null, 'facade.png'),
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
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
      cb(null, `f-${floorId}-${configId}.${ext}`)
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
    videoPath: c.videoPath != null ? String(c.videoPath) : null,
    areaSqft: typeof c.areaSqft === 'number' ? c.areaSqft : (parseFloat(c.areaSqft) || 0),
    areaSqm: typeof c.areaSqm === 'number' ? c.areaSqm : (parseFloat(c.areaSqm) || 0),
    pricePerSqft: typeof c.pricePerSqft === 'number' ? c.pricePerSqft : (parseInt(c.pricePerSqft, 10) || 0),
    description: c.description != null ? String(c.description) : null,
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
    const towers =
      Array.isArray(obj.towers) && obj.towers.length
        ? obj.towers.map((t) => ({ id: String(t.id || 'A'), label: t.label != null ? String(t.label) : String(t.id || 'A') }))
        : [{ id: 'A', label: 'Tower A' }]
    const floors = Array.isArray(obj.floors) ? obj.floors.map(normalizeFloorEntry).filter(Boolean) : []
    const out = {
      floors,
      towers,
      embed3dUrl: obj.embed3dUrl != null ? String(obj.embed3dUrl) : null,
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

router.get('/by-slug/:slug', (req, res) => {
  try {
    const layout = db.prepare(
      'SELECT id, name, slug, imagePath, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building FROM layouts WHERE slug = ?'
    ).get(req.params.slug)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    res.json(parseLayout(layout))
  } catch (err) {
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
  return db.prepare('SELECT * FROM layouts WHERE id = ?').get(layoutId)
}

router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: { role: true },
    })
    const rows = db.prepare(
      'SELECT id, name, slug, imagePath, layoutKind, building, plots, overlayConfig, phaseInfo, createdAt FROM layouts ORDER BY createdAt DESC'
    ).all();

    const layouts = rows.map((row) => {
      const parsed = parseLayout({
        ...row,
        plots: row.plots || '[]',
        overlayConfig: row.overlayConfig || '{}',
        phaseInfo: row.phaseInfo || '{}',
      })
      const cardImagePath =
        parsed.layoutKind === 'building' && parsed.building?.facadeImagePath
          ? parsed.building.facadeImagePath
          : row.imagePath
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        imagePath: cardImagePath,
        layoutKind: parsed.layoutKind,
        plots: parsed.plots,
        floors: parsed.building?.floors || [],
        phaseInfo: parsed.phaseInfo,
        createdAt: row.createdAt,
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

    let imagePath = null
    if (req.file) {
      const stmt = db.prepare(
        'INSERT INTO layouts (userId, name, slug, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      stmt.run(req.userId, layoutName, slug, '{}', '[]', '{}', null, 'plot', null)
      const layout = db.prepare('SELECT id FROM layouts WHERE id = last_insert_rowid()').get()
      const finalDir = path.join(uploadDir, String(layout.id))
      if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true })
      const destPath = path.join(finalDir, 'plot.png')
      fs.renameSync(req.file.path, destPath)
      imagePath = `${layout.id}/plot.png`
      db.prepare('UPDATE layouts SET imagePath = ? WHERE id = ?').run(imagePath, layout.id)
      const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
      return res.status(201).json(parseLayout(full))
    }
    const stmt = db.prepare(
      'INSERT INTO layouts (userId, name, slug, imagePath, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(req.userId, layoutName, slug, null, overlayDefault, '[]', '{}', null, layoutKind, buildingJson)
    const layout = db.prepare('SELECT * FROM layouts WHERE id = last_insert_rowid()').get()
    res.status(201).json(parseLayout(layout))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
}

router.post(
  '/',
  requireAdmin,
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      upload.single('image')(req, res, next)
    } else {
      next()
    }
  },
  postLayoutHandler
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
    const { name, slug, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building } = req.body
    const updates = []
    const values = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (slug !== undefined) {
      const s = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-')
      if (db.prepare('SELECT id FROM layouts WHERE slug = ? AND id != ?').get(s, req.params.id)) {
        return res.status(400).json({ error: 'Slug already in use' })
      }
      updates.push('slug = ?')
      values.push(s)
    }
    if (layoutKind !== undefined) {
      const lk = String(layoutKind).toLowerCase() === 'building' ? 'building' : 'plot'
      updates.push('layoutKind = ?')
      values.push(lk)
    }
    if (building !== undefined) {
      const bj = parseBuildingInput(building)
      updates.push('building = ?')
      values.push(bj)
    }
    if (overlayConfig !== undefined) { updates.push('overlayConfig = ?'); values.push(JSON.stringify(overlayConfig)) }
    if (plots !== undefined) { updates.push('plots = ?'); values.push(JSON.stringify(plots)) }
    if (phaseInfo !== undefined) { updates.push('phaseInfo = ?'); values.push(JSON.stringify(phaseInfo)) }
    if (webhookUrl !== undefined) { updates.push('webhookUrl = ?'); values.push(webhookUrl || null) }
    if (updates.length === 0) {
      const l = db.prepare('SELECT * FROM layouts WHERE id = ?').get(req.params.id)
      return res.json(parseLayout(l))
    }
    values.push(req.params.id)
    db.prepare(`UPDATE layouts SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM layouts WHERE id = ?').get(req.params.id)
    res.json(parseLayout(updated))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
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
    if (!req.file) return res.status(400).json({ error: 'No image file' })
    let building = {}
    try {
      building = layout.building ? JSON.parse(layout.building) : {}
    } catch {
      building = {}
    }
    const relPath = `${layout.id}/facade.png`
    building.facadeImagePath = relPath
    if (!Array.isArray(building.towers) || !building.towers.length) {
      building.towers = [{ id: 'A', label: 'Tower A' }]
    }
    const buildingJson = parseBuildingInput(building)
    db.prepare('UPDATE layouts SET building = ?, layoutKind = ? WHERE id = ?').run(buildingJson, 'building', layout.id)
    const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
    res.json({ imagePath: relPath, building: parseLayout(full).building })
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
    if (!floorId || !configId) return res.status(400).json({ error: 'floorId and configId required' })
    if (kind !== 'image' && kind !== 'video') return res.status(400).json({ error: 'kind must be image or video' })

    const relPath = `Apartment/${layout.id}/${req.file.filename}`
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
    if (kind === 'video') cfg.videoPath = relPath
    else cfg.imagePath = relPath
    configs[cidx] = cfg
    floor.configurations = configs
    floors[idx] = floor
    building.floors = floors
    if (!Array.isArray(building.towers) || !building.towers.length) {
      building.towers = [{ id: 'A', label: 'Tower A' }]
    }
    const buildingJson = parseBuildingInput(building)
    db.prepare('UPDATE layouts SET building = ?, layoutKind = ? WHERE id = ?').run(buildingJson, 'building', layout.id)
    const full = db.prepare('SELECT * FROM layouts WHERE id = ?').get(layout.id)
    res.json({ path: relPath, kind, building: parseLayout(full).building })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const layout = await getLayoutForUser(req.params.id, req.userId)
    if (!layout) return res.status(404).json({ error: 'Layout not found' })
    db.prepare('DELETE FROM leads WHERE layoutId = ?').run(req.params.id)
    db.prepare('DELETE FROM activity_events WHERE layoutId = ?').run(req.params.id)
    db.prepare('DELETE FROM layouts WHERE id = ?').run(req.params.id)
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
