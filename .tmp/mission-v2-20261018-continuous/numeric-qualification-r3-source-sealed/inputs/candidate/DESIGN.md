# Numeric and group-context PURE extraction — source R2 minimal correction

Status: SOURCE CANDIDATE, UNQUALIFIED. This isolated six-file candidate does not
authorize a qualified S1 repin, load/payload change, native/HOST claim or promotion.
Source GO is the R2 pinned `inputs/SCOPE.md`; the R1 source GO is retained as
`inputs/PARENT_R1_SOURCE_GO.md`. MAIN and the other extractor's files
are not changed. MANIFEST records static byte provenance, not executable evidence.

## R2 correction and retained R1 failure

R1 is frozen CORRIGE, not accepted and not compiled. Review
`result_mvf7psmv_0076_re3jtq` and the parent identified two defects. The R1
single-constructor claim was incorrect: cluster still declared a local class in
addition to importing/reexporting the codec class. Literal moved-body matches did
not prove declaration uniqueness or successful integration. Also, four ordinary
group-ID dictionaries in the new adapter mishandled valid `__proto__` identifiers.
R1 artifacts and their incorrect claims remain preserved in the pinned prior set.

R2 makes exactly two source deltas:

1. Remove prior cluster.ts lines 50-57 (the local class plus its comment), leaving
   the existing codec constructor import/reexport unchanged. There is now only
   one class declaration in the four proposed source files, in the numeric codec.
2. In deriveFixedGroupContexts only, replace the four group-ID dictionary `{}`
   initializers with Object.create(null): sourceCommunitiesByGroupId,
   kernelIdsByGroupId, contextIdListUtf8BytesByGroupId, omittedContextIdsByGroupId.
   Their Record API and all nonempty unique supplied ID admission remain unchanged;
   no rename or rejection of `__proto__`, `constructor` or `toString` is added.

All other source bytes are R1-identical. sparse-graph-codecs.ts and
investigation-groups.ts are entirely byte-identical to their pinned R1 versions.
MANIFEST records exact delta text, hashes and inverse byte restoration to R1;
the 37 earlier literal provenance spans are retained with R2 destination lines.
Neither inverse text restoration nor those spans are executable qualification.

Fresh delta V and parent full-output/error/fingerprint/diagnostic equivalence,
special-ID and constructor-identity checks, numeric/context/regression/pure-closure
gates are still required before any qualified S1 repin. None was executed here.

## Ownership and runtime direction

Outputs are exactly `src/sparse-graph-codecs.ts`, `src/group-context-codecs.ts`,
`src/cluster.ts`, `src/investigation-groups.ts`, this document and `MANIFEST.json`.
No planner, function-order, SCC, validation-core, S1, schema or QA output is added.

- sparse-graph-codecs -> validation (values); cluster (types only).
- group-context-codecs -> sparse-graph-codecs, validation (values);
  cluster and investigation-groups (types only).
- cluster -> both codecs and validation (values).
- investigation-groups -> both codecs and validation (values); cluster (types only).
- qualified validation -> node:path, qualified re-policy (values), domain (types).
- qualified re-policy -> validation (values), domain (types).

There is no codec value import of a producer, graph-pure-codecs, planner,
persistence or orchestration. The existing validation/re-policy value cycle is
retained, not rewritten. Bun.CryptoHasher, Buffer and ordinary JS collections are
the existing runtime prerequisites; this is not a cross-runtime portability proof.
No common hash or ordering leaf is introduced. The extra qualified graph/policy/
schema pins remain read-only references, not new codec runtime dependencies.

## Numeric exact moves

SparseGraph, SparseGraphSnapshot, NumericSource, NumericGraphSummary, Arc and
WeightConvention now live in sparse-graph-codecs. Numeric policy/budget constants
and ClusterDiagnosticError move there too. cluster imports and reexports the SAME
constructor, constants and prior public functions/types. No second error class is
defined; instanceof checks and all producer diagnostic codes keep one identity.

