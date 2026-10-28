$p = Get-Process -Id $args[0] -ErrorAction SilentlyContinue
if (-not $p) { Write-Output 'PROC NOT FOUND'; exit }
$p.Modules | ForEach-Object { Write-Output ($_.ModuleName.PadRight(20) + $_.FileName) }
