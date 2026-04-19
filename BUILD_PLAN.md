# Pipeline Restoration Backend - Build Plan

**Goal:** Build a functional backend system that handles HighLevel API integration, lead scoring, message drafting, reply classification, and reporting.

**Timeline:** 2-4 weeks (depending on complexity and dev resources)

**Tech Stack Decision:** TBD (see options below)

---

## System Architecture

### Core Components

**1. HighLevel API Integration**
- Connect to HighLevel via OAuth or API key
- Pull contacts with filters (date range, tags, pipeline stage)
- Read contact notes and interaction history
- Write notes back to contact records
- Update opportunity stages
- (Optional) Send messages via HighLevel

**2. Lead Scoring Engine**
- Score dormant leads 0-10 based on:
  - Urgency signals (keywords in notes)
  - Budget signals (price discussion, payment interest)
  - Decision timeline (expressed buying window)
  - Engagement history (opens, clicks, replies)
- Store scores in database
- Re-score on demand or schedule

**3. Message Drafting System**
- Template library (psychology patterns)
- Personalization engine (merge contact data)
- Niche/avatar-specific language variants
- Draft generation API endpoint
- Human review queue

**4. Reply Classification**
- Classify incoming replies as: warm/cold/objection/question
- Extract objection type if present
- Route to appropriate next action
- (Future: AI-powered classification)

**5. Reporting & Analytics**
- Before/after pipeline snapshots
- Conversation metrics (sent, replied, warm, cold)
- Appointment metrics (booked, showed, no-show)
- Revenue tracking (closed deals)
- ROI calculation

**6. Operator Dashboard**
- View dormant leads + scores
- Review/approve/edit draft messages
- See reply classifications
- Track campaign progress
- Generate reports

---

## Tech Stack Options

### Option A: Full Custom (Node.js/Python + PostgreSQL)

**Pros:**
- Full control over features
- No platform limitations
- Can white-label and resell
- Scales infinitely

**Cons:**
- Longest build time (3-4 weeks)
- Requires strong dev skills
- Requires hosting/infrastructure
- Maintenance overhead

**Best if:** You plan to scale this into a SaaS product or sell it to multiple clients

**Stack:**
- Backend: Node.js (Express) or Python (FastAPI)
- Database: PostgreSQL
- Frontend: React or Vue.js (for dashboard)
- Hosting: Render, Railway, or AWS
- Queue: Redis (for async jobs)

---

### Option B: Low-Code (n8n or Make.com)

**Pros:**
- Fastest to build (1-2 weeks)
- Visual workflow builder
- Easy to modify
- No coding required (mostly)

**Cons:**
- Platform lock-in
- Monthly costs ($20-50/mo)
- Limited customization
- Harder to white-label

**Best if:** You want to test fast and iterate without deep technical work

**Stack:**
- Workflow: n8n (self-hosted) or Make.com (cloud)
- Database: Airtable or Google Sheets
- Frontend: Airtable interface or custom form (Typeform, Fillout)
- Hosting: n8n cloud or self-hosted

---

### Option C: Hybrid (OpenClaw + External API)

**Pros:**
- Leverage OpenClaw's orchestration
- Build only what's needed (API endpoints)
- Fast iteration
- Easy to test and refine

**Cons:**
- Requires OpenClaw understanding
- Still needs backend API for HighLevel
- Dashboard is separate

**Best if:** You want OpenClaw to handle workflow logic while outsourcing heavy API work

