#!/bin/bash
# Create or update a Jira fix version (release) and assign tickets
# Usage:
#   ./create-release.sh <output_dir> --project DWTA --name "Release 5" \
#     --tickets "DWTA-154,DWTA-155" --description-file description.md
#
#   ./create-release.sh <output_dir> --version 38223 \
#     --tickets "DWTA-154,DWTA-155" --description-file description.md
#
# Options:
#   --project              Project key (default: DWTA)
#   --name / --release-name
#                          Fix version name (Jira "name" field), e.g. "Release 5"
#   --version              Existing version ID or URL (update mode)
#   --tickets              Comma-separated Jira ticket keys
#   --description-file     One-sentence description (markdown, wiki, text, or html)
#   --description-format   markdown | wiki | text | html (default: markdown)
#   --description-text     Inline one-sentence description instead of a file
#   --release-notes-file   Release note markdown written to the Release Notes section
#   --release-date         Release date YYYY-MM-DD (required for create)
#   --stages               Comma-separated release stages. Planned first, Released last.
#                          Create default: Planned,Ext-Test,Released. Update leaves stages unchanged.
#   --released             Mark version as released (default: false)
#   --related-work-url     Optional URL for Related work (not the release note)
#   --related-work-title   Related work title
#   --related-work-category Related work category (default: Documentation)
#   --dry-run              Validate inputs without calling Jira write APIs

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

OUTPUT_DIR=""
PROJECT_KEY="${JIRA_PROJECT_KEY:-DWTA}"
VERSION_NAME=""
VERSION_INPUT=""
TICKETS_CSV=""
DESCRIPTION_FILE=""
DESCRIPTION_TEXT=""
DESCRIPTION_FORMAT="${JIRA_RELEASE_DESCRIPTION_FORMAT:-markdown}"
RELEASE_NOTES_FILE=""
RELEASE_DATE=""
STAGES=""
STAGES_SET="false"
RELEASED="false"
DRY_RUN="false"
RELATED_WORK_URL=""
RELATED_WORK_TITLE=""
RELATED_WORK_CATEGORY="${JIRA_RELATED_WORK_CATEGORY:-Documentation}"

usage() {
  echo "Usage:"
  echo "  ./create-release.sh <output_dir> --project DWTA --release-name \"Release 5\" \\"
  echo "    --release-date 2026-05-20 --tickets \"DWTA-154,DWTA-155\" \\"
  echo "    --description-file description.md --release-notes-file release-notes.md \\"
  echo "    [--stages \"Planned,Ext-Test,Released\"]"
  echo ""
  echo "  ./create-release.sh <output_dir> --version 38223 \\"
  echo "    --tickets \"DWTA-154,DWTA-155\" --description-file description.md \\"
  echo "    --release-notes-file release-notes.md [--release-date 2026-05-20]"
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
    --release-notes-file)
      RELEASE_NOTES_FILE="$2"
      shift 2
      ;;
    --description-format)
      DESCRIPTION_FORMAT="$2"
      shift 2
      ;;
    --release-date)
      RELEASE_DATE="$2"
      shift 2
      ;;
    --stages)
      STAGES="$2"
      STAGES_SET="true"
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
    --related-work-url)
      RELATED_WORK_URL="$2"
      shift 2
      ;;
    --related-work-title)
      RELATED_WORK_TITLE="$2"
      shift 2
      ;;
    --related-work-category)
      RELATED_WORK_CATEGORY="$2"
      shift 2
      ;;
    *)
      echo "Error: unknown argument: $1"
      usage
      ;;
  esac
done

if [[ -z "$TICKETS_CSV" ]]; then
  echo "Error: --tickets is required"
  exit 2
fi

if [[ -z "$DESCRIPTION_FILE" && -z "$DESCRIPTION_TEXT" ]]; then
  echo "Error: provide --description-file or --description-text"
  exit 2
fi

if [[ -n "$DESCRIPTION_FILE" && -n "$DESCRIPTION_TEXT" ]]; then
  echo "Error: use only one of --description-file or --description-text"
  exit 2
fi

if [[ -z "$VERSION_INPUT" && -z "$VERSION_NAME" ]]; then
  echo "Error: provide --release-name for a new release or --version to update an existing one"
  exit 2
fi

