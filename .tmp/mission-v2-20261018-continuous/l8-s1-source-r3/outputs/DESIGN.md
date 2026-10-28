# S1 R3 — isolated source proposal, not validated

Status: **PROPOSED_SOURCE_R3**, bounded common-policy byte-resolution gap repaired in source;
not reviewed, compiled, tested, integrated or admitted.
Owner/task unchanged: `l8-s1-source-author-r1` / `task_mvdy6khz_000q_0ee18w`.
Only the five assigned source/schema paths and this DESIGN/MANIFEST were written.

## R3 bounded delta: actual common-rule policy bytes

Public semantics are fixed by the pinned `PUBLIC_KNOWLEDGE_POLICY_ADDENDUM.md`
(5,397 bytes, SHA-256
`d8ac742256db494a0e5f421766a2dbd4c5362a20034f5f15ee649a9202b835cd`).
No foreign QA implementation, candidate golden or private recipe was used.

The only R3 functional change is the private `bindActivationPolicySourceV1`
helper, called inside `bindExecutionPreparationV1` after the existing independent
source comparisons, parent/root invariants and input-byte validation. It resolves
`activationPolicy.sourcePolicyRef` from an actual `ArtifactBytesV1` in the
independently supplied input files, already byte-exactly bound to the envelope's
complete input files. There is no new public argument/type/export/envelope field
or document-kind export key.

Required policy selection and content:

- The typed document ref has kind `l8-activation-policy-source-v1` and encoding
  `utf8-json-v1`.
- At least one matching independent artifact has `file.kind="rule"`, identity
  **absent**, explicit `approvedForBlind=false`, and identical file metadata in
  both `inputSource.commonInputs` and `sourceMissionSnapshot.config.commonInputs`.
  Its path occurs in both sources' `accessibleRules`; the source config is fixture.
- Its blob ref remains `raw-v1`; file SHA, blob SHA and byte length match the
  policy document ref. The differently typed ref kinds/encodings are not wrongly
  compared as entire equal objects. Actual base64/raw bytes are rechecked using
  the existing private blob codec, decoded with the existing fatal UTF-8/BOM
  checks, and parsed using the existing duplicate-key/surrogate-safe JSON codec.
- The real decoded policy is closed to exactly five fields: `version`,
  `missionId`, `lineageId`, `maxActivationAttempts`, `maxCandidateReplacements`.
  Version is `l8-activation-policy-source-v1`; mission/control-root lineage and
  both finite safe-integer ceilings equal the envelope. Attempts are at least one,
  replacements at least zero. No defaults or `authorized`/issuer labels exist.
- Missing/unresolved/non-common/inaccessible/wrong-scope bytes, malformed content,
  extra fields or mismatched tags/mission/lineage/limits reject the binding. The
  policy is not reconstructed from envelope counts and called an independent
  source. The existing immutable parent/root policy equality remains in force.

Knowledge `rootHash` and `ledgerDigest` were already opaque backend witnesses in
R2 and are unchanged. They remain explicit lowercase SHA-256 values compared
against the independently supplied same-state sources and T0; they are not
recomputed from facts, materializations, frozen knowledge or legacy fingerprints.
No fact/content/materialization/approval/byte check was removed or weakened, and
no legacy hash recipe changed. Authenticated acquisition, durability, J→K/no-op
K→K and final policy authority remain backend/S2 obligations, not JSON authority.

The R2 relation-source check, imports, projections and all T0/T1/T2/three-branch
contracts are unchanged. The other four source/schema artifacts remain
byte-identical to frozen own R2. All eighteen public functions remain unchanged.

## R2 relation delta retained unchanged

The qualified `graph-pure-codecs.ts:172–219` still supplies the existing planning
shape/digest/unit/admission-budget binding checks. R2 adds a value import of the
qualified `canonicalRelationView` from **`./planner-relation-codecs`**, not the
planner producer. Its extracted body is in the supplied qualified reference
(`planner-relation-codecs.ts:31–96`, 8,164 bytes, SHA-256
`afe9d66d3db8c457385f83fbe306075a935349ef49e993210e8b6aad7794bd50`).

Inside `bindExecutionSourcesV1`, after the complete preparation/full-snapshot
projection and `validatePlanningBindingV1`, compute:

