---
name: continuity
description: >
  Continue work left by another agent — structured handoff for Cline/Roo/Kilo.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity — Cline adapter

Shim for Cline / Roo Code / Kilo Code. Delegates to `npx continuity`.

## Commands

- `npx continuity create "goal"`
- `npx continuity resume <id>`

Fallback: write `.continuity/<id>/STATE.md` via template.
