# Guardian core R1 — source delivery, HOLD for independent composed review

Task `task_mvc42woi_0006_kj3b51`, session `ses_eb6ebae2affeli3UWs0CsMor2m`,
role G only. Parent verified the native `openai/gpt-6.1-sol`, variant `max`,
build session, then issued distinct SOURCE GO after actual packet access ACK.
This delivery is **NONBLIND**, not packet-only. Historical helper/reference files
were read as required provenance; the old runner is neither called nor wrapped.
No observer implementation, opposite-owner source or opposite-owner results were read.

## Status and unchanged gates

The delivery contains exactly `GuardianCore.cs`, `GuardianCore.Tests.cs`, this
document and `MANIFEST.json`. It writes real native-owner methods and a real
bounded lifecycle, not an implementation that merely delegates to old JobRunner.
Writing these functions did not invoke them. No C# compiler, test, reflection,
source import, .NET probe, process/Job API, native run, DB, Git or delegation was
used. Static text inspection and byte/hash calculations are not compilation or tests.

The parent-owned physical ABI remains unchanged: `guard-v3-core-abi1`, 8016 bytes,
`bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709`.
The governing draft2 is
`bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3`;
scope is `f861136446decd8ed33ce07e6e26acca111758e7337ef5903d3288bb9969b2b4`.
Physical inputs and old freezes are not edited. Case6 last-close remains
NOT_ESTABLISHED; case8 host and integrated/global budget are not qualified.

The physical dependency `DEPENDENCY_EN_REVIEW/BudgetedEvidence.cs`, 11846 bytes,
pin `0944a3bb`, retains its historical EN_REVIEW label. The later parent SOURCE GO
reports its source review ACCEPTABLE_SCOPED and library compilation PASS, without
RunAll, tests or host proof. That is parent-reported provenance, not validation
performed by this worker. G references its immutable category/cap constants; it
does not edit, fork, instantiate a replacement global budget, or infer host acceptance.

## Host binding: a source boundary, not fabricated capabilities

`Run(null)` and every missing/inconsistent required binding return
`MissingHostBinding` before a native-owner call, layout inspection, clock activation
or handle transfer. The default clock is lazy, including Stopwatch first-use setup.
No production subclass of the four abstract host-attestation capabilities exists
in these outputs. The test subclasses use synthetic labels with FakeNative ONLY.

The future trusted launcher must establish, before constructing a binding:

- A fresh CreateNew lease, nonce256/positive epoch, exclusive durable reservation,
  actual lease/intent/image/source pins, authorized bounded fixture mode and arguments.
- Original-source S/D process references with SYNCHRONIZE rights and correct
  case/epoch/source/transfer order; no PID reopen or lease-file reconstruction.
- Three actual stdio handles, inheritable and exclusively transferred to G,
  with S's independent raw capture reserved **before** every Read, including framing,
  invalid UTF8 bytes, unused-credit/no-refund and exhaustion-without-EOF obligations.
- A closed global ledger covering all eight categories, unique concrete slot/path/
  stream owners, every writer/copy/partial/error path, and G's fixed memory reservations.
- Actual S publication/readback ownership, the original S reference, and later an
  exact bounded durable readback plus the remaining host/capture/ledger obligations.

The local `GuardianHostAuthority`, capture, ledger and supervisor abstract classes
carry internal identity/reservation/provenance references. They are **not** proofs
that a lease exists, files match a hash, a global ledger is closed, or capture is
implemented. `HostComplete` checks consistency of already-issued trusted capabilities;
it cannot manufacture or authenticate external facts. Merely deriving these classes
is not host qualification. The future source issuer and wiring require independent
review and separate native/host gates. Until then required bindings are absent and
the core refuses execution. No fake driver-alive boolean, JSON handle, magic PID,
host launcher, reserved-read capture, or global-ledger implementation is supplied here.

As in ABI1, malicious code already loaded into the trusted assembly is outside this
source/protocol trust boundary. No claim of unforgeability against that code is made.
Additional local records implement the draft's lease/final-outcome concepts without
changing the common observer ABI. An ABI incompatibility must go back to the parent.

## Actual privileged branch

