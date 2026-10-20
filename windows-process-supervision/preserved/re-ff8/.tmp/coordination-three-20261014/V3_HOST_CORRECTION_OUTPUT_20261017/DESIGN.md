# Host source V3 — launcher S, writer ledger (#6), capture (#7/#8) — corrected delivery, HOLD for delta review

> **CORRECTED DELIVERY — role V3-HOST-CORRECTION, fresh author disjoint from v3-host-source-r1 and
> from every prior V3 author/reviewer. DELTA ONLY over the first source delivery.** Defect 1 of the
> host review is fixed in `WriterLedger.cs`: `TryReadBackGuardianResult` re-reads EXACTLY the 192
> bytes from the GuardianResult destination the sink already wrote — never a copy of the source
> buffer. The review's DESIGN misstatements are corrected in place (the state matrix, the "proven"
> claims on the 192-byte readback/ACK path, the `EvidenceIncomplete` latch attribution, and the
> `ControllerLost` attribution). Nothing else changed; the frozen core stays untouched; intake
> pins recalculated 11/11 (173920 B). This correction output contains exactly `WriterLedger.cs`,
> this corrected `DESIGN.md`, `Host.Tests.cs` (re-pinned byte-identical) and `MANIFEST.json`;
> `HostLauncher.cs` and `CaptureWiring.cs` are not re-delivered and stay byte-identical at their
> intake pins.

Role V3-HOST-SOURCE (original delivery), corrected by V3-HOST-CORRECTION. **NONBLIND**:
the frozen sources were read as required provenance. No compiler, test, Win32 call, process
launch, Job API, native run, pipe, DB, Git, IDB or delegation was used. Byte/hash calculations
and static text inspection are not compilation or tests.

## Status and unchanged gates

The source delivery directory contained exactly `HostLauncher.cs`, `WriterLedger.cs`,
`CaptureWiring.cs`, `Host.Tests.cs`, the original `DESIGN.md` and its `MANIFEST.json`. It
implements the ABSTRACT host seams the frozen core requires to become runnable at qualification
(gate 000c); it compiles none of them.

The frozen core is referenced and **UNTOUCHED** (parent re-hashes before review):

- `GuardV3.Contracts.cs` (ABI1) `bb4758cc…`, 8016 B.
- `GuardianCore.cs` `7d4d2c66…`, 71132 B.
- `BudgetedEvidence.cs` `0944a3bb…`, 11846 B (module byte-identical; the admitted budget
  correction was FIXTURE-ONLY, so this module pin is unchanged).
- `KernelObserver.cs` `a419fc42…`, 21557 B.

Governing draft2 `bb69e0ad…`; ABI1 `bb4758cc…`. Case6 last-close remains **NOT_ESTABLISHED**
(co-location neither qualifies nor contradicts it); case8 host and the integrated/global budget
are not qualified. No compile/full44/L9/L10/native/FF8/integration gate is promoted here.

## Ratified model: co-located S/G (not a defect), multi-process NOT_PROVEN

Parent arbitration (plan-GO phase 3): the **co-located S/G in-process model is CONFORMANT to the
frozen contract**. `GuardianSupervisorAcknowledgement.Matches` requires the exact publication
**reference** (`GuardianCore.cs:409`) and DESIGN G:150-157 requires the launcher to keep the same
`GuardianCore` owner object alive during the handshake. S therefore holds the live `GuardianCore`
object; "launch of G", "wait for the G handle" and "G-loss" are modelled on that owner object's
lifecycle through the `IGuardianProcessHost` seam, consistent with the invariant that the only
processes manipulated are in the code.

**NOT_PROVEN (published as a model limit, not a defect):** real multi-process S/G — a separate G
OS process, IPC transport of the 192-byte publication, a durable cross-process readback, and a
real OS handle on the G process — is out of this tranche. It is not expressible under the ratified
ABI (reference equality) and is not an ABI modification request.

## File decomposition (6 files; 4 concrete subclasses co-located with their wiring)