validate_release_date() {
  local date_value="$1"
  local label="$2"

  if [[ ! "$date_value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Error: $label must be YYYY-MM-DD (got: '$date_value')"
    exit 2
  fi
}

if [[ -z "$VERSION_INPUT" ]]; then
  if [[ -z "$RELEASE_DATE" ]]; then
    echo "Error: --release-date is required when creating a new release"
    exit 2
  fi
  validate_release_date "$RELEASE_DATE" "--release-date"
  if [[ "$STAGES_SET" != "true" ]]; then
    STAGES="Planned,Ext-Test,Released"
  fi
elif [[ -n "$RELEASE_DATE" ]]; then
  validate_release_date "$RELEASE_DATE" "--release-date"
fi

require_atlassian_env 2
USER="${ATLASSIAN_USER:-}"

AUTH="$USER:$ATLASSIAN_TOKEN"
BASE_URL="${ATLASSIAN_BASE_URL:-https://eaflood.atlassian.net}"
PROJECT_KEY=$(echo "$PROJECT_KEY" | tr '[:lower:]' '[:upper:]')

mkdir -p "$OUTPUT_DIR"

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

python3 "$SCRIPT_DIR/format-description.py" "$SOURCE_FILE" --format "$DESCRIPTION_FORMAT" \
  > "$FORMATTED_FILE"

if [[ -n "$RELEASE_NOTES_FILE" && ! -f "$RELEASE_NOTES_FILE" ]]; then
  echo "Error: release notes file not found: $RELEASE_NOTES_FILE"
  exit 2
fi

PROJECT_ID=$(bash "$SCRIPT_DIR/resolve-project-id.sh" "$PROJECT_KEY")
ACTION="create"
VERSION_ID=""

if [[ -n "$VERSION_INPUT" ]]; then
  ACTION="update"
  VERSION_ID=$(bash "$SKILLS_DIR/get-jira-release/scripts/resolve-release-id.sh" "$VERSION_INPUT")
else
  if ! bash "$SCRIPT_DIR/check-existing-release.sh" "$PROJECT_KEY" "$VERSION_NAME"; then
    echo "Error: release '$VERSION_NAME' already exists — use --version to update it"
    exit 1
  fi
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run — no Jira changes made"
  echo "  Project: $PROJECT_KEY ($PROJECT_ID)"
  echo "  Action: $ACTION"
  echo "  Name: ${VERSION_NAME:-existing}"
  echo "  Release date: ${RELEASE_DATE:-unchanged}"
  if [[ -n "$STAGES" ]]; then
    echo "  Release stages: $STAGES"
  fi
  echo "  Tickets: $TICKETS_CSV"
  echo "  Description format: $DESCRIPTION_FORMAT"
  if [[ -n "$RELEASE_NOTES_FILE" ]]; then
    echo "  Release Notes section: $RELEASE_NOTES_FILE"
  fi
  if [[ -n "$RELATED_WORK_URL" ]]; then
    echo "  Related work URL: $RELATED_WORK_URL"
    echo "  Related work title: ${RELATED_WORK_TITLE:-Release notes}"
    echo "  Related work category: $RELATED_WORK_CATEGORY"
  fi
  echo "  Description preview:"
  head -20 "$FORMATTED_FILE" | sed 's/^/    /'
  exit 0
fi

DESCRIPTION_VALUE=$(jq -Rs . "$FORMATTED_FILE")

if [[ "$ACTION" == "create" ]]; then
  payload=$(jq -n \
    --arg name "$VERSION_NAME" \
    --argjson description "$DESCRIPTION_VALUE" \
    --argjson projectId "$PROJECT_ID" \
    --argjson released "$RELEASED" \
    --arg releaseDate "$RELEASE_DATE" \
    '{
      name: $name,
      description: $description,
      projectId: ($projectId | tonumber),
      released: $released
    } + (if $releaseDate != "" then {releaseDate: $releaseDate} else {} end)')

  response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -X POST \
    -d "$payload" \
    "$BASE_URL/rest/api/2/version")

  if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
    echo "Error: $(echo "$response" | jq -r '.errorMessages[]? // .errors | to_entries[]? | .value')"
    exit 1
  fi

  VERSION_ID=$(echo "$response" | jq -r '.id')
  VERSION_NAME=$(echo "$response" | jq -r '.name')
else
  payload=$(jq -n \
    --argjson description "$DESCRIPTION_VALUE" \
    --argjson released "$RELEASED" \
    --arg releaseDate "$RELEASE_DATE" \
    '{
      description: $description,
      released: $released
    } + (if $releaseDate != "" then {releaseDate: $releaseDate} else {} end)')

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

  VERSION_NAME=$(echo "$response" | jq -r '.name')
fi

if [[ -n "$STAGES" ]]; then
  python3 "$SCRIPT_DIR/set-release-stages.py" \
    --project "$PROJECT_KEY" \
    --version-id "$VERSION_ID" \
    --stages "$STAGES"
fi

bash "$SCRIPT_DIR/assign-issues.sh" "$VERSION_ID" "$TICKETS_CSV" "$OUTPUT_DIR"

if [[ -n "$RELEASE_NOTES_FILE" ]]; then
  cp "$RELEASE_NOTES_FILE" "$OUTPUT_DIR/release-notes.md"
  python3 "$SCRIPT_DIR/write-release-notes.py" \
    --project "$PROJECT_KEY" \
    --version-id "$VERSION_ID" \
    --version-name "$VERSION_NAME" \
    --notes-file "$RELEASE_NOTES_FILE"
fi

RELATED_WORK_JSON="null"
if [[ -n "$RELATED_WORK_URL" ]]; then
  link_args=(--category "$RELATED_WORK_CATEGORY")
  if [[ -n "$RELATED_WORK_TITLE" ]]; then
    link_args+=(--title "$RELATED_WORK_TITLE")
  fi
  bash "$SCRIPT_DIR/link-related-work.sh" "$VERSION_ID" "$RELATED_WORK_URL" \
    "${link_args[@]}" "$OUTPUT_DIR/related-work.json"
  RELATED_WORK_JSON=$(cat "$OUTPUT_DIR/related-work.json")
fi

RELEASE_URL="$BASE_URL/projects/$PROJECT_KEY/versions/$VERSION_ID"
RELEASE_REPORT_URL="$RELEASE_URL/tab/release-report-all-issues"

jq -n \
  --arg createdAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg action "$ACTION" \
  --arg projectKey "$PROJECT_KEY" \
  --argjson projectId "$PROJECT_ID" \
  --arg versionId "$VERSION_ID" \
  --arg versionName "$VERSION_NAME" \
  --arg url "$RELEASE_URL" \
  --arg releaseReportUrl "$RELEASE_REPORT_URL" \
  --arg descriptionFormat "$DESCRIPTION_FORMAT" \
  --arg ticketsCsv "$TICKETS_CSV" \
  --arg releaseDate "$RELEASE_DATE" \
  --arg stages "$STAGES" \
  --argjson released "$RELEASED" \
  --argjson relatedWork "$RELATED_WORK_JSON" \
  --slurpfile assignments "$OUTPUT_DIR/assignments.json" \
  --rawfile descriptionJira "$FORMATTED_FILE" \
  '{
    createdAt: $createdAt,
    action: $action,
    projectKey: $projectKey,
    projectId: ($projectId | tonumber),
    version: {
      id: $versionId,
      name: $versionName,
      url: $url,
      releaseReportUrl: $releaseReportUrl,
      releaseDate: (if $releaseDate == "" then null else $releaseDate end),
      stages: (if $stages == "" then null else ($stages | split(",") | map(gsub("^\\s+|\\s+$";""))) end),
      released: $released
    },
    tickets: ($ticketsCsv | split(",") | map(gsub("^\\s+|\\s+$";"")) | map(ascii_upcase)),
    descriptionFormat: $descriptionFormat,
    descriptionSourceFile: "description-source.txt",
    descriptionJiraFile: "description-jira.txt",
    descriptionJira: $descriptionJira,
    assignments: $assignments[0],
    relatedWork: (if $relatedWork == null then null else $relatedWork.relatedWork end)
  }' > "$OUTPUT_DIR/manifest.json"

echo "Jira release ${ACTION}d"
echo "Name: $VERSION_NAME"
if [[ -n "$RELEASE_DATE" ]]; then
  echo "Release date: $RELEASE_DATE"
fi
echo "ID: $VERSION_ID"
echo "URL: $RELEASE_URL"
echo "Report: $RELEASE_REPORT_URL"
echo "Tickets assigned: $(jq -r '.assignments.assigned | join(", ")' "$OUTPUT_DIR/manifest.json")"
if [[ -n "$RELATED_WORK_URL" ]]; then
  echo "Related work: $RELATED_WORK_URL"
fi
echo "Manifest: $OUTPUT_DIR/manifest.json"
