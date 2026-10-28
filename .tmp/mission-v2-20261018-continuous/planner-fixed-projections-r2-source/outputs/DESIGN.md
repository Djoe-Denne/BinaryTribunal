# Fixed planner projections — R2 one-type correction

Status: **SOURCE_PROPOSED**, not PASS or qualified. This is a new four-output
overlay; the frozen R1 source, proof documents, and CORRIGE decision are retained
as packet inputs and were not modified. No main/S1 integration is authorized.

## Exact delta and corrected API

`inputs/SCOPE.md` and `inputs/PARENT_R1_CORRIGE.json` authorize exactly one source
type substitution, on `src/planner-derived-codecs.ts:254`:

`callsByUnit: ReadonlyMap<string, readonly PlannerEdge[]>`

becomes:

`callsByUnit: ReadonlyMap<string, readonly Pick<PlannerEdge, "sourceId" | "destinationId">[]>`

The corrected complete helper signature is:

```typescript
export function derivePlannerUnitSubIntents(unitId: string, localFunctions: readonly string[], recursive: boolean,
  callsByUnit: ReadonlyMap<string, readonly Pick<PlannerEdge, "sourceId" | "destinationId">[]>, nodes: Nodes,
  artifacts: ReadonlyMap<string, PlannerGraphInput["binaryArtifacts"][number]>,
): SubIntent[]
```

Only call endpoints are required by this fixed-input projection. The R1 demand
for full PlannerEdge metadata was **not ratified**. It is corrected here, not
accepted retroactively; no synthetic/fake edge metadata or new consumer burden
is authorized. The remaining parameters, all other types, imports, exports,
variables, expressions, function bodies, ordering, and aliases are unchanged.

`src/planner.ts` is the entire frozen R1 producer without any byte change:
48999 bytes, SHA-256
`68c486ed6c5461ba6008d2b942555eb2c18f54b2cdbb51da65221ecfe27848a3`.
The leaf is 19899 bytes, exactly 36 bytes larger than frozen R1. Reversing the
single exact type substitution restores the **entire** 19863-byte R1 leaf,
SHA-256 `fc86596e7c43c41750e9cff81db94caf6b1ebc4fc19e5af557cc19f92d05f2f9`.
No other source change is proposed. Whole-file equality and the bounded prefix,
replacement, and suffix hashes are recorded in MANIFEST.

## Provenance and unchanged source contract

The new input manifest pins 28 files / 855125 payload bytes. Its own 9228 bytes
have SHA-256 `05070322e69c4f790a5242ab0e2b65bce96922249e217069a5bccb9ae03da65a`.
All pins matched before output creation and were re-read after source edits;
the final native response supplies the last bookend and all four output hashes.
Only this packet and these four outputs were read/edited. No origin files were
read. This packet is distinct from the parent's earlier V inventory.

The original extraction evidence is retained in the pinned
`inputs/prior-R1/MANIFEST.json` (31188 bytes, SHA-256
`f7ee2aef91c892b254ff9f4db368dc2135182743949fa721499d147f07a87123`)
and `inputs/prior-R1/DESIGN.md`. Those remain source-proposal evidence, not
runtime qualification. This R2 document supersedes their full-edge API claim.
The R2 manifest carries updated leaf offsets and body/inverse provenance; the
old R1 packet/output hashes are historical pins, never relabeled as R2 hashes.

All five moved helper bodies are byte-identical to R1, including pipelineCost's
287-byte body. The four original block inversions still recover the qualified
reference blocks, with the same raw/token hashes. Only byte offsets after the
changed type shift by +36; all line positions remain unchanged. No compiler AST
API was executed; the source-inverse witnesses are not syntax/type qualification.

The entire unchanged producer retains 53 public symbols in 52 export statements,
the pipelineCost re-export, and no re-export of the four new projections. The
leaf retains its existing 20 value exports and 10 type exports. Direct pure value
imports and all type-only planner imports are unchanged. No SCC/planner/runtime
value edge is added; complete transitive closure/load remains a future gate.

Producer sequencing remains local order, estimate, estimate sidecar assignment,
resources, optional resource write, original SCC diagnostic, sub-intents,
dependencies/conflicts, and canonical unit/envelope/admission construction.
G3 still runs after selection over all units, including deferred units. The cost
sidecar alias and the shared per-function A/B/R harness identity object remain
unchanged. No hidden mutation, validation, overflow fix, input sorting, duplicate
elimination, failure-order change, family/SCC/readiness/selection change, or new
assertion is introduced.

## RAW law and remaining gates

The retained 107/107 Error-root profile still describes only the old qualified
593912061-byte trace, hash
`867ce490caea18f596f0a7aef100793dfe69b31945e6c1e2a7668d036be870e9`.
Its constructor origins are in unchanged graph-pure-codecs.ts at 353:108 /
original 454:16. Neither the old profile nor the one-type inverse proves future
candidate equality or universal behavior. The trace was not opened or rerun here.

FULL R5 RAW law remains intact, including sourceURL, line, column, every original*
field, retained properties, ordering, and graph aliases. No normalization,
waiver, skip, fake origin, harness edit, or test/assertion change is authorized.
Every future RAW difference remains RED, including a new observable error origin.

Next: fresh delta V, then serialized parent gates under separate authority:
strict full TSC; resolved planner API53/types and codec exports; complete static
closure/native isolated load; a NEW stem comparing the qualified R1 baseline
to this completion candidate with unchanged full R5 capture/comparator; the
415-test/17077-assertion matrix and fixed-input hand oracles. Missing baseline,
SDK, loader-cache, or closure prerequisites means STOP to parent, not a new shim.
No compiler, transpiler, typecheck, test, validator, product/candidate import,
Bun, OS command, DB, git, IDA, live, network, delegation, or team/task action was
performed. Main/S1, numeric qualification, native FF8, and full44 remain HOLD.
