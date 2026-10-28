# Planner R5-R2 minimal source correction — SOURCE_PROPOSED

## Authority, provenance and non-execution

This five-file proposal implements ONLY the two corrections ratified by the
packet SCOPE / `PLANNER_R5_R2_MINIMAL_FIX_GO.md`. The controlling parent record
is `parent/R1_CORRIGE.json`, verdict
`CORRIGE_R5_R1_SOURCE_NOT_AUTHORIZED_FOR_EVALUATION`, following fresh review
`result_mvfdk5of_008z_sx7175`. The parent confirmed the actual R1 source anchors:
capture191-266 and stream274-301. R5-R1 was never evaluated/executed; its sources
and CORRIGE remain retained. R4 remains RED, not requalified or rerun.

The two confirmed R1 defects were:

1. Postseal could leave an already-clean footer and trace unchanged if marker
   append failed and exitCode was reset. A private failed state and a marker
   write *intent* were not an independently observed host failure.
2. compareFilesExact read/hashed the remaining files after the first mismatch,
   but skipped later aligned comparisons. R1's claimed full comparison was not
   the required every-window comparison. Hashing those windows was insufficient.

Prior DESIGN/MANIFEST are pinned historical documents, not success claims for
those defects. This R2 document supersedes their affected signal/comparison
claims. No other R5 control is redesigned, relaxed or silently rebaselined.

The raw R2 INPUT_MANIFEST is 7142 bytes, SHA-256
`ac695659f28fd6aff474532fc28461ff1527b110b78c9dfe38a387aa805e2da1`.
All 23 payload pins, totaling 479297 bytes, matched before authorship. Input
bookends and final output pins are recorded in MANIFEST and the native handoff.

Worker operations were filesystem reads/copies and owned patches, SHA-256,
JSON parsing and static byte/text comparisons only. No candidate require/import,
compiler/typecheck/transpile/test/run/validator, Bun, OS probe, DB, git, IDA,
live, network, delegation, team tool, task closure, global config or main write
was performed. Exactly five NEW sibling outputs are owned; prior sources are
untouched. No source qualification or runtime/typecheck compatibility is claimed.

## Fix A — independent, coalesced postseal host signal

`capture.ts` captures `queueMicrotask` in a private const at module load, before
any producer action. A private boolean coalesces scheduling. On ANY traceCall
whose private state is no longer open, `signalPostSeal()` runs BEFORE the
producer action and before marker work. It queues ONE callback which throws a
dedicated Error (`FF8 R5 postseal capture fatal`) with no catch in that callback.
The queued flag is set only after native scheduling returns successfully.

The throw occurs later as an uncaught HOST error, outside the producer's
return/throw stack and outside the already-returned finalization hook. It does
not depend on filesystem success, footer mutation or a mutable exitCode. The
producer action is still invoked exactly once: a returned value is returned
identically and a thrown product error is propagated identically, while the
host callback independently signals the capture failure. Scheduling before the
action covers that original throw as well as an action resetting exitCode.

No new export, external counter/fault port, repair argument, footer rewrite or
trace-derived footer is introduced. finalizeCapture remains zero-argument and
its open/finalizing/finalized/failed state machine, wx single-write/idempotence,
afterAll requirement and fallback exit mechanism remain byte-unchanged.

`fatalMarker()` remains an additional bounded protection. markerWritten now
becomes true ONLY after appendFileSync succeeds, not before the attempt. A
failed/no-destination/cap-refused marker is not represented as written; a later
attempt can still try. Successful writes remain coalesced. The existing 4096
byte reserve, UTF8 byte accounting, caps and append-error catch are unchanged.

### Explicit operational assumptions — not arbitrary-host proof

The mechanism is scoped to the FIXED, pinned Bun test corpus and native runtime
which the parent adjudicated. The scope assumes no explicit process.exit/abort,
no hostile host-error handler swallowing the uncaught error, and no hostile
replacement of the native scheduler before the module captures it. Native
scheduling of this valid callback is assumed available/reliable in that scope.
There is deliberately no silent marker-only or exitCode-only fallback.
Forced termination, arbitrary OOM and compromised-runtime guarantees are NOT
claimed. A contradictory scheduler/host premise requires parent escalation,
not a different invented signalling mechanism or loss of producer semantics.

