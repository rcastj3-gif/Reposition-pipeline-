# Pipeline Restoration - Demo Script

**Use this script when demoing the system to prospects on discovery calls.**

---

## Pre-Demo Setup (5 min before call)

1. Start the server: `npm start`
2. Clear database (fresh demo): `rm database.db && npm start`
3. Have terminal ready with commands
4. Have browser ready at `http://localhost:3000/health`
5. Screen share ready

---

## Opening (1 min)

**Say:**

"I'm going to show you exactly how Pipeline Restoration works. This is a live demo of the actual system that recovered $14K for a med spa client in 30 days.

We're going to walk through the same process you'd use with your CRM:
1. Pull your dormant leads
2. Score them by restoration potential
3. Generate personalized re-engagement messages
4. Review and approve before sending

Sound good?"

---

## Demo Flow (10-12 min)

### Part 1: The Problem (2 min)

**Say:**

"Let me start by showing you what's probably sitting in your HighLevel right now."

**Run:**
```bash
curl http://localhost:3000/contacts/dormant?threshold=30 | jq
```

**Point out:**
- "See this? 10 dormant contacts. No activity in 30+ days."
- "Each one inquired about a service, engaged, then disappeared."
- Scroll through a few examples: "Sarah - Botox inquiry, quoted $450, said she'd think about it. Never heard back."

**Say:**

"This is normal. Life happens. But most businesses either ignore these completely or send generic 'Hey, still interested?' messages that get ignored.

We do something different."

---

### Part 2: Smart Scoring (3 min)

**Say:**

"Instead of treating all dormant leads the same, we score them by restoration potential."

**Run:**
```bash
curl -X POST http://localhost:3000/score \
  -H "Content-Type: application/json" \
  -d '{"contactIds": ["contact_001", "contact_002", "contact_003", "contact_004", "contact_005"]}' | jq
```

**Point out:**
- "See how Michael Chen scored 9/10? Here's why:"
  - Urgency: 10 (wanted consultation soon)
  - Budget: 10 (asked about payment plans - not a hard no)
  - Engagement: decent
  - Timeline: clear buying window

- "Compare that to someone with a 5/10 score - lower urgency, no budget signals."

**Say:**

"This tells you who's worth reaching out to first. We're not guessing. We're using data from your CRM notes to prioritize the highest-value opportunities."

---

### Part 3: Psychology-Matched Messages (4 min)

**Say:**

"Now here's where it gets interesting. We don't send the same message to everyone.

The system reads each contact's objection - price, timing, fear - and chooses a message pattern that matches their psychology."

**Run:**
```bash
curl -X POST http://localhost:3000/draft/batch \
  -H "Content-Type: application/json" \
  -d '{"contactIds": ["contact_001", "contact_002", "contact_003"]}' | jq
```

**Point out:**
- "See how it auto-selected different patterns?"
  - Sarah Johnson → Payment Plan Option (because her objection was price)
  - Michael Chen → Payment Plan Option (budget concern)
  - Emily Rodriguez → New Option Available (timing issue)

**Say:**

"It's not random. The system matched the message to each person's specific situation."

**Show a full draft:**
```bash
curl http://localhost:3000/draft/1 | jq
```

**Read it out loud:**

> "Hey Sarah,
>
> I know when we talked earlier this year about Botox Consultation, budget was a concern.
>
> Good news: we now offer flexible payment plans that make it much more manageable.
>
> Worth a quick conversation to see if it works for you?
>
> — Reyes"

**Say:**

"Does that sound like a bot? Or does it sound like someone who actually reviewed her file and is reaching out thoughtfully?

That's the difference."

---

### Part 4: Operator Review (1 min)

**Say:**

"Now, we don't auto-send these. You review every message before it goes out.

You can:"
- Edit it if something feels off
- Approve and send
- Reject if it's not a good fit

**Show status update:**
```bash
curl -X PATCH http://localhost:3000/draft/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}' | jq
```

**Say:**

"Once approved, it's ready to send. Full transparency. Full control."

---

### Part 5: The Results (2 min)

**Say:**

"So what happens when you actually run this?

Here's a real example:
- Med spa client, Southern California
- 312 dormant leads in their HighLevel
- We scored the top 87
- Sent personalized messages
- 31 replied (36% reply rate)
- 14 warm replies
- 9 booked appointments
- 8 showed up
- $14,200 in revenue recovered in 30 days

ROI: 507%

**That's money that was already in their CRM. They just didn't know how to get to it.**"

---

## Closing (1 min)

**Say:**

"So that's Pipeline Restoration. 

Three questions:
1. Do you have dormant leads in your HighLevel? (They always do)
2. Would you like to see what's sitting in YOUR pipeline? (Tier 1 - Audit)
3. Ready to recover that revenue? (Tier 2 - Campaign)

Where do you want to start?"

---

## Objection Handling

### "Can't I just do this manually?"

**Say:**

"Absolutely. Here's what that looks like:
- Pull 300 contacts
- Read through each file
- Figure out their objection
- Write a personalized message
- Track who replied
- Classify replies
- Follow up on warm ones

How many hours is that? 15? 20?

And would you actually do it? Or would it sit on your to-do list for 6 months?

We automate the heavy lifting. You just review and approve."

---

### "What if people get annoyed?"

**Say:**

"Great question. Two things:

First, we filter out anyone who explicitly opted out or said 'not interested.' We're not spamming.

Second, think about it from their perspective. If you genuinely inquired about something and life got in the way, would you be annoyed if someone reached out 6 months later with a thoughtful, personalized message?

Probably not. You'd either say 'yes, still interested' or 'no thanks' - both are valuable data.

In our experience, when messaging is personalized and respectful, most people appreciate the follow-up."

---

### "How much does it cost?"

**Say:**

"Three tiers:

**Tier 1: Pipeline Restoration Audit** - $1,200
- We analyze your dormant leads
- Score top 20 opportunities
- Give you templates + action plan
- Best if you want to see what's possible first

**Tier 2: Guided Restoration Campaign** - $2,800
- Everything in Tier 1
- Plus we run a 30-day campaign
- You approve messages, we handle execution
- Best if you're ready to recover revenue now

**Tier 3: Full Recovery System** - $6,500
- Everything in Tier 2
- Plus 90 days, pattern learning, team training
- Best if you want a long-term system

There's also a performance option (revenue share, no upfront cost) if you'd rather go that route.

Based on what you've told me, I'd recommend [Tier X] because [reason].

Make sense?"

---

## After Demo - Next Steps

1. **If interested:**
   - Send proposal (email template ready)
   - Schedule onboarding call
   - Get HighLevel API access

2. **If on the fence:**
   - Send case study
   - Offer to run a mini-audit (5-10 leads for free)
   - Follow up in 3 days

3. **If not a fit:**
   - Thank them for their time
   - Keep door open ("If things change, reach out")

---

## Pro Tips

- **Don't rush.** Let them absorb each step.
- **Use their niche.** If they're dental, reference dental examples.
- **Show the money.** Always tie back to revenue recovered.
- **Be consultative, not salesy.** If it's not a fit, say so.

---

**You've got this. The demo sells itself if you follow the script.**
