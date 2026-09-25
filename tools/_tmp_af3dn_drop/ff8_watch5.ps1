# Collecteur fin de session v7 (lot 13) : attache au jeu en cours, attend la mort, log exit code.
$log = 'C:\Users\djden\AppData\Local\Temp\opencode\ff8_watch5.log'
Set-Content $log ("watch5 start {0} waiting FF8_EN exit" -f (Get-Date).ToString('HH:mm:ss.fff'))
$deadline = (Get-Date).AddSeconds(3600)
$spawnTime = Get-Date
$got = $false
while ((Get-Date) -lt $deadline) {
  $p = Get-Process -Name 'FF8_EN' -ErrorAction SilentlyContinue
  if ($p) { $pidEn = $p[0].Id; $obj = $p[0]; $got = $true; break }
  Start-Sleep -Milliseconds 200
}
if (-not $got) { Add-Content $log 'no FF8_EN within 3600s'; Add-Content $log 'watch done'; exit }
Add-Content $log ("{0} tracking pid={1}" -f (Get-Date).ToString('HH:mm:ss.fff'), $pidEn)
$deadline2 = (Get-Date).AddSeconds(3600)
while ((Get-Date) -lt $deadline2) {
  if (-not (Get-Process -Id $pidEn -ErrorAction SilentlyContinue)) {
    $death = Get-Date
    Add-Content $log ("{0} FF8_EN died (lifetime={1:F1}s)" -f $death.ToString('HH:mm:ss.fff'), ($death - $spawnTime).TotalSeconds)
    if ($obj) { try { $obj.WaitForExit(2000) | Out-Null } catch {} ; try { Add-Content $log ("exitcode=" + $obj.ExitCode) } catch { Add-Content $log 'exitcode unreadable' } }
    break
  }
  Start-Sleep -Milliseconds 100
}
if (Get-Process -Id $pidEn -ErrorAction SilentlyContinue) { Add-Content $log 'FF8_EN STILL ALIVE after 3600s window — game running' }
Add-Content $log 'watch done'
