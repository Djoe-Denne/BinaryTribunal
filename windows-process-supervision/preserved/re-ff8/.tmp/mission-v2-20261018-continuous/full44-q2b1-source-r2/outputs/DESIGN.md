# Source2b1 R2 — broker-canonical first HOLD cause

**SOURCE_PROPOSED_NOT_VALIDATED.** NONBLIND to the supplied frozen own R1 source,
contracts, parent clarification and fixed API. No QA implementation or complete
review transcript was inspected. No compiler, typecheck, transpile, test, run,
validator, product import or live/native action was performed.

## Authorized delta and frozen baseline

R2 changes only the bodies of `HoldLocked` and `ObserveIncidentsLocked` in the
new sibling `outputs/DualCaptureCoordinator.cs`. Every byte outside those two
bodies is identical to the supplied frozen R1 source, including other method
bodies, declarations, fields, API signatures, source header and historical R1 GO
comment. That unmodified comment is not the authorization for R2: this slice is
authorized by the new `SCOPE.md` and `HOLD_CAUSE_CLARIFICATION.md` plus the parent's
explicit R2 GO. The old source/design/manifest remain untouched in `inputs/prior`.

Authority/input pins:

- Raw `inputs/INPUT_MANIFEST.json`: 11,471 bytes, SHA-256
  `88c364486ae262ea358ae4cb3fc484227f81179e07b5dd559af4fddcc8d64855`.
  It contains all 34 pins, totaling 447,538 bytes; all sizes/hashes are checked at
  both bookends, including the three prior outputs and qualified dependencies.
- `inputs/SCOPE.md`: 1,496 bytes, SHA-256
  `52de24302e64ff2bf1f04daa3c86e9ec065448f472fc8eb12e1488202cff1ff8`.
- `inputs/HOLD_CAUSE_CLARIFICATION.md`: 2,143 bytes, SHA-256
  `f878259d1b705b3e733a19fce418126fcd37b8c7e01b868c0ac804f063b6401a`.
- `inputs/API_FIXED.md`: 6,827 bytes, SHA-256
  `054eae63b730a5099419a122122254be7c013c9ff7c6f48470bd253a76414e7c`.
- Frozen R1 source: 19,270 bytes, SHA-256
  `18f5acdcab66f8336285898ae47bfbd0b9f0c7ebb6925d7db29af97020601e48`.
- Proposed R2 source: 19,567 bytes, SHA-256
  `3368af207543325fe2e3b86edf6355da21fac11ad06961854041253a2106ac46`.

## Defect and corrected ordering

R1 could choose local `InvalidRange` (5) before publishing it, while an already
engaged read independently published `ReadFailed` (9) to the broker first. Broker
HOLD retained 9, but the coordinator's local first-cause assignment retained 5.
The later `!held` observation guard could preserve that mismatch indefinitely.
Fail-closed behavior alone did not satisfy the first-cause contract.

R2 uses the broker's immutable retained first cause as the canonical cause:

1. Normalize the requested reason using the unchanged `NormalizeFailure`.
2. Set the local `held` fence under the existing coordinator gate. This prevents
   new local entry; it does not independently choose a visible first-cause code.
3. Call actual `broker.LatchIncomplete(normalizedReason)`.
4. Obtain actual memory-only `broker.GetSnapshot()` and assign its retained
   `Failure` to the local field, even if the coordinator was already held.
5. Call `Mark(CaptureHeld)` and separately `Mark(EvidenceIncomplete)` afterward.

There is no quiet substitute cause. The pinned qualified broker normalizes its
input, publishes HOLD with a non-None cause, and retains its first failure. The
coordinator copies that actual retained value. Existing exception paths remain
unchanged; if a required snapshot cannot return, no successful observation or
fallback diagnosis is fabricated. The reasoning concerns normally completed
calls, not a guarantee against runtime allocation failure or asynchronous faults.

`ObserveIncidentsLocked` no longer gates broker incident reconciliation on local
`!held`. Any observed broker failure/HOLD runs the publication/adoption path above.
Otherwise a nonzero observed signal invokes that path with InvalidState. An
`else if` avoids two publications for the same observation. A final memory-only
snapshot includes the actual publication; repeated held observations cannot keep
a contradictory local code merely because the fence was already set.

## Static linearization argument — not an executed race test

The unchanged broker's `HoldLocked` at reference lines 313-319 assigns its failure
only when None. The read failure path at 549-555 invokes that same broker helper.
Public broker LatchIncomplete at 854-862 normalizes input under the broker gate;
GetSnapshot at 864-880 reads retained state under that gate. These are the pinned
broker2a source, SHA-256
`abb7713d7ca00e9229d100aefeef9a0650ba72fd13e521accd5d140b34ffb6b2`.

