---
name: continuity
description: >
  Continue work left by another agent — structured handoff for OpenCode.
  Delegates to npx continuity.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity — OpenCode adapter

OpenCode shim. Uses `.agents/skills/continuity` + `~/.config/opencode/skills/continuity`.

## Step 0 — Doctor

`npx continuity doctor` via Bash. CLI present → delegate. CLI absent → fallback writes `.continuity/<id>/STATE.md` with canonical 12 headings.

## Commands

- `npx continuity create "goal"`
- `npx continuity resume <id|latest>`

Read `STATE.md` on resume.