`parent/MICROTASK_BUN_PROBE.json` is bounded capability evidence, not a candidate
test: on pinned Bun SHA-256
`15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4`,
synthetic fixtures had failed marker append, an unchanged clean footer, one
action returning 42, and exitCode reset to 0. The unsignalled control exited 0;
the uncaught-queued-microtask fixture exited 1. No R5 candidate was imported in
that probe. Candidate-specific fault injection remains mandatory AFTER fresh V.

## Fix B — every aligned RAW window is compared

Only the compareFilesExact function changes in `trace-stream.cjs`. Each iteration
with bytes available on both sides now calls Buffer.equals on that aligned
window unconditionally, INCLUDING after firstDifference has been found.
Only recording the first difference / locating its within-window byte remains
guarded by firstDifference===null. Later unequal windows are still observed.

The existing independent read windows, short-positive-read handling, reader
limits, two EOF conditions, raw hashing, source-file stability checks and
finally descriptor closure are unchanged. Real unmatched tail bytes are read
and hashed; they are not compared against a fabricated empty/padded buffer.
No digest is used as an equality shortcut, and no payload/field/path is altered.

Four bounded scalar observations are added without removing/changing existing
API fields:

- windowsCompared: number of nonempty aligned windows actually compared.
- unequalWindows: number of those comparisons which were unequal.
- comparedAlignedBytes: sum of the aligned window lengths, counted ONCE for
  each pair of bytes (not twice for the two inputs).
- trailingUnpairedBytes: total real unmatched tail bytes consumed and hashed.

Before returning fullComparison=true after both EOFs, coverage accounting requires
`windowsCompared <= comparedAlignedBytes`, `unequalWindows <= windowsCompared`,
`comparedAlignedBytes <= traceBytes`, `trailingUnpairedBytes <= pairBytes`, and
`2*comparedAlignedBytes + trailingUnpairedBytes == leftBytes + rightBytes`.
The existing <=1GiB files / <=2GiB pair and positive window lengths bound all
four counters to safe integers; they do not accumulate a window log or allocate
new buffers. A cap/deadline/read/coverage failure returns no partial success.
The leaf's five exports and all preexisting result fields remain unchanged.

## Static inverse/body preservation proofs

These are STATIC filesystem byte comparisons, not executed source validation:

- `gate.cjs` is exactly the pinned R5-R1 file: 47304 bytes / SHA-256
  `c2dc8fd67b3dd06022be52de2ac6de08f7d8a70f0bba742ce16c0210d1220d86`.
  Zero changed lines/bytes. All hooks, phase guards, approval bindings, paths,
  inventories, compiler settings and runtime controls are therefore unchanged.
- Removing capture's native scheduler/flag insertion, private signal function
  and one postseal call; then moving markerWritten back to its original intent
  position recovers ALL 13183 prior bytes / SHA-256
  `7b0dbda7ec206e322f696c5547bcc917db5768a3d53b5ae15bf5fe2d2278b2f3`.
  The inverse was compared in memory; no sixth file was written.
- Capture's entire DATA/native-brand/prototype/descriptor/graph/clone block
  remains exactly 8420 bytes / SHA-256
  `ed36d832e31941b5b285df370384bb1c2d5898f84c41800e00d8f965cb2751a5`.
  R4 per-record materialization, product return/throw handling, aliases/cycles,
  clone-domain restrictions and the existing Error.stack exclusion are unchanged.
- The leaf prefix BEFORE compareFilesExact is exactly 14087 bytes / SHA-256
  `b3084ecbf7cd772a9ae7f9756da58784a3e3d46632fea58d25a341e7687bae0f`.
  The suffix FROM validateCapture is exactly 1110 bytes / SHA-256
  `5fd402e1ea79c53f9dfea0e34d21dee1f341e2db1b424ba15c67f49fa9378180`.
  Restoring only the prior compareFilesExact body recovers ALL 16446 prior
  bytes / SHA-256 `fc5e40d6a1aa2512ad9b2114ac86099c232e2b4c9ea2e6ac0bf91a5e1296dfb7`.
  Reader/Parser/limits/hashFile/scanTrace/readFooter/validateCapture and exports
  are byte-identical, not merely behaviorally claimed equivalent.

