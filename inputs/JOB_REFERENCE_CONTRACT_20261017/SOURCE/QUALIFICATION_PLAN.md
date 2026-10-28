# Independent harmless Job fixtures — SOURCE ONLY / NOT QUALIFIED

## Authority and delivery

Task `task_mvblq60r_0022_ets38w`, fresh author session
`ses_eb8f18c6cffeen68TV3OAQdd73`, build / openai / gpt-6.1-sol / max.
Parent approved actual complete access, then source-only GO **23:36:40.636Z**
under `PARENT/SCOPE.md` SHA256
`681d62fe637081646b2ba4fd48acc723d82491d9a189f0657ea7ecd1c5e20fc7`.
The **23:38:17.712Z** parent decision explicitly holds case 8 only, without a
waiver or presumed OS refusal. These times describe parent messages, not runs.

Only these four new files belong to this delivery: `Fixture.cs`,
`Invoke-One.ps1`, this plan, and `MANIFEST.json`. The manifest pins the first
three; the parent must pin the manifest externally. None was compiled, imported,
loaded, or run. No fixture/process/test, Win32 Job call, TEMP root, port, DB,
package, Git operation, or source/helper/project/test/config change is authorized
by the delivery. The helper source was read only as immutable interface DATA,
not copied as an oracle or reimplemented. No other context, URL, index, or source
was consulted. Normal Context Mode text scratch is the sole tooling exception.

**Current status is a source proposal, not eight-case qualification.** Independent
review, a separate fixture-compilation GO, harmless host qualification, concrete
per-run ownership/budget/control bindings, and separate final run GOs remain
mandatory. Full44, L9/L10/main, native FF8/IDA, and integration remain closed.

## What is implemented; what is deliberately not

`Fixture.cs` is a single .NET Framework console executable with fixed CLI modes.
It has no helper assembly reference, Job PInvoke, breakaway constant, kill API,
shell/script launch, network, package, environment dump, cleanup, retry spawn, or
directory discovery. It launches only its own absolute ASCII executable. Modes
cannot choose an arbitrary child executable or arbitrary output filename.

Fixed tree shapes are one solo/canary process; root + child; or root + child +
leaf. Only root/child modes spawn, once each. Maximum fixture population is
therefore three, including a child surviving its root. A dedicated background
thread exits its own process with code 124 at 14 seconds from class startup;
ordinary waits/dwells are shorter, at most 12 seconds. There is no daemon/retry.
The 14-second mechanism is a source-level self-expiry design with margin below
15 seconds, not a measured hard-real-time guarantee during OS/CLR starvation,
blocked termination, malicious instrumentation, or host failure. Such failure
requires HOLD, not a claim that the limit was demonstrated.

`Invoke-One.ps1` has three proposed future modes. **Do not invoke it now.**

- `Describe`: verifies this delivery against an externally supplied manifest
  pin; emits bounded proposal DATA only. No fixture/DLL read or process launch.
- `Prepare`: only after a separate future preparation GO, verifies the future
  fixture EXE pin, creates the exact new case root and CREATE_NEW data files.
  It does not load/read the helper DLL or run any executable.
- `Run`: deliberately returns `HOLD_RUN_CONTROL_NOT_IMPLEMENTED` before any
  DLL read/load/helper call/process launch. This is a real fail-closed gate,
  not a parameter which can be toggled to bypass review. The present delivery
  is **not** a completed native run controller.

Two material control gaps are explicit. The helper's supplied event allowance
is 64 MiB, whereas this mission permits **256 KiB total written per case**.
Fixture/data bounds alone cannot enforce that aggregate. Polling file sizes or
checking a receipt/boolean is not a hard byte quota. Also, an independent parent
observer and an exact owned-launcher-handle termination route are not supplied
by this source delivery. Case 6 specifically needs the latter. These gaps keep
all real runs closed. A later reviewed, explicitly authorized implementation
must satisfy the existing limits, not waive them or silently raise them.

## Root, identity, byte and time contract

Future parent generates a fresh 128-bit random nonce as 32 lowercase hex digits,
reserves it exclusively, and binds exactly:

`C:\Users\djden\AppData\Local\Temp\opencode\JQ-<nonce>-C<caseId>`

