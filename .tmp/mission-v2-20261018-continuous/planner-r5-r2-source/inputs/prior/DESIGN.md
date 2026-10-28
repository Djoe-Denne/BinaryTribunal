# Planner isolated gate R5 — SOURCE_PROPOSED

## Authority, status and retained red

This is the five-file implementation proposal authorized by the packet SCOPE,
not an executed/qualified gate. The worker has performed file reads/copies,
owned-source patches, hashes, JSON parsing and static text comparison only.
No source was compiled, typechecked, transpiled, imported as product, executed,
tested or run through a validator. No Bun, OS capability probe, DB, git, IDA,
live, network, delegated agent, team tool, task closure or global configuration
operation was used. Only the five sibling outputs are owned.

The parent retains fresh independent V, candidate selfchecks, exact post-review
adjudication, a SEPARATE decision on one real attempt, and integration. Neither
the old R4 static acceptance nor its selfchecks qualify R5. No retry of R4 is
implemented. No main/S1/numeric/native/full44 claim follows.

The input manifest is 4628 bytes, SHA-256
`65d776ed4b3a85984fac5563e66fec154bb4a1ff22a0db66270748dce88d3e32`.
All 15 payloads, totaling 357441 bytes, matched before authorship. Final input
bookends are recorded in MANIFEST and the native handoff. R4 reference sources,
documents, tests and evidence have not been overwritten.

R4 stays RED/unqualified. Its actual receipt is 5721440 bytes, SHA-256
`88b85430d591236c7d75249e2ece1215c0c2eb93487927e97c907562dcb979c5`;
its release is 851 bytes, SHA-256
`838a42ee617645c8958e7e9fc5ea67e6c35bef81fb2e20926b99e5c3b088f407`.
TSC exit 0 and EACH suite's 139 passes / 14726 assertions did not qualify it.
Its 591905245/591905352-byte raw traces remain different, and BOTH private
footers are missing. The supplied 107-Error.sourceURL diagnostic was a hypothesis
only: no root substitution, waiver, footer reconstruction or transformed
comparison appears in R5. The original first-red receipt and its prior compiler
logs remain independently bound as in R4, not replaced by this later red.

## Exactly three fixes and five files

1. `trace-stream.cjs` is the pure-import Node/stdlib leaf. `gate.cjs` replaces
   materialized file hashing, inventories, trace parsing and full comparisons
   with its bounded streaming APIs. Small, bounded control/source reads use
   a separate capped reader; no unbounded readFileSync remains in the gate.
2. `capture.ts` retains the R4 per-record DATA encoder and adds preappend byte
   caps/reserve plus private, idempotent afterAll/exit finalization. The copied
   planner test receives only the existing import redirect, two reserved alias
   imports and a conditional-throw afterAll hook. No scientific assertion/body
   or assertion count is added or changed.
3. The gate preserves two byte-guarded immutable instrumented snapshots, uses
   the candidate snapshot for TSC, then runs two new Bun processes at the SAME
   absolute `active` pathname. Between them the WHOLE ended baseline active
   tree is renamed to `archive-baseline`, verified, and replaced by a fresh
   copy from the candidate snapshot. Nothing is normalized or deleted.

Necessary R5 stem/schema/adjudication/source-GO and evidence bindings change;
the remaining R4 acceptance controls stay in force. `DESIGN.md` and
`MANIFEST.json` document/pin these sources. No sixth declaration, package,
fixture, config file or parent adjudication is manufactured by the worker.

## Streaming leaf: API and lifecycle

Exactly five CommonJS exports:

- `hashFile(path, limits)` -> regular-file absolute path, byte count and SHA-256.
  It hashes ALL bytes, regardless of extension, through EOF and checks final
  size/mtime/ctime/inode against the opened file. It has no trace-size ceiling
  for unrelated guarded files; chunk and shared deadline limits still apply.
- `scanTrace(path, limits)` -> trace pin, rows/max-record bytes, counts, method
  coverage, issued/completed and grammar/UTF8/totality results. It never returns
  a DATA string, line, graph or per-node inventory.
- `readFooter(path, limits)` -> the small independent private footer's fields
  and raw pin. It never constructs one from observed calls. Nonempty fatal,
  missing/duplicate/partial/unknown-field footer refuses. `exit` is readable
  for diagnosis but is NOT acceptable at the real gate.
- `compareFilesExact(left, right, limits)` -> both raw pins, first difference,
  fullComparison/bothEOF, pair bytes and equality. It does not stop at a size,
  hash or first mismatch. Different length/content still causes BOTH files to
  be read/hash-counted to EOF, unless a fatal cap/deadline/I/O error prevents
  completion; that case yields no accepted partial result.
