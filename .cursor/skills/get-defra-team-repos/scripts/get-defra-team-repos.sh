#!/bin/bash
# Ask gh for this user's DEFRA team repositories and save the list under .tmp.

set -euo pipefail

# This file is .cursor/skills/get-defra-team-repos/scripts/get-defra-team-repos.sh. The workspace root is four directories above it.
root=$(cd "$(dirname "$0")/../../../.." && pwd)
out="$root/.tmp/defra-team-repos"
mkdir -p "$out"

teams=$(mktemp)
trap 'rm -f "$teams"' EXIT

gh api --paginate user/teams \
  --jq '.[] | select(.organization.login=="DEFRA") | [.slug, .name] | @tsv' \
  > "$teams"

if [[ ! -s "$teams" ]]; then
  echo 'The logged-in user is not a member of a DEFRA team.' >&2
  exit 1
fi

count=0
slug=
team_name=
match_slug=
match_name=
while IFS=$'\t' read -r one_slug one_name; do
  [[ -z "$one_slug" ]] && continue
  count=$((count + 1))
  if [[ -z "$slug" ]]; then
    slug=$one_slug
    team_name=$one_name
  fi
  if [[ "$one_slug" == "digital-waste-tracking" || "$one_name" == "Digital Waste Tracking" ]]; then
    match_slug=$one_slug
    match_name=$one_name
  fi
done < "$teams"

if [[ "$count" -gt 1 ]]; then
  if [[ -z "$match_slug" ]]; then
    echo 'The logged-in user is in more than one DEFRA team. None is Digital Waste Tracking:' >&2
    cat "$teams" >&2
    exit 1
  fi
  slug=$match_slug
  team_name=$match_name
fi

gh api --paginate "orgs/DEFRA/teams/${slug}/repos" \
  --jq '.[] | [.name, .ssh_url] | @tsv' \
  > "$out/repos.tsv"

printf '%s\n' "$team_name" "$slug" > "$out/team.txt"
echo "Team: $team_name ($slug)"
echo "Saved: $out/team.txt"
echo "Saved: $out/repos.tsv"
