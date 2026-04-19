# Pipeline Restoration - Quick Start Guide

**Fastest way to run the v1 operator system.**

---

## 1. Install + Run

```bash
npm install
cp .env.example .env
npm start
```

---

## 2. Login

Open:
- `http://localhost:3000/login`

Default local login:
- **Email:** `admin@local`
- **Password:** `changeme123`

Change these in `.env` before real use.

---

## 3. Best Pages

- `/operator` → reports + delivery
- `/replies` → reply review + booking flow
- `/dashboard` → recovered revenue snapshot

---

## 4. Fast Demo Setup

### Generate scoring + drafts
```bash
curl -X POST http://localhost:3000/score \
  -H "Content-Type: application/json" \
  -d '{"contactIds":["contact_001","contact_002","contact_003","contact_004","contact_005"]}'

curl -X POST http://localhost:3000/draft/batch \
  -H "Content-Type: application/json" \
  -d '{"contactIds":["contact_001","contact_002","contact_004"]}'
```

### Create a warm reply
```bash
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"contactId":"contact_002","replyText":"Yes, I am ready to book. Send me the booking link."}'
```

### Create a price objection
```bash
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"contactId":"contact_001","replyText":"I am still interested but the price is a little high right now."}'
```

---

## 5. Operator Workflow

### Report workflow
1. Go to `/operator`
2. Generate report
3. Mark paid
4. Send report

### Reply workflow
1. Go to `/replies`
2. Review reply classification
3. Send booking link OR view follow-up draft
4. Mark booked
5. Mark completed
6. Enter recovered value if needed

### Outcome workflow
1. Go to `/dashboard`
2. Review total replies
3. Review warm replies
4. Review booked/completed
5. Review recovered revenue

---

## 6. Important env values

```env
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

If AgentMail key is not already stored in OpenClaw config:
```env
AGENTMAIL_API_KEY=am_xxx
```

---

## 7. Troubleshooting

### Operator page redirects to login
That’s expected if you are not authenticated.

### Report won’t send
Check:
- payment marked received
- AgentMail key available
- report exported first

### Booking links look fake
That’s because v1 uses `BOOKING_BASE_URL` placeholder links until real calendar integration is added.

### Replies are not syncing automatically
Correct — v1 supports reply classification, but real inbound sync is Phase 2.

---

## 8. Next docs to read
- `STATUS.md`
- `PHASE_2_ROADMAP.md`
- `DEMO_SCRIPT.md`
