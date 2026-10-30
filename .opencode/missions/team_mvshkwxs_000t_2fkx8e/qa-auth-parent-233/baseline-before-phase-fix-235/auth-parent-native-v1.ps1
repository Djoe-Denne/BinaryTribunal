# AUTH231 CANDIDATE. Native parent only. Prepare NEVER launches OAuth or Connect.
[CmdletBinding(PositionalBinding=$false)]
param(
  [Parameter(Mandatory=$true)][ValidateSet('Prepare','Connect')][string]$Phase,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')][string]$IntentId,
  [Parameter(Mandatory=$true)][ValidateRange(1,9007199254740990)][long]$ExpectedPriorFence,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedLauncherSha256,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedPowerShellSha256
)
$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot
$mission = [IO.Path]::GetFullPath((Join-Path $base '..'))
$hostRoot = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180'
$candidate = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198/tools/ff8-harness'
$bun = 'C:/Users/djden/.bun/bin/bun.exe'
$powershell = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
$out = Join-Path $base ('attempt-'+$IntentId)
$root = Join-Path $hostRoot ('auth-private-'+$IntentId)
$nativeProcess = $null
$createdOut = $false
$phaseStartedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$clockStart = [Diagnostics.Stopwatch]::GetTimestamp()
$frequency = [Diagnostics.Stopwatch]::Frequency
function Need([bool]$Condition) { if (-not $Condition) { throw 'AUTH_PARENT_NATIVE_REFUSED' } }
function Now-Ms { return [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
function Digest([string]$Path) {
  # Acquire the complete native result BEFORE validating or returning any hash.
  $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
  Need ($null -ne $item -and -not $item.PSIsContainer -and (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0))
  $answer = Get-FileHash -LiteralPath $Path -Algorithm SHA256 -ErrorAction Stop
  Need ($null -ne $answer -and $answer.Hash -is [string] -and $answer.Hash -match '^[A-Fa-f0-9]{64}$')
  return $answer.Hash.ToLowerInvariant()
}
function Pin([string]$Path,[string]$Expected) { Need ((Digest $Path) -ceq $Expected) }
function Write-New([string]$Path,$Value) {
  $bytes = [Text.Encoding]::UTF8.GetBytes(($Value | ConvertTo-Json -Depth 32))
  $stream = [IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}
function Closed($Value,[string[]]$Names) {
  if ($null -eq $Value) { return $false }
  $actual = if ($Value -is [Collections.IDictionary]) { @($Value.Keys) } else { @($Value.PSObject.Properties.Name) }
  return $actual.Count -eq $Names.Count -and @($Names | Where-Object { $actual -cnotcontains $_ }).Count -eq 0
}
function Native-Number($Value) {
  return (($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) -and -not [double]::IsNaN([double]$Value) -and -not [double]::IsInfinity([double]$Value))
}
function Native-Whole($Value) { return ((Native-Number $Value) -and $Value -ge 0 -and $Value -le 9007199254740991 -and [math]::Floor([double]$Value) -eq $Value) }
function Canonical-Directory([string]$Path) {
  # Reject every reparse component, not only the final private UUID directory.
  $full = [IO.Path]::GetFullPath($Path)
  $walk = [IO.Path]::GetPathRoot($full)
  foreach ($part in $full.Substring($walk.Length).Split([char]'\')) {
    if ($part.Length -eq 0) { continue }
    $walk = Join-Path $walk $part
    $item = Get-Item -LiteralPath $walk -Force -ErrorAction Stop
    Need ($null -ne $item -and $item.PSIsContainer -and (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0))
    Need ([string]::Equals($item.FullName,$walk,[StringComparison]::OrdinalIgnoreCase))
  }
}
function Read-Json([string]$Path) { return [IO.File]::ReadAllText($Path) | ConvertFrom-Json -ErrorAction Stop }
function Read-AclEvidence {
  Canonical-Directory $root
  $item = Get-Item -LiteralPath $root -Force -ErrorAction Stop
  Need ($null -ne $item -and $item.PSIsContainer -and (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0))
  Need ([string]::Equals($item.FullName,[IO.Path]::GetFullPath($root),[StringComparison]::OrdinalIgnoreCase))
  $acl = Get-Acl -LiteralPath $root -ErrorAction Stop
  Need ($null -ne $acl)
  $rules = @($acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]))
  $owner = $acl.GetOwner([Security.Principal.SecurityIdentifier]).Value
  $current = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  $allowed = @($current,'S-1-5-18','S-1-5-32-544') | Sort-Object
  Need ($acl.AreAccessRulesProtected -eq $true -and $owner -ceq $current -and $rules.Count -eq 3)
  $sids = @()
  foreach ($r in $rules) {
    Need ($null -ne $r -and -not $r.IsInherited -and $r.AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow -and $r.FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl -and $r.InheritanceFlags -eq ([Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit) -and $r.PropagationFlags -eq [Security.AccessControl.PropagationFlags]::None)
    $sids += $r.IdentityReference.Value
  }
  Need ((($sids | Sort-Object) -join '|') -ceq ($allowed -join '|'))
  return [ordered]@{protected=$true;ownerSid=$owner;allowSids=@($allowed);allowOnly=$true;inheritable=$true;reparsePoint=$false;nativeReadback=$true}
}
function Create-PrivateRoot {
  Need (-not (Test-Path -LiteralPath $root))
  Need ([Environment]::Is64BitProcess)
  $security = [System.Security.AccessControl.DirectorySecurity]::new()
  $user = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $security.SetOwner($user)
  $security.SetAccessRuleProtection($true,$false)
  $flags = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
  foreach ($sid in @($user,[System.Security.Principal.SecurityIdentifier]::new('S-1-5-18'),[System.Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'))) {
    $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($sid,[Security.AccessControl.FileSystemRights]::FullControl,$flags,[Security.AccessControl.PropagationFlags]::None,[Security.AccessControl.AccessControlType]::Allow)
    $security.AddAccessRule($rule)
  }
  # Reflection.Emit P/Invoke is IN MEMORY: no Add-Type/compiler/temp DLL/process.
  # CreateDirectoryW returns false for a preexisting target: NEVER adopt/repair it.
  $an = [System.Reflection.AssemblyName]::new('Auth231Native'+[Guid]::NewGuid().ToString('N'))
  $ab = [AppDomain]::CurrentDomain.DefineDynamicAssembly($an,[Reflection.Emit.AssemblyBuilderAccess]::Run)
  $mb = $ab.DefineDynamicModule('NativeInMemory')
  $tb = $mb.DefineType('Auth231CreateDirectory',[Reflection.TypeAttributes]::Public -bor [Reflection.TypeAttributes]::Sealed)
  $attrs = [Reflection.MethodAttributes]::Public -bor [Reflection.MethodAttributes]::Static -bor [Reflection.MethodAttributes]::PinvokeImpl
  $method = $tb.DefinePInvokeMethod('CreateDirectoryW','kernel32.dll',$attrs,[Reflection.CallingConventions]::Standard,[bool],[Type[]]@([string],[IntPtr]),[Runtime.InteropServices.CallingConvention]::Winapi,[Runtime.InteropServices.CharSet]::Unicode)
  $method.SetImplementationFlags([Reflection.MethodImplAttributes]::PreserveSig)
  $native = $tb.CreateType()
  $descriptor = $security.GetSecurityDescriptorBinaryForm()
  $sd = [Runtime.InteropServices.Marshal]::AllocHGlobal($descriptor.Length)
  $sa = [Runtime.InteropServices.Marshal]::AllocHGlobal(24)
  try {
    [Runtime.InteropServices.Marshal]::Copy($descriptor,0,$sd,$descriptor.Length)
    for ($i=0;$i -lt 24;$i++) { [Runtime.InteropServices.Marshal]::WriteByte($sa,$i,0) }
    [Runtime.InteropServices.Marshal]::WriteInt32($sa,0,24)
    [Runtime.InteropServices.Marshal]::WriteIntPtr($sa,8,$sd)
    $created = $native.GetMethod('CreateDirectoryW').Invoke($null,[object[]]@([IO.Path]::GetFullPath($root),$sa))
    Need ($created -eq $true)
  } finally { [Runtime.InteropServices.Marshal]::FreeHGlobal($sa); [Runtime.InteropServices.Marshal]::FreeHGlobal($sd) }
  return (Read-AclEvidence)
}
function Remaining-Ms($Marker) {
  Need ((Closed $Marker @('version','intentId','expectedPriorFence','preparedAt','deadlineAt','clockStart','clockDeadline','clockFrequency')) -and (Native-Whole $Marker.preparedAt) -and (Native-Whole $Marker.deadlineAt) -and $Marker.clockFrequency -is [string] -and $Marker.clockStart -is [string] -and $Marker.clockDeadline -is [string])
  Need ($Marker.preparedAt -le (Now-Ms) -and $Marker.deadlineAt -eq ($Marker.preparedAt+240000))
  Need ($Marker.clockFrequency -cmatch '^[1-9][0-9]*$' -and $Marker.clockStart -cmatch '^[0-9]+$' -and $Marker.clockDeadline -cmatch '^[0-9]+$')
  $f = [long]::Parse($Marker.clockFrequency); $s = [long]::Parse($Marker.clockStart); $d = [long]::Parse($Marker.clockDeadline)
  $n = [Diagnostics.Stopwatch]::GetTimestamp()
  Need ($f -eq [Diagnostics.Stopwatch]::Frequency -and $n -ge $s -and $d -eq ($s+$f*240))
  $ms = [math]::Min(($d-$n)*1000.0/$f,$Marker.deadlineAt-(Now-Ms))
  Need ($ms -gt 0 -and $ms -le 240000)
  return [int][math]::Floor($ms)
}
function Invoke-BunAct([string]$File,[string[]]$Arguments,[int]$LimitMs) {
  $si = New-Object Diagnostics.ProcessStartInfo
  $si.FileName = $bun
  $si.Arguments = 'run "'+$File+'" '+($Arguments -join ' ')
  $si.WorkingDirectory = $base; $si.UseShellExecute = $false; $si.CreateNoWindow = $true
  $si.RedirectStandardOutput = $true; $si.RedirectStandardError = $true
  $si.EnvironmentVariables.Clear()
  foreach ($entry in @{SystemRoot='C:/Windows';WINDIR='C:/Windows';ComSpec='C:/Windows/System32/cmd.exe';OS='Windows_NT';PATH='C:/Users/djden/.bun/bin;C:/Windows/System32';TEMP='C:/Users/djden/AppData/Local/Temp/opencode';TMP='C:/Users/djden/AppData/Local/Temp/opencode'}.GetEnumerator()) { $si.EnvironmentVariables[$entry.Key] = $entry.Value }
  $p = New-Object Diagnostics.Process; $p.StartInfo = $si; $script:nativeProcess = $p
  Need ($p.Start())
  $stdoutTask = $p.StandardOutput.ReadToEndAsync(); $stderrTask = $p.StandardError.ReadToEndAsync()
  $wait = [math]::Min($LimitMs,(Remaining-Ms $script:marker))
  $exited = $p.WaitForExit([int]$wait)
  if (-not $exited) { try { $p.Kill() } catch {} ; $null = $p.WaitForExit(1000); throw 'AUTH_NATIVE_ACT_TIMEOUT' }
  Need ($p.HasExited)
  $exitCode = $p.ExitCode # only AFTER observed native exit
  Need ($stdoutTask.Wait(1000) -and $stderrTask.Wait(1000))
  $stdout = $stdoutTask.GetAwaiter().GetResult(); $stderr = $stderrTask.GetAwaiter().GetResult()
  Need ($exitCode -eq 0 -and $stderr.Length -eq 0 -and $stdout.Length -gt 0 -and $stdout.Length -le 1048576)
  $summary = $stdout.Trim() | ConvertFrom-Json -ErrorAction Stop
  Need ($summary.status -is [string] -and $summary.intentId -is [string])
  if ($Phase -ceq 'Prepare') {
    Need (Closed $summary @('status','intentId','fence','expiresAt','newRmsOrigins'))
    Need ((Native-Whole $summary.fence) -and (Native-Whole $summary.expiresAt) -and (Native-Whole $summary.newRmsOrigins))
    Need ($summary.status -ceq 'PREPARED_NO_AUTH_CONNECT' -and $summary.intentId -ceq $IntentId -and $summary.fence -eq ($ExpectedPriorFence+1) -and $summary.expiresAt -eq $script:marker.deadlineAt -and $summary.newRmsOrigins -eq 0)
  } else {
    Need (Closed $summary @('status','intentId','durationMs','rmsPid','exitCode','requiresNativeClockEnvelope'))
    Need ((Native-Number $summary.durationMs) -and (Native-Whole $summary.rmsPid) -and (Native-Whole $summary.exitCode) -and $summary.requiresNativeClockEnvelope -is [bool])
    Need ($summary.status -ceq 'AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY' -and $summary.intentId -ceq $IntentId -and $summary.durationMs -ge 0 -and $summary.durationMs -le 240000 -and $summary.rmsPid -gt 0 -and $summary.exitCode -eq 0 -and $summary.requiresNativeClockEnvelope -eq $true)
  }
  $null = Remaining-Ms $script:marker
  return [ordered]@{pid=$p.Id;exitCode=$exitCode;closed=$true;stdoutDrainObserved=$true;stderrDrainObserved=$true;summary=$summary;environmentInherited=$false;nativeProcessStartInfo=$true}
}
try {
  Pin $PSCommandPath $ExpectedLauncherSha256
  Pin $bun '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4'
  Pin $powershell $ExpectedPowerShellSha256
  Pin (Join-Path $base 'prepare-auth-controller-v1.mjs') '01fa116885f974bc5592c6e47edcd05578a35c30fa0cb84fbfad1d5cb53c4e95'
  Pin (Join-Path $base 'receive-auth-parent-v1.mjs') 'dcc9da265ef5174f90352153255b4424b24a7344e5497ceaafabe00bb963452c'
  $pins = @{
    'src/client.ts'='7266a3affea1caa06b481b721e0c8ac1209166d997673652b6a93a4fffd5ae71';'src/native-runtime-transport.ts'='79dd1ef42162a3780eee9926167cc509f3dee96a4becda4c495f048880ac6f39';
    'src/graph-runtime-binding.ts'='cbe0c5a9f56dde4ffe35eaa5d7290c5f24098ff64e7d6df7d70f6d6f520ea67e';'src/graph-store.ts'='8969c150273f3ec1b87fe66153c2fd48c5a825d32278e2e9c7d9dd3f523fb146';
    'test/client.test.ts'='c64568d2e8e309b36ad4036a545353dc58e27d76c884ad2dd9b13ffcdbc761fd';'test/runtime-binding.test.ts'='3137556b476897ad421697b994a97aa53ef614515a89530958f30c4d3d6eb41c'
  }
  foreach ($entry in $pins.GetEnumerator()) { Pin (Join-Path $candidate $entry.Key) $entry.Value }
  Pin (Join-Path $mission 'auth-parent-225/private-ui-relay-v1.mjs') '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053'
  Pin (Join-Path $mission 'auth-parent-225/private-ui-window-v1.ps1') '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f'
  Canonical-Directory $hostRoot
  Canonical-Directory $base
  if ($Phase -ceq 'Prepare') {
    $script:marker = [ordered]@{version='rms-auth-native-prepare-marker-v1';intentId=$IntentId;expectedPriorFence=$ExpectedPriorFence;preparedAt=$phaseStartedAt;deadlineAt=$phaseStartedAt+240000;
      clockStart=$clockStart.ToString();clockDeadline=($clockStart+$frequency*240).ToString();clockFrequency=$frequency.ToString()}
    Write-New (Join-Path $base ('prepare-'+$IntentId+'.marker.json')) $script:marker
    Need (-not (Test-Path -LiteralPath $out)); $null = [IO.Directory]::CreateDirectory($out); $createdOut = $true
    foreach ($file in @(@{Name='bootstrap-auth-v1.mjs';Hash='398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76'},@{Name='host-plan-auth-v1.json';Hash='2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880'})) {
      $source = Join-Path $mission ('auth-bootstrap-222/'+$file.Name); $target = Join-Path $hostRoot $file.Name
      Pin $source $file.Hash
      Write-New (Join-Path $out ('deploy-'+$file.Name+'.marker.json')) @{effect='CREATE_NEW_REVIEWED_AUTH_SOURCE';sha256=$file.Hash;intentId=$IntentId}
      $bytes = [IO.File]::ReadAllBytes($source)
      $stream = [IO.File]::Open($target,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
      try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
      Pin $target $file.Hash
    }
    Write-New (Join-Path $out 'root-allocation.marker.json') @{effect='CREATE_EXCLUSIVE_PROTECTED_AUTH_ROOT';intentId=$IntentId}
    $aclBefore = Create-PrivateRoot
    Need (@(Get-ChildItem -LiteralPath $root -Force -ErrorAction Stop).Count -eq 0)
    Write-New (Join-Path $out 'acl-before.json') $aclBefore
    Write-New (Join-Path $out 'prepare-native.marker.json') @{effect='EXPLICIT_CONTROLLER_LEASE_300S_ONLY';intentId=$IntentId;expectedPriorFence=$ExpectedPriorFence}
    $observed = Invoke-BunAct (Join-Path $base 'prepare-auth-controller-v1.mjs') @($IntentId,$ExpectedPriorFence.ToString()) 30000
    $actReadbackHash = Digest (Join-Path $out 'controller-act.json')
  } else {
    $script:marker = Read-Json (Join-Path $base ('prepare-'+$IntentId+'.marker.json'))
    Need ($script:marker.version -ceq 'rms-auth-native-prepare-marker-v1' -and $script:marker.intentId -ceq $IntentId -and $script:marker.expectedPriorFence -eq $ExpectedPriorFence)
    $remaining = Remaining-Ms $script:marker
    $act = Read-Json (Join-Path $out 'controller-act.json')
    Need ($act.status -ceq 'PREPARED_NO_AUTH_CONNECT' -and $act.intentId -ceq $IntentId -and $act.expectedPriorFence -eq $ExpectedPriorFence -and $act.deadlineAt -eq $script:marker.deadlineAt)
    Pin (Join-Path $out 'request-auth-v1.json') $act.requestSha256
    Pin (Join-Path $out 'after-prepare.json') $act.afterSnapshotSha256
    Pin (Join-Path $hostRoot 'bootstrap-auth-v1.mjs') '398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76'
    Pin (Join-Path $hostRoot 'host-plan-auth-v1.json') '2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880'
    $aclBefore = Read-AclEvidence
    Need (@(Get-ChildItem -LiteralPath $root -Force -ErrorAction Stop).Count -eq 0)
    Write-New (Join-Path $base ('connect-'+$IntentId+'.marker.json')) @{version='rms-auth-native-connect-marker-v1';intentId=$IntentId;powerShellSha256=$ExpectedPowerShellSha256;remainingMs=$remaining}
    Write-New (Join-Path $out 'acl-connect-before.json') $aclBefore
    $observed = Invoke-BunAct (Join-Path $base 'receive-auth-parent-v1.mjs') @($IntentId,(Remaining-Ms $script:marker).ToString(),$ExpectedPowerShellSha256) (Remaining-Ms $script:marker)
    $actReadbackHash = Digest (Join-Path $out 'FINALOUTCOME.json')
  }
  # Entire native ACL acquisition must succeed before any acceptance projection.
  $aclAfter = Read-AclEvidence
  Need (($aclAfter | ConvertTo-Json -Compress -Depth 8) -ceq ($aclBefore | ConvertTo-Json -Compress -Depth 8))
  Write-New (Join-Path $out ('acl-'+$Phase.ToLowerInvariant()+'-after.json')) $aclAfter
  Pin $PSCommandPath $ExpectedLauncherSha256
  Pin $bun '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4'
  Pin $powershell $ExpectedPowerShellSha256
  Pin (Join-Path $base 'prepare-auth-controller-v1.mjs') '01fa116885f974bc5592c6e47edcd05578a35c30fa0cb84fbfad1d5cb53c4e95'
  Pin (Join-Path $base 'receive-auth-parent-v1.mjs') 'dcc9da265ef5174f90352153255b4424b24a7344e5497ceaafabe00bb963452c'
  foreach ($entry in $pins.GetEnumerator()) { Pin (Join-Path $candidate $entry.Key) $entry.Value }
  Pin (Join-Path $mission 'auth-parent-225/private-ui-relay-v1.mjs') '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053'
  Pin (Join-Path $mission 'auth-parent-225/private-ui-window-v1.ps1') '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f'
  Pin (Join-Path $hostRoot 'bootstrap-auth-v1.mjs') '398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76'
  Pin (Join-Path $hostRoot 'host-plan-auth-v1.json') '2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880'
  $null = Remaining-Ms $script:marker
  $receipt = [ordered]@{version='rms-auth-native-parent-provisional-v1';status='PROVISIONAL_NOT_ADOPTABLE';phase=$Phase;intentId=$IntentId;scriptSha256=$ExpectedLauncherSha256;
    nativeProcessStartInfo=$true;environmentInherited=$false;observation=$observed;actReadbackSha256=$actReadbackHash;aclReadbacksMatched=$true;wholeSincePrepareMs=([Diagnostics.Stopwatch]::GetTimestamp()-[long]::Parse($script:marker.clockStart))*1000.0/$frequency;
    requiresExternalNativeExitAndWholeDuration=$true;automaticRetry=$false;newRmsOrigins=0;workAuthority=$false;resourcesReleased='NOT_INFERRED'}
  $receiptPath = Join-Path $out ('native-'+$Phase.ToLowerInvariant()+'-provisional.json')
  Write-New $receiptPath $receipt
  $receiptHash = Digest $receiptPath
  $null = Remaining-Ms $script:marker
  Write-Output (([ordered]@{status='NATIVE_PARENT_PHASE_CANDIDATE';phase=$Phase;intentId=$IntentId;receiptSha256=$receiptHash;requiresExternalNativeReceipt=$true;newRmsOrigins=0;workAuthority=$false}) | ConvertTo-Json -Compress)
} catch {
  if ($null -ne $nativeProcess) { try { if (-not $nativeProcess.HasExited) { $nativeProcess.Kill(); $null=$nativeProcess.WaitForExit(1000) } } catch {} }
  Write-Output (([ordered]@{status='HOLD';code='AUTH_NATIVE_PARENT_REFUSED';phase=$Phase;intentId=$IntentId;automaticRetry=$false;compensation=$false;resourcesReleased='NOT_INFERRED'}) | ConvertTo-Json -Compress)
  exit 1
} finally { if ($null -ne $nativeProcess) { try { $nativeProcess.Dispose() } catch {
  Write-Output (([ordered]@{status='HOLD';code='AUTH_NATIVE_HANDLE_DISPOSE_REFUSED';phase=$Phase;intentId=$IntentId;automaticRetry=$false}) | ConvertTo-Json -Compress)
  exit 1
} } }
