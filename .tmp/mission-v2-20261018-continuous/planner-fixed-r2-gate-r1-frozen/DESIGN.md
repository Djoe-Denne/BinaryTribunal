# Fixed-projection R2 qualification gate — SOURCE_PROPOSED

This is a source-only descendant of the pinned R5-R3 gate, not an execution
approval, syntax/type qualification, or PASS. Only the parent may integrate,
freeze, commission independent V, perform actual selfchecks, and separately
authorize one invocation. No approval, lease, receipt, release, product source,
scientific test, configuration, or historical artifact was written here.

## Packet and authority

The sole read corpus was `../inputs`: 34 payloads, 1,601,253 bytes, plus the
10,385-byte raw `INPUT_MANIFEST.json`, SHA-256
`457913b52846af318c2d8350095f71c1c4d81e966d56e01f18d6d9262c78572d`.
Every payload size/hash matched before source authoring. Final native handoff
repeats the full bookend. Origin paths inside the packet were treated as
declarations, not permission to read those origins.

`SCOPE.md` is the source GO, not runtime GO. The parent assembly and R2 source
acceptance are authoritative only for their stated source scope. The source
acceptance's 14-delta-pin and 28-source-input claims are historical source
review claims; neither is an authorization of this future gate's entire pin
set. Future gate V must independently bind ALL approved pins and all FOUR
closed inventories, including all five new harness outputs, native source,
assembly/provenance documents, tools, SDK, and retained historical evidence.

## Context constants and separate control schema

`BASE` remains the mission directory under `re-ff8/.tmp/`.

- `STEM`: `planner-fixed-projections-r2-qualification-gate`.
- `APPROVAL`: `BASE/planner-fixed-projections-r2-gate-parent-adjudication.json`.
- Scratch prefix: approved Temp directory plus `PLANNER-FIXED-R2-QUALIFICATION-`.
- `BASELINE_FROZEN`: `BASE/s1-r5-planner-extraction-r1-frozen`.
- `FROZEN`: `BASE/planner-fixed-r2-candidate-bundle`.
- `NATIVE_R2`: `BASE/planner-fixed-projections-r2-frozen`.
- `DELIVERY`: `BASE/planner-fixed-r2-candidate-assembly.json`.
- `SOURCE_DELIVERY`: `BASE/planner-fixed-projections-r2-parent-delivery-audit.json`.
- `ACCEPTANCE`: `BASE/planner-fixed-projections-r2-parent-static-acceptance.json`.
- `GATE_SOURCE_GO`: `BASE/PLANNER_FIXED_R2_GATE_SOURCE_GO.md`.
- New source packet: `BASE/planner-fixed-r2-gate-source/inputs`.

No old stem is replayed or renamed. Lease reservation remains the first
filesystem mutation, exclusive `wx`, and immutable thereafter. Existing
receipt/release means STOP; no cleanup, retry, automatic fix, or replay.

The future parent control JSON retains the existing field names:
`schema`, `verdict`, `executeOnce`, `pins`, `freshReview`, `inventories`, and
`systemEnvironment`. The only new control identifiers are:

- `schema = planner-fixed-r2-gate-approval-v1`;
- `verdict = ACCEPTABLE_PLANNER_FIXED_R2_GATE_PENDING_PARENT_ONESHOT`;
- `executeOnce = true`.

The CLI still requires exactly one
`--adjudication-sha256=<64-lowercase-hex>` argument, hashing the RAW external
approval bytes, not a reserialization. `freshReview.verdict` is `ACCEPTABLE`,
`candidateId` is nonempty, and `freshReview.files` binds every approved pin
by actual absolute `path`, `bytes`, and `sha256`, with exact count and no
duplicates. `freshReview.inventoriesSha256` hashes the JSON serialization of
the normalized closed inventories in declared order. `systemEnvironment`
still contains exactly `SystemRoot` and `WINDIR`, both the approved Windows
root matching the parent environment. No approval file is supplied by this
worker. The unchanged capture/trace schema is NOT this control schema.

## FOUR closed trees and all source rows

The required inventory order is now exactly:

1. `mainHarness` rooted at `HARNESS`;
2. `dependencies` rooted at `DEPS`;
3. `baselinePlanner` rooted at `BASELINE_FROZEN`;
4. `frozenPlanner` rooted at `FROZEN`.

Existing root/id, canonical path, link/junction, special-node, duplicate,
sorted-entry, bounded hashing and repeated inventory bookends are retained.
Each planner tree must contain exactly SIX files (`FOUR`, `DESIGN.md`, and
`MANIFEST.json`) plus the single `src` directory; even extra empty directories
are refused. Every file is checked against its assembly row, required approved
pin, and closed inventory entry. Both main and dependency inventories must
also equal the qualified R1 receipt's actual inventories. This retains the
separate 3,716-entry dependency tree and the guarded root `node_modules`
mount, and prevents a newly approved shadow/extra source from silently being
substituted for the historically qualified upstream corpus.

