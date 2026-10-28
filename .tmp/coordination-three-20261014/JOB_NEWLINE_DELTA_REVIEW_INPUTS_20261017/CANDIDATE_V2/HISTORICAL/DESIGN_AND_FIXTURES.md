# Windows JobObject helper — SOURCE ONLY, NOT QUALIFIED

## Authority and current disposition

- Task: `task_mvbj4159_0004_vbidtk`; fresh implementer, cycle 1.
- Session: `ses_eb93426a6ffer4hFHCza2TS4I2`; parent-confirmed `build / openai / gpt-6.1-sol / max`.
- Source-only GO: parent message `2026-10-17T22:23:58.964Z`, applying the complete current `PARENT/SCOPE.md` pin `056f81f52ab313dbe7af66675b409f96d1dc6706a155e3f2e626c956391b3dd1`.
- Sole output: this previously absent, parent-assigned directory; exactly the four named source/document files. No existing project source, configuration, test, oracle, central L8 file, Git state or registry was changed.
- **No delivered code was compiled, imported, evaluated or executed. No native Job API, helper, fixture, compiler, child PowerShell, test, product CLI, runtime, cache, DB or port was created/run.** Author activity was source/document edits and read-only text/byte hashing through normal ContextMode scratch.
- The input plan is declarative and unqualified. This delivery is not B03 qualification, integration, full44 admission, a B01/B02 waiver, a cleanup grant or a filesystem/network sandbox. Disposition after delivery: **HOLD** for parent-owned independent source review, then separately authorized compilation and harmless qualification.

`MANIFEST.json` pins the three non-manifest outputs and all five input files. It deliberately does not claim a self-referential manifest hash; the final handoff supplies that physical hash separately.

## Proposed host and entry point

`Invoke-JobRunner.ps1` proposes the already-existing Windows PowerShell 5.1 Desktop **x64** / .NET Framework 4.5+ route. `System.Web.Extensions.dll` is the framework JSON writer dependency, not an install/download request. Its presence and all API/runtime behavior are **unverified here**. Absence, host mismatch, an already loaded JobRunner type or compilation failure must refuse; there is no alternate host/compiler/runtime route.

The wrapper contains future `Add-Type` and `JobRunner.Run` statements. They were **not run**. Add-Type can invoke a compiler and create compiler TEMP artifacts even without an output assembly; a future compilation GO must cover that activity and its exact new artifact ownership. Merely supplying the acknowledgement parameter is not authorization. No script invocation command is provided as a current permission.

The wrapper reads one explicit bounded UTF-8-no-BOM data file, rejects a reparse leaf/ancestor and refuses type reuse. It does not scan for a request, executable, old process, old database or cached binary. The C# entry point accepts JSON text, refuses concurrent calls to itself and returns a JSON string. A successful PowerShell pipeline is **not** a successful run: the caller must inspect the returned data and all evidence.

The parent must exclusively own/seal the request, source pins, executable pin, cwd, log parent directories and launch window. The process-local interlocked guard does not serialize unrelated launchers in the PowerShell host. Inheritable stdio handles exist briefly before CreateProcess; an unrelated concurrent handle-inheriting launch in the host is outside this helper's authority and is not permitted by the proposed parent contract.

## Data-only request schema

The following is a **prospective example**, not a created fixture/request or authority to create these paths:

```json
{
  "executable": "C:\\qualified\\tools\\benign-fixture.exe",
  "arguments": ["one argument", "", "Unicode-\u03a9", "quote-\"-literal"],
  "workingDirectory": "C:\\qualified\\run-example",
  "environmentBlock": "PATH=C:\\qualified\\tools\u0000RUN_NONCE=example-only\u0000\u0000",
  "limits": {
    "activeProcessLimit": 8,
    "jobCommitBytes": 4294967296,
    "deadlineMilliseconds": 900000,
    "cleanupMilliseconds": 30000
  },
  "logs": {
    "stdout": "C:\\qualified\\control-example\\stdout.log",
    "stderr": "C:\\qualified\\control-example\\stderr.log",
    "events": "C:\\qualified\\control-example\\events.jsonl",
    "result": "C:\\qualified\\control-example\\result.json"
  }
}
```

