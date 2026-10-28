# L8 transport — independent QA source candidate

Status: **SOURCE_ONLY / NOT_EXECUTED / UNREVIEWED / UNINTEGRATED**.
No compiler, product import, validator, test or run was invoked. No PASS is claimed.

## Boundary and provenance

- Owner: `l8-transport-qa-r1`, task `task_mvdsaveb_005v_yn1rfa`.
- Sole project input: sibling `inputs/`, manifest SHA-256
  `4cf54cc4040a9434fdf91f07b85f34b4dd83ef039df500ef86a714a7aa83f4d9`.
  Initial byte/hash verification: 18/18 pins, 671942 bytes, zero discrepancies.
- NONBLIND to the ratified parent API, schema candidates, schema DESIGN and frozen
  source/type references in this package. **No transport implementation, author
  output, origin path, neighbouring delivery or historical session was read.**
- Parent native plan approval and GO CODE received before writing. Outputs are
  exactly `graph-transport.test.ts`, `DESIGN.md`, `MANIFEST.json` in this directory.
  Deployment to `tools/ff8-harness/test/graph-transport.test.ts` belongs to parent.
- Subsequent parent-ratified QA expectations were incorporated without reading
  any implementation: adoption attempt/claim counters include inventory lists
  only (never proof lists); finite integral-but-nonsafe `1e20` remains allowed
  in schema `number` metric slots, not `integer` slots. Finite, negative-zero
  and explicit numeric bounds retain their existing guards.
- No central, schema, git, DB, registry, IDB, native, live, OS-process, network or
  delegation operation. Local filesystem reads, text writes, data hashing and
  JSON parsing only; source files were read as text, never executed or parsed as
  executable code by this worker.

The API oracle is `inputs/SCOPE.md:14-33`, not an inferred implementation.
Transport allowance/negative-data oracles are `inputs/SCOPE.md:35-58`.
This candidate neither changes nor supplies that API's implementation.

## Test construction

`graph-transport.test.ts` has seven oracle families and 28 textual `test(...)`
declarations. This is a source count, **not** a result count or execution receipt.
Its only imports are `bun:test` and the four ratified functions from
`../src/graph-transport` (`graph-transport.test.ts:1-7`). No fixture-driver,
SQLite, filesystem, lineage, semantic-index or graph-pipeline helper is imported.

Fixtures are deliberately tiny and hand-built JSON (`graph-transport.test.ts:10-213`):
two function nodes, one community, one investigation group, and small optional
inventory/evidence structures. Hash helpers canonicalize and hash fixture data;
they implement no decoding, schema checking, clustering, adoption or receipt
verification. All hashed fixtures have JSON-compatible finite scalars and no
undefined members. Function IDs use the pinned `sha256:0xUPPERCASE_RVA` syntax.
The chosen 0x1/0x2/0x3 members are already numerically sorted; there is no general
sort/ancestry/evaluator implementation hidden in the fixture builders.

The synthetic B evidence is assembled to satisfy the frozen inspector's content
relationships, not minted by an evaluator. Its expected admissibility is a content
predicate, never an authenticated local capability or HOST witness. Derivations:

- Canonical JSON/hash: `inputs/src/validation.ts:4-9,33`.
- A content/root identities and version: `inputs/src/cluster.ts:44,807-817`.
- B config fingerprint: `inputs/src/semantic-index.ts:297-321`.
- B content ID: `inputs/src/lineage.ts:149-155`.
- Fresh B lineage and prefixed hash IDs: `inputs/src/lineage.ts:737-748,818-823`.
- Proposal digest, sidecar projection and evidence content checks:
  `inputs/src/lineage.ts:899-911,964-1003,1006-1102`.

Snapshot fingerprints are synthetic documentary values. The suite does not
claim to have rebuilt or authenticated any actual graph snapshot.

## Seven independent oracle families

### 1. Closed JSON form and explicit versions

Source: `graph-transport.test.ts:240-312`.

Positive A/B/adoption fixtures must decode unchanged. Negative cases cover
missing/wrong versions, raw v1 partition mistaken for v3, serialized JSON mistaken
for an object, primitives, unknown fields at multiple depths, scalar type/length
and revision boundaries, `explicit:false`, and current root/result `adopted:true`.
Failures require a nonempty string-error collection, not a particular message,
path spelling or ordering. Unknown fields must not be silently stripped.

