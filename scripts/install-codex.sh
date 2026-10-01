#!/usr/bin/env bash
# OpenAI Codex wiring for Continuity MCP.
# Project scope → .codex/config.toml (trusted projects only).
# User scope → ~/.codex/config.toml (or `codex mcp add` when available).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-.}"
TARGET="$(cd "$TARGET" && pwd)"
SCOPE="${CONTINUITY_INSTALL_SCOPE:-project}" # project | user | both

MCP_JS="$ROOT/dist/mcp.js"
if [[ ! -f "$MCP_JS" ]]; then
  echo "continuity: missing $MCP_JS — run npm run build first" >&2
  exit 1
fi

upsert_codex_toml() {
  local config_path="$1"
  local mcp_js="$2"
  mkdir -p "$(dirname "$config_path")"
  node "$ROOT/scripts/upsert-codex-mcp.mjs" "$config_path" "$mcp_js"
}

write_project() {
  local dest="$1"
  local mcp_arg
  # Absolute path is more reliable for Codex than a relative checkout path.
  if [[ "$dest" == "$ROOT" ]]; then
    mcp_arg="./dist/mcp.js"
  else
    mcp_arg="$MCP_JS"
  fi
  upsert_codex_toml "$dest/.codex/config.toml" "$mcp_arg"
  echo "✓ project  $dest/.codex/config.toml"
}

wire_user() {
  local codex_home="${CODEX_HOME:-$HOME/.codex}"
  local config_path="$codex_home/config.toml"

  if command -v codex >/dev/null 2>&1; then
    # Prefer official CLI when present (writes user-global config).
    if codex mcp list 2>/dev/null | grep -qiE '(^|[[:space:]])continuity([[:space:]]|$)'; then
      codex mcp remove continuity >/dev/null 2>&1 || true
    fi
    if codex mcp add continuity -- node "$MCP_JS"; then
      echo "✓ user     codex mcp add → $config_path"
      return 0
    fi
    echo "continuity: codex mcp add failed; falling back to config.toml edit" >&2
  fi

  upsert_codex_toml "$config_path" "$MCP_JS"
  echo "✓ user     $config_path"
}

case "$SCOPE" in
  project) write_project "$TARGET" ;;
  user) wire_user ;;
  both)
    write_project "$TARGET"
    wire_user
    ;;
  *)
    echo "CONTINUITY_INSTALL_SCOPE must be project|user|both" >&2
    exit 1
    ;;
esac

echo
echo "Restart Codex / reload MCP so Continuity appears."
echo "CLI: codex mcp add continuity -- node \"$MCP_JS\""
echo "First use in a git repo: npx continuity init \"your mission\"  (or ask the agent)."
