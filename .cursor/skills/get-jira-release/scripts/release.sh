#!/bin/bash
# Get Jira fix version (release) metadata
# Usage:
#   ./release.sh <version_id_or_url> [format]
#   ./release.sh <project_key> "<version_name>" [format]
# Formats: full (default), summary, json

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-}"
ARG2="${2:-}"
ARG3="${3:-}"

if [[ -z "$INPUT" ]]; then
  echo "Usage: ./release.sh <version_id_or_url> [format]"
  echo "   or: ./release.sh <project_key> \"<version_name>\" [format]"
  echo "Formats: full (default), summary, json"
  exit 1
fi

is_format() {
  [[ "$1" == "full" || "$1" == "summary" || "$1" == "json" ]]
}

if is_format "$ARG2"; then
  FORMAT="$ARG2"
  VERSION_NAME=""
elif [[ -n "$ARG2" ]]; then
  VERSION_NAME="$ARG2"
  if is_format "$ARG3"; then
    FORMAT="$ARG3"
  else
    FORMAT="full"
  fi
else
  FORMAT="full"
  VERSION_NAME=""
fi

require_atlassian_env
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"

if [[ -n "$VERSION_NAME" ]]; then
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT" "$VERSION_NAME")
else
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT")
fi

response=$(curl -s -u "$AUTH" \
  -H "Accept: application/json" \
  "$BASE_URL/rest/api/2/version/$VERSION_ID")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "Error: $(echo "$response" | jq -r '.errorMessages[]')"
  exit 1
fi

case "$FORMAT" in
  json)
    echo "$response"
    ;;
  summary)
    echo "$response" | jq -r '{
      id: .id,
      name: .name,
      description: (.description // ""),
      status: (if .archived then "Archived" elif .released then "Released" else "Unreleased" end),
      released: .released,
      archived: .archived,
      startDate: (.startDate // "Not set"),
      releaseDate: (.releaseDate // "Not set"),
      projectId: .projectId,
      overdue: (.overdue // false)
    }'
    ;;
  full|*)
    echo "=== Release $VERSION_ID ==="
    echo "$response" | jq -r '"Name: \(.name)"'
    echo "$response" | jq -r '"Status: \(if .archived then "Archived" elif .released then "Released" else "Unreleased" end)"'
    echo "$response" | jq -r '"Released: \(.released)"'
    echo "$response" | jq -r '"Archived: \(.archived)"'
    echo "$response" | jq -r '"Start date: \(.startDate // "Not set")"'
    echo "$response" | jq -r '"Release date: \(.releaseDate // "Not set")"'
    echo "$response" | jq -r '"Overdue: \(.overdue // false)"'
    echo "$response" | jq -r '"Project ID: \(.projectId)"'
    echo ""
    echo "=== Description ==="
    echo "$response" | jq -r '.description // "No description"'
    echo ""
    echo "URL: $BASE_URL/projects/<project>/versions/$VERSION_ID/tab/release-report-all-issues"
    ;;
esac
