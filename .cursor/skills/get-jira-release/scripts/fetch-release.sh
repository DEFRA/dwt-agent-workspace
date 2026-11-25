#!/bin/bash
# Fetch a Jira fix version: status, dates, stage, tickets, related work, and the Release Notes section.
# Usage:
#   ./fetch-release.sh <version_id_or_url> <output_dir>
#   ./fetch-release.sh <project_key> <output_dir> "<version name>"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-}"
OUTPUT_DIR="${2:-}"
VERSION_NAME="${3:-}"

if [[ -z "$INPUT" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./fetch-release.sh <version_id_or_url> <output_dir> [version_name]"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

if [[ -n "$VERSION_NAME" ]]; then
  bash "$SCRIPT_DIR/release.sh" "$INPUT" "$VERSION_NAME" full > "$OUTPUT_DIR/release.txt"
  bash "$SCRIPT_DIR/release.sh" "$INPUT" "$VERSION_NAME" json > "$OUTPUT_DIR/release.json"
  bash "$SCRIPT_DIR/release-issues.sh" "$INPUT" "$OUTPUT_DIR" "$VERSION_NAME"
  bash "$SCRIPT_DIR/release-sections.sh" "$INPUT" "$OUTPUT_DIR" "$VERSION_NAME"
  bash "$SCRIPT_DIR/release-related-work.sh" "$INPUT" "$OUTPUT_DIR" "$VERSION_NAME"
  bash "$SCRIPT_DIR/release-stages.sh" "$INPUT" "$OUTPUT_DIR" "$VERSION_NAME"
else
  bash "$SCRIPT_DIR/release.sh" "$INPUT" full > "$OUTPUT_DIR/release.txt"
  bash "$SCRIPT_DIR/release.sh" "$INPUT" json > "$OUTPUT_DIR/release.json"
  bash "$SCRIPT_DIR/release-issues.sh" "$INPUT" "$OUTPUT_DIR"
  bash "$SCRIPT_DIR/release-sections.sh" "$INPUT" "$OUTPUT_DIR"
  bash "$SCRIPT_DIR/release-related-work.sh" "$INPUT" "$OUTPUT_DIR"
  bash "$SCRIPT_DIR/release-stages.sh" "$INPUT" "$OUTPUT_DIR"
fi

echo "Fetched release into $OUTPUT_DIR"
