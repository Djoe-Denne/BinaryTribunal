# Independent S1 QA — API-only candidate, runtime UNOBSERVED

## Status and admission

**Proposed QA source only. Not qualification, source acceptance or an integration.**
The parent's explicit QA-code GO authorized exactly these three owned outputs.
The source's single `OWN_ENVELOPE_CODEC` constant still holds the supplied R2
metadata pending the announced **R3 metadata-only supplement**. Do not treat this
candidate as R3-frozen until that constant and this manifest are repinned.

No compiler, typecheck, transpile, test, validator or product module was executed
or imported during authorship. Positive fixtures and negative guards below are
**assertions to be evaluated at the parent's later gates**, not observed successes.
No 415-baseline count or verdict is inherited.

## Inputs, independence and trust boundary

- Initial packet: `../inputs/INPUT_MANIFEST.json`, raw SHA-256
  `8302bfa4052be52bce2c6457a69f54d2611976e57ffdeb6567e35cbdc03d7c4e`.
  All 68 file lengths/hashes were checked: 1,393,589 bytes, no mismatches.
- Candidate exposure: three parent-generated declaration files, 18 public
  functions/types/literal tags, and five-file size/hash metadata only.
- **NONBLIND dependencies:** qualified reference source/types/schemas, ratified R3
  contracts and the supplied parent dispositions. Qualified algorithms are fixture
  producers, not private candidate validators or golden outputs.
- No candidate implementation/schema body/DESIGN, prior or foreign QA, worker log
  or origin file was read. Manifest origin paths were never followed.
- GO supplement and the public knowledge/policy addendum are pinned in MANIFEST.
  The addendum resolves the earlier public-contract gap, not a product defect.

ContractPins follow `API_COMMON.md`: envelope codec from candidate metadata;
snapshot schema/module from qualified `graph-snapshot-v1.schema.json`/`graph.ts`;
proposal codec from `graph-transport.ts`; planner from `planner.ts`; **both** input
and admission codecs from `graph-pure-codecs.ts`, never `inputs.ts`; the two
qualified transport schemas are separate raw pins. Fixture tests compare actual
sources and peers. Matching an envelope's own codec pin cannot authenticate the
loader interpreting it. Trusted module acquisition/loader pinning remains parent/
backend responsibility; no JSON data confers HOST, LOCAL, native delegation or
activation.

## Actual target and imports

Install destination, if accepted by the parent:
`test/graph-phase2/execution-envelope.test.ts`.

Public SUT imports are exactly `../../src/graph-execution-envelope`,
`../../src/graph-b-projection`, `../../src/graph-execution-prepare`.
All 18 public functions are referenced. Protocol tags are independently
transcribed from the public declarations and compared against the exported bundle.

Qualified runtime fixture dependencies are `graph-normalize`, `graph`, `cluster`,
`investigation-groups`, `planner`, `validation`, `graph-pure-codecs`,
`lineage-pure-codecs`, and `semantic-config-codec`. Static import-statement traversal
of their pinned reference closure found 14 TS modules, schema JSON, `node:path`
string operations and `node:util`; no missing relative dependency. This is a static
import inventory, not a claim of runtime execution or a general source audit.

`domain`, `semantic-index`, `lineage`, `graph-store` and remaining source types
are **type-only** imports. In particular no runtime store, semantic-index or
lineage module is imported. No filesystem/DB/CLI/process/OS/timer/task/network/
native access is requested by the test. Absolute paths inside fixtures are
unopened manifest strings. `new Date(0)` is solely an invalid-prototype input,
not a clock observation or timer. Bun hashing, typed arrays and Buffer operate
only on supplied heap bytes.

## Complete fixture construction and independent expectations

`fixture` builds genuinely separate A-bootstrap and B records; the A-transition
has an independent parent envelope, original root limits and original policy.
The qualified snapshot builder emits three fully described functions, artifact/
coverage/provenance/config data, objects, unresolved references, capabilities,
inferred/retired/callback/self-loop records, and a 65-site relation sharded into
two legal transport records. Full snapshots, not lightweight views, feed the
qualified planner so its scientific-envelope byte measurement uses full records.

A uses the qualified A clustering/grouping producers. B uses explicitly typed
declarative B partition, proposal, lineage, groups and metrics: never an A cast,
an A validator bypass or a runtime semantic-index import. The fixed three-node
adjacency/context/omission example is spelled out; there is no cloned general
clustering/planning implementation. Full contexts retain omitted context bytes
and original records. Expected relation IDs, source-record IDs, metadata,
65 sites and every per-record site association are hand-checked independently.

Mission/config, model IDs and separate variants, template/inventory/accounts,
source spec, actual input blobs, knowledge/approval sources, full admission
context/allocation, root limits/account, planning and T0 are supplied. Variants
with UNKNOWN/null allocation require no selected units. Before each negative,
the applicable complete untouched control is required to parse and bind, without
catch/skip/weakening a failed control.