After the complete gate and x64 check, G adopts exactly five transferred originals,
allocates bounded evidence/result state and owns an eight-entry inventory:
S, D, stdin, stdout, stderr, J, T-process, T-thread. There is no DuplicateHandle,
OpenProcess, named/open Job, PID census, IOCP, shell or filesystem API in G.

G checks transfer inheritance flags, creates J with NULL security attributes and
NULL name (anonymous, noninheritable), sets extended limits and reads back flags
**and** values. Required flags are exactly `0x2208`: ACTIVE_PROCESS, JOB_MEMORY,
KILL_ON_JOB_CLOSE. Active limit is 8; SIZE_T JobMemoryLimit is 4294967296.
Extra flags, missing flags, breakaway/silent-breakaway, size mismatch or value drift
refuse the case. There is no 32-bit/truncation/unsupported-limit fallback.

The native creation method builds an attribute list containing exactly the three
stdio handles and creates T with precisely SUSPENDED | UNICODE_ENVIRONMENT |
EXTENDED_STARTUPINFO_PRESENT (`0x80404`). Process/thread security attributes are NULL.
Original returned process/thread references are preserved before marshalling cleanup;
the owner adopts successful creation even if later temporary-resource cleanup fails.
The G stdio copies are closed after creation. Assign is attempted once, explicit
membership on the same J is read, limits are reread, then exactly one ResumeThread
is admitted. Only previous suspend count 1 is accepted. Admission is permanently sealed.

An assignment failure or uncertain/unexpected resume never enables a root-only stop
after a resume attempt. G requests TerminateJobObject once on its live owned J.
For an original, never-resumed, unassigned root it additionally attempts the one
owned TerminateProcess stop. No arbitrary process or controller/driver is terminated.

## Borrow, original-root witness and non-atomic pair

`IGuardBorrowSource` is implemented by G itself. A borrow succeeds only on the owner
control thread, inside the synchronous corresponding observer-call window, for the
exact current CaseIdentity **reference**, requested kind and live original reference.
Equal nonce/epoch labels in a different object do not suffice. NULL/negative pseudo
handles, wrong kind, outside-window, close-attempted and closed references are refused.
No close occurs inside an observer window. This serializes use/close; it is not a
native duplication or an independent lifetime token the observer may retain.

Only injected `IGuardKernelObserver.ObserveRoot` and `CapturePair` perform the root
and accounting/PID-list observations. The G native seam intentionally has neither
accounting nor PID-list methods. Its only Job query is class9 limit readback.
G's WaitForSingleObject calls are exclusively on original S/D control references.

For T, G requires successful wait with signal plus successful exit-code reading.
A numeric exit code 259 is not used as a liveness oracle after signal; a nonzero
exit code is not automatically an API failure or testsPASS. Both T originals are
then closed, once each. Every known root reference must have confirmed close success
before G constructs its internal RootExitWitness. A failed/ambiguous close latches
HOLD, is never retried on a potentially recycled number, and prohibits all pairs.
G never accepts a root witness from D or a historical receipt.

Only after irreversible root terminal state, all root references released and sealed
admission can G lend the same live J for a pair. The two queries are **not atomic**.
G validates reference identity, monotonically issued permit/sequence, witness order,
elapsed order, success/error fields, accounting length48, list length8..72, returned
header-plus-pointer bounds, cap8 and complete assigned/list counts. ERROR_MORE_DATA,
bad sizes, stale epochs/sequences, an accounting zero with nonempty list, and a
decreasing cumulative TotalProcesses are rejected, never interpreted as empty success.
TotalProcesses is cumulative and may exceed 8. Nonzero accounting followed by an
empty list is pending, not an invented atomic snapshot. Only all three zero counts
in a valid fresh pair establish kernel quiescence. A rejected/throwing pair is not
retried into a later zero; cleanup still attempts the owned stop and remains HOLD.

## State, incident semantics and publication

The phase is separate from the first sticky reason. Normal phases are Prepared,
Bound, Suspended, Assigned, Resumed, Waiting, KernelQuiescent, Sealed. ForcedStop
remains admissible after an error; Quarantined and Sealed are terminal. Later errors
never replace the first reason, but each distinct failure kind can emit one bounded
enum/code record and can permanently block publication.

