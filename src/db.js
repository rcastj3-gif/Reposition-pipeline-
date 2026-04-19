const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.db');
const db = new Database(dbPath);

// Disable foreign key constraints for now (we'll add proper contact caching later)
db.pragma('foreign_keys = OFF');

// Initialize base tables
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    last_activity TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT,
    score INTEGER,
    urgency_score INTEGER,
    budget_score INTEGER,
    engagement_score INTEGER,
    timeline_score INTEGER,
    days_since_activity INTEGER,
    scored_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT,
    subject TEXT,
    body TEXT,
    pattern TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT,
    reply_text TEXT,
    classification TEXT,
    subtype TEXT,
    confidence TEXT,
    booking_status TEXT DEFAULT 'not_ready',
    next_action TEXT,
    classified_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_email TEXT,
    dormant_count INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid',
    report_status TEXT DEFAULT 'draft',
    markdown_path TEXT,
    html_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    paid_at TEXT,
    sent_at TEXT
  );
`);

function ensureColumn(tableName, columnName, columnDef) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }
}

ensureColumn('reports', 'send_log_path', 'TEXT');
ensureColumn('reports', 'send_count', 'INTEGER DEFAULT 0');
ensureColumn('reports', 'last_error', 'TEXT');
ensureColumn('reports', 'pdf_path', 'TEXT');
ensureColumn('replies', 'booking_status', "TEXT DEFAULT 'not_ready'");
ensureColumn('replies', 'next_action', 'TEXT');
ensureColumn('replies', 'booking_link', 'TEXT');
ensureColumn('replies', 'appointment_status', "TEXT DEFAULT 'not_booked'");
ensureColumn('replies', 'appointment_time', 'TEXT');
ensureColumn('replies', 'recovered_value', 'REAL DEFAULT 0');
ensureColumn('replies', 'booking_notes', 'TEXT');

console.log('✅ Database initialized (better-sqlite3)');

module.exports = db;
