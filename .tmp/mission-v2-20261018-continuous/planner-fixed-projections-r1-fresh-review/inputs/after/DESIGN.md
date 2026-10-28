# Fixed planner projections — source proposal R1

Status: **SOURCE_PROPOSED**, not PASS, qualified, integrated, or S1-authorized.
Only the two sibling `src/` files and this DESIGN/MANIFEST pair are owned outputs.
They are overlays on the qualified R1 reference, not on an older main producer.
The input manifest is pinned at 22 files / 742457 bytes, SHA-256
`925ef3c300eb2bdc62a502be70275fff98216bae3ef555bb31cb89eefdffa855`.
No product code, compiler, transpiler, typecheck, tests, validator, runtime load,
git, database, IDA, live process, or network was used for this proposal.

## Ratified API and boundary

Five functions are appended after the existing codec helpers. The existing
helpers retain their source positions; only the existing type-only import line
is extended. No new supporting exported types are introduced.

- `pipelineCost(estimate: Pick<PipelineEstimate, "A" | "B" | "R" | "validation">): number`
  preserves its public signature and 287-byte function body exactly. The planner
  now re-exports that function from the codec at its former declaration site.
- `derivePlannerUnitEstimate(ownedFunctionIds: readonly string[], policy:
  Readonly<Pick<PlannerPolicy, "estimationVersion" | "estimatesByFunction" |
  "sccMaxIterations">>, recursive: boolean): { estimate:
  PlannerSidecar["estimatesByUnit"][string]; known: boolean; cost: number }`
  receives fixed membership and recursion, and returns values, not sidecar writes.
- `derivePlannerUnitResources(ownedFunctionIds: readonly string[], policy:
  Readonly<Pick<PlannerPolicy, "resourcesByFunction">>): ResourceRequirement | undefined`
  returns the existing optional resource projection.
- `derivePlannerUnitSubIntents(unitId: string, localFunctions: readonly string[],
  recursive: boolean, callsByUnit: ReadonlyMap<string, readonly PlannerEdge[]>,
  nodes: Nodes, artifacts: ReadonlyMap<string,
  PlannerGraphInput["binaryArtifacts"][number]>): SubIntent[]`
  receives the already chosen local order and call projection. `Nodes` remains
  the existing `ReadonlyMap<string, PlannerNode>` alias.
- `derivePlannerG3(units: readonly { readonly unitId: string; readonly
  contextFunctionIds: readonly string[] }[]): MissionPlan["g3Affinities"]`
  receives all already constructed units, including deferred/unselected units.

Readonly is a type-level input boundary, not a new clone, freeze, validation,
deep-readonly guarantee for policy entries, or certification of arbitrary input.
The bodies never write through these inputs. Mutable intermediates and outputs
are newly allocated; only the original intended output aliases are retained.

The codec's direct value edges are unchanged: `graph-pure-codecs`, `validation`,
`planner-relation-codecs`, and `function-order`. All planner references are in
one `import type`, now also naming `PipelineEstimate`, `ResourceRequirement`,
and `MissionPlan`. No planner, SCC, clustering/grouping, store, client, or runtime
producer is imported as a value. The recorded transitive closure in the pinned
R1 manifest is the expected closure, not a freshly loaded/qualified closure.
Its absent packet members must be checked by the parent's future closure/load gate.
The planner retains 53 public symbols in 52 export statements; the four new
projections are not re-exported from the planner. The codec has five additional
value exports (15 to 20), and otherwise retains its original exported surface.

## Literal extraction, not a new algorithm

The only source is `inputs/reference/src/planner.ts`, SHA-256
`4e812e5c2d18170abe158a0e1ef87b05987596c9f5a340d416949be27ad9f608`.
Original line numbers below refer to that exact R1 source:

1. Estimate lines 320–333: deindent two spaces; change the last sidecar assignment
   to a return wrapper containing its identical object expression plus the two
   diagnostic scalars `known` and `cost`. No parameter-expression substitutions.
2. Resource lines 334–341: deindent two spaces; change only
   `resourcesByUnit[unitId] =` to `return`. An incomplete resource set still falls
   through to undefined. No added validation or fallback.
3. Sub-intent lines 343–354: deindent two spaces; change only
   `const subIntents: SubIntent[] =` to `return`. Prefixes, waits, identity creation,
   role order, and the flatMap expression are otherwise literal.
4. G3 lines 429–432: change only `const g3Affinities =` to `return`.
5. Cost lines 194–198: move the function with its identical signature and body.

