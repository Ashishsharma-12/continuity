#!/usr/bin/env bash
# Claude Code wiring for Continuity MCP.
# Project scope → .mcp.json (commit for the team).
# User scope → ~/.claude.json top-level mcpServers (all projects).
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

write_project_mcp() {
  local dest="$1"
  local mcp_arg
  if [[ "$dest" == "$ROOT" ]]; then
    mcp_arg="./dist/mcp.js"
  else
    mcp_arg="$MCP_JS"
  fi
  cat >"$dest/.mcp.json" <<EOF
{
  "mcpServers": {
    "continuity": {
      "type": "stdio",
      "command": "node",
      "args": ["$mcp_arg"]
    }
  }
}
EOF
  echo "✓ project  $dest/.mcp.json"
}

wire_user() {
  local claude_json="${CLAUDE_CONFIG:-$HOME/.claude.json}"
  local mcp_js="$MCP_JS"
  if [[ -f "$claude_json" ]]; then
    node --input-type=module -e "
      import { readFileSync, writeFileSync } from 'node:fs';
      const p = process.argv[1];
      const mcpJs = process.argv[2];
      const raw = JSON.parse(readFileSync(p, 'utf8'));
      raw.mcpServers = raw.mcpServers || {};
      raw.mcpServers.continuity = {
        type: 'stdio',
        command: 'node',
        args: [mcpJs],
      };
      writeFileSync(p, JSON.stringify(raw, null, 2) + '\n');
    " "$claude_json" "$mcp_js"
    echo "✓ user     merged continuity into $claude_json (mcpServers)"
  else
    cat >"$claude_json" <<EOF
{
  "mcpServers": {
    "continuity": {
      "type": "stdio",
      "command": "node",
      "args": ["$mcp_js"]
    }
  }
}
EOF
    echo "✓ user     $claude_json"
  fi
}

case "$SCOPE" in
  project) write_project_mcp "$TARGET" ;;
  user) wire_user ;;
  both)
    write_project_mcp "$TARGET"
    wire_user
    ;;
  *)
    echo "CONTINUITY_INSTALL_SCOPE must be project|user|both" >&2
    exit 1
    ;;
esac

echo
echo "Restart Claude Code / run /mcp so Continuity appears."
echo "CLI alternative: claude mcp add --scope project continuity -- node \"$MCP_JS\""
echo "First use in a git repo: npx continuity init \"your mission\"  (or ask the agent)."
