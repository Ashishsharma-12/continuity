#!/usr/bin/env bash
# Unified Continuity MCP installer for Cursor, Claude Code, and Codex.
#
# Usage:
#   ./scripts/install.sh [target-dir]
#
# Env:
#   CONTINUITY_HOSTS=cursor|claude|codex|all   (default: all)
#   CONTINUITY_INSTALL_SCOPE=project|user|both (default: project)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-.}"
HOSTS="${CONTINUITY_HOSTS:-all}"
SCOPE="${CONTINUITY_INSTALL_SCOPE:-project}"

run_one() {
  local host="$1"
  case "$host" in
    cursor)
      CONTINUITY_INSTALL_SCOPE="$SCOPE" "$ROOT/scripts/install-cursor.sh" "$TARGET"
      ;;
    claude|claude-code)
      CONTINUITY_INSTALL_SCOPE="$SCOPE" "$ROOT/scripts/install-claude-code.sh" "$TARGET"
      ;;
    codex)
      CONTINUITY_INSTALL_SCOPE="$SCOPE" "$ROOT/scripts/install-codex.sh" "$TARGET"
      ;;
    *)
      echo "Unknown host: $host (use cursor|claude|codex|all)" >&2
      exit 1
      ;;
  esac
}

case "$HOSTS" in
  all)
    run_one cursor
    echo
    run_one claude
    echo
    run_one codex
    ;;
  *)
    IFS=',' read -r -a parts <<<"$HOSTS"
    for h in "${parts[@]}"; do
      h="$(echo "$h" | tr '[:upper:]' '[:lower:]' | xargs)"
      [[ -z "$h" ]] && continue
      run_one "$h"
      echo
    done
    ;;
esac
