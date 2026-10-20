param([Parameter(Mandatory=$true)][string]$SpecPath,[Parameter(Mandatory=$true)][string]$GoPath)
$ErrorActionPreference='Stop'
$spec=Get-Content -LiteralPath $SpecPath -Raw | ConvertFrom-Json
$go=Get-Content -LiteralPath $GoPath -Raw | ConvertFrom-Json
function Hash([string]$p) { (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() }
if($spec.mode -ne 'CSC_LIBRARY_ONLY' -or $go.stage -ne 'FINAL_GO_ONE_BUDGET_LIBRARY_COMPILE_ONLY') { throw 'Wrong gate' }
if((Hash $PSCommandPath) -ne $go.psScriptSha256 -or (Hash $SpecPath) -ne $go.specSha256) { throw 'Gate pin drift' }
foreach($pin in $spec.pins) { if((Hash $pin.path) -ne $pin.sha256) { throw 'Input pin drift' } }
$envNow=[Environment]::GetEnvironmentVariables()
foreach($k in $envNow.Keys) {
  $u=([string]$k).ToUpperInvariant()
  if($u -in @('NODE_OPTIONS','BUN_OPTIONS','FF8_ENSEMBLE_SOURCE','DOTNET_STARTUP_HOOKS','APPDOMAIN_MANAGER_ASM','APPDOMAIN_MANAGER_TYPE') -or $u.StartsWith('COR_') -or $u.StartsWith('CORECLR_') -or $u.StartsWith('COMPLUS_')) { throw 'Injection guard present' }
}
$attempt=[IO.File]::Open((Join-Path $spec.root 'COMPILER_ATTEMPT.json'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
try { $raw=[Text.Encoding]::UTF8.GetBytes('{"mode":"ONE_CSC_LIBRARY_ONLY","noRuntimePermission":true}');$attempt.Write($raw,0,$raw.Length) } finally { $attempt.Dispose() }
$watch=[Diagnostics.Stopwatch]::StartNew()
$p=New-Object Diagnostics.Process
$p.StartInfo.FileName=$spec.compiler
$quoted=@();foreach($v in $spec.argv) { if(([string]$v).Contains('"')) { throw 'Unsupported argument' };$quoted+=('"'+[string]$v+'"') }
$p.StartInfo.Arguments=$quoted -join ' '
$p.StartInfo.WorkingDirectory=$spec.root
$p.StartInfo.UseShellExecute=$false;$p.StartInfo.CreateNoWindow=$true
$p.StartInfo.RedirectStandardOutput=$true;$p.StartInfo.RedirectStandardError=$true
# No environment clear/removal. Only scoped TEMP/TMP overrides on child clone.
$p.StartInfo.EnvironmentVariables['TEMP']=$spec.temp
$p.StartInfo.EnvironmentVariables['TMP']=$spec.temp
$started=$false;$killSent=$false;$reason='NONE';$exitCode=$null
$streams=@();$processId=$null
try {
  $started=$p.Start();if(-not $started) { throw 'Compiler start refused' };$processId=$p.Id
  foreach($stream in @($p.StandardOutput.BaseStream,$p.StandardError.BaseStream)) {
    $streams+=@{stream=$stream;data=(New-Object byte[] 131072);buffer=(New-Object byte[] 4096);used=0;reserved=0;task=$null;eof=$false}
  }
  while($true) {
    if($watch.ElapsedMilliseconds -ge 120000) { $reason='GLOBAL_TIMEOUT';break }
    if($watch.ElapsedMilliseconds -ge 60000 -and -not $p.HasExited) { $reason='COMPILER_TIMEOUT';break }
    foreach($s in $streams) {
      if($null -ne $s.task -and $s.task.IsCompleted) {
        $n=$s.task.GetAwaiter().GetResult();$s.task=$null
        if($n -lt 0 -or $n -gt 4096) { throw 'Invalid stream read' }
        if($n -eq 0) { $s.eof=$true } else {
          [Buffer]::BlockCopy($s.buffer,0,$s.data,$s.used,$n);$s.used+=$n
        }
      }
      if(-not $s.eof -and $null -eq $s.task) {
        if($s.reserved -ge 131072) { $reason='LOG_RESERVATION_EXHAUSTED';break }
        $n=[Math]::Min(4096,131072-$s.reserved)
        $s.reserved+=$n # BEFORE ReadAsync, no refund for partial/EOF.
        $s.task=$s.stream.ReadAsync($s.buffer,0,$n)
      }
    }
    if($reason -ne 'NONE') { break }
    if($p.HasExited -and $streams[0].eof -and $streams[1].eof) { break }
    [Threading.Thread]::Sleep(10)
  }
} catch { $reason='COMPILER_OR_CAPTURE_FAILURE' }
finally {
  if($started -and -not $p.HasExited) {
    try { $p.Kill();$killSent=$true;[void]$p.WaitForExit(5000) } catch { $reason='OWNED_COMPILER_STOP_UNPROVEN' }
  }
  # Preserve every completed raw read, including a pending read completed at stop.
  foreach($s in $streams) {
    if($null -ne $s.task -and $s.task.IsCompleted) {
      try { $n=$s.task.GetAwaiter().GetResult();if($n -gt 0) { [Buffer]::BlockCopy($s.buffer,0,$s.data,$s.used,$n);$s.used+=$n };if($n -eq 0) { $s.eof=$true } } catch { $reason='CAPTURE_INCOMPLETE' }
      $s.task=$null
    }
  }
  if($started -and $p.HasExited) { $exitCode=$p.ExitCode }
  for($i=0;$i -lt $streams.Count;$i++) {
    $s=$streams[$i];$bytes=New-Object byte[] $s.used
    if($s.used -gt 0) { [Buffer]::BlockCopy($s.data,0,$bytes,0,$s.used) }
    [IO.File]::WriteAllBytes((Join-Path $spec.root (@('csc.stdout.bin','csc.stderr.bin')[$i])),$bytes)
  }
  $complete=($streams.Count -eq 2 -and $streams[0].eof -and $streams[1].eof)
  $result=[ordered]@{at=[DateTime]::UtcNow.ToString('o');compilerPid=$processId;exitCode=$exitCode;elapsedMilliseconds=$watch.ElapsedMilliseconds;reason=$reason;killSent=$killSent;captureComplete=$complete;stdoutBytes=$(if($streams.Count -gt 0){$streams[0].used}else{0});stderrBytes=$(if($streams.Count -gt 1){$streams[1].used}else{0});naturalCompilerExit=($started -and $p.HasExited -and -not $killSent);dllNeverLoaded=$true;noTestsOrJobApi=$true}
  $json=$result|ConvertTo-Json -Depth 5
  [IO.File]::WriteAllText((Join-Path $spec.root 'COMPILER_RESULT.json'),$json,(New-Object Text.UTF8Encoding($false)))
  if($started) { $p.Dispose() }
  Write-Output $json
}
if($reason -ne 'NONE' -or $exitCode -ne 0 -or -not $complete) { exit 1 }
exit 0
