---
name: continuity
description: >
  Continue work left by another agent — structured handoff for Windsurf.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity — Windsurf adapter

Shim for Windsurf. Same contract: `npx continuity doctor` → delegate or fallback.

## Commands

- `npx continuity create "goal"`
- `npx continuity resume <id>`

Fallback writes `.continuity/<id>/STATE.md` with canonical headings.