Grounding: `inputs/SCOPE.md:16-20,37`; closed object/required/enum constraints in
both pinned candidate schemas. Form rejection alone proves no scientific result.

### 2. Snapshot independence, deep freeze and getter safety

Source: `graph-transport.test.ts:314-353`.

Every successful decoded object/array is a distinct frozen snapshot at every
depth. Inputs remain mutable and byte-for-data unchanged; changing nested input
members, diagnostics or actor references after decode cannot change outputs.
Ordinary enumerable getters at a required root field and a nested actor field
must be refused without invocation by either decode or inspect. Non-JSON scalar
values and a cyclic object must not gain acceptance via lossy serialization.

Grounding: `inputs/SCOPE.md:19-20,37-38`. This does **not** promise that reflection
on an arbitrary hostile Proxy can be performed without executing its traps.

### 3. A's permitted domain and raw counters

Source: `graph-transport.test.ts:355-412`.

Coherent A without evidence has documented `not-present`/null evidence flags and
null snapshot counters. All five transport granularities, empty groups and empty
kernels remain legal. Cross-community group ownership, uncovered/owned overlap
and incomplete coverage are not rejected merely by inventing tighter ownership
rules. A well-formed deliberately inconsistent fixture checks array-length raw
statistics without deduplication, independently of coherence.

Grounding: `inputs/SCOPE.md:28-33,40-45`; investigation-group transport schema is
wider than some central TypeScript projections. No total coverage is inferred.

### 4. Relational inconsistency is not invalid JSON form

Source: `graph-transport.test.ts:414-443`.

Valid-length but inconsistent lineage/content identities, impossible kernel or
external-context membership, wrong computed content ID, uppercase fingerprint,
dangling group joins and inconsistent unknown metric must decode as form-valid,
then be reported incoherent. Schema errors remain empty and stats remain present.
Conversely, a wrong outer version produces schema errors, null stats and null
branch, not an authority-bearing partial result.

Grounding: `inputs/candidate/DESIGN.md:104-124` and
`inputs/src/lineage.ts:895-911`. Length-only schema requirements are not confused
with code-level lowercase-hex or identity relations.

### 5. B evidence: transport, consistency, admissibility and history

Source: `graph-transport.test.ts:445-550`.

- B without evidence decodes, but inspection is incoherent (`not-present`).
- A tiny content-consistent synthetic B is expected to report `inspected-B`,
  well-formed/admissible evidence and raw node/edge counts, yet stays untrusted.
- A may retain optional evidence, including a negative B payload, without a new
  presence prohibition or a B interpretation (`not-applicable-A`, null flags).
- All ten relaxed source-string paths are simultaneously populated with short,
  empty or invalid raw strings. Diagnostics retain duplicate/non-ID strings,
  newline, NUL and Unicode verbatim. Rehashed unsatisfiable evidence is expected
  content-well-formed but inadmissible, rather than a transport rejection.
- Lossless sidecar `{known:true,value:1,numerator:1e20,denominator:1e20}` decodes
  in current result and historical authoritative result. The same nonsafe value
  in an integer metric, nonfinite values, negative zero, negative numerators and
  out-of-range lossless values are still rejected. This pins the parent's narrow
  schema-number correction without introducing a cap or changing either schema.
- Both historical `previous.partition.adopted` and
  `previous.authoritative.partition.adopted` may remain true. That fixture is
  intentionally unverified and is **not** asserted coherent or admissible.
- Root/result partition mismatch and corrupt evidence digest decode but fail
  coherence; corrupt digest evidence is reported false/false.

Grounding: `inputs/SCOPE.md:38-51`; raw ten fields and historical distinction in
`inputs/candidate/DESIGN.md:238-285`; negative constraint/evidence checks in
`inputs/src/lineage.ts:1051-1063,1098-1101`. Current root and result partitions
remain constrained false; history is neither normalized nor overwritten.

No assertion equates negative evidence's overall coherence with admissibility:
the test directly checks its independent evidence flags and transport form.

### 6. Adoption documents do not authenticate HOST, inventory or Q

Source: `graph-transport.test.ts:552-617`.