- `validateCapture(summary, footer)` -> a validated bounded summary or refusal.
  It requires R5, finalized=true, finalizedBy=afterAll, no fatal, exact private
  issued/completed binding, >=10 calls, both methods, refusal and totality.

Importing the leaf only loads Node stdlib and initializes fixed constants and
a WeakMap of analysis budgets: no filesystem access, clock read, gate work,
child, environment change or product import. Every opened descriptor is closed
in finally, including constructor failure and parse/comparison refusal.

The REAL gate passes ONE frozen LIMITS object to every leaf call throughout
the invocation, including all filePin/inventory/bookend calls. The first call
starts a process.hrtime.bigint monotonic deadline stored against that object's
identity; subsequent calls do not reset it. Default direct API use also shares
one default object. Parent selfchecks may use separate limit objects for
independent fixtures, but must use the same object when testing shared-budget
exhaustion. Limits may only be lowered, never silently raised or misspelled.

### Ratified caps, fatal only

- Read chunk: 1048576 bytes maximum, including comparison reads and bounded
  control/source file reads. A short positive read is NOT EOF.
- Trace: 1073741824 bytes per side; trace comparison pair: 2147483648 bytes.
  Both pre-open stat size and actual read byte totals are checked.
- Record: 268435456 bytes INCLUDING its LF, with no accepted truncation.
- Rows: 200000; issued calls: 100000; JSON nesting depth: 64.
- Footer: 65536 bytes. Control JSON: 16777216 bytes, with actual pins and
  approved `.json` sizes checked before any compiler/test child. Bounded source
  materialization is used only for the already-pinned small copied test.
- Explicit live STREAMING READER working state: 8388608 bytes. Largest explicit
  allocations are <=2*1048576 comparison buffers, one 100001-byte Uint8Array
  during a trace scan, <=64 active parser nesting frames, <=128-code-unit small
  header/token captures and a conservative 262144-byte parser/header allowance.
  The source checks `2*chunkBytes + calls + 1 + 262144 <= workingBytes` before
  allocating. Operations are sequential, not simultaneous readers with hidden
  per-call object Maps. This is NOT an RSS/VM/GC/stdlib/encoder memory promise.
  The separately ratified <=16MiB control-JSON materialization exception and the
  existing gate's metadata inventories are not represented as DATA readers.
- One shared 600000ms monotonic deadline; checks on reads and every 65536
  consumed parser bytes. It includes elapsed wall time between API calls;
  exceeding it only refuses, never returns a partial success or restarts a
  budget per file. Child timeout controls remain the separate R4 bounds.

`readSmall` first streams a pin and checks <=16MiB, opens the file, rechecks
size/type, allocates no more than the pinned size, uses <=1MiB reads, checks an
extra-byte EOF and rechecks hash/size/UTF8. Even growth between pin and read
cannot trigger unbounded materialization. Control JSON gets a lexical nesting
cap check followed by JSON.parse. Its existing parsed upstream contracts are
unchanged. Receipt output is refused if its control JSON would exceed 16MiB.
ENOSPC, partial writes, caps or deadline errors are red/infrastructure failures;
they do not authorize cleanup, spill, truncation or a second attempt.

### Grammar, shape and totality

The scanner reads byte by byte from the bounded chunk window, retaining only
structural summaries. UTF8 is strict across chunk boundaries: bad continuations,
overlongs, raw surrogate codepoints and >U+10FFFF refuse. Legal JSON escape
sequences, including escaped lone UTF16 surrogate code units, remain legal
string data, as in JSON/JS. Raw controls and unescaped newlines in strings refuse.
JSON strings/numbers/literals, punctuation, commas and nesting are checked;
blank/partial/concatenated lines or missing final LF refuse. Structural keys and
headers decode at most 128 code units; overflow cannot hide an unknown header.
Huge property-name or DATA strings are scanned/discarded without accumulating
their text. No entire row is passed to JSON.parse.

Rows have exactly kind/id/name/value, values exactly roots/nodes. Nodes have
exactly id/kind/extensible/properties and entries only for Map/Set. Known R4
native/ordinary/error tags, booleans, property 5-tuples, atoms and Map key/value
pairs/Set atoms are checked. Atom numbers retain the R4 JS canonical number
string representation, including -0/NaN/infinities. Header/node/ref integers
must be in their safe positive domains. Object fields need not be reordered:
duplicate/unknown fields reject and object key order is accepted as supplied.
A bounded atom/pair union summary permits entries before kind, including the
ambiguous valid `["number","1"]` representation, without retaining entries.

