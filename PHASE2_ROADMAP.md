# Pipeline Restoration - Phase 2 Architecture & Roadmap

## Executive Summary

**Current State (Phase 1):**
- Single-tenant: One client at a time via .env file
- Manual API key management
- SQLite database
- Local/VPS deployment only
- One operator (you)

**Target State (Phase 2):**
- Multi-tenant: Multiple clients simultaneously
- Web-based API credential management
- PostgreSQL database with client isolation
- Cloud deployment (Railway/Render/AWS)
- Team member support
- Automated workflows
- White-label capabilities

---

## Phase 2 Architecture

### 1. Multi-Tenant Database Design

```sql
-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    plan_type ENUM('pilot', 'monthly', 'quarterly') DEFAULT 'pilot',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRM Credentials (encrypted)
CREATE TABLE crm_credentials (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    crm_type ENUM('gohighlevel', 'hubspot', 'salesforce', 'zoho') NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    location_id VARCHAR(255),
    refresh_token_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads (per-client isolation)
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    crm_contact_id VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    original_inquiry_date TIMESTAMP,
    last_contact_date TIMESTAMP,
    status ENUM('dormant', 'scored', 'contacted', 'replied', 'booked', 'completed', 'lost') DEFAULT 'dormant',
    score_urgency INT CHECK (score_urgency BETWEEN 0 AND 10),
    score_budget INT CHECK (score_budget BETWEEN 0 AND 10),
    score_engagement INT CHECK (score_engagement BETWEEN 0 AND 10),
    score_timeline INT CHECK (score_timeline BETWEEN 0 AND 10),
    total_score INT GENERATED ALWAYS AS (score_urgency + score_budget + score_engagement + score_timeline) STORED,
    objection_type ENUM('price', 'timing', 'authority', 'fit', 'none'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outreach Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    lead_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    booking_count INT DEFAULT 0,
    revenue_recovered DECIMAL(10,2) DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages (drafts, sent, replies)
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    message_type ENUM('initial', 'followup', 'reply', 'booking') NOT NULL,
    status ENUM('draft', 'pending_approval', 'approved', 'sent', 'delivered', 'opened', 'clicked', 'replied') DEFAULT 'draft',
    subject TEXT,
    body TEXT,
    draft_body TEXT,
    reply_classification ENUM('warm', 'cold', 'objection_price', 'objection_timing', 'question', 'unclear'),
    sent_at TIMESTAMP,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE team_members (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin', 'operator', 'viewer') DEFAULT 'operator',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. API Endpoints (New)

```javascript
// Client Management
POST   /api/clients                    // Create new client
GET    /api/clients                    // List all clients
GET    /api/clients/:id                // Get client details
PUT    /api/clients/:id                // Update client
DELETE /api/clients/:id                // Archive client

// CRM Credentials
POST   /api/clients/:id/credentials    // Add CRM credentials
GET    /api/clients/:id/credentials    // List credentials
PUT    /api/clients/:id/credentials/:credId  // Update credentials
DELETE /api/clients/:id/credentials/:credId  // Remove credentials
POST   /api/clients/:id/credentials/:credId/test  // Test connection

// Lead Management (scoped to client)
GET    /api/clients/:id/leads          // List leads
GET    /api/clients/:id/leads/dormant  // Get dormant leads
POST   /api/clients/:id/leads/sync     // Sync from CRM
POST   /api/clients/:id/leads/:leadId/score     // Score single lead
POST   /api/clients/:id/leads/score-batch       // Score all dormant

// Campaign Management
POST   /api/clients/:id/campaigns      // Create campaign
GET    /api/clients/:id/campaigns      // List campaigns
GET    /api/clients/:id/campaigns/:campaignId   // Get campaign details
POST   /api/clients/:id/campaigns/:campaignId/start    // Start campaign
POST   /api/clients/:id/campaigns/:campaignId/pause    // Pause campaign
POST   /api/clients/:id/campaigns/:campaignId/complete // Complete campaign

// Message Management
GET    /api/clients/:id/messages/drafts           // Get drafts for approval
POST   /api/clients/:id/messages/:messageId/approve    // Approve draft
POST   /api/clients/:id/messages/:messageId/send       // Send message
GET    /api/clients/:id/messages/replies          // Get replies
POST   /api/clients/:id/messages/:messageId/classify   // Classify reply

// Reports
GET    /api/clients/:id/reports/summary           // Client summary report
GET    /api/clients/:id/reports/campaign/:campaignId   // Campaign report
GET    /api/clients/:id/reports/revenue           // Revenue report
```

---

### 3. New UI Components

#### Client Selection Interface
```
┌─────────────────────────────────────────┐
│  Pipeline Restoration                   │
│  [Dropdown: Select Client ▼]            │
│     - Client A (Active)                 │
│     - Client B (Active)                 │
│     - Client C (Paused)                 │
│     - [+ Add New Client]                │
└─────────────────────────────────────────┘
```

#### Client Onboarding Wizard
```
Step 1: Client Info
  - Name, Email, Company

Step 2: CRM Connection
  - Select CRM type (Go High Level, HubSpot, etc.)
  - Paste API Key
  - Paste Location ID
  - [Test Connection] button

Step 3: Import Settings
  - Dormant lead criteria (days since last contact)
  - Lead scoring preferences
  - Message tone preferences

Step 4: Review & Activate
  - Summary
  - [Activate Client] button
