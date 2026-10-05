# Continuity MCP

Durable project state across AI sessions for **Cursor**, **Claude Code**, **Codex**, and any MCP host: decisions, constraints, rejected paths, mission, risks, milestones — versioned in git as plain markdown.

Not a memory/RAG tool. It answers: *what is true about this project now, and what must not be touched?*

Adapted from [vikcena01/ai-continuity-plugin](https://github.com/vikcena01/ai-continuity-plugin) (MIT). See [NOTICE](./NOTICE).

Package name: **`continuity-mcp`**

## Important: Continuity is local MCP — not Cursor Marketplace MCP

**Do not look for Continuity under Cursor Marketplace → MCP.** It will not appear there.

| What you search | What it is |
|---|---|
| Marketplace **MCP** search for “continuity” | **Not this product.** Continuity MCP is installed locally via `.cursor/mcp.json` / the install scripts below. |
| Marketplace **Skills** entry named “continuity” | A **different** product. Do not confuse it with this Continuity MCP server. |

Enable Continuity in Cursor via **Settings / Customize → MCP** after the project or user `mcp.json` entry exists (or after running the installer). Toggle **continuity** on and reload the window if needed.

## Quick start (this repo)

```bash
npm install
npm run build
```

`dist/` is also committed so hosts can point at the MCP without installing deps. All hosts use the same stdio entry: `node …/dist/mcp.js` (or later `npx -y continuity-mcp` when published).

### Install for Cursor / Claude Code / Codex

```bash
# All three hosts, project wiring into this repo
CONTINUITY_HOSTS=all CONTINUITY_INSTALL_SCOPE=project ./scripts/install.sh .

# Or one host at a time
./scripts/install-cursor.sh .
./scripts/install-claude-code.sh .
./scripts/install-codex.sh .

# User-global (every project on this machine)
CONTINUITY_INSTALL_SCOPE=user ./scripts/install-cursor.sh
CONTINUITY_INSTALL_SCOPE=user ./scripts/install-claude-code.sh
CONTINUITY_INSTALL_SCOPE=user ./scripts/install-codex.sh

# Project + user
CONTINUITY_HOSTS=all CONTINUITY_INSTALL_SCOPE=both ./scripts/install.sh /path/to/other-repo
```

| Host | Project file | User file | Enable |
|---|---|---|---|
| **Cursor** | [`.cursor/mcp.json`](./.cursor/mcp.json) (+ rule/skill) | `~/.cursor/mcp.json` + local plugin | Settings → **MCP** → toggle **continuity** (not Marketplace) |
| **Claude Code** | [`.mcp.json`](./.mcp.json) | `~/.claude.json` → `mcpServers` | Restart Claude Code / `/mcp`; or `claude mcp add --scope project continuity -- node …/dist/mcp.js` |
| **Codex** | [`.codex/config.toml`](./.codex/config.toml) | `~/.codex/config.toml` | Restart Codex; or `codex mcp add continuity -- node …/dist/mcp.js` |

First use inside a git repo:

```bash
npx continuity init "Ship Continuity MCP for Cursor"
# or ask the agent to call create_project / continuity init
```

Then ask the agent to resume — it should call `resume_context`.

## Reuse in other repos

Preferred: run `./scripts/install.sh <repo>` (or a host-specific script) from this checkout.

After the package is on npm:

```json
{
  "mcpServers": {
    "continuity": {
      "command": "npx",
      "args": ["-y", "continuity-mcp"]
    }
  }
}
```

Or pin a local checkout:

```json
{
  "mcpServers": {
    "continuity": {
      "command": "node",
      "args": ["/absolute/path/to/Continuity-plugin/dist/mcp.js"]
    }
  }
}
```

Codex equivalent:

```toml
[mcp_servers.continuity]
command = "node"
args = ["/absolute/path/to/Continuity-plugin/dist/mcp.js"]
```

For Cursor, also copy `skills/continuity/SKILL.md` and `rules/continuity.mdc` (the Cursor installer does this).

## Store modes

| Mode | Location | When |
|---|---|---|
| Repo | `<repo>/.continuity/` | Working directory is inside a git repo (walks up) |
| Central | `~/.continuity/projects/<name>/` | No project cwd, or pass `project=` / `CONTINUITY_HOME` |

Claim writes are **auto-committed** locally (event log). Never auto-pushed.

## MCP tools

`list_projects`, `create_project`, `resume_context`, `search_claims`, `record_decision`, `record_constraint`, `record_rejection`, `record_open`, `record_mission`, `capture`, `freeze_claim`, `resolve_claim`, `why`

Also: MCP prompt `resume`, CLI bin `continuity`.

## Develop

```bash
npm run build          # typecheck + esbuild → dist/
npm test               # upstream smoke suite
npm run mcp            # run MCP via tsx (stdio)
npx continuity resume  # CLI against cwd store
```

## Publish to npm

Package is prepared as `continuity-mcp`. Do **not** publish until you own the name and are logged in:

```bash
npm whoami
npm publish --access public
```

`prepublishOnly` runs `npm run build`.

## Attribution

Copyright for upstream Continuity core: Vikash / [ai-continuity-plugin](https://github.com/vikcena01/ai-continuity-plugin), MIT.
This repository rebrands and packages that work for Cursor / Claude Code / Codex (`continuity-mcp`, skill/rule, mcp configs).
