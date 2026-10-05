---
name: continuity
description: >
  Continue work left by another agent — structured handoff create/resume
  for Claude Code via /continuity. AUTO: at session start check .continuity
  and offer resume; before context limit auto-create handoff. Delegates to
  npx continuity when available, else prompt-only fallback.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity — Claude Code adapter

Active skill for Claude Code. Normalizes `/continuity` to the shared Continuity
procedure. Prefer the full skill at `skills/continuity/skills/continuity/SKILL.md`
when present in the repo; this adapter is the harness entrypoint.

## Auto — run without being asked

- **At session start:** run `continuity list --json` (or `npx continuity list --json`) and check `.continuity/`. If a recent handoff exists, Read `.continuity/<id>/STATE.md`, summarize `original_goal` + `next_action`, and ask: "Found handoff \<id\> — resume from next_action?"
- **Before context/token limit** or when the user says "continue in another agent": run `continuity create "<goal>" --yes`. Print the resume one-liner.
- **After completing a sub-task:** if todos remain, update or create a handoff.

Do not wait for the user to type `/continuity`.

## Step 0 — Doctor

Run `continuity doctor` (or `npx continuity doctor`) via Bash.
If CLI present → delegate every step to `continuity <cmd>` (deterministic zod validation, git snapshot, locked index).
If CLI absent → fallback: interpolate `skills/continuity/templates/STATE.md.hbs` via Read/Write to `.continuity/<id>/STATE.md + state.json` following the exact 12 headings/order; warn "CLI not installed — run `npm install -g ./skills/continuity/cli` (from AGOS-1) and `continuity validate --fix` later."

## Commands

- `/continuity create "goal"` → `continuity create "goal"` (or `--yes` to skip interview)
- `/continuity resume <id|latest>` → `continuity resume <id|latest>`
- `/continuity list` → `continuity list`

On resume, Read `.continuity/<id>/STATE.md` and print NEXT.