One byte per issued id encodes method and terminal bits. BEGIN ids are unique
and contiguous; one matching method RETURN/THROW is required per BEGIN; roots
have length 1 or 2 respectively. Orphans, repeats and missing terminals refuse.
Counts, method coverage, an original product refusal and footer counts remain
independently checked. This adds no global reference-graph proof: the unchanged
pinned capture encoder and FULL raw byte equality preserve aliases/cycles and
all original represented metadata. Error.sourceURL is NOT stripped, rewritten
or replaced. Error.stack remains the sole preexisting R4 DATA exclusion.

Comparison aligns independent read windows, so arbitrary unequal short reads
do not imply a content difference. The first difference is recorded but both
tails are consumed and hashed. No digest equality is used as an equality
shortcut. Post-scan comparison pins must agree with scan/footer pins, followed
by full guarded input/scratch bookends.

## Private capture and test seam

The complete R4 native-brand/prototype/descriptor/graph/clone encoder block is
byte-exact: 8420 bytes, SHA-256
`ed36d832e31941b5b285df370384bb1c2d5898f84c41800e00d8f965cb2751a5`.
No body, brand predicate, prototype exclusion, DATA property, identity allocator,
cycle/alias encoding or clone-domain rule was redesigned. Required util.types
predicates still precede prototype admission, forbidden native brands refuse,
native brand/prototype mismatches refuse, built-in prototypes are guarded, and
one post-validation structuredClone of collected ordinary roots remains the
counter-probe. Ordinary-to-native-Error reachability still refuses before clone
without reading Error.stack. This is the trusted fixed producer DATA boundary,
not arbitrary disguised-object provenance proof.

R4 still encodes/materializes EACH record before appending. R5 checks UTF8 byte
length before append: record<=268435456, ordinary trace data<=1073741824-4096.
The 4096-byte reserve is solely for one bounded, invalid instrumentation-fatal
marker. It is not a DATA truncation allowance. Encoder allocation/string limits
may still fail and become fatal; no end-to-end bounded encoder/RSS claim exists.
Capture copies exactly the reviewed typed literals 268435456, 1073741824 and
65536; it does not import CJS, invent a sixth .d.ts or relax strict typing.
Only the first instrumentation-fatal diagnostic is retained; no product DATA
is dropped by this bounded fatal-metadata policy.

Private states are `open -> finalizing -> finalized` or `failed`. The sole
private `finish(afterAll|exit)` mechanism owns issued/completed/fatal. Exported
`finalizeCapture(): boolean` accepts NO counts, summaries or other arguments.
A single wx write produces schema `planner-full-trace-r5`, finalized, issued,
completed, fatal and finalizedBy. Repeated successful finalization returns true;
failed/reentrant paths return false without repair or another footer attempt.
A write collision cannot validate a stale footer: failure also records the
fatal marker and exit code, and the afterAll hook throws. Missing/corrupt footer
or marker independently refuses in the gate, even if exitCode is reset.
The exit fallback invokes the same private mechanism idempotently, but a footer
whose finalizedBy is exit is explicitly insufficient for the real gate.

After seal, traceCall still invokes the product action exactly ONCE and returns
or throws its identical result. It marks capture failed, sets exitCode and uses
the reserved invalid marker; the existing footer is never rewritten. Encoding,
append or footer failures remain outside the producer's return/throw catcher.
They cannot become a new product refusal accepted by an existing toThrow.
Hook failure is a Bun hook error, not a new positive expect/test/assertion count.

Only COPY `test/planner.test.ts` changes. The single original planner import
is redirected to `../trace/planner`. Reserved aliases `__ff8R5AfterAll` and
`__ff8R5FinalizeCapture` must not occur in the original. Two imports and exactly
one `afterAll(() => { if (!finalizeCapture()) throw ... })` hook are added. Removing
those exact prefix/suffix additions and reversing the one redirect MUST recover
the original UTF8 bytes, not just an AST or normalized text. The wrapper imports
`./capture`; the hook imports `../trace/capture`; their canonical absolute target
is checked equal before either snapshot is accepted. Runtime copies preserve
that resolution at `active/tools/ff8-harness/trace/capture.ts`.