Real signaled original D loss requests forced shutdown. If S lives and the full
stop/root-close/pair proof succeeds without another integrity failure, the outcome
is ForcedQuiescent, with DriverLost still recorded: never NaturalQuiescent/testsPASS.
An unreadable D reference is a permanent HOLD. S loss, writer/capture failure,
bad observations, close failure, clock/deadline failure and other integrity faults
remain HoldQuarantined even if cleanup later observes quiescence. S loss cannot
create replacement publication authority. G loss leaves the parent reservation held;
kill-on-last-close is a theoretical safety net, not an observed post-destruction oracle.

On success `Run` returns a **pending kernel-proof publication**, keeping J and S open.
It does not terminate the guardian process, release a resource reservation or grant
test acceptance. The future launcher MUST keep G and this owner object alive during
the handshake; dropping it/exiting G is not an allowed success path. There is no
finalizer/Dispose that silently closes J. Before the valid S handshake, HOLD
deliberately retains J and any root references whose terminal/close proof is
unavailable, explicitly nonreleased.

One `Acknowledge` call is allowed, on the same control thread, before the same
deadlines. A typed S acknowledgement must refer to this exact supervisor capability
and pending publication, contain exactly192 bytes, and match all192 readback bytes.
The original S reference is waited again. The trusted future S issuer, not these
bytes alone, must have performed real durable readback and full host obligations.
Only then are S and J closed and phase Sealed recorded. No evidence append can fail
after the last J close and accidentally turn a writer failure into success: the
final append is reserved first. A rejected ACK attempts the still-owned stop, clears
the pending publication and keeps HOLD. Even Sealed never grants release in G's
result; S alone owns the separate parent admission/release protocol.
If the final acknowledged close actually succeeds but returns after the deadline,
the result is still HOLD and truthfully reports J no longer retained; it cannot
invent a surviving handle or an observation after Job destruction. S's durable
reservation must remain held. The source test includes this late-close case.

## All work bounds and software deadlines

- Setup 5000ms, normal wait20000ms since the pre-resume instant, cleanup30000ms
  from the **first** stop request, total55000ms from start. Monotone samples cannot
  decrease or become negative; no transition resets start/credits. Reaching a limit
  is HOLD, including setup overrun during ResumeThread and late final closes.
- Root waits: at most4096 normal plus300 cleanup, distinct from the pair credits.
  Pair attempts: at most4096 normal plus300 cleanup. Each is debited before a
  rejected/failed/throwing attempt. Permit sequence never resets. Wait slices <=100ms.
- Outer loops have independent finite cardinality8192 normal /600 cleanup, with
  no repeated cleanup loop. Descendants-only pacing waits on original S or D,
  not Sleep or a fabricated duration. Controls have a cumulative24000-call cap.
- Initial limit/membership allowance4, actual success path3: limits, membership,
  limits. Exactly one Job creation, one T creation, one Assign and one Resume.
  Inheritance inspection is at most8 calls. Owned stop calls are at most one J
  plus one never-resumed unassigned original T; each of eight closes is attempted once.
- Attribute sizing/init/update/delete: at most one each. Three allocation/free
  sites, fixed24-byte stdio list, attribute allocation <=65536. No buffer-growth retry.
- Acknowledgement: one attempt, no wait/drain/readback polling loop. Fixed-size
  copies/encodings are at most8 ledger entries,5 transfers,192 acknowledgement
  bytes,96 records, and bounded path/command/environment text scans. Signal OR has
  at most8 CAS attempts then latches all incident flags, never spins indefinitely.

Software checks surround owner/observer calls and safe closes. A single owned stop
and finite safe closes are still attempted when time is invalid/exhausted; they do
not restart deadlines or authorize more observation work. Win32/CLR/OS calls are
not hard-real-time promises. A call that never returns is never converted to PASS;
the future S must retain HOLD. No watchdog that kills G first is supplied or implied.

## Writer inventory, memory and unresolved global integration

Concrete G output writers are intentionally limited:

- **GuardianEvidence**: one private18432-byte buffer, reserved by the required global
  host capability for the sole GuardianWriterOwner. At most96 fixed192-byte records,
  credit debited before each distinct record; no reuse/refund. Fields are fixed
  phase/failure enum, numeric error, elapsed and sequence; remainder is reserved padding.