MANIFEST embeds exact origin/helper spans, byte hashes, limited inverse
statement-node recipes, and raw/token recovery evidence. The four parameterized
helpers are **not** claimed whole-function byte identical. The inverse recipes
restore their bodies to exact original block bytes, a source-level witness for
the stated AST edits; no compiler AST API, syntax/type qualification, or semantic
validator was executed. Fresh independent V must review the wrappers and recipes.

The planner changes only its codec import, cost re-export, and the four callsites.
Full disjoint unchanged ranges cover every other byte, including the original
line 342 SCC diagnostic. Existing codec lines 1–213 differ only at its type import.
`function-order.ts`, `scc.ts`, upstream dependencies, tests, and capture/comparator
files are inputs only. Nothing outside the four output paths was written.

## Producer sequencing, identity, and failure law

The producer still calculates SCC/local topological order itself, then writes
`localOrders`. Its exact next sequence is: estimate helper; assign returned
estimate to `estimatesByUnit[unitId]`; resource helper; optional resource write;
the original SCC-budget diagnostic; sub-intent helper; original dependency and
conflict helpers; original unit/envelope/admission construction. G3 remains after
selection and defer decisions and before plan construction, over **all** units.
No sidecar or diagnostic collector is passed to the new helpers.

Missing or obsolete estimates set `known=false` and continue before reading
`byModel`. Costs add in existing membership/model enumeration order. Model costs
survive only complete all-function coverage. Recursive multiplication, its order,
and the existing total-cost integer assertion are unchanged; no model-overflow
assertion or opportunistic budget arithmetic fix is introduced.

Resource presence (`rs.every`) precedes all resource validation. Intersections
preserve duplicates from the first requirement and sort the filtered local
array. Tools retain their original Set-union/sort behavior. Slots/CPU/GPU retain
max aggregation and budget retains summation; the existing unused max-budget key
is not cleaned up. No input sort, intersection deduplication, defensive clone,
empty-input repair, new assertion, or alternative malformed-input behavior is added.

Sub-intents retain localFunctions order and A/B/R order. Recursive waits chain
the preceding local function's R; nonrecursive waits use the supplied calls.
A and B retain sorted local prerequisite waits; R waits only on same-function
A+B. Each function's three roles share the **same identity object** created once
by the existing harness-identity helper. The returned estimate is assigned without
cloning; `unit.estimatedCost` still aliases `sidecar.estimatesByUnit[unitId].cost`.
G3 sorts only fresh context-owner lists, preserving repeated context occurrences
and repeated unit IDs; it does not deduplicate or mutate supplied unit contexts.

Ownership, family choice, SCC/toposort passes, selection/readiness, budget and
knowledge policy, planning/unit identities, fingerprints, and canonical envelopes
remain producer-owned and unchanged outside the declared spans. These fixed-input
projections do not prove those choices, nor independently authorize S1 consumption.

## RAW law and remaining parent gates

The retained R1 profile describes the old qualified 593912061-byte trace
`867ce490caea18f596f0a7aef100793dfe69b31945e6c1e2a7668d036be870e9`:
1402 rows, 701 calls, 107 Error roots, all 107 constructor origins in unchanged
`graph-pure-codecs.ts` at runtime 353:108 / original 454:16. The profile scanner
used bounded 1 MiB windows, maximum Error node 648 bytes, and full-stream hashing.
Only the packet's frozen report was read here; the trace was not opened or rerun.

That historical origin result is neither candidate qualification nor universal
proof. Moved code and shifted producer lines can change observable TypeError or
other Error origins on future paths. The future comparison must retain the FULL
unchanged R5 RAW contract, including sourceURL, line, column, every original*
field, other own properties, graph identity/aliases, ordering, and the unchanged
capture/comparator semantics. No new normalization, origin exception, waiver,
skip, fake origin, assertion edit, or test/harness edit is authorized. Any future
RAW difference is RED and requires investigation, including a new Error path.

Required after candidate freeze: fresh independent V; parent strict full-inclusion
TSC; exact planner public API/type and codec export review; static transitive
closure plus native isolated load controls; a **new** review-bound stem comparing
the qualified R1 baseline to these overlays with unchanged full R5 capture and
comparator; the 415-test/17077-assertion matrix and fixed-input hand oracles.
Hand oracles must include unknown/obsolete estimates and byModel coverage,
recursive multiplication and literal failure order, partial/duplicate resources,
shared A/B/R harness identity and cost aliasing, recursive/nonrecursive waits,
and G3 multiplicity/unselected-unit inclusion. These are future checks, not claims
that they ran here. Do not rerun old stems or replace historical Green/Red evidence.
Missing baseline, SDK, loader-cache, or closure prerequisites means STOP to parent,
not new shims/frameworks. Main integration, S1 repin/code GO, numeric qualification,
native FF8, and full44 remain outside this proposal.
