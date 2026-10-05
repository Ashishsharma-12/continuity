Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$dir = Join-Path $env:TEMP "cont-e2e-$(Get-Random)"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Write-Host "E2E temp: $dir"
git -C $dir init -q; git -C $dir config user.email a@a; git -C $dir config user.name a
"hi" | Set-Content (Join-Path $dir "a.txt"); git -C $dir add .; git -C $dir commit -qm init
node skills/continuity/cli/lib/bin.js create "e2e test" --yes --cwd $dir | Out-Host
$list = node skills/continuity/cli/lib/bin.js list --json --cwd $dir | Out-String
if ($list -notmatch "e2e test") { throw "list failed" }
$resume = node skills/continuity/cli/lib/bin.js resume latest --cwd $dir | Out-String
if ($resume -notmatch "NEXT:") { throw "resume failed" }
node skills/continuity/cli/lib/bin.js validate latest --cwd $dir | Out-Host
git -C $dir checkout -b drift -q; "change" | Add-Content (Join-Path $dir "a.txt")
$status = node skills/continuity/cli/lib/bin.js status latest --json --cwd $dir | Out-String
if ($status -notmatch '"drift"\s*:\s*true') { throw "drift not detected: $status" }
# fallback: corrupt next_action then fix (filesystem lookup, not global index)
$bin = "skills/continuity/cli/lib/bin.js"
$handoffDir = Get-ChildItem (Join-Path $dir ".continuity") -Directory | Sort-Object Name | Select-Object -Last 1
$full = Join-Path $handoffDir.FullName "state.json"
$s = Get-Content $full -Raw | ConvertFrom-Json
$s.next_action = "continue work"
$s | ConvertTo-Json -Depth 10 | Set-Content $full
try { node $bin validate latest --cwd $dir 2>&1 | Out-Host; throw "should have failed" } catch { Write-Host "validate correctly failed" }
node $bin validate latest --fix --cwd $dir | Out-Host
node $bin validate latest --cwd $dir | Out-Host
Remove-Item -Recurse -Force $dir
Write-Host "E2E PASS"
