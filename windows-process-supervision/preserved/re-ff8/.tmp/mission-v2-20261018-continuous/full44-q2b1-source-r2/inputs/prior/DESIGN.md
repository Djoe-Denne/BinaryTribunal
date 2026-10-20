# DualCaptureCoordinator — proposed UNBOUND source2b1

Status: **PROPOSED_NOT_VALIDATED**, NONBLIND to the supplied frozen references and
parent dispositions. No implementation QA was inspected. No compiler, typecheck,
transpile, test, run, validator or product import was performed. This document
does not qualify this source, the HOST, full44, native progress or a live campaign.

## Authority and owned scope

- Fixed API: `FULL44_Q2B1_API_FIXED_R1_20261019.md`, 6,827 bytes, SHA-256
  `054eae63b730a5099419a122122254be7c013c9ff7c6f48470bd253a76414e7c`.
- Source GO: `FULL44_Q2B1_SOURCE_GO_20261019.md`, 1,372 bytes, SHA-256
  `f5ee11a68a91fc81f3f59a1caef2dd5e6fdc5cc2d584aed96efbb6d5c168ae2c`.
- The 28 original pins total 398,548 bytes. Raw `INPUT_MANIFEST.json` is 9,531
  bytes, SHA-256 `0e9c916492695260f3e4c8c7938361719d8a3ce80379d5e920ac76e00bc4637e`.
  Per-file pins and before/after-source verification are recorded in the manifest.
- Qualified broker2a source remains the unchanged reference
  `abb7713d7ca00e9229d100aefeef9a0650ba72fd13e521accd5d140b34ffb6b2`.
  Its parent receipt reports 69,759 heap assertions; that is dependency evidence,
  not a test performed here and not native/physical-writer/durability evidence.
- Only `DualCaptureCoordinator.cs`, this `DESIGN.md`, and `MANIFEST.json` are
  authored. No broker, V3, contracts, main, QA or another worker's output is edited.

The API is the parent-fixed C#4/.NET4 surface in `ReGraph.GuardV3`, including
`TryCommitOne(long elapsedMilliseconds, out WritePermit committed)`. No business
failure enum, broker API, dispatch port or finalizer wrapper is added. Work and
snapshot constructors plus registry helpers are internal implementation helpers.

## Ownership and bounded metadata

One coordinator per broker, exclusive capture-grant/read and commit entry, and no
concurrent finalization/readback are **trusted composition preconditions**. The
frozen broker supplies no coordinator registration mechanism. Another coordinator
or direct broker calls are not mechanically prevented. Other trusted producers may
reserve/stage noncapture commands, but must use this coordinator's commit route.
Neither a nonnull object nor a reference/pin acquires a HOST resource or authority.
The actual broker revalidates exact identity/owner references when reserving.

The coordinator owns two fixed cells, one per stream, retaining at most two
current descriptors. It creates no payload buffer, frame encoder or growing queue.
Fresh descriptors prevent old aliases from addressing a later generation. The
caller can retain old objects; no process-wide or arbitrary-caller heap bound is
claimed. Immutable snapshots allocate observations, not retained coordinator queues.

The work privately retains owner/permit references and exposes only `StreamId`
and `Execute()`. A copied/constructed descriptor is not sufficient: entry checks
the exact registered object, owner/permit association, current state and one-shot
flag. No external count, EOF, completion callback, mutable payload or join marker
is accepted. No permit is exposed through the work or snapshot.

## Lifecycle and real broker calls

1. `Free`: no current descriptor/permit and `CommitObserved == false`.
2. `ReservedNotEntered`: actual `TryReserveCapture` succeeded; no broker read call
   has been engaged. This is neither queued nor dispatched work. Reservation is
   recorded before descriptor allocation; allocation failure holds and retains the
   admitted permit without a descriptor or refund.
3. `BrokerCallEngaged`: one-shot entry was accepted under the gate, then actual
   synchronous `TryReadReservedCapture` is invoked outside it. Engagement may
   precede actual port entry and is not a per-stream actual-Read counter.
4. `ReturnedRetained`: the actual broker call has returned/thrown; its reservation
   remains retained until a successful commit returns that exact permit object.

Only actual broker-call return/throw changes Engaged to ReturnedRetained. Only
that state plus an exact successful commit frees a cell. If a commit is observed
while the wrapper is still Engaged, `CommitObserved` is recorded but the cell is
not freed until return bookkeeping. Freeing clears descriptor, permit, one-shot
and commit markers, so a free cell never advertises a prior generation's commit.
Failed writes, unrelated noncapture commits and snapshots cannot free a cell.
An abandoned positive read can remain ReturnedRetained indefinitely under HOLD.

`TryPrepareNext` considers at most two cells, skips busy/committed-EOF streams,
and invokes `TryReserveCapture` at most once. Preference alternates after an
actual successful reservation. All-busy/all-EOF is an empty action, not an incident.
Broker2a alone owns the budget, buffers, real count/AtEof observations, sequence
numbers, framing and prepaid ERROR eligibility. There is no new read on a stream
whose EOF is already committed in the sampled broker state.

