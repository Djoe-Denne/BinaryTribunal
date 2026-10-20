# GenericEvidenceBroker -- source2a bounded R2 proposed source

NONBLIND author delivery, task `task_mvf04bga_0015_0w86r8`. Only this DESIGN,
`GenericEvidenceBroker.cs` and `MANIFEST.json` in `full44-q2a-source-r2/outputs/`
are owned outputs. R1 remains frozen. No compiler,
typecheck, transpilation, product import, test, validator, native or live run was
performed. Source GO is not source acceptance. Independent QA, fresh composed V
and subsequent parent-only gates remain required.

## Fixed authority and imports

The R2 packet has30 pins/421286B; RAW INPUT_MANIFEST is9869B,
SHA256 `8880a92146ebb5a74cb4155f9ba7e5f05ae1e1231bdac3cce18f14f68548aa25`.
It includes the author's own frozen R1, fixed API/ERROR oracle and the new parent
admission/credit policy. No QA implementation or foreign/composed DESIGN was read.
The two R2 authorities, pinned in MANIFEST, are SCOPE.md/direct GO (1626B,
`88bf438b2a8a8b908aad8c69022d299849b40837aea31d1b58104059aa2cf7da`) and
API_R2_ADMISSION_CREDITS.md (4861B,
`d605f9c37bfe1ad5e62139356cb1c54c1c05022e4cc10ec43b7ded9b2df9187d`).
The ERROR oracle remains unchanged: codes9/10/11 and command-level TRUE for a
successful prepaid ERROR write under sticky HOLD.

Namespace `ReGraph.GuardV3`; C#4/.NET4; imports only `System`, `System.IO`.
Existing types, not substitutes: CaseIdentity; GenericTargetPlanV1 and its scalar
metadata; GuardianHostBinding/Authority; GuardianGlobalLedgerReservation;
GuardianCaptureReservation; GuardianSupervisorBinding; GuardianLaunchIntent;
GuardianTerminalPublication; GuardianPredicates' managed HostComplete gate and
pure comparisons/pin checks;
ICaptureSource; CaseBudgetV3/BudgetedSink/CaseBudgetSnapshot. Constants for
GuardianMemoryEvidence18432 and publication192 are reused, not redefined upward.
The parent supplies/compiles the frozen dependency closure separately. This file
does not instantiate WriterLedger, GuardianCore, a host, native adapter or pump.

TryCreate first reuses the EXISTING GuardianPredicates.HostComplete(binding),
before any reference copy, buffer or sink. A false predicate yields InvalidBinding
and broker=null, with no supplied Stream call. This adds V3's exact five transfers
(kind/ordinal/authority/valid distinct handle values), exact original controller
reference, nonnull signals with Signals.Read()==0, and all other existing managed
checks without duplicating/modifying V3. All prior plan-specific comparisons and
local owner/identity/epoch/reservation/intent/pin checks remain. Eight distinct
nonnull Stream references and two distinct nonnull ICaptureSource references are
still required. Owned reference snapshots are checked again before sink creation.
HostComplete is a managed trust-data gate, NOT proof of native acquisition,
durability or permanently stable host state. No supplied Stream member is invoked.

## Exact fixed API

Enums and numeric values are those of API_FIXED_R1. Signatures on the broker:

```csharp
internal static bool TryCreate(GenericTargetPlanV1 plan,
    GuardianHostBinding binding, Stream[] destinations,
    ICaptureSource[] captureSources, out GenericEvidenceBroker broker,
    out GenericBrokerFailure failure);
internal bool TryReserve(CaseIdentity identity, object owner, EvidenceSlot slot,
    GenericBrokerRecordKind kind, int reservedBytes, out WritePermit permit);
internal bool TryReserveCapture(CaseIdentity identity, object owner,
    byte streamId, out WritePermit permit);
internal bool TryStage(WritePermit permit, byte[] source, int offset, int count);
internal bool TryReadReservedCapture(WritePermit permit);
internal bool TryCommitNext(out WritePermit committed);
internal bool TryBeginFinalization(GuardianTerminalPublication publication);
internal bool TryReadBackGuardianResult();
internal bool TryCopyAcknowledgementData(byte[] destination, int offset,
    out GuardianTerminalPublication publication);
internal void LatchIncomplete(GenericBrokerFailure reason);
internal GenericBrokerSnapshot GetSnapshot();
```

Snapshot getters: State, Failure, Budget, CaptureGrants, OtherGrants,
OutstandingOrdinaryPermits, PendingReads, ReadyCommands, CommitActive,
ReadbackActive, AcknowledgementDataExported; methods
`long AdmittedBytes(EvidenceSlot slot)` and `bool EofCommitted(byte streamId)`.
All use readonly backing fields; admitted counters are copied privately and no
mutable private array is exposed. Invalid detached queries return -1 for a slot
or false for a stream, without changing the broker. Budget is the detached real
CaseBudgetSnapshot, not a recomputation of C or a payload-size estimate.

The GTC1 header helper remains private, not an additional API or reflection test
port. WritePermit has no caller-mutable state. An unrecognized new object is not
a grant: recognition requires the exact current object in one private cell.

## Admission, protected credits and grants

Exactly one private CaseBudgetV3 and eight private BudgetedSinks. Caps remain:
control32768, markers57344, shared capture114688, GE24576, driver8192, GR8192,
SR8192, receipt8192; total262144. No second writer/budget exposes an alternate path.

Initial irreversible A is `plan.ControlFileByteCount + 19328`:
known Q1 aggregate control bytes plus GE18432, SR512, GR192, receipt192.
No payload getter of the plan is called or copied to learn those sizes: Q1's
already-qualified immutable scalar count is reused. This admission count does
not attest that all controls are published or that their runtime contents match
host pins; those remain trusted-host coverage obligations.

Prepaid pools are consumed once, without increasing A again:
- ordinary ControlFiles draws only the known control pool;
- ordinary GuardianEvidence draws only GE18432;
- deferred GuardianEvidence requires FRESH A from the remaining GE6144 envelope
  and total cap; it NEVER consumes the ordinary GE18432 prepaid pool;
- deferred SupervisorResult draws only its protected512;
- ordinary SupervisorResult and declared marker/driver writes require fresh A;
- GR and receipt are never available to ordinary external grants.

Control/GE Ordinary cannot extend their pools with fresh credit after exhaustion.
SR DeferredFinal cannot extend its protected512. DeferredFinal remains permitted
ONLY for GE and SR; Control/Markers/Driver DeferredFinal remain InvalidState.
CapturedStreams remains capture-reserve-only, and GR/receipt internal-only. All
fresh checks retain the slot/total ceilings, irreversible debit and no-refund rules.

Each new external grant reserves1..4096 bytes. Fresh A is checked against both
slot and case remaining capacities before addition. A/prepaid consumption and
grant counters precede payload allocation, staging, Read or construction. An
unused suffix of a permit is burned, not restored. For every slot, physical C
is the frozen budget's charged bytes and always satisfies0<=C<=A<=cap.

Two distinct internal grants for GR192/receipt192 are admitted at creation and
count in OtherGrants immediately, reserving terminal grant headroom. Therefore
at most254 external noncapture grants remain; all256 include the two internal
ones. CaptureGrants<=256 is shared by both streams, not a per-stream quota.
Tokens are never recycled. The broker retains current tokens only; its lifetime
emissions are bounded by256 capture+256 other objects. No refund/reset/retry path.

## Cells, Stage and manual capture

Two capture cells, one outstanding permit/read per stream. Four noncapture cells
TOTAL: three external plus one reserved internal cell reused sequentially for GR
and receipt. DeferredFinal consumes an external cell too. No fifth command cell,
list, queue, raw spool or hidden copy. Buffers are lazy and allocated only after
admission: at most6x4096 payload bytes, plus one private readback192 array.
The existing G evidence memory is not recopied into a second18432-byte spool.
This is NOT a proof of total heap4096: metadata, CLR overhead, existing input DTOs,
publication memory, tokens and caller-retained snapshots are distinct.

TryStage permits only an external noncapture Granted token in Ordinary. It
validates the entire range and copies0..min(reserved,4096) into its private cell
under gate. The caller keeps source stable during the call; later mutation has
no effect. Zero-length Stage burns the already-positive reservation when its
command commits, following V3's zero-byte/no-Stream-write behavior; it is not an
EOF witness. TryStage never lends a buffer. Capture and repeated/stale/foreign
tokens are refused. The caller must obtain its permit BEFORE producing source
bytes; the broker cannot prevent arbitrary work in an external caller.

TryReadReservedCapture makes one manual ICaptureSource.Read(buffer,16,4064),
then the real AtEof getter if the returned count is valid. Both calls are outside
gate; the private cell remains ReadPending until they return or throw. Trusted
pinned capture ports must not retain/mutate that borrowed array after return.
Two different reads may overlap; no source2b coordinator/thread/drain is supplied.

GTC1: header16, little-endian, magicGTC1, stream1/2, kindDATA1/EOF2/ERROR3,
flags0, independent u32 sequences starting1, payload length u32. Raw bytes stay
verbatim, including NUL/invalid UTF8. Each batch is one permit/one sink commit:
- positive withoutEOF: DATA;
- positive withEOF: DATA then EOF, two DISTINCT consecutive sequences;
- zero withEOF: EOF;
- exception Read/AtEof: ERROR payload `09 00 00 00`;
- count outside0..4064: ERROR `0A 00 00 00`, without calling AtEof;
- zero withoutEOF: ERROR `0B 00 00 00`.

Two headers are prepaid by4096, hence max read4064 even though a standalone
frame permits payload4080. ERROR is20B, contains no partial guessed DATA and no
exception text. Read error returns false and latches HOLD. Its exact per-read
9/10/11 payload is retained even if another incident won the case's first error.
A successful positive read racing an unrelated HOLD is abandoned, not converted
into fabricated ERROR or published as positive data. No new Read/grant under HOLD.

## Writer, HOLD and immutable observation

Granted->ReadPending/Ready->Writing->Spent; abandonment never creates credit or
successful terminal evidence. A private cell binds token to broker, exact owner,
identity/epoch, slot, ordinal, amount and kind. Replay is no longer recognized.
OutstandingOrdinaryPermits counts capture plus ordinary external commands until
their real commit returns; DeferredFinal is deliberately not treated as ordinary.
No ActiveProducers or external 'producer finished' boolean is used.

TryCommitNext performs at most ONE ready command/batch. Ordinary selection rotates
over the two capture and three external cells; a pending read holds no gate and
does not block a different ready cell. Empty returns false/null without HOLD.
Commit/readback overlap or replay/state/range/owner inconsistency is fail-closed.
Only this method calls BudgetedSink.TryWrite, always outside broker gate. Frozen
V3 charges C before the supplied Write. Exceptions/refusals preserve both charges.

HOLD preserves the FIRST bounded failure forever and never clears in-flight IO.
Only an already-paid capture ERROR can still be selected under HOLD. If its real
sink accepts it, TryCommitNext returns TRUE and that token, Ccapture grows20,
and HOLD/Failure remain unchanged. This is command-write success ONLY. A failed
sink returns false/null; no retry/refund. Positive DATA ready before HOLD cannot
be published afterward. Two existing errored reads can each publish once.
outcommitted is nonnull only with a true result. No method marks EOF except a
successful actual EOF-containing commit while the case is not held.

Snapshot uses bounded private copies and the real frozen budget snapshot. During
IO, the already-admitted A precedes C and the internal active flag remains true.
If a supplied port never returns, the active flag/pending count is never erased
to manufacture idle. No broker gate is held across Stream properties, Read,
Write or Seek. There is no Sleep, join, wait loop, implicit retry or runner.

## Finalization, real destination readback and explicit ACK stop

TryBeginFinalization requires: Ordinary/no HOLD, exact publication.Identity
reference, two committed EOFs, ordinaryOutstanding0, pendingReads0, no active
commit/readback and a nonheld/idle actual budget. It atomically seals ordinary
admission, copies publication192 under its preadmitted GR grant, and enters
Finalizing. Publication data alone is not a kernel/quiescence witness.

Order, driven manually by callers:
1. TryBeginFinalization -> internal GR ready.
2. TryCommitNext -> actual GR sink Write192 -> idle NeedReadback.
3. TryReadBackGuardianResult -> real GR destination properties/Seek/Read outside
   gate under an exclusive lease. It seeks Position-192, checks the seek result,
   performs<=192 positive-progress reads of exactly the remaining192 bytes, and
   checks final position. Short/nonprogress/overcount/seek/property exception is
   ReadbackFailed. No implicit recovery seek, flush or close on failure.
