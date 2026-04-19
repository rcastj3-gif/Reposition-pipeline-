#!/bin/bash
set -e

API_URL="http://localhost:3000"
CLIENT_NAME="${1:-Demo Client}"
TO_EMAIL="${2:-rcastj3@gmail.com}"
DORMANT_COUNT="${3:-10}"
INBOX="reyes@agentmail.to"

EXPORT_JSON=$(curl -s -X POST "$API_URL/report/export" \
  -H "Content-Type: application/json" \
  -d "{\"clientName\": \"$CLIENT_NAME\", \"dormantCount\": $DORMANT_COUNT, \"outDir\": \"/tmp\", \"limit\": 10}")

HTML_PATH=$(echo "$EXPORT_JSON" | sed -n 's/.*"htmlPath":"\([^"]*\)".*/\1/p')

if [ -z "$HTML_PATH" ]; then
  echo "Failed to export report"
  echo "$EXPORT_JSON"
  exit 1
fi

bash -lc "python3 ~/.openclaw/workspace/skills/agentmail/scripts/send_email_openclaw.py --inbox $INBOX --to $TO_EMAIL --subject 'Pipeline Restoration Audit - $CLIENT_NAME' --html-file $HTML_PATH"