The new raw source packet manifest has its fixed SHA, 34-row count and byte
sum checked. Every row must have a safe unique relative packet path and valid
absolute declared `source` pin. BOTH the packet copy and its declared source
must be approved on those bytes. This does not turn the packet's historical
`REFERENCE_EXPECTED_BINDING.json` into current approval. Old R5 packet checks
(15 payloads/357,441 bytes), RED/R4 evidence, R3/R4/source GO, cache receipts,
compiler/tool/SDK pins, and 269 original guards remain in place unchanged.

## Exact assembly and native R2 provenance

`DELIVERY` has schema `planner-fixed-candidate-assembly-v1` and status
`ASSEMBLED_SOURCE_NOT_RUNTIME_QUALIFIED`. Its two no-edit/no-evaluation flags
must remain true. Actual nested field names, not a fabricated flat audit:

- `baseline.root`, `baseline.deliveryPath`, `baseline.files`,
  `baseline.qualifiedReceipt`, `baseline.parentReadback`;
- `candidate.root`, `candidate.sourceNativeCandidate`,
  `candidate.sourceDeliveryAuditPath`, `candidate.sourceStaticAcceptancePath`,
  `candidate.files`, `candidate.sources`.

Baseline root/delivery and candidate root/audit/acceptance paths are checked
against the exact new context constants. `baseline.files` must equal the old
native six-file audit, including row order. Each file row has exactly
`path`, `bytes`, `sha256`, with no duplicate or unexpected filename.

The accepted R2 source candidate is `result_mvfkgpe7_00bx_lwodkz`, with source
review `result_mvfl606y_00c8_ncqi4h`. Acceptance verdict must be exactly
`ACCEPTABLE_PLANNER_FIXED_PROJECTIONS_R2_SOURCE_PENDING_PARENT_GATES`, with
`requiresNewGateSourceReviewBeforeInvocation=true` and `executeOnce=false`.
It is explicitly not the later parent one-shot control approval.

The native R2 delivery's FOUR files are `src/planner.ts`,
`src/planner-derived-codecs.ts`, `DESIGN.md`, and `MANIFEST.json`. All six
`candidate.sources` rows are checked: exact keys `destination`, `source`,
`path`, `bytes`, `sha256`, `sourceRole`; destination equals path; unique
destinations; correct original root; correct declared role; and the SAME
size/hash in native audit, source row, and assembled destination. The two
remaining files, `src/scc.ts` and `src/function-order.ts`, must come from
the qualified R1 baseline unchanged. Their original source pins and baseline
inventory membership are checked. No new product code is assembled here.

## Qualified R1 is the baseline, not MAIN-old and not new R2

The future gate requires the exact previously qualified receipt:

- `s1-r5-planner-isolated-r5-gate-receipt.json`, 8,306,574 bytes,
  SHA `4e213bb3c4269710f0e91cfba3fcc5e12f58ae34699ca3b6b8692c9f1260565d`;
- parent readback `planner-r5-parent-green-verification.json`, 1,556 bytes,
  SHA `a17c4fdf292365d4c15b778b179e1a381c8f44ab854619e9c38d2392363643a2`.

The large receipt was NOT present/read in this packet. Its pin is declared by
the pinned assembly; future code checks those actual bytes and then the known
R5 receipt fields `gate`, `qualified`, `main269GuardsUnchanged`,
`priorRedReceiptSha256`, `inputInventories`, `snapshotProofs`, and `scratch`.
The old three inventory ids/order must match, with old `frozenPlanner` mapped
only to new `baselinePlanner`. All entries must equal current qualified
baseline/upstream entries. The old candidate snapshot must additionally
contain the exact FOUR baseline source files at `tools/ff8-harness/src/...`.
The parent readback's actual `status`, `gateReceiptSha256`, and
`typecheckExit` are checked. No nonexistent new receipt field is assumed.

The original RED `originalPin` law still checks all 269 original source
guards, old tools/SDK and historical documents/logs. Its six old planner
candidate pins now apply to `BASELINE_FROZEN` ONLY. New R2 pins are NOT
compared to old R1 hashes or relabeled as already qualified. The old Green's
593,912,061-byte RAW equality, counters and footer remain historical R1
evidence, not candidate R2 equivalence. Baseline TSC is inherited from that
qualified R1 chain; no fresh baseline TSC is claimed by this source work.

## Staging delta, exclusive copies, and preserved execution

`prepare(prior, assembly, pkg)` retains the 269-row scientific base corpus
and applies FOUR substitutions for EACH side, choosing the corresponding
assembly/root inside the loop. This is a logical base-then-overlay: as in
R5, substitutions are selected while copying each base row, preserving
`COPYFILE_EXCL` and avoiding overwriting an already copied product file.
Modules absent from the original 269 rows are then added on BOTH sides.
All non-FOUR rows still come from original ROOT. Baseline therefore contains
all qualified R1 FOUR, including the added modules, rather than MAIN-old;
candidate contains native R2's two changed files plus the two unchanged R1
auxiliaries. Documentation is verified as provenance but not injected into
the scientific source corpus. No origin/main input is modified.