**Stack:**
- Orchestration: OpenClaw (you're already here)
- Backend API: Node.js or Python (lightweight)
- Database: SQLite or PostgreSQL
- Frontend: Google Sheets or Airtable (for operator review)
- Hosting: Railway or Render

---

## My Recommendation: Option C (Hybrid - OpenClaw + Lightweight API)

**Why:**
1. **Fastest to useful** — Focus on core API, let OpenClaw handle orchestration
2. **Leverages what you have** — You're already in OpenClaw, use it
3. **Minimal infrastructure** — Small API + database, no complex frontend yet
4. **Easy to test** — Run workflows manually, iterate fast
5. **Scalable later** — Can build full dashboard when validated

---

## Build Phases (Option C - Hybrid Approach)

### Phase 1: HighLevel API Integration (Week 1)

**Goal:** Pull contacts and read/write data

**Tasks:**
1. Set up HighLevel API access (OAuth or API key)
2. Build `/contacts/dormant` endpoint (pull contacts with no activity in X days)
3. Build `/contacts/{id}/notes` endpoint (read contact history)
4. Build `/contacts/{id}/note` endpoint (write note to contact)
5. Build `/contacts/{id}/opportunity` endpoint (update pipeline stage)
6. Test with a real HighLevel account

**Deliverable:**
- API endpoints working
- Can pull dormant leads
- Can read/write notes
- Can update opportunities

**Tech:**
- Node.js (Express) or Python (FastAPI)
- HighLevel API SDK (if available) or raw HTTP requests
- Database: SQLite (for now)

---

### Phase 2: Lead Scoring Engine (Week 1-2)

**Goal:** Score leads by restoration potential

**Tasks:**
1. Define scoring algorithm (urgency + budget + timeline + engagement)
2. Build keyword extraction from notes (e.g., "need soon" = urgency signal)
3. Build `/score` endpoint (accepts contact ID, returns 0-10 score)
4. Store scores in database
5. Test scoring on 20-30 real dormant leads

**Deliverable:**
- Scoring algorithm working
- Can score a list of contact IDs
- Scores stored in database

**Scoring logic (simple v1):**

```javascript
function scoreContact(contact) {
  let score = 0;
  
  // Urgency (0-3 points)
  if (contact.notes.includes('urgent') || contact.notes.includes('ASAP')) score += 3;
  else if (contact.notes.includes('soon') || contact.notes.includes('quickly')) score += 2;
  else if (contact.notes.includes('need')) score += 1;
  
  // Budget (0-3 points)
  if (contact.notes.includes('price') && !contact.notes.includes('too expensive')) score += 2;
  if (contact.notes.includes('payment plan') || contact.notes.includes('financing')) score += 1;
  
  // Engagement (0-2 points)
  if (contact.lastOpenedEmail < 30) score += 2;
  else if (contact.lastOpenedEmail < 90) score += 1;
  
  // Timeline (0-2 points)
  if (contact.notes.includes('next week') || contact.notes.includes('this month')) score += 2;
  else if (contact.notes.includes('next month')) score += 1;
  
  return Math.min(score, 10); // Cap at 10
}
```

---

### Phase 3: Message Drafting System (Week 2)

**Goal:** Generate psychology-matched messages

**Tasks:**
1. Create message template library (5-7 psychology patterns)
2. Build personalization engine (merge contact data into templates)
3. Build `/draft` endpoint (accepts contact ID + pattern, returns draft message)
4. Test drafts with real contact data
5. Refine templates based on output quality

**Deliverable:**
- Message templates defined
- Drafting endpoint working
- Can generate personalized messages

**Template example (Pattern D: "Thought of you"):**

```
Hey {firstName},

I was reviewing notes from our conversation {timeAgo} — you'd asked about {serviceInquired}.

I wanted to check in because {reasonToReengage}.

If you're still interested, {callToAction}.

— {senderName}
```

**Personalization variables:**
- `{firstName}` — Contact first name
- `{timeAgo}` — "a few months back", "last year"
- `{serviceInquired}` — Specific service from notes
- `{reasonToReengage}` — "we just added a new provider", "we have availability this week"
- `{callToAction}` — "I can get you in this week or next", "worth a quick call?"
- `{senderName}` — Sender/operator name

---

### Phase 4: Reply Classification (Week 2-3)

**Goal:** Classify incoming replies

**Tasks:**
1. Define classification rules (warm/cold/objection/question)
2. Build keyword-based classifier (v1)
3. Build `/classify` endpoint (accepts reply text, returns classification)
4. (Optional) Integrate Claude/GPT for AI classification (v2)
5. Test classification on sample replies

**Deliverable:**
- Classification endpoint working
- Can classify replies as warm/cold/objection/question
- (Optional) AI-powered classification

**Classification logic (simple v1):**

```javascript
function classifyReply(text) {
  text = text.toLowerCase();
  
  // Warm signals
  if (text.includes('yes') || text.includes('interested') || text.includes('book')) {
    return { type: 'warm', confidence: 'high' };
  }
  
  // Cold signals
  if (text.includes('not interested') || text.includes('no thanks') || text.includes('unsubscribe')) {
    return { type: 'cold', confidence: 'high' };
  }
  
  // Objection signals
  if (text.includes('price') || text.includes('cost') || text.includes('expensive')) {
    return { type: 'objection', subtype: 'price', confidence: 'high' };
  }
  if (text.includes('timing') || text.includes('busy') || text.includes('later')) {
    return { type: 'objection', subtype: 'timing', confidence: 'medium' };
  }
  
  // Question signals
  if (text.includes('?') || text.includes('how') || text.includes('what')) {
    return { type: 'question', confidence: 'medium' };
  }
  
  // Default: unclear
  return { type: 'unclear', confidence: 'low' };
}
```

---

### Phase 5: Operator Dashboard (Week 3)

**Goal:** Simple interface for reviewing/approving messages

**Options:**

**Option A: Airtable (easiest)**
- Create base with tables: Contacts, Scores, Drafts, Replies
- Use Airtable forms for approval workflow
- Use Airtable automations for routing
- Pros: No code, visual, fast
- Cons: Platform lock-in, less control

**Option B: Google Sheets (free)**
- Create sheet with tabs: Contacts, Scores, Drafts, Replies
- Use Google Apps Script for approval workflow
- Use cell colors for status (pending/approved/rejected)
- Pros: Free, accessible, familiar
- Cons: Not scalable, messy

**Option C: Custom Web Dashboard (most control)**
- Build simple React/Vue.js app
- Connect to backend API
- Show leads, scores, drafts in table view
- Approve/reject/edit buttons
- Pros: Full control, professional
- Cons: Takes longer to build (3-5 days)

**Recommendation for v1:** Airtable (fast, easy, good enough)

---

### Phase 6: Reporting (Week 3-4)

**Goal:** Generate before/after reports

**Tasks:**
1. Build `/report/snapshot` endpoint (capture pipeline state)
2. Build `/report/campaign` endpoint (campaign performance metrics)
3. Create report template (markdown or PDF)
4. Test report generation on sample data

**Deliverable:**
- Can generate before/after snapshots
- Can calculate metrics (reply rate, booking rate, ROI)
- Report template ready for client delivery

**Metrics to track:**
- Messages sent
- Replies received (reply rate %)
- Warm/cold/objection/question breakdown
- Appointments booked
- Show rate %
- Revenue recovered ($)
- ROI (%)

---

### Phase 7: OpenClaw Integration (Week 4)

**Goal:** Orchestrate workflow from OpenClaw

**Tasks:**
1. Create skill: `pipeline-restoration-operator`
2. Define workflow steps in SKILL.md
3. Build orchestration logic (call API endpoints in sequence)
4. Test end-to-end workflow
5. Refine based on test results

**Workflow (OpenClaw orchestrates):**

```
1. User: "Run revenue recovery audit for [client]"

2. OpenClaw calls backend API:
   - GET /contacts/dormant?threshold=30
   - POST /score (for each contact)
   - Sort by score, take top 20

3. OpenClaw calls drafting API:
   - POST /draft (for each top contact)
   - Store drafts in Airtable/Sheets

4. Operator reviews in Airtable/Sheets:
   - Approve/reject/edit each draft

5. OpenClaw sends approved messages:
   - Via HighLevel SMS/email
   - OR via external sending service

6. Replies come in:
   - POST /classify (for each reply)
   - Route based on classification

7. OpenClaw generates report:
   - GET /report/campaign
   - Format as markdown/PDF
   - Deliver to client
```

---

## Development Resources Needed

### Skills Required:
- [ ] Node.js or Python (API development)
- [ ] REST API design
- [ ] HighLevel API documentation reading
- [ ] Database basics (SQL or NoSQL)
- [ ] (Optional) Frontend basics (if building dashboard)

### Time Estimate:
- **Week 1:** HighLevel API + scoring engine (12-15 hours)
- **Week 2:** Message drafting + reply classification (12-15 hours)
- **Week 3:** Operator dashboard (Airtable setup: 3-5 hours)
- **Week 4:** Reporting + OpenClaw integration (8-10 hours)

**Total:** 35-45 hours over 4 weeks

---

## Quick Start: Minimum Viable Backend (Week 1 Only)

If you want to test FAST, build only this in Week 1:

**MVP Backend (10-12 hours):**
1. HighLevel API connection (pull dormant contacts)
2. Simple scoring (basic keyword matching)
3. Message template library (5 patterns, manual merge)
4. Google Sheet for operator review

**Skip for MVP:**
- Advanced scoring algorithm
- AI classification
- Custom dashboard
- Automated sending
- Reporting (do manually first)

**Test with:**
- 10-20 real dormant leads
- Manual message sending (copy/paste from sheet)
- Manual reply tracking (update sheet)

**Goal:** Validate the workflow works BEFORE building the full system

---

## Next Steps

**Decision point:**

1. **Do you want to build this yourself?**
   - I can guide you step-by-step
   - Provide code snippets and API examples
   - Review your work as you build

2. **Do you want to hire a developer?**
   - I can write a dev brief with specs
   - Help you find/vet a developer
   - Review their work for quality

3. **Do you want to use low-code (n8n/Make)?**
   - I can design the workflow
   - Walk you through setup
   - Help you test and refine

4. **Do you want to start with MVP first?**
   - Build Week 1 only (HighLevel API + scoring)
   - Test manually with 10-20 leads
   - Decide if it's worth building the rest

**Which path do you want to take?**
