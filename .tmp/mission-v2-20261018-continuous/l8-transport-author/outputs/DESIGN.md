# L8 phase1B — pure transport source candidate

Status: SOURCE CANDIDATE, NONBLIND author. No source was imported, evaluated,
compiled, typechecked, tested or executed. No schema validator was run. Only
input data parsing/hashing and source-text authoring/inspection were performed.
The frozen schema candidate is an input, not acceptance of this implementation.
Fresh V review and parent-owned compile/test gates remain outstanding.

## Ownership and provenance

Exactly three outputs: `graph-transport.ts`, this `DESIGN.md`, `MANIFEST.json`.
Future destination of the source is `src/graph-transport.ts`; nothing was written
to a central source, schema, test, package, database, registry or Git state.

Input manifest SHA-256:
`0fed4681a958126c1b57f8bf3c535eade553dd60ab2cc089ce30c6fed15a083f`.
18 pinned files total 670751 bytes. Initial verification: 18/18 exact.
The manifest's `source` fields were treated as provenance strings only; no
origin was opened. Parent approved the API and output-only implementation plan.

Schema bytes are unchanged and supplied/installed by the parent:

- `../schemas/l8-prepared-graph-v3.schema.json`:
  `fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9`.
- `../schemas/l8-partition-adoption-v1.schema.json`:
  `c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e`.

No source API in this file accepts a trusted callback, store, local receipt,
process, DB connection or authority object.

## Public contract (sufficient for fresh QA without implementation)

Four functions, all take an already parsed `unknown` value, never parse a string
implicitly:

```ts
decodePreparedGraphV3(value: unknown): TransportDecodeResult<PreparedGraphTransportV3>
decodePartitionAdoptionV1(value: unknown): TransportDecodeResult<PartitionAdoptionTransportV1>
inspectPreparedGraphV3(value: unknown): PreparedGraphTransportInspection
inspectPartitionAdoptionV1(value: unknown, prepared?: unknown): PartitionAdoptionTransportInspection
```

`TransportDecodeResult<T>` is `{ok:true,value:T}` or
`{ok:false,errors:readonly string[]}`. A success owns a cloned, recursively frozen
JSON tree and is typed deeply readonly. The caller's input is neither changed
nor frozen. No normalization, sorting, trimming, deduplication, defaulting or
truth-value conversion is applied to transported fields. This is value-lossless
JSON transport, not preservation of original JSON source whitespace, key order
or lexical number spellings. Errors are strings with document paths, not a
ratified new error-code namespace; callers must not key behavior to full prose.

Both inspections expose:

- `wellFormed`: the decoder succeeded (JSON domain plus actual frozen schema).
- `coherent`: well formed and every implemented documentary relation completed.
- `schemaErrors`, `coherenceErrors`: separate readonly string arrays.
- `stats`: null on shape failure; cardinalities otherwise (not performance).
- `evidence`: `{status,present,wellFormed,admissible}`. The last two values are
  booleans only for `status:"inspected-B"`, otherwise **null**, not false.
- `authority:"untrusted"`, `adoptionReady:false`: unconditional constants.

Prepared inspection also exposes `branch:"A"|"B"|null`. Evidence status is
`"not-present"`, `"not-applicable-A"` (A with evidence), or `"inspected-B"`.
Adoption evidence always has `status:"not-applicable-adoption"`, `present:false`.
Malformed prepared shape returns branch null and status not-present; it does not
claim to have interpreted arbitrary malformed payload evidence.

Prepared stats fields (raw list cardinalities, duplicates included if coherent
is false): `communityCount`, `groupCount`, `memberIdCount`, `kernelIdCount`,
`externalContextIdCount`, `ownedFunctionIdCount`, `groupContextIdCount`,
`uncoveredIdCount`, `snapshotNodeCount`, `snapshotEdgeCount`. The last two are
null if no evidence is present, including A without evidence. They count the
schema-shaped evidence source arrays even for uninspected A evidence.

Adoption stats: `inventoryUnitCount`, `quiescenceProofCount`,
`ownedFunctionIdCount`, `attemptIdCount`, `claimIdCount`,
`unknownAttemptInventoryCount`, `unknownClaimInventoryCount`. Attempt/claim
counts sum only explicitly present inventory ID lists, not nested rows or proof
echoes. Unknown counters record absence, so an absent list never becomes `[]`.

Adoption inspection adds
`preparedBinding:"not-requested"|"invalid-prepared"|"matched"|"mismatched"`.
Omitted or undefined optional prepared input means not-requested. Null is a
supplied invalid prepared input. When the adoption shape itself is invalid, no
binding is attempted and the field is not-requested. Matched means equality
against a schema-shaped document, **not** that the prepared document is coherent,
admissible, stored, current, adopted or authoritative.

### Types are transport types, never runtime A types

`PreparedGraphTransportV3` has `schemaVersion:3`, a current v1 partition with
`adopted:false`, required `groups`, and optional `proposalEvidence`. This wrapper
is not a PreparedGraphV1/V2 and supplies none of their execution/planning inputs.
The partition remains A/B-capable; there is no B-to-ClusterPartition cast.

`ProposalEvidenceTransportV1` preserves the complete evidence source/result,
including lossless metrics, diagnostics and immediate previous history. Only
the primary/root and result partitions have adopted false as the pinned schema
requires. Previous and previous.authoritative partitions keep boolean adopted,
including true. All raw negative source/provenance/constraint strings survive.

`InvestigationGroupTransportV1` uses the existing group fields but deliberately
widens its granularity to the actual schema's
`function|family|scc|group|subgroup`. The central TS type lacks family/scc; this
module neither narrows the schema nor silently casts to that central type.

`PartitionAdoptionTransportV1` mirrors the 14 required fields and the inventory
shape excluding executionContext. No locally minted capability type is exposed.

## Separation of shape, coherence, outcome and authority

### Decode: shape only

The actual imported JSON schemas are passed to existing
`validateStaticJsonSchema`. There is no copied or competing schema evaluator,
new dependency, schema change, pattern keyword or hidden schema tightening.
A generic descriptor-based plain-JSON guard runs before cloning. It rejects
non-finite data, cycles, accessors, symbol/non-enumerable keys, non-plain objects,
holes and decorated arrays rather than invoking getters or accepting a lossy
serialization. Shared acyclic references are allowed. Ordinary data accessors
are never read. This guard is not a host-security boundary for JavaScript Proxy
traps; caller-controlled proxies can trap even reflection operations, and are
outside the JSON transport trust model. Reflection/clone/validation failures are
returned as decoding errors, not product-side effects or thrown input errors.

In particular: B with absent evidence still decodes successfully if its envelope
has the schema shape; it fails the independent coherence check. A with evidence
is preserved; its presence is not forbidden by any invented relation. Negative
diagnostics and rejected constraints are not extra decoder rejection criteria.
The decoder never calls `inspectProposalEvidence`, recomputes a clustering or
connects to anything.

### Prepared coherence

Common partition checks cover lowercase fingerprints/function IDs/content IDs,
content-addressed community membership, unique community and member ownership,
kernel subset and external-context disjointness, parent ID uniqueness and
known/value metric consistency. No metric value is rounded or reconstructed.
No extra nonnegative bound is imposed on signed integer transport metrics.
Lineage identity is kept distinct from content/partition identity.

Groups must join the root partition and an existing primary community, have
unique IDs, unique known owned functions across groups, known disjoint context,
known uncovered references, owned member-maturity references and consistent
known/value cost. An uncovered function may also be owned. This does not demand
full membership coverage, nonempty groups, kernel-to-group equality or ownership
inside only the primary community. The actual group builder permits empty
kernels, uncovered attribution and cross-community attach-adjacent groups; the
full origin sidecar is not present in this wrapper. These missing sidecars are
not fabricated. Capability IDs are transported, not re-authenticated here.

A checks structural maturity/null parent lineage. If A has evidence, the exact
root/result partition mirror is checked but the B-specific evidence inspector
is **not** run as a universal rejection gate. Its evidence flags are null and
status explicitly not-applicable-A. A source/evidence scientific evaluation is
not established by this module.

B requires evidence, the exact canonical root/result partition mirror, and the
existing `inspectProposalEvidence(...).wellFormed`. That shared inspector owns
source snapshot/config identities, content and evidence fingerprints, node
coverage, sidecar/projection coherence, constraints, previous bindings and full
lineage replay. It is reused, not reimplemented. Its `admissible` is returned
independently: `wellFormed:true,coherent:true,evidence.admissible:false` is a
valid result for faithfully transported negative evidence. No diagnostic is
removed, including prior authoritative negative diagnostics.

Coherent does not mean a global graph acceptance, scientific truth or a native
admission. Canonical equality treats object-key order as irrelevant while
preserving array order and all transported fields.

### Adoption coherence: declarations only

Checks cover lowercase digest fields, distinct lineage/partition identity,
unique unit IDs and unique proof-per-unit IDs, canonical owned function IDs,
present attempt/claim list uniqueness and declared nested-list/snapshot joins,
proof-to-inventory identity joins and same sets when the inventory lists exist.
Missing inventory lists stay unknown; missing proofs are not fabricated or
required as a universal coherence criterion. Flags such as quiescent=false,
released=false, leaseHeld=true and workerStillExecutable=true remain negative
claims, not shape failures or an implicit safety decision.

Units/proofs join each other's snapshot, not necessarily the new partition's
snapshot: historical units remain bound to their original snapshots. No global
cross-unit ownership disjointness or requirement that historical owned functions
belong to the new partition is invented. Revisions retain schema bounds; no
delta content, revision step, current-revision binding or proof-revision authority
is inferred from the two numbers alone.

With optional prepared input, its shape is decoded and the five partition,
lineage, snapshot and config identities compared. Documentary proposal hash is
`hash(canonical({...partition,adopted:false}))`; observedDigest is
`hash(canonical(partition))`. This is not a DB read, durable immutability check
or proof that bytes were stored. Its evidence admissibility is not recomputed
or promoted by a matching join.

`actor.hostReceiptRef`, even whitespace/nonempty, is merely the raw unresolved
reference permitted by the schema. No trimming or authenticity inference occurs.
Neither JSON proof flags nor inventory data are authenticated. There is no
HOST resolver, verifyQuiescence, localReceipt minting, planAdoption invocation,
putPartition call, adopted flip, active-unit migration or mutation of DB/input.
Future trusted HOST authentication, L6 quiescence, durable exact inventory and
same-frame/safety gates remain exclusively with the parent/application layer.

## Imports, effects and resources

Intended imports use destination-relative schema/module paths, never scratch
paths. Runtime dependencies: two static schema JSON imports, graph's existing
schema evaluator, lineage's community-content hash helper/evidence inspector,
and validation's canonical/hash helpers. InvestigationGroup and lineage views
are type imports. No new package dependency is proposed.

The **functions** are read-only computations over cloned data. This is not a
claim that the transitive module graph has no initialization effects: existing
lineage.ts reads its two frozen JSON schemas at module load and imports
semantic-index cyclically; validation imports re-policy. The graph module also
loads its existing snapshot JSON. These inherited module initializers must be
assessed by the parent integration gate; no worker imported them in this task.
No new filesystem reader, network, native/process/store API or callback is added.

B inspection can recompute scientific/lineage consistency inside the existing
inspector, including overlap/ancestry work. It is not a promise of linear time,
a bounded worker or native-safe execution. Decode traverses/clones/validates;
canonical/hash/membership checks may allocate full strings and sort. Group and
inventory indexes use maps/sets; each inspection owns a fresh decoded copy.
Counters describe list entries, not UTF-8 bytes, memory, tokens or wall time.

No new cap, timeout, numeric budget or truncation policy is introduced. Schema
limits and the shared inspector's existing JSON nesting/other policies still
apply; decode does not silently adopt the inspector's separate acceptance
policy. Host resource limits, caller-provided parsed-input size and retention
remain future integration responsibilities. Runtime stack/allocation failures
can produce inspection/decode failure; this candidate does not promise arbitrary
depth/size support or claim to establish resource admissibility.

## Fresh-QA cases (specification only, none executed)

- Additional keys, invalid types/literals, noncanonical numeric values and sparse
  or accessor objects: decode error; input unchanged.
- Schema-shaped B without evidence: decode success, wellFormed true, coherent
  false, evidence not-present. V1/V2 prepared graph documents: decode failure.
- A without evidence: evidence not-present/null flags; A with mirrored evidence:
  preserved and not-applicable-A/null flags, not rejected merely for presence.
- B faithful negative evidence: separate positive form/content and negative
  admissibility; preserve raw empty strings and previous adopted=true.
- Mirror mismatch, malformed hashes, duplicate ownership or dangling group
  community: shape may remain valid but coherence false. Family/scc granularity
  is not rejected merely due to the narrower central TS union.
- Kernel-empty/community uncovered and cross-community primary joins must not
  gain invented complete-coverage or primary-only ownership requirements.
- Adoption with all positive payload flags and nonempty HOST reference remains
  authority untrusted/adoptionReady false. Negative flags still decode; missing
  optional ID lists remain absent with explicit unknown counters.
- Optional prepared absent/undefined, invalid/null, exact match and one-field
  mismatch produce the documented binding states; matching cannot grant trust.

## Source anchors (all relative to frozen inputs)

1. `SCOPE.md:14-42`: decode/coherence/outcome separation, no B-to-A cast, lossless
   negatives/history and constant untrusted authority boundaries.
2. `src/graph.ts:239-295`: existing exported strict schema subset and numeric
   canonicality; reused without a divergent evaluator.
3. `src/lineage.ts:419-452,491-502,899-914`: bounded-immediate history model,
   historical adopted boolean normalization, hashes and membership invariants.
4. `src/lineage.ts:1005-1102`: existing B evidence form/content/outcome checks,
   raw source strings, full source/lineage consistency and negative admissibility.
5. `src/investigation-groups.ts:4-10,104-116,140-174` and
   `schemas/investigation-group-v1.schema.json:83-92`: narrower TS granularity,
   kernel-empty/cross-community groups and actual wider schema enum.
6. `src/lineage.ts:88-101,640-651,681-711`: absent inventories are unknown;
   identity-based declarations and separate trusted quiescence callback gate.
7. `candidate/DESIGN.md:52-78,104-148,235-303`: A/B envelope, exact mirrors,
   scientific/authority separation and ratified negative/history schema deltas.

## Handoff limits

No PASS, runtime acceptance, C3-C5/G7 closure, native proof, DB adoption or central
integration is claimed. The only authored source candidate is this transport.
MANIFEST records payload sizes/hashes without a circular self-hash; its own
SHA-256 and final input rehash are reported in the task-result receipt. Fresh V
and parent-only compile/run remain separate, unperformed gates.
