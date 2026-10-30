# One-shot native parent launcher. No global/environment configuration edits.
[CmdletBinding(PositionalBinding=$false)]
param([switch]$BatchedPreflight215, [switch]$ReadyPathFix218)
$ErrorActionPreference = 'Stop'
if ($BatchedPreflight215 -and $ReadyPathFix218) { throw 'Choose exactly one closed attempt' }
$base = $PSScriptRoot
$bun = 'C:/Users/djden/.bun/bin/bun.exe'
if ((Get-FileHash -LiteralPath $bun -Algorithm SHA256).Hash.ToLowerInvariant() -ne '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4') { throw 'Bun pin mismatch' }
$jobs = @(
    @{Id='prepare'; File='prepare-owned-controller-206.mjs'; Hash='11a57a0def4cfd9aefed2f45d8509d0239a1ea01e74fa7fa7a1e2c3192ac54ed'; Timeout=30000},
    @{Id='receive'; File='receive-owned-readonly-206.mjs'; Hash='1d3dbde41d5f9540133faba157cac1eb4831e9669fb3c027c54eee9f2c0c85e2'; Timeout=130000}
)
$recordPrefix = 'owned-direct-209-'
$actArgument = 'new-attempt-after-preload-hold-207'
if ($BatchedPreflight215) {
    $jobs = @(
        @{Id='prepare'; File='prepare-owned-controller-206.mjs'; Hash='0b41a691a3cc255e41e029cc0cf8ee3369ea83127a4664983530ff49d46730c9'; Timeout=30000},
        @{Id='receive'; File='receive-owned-readonly-206.mjs'; Hash='0c5036a078f700636432c5ce667dce5ddadc5be3960bf6fda8295cd26a01d467'; Timeout=130000}
    )
    $recordPrefix = 'owned-direct-216-'
    $actArgument = 'new-attempt-after-batched-preflight-215'
}
if ($ReadyPathFix218) {
    $jobs = @(
        @{Id='prepare'; File='prepare-owned-controller-206.mjs'; Hash='8e5b56f4dafc52b31445b51785192839d9af8e6e734c60c46efacf07dd0eab7a'; Timeout=30000},
        @{Id='receive'; File='receive-owned-readonly-206.mjs'; Hash='2eaf8867c7133721a6e358a3a2bda9d6748f797ca51f4b36c140e7bb3f0a7b2f'; Timeout=130000}
    )
    $recordPrefix = 'owned-direct-219-'
    $actArgument = 'new-attempt-after-ready-path-fix-218'
}
foreach ($job in $jobs) {
    if ((Get-FileHash -LiteralPath (Join-Path $base $job.File) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $job.Hash) { throw 'Parent script changed' }
    if (Test-Path -LiteralPath (Join-Path $base ('evidence/'+$recordPrefix+$job.Id+'.json'))) { throw 'Prior execution exists; no retry' }
}
foreach ($job in $jobs) {
    $si = New-Object System.Diagnostics.ProcessStartInfo
    $si.FileName = $bun
    $si.Arguments = 'run "'+(Join-Path $base $job.File)+'" '+$actArgument
    $si.WorkingDirectory = $base
    $si.UseShellExecute = $false
    $si.CreateNoWindow = $true
    $si.RedirectStandardOutput = $true
    $si.RedirectStandardError = $true
    $si.EnvironmentVariables.Clear()
    foreach ($entry in @{SystemRoot='C:/Windows';WINDIR='C:/Windows';ComSpec='C:/Windows/System32/cmd.exe';OS='Windows_NT';PATH='C:/Users/djden/.bun/bin;C:/Windows/System32';TEMP='C:/Users/djden/AppData/Local/Temp/opencode';TMP='C:/Users/djden/AppData/Local/Temp/opencode'}.GetEnumerator()) { $si.EnvironmentVariables[$entry.Key] = $entry.Value }
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $si
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    if (-not $p.Start()) { throw 'Native parent failed to start' }
    $stdout = $p.StandardOutput.ReadToEndAsync()
    $stderr = $p.StandardError.ReadToEndAsync()
    $timedOut = -not $p.WaitForExit($job.Timeout)
    $closed = -not $timedOut
    $killRequested = $false
    $killError = $false
    if ($timedOut) {
        try { $p.Kill(); $killRequested = $true } catch { $killError = $true }
        try { $closed = $p.WaitForExit(2000) } catch { $closed = $false }
    }
    # A retained pipe or failed reader must not introduce an unbounded wait.
    $stdoutReady = $false
    $stderrReady = $false
    $stdoutText = ''
    $stderrText = ''
    try { $stdoutReady = $stdout.Wait(2000); if ($stdoutReady) { $stdoutText = $stdout.GetAwaiter().GetResult() } } catch { $stdoutReady = $false }
    try { $stderrReady = $stderr.Wait(2000); if ($stderrReady) { $stderrText = $stderr.GetAwaiter().GetResult() } } catch { $stderrReady = $false }
    $timer.Stop()
    $exitCode = $null
    if ($closed) { $exitCode = $p.ExitCode }
    $complete = $closed -and $stdoutReady -and $stderrReady -and (-not $timedOut) -and ($exitCode -eq 0)
    $outcome = 'HOLD'
    if ($complete) { $outcome = 'PARENT_ACT_COMPLETED' }
    $receipt = [ordered]@{script=$job.File;scriptSha256=$job.Hash;pid=$p.Id;exit=$exitCode;outcome=$outcome;timedOut=$timedOut;closed=$closed;stdoutDrainProved=$stdoutReady;stderrDrainProved=$stderrReady;finalizationWaitMsPerOperation=2000;killRequested=$killRequested;killError=$killError;resourcesReleased='NOT_INFERRED';durationMs=$timer.ElapsedMilliseconds;stdout=$stdoutText;stderr=$stderrText;environmentInherited=$false;nativeProcessStartInfo=$true;automaticRetry=$false}
    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($receipt | ConvertTo-Json -Depth 8))
    $f = [System.IO.File]::Open((Join-Path $base ('evidence/'+$recordPrefix+$job.Id+'.json')),[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
    try { $f.Write($bytes,0,$bytes.Length); $f.Flush($true) } finally { $f.Dispose() }
    $p.Dispose()
    Write-Output ($receipt | ConvertTo-Json -Compress -Depth 8)
    if (-not $complete) { throw 'Parent act HOLD; stop sequence, preserve all evidence; resource release not inferred' }
}
