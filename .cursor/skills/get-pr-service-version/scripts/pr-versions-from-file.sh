#!/bin/bash
# Resolve minted versions for the pull request URLs in a file.

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
input=${1:-}
output_dir=${2:-}

if [[ -z "$input" || ! -f "$input" ]]; then
  echo 'Usage: bash pr-versions-from-file.sh <file> [output_dir]' >&2
  exit 1
fi

mapfile -t urls < <(grep -oE 'https://github.com/[^ ]+/pull/[0-9]+' "$input" | sort -u)

found=0
failed=0
texts=
json='['
first=true

json_escape() {
  local value=$1
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/}
  printf '%s' "$value"
}

for url in "${urls[@]}"; do
  [[ -z "$url" ]] && continue
  if text=$(bash "$script_dir/pr-version.sh" "$url" 2>&1); then
    found=$((found + 1))
    status=ok
    version=$(printf '%s\n' "$text" | sed -n 's/^Version: //p' | head -n 1)
    [[ "$version" == \(not\ found* || "$version" == \(own\ version* ]] && version=
  else
    failed=$((failed + 1))
    status=error
    version=
  fi
  texts+="${text}"$'\n\n'
  if [[ "$output_dir" == "" ]]; then
    printf '%s\n\n' "$text"
  fi
  escaped_url=$(json_escape "$url")
  escaped_text=$(json_escape "$text")
  escaped_version=$(json_escape "$version")
  version_json=null
  [[ -n "$version" ]] && version_json="\"${escaped_version}\""
  [[ "$first" == true ]] || json+=','
  first=false
  json+=$'\n'"  {\"url\": \"${escaped_url}\", \"status\": \"${status}\", \"version\": ${version_json}, \"details\": \"${escaped_text}\"}"
done

json+=$'\n'']'$'\n'
summary="Resolved ${found} PR(s), ${failed} failed"

if [[ -n "$output_dir" ]]; then
  mkdir -p "$output_dir"
  fetched=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  {
    echo '=== Service versions summary ==='
    echo "Source: ${input}"
    echo "Fetched: ${fetched}"
    echo "$summary"
    echo
    printf '%s' "$texts"
  } > "$output_dir/service-versions.txt"
  printf '%s' "$json" > "$output_dir/service-versions.json"
  echo "$summary"
  echo "Saved: $output_dir/service-versions.txt"
  echo "Saved: $output_dir/service-versions.json"
else
  echo "$summary"
fi
