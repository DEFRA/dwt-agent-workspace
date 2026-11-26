#!/bin/bash
# Resolve the CDP service version minted by a merged pull request. Uses gh, which is logged in for the DEFRA org.

set -euo pipefail

# This file is .cursor/skills/get-pr-service-version/scripts/pr-version.sh. The workspace root is four directories above it.
root=$(cd "$(dirname "$0")/../../../.." && pwd)

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo 'Usage: bash pr-version.sh <pr_url> OR bash pr-version.sh <owner/repo> <pr_number>' >&2
  exit 1
fi

org=DEFRA
if [[ -f "$root/.env" ]]; then
  org_line=$(grep -E '^GITHUB_ORG=' "$root/.env" | tail -n 1 || true)
  if [[ -n "$org_line" ]]; then
    org=${org_line#GITHUB_ORG=}
    org=${org#\"}
    org=${org%\"}
    org=${org#\'}
    org=${org%\'}
  fi
fi

input=$1
number=${2:-}
repo=
if [[ "$input" =~ ^https?://github.com/ ]]; then
  if [[ ! "$input" =~ github\.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
    echo "Error: unable to parse PR URL: $input" >&2
    exit 1
  fi
  org=${BASH_REMATCH[1]}
  repo=${BASH_REMATCH[2]}
  number=${BASH_REMATCH[3]}
elif [[ -n "$number" ]]; then
  if [[ "$input" == */* ]]; then
    org=${input%%/*}
    repo=${input#*/}
  else
    repo=$input
  fi
else
  echo 'Error: provide PR URL or owner/repo and PR number' >&2
  exit 1
fi

if ! row=$(gh api "repos/${org}/${repo}/pulls/${number}" \
  --jq '[.title, .html_url, (.merged|tostring), (.merged_at // ""), (.merge_commit_sha // "")] | @tsv'); then
  echo "Error: could not read ${org}/${repo}#${number}" >&2
  exit 1
fi

IFS=$'\t' read -r title url merged merged_at sha <<< "$row"
if [[ "$merged" != "true" ]]; then
  echo "Error: PR ${org}/${repo}#${number} is not merged" >&2
  exit 1
fi

service=false
case "$repo" in
  waste-movement-backend|waste-movement-external-api|waste-tracking-id-backend) service=true ;;
esac

tag=
if [[ "$service" == "true" && -n "$sha" ]]; then
  tag=$(gh api --paginate "repos/${org}/${repo}/tags?per_page=100" \
    --jq ".[] | select(.commit.sha==\"${sha}\") | .name")
  tag=${tag%%$'\n'*}
fi

cat <<EOF
=== PR ${org}/${repo}#${number} ===
Title: ${title}
URL: ${url}
Merged: ${merged_at}
Merge commit: ${sha}
Service repo: ${service}
EOF

if [[ -n "$tag" ]]; then
  echo "Version: ${tag}"
elif [[ "$service" == "true" ]]; then
  cat <<EOF
Version: (not found on merge commit)
Note: CDP service repos should tag the merge commit when Publish workflow runs.
Check the Publish workflow run on main for this merge.
EOF
else
  cat <<EOF
Version: (own version on merge to main — not a service version)
Note: ${repo} mints its own version on merge to main. That version is not a service version.
EOF
fi
