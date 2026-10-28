# Planner R5-R3 prototype DATA — SOURCE_PROPOSED

## Authority and source-only status

This is the five-output implementation of the accepted plan
`result_mvff0tub_009h_w3y7ej`, under the packet SCOPE and
`PARENT_PLAN_ADJUDICATION.json` verdict `R5_R3_PROTO_DATA_PLAN_ACCEPTED_SOURCE_ONLY`.
It extends only the fixed corpus's explicit direct DATA-prototype domain.
No gate execution, qualification, integration, S1/puredeps/native/full44 promotion
or automatic retry is authorized by these sources.

All 14 payload pins matched before authorship: 218768 bytes. Raw INPUT_MANIFEST
is 4505 bytes, SHA-256
`305d0a3d43437b948c698aa73b9f4656e29482071abffd14012ddf3dc81804a2`.
Final input bookends and exact output pins are recorded in MANIFEST/native final.
Worker activity is filesystem reads/copies, owned patches, SHA-256, JSON parsing
and static byte/text comparison only. No compiler/typecheck/transpile/test/run/
validator, candidate require/import, product/Bun execution, OS probe, DB/git/IDA/
live/network, delegation/team tool, task closure, global config or main write.

Exactly five NEW sibling outputs: gate.cjs, capture.ts, trace-stream.cjs,
DESIGN.md, MANIFEST.json. The gate is copied BYTE-IDENTICALLY from R5-R2.
Capture changes only its private type declarations and encodeRoots. In the leaf,
only Parser.node changes. No scientific test, product source, hook, import path,
assertion, framework phase, child argv/environment/cache or approved guard changes.

## Why this domain extension is necessary

The exact pinned test `reference/test/planner.test.ts:505-530`, especially 513,
constructs DATA prototypes for three IDs (constructor/toString/hasOwnProperty)
and three ByEdge tables. Their inherited values must be ignored by the product,
but MUST be faithfully captured by instrumentation, not omitted or waived.
An own constructor property containing a string is intentionally valid DATA.

Supplied R5-R2 evidence contains 56 green synthetic streaming checks and five
green scoped actual-candidate capture fault cases. The initial streaming receipt
is nevertheless RED because it wrongly expected historical R4 scan acceptance.
The retained supplement correctly expects rejection: each historical branch
has 692 BEGINs, last issued id 701 and missing ids
471/475/479/483/487/491/495/499/503. Both old private footers remain absent.
The supplement's full RAW comparison covers 565 aligned windows and still finds
different bytes (107 trailing unpaired bytes). None of this qualifies R4.

The nine missing IDs versus nine Object.create cases are a STATIC correspondence
until a future fresh corpus-shaped capture proves it. This source change does
not repair old traces, generate replacement records/footers/counts or turn the
wrong historical expectation into a green proof. All old red/evidence survives.

## Closed representation and types

RefAtom is a private exact tuple ["ref", number]; generated ids use the existing
global identity allocation, and the parser requires positive safe integers.
The private Node union closes ExistingKind to the original object/null-object/
array/map/set/eight native Error tags. ExistingNode excludes prototype; the
new PrototypeNode has kind `object:prototype`, REQUIRED `prototype: RefAtom`
and no entries. The original entries handling for existing Map/Set remains.

Only the NEW receiver node has serialized keys id/kind/extensible/properties/
prototype, in that order. Its prototype reference targets a separately visited
ordinary object or null-object node, with its own keys/order/descriptor flags
and extensibility. Existing nodes keep their original fields and serialized
order; no prototype field is added to them. DATA named "prototype", "constructor"
or "__proto__" remains a property tuple, not assignment into a reconstructed
object. No spread/flatten/copy of inherited properties is performed.

## Classification: brands first, one direct level only

Inside encodeRoots, nativeState performs isProxy FIRST, then all existing
forbidden-brand predicates, then Array/Map/Set/native-Error predicates, BEFORE
getPrototypeOf or descriptor inspection. Both receivers and candidate prototype
objects use this path. No constructor lookup, instanceof or toString-tag hook
is used for classification.

Original native branches still require exact Array.prototype/Map.prototype/
Set.prototype/known Error prototypes; disguised native instances cannot fall
through into the new ordinary branch. The Error-tag switch merely closes the
TypeScript union to the already-known eight tag strings; it does not add a tag.

