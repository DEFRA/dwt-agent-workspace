#!/bin/bash
# Clone repositories listed by get-defra-team-repos into repos/ when the directory is not already there.

set -euo pipefail

# This file is .cursor/skills/seed-repos/scripts/seed-repos.sh. The workspace root is four directories above it.
root=$(cd "$(dirname "$0")/../../../.." && pwd)
repos_dir="$root/repos"
workspace=$(basename "$root")
list="$root/.tmp/defra-team-repos/repos.tsv"

if [[ ! -f "$list" ]]; then
  echo 'No repository list at .tmp/defra-team-repos/repos.tsv. Run get-defra-team-repos first.' >&2
  exit 1
fi

echo "Repos: $repos_dir"
mkdir -p "$repos_dir"

cloned=0
skipped=0
while IFS=$'\t' read -r name url; do
  [[ -z "$name" ]] && continue
  if [[ -z "$url" ]]; then
    echo "Missing clone URL for $name" >&2
    exit 1
  fi
  if [[ "$name" == "$workspace" ]]; then
    echo "skip $name (this workspace)"
    skipped=$((skipped + 1))
    continue
  fi
  if [[ -d "$repos_dir/$name" ]]; then
    echo "skip $name"
    skipped=$((skipped + 1))
    continue
  fi
  echo "clone $name"
  git clone "$url" "$repos_dir/$name"
  cloned=$((cloned + 1))
done < "$list"

echo "Cloned ${cloned}. Left ${skipped} already present."
