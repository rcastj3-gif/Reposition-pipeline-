const express = require('express');
const router = express.Router();
const db = require('../db');
const Scorer = require('../services/scorer');

// Import both real and mock HighLevel APIs
const RealHighLevelAPI = require('../services/highlevel');
const MockHighLevelAPI = require('../services/mock-data');

// Choose which API to use
const useMockData = process.env.USE_MOCK_DATA === 'true';
const hl = useMockData 
  ? new MockHighLevelAPI() 
  : new RealHighLevelAPI(process.env.HIGHLEVEL_API_KEY, process.env.HIGHLEVEL_LOCATION_ID);

const scorer = new Scorer();

// POST /score
// Body: { contactIds: ["id1", "id2", ...] }
router.post('/', async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({ error: 'contactIds array required' });
    }

    const results = [];

    for (const contactId of contactIds) {
      // Get contact from HighLevel (or mock)
      const contact = await hl.getContact(contactId);
      
      // Score it
      const scores = scorer.scoreContact(contact);
      const daysSinceActivity = scorer.calculateDaysSinceActivity(contact);

      // Cache contact details locally for reporting/UI
      const upsertContact = db.prepare(`
        INSERT INTO contacts (id, first_name, last_name, email, phone, last_activity, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          email = excluded.email,
          phone = excluded.phone,
          last_activity = excluded.last_activity,
          notes = excluded.notes
      `);
      upsertContact.run(
        contactId,
        contact.firstName || '',
        contact.lastName || '',
        contact.email || null,
        contact.phone || null,
        contact.lastActivity || null,
        contact.notes || null
      );

      // Save to database (better-sqlite3 is synchronous)
      const insertStmt = db.prepare(
        `INSERT INTO scores (contact_id, score, urgency_score, budget_score, engagement_score, timeline_score, days_since_activity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      insertStmt.run(contactId, scores.total, scores.urgency, scores.budget, scores.engagement, scores.timeline, daysSinceActivity);

      results.push({
        contactId,
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        score: scores.total,
        daysSinceActivity,
        breakdown: scores
      });
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    res.json({
      total: results.length,
      scored: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /score/:contactId (get latest score)
router.get('/:contactId', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM scores WHERE contact_id = ? ORDER BY scored_at DESC LIMIT 1');
    const row = stmt.get(req.params.contactId);
    
    if (!row) return res.status(404).json({ error: 'Score not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /score (get all scores, sorted by score)
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const stmt = db.prepare(`
      SELECT 
        contact_id,
        score,
        urgency_score,
        budget_score,
        engagement_score,
        timeline_score,
        days_since_activity,
        scored_at
      FROM scores
      ORDER BY score DESC, scored_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    
    res.json({
      total: rows.length,
      scores: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
