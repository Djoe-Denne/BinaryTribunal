# ff8_14_trigger.ps1 - UN geste par fenetre : purge artefacts + armement sidecar 16 frames
param([Parameter(Mandatory=$true)][string]$Name)
$game = 'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII'
# 1) purge (lecon mixed_append : jamais d'appends croises) -- CSV exclus : il est
#    ouvert en lazy par le DLL pendant TOUTE la session (purge = acces refuse + perte de trace)
foreach ($n in 'gfx_passthrough_dump.bin','gfx_passthrough_dump.log','gfx_passthrough.dump') {
  $p = Join-Path $game $n
  if (Test-Path $p) { Remove-Item $p -Force; Write-Host "purged $n" }
}
# 2) arme la fenetre 16 frames (sidecar absent = DLL inerte)
Set-Content -Path (Join-Path $game 'gfx_passthrough.dump') -Value ('v8 trigger ' + $Name)
Write-Host ("ARMED " + $Name + " - 16 prochains frames seront dumpes")
# 3) deplace les artefacts de la fenetre PRECEDENTE si demande en 2e appel? non: caller collector apart