## Preserved R5 experiment and limits

The unchanged gate still binds the exact 269 baseline guards, four accepted
planner TS files, two actual pinned scientific tests, both methods, original
refusals, positive/equal test counters, zero failures/skips, private afterAll
footer/count totality, full RAW trace AND footer comparison, three closed input
inventories and closed scratch. No sourceURL/metadata normalization, waiver,
footer reconstruction or digest-only equality is permitted.

Two immutable byte-guarded instrumented snapshots remain; candidate TSC uses its
separate snapshot with strict/noEmit/full include and actual --listFiles closure.
Fresh baseline and candidate processes still run at the SAME absolute active
pathname/env/config/cwd/argv. Only after the baseline child ends and synchronous
parent file APIs close their descriptors is its WHOLE active tree renamed to
archive-baseline, verified, and replaced by a fresh candidate copy. No links,
deletion/cleanup, live process/cache/trace/footer/IO reuse or field rewriting.

The early wx lease, exact external post-V adjudication hash, every reviewed pin,
old red/tool/SDK/cache bindings, cache=0/no allowed cache entries, global-config
presence rejection and structured red/receipt/release closure are unchanged.
Gate remains byte-identical by direct parent instruction: it retains the UNUSED
R5 stem/schema and its original R5 packet/GO constants. No R1 attempt occurred.
The parent must additionally bind this R2 GO, raw packet/payloads, CORRIGE and
capability receipt in its external exact adjudication and freshReview.files;
the unchanged gate already permits extra exact pins. This is not permission to
rebaseline the original required pins or edit the gate in this minimal correction.
All five CURRENT output paths/pins remain mandatory through ARTIFACTS/OUT.

Limits are unchanged: 1MiB chunks; 1GiB trace each / 2GiB pair; 256MiB record;
200000 rows / 100000 calls; JSON depth 64; footer 64KiB; control JSON 16MiB;
explicit streaming reader working state 8MiB; one shared monotonic 600000ms
analysis budget. New disk allowance remains `2*(S0+S1)+2GiB+64MiB`, exact
instrumented snapshot byte totals, with ALL R4 data retained additionally.
Limits only refuse; they never truncate or yield accepted partial results.
The R4 encoder still materializes a record: no bounded encoder, Node/Bun RSS,
VM/GC or arbitrary-host memory promise is added by these scalar observations.

## Parent-only remaining gates

1. Fresh independent DELTA V of all five R2 pins, SCOPE/CORRIGE/probe provenance,
   inverse proofs, scheduler assumptions, unchanged gate/encoder/Reader/Parser,
   and exactly these two changes. R1 acceptance/selfchecks are not substituted.
2. Actual CANDIDATE capture selfcheck in an isolated fresh pinned Bun child:
   create genuine clean private trace/footer by normal capture+finalization;
   inject append failure WITHOUT changing those clean bytes; make a postseal
   action return 42 exactly once; reset exitCode=0; verify clean artifacts really
   remain unchanged and Bun STILL fails due to the uncaught queued host error.
   A check based only on missing/damaged trace is insufficient. Also exercise
   identical thrown value, repeated postseal coalescing, successful marker and
   afterAll/exit idempotence. No external candidate fault API is introduced.
3. Exact leaf adversarial checks: first-window AND later-window differences
   with unequalWindows>=2 and exact first offset; equal windows after a mismatch;
   unequal tails and exact coverage counters; arbitrary asymmetric short reads;
   BOTH EOFs and every raw byte hashed; unchanged caps/deadline/UTF8/grammar/shape
   and all inherited old checks. No parser reconstruction or digest shortcut.
4. Retained R4 offline raw hash/false-equality/missing-footer checks remain due,
   without product rerun, normalization or synthesized footer. R4 stays red.
5. Only then exact new parent adjudication plus a SEPARATE once-gate decision;
   acceptance still requires exit0, qualified exact receipt/readback and matching
   successful inactive release. Integration is separate. No automatic retry,
   task closure or main/S1/numeric/native/live/full44 expansion follows.