A nonempty forged `hostReceiptRef` is valid transport, not trusted authority.
A raw localReceipt-shaped actor fails the closed actor form. Missing inventory
attempt/claim ID lists remain absent and count as UNKNOWN, whereas explicit empty
lists have zero unknown counters, even when empty proof lists are also supplied.
Duplicate inventory IDs exercise raw counts; deliberately nonzero proof lists
must not be added to the inventory attempt/claim counters.
Historical inventory/proof snapshot IDs, nested attempts/claims and negative
worker/lease/release/Q flags survive as data. Neither state names nor positive
boolean fields authenticate a frozen inventory or release proof.

Grounding: `inputs/SCOPE.md:53-58`,
`inputs/candidate/DESIGN.md:86-101`, and
`inputs/src/lineage.ts:691-711`. The tests deliberately make no unsupported
overall-coherence assertion for UNKNOWN or negative-Q cases; authentic Q requires
the separate owner/host verification seam, absent from this source-only task.

### 7. Optional prepared binding is documentary, never an activation seam

Source: `graph-transport.test.ts:619-655`.

An omitted prepared object yields `not-requested`. Equal identities and computed
proposal/observed digests yield `matched`; an invalid prepared envelope yields
`invalid-prepared`; separate mutations to seven identity/digest fields yield
`mismatched`, not form rejection. Malformed adoption still has null stats even
with a valid prepared object. Inputs, inventory and partition `adopted:false` are
unchanged throughout.

Grounding: `inputs/SCOPE.md:21-27,53-58` and the digest relationships documented at
`inputs/candidate/DESIGN.md:90-101,115-124`. Every inspected path checked by the
suite retains `authority:"untrusted"` and `adoptionReady:false`, including
synthetic positive content predicates and apparent documentary matches.

## Limits and parent gates

1. **No execution evidence.** Type compatibility, actual assertions, runtime
   behavior, performance and absence of import-time side effects are unproven.
   Counts above are source text counts only. Parent owns compile/focused tests
   and their evidence, after independent review.
2. **No implementation inspection.** This is independent API-based QA, not a
   line-by-line review of the transport author's source or integration diff.
3. **Not exhaustive schema fuzzing.** This small matrix does not enumerate every
   optional field, every maximum-length/100000-item boundary, Unicode-length
   edge case, malformed prototype, sparse array, accessor location or cycle.
4. **No arbitrary Proxy safety claim.** Ordinary accessor refusal is tested;
   no impossible trap-free interaction guarantee is inferred.
5. **Content admissibility is not authentication.** A synthetic true evidence
   predicate or matched binding does not establish HOST identity, evaluator
   execution, Q, complete inventory, native coupling, durable adoption or storage.
6. **No topology or performance reimplementation.** The fixture helpers only
   assemble a tiny known no-previous case and fixture hashes. They do not supply
   a competing decoder, general lineage algorithm, clustering engine, native
   witness, or measured gain. Group coverage is deliberately partial.
7. **Parent integration remains gated.** No central deployment, schema activation,
   DB migration, partition flip, C3-C5/G7/acceptance-L8 promotion or historical
   closure follows from this delivery. Fresh review and parent-run evidence are
   separate technical gates.

## Integrity receipt convention

`MANIFEST.json` pins the two payload files and the 18 original input pins.
Its own byte count and SHA-256 are recorded in the final team receipt after the
manifest is written; no impossible self-referential hash is claimed inside it.
All three output files are independently read/hashed in the final receipt.
Final input rehash must retain 18/18, 671942 bytes and the exact input manifest
hash stated above. Hash success is an integrity observation, **not** a test PASS.
# Correctif parent R5 du nouveau lot — source seulement

Le test16 original associait partitionA et result.partitionB mais attendait
coherent=true. VQA fresh CORRIGE a identifié cette surassertion. Le nouveau lot
garde l'oracle:formevalide/coherent=false pour ce mismatch;un sous-cas cloné
met result.partition égalàlaracineA,recalcule evidenceFingerprint par lehelper
existant puisattendcoherent=true/A/not-applicable-A/nullflags. Lesdeux restent
untrusted/adoptionReadyfalse;aucuneautoritéB déduite de donnéesinternes.
28déclarations/7familles conservées,helpers/imports/27autrestests inchangés.
Rien n'aétéexécuté,nil'implémentation ni lesschémas modifiés. Ancienlot/hashs
restent immuables;PARENT_DECISION etnouveauMANIFEST font autorité surcecorrectif,
Vdeltafresh puisgateparentcompiler/tests restent requis.