All fields are required and unknown fields are rejected. The restricted parser accepts only objects, arrays, Unicode strings and nonnegative Int64 integers; it refuses duplicate keys, coercions, floats/exponents, leading-zero integers, comments, booleans/null, excessive depth/size, unpaired surrogates and trailing data. It does not deserialize application objects or invoke code. Validation/layout refusal occurs before root creation; malformed requests have only a returned HOLD report, not writes through partially validated paths.

Paths must be ordinary canonical local drive paths shorter than 260 UTF-16 units, without device/UNC/ADS/relative/slash/dot-segment ambiguities, reserved device stems, trailing dots/spaces or reparse ancestors. The executable must be an existing `.exe`; cwd and all log parent directories must exist. No directories are created by the helper. Four log/result paths must be case-insensitively distinct and absent; creation is also exclusive (`CREATE_NEW` or `FileMode.CreateNew`, sharing denied). A reservation collision refuses before root creation. Earlier newly reserved empty/partial files are retained, closed and never deleted, truncated or reused.

These checks are **not ACL ownership, file-identity sealing or race-free path confinement**. They cannot prevent a privileged actor changing a path after validation, a hostile executable, service/COM/WMI escape, hardcoded cache writes or general writes elsewhere. The caller's ownership/pin/exclusivity assumptions and B02 remain independent gates. Direct `.exe` selection is not an executable allowlist: the parent must pin the qualified executable and must not request a command interpreter.

### Exact command-line and environment construction

`Quote` always quotes argv0 and every argument. For a run of `n` backslashes before a literal quote it emits `2n+1` backslashes and the quote; before the closing quote it emits `2n`; otherwise it emits the original `n`. Empty argv elements become `""`. Spaces, Unicode and shell metacharacters are data. NUL is refused; UTF-16 is checked for paired surrogates. The complete command including terminator is bounded to 32767 units. `lpApplicationName` is the explicit absolute executable; there is no PATH search, shell wrapper, `Invoke-Expression`, string re-tokenization or retry.

This is the standard Windows CRT-style argv encoding, not a promise that an arbitrary executable uses that parser. The actual Bun/Python/fixture argv decoder must be independently qualified against the original argument array, including quotes and trailing backslashes. An incompatible parser is a parent escalation, not grounds for another quoting or shell fallback.

`environmentBlock` is the entire supplied Unicode block, not inherited host environment plus edits. It must end in exactly the effective double-NUL terminator, with sorted, case-insensitively unique `NAME=value` entries, no empty entries and no hidden `=C:` drive entries; a two-NUL empty block is supported. Unsupported blocks are refused, never repaired. The exact UTF-16 character array is copied into an allocation of exactly `Length * 2` bytes; no serializer normalization, inserted variables, NODE_OPTIONS stripping or extra terminator is applied. The parent, not this helper, constructs and approves any planned overrides. Environment values/argv are not copied to API logs, avoiding inadvertent secret disclosure; the parent must retain the pinned request separately.

## Native ABI derivation — x64 expectations, not measured results

All native structures use sequential default x64 packing, fixed-width DWORD/int/long members and pointer-width IntPtr/UIntPtr. Win32 BOOL return/out values are explicitly marshalled as four-byte BOOL. W-suffixed entry points use Unicode and exact spelling. Failure last-error values are read immediately after the failing call. Success log errors are normalized to zero because GetLastError is not generally defined after success. `DeleteProcThreadAttributeList` is void and is logged as having no error-result contract. None of these declarations has been compiled or called here.