```ts
const relationView = canonicalRelationView(
  clone(prepared.projection.graph) as PlannerGraphInput,
  planning.sidecar.policy
).relationView;
refsEqual(relationView, planning.sidecar.relationView,
  "planning relation view differs from full snapshot records/sites/observations");
```

The assertion removes deep readonly typing only; it is not a B-to-A cast.
`refsEqual` compares the complete values using upstream `canonical`, not digests,
lengths, or a reduced projection. This includes metadata, sourceEdgeIds, sites,
observations and sitesBySourceEdgeId. Codec conflicts propagate through the
existing failure result; no permissive fallback exists. The old unavailable
guard/function are removed only in favor of this actual comparison.

The supported planner source pin is updated to 60,760 bytes / SHA-256
`fd90abe4bf8583d613beef41988d5a63323afdc5083d33ed04659f86cb203b99`.
No producer is loaded by the pure path, no relation core is copied, and no plan
or SCC is recomputed. The other four source/schema files remain byte-identical
to the frozen own proposal. This closes the identified source gap only, not QA,
V, integration, authority, or an execution gate.

## Provenance and permitted use

- R3 input: 70 pins / 1,539,175 bytes; RAW `INPUT_MANIFEST.json` SHA-256
  `0f2e563153df9f4acedcdaecf63b21ec8a0db2e8943100566f61dd2a49858a25`.
- Explicit direct R3 correction GO: pinned `inputs/SCOPE.md`, 2,828 bytes, SHA-256
  `826331ebb4a64b4988410904334f589a96a721570942db87dc4f1119b8402d4d`.
- The seven prior own R2 artifacts are frozen under the input packet's `prior/`.
  They and the older outputs were not modified. Their raw manifest SHA-256 is
  `d74f4a059362496c27966ea4f87bdba49af29d66acb28853ce608a307c154fc7`.
- NONBLIND: ratified R3 contracts, parent dispositions, qualified source/schema
  references and frozen own prior artifacts only. No other worker's QA/output or
  live/origin files read.
- Parent's prior factoring gates qualify dependencies, **not this source**.
- No worker compiler, test, validator, product import/execution, process, DB,
  Git, IDA, live, network, delegation or team lifecycle operation was performed.

Paths/imports are written for eventual placement in `tools/ff8-harness/`; the
isolated directory is not a standalone build and contains no copies of dependencies.
S2–S4, runtime/native activation, full44, G5–G7 and global L8 remain excluded.

## Module boundary

- `graph-execution-envelope.ts`: byte/value codecs, complete source decoders,
  source binding, inspection, origin/run parsing/export and immutable run derivation.
  Value imports: `node:util`, `graph`, `graph-transport`, `graph-pure-codecs`,
  `planner-relation-codecs`, `validation`, `re-policy`, and the pure
  `graph-b-projection`, plus the two new
  JSON schemas. Store/domain/planner contracts are type-only imports.
- `graph-b-projection.ts`: pure full snapshot→L4 view and full snapshot/groups→L5
  input projection; full group/context/omission bindings. It value-imports only
  `node:util`, `graph`, `graph-transport`, `lineage-pure-codecs`,
  `graph-pure-codecs`, `validation` and the pinned group schema. Its envelope,
  planner, grouping, lineage and semantic-index imports are type-only.
- `graph-execution-prepare.ts`: the **only S1 value import of `planMission`**.
  It imports the pure envelope entry points, not conversely. Neither pure module
  re-exports preparation. No dynamic import or planner/authority callback exists.
- Existing transport/adoption schemas and v1/v2 loaders are not modified.

## Exact exported function API for parent review

Declarations below describe the current R3 proposal. The public API is unchanged
from frozen own R2. This candidate DESIGN is not a QA oracle: under the public R3
addendum QA receives the public contract, qualified references and parent-relayed
data-only hash metadata, not candidate code/schemas/DESIGN. Independent QA, fresh V
and parent gates remain required; this source revision itself has not been
executed or validated.