The moved function/class spans are byte-exact, except adding `export ` before
eight previously private declarations that actual remaining cluster callers need:
check, finite, integer, numericFailure, Sum, sum, summands, numericSummary. The
declarations' original text remains a literal substring. MANIFEST records source
and destination spans/hashes and actual remaining call sites. No other private
numeric helper is exported. buildSparseGraph, graphProjection and numericBinding
remain private.

The whole existing sparse construction/import/export/validation closure moves,
including compareFunctionId and reconcileClusterRelations. Do not substitute the
SCC comparator or planner/L2 relation helpers: their contracts differ.

Preserved numerical rules include:

- canonical duplicate summation order and original positive source summands;
- existing Neumaier accumulation, constants, errors, refusal details and versions;
- source budgets, counts and no silent pruning or budget enlargement;
- source/canonical arcs/out/incoming/degrees/total and numeric bindings checked
  together on each public numeric boundary, with no validation cache;
- metadata-free legacy canonical-arcs interpretation, without claiming recovery
  of pre-canonical summands;
- negative-zero/overflow/malformed-cache/stale-binding behavior;
- affinity remapping from numericSource.arcs when present, with its budget, using
  the SAME sparseGraph implementation and binding computation.

dyadic/ratio/weightProduct/scaledGraph/floatBits/intervals/PPR/Leiden/modularity/
certificates remain in cluster and use imported leaves where required. Their
existing bodies are not reimplemented in a codec. CLUSTER_VERSION and scientific
algorithm configuration/selection remain producer-owned and unchanged.

## Narrow context basis, not a regime-A partition parameter

GroupContextPartition contains only schemaVersion, partitionId, snapshotId,
snapshotFingerprint and communities. Each community exposes only contentId,
memberIds, kernelIds and externalContextIds. Arrays can be readonly. The codec
does not require ClusterPartition, regime A, algorithm fields or an A-only cast.
A structurally validated future B value can therefore satisfy the shape without
casting B to A. This shape neither validates B nor changes legacy loading.

GroupConfig/GroupMetrics/InvestigationGroup and ClusterInput references in the
codec are type-only. DEFAULT_GROUP_CONFIG moves unchanged and is reexported by
investigation-groups to avoid a value cycle. The shared requireThat body retains
its original error prefix and is also used by remaining producer cost/owner checks.

## Context APIs and staging

The exported signatures and exact technical result fields are declared in
src/group-context-codecs.ts:

- prepareGroupContextSource(input, narrowPartition, overrides, explicitSource)
- bindGroupContext(prepared, hubIds)
- deriveDraftGroupContexts(bound, chosenDrafts)
- deriveFixedGroupContexts(bound, suppliedOwnership)
- deriveCommunityContextIds(numericGraph, fixedMemberGroups)
- groupContextContentFingerprint(group, binding, origins, allCapabilities,
  omittedGroupContext, omittedCommunityContexts)

GroupAdjacencySource is an explicit raw/provided-affinity discriminated union.
An affinity branch uses the discriminator, validates the supplied numeric graph
and NEVER converts missing/falsy affinity into a raw-source branch. The old
producer's optional graph behavior remains its legacy adapter at the call site.

prepare moves original config/partition/source validation and adjacency blocks.
All relation shards are reconciled BEFORE active/callback filtering, even when
affinity is supplied. Ordinary neighbor additions and insertion order stay as in
the original; no compensated adjacency arithmetic is introduced. Provided affinity
retains exact node binding, summand-aware remapping and numeric binding.

bind runs after the producer's existing split/attachment phase, as the original
hub validation did. It computes actual hub ranking, adjacency/source bindings,
once-per-community retained context and complete community omissions. The source
mode comes from the explicit discriminator. contextRank is a single shared
closure, not a second ranking implementation.

The producer retains its exact balanced split/attach blocks, split-count pass,
cost/capability/group identity/construction/diagnostic/ownership logic. It sends
each nonempty already-chosen draft through the shared core at its former context
derivation position, rather than eagerly deriving all later groups before earlier
cost checks. Empty-draft diagnostics/attribution remain at their old producer site.

The core reuses the original context union/rank/truncation/uncovered expressions.
Per-draft origins and omissions/UTF8 ID bytes are returned as data rather than
writing group-ID-keyed metrics in that block. The content-fingerprint expression
is parameterized, with the same object keys and source-community omission order.
The byte metric still counts JSON-serialized context IDs ONLY, not an envelope.

