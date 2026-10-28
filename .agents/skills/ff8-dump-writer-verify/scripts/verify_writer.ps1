# verify_writer.ps1 — gate post-build/déploiement pour le writer AF3DN.P (skill ff8-dump-writer-verify)
# Usage:
#   powershell -File verify_writer.ps1 -PassthroughDir <dir source+dll> -DeployedPath <AF3DN.P jeu> [-SkipHarness]
# Vérifie : exports, fopen binaire, harnais sentinelles (RVAs auto-dérivées), hash déployé == build.
param(
    [Parameter(Mandatory=$true)][string]$PassthroughDir,
    [string]$DeployedPath = 'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\AF3DN.P',
    [switch]$SkipHarness,
    [string]$Dumpbin = 'C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64\dumpbin.exe'
)
$ErrorActionPreference = 'Stop'
$fail = @()
function Verdict($ok, $name, $detail) {
    $tag = if ($ok) { 'ok  ' } else { $fail += $name; 'FAIL ' }
    Write-Host ("[{0}] {1}" -f $tag, $name)
    if (-not $ok -and $detail) { Write-Host "      $detail" }
}

$dll = Join-Path $PassthroughDir 'gfx_driver_passthrough.dll'
if (-not (Test-Path $dll)) { Write-Host 'FAIL dll absent'; exit 1 }

# 1. Exports (attendu v7+ : 14 fonctions / 14 noms)
$exp = & $Dumpbin /EXPORTS $dll
$nFunc = ($exp | Select-String 'number of functions').ToString() -replace '\D', ''
$nNames = ($exp | Select-String 'number of names').ToString() -replace '\D', ''
$forwards = ($exp | Select-String 'forwarded to dotemu_orig').Count
Verdict ($nFunc -eq $nNames -and $nFunc -ge 14), "exports $nFunc/$nNames fonctions-noms (forwards dotemu_orig = $forwards)"

# 2. fopen binaire : tout fopen de flux binaire doit porter 'b'
$src = Get-ChildItem $PassthroughDir -Filter '*.c' | ForEach-Object { Get-Content $_.FullName -Raw }
$fopens = ($src | Select-String 'fopen\(([^)]*)\)').Matches
$bad = $fopens | Where-Object { $_.Groups[1].Value -notmatch '"[ab][b+]?"\s*\)' -and $_.Groups[1].Value -match 'bin|\.bin' }
Verdict (-not $bad), 'fopen binaire (leçon CRLF lot 13)' ($bad | ForEach-Object { $_.Value } | Out-String)

# 3. Harnais sentinelles (RVAs auto-dérivées du disasm du DLL déployé)
if (-not $SkipHarness) {
    $tmp = Join-Path $env:TEMP 'writer_verify'
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    Copy-Item $dll "$tmp\harness_target.dll" -Force
    & $Dumpbin /DISASM $dll > "$tmp\dis.txt"
    $dis = Get-Content "$tmp\dis.txt"
    $ib = 0x10000000  # ImageBase AF3DN (dumpbin /HEADERS : "10000000 image base")
    # DumpNode RVA = cible du call suivant 'push 33h' dans Proxy_List51
    $lines = $dis | Select-String 'push\s+33h' | Select-Object -First 3
    $rvaDump = $null
    foreach ($l in $lines) {
        $idx = [array]::IndexOf($dis, $l.Line); $i = $idx
        while ($i -lt $dis.Count) { if ($dis[$i] -match 'call\s+([0-9A-F]{8})') { $rvaDump = [Convert]::ToInt64($Matches[1],16) - 0x10000000; break }; $i++ }
        if ($rvaDump) { break }
    }
    if (-not $rvaDump) { Write-Host 'FAIL DumpNode RVA introuvable (push 33h/call)'; exit 1 }
    # tête de DumpNode : les 2 premieres refs globales = g_capEndSeq (mov eax,ds:[]) puis g_frameSeq (cmp ds:[],eax)
    $headStart = ($dis | Select-String ("{0:X8}:" -f $rvaDump) | Select-Object -First 1).LineNumber - 1
    $head = $dis[$headStart..($headStart+40)]
    $refs = ($head | Select-String 'ds:\[([0-9A-F]{8})h?\]').Matches | ForEach-Object { [Convert]::ToInt64($_.Groups[1].Value,16) }
    $rvaCap = $refs[0] - 0x10000000; $rvaSeq = $refs[1] - 0x10000000
    Write-Host ("DumpNode RVA {0:X8} ; g_capEndSeq RVA {1:X8} ; g_frameSeq RVA {2:X8}" -f $rvaDump, $rvaCap, $rvaSeq) 2>$null
    Write-Host ("DumpNode RVA {0:X8} ; g_capEndSeq RVA {1:X8} ; g_frameSeq RVA {2:X8}" -f $rvaDump, $rvaCap, $rvaSeq)
    # template harnais + patch RVAs
    $tpl = 'docs/tech/investigation/battle-static-discovery/driver-passthrough/harness_probe_template.c'
    $harnessC = Join-Path $tmp 'harness.c'
    (Get-Content $tpl -Raw) -replace '0x4054EB0', ('0x{0:X8}' -f $rvaSeq) -replace '0x4054EB4', ('0x{0:X8}' -f $rvaCap) -replace '0x19D0', ('0x{0:X8}' -f $rvaDump) | Set-Content $harnessC
    cmd /c "call `"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat`" x86 && cl /nologo /W3 /Ox /MT /Fe:$tmp\harness.exe $harnessC /link /SUBSYSTEM:CONSOLE" > "$tmp\build.txt" 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host 'FAIL build harnais'; Get-Content "$tmp\build.txt" | Select-Object -Last 5; exit 1 }
    & "$tmp\harness.exe" "$tmp\harness_target.dll" | Tee-Object "$tmp\harness_out.txt"
    $out = Get-Content "$tmp\harness_out.txt" -Raw
    Verdict ($out -match 'write=\d+' -and $out -notmatch 'ring vide'), 'harnais : DumpNode a ecrit (cursor avance)'
    Verdict ($out -match 'contrat|delta 0'), 'harnais : advance == 32+psize exactement (a confirmer dans le verdict harness)'
} else { Write-Host '[skip] harnais' }

# 4. Hash déployé = hash build
$hashBuild = (Get-FileHash $dll -Algorithm SHA256).Hash
if (Test-Path $DeployedPath) {
    $hashDep = (Get-FileHash $DeployedPath -Algorithm SHA256).Hash
    Verdict ($hashDep -eq $hashBuild), "hash AF3DN.P deploye == build ($($hashBuild.Substring(0,8)))"
} else { Write-Host "[info] AF3DN.P non deployé ($($hashBuild.Substring(0,8))) — déployer puis relancer la gate" }

if ($fail.Count) { Write-Host "`nWRITER VERIFY FAILED : $($fail -join ' ; ')"; exit 1 }
Write-Host "`nWRITER VERIFIED $($hashBuild.Substring(0,16))"
