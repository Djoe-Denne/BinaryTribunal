# Planner isolated gate R3 — SOURCE_PROPOSED

## Status and ownership

These four files are a source-only proposal, not an executed gate, a green
receipt, a qualification, or permission to integrate. The worker performed
static reads, hashes and JSON parsing only. No compiler, typecheck, transpiler,
test, validator, product import, Bun execution, OS probe, DB, git, IDA, live,
network, delegation, team operation or task closure was performed.

The parent retains fresh independent review, harness self-checks, the execution
GO, the once-only real gate, and integration. An old R2 acceptance is not silently
treated as acceptance of these new bytes. No main, numeric extraction, S1 repin,
native or full44 claim follows from this proposal.

Input bookend: 12 pinned payload files, 381862 bytes. The raw INPUT_MANIFEST.json
is 3697 bytes, SHA-256
`603779b0a4d6841ea4d0877e20c696c1466acdb547f9ed3fc7a966c58e220148`.
All twelve payload sizes/hashes matched before authorship. Final bookend is
reported in MANIFEST.json and the worker handoff; it is not a runtime gate.

## Unchanged experiment

The baseline remains the 269 qualified files from the prior relation gate. They
are copied into two owned snapshots. Only the same four frozen planner-R1 source
files are overlaid/added in the candidate: planner-derived-codecs.ts,
function-order.ts, planner.ts, scc.ts. The frozen candidate also has its original
DESIGN.md and MANIFEST.json; those documents are guarded, not copied as product
code. Every baseline guard, the six frozen files, original tools, previously
pinned dependency files, original GO and original trace adapter must also
agree with the immutable first red receipt's pins. Parent approval cannot
rebaseline them merely by providing new hashes.

Instrumentation is the same narrow test seam as R2: each side gets identical
trace/capture.ts and trace/planner.ts; the latter wraps planMission and
compareGranularities and re-exports the original planner. Exactly one copied
planner.test.ts import is redirected, with a unique literal anchor check.
Producer bodies and the main checkout are not edited. The same planner.test.ts
and lineage.test.ts are run, sequentially, once per side, only after the full
candidate typecheck succeeds.

The original tsconfig stays byte-exact and is still copied. A derived candidate
config adds exactly two absolute SDK type paths. Deleting those two paths must
recover the parsed original config exactly. strict, noEmit, moduleResolution,
types, skipLibCheck, allowImportingTsExtensions and the full src/test/scripts
include are not weakened. The original config's packet hash is enforced.
@opencode/client 2.0.26's reviewed package and two declaration entrypoint hashes
are enforced, and exports must still select dist/promise/index.d.ts and
dist/promise/service.d.ts. No SDK runtime is intentionally loaded by the adapter
or the compiler invocation.

Acceptance still requires two successful two-file test summaries, positive
passes/assertions, zero failures/skips, equal counters, at least ten traced
calls, both methods, and at least one original product refusal. FULL graph trace
bytes must be equal, not a selection of fingerprints/numeric outputs. Independent
footer bytes must also be equal and valid. There is no retry/fallback on red.

## Fix 1 — approval binds reviewed bytes; no approval hash cycle

The gate reads an external parent-created
planner-isolated-gate-r3-parent-adjudication.json. It is created only AFTER fresh
independent V; it is not one of these four worker outputs. The invocation must
supply exactly one argument, --adjudication-sha256= followed by its exact digest.
The gate does not manufacture approvals, rescan inputs to approve them, accept
a bare verdict, or write an adjudication. The full adjudication is retained in
the receipt as parsed data, UTF-8 text and base64 bytes with size/hash. Its bytes
are guarded through bookend checks. Its own digest is supplied externally rather
than embedded into gate.cjs, avoiding a self-hash cycle.

Proposed parent contract, to review/adopt before any invocation:

- schema is planner-gate-r3-approval-v1; verdict is
  ACCEPTABLE_PLANNER_GATE_R3_PENDING_PARENT_ONESHOT; executeOnce is true. The
  source-only GO is separately hash-bound and does not itself authorize a run.
- pins is an array of absolute-path, exact-byte file pins with path, bytes and
  sha256. Every pin is verified before upstream JSON is trusted and repeatedly
  before/after children. No duplicate canonical path or adjudication self-pin.
