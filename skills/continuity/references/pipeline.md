# continuity — pipeline snippets (bash 3.2-safe; no associative arrays)

## Local CLI (AGOS-1; works without global install)

```bash
node skills/continuity/cli/lib/bin.js doctor
node skills/continuity/cli/lib/bin.js list --json
node skills/continuity/cli/lib/bin.js create "goal" --yes
node skills/continuity/cli/lib/bin.js resume latest
```

## Create → list → resume → validate → status

```bash
continuity create "add OAuth to AGOS-API" --yes   # or node …/bin.js …
continuity list --json
continuity resume latest
continuity resume latest --json
continuity status latest --json
continuity validate latest
continuity validate latest --fix
continuity doctor
continuity version
```

## Install (Cursor + Claude Code)

```bash
# From AGOS-1 root — global CLI + user Claude skill (recommended once)
npm install -g ./skills/continuity/cli
# PowerShell:
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills\continuity\references" | Out-Null
Copy-Item -Force .\skills\continuity\skills\continuity\SKILL.md "$env:USERPROFILE\.claude\skills\continuity\SKILL.md"
Copy-Item -Force -Recurse .\skills\continuity\skills\continuity\references\* "$env:USERPROFILE\.claude\skills\continuity\references\"

# Repo adapters (already present in AGOS-1)
# .cursor/rules/continuity.mdc  (alwaysApply: true)
# .claude/skills/continuity/    (project skill)
```

## Harness invocations

```bash
# Claude Code
/continuity create "goal"
/continuity resume <id>

# Codex
$continuity create "goal"
$continuity resume <id>

# Any harness with Bash
npx continuity create "goal"
npx continuity resume latest
```

## Export (explicit share)

```bash
npx continuity export <id> --zip        # ~/.continuity/exports/<id>.zip
npx continuity export <id> --stdout | gh gist create -d "handoff <id>"
git add -f .continuity/<id> && git commit -m "share handoff <id>"
```
