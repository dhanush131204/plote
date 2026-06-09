const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'plotapp.db')

const db = new Database(dbPath)

function tableColumns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
}

function migrate() {
  let usersCols = tableColumns('users')
  if (!usersCols.includes('role')) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`)
    db.prepare(`UPDATE users SET role = 'user' WHERE role IS NULL`).run()
  }
  usersCols = tableColumns('users')
  if (!usersCols.includes('autoWebhookOnSubmit')) {
    db.exec(`ALTER TABLE users ADD COLUMN autoWebhookOnSubmit INTEGER DEFAULT 0`)
    db.prepare(`UPDATE users SET autoWebhookOnSubmit = 0 WHERE autoWebhookOnSubmit IS NULL`).run()
  }

  let leadsCols = tableColumns('leads')
  if (!leadsCols.includes('webhookDeliveredAt')) {
    db.exec(`ALTER TABLE leads ADD COLUMN webhookDeliveredAt TEXT`)
  }
  leadsCols = tableColumns('leads')
  if (!leadsCols.includes('webhookLastError')) {
    db.exec(`ALTER TABLE leads ADD COLUMN webhookLastError TEXT`)
  }
  leadsCols = tableColumns('leads')
  if (!leadsCols.includes('unitId')) {
    db.exec(`ALTER TABLE leads ADD COLUMN unitId TEXT`)
  }
  leadsCols = tableColumns('leads')
  if (!leadsCols.includes('status')) {
    db.exec(`ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'new'`)
    db.prepare(`UPDATE leads SET status = 'new' WHERE status IS NULL`).run()
  }
  leadsCols = tableColumns('leads')
  if (!leadsCols.includes('statusUpdatedAt')) {
    db.exec(`ALTER TABLE leads ADD COLUMN statusUpdatedAt TEXT`)
  }

  let layoutsCols = tableColumns('layouts')
  if (!layoutsCols.includes('layoutKind')) {
    db.exec(`ALTER TABLE layouts ADD COLUMN layoutKind TEXT DEFAULT 'plot'`)
    db.prepare(`UPDATE layouts SET layoutKind = 'plot' WHERE layoutKind IS NULL`).run()
  }
  layoutsCols = tableColumns('layouts')
  if (!layoutsCols.includes('building')) {
    db.exec(`ALTER TABLE layouts ADD COLUMN building TEXT`)
  }
  try {
    db.prepare(
      `UPDATE layouts SET layoutKind = 'building'
       WHERE building IS NOT NULL AND TRIM(building) != '' AND TRIM(building) != 'null'
         AND (layoutKind IS NULL OR layoutKind = 'plot')`
    ).run()
  } catch {
    /* ignore */
  }
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    imagePath TEXT,
    overlayConfig TEXT,
    plots TEXT,
    phaseInfo TEXT,
    webhookUrl TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layoutId INTEGER NOT NULL,
    plotId INTEGER NOT NULL,
    customerName TEXT NOT NULL,
    contactNumber TEXT NOT NULL,
    metadata TEXT,
    status TEXT DEFAULT 'new',
    statusUpdatedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (layoutId) REFERENCES layouts(id)
  );

  CREATE INDEX IF NOT EXISTS idx_layouts_userId ON layouts(userId);
  CREATE INDEX IF NOT EXISTS idx_layouts_slug ON layouts(slug);
  CREATE INDEX IF NOT EXISTS idx_leads_layoutId ON leads(layoutId);
`)

migrate()

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layoutId INTEGER NOT NULL,
    sessionId TEXT NOT NULL,
    eventType TEXT NOT NULL,
    payload TEXT,
    userAgent TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (layoutId) REFERENCES layouts(id)
  );
  CREATE INDEX IF NOT EXISTS idx_activity_layout_created ON activity_events(layoutId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_activity_session ON activity_events(sessionId);
`)

module.exports = db
