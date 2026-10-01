# Continuity MCP

Durable project state across AI sessions for **Cursor** (and any MCP host): decisions, constraints, rejected paths, mission, risks, milestones — versioned in git as plain markdown.

Not a memory/RAG tool. It answers: *what is true about this project now, and what must not be touched?*

Adapted from [vikcena01/ai-continuity-plugin](https://github.com/vikcena01/ai-continuity-plugin) (MIT). See [NOTICE](./NOTICE).

Package name: **`continuity-mcp`**

## Quick start (this repo)

```bash
npm install
npm run build
```

`dist/` is also committed so you can point Cursor at the MCP without installing deps.

### Enable in Cursor (Graft-style)

Same shape as `graft init --agents cursor`: project `.cursor/mcp.json` + always-on rule + skill. One command:

```bash
# This repo + user-global (MCP + skill + ~/.cursor/plugins/local/continuity)
CONTINUITY_INSTALL_SCOPE=both ./scripts/install-cursor.sh .

# Or project-only into another checkout
./scripts/install-cursor.sh /path/to/other-repo
```

Then:

1. Cursor Settings / Customize → MCP → confirm **continuity** is enabled; reload window if needed.
2. Skill/rule tell the agent when to `resume_context` / capture.

First use inside a git repo:

```bash
npx continuity init "Ship Continuity MCP for Cursor"
# or ask the agent to call create_project / continuity init
```

Then ask the agent to resume — it should call `resume_context`.

Full how-to (Graft comparison + paths): see Continuity Project doc `docs/continuity-like-graft.md` in the agent store.

## Reuse in other repos (Graft-style)

Preferred: run `./scripts/install-cursor.sh <repo>` from this checkout.

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

Or pin a local checkout / Cursor Plugin (`${CURSOR_PLUGIN_ROOT}/dist/mcp.js` in root [`mcp.json`](./mcp.json)).

Copy `skills/continuity/SKILL.md` and `rules/continuity.mdc` (or use the install script) so the agent auto-resumes/captures.

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
This repository rebrands and packages that work for Cursor (`continuity-mcp`, skill/rule, mcp.json).
