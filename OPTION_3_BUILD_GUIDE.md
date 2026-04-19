# Pipeline Restoration Backend - Option 3 (Hybrid) Build Guide

**Goal:** Build a lightweight backend API + OpenClaw orchestration to validate the Pipeline Restoration system in 2-3 weeks.

**Timeline:**
- Week 1: Backend API (HighLevel + Scoring + Drafting)
- Week 2: Reply Classification + Airtable Setup + Testing
- Week 3: OpenClaw Skill + End-to-End Testing + First Client

---

## Tech Stack (Final Decision)

**Backend API:**
- **Language:** Node.js (Express) — Fast, simple, widely supported
- **Database:** SQLite (for now) — No setup needed, easy to upgrade to PostgreSQL later
- **Hosting:** Railway or Render — Free tier available, easy deployment

**Orchestration:**
- **OpenClaw** — You're already here, handles workflow logic

**Operator Interface:**
- **Airtable** — Visual, no code, good enough for v1

**External APIs:**
- **HighLevel API** — For CRM integration
- **(Optional) Claude API** — For AI-powered message drafting and reply classification

---

## Project Structure

```
pipeline-restoration-backend/
├── src/
│   ├── index.js              # Main Express app
│   ├── config.js             # Environment variables
│   ├── db.js                 # SQLite connection
│   ├── routes/
│   │   ├── contacts.js       # /contacts/* endpoints
│   │   ├── scoring.js        # /score endpoint
│   │   ├── drafting.js       # /draft endpoint
│   │   ├── classification.js # /classify endpoint
│   │   └── reporting.js      # /report/* endpoints
│   ├── services/
│   │   ├── highlevel.js      # HighLevel API wrapper
│   │   ├── scorer.js         # Scoring logic
│   │   ├── drafter.js        # Message drafting logic
│   │   └── classifier.js     # Reply classification logic
│   └── utils/
│       ├── logger.js         # Logging
│       └── helpers.js        # Helper functions
├── database.db               # SQLite database file
├── .env                      # Environment variables
├── package.json              # Dependencies
└── README.md                 # Setup instructions
```

---

## Week 1: Backend API Setup

### Day 1: Project Setup + HighLevel API Connection

**Tasks:**
1. Initialize Node.js project
2. Set up Express server
3. Connect to HighLevel API (test authentication)
4. Build `/contacts/dormant` endpoint

**Step-by-step:**

#### 1.1: Initialize Project

```bash
mkdir pipeline-restoration-backend
cd pipeline-restoration-backend
npm init -y
npm install express dotenv axios sqlite3 cors
```

#### 1.2: Create `.env` file

```env
PORT=3000
HIGHLEVEL_API_KEY=your_api_key_here
HIGHLEVEL_LOCATION_ID=your_location_id_here
NODE_ENV=development
```

#### 1.3: Create `src/index.js` (Main Server)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (will add these progressively)
// app.use('/contacts', require('./routes/contacts'));
// app.use('/score', require('./routes/scoring'));
// app.use('/draft', require('./routes/drafting'));
// app.use('/classify', require('./routes/classification'));

app.listen(PORT, () => {
  console.log(`🚀 Pipeline Restoration API running on port ${PORT}`);
});
```

Test: `node src/index.js` → should see "🚀 Pipeline Restoration API running on port 3000"

#### 1.4: Create `src/services/highlevel.js` (HighLevel API Wrapper)

```javascript
const axios = require('axios');