```ts
type ReadonlyData<T> = T extends object ? { readonly [P in keyof T]: ReadonlyData<T[P]> } : T;
type CodecResult<T> = { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reasons: readonly string[] };

// graph-execution-envelope.ts
function assertExecutionJsonV1(value: unknown, parents?: Set<object>): void;
function canonicalExecutionJsonV1(value: unknown): string;
function executionValueRefV1(kind: string, value: unknown): ValueRef;
function makeBoundDocumentV1<T>(kind: string, value: T): BoundDocument<T>;
function makeBoundBytesV1(kind: string, bytes: Uint8Array): BoundBytesV1;
function parseExecutionEnvelopeV1(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>>;
function exportExecutionEnvelopeV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<Uint8Array>;
function sealExecutionEnvelopeV1(body: unknown): CodecResult<ReadonlyData<ParsedExecutionEnvelopeV1>>;
function bindExecutionPreparationV1(raw: unknown, independent: IndependentlyLoadedSourcesV1,
  policy: PlannerPolicy): CodecResult<ReadonlyData<BoundPreparationV1>>;
function bindExecutionSourcesV1(origin: ReadonlyData<ParsedExecutionEnvelopeV1>,
  independent: IndependentlyLoadedSourcesV1): CodecResult<ReadonlyData<BoundExecutionV1>>;
function inspectExecutionEnvelopeV1(bytes: Uint8Array,
  independent: IndependentlyLoadedSourcesV1): ExecutionInspectionV1;
function makeGraphRunV3(origin: ReadonlyData<ParsedExecutionEnvelopeV1>): CodecResult<ReadonlyData<ParsedGraphRunV3>>;
function parseGraphRunV3(bytes: Uint8Array): CodecResult<ReadonlyData<ParsedGraphRunV3>>;
function exportGraphRunV3(parsed: ReadonlyData<ParsedGraphRunV3>): CodecResult<Uint8Array>;

// graph-b-projection.ts
function projectGraphSnapshotViewV1(fullSnapshot: unknown): CodecResult<ReadonlyData<GraphSnapshotView>>;
function projectExecutionSourcesForL5V1(fullSnapshot: unknown, rawTransport: unknown,
  rawGrouping: unknown, rawPolicy: unknown, rawContext: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>>;
function projectRegimeBForL5(fullSnapshot: unknown, transport: unknown, grouping: unknown,
  policy: unknown, context: unknown): CodecResult<ReadonlyData<ExecutionProjectionV1>>;

// graph-execution-prepare.ts (producer entry, never re-exported by pure modules)
function prepareExecutionV1(request: ExecutionPreparationRequestV1): CodecResult<ReadonlyData<PreparedExecutionV1>>;
```

The five primitive JSON/document helpers throw on invalid input; the other
entry points report `CodecResult`, except inspection, which always returns its
separate status fields. They accept no authority callbacks. Shared schemas and
modules must come from the trusted pinned loader and must not be mutated by a
consumer. The envelope checks the supported upstream byte/hash pins; this is
version binding, not an attestation of its own loader or backend authority.

### Wire primitives and origin

```ts
interface ByteRef { kind: string; encoding: "utf8-json-v1" | "raw-v1"; byteLength: number; sha256: string }
interface ValueRef { kind: string; codec: "l8-json-c14n-v1"; sha256: string }
interface BoundDocument<T> { ref: ByteRef; utf8: string }
interface BoundBytesV1 { ref: ByteRef; base64: string }
interface ArtifactBytesV1 { file: ArtifactFile; bytes: BoundBytesV1 }
interface ContractPinsV1 {
  envelopeCodec: ByteRef; fullSnapshotSchema: ByteRef; fullSnapshotModule: ByteRef;
  proposalCodec: ByteRef; plannerCodec: ByteRef; inputCodec: ByteRef; admissionCodec: ByteRef;
  preparedTransportSchema: ByteRef; adoptionTransportSchema: ByteRef;
}
interface ExecutionEnvelopeCommonV1 {
  version: "l8-execution-envelope-v1"; mode: "offline-fixture-v1"; missionId: string;
  generation: { lineageId: string; ordinal: number; parentGenerationId: string | null };
  contractPins: ContractPinsV1; preparedTransport: BoundDocument<PreparedGraphTransportV3>;
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>;
  sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  groupSource: GroupSourceV1; planning: BoundDocument<PlannerResult>; admissionSource: AdmissionSourceV2;
  activationPolicy: { sourcePolicyRef: ByteRef; maxActivationAttempts: number; maxCandidateReplacements: number };
  preparationObservationT0: PreparationObservationT0;
}
type ExecutionEnvelopeBodyV1 = ExecutionEnvelopeCommonV1 & (
  { authorizationKind: "bootstrap-a-fixture-v1" | "transition-a-fixture-v1"; adoptionIntent: null;
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: null;
      lineageRef: null; partitionStoreDigest: string } } |
  { authorizationKind: "proposal-b-host-fixture-v1";
    adoptionIntent: null | { kind: "pre-drain-non-authorizing-v1"; document: BoundDocument<PartitionAdoptionTransportV1> };
    sourceRefs: { partitionRef: ValueRef; groupsRef: ValueRef; proposalEvidenceRef: ValueRef;
      lineageRef: ValueRef; partitionStoreDigest: string } }
);
type ExecutionEnvelopeV1 = ExecutionEnvelopeBodyV1 & { fingerprint: string };
type ExecutionPreparationBodyV1 = Omit<ExecutionEnvelopeCommonV1, "planning"> & {
  authorizationKind: ExecutionEnvelopeBodyV1["authorizationKind"];
  adoptionIntent: ExecutionEnvelopeBodyV1["adoptionIntent"];
  sourceRefs: ExecutionEnvelopeBodyV1["sourceRefs"];
};
interface ParsedExecutionEnvelopeV1 {
  document: BoundDocument<ExecutionEnvelopeV1>; envelope: ExecutionEnvelopeV1; generationId: string;
}
```