- Required pins include all four proposal artifacts at their execution location;
  source GO; the R2 dependency plan; original GO/trace adapter; prior qualified relation receipt;
  original compiler receipt; planner-R1 delivery/acceptance; immutable first red
  receipt and its original stdout/stderr binaries; compiler tool files and Node;
  Bun; SDK package and both type entrypoints. The raw first red hash remains
  72fa246c5c1e39b41c6116254f160682b9e0300ec39d59848120589de532ed21.
- freshReview has a nonempty candidateId, verdict ACCEPTABLE, and files containing
  the same complete exact pin set, not just the proposal files. Each reviewed
  pin must equal the approved pin. It also has inventoriesSha256: SHA-256 of
  JSON.stringify on the gate's normalized closed inventories described below.
- inventories contains exactly mainHarness, dependencies and frozenPlanner, at
  the fixed roots in gate.cjs. Each has id, root and entries. A file entry has
  exactly path/type/bytes/sha256; a directory has exactly path/type. Paths are
  safe, unique, relative slash paths. Entries are lexically sorted by path,
  with field order path,type,bytes,sha256 for files and path,type for directories.
  The outer tree order is the order supplied in the adjudication. The normalized
  tree field order for the V digest is id,root,entries. Roots are the fixed
  forward-slash constants from gate.cjs. The gate computes this digest only for
  comparison with fresh V's already-approved value, never as self-approval.
- systemEnvironment contains exactly SystemRoot and WINDIR, each pointing to
  C:/Windows (case/slash normalization allowed), agreeing with the parent process.

The parent must carry forward any other upstream review/delivery/receipt inputs
used to make its decision in pins and freshReview.files too. These arrays are
not inferred from a directory at execution time. Existing upstream paths and
tool paths are consumed from the already-pinned original receipts, and required
tool/candidate hashes are additionally checked against the first red record.

Static counterexample: modifying capture.ts after V, while leaving an old
ACCEPTABLE verdict, fails exact pin verification before scratch preparation.
Replacing both a qualified source hash and its new parent pin still fails the
immutable first-red comparison. Replacing the adjudication fails the invocation
digest or later bookend, not silently creating a new approved baseline.

## Fix 2 — closed inventories and actual compiler corpus

mainHarness inventories the entire main tools/ff8-harness tree, with precisely
one separately inventoried mount: node_modules is recorded as a directory there
but its descendants belong to dependencies. dependencies covers ALL files, not
only declarations/package.json: JavaScript resolvers, package exports, binaries,
configs and nested dependencies are hashed too. frozenPlanner is closed and
must have exactly the original six files. All walks record directories, reject
symlinks/junctions/realpath redirection and reject special nodes. Every extension
is included. Additions and removals are mismatches, not just changed known files.

The full scratch tree is likewise closed, including both .tools snapshots,
homes, configuration and cache/temp namespaces, logs, traces and footers. Expected
immutable snapshot files come only from guarded sources or deterministic adapter
generation. Children can create only their exact trace/footer output paths. The
gate creates only named stdout/stderr logs. Outputs are then pinned and parsed;
the gate does not accept arbitrary newly discovered files as new dependencies.
Actual scratch inventories are retained at every checkpoint, including mismatches.
Input inventory checks retain their digests and any mismatching actual inventory;
the complete expected approved input inventories are always in the receipt.

The unchanged candidate typecheck adds --listFiles. Each actual path must be a
regular pinned candidate snapshot file or an exact file in approved dependencies.
Relative/unparseable/duplicate/outside paths reject. Every copied src/test/scripts
.ts file and both trace adapter files must actually appear. No external ambient
types, ancestor resolution, hidden config or unpinned transitive file is accepted.
This is compiler resolution evidence, not a claim to have an OS-wide dynamic
import monitor for Bun. Pure-runtime closure of the two existing tests remains
a parent-reviewed prerequisite; the gate does not expand the test set or SDK use.

Static counterexamples: adding an unlisted .js resolver under node_modules,
adding/removing a source in either tools tree, inserting a junction, or resolving
a declaration from an ancestor outside the corpus all reject. Broad include is
not narrowed to make --listFiles pass.

## Fix 3 — instrumentation failures cannot become product refusals

capture.ts increments a monotonically issued id before each BEGIN. It executes
the action exactly once. On product return it records RETURN; on product throw
it records THROW and rethrows the identical original object/value. All encoding
and trace writes are inside a separate instrumentation-only catch. Failure there
adds an out-of-band fatal; it cannot throw instead of a successful product result
or replace an original product error. Per-call instrumentation does not change
the product result or throw an instrumentation error into the test assertion.

