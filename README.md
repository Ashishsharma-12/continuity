# continuity

A portable skill + CLI that lets you **continue work left by another agent** — across any of 6+ harnesses — with a structured, local-only artifact.

- **Claude Code** `~/.claude/skills/continuity` via `/continuity`
- **Codex** `~/.codex/skills/continuity` via `$continuity`
- **Cursor** `.cursor/rules/continuity.mdc`
- **OpenCode** `~/.config/opencode/skills/continuity`
- **Windsurf / Cline / Roo** — same shim, different path

The handoff is **local-only**: `./.continuity/<id>/STATE.md + state.json + snapshot.patch` (gitignored) + global pointer `~/.continuity/index.json`. Explicit `export` if you want to share.

## Install

```bash
# portable skill (works without Node)
cp -R skills/continuity/skills/continuity ~/.claude/skills/   # Claude Code
cp -R skills/continuity/skills/continuity ~/.codex/skills/    # Codex

# or one-command install (detects harnesses, copies shims, patches .gitignore)
npx continuity install
npx continuity install --dry-run   # preview
```

## Usage

```bash
npx continuity create "add OAuth to AGOS-API"   # explicit handoff
npx continuity create --yes                    # skip interview
npx continuity list
npx continuity resume latest       # read-only handback (prints STATE.md + NEXT)
npx continuity resume <id> --json
npx continuity status latest --json
npx continuity validate latest --fix
npx continuity export <id> --zip
npx continuity doctor
```

In any harness: `/continuity create "goal"` / `/continuity resume <id>` (adapter delegates to `npx continuity` if present, else pure-SKILL.md fallback).

## Requirements

- Node `^22.19 || >=24` + `git` on `$PATH` (CLI path).
- Without Node/CLI, the `SKILL.md` fallback still writes valid `STATE.md`/`state.json` — run `npx continuity validate` later.

## What's in the skill

```
skills/continuity/
├── skills/continuity/SKILL.md      # canonical procedure + fallback branch
├── skills/continuity/references/pipeline.md
├── adapters/{claude,codex,cursor,opencode,windsurf,cline}/
├── templates/{STATE.md.hbs,state.schema.json}
├── cli/                             # npx continuity (commander + zod + handlebars)
└── scripts/install.mjs
```

- `resume` never mutates `HEAD`; secrets (`.env`, `*.pem`, `agos-dev-readonly-kubeconfig.yaml`) redacted unless `--allow-secrets`.
- Drift `warn-not-block`; 200-line patch preview in `STATE.md`, full `snapshot.patch` separate.
- `auto-save` fallback for harnesses that expose idle/pre-exit hooks.

## License

MIT — see LICENSE.