`generationId = "l8gen:" + fingerprint`; it is not inside the envelope body.
Envelope fingerprint is `D("l8-execution-envelope-v1", body)` excluding only
`fingerprint`. No random ID, Unicode/path normalization or hash cycle is introduced.
C1 sorts object keys by UTF-16 units, preserves array order, and follows ECMAScript
JSON scalar encoding. Duplicate decoded JSON keys are rejected in a token prepass
before object construction. Invalid UTF-8, BOM, isolated surrogates, accessors,
proxies, cycles, sparse/extended arrays, symbols, hidden properties, non-finite
numbers and negative zero are rejected. Safe integers are required at count,
length, revision and fence fields; ordinary upstream numeric measurements may
remain finite nonintegers.

Exports preserve the complete original `utf8`, including whitespace/line endings,
and recheck its ByteRef. `seal` and `makeBoundDocument` create new bytes explicitly;
they are not substitutions for exporting an existing origin.

### Complete source aggregates

`ExecutionMissionSnapshotV1` keeps the complete qualified `Snapshot` shape, except
that each `CycleRecord.graph` may also contain the dedicated additive marker
`GraphCycleAnchorV3 = {version:"l8-frozen-cycle-v3",lineageId,generationId,
envelopeFingerprint,runFingerprint,envelopeRef,runRef}`. Old loader unions are not
edited. This data type is not installation of an anchor or verification of OWN.