```

#### Multi-Client Dashboard
```
┌─────────────────────────────────────────┐
│  All Clients Overview                   │
├─────────────────────────────────────────┤
│  Active Campaigns: 5                    │
│  Total Leads Contacted: 1,247           │
│  Total Revenue Recovered: $67,400       │
│  Avg ROI: 4.2x                          │
├─────────────────────────────────────────┤
│  Client List:                           │
│  ┌──────────┬──────────┬────────┬──────┐│
│  │ Client   │ Status   │ Leads  │ Rev  ││
│  ├──────────┼──────────┼────────┼──────┤│
│  │ Client A │ Active   │ 50     │ $14K ││
│  │ Client B │ Active   │ 75     │ $23K ││
│  │ Client C │ Paused   │ 30     │ $8K  ││
│  └──────────┴──────────┴────────┴──────┘│
└─────────────────────────────────────────┘
```

---

### 4. Security Enhancements

```javascript
// Encryption for API keys
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY; // 32 bytes

function encryptApiKey(apiKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

function decryptApiKey(encryptedData) {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        MASTER_KEY,
        Buffer.from(encryptedData.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
```

---

### 5. Automated Workflows

```javascript
// Auto-sync dormant leads nightly
schedule('0 2 * * *', async () => {
    const activeClients = await getActiveClients();
    for (const client of activeClients) {
        await syncDormantLeads(client.id);
        await scoreLeads(client.id);
    }
});

// Auto-generate drafts for high-scoring leads
schedule('0 9 * * *', async () => {
    const clients = await getClientsWithAutoDraftEnabled();
    for (const client of clients) {
        const highScoreLeads = await getUncontactedHighScoreLeads(client.id);
        for (const lead of highScoreLeads) {
            await generateDraft(lead.id);
        }
    }
});

// Auto-send approved messages
schedule('*/15 * * * *', async () => {
    const approvedMessages = await getApprovedMessagesNotSent();
    for (const message of approvedMessages) {
        await sendMessage(message.id);
    }
});

// Auto-classify replies
schedule('*/5 * * * *', async () => {
    const unclassifiedReplies = await getUnclassifiedReplies();
    for (const reply of unclassifiedReplies) {
        const classification = await classifyReply(reply.content);
        await updateReplyClassification(reply.id, classification);
        
        if (classification === 'warm') {
            await sendBookingLink(reply.leadId);
        }
    }
});
```

---

## Implementation Roadmap

### Phase 2A: Foundation (Week 1-2)
**Goal:** Multi-client support with basic UI

**Tasks:**
- [ ] Migrate SQLite to PostgreSQL
- [ ] Create multi-tenant database schema
- [ ] Build client management API
- [ ] Build client onboarding UI
- [ ] Implement API key encryption
- [ ] Deploy to Railway with PostgreSQL

**Deliverable:** Can add multiple clients via web UI

---

### Phase 2B: Team & Workflows (Week 3-4)
**Goal:** Team collaboration and automation

**Tasks:**
- [ ] Team member management
- [ ] Role-based permissions
- [ ] Activity logging
- [ ] Automated lead syncing
- [ ] Auto-draft generation
- [ ] Reply classification

**Deliverable:** Reduced manual work per client

---

### Phase 2C: Scale & Optimize (Week 5-6)
**Goal:** Handle 10+ clients efficiently

**Tasks:**
- [ ] Performance optimization
- [ ] Caching layer (Redis)
- [ ] Background job queue
- [ ] Rate limiting per client
- [ ] Error handling & retries
- [ ] Monitoring & alerts

**Deliverable:** System stable at scale

---

### Phase 2D: White-Label & API (Week 7-8)
**Goal:** Reseller/white-label capabilities

**Tasks:**
- [ ] White-label branding options
- [ ] Client-facing dashboard
- [ ] REST API for integrations
- [ ] Webhook support
- [ ] Custom domain support

**Deliverable:** Can sell to agencies/resellers

---

## Cost Estimates (Monthly)

| Component | Phase 1 | Phase 2A-D |
|-----------|---------|------------|
| Hosting (Railway) | $0-5 | $20-50 |
| Database (PostgreSQL) | $0 (SQLite) | $15-30 |
| Redis (caching) | $0 | $10-20 |
| Email (AgentMail) | $0 | $0-10 |
| Monitoring | $0 | $0-15 |
| **Total** | **$0-5** | **$45-125** |

---

## Revenue Model at Scale

| Clients | Avg Revenue/Client | Monthly Revenue | System Cost | Net Profit |
|---------|-------------------|-----------------|-------------|------------|
| 5 | $2,500 | $12,500 | $50 | $12,450 |
| 10 | $2,500 | $25,000 | $75 | $24,925 |
| 25 | $2,500 | $62,500 | $125 | $62,375 |
| 50 | $2,500 | $125,000 | $200 | $124,800 |

---

## Success Metrics

**Phase 2 Success =**
- [ ] Can onboard new client in < 10 minutes
- [ ] Can manage 10+ clients simultaneously
- [ ] Zero manual server restarts needed
- [ ] 99%+ uptime
- [ ] < 5 seconds page load time
- [ ] Team members can operate without your help

---

## Decision Points

**When to build Phase 2:**
- ✅ You have 3+ paying clients
- ✅ Manual .env method is slowing you down
- ✅ You want to hire operators
- ✅ You have $1,000+ monthly revenue to reinvest

**When to wait:**
- ❌ You have 0-2 clients
- ❌ Revenue is <$1,000/month
- ❌ You're still figuring out product-market fit

---

## Next Steps (When Ready)

1. **Confirm funding** — Ensure you have budget for hosting costs
2. **Choose database** — Railway PostgreSQL or Supabase
3. **Set development timeline** — 6-8 weeks for full Phase 2
4. **Hire help** — Consider part-time developer for implementation
5. **Start with Phase 2A** — Don't build everything at once

---

**Document Version:** 1.0  
**Created:** April 9, 2026  
**Status:** Ready for implementation when client count justifies investment