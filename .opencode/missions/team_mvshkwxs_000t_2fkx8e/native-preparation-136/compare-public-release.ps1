$ErrorActionPreference = 'Stop'
$dir = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-build-provenance-157'
$url = 'https://github.com/anomalyco/opencode/releases/download/v2.2.1/opencode-windows-x64.zip'
$zipSha = 'f763730ec903064997dbf7260a86e5130d3ce7696da5c12c69b6bc4472d0956b'
$binarySha = '9ecb888ec3b28a393782269f531d1528ea21ff940f694752717e48a77b90527e'
$start = [DateTime]::UtcNow
if (Test-Path -LiteralPath $dir) { throw 'Owned namespace already exists; preserve it, no implicit retry' }
New-Item -ItemType Directory -Path $dir | Out-Null
$archive = Join-Path $dir 'opencode-windows-x64.zip'
try {
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $archive -TimeoutSec 540
  $file = Get-Item -LiteralPath $archive
  $actualZipSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
  if ($file.Length -ne 118660594 -or $actualZipSha -ne $zipSha) { throw 'Public archive differs from observed release digest/size' }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
  try {
    $entries = @($zip.Entries | Where-Object { $_.Name -match '\.exe$' })
    if ($entries.Count -ne 1) { throw 'Expected exactly one executable entry; no extraction or execution' }
    $entry = $entries[0]
    if ($entry.Length -gt 300000000 -or $entry.Length -lt 1) { throw 'Executable entry length outside diagnostic bound' }
    $stream = $entry.Open()
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try { $entrySha = ([BitConverter]::ToString($hasher.ComputeHash($stream))).Replace('-','').ToLowerInvariant() }
    finally { $hasher.Dispose(); $stream.Dispose() }
    $result = [pscustomobject]@{
      version='rms-public-release-binary-comparison-v1'; observedAtUtc=[DateTime]::UtcNow.ToString('o')
      releaseTag='v2.2.1'; releaseCommit='3ebcf9a32c7b28f658cfee80775448929361727a'
      archivePath=$archive; publicUrl=$url; archiveByteLength=$file.Length; archiveSha256=$actualZipSha
      entryName=$entry.FullName; entryByteLength=$entry.Length; entrySha256=$entrySha
      installedBinarySha256=$binarySha; binaryBytesMatch=($entrySha -eq $binarySha -and $entry.Length -eq 253347720)
      durationMs=([DateTime]::UtcNow-$start).TotalMilliseconds
      executableExtracted=$false; executableLaunched=$false; installationChanged=$false
      sourceEquivalenceOrReproducibleBuildProven=$false
    }
    $utf8 = $result | ConvertTo-Json -Depth 5
    $receipt = Join-Path $dir 'comparison.json'
    [System.IO.File]::WriteAllText($receipt,$utf8,[System.Text.UTF8Encoding]::new($false))
    $utf8
    if (-not $result.binaryBytesMatch) { exit 2 }
  } finally { $zip.Dispose() }
} catch {
  [pscustomobject]@{ status='PUBLIC_RELEASE_COMPARISON_FAILED_PRESERVE_PARTIAL'; error=$_.Exception.Message; archivePath=$archive; durationMs=([DateTime]::UtcNow-$start).TotalMilliseconds } | ConvertTo-Json -Compress
  exit 1
}