```ts
interface ApprovalRecordV1 {
  approvalId: string; issuerRef: ByteRef; authorityRevision: number; functionIdentity: FunctionIdentity;
  fileSha256: string; filePath: string; sourceResultIds: string[]; allowedRoles: Role[];
  knowledgeRevision: number; decision: "approved" | "denied" | "revoked"; recordRef: ByteRef;
}
interface ApprovalSourceV1 { version: "l8-approval-source-v1"; revision: number; records: ApprovalRecordV1[] }
interface KnowledgeMaterializationV1 {
  fileSha256: string; filePath: string; resultId: string;
  producer: { authorId: string; executionId: string; sessionId: string; model: ModelRef };
  validation: "fixture-only" | "parent-validated"; revoked: boolean; revocationRef: ByteRef | null;
  binding: BoundDocument<ArtifactBinding>; commit: BoundDocument<KnowledgeCommit>;
  result: BoundDocument<StoredResult>;
  readback: { status: "verified" | "pending" | "mismatch"; sha256: string; recordRef: ByteRef };
}
interface KnowledgeSourceV1 {
  version: "l8-knowledge-source-v1"; missionId: string; knowledgeRevision: number; rootHash: string;
  frozen: FrozenKnowledge; files: ArtifactBytesV1[]; facts: ValidatedFact[];
  materializations: KnowledgeMaterializationV1[]; ledgerRevision: number; ledgerDigest: string;
}
interface CompleteInputSourceV1 { document: BoundDocument<GraphInputSource>; files: ArtifactBytesV1[] }
interface RootLimitsV1 {
  allocation: BoundDocument<AdmissionBudgetInputV1 | null>;
  contextEnvelopeMaxUtf8Bytes: number; totalContextBudgetUtf8Bytes: number; maxSelectedUnits: number;
  executionTemplate: BoundDocument<GraphExecutionTemplate>;
}
interface BudgetLineageV1 {
  version: "l8-budget-lineage-v1"; rootAccountId: string; rootAllocationRef: ByteRef;
  rootLimits: BoundDocument<RootLimitsV1>; epoch: number;
}
interface AdmissionSourceV2 {
  version: "l8-admission-source-v2"; admissionCodecVersion: "l8-fixture-admission-codec-v2";
  cycle: number; budgetEpoch: number;
  executionTemplate: BoundDocument<GraphExecutionTemplate>;
  executionSourceSpec: BoundDocument<GraphExecutionSource>;
  inputManifestSource: CompleteInputSourceV1; context: AdmissionBudgetContextV1;
  allocation: AdmissionBudgetInputV1 | null;
  sourceFingerprints: { executionTemplate: string; executionSourceSpec: string; inputManifest: string;
    context: string; allocation: string | null };
  knowledgeSource: BoundDocument<KnowledgeSourceV1>; approvalSource: BoundDocument<ApprovalSourceV1>;
  budgetLineage: BudgetLineageV1;
}
interface IndependentlyLoadedSourcesV1 {
  fullGraphSnapshot: BoundDocument<GraphSnapshotV1>;
  sourceMissionSnapshot: BoundDocument<ExecutionMissionSnapshotV1>;
  executionTemplate: BoundDocument<GraphExecutionTemplate>;
  executionSourceSpec: BoundDocument<GraphExecutionSource>;
  inputManifestSource: CompleteInputSourceV1; knowledgeSource: BoundDocument<KnowledgeSourceV1>;
  approvalSource: BoundDocument<ApprovalSourceV1>; contractPins: ContractPinsV1;
  parentEnvelope: BoundDocument<ExecutionEnvelopeV1> | null;
}
```

These separately supplied documents are compared byte-exactly. This API cannot
prove independent acquisition or that a snapshot is current in a live backend.
Historical producer/binding/commit/readback records are checked as data, not trusted
handles. `rootHash` records the backend's hash K: S1 does not invent a replacement
knowledge-root hash algorithm. Root account identity follows the ratified
`D("l8-budget-root-v1",{missionId,lineageId,rootAllocationRef})`. Root allocation
reference resolves to `rootLimits.allocation.ref`, not a digest without content.
Parent origins preserve root limits/policy byte-exactly; durable counters/SPENT,
source policy approval and true authority remain S2 responsibilities.

### Explicit grouping source and projections

```ts
interface CommunityBindingV1 {
  version: "l8-community-binding-v1";
  groups: Array<{ groupId: string; communityContentId: string; kernelIds: string[];
    parentContentIds: string[]; capabilityIds: string[];
    memberMaturity: Array<{functionId:string;semanticMaturity:FunctionNodeV1["semanticMaturity"]}> }>;
}
interface FullContextByGroupV1 {
  version: "l8-full-context-by-group-v1";
  groups: Array<{ groupId: string; functionIds: string[]; nodes: FunctionNodeV1[]; edges: FunctionEdgeV1[];
    objects: ReferencedObjectV1[]; unresolved: UnresolvedReferenceV1[]; capabilities: CapabilityFactV1[] }>;
}
interface ContextOmissionsV1 {
  version: "l8-context-omissions-v1";
  byGroup: Array<{groupId:string;functionIds:string[]}>;
  byCommunity: Array<{communityContentId:string;functionIds:string[]}>;
}
interface DecodedGroupSourceV1 {
  groupingConfig: GroupConfig; groupingMetrics: GroupMetrics;
  communityBinding: CommunityBindingV1; fullContextByGroup: FullContextByGroupV1;
  contextOmissions: ContextOmissionsV1;
}
interface GroupSourceV1 {
  groupsRef: ValueRef; groupingConfig: BoundDocument<GroupConfig>; groupingMetrics: BoundDocument<GroupMetrics>;
  communityBinding: BoundDocument<CommunityBindingV1>; fullContextByGroup: BoundDocument<FullContextByGroupV1>;
  contextOmissions: BoundDocument<ContextOmissionsV1>;
}
interface ExecutionProjectionV1 {
  graph: PlannerGraphInput; groups: PlannerGroupInput[]; partitionId: string; regime: "A" | "B";
  snapshotView: GraphSnapshotView; proposalAdmissible: boolean | null;
  sourceBindings: { snapshotFingerprint:string; partitionStoreDigest:string; proposalFingerprint:string;
    groupMetricsFingerprint:string; fullContextFingerprint:string };
}
```