- `SECURITY_ATTRIBUTES`: 24 bytes; DWORD length at 0, descriptor pointer at 8, BOOL inheritance at 16. Only three stdio file handles use inheritance=true. Job/process/thread default security arguments are NULL, giving noninheritable handles.
- `PROCESS_INFORMATION`: 24 bytes; process/thread pointers at 0/8, PID/TID DWORDs at 16/20. The newly returned process/thread handles are owned; the current-process pseudo-handle is borrowed and never closed.
- `STARTUPINFOW`: 104 bytes; cb at 0, three string pointers at 8/16/24, eight DWORDs at 32..60, two WORDs at 64/66, reserved pointer at 72, stdin/stdout/stderr at 80/88/96. `STARTUPINFOEXW` adds the attribute-list pointer at 104, for 112 bytes; cb is 112 and STARTF_USESTDHANDLES is set.
- `JOBOBJECT_BASIC_LIMIT_INFORMATION`: 64 bytes; two LARGE_INTEGERs at 0/8, flags DWORD at 16, SIZE_T working-set fields at 24/32, ActiveProcessLimit DWORD at 40, affinity pointer at 48, priority/scheduling DWORDs at 56/60.
- `IO_COUNTERS`: six UInt64s, 48 bytes. `JOBOBJECT_EXTENDED_LIMIT_INFORMATION`: basic at 0, IO at 64, process/job/peak-process/peak-job SIZE_T fields at 112/120/128/136; size 144. Four GiB is an actual 64-bit UIntPtr, not a truncated uint.
- `JOBOBJECT_BASIC_ACCOUNTING_INFORMATION`: four Int64 time fields followed by DWORD faults/total/active/terminated at 32/36/40/44; size 48.
- `JOBOBJECT_BASIC_PROCESS_ID_LIST`: two DWORD header fields at 0/4, followed by pointer-width PIDs starting at 8. The fixed buffer holds eight entries, 72 bytes. Returned length, both counts, PID range and uniqueness are checked. MORE_DATA or any unexpected layout/length is an error, not an empty list or a fallback allocation strategy.
- FILETIME out parameters are represented as eight-byte Int64 storage. Creation FILETIME is emitted as decimal text, including in `PID:creationFileTime` identities, so a JSON/JavaScript consumer does not round values above 2^53.

`CheckLayouts` checks the corresponding managed sizes and safety-critical offsets **only when a separately authorized future run occurs**, before native handles or logs are created. This source has no claim that these assertions passed or that the APIs are available in the eventual host.

## Lifecycle, handle ownership and refusal branches

1. **VALIDATED / LOGS_RESERVED.** Validate request and layouts; reserve events/result with managed noninheritable FileStreams. `eventFile` remains separately owned even if StreamWriter construction fails; writer leaves it open and both are closed explicitly. Reserve stdout/stderr with inheritable exclusive file handles; stdin is a new inheritable NUL read handle. No pipes/readers/worker threads are needed for stdout/stderr.
2. **JOB_CONFIGURED.** Create a new anonymous noninheritable Job. Set and read back exactly KILL_ON_JOB_CLOSE + ACTIVE_PROCESS + JOB_MEMORY (0x2208), cap8 and commit4GiB. No breakaway flags are set. Check parent is outside this new job; log whether it is already in another job. A nested host is not claimed supported merely because it was detected.
3. **ROOT_SUSPENDED.** Allocate and initialize one STARTUPINFOEX handle-list attribute containing **only** stdin/stdout/stderr (24 bytes). Initialization's first insufficient-buffer response must be the documented sizing result; all other failures refuse. CreateProcessW flags are exactly EXTENDED_STARTUPINFO_PRESENT + CREATE_UNICODE_ENVIRONMENT + CREATE_SUSPENDED (0x80404), never CREATE_BREAKAWAY_FROM_JOB. Record the new root PID and creation time from its returned handle. Destroy/free attributes, list and environment and close parent stdio copies after successful creation; child inherited copies remain. Failure to close a launch handle prevents resume.
4. **ASSIGNED.** Assign the **newly returned root handle** to this job, once; verify membership and a stable populated snapshot containing only its PID, before resume. Assignment/nesting/rights/association/telemetry failure refuses. If assignment did not succeed, termination can target only this owned never-resumed root handle. There is no reopened old root PID, kill-by-name, third-party assignment or unconfined launch.
5. **RUNNING.** Start monotonic Stopwatch immediately before the single ResumeThread attempt. Expected previous suspend count is exactly one; any other return refuses/stops without a second resume. `resumeAttempted` and `resumed` are distinct: false `resumed` after an unexpected resume response does not prove that no code ran. Close the primary thread handle after confirmed resume. The root handle and job handle remain owned through observations and stop handling.
6. **ROOT_EXITED / WAITING_FOR_JOB.** Poll the same held root handle; only a signalled wait permits an exit-code observation. Exit code 259 is valid after a signalled wait, not automatically STILL_ACTIVE. Unknown root creation time, exit code, job admission counts or termination return stays null, never a fabricated zero. Nonzero natural exit requests termination of this job's remaining descendants; zero natural exit alone is insufficient.
7. **QUIESCENT.** Require root signalled AND two matching successful accounting/PID-list samples showing active0 and both empty lists. Accounting active/total/terminated must agree across samples, counts/list contents must agree, and every call must succeed. A mismatched live snapshot is explicitly logged as unstable and is not zero proof; before resume instability refuses. A notification is not used as zero proof because this version uses no completion port at all.
8. **STOP REQUESTED.** Timeout or any launcher/observation/telemetry error targets only this owned job with TerminateJobObject after assignment; before assignment only the newly owned suspended root receives TerminateProcess. There is no second invocation or launcher fallback. Poll for root signalled plus job0 for at most 30000ms on a new monotonic cleanup clock. An observation error can end that wait early as unproven. API success requesting termination does not establish termination completion.
9. **CLOSE / PUBLISH.** Finally destroy/free remaining launch allocations, close own thread/root/job handles, then close writer/event file; every native close return and managed flush/close error is retained. Close helper clears its field before one close attempt, preventing a dangerous retry/double-close of a possibly reused handle; failed close remains HOLD with ownership uncertain, not a no-leak claim. Closing the final job handle invokes kill-on-close as a safety net, but never changes `jobZeroObserved` to true. No files are deleted, no DB close is forged and no reservation/registry is modified or released by this helper.