`Execute == true` means the broker accepted that read's staging. It does not mean
EOF, write persistence, capture completion, independent scheduling or global
success. A prepared descriptor first invoked after HOLD consumes its one-shot
flag but never invokes a new broker read, stays ReservedNotEntered and retains
its burned reservation. Duplicate/stale execution refuses with InvalidPermit.
Already-engaged calls remain represented until actual return even if HOLD races.
The fence is on new engagement/admission, not a physical Read-entry oracle: a
broker read already admitted before HOLD can enter the supplied port afterward.
If only the coordinator engagement preceded HOLD, the real broker's sticky check
can refuse before any port Read. Both cases require the actual broker call to
return before return bookkeeping; the coordinator does not guess which occurred.

## One writer and locking

`TryCommitOne` engages one writer flag before calling actual `TryCommitNext`
outside the coordinator gate. It selects no destination and adds no writer path:
the broker arbitrates all eight slots. Overlap/reentry refuses without invoking
the writer port and latches ConcurrentOrReentrantOperation. Empty returns false
without itself creating HOLD. False always leaves out `committed` null. A true
return reports one broker-accepted command, including a real prepaid negative
ERROR under permanent HOLD; it is never a positive case outcome.

The gate protects short metadata operations. Frozen concrete no-port broker
GetSnapshot, TryReserveCapture and LatchIncomplete may nest under it, as ratified;
their inspected implementations have no supplied IO/property callbacks. There
is never a coordinator gate across Read/AtEof, Write, Seek or Stream properties.
Read return bookkeeping acquires the coordinator gate only after the broker call
returns/throws. The broker does not call the coordinator while holding its gate.
Same-work and writer reentry are refused; no thread identity or global callback
stack oracle is invented.

The two different descriptors can engage separately without holding a gate over
either read. The caller must supply two actual independent execution lanes to
obtain that HOST behavior; this source creates no lanes and does not prove a
blocked stdout cannot prevent stderr progress. No active call is canceled,
aborted, closed, joined or declared returned by a flag or snapshot.

## Shared action bound and supplied time

There is one lifetime pool of 550 prepare-plus-commit actions. If room exists,
the applicable attempt counter and total are debited before incident checks,
elapsed validation or action. Empty, invalid-sample and held attempts count.
`ActionsDebited == PrepareAttempts + CommitAttempts <= 550`. The 550th admitted
attempt may act; the next attempt latches GrantLimit without increment or IO.
There is no reset, second counter pool, retry/drain loop or wait. Execute uses
its existing prepare reservation and does not buy another action/grant.

Both prepare and commit require a supplied integer elapsed sample >=0,
nondecreasing from the last structurally valid sample. Initial LastElapsed is -1,
meaning no sample. Invalid/negative/decreasing samples latch InvalidRange and do
not replace the prior sample. A nondecreasing sample >=55000 is recorded and
refuses with InvalidState; later rollback cannot regain negative-write permission.
Every commit, including an ERROR under HOLD, still requires a valid sample and
remaining shared action allowance. No read/commit already engaged is canceled by
these checks. There is no internal clock and no proof of sample freshness,
monotonic HOST/root time, 55-second actual return or the driver's 550 thread probes.

## Sticky HOLD and observation

Entry and snapshot observation read actual broker state/failure and concrete
signals. A broker failure observed with no local cause is adopted first; otherwise
an observed nonzero signal latches InvalidState. This observation order does not
claim the physical ordering of external incidents. LatchIncomplete(None) maps to
InvalidState; out-of-range failure values map to InvalidRange. First local cause
is permanent. Unexpected internal exceptions latch ProductionFailed; constructor
or snapshot allocation failure may rethrow rather than fabricate an observation.

HOLD first fences local admission, then latches the actual broker, then calls
`signals.Mark(CaptureHeld)` and separately `signals.Mark(EvidenceIncomplete)`.
No combined-bit Mark call is used. HOLD neither clears active calls nor refunds
reservations. Broker2a handles Read/AtEof/write failures with its original codes;
no synthetic count, zero, EOF, partial payload or replacement ERROR is produced.
An observed signal-only incident is followed by a fresh memory-only broker
snapshot so the returned snapshot includes the real HOLD publication.

Snapshot fields are detached immutable data. ReservedNotEntered and Engaged are
derived only from current local lifecycle states. Broker.PendingReads is the
broker's real aggregate counter and can overlap Engaged. These quantities are
not additive, per-stream actual-Read witnesses or proof of simultaneous OS state.
CommitObserved can overlap Engaged; ReturnedRetained plus that marker immediately
frees the cell under the gate rather than exposing a prior-generation marker.
Two committed
EOFs and zero pending reads remain DATA observations, never thread joins, ACK,
KernelQuiescent, Closed, release or native provenance. External changes after any
sample remain possible; no snapshot supplies a HOST synchronization boundary.

## Explicit remaining gaps and gates

Future trusted HOST work still owes independent two-lane scheduling, original
handle provenance and ownership, a pipe adapter that supports broker offset 16
and its allocation contract, cancellation with actual Read return, worker joins,
G-thread ACK, physical-writer ownership/durability and KernelQuiescent/CDB-1.
These need their own authorization and gates, not labels/tickets as authority.

No Thread/Task, dispatch interface, cancel/join, clock, Wait/Sleep, native/FFI,
handle/IO-path acquisition, ACK or finalizer wrapper is introduced. 125s, DB/cache,
Linux, G5/G7, full44 and live remain excluded. Parent-owned independent API-only
QA, fresh composed review and isolated compile/run gates remain required; this
delivery contains source and static hash evidence only.
