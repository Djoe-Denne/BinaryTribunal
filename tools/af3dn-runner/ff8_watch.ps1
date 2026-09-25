# ff8_watch.ps1 — observateur paramétré des campagnes live AF3DN.P (re-ff8)
# Remplace ff8_watch3/4/5 (fenêtres codées en dur) — un script, 5 modes.
# Usage :
#   ff8_watch.ps1 -Mode spawn   [-SpawnWindowSec 600] [-SessionWindowSec 900] [-HashDeployed] [-Modules]
#   ff8_watch.ps1 -Mode attach                                        [-HashDeployed] [-Modules]
#   ff8_watch.ps1 -Mode trigger            # pose le sidecar, attend la consommation
#   ff8_watch.ps1 -Mode collect -CollectDir <dir>   # deplace .bin/.log/sidecar + hashes
#   ff8_watch.ps1 -Mode purge                       # purge .bin/.log/sidecar du repertoire jeu
param(
    [Parameter(Mandatory=$true)][ValidateSet('spawn','attach','trigger','collect','purge')][string]$Mode,
    [int]$SpawnWindowSec = 600,
    [int]$SessionWindowSec = 900,
    [string]$GameDir = 'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII',
    [string]$LogPath = "$env:TEMP\opencode\ff8_watch_runner.log",
    [string]$CollectDir,
    [switch]$HashDeployed,
    [switch]$Modules
)
$ErrorActionPreference = 'Continue'
$sidecar = Join-Path $GameDir 'gfx_passthrough.dump'
$bin     = Join-Path $GameDir 'gfx_passthrough_dump.bin'
$csvLog  = Join-Path $GameDir 'gfx_passthrough_dump.log'
$exe     = Join-Path $GameDir 'FF8_EN.exe'
$stamp   = { (Get-Date).ToString('HH:mm:ss.fff') }

switch ($Mode) {
  'purge' {
    foreach ($f in @($bin, $csvLog, $sidecar)) {
      if (Test-Path $f) { Remove-Item $f -Force; Add-Content $LogPath ("{0} purge {1}" -f (& $stamp), (Split-Path $f -Leaf)) }
    }
    Write-Host 'purge done'
  }
  'trigger' {
    New-Item -ItemType File -Path $sidecar -Force | Out-Null
    Add-Content $LogPath ("{0} sidecar pose" -f (& $stamp))
    $t = 0
    while ((Test-Path $sidecar) -and $t -lt 60) { Start-Sleep -Milliseconds 100; $t++ }
    Add-Content $LogPath ("{0} sidecar consomme ({1} ms)" -f (& $stamp), ($t * 100))
    Write-Host 'trigger done'
  }
  'collect' {
    if (-not $CollectDir) { Write-Host 'collect: -CollectDir requis'; exit 1 }
    New-Item -ItemType Directory -Force -Path $CollectDir | Out-Null
    $moved = @()
    foreach ($f in @($bin, $csvLog)) {
      if (Test-Path $f) {
        $dst = Join-Path $CollectDir (Split-Path $f -Leaf)
        Move-Item $f $dst -Force
        $moved += @{ file = $dst; sha256 = (Get-FileHash $dst -Algorithm SHA256).Hash; bytes = (Get-Item $dst).Length }
      }
    }
    $moved | ConvertTo-Json -Compress | Add-Content $LogPath
    $moved | ForEach-Object { Write-Host ("collect {0} ({1} o) {2}" -f (Split-Path $_.file -Leaf), $_.bytes, $_.sha256.Substring(0,16)) }
  }
  default {
    Add-Content $LogPath ("{0} watch {1} start" -f (& $stamp), $Mode)
    if ($HashDeployed) {
      $dll = Join-Path $GameDir 'AF3DN.P'
      if (Test-Path $dll) { Add-Content $LogPath ("{0} AF3DN.P SHA256={1}" -f (& $stamp), (Get-FileHash $dll -Algorithm SHA256).Hash) }
      else { Add-Content $LogPath ("{0} WARN AF3DN.P absent" -f (& $stamp)) }
    }
    $pidEn = 0; $obj = $null; $spawnTime = $null
    if ($Mode -eq 'spawn') {
      $deadline = (Get-Date).AddSeconds($SpawnWindowSec)
      while ((Get-Date) -lt $deadline -and -not $pidEn) {
        $p = Get-Process -Name 'FF8_EN' -ErrorAction SilentlyContinue
        if ($p) { $pidEn = $p[0].Id; $obj = $p[0]; $spawnTime = Get-Date
                  Add-Content $LogPath ("{0} spawn FF8_EN pid={1}" -f (& $stamp), $pidEn) }
        else { Start-Sleep -Milliseconds 50 }
      }
      if (-not $pidEn) { Add-Content $LogPath 'no FF8_EN (spawn window)'; Add-Content $LogPath 'watch done'; exit }
      Start-Sleep -Seconds 3
      if ($Modules -and (Get-Process -Id $pidEn -ErrorAction SilentlyContinue)) {
        Add-Content $LogPath '--- modules at +3s ---'
        & "$env:windir\SysWOW64\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -Command "Get-Process -Id $pidEn | Select-Object -ExpandProperty Modules | Where-Object { `$_.ModuleName -match 'AF3DN|AF4DN|dotemu|ddraw|d3d9|opengl|binkw|steam_api|FF8_EN' } | ForEach-Object { Write-Output (`$_.ModuleName + '  ' + `$_.FileName) }" 2>&1 | ForEach-Object { Add-Content $LogPath $_ }
      }
    } else {
      $p = Get-Process -Name 'FF8_EN' -ErrorAction SilentlyContinue
      if (-not $p) { Add-Content $LogPath 'no FF8_EN running (attach)'; Add-Content $LogPath 'watch done'; exit }
      $pidEn = $p[0].Id; $obj = $p[0]; $spawnTime = Get-Date
      Add-Content $LogPath ("{0} tracking pid={1}" -f (& $stamp), $pidEn)
    }
    $deadline2 = (Get-Date).AddSeconds($SessionWindowSec)
    while ((Get-Date) -lt $deadline2) {
      if (-not (Get-Process -Id $pidEn -ErrorAction SilentlyContinue)) {
        $death = Get-Date
        Add-Content $LogPath ("{0} FF8_EN died, lifetime={1:F1}s" -f $death.ToString('HH:mm:ss.fff'), ($death - $spawnTime).TotalSeconds)
        if ($obj) { try { $obj.WaitForExit(2000) | Out-Null } catch {}
                    try { Add-Content $LogPath ("exitcode=" + $obj.ExitCode) } catch { Add-Content $LogPath 'exitcode unreadable' } }
        break
      }
      Start-Sleep -Milliseconds 100
    }
    if (Get-Process -Id $pidEn -ErrorAction SilentlyContinue) { Add-Content $LogPath 'FF8_EN STILL ALIVE (session window ecoulee)' }
    Add-Content $LogPath 'watch done'
  }
}