The enriched fixture is explicitly **fixture-only**, publication level 1, with
an actual stored-result byte materialization, nonempty evidence, result/producer/
commit/readback links and a scoped file's explicit A/B/R approval. Its R document
retains a `likely` conclusion; it does not fabricate `nativeAsmChecked` or other
native publication-gate booleans. Verified content/readback and operator approval
are not assertions of native scientific certainty or acquired HOST capability.

Public addendum handling:

- Root/ledger hashes are explicit external opaque 64-hex fixture witnesses,
  initially `1`/`2` repeated 64 times. All same-state independent and T0 bindings
  agree. Tests also accept other consistently supplied opaque values. No frozen-
  knowledge alias or invented root preimage is imposed; contents/facts/bytes/
  materialization/approval checks remain separate.
- The activation-policy source is real closed JSON with its own raw UTF-8
  ByteRef, resolved from an actual common rule blob. Exact file manifests occur
  in both sources, the path is accessible in both, identity is absent and
  `approvedForBlind=false`. Wrong bytes/version/mission/lineage/ceilings, unresolved
  bytes and bad rule scope are tested. Reformatting changes its raw reference.
- Policy-negative builders explicitly regenerate the other qualified source/
  context/allocation/planning/root commitments. They do not rely on stale hashes
  or reconstruct a policy by echoing envelope ceilings.

## Written coverage

1. Positive A/B/A-transition source binding and immutable, byte-exact origin/run
   roundtrips; full snapshot retention, non-authorizing inspection and diagnostic
   allocation/proposal outcomes.
2. Independent C1/D/raw SHA expectations, Unicode and UTF-8 lengths; copy/freeze;
   malformed UTF-8/BOM, duplicate/escaped keys including nested documents, unknown
   fields, unsafe/fractional counters, refs and direct non-JSON helper guards.
3. Explicit full-snapshot-to-L4 and A/B-to-L5 projections, group/community/kernel/
   context/omission checks. Semantic sidecar mutations realign sidecar/binding/
   planning-document/envelope digests, including a same-union per-source site swap,
   internally consistent lost site, metadata, retired/inferred audit losses and
   conflicting/stale legacy edge-policy declarations. Actual source relations,
   not only claimed sidecar digests, must determine coherence.
4. Independent source replacement, content/materialization/approval mutations with
   matching independent documents, root/T0/generation/parent linkage, B-to-A
   prohibition, and non-augmentable child C/context/selection/root-policy ceilings.
5. Derived run substitutions with recomputed derived/run digests. Public-export
   spies distinguish loader operations from the explicit prepare path. Pure
   parse/bind/inspect/export/run paths require zero observed calls to qualified
   `planMission`/`clusterGraph`; prepare requires one planner call and no clustering.

Shape-negative cases expect codec refusal. Structurally valid relation/source
negatives require `shape=true`, `coherent=false`; well-formed negative B requires
shape/coherence retained but `proposalAdmissible=false`. Every inspection remains
`authorityVerified=false`, `activationState="not-established"`. Direct JSON helper
throws are never confused with a codec's `{ok:false,reasons}` result.

## Static inventory, limits and parent gates

Written inventory: **45 textual `test(` sites**, 9 `describe(` sites;
**155 statically expanded intended cases**, calculated from literal loop/table
cardinalities, not test-run discovery. Table sizes are 18 hostile values, 7 wire
mutations, 11 malformed envelopes, 10 relation mutations applied to both regimes,
6 group mutations, 12 independent substitutions, 8 knowledge, 8 approval, 7 policy,
5 generation and 10 run mutations. Remaining expansion is from the explicit
regime/allocation/ref/policy-scope/root-ceiling loops. Runtime counts and outcomes
are **UNOBSERVED**.

The producer spies cover public planner/A-cluster exports after fixture creation;
they do not prove absence of import-time effects, a runtime multiview import or
another hidden producer. Fresh composed V must inspect the candidate's import/
call closure. This worker deliberately does not import filesystem-reaching
semantic-index merely to manufacture a wider counter claim.

No S2 backend/CAS/drain/restart/ledger enforcement or live/native capability is
implemented, simulated or qualified. T1/T2 are only public data types; an injected
T2 record is rejected as an unknown envelope field. B fixtures use explicit
`previous=null`; historical previous-proposal witness acquisition, J->K or no-op
witness authentication and persisted S2/S3/S4 behaviors remain outside this slice.
There is no dispatch, caller-boolean activation oracle, fresh HOST/LOCAL handle,
durable proof or 415-baseline equivalence claim.

Before any integration: receive/pin the announced R3 own-codec metadata; parent
fresh strong composed source+QA V; parent-only compiler/typecheck and focused
tests; investigate any invalid positive fixture rather than relaxing an assertion.
Only parent gates can establish executable validity or accept this candidate.
