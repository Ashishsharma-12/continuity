---
name: continuity
description: >
  Continue work left by another agent — structured handoff create/resume across
  Claude Code, Codex, Cursor, OpenCode, Windsurf, Cline/Roo. Local-only
  .continuity/<id>/STATE.md + state.json (12-field schema), read-only resume,
  drift warns, secrets redacted. Use when the user hit token limits, session
  start with existing handoff, or wants to hand a task to a different harness
  without re-explaining. AUTO: at session start check .continuity/latest and
  offer resume; auto-create a checkpoint at 95% usage; before context limit
  auto-create handoff.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# continuity

Continue work left by another agent in a **different harness** with a structured, local-only handoff.

You produce a 12-field artifact (`STATE.md` human mirror + `state.json` machine-validated) at `./.continuity/<id>/` with `snapshot.patch`, and a global pointer at `~/.continuity/index.json`. The next harness `resume`s it read-only.

## CLI resolution

Prefer, in order (AGOS-1 workspace root):

1. `continuity <cmd>` if on PATH (after `npm install -g ./skills/continuity/cli`)
2. `node skills/continuity/cli/lib/bin.js <cmd>`
3. Prompt-only fallback

Below, `continuity <cmd>` means that resolution chain.

## Auto — run without being asked

- **At session start:** run `continuity list --json` and check `.continuity/`. If a recent handoff exists for this repo, immediately `Read` the latest `STATE.md`, summarize `original_goal` + `next_action`, and ask: "Found handoff <id> — resume from next_action?"
- **At 95% usage:** run `continuity create "<goal>" --auto --yes` immediately. See [95% auto-checkpoint](#95-auto-checkpoint).
- **Before context/token limit or when user says "continue in another agent":** automatically run `continuity create "<goal>" --yes` (or interview if goal ambiguous) without waiting for explicit `/continuity` invocation. Print the resume one-liner.
- **After completing a sub-task:** if todos remain, optionally auto-update the current handoff or create a new one so the next agent has fresh state.

Do not wait for the user to type `/continuity` — treat the triggers above as implicit invocations.

## 95% auto-checkpoint

A checkpoint is written automatically as soon as **provider usage reaches 95%** of a quota window (`five_hour`, `seven_day`, `spend_limit`), so the work survives a limit reset or a crash.

**Claude Code — automatic, no agent action needed.** Hooks already do this:

| Surface | Role |
| --- | --- |
| `.claude/statusline` → `~/.claude/statusline.ps1`, `.claude/helpers/continuity-statusline.cjs` | Caches `rate_limits` to `.continuity/.usage-cache.json`. The statusline is the only place Claude Code exposes quota utilization. |
| `.claude/settings.json` → `Stop`, `PreCompact`, `SessionEnd` → `.claude/helpers/continuity-hooks.cjs` | Fires `create --auto` once per quota window. `PreCompact` with `trigger: "auto"` is a backstop for the context-limit path. |

**Every other harness — agent-driven.** No other agent exposes a plan/quota percentage, so the model must self-report:

1. When the UI or API reports usage/limit at **95% or more** (weekly limit, 5-hour window, "Context low", a reset notice), treat that as an implicit `/continuity` invocation.
2. Run `continuity create "<goal>" --auto --yes` before doing anything else.
3. Print the resume one-liner so the next agent picks up `next_action`.

**Behavior**

- Fires once per quota window (keyed by window reset), never on every turn. A checkpoint for one session also suppresses duplicates for 30 minutes (`CONTINUITY_USAGE_REFIRE_MS`).
- The goal is taken from your first real user prompt in the transcript, so `original_goal` stays meaningful.
- Auto-checkpoints never overwrite an explicit handoff — they create a new `auto-<ts>` id.
- Diagnostic: `node skills/continuity/hooks/usage-watch.cjs check` prints the cached quota, the threshold, and the source.
- Overrides: `CONTINUITY_QUOTA_THRESHOLD` (default `95`), `CONTINUITY_USAGE_CACHE_MS` (default 6h), `CONTINUITY_PRECOMPACT_BACKSTOP=0` to disable the compaction backstop.

## Step 0 — Doctor (branch CLI vs fallback)

1. Try `continuity doctor` via shell (resolution chain above). Capture output.
2. **CLI present** → delegate every step below to `continuity <cmd>` (deterministic zod validation, git snapshot, locked index). Do not re-implement file ops in the prompt.
3. **CLI absent** → fallback (prompt-only): interpolate `skills/continuity/templates/STATE.md.hbs` variables via `Read/Write` to `.continuity/<id>/STATE.md + state.json` following the exact 12 headings/order; warn: "CLI not on PATH — from AGOS-1 run `npm install -g ./skills/continuity/cli` then `continuity validate --fix`."

## Step 1 — Create

1. Goal: `AskUserQuestion` or arg — capture `original_goal` in 2–3 sentences, immutable.
2. Collect `git branch --show-current`, `git rev-parse HEAD`, `git diff --stat`, `git diff --name-only`, `git ls-files --others --exclude-standard`, `git log --oneline -5` via `Bash`.
3. Auto-draft 12 fields: `original_goal`, `current_plan`, `todos {done,pending,blocked}` with `file:line` refs, `key_decisions {decision,why,rejected}`, `assumptions`, `open_questions`, `git_snapshot`, `verification`, `next_action` (single imperative sentence), `context_notes {entryPoints,readOrder}`, `secrets_policy {ignoredGlobs,redacted}`.
4. Interview only if ambiguous: ask 1–3 of `open_questions/assumptions/rejected` (max 30s). Skip with `--yes`. Never guess rejected alternatives.
5. Validate: `StateSchema` + `lintNextAction` must pass; `checkSecrets(diff, ignoredGlobs)` must be clean or redacted to `"<redacted: .env>"`; fail otherwise unless `--allow-secrets`.
6. Atomic write `tmp+rename` to `.continuity/<id>/state.json + STATE.md (Handlebars) + snapshot.patch` plus 200-line truncated preview in `STATE.md` `<details>`. Append locked entry to `~/.continuity/index.json`.
7. Print: `Handoff <id> ready — in next harness: continuity resume <id>  |  /continuity resume <id>`

CLI path: `continuity create "goal" [--yes] [--full-patch]`

## Step 2 — Resume

1. Resolve `<id|latest>` via global index else `./.continuity/<id>/`; `latest` = max `createdAt` for current `repoHash`.
2. `validate` schema + `secrets_policy` — fail `2` on error.
3. Drift: compare `state.json:handoff.branch/commit/stat` vs `git branch --show-current / git rev-parse HEAD / git diff --stat`; warn, print delta, ask `continue anyway? (y/N)` unless `--yes`; JSON `{"drift":true/false}`; never mutate HEAD.
4. Print `STATE.md` + banner `NEXT: <next_action>` + checklist `Read .continuity/<id>/STATE.md → entryPoints[0] → … → git diff --stat`.
5. Exit `0` even on drift — read-only handback (agent then `Read`s `STATE.md`).

CLI path: `continuity resume <id|latest> [--json]` / `continuity status <id> [--json]`

## Step 3 — List / Validate / Export

- `continuity list [--all] [--repo] [--json]` — merges global index + orphan scan `.continuity/`; table `id | repo | branch | commit | goal(trunc) | pending# | harness`
- `continuity validate [<id>] [--fix]` — schema + `lintNextAction` + secrets; `--fix` normalizes
- `continuity export <id> [--zip|--stdout]` — bundles `.continuity/<id>/` to `~/.continuity/exports/<id>.zip` (explicit share; user `gh gist create` or `git add -f` as desired)

## Gotchas

- `resume` is read-only — no `HEAD` mutation, no auto-apply. Local-only: `./.continuity/` is gitignored; never commit unless user `export` / `git add -f`.
- Secrets (`.env`, `*.pem`, `secrets/**`, `agos-dev-readonly-kubeconfig.yaml`) redacted unless `--allow-secrets`.
- `snapshot.patch` is separate file; `STATE.md` holds only 200-line preview — never paste secrets.
- `auto-save` (`auto-<ts>`, `--no-interview`) for harnesses that expose idle/pre-exit — never overwrites explicit handoffs, appends `open_questions += ["Auto-saved — verify next_action"]`.
- Air-gap / no-git: `git_snapshot: { not_a_repo: true, cwd }`, drift skipped.

See `references/pipeline.md` for copy-paste bash snippets (bash 3.2-safe).
