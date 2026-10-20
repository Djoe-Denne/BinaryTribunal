# Broker2a — independent SOURCE QA candidate

Status: source proposed only. No compiler, typecheck, transpilation, test, validator,
product import or execution was performed. No source-acceptance or runtime PASS is
claimed. Fresh composed V and separate parent gates remain mandatory.

## Authority, provenance and blindness

- Owner: `full44-q2a-broker-qa-r1`, task `task_mvf0mgyi_001m_3ivfjj`.
- Only owned outputs: `GenericEvidenceBrokerTests.cs`, this file, `MANIFEST.json`.
- Packet `../inputs/INPUT_MANIFEST.json`: RAW 7618 bytes, SHA256
  `34001b64702d435c8c7fcf93d95591f02caa63dad8ba939b5f4361fe73b037e3`.
  All 23 local entries were byte-hashed twice: 341351 bytes; every size and hash
  matched. The manifest's `source` paths were never followed.
- Fixed API: `../inputs/API_FIXED.md`, 7364 bytes, SHA256
  `f95cd66eab84bc94e6a2ca6e621a4c16ed6e15781ad13523ef2c4c3fcce27697`.
- Additional authorized parent GO:
  `../../FULL44_Q2A_QA_CODE_GO_20261019.md`, 1769 bytes, SHA256
  `ca35180eda4a6acd026ab325422e9b2245f6afeeb06ed0487382435fc999847d`.
- Additional parent clarification:
  `../../FULL44_Q2A_API_R1_CAPTURE_ERROR_CLARIFICATION_20261019.md`, 3152 bytes,
  SHA256 `1b3873c59c559fe0fc847f7c8c4888eb32dddc8e29c96aa19a20d0d9c0629c3d`.
  It resolves the exact ERROR payload and its exceptional commit under HOLD.
- NONBLIND for the pinned dependencies. Independent of the broker implementation:
  no author implementation, DESIGN, other QA, origins, transcripts or private
  reflection were accessed. The parent verification JSON files were hashed as
  provenance, not imported as a runtime test result or reused assertion total.

## Fixtures and real dependency surface

One test entry is proposed: public static `Main()` returning an exit code in
`ReGraph.GuardV3.GenericEvidenceBrokerTests`, using C#4/.NET4 syntax.

The descriptor is built with the actual `GenericTargetPlanInput`,
`GenericTargetPlanCodec.TryBuild`, `GenericPlanReservationBinding`,
`GenericSourcePin`, `GenericOwnershipRootBinding`, `GenericQualificationMode`
and `CaseIdentity`. All reside in the actual `ReGraph.GuardV3` namespace; no
replacement declarations of dependency/product types are supplied.

Private QA subclasses derive from the actual abstract `GuardianHostAuthority`,
`GuardianCaptureReservation`, `GuardianGlobalLedgerReservation` and
`GuardianSupervisorBinding`. Their values are coherent DATA fixtures only.
Positive `IntPtr` numbers are constructor data, never acquired handles. DOS path
strings and SHA labels are syntactic metadata; no path is opened or pinned by QA.
No `GuardianCore.Run`, HostLauncher, native port, supervisor acknowledgement,
release, close or delete is invoked. A synthetic `GuardianTerminalPublication`
contains a deterministic 192-byte pattern, not a kernel/quiescence proof.

Destinations are bounded-case custom `Stream` implementations backed only by
`MemoryStream`; capture sources implement the real `ICaptureSource`. Hooks exist
only inside these QA fixtures, not in the product API. They inject faults and
record callback observations. Assertions run outside external callbacks, so a
product catch cannot turn a failed fixture assertion into an expected read error.

## Planned coverage against the fixed API

1. **TryCreate / references.** Healthy coherent bindings, owner maps, eight sinks,
   exact identity reference and epoch; negative pins, missing components, mismatched
   authority/controller/owner references, direct destination aliases, duplicate
   targets, capture capacity, missing/duplicate capture sources and cardinalities.
   Refusals must expose no broker and perform no Stream.Write or capture Read.
   Hidden credit on an unsuccessfully constructed object is not publicly observable.
2. **TryReserve / TryStage / GetSnapshot.** All five ordinary noncapture categories
   are exercised; capture and the two private terminal categories use their own
   paths. Opaque null/foreign/reused permits; exact owner/identity, invalid kind,
   slot and ranges; copy from a nonzero offset; mutation after Stage must not alter
   output. Prepaid control/GE/SR credits are consumed once, unused bytes stay burned,
   actual sink C is charged before Write, C<=A<=slot cap and sum(A)<=262144.
   Old broker/budget/slot snapshots must remain detached after reserve/write/HOLD.
3. **Cell limits / deferred records.** Three simultaneous external permits,
   rejection of a fourth without new admission, and cell reuse after commit.
   Three staged DeferredFinal cells remain noncommittable while the independent
   internal cell carries GR then receipt to WaitingACK. Deferred records do not
   count as outstanding ordinary work and are never emitted by slice2a.