| File | Contents |
| --- | --- |
| `HostLauncher.cs` | `HostAuthority`, `HostSupervisorBinding`, `HostAttestation`, `IGuardianProcessHost`, `HostLaunchState`, `HostLaunchResult`, `HostLauncher` (S orchestration). |
| `WriterLedger.cs` | `HostGlobalLedgerReservation`, `WriterLedger` (#6) — now including the durable readback of defect 1. |
| `CaptureWiring.cs` | `HostCaptureReservation`, `ICaptureSource`, `CaptureStatus`, `CapturePump` (#7/#8). |
| `Host.Tests.cs` | `HostSourceTests.RunAll()` plus `Fake*` doubles (not run). |
| `DESIGN.md` | this document. |
| `MANIFEST.json` | pins, stage, published co-located/multi-process limit. |

Each concrete subclass lives beside its wiring because the abstract host capability is meaningful
only together with the host logic that fills it. No seventh file.

## Integration map (seam consumed : source:line : behaviour)

Frozen abstract capabilities derived by the host (protected constructors):

- `GuardianHostAuthority` `GuardianCore.cs:14-27` → `HostAuthority` carries Identity, durable
  reservation, lease/intent/image/ledger hex pins, `Mode`, and binds `AbiPin`/`ContractPin` to
  `GuardianPredicates` (`:221-222`) so `HostComplete :283` holds. No hash is fabricated.
- `GuardianCaptureReservation` `GuardianCore.cs:63-73` → `HostCaptureReservation`, `CapacityBytes`
  = `CaseBudgetV3.CapturedStreamsCapacityBytes` (114688) for `HostComplete :300`.
- `GuardianGlobalLedgerReservation` `GuardianCore.cs:77-99` → `HostGlobalLedgerReservation`,
  reserved bytes bound to `GuardianMemoryEvidence.CapacityBytes` (18432, `:354`) and
  `GuardianTerminalPublication.RecordBytes` (192, `:382`) for `HostComplete :303-304`.
- `GuardianSupervisorBinding` `GuardianCore.cs:102-112` → `HostSupervisorBinding`,
  `OriginalController == Transfer(0)` for `HostComplete :305`.

Frozen sealed types assembled by S:

- `GuardianTransferredHandle` `GuardianCore.cs:32-45` + `GuardianTransferKind :30` → five handles,
  `Kind == n`, `TransferOrdinal == n+1`, distinct valid handles (`HostComplete :289-295`).
- `GuardianLaunchIntent` `GuardianCore.cs:48-60` → application `.exe` DosPath, bounded command
  line, validated environment block, pins/mode equal to the authority (`HostComplete :285-288`).
- `GuardianHostSignals` `GuardianCore.cs:116-133` → `EvidenceIncomplete` marked by the capture
  pump on exhaustion/stall; `Read()==0` required at `HostComplete :317`.
- `GuardianHostBinding` `GuardianCore.cs:146-155` → assembled by `HostLauncher.BuildBinding()`.
- Cross-ownership `GuardianCore.cs:312-317` → `WriterLedger` maps GuardianEvidence(3) and
  GuardianResult(5) to the guardian owner, CapturedStreams(2) to the capture owner, and
  SupervisorResult(6)/SupervisorReceipt(7) to the supervisor owner; the three shared owners are
  created once by S and reused so the reference checks hold by construction.

Lifecycle entry points:

- `GuardianCore.Run(binding)` `GuardianCore.cs:916-960`, gate `HostComplete :922`, refusal
  `MissingHostBinding :923` → invoked through `IGuardianProcessHost.Launch`.
- `GuardianRunResult` `GuardianCore.cs:416-432` → S decides on Phase/HoldReason/Outcome/
  KernelQuiescenceObserved/JobRetained/PendingPublication.
- `GuardianTerminalPublication.ByteAt`/`RecordBytes` `GuardianCore.cs:380-390` → exact 192-byte
  readback — implemented ONLY with correction (a) of this delta: `WriterLedger
  .TryReadBackGuardianResult` re-reads the 192 bytes from the GuardianResult destination the sink
  already wrote, never a copy of the source bytes. The first delivery lacked it (defect 1:
  `HostLauncher.cs` did not compile), so this path was not review-proven and must not be called
  proven.
- `GuardianSupervisorAcknowledgement` `GuardianCore.cs:393-406`, `Matches :407-413` → S builds
  `(supervisor, publication, exactReadback)`; `Matches` requires the exact supervisor and
  publication references plus 192 equal bytes.
- `GuardianCore.Acknowledge` `GuardianCore.cs:961-976` → single ACK; S persists the durable
  SupervisorReceipt BEFORE this call (the core closes J inside it).

Frozen budget consumed:

- `CaseBudgetV3` ctor (nonce, `"V3-Q1"`) `BudgetedEvidence.cs:161-169`; `OpenSink`
  `:173-199`; `BudgetedSink.TryWrite` `:113-116` (sole write path); `GetSnapshot` `:201-211`;
  caps `:122-137`; `EvidenceSlot` `:6-16`; `HoldReason` `:19-33`.

## S launcher: lifetimes, rights and the S/D/G-loss matrix

S prepares a fresh CreateNew lease (nonce256/positive epoch) and an exclusive durable reservation,
assembles the trusted capabilities, launches G, watches it, performs the exact durable readback and
the single ACK. **The launcher owns no primitive that terminates G** and never releases the durable
reservation; release is the separate parent admission/release protocol (DESIGN G:167-169). Thus
`HostLaunchResult.ReservationHeld` is always true, including `AcknowledgedSealed`.

Host-side matrix (`HostLaunchState`):

- Attestation incoherent → `AttestationIncoherent`, G never launched, reservation held.
- G lost before a proven publication/ACK (crash, non-alive, loss after publication) →
  `GuardianLostBeforeProof`, reservation held, **never PASS**.
- Run returned HOLD or no pending publication → `HeldNotQuiescent` (covers the ControllerLost
  cleanup: BEFORE quiescence, ControllerLost leaves `KernelQuiescenceObserved` false — Hold
  ControllerLost, no `WritePublication` — so the run lands here and retains J).
- Capture did not reach EOF within its budget (`PumpToCompletion() != CaptureStatus.Completed`,
  HostLauncher.cs:225-226) → `HeldCaptureIncomplete` (HostLauncher.cs:105): S itself refuses the
  ACK, because the frozen `Acknowledge` never re-reads the host signals; reservation held,
  **never PASS**.
- Quiescent but persistence, readback or the single ACK did not seal → `HeldNoAcknowledgement`.
- Exact 192-byte readback acknowledged → `AcknowledgedSealed`; J closed by the core; reservation
  still held. ForcedQuiescent (DriverLost recorded) may seal but is never NaturalQuiescent/PASS.

Rights and lifetimes (publishing the review's C4 gap): the original S and D process references are
transferred with SYNCHRONIZE so G can wait on them; G additionally holds the implicit creator
rights on the J it creates and on the T process/thread it creates (`GuardianCore.cs:1040-1104`); S
keeps the stdio read ends for capture and transfers the inheritable write ends to T via G. The
durable reservation outlives the case and is released only by the parent protocol.

## Writer ledger (#6)

`WriterLedger` wraps one `CaseBudgetV3` keyed by the case nonce, opens all eight sinks, and maps
category → single global owner → fresh sink → sub-cap. Every concrete write (guardian evidence,
guardian result, supervisor result, supervisor receipt, captured stream) goes through
`BudgetedSink.TryWrite`; no `Stream`/`File` is touched for writing and nothing is written outside
the sinks — the ONE direct destination access is the read-only readback re-read added by
correction (a) (`TryReadBackGuardianResult`: nothing charged, nothing written, caps, debits and
holds untouched). Reserved byte counts equal the frozen core constants (18432/192). FixtureMarkers
is a conservative reserved share for separately closed-source writers; this module does not prove
their remote writes. Cross-process uniqueness of the ledger is **NOT_PROVEN** (local only).

## Capture (#7) and cumulative counters (#8)

`CapturePump` reserves BEFORE every Read, bounded by `min(4096, remaining)`, reads at most the
reservation, and writes the raw bytes through the CapturedStreams sink. Invalid UTF8 is preserved
verbatim (never decoded). An unused reservation is not refunded into a new credit: the next attempt
recomputes `remaining` from the charged bytes. The attempt counter and the cumulative reservation
are debited BEFORE each attempt (#8), even one that then fails. Budget exhausted before EOF, or an
idle non-EOF source, latches `EvidenceIncomplete` — a post-Run latch OBSERVED BY S: the Mark
happens after Run (HostLauncher.cs:225) and the frozen `Acknowledge` (GuardianCore.cs:961-976)
does not re-read the host flags, so G never reads this latch; S itself refuses the ACK — with the
uncollected count UNKNOWN, never a fabricated zero and never an unreserved drain. The capture is
owned by the parent and is independent of G's stop control; S does not kill G first (which would
end the oracle).

## Sub-gate results and limits (000c)

Proven at source scope (by construction, to be re-verified by fresh review and the compile gate):
a complete host binding assembled by S satisfies `HostComplete`; incomplete/foreign/cross-ownership
bindings refuse with `MissingHostBinding` before any native call; the ledger writes only through
sinks and respects the caps; the capture reserves before read and fails closed; G-loss holds the
reservation. The exact 192-byte ACK path — write, readback re-read from the GuardianResult
destination, receipt, single ACK — is IMPLEMENTED WITH correction (a) only and is NOT proven: it
did not exist in the first delivery and awaits the fresh delta review and the compile gate;
mismatch/wrong-size/S-loss hold and retain J by the frozen `Matches`/`RejectPublication`,
independent of (a).

**NOT_PROVEN:** real pipes/stdio, real durable lease/reservation, real D launch, real process
handles, cross-process ledger uniqueness, multi-process S/G, and any kernel/Job/native behaviour.
The readback is a re-read of the destination Stream object the budget wrote to; real cross-process
or on-disk durability of that destination stays under the same NOT_PROVEN limits. Qualification
000c stays real (real Job, real T, real kernel queries) and separate. The source tests have NOT
run and assert no compilation or test result.

## Handoff

Only source creation, bounded text inspection and SHA-256 hashing were performed. The correction
`MANIFEST.json` pins the other three artifacts of this output, the frozen inputs and the 11/11
recalculated intake pins; its own hash is reported separately to the parent to avoid a
self-referential manifest. Fresh independent delta review, parent-authorized compilation and
in-memory test execution, then any privileged integration and host proof remain separate gates.