A separate process-exit footer contains schema, finalized, issued, completed and
fatal. It is written once, synchronously, with wx, outside product control flow.
A write failure causes a missing/partial footer, independently red at the gate.
A duplicate wx failure could leave an earlier valid footer, so footer failure
also sets runner exitCode 97 and best-effort appends an invalid fatal trace marker.
This is an infrastructure exit failure, not a product throw. It cannot be hidden
by accepting a stale valid footer; a nonzero child status is independently red.
The footer has no scratch path/timestamp that would dilute byte comparison.

The parser independently enforces contiguous unique BEGIN ids; one matching
RETURN or THROW per BEGIN; matching method names; ids in issued range; no orphan,
duplicate or missing terminal; completed == issued; exact counts; at least one
THROW; both methods; and an empty fatal list. Missing/incomplete/concatenated
duplicate footer, missing trace, failed serialization/write or missing terminal
is red even if every Bun assertion and every toThrow assertion reports success.

Static counterexample: an unencodable returned function causes fatal metadata
while the caller still gets that same function, not a new product throw. An
unencodable thrown object is still thrown identically; swallowing it with toThrow
cannot conceal the fatal footer or BEGIN-terminal totality mismatch.

## Fix 4 — closed, identity-preserving value graphs

The supported domain is null/boolean/string, undefined, JavaScript numbers
including -0, NaN and infinities, ordinary or null-prototype objects, exact native
Arrays/Maps/Sets, and exact native Error/EvalError/RangeError/ReferenceError/
SyntaxError/TypeError/URIError/AggregateError prototypes. Bigint, functions,
symbols, symbol-keyed properties, Promise, Date, typed/native payloads, proxies,
custom prototypes/classes and accessors are fatal, not omitted or stringified.
The ordinary literals/diagnostics in this corpus are the intended domain, not
arbitrary application objects. A missing usable node:util types.isProxy detector
also makes encoding fatal, rather than allowing an unverified proxy domain.

Each graph retains all own string properties, property order, descriptor flags,
extensibility and prototype tag. Accessors are rejected before getter evaluation;
toJSON is never invoked. Built-in prototype descriptors and parent chains are
checked against their initial native state; mutation makes encoding fatal.
Map/Set insertion order and every key/value/member are represented via native
intrinsics, along with their own semantic properties.

Array own index descriptors and the own length descriptor preserve sparse holes,
undefined slots, null slots, tails and non-index properties separately. Error
name/message/cause/errors and all other own fields, including non-enumerables,
are included. Error.stack alone is deliberately excluded because it contains
different scratch paths; no other field is filtered or path-normalized.

Object identities are assigned once for the full capture session. Every BEGIN
and terminal emits a complete current reachable graph using these stable ids.
Aliases and cycles therefore remain distinguishable within and across calls,
before/after argument states, and returned/thrown values. This does not merely
serialize independently equal-shaped trees.

Static counterexamples: [hole] differs from [undefined] and [null]; {a:x,b:x}
differs from two equal-but-distinct objects; a self-cycle is an explicit backref;
Error cause or a nonenumerable diagnostic change changes bytes; a symbol-keyed
diagnostic or accessor is fatal rather than silently absent. Large/deep objects
may exhaust encoder resources; the catch/footer/totality path must stay red,
never justify a lossy truncation. Catastrophic process termination has no valid
footer and is red.

## Fix 5 — owned environment and unconditional config rejection

The child environment is built from an explicit object, not process.env. Only
the approved Windows SystemRoot/WINDIR values come from the system whitelist.
All HOME/USERPROFILE/HOMEDRIVE/HOMEPATH/XDG_CONFIG_HOME/XDG_CACHE_HOME/XDG_DATA_HOME/
APPDATA/LOCALAPPDATA/TEMP/TMP paths are owned per-side directories. Bun and Node
cache variables are explicitly assigned owned directories, not inherited.
Color controls and the two trace destinations are explicit. No inherited PATH,
NODE_OPTIONS, NODE_PATH, BUN options, preload, secret or arbitrary FF8 override is
copied. A parent runtime having any BUN* or NODE* variable is rejected too; the
parent must start the Node gate clean, since no script can undo a preload that
ran before its own first instruction.

