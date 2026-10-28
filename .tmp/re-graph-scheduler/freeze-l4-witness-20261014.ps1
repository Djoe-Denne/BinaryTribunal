$ErrorActionPreference = 'Stop'
$root = 'C:\Users\djden\source\repos\retro-eng\re-ff8'
$source = 'C:\Users\djden\.local\share\opencode\worktree\68ae5f\ensemble-re-ff8-re-graph-scheduler#4urn3c-l4-last-astra'
$destination = Join-Path $root '.tmp/re-graph-scheduler/review-20261014/L4WITNESS'
if (Test-Path $destination) { throw 'Existing gel is immutable; do not overwrite' }
$expected = @{
  'src/semantic-index.ts' = 'bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1'
  'src/lineage.ts' = 'ad412776dd7962d457f68a3c74f07502812dd0029070a517a4d4f9d74d033a61'
  'test/lineage.test.ts' = '26eed4ee05000c9ed06ec7b0fa56f209187c00231a5bb2c46d6acf9dfe8f2b60'
}
foreach ($entry in $expected.GetEnumerator()) {
  $actual = (Get-FileHash (Join-Path $source ('tools/ff8-harness/' + $entry.Key)) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $entry.Value) { throw ('Writer pin mismatch: ' + $entry.Key) }
}
$harness = Join-Path $destination 'tools/ff8-harness'
New-Item -ItemType Directory -Path $harness -Force | Out-Null
foreach ($directory in @('src','schemas','test')) {
  Copy-Item -LiteralPath (Join-Path $source ('tools/ff8-harness/' + $directory)) -Destination $harness -Recurse
}
foreach ($file in @('package.json','bun.lock','tsconfig.json')) {
  Copy-Item -LiteralPath (Join-Path $source ('tools/ff8-harness/' + $file)) -Destination $harness
}
$contract = Join-Path $destination 'docs/missions/re-graph-scheduler'
New-Item -ItemType Directory -Path $contract -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'docs/missions/re-graph-scheduler/contract') -Destination $contract -Recurse
foreach ($file in @('ORDRE_MISSION.md','L4_PROPOSAL_EVIDENCE_GO.md','L4_MAX_LAST_RESORT.md')) {
  Copy-Item -LiteralPath (Join-Path $root ('docs/missions/re-graph-scheduler/' + $file)) -Destination $contract
}
$files = @(Get-ChildItem -LiteralPath $destination -Recurse -File | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($destination.Length + 1).Replace('\','/')
  $role = 'readonly-dependency'
  if ($relative -in @('tools/ff8-harness/src/semantic-index.ts','tools/ff8-harness/src/lineage.ts','tools/ff8-harness/test/lineage.test.ts')) { $role = 'review-source' }
  [ordered]@{path=$relative;sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant();role=$role}
})
$manifest = [ordered]@{lot='L4WITNESS';version=1;mission='re-graph-scheduler';purpose='Independent offline review; not acceptance or publication';source=$source;files=$files}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $destination 'manifest.json') -Encoding UTF8
Write-Output ('FROZEN files=' + $files.Count + ' manifest=' + (Get-FileHash (Join-Path $destination 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant())
