# Pipeline Restoration - Handoff Summary

## What this is
A functional v1 operator system for running dormant lead recovery workflows.

## What it can do now
- protected operator login
- lead scoring
- outreach drafting
- report generation (HTML / Markdown / PDF)
- paid-gated report delivery
- real report email sending
- reply classification
- booking-state tracking
- recovered revenue tracking
- dashboard visibility
- objection follow-up drafts

## Core routes
- `/login`
- `/operator`
- `/replies`
- `/dashboard`

## Operational flow
1. score leads
2. draft messages
3. create report
4. mark paid
5. send report
6. classify replies
7. route warm leads to booking
8. mark booked/completed
9. track recovered value

## Current reality
This is ready as an internal operator tool.
It is not yet fully automated for inbound sync or live calendar booking.

## Biggest remaining phase-2 items
1. real inbound reply sync
2. real calendar integration
3. campaign analytics
4. multi-client separation

## Important config
See `.env.example` for:
- operator login
- booking base URL
- report sender inbox
- HighLevel config
- AgentMail config

## Best starting docs
- `README.md`
- `QUICK_START.md`
- `STATUS.md`
- `PHASE_2_ROADMAP.md`
