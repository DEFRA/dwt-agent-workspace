#!/bin/bash
# Get JIRA ticket comments
# Usage: ./comments.sh DWT-XXXX [format]
# Formats: list (default), json, count

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

TICKET="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$TICKET" ]]; then
  echo "Usage: ./comments.sh DWT-XXXX [format]"
  echo "Formats: list (default), json, count"
  exit 1
fi

require_atlassian_env
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

response=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/issue/$TICKET/comment?expand=renderedBody")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "$response" | jq -r '.errorMessages[]'
  exit 1
fi

comments=$(echo "$response" | jq '.comments')

case "$FORMAT" in
  json)
    echo "$comments"
    ;;
  count)
    echo "$comments" | jq 'length'
    ;;
  list|*)
    count=$(echo "$comments" | jq 'length')
    if [[ "$count" == "0" ]]; then
      echo "No comments on $TICKET"
      exit 0
    fi
    echo "=== Comments on $TICKET ($count) ==="
    echo "$comments" | jq -r '.[] |
      "--- \(.author.displayName) (\(.created | split("T")[0])) ---",
      (.renderedBody // .body // "No comment body"),
      ""'
    ;;
esac