For a non-native receiver whose prototype is neither Object.prototype nor null:

1. verifyDataPrototype first applies nativeState to the prototype itself, so
   a Proxy is rejected before any secondary inspection/trap.
2. Reject function-valued prototypes, native arrays/maps/sets/errors and any
   known builtin snapshot prototype masquerading as a DATA prototype. Existing
   forbidden brands reject regardless of their current prototype.
3. Only then inspect its parent; require EXACTLY Object.prototype or null.
   A second custom inheritance level is fatal, including class/native chains.
4. Call unchanged verifyPrototype ONLY on that terminal. The mutable DATA
   prototype is not falsely checked against a builtin snapshot.
5. Visit all of its own DATA properties through the ordinary graph traversal.
   Accessors/symbols/functions, including a class's own constructor function,
   fail before clone or trace append. Constructor STRING remains valid. No
   original toJSON/getter is invoked. A non-Error DATA "stack" accessor is not
   exempted by the preexisting native-Error.stack exclusion.

The representation is the fixed trusted producers' DATA contract, not a
universal proof of JS literal/class/private/external-state origin. A class
deliberately made structurally indistinguishable from allowed DATA is not
claimed detectable by provenance magic. Native predicates and the clone
counter-probe retain their existing bounded counter-evidence role.

## Identities, complete-node installation, reverse safety and clone

identity() is the old WeakMap allocation extracted into an encodeRoots-local
helper. Existing kinds retain their allocation/traversal semantics. New custom
receivers reserve the real GLOBAL prototype identity without traversing it,
construct a COMPLETE PrototypeNode (no invalid placeholder), push it, then call
edge(receiver, prototype) before walking the receiver's own properties.

That edge records the reverse parent relation and visits the prototype. A DATA
prototype pointing back to its receiver terminates through visited, and shared
prototypes remain shared references/nodes, not equal-shaped duplicates. Across
records the identity WeakMap persists while visited/graphs are fresh, so changes
to prototype values/order/descriptors/extensibility/pointer are newly observed.
Cycles through DATA properties are allowed; custom inheritance depth >1 is not.
New prototype nodes legitimately add ids and can shift later session ids; this
is not a claim that previously incomplete historical trace bytes stay identical.

Both the custom receiver and its ordinary/null-object prototype enter ordinary.
The original reverse Error-reachability closure now sees the prototype edge:
ordinary -> prototype -> Error is fatal BEFORE structuredClone. No native Error
stack descriptor is read, and unsafe roots are not silently skipped.

The single existing structuredClone of ALL ordinary roots remains at most ONE
per encoding, after complete graph validation. Explicitly including the DATA
prototype covers state which native cloning of a receiver may not traverse.
Cloned roots still must classify ONLY object/null-object; a custom/native cloned
root is not newly allowed. Clone payload is discarded. Any flattening performed
by the native counter-probe never replaces or normalizes the original payload,
whose explicit prototype reference/nodes are what get serialized and compared.

## Parser.node only: exact shape extension

The node field table appends prototype AFTER entries, preserving existing bits:
base id/kind/extensible/properties = 0x0f; entries = 0x10; prototype = 0x20.
The ONLY accepted masks are 0x0f for original non-Map/Set nodes, 0x1f for Map/Set,
and 0x2f for object:prototype. Existing Map/Set entry union checks remain intact.

The prototype handler is LOCAL to node(): parse an array of exactly two items,
first decoded string exactly "ref", second existing integer() (positive safe).
No tupleValue/tokenizer change or global reference index is introduced. Missing,
extra, duplicate, wrong-tag/wrong-type/wrong-length prototype, entries on the
new kind, and prototype on an old kind all reject. Object field order stays free.

This is closed shape validation, not a new graph-reference/depth-origin proof.
The pinned capture establishes prototype semantics; FULL RAW byte comparison
and unchanged guards still establish experiment equality. Reader/strict UTF8/
grammar/other atoms/5 exports/APIs/footer/comparator/caps/deadline stay byte-exact.

## Static delta and inverse-source evidence

These are static byte comparisons, not executed candidate tests:

- Gate: 47304 bytes, 776 lines, unchanged SHA-256
  `c2dc8fd67b3dd06022be52de2ac6de08f7d8a70f0bba742ce16c0210d1220d86`.
- Capture: 13982 -> 16829 bytes; +2847 bytes, 22 removed/72 added lines.
  Only the type span (259 -> 758 bytes) and encodeRoots (6072 -> 8420 bytes)
  change. Restoring those two spans in memory recovers ALL R2 bytes/hash
  `1ad673becedfdd6b64e377f3cfa95e5b91cd8c6704d6ac75416a81376e15200c`.
- The OLD broader 8420-byte block FROM "// Native brands" THROUGH encodeRoots
  is NOT byte-exact anymore: it is now 10768 bytes, SHA-256
  `524c5dd7d9033826a3679246e9c402167e69d9f9e247b83ea5cdc82746d8a829`.
  The new function alone happens to be 8420 bytes; that is a different range,
  not reuse of the old encoder preservation claim.
- Capture's 170-byte imports prefix, 3341-byte Graph-to-encodeRoots middle and
  4140-byte note-through-EOF suffix are unchanged. In particular ALL private
  footer/fatal marker/native queue/postseal/action-once/limits code is intact.
- Leaf: 17275 -> 17758 bytes; +483 bytes, 3 removed/12 added lines. Restoring
  ONLY Parser.node recovers ALL R2 bytes/hash
  `d1aa7e4439fb7c0e8247e97f9e249cef10a5ecab0a38c9212e237be376e8dbfa`.
  Prefix before node is 9528 bytes; suffix from graph is 6834 bytes, both exact.

No inverse file or sixth artifact is written. MANIFEST includes the exact
span pins and four nonrecursive artifact pins; its fifth own pin is native-final
and later externally adjudicated, never recursively embedded.

## Unchanged experiment, caps and remaining parent gates

Unchanged gate retains all 269 baseline guards/four accepted planner TS/two
scientific tests/methods/refusals/assertion counters, strict full TSC/listFiles,
closed inventories, exact approval bindings, early lease/structured red release,
cache0/global-config checks and snapshot/same-active-path/archive phase proofs.
No schema/argv/hook/path/sourceURL/metadata exclusion/normalizer is introduced.
New R3 GO/packet/plan adjudication must be carried as extra exact external
adjudication/freshReview pins; existing required bindings are not rebaselined.

All caps remain fatal/refuse-only: chunk 1MiB, trace 1GiB per side/pair 2GiB,
record 256MiB, rows 200000/calls 100000, depth64, footer64KiB, controls16MiB,
explicit streaming-reader working state8MiB, shared monotonic analysis600000ms.
New disk budget remains 2*(exact S0+S1)+2GiB+64MiB, R4 retained additionally.
No encoder/RSS/GC/stdlib memory, arbitrary OOM/forced exit/compromised host or
universal provenance guarantee is claimed. The R2 fixed-runtime assumptions for
its queued host-failure signal remain unchanged.

Parent sequence remains fresh V on ALL FIVE final pins BEFORE any candidate
selfchecks. Then rerun the 56 old stream checks and all five actual capture
fault cases; the DATA-prototype case changes expectation only for this ratified
domain, while unsupported prototypes/accessors stay fatal. Keep the exact lost
marker + unchanged clean trace/footer + exitCode-reset return/throw host-signal
proofs, not substitutes based on broken output files.

Add genuine corpus-shaped nine-combination capture with contiguous BEGINs and
private footer; shared vs distinct prototype identity, DATA cycles, prototype
mutation/order/flags/extensibility, Object vs null terminal, inherited vs own
shadow, literal special keys, no-accessor/toJSON invocation, proxy/native spoof/
class/function/symbol/depth>1/Error-reachability refusals BEFORE clone; parser
fragments and all invalid mask/ref combinations. Regression old admitted value
fixtures should retain their raw representation; no scientific test is edited.

Historical R4 must STILL refuse for gaps/missing footer and compare unequal by
FULL RAW bytes. No backfill or footer reconstruction. After successful scoped
checks, parent separately decides exact adjudication and the unique real gate;
only exit0 plus qualified receipt/readback and matching inactive successful
release can support acceptance. Integration and S1/puredeps/native/full44 remain
separate and blocked here. No task closure or automatic continuation is performed.
