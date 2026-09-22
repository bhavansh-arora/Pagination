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
    last_seen_at TEXT
  );
`);

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

module.exports = { db, upsertBusiness, setManualStatus, getBusiness };
