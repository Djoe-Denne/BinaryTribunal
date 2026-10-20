# BudgetedEvidence V3-Q1 — source-only candidate R1

## Status and provenance

- Task: `task_mvc422gy_0001_tt123k`, cycle 1, implementer/build.
- Session: `ses_eb719c39fffek3Q6ewu4sRu1aR`; Sol/max binding checked by parent.
- Bootstrap **NONBLIND**. No claim of blindness or packet-only context. Global
  harness instructions and the mandatory Serena initial-instructions manual were
  received; its root/language/memory-name metadata was not pursued. No memory,
  project source, board, inbox, results, or semantic index was consulted.
- Original packet: `inputs/V3_BUDGET_20261017`, seven physical files, 22210 bytes;
  all sizes and SHA-256 values checked against its preparation receipt.
- Original manifest SHA-256:
  `ba97ab600517f65429242e6a7b91dfbf5f33116d895a376ec2f9afd82142425d`.
- Original SCOPE SHA-256:
  `b8a3087a26c2fd6a6d998d677fcba3d6def7f7787e4b9409781fe283f388f130`.
- Addendum packet: `inputs/V3_BUDGET_CONCURRENCY_ADDENDUM_20261017`, three physical
  files, 4089 bytes; all sizes and SHA-256 values checked against its receipt.
- Ratified concurrency addendum SHA-256:
  `96b817ffbbcc1f50f4bb451b3db88a65f2d73c0dd660f2e1b144be7f33563a0c`.
- Access ACKs and distinct parent source GOs preceded creation. Earlier freezes
  are untouched. This directory contains only the four authorized new names.

**Not compiled, not executed, not independently reviewed, not integrated.** No
guardian/Job/native API, FF8, DB, filesystem-runtime, or project-integration result
is asserted. Text inspection and hashes are not compilation or test evidence.

## Public API and exact refusal semantics

Namespace `ReGraph.GuardV3`; C# 5 and .NET Framework 4.x surface only. No dependency
package, entry point, initializer that runs tests, or automatic runner is supplied.

- `new CaseBudgetV3(string nonce, string version)` creates one local case. The
  nonce is an opaque, nonempty immutable label; version must equal `V3-Q1`
  ordinally. Null/empty nonce or wrong/null version creates a held case. There is
  no nonce generation, format, authentication, MAC, uniqueness, or replay claim.
  Labels are not serialized here; an owner must bound any future serialization.
- `OpenSink(EvidenceSlot, Stream)` returns a `BudgetedSink`, or null after refusal.
  A slot opens once. Invalid enum, null Stream, or duplicate slot holds the whole
  case; after HOLD every open is refused. It never reads `CanWrite` or calls any
  Stream member. A nonwritable Stream is discovered only by its charged Write.
- `BudgetedSink.TryWrite(byte[], int offset, int count)` returns bool. Null buffer,
  negative/out-of-range values, or chunk over 4096 hold the whole case before any
  new charge or I/O. Range checking uses subtraction, never `offset + count`.
- A valid, inactive zero-byte call succeeds without calling the Stream or adding
  charge. Null/range validation still applies. A zero-byte attempt during active
  I/O is rejected exactly like a nonzero overlapping attempt.
- `GetSnapshot()` returns detached immutable case and slot values, including
  `TotalChargedBytes`, `Held`, `HoldReason`, `ErrorCode`, `IoActive`, per-slot
  capacity/charge/open state, and the supplied immutable labels. No mutable array
  is exposed. `snapshot.GetSlot(invalidEnum)` returns null without changing a case.

Only the first HOLD reason is retained. Numeric error codes are the explicit enum
values 0 through 12; no exception object, message, stack trace, arbitrary error
text, logger, or recursive diagnostic write is retained or emitted. Error
precedence in TryWrite is: existing HOLD, active I/O, sink identity, null buffer,
range, chunk, slot remaining, case remaining. OpenSink checks existing HOLD,
slot type, null Stream, then duplication.

False is **not** a statement that zero bytes reached the destination. An admitted
Write may finish after another call caused HOLD; its caller then returns false.
True is a local successful synchronous Write/zero-byte result and a non-held case
at the final locked observation, not a seal, acceptance decision, or promise that
another caller cannot subsequently hold the case.

## Fixed partition and arithmetic

All capacities are compile-time constants; no caller can raise them:

- ControlFiles: 32768 bytes.
- FixtureMarkers: 57344 bytes.
- CapturedStreams: 114688 bytes.
- GuardianEvidence: 24576 bytes.
- DriverEvidence, GuardianResult, SupervisorResult, SupervisorReceipt: 8192 each.

`32768 + 57344 + 114688 + 24576 + 4 * 8192 = 262144` bytes exactly.
`TotalCapacityBytes` is that constant expression, not a runtime setting. Chunks
are at most 4096. Charges use long counters but remain within these fixed bounds.

One short state lock covers validation and both charges. A request must fit both
`slotCapacity - slotCharged` and `262144 - totalCharged` before the additions.
Consequently additions cannot overflow: both old counters and the nonnegative
request are bounded by the relevant capacity. Offset arithmetic cannot overflow
either: after checking `0 <= offset <= buffer.Length`, compare count with
`buffer.Length - offset`. No addition of two unchecked caller integers is used.

