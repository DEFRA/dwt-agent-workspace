#!/bin/bash
# Change an existing Jira fix version. Does not create one.
# Usage:
#   ./edit-release.sh <output_dir> --project DWTC --version 48175 \
#     [--release-name "New name"] [--release-date 2026-11-24] \
#     [--description-file description.md] [--release-notes-file release-notes.md] \
#     [--stages "Planned,Ext-Test,Released"] [--tickets "DWTC-259,DWTC-260"] \
#     [--released] [--dry-run]

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CREATE_DIR="$SKILLS_DIR/create-jira-release/scripts"

OUTPUT_DIR=""
PROJECT_KEY=""
VERSION_INPUT=""
VERSION_NAME=""
TICKETS_CSV=""
DESCRIPTION_FILE=""
DESCRIPTION_TEXT=""
DESCRIPTION_FORMAT="${JIRA_RELEASE_DESCRIPTION_FORMAT:-markdown}"
RELEASE_NOTES_FILE=""
RELEASE_DATE=""
STAGES=""
RELEASED=""
DRY_RUN="false"

usage() {
  echo "Usage:"
  echo "  ./edit-release.sh <output_dir> --project DWTC --version 48175 \\"
  echo "    [--release-name \"New name\"] [--release-date 2026-11-24] \\"
  echo "    [--description-file description.md | --description-text \"One sentence.\"] \\"
  echo "    [--release-notes-file release-notes.md] \\"
  echo "    [--stages \"Planned,Ext-Test,Released\"] [--tickets \"DWTC-259\"] \\"
  echo "    [--released] [--dry-run]"
  exit 2
}

if [[ $# -lt 1 ]]; then
  usage
fi

OUTPUT_DIR="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_KEY="$2"
      shift 2
      ;;
    --name|--release-name)
      VERSION_NAME="$2"
      shift 2
      ;;
    --version)
      VERSION_INPUT="$2"
      shift 2
      ;;
    --tickets)
      TICKETS_CSV="$2"
      shift 2
      ;;
    --description-file)
      DESCRIPTION_FILE="$2"
      shift 2
      ;;
    --description-text)
      DESCRIPTION_TEXT="$2"
      shift 2
      ;;
    --description-format)
      DESCRIPTION_FORMAT="$2"
      shift 2
      ;;
    --release-notes-file)
      RELEASE_NOTES_FILE="$2"
      shift 2
      ;;
    --release-date)
      RELEASE_DATE="$2"
      shift 2
      ;;
    --stages)
      STAGES="$2"
      shift 2
      ;;
    --released)
      RELEASED="true"
      shift
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    *)
      echo "Error: unknown argument: $1"
      usage
      ;;
  esac
done

if [[ -z "$VERSION_INPUT" ]]; then
  echo "Error: --version is required. This skill edits an existing release."
  exit 2
fi

if [[ -z "$PROJECT_KEY" ]]; then
  echo "Error: --project is required"
  exit 2
fi

if [[ -n "$DESCRIPTION_FILE" && -n "$DESCRIPTION_TEXT" ]]; then
  echo "Error: use only one of --description-file or --description-text"
  exit 2
fi

if [[ -z "$VERSION_NAME" && -z "$RELEASE_DATE" && -z "$DESCRIPTION_FILE" && -z "$DESCRIPTION_TEXT" \
  && -z "$RELEASE_NOTES_FILE" && -z "$STAGES" && -z "$TICKETS_CSV" && -z "$RELEASED" ]]; then
  echo "Error: pass at least one change, such as --description-file, --release-notes-file, --stages, or --tickets"
  exit 2
fi

