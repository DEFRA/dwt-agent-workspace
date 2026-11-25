#!/bin/bash
# Clone repositories for the DEFRA team the logged-in user belongs to.
# A directory that already exists under repos/ is left as it is.

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
REPOS="$ROOT/repos"

teams=$(gh api --paginate user/teams \
  --jq '.[] | select(.organization.login=="DEFRA") | [.slug, .name] | @tsv')

if [[ -z "$teams" ]]; then
  echo "The logged-in user is not a member of a DEFRA team." >&2
  exit 1
fi

count=$(printf '%s\n' "$teams" | grep -c .)
if [[ "$count" -eq 1 ]]; then
  slug=$(printf '%s\n' "$teams" | cut -f1)
  team_name=$(printf '%s\n' "$teams" | cut -f2)
else
  match=$(printf '%s\n' "$teams" | awk -F '\t' '$1=="digital-waste-tracking" || $2=="Digital Waste Tracking" { print; exit }')
  if [[ -z "$match" ]]; then
    echo "The logged-in user is in more than one DEFRA team. None is Digital Waste Tracking:" >&2
    printf '%s\n' "$teams" >&2
    exit 1
  fi
  slug=$(printf '%s\n' "$match" | cut -f1)
  team_name=$(printf '%s\n' "$match" | cut -f2)
fi

echo "Team: ${team_name} (${slug})"

mkdir -p "$REPOS"
workspace=$(basename "$ROOT")
cloned=0
skipped=0

while IFS=$'\t' read -r repo_name ssh_url; do
  [[ -z "${repo_name:-}" ]] && continue
  if [[ "$repo_name" == "$workspace" ]]; then
    echo "skip ${repo_name} (this workspace)"
    skipped=$((skipped + 1))
    continue
  fi
  dest="${REPOS}/${repo_name}"
  if [[ -e "$dest" ]]; then
    echo "skip ${repo_name}"
    skipped=$((skipped + 1))
    continue
  fi
  echo "clone ${repo_name}"
  git clone "$ssh_url" "$dest"
  cloned=$((cloned + 1))
done < <(gh api --paginate "orgs/DEFRA/teams/${slug}/repos" \
  --jq '.[] | [.name, .ssh_url] | @tsv')

echo "Cloned ${cloned}. Left ${skipped} already present."