Prepared/bound values are synchronous internal working data with mutable maps and
a ranking closure. They are NOT a serialized witness, authenticity receipt,
cached validator result or admissible externally supplied loader input. A future
checker must start from qualified raw inputs/numeric import and call preparation;
it must not deserialize or trust a prepared/bound object or expected metrics.

## NEW fixed-group adapter — separately identified, not byte-exact extraction

The parent-ratified adapter accepts nonempty groups with unique nonempty supplied
group IDs and nonempty known unique owners. Owners must be partition kernels,
each kernel has exactly one owner, and all kernels must be covered. Supplied group
IDs/owned lists remain supplied; no renaming, balancing, splitting, attachment,
SCC, clustering, PPR or Leiden is replayed.

Origins are derived from partition membership of owned kernels, not source metrics.
For a nonempty-kernel community, non-kernel members are assigned to the supplied
group owning its first compareFunctionId-sorted kernel. Qualified producer source
102-106 assigns uncovered members to the first chunk; source 113 prevents a draft
with uncovered work from attaching. Kernel-empty communities produce community-
only uncovered attribution, never a fabricated empty group. The shared draft core
also adds owned unobserved/incomplete functions exactly as source 153 does.

The adapter then derives expected context/omissions/ownership/uncovered maps and
nonCoveredIds. It never accepts these expected values from GroupMetrics. It does
not certify that the supplied ownership is the producer's heuristic choice or an
optimal/legal result under every producer grouping policy beyond its stated
fixed-layout admissibility checks. New adapter guards are not legacy loader edits.

## Two distinct source roles

deriveCommunityContextIds projects boundary neighbors for FIXED partition member
sets using the original graph-index ordering. It validates the numeric graph ONCE
per batch, not once per community. clusterGraph calls this leaf on its already-
chosen communities; this is not reclustering and does not change their identities.

PARTITION external context and GROUP adjacency can have DIFFERENT sources.
The group core consumes the supplied partition's context while deriving group
context from the group's actual raw/affinity adjacency. Its membership checks do
NOT prove that partition.externalContextIds came from that adjacency. In
particular, raw group adjacency cannot certify affinity-derived partition context.
A later checker needs the correctly qualified partition-source role to compare
deriveCommunityContextIds against supplied partition context independently.

## Pending parent-owned witness contract and evidence limits

The later S1 contract must explicitly carry/reference full snapshot identity,
fixed partition/ownership, effective configuration, actual source hubs, explicit
adjacency mode, complete SparseGraphSnapshot for affinity and separately qualified
partition-context source when different. Numeric policy/source/budget/binding must
not be discarded. Affinity-to-producer/configuration provenance also needs a
qualified reference. Missing source/config/hub/provenance/role information cannot
be hidden by a boolean or a raw-mode fallback. No payload field names/schema are
ratified by this candidate.

Bindings establish local consistency, NOT authenticity, native origin, correctness
of heuristic projection choices or scientific/global optimality. No S1, full44,
native, HOST or portability qualification is claimed. Content-fingerprint callers
must derive full capabilities and other group fields from their qualified sources;
passing claimed sidecar values does not establish their truth.

## Required gates — NOT executed here

Fresh independent delta V, then parent typecheck, producer equivalence, numeric
and context checks, regressions and load isolation are mandatory BEFORE qualified
S1 repin. Cover constructor/backward exports; exact/budget/legacy/stale-cache
numeric cases; all-shard prefilter conflicts in both source modes; summand-aware
remapping; hub/context boundary ties and zero caps; omissions and byte counts;
fixed ownership rejection cases, multiple layouts, attachments, kernel-empty
communities, incomplete owners and distinct context-source roles.

Only static reads, hashing, source slicing/comparison and owned output writing
were performed. No compiler, transpiler, typecheck, test, product import,
validator, OS/DB/git/IDA/live/network/origin operation or delegation was run.
MANIFEST does not contain its own digest; the final handoff supplies all six raw
output hashes, including MANIFEST's, without creating self-hash authority.
