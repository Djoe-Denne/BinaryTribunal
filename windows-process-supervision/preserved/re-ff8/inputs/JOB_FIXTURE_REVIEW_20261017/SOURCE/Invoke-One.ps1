# SOURCE ONLY. Never imported or executed during this delivery.
# Describe is data-only. Prepare writes a future owned root and needs its own preparation GO.
# Run deliberately remains HOLD: no helper DLL read/load, Add-Type, compiler, or child PowerShell.
# An acknowledgement parameter is NOT an authorization token or a substitute for a parent GO.
[CmdletBinding()]
param(
    [ValidateSet('Describe', 'Prepare', 'Run')]
    [string] $Action = 'Describe',
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 8)]
    [int] $CaseId,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{32}$')]
    [string] $Nonce,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{64}$')]
    [string] $ExpectedManifestSha256,
    [string] $FixtureExe,
    [string] $ExpectedFixtureSha256,
    [ValidateSet('FUTURE_PREPARATION_GO_REQUIRED')]
    [string] $PreparationAcknowledgement
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$utf8 = [Text.UTF8Encoding]::new($false, $true)
$rootPrefix = 'C:\Users\djden\AppData\Local\Temp\opencode\JQ-'
$root = $rootPrefix + $Nonce + '-C' + $CaseId
$helperDllSha256 = 'b36aa7c7d0b58e6af9ca734d636920cb901df1d084f13511eca037faee213ab5'
$script:written = 0

function Require([bool] $Condition, [string] $Reason) {
    if (-not $Condition) { throw $Reason }
}

function Assert-OrdinaryPath([string] $Path) {
    Require ($null -ne $Path -and $Path.Length -lt 260 -and $Path -cmatch '^[A-Za-z]:\\[A-Za-z0-9_\\.\-]+$') 'Canonical ASCII local path required.'
    Require ([IO.Path]::GetFullPath($Path) -ceq $Path) 'Noncanonical path refused.'
    # No wildcard resolution, discovery, symlink fallback, or change to any path is attempted.
}

