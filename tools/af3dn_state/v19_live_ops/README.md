# v19_live_ops — reusable diagnostic tooling (Windows)

Source-only toolkit derived from the reviewed ops named in `provenance.json`.
The previous aborted run remains immutable. No old one-off deployment/archive
scripts, binaries, old evidence or live PASS are packaged here.

## Corrections

`quiet_process.py` centralizes owned child creation: CREATE_NO_WINDOW plus SW_HIDE,
stdin DEVNULL, shell=False. Conflicting NEW_CONSOLE/DETACHED flags are refused
because they make CREATE_NO_WINDOW ineffective. PowerShell is always launched
with -NoLogo -NoProfile -NonInteractive. Instrumentation retains its >=2s cadence;
the WER query and external hang-dump worker use the same wrapper. No subprocess
is injected into the game. Hang supervisor timeouts still never kill the target
or its capture worker. No claim of an omniscient visual-window guarantee.

`mapped_file.py` obtains K32GetMappedFileNameW(process QUERY_INFORMATION|VM_READ,
module base), or the documented psapi equivalent. It preserves the Toolhelp name
and path in `name`, `path`, `reported_path`. It opens **only** the mapped NT path
as `\\?\GLOBALROOT\Device\...`, without guessed SysWOW64/System32 replacements,
basename searches, unproven fallbacks or global WOW64-redirection changes.
GetFinalPathNameByHandleW(VOLUME_NAME_NT) records the file actually opened.
GetFileInformationByHandle and ReadFile hash **that same owned handle**, with
before/after identity/size/write checks. File handles close on every branch;
caller owns the read-only process handle. Paths use bounded dynamic buffers,
UTF16 length checks, basename/name coherence, and explicit truncation refusals.

Rows add mapped_path/resolved_path/source/hash_status/verdict/sha256/file_identity
and typed errors. SHA256 describes the disk file, NOT loaded memory. No volatile
module timestamps are published. All inventory rows survive a per-file failure.
`snapshot_native.py` writes modules.json before refusing incomplete/contradicting
rows; modules-after.json records the second inventory before comparison. A missing
mapping/file/hash is INCONCLUSIVE; contradictory basenames are FAIL. No skipped
hash or partial inventory becomes a native-backend PASS. Collectors require the
new row proof fields and VERIFIED inventory status.

The snapshot gate stays strict; an explicitly authorized forensic dump with valid
target identity is best-effort even if module proof is incomplete/contradictory:
the dump is kept/hash-bound, but its verdict remains INCONCLUSIVE/FAIL and exit 2,
never a diagnostic/promotional PASS. API failure retains any partial dump.

## Offline validation (no FF8)

Choose a **new exclusive** directory under `$env:LOCALAPPDATA/Temp/opencode`.
The prior run is read-only input, never an output. The test driver uses immutable
SELFTEST JSON fixtures plus the hash-bound archived EXE for the collector; it does
not copy or execute historical test/deployment scripts. Binary fixtures remain
in Temp only, not this source directory.

```powershell
$toolkit = Resolve-Path 'tools/af3dn_state/v19_live_ops'
$out = Join-Path "$env:LOCALAPPDATA/Temp/opencode" ('v19-toolkit-test-' + [guid]::NewGuid())
$previous = '<immutable prior evidence run>'
# Launcher pattern below guarantees the test driver also starts without console.
python -B -c "import sys; sys.path.insert(0,sys.argv[1]); import quiet_process as q; p=q.run([sys.executable,'-B',sys.argv[1]+'/tests/test_offline.py','--previous-run',sys.argv[2],'--out',sys.argv[3]]); sys.exit(p.returncode)" "$toolkit" "$previous" "$out"
```

Tests cover the precise NVIDIA reported-path failure using an authoritative NT
mock, absent mapping/read error/truncation/wrong basename and handle ownership,
partial inventories preserved before refusal, own-process real mapped-file hashes,
reported-path-absent but valid real mapping, real native/WOW64 PowerShell fixtures
with GetConsoleWindow=0, PID/FILETIME/exit identity, exact collector verdicts and
offline-to-live rejection. WOW64 unavailability is explicit, never a passing test
of unsupported coverage. All owned children use the hidden wrapper and exit
naturally. Before/after SHA manifests cover the ENTIRE previous run plus installed
rollback/configuration. Source hashes and stdout/stderr stay in the test receipt.

## Future use — requires parent review and a separately authorized NEW campaign

These commands are **not authorization** to launch, deploy, rebuild or reuse an
aborted process. Root owns arming and operator prompts. Use a fresh evidence run;
never point `--out` at historical evidence. No toolkit command deploys the DLL.

```powershell
python -B tools/af3dn_state/v19_live_ops/observe.py --live --out "$newRun/observation"
python -B tools/af3dn_state/v19_live_ops/snapshot_native.py --live --bound "$newRun/observation/bound.json" --out "$newRun/native-before"
python -B tools/af3dn_state/v19_live_ops/collect_live.py --live --run "$newRun" --out "$newRun/live-verdict.json"
```

Run the observer in a separately owned durable launcher; CREATE_NO_WINDOW can be
combined with NEW_PROCESS_GROUP/BREAKAWAY, not DETACHED/NEW_CONSOLE. Observer keeps
PID/FILETIME decimal STRING and a retained process handle until signaled exit.
Debugger checks/instrumentation are sampled, not omniscient. EXE/candidate identity
constants and default installation path are intentional policy, not auto-discovery.
Any candidate/path-policy change requires parent review, not silent substitution.

All original native RPM anchors, static-import LC18 attach reserved=1, correct
DG19 bind/unbind indices, exact windows/protections/restore, native .text Present,
residence RESTORED_RETAINED after successful activation, and no-refuse-reuse policy
remain. BD0 is observation, not ownership. The module file hashes do not replace
candidate loaded-.text readback. Incomplete evidence is not LIVE PASS; synthetic
inputs return SELFTEST only. No writer/rendering/ISO qualification is implied.