Current-process pseudo-handle is borrowed; snapshot metadata handles are owned and query-only. Each PID is drawn only from a freshly successful job list, OpenProcess requests QUERY_LIMITED_INFORMATION with inheritance=false, membership is checked before and after GetProcessTimes, and its handle is closed in a finally block. These handles are never used for termination or root identity. A raced/exited PID or metadata API error is conservatively a visible stop/HOLD, not an invitation to search by PID/name. Every ordinary pre/post-resume exception branch reaches owned-handle/allocation cleanup. Catastrophic CLR/host/OS failure is not claimed to produce a report; host death's kill-on-close behavior itself still needs qualification, and cannot manufacture an observation.

The wait loops are monotonic and bound their intentional polling/sleep budget, not a hard real-time guarantee against a stalled kernel, synchronous disk/log write or unscheduled parent. The future host must qualify those operational assumptions; no watchdog service/thread/process was added. Job commit is not an RSS guarantee; there is no CPU, thread, disk, file-count, socket, DNS or external-controller quota.

## Telemetry and result interpretation

All launcher Win32 return/failure-error pairs are traced to exclusive JSONL events. Event output is bounded to 64MiB / one million entries, identity storage to 4096 distinct PID+creation-time pairs and error messages to 64. Bound/IO loss stays visible and prevents a success report; it is not silently dropped. At most eight active processes does not bound lifetime admissions. Stdout/stderr are regular files, avoiding a pipe-consumer deadlock; this does not guarantee child user-space buffers survive forced death, stdout/stderr ordering, complete writes on a full disk, or a disk quota.

Polling cannot enumerate every very short-lived descendant. The result explicitly reports this limitation, unstable samples, sampled identities and the last successfully observed total admissions. `identityCensusIncomplete=true` shows a detected gap; false is not a proof of a complete lifetime inventory, especially after failure. No completion-port overflow/notification claim is made; **limit-violation notifications and descendant API failures are not intercepted**. The kernel limit configuration/readback is distinct from proving every child handled those limits correctly; future fixtures must collect independent child-side failure evidence. None of this weakens the separate root+kernel-job0 requirement.

