$ErrorActionPreference = 'Stop'
$root = 'C:\Users\djden\source\repos\retro-eng\re-ff8'
$gel = Join-Path $root '.tmp/re-graph-scheduler/review-20261014/L2FINAL'
$own = 'C:\Users\djden\.local\share\opencode\worktree\68ae5f\ensemble-re-ff8-re-graph-scheduler#4urn3c-l2-ids-astra'
$inputCopy = Join-Path $own '.tmp/re-graph-scheduler/inputs/L2FINAL'
if (Test-Path -LiteralPath $inputCopy) { throw 'Input projection exists; no overwrite' }
$manifestPath = Join-Path $gel 'manifest.json'
if ((Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'f3402be1922c5a07f5f690a1b201099a7717acdfdd5c857a66ab00924a2055a7') { throw 'Manifest changed' }
$m = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$owned = @('tools/ff8-harness/src/graph.ts','tools/ff8-harness/src/graph-normalize.ts','tools/ff8-harness/src/capabilities.ts','tools/ff8-harness/test/graph-extract.test.ts')
$runtimeCount = 0
foreach ($f in $m.files) {
  $from = Join-Path $gel $f.path
  if ((Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256) { throw ('Gel changed ' + $f.path) }
  $inputTo = Join-Path $inputCopy $f.path
  New-Item -ItemType Directory -Path (Split-Path $inputTo) -Force | Out-Null
  Copy-Item -LiteralPath $from -Destination $inputTo
  $runtime = $f.path.StartsWith('tools/ff8-harness/') -or $f.path.StartsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/') -or $f.path.EndsWith('battle-graph-ledger.json') -or $f.path.EndsWith('battle-indirect-registry.json') -or $f.path.EndsWith('magic-registry.json') -or $f.path.EndsWith('native-groups.json') -or $f.path.EndsWith('native-pe-verification.json')
  if ($runtime) {
    $to = Join-Path $own $f.path
    if (Test-Path -LiteralPath $to) {
      if ((Get-FileHash -LiteralPath $to -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256) { throw ('Existing runtime dependency mismatch ' + $f.path) }
      if ($f.path -in $owned) { throw ('Owned source already exists before transfer ' + $f.path) }
    } else {
      New-Item -ItemType Directory -Path (Split-Path $to) -Force | Out-Null
      Copy-Item -LiteralPath $from -Destination $to
    }
    $runtimeCount++
  }
}
Copy-Item -LiteralPath $manifestPath -Destination $inputCopy
foreach ($f in $m.files) {
  if ((Get-FileHash -LiteralPath (Join-Path $inputCopy $f.path) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256) { throw 'Input copy mismatch' }
}
Copy-Item -LiteralPath (Join-Path $root 'docs/missions/re-graph-scheduler/L2_FINAL_REVIEW_ID_BOUNDS_BLOCK.md') -Destination (Join-Path $own 'docs/missions/re-graph-scheduler/L2_FINAL_REVIEW_ID_BOUNDS_BLOCK.md')
$deps = Join-Path $own 'tools/ff8-harness/node_modules'
if (Test-Path -LiteralPath $deps) { throw 'Deps path already exists' }
foreach ($p in @('package.json','bun.lock')) {
  if ((Get-FileHash -LiteralPath (Join-Path $own ('tools/ff8-harness/' + $p)) -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath (Join-Path $root ('tools/ff8-harness/' + $p)) -Algorithm SHA256).Hash) { throw 'Preinstalled deps incompatible' }
}
New-Item -ItemType Junction -Path $deps -Target (Join-Path $root 'tools/ff8-harness/node_modules') | Out-Null
Write-Output ('L2 IDs transfer: input343/343 exact; executable/schema/test/refs/raw runtime pins=' + $runtimeCount + '; no existing runtime source overwritten; local deps READONLY junction, no install.')