The two REAL input tests are additionally hash-enforced in the approved baseline
inventory: planner 80223 bytes / `6a70750d15b37458baf74b3dd2d9e0742908f2e91067039ae0398e6e520e9181`,
lineage 100786 bytes / `02171587562cd55072037883711f72901c8e9f465294470d2747da7b0c4cb2de`.
Parent static AST evidence found no explicit asynchronous test/hook/timer and
only planner.test directly importing planner. Parent synthetic pinned-Bun AB/BA
two-file probes saw A's afterAll after both private calls, with one capsule.
Those supplied preflight facts are not candidate execution proof and are not
claims about arbitrary hidden async programs. Wrong capsule / premature seal /
actual Bun hook behavior must still be tested by the parent on THESE bytes.

## Same absolute runtime pathname and phase proofs

After early atomic reservation and exact approval/input checks, preparation
creates owned `snapshots/baseline` and `snapshots/candidate`. They contain the
same guarded 269-source corpus and deterministic instrumentation; candidate
overlays/adds ONLY the four accepted planner TS files. Both snapshots receive
fresh empty owned HOME/config/cache/temp namespaces and explicit empty-preload
bunfig. Candidate alone additionally has the derived gate tsconfig. Each full
snapshot inventory, byte total and inventory SHA-256 are recorded. Every later
checkScratch rechecks them; immutable here means byte/inventory guarded, not
a claim of OS-enforced immutability against malicious concurrency.

The candidate TSC runs at `snapshots/candidate/tools/ff8-harness`, with the
unchanged full src/test/scripts includes, strict/noEmit/Bundler guards, exactly
two approved SDK type paths and --listFiles proof. Every actual compiler file
must be a guarded candidate-snapshot file or approved dependency, and all copied
included TS plus both trace adapter TS must appear. No CJS leaf enters this
compiler corpus. No SDK runtime/preload/ambient fallback is introduced.

For baseline, active MUST NOT exist. A fresh tree is copied only from the guarded
baseline snapshot and compared exactly against it. Bun runs once with argv,
cwd, config, trace/footer, HOME/temp/cache/environment all rooted in `active`.
spawnSync's ended return and the finally-close postconditions of all parent
file APIs precede the rename; no OS handle probe is invented. A thrown spawn
remains unknown and blocks archival/release as before. Logs are parent-owned
outside active, named per branch; their names are not passed to Bun.

Baseline completion is followed by input/scratch guards, exact active inventory,
absence of archive, one fs.renameSync of the WHOLE active tree, absence of active,
and exact archive-inventory comparison. Only then may candidate activate at the
same pathname, copying from the other immutable snapshot into a fresh directory.
This never reuses baseline files, caches, trace/footer destinations or process
state. No symlink/junction, cleanup/delete/rollback, process reload or data rewrite
is involved. Rename failure is red and retained, not permission to retry or copy
over the old active tree.

The two observed child receipts retain the exact runtime path/cwd/env/argv,
which must compare equal. Separate phase proofs record immutable snapshot
hashes, fresh-active hashes, before/after archive hashes, ended runner and
parent descriptor-close postconditions. Baseline summary keeps runtimePath
`active` separate from retainedPath `archive-baseline`; candidate retains active.
Archived file pin paths describe current evidence locations, not rewritten DATA.
Native Error.sourceURL bytes remain whatever Bun actually produced.

Let S0/S1 be the exact recorded instrumented snapshot byte totals. New disk
budget is `2*(S0+S1)+2147483648+67108864`, in addition to ALL retained R4 data.
This covers the two snapshots plus ended-baseline archive and fresh candidate,
two capped traces and bounded metadata/log allowance. checkScratch checks new
owned file-byte totals; no free-space probe, preemptive deletion, massive spill
or artifact reuse is asserted. ENOSPC simply makes the attempt red.

## Preserved approvals, guards and failure closure

The new fixed stem is `s1-r5-planner-isolated-r5-gate`. The first filesystem
mutation remains openSync wx on its immutable lease, BEFORE adjudication parsing,
inventory walking, scratch creation or a child. Collision means no ownership;
no receipt/release can overwrite another attempt. No retry path exists.

Parent creates `planner-isolated-gate-r5-parent-adjudication.json` AFTER fresh V.
Invocation supplies exactly `--adjudication-sha256=<exact digest>`; the gate does
not manufacture approval or infer new approved pins by scanning. Schema is
`planner-gate-r5-approval-v1`, verdict
`ACCEPTABLE_PLANNER_GATE_R5_PENDING_PARENT_ONESHOT`, executeOnce=true.
Fresh review must bind EVERY exact approved pin and the full normalized three
closed inventories, not only a verdict or subset. No recursive artifact/self
hash is embedded: the external approval and native MANIFEST hash close that seam.

