# Planner pure extraction R1 — source-only candidate

Status: implementation candidate, NOT qualified. Fresh independent V and parent
typecheck, producer-output equivalence, regressions and purity gates are required
before integration or qualified S1 repinning. No product import, compiler,
transpiler, test, validator, database or live action was performed here.

## Authority and six-file ownership

This candidate follows the ratified source-R1 SCOPE, not the broader initial
plan. Its input manifest SHA256 is
`a0e8dc3055122991324aa1e59d1c81caf04976432eac65ebefc1283e50f6eeb9`.
The 20 pinned files total 314390 bytes; their opening and closing checks and
source SHA256s are recorded in MANIFEST.json. Baseline planner is `fd90abe4...`.

Only these isolated outputs belong to this candidate:

- src/planner-derived-codecs.ts
- src/function-order.ts
- src/planner.ts
- src/scc.ts
- DESIGN.md
- MANIFEST.json

MAIN, graph-pure core, schemas, S1/source envelope/projection/QA, cluster and
investigation-group producers/codecs were not edited. This is not S1, full44,
native, kernel, host-coupling or authority qualification.

## Shared API and caller preconditions

The new derived codec exports the approved Nodes, Owners, UnitRef, Unresolved,
Outgoing, DependencyPolicy, ReconciledRelations, PartitionContext,
UnitDependencyInput and UnitDependencies types, ten derived helpers and five
existing identity/artifact helpers. Signatures are the source of truth in that
file; MANIFEST.json lists every exported symbol and its source origin.

The consumer supplies independently bound source nodes, source groups, source
policy and reconciled relations from canonicalRelationView(sourceGraph,
sourcePolicy), never the candidate's asserted relation view or derived maps.
Its owner map describes ALL supplied units, including deferred units, not only
selected units. Before indexPlannerOwnership, the consumer must reject empty,
duplicate or unknown ownership and verify each supplied unit ID using existing
unitIdentity without sorting, repairing or replacing the supplied partition.
Every eligible source-group root must be covered. The index intentionally keeps
the producer's existing assignment semantics; it is not a partition validator.

derivePlannerPartitionContext unions group context for each fixed unit, removes
that unit's owned IDs, numerically orders context, and indexes unresolved refs.
derivePlannerUnitDependencies returns the complete prerequisite array, three
sidecar dictionaries and dependency diagnostics. Missing mandatory eligible
callees are diagnosed against fixed ownership; there is no closure queue here.
derivePlannerUnitConflicts returns ownership, blocking and extra conflicts.
derivePlannerG1 retains each interunit planner-call relation and reverses only
unit scheduling direction: callee producer to caller consumer. A dispensation
does not erase G1; relation multiplicity, kind mapping and input order survive.

Future source binding must compare full expected arrays and dictionaries,
including absent and unexpected entries; per-entry plausibility is insufficient.
Dependency/group diagnostic projections must retain their exact contents and
order. SCC/budget diagnostics remain producer-owned and are not recomputed here.
Sub-intent helpers project prefix and harness identity only, never A/B/R ordering
or waits. Existing graph-pure identity helpers and validation helpers are reused.

## Exact bodies versus parameterization

Six existing bodies have raw UTF-8 byte identity: unitContentFingerprint,
validRequirement, validDispensation, receiptSatisfies, invalidatesReceipt and
compareFunctionIds. Bodies include their outer braces and original LF bytes;
export/signature changes are outside the body. validDispensation's policy type
alone narrows to version/publicationLevel. Body hashes are in MANIFEST.json.

All other new functions are explicit block/expression transpositions, NOT
claimed byte-identical whole functions. Their changed identifiers, containers,
indentation and return plumbing are recorded separately. Static text comparison
checks the declared prerequisite/conflict/G1 substitutions; it does not prove
runtime producer equivalence or successful compilation.

Producer calls remain at the corresponding logical stages. Root collection and
its diagnostics are returned locally then appended in source order. Per-unit
sidecar dictionaries are merged before envelope construction; dependency
diagnostics are appended before conflicts and later admission diagnostics.
Appending diagnostics uses a loop, not an unbounded spread argument list.

Context/unresolved indexing now shares one function. Owned-context removal and
numeric sorting occur within that function before per-unit construction, rather
than during each unit's construction. This is an explicit transposition of
independent indexes over validated source identities, not a byte-move claim.
The SCC local-call loop and all scientific ordering remain in planner.ts.

The full readiness/ranking/admission suffix remains byte-identical. In
particular receiptIndexKey, invalidationIndexKey, indexInvalidations,
evaluateReadinessChecked and public unitsConflict stay local and unchanged.
receiptSatisfies retains its planner.ts public export through a re-export.
Other existing public exports remain unchanged. scc.ts only imports/re-exports
the comparator and removes its old declaration; its algorithms are unchanged.

## Static import closure and remaining gates

planner-derived-codecs has only type imports from planner.ts. Its value imports
are graph-pure-codecs, validation, planner-relation-codecs and function-order.
function-order contains only the moved comparator, its comment and compareText
import. The supplied 12-file qualified pure closure is fully pinned: six source
modules and six schemas. Static resolution of the new entry reaches 14 local
files including the two new modules, plus node:path and node:util. It does not
reach planner, scc, cluster, investigation-groups, graph pipeline, store or
eventlog by value. This is static source-graph evidence, not runtime-load proof.

Required parent checks remain UNRUN: fresh V, strict typecheck, baseline/candidate
producer equality including fingerprints, diagnostic/error behavior and fixture
regressions; external receipt/invalidation cases, dispensations, unresolved refs,
ownership/context and conflict cases; numeric ordering/backward export checks;
and runtime load-isolation/purity gates. No independent worker may infer GO or
qualification merely from these source artifacts or their hashes.