- **Read wins the broker gate first:** it retains 9/10/11 as appropriate. The
  coordinator's later publication cannot replace it; the post-publication
  snapshot supplies that same retained value to local Failure.
- **Coordinator publication wins first:** its normalized requested code becomes
  the broker's first cause. A later read incident cannot replace it, so the
  post-publication snapshot and subsequent observations supply that same code.

Thus the broker gate, not the earlier local fence, determines which code wins.
Coordinator entries/snapshots are serialized by the existing coordinator gate,
so a normally completed observation cannot expose the intermediate local fence
as an independently frozen diagnosis. The broker's immutable cause makes the
post-publication value stable against the competing read in either ordering.
Per-command ERROR payloads remain broker2a's own read-specific codes; R2 does not
rewrite them to the global retained cause.

All added calls are the frozen concrete Latch/GetSnapshot operations, which have
no supplied Read/Write/Seek/property callbacks. There is no new lock, IO gate,
retry/spin loop, thread, dispatch lane, seam, reflection hook or weaker assertion.
This race argument is static only; it was not reproduced by QA or a new run.

## Exact byte-range evidence

Body ranges include the opening `{` through the closing `}`, with no text
normalization. Line ranges below are one-based and inclusive.

- `HoldLocked`: R1 lines 135-143, 453 bytes,
  `3744dc32d8e3b1df9d856d89668ade6c1a9f0ccd04d15d11bf05905abb6f6d78`;
  R2 lines 135-147, 751 bytes,
  `d3072d27e201e2d667b0d763789bf0a5fc5925ea323d30d7cc3063b6d123dde6`.
- `ObserveIncidentsLocked`: R1 lines 146-168, 1,083 bytes,
  `0b392039b8e38f2d2bf9056df3a0c0c4b0499021688e21e0e0ec90ed7be0d791`;
  R2 lines 150-172, 1,082 bytes,
  `7a77960562d1b98ec2476edcac55d92dbc0864318fc86f13f3a48f056f745788`.

The exact source text diff has only two hunks:
`-134,10 +134,14` and `-148,22 +152,22`. All source bytes outside those two bodies
were compared directly, not merely inferred from method names:

- Prefix before the first body's opening brace: 5,761 identical bytes, SHA-256
  `b0f95a1bac8772caee1f96149e155852ce3b2a8d7f3591f15e0ca93c7a6b52a7`.
- Bytes between the bodies: 73 identical bytes, SHA-256
  `6356846c289c4d5bf4977192ca25fb1da943c99e93c064b2d2f992a5cfdbc18d`.
- Suffix after the second body's closing brace: 11,900 identical bytes, SHA-256
  `616d4897495b623edcb13afd81c847386077054128bd3387ac42c55de5c62789`.
- Concatenated outside-body bytes: 17,734 identical bytes, SHA-256
  `c845f83b3d6f00d20341182e353351bb3381f3f647487542b05909b9d764b412`.

This is static byte-comparison/hash evidence, not C# validation or execution.

## Unchanged contracts, exclusions and remaining gates

No signature, enum, field, helper outside the two bodies, broker API or qualified
reference is edited. `NormalizeFailure`, action accounting/cap 550, per-action
elapsed/deadline refusal, two slots, work one-shot checks, actual-return plus exact
commit retention, Free marker reset, writer exclusivity and all return semantics
are byte-identical. R1 QA is unchanged and was not consulted or run for this fix.
The prior DESIGN's permanent-local-first-cause description is superseded only by
the broker-canonical ordering above; its other scope restrictions still apply.

One coordinator per broker and exclusive capture/read/commit entry remain trusted
composition preconditions, not registration or HOST unforgeability. There is no
new port, payload, clock, dispatch/cancel/join, IO path, ACK/finalizer wrapper,
Closed/release or native authority. Future two-lane scheduling, handle provenance,
pipe offset-16 allocation/ownership, actual cancellation/Read return, joins,
G-thread ACK, physical writers/durability and KernelQuiescent/CDB-1 remain gaps.
Neither the static race argument nor dependency heap assertions qualify those.

Only the new three sibling outputs are owned. R1, broker/V3, shared/main and QA
are preserved. Fresh delta review and parent-authorized isolated gates remain
required before any qualification. No full44, HOST/native, 125s, DB/cache, Linux,
G5/G7 or live authorization is implied.
