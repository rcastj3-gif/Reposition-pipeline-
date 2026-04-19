#!/bin/bash

# Pipeline Restoration - End-to-End Workflow Test
# This script simulates the complete revenue recovery process

API_URL="http://localhost:3000"

echo "=================================================="
echo "Pipeline Restoration - Full Workflow Test"
echo "=================================================="
echo ""

# Step 1: Pull dormant leads
echo "📋 Step 1: Pulling dormant leads (30+ days)..."
DORMANT_RESPONSE=$(curl -s "$API_URL/contacts/dormant?threshold=30")
DORMANT_COUNT=$(echo $DORMANT_RESPONSE | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "✅ Found $DORMANT_COUNT dormant leads"
echo ""

# Extract contact IDs (first 5 for testing)
CONTACT_IDS=$(echo $DORMANT_RESPONSE | grep -o '"id":"contact_[0-9]*"' | head -5 | grep -o 'contact_[0-9]*' | tr '\n' ',' | sed 's/,$//')
echo "🎯 Testing with contacts: $CONTACT_IDS"
echo ""

# Step 2: Score contacts
echo "📊 Step 2: Scoring contacts by restoration potential..."
IFS=',' read -ra ID_ARRAY <<< "$CONTACT_IDS"
CONTACT_JSON=$(printf '"%s",' "${ID_ARRAY[@]}" | sed 's/,$//')
SCORE_RESPONSE=$(curl -s -X POST "$API_URL/score" \
  -H "Content-Type: application/json" \
  -d "{\"contactIds\": [$CONTACT_JSON]}")

echo "$SCORE_RESPONSE" | grep -o '"name":"[^"]*","email":"[^"]*","score":[0-9]*' | while read -r line; do
  NAME=$(echo $line | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
  SCORE=$(echo $line | grep -o '"score":[0-9]*' | grep -o '[0-9]*')
  echo "  • $NAME - Score: $SCORE/10"
done
echo ""

# Step 3: Draft messages (batch)
echo "✍️  Step 3: Drafting personalized messages (auto-pattern)..."
DRAFT_RESPONSE=$(curl -s -X POST "$API_URL/draft/batch" \
  -H "Content-Type: application/json" \
  -d "{\"contactIds\": [$CONTACT_JSON]}")

DRAFT_COUNT=$(echo $DRAFT_RESPONSE | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "✅ Generated $DRAFT_COUNT personalized drafts"
echo ""

echo "$DRAFT_RESPONSE" | grep -o '"name":"[^"]*","pattern":"[^"]*","patternName":"[^"]*","subject":"[^"]*"' | while read -r line; do
  NAME=$(echo $line | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  PATTERN=$(echo $line | grep -o '"patternName":"[^"]*"' | cut -d'"' -f4)
  SUBJECT=$(echo $line | grep -o '"subject":"[^"]*"' | cut -d'"' -f4)
  echo "  • $NAME"
  echo "    Pattern: $PATTERN"
  echo "    Subject: $SUBJECT"
  echo ""
done

# Step 4: Show sample draft
echo "📧 Step 4: Sample Draft Message..."
FIRST_DRAFT_ID=$(echo $DRAFT_RESPONSE | grep -o '"draftId":[0-9]*' | head -1 | grep -o '[0-9]*')
SAMPLE_DRAFT=$(curl -s "$API_URL/draft/$FIRST_DRAFT_ID")

echo "---"
echo "$SAMPLE_DRAFT" | grep -o '"subject":"[^"]*"' | cut -d'"' -f4
echo ""
BODY=$(echo "$SAMPLE_DRAFT" | grep -o '"body":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\n/g')
echo "$BODY"
echo "---"
echo ""

# Step 5: Summary
echo "=================================================="
echo "✅ Workflow Test Complete!"
echo "=================================================="
echo ""
echo "Summary:"
echo "  • Dormant leads found: $DORMANT_COUNT"
echo "  • Contacts scored: $(echo $SCORE_RESPONSE | grep -o '"total":[0-9]*' | grep -o '[0-9]*')"
echo "  • Drafts generated: $DRAFT_COUNT"
echo ""
echo "Next steps:"
echo "  1. Review drafts in database or via API"
echo "  2. Approve/edit drafts (PATCH /draft/:id/status)"
echo "  3. Send approved messages (coming soon)"
echo "  4. Track replies and classify (coming soon)"
echo "  5. Generate ROI report (coming soon)"
echo ""
echo "=================================================="
