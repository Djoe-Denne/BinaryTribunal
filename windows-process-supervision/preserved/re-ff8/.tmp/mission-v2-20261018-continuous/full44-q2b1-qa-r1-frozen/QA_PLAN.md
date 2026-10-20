# QA2b1 independent source candidate

Status: SOURCE ONLY; runtime UNOBSERVED. No compiler, typechecker, transpiler,
test execution, validator or product import has been used. This is not a PASS
receipt. Parent strong composed V and parent integration/gates remain required.

## Authority and independence

- Explicit source GO: `../../FULL44_Q2B1_QA_CODE_GO_20261019.md` relative to these
  outputs, 1827 B, SHA-256
  `f11cca0a9eceb68021d9a4e476519724af3dda23383c74f25ab08390d60c191c`.
  Its actual path is pinned in MANIFEST.json.
- Frozen packet: `../inputs/INPUT_MANIFEST.json`, 9945 B, SHA-256
  `07a7fbd63132bfee331fa7016e6425a47c07277c00b5f7b92b61bc003c3c7016`.
  All 29 entries / 407063 B were raw-byte hashed and every declared size and
  digest matched. The manifest pins are reproduced without following origins.
- Normative API: `../inputs/API_FIXED.md`, 6827 B, SHA-256
  `054eae63b730a5099419a122122254be7c013c9ff7c6f48470bd253a76414e7c`.
  API_FIXED supersedes the old commit signature lacking elapsed time and treats
  exclusive capture coordination as a trusted-composition precondition.
- NONBLIND to permitted qualified broker2a/V3/Q1 dependency source and parent
  contracts. Independent of the coordinator implementation: no candidate
  DualCaptureCoordinator.cs, author DESIGN, foreign QA, logs or origin files
  were inspected. No code was taken from an older QA implementation.
- Only these three owned outputs are written: DualCaptureCoordinatorTests.cs,
  QA_PLAN.md and MANIFEST.json.

## Actual imports and complete heap fixture

Entry point: `ReGraph.GuardV3.DualCaptureCoordinatorTests.Main`, C#4/.NET4,
same assembly as the actual internal product classes. The QA's only using
directives are System, System.Globalization and System.IO. There is no test
framework, substitute broker, substitute coordinator, reflection, private-member
access or product-facing test hook.

The actual referenced product declarations come from the pinned copies of:
GuardV3.Contracts.cs (CaseIdentity), GenericTargetPlan.cs (Q1 input, codec and
validated plan), GuardianCore.cs (managed authority/binding/predicates/signals),
BudgetedEvidence.cs (slots and real budget snapshots), CaptureWiring.cs
(ICaptureSource and HostCaptureReservation), WriterLedger.cs
(HostGlobalLedgerReservation only), and GenericEvidenceBroker.cs. KernelObserver.cs
is a qualified V3 reference, not an invoked observer. Parent must supply the
frozen coordinator and necessary pinned compilation closure and select this
Main; no compilation closure or linkage success is claimed by this worker.

Each Fixture constructs a real CaseIdentity and GenericTargetPlanInput and calls
the real GenericTargetPlanCodec.TryBuild. It creates coherent derived managed
authority/supervisor bindings, five inert distinct IntPtr labels with the exact
controller reference, the real capture/global-ledger reservation classes, eight
slot owners/unique target pin strings, a real GuardianHostSignals and eight
distinct MemoryStream-derived sinks. GuardianPredicates.HostComplete must succeed
before actual GenericEvidenceBroker.TryCreate, and factory success/None/no IO are
checked. No second WriterLedger/CaseBudget is constructed. No actual handle,
launcher, target, native observer or process is acquired or invoked. Q1 DOS-path
strings are lexical metadata only; no path is dereferenced.

Two distinct ICaptureSource fakes record real Read and AtEof calls. Their Read
checks the actual broker's 4096-byte buffer, offset 16 and count 4064. Sink writes
reach MemoryStream.Write except in the explicitly failing write fixture. Raw
GTC1 goldens are independently assembled from the public contract, not imported
from the broker's private encoder. Bytes are compared with heap sink contents.
Invalid UTF-8, NUL and CR/LF payload bytes remain raw. A positive baseline runs
before negative families; every sticky-HOLD negative gets a fresh fixture.

Exactly one successfully constructed coordinator is used per broker. No test
expects registration, second-instance rejection or HOST unforgeability. Other
producers use real broker reserve/stage APIs only; every commit in the QA goes
through TryCommitOne. There is no finalization/readback/ACK/Closed/release call.

## Coverage inventory