The base must already exist, be known, and have no reparse ancestors. No fallback
to old TEMP, alternate user, current directory, link, drive alias, or old root.
Both path and nonce are public fixture control data, never secrets. Creation
refuses an existing root; OWNER/requests/markers are CREATE_NEW, not replace or
append. Directory existence checks and CREATE_NEW OWNER are **not atomic proof
against a hostile concurrent host**. A future parent ownership lease/reservation
and stable paths are prerequisites. Partial preparation remains retained/HOLD;
there is no cleanup, retry into it, or inventory of unrelated paths.

`OWNER.json` binds owner `job-fixture-source-r1`, root, nonce, case, manifest and
future fixture EXE hashes. Before admitting a child, the fixture verifies the
known owner's nonce/case/root. The fixture accepts only that exact fixed root
format. It reads OWNER or one exact expected barrier file, never scans a base.
Reparse checks are fail-closed checks, not a no-follow filesystem sandbox or a
TOCTOU-proof identity guarantee.

Every marker contains role/event, nonce, actual PID, creation FILETIME, explicit
parent-if-known, UTC, monotonic timestamp/frequency, and local elapsed time.
Known parent identity originates in the just-spawning fixture and is checked
after retaining its process handle. Spawned children are observed by their
retained launch handles. There is **no** kill by PID, process name, or reopened
identity. Markers named `exiting` are intentions immediately before return,
**not** proof that that process has exited. Parent needs retained identity-checked
observation handles and actual wait/exit observations. UTC is descriptive;
compare elapsed monotonic ticks only at equal frequencies on this same host.

Each fixture writes at most eight unique markers, each at most 4096 UTF-8 bytes,
and at most 32768 marker bytes per process: **98304 bytes for a three-process
case**. The root solo probe adds less than 512 bytes total stdout/stderr; other
modes have no normal stdout/stderr. Failure output is only an exception type,
not arbitrary arguments/environment/stack content. Preparation writes at most
32768 bytes total: OWNER <=4096, request <=16384, proposal <=4096, inert EXE <=32.
Read buffers are OWNER/marker <=4096, manifest <=16384, individual delivery
source/doc <=65536, future fixture EXE <=131072. The EXE is read, not copied into
the case root. No public source pin authorizes reading its binary provenance.

The remaining aggregate allowance must cover **all** helper events/results,
launcher stdout/stderr, independent observation records, final receipts, and
any runtime/compiler side effects inside the case. Maximum **262144 bytes per
case** is not asserted implemented: see the blocking event-quota gap above.
Do not call the marker allowance an aggregate I/O sandbox. Never stress 4 GiB,
nine processes, 64 MiB, or unbounded fuzz merely to exercise a readback limit.

Future sequencing: one case at a time, global monotonic runtime <=180 seconds
excluding separately authorized preparation/compilation. Reserve 47 seconds
before each admission; a case's proposed absolute runtime/control envelope is
45 seconds (max root deadline 12 seconds + fixed helper cleanup 30 seconds +
3 seconds controller margin). If the global reserve is unavailable, do not
start another case: record NOT_ADMITTED/HOLD, never compress a safety window or
claim all cases completed. Any actual overrun, residual, missing marker, unknown
ownership, observation failure, or byte risk closes admission immediately.
There is no abort of unrelated workers/resources. This timing contract needs
the future owned-handle controller; it is not implemented by the current script.

## Independent oracle rules

Parent compares immutable expected probe values with **actual** fixture Main
arguments, the single observed `JQ_SENTINEL`, exact raw stdout/stderr bytes,
independent barrier chronology, and owned-handle process waits/exit codes.
Do not duplicate the helper's accounting/PID-list/snapshot/Job0 algorithm and
do not ask the helper to decide its own correctness. Fixture marker truth is
conditional on the pinned trusted fixture actually running; external identity
and handle observations must cross-check it. A missing marker is not an exit.

Read helper event/result DATA only after the owned launcher has exited and the
fixture tree is independently quiescent, except the narrowly specified ready
barriers and future byte guard. Preserve raw files before deriving assertions;
pin their byte counts/hashes and record parse failures. Never trim/normalize
Unicode/newlines, merge stdout/stderr, suppress warnings, or replace failed raw
data with synthesized successful JSON. Readback requires cap8, commit4GiB and
kill-on-last-close configuration evidence; consuming those limits is forbidden.