- **GuardianResult**: one private192-byte buffer, the same owner, written once for
  the pending publication. It contains the case/epoch, sequence, quiescence class,
  sticky reason, root exit, cumulative counters and declared limits. A readonly
  ByteAt view avoids an unaccounted G copy. Zero padding does not mean uncollected
  stream bytes are zero. No Exception.Message/ToString, Console or stream writer exists.
- **SupervisorReceipt**: the ACK constructor makes at most one exact192-byte copy,
  only after validating length. S's original readback buffer, this additional copy,
  framing and any durable receipt/result copies MUST be in S's actual global ledger.
  This local class is not proof of that integration. Oversize arrays are not cloned.

The memory reservations fit the parent caps18432<24576 and192<=8192, but that
arithmetic is NOT the host/global budget proof. The abstract ledger requires eight
non-null category owners and distinct target pins, exact G/capture/S ownership and
the two reservations; those consistency checks are not cross-process enforcement.
There is no implemented bridge charging these reservations into a real host-wide
CaseBudgetV3 registry, nor any claim that a local instance would establish uniqueness.
That missing source/wiring, raw capture and concrete writer/fixture ledger block host
qualification. Unknown writers are not assigned zero. Caps remain Control32768,
Markers57344, Streams114688, GEvidence24576, and four8192 slots; total262144.

Launch marshalling also mutates bounded **computational buffers**, never published as
evidence: native attributes<=65536, handle list24, UTF16 environment<=65534 plus its
bounded managed char copy, mutable command line<=32767 UTF16 characters, and fixed
Win32 structures. These are disclosed transient RAM, not claims that the262144
artifact/writer budget limits the entire CLR process or its allocator overhead.
The future global-ledger review must explicitly ratify treatment of every concrete
copy/writer; this source makes no full-process-RAM/host containment claim. No file
writer, raw capture reader, blocking I/O callback, flush, drain or delete is present
on the G stop path. All launch temporary frees are finite; their failure is HOLD.

## Layouts, references and remaining review

Source uses official packet CREATE_JOB_OBJECT_W_CORRECTED, ASSIGN_PROCESS_JOB,
IS_PROCESS_IN_JOB, QUERY_JOB, JOB_ACCOUNTING, JOB_PID_LIST, JOB_EXTENDED_LIMITS,
NESTED_JOBS, CLOSE_HANDLE, RESUME_THREAD, TERMINATE_JOB, TERMINATE_PROCESS and
WAIT_FOR_SINGLE_OBJECT. The historical CreateProcessW/creation-flags/SetInformation
references supply documented API context, not old helper acceptance or its budgets.

Declared x64 owner layouts are BasicLimits64, IoCounters48, ExtendedLimits144,
StartupInfo104, StartupInfoEx112, ProcessInformation24. Alignment gives flags16,
active-process40, JobMemory120, stdin80 and attributes104. BasicLimits derives from
two8-byte times, DWORD flags, x64 alignment/working sets, DWORD active count, aligned
affinity and two DWORD classes; six8-byte IO counters then four SIZE_T fields yield144.
These are written source assumptions checked by a future runtime LayoutsMatch, not
an executed Marshal probe or a claim the packet contains every linked SDK typedef.
GetHandleInformation and attribute-list marshalling likewise need composed native
review. Unsupported layouts refuse, never use a narrower fallback.

Source tests contain independent literal numeric expectations and deterministic
native/clock/observer seams: incomplete/foreign bindings, phase skips, flag/value/
size drift, stale/fake zeros, root-close ordering, borrow refusal, cumulative credits,
clock/deadline faults, D/S loss, writer-HOLD cleanup and exact/missing ACK. They do
not derive expected raw records from the implementation being tested. Their synthetic
handles do not prove native closure, true kernel zero, real durability or global budget.
They have **not run** and no result is asserted for compilation or tests.

Required next gate is fresh independent composed G+O review plus the parent-acquired
budget review. Any compiler GO is separate. Launcher S/driver D, actual trusted
host-capability issuer, reserved-read capture, global writer/copy/fixture ledger and
their independent reviews remain mandatory before any qualification/native run.
No existing candidate, old failing freeze, full44, FF8, IDB or integration gate is promoted.