`status=QUIESCENT` requires a natural zero root exit observed before a stop request, confirmed resume, actual root+job0 observation, no launcher cause/error and no telemetry/handle/publication error. Failure reports retain cause (`TIMEOUT`, `ROOT_NONZERO`, `API_OR_REFUSAL_ERROR`), pre-root/pre-resume refusal or `STOP_REQUESTED_UNPROVEN`. A run may observe a natural root exit and then request forced termination of descendants; both facts are preserved. `localTreeQuiescenceObserved` can be true on a refused/error run without making that run successful. Unhandled report-level error returns HOLD with unknown root-created state instead of inventing false.

Result is written once to its fresh reserved file, flushed and closed. No rewrite/rollback is attempted if publication fails: the file may contain a partial or pre-failure candidate. The **returned** report is then HOLD with `resultPublicationFailed=true`; the parent must require successful wrapper return, a complete parsed result equal to the returned report and all parent-owned evidence/flush/close checks. A candidate result file alone is not authority. Both result variants retain `qualification=SOURCE_ONLY_UNQUALIFIED` and `authorizesOtherResourceRelease=false`; the helper never adopts a test suite or releases external ownership.

## Future harmless qualification — proposed, NOT AUTHORIZED OR EXECUTED

The parent must first obtain independent source review, resolve any API/layout/route objection without fallback, then issue distinct compilation and qualification GOs with exact host hashes, fresh owners/nonces/paths, budgets, retention and cleanup authority. Fixture programs and the observer must be independent of this implementation. No fixture code is delivered, built or run in this task. None may use a DB, IDA/native FF8, network/port, provider, old PID/resource or real product test suite.

Suggested future fixture obligations:

- Root -> child -> grandchild benign processes: independent observers record creation FILETIME, membership, markers and all exits. All are new descendants; no preexisting process is assigned. Check parent remains outside the new job and Job handle is not inherited.
- A root exits zero while its child remains alive: returned quiescence must wait for child exit and independently confirmed job0; stdout closure/root0 alone must not pass. Exercise rapid churn and a deliberately missed identity sample; preserve the census limitation rather than demand fabricated identities.
- Timeout with a live descendant: one TerminateJobObject request for this job, root+job0 observations within the cleanup budget, and timeout/HOLD rather than natural success. An induced observation failure must leave STOP_REQUESTED_UNPROVEN even if closing the job later stops the tree.
- Before-resume failure: independently controlled assign/nesting/permission or attribute failure, root marker absent, only the newly suspended root terminated, and root exit plus empty job observed where possible. Never injure an old process to synthesize this case. Test both allowed nested assignment and refusal in the actual future parent host.
- Controlled breakaway request from a new benign descendant: no breakaway flag is granted; independent child-side evidence must show refusal. A new anonymous job and exact readback alone do not qualify this behavior.
- Parent death / final-handle closure in an explicitly owned harmless launcher fixture: independent external observer confirms descendant death and no inherited Job handle keeps it alive. A killed parent cannot itself return quiescence; retain partial/unproven evidence and do not treat missing JSON as success.
- Eight concurrent benign processes, ninth-process refusal, and cautious bounded commit-limit exercise under a separately approved safe memory budget: independently observe child failure/limit behavior. Do not infer RSS enforcement or clear test failures to fit a cap; do not allocate 4GiB merely to test this plan without its own budget.
- Large simultaneous stdout/stderr, empty arguments, spaces, shell metacharacters as literals, Unicode/surrogate pairs, embedded quotes and trailing backslashes: independent argv/env echo with exact UTF-16 comparisons, byte counts and no secret data. Check empty/explicit env, sorted duplicate rejection and unchanged NODE_OPTIONS value without importing a real preload.
- Malformed/duplicate/overflow/unknown-field JSON, invalid paths, reparse/collision refusal and existing log protection: assert no root created; keep all new partial reservations and do not delete fixtures as an implicit cleanup. Test existing files with parent-supplied harmless sentinels, not project/cache/DB files.
- API/telemetry/log-publication/close failure injection using an independently reviewed fixture method: preserve all loss/unknown states, no false zero, no extra invocation and no unsafe close retry. No such injection instrumentation is present or executed here.

After harmless qualification, any Bun/Python/Worker/product integration needs its own exact dynamic admission. This source does not change B01, B02, full44, provider/host control, scientific native evidence, fixture/oracle expectations or the parent-only integration/commit boundary.
