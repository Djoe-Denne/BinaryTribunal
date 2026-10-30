# Supervisor-only external observation. No automatic Prepare -> Connect.
[CmdletBinding(PositionalBinding=$false)]
param(
  [Parameter(Mandatory=$true)][ValidateSet('Prepare','Connect',IgnoreCase=$false)][string]$Phase,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')][string]$IntentId,
  [Parameter(Mandatory=$true)][ValidateRange(1,9007199254740990)][long]$ExpectedPriorFence,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedObserverSha256
)
if (-not ($Phase -ceq 'Prepare' -or $Phase -ceq 'Connect')) { throw 'AUTH_EXTERNAL_PHASE_REFUSED' }
$ErrorActionPreference = 'Stop'
$mission = Split-Path -Parent $PSScriptRoot
$base = Join-Path $mission 'auth-parent-231'
$main = Join-Path $base 'auth-parent-native-v1.ps1'
$native = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
$mainSha = '74a3bf8bf096943544a39e2ecd55b3614ea0e742acdff6a9ed2518e6996c0d1b'
$nativeSha = '60c9b29843624dd8af6b6a7b26147753be6aeef65098b9a503cc50850afe410f'
$out = Join-Path $base ('attempt-'+$IntentId)
$name = $Phase.ToLowerInvariant()+'-'+$IntentId
$attempt = Join-Path $PSScriptRoot ($name+'-attempt.json')
$resultPath = Join-Path $PSScriptRoot ($name+'-FINALOUTCOME.json')
$p = $null; $started = $false; $closed = $false; $drained = $false; $killRequested = $false
$pidObserved = $null; $exitCode = $null; $imagePath = $null; $marker = $null
$frequency = [Diagnostics.Stopwatch]::Frequency
$watch = [Diagnostics.Stopwatch]::StartNew()
function Need([bool]$Value) { if (-not $Value) { throw 'AUTH_EXTERNAL_REFUSED' } }
function Sha([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant() }
function Closed-Shape($Value,[string[]]$Names) {
  if ($null -eq $Value -or $Value -isnot [pscustomobject]) { return $false }
  $actual = @($Value.PSObject.Properties.Name)
  return ($actual.Count -eq $Names.Count -and @($Names | Where-Object { $actual -cnotcontains $_ }).Count -eq 0)
}
function Json([string]$Path) { return [IO.File]::ReadAllText($Path) | ConvertFrom-Json -ErrorAction Stop }
function Write-New([string]$Path,$Value) {
  $bytes = [Text.UTF8Encoding]::new($false).GetBytes(($Value | ConvertTo-Json -Depth 12))
  $s = [IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try { $s.Write($bytes,0,$bytes.Length); $s.Flush($true) } finally { $s.Dispose() }
}
function Host-Facts {
  $os = Get-CimInstance -ClassName Win32_OperatingSystem -Property LastBootUpTime -OperationTimeoutSec 3 -ErrorAction Stop
  return [ordered]@{machine=[Environment]::MachineName;bootUtcTicks=$os.LastBootUpTime.ToUniversalTime().Ticks.ToString();qpcFrequency=[Diagnostics.Stopwatch]::Frequency.ToString()}
}
function Pins {
  Need ((Sha $PSCommandPath) -ceq $ExpectedObserverSha256)
  Need ((Sha $native) -ceq $nativeSha -and (Sha $main) -ceq $mainSha)
  Need ((Sha (Join-Path $base 'prepare-auth-controller-v1.mjs')) -ceq '01fa116885f974bc5592c6e47edcd05578a35c30fa0cb84fbfad1d5cb53c4e95')
  Need ((Sha (Join-Path $base 'receive-auth-parent-v1.mjs')) -ceq 'dcc9da265ef5174f90352153255b4424b24a7344e5497ceaafabe00bb963452c')
}
function Marker {
  $m = Json (Join-Path $base ('prepare-'+$IntentId+'.marker.json'))
  Need ((Closed-Shape $m @('version','intentId','expectedPriorFence','preparedAt','deadlineAt','clockStart','clockDeadline','clockFrequency')) -and $m.version -ceq 'rms-auth-native-prepare-marker-v1' -and $m.intentId -ceq $IntentId -and $m.expectedPriorFence -eq $ExpectedPriorFence)
  Need ($m.clockFrequency -cmatch '^[1-9][0-9]*$' -and $m.clockStart -cmatch '^[0-9]+$' -and $m.clockDeadline -cmatch '^[0-9]+$')
  $f = [long]::Parse($m.clockFrequency); $a = [long]::Parse($m.clockStart); $z = [long]::Parse($m.clockDeadline)
  Need ($f -eq $frequency -and $z -eq ($a+$f*240) -and $m.deadlineAt -eq ($m.preparedAt+240000))
  Need ([Diagnostics.Stopwatch]::GetTimestamp() -ge $a -and [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -ge $m.preparedAt)
  return $m
}
function Remaining($m) {
  $left = [math]::Min(([long]::Parse($m.clockDeadline)-[Diagnostics.Stopwatch]::GetTimestamp())*1000.0/$frequency,$m.deadlineAt-[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
  Need ($left -gt 0 -and $left -le 240000)
  return [int][math]::Floor($left)
}
$outcome = [ordered]@{version='rms-auth-external-native-observation-v1';status='HOLD';phase=$Phase;intentId=$IntentId;expectedPriorFence=$ExpectedPriorFence;automaticRetry=$false;workAuthority=$false;newRmsOrigins=$null;credentialMayHavePersisted=($Phase -ceq 'Connect');requiresParentToolExitZero=$true;resourcesReleased='NOT_INFERRED'}
try {
  Pins
  Need (-not (Test-Path -LiteralPath $attempt) -and -not (Test-Path -LiteralPath $resultPath))
  $hostBefore = Host-Facts
  if ($Phase -ceq 'Connect') {
    $priorPath = Join-Path $PSScriptRoot ('prepare-'+$IntentId+'-FINALOUTCOME.json')
    $prior = Json $priorPath
    Need ($prior.status -ceq 'NATIVE_AUTH_PHASE_OBSERVED' -and $prior.phase -ceq 'Prepare' -and $prior.intentId -ceq $IntentId -and $prior.expectedPriorFence -eq $ExpectedPriorFence -and $prior.nativeExitCode -eq 0 -and $prior.closed -eq $true -and $prior.drained -eq $true -and $prior.killRequested -eq $false)
    Need (($hostBefore | ConvertTo-Json -Compress) -ceq ($prior.host | ConvertTo-Json -Compress))
    $marker = Marker
    Need ((Sha (Join-Path $base ('prepare-'+$IntentId+'.marker.json'))) -ceq $prior.prepareMarkerSha256)
    $limit = Remaining $marker
  } elseif ($Phase -ceq 'Prepare') { $limit = 30000 } else { throw 'AUTH_EXTERNAL_PHASE_REFUSED' }
  Write-New $attempt @{version='rms-auth-external-native-attempt-v1';phase=$Phase;intentId=$IntentId;expectedPriorFence=$ExpectedPriorFence;mainSha256=$mainSha;observerSha256=$ExpectedObserverSha256;host=$hostBefore;automaticRetry=$false}
  $si = [Diagnostics.ProcessStartInfo]::new()
  $si.FileName = $native
  $si.Arguments = '-NoLogo -NoProfile -NonInteractive -File "'+$main+'" -Phase '+$Phase+' -IntentId '+$IntentId+' -ExpectedPriorFence '+$ExpectedPriorFence.ToString()+' -ExpectedLauncherSha256 '+$mainSha+' -ExpectedPowerShellSha256 '+$nativeSha
  $si.WorkingDirectory = $base; $si.UseShellExecute = $false; $si.CreateNoWindow = $true
  $si.RedirectStandardOutput = $true; $si.RedirectStandardError = $true
  $si.EnvironmentVariables.Clear()
  foreach ($e in @{SystemRoot='C:\Windows';WINDIR='C:\Windows';ComSpec='C:\Windows\System32\cmd.exe';OS='Windows_NT';PATH='C:\Windows\System32';TEMP='C:\Users\djden\AppData\Local\Temp\opencode';TMP='C:\Users\djden\AppData\Local\Temp\opencode'}.GetEnumerator()) { $si.EnvironmentVariables[$e.Key]=$e.Value }
  $p = [Diagnostics.Process]::new(); $p.StartInfo=$si
  $launchQpc = [Diagnostics.Stopwatch]::GetTimestamp()
  $started = $p.Start(); Need $started
  $pidObserved=$p.Id; $imagePath=$p.MainModule.FileName
  Need ([string]::Equals([IO.Path]::GetFullPath($imagePath),[IO.Path]::GetFullPath($native),[StringComparison]::OrdinalIgnoreCase))
  $stdoutTask=$p.StandardOutput.ReadToEndAsync(); $stderrTask=$p.StandardError.ReadToEndAsync()
  if ($Phase -ceq 'Connect') { $limit=Remaining $marker }
  $closed=$p.WaitForExit($limit)
  if (-not $closed) { try { $p.Kill(); $killRequested=$true } catch {} ; $closed=$p.WaitForExit(1000); throw 'AUTH_EXTERNAL_TIMEOUT' }
  $nativeExitQpc=[Diagnostics.Stopwatch]::GetTimestamp(); $exitCode=$p.ExitCode
  Need ($stdoutTask.Wait(1000) -and $stderrTask.Wait(1000))
  $stdout=$stdoutTask.GetAwaiter().GetResult(); $stderr=$stderrTask.GetAwaiter().GetResult(); $drained=$true
  Need ($exitCode -eq 0 -and $stderr.Length -eq 0 -and $stdout.Length -gt 0 -and $stdout.Length -le 1048576)
  $message=$stdout.Trim() | ConvertFrom-Json -ErrorAction Stop
  Need ((Closed-Shape $message @('status','phase','intentId','receiptSha256','requiresExternalNativeReceipt','newRmsOrigins','workAuthority')) -and $message.status -ceq 'NATIVE_PARENT_PHASE_CANDIDATE' -and $message.phase -ceq $Phase -and $message.intentId -ceq $IntentId -and $message.receiptSha256 -cmatch '^[a-f0-9]{64}$' -and $message.requiresExternalNativeReceipt -eq $true -and $message.newRmsOrigins -eq 0 -and $message.workAuthority -eq $false)
  # Never persist raw stdout/stderr. The closed projection alone may escape.
  $stdout=$null; $stderr=$null
  $provisionalPath=Join-Path $out ('native-'+$Phase.ToLowerInvariant()+'-provisional.json')
  Need ((Sha $provisionalPath) -ceq $message.receiptSha256)
  $r=Json $provisionalPath
  Need ((Closed-Shape $r @('version','status','phase','intentId','scriptSha256','nativeProcessStartInfo','environmentInherited','observation','actReadbackSha256','aclReadbacksMatched','wholeSincePrepareMs','requiresExternalNativeExitAndWholeDuration','automaticRetry','newRmsOrigins','workAuthority','resourcesReleased')) -and $r.version -ceq 'rms-auth-native-parent-provisional-v1' -and $r.status -ceq 'PROVISIONAL_NOT_ADOPTABLE' -and $r.phase -ceq $Phase -and $r.intentId -ceq $IntentId -and $r.scriptSha256 -ceq $mainSha)
  Need ($r.nativeProcessStartInfo -eq $true -and $r.environmentInherited -eq $false -and $r.aclReadbacksMatched -eq $true -and $r.requiresExternalNativeExitAndWholeDuration -eq $true -and $r.automaticRetry -eq $false -and $r.newRmsOrigins -eq 0 -and $r.workAuthority -eq $false -and $r.resourcesReleased -ceq 'NOT_INFERRED')
  $o=$r.observation
  Need ((Closed-Shape $o @('pid','exitCode','closed','stdoutDrainObserved','stderrDrainObserved','summary','environmentInherited','nativeProcessStartInfo')) -and $o.pid -gt 0 -and $o.exitCode -eq 0 -and $o.closed -eq $true -and $o.stdoutDrainObserved -eq $true -and $o.stderrDrainObserved -eq $true -and $o.environmentInherited -eq $false -and $o.nativeProcessStartInfo -eq $true)
  $marker=Marker
  if ($Phase -ceq 'Prepare') { Need ([long]::Parse($marker.clockStart) -ge $launchQpc -and [long]::Parse($marker.clockStart) -le $nativeExitQpc) }
  $actPath=Join-Path $out $(if ($Phase -ceq 'Prepare') {'controller-act.json'} else {'FINALOUTCOME.json'})
  Need ($r.actReadbackSha256 -cmatch '^[a-f0-9]{64}$' -and (Sha $actPath) -ceq $r.actReadbackSha256)
  $a=Json $actPath
  if ($Phase -ceq 'Prepare') {
    Need ((Closed-Shape $o.summary @('status','intentId','fence','expiresAt','newRmsOrigins')) -and $o.summary.status -ceq 'PREPARED_NO_AUTH_CONNECT' -and $o.summary.intentId -ceq $IntentId -and $o.summary.fence -eq ($ExpectedPriorFence+1) -and $o.summary.expiresAt -eq $marker.deadlineAt -and $o.summary.newRmsOrigins -eq 0)
    Need ($a.status -ceq 'PREPARED_NO_AUTH_CONNECT' -and $a.intentId -ceq $IntentId -and $a.expectedPriorFence -eq $ExpectedPriorFence -and $a.lease.token -eq ($ExpectedPriorFence+1) -and $a.deadlineAt -eq $marker.deadlineAt -and $a.unchangedExceptLease -eq $true -and $a.modelPermitReactivated -eq $false -and $a.newRmsOrigins -eq 0)
    Need ((Sha (Join-Path $out 'request-auth-v1.json')) -ceq $a.requestSha256 -and (Sha (Join-Path $out 'after-prepare.json')) -ceq $a.afterSnapshotSha256)
  } elseif ($Phase -ceq 'Connect') {
    Need ((Closed-Shape $o.summary @('status','intentId','durationMs','rmsPid','exitCode','requiresNativeClockEnvelope')) -and $o.summary.status -ceq 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY' -and $o.summary.intentId -ceq $IntentId -and $o.summary.rmsPid -gt 0 -and $o.summary.exitCode -eq 0 -and $o.summary.requiresNativeClockEnvelope -eq $true)
    Need ($a.status -ceq 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY' -and $a.intentId -ceq $IntentId -and $a.rmsPid -eq $o.summary.rmsPid -and $a.exitCode -eq 0 -and $a.workAuthority -eq $false -and $a.newRmsOrigins -eq 0 -and $a.rmsAudit -ceq 'EXACT_AUTH_SUFFIX_ONLY' -and $a.requiresNativeClockEnvelope -eq $true)
  } else { throw 'AUTH_EXTERNAL_PHASE_REFUSED' }
  $hostAfter=Host-Facts
  Need (($hostBefore | ConvertTo-Json -Compress) -ceq ($hostAfter | ConvertTo-Json -Compress))
  Pins
  $null=Remaining $marker
  $whole=([Diagnostics.Stopwatch]::GetTimestamp()-[long]::Parse($marker.clockStart))*1000.0/$frequency
  Need ($r.wholeSincePrepareMs -ge 0 -and $r.wholeSincePrepareMs -le $whole -and $whole -lt 240000)
  $outcome.status='NATIVE_AUTH_PHASE_OBSERVED'; $outcome.newRmsOrigins=0
  $outcome.credentialMayHavePersisted=($Phase -ceq 'Connect')
  $outcome.host=$hostAfter; $outcome.nativePid=$pidObserved; $outcome.nativeImagePath=$imagePath; $outcome.nativeExitCode=$exitCode
  $outcome.closed=$closed; $outcome.drained=$drained; $outcome.killRequested=$killRequested
  $outcome.observerSha256=$ExpectedObserverSha256; $outcome.mainSha256=$mainSha; $outcome.nativeBinarySha256=$nativeSha
  $outcome.prepareMarkerSha256=Sha (Join-Path $base ('prepare-'+$IntentId+'.marker.json'))
  $outcome.provisionalSha256=$message.receiptSha256; $outcome.actReadbackSha256=$r.actReadbackSha256
  $outcome.nativeChildObservation=$o; $outcome.wholeSincePrepareMs=$whole; $outcome.sourcePinsRecheckedAfter=$true
} catch {
  $outcome.status='HOLD'; $outcome.code='AUTH_EXTERNAL_OBSERVATION_REFUSED'; $outcome.newRmsOrigins=$null
  if ($started -and -not $closed) { try { $p.Kill(); $killRequested=$true } catch {} ; try { $closed=$p.WaitForExit(1000) } catch {} }
} finally {
  $outcome.durationMs=$watch.ElapsedMilliseconds
  $outcome.closed=$closed; $outcome.drained=$drained; $outcome.killRequested=$killRequested
  try { if ($null -ne $p) { $p.Dispose() } } catch { $outcome.status='HOLD'; $outcome.code='AUTH_EXTERNAL_HANDLE_DISPOSE_REFUSED' }
  Write-New $resultPath $outcome
  if ($outcome.status -ceq 'NATIVE_AUTH_PHASE_OBSERVED') {
    try { $null=Remaining $marker } catch { Write-Output '{"status":"HOLD","code":"AUTH_EXTERNAL_FINALIZATION_LATE"}'; exit 1 }
  }
  # Receipt alone is never adoptable: parent must observe this tool exit0 and
  # one matching summary, with no invalidation. No raw/private stream escapes.
  Write-Output (([ordered]@{status=$outcome.status;phase=$Phase;intentId=$IntentId;receiptSha256=(Sha $resultPath);requiresParentToolExitZero=$true;workAuthority=$false}) | ConvertTo-Json -Compress)
  if ($outcome.status -cne 'NATIVE_AUTH_PHASE_OBSERVED') { exit 1 }
}