The global guard is deliberately redundant while all eight slot invariants hold.
At exactly 262144 all slots are full; the next byte reports SlotCapacityExceeded
because the slot guard precedes the global guard. Reaching CaseCapacityExceeded
is not independently inducible through the valid public API and fixed partition;
tests do not fabricate a reflection-corrupted state merely to cover that branch.

## Admission, exclusion, and failure

For a nonempty valid request, admission increases the slot and case charges and
sets `ioActive` in the same critical section. It then releases the lock **before**
the only external callback, `Stream.Write`. No lock traverses any Stream member.

One I/O may be active per case, across all slots. Any overlapping TryWrite,
including a same-thread callback, cross-thread callback, different slot, malformed
request, or zero-byte request, fails with sticky ReentrantOrConcurrentWrite while
the case is not already held. It adds no charge and calls no Stream. There is no
I/O wait queue, fairness promise, or ordinary-concurrency success guarantee. The
owner must sequence calls if success is required. Short state-lock acquisition
still depends on ordinary thread scheduling; this is not a wait-free algorithm.

The already charged I/O may begin/finish even if HOLD is set between its admission
and callback. A normal return records only success of that synchronous callback.
An ordinary caught Exception holds the case with StreamWriteFailed unless an
earlier reason already won. Finally clears the active flag. Neither path refunds
any byte, even for a zero-prefix or partial-then-throw failure. Subsequent attempts
cannot resume, reset, reopen, or spend an apparent unused suffix.

The module guarantees not to create its own wait cycle around Stream.Write; it
does **not** guarantee return of a Stream that never returns, arbitrary hostile
callbacks, OS scheduling, process death, thread abort, stack exhaustion, or failed
allocation. These source-only methods are not a kernel or availability proof.

## Capability and ownership limits

The caller supplies and owns the Stream. No file/path is accepted or opened. The
module does not flush, seek, truncate, delete, overwrite existing bytes by seeking,
dispose, close, launch a process, create a Job, read a pipe, or implement IPC. An
ordinary sequential Write naturally advances the supplied Stream as defined by
that Stream. Buffer content and lifetime are caller responsibilities during Write.

Production destinations must be exclusive, byte-preserving Streams supplied by
the real owner. The module does not prevent another holder from writing directly
to the same Stream, aliasing it across slots/cases/processes, changing its position,
or making a hostile implementation write elsewhere or expand bytes. Internal
assembly access/reflection is not an adversarial security boundary either.

FixtureMarkers is a conservative reserved share for separately closed-source
writers, not proof that this object controls their remote writes. The local API
can exercise a memory sink for that slot; this establishes nothing about those
actual writers. All writer/slot/path uniqueness, interprocess binding, upstream
capture-before-read accounting, UTF-8/record serialization, single publication,
and integrated host logical-output totals remain parent integration obligations.
There is no universal filesystem quota or cross-process budget authority here.

## Test SOURCES and independent expected fixtures

`BudgetedEvidence.Tests.cs` provides only `BudgetedEvidenceTests.RunAll()`. Its 20
top-level invocations cover fixed partition/codes; detached snapshots; exact slot
and global boundaries plus one extra byte; exact append/slice bytes across slots;
invalid binding/enum/null/duplicate cases; ten null/range/overflow attempts; 4096
versus 4097; inactive zero-byte behavior; Stream ownership; zero-prefix and
partial-prefix exceptions; same-thread zero/nonzero and cross-slot reentrance;
first-reason retention; cross-thread callback; and controlled same/other-slot
overlap including zero bytes.

Expected capacities, totals, byte sequences, error codes, and reservations are
literal independent fixtures, not generated from a call to the module's admission
algorithm. The full-boundary fixture uses literal chunk counts
`8,14,28,6,2,2,2,2`, exactly 64 writes of 4096. Failure fixtures request 10 and keep
known prefixes 0 or 3; expected charge remains 10. Controlled overlap reserves 7
before the second attempt; expected final charge stays 7. Tests never reconstruct
the implementation's admission algorithm as an oracle.

Streams are MemoryStream or in-memory simulated subclasses. The ownership probe
throws if CanWrite/Flush/Seek/SetLength is touched and counts disposal. Its direct
caller append intentionally demonstrates that these counters are not authority
over every writer. No fixture creates a file, process, Job, database, or socket.

Concurrency fixtures confirm entry into a retained first Write before starting
the second attempt. The second runs in its own thread so a broken implementation
cannot make the test's coordinator wait unboundedly on its lock. Joins/signals
have fixed 1/2/5-second bounds, no Sleep or race-winner assumption. Finally releases
the retained stream; signals are disposed only after their users joined. Fixture
threads are background threads, not forcibly aborted. A parent runner still owns
overall timeout and scheduling qualification; these are not arbitrary-hang proofs.

## Handoff

Only source creation, bounded text inspection, byte counts, and SHA-256 hashing
were performed. No C# compile, import, test invocation, artifact execution, Job
API, native/API harness, DB/Git operation, or central source modification occurred.

`MANIFEST.json` pins the other three artifacts and both input packets. Its own hash
is returned separately to the parent to avoid a self-referential manifest. Fresh
independent review, parent-authorized compilation and in-memory test execution,
then any privileged integration and host proof remain separate gates. This local
source delivery does not close the mission or promote any older HOLD/proof.