There are 30 textual Run call sites expanding by fixed loops to **72 named
cases**. There are **254 textual Check call sites**, excluding the Check
declaration. Neither number is a runtime assertion total. Check increments a
real long counter on every invocation. Callback failures also latch a QA-side
fault, preventing a product catch block from swallowing an assertion into PASS.

- `initial`, `pair-prepaid-detached`, `same-elapsed-both`, `54999-both` (4):
  initial LastElapsed=-1, states/counters, no IO, initial admitted sum
  ControlFileByteCount+19328, empty commit charging without HOLD; two distinct
  stream works and 8192 prepaid bytes before Read; busy/empty attempts; detached
  old snapshots; equal elapsed accepted, fresh empty-commit sample retained,
  monotone cross-API samples and 54999 accepted by both APIs.
- `capture-shape-0..2` (3): DATA-only, positive DATA+EOF, and empty EOF for both
  streams. Actual successful Execute leaves ReturnedRetained without persistence
  or EOF commitment; busy prepares do not regrant; each successful exact permit
  commit frees just its cell, clears that generation's observed marker and writes
  one batch. The two returned permits differ. Byte goldens, per-stream EOF after
  actual write, old snapshots and empty commits are checked. DATA-only cells can
  be prepared again; both committed EOFs suppress new grants without HOLD.
- `skip-committed-eof` (1): committed stdout EOF is skipped while non-EOF stderr
  can be reserved/read/committed again; stdout gets no additional Read.
- `nested-overlap` (1): actual nested fake-port calls give two coordinator engaged
  observations and two real aggregate broker PendingReads, without summing them.
  Busy prepare/empty commit during engagement are charged without new HOLD.
  Stderr returns and its real command is committed while the stdout fake Read
  has not returned; stdout stays engaged until actual return. Old snapshots
  remain detached. This is a same-thread observation fixture, NOT a progress or
  lock-exclusion proof.
- `noncapture-0,1,3,4,6` (5): real reserve/stage commands for ControlFiles,
  FixtureMarkers, GuardianEvidence, DriverEvidence and SupervisorResult. A
  successful noncapture commit returns its exact known permit, writes the
  expected destination bytes and does not free a ready retained capture cell.
  Subsequent capture commitment frees only the matching capture. The fixture
  uses the qualified broker's rotation, not a forged permit or private hook.
- `mixed-cap-prepare`, `mixed-cap-commit`, `cap-ready-no-write` (3): mixed
  busy prepares plus empty commits consume one shared 550-action budget. Each
  API's 551st attempt refuses without increment or port call; cap refusal wins
  over a supplied negative sample, with first GrantLimit preserved. A ready
  capture command cannot be written after cap, and a prepared unentered work
  cannot start a Read after the resulting HOLD. No claim that 550 coordination
  actions implement 550 driver probes/tours is made.
- `null-0..3`, `wrong-identity-ref`, `wrong-owner-ref` (6): each null constructor
  argument throws ArgumentNullException without IO; a same-values/different
  identity reference and a different owner reach actual broker reservation
  rejection with InvalidBinding/InvalidOwner and zero grants/Read calls.
- `elapsed-0..1-0..3`, `invalid-550th-debited` (9): for both APIs, negative,
  backwards, 55000 and long.MaxValue samples refuse with the exact ratified
  InvalidRange/InvalidState. Cross-API backwards samples are exercised; invalid
  commits have an actual ready command so using a stale prepare sample would
  be detected. Attempts, including further invalid attempts under HOLD, are
  debited when room remains. The 550th invalid prepare is charged, and a 551st
  attempt cannot change counters or overwrite its first cause. No unspecified
  LastElapsed value after an invalid sample is invented as an oracle.
- `latch-none`, `latch-first-cause`, `hold-prepared-retained`, `hold-during-read`
  (4): None becomes InvalidState; first cause remains sticky; prepared but
  unentered work stays ReservedNotEntered with burned admission and no Read;
  HOLD during an actually entered Read retains engagement/pending until actual
  return and does not fabricate EOF, a ready command, Free or persistence.
- `broker-held-constructor`, `external-broker-0..3` (5): preexisting broker HOLD
  and external HOLD observed at snapshot, prepare, commit and Execute entries
  propagate the actual first ReadFailed/InvalidRead reason and incident bits,
  preventing new reads/grants and positive writes.
- `external-signal-0..2-0..4` (15): each real incident bit is observed separately
  at constructor, snapshot, prepare, commit and Execute. InvalidState is latched,
  the original incident bit persists, CaptureHeld and EvidenceIncomplete are
  both set, and no new Read/write/grant is admitted. The real Mark method rejects
  a combined OR value; there is no fake signal implementation.
