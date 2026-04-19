const { Pool } = require('pg');

// Debug: Log environment variables (remove in production)
console.log('Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Use DATABASE_URL from environment (provided by Railway)
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please ensure PostgreSQL database is connected in Railway dashboard.');
  // Create a dummy pool that will fail gracefully
  module.exports = {
    prepare: () => { throw new Error('Database not configured'); },
    exec: () => { throw new Error('Database not configured'); },
    query: () => { throw new Error('Database not configured'); },
    pool: null
  };
  return;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Railway PostgreSQL
  } : false
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Initialize tables
async function initDatabase() {
  try {
    // Test connection first
    const testClient = await pool.connect();
    console.log('✅ Database connected successfully');
    testClient.release();

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        last_activity TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        score INTEGER,
        urgency_score INTEGER,
        budget_score INTEGER,
        engagement_score INTEGER,
        timeline_score INTEGER,
        days_since_activity INTEGER,
        scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drafts (
        id SERIAL PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        subject TEXT,
        body TEXT,
        pattern TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS replies (
        id SERIAL PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        reply_text TEXT,
        classification TEXT,
        subtype TEXT,
        confidence TEXT,
        booking_status TEXT DEFAULT 'not_ready',
        next_action TEXT,
        booking_link TEXT,
        appointment_status TEXT DEFAULT 'not_booked',
        appointment_time TEXT,
        recovered_value REAL DEFAULT 0,
        booking_notes TEXT,
        classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_email TEXT,
        dormant_count INTEGER DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        report_status TEXT DEFAULT 'draft',
        markdown_path TEXT,
        html_path TEXT,
        pdf_path TEXT,
        send_log_path TEXT,
        send_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        sent_at TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    // Don't throw - let the app start even if DB fails
    // The app can retry connections later
  }
}

// Initialize on module load
initDatabase();

// Export query interface compatible with better-sqlite3
module.exports = {
  prepare: (sql) => ({
    run: async (params) => {
      const result = await pool.query(sql, params);
      return { changes: result.rowCount };
    },
    get: async (params) => {
      const result = await pool.query(sql, params);
      return result.rows[0];
    },
    all: async (params) => {
      const result = await pool.query(sql, params);
      return result.rows;
    }
  }),
  exec: async (sql) => {
    await pool.query(sql);
  },
  query: (sql, params) => pool.query(sql, params),
  pool
};
