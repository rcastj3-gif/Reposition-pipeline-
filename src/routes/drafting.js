const express = require('express');
const router = express.Router();
const db = require('../db');
const Drafter = require('../services/drafter');

// Import both real and mock HighLevel APIs
const RealHighLevelAPI = require('../services/highlevel');
const MockHighLevelAPI = require('../services/mock-data');

// Choose which API to use
const useMockData = process.env.USE_MOCK_DATA === 'true';
const hl = useMockData 
  ? new MockHighLevelAPI() 
  : new RealHighLevelAPI(process.env.HIGHLEVEL_API_KEY, process.env.HIGHLEVEL_LOCATION_ID);

const drafter = new Drafter();

// POST /draft
// Body: { contactId, pattern, context }
router.post('/', async (req, res) => {
  try {
    const { contactId, pattern, context } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Get contact from HighLevel (or mock)
    const contact = await hl.getContact(contactId);

    // Draft message (use 'auto' to auto-detect best pattern)
    const draft = drafter.draft(contact, pattern || 'auto', context || {});

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

    // Save to database
    const insertStmt = db.prepare(
      `INSERT INTO drafts (contact_id, subject, body, pattern, status)
       VALUES (?, ?, ?, ?, 'pending')`
    );
    const result = insertStmt.run(contactId, draft.subject, draft.body, draft.pattern);

    res.json({
      draftId: result.lastInsertRowid,
      contactId,
      contact: {
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        phone: contact.phone
      },
      draft: {
        ...draft,
        status: 'pending',
        id: result.lastInsertRowid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /draft/batch
// Body: { contactIds, pattern, context }
router.post('/batch', async (req, res) => {
  try {
    const { contactIds, pattern, context } = req.body;

    if (!contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({ error: 'contactIds array required' });
    }

    const results = [];
    const insertStmt = db.prepare(
      `INSERT INTO drafts (contact_id, subject, body, pattern, status)
       VALUES (?, ?, ?, ?, 'pending')`
    );

    for (const contactId of contactIds) {
      // Get contact
      const contact = await hl.getContact(contactId);

      // Draft message
      const draft = drafter.draft(contact, pattern || 'auto', context || {});

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

      // Save to database
      const result = insertStmt.run(contactId, draft.subject, draft.body, draft.pattern);

      results.push({
        draftId: result.lastInsertRowid,
        contactId,
        name: `${contact.firstName} ${contact.lastName}`,
        pattern: draft.pattern,
        patternName: draft.patternName,
        subject: draft.subject
      });
    }

    res.json({
      total: results.length,
      drafts: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /draft/:draftId
router.get('/:draftId', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM drafts WHERE id = ?');
    const draft = stmt.get(req.params.draftId);
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /draft/contact/:contactId (get latest draft for a contact)
router.get('/contact/:contactId', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM drafts WHERE contact_id = ? ORDER BY created_at DESC LIMIT 1');
    const draft = stmt.get(req.params.contactId);
    
    if (!draft) {
      return res.status(404).json({ error: 'No draft found for this contact' });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /draft (get all drafts, optionally filtered by status)
router.get('/', (req, res) => {
  try {
    const status = req.query.status; // pending, approved, sent
    const limit = parseInt(req.query.limit) || 50;
    
    let stmt;
    let drafts;
    
    if (status) {
      stmt = db.prepare(`
        SELECT * FROM drafts 
        WHERE status = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      drafts = stmt.all(status, limit);
    } else {
      stmt = db.prepare(`
        SELECT * FROM drafts 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      drafts = stmt.all(limit);
    }
    
    res.json({
      total: drafts.length,
      drafts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /draft/:draftId/status
// Body: { status: 'pending' | 'approved' | 'rejected' | 'sent' }
router.patch('/:draftId/status', (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'sent'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, approved, rejected, or sent' });
    }
    
    const stmt = db.prepare('UPDATE drafts SET status = ? WHERE id = ?');
    const result = stmt.run(status, req.params.draftId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json({ 
      success: true, 
      draftId: parseInt(req.params.draftId),
      status 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /draft/patterns (list available message patterns)
router.get('/meta/patterns', (req, res) => {
  const patterns = drafter.getPatterns();
  res.json({ patterns });
});

module.exports = router;
