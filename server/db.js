const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'leads.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    place_id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    rating REAL,
    rating_count INTEGER,
    business_status TEXT,
    auto_flag TEXT,
    auto_reason TEXT,
    manual_status TEXT,
    last_query TEXT,
    last_seen_at TEXT,
    pushed_to_crm_at TEXT
  );

  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    created_at TEXT
  );
`);

const businessColumns = db.prepare(`PRAGMA table_info(businesses)`).all().map((c) => c.name);
if (!businessColumns.includes('assigned_to')) {
  db.exec(`ALTER TABLE businesses ADD COLUMN assigned_to INTEGER`);
}

// Guards a column add for databases created before pushed_to_crm_at existed;
// SQLite has no "ADD COLUMN IF NOT EXISTS", so this just swallows the
// "duplicate column" error on a DB that already has it.
try {
  db.exec(`ALTER TABLE businesses ADD COLUMN pushed_to_crm_at TEXT`);
} catch {
  // already exists
}

const upsertStmt = db.prepare(`
  INSERT INTO businesses (
    place_id, name, phone, address, website, rating, rating_count,
    business_status, auto_flag, auto_reason, last_query, last_seen_at
  ) VALUES (
    @place_id, @name, @phone, @address, @website, @rating, @rating_count,
    @business_status, @auto_flag, @auto_reason, @last_query, @last_seen_at
  )
  ON CONFLICT(place_id) DO UPDATE SET
    name=excluded.name,
    phone=excluded.phone,
    address=excluded.address,
    website=excluded.website,
    rating=excluded.rating,
    rating_count=excluded.rating_count,
    business_status=excluded.business_status,
    auto_flag=excluded.auto_flag,
    auto_reason=excluded.auto_reason,
    last_query=excluded.last_query,
    last_seen_at=excluded.last_seen_at
`);

function upsertBusiness(row) {
  upsertStmt.run(row);
}

const markStmt = db.prepare(
  `UPDATE businesses SET manual_status = ? WHERE place_id = ?`
);

function setManualStatus(placeId, status) {
  markStmt.run(status, placeId);
}

const getStmt = db.prepare(`SELECT * FROM businesses WHERE place_id = ?`);

function getBusiness(placeId) {
  return getStmt.get(placeId);
}

const assignStmt = db.prepare(`UPDATE businesses SET assigned_to = ? WHERE place_id = ?`);

function setAssignee(placeId, personId) {
  assignStmt.run(personId, placeId);
}

const unassignByPersonStmt = db.prepare(
  `UPDATE businesses SET assigned_to = NULL WHERE assigned_to = ?`
);

const insertPersonStmt = db.prepare(`
  INSERT INTO people (name, contact, created_at) VALUES (?, ?, ?)
`);

function addPerson({ name, contact }) {
  const info = insertPersonStmt.run(name, contact || null, new Date().toISOString());
  return getPersonStmt.get(info.lastInsertRowid);
}

const getPersonStmt = db.prepare(`SELECT * FROM people WHERE id = ?`);

const listPeopleStmt = db.prepare(`SELECT * FROM people ORDER BY name COLLATE NOCASE ASC`);

function listPeople() {
  return listPeopleStmt.all();
}

const deletePersonStmt = db.prepare(`DELETE FROM people WHERE id = ?`);

function deletePerson(id) {
  unassignByPersonStmt.run(id);
  deletePersonStmt.run(id);
}

const markPushedStmt = db.prepare(
  `UPDATE businesses SET pushed_to_crm_at = ? WHERE place_id = ?`
);

function markPushed(placeId, when) {
  markPushedStmt.run(when, placeId);
}

module.exports = {
  db,
  upsertBusiness,
  setManualStatus,
  getBusiness,
  setAssignee,
  addPerson,
  listPeople,
  deletePerson,
  markPushed,
};
