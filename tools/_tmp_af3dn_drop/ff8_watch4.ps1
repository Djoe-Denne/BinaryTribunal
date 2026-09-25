# Observateur campagne v7 (lot 13) — derive de ff8_watch3.ps1, fenetre etendue 900 s.
$log = 'C:\Users\djden\AppData\Local\Temp\opencode\ff8_watch4.log'
Set-Content $log "watch4 start $((Get-Date).ToString('HH:mm:ss.fff')) waiting FF8_EN (v7 drawlist dump)"
$pidEn = 0
$obj = $null
$spawnTime = $null
$deadline = (Get-Date).AddSeconds(1800)
while ((Get-Date) -lt $deadline -and -not $pidEn) {
  $p = Get-Process -Name 'FF8_EN' -ErrorAction SilentlyContinue
  if ($p) {
    $pidEn = $p[0].Id
    $obj = $p[0]
    $spawnTime = Get-Date
    Add-Content $log ("{0} spawn FF8_EN pid={1}" -f $spawnTime.ToString('HH:mm:ss.fff'), $pidEn)
  } else { Start-Sleep -Milliseconds 15 }
}
if (-not $pidEn) { Add-Content $log 'no FF8_EN within 1800s'; Add-Content $log 'watch done'; exit }
Start-Sleep -Seconds 3
if (-not (Get-Process -Id $pidEn -ErrorAction SilentlyContinue)) {
  Add-Content $log "died before module dump (lifetime < 3s)"
} else {
  Add-Content $log '--- modules at +3s (filtered) ---'
  & "$env:windir\SysWOW64\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File 'C:\Users\djden\AppData\Local\Temp\opencode\enum_mods.ps1' $pidEn 2>&1 | ForEach-Object { if ($_ -match 'AF3DN|AF4DN|dotemu|ddraw|d3d9|opengl|binkw|steam_api|FF8_EN') { Add-Content $log $_ } }
}
# Fenetre etendue : menu -> field -> bataille (Fireaga) -> sortie propre.
$deadline2 = (Get-Date).AddSeconds(900)
while ((Get-Date) -lt $deadline2) {
  if (-not (Get-Process -Id $pidEn -ErrorAction SilentlyContinue)) {
    $death = Get-Date
    $life = ($death - $spawnTime).TotalSeconds
    Add-Content $log ("{0} FF8_EN died, lifetime={1:F1}s" -f $death.ToString('HH:mm:ss.fff'), $life)
    if ($obj) { try { $obj.WaitForExit(2000) | Out-Null } catch {} ; try { Add-Content $log ("exitcode=" + $obj.ExitCode) } catch { Add-Content $log 'exitcode unreadable' } }
    break
  }
  Start-Sleep -Milliseconds 100
}
if (Get-Process -Id $pidEn -ErrorAction SilentlyContinue) { Add-Content $log 'FF8_EN STILL ALIVE after 900s window — game running' }
Add-Content $log 'watch done'