The exact named L4 view populates optional edge sites/confidence/appearance/
retirement fields from the full graph; no call-site cap is applied to unions.
Full graph bytes remain in the envelope. Group ownership has one explicit
community; no implicit cross-community attachment is accepted. Omissions remain
diagnostics, with their source functions still present in each full context.
The full context includes all scope nodes, all incident source edge records/sites,
all source objects/capabilities, and unresolved references originating in scope.
Recorded affinity bindings are retained, never reclustered at load.

### Parsed/bound/run/result types

`BoundPreparationV1` contains `{body,snapshot,missionSnapshot,transport,template,
sourceSpec,inputSource,knowledge,approvals,grouping,projection}`; those are the
complete decoded sources above, not authority or scientific acceptance flags.
`BoundExecutionV1` adds `{origin,planning}` only after the full-source projection,
planning binding and complete canonical relation-source comparison succeed.
Positive binding is a data-coherence result, not admissibility or authority.

```ts
interface DerivedExecutionSpecV3 {
  version:"l8-execution-derived-v3"; sourceSpecFingerprint:string; templateFingerprint:string;
  inputManifestFingerprint:string; envelopeFingerprint:string; planId:string; planFingerprint:string;
  sidecarFingerprint:string; bindingFingerprint:string; snapshotId:string; partitionId:string; knowledgeRevision:number;
}
interface GraphRunV3 {
  version:"l8-graph-run-v3"; mode:"offline-fixture-v1"; missionId:string; generationId:string;
  envelopeFingerprint:string; envelope:BoundDocument<ExecutionEnvelopeV1>;
  derivedSpec:DerivedExecutionSpecV3; derivedSpecFingerprint:string; fingerprint:string;
}
interface ParsedGraphRunV3 { document:BoundDocument<GraphRunV3>; run:GraphRunV3 }
interface ExecutionInspectionV1 {
  shape:boolean; coherent:boolean; proposalAdmissible:boolean|null;
  authorityVerified:false; activationState:"not-established"; reasons:readonly string[];
}
interface ExecutionPreparationRequestV1 {
  body:ExecutionPreparationBodyV1; independentSources:IndependentlyLoadedSourcesV1; policy:PlannerPolicy;
}
interface PreparedExecutionV1 { origin:ParsedExecutionEnvelopeV1; run:ParsedGraphRunV3 }
```

Run fingerprint is D over its body excluding `fingerprint`; derivedSpec uses its
own `l8-execution-derived-v3` D domain. No upstream plan/partition/group/unit ID is
rehash-renamed. The v1 admission parser is not reused/cast as v2.

## Control data: T0/T1/T2, never capabilities

`PreparationObservationT0` has exactly `{observedEventSequence,parentGenerationId,
headRevision,activePlanRevision,sourceMissionRevision,controllerFence,
knowledgeRevision,knowledgeRootHash,knowledgeLedgerRevision,knowledgeLedgerDigest,
budgetLedgerRevision,budgetLedgerDigest,spentBySlot,encumberedBySlot,
inventoryRevision,inventoryDigest,partitionStoreDigest,authorityRecordRefs,proofRecordRefs}`.
The nullable fields are parentGenerationId, activePlanRevision, inventoryRevision,
inventoryDigest, both slot observations and both record-ref arrays. Slot observations
are explicit unique lists `{slotKey,amount}`, not inferred zeroes. Other counts are
nonnegative safe integers; digests are lowercase SHA-256. T0 is immutable history.

Additional exported **type-only contracts**, not constructors or verified records:

- `CandidateRefV1`: `{generationId,envelopeFingerprint,envelopeRef,runRef}`.
- `DrainEntryV1`: `{version:"l8-drain-entry-v1",barrierRootId,candidateRef,
  expectedT0Ref,headBefore,headAfter,controllerFence,engagedFamiliesRef,
  inventoryAtCutRef,eventSequence}`.
- `ExpectationsT2V1`: `{headRevision,activeGenerationId,activePlanRevision,
  sourceMissionRevision,controllerFence,familyFences:[{familyId,fence}],
  knowledgeRevision,knowledgeRootHash,knowledgeLedgerRevision,knowledgeLedgerDigest,
  inventoryRevision,inventoryDigest,inventoryRef,budgetLedgerRevision,budgetLedgerDigest,
  spentBySlot,encumberedBySlot,proofRecordRefs,releaseRecordRefs,
  sourceCapabilityRecordRefs,authorityRecords:[{recordRef,revision,revocationRef}]}`.
- `ActivationAttemptV1`: immutable body with version, ordinal, previous attempt ID,
  candidateRef, barrierRootId, drainEntryRef, nullable replacementRecordRef,
  expectationsT2, authorityRecordRefs and discriminated authorizationKind/finalAdoption.
  Final adoption is null for both A ports; B contains its exact final BoundDocument.
- `CandidateReplacementV1`: `{barrierRootId,drainEntryRef,oldCandidateRef,
  newCandidateRef,currentHeadRevision,currentCandidateRevision,sourceBindingsRef,
  authorityRecordRefs,controllerFence}`.
- `GenerationHeadV1`: `{version:"l8-graph-generation-head-v1",missionId,lineageId,
  revision,activeGenerationId,candidateGenerationId,candidateRef,activePlanRevision,
  controlMode,budgetLedgerRevision,knowledgeLedgerRevision,inventoryRevision,
  barrierRootId,candidateRevision}`. IDs/refs are nullable where no current/active
  candidate exists. Only the future durable head selects current; a staged origin
  does not select itself. S1 implements no CAS/staging counters or state transition.

No final adoption, activation attempt, outcome or volatile T2 expectation is added
to the origin body or either old transport. No B witness/delta is applied at T2;
trusted historical J→K/no-op K→K verification remains outside JSON/S1.

## Document kind tags and pins

`EXECUTION_DOCUMENT_KINDS_V1` exports exactly:
`envelope=l8-execution-envelope-v1`, `run=l8-graph-run-v3`,
`preparedTransport=l8-prepared-graph-v3`, `adoption=l8-partition-adoption-v1`,
`fullGraphSnapshot=graph-snapshot-v1`, `sourceMissionSnapshot=l8-source-mission-snapshot-v1`,
`planning=l8-planning-source-v1`, `executionTemplate=l8-execution-template-v1`,
`executionSourceSpec=l8-execution-source-v1`, `inputManifest=l8-input-source-v1`,
`knowledge=l8-knowledge-source-v1`, `approvals=l8-approval-source-v1`,
`rootLimits=l8-root-limits-v1`, `groupingConfig=l8-grouping-config-source-v1`,
`groupingMetrics=group-metrics-v1`, `communityBinding=l8-community-binding-v1`,
`fullContextByGroup=l8-full-context-by-group-v1`, `contextOmissions=l8-context-omissions-v1`.

The supported input/admission codec pin is the actual `graph-pure-codecs.ts`
source containing their validators, not the runtime filesystem sink `inputs.ts`.
The own envelopeCodec pin cannot prove its own loader: parent/backend must pin
the final accepted source package. No source/schema file is read at runtime here.

## Remaining gates and limits

The R3 correction resolves actual common-policy source bytes; opaque backend
knowledge witnesses and all existing checks are retained. No additional structural
gap was identified in this bounded revision. Independent source-disjoint QA uses
the public addendum/contract and qualified references, with parent-provided
data-only R3 hash metadata, not candidate implementation/schemas/DESIGN. Fresh V
and parent-only typecheck/tests/readback must follow. This proposal contains no
worker test results or positive execution claim. Parent dependency gates are not
evidence that this S1 proposal passes.

R3 mechanically copied the seven frozen own R2 artifacts to the new owned sibling
with exclusive-create semantics and made only those new copies writable before
patching. No input/prior/old-output bytes or permissions changed. The R2 mechanical
incidents remain historical in its frozen manifest, not new R3 failures.
