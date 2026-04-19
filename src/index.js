const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Initialize database
require('./db');
const { ensureDefaultUser } = require('./services/auth');
ensureDefaultUser();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'pipeline-restoration-local-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Pipeline Restoration API'
  });
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/contacts', require('./routes/contacts'));
app.use('/score', require('./routes/scoring'));
app.use('/draft', require('./routes/drafting'));
app.use('/classify', require('./routes/classification'));
app.use('/booking', require('./routes/booking'));
app.use('/followup', require('./routes/followup'));
app.use('/report', require('./routes/reporting'));
app.use('/dashboard', require('./services/auth').requireAuth, require('./routes/dashboard'));
app.use('/replies', require('./services/auth').requireAuth, require('./routes/replies-ui'));
app.use('/operator', require('./services/auth').requireAuth, require('./routes/operator'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pipeline Restoration API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
