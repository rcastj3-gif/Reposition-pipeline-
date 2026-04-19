const express = require('express');
const router = express.Router();

// Import both real and mock HighLevel APIs
const RealHighLevelAPI = require('../services/highlevel');
const MockHighLevelAPI = require('../services/mock-data');

// Choose which API to use based on environment variable
const useMockData = process.env.USE_MOCK_DATA === 'true';
const hl = useMockData 
  ? new MockHighLevelAPI() 
  : new RealHighLevelAPI(process.env.HIGHLEVEL_API_KEY, process.env.HIGHLEVEL_LOCATION_ID);

console.log(`📊 Contacts API using: ${useMockData ? 'MOCK DATA' : 'REAL HIGHLEVEL'}`);

// GET /contacts/dormant?threshold=30
router.get('/dormant', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - threshold);

    // Get all contacts
    const allContacts = await hl.getContacts();

    // Filter for dormant (no activity in X days)
    const dormantContacts = allContacts.filter(contact => {
      const lastActivity = contact.lastActivity 
        ? new Date(contact.lastActivity) 
        : null;
      
      // If no activity date, consider dormant
      if (!lastActivity) return true;
      
      // If last activity is older than threshold, it's dormant
      return lastActivity < thresholdDate;
    });

    res.json({
      total: dormantContacts.length,
      threshold: `${threshold} days`,
      thresholdDate: thresholdDate.toISOString(),
      useMockData,
      contacts: dormantContacts.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        lastActivity: c.lastActivity,
        daysSinceActivity: c.lastActivity 
          ? Math.floor((new Date() - new Date(c.lastActivity)) / (1000 * 60 * 60 * 24))
          : null,
        tags: c.tags || [],
        notes: c.notes,
        customFields: c.customFields || {}
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /contacts/:id
router.get('/:id', async (req, res) => {
  try {
    const contact = await hl.getContact(req.params.id);
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /contacts/:id/note
router.post('/:id/note', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ error: 'Note body is required' });
    }
    
    const result = await hl.addNote(req.params.id, body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