Required references now include all FIVE outputs, the new source GO
`PLANNER_R5_STREAMING_SOURCE_GO.md` (the packet SCOPE's exact hash), raw R5 packet
manifest and its 15 exact payload pins, actual retained R4 receipt/release and
both retained raw trace pins from the pinned red summary. Old R4/R3 GO/CORRIGE,
R2 dependency plan, original GO/trace source, 269 qualified baseline, four frozen
planner TS plus frozen documents, compiler/Bun/Node/tool/SDK/cache evidence and
first-red log/pin bindings remain mandatory. Raw R5 manifest count/total/hash
are enforced, and R4 qualified=false/missing-footer evidence is not promoted.

The three input inventories remain exactly mainHarness, dependencies and
frozenPlanner, covering ALL file extensions/directories, only the separately
inventoried node_modules mount excluded from the main descent, with links,
special files, additions/removals and realpath redirection rejected. Frozen
planner still has exactly its six delivered files. Actual --listFiles cannot
escape these approved corpora. Scratch is likewise closed, including snapshots,
archives, active, home/config/cache/temp, logs and only named trace/footer writes.

Cache/environment controls remain R4: SystemRoot/WINDIR only from an explicit
approved system whitelist; no inherited PATH/NODE_OPTIONS/NODE_PATH/preloads or
arbitrary FF8 options; NODE_DISABLE_COMPILE_CACHE=1, NODE_COMPILE_CACHE absent,
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0. NO cache entries are allowed. Both exact
parent cache-control receipts and the 267-byte TSC cache-enabling shim are bound.
The first Node positive-control red remains distinguished from its corrected
positive successor. Any potential global/implicit bunfig presence at old or
selected owned HOME/config/cwd namespaces refuses, regardless of contents.
Both runtime phases use the same approved empty-preload config pathname.

The same two scientific tests/methods run sequentially per branch only AFTER
candidate TSC. Success still needs positive equal pass/assertion counters,
two files, zero failures/skips, exact FULL raw trace AND footer equality,
at least ten calls, both methods and an original refusal. No selective result,
sourceURL/metadata filter, fingerprint-only equality or footer repair is allowed.

One try/catch/finally still owns preparation, child, parsing, comparisons and
bookends. Finally attempts unchanged approved inputs, scratch/global-config and
lease readback even on red. Files/logs/snapshots/traces remain retained. Ordinary
red is exit 2; infrastructure/receipt/release/ownership failure is exit 3. Success
requires exit 0 AND a qualified receipt AND an inactive successful release
referencing its exact readback hash, never a nominal receipt alone. Unknown
runner activity never becomes an affirmative inactive claim. Cap/deadline/read
failure in closure cannot leave an accepted partial result.

## Parent-only validation still required

First: fresh independent source V of all five final hashes, the three-fix delta,
DATA block preservation, exact approval contract and phase/reader bounds.

Then use the EXACT leaf and capture, not a reconstructed parser. Retain all 13
old positive/negative parser cases, updating only R5 private footer semantics.
Add adversarial fragmented UTF8/token/escape/surrogate and numeric grammar,
arbitrary short reads, reordered/duplicate/unknown/huge fake headers, every
shape/tuple/boolean/map/set error, call/row/depth/record/trace/pair/footer/control
limit and limit+1, shared deadline, last-byte and unequal-tail differences,
descriptor closure and full hashing even after mismatches. Demonstrate bounded
live reader state without claiming RSS or bounded R4 encoder memory.

Offline, scan/hash/compare the RETAINED R4 raw traces: reproduce their supplied
pins, false raw equality and missing footers, WITHOUT product rerun, transforms
or synthesized footer. No old red becomes green merely because the reader fits.

Use ACTUAL pinned `bun test`, not bun run alone: two-file order/capsule identity,
afterAll private finalization, fallback-exit rejection, repeated finish, duplicate/
partial/tampered/missing/unwritable footer, encoding/write/cap failure, post-seal
return and identical throw exactly once, swallowed errors and exit-code reset.
Recheck inherited fatal/proxy/native-brand/clone/alias/cycle/stack-safety cases.
Prove exact hook removal restores original test bytes and no expect count grows.

Exercise same-active-path env/config/cwd/argv identity, immutable snapshot guards,
candidate TSC closure, cache=0, fresh namespaces, ended-runner/closed-parent-FD
rename, rename rejection/occupied active, whole archive retention and sourceURL
raw equality on the eventual candidate. Existing parent probes are bounded
preflight evidence only, not substitutes for these checks.

Only AFTER those gates may the parent create exact new adjudication and decide
on a unique new R5 real attempt. Any structural incompatibility needs parent
adjudication, not an unreviewed fallback, normalizer, waiving live proof, extra
file, broadened scope, config change or automatic rerun.
