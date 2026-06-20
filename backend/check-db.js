const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'data/plotapp.db'))
try {
  const info = db.prepare("PRAGMA table_info(layouts)").all()
  console.log("Columns:", info.map(i => i.name))
  const res = db.prepare("UPDATE layouts SET model3dPath = 'test.glb' WHERE id = 1").run()
  console.log("Update success:", res)
} catch (err) {
  console.error("DB Error:", err)
}
