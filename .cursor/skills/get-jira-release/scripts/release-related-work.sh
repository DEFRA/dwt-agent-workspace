#!/bin/bash
# Read Related work links on a Jira fix version.
# Usage:
#   ./release-related-work.sh <version_id_or_url> <output_dir>
#   ./release-related-work.sh <project_key> <output_dir> "<version name>"

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-}"
OUTPUT_DIR="${2:-}"
VERSION_NAME="${3:-}"

if [[ -z "$INPUT" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./release-related-work.sh <version_id_or_url> <output_dir> [version_name]"
  exit 1
fi

require_atlassian_env
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

if [[ -n "$VERSION_NAME" && "$INPUT" =~ ^[A-Z][A-Z0-9_-]+$ ]]; then
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT" "$VERSION_NAME")
else
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT")
fi

mkdir -p "$OUTPUT_DIR"

version_response=$(curl -s -u "$AUTH" \
  -H "Accept: application/json" \
  "$BASE_URL/rest/api/2/version/$VERSION_ID")

if echo "$version_response" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "Error: $(echo "$version_response" | jq -r '.errorMessages[]')"
  exit 1
fi

VERSION_NAME_VALUE=$(echo "$version_response" | jq -r '.name')

related=$(curl -s -u "$AUTH" \
  -H "Accept: application/json" \
  "$BASE_URL/rest/api/3/version/$VERSION_ID/relatedwork")

if echo "$related" | jq -e '.statusCode' > /dev/null 2>&1; then
  echo "Error: $(echo "$related" | jq -r '.message // "Failed to fetch related work"')"
  exit 1
fi

if echo "$related" | jq -e 'type == "array"' > /dev/null 2>&1; then
  items="$related"
else
  echo "Error: related work response was not a list"
  exit 1
fi

total=$(echo "$items" | jq 'length')

{
  echo "=== Related work ==="
  echo "Version: $VERSION_NAME_VALUE ($VERSION_ID)"
  echo "Count: $total"
  echo ""
  if [[ "$total" == "0" ]]; then
    echo "No related work."
  else
    echo "$items" | jq -r '.[] | "- \(.title // "(untitled)") [\(.category // "Uncategorised")]\n  \(.url // .issueId // "")"'
  fi
} > "$OUTPUT_DIR/related-work.txt"

echo "$items" | jq \
  --arg versionId "$VERSION_ID" \
  --arg versionName "$VERSION_NAME_VALUE" \
  --argjson total "$total" \
  '{
    versionId: $versionId,
    versionName: $versionName,
    total: $total,
    relatedWork: .
  }' > "$OUTPUT_DIR/related-work.json"

echo "Saved: $OUTPUT_DIR/related-work.txt"
echo "Saved: $OUTPUT_DIR/related-work.json"
echo "Related work: $total"
