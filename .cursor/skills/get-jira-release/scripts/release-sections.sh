#!/bin/bash
# Read the custom rich text section on a Jira fix version.
# Usage:
#   ./release-sections.sh <version_id_or_url> <output_dir>
#   ./release-sections.sh <project_key> <output_dir> "<version name>"

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-}"
OUTPUT_DIR="${2:-}"
VERSION_NAME="${3:-}"

if [[ -z "$INPUT" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./release-sections.sh <version_id_or_url> <output_dir> [version_name]"
  exit 1
fi

if [[ -n "$VERSION_NAME" && "$INPUT" =~ ^[A-Z][A-Z0-9_-]+$ ]]; then
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT" "$VERSION_NAME")
else
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT")
fi

mkdir -p "$OUTPUT_DIR"
python3 "$SCRIPT_DIR/release-sections.py" --version-id "$VERSION_ID" --output-dir "$OUTPUT_DIR"