function Assert-ExistingNoReparse([string] $Path, [bool] $Directory) {
    Assert-OrdinaryPath $Path
    $a = [IO.File]::GetAttributes($Path)
    Require (($a -band [IO.FileAttributes]::ReparsePoint) -eq 0) 'Reparse input refused.'
    Require ((($a -band [IO.FileAttributes]::Directory) -ne 0) -eq $Directory) 'Wrong input kind.'
    $d = if ($Directory) { [IO.DirectoryInfo]::new($Path) } else { [IO.FileInfo]::new($Path).Directory }
    while ($null -ne $d) {
        Require ($d.Exists -and ($d.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) 'Reparse/missing ancestor refused.'
        $d = $d.Parent
    }
}

function Read-Bounded([string] $Path, [int] $Max) {
    Assert-ExistingNoReparse $Path $false
    $f = [IO.FileStream]::new($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
    try {
        Require ($f.Length -gt 0 -and $f.Length -le $Max) 'Input byte bound exceeded.'
        $bytes = [byte[]]::new([int] $f.Length)
        $at = 0
        while ($at -lt $bytes.Length) {
            $n = $f.Read($bytes, $at, $bytes.Length - $at)
            Require ($n -gt 0) 'Truncated input.'
            $at += $n
        }
        Require ($f.ReadByte() -eq -1) 'Input grew during read.'
        return ,$bytes
    } finally { $f.Dispose() }
}

function Digest([byte[]] $Bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Emit-Small([object] $Value) {
    $text = (ConvertTo-Json -InputObject $Value -Depth 8 -Compress) + [char]10
    $bytes = $utf8.GetBytes($text)
    # Guard the actual complete UTF-8 bytes BEFORE emitting, independent of the console's encoding.
    Require ($bytes.Length -lt 2800) 'Stdout cap exceeded.'
    $output = [Console]::OpenStandardOutput()
    try { $output.Write($bytes, 0, $bytes.Length); $output.Flush() }
    finally { $output.Dispose() }
}

function Write-New([string] $Name, [byte[]] $Bytes, [int] $Max) {
    Require ($Name -cmatch '^[A-Za-z0-9_.-]+$') 'Fixed single-component output required.'
    Require ($Bytes.Length -le $Max -and ($script:written + $Bytes.Length) -le 32768) 'Preparation byte budget exceeded.'
    $script:written += $Bytes.Length
    $path = [IO.Path]::Combine($root, $Name)
    $f = [IO.FileStream]::new($path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $f.Write($Bytes, 0, $Bytes.Length); $f.Flush($true) }
    finally { $f.Dispose() }
}

function Json-Bytes([object] $Value) {
    return ,$utf8.GetBytes((ConvertTo-Json -InputObject $Value -Depth 8 -Compress))
}

# Only these new delivery files are read here. A caller must pin MANIFEST externally, never trust self-hashes.
$manifestPath = [IO.Path]::Combine($PSScriptRoot, 'MANIFEST.json')
$manifestBytes = Read-Bounded $manifestPath 16384
Require ((Digest $manifestBytes) -ceq $ExpectedManifestSha256) 'External manifest pin mismatch.'
$manifest = ConvertFrom-Json -InputObject ($utf8.GetString($manifestBytes))
Require ($manifest.schema -ceq 'independent-job-fixture-source-v1') 'Wrong source manifest.'
$seen = @{}
foreach ($entry in $manifest.deliveryFiles) {
    Require (@('Fixture.cs', 'Invoke-One.ps1', 'QUALIFICATION_PLAN.md') -ccontains $entry.path) 'Unexpected delivery entry.'
    Require (-not $seen.ContainsKey($entry.path)) 'Duplicate delivery entry.'
    $seen[$entry.path] = $true
    $content = Read-Bounded ([IO.Path]::Combine($PSScriptRoot, $entry.path)) 65536
    Require ($content.Length -eq $entry.bytes -and (Digest $content) -ceq $entry.sha256) 'Delivery source pin mismatch.'
}
Require (@($manifest.deliveryFiles).Count -eq 3) 'Exactly three externally manifested source/doc files required.'

if ($CaseId -eq 8) {
    Emit-Small ([ordered]@{ caseId = 8; status = 'HOLD_REFERENCE_NOT_IMPLEMENTED'; runAllowed = $false; reason = 'No pinned breakaway reference/independent control oracle; parent decision 23:38:17.712Z.' })
    return
}

if ($Action -eq 'Run') {
    # Fail closed, BEFORE reading a DLL, loading an assembly, calling JobRunner.Run, or starting anything.
    # This helper permits up to 64MiB of events; the mission permits only 256KiB/case.
    # An observer flag/receipt alone is NOT an implemented hard aggregate write bound.
    Emit-Small ([ordered]@{
        caseId = $CaseId; status = 'HOLD_RUN_CONTROL_NOT_IMPLEMENTED'; runAllowed = $false
        reasons = @('aggregate helper-log bound not enforced by this source', 'independent parent observation/owned launcher handle not bound')
        helperDllSha256AsDataOnly = $helperDllSha256
    })
    return
}

if ($Action -eq 'Describe') {
    Emit-Small ([ordered]@{ caseId = $CaseId; status = 'PROPOSAL_SOURCE_ONLY'; prospectiveRoot = $root; maxFixtureProcesses = 3; selfExpiryMs = 14000; maxCaseBytes = 262144; runAllowed = $false })
    return
}

Require ($PreparationAcknowledgement -ceq 'FUTURE_PREPARATION_GO_REQUIRED') 'Separate future preparation GO required; parameter is only a warning.'
Require ($PSVersionTable.PSEdition -ceq 'Desktop' -and $PSVersionTable.PSVersion.Major -eq 5 -and
         $PSVersionTable.PSVersion.Minor -eq 1 -and [Environment]::Is64BitProcess) 'Only pinned future PS5.1 x64 route; no fallback.'
Require ($ExpectedFixtureSha256 -cmatch '^[0-9a-f]{64}$') 'Future compiled fixture pin required.'
Require ($FixtureExe.EndsWith('.exe', [StringComparison]::OrdinalIgnoreCase)) 'Direct fixture exe required.'
$fixtureBytes = Read-Bounded $FixtureExe 131072
Require ((Digest $fixtureBytes) -ceq $ExpectedFixtureSha256) 'Future fixture exe pin mismatch.'
Assert-OrdinaryPath $root
$parent = [IO.Path]::GetDirectoryName($root)
Assert-ExistingNoReparse $parent $true
Require (-not [IO.Directory]::Exists($root) -and -not [IO.File]::Exists($root)) 'Fresh root required; no cleanup/retry/reuse.'

# Parent must reserve this exact nonce/root before execution. Directory creation is NOT a hostile-host ownership proof.
[void] [IO.Directory]::CreateDirectory($root)
Assert-ExistingNoReparse $root $true
$owner = [ordered]@{
    schema = 'independent-job-fixture-owner-v1'; owner = 'job-fixture-source-r1'
    nonce = $Nonce; root = $root; caseId = $CaseId
    fixtureSha256 = $ExpectedFixtureSha256; manifestSha256 = $ExpectedManifestSha256
    createdUtc = [DateTime]::UtcNow.ToString('O'); parentExclusiveReservationRequired = $true
}
Write-New 'OWNER.json' (Json-Bytes $owner) 4096

$mode = switch ($CaseId) { 1 { 'refusal-canary' } 2 { 'solo' } 3 { 'tree-root' } 4 { 'orphan-root' } 5 { 'timeout-root' } 6 { 'timeout-root' } 7 { '' } }
[object[]] $argv = @($mode, $root, $Nonce)
if ($CaseId -eq 2) {
    $unicode = ([string] [char] 0x03a9) + ([string] [char] 0x6f22) + ([string] [char] 0x5b57) + [char]::ConvertFromUtf32(0x1f600)
    $argv += @('', 'space value', 'quote"inside', 'tail\', $unicode)
}
$exe = $FixtureExe
if ($CaseId -eq 7) {
    # A fresh inert .exe data file, never a copied helper/project binary. No presumed Win32 error number.
    Write-New 'inert.exe' ($utf8.GetBytes('NOT A PE IMAGE')) 32
    $exe = [IO.Path]::Combine($root, 'inert.exe')
    $argv = @()
}
$deadline = switch ($CaseId) { 1 { 3000 } 2 { 3000 } 3 { 8000 } 4 { 8000 } 5 { 2000 } 6 { 12000 } 7 { 3000 } }
# The explicit child environment is new request DATA, not a modification/clearing of the host environment.
# Entries are sorted, unique ignoring case, double-NUL terminated, and contain no inherited secrets.
$environmentBlock = 'JQ_SENTINEL=sentinel-' + $Nonce + [char]0 + 'SystemRoot=C:\Windows' + [char]0 +
                    'TEMP=' + $root + [char]0 + 'TMP=' + $root + [char]0 + [char]0
$request = [ordered]@{
    executable = $exe; arguments = $argv; workingDirectory = $root; environmentBlock = $environmentBlock
    limits = [ordered]@{ activeProcessLimit = $(if ($CaseId -eq 1) { 7 } else { 8 }); jobCommitBytes = [long]4294967296; deadlineMilliseconds = $deadline; cleanupMilliseconds = 30000 }
    logs = [ordered]@{ stdout = [IO.Path]::Combine($root, 'stdout.log'); stderr = [IO.Path]::Combine($root, 'stderr.log'); events = [IO.Path]::Combine($root, 'events.jsonl'); result = [IO.Path]::Combine($root, 'result.json') }
}
$requestBytes = Json-Bytes $request
Write-New 'request.json' $requestBytes 16384
Write-New 'proposal.json' (Json-Bytes ([ordered]@{
    caseId = $CaseId; nonce = $Nonce; root = $root; requestSha256 = Digest $requestBytes
    status = 'PREPARED_DATA_ONLY_NOT_RUN'; helperDllSha256AsDataOnly = $helperDllSha256
    helperAssemblyNeverReadOrLoadedByThisScript = $true; runControlStillHold = $true
})) 4096
Emit-Small ([ordered]@{ caseId = $CaseId; status = 'PREPARED_DATA_ONLY_NOT_RUN'; root = $root; writtenBytes = $script:written; requestSha256 = Digest $requestBytes; runAllowed = $false })