The helper's root-exit, forced/timeout, jobZero and QUIESCENT fields are **reported
facts to corroborate**, not an independent verdict. Closing a Job handle is not
a zero proof. Stable Job0 needs separately reviewed kernel evidence while the
Job exists; this delivery does not expose that private Job handle. If future
authority cannot supply the required observation, retain HOLD: do not substitute
"no marked process seen" for native Job0. Natural success and forced stop are
different outcomes even when no known process remains.

## Eight proposed cases — none has run

### 1. Invalid request / data-only rejection

Prepare the real admitted request schema but set `activeProcessLimit` to **7**;
the supplied interface admits exactly 8. Executable is the pinned fixture in
`refusal-canary` mode with an otherwise matching owned case root and environment.
This tests a concrete source-guaranteed before-root constraint, not invented
type coercion or arbitrary malformed paths. The expected helper outcome is a
refusal/HOLD with `rootCreated=false`, never QUIESCENT/natural success. No fixture
marker or stdio/event/result file created by Runner should exist. An incorrectly
started canary writes `unexpected-execution` and exits 73 on its own.
Marker absence alone does not prove universal non-execution: require independent
launch evidence/control observation or preserve that uncertainty. Do not call
this case a successful product run.

### 2. Natural solo 0 / Unicode, argv, environment and raw bytes

Mode `solo`, helper deadline 3000 ms. Probe tail must be **exactly five elements**:
empty string; `space value`; `quote"inside`; `tail\`; and Unicode code points
`U+03A9 U+6F22 U+5B57 U+1F600` (without spaces between those code points).
Sentinel must equal `sentinel-<nonce>`. Launcher constructs Unicode using code
points so PS5.1 source decoding does not silently turn a UTF-8 no-BOM literal
into ANSI. Compare lengths/elements ordinally against the observed marker,
not against a copied command-line quoting implementation.

Stdout is strict UTF-8, no BOM, exactly `fixture.stdout: ` followed by Omega,
space, the two CJK characters, space, emoji, then **LF**. Stderr has the same
suffix and `fixture.stderr: ` prefix. Fixture installs process-local UTF-8 stream
writers, not a global console code-page change. Compare the actual byte hashes
to independently constructed expected bytes. Require ready/exiting markers,
independent root exit 0, complete traces, and independently corroborated Job0.
No descendants are allowed.

### 3. Natural root / child / leaf

Mode `tree-root`, helper deadline 8000 ms. Child `tree-child` alone starts leaf
`tree-leaf`; leaf dwells 350 ms. Each non-leaf retains its own child's launch
handle, observes exit 0, records `child-exit-observed`, then exits 0. Require all
three ready/exiting identities, two independently sourced spawn/wait relations,
consistent parent creation times and nonce, and external root/tree quiescence.
Parent ready observations missing because startup was delayed are HOLD, not a
permission to extend the source lifetime or spawn retries.

### 4. Root 0 while child is still alive

Mode `orphan-root`, helper deadline 8000 ms. Child first retains and validates an
observation handle to its exact parent, then writes ready. Root observes that
barrier while child is alive and exits 0 without waiting/killing. Child waits
on the retained parent handle, records **actual parent exit 0**, remains alive
for 2000 ms, then records exiting and returns 0. This is a causal barrier, not
"sleep long enough and assume parent exited". Require external child liveness
after the root-exit observation, and show helper release occurs only after the
child's real exit/tree quiescence. Release before then fails the proposition;
missing controller chronology is HOLD, not success.

### 5. Short timeout with three self-expiring fixtures

Mode `timeout-root`, helper deadline 2000 ms; child starts one leaf. Leaf dwells
10000 ms, child waits at most 11000 ms, root at most 12000 ms; each also has the
14-second watchdog. Require all three ready identities before the stop, or
HOLD insufficient coverage. Only the exact owned Job may be stopped. Observe
forced/timeout evidence separately from root exit code and Job0. Expected
classification is a bounded forced-timeout observation, **not natural PASS**.
Termination API success without independent quiescence is HOLD. Leave all raw
data/markers, including missing exit-intent markers, unchanged.

### 6. Abrupt close of only the fresh owned launcher

Same three-fixture slow tree, helper deadline 12000 ms. Future parent must launch
the fresh dedicated PS controller and retain the original process handle plus
creation identity before any action. Only after all three ready markers are
identity-checked may a separately approved control operation terminate **that
same retained handle**, once, to exercise kill-on-last-close. Never use names,
reopened PIDs, `Stop-Process`, host LSP/FF8/worker handles, or arbitrary children.

**HOLD_CONTROL_HANDLE_BINDING_REQUIRED:** no such parent controller/termination
route is implemented here. No kill call is hidden in a fixture or script. A
separate reviewed binding is required; a PID string is not a substitute.
Observe each known fixture's actual exit and preserve partial event files. A
missing helper result/partial telemetry is a bounded destructive case outcome,
not an accepted product run, atomic crash inventory, or filesystem durability
proof. If a fixture survives to its own watchdog instead of Job kill, report
that as a failed kill-on-last-close proposition, not a successful cleanup.

### 7. Inert CreateProcess refusal, not fabricated Assign failure

Prepare creates one new <=32-byte non-PE file `inert.exe` in the owned case root.
The admitted `.exe`/existing-file checks can pass, while the OS is asked to
create an inert image. Do not assert a particular Win32 error number or that
every host must refuse it. Require actual CreateProcess failure telemetry,
`rootCreated=false`, no Assign/Resume, and no fixture marker. Unexpected create,
missing evidence or a different failure point is HOLD, not the expected case.
Do not mutate helper bytes or inject errors to force Assign refusal. Coverage
of Assign/nested-Job permission refusal remains **NOT ACQUIRED** without a
separately established harmless method/authority; it is not implied by this case.

### 8. HOLD_REFERENCE_NOT_IMPLEMENTED — explicit parent decision

Not skipped and not waived. The permitted packet supplies no pinned official
reference for CREATE_BREAKAWAY_FROM_JOB's flags/conditions and no independently
controlled API/marker oracle. At 23:38:17.712Z parent explicitly held case 8 for
this source delivery. No breakaway constant, PInvoke, fixture mode or presumed
OS denial was invented. The script refuses preparation/run for case 8 as DATA.

Future gates: parent-supplied **official pinned reference**, explicit narrow API
authority, an independent control/result+marker oracle (not copied helper Job0),
a <=2-second child to bound even an accidentally successful escape, retained
owned handles, source review, separate compile and host/run GOs, and the unchanged
aggregate 3-process/15-second/256-KiB/global-180-second bounds. No further reference
navigation/probe is authorized now. Do not claim complete eight-case/Job-native
qualification while this remains HOLD.

## Future commands, pins and release gates — NOT CURRENT COMMANDS

The following are **templates only**, never executed in this work. Parent must
replace angle-bracket bindings in a new approved compile/run receipt. No shell
evaluation of untrusted substitutions; no PowerShell child is launched by this
script, no Add-Type route, no NODE_OPTIONS workaround, and no implicit compiler.

One future direct fixture compilation, existing Framework64 compiler only:

```text
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
  /noconfig /nostdlib+ /target:exe /platform:x64 /codepage:65001 /optimize+
  /out:<NEW_OWNED_COMPILE_ROOT>\Fixture.exe
  /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\mscorlib.dll
  /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.dll
  /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Core.dll
  /reference:C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Web.Extensions.dll
  <EXACT_PINNED_DELIVERY_OR_NEW_OWNED_COPY>\Fixture.cs
