# ff8_14_collect.ps1 - collector artefacts per trigger (safe-move to captures\lot14\<name>)
param([Parameter(Mandatory=$true)][string]$Name)
$game = 'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII'
$dest = "tools\_tmp_af3dn_drop\captures\lot14\$Name"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
foreach ($pair in @(('gfx_passthrough_dump.bin', "$Name.bin"), ('gfx_passthrough_dump.log', "$Name.log"), ('gfx_passthrough.csv', "$Name.csv"))) {
  $src = Join-Path $game $pair[0]
  if (Test-Path $src) {
    Move-Item $src (Join-Path $dest $pair[1]) -Force
    Write-Host "moved $pair[0] -> $dest\$($pair[1])"
  }
}
Get-ChildItem $dest | ForEach-Object { Write-Host ($_.Name + ' ' + $_.Length + ' B sha256=' + (Get-FileHash $_.FullName -Algorithm SHA256).Hash) }
