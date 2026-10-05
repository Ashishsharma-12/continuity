---
name: continuity
description: >
  Continue work left by another agent — structured handoff for Codex
  via $continuity. Delegates to npx continuity when available.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity — Codex adapter

Shim for Codex `$continuity` convention. Same contract as Claude adapter.

## Step 0 — Doctor

Run `npx continuity doctor` via Bash.
CLI present → delegate to `npx continuity create/resume/list/validate`.
CLI absent → fallback prompt-only writes to `.continuity/<id>/STATE.md + state.json` using `templates/STATE.md.hbs` headings; warn.

## Commands

- `$continuity create "goal"` → `npx continuity create "goal" --yes`
- `$continuity resume <id>` → `npx continuity resume <id>`

Always Read `STATE.md` on resume.