```

Arguments above are distinct argv elements, not one shell string. Bind canonical
Win32 paths, exact copied-source hash if a copy is approved, OWNER/SPEC, fresh
compile-only output and TEMP/TMP, compiler PID/creation/handle, monotonic bound,
retained stdout/stderr and natural exit. Do not overwrite the current delivery,
helper DLL, or failed historical compile roots. Preserve all compiler artifacts.
Source review/compile 0 alone does not qualify the fixture or Job host.

Future data-only invocation in a separately owned, approved PS5.1 x64 process:

```text
<PINNED_POWERSHELL_EXE> -NoLogo -NoProfile -NonInteractive
  -File <PINNED_DELIVERY>\Invoke-One.ps1 -Action Describe
  -CaseId <1..8> -Nonce <FRESH_32_HEX> -ExpectedManifestSha256 <EXTERNAL_MANIFEST_PIN>
```

Future `Prepare` adds `-FixtureExe <PINNED_FUTURE_EXE>` and
`-ExpectedFixtureSha256 <FUTURE_COMPILE_RECEIPT_PIN>` plus
`-PreparationAcknowledgement FUTURE_PREPARATION_GO_REQUIRED`; requires an
explicit new preparation GO covering that root first. `-Action Run` remains
HOLD in these exact bytes, even if a caller supplies an acknowledgement.
There is no current executable command for accepting a helper run.

The prospective precompiled helper route, if later implemented/reviewed, must
verify **all** source/manifest/fixture/tool/reference/request/OWNER/GO/binary
pins and their stable ordinary-file ownership **before** any assembly load or
`JobRunner.Run`. Verify the helper DLL exactly
`b36aa7c7d0b58e6af9ca734d636920cb901df1d084f13511eca037faee213ab5`, never
recompile helper via Add-Type. Refuse already-loaded type/ambiguous loader or
dependency environment. Public pin/path DATA is not authority to read that
DLL now. Its source pin is
`cb3a6dfd3fe5b3fe23246905223bf2186e97b7b8d723853a94701878d40957fb`.

Supplied tool metadata pins, to be freshly checked only under future authority:

- PS5.1 x64 `powershell.exe`: `60c9b29843624dd8af6b6a7b26147753be6aeef65098b9a503cc50850afe410f`.
- Framework64 `csc.exe`: `eca02e6b15cde93009a59a3d129d5a77fb5008f2e1cf62cf573b6737c747ecc3`.
- `mscorlib.dll`: `94715f6991e2b9dc7481532c05aa99e74a5fff4ee147be541bca27f99e003fc7`.
- `System.dll`: `09787b4f38f4f020c6b8a3894146085d4df7b8ae337577ed42d9acf1419660e8`.
- `System.Core.dll`: `d1bafee1a4dd7e7bd9adf6859e7b1b654d1b4e0d031a38795e33ba040508c09d`.
- `System.Web.Extensions.dll`: `6f2545e5ba378f6836ea0fed1067d089181e27dbd3c81e9db418c8bb32e6af51`.
- Compiler config `2d4610ade011e530d817dd3ba4fc787e5dc0c2297cc520c30a643b8fb13f9093`;
  default RSP `e2021640c1f8ad500549fc89cd53bc4c2f0fa13fee9034714142d93c5d554042`
  is bypassed by `/noconfig`. These pins do not attest every CLR/OS/vendor byte.

Future host must independently check guard/profiler/startup variables absent
case-insensitively (`FF8_ENSEMBLE_SOURCE`, `NODE_OPTIONS`, `BUN_OPTIONS`,
`DOTNET_STARTUP_HOOKS`, `APPDOMAIN_MANAGER_ASM`, `APPDOMAIN_MANAGER_TYPE`,
`COR_*`, `CORECLR_*`, `COMPLUS_*`). Do not clear or rewrite host/global settings
to make a guard pass. The explicit nonsecret child environment DATA is limited
to JQ_SENTINEL, SystemRoot and owned-root TEMP/TMP. No unqualified wrapper or
loader fallback, and no reading old DB/cache roots to obtain context.

## Stop, collection, limitations, and handoff

Before admitting any future real run, resolve the **actual aggregate write bound**,
independent handle observer/Job0 observation, and case-specific authority. Pin
that reviewed controller and its exclusive ownership receipt. Missing reference,
host permissions/nested-Job capability, type/load ambiguity or missing evidence
means HOLD with no fallback. No bypass by granting admin, changing helper caps,
buying tools, disabling guards, or substituting PID/name kills.

Stop admission on first unexpected outcome. Wait for independently observed
quiescence, or record HOLD and retain ownership/residue instead of releasing.
Collect only exact owned files after launcher exit/tree quiescence, preserve
raw bytes/hashes/UTC+monotonic/nonce/source pins and negative evidence. Case 6
may legitimately have partial/no result; do not erase that distinction. Never
clean up roots or infer ownership from a file's timestamp/ID alone.

Polling can miss fast children. Markers cover the finite trusted fixture tree,
not every possible host process. File ID/date is not creator-PID proof. No
filesystem/network/provider sandbox, all-time non-escape guarantee, erasure,
atomic crash inventory, durable logging proof, or protection against a hostile
host is supplied. A child exiting later under its self-watchdog does not prove
the Job stopped it. Source watchdog timings, P/Invoke-independent managed
Process behavior and Unicode bytes remain unmeasured until separately approved
qualification. This code has not even been compiled; review must address its
possible compile/runtime defects before any such approval.

Deliver four file pins and these limitations, then **HOLD**. No adoption,
compilation, native Job qualification, full44, FF8 integration, or live action
is implied by a completed source-author task.
