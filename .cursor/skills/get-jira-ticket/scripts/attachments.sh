#!/bin/bash
# Download JIRA ticket attachments
# Usage: ./attachments.sh DWT-XXXX [output_dir]

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

TICKET="${1:-}"
OUTPUT_DIR="${2:-.tmp/jira-tickets/$TICKET/attachments}"

if [[ -z "$TICKET" ]]; then
  echo "Usage: ./attachments.sh DWT-XXXX [output_dir]"
  exit 1
fi

require_atlassian_env
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

response=$(curl -s -u "$AUTH" \
  -H "Content-Type: application/json" \
  "$BASE_URL/rest/api/2/issue/$TICKET?fields=attachment")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "$response" | jq -r '.errorMessages[]'
  exit 1
fi

attachment_count=$(echo "$response" | jq '.fields.attachment | length')
if [[ "$attachment_count" -eq 0 ]]; then
  echo "No attachments on $TICKET"
  exit 0
fi

mkdir -p "$OUTPUT_DIR"

echo "Downloading $attachment_count attachment(s) to $OUTPUT_DIR"

echo "$response" | jq -c '.fields.attachment[]' | while read -r attachment; do
  filename=$(echo "$attachment" | jq -r '.filename')
  content_url=$(echo "$attachment" | jq -r '.content')
  output_path="$OUTPUT_DIR/$filename"

  curl -s -u "$AUTH" -L "$content_url" -o "$output_path"
  echo "Saved: $output_path"
done

echo ""
echo "Attachment directory: $OUTPUT_DIR"
