# Broker2a — independent SOURCE QA candidate R2, bounded oracle/fixture correction

Status: source proposed only. No compiler, typecheck, transpilation, test, validator,
product import or execution was performed. No source-acceptance or runtime PASS is
claimed. Fresh composed V and separate parent gates remain mandatory.

## Authority, provenance and blindness

- Owner: `full44-q2a-broker-qa-r1`, task `task_mvf0mgyi_001m_3ivfjj`.
- Only owned outputs: `GenericEvidenceBrokerTests.cs`, this file, `MANIFEST.json`.
- Packet `../inputs/INPUT_MANIFEST.json`: RAW 9411 bytes, SHA256
  `85f3ec97ecfae856789daf9e4be87197873ad4e138b8f354073882c13b79fcb2`.
  All 29 local entries were byte-hashed: 429981 bytes; every size and hash
  matched. The manifest's `source` paths were never followed.
- Fixed API: `../inputs/API_FIXED.md`, 7364 bytes, SHA256
  `f95cd66eab84bc94e6a2ca6e621a4c16ed6e15781ad13523ef2c4c3fcce27697`.
- Included parent GO:
  `../inputs/parent/FULL44_Q2A_QA_CODE_GO_20261019.md`, 1769 bytes, SHA256
  `ca35180eda4a6acd026ab325422e9b2245f6afeeb06ed0487382435fc999847d`.
- Included parent clarification:
  `../inputs/parent/FULL44_Q2A_API_R1_CAPTURE_ERROR_CLARIFICATION_20261019.md`, 3152 bytes,
  SHA256 `1b3873c59c559fe0fc847f7c8c4888eb32dddc8e29c96aa19a20d0d9c0629c3d`.
  It resolves the exact ERROR payload and its exceptional commit under HOLD.
- Normative R2 admission/credit correction: `../inputs/API_R2_ADMISSION_CREDITS.md`,
  4861 bytes, SHA256 `d605f9c37bfe1ad5e62139356cb1c54c1c05022e4cc10ec43b7ded9b2df9187d`.
  Direct bounded-fix GO: `../inputs/SCOPE.md`, 2078 bytes, SHA256
  `2329b351d1bac638cd9168b6578c8be24710bf0652f638cab3b402d3d6499ac4`.
- Starting source is OWN pinned prior QA R1 only:
  `../inputs/prior/GenericEvidenceBrokerTests.cs`, 62911 bytes, SHA256
  `dab52f54433a983ad432afbf8cffbb436ee2fd06430ecc352f7686f63d8df554`.
  R1, frozen inputs, main/shared files and all product sources are untouched.
- NONBLIND for the pinned dependencies. Independent of the broker implementation:
  no author implementation, DESIGN, other QA, composed-review transcript, origins,
  transcripts or private
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
   R2 preserves the reconstructed-controller and null-Signals negatives, adds all
   three incident bits, and invalid transfer count/kind/ordinal/authority/null/
   zero/pseudo-handle/duplicate-handle vectors. Binding refusals must report exact
   InvalidBinding, expose no broker and invoke NONE of the supplied Stream members
   or capture Read/AtEof; fixture counters cover properties, seek/read/write,
   SetLength/Flush/Dispose. No weak matcher or skip replaces these assertions.
   Hidden credit on an unsuccessfully constructed object is not publicly observable.
2. **TryReserve / TryStage / GetSnapshot.** All five ordinary noncapture categories
   are exercised; capture and the two private terminal categories use their own
   paths. Opaque null/foreign/reused permits; exact owner/identity, invalid kind,
   slot and ranges; copy from a nonzero offset; mutation after Stage must not alter
   output. R2 uses EXACT Control Ordinary and GE Ordinary prepaid pools; separate
   negative fixtures consume each full pool, then call TryReserve directly to
   reject one extra byte with BudgetExceeded and unchanged A/C/grants/writes.
   SR Ordinary is fresh (A increases) while all512 SR Deferred prepaid bytes remain
   available. SR Deferred consumes only its512 pool without double debit and
   remains noncommittable; an independent extra-byte request must fail. GE Deferred
   is fresh, consumes none of GE Ordinary18432, and cannot exceed the remaining6144
   GE envelope. One fixture stages GE Deferred64 and subsequently consumes the
   entire GE Ordinary18432 pool unchanged; another reaches the6144 fresh boundary
   with two cells, so an extra byte reaches budget rather than cell exhaustion.
   Unused bytes stay burned,
   actual sink C is charged before Write, C<=A<=slot cap and sum(A)<=262144.
   Old broker/budget/slot snapshots must remain detached after reserve/write/HOLD.
3. **Cell limits / deferred records.** Three simultaneous external permits,
   rejection of a fourth without new admission, and cell reuse after commit.
   Three staged VALID DeferredFinal cells (GE2048, GE2048, SR512) remain
   noncommittable while the independent
   internal cell carries GR then receipt to WaitingACK. Deferred records do not
   count as outstanding ordinary work and are never emitted by slice2a.
   GE and SR destinations must remain empty, while GR/readback/receipt really
   complete and OtherGrants remains5 (two already-internal plus three external).
   Control/Markers/Driver Deferred are rejected explicitly with InvalidState in
   fresh fixtures, with no admission/grant/write effects. CapturedStreams/GR/
   receipt also reject external TryReserve for both kinds; their signatures do
   not assign a more specific refusal enum in this R2 matrix, so those additional
   tests require refusal, null permit, sticky nonzero failure and no effects.
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
**304 lexical Check-call sites**, excluding the Check declaration. All18 original
groups remain; R2 adds the bounded cases inside the existing credit, cell,
binding and grant groups. This is not a
compiler result or a count of assertions executed. Helper calls and bounded loops
expand these sites; the runtime count has not been measured.

Examples of source-expanded vector families, not execution results: 34 binding
fault selectors plus two null inputs; 24 destination/source-array negative
variants; nine reserve identity/owner/slot/kind variants; four reservation-size
and eight Stage-range variants; six primary capture-error vectors; ten readback
fault selectors and three readback reentry hook sites. Additional R2 families
include three unsupported Deferred categories, six external-private-slot/kind
combinations, exact-pool positive/negative fixture pairs for Control/GE, SR and GE
credit-protection cases, and direct255th-external rejection fixtures. A runtime exception stops
the run; no catch continues past an unexpected failure.

The only actual assertion counter is incremented inside Check on every invocation.
Future parent execution prints one compact fixed-label stdout line with the real
counter, returns nonzero on failure, does not print exception text or stderr, and
does not claim native qualification. With fixed labels and a long integer counter,
the reporter remains well below1024 bytes. No historic PASS count is embedded.

R2 fixes OtherGrants INITIAL=2: GR and receipt are already admitted, not granted
again at final materialization. After254 one-byte external records, OtherGrants
is256 BEFORE finalization; a positive independent fixture still completes real
GR/readback/receipt with count256 and unchanged A. A separate fixture makes the
255th-external request DIRECTLY with TryReserve, requires false/null/GrantLimit
and unchanged A/C/grants/writes, and cannot begin finalization from sticky HOLD.
No helper assumes success at request255 or tests an unreachable later guard.
The earlier terminal-time grant257 oracle is superseded, not retained as a skip.
Full capture reservations reach the
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
