rulesync_paths() {
  SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
  ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
  SNAPSHOT="$ROOT/.tmp/rulesync-sync-base"
}

rulesync_tool() {
  raw=${RULESYNC_TOOL-}
  if [ -z "$raw" ] && [ -f "$ROOT/.env" ]; then
    raw=$(sed -n 's/^RULESYNC_TOOL=//p' "$ROOT/.env" | tail -n 1 | tr -d '\r')
    raw=${raw#\"}
    raw=${raw%\"}
    raw=${raw#\'}
    raw=${raw%\'}
  fi
  case "$raw" in
    cursor) TOOL=cursor; TARGET=cursor ;;
    claude) TOOL=claude; TARGET=claudecode ;;
    *)
      echo "Set RULESYNC_TOOL=cursor or RULESYNC_TOOL=claude in .env." >&2
      return 1
      ;;
  esac
}

rulesync_build() {
  docker build -t dwt-rulesync -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR"
}

rulesync_run_in() {
  rulesync_workdir=$1
  shift
  docker run --rm \
    -u "$(id -u):$(id -g)" \
    -e HOME=/tmp \
    -v "$rulesync_workdir:$rulesync_workdir" \
    -w "$rulesync_workdir" \
    dwt-rulesync "$@"
}

rulesync_save_snapshot() {
  mkdir -p "$ROOT/.tmp"
  rm -rf "$SNAPSHOT"
  mkdir -p "$SNAPSHOT"
  cp -a "$ROOT/.rulesync" "$ROOT/rulesync.jsonc" "$SNAPSHOT/"
  printf '%s\n' "$TOOL" > "$ROOT/.tmp/rulesync-tool"
}