4. Compare the actual read bytes with the private GR cell, not a publication copy
   masquerading as readback. Mismatch is ReadbackMismatch/HOLD. Only after equality
   does the SAME internal cell stage those read bytes under the second prepaid
   receipt grant.
5. TryCommitNext -> actual receipt Write192 -> WaitingGuardianAcknowledgement.
6. TryCopyAcknowledgementData permits one validated copy192 to caller storage and
   returns the exact bound publication reference. Export attempt is single-use.

DeferredFinal remains registered/outstanding and NONCOMMITTABLE throughout this
tail; it is never marked Spent to claim idle or closure. ReadyCommands can include
such parked deferred data; it is not a count of eligible writes. FinalRecords and
Closed are reserved enum values with NO reachable transition or ACK port in2a.
There is no GuardianSupervisorAcknowledgement construction, boolACK/Sealed echo,
Run/Acknowledge invocation, Stream close/delete, authority/lease release orCDB-1.

## Honest limits and future heap checks, not executed

Distinct object references do not prove distinct physical paths/handles, freshness,
native pipe provenance, acquisition, durable storage or absence of wrapper aliasing.
DurableReservation's opaque object does not expose the Q1 reservation labels;
their acquisition/matching is not fabricated. Trusted host must enforce one broker
instance per case and full concrete writer coverage; this is not a cross-instance
global uniqueness registry or security boundary against hostile assembly code.
HOLD is local memory state, not an independent native stop implementation.
G-owner-thread ACK, cancellation, joins, hard real-time return, host quiescence,
last-close and release remain future host gaps. No stream is opened or owned here.

Independent future heap QA can falsify: complete managed V3 admission (including
reconstructed-controller/null-signals/incidents), all eight C/A paths; protected
GE Ordinary18432 vs FRESH GE DeferredFinal6144 and SR Ordinary vs Deferred512;
control/GE pool exhaustion without fresh fallback; immutable Stage and
snapshot aliases; exact owner/identity/epoch and foreign/stale tokens;256/256
including the two initial internal grants; three external cells plus reserved
internal cell with parked deferred commands; two manual pending reads and writer
reentrancy; ERROR9/10/11 bytes and TRUE-under-HOLD semantics; DATA+EOF sequences;
exact cap/no free EOF probe; short/mismatched/throwing/reentrant GR destination;
receipt order and one export; permanently blocked IO not reported idle; no reachable
Closed/FinalRecords. These are proposed checks, NOT worker test results.

Q1's632 assertions are dependency receipt facts only, not reexecuted or broadened.
Time5/20/30/55, core4096/300 and future coordinator550 probes/100ms bounds are
unchanged; this broker runs no clock or coordinator. No125s/DBcache/Linux/full44,
FF8/G5-G7/native/host qualification follows from this delivery.

Reference anchors: inputs/reference/BudgetedEvidence.cs:119-297;
GuardianCore.cs:63-106,275-317,353-413,961-975;
CaptureWiring.cs:24-27; WriterLedger.cs:114-140;
GenericTargetPlan.cs:182-213; contracts/DUAL_STREAM_BUDGET.md:64-150;
parent API_FIXED_R1:64-118; CAPTURE_ERROR_CLARIFICATION:7-45.

## Bounded R2 delta and unchanged limits

Only two behavioral deltas from owned frozen R1: reuse HostComplete in
ValidateInputs before copies/sinks, and make GE DeferredFinal admission fresh
instead of consuming the ordinary GE prepaid pool. Provenance comments and this
DESIGN/MANIFEST are updated; no other source behavior was rewritten. Parent policy
anchors: inputs/API_R2_ADMISSION_CREDITS.md:10-20,22-58; direct GO:
inputs/SCOPE.md:3-19. Existing predicate: inputs/reference/GuardianCore.cs:275-317.

OtherGrants initial2 remains unchanged. No public signature, enum, DTO, frozen V3,
Q1 codec, cap, time profile, GTC1 layout, ERROR/HOLD semantics, Stage range/copy,
cell/grant bound, actual readback, receipt or ACK-stop change. No ACK/Closed tail
or new host implementation. Both new behaviors are PROPOSED SOURCE corrections,
not executed proofs; new fresh V and parent gates remain required. Frozen R1 and
all packet inputs were left intact. No foreign QA implementation was consulted.
