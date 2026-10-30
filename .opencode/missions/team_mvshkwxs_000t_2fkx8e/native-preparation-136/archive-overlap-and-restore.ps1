$ErrorActionPreference='Stop'
$old='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime'
$archive='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/evidence/overlap-163'
$base='782ec396a2a7866d30645c32ca8ab864dcca5960'
$git='C:/Program Files/Git/bin/git.exe'
$files=@(
  @{path='tools/ff8-harness/src/client.ts';name='client.ts';worker='497038644f642cee8dbd19056e85ee7dcf8c4fb8df47b2f8b657cbc743889c5d';frozen='2116b8e1638126f2b5a21f1aa4c5ba22dac07c903f2ffb0f9a970d63f6178a7c'},
  @{path='tools/ff8-harness/test/client.test.ts';name='client.test.ts';worker='6b0705fb799b64e7413803458b5e7dee73df8ed0f5f832b5c2fb9c4057c70cac';frozen='fc489e7e2f34235d4c60d89991814689802c4e53bcdc5f8541cca07863f9dd79'}
)
if(Test-Path -LiteralPath $archive){throw 'Archive exists; no overwrite or automatic retry'}
$head=(& $git -C $old rev-parse HEAD); $gitExit=$LASTEXITCODE
if($gitExit -ne 0 -or $head -ne $base){[pscustomobject]@{observedHead=$head;expectedHead=$base;gitExit=$gitExit}|ConvertTo-Json -Compress;throw 'Frozen worktree HEAD precondition not satisfied'}
$staged=(& $git -C $old diff --cached --name-only -- $files[0].path $files[1].path)
if($LASTEXITCODE -ne 0 -or $staged){throw 'Affected paths have staged changes; no restoration'}
foreach($f in $files){$h=(Get-FileHash -LiteralPath (Join-Path $old $f.path) -Algorithm SHA256).Hash.ToLowerInvariant();if($h -ne $f.worker){throw 'Worker bytes changed; no archive/restore'}}
New-Item -ItemType Directory -Path $archive | Out-Null
$saved=@()
foreach($f in $files){
  $source=Join-Path $old $f.path; $dest=Join-Path $archive $f.name
  Copy-Item -LiteralPath $source -Destination $dest -ErrorAction Stop
  $h=(Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
  $still=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
  if($h -ne $f.worker -or $still -ne $f.worker){throw 'Archive/source changed; preserve archive and do not restore'}
  $saved+=@{source=$f.path;archive=$dest;byteLength=(Get-Item -LiteralPath $dest).Length;sha256=$h}
}
$variant=@{version='rms-overlapping-worker-variant-archive-v1';baseCommit=$base;status='PRESERVED_NOT_RETAINED_NOT_TESTED';files=$saved;meaning='Worker implementation under prior two-file plan, retained before restoring historical worktree; separate parent candidate162 is the reviewed/tested correction'} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $archive 'variant.json'),$variant,[System.Text.UTF8Encoding]::new($false))
& $git -C $old restore --source=$base --worktree -- $files[0].path $files[1].path
if($LASTEXITCODE -ne 0){throw 'Exact restore failed; preserved variant remains available'}
foreach($f in $files){$h=(Get-FileHash -LiteralPath (Join-Path $old $f.path) -Algorithm SHA256).Hash.ToLowerInvariant();if($h -ne $f.frozen){throw 'Restored bytes differ from historical pin'}}
[pscustomobject]@{status='WORKER_VARIANT_ARCHIVED_OLD_TWO_FILES_RESTORED';archive=$archive;preservedFiles=$saved;restoredBase=$base;newCandidateModified=$false;nativeEffects=0} | ConvertTo-Json -Depth 5