Before/after preparation, each child and final closure, ANY present potential
global bunfig file at old HOME/USERPROFILE/HOMEDRIVE+HOMEPATH/XDG/APPDATA/
LOCALAPPDATA or owned selected namespaces rejects. This includes the two parent-
observed absent paths C:/Users/djden/.bunfig.toml and
C:/Users/djden/.config/bun/bunfig.toml. Nothing parses a regex to decide a global
file is harmless. Both bunfig.toml and .bunfig.toml spellings in the relevant
home/config/bun variants are checked. An implicit config in the snapshot cwd
also rejects. The sole deliberately created config is side/bunfig.toml, passed
explicitly; it has empty test preload. --config and --no-env-file are the
parent-verified flags retained from R2. No speculative disable-global flag is
introduced.

Fail-closed cache limitation: the owned cache/temp/home/config namespaces are
initially empty and remain closed. An unexpected cache file or any other child
write outside trace/footer makes the gate red, even if benign. No undocumented
cache-disable flag or exemption is invented to obtain green. Parent harness
self-checks must establish that the exact tools/config/env satisfy this before
authorizing the unique real attempt. If they do not, source correction plus fresh
V is needed first, not an unreviewed runtime allowlist or retry. The same applies
to the availability/behavior of node:util's proxy detector in the pinned Bun.

Static counterexamples: an empty global bunfig, commented preload, unconventional
TOML formatting or symlink at a checked config path rejects simply by presence.
An inherited NODE_OPTIONS cannot propagate to a child. A stray scratch cache or
.env file is detected by the closed scratch inventory, not accepted as a new pin.

## Fix 6 — reservation, structured red, faithful release

After a read-only containment check, the first filesystem mutation is openSync wx
of the fixed R3 stem lease. It precedes approval/upstream parsing, snapshot
preparation, scratch creation and all children. A colliding lease has no ownership:
the gate emits a structured infrastructure failure and cannot overwrite another
attempt's receipt/release. Existing receipt/release after acquiring a new lease
also prevents a retry. The lease is immutable and retained, with its token and
content hash checked at closure; scratch is separately recorded, not backfilled
by mutating the lease file.

One outer try/catch/finally covers parsing, inventory, preparation, guards,
spawning, output parsing and comparison. Owned preparation errors produce a
structured red receipt and a release record. Finally attempts input, scratch and
global-config bookends even following failures. Logs/scratch/traces and old red
artifacts are retained; there is no cleanup, rollback or overwrite.

spawnSync is used without a shell, with explicit executables/argv, bounds and
captured status/error/signal. Native synchronous return is the evidence for the
direct owned runner having ended, including timeout. A thrown spawnSync call is
conservatively unknown, never falsely reported inactive. Unknown runner state or
unproven lease ownership blocks successful release.

Receipt/release writes are separately caught. Failure to write/read back a
receipt, or write a release, yields an explicit infrastructure error and exit 3,
not success. Ordinary red is exit 2. Success requires exit 0 AND the matching
qualified receipt AND successful release referencing that receipt hash with
released=true and activeOwnedRunner=false. A receipt alone is not sufficient:
release write can fail after a nominal green receipt. released=false/null activity
is not an affirmative inactive claim when ownership/completion is unknown.

Static counterexamples: malformed upstream JSON or a failed snapshot copy after
reservation reaches finally and records red; timeout status is red but no runner
is claimed active following synchronous return; a thrown spawn API yields unknown
activity; a full/unwritable receipt/release destination is explicit infrastructure
failure. No successful branch can skip the final bookends and receipt/release.

## Review handoff and remaining limits

All above counterexamples are static control-flow arguments, not executed tests.
No runtime compatibility, successful TypeScript compilation, proxy-detector
support, cache behavior, test counts or actual output equality is claimed here.
The parent must independently review these bytes and the external approval
contract, establish the harness properties with its own permitted self-checks,
and only then decide whether to issue the single execution GO. A real env/SDK/
listFiles discrepancy is a stop for parent adjudication, not permission to invent
a flag, add a runtime fallback, relax includes or run again.

The model is a guarded trusted-test experiment with before/after inventories,
not an OS sandbox against malicious concurrent mutation or invisible transient
reads. It adds no live, native, global configuration or main integration work.
MANIFEST.json pins the other three outputs; its own hash is supplied by the
worker handoff and later external parent adjudication, avoiding self-reference.
