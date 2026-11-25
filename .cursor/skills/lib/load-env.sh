#!/bin/bash
# Sourced by skill scripts. Loads the workspace-root .env into the environment.

_workspace_root() {
  local dir
  dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.cursor/skills" && -f "$dir/.env.example" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

_parse_env_value() {
  local value="$1"
  if [[ ${#value} -ge 2 && "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
    value="${value:1}"
    value="${value%\"}"
  elif [[ ${#value} -ge 2 && "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
    value="${value:1}"
    value="${value%\'}"
  fi
  printf '%s' "$value"
}

load_workspace_env() {
  local root env_file line key value
  root="$(_workspace_root)" || return 0
  env_file="$root/.env"
  [[ -f "$env_file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    if [[ "$line" == export\ * ]]; then
      line="${line#export }"
      line="${line#"${line%%[![:space:]]*}"}"
    fi
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    value="$(_parse_env_value "$value")"
    export -- "$key=$value"
  done < "$env_file"
  return 0
}

require_atlassian_env() {
  local status="${1:-1}"
  load_workspace_env
  if [[ -z "${ATLASSIAN_USER:-}" || -z "${ATLASSIAN_TOKEN:-}" ]]; then
    echo "Error: ATLASSIAN_USER and ATLASSIAN_TOKEN must be set in .env at the workspace root." >&2
    echo "Copy .env.example to .env and fill in both values." >&2
    exit "$status"
  fi
}

load_workspace_env