4. **TryReserveCapture / TryReadReservedCapture.** Shared 114688 cap, 4096 admitted
   before each Read(buffer,16,4064), one outstanding permit per flux, capture Stage
   rejected, no free EOF probe and no EOF inference from zero without AtEof. Full
   reads with/without EOF, raw NUL/invalid UTF8, two headers in a 4096-byte batch,
   independent sequences for stream1/2 and EOF committed only after a real write.
5. **GTC1 oracles / HOLD errors.** Literal hand bytes anchor DATA/EOF and all three
   ERROR codes. A separate QA-only encoder uses the contract's explicit offsets,
   never a product/private encoder. Read/AtEof throws =>9, invalid count =>10,
   zero/nonEOF =>11. Invalid counts precede AtEof; Read throws skip AtEof; positive
   Read plus throwing AtEof emits only ERROR9, not partial DATA. ERROR20 may commit
   once under HOLD from its existing4096 reservation, preserving first failure,
   no EOF and no new credit. Ready normal DATA is blocked. A subsequent ERROR uses
   the next stream sequence. Two pre-admitted read cells are interleaved through
   deterministic nested heap callbacks and may each publish one ERROR; this is
   not an OS scheduling or native concurrency-progress experiment.
6. **TryCommitNext / LatchIncomplete.** Empty false/null without I/O or HOLD;
   at most one ready command per call; normal writes, partial-then-throw, capture
   EOF write failure, failed ERROR write, sticky first failure, irreversible C/A,
   no retry and null out permit on false. Write and readback callbacks attempt
   reentry; a snapshot records active states and nested operations must fail closed.
7. **Finalization / readback / export.** Both committed EOFs, no outstanding
   ordinary permits, exclusive idle phases; premature/null/foreign-identity and
   late calls fail closed. Actual GR destination receives192, is re-read with
   <=192 progressive reads, and its exact bytes become the receipt before WaitingACK.
   One-byte reads cover the 192-call boundary. Short/negative/oversize read, wrong
   seek result, unreadable/unseekable/property/seek/read exceptions and byte
   mismatch must HOLD without receipt/export. GR and receipt write failures remain
   charged. ACK-data export validates range, copies exactly192 at a nonzero offset,
   preserves surrounding sentinels and returns the exact linked publication.
   Caller mutation must not modify publication or written GR/receipt. No ACK is
   created, no Closed/FinalRecords transition is accepted in sampled snapshots.

The API fixes physical write/read/receipt order but does not assign the two
internal writes exclusively to Begin/ReadBack versus CommitNext. Phase helpers
therefore observe the real destination, allow at most one following explicit
commit per phase, and still require no readback before GR and no receipt before
readback. This is not a retry loop or a replacement source buffer oracle.

## Static sites, expanded vectors and runtime accounting

Text-only inventory at delivery: **18 scheduled test-group call sites** and
**245 lexical Check-call sites**, excluding the Check declaration. This is not a
compiler result or a count of assertions executed. Helper calls and bounded loops
expand these sites; the runtime count has not been measured.

Examples of source-expanded vector families, not execution results: 20 binding
fault selectors plus two null inputs; 24 destination/source-array negative
variants; nine reserve identity/owner/slot/kind variants; four reservation-size
and eight Stage-range variants; six primary capture-error vectors; ten readback
fault selectors and three readback reentry hook sites. A runtime exception stops
the run; no catch continues past an unexpected failure.

The only actual assertion counter is incremented inside Check on every invocation.
Future parent execution prints one compact fixed-label stdout line with the real
counter, returns nonzero on failure, does not print exception text or stderr, and
does not claim native qualification. With fixed labels and a long integer counter,
the reporter remains well below1024 bytes. No historic PASS count is embedded.

Noncapture grant256 is reachable with one-byte sequential records. Two internal
terminal grants must count too:254 ordinary grants can finish at256;255 cannot
write a receipt that would require grant257. Full capture reservations reach the
shared cap after28 grants, so this public path cannot reach capture-grant256;
QA does not invent256 free reads to test that unreachable bound.

## Limits and remaining gates

- Tests are proposed source only; all vector outcomes remain unobserved.
- Public behavior can exercise cell admission, private Stage semantics and snapshot
  detachment, not prove the total hidden allocation count or absence of a hidden
  fifth buffer. Private layout/order reviews remain with fresh composed V.
- No reflection/new product hooks, imported author algorithm, threads, Task,
  Sleep, wait handles, OS clock, native wait, pipes or live actions are used.
  Same-thread callbacks cannot prove that no lock is held or that real threads
  make progress. Real cancellation/join, blocked-I/O liveness, G-thread ACK,
  quiescence, ownership, durability and HOST authority remain unqualified.
- Buffers, arrays, fault selectors and loops in these fixtures are bounded. This
  does not establish whole-runtime heap containment or full44 resource bounds.
  The total cap cannot be independently exhausted through every category in
  slice2a; sampled per-slot and aggregate inequalities are not full reachability.
- Q1 caps and5/20/30/55 timings are unchanged. No125s/DB/cache/Linux/full44 claim.
- Only static reads, byte hashes, textual inventory and owned-output patches were
  performed. Parent must review/persist this candidate, obtain fresh composed V,
  then separately authorize and perform compilation/run gates. No task is closed.