- `read-error-1..2-0..4` (10): on either stream, Read throw and AtEof throw map
  to ReadFailed(9), negative/4065 counts to InvalidRead(10), zero without EOF to
  EofUnestablished(11). Actual call/query counts, returned retention and pending
  clearing are checked. A prepaid ERROR frame commits successfully under HOLD,
  has exact u32LE code bytes, charges 20 bytes without new admission and frees
  just the successfully committed cell. HOLD/signals/first cause persist; this
  success is a negative-command write, NOT positive capture/global outcome.
- `duplicate-retained`, `stale-after-reprepare`, `duplicate-engaged`,
  `writer-reentry`, `writer-failure` (5): duplicate/stale Execute never calls
  Read twice; a stale descriptor cannot consume its newer same-stream descriptor.
  During an actual sink Write, CommitCallEngaged and broker CommitActive are
  observed, and recursive commit refuses without a second writer port call.
  Its outer nonnegative write returns false/null under HOLD even if heap bytes
  physically arrived; the capture cell is not freed. A throwing sink preserves
  WriteFailed, false/null, retained cell and uncommitted EOF.
- `capture-capacity` (1): 28 actual 4096-byte admissions/read/commit cycles consume
  114688 admitted bytes with eligible alternation and no double budget. The next
  prepare refuses BudgetExceeded before another Read/grant. The unreachable
  256-capture-grant limit is NOT fabricated past this smaller byte cap.

Shared helpers check ActionsDebited=PrepareAttempts+CommitAttempts<=550, all
eight slot C<=A<=capacity bounds, total charged against actual broker snapshots,
the total admission cap and capture cap. Assertions inspect actual return values,
real source/write call counts and exact returned permit identity where exposed.
False work/permit outputs are tested for null on the relevant paths. Positive
helpers are not used to demand successful admission from negative fixtures.

## Explicit static-review and integration limits

- Commit success before coordinator return bookkeeping cannot be forced through
  this fixed public surface without an approved interleaving seam. No callback,
  external completion boolean or fake read-return witness is substituted. Parent
  strong V must review that actual-return AND exact-successful-commit conjunction,
  including CommitObserved while still engaged. No runtime coverage is claimed
  for that particular race or its intermediate marker.
- Same-thread nested callbacks cannot prove cross-thread progress, independent
  lanes or absence of a C# lock around Read/Write (locks are reentrant). Actual
  external-port gate placement and synchronization require parent source review;
  truly blocked native stdout/stderr progress requires later authorized HOST
  composition. No Thread/Task/Join/Wait/Sleep/clock/Stopwatch/dispatch/cancel seam
  is introduced here.
- Both incident bits are observed with the real Mark implementation. Exact order
  CaptureHeld then EvidenceIncomplete is a source-review obligation, not an
  instrumented call-order claim from this sealed signal object.
- Snapshot detachment is tested through saved observations; absence of private
  mutable arrays/payload queues, exact work-reference validation and every
  implementation-wide port-under-gate prohibition remain source-review matters.
- The coordinator centralizes the real eight-slot broker writer. Heap commands
  here reach capture plus the five externally ordinary noncapture categories.
  GuardianResult and SupervisorReceipt are internal finalizer-only paths; they
  are not made ordinary or exercised by inventing an out-of-scope finalizer API.
  Full eight-slot routing and finalizer isolation require parent composed review.
- No IO-after-cap claim extends to external direct broker calls forbidden by the
  trusted composition. No test claims the system rejects a second coordinator.
- Heap writes are not durability; both EOFs and zero PendingReads are DATA, not
  Closed, join, native quiescence, ACK or authority release. No OS acquisition,
  physical writers, real pipe provenance, root clock, deadline authenticity,
  process cancellation, Gthread ACK, native/full44, 125s, DB/cache, Linux or
  G5/G7 qualification is provided.

## Reporting and handoff

Main emits exactly one compact ASCII line and returns 0 only after all cases
and the completed-case check succeed; failures emit one bounded case/counter
line and return 1. Only literal ASCII labels and invariant integer formatting
are used, with a conservative source-level line bound of 160 bytes (<1024).
There is no stderr write and no exception message/stack/payload logging. These
are source properties, not observed runtime output receipts.

Final handoff supplies raw hashes and byte sizes of all three outputs. MANIFEST
pins the two companion outputs; its own digest is provided externally to avoid
a self-hash cycle. Static parsing counted call sites only. Compilation, linkage,
actual case results, actual assertion count and stdout/stderr runtime behavior
remain UNOBSERVED; no dependency baseline count such as 69759 is borrowed.
