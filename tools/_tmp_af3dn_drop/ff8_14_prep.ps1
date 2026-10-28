# ff8_14_prep.ps1 — purge .bin/.log/csv du rep de jeu AVANT chaque trigger (leçon mixed_append)
param([string]$GameDir = 'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII')
foreach ($name in 'gfx_passthrough_dump.bin','gfx_passthrough_dump.log','gfx_passthrough.dump','gfx_passthrough.csv') {
  $p = Join-Path $GameDir $name
  if (Test-Path $p) { Remove-Item $p -Force; Write-Host "purged $name" }
}
