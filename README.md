# Pipeline Restoration Backend

**AI-powered CRM recovery operator for turning dormant leads into conversations, bookings, and recovered revenue.**

---

## What This Is

Pipeline Restoration is now a **functional v1 operator system**.

It helps you:
- pull dormant leads from HighLevel (or use mock data for demos)
- score them by restoration potential
- generate personalized outreach drafts
- create and send paid-gated client reports
- classify replies
- move warm replies into booking flow
- track completed outcomes and recovered revenue

This is not just a backend experiment anymore. It is an internal operator tool with protected login, reporting, reply handling, booking-state tracking, and revenue visibility.

---

## Current V1 Features

### Lead Recovery Core
- Dormant lead detection
- Lead scoring (urgency, budget, engagement, timeline)
- Personalized outreach draft generation
- Mock data mode for demos
- HighLevel-ready integration path

### Reporting + Delivery
- HTML report export
- Markdown report export
- PDF report export
- Paid-gated send workflow
- Real report delivery via AgentMail
- Send logging + resend support

### Operator System
- Protected operator login
- Operator dashboard
- Reply review screen
- Revenue dashboard

### Reply + Booking Workflow
- Reply classification
- Booking-readiness status
- Booking link flow
- Appointment state tracking
- Recovered revenue tracking
- Objection-specific follow-up drafts

---

## Primary UI Routes
- `/login`
- `/operator`
- `/replies`
- `/dashboard`

---

## Primary API Routes
- `/contacts/dormant`
- `/score`
- `/draft`
- `/classify`
- `/booking`
- `/report`
- `/followup`

---

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** SQLite via better-sqlite3
- **Auth:** express-session + bcryptjs
- **PDF:** pdfkit
- **Mail:** AgentMail REST API
- **CRM source:** HighLevel API or mock data

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure env
```bash
cp .env.example .env
```

Key values:
```env
PORT=3000
USE_MOCK_DATA=true
SESSION_SECRET=change-this-secret
OPERATOR_EMAIL=admin@local
OPERATOR_PASSWORD=changeme123
REPORT_SENDER_INBOX=reyes@agentmail.to
BOOKING_BASE_URL=https://booking.example.com/schedule
```

If using real HighLevel:
```env
USE_MOCK_DATA=false
HIGHLEVEL_API_KEY=your_actual_api_key
HIGHLEVEL_LOCATION_ID=your_actual_location_id
```

If AgentMail key is not already in `~/.openclaw/openclaw.json`:
```env
AGENTMAIL_API_KEY=am_xxx
```

### 3. Start server
```bash
npm start
```

### 4. Login
Open:
- `http://localhost:3000/login`

Default local login:
- **email:** `admin@local`
- **password:** `changeme123`

---

## Recommended Demo Flow

### Step 1: Generate lead activity
```bash
curl -X POST http://localhost:3000/score \
  -H "Content-Type: application/json" \
  -d '{"contactIds":["contact_001","contact_002","contact_003","contact_004","contact_005"]}'

curl -X POST http://localhost:3000/draft/batch \
  -H "Content-Type: application/json" \
  -d '{"contactIds":["contact_001","contact_002","contact_004"]}'
```

### Step 2: Create a report
Use the operator UI:
- go to `/operator`
- create report
- mark paid
- send report

### Step 3: Classify replies
```bash
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"contactId":"contact_002","replyText":"Yes, I am ready to book. Send me the booking link."}'
```

### Step 4: Work the booking flow
Use `/replies` to:
- send booking link
- mark booked
- mark completed
- enter recovered value

### Step 5: Check outcomes
Open:
- `/dashboard`

---

## Paid-Gated Report Flow

1. Generate report
2. Report status becomes ready
3. Mark payment received
4. Send report
5. Report is emailed via AgentMail
6. Send log is stored
7. Resend is available if needed

---

## Reply Classification Flow

Reply types currently supported:
- warm
- cold
- objection / price
- objection / timing
- objection / hesitation
- objection / trust
- question
- unclear

Each reply gets:
- classification
- subtype
- confidence
- booking status
- next action

---

## Booking Flow

Warm replies can move through:
- `ready`
- `booked`
- `completed`

Tracked fields include:
- booking link
- appointment status
- appointment time
- recovered value
- booking notes

---

## Important Files
- `STATUS.md` — current state snapshot
- `PHASE_2_ROADMAP.md` — next-phase build map
- `QUICK_START.md` — fast setup/use guide
- `DEMO_SCRIPT.md` — demo walkthrough

---

## Current Gaps (Phase 2)
Still not fully automated:
- real inbound reply sync
- real calendar integration
- multi-client segmentation
- campaign analytics by client/date/campaign

---

## Support
Questions? `reyes@agentmail.to`
