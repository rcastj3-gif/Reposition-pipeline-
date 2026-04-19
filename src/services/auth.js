const bcrypt = require('bcryptjs');
const db = require('../db');

function ensureUsersTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function ensureDefaultUser() {
  ensureUsersTable();
  const email = process.env.OPERATOR_EMAIL || 'admin@local';
  const password = process.env.OPERATOR_PASSWORD || 'changeme123';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, 'admin');
    console.log(`🔐 Created default operator user: ${email}`);
  }
}

function authenticate(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, role: user.role };
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  const nextUrl = encodeURIComponent(req.originalUrl || '/operator');
  return res.redirect(`/login?next=${nextUrl}`);
}

module.exports = { ensureUsersTable, ensureDefaultUser, authenticate, requireAuth };