if [[ -n "$RELEASE_DATE" && ! "$RELEASE_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Error: --release-date must be YYYY-MM-DD (got: '$RELEASE_DATE')"
  exit 2
fi

require_atlassian_env 2
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"
PROJECT_KEY=$(echo "$PROJECT_KEY" | tr '[:lower:]' '[:upper:]')

mkdir -p "$OUTPUT_DIR"

VERSION_ID=$(bash "$SKILLS_DIR/get-jira-release/scripts/resolve-release-id.sh" "$VERSION_INPUT")

if [[ -n "$DESCRIPTION_FILE" || -n "$DESCRIPTION_TEXT" ]]; then
  SOURCE_FILE="$OUTPUT_DIR/description-source.txt"
  FORMATTED_FILE="$OUTPUT_DIR/description-jira.txt"
  if [[ -n "$DESCRIPTION_FILE" ]]; then
    if [[ ! -f "$DESCRIPTION_FILE" ]]; then
      echo "Error: description file not found: $DESCRIPTION_FILE"
      exit 2
    fi
    cp "$DESCRIPTION_FILE" "$SOURCE_FILE"
  else
    printf '%s\n' "$DESCRIPTION_TEXT" > "$SOURCE_FILE"
  fi
  if grep -Eq '^#{1,6} |^Services and versions' "$SOURCE_FILE"; then
    echo "Error: the description is one sentence. Put the release note in --release-notes-file."
    exit 2
  fi
  python3 "$CREATE_DIR/format-description.py" "$SOURCE_FILE" --format "$DESCRIPTION_FORMAT" \
    > "$FORMATTED_FILE"
fi

if [[ -n "$RELEASE_NOTES_FILE" && ! -f "$RELEASE_NOTES_FILE" ]]; then
  echo "Error: release notes file not found: $RELEASE_NOTES_FILE"
  exit 2
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run — no Jira changes made"
  echo "  Project: $PROJECT_KEY"
  echo "  Version: $VERSION_ID"
  if [[ -n "$VERSION_NAME" ]]; then
    echo "  Name: $VERSION_NAME"
  fi
  if [[ -n "$RELEASE_DATE" ]]; then
    echo "  Release date: $RELEASE_DATE"
  fi
  if [[ -n "$STAGES" ]]; then
    echo "  Release stages: $STAGES"
  fi
  if [[ -n "$TICKETS_CSV" ]]; then
    echo "  Tickets to add: $TICKETS_CSV"
  fi
  if [[ -n "$RELEASE_NOTES_FILE" ]]; then
    echo "  Release Notes section: $RELEASE_NOTES_FILE"
  fi
  if [[ "$RELEASED" == "true" ]]; then
    echo "  Mark released: true"
  fi
  if [[ -n "$FORMATTED_FILE" ]]; then
    echo "  Description preview:"
    head -20 "$FORMATTED_FILE" | sed 's/^/    /'
  fi
  exit 0
fi

current=$(curl -s -u "$AUTH" -H "Accept: application/json" "$BASE_URL/rest/api/2/version/$VERSION_ID")
if echo "$current" | jq -e '.errorMessages' > /dev/null 2>&1; then
  echo "Error: $(echo "$current" | jq -r '.errorMessages[]')"
  exit 1
fi

payload='{}'
if [[ -n "$VERSION_NAME" ]]; then
  payload=$(echo "$payload" | jq --arg name "$VERSION_NAME" '. + {name: $name}')
fi
if [[ -n "$RELEASE_DATE" ]]; then
  payload=$(echo "$payload" | jq --arg releaseDate "$RELEASE_DATE" '. + {releaseDate: $releaseDate}')
fi
if [[ "$RELEASED" == "true" ]]; then
  payload=$(echo "$payload" | jq '. + {released: true}')
fi
if [[ -n "$FORMATTED_FILE" ]]; then
  payload=$(jq --argjson body "$payload" --rawfile description "$FORMATTED_FILE" '$body + {description: $description}')
fi

if [[ "$payload" != "{}" ]]; then
  response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -X PUT \
    -d "$payload" \
    "$BASE_URL/rest/api/2/version/$VERSION_ID")
  if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
    echo "Error: $(echo "$response" | jq -r '.errorMessages[]? // .errors | to_entries[]? | .value')"
    exit 1
  fi
  current="$response"
fi

CURRENT_NAME=$(echo "$current" | jq -r '.name')

if [[ -n "$STAGES" ]]; then
  python3 "$CREATE_DIR/set-release-stages.py" \
    --project "$PROJECT_KEY" \
    --version-id "$VERSION_ID" \
    --stages "$STAGES"
fi

if [[ -n "$TICKETS_CSV" ]]; then
  bash "$CREATE_DIR/assign-issues.sh" "$VERSION_ID" "$TICKETS_CSV" "$OUTPUT_DIR"
fi

if [[ -n "$RELEASE_NOTES_FILE" ]]; then
  cp "$RELEASE_NOTES_FILE" "$OUTPUT_DIR/release-notes.md"
  python3 "$CREATE_DIR/write-release-notes.py" \
    --project "$PROJECT_KEY" \
    --version-id "$VERSION_ID" \
    --version-name "$CURRENT_NAME" \
    --notes-file "$RELEASE_NOTES_FILE"
fi

RELEASE_URL="$BASE_URL/projects/$PROJECT_KEY/versions/$VERSION_ID"
RELEASE_REPORT_URL="$RELEASE_URL/tab/release-report-all-issues"

jq -n \
  --arg createdAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg projectKey "$PROJECT_KEY" \
  --arg versionId "$VERSION_ID" \
  --arg versionName "$CURRENT_NAME" \
  --arg url "$RELEASE_URL" \
  --arg releaseReportUrl "$RELEASE_REPORT_URL" \
  --arg releaseDate "$RELEASE_DATE" \
  --arg stages "$STAGES" \
  --arg ticketsCsv "$TICKETS_CSV" \
  --argjson released "$( [[ "$RELEASED" == "true" ]] && echo true || echo false )" \
  '{
    createdAt: $createdAt,
    action: "edit",
    projectKey: $projectKey,
    version: {
      id: $versionId,
      name: $versionName,
      url: $url,
      releaseReportUrl: $releaseReportUrl,
      releaseDate: (if $releaseDate == "" then null else $releaseDate end),
      stages: (if $stages == "" then null else ($stages | split(",") | map(gsub("^\\s+|\\s+$";""))) end),
      released: $released
    },
    tickets: (if $ticketsCsv == "" then [] else ($ticketsCsv | split(",") | map(gsub("^\\s+|\\s+$";"")) | map(ascii_upcase)) end)
  }' > "$OUTPUT_DIR/manifest.json"

echo "Jira release edited"
echo "Name: $CURRENT_NAME"
echo "ID: $VERSION_ID"
echo "URL: $RELEASE_URL"
echo "Report: $RELEASE_REPORT_URL"
echo "Manifest: $OUTPUT_DIR/manifest.json"
