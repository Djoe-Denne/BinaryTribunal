# Host source V3 — launcher S, writer ledger (#6), capture (#7/#8) — source delivery, HOLD for fresh review

Role V3-HOST-SOURCE, fresh author disjoint from every prior V3 author/reviewer. **NONBLIND**:
the frozen sources were read as required provenance. No compiler, test, Win32 call, process
launch, Job API, native run, pipe, DB, Git, IDB or delegation was used. Byte/hash calculations
and static text inspection are not compilation or tests.

## Status and unchanged gates

This directory contains exactly `HostLauncher.cs`, `WriterLedger.cs`, `CaptureWiring.cs`,
`Host.Tests.cs`, this document and `MANIFEST.json`. It implements the ABSTRACT host seams the
frozen core requires to become runnable at qualification (gate 000c); it compiles none of them.

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
| `WriterLedger.cs` | `HostGlobalLedgerReservation`, `WriterLedger` (#6). |
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
  readback.
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
- Run returned HOLD or no pending publication → `HeldNotQuiescent` (covers ControllerLost cleanup,
  which keeps `KernelQuiescenceObserved` but yields no publication and retains J).
- Quiescent but the single ACK did not seal → `HeldNoAcknowledgement`.
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
`BudgetedSink.TryWrite`; no `Stream`/`File` is touched directly and nothing is written outside the
sinks. Reserved byte counts equal the frozen core constants (18432/192). FixtureMarkers is a
conservative reserved share for separately closed-source writers; this module does not prove their
remote writes. Cross-process uniqueness of the ledger is **NOT_PROVEN** (local only).

## Capture (#7) and cumulative counters (#8)

`CapturePump` reserves BEFORE every Read, bounded by `min(4096, remaining)`, reads at most the
reservation, and writes the raw bytes through the CapturedStreams sink. Invalid UTF8 is preserved
verbatim (never decoded). An unused reservation is not refunded into a new credit: the next attempt
recomputes `remaining` from the charged bytes. The attempt counter and the cumulative reservation
are debited BEFORE each attempt (#8), even one that then fails. Budget exhausted before EOF, or an
idle non-EOF source, latches `EvidenceIncomplete` (signalled to G) with the uncollected count
UNKNOWN — never a fabricated zero and never an unreserved drain. The capture is owned by the parent
and is independent of G's stop control; S does not kill G first (which would end the oracle).

## Sub-gate results and limits (000c)

Proven at source scope (by construction, to be re-verified by fresh review and the compile gate):
a complete host binding assembled by S satisfies `HostComplete`; incomplete/foreign/cross-ownership
bindings refuse with `MissingHostBinding` before any native call; the ledger writes only through
sinks and respects the caps; the capture reserves before read and fails closed; the exact 192-byte
ACK path seals while mismatch/wrong-size/S-loss hold and retain J; G-loss holds the reservation.

**NOT_PROVEN:** real pipes/stdio, real durable lease/reservation, real D launch, real process
handles, cross-process ledger uniqueness, multi-process S/G, and any kernel/Job/native behaviour.
Qualification 000c stays real (real Job, real T, real kernel queries) and separate. The source
tests have NOT run and assert no compilation or test result.

## Handoff

Only source creation, bounded text inspection and SHA-256 hashing were performed. `MANIFEST.json`
pins the other five artifacts and the frozen inputs; its own hash is reported separately to the
parent to avoid a self-referential manifest. Fresh independent review, parent-authorized
compilation and in-memory test execution, then any privileged integration and host proof remain
separate gates.
