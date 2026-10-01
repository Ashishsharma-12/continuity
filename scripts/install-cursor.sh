#!/usr/bin/env bash
# Graft-style Cursor wiring for Continuity.
# Mirrors what `graft init --agents cursor` writes, plus optional user-global install.
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

wire_project() {
  local dest="$1"
  mkdir -p "$dest/.cursor/rules" "$dest/.cursor/skills/continuity"
  # Same repo → portable relative entry (Graft-style shareable .cursor/).
  # Other targets → absolute path to this Continuity checkout's dist.
  local mcp_arg
  if [[ "$dest" == "$ROOT" ]]; then
    mcp_arg="./dist/mcp.js"
  else
    mcp_arg="$MCP_JS"
  fi
  cat >"$dest/.cursor/mcp.json" <<EOF
{
  "mcpServers": {
    "continuity": {
      "command": "node",
      "args": ["$mcp_arg"]
    }
  }
}
EOF
  cp "$ROOT/rules/continuity.mdc" "$dest/.cursor/rules/continuity.mdc"
  cp "$ROOT/skills/continuity/SKILL.md" "$dest/.cursor/skills/continuity/SKILL.md"
  echo "✓ project  $dest/.cursor/mcp.json, rules/continuity.mdc, skills/continuity/"
}

wire_user() {
  local home_cursor="${CURSOR_HOME:-$HOME/.cursor}"
  mkdir -p "$home_cursor/skills/continuity" "$home_cursor/plugins/local"

  # Local Cursor plugin first (same discovery path as marketplace plugins / Claude-mem).
  # Must be a real directory under plugins/local — Cursor skips symlinks that
  # point outside that folder.
  local plugin_dest="$home_cursor/plugins/local/continuity"
  local user_mcp_js="$plugin_dest/dist/mcp.js"
  rm -rf "$plugin_dest"
  mkdir -p "$plugin_dest/.cursor-plugin" "$plugin_dest/dist" "$plugin_dest/skills" "$plugin_dest/rules"
  cp "$ROOT/.cursor-plugin/plugin.json" "$plugin_dest/.cursor-plugin/plugin.json"
  cp "$ROOT/mcp.json" "$plugin_dest/mcp.json"
  cp "$ROOT/package.json" "$plugin_dest/package.json"
  cp "$ROOT/LICENSE" "$plugin_dest/LICENSE"
  cp "$ROOT/NOTICE" "$plugin_dest/NOTICE"
  cp "$ROOT/README.md" "$plugin_dest/README.md"
  cp -a "$ROOT/dist/." "$plugin_dest/dist/"
  cp -a "$ROOT/skills/." "$plugin_dest/skills/"
  cp -a "$ROOT/rules/." "$plugin_dest/rules/"
  mkdir -p "$plugin_dest/.cursor/rules" "$plugin_dest/.cursor/skills/continuity"
  cp "$ROOT/rules/continuity.mdc" "$plugin_dest/.cursor/rules/continuity.mdc"
  cp "$ROOT/skills/continuity/SKILL.md" "$plugin_dest/.cursor/skills/continuity/SKILL.md"
  cp "$plugin_dest/mcp.json" "$plugin_dest/.cursor/mcp.json"
  echo "✓ user     $plugin_dest/ (Cursor Plugin)"

  # User-global MCP → plugin copy (stable under ~/.cursor)
  if [[ -f "$home_cursor/mcp.json" ]]; then
    node --input-type=module -e "
      import { readFileSync, writeFileSync } from 'node:fs';
      const p = process.argv[1];
      const mcpJs = process.argv[2];
      const raw = JSON.parse(readFileSync(p, 'utf8'));
      raw.mcpServers = raw.mcpServers || {};
      raw.mcpServers.continuity = { command: 'node', args: [mcpJs] };
      writeFileSync(p, JSON.stringify(raw, null, 2) + '\n');
    " "$home_cursor/mcp.json" "$user_mcp_js"
    echo "✓ user     merged continuity into $home_cursor/mcp.json"
  else
    cat >"$home_cursor/mcp.json" <<EOF
{
  "mcpServers": {
    "continuity": {
      "command": "node",
      "args": ["$user_mcp_js"]
    }
  }
}
EOF
    echo "✓ user     $home_cursor/mcp.json"
  fi

  cp "$ROOT/skills/continuity/SKILL.md" "$home_cursor/skills/continuity/SKILL.md"
  echo "✓ user     $home_cursor/skills/continuity/SKILL.md"
}

case "$SCOPE" in
  project) wire_project "$TARGET" ;;
  user) wire_user ;;
  both)
    wire_project "$TARGET"
    wire_user
    ;;
  *)
    echo "CONTINUITY_INSTALL_SCOPE must be project|user|both" >&2
    exit 1
    ;;
esac

echo
echo "Restart Cursor / reload MCP so Continuity appears (Settings → MCP → continuity)."
echo "First use in a git repo: npx continuity init \"your mission\"  (or ask the agent)."
