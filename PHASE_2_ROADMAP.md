# Pipeline Restoration - Phase 2 Roadmap

## Current State (Completed)
- Dormant lead detection
- Lead scoring
- Draft generation
- Paid-gated report delivery
- Auth/login for operator UI
- HTML/Markdown/PDF report export
- Real email sending via AgentMail
- Reply classification
- Booking flow
- Recovered revenue tracking
- Revenue dashboard
- Objection-specific follow-up drafts

---

## Phase 2 Priorities

### 1. Real Inbound Reply Sync
**Goal:** Stop manually posting replies into `/classify`.

**Build:**
- webhook endpoint for inbound email/SMS replies
- provider parsing layer
- automatic reply classification on receipt
- route to reply review queue

**Why it matters:**
This is the jump from operator-assisted workflow to semi-automated recovery engine.

---

### 2. Real Calendar Integration
**Goal:** Replace placeholder booking links with live scheduling.

**Build:**
- calendar provider integration (HighLevel / Calendly / Google Calendar)
- available slot fetch
- contact-specific booking links
- appointment confirmation logging

**Why it matters:**
Warm replies should move directly into real booked appointments.

---

### 3. Campaign Analytics
**Goal:** Make outcome reporting client-ready.

**Build:**
- reply rate by campaign
- objection mix breakdown
- booking rate
- completion rate
- recovered revenue by client/report/date range
- CSV export

**Why it matters:**
This turns the tool into a proof-generating machine.

---

### 4. Multi-Client Workspace
**Goal:** Separate data cleanly by client.

**Build:**
- client records table
- report-to-client relation
- reply filtering by client
- dashboard filtering

**Why it matters:**
Required once multiple real clients use the system.

---

### 5. Better Operator UX
**Goal:** Make the tool easier to run daily.

**Build:**
- tabs for Reports / Replies / Dashboard
- inline reply actions
- editable follow-up drafts
- manual notes per reply
- filter by warm / objection / booked / completed

---

## Suggested Build Order
1. Real inbound reply sync
2. Real calendar integration
3. Campaign analytics
4. Multi-client separation
5. UI polish

---

## Success Definition for Phase 2
A lead can move through this flow with minimal manual work:

1. reply arrives automatically
2. system classifies it
3. warm replies get real booking link
4. appointment gets logged
5. completed appointment updates recovered revenue
6. dashboard shows real ROI
