param(
  [Parameter(Mandatory=$true)][string]$SourceName,
  [Parameter(Mandatory=$true)][string]$Label
)
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\djden\source\repos\retro-eng\re-ff8'
$source = 'C:\Users\djden\.local\share\opencode\worktree\68ae5f\ensemble-re-ff8-re-graph-scheduler#4urn3c-' + $SourceName
$destination = Join-Path $root ('.tmp/re-graph-scheduler/review-20261014/' + $Label)
if (Test-Path -LiteralPath $destination) { throw 'Existing gel is immutable; no overwrite' }
if ($SourceName -eq 'l2-fix-max-final') {
  $pins = @{
    'src/graph.ts' = '2f597ede89fe90a61c507a5eb3ffcfecc21d9df6d6806d3f6b3df6efe2f44d3c'
    'src/graph-normalize.ts' = 'a4a3677fd5c0d7771522eae137746c4733fc4fc1d20c649c8ecd800528519fe7'
    'src/capabilities.ts' = '110eaadb09ac49ccb5a026d8fbceb2ac0227c39441f6705f77e1e382a14ccf9b'
    'test/graph-extract.test.ts' = '7e2ca924fff53287586673441725344dc923598cb1580a62424a67c02deff0cc'
  }
  if ($Label -eq 'L2FINAL') {
    $pins['src/capabilities.ts'] = '121352d7f7e0dde5167aebfbd0e112b1d0f62f117aef2acc06a2632b7123d003'
    $pins['test/graph-extract.test.ts'] = '30513ec260f1a50a4c89e9ce8c8181972f15bf57529f7ff05fbedba12d7df57f'
  }
} elseif ($SourceName -eq 'l2-ids-astra') {
  $pins = @{
    'src/graph.ts' = '2f597ede89fe90a61c507a5eb3ffcfecc21d9df6d6806d3f6b3df6efe2f44d3c'
    'src/graph-normalize.ts' = 'a4a3677fd5c0d7771522eae137746c4733fc4fc1d20c649c8ecd800528519fe7'
    'src/capabilities.ts' = '05cb2155d5b0a543762c87dcacc23adf985f241cbcd7aaa0f768e8135cc66934'
    'test/graph-extract.test.ts' = '82e1d12a245912c70af2edf4ec0eccc72b11b16ac824919eb0dc6e8285f9fc0f'
  }
} elseif ($SourceName -eq 'l5-relation-astra') {
  $pins = @{
    'src/planner.ts' = '37723edf3e365be178bfce2db18e316f9e38efc4e41fbfe16f321760ffecd8b3'
    'test/planner.test.ts' = '6a70750d15b37458baf74b3dd2d9e0742908f2e91067039ae0398e6e520e9181'
  }
} elseif ($SourceName -eq 'l4-adopt-astra') {
  $pins = @{
    'src/lineage.ts' = '7e650185c7dff1e1845c3c0f963cf73a72a29a515874eefd535a0733b78e82a9'
    'test/lineage.test.ts' = '02171587562cd55072037883711f72901c8e9f465294470d2747da7b0c4cb2de'
  }
} else { throw 'Unapproved corrective delivery source' }
foreach ($entry in $pins.GetEnumerator()) {
  $actual = (Get-FileHash -LiteralPath (Join-Path $source ('tools/ff8-harness/' + $entry.Key)) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $entry.Value) { throw ('Final source pin mismatch ' + $entry.Key) }
}
$harness = Join-Path $destination 'tools/ff8-harness'
New-Item -ItemType Directory -Path $harness -Force | Out-Null
foreach ($directory in @('src','schemas','test')) {
  Copy-Item -LiteralPath (Join-Path $source ('tools/ff8-harness/' + $directory)) -Destination $harness -Recurse
}
foreach ($file in @('package.json','bun.lock','tsconfig.json')) {
  Copy-Item -LiteralPath (Join-Path $source ('tools/ff8-harness/' + $file)) -Destination $harness
}
$docs = Join-Path $destination 'docs/missions/re-graph-scheduler'
New-Item -ItemType Directory -Path $docs -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'docs/missions/re-graph-scheduler/contract') -Destination $docs -Recurse
foreach ($file in @('ORDRE_MISSION.md','L2_LOCAL_QA_FINAL_FIX_CONTRACT.md','L2_LOCAL_QA_PARENT_COUNTEREXAMPLES.md','L2_QA_POST_GO_ADDENDUM.md','L5_RELATION_REVIEW_FINAL_FIX.md','L4_ADOPT_RECLUSTER_GO.md','L4_WITNESS_REVIEW_FINAL_BLOCK.md','L2_FINAL_REVIEW_ID_BOUNDS_BLOCK.md','L2_ID_PROJECTION_GO.md')) {
  Copy-Item -LiteralPath (Join-Path $root ('docs/missions/re-graph-scheduler/' + $file)) -Destination $docs
}
foreach ($file in @(
  'docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json',
  'docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json',
  'docs/tech/investigation/battle-static-discovery/magic-registry.json',
  'docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json',
  'docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'
)) {
  $to = Join-Path $destination $file
  New-Item -ItemType Directory -Path (Split-Path $to) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $source $file) -Destination $to
}
if ($SourceName -ne 'l4-adopt-astra') {
$nativeRelative = '.tmp/ff8-decomp-semantics-20261011-r01/native'
$nativeSource = Join-Path $source $nativeRelative
$nativeDestination = Join-Path $destination $nativeRelative
New-Item -ItemType Directory -Path $nativeDestination -Force | Out-Null
$nativeManifest = Get-Content -LiteralPath (Join-Path $nativeSource 'TRANSFER_MANIFEST.json') -Raw | ConvertFrom-Json
if ($nativeManifest.files -ne 98 -or $nativeManifest.entries.Count -ne 98) { throw 'Wrong original native manifest' }
foreach ($line in $nativeManifest.entries) {
  $parts = $line.Split(' ')
  if ($parts[0] -notmatch '^0x[0-9A-F]+\.json$') { throw 'Unsafe native manifest path' }
  $from = Join-Path $nativeSource $parts[0]
  if ((Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash.ToLowerInvariant() -ne $parts[2]) { throw 'Raw pin changed' }
  Copy-Item -LiteralPath $from -Destination (Join-Path $nativeDestination $parts[0])
}
Copy-Item -LiteralPath (Join-Path $nativeSource 'TRANSFER_MANIFEST.json') -Destination $nativeDestination
}
$files = @(Get-ChildItem -LiteralPath $destination -Recurse -File | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($destination.Length + 1).Replace('\','/')
  $role = 'readonly-dependency'
  if ($relative.StartsWith('tools/ff8-harness/') -and $pins.ContainsKey($relative.Substring('tools/ff8-harness/'.Length))) { $role = 'review-source' }
  [ordered]@{path=$relative;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant();role=$role}
})
[ordered]@{lot=$Label;mission='re-graph-scheduler';version=1;purpose='Frozen corrective delivery, not acceptance';source=$source;files=$files} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $destination 'manifest.json') -Encoding UTF8
Write-Output ('FROZEN ' + $Label + ' files=' + $files.Count + ' manifest=' + (Get-FileHash -LiteralPath (Join-Path $destination 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant())
