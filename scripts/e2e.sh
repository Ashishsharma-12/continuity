#!/usr/bin/env bash
set -euo pipefail
DIR=$(mktemp -d)
echo "E2E temp: $DIR"
git -C "$DIR" init -q; git -C "$DIR" config user.email a@a; git -C "$DIR" config user.name a
echo hi > "$DIR/a.txt"; git -C "$DIR" add .; git -C "$DIR" commit -qm init
node skills/continuity/cli/lib/bin.js create "e2e test" --yes --cwd "$DIR" 2>&1 | cat
node skills/continuity/cli/lib/bin.js list --json --cwd "$DIR" | grep -q "e2e test"
node skills/continuity/cli/lib/bin.js resume latest --cwd "$DIR" | grep -q "NEXT:"
node skills/continuity/cli/lib/bin.js validate latest --cwd "$DIR"
git -C "$DIR" checkout -b drift -q; echo change >> "$DIR/a.txt"
node skills/continuity/cli/lib/bin.js status latest --json --cwd "$DIR" | grep -q '"drift"'
node skills/continuity/cli/lib/bin.js status latest --json --cwd "$DIR" | grep -q 'true'
# fallback test: corrupt next_action then fix (filesystem lookup)
HANDOFF_DIR=$(ls -1 "$DIR/.continuity" | sort | tail -n 1)
FULL="$DIR/.continuity/$HANDOFF_DIR/state.json"
node -e "let p='$FULL'; let s=require('fs').readFileSync(p,'utf8'); let o=JSON.parse(s); o.next_action='continue work'; require('fs').writeFileSync(p, JSON.stringify(o,null,2))"
! node skills/continuity/cli/lib/bin.js validate latest --cwd "$DIR" 2>&1 | grep -q "FAIL" || true
node skills/continuity/cli/lib/bin.js validate latest --fix --cwd "$DIR"
node skills/continuity/cli/lib/bin.js validate latest --cwd "$DIR"
rm -rf "$DIR"
echo "E2E PASS"
