# Parent-only test launcher. No RMS store, OpenAI endpoint or real secret.
[CmdletBinding(PositionalBinding=$false)]
param([Parameter(Mandatory=$true)][ValidateSet('positive','duplicate')][string]$Scenario)
$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $PSScriptRoot
$bun = 'C:\Users\djden\.bun\bin\bun.exe'
$qualifier = Join-Path $PSScriptRoot 'qualify-private-ui-v1.mjs'
$relay = Join-Path $base 'auth-parent-225/private-ui-relay-v1.mjs'
$window = Join-Path $base 'auth-parent-225/private-ui-window-v1.ps1'
$pins = @{
    $bun = '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4'
    $qualifier = '8fa5b7982ac22d305ab3a09879e5e84e3052583e0bd94dce3b932564928e9196'
    $relay = '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053'
    $window = '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f'
}
foreach ($p in $pins.Keys) {
    if ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pins[$p]) { throw 'Pinned test input changed' }
}
$attempt = Join-Path $PSScriptRoot ($Scenario+'-native-attempt.json')
$receipt = Join-Path $PSScriptRoot ($Scenario+'-native-receipt.json')
if ((Test-Path -LiteralPath $attempt) -or (Test-Path -LiteralPath $receipt) -or
    (Test-Path -LiteralPath (Join-Path $PSScriptRoot ($Scenario+'-FINALOUTCOME.json')))) { throw 'Prior attempt exists; no retry' }
function Write-NewJson([string]$Path, $Value) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($Value | ConvertTo-Json -Depth 8))
    $stream = [System.IO.File]::Open($Path,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
    try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}
Write-NewJson $attempt @{version='private-ui-228-native-attempt-v1';scenario=$Scenario;sourcePins=$pins;fixtureOnly=$true;oauthRequested=$false;timeoutMs=50000;retry=$false}
$si = New-Object System.Diagnostics.ProcessStartInfo
$si.FileName = $bun
$si.Arguments = 'run "'+$qualifier+'" --parent '+$Scenario
$si.WorkingDirectory = $PSScriptRoot
$si.UseShellExecute = $false
$si.CreateNoWindow = $true
$si.RedirectStandardOutput = $true
$si.RedirectStandardError = $true
$si.EnvironmentVariables.Clear()
$si.EnvironmentVariables['SystemRoot'] = 'C:\Windows'
$si.EnvironmentVariables['WINDIR'] = 'C:\Windows'
$si.EnvironmentVariables['ComSpec'] = 'C:\Windows\System32\cmd.exe'
$si.EnvironmentVariables['OS'] = 'Windows_NT'
$si.EnvironmentVariables['PATH'] = (Split-Path -Parent $bun)+';C:\Windows\System32'
$p = New-Object System.Diagnostics.Process
$p.StartInfo = $si
$watch = [System.Diagnostics.Stopwatch]::StartNew()
$started = $false; $closed = $false; $timedOut = $false; $killed = $false
$drained = $false; $exitCode = $null; $pidObserved = $null; $pinsAfter = $false
try {
    $started = $p.Start()
    if ($started) {
        $pidObserved = $p.Id
        $outTask = $p.StandardOutput.ReadToEndAsync()
        $errTask = $p.StandardError.ReadToEndAsync()
        $closed = $p.WaitForExit(50000)
        if (-not $closed) {
            $timedOut = $true
            try { $p.Kill(); $killed = $true } catch { }
            $closed = $p.WaitForExit(2000)
        }
        $outDone = $false; $errDone = $false
        try { $outDone = $outTask.Wait(1000) } catch { }
        try { $errDone = $errTask.Wait(1000) } catch { }
        $drained = $outDone -and $errDone -and -not $outTask.IsFaulted -and -not $errTask.IsFaulted
        if ($drained) {
            # Only public fixture outputs are drained. Private UI pipes never
            # reach these streams; do not persist or print raw stream content.
            [void]$outTask.GetAwaiter().GetResult()
            [void]$errTask.GetAwaiter().GetResult()
        }
        if ($closed) { $exitCode = $p.ExitCode }
    }
    foreach ($path in $pins.Keys) {
        if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pins[$path]) { throw 'Pinned test input changed after execution' }
    }
    $pinsAfter = $true
} catch {
    $pinsAfter = $false
    if ($started -and -not $closed) {
        try { $p.Kill(); $killed = $true } catch { }
        try { $closed = $p.WaitForExit(2000) } catch { }
        if ($closed) { try { $exitCode = $p.ExitCode } catch { } }
    }
} finally {
    $status = 'HOLD'
    if ($started -and $closed -and $exitCode -eq 0 -and $drained -and -not $timedOut -and -not $killed -and $pinsAfter) { $status = 'NATIVE_TEST_PROCESS_COMPLETED' }
    $value = @{version='private-ui-228-native-process-receipt-v1';status=$status;scenario=$Scenario;pid=$pidObserved;exitCode=$exitCode;closed=$closed;drained=$drained;timedOut=$timedOut;killRequested=$killed;durationMs=$watch.ElapsedMilliseconds;sourcePins=$pins;sourcePinsRecheckedAfter=$pinsAfter;environmentInherited=$false;fixtureOnly=$true;oauthRequested=$false;resourcesReleased='NOT_INFERRED';fullQualificationReceiptRequired=$true}
    Write-NewJson $receipt $value
    $p.Dispose()
    $value | ConvertTo-Json -Depth 8 -Compress
    if ($status -ne 'NATIVE_TEST_PROCESS_COMPLETED') { throw 'Scoped native UI test did not complete' }
}
