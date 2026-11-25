#!/bin/bash
# Read the release stages and current stage on a Jira fix version.
# Usage:
#   ./release-stages.sh <version_id_or_url> <output_dir>
#   ./release-stages.sh <project_key> <output_dir> "<version name>"

set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/load-env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-}"
OUTPUT_DIR="${2:-}"
VERSION_NAME="${3:-}"

if [[ -z "$INPUT" || -z "$OUTPUT_DIR" ]]; then
  echo "Usage: ./release-stages.sh <version_id_or_url> <output_dir> [version_name]"
  exit 1
fi

if [[ -n "$VERSION_NAME" && "$INPUT" =~ ^[A-Z][A-Z0-9_-]+$ ]]; then
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT" "$VERSION_NAME")
else
  VERSION_ID=$(bash "$SCRIPT_DIR/resolve-release-id.sh" "$INPUT")
fi

mkdir -p "$OUTPUT_DIR"
python3 "$SCRIPT_DIR/release-stages.py" --version-id "$VERSION_ID" --output-dir "$OUTPUT_DIR"