class HighLevelAPI {
  constructor(apiKey, locationId) {
    this.apiKey = apiKey;
    this.locationId = locationId;
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get all contacts
  async getContacts(filters = {}) {
    try {
      const response = await this.client.get('/contacts', {
        params: {
          locationId: this.locationId,
          ...filters
        }
      });
      return response.data.contacts || [];
    } catch (error) {
      console.error('HighLevel API Error (getContacts):', error.response?.data || error.message);
      throw error;
    }
  }

  // Get single contact by ID
  async getContact(contactId) {
    try {
      const response = await this.client.get(`/contacts/${contactId}`, {
        params: { locationId: this.locationId }
      });
      return response.data.contact;
    } catch (error) {
      console.error('HighLevel API Error (getContact):', error.response?.data || error.message);
      throw error;
    }
  }

  // Add note to contact
  async addNote(contactId, body) {
    try {
      const response = await this.client.post(`/contacts/${contactId}/notes`, {
        body,
        locationId: this.locationId
      });
      return response.data;
    } catch (error) {
      console.error('HighLevel API Error (addNote):', error.response?.data || error.message);
      throw error;
    }
  }

  // Update opportunity stage
  async updateOpportunity(opportunityId, pipelineStageId) {
    try {
      const response = await this.client.put(`/opportunities/${opportunityId}`, {
        pipelineStageId,
        locationId: this.locationId
      });
      return response.data;
    } catch (error) {
      console.error('HighLevel API Error (updateOpportunity):', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = HighLevelAPI;
```

#### 1.5: Create `src/routes/contacts.js` (Contacts Endpoints)

```javascript
const express = require('express');
const router = express.Router();
const HighLevelAPI = require('../services/highlevel');

const hl = new HighLevelAPI(
  process.env.HIGHLEVEL_API_KEY,
  process.env.HIGHLEVEL_LOCATION_ID
);

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
      contacts: dormantContacts.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        lastActivity: c.lastActivity,
        tags: c.tags || []
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
```

#### 1.6: Wire up contacts route in `src/index.js`

```javascript
// Add this line after other middleware
app.use('/contacts', require('./routes/contacts'));
```

**Test:**
```bash
node src/index.js
# In another terminal:
curl http://localhost:3000/contacts/dormant?threshold=30
```

Should return JSON with dormant contacts.

---

### Day 2: Database Setup + Scoring Engine

**Tasks:**
1. Set up SQLite database
2. Create tables (contacts, scores, drafts, replies)
3. Build scoring logic
4. Build `/score` endpoint

#### 2.1: Create `src/db.js` (Database Connection)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Contacts table (cached from HighLevel)
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      last_activity TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scores table
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT,
      score INTEGER,
      urgency_score INTEGER,
      budget_score INTEGER,
      engagement_score INTEGER,
      timeline_score INTEGER,
      scored_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `);

  // Drafts table
  db.run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT,
      subject TEXT,
      body TEXT,
      pattern TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `);

  // Replies table
  db.run(`
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT,
      reply_text TEXT,
      classification TEXT,
      confidence TEXT,
      classified_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `);
});

module.exports = db;
```

#### 2.2: Create `src/services/scorer.js` (Scoring Logic)

```javascript
class Scorer {
  // Score a single contact (0-10)
  scoreContact(contact) {
    const urgency = this.scoreUrgency(contact);
    const budget = this.scoreBudget(contact);
    const engagement = this.scoreEngagement(contact);
    const timeline = this.scoreTimeline(contact);

    // Weighted composite score
    const composite = Math.round(
      urgency * 0.4 +
      budget * 0.3 +
      engagement * 0.2 +
      timeline * 0.1
    );

    return {
      total: Math.min(composite, 10), // Cap at 10
      urgency,
      budget,
      engagement,
      timeline
    };
  }

  // Urgency signals (0-10)
  scoreUrgency(contact) {
    const notes = (contact.notes || '').toLowerCase();
    let score = 0;

    if (notes.includes('urgent') || notes.includes('asap')) score += 10;
    else if (notes.includes('soon') || notes.includes('quickly')) score += 7;
    else if (notes.includes('need')) score += 4;

    return Math.min(score, 10);
  }

  // Budget signals (0-10)
  scoreBudget(contact) {
    const notes = (contact.notes || '').toLowerCase();
    let score = 0;

    // Positive budget signals
    if (notes.includes('price') && !notes.includes('too expensive')) score += 7;
    if (notes.includes('payment plan') || notes.includes('financing')) score += 5;
    if (notes.includes('budget') && !notes.includes('tight budget')) score += 4;

    // Negative budget signals
    if (notes.includes('too expensive') || notes.includes('can\'t afford')) score -= 5;

    return Math.max(0, Math.min(score, 10));
  }

  // Engagement signals (0-10)
  scoreEngagement(contact) {
    const lastActivity = contact.lastActivity ? new Date(contact.lastActivity) : null;
    if (!lastActivity) return 0;

    const daysSinceActivity = Math.floor(
      (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity < 30) return 10;
    if (daysSinceActivity < 90) return 7;
    if (daysSinceActivity < 180) return 4;
    return 2;
  }

  // Timeline signals (0-10)
  scoreTimeline(contact) {
    const notes = (contact.notes || '').toLowerCase();
    let score = 0;

    if (notes.includes('this week') || notes.includes('next week')) score += 10;
    if (notes.includes('this month') || notes.includes('next month')) score += 7;
    if (notes.includes('soon') || notes.includes('looking to')) score += 4;

    return Math.min(score, 10);
  }
}

module.exports = Scorer;
```

#### 2.3: Create `src/routes/scoring.js` (Scoring Endpoints)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const Scorer = require('../services/scorer');
const HighLevelAPI = require('../services/highlevel');

const hl = new HighLevelAPI(
  process.env.HIGHLEVEL_API_KEY,
  process.env.HIGHLEVEL_LOCATION_ID
);
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
      // Get contact from HighLevel
      const contact = await hl.getContact(contactId);
      
      // Score it
      const scores = scorer.scoreContact(contact);

      // Save to database
      db.run(
        `INSERT INTO scores (contact_id, score, urgency_score, budget_score, engagement_score, timeline_score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [contactId, scores.total, scores.urgency, scores.budget, scores.engagement, scores.timeline]
      );

      results.push({
        contactId,
        name: `${contact.firstName} ${contact.lastName}`,
        score: scores.total,
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

// GET /score/:contactId
router.get('/:contactId', (req, res) => {
  db.get(
    'SELECT * FROM scores WHERE contact_id = ? ORDER BY scored_at DESC LIMIT 1',
    [req.params.contactId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Score not found' });
      res.json(row);
    }
  );
});

module.exports = router;
```

#### 2.4: Wire up scoring route in `src/index.js`

```javascript
app.use('/score', require('./routes/scoring'));
```

**Test:**
```bash
curl -X POST http://localhost:3000/score \
  -H "Content-Type: application/json" \
  -d '{"contactIds": ["contact_id_here"]}'
```

---

### Day 3: Message Drafting System

**Tasks:**
1. Create message template library
2. Build personalization logic
3. Build `/draft` endpoint

#### 3.1: Create `src/services/drafter.js` (Message Drafting Logic)

```javascript
class Drafter {
  constructor() {
    this.templates = {
      patternA: {
        name: 'Checking In',
        subject: 'Quick check-in',
        body: `Hey {firstName},

I wanted to check in — we spoke {timeAgo} about {serviceInquired}.

Are you still interested, or did you decide to go a different direction?

Either way, no pressure. Just wanted to make sure you didn't fall through the cracks.

— {senderName}`
      },
      
      patternB: {
        name: 'New Option Available',
        subject: 'New option for {serviceInquired}',
        body: `Hey {firstName},

I know we talked {timeAgo} about {serviceInquired}, and at the time {reasonItDidntWork}.

I wanted to reach out because {newOption}.

If you're still interested, {callToAction}.

— {senderName}`
      },
      
      patternC: {
        name: 'Limited Availability',
        subject: 'Limited availability — {serviceInquired}',
        body: `Hey {firstName},

We're booking up fast for {serviceInquired} over the next few weeks.

I remembered you'd inquired about this {timeAgo}, so I wanted to give you first crack at the remaining slots before they're gone.

Interested? {callToAction}.

— {senderName}`
      },
      
      patternD: {
        name: 'Thought of You',
        subject: 'Thought of you',
        body: `Hey {firstName},

I was reviewing notes from our conversation {timeAgo} — you'd asked about {serviceInquired}.

I wanted to check in because {reasonToReengage}.

If you're still interested, {callToAction}.

— {senderName}`
      }
    };
  }

  // Draft a message for a contact
  draft(contact, pattern = 'patternD', context = {}) {
    const template = this.templates[pattern];
    if (!template) {
      throw new Error(`Unknown pattern: ${pattern}`);
    }

    // Build personalization variables
    const vars = {
      firstName: contact.firstName || 'there',
      lastName: contact.lastName || '',
      timeAgo: this.calculateTimeAgo(contact.lastActivity),
      serviceInquired: context.serviceInquired || 'our services',
      reasonItDidntWork: context.reasonItDidntWork || 'timing wasn\'t right',
      newOption: context.newOption || 'we have some new availability',
      reasonToReengage: context.reasonToReengage || 'we have availability this week',
      callToAction: context.callToAction || 'let me know and I can get you scheduled',
      senderName: context.senderName || 'Reyes'
    };

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return {
      pattern: pattern,
      patternName: template.name,
      subject,
      body,
      variables: vars
    };
  }

  // Calculate human-readable time ago
  calculateTimeAgo(lastActivity) {
    if (!lastActivity) return 'a while back';

    const lastDate = new Date(lastActivity);
    const now = new Date();
    const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (days < 30) return 'a few weeks back';
    if (days < 60) return 'last month';
    if (days < 180) return 'a few months back';
    if (days < 365) return 'earlier this year';
    return 'last year';
  }
}

module.exports = Drafter;
```

#### 3.2: Create `src/routes/drafting.js` (Drafting Endpoints)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const Drafter = require('../services/drafter');
const HighLevelAPI = require('../services/highlevel');

const hl = new HighLevelAPI(
  process.env.HIGHLEVEL_API_KEY,
  process.env.HIGHLEVEL_LOCATION_ID
);
const drafter = new Drafter();

// POST /draft
// Body: { contactId, pattern, context }
router.post('/', async (req, res) => {
  try {
    const { contactId, pattern, context } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Get contact from HighLevel
    const contact = await hl.getContact(contactId);

    // Draft message
    const draft = drafter.draft(contact, pattern || 'patternD', context || {});

    // Save to database
    db.run(
      `INSERT INTO drafts (contact_id, subject, body, pattern, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [contactId, draft.subject, draft.body, draft.pattern]
    );

    res.json({
      contactId,
      contact: {
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email
      },
      draft
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /draft/:contactId (get latest draft)
router.get('/:contactId', (req, res) => {
  db.get(
    'SELECT * FROM drafts WHERE contact_id = ? ORDER BY created_at DESC LIMIT 1',
    [req.params.contactId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Draft not found' });
      res.json(row);
    }
  );
});

module.exports = router;
```

#### 3.3: Wire up drafting route in `src/index.js`

```javascript
app.use('/draft', require('./routes/drafting'));
```

**Test:**
```bash
curl -X POST http://localhost:3000/draft \
  -H "Content-Type: application/json" \
  -d '{"contactId": "contact_id_here", "pattern": "patternD", "context": {"serviceInquired": "Botox consultation", "senderName": "Reyes"}}'
```

---

## End of Week 1 Checklist

**By end of Week 1, you should have:**

- [ ] Express API running on localhost:3000
- [ ] HighLevel API connection working
- [ ] `/contacts/dormant` endpoint returns dormant leads
- [ ] SQLite database created with 4 tables
- [ ] `/score` endpoint scores contacts (0-10)
- [ ] `/draft` endpoint generates personalized messages
- [ ] All code tested with real HighLevel account

**Next:** Week 2 (Reply Classification + Airtable + Testing)

---

*I'll continue with Week 2 and Week 3 in separate files. Want me to keep going, or do you want to start building Week 1 first?*