Everything after the initial source-selection/copy seam in `prepare` is
byte-identical: capture copy, two-method wrapper, private `afterAll` aliases,
hook/capsule identity, inverse byte-restoration proof of the scientific test,
snapshot inventories, and disk budget. `TEST_PINS` is byte-identical. No test
assertion, assertion counter, import under test, scientific body, or private
capture/footer behavior is weakened or reauthored.

The candidate alone still gets `tsconfig.gate-r5.json` derived from its
copied strict full `src/test/scripts` config, adding only the TWO SDK type
paths derived from the exact `@opencode/client` 2.0.26 package exports.
Strict/noEmit/Bundler/full includes and actual `--listFiles` closure checks
are unchanged. No subset compilation, shim, `d.ts`, loader flag, numeric
inspector, backend, database, hand oracle or new dependency was added.

`run`, `listFilesProof`, `activate`, `archiveBaseline`, `parseTrace`, and
every existing named function other than `prepare` have identical bodies.
The actual run/comparison/finalization tail is byte-identical after reversing
ONLY `closed.length === 4` to the former `3` in the finally input-bookend
guard. The new guard is required so all four inventories are checked even
on failure. It does not change receipt/release schema or success criteria.

## Byte preservation and inverse proof boundaries

`capture.ts` is WHOLE-BYTE R5-R3: 16,829 bytes, SHA
`c8162d4a3d6654b493446b6653e4e25fbfcff3c0c295035601f20b5271b4ddc3`.
`trace-stream.cjs` is WHOLE-BYTE R5-R3: 17,758 bytes, SHA
`a64b5d8bc680fae0fe8b3409f76645c288e1061532a38eddbe61dd2a4527c5a1`.
The future gate also requires these two output pins equal their packet
reference pins. Neither parser, comparator, graph representation, direct
prototype domain, error properties/origins, footer, counters, RAW bytes nor
clone/refusal policy changed. No semantic normalization, dropped traceError
property, reconstruction, synthetic record, waiver or hash-only shortcut.

The gate is NOT whole-byte identical: 47,304 -> 56,693 bytes, 776 -> 892 lines,
19 static line-diff operations. The manifest records all diff spans and exact
proof ranges. Thirty-one original function bodies (17,864 bytes) are raw-equal.
Additional exact spans cover LIMITS, TEST_PINS, instrumentation, and derived
configuration/snapshots. The 6,483-byte run-to-EOF span differs by one ASCII
digit only. An in-memory inverse restores three bounded context/prepare/main
spans plus that digit and reproduces the entire original 47,304-byte gate,
SHA `c2dc8fd67b3dd06022be52de2ac6de08f7d8a70f0bba742ce16c0210d1220d86`.
This is a perimeter/delta-accounting proof, NOT independent semantic or
syntax validation. No inverse artifact was written or evaluated.

Limits remain EXACTLY chunk 1 MiB, trace 1 GiB, pair 2 GiB, record 256 MiB,
200,000 rows, 100,000 calls, depth 64, footer 64 KiB, control JSON 16 MiB,
explicit streaming working space 8 MiB, and one shared monotonic 600,000 ms.
Disk cap remains `2*(S0+S1)+2 GiB+64 MiB`. Cache0/clean environment, bounded
reads and finally-closed FDs, child-ending requirement, SAME absolute active
runtime path, whole baseline archive rename, fresh candidate copy, all-byte
two-EOF trace/footer comparison, exact test counters, genuine private footer,
immutable lease, structured RED closure and retained artifacts are unchanged.
Extra provenance hashing consumes the SAME budget; no runtime timing or
resource sufficiency has been measured or guaranteed here.

## Parent-only next gates and limits

Freeze the actual five outputs and assembled source trees; obtain fresh
independent gate V over ALL actual pins/four inventories before any code load;
then perform separately authorized actual composition/staging/fault checks.
Only after those gates may the parent write the new raw-hash-bound approval
and decide a single invocation. Any mismatch is retained RED and stops, not
an invitation to auto-edit or rerun. Parent acceptance requires exit zero,
qualified receipt and matching successful inactive release with intact lease
and bookends. These source files have not established those facts.

No compiler, typecheck, transpiler, tests, validator, candidate/product import,
Bun, OS probe/command, database, git, IDA/live, network, origin read, delegated
agent, team/task operation or approval/lease/receipt write was performed.
Only packet/owned-output byte reads, hashes, JSON/source-text parsing, static
comparisons/inverses, exact copies and patches to the five owned outputs.
No main/S1 integration, knowledge publication, numeric qualification,
native FF8, full44, runtime scheduler or universal behavioral authority.
