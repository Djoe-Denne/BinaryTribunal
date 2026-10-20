# SOURCE ONLY / UNQUALIFIED. This script has NOT been imported or executed.
# Add-Type below is proposed future qualification code, NOT current authorization.
# A separate parent GO must cover compilation artifacts, the host and each fresh request.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $RequestPath,

    [Parameter(Mandatory = $true)]
    [ValidateSet('SEPARATE_PARENT_GO_REQUIRED')]
    [string] $QualificationAcknowledgement
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSEdition -ne 'Desktop' -or
    $PSVersionTable.PSVersion.Major -ne 5 -or
    $PSVersionTable.PSVersion.Minor -ne 1 -or
    -not [Environment]::Is64BitProcess) {
    throw 'Only the proposed Windows PowerShell 5.1 x64 / existing .NET Framework host is supported. No fallback.'
}
if ('ReGraphJobSource.JobRunner' -as [type]) {
    throw 'A JobRunner type is already loaded. Refuse reuse; the parent must resolve host ownership.'
}
if ($RequestPath -cnotmatch '^[A-Za-z]:\\' -or
    -not [IO.Path]::IsPathRooted($RequestPath) -or
    [IO.Path]::GetFullPath($RequestPath) -cne $RequestPath) {
    throw 'RequestPath must be an explicit canonical absolute file path supplied by the parent.'
}
$requestFile = [IO.FileInfo]::new($RequestPath)
if (-not $requestFile.Exists -or $requestFile.Length -gt 1048576 -or
    ($requestFile.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Request must be an existing, bounded, non-reparse data file. No discovery or fallback.'
}
$ancestor = $requestFile.Directory
while ($null -ne $ancestor) {
    if ($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw 'Reparse request ancestor rejected; parent ownership must be resolved, not bypassed.'
    }
    $ancestor = $ancestor.Parent
}
$bytes = [IO.File]::ReadAllBytes($RequestPath)
if ($bytes.Length -gt 1048576 -or
    ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191)) {
    throw 'Request must be bounded strict UTF-8 without BOM.'
}
$utf8 = [Text.UTF8Encoding]::new($false, $true)
$requestJson = $utf8.GetString($bytes)
$sourcePath = [IO.Path]::Combine($PSScriptRoot, 'JobRunner.cs')
$source = [IO.File]::ReadAllText($sourcePath, $utf8)

# NOT EXECUTED HERE. The acknowledgement is an operator warning, not an authorization token.
# No output assembly, install, child PowerShell, env rewrite or alternate compiler is selected.
# Add-Type can create compiler TEMP artifacts; a future parent GO must explicitly cover them.
Add-Type -TypeDefinition $source -Language CSharp -ReferencedAssemblies @(
    'System.dll', 'System.Core.dll', 'System.Web.Extensions.dll'
) -ErrorAction Stop

# Returns a data-only JSON report. A PowerShell pipeline success is NOT tree success.
# Require status=QUIESCENT plus the parent's independent qualification/evidence checks.
[ReGraphJobSource.JobRunner]::Run($requestJson)
