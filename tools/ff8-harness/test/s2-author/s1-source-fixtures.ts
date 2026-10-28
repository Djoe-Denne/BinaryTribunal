import type { RootSlotGrantsV1, RootModelBindingsV1, PublicContextSourcesV1,
  KnowledgeProvenanceV1, ByteRef, BoundDocument, ContractPinsV1, ExecutionEnvelopeBodyV1,
  IndependentlyLoadedSourcesV1, ExecutionMissionSnapshotV1, GroupSourceV1, RootLimitsV1, ReadonlyData } from "../../src/graph-execution-envelope";
import type { KnowledgeCommit, ResultProvenanceV1, HistoricalAdmissionDataV1, KnowledgeSourceV1, WholeUnitValidationDataV1, KnowledgeMaterializationV1 } from "../../src/graph-execution-envelope";
import type { StoredResult, WorkerResult, ValidatedFact } from "../../src/domain";
import type { ParentAuthorityIdentity, NativeAuthorIdentity, ParentAttestation, ArtifactBinding } from "../../src/graph-store";
import type { GraphSnapshotV1 } from "../../src/graph";
import type { GraphExecutionTemplate, GraphExecutionSource, GraphInputSource, ModelRef } from "../../src/domain";
import type { PlannerPolicy, PlannerResult, AdmissionBudgetContextV1, AdmissionBudgetInputV1 } from "../../src/planner";
import type { GroupConfig, GroupMetrics } from "../../src/investigation-groups";
import type { PreparedGraphTransportV3 } from "../../src/graph-transport";
import type { DecodedGroupSourceV1 } from "../../src/graph-b-projection";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Compile-time witnesses for the ratified public surface, not a codec oracle.
export type RatifiedSources = {
  grants: RootSlotGrantsV1;
  models: RootModelBindingsV1;
  contexts: PublicContextSourcesV1;
  provenance: KnowledgeProvenanceV1;
};

export const sha = "a".repeat(64);
export const functionId = `${sha}:0x2`;
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(k => `${JSON.stringify(k)}:${canonical(object[k])}`).join(",")}}`;
}
export const rawHash = (bytes: string | Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
export const digest = (value: unknown): string => rawHash(canonical(value));
export const valueDigest = (kind: string, value: unknown): string => digest({ kind, value });
export function document<T>(kind: string, value: T): BoundDocument<T> {
  const utf8 = canonical(value);
  return { ref: { kind, encoding: "utf8-json-v1", byteLength: Buffer.byteLength(utf8), sha256: rawHash(utf8) }, utf8 };
}
export function decoded<T>(value: BoundDocument<T>): T { return JSON.parse(value.utf8) as T; }
function stamped<T extends object>(value: T): T & { fingerprint: string } { return { ...value, fingerprint: digest(value) }; }

// All scientific data below are synthetic literals. No producer/imported codec
// constructs the expected documents, metrics, ordering or fingerprints.
type MutableFixture<T> = { -readonly [K in keyof T]: MutableFixture<T[K]> };
type SameType<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type AssertType<T extends true> = T;
export type ReadonlyContractWitness = [
  AssertType<SameType<ReadonlyData<unknown>, unknown>>,
  AssertType<SameType<ReadonlyData<string | null>, string | null>>,
  AssertType<SameType<ReadonlyData<{ values: [{ n: number }] }>, { readonly values: readonly [{ readonly n: number }] }>>
];
export interface AuthorFixture {
  body: ExecutionEnvelopeBodyV1; independent: IndependentlyLoadedSourcesV1; policy: PlannerPolicy;
  snapshot: GraphSnapshotV1; transport: MutableFixture<PreparedGraphTransportV3>; grouping: DecodedGroupSourceV1;
}
export function fixture(options: { cap?: number; rootCap?: number; knowledgeRevision?: number; regime?: "A" | "B"; failureCause?: boolean } = {}): AuthorFixture {
  const knowledgeRevision = options.knowledgeRevision ?? 0;
  const model: ModelRef = { providerID: "fixture", id: "synthetic", variant: "test" };
  const binary = { sha256: sha, version: "fixture-v1" };
  const models = { explore: model, evaluate: model, A: model, B: model, R: model };
  const node: GraphSnapshotV1["nodes"][number] = {
    schemaVersion: 1, id: functionId, moduleSha256: sha, rva: "0x2", ea: "0x400002", imageBase: "0x400000",
    name: "café😀", observedDescription: "関数", boundaries: [{ ordinal: 0, rva: "0x2", endRvaExclusive: "0x12", role: "entry" }],
    sizeBytes: { known: true, value: 16 }, instructionCount: { known: false, value: null }, basicBlockCount: { known: false, value: null },
    functionClass: "internal", status: "observed", semanticMaturity: "none", analysisRefs: [], byteAgreement: "unknown", admissibleAsOracle: false,
    byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null },
  };
  const graphBody: Omit<GraphSnapshotV1, "normalizedFingerprint"> = {
    schemaVersion: 1, snapshotId: "snap:author", missionId: "author", nodes: [node], edges: [], objects: [], unresolved: [], capabilities: [], knowledgeRevision,
    binaryArtifacts: [{ schemaVersion: 1, artifactId: `mod:${sha}`, moduleName: "synthetic.exe", contentSha256: sha, versionLabel: binary.version,
      format: "PE32", architecture: "x86-32", imageBase: "0x400000", idbIdentity: "", sections: [],
      provenance: { moduleSha256: sha, siteRva: null, siteKind: "extractor", xrefType: "none", source: "synthetic-not-native", sourceVersion: "1", sourceHash: sha, evidenceSha256: sha },
      analysisVersion: "fixture", extractorVersion: "fixture" }],
    scope: { description: "Synthetic author API fixture, never a native proof", moduleSha256s: [sha], functionCount: 1 },
    coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true },
    toolVersions: { extractor: "synthetic", extractorHash: sha, normalizer: "fixture" }, configFingerprint: sha,
  };
  const snapshot: GraphSnapshotV1 = { ...graphBody, normalizedFingerprint: digest(graphBody) };
  const fullGraphSnapshot = document("graph-snapshot-v1", snapshot);
  const bConfig = { rulesetVersion: "ff8-tech-syn-1", synonyms: false, bm25: { k1: 1.2, b: 0.75 }, topK: 2, scoreTieDecimals: 6,
    similarityThreshold: 0.5, maxPostingDf: 10, maxCandidates: 10, hubMinDegree: 10, hysteresis: 0.5,
    views: { structure: true, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false } };
  const b = options.regime === "B";
  const algorithm = b ? "multiview-components" : "hub-baseline", algorithmVersion = b ? "2" : "ff8-structural-1.2.0";
  const configFingerprint = b ? digest({ algorithm, algorithmVersion, ...bConfig, encoder: null }) : sha;
  const communityId = digest({ algorithm, algorithmVersion, configFingerprint, memberIds: [functionId] });
  const partitionId = b ? `part:${digest({ role: "partition", configFingerprint, snapshotId: snapshot.snapshotId, contentIds: [communityId] })}` : "part:author";
  const transport: MutableFixture<PreparedGraphTransportV3> = { schemaVersion: 3, partition: {
    schemaVersion: 1, partitionId, lineageId: b ? `lin:p:${digest({ role: "partition-lineage", configFingerprint, snapshotId: snapshot.snapshotId, contentIds: [communityId] })}` : "root:author", parentLineageId: null, snapshotId: snapshot.snapshotId,
    snapshotFingerprint: snapshot.normalizedFingerprint, regime: b ? "B" : "A", algorithm, algorithmVersion,
    configFingerprint, seed: "none", communities: [{ contentId: communityId, lineageId: b ? `lin:c:${digest({ role: "community-lineage", algorithm, algorithmVersion, configFingerprint, memberIds: [functionId] })}` : `root:${communityId}`, parentContentIds: [], memberIds: [functionId], kernelIds: [functionId], externalContextIds: [], conductance: { known: false, value: null } }],
    modularity: { known: false, value: null }, maturity: "structural", adopted: false,
  }, groups: [{ schemaVersion: 1, groupId: "group:author", partitionId, communityContentId: communityId, ownedFunctionIds: [functionId], contextFunctionIds: [], capabilityIds: [],
    granularity: "function", estimatedCost: { known: false, value: null }, uncoveredIds: [], memberMaturity: [{ functionId, semanticMaturity: "none" }] }] };
  if (b) {
    const evidence = { version: "l4-proposal-evidence-1" as const, source: { snapshot: { schemaVersion: 1 as const, snapshotId: snapshot.snapshotId, normalizedFingerprint: snapshot.normalizedFingerprint,
      nodes: [{ id: functionId, moduleSha256: sha, rva: "0x2", name: node.name, observedDescription: node.observedDescription, semanticMaturity: "none" as const, functionClass: "internal" as const }], edges: [], objects: [], unresolved: [], capabilities: [] },
      config: bConfig, constraints: [], encoderIdentity: null, encoderIdentityStatus: "absent" as const, previous: null },
      result: { partition: structuredClone(transport.partition), lineageSidecar: { version: "l4-lineage-2" as const, partitionId, v1Compatible: true, proposalPass: true, projectionFingerprint: digest(transport.partition),
        communities: [{ contentId: communityId, parentContentIds: [], conductance: { known: false, value: null } }] }, diagnostics: [], constraints: { status: "none" as const, applied: 0, rejected: 0 } } };
    transport.proposalEvidence = { ...evidence, evidenceFingerprint: digest(evidence) };
  }
  const activation = document("l8-activation-policy-source-v1", { version: "l8-activation-policy-source-v1", missionId: "author", lineageId: "lineage:author", maxActivationAttempts: 2, maxCandidateReplacements: 1 });
  const rule = { path: join(import.meta.dir, "../../synthetic/activation.json"), sha256: activation.ref.sha256, version: "1", provenance: "synthetic", kind: "rule" as const, approvedForBlind: false };
  const frozen = { version: "fixture", fingerprint: sha, leadsFingerprint: sha, files: [] };
  const template: GraphExecutionTemplate = { version: "l8-execution-template-v1", settings: { profiles: { A: "author", B: "author", R: "reviewer" }, maxConcurrent: 1, familyTtlEvents: 10, maxAdmissionAttempts: 2, retryDelayMs: 1 },
    workers: [{ workerId: "worker", profile: "author", model: "primary", tools: [], accountId: "account", slots: 1, cpu: 1, gpu: 1, budget: 1, available: true }], accounts: [{ accountId: "account", slots: 1, budget: 1 }] };
  const config: ExecutionMissionSnapshotV1["config"] = { schemaVersion: 1, missionId: "author", binary, fixture: true,
    evaluation: { method: "synthetic", version: "1", maxDifficulty: 1 }, maxCycles: 2, stagnationLimit: 1, subsetSize: 1,
    models, knowledge: frozen, commonInputs: [rule], accessibleRules: [rule.path], requiredTools: [], outputDirectory: join(import.meta.dir, "../../synthetic/out"),
    retryPolicy: { maxAttempts: 2, retryDelayMs: 1, fixtureSynthetic: true } };
  const mission: ExecutionMissionSnapshotV1 = { schemaVersion: 1, missionId: "author", revision: 0, config, status: "running", cycle: 1, stage: "analyse", noProgressCycles: 0,
    candidates: [], cycles: [{ number: 1, knowledge: frozen, subset: [], frozen: true, groups: [] }], intents: [], reconciliations: [],
    ...(options.failureCause ? { failureHistory: [{ operation: "inspect" as const, at: 0, cause: { label: "synthetic", nested: [null, { values: [false, 1, "é"] }] } }] } : {}) };
  const spec: GraphExecutionSource = { version: "l8-execution-source-v1", templateFingerprint: digest(template), models, binary, outputDirectory: config.outputDirectory, rePolicy: null };
  const inputs: GraphInputSource = { version: "l8-input-source-v1", commonInputs: [rule], cycleKnowledge: frozen, inputsByFunction: {}, accessibleRules: [rule.path], requiredTools: [], publicationsByFunction: {}, proposalPolicy: "exact-validated-same-function-A+B-v1" };
  const context: AdmissionBudgetContextV1 = { version: "planner-admission-context-v1", missionId: "author", snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint,
    partitionId: transport.partition.partitionId, knowledgeRevision, missionConfigFingerprint: digest(config), executionSpecFingerprint: digest(spec), inputManifestFingerprint: digest(inputs), admissionCodecVersion: "l8-fixture-admission-codec-v2", cycle: 1, budgetEpoch: 1 };
  const policy: PlannerPolicy = { version: "complete-admission-cap-v1:author", estimationVersion: "fixture", partitionId: context.partitionId, investigationKind: "structural", artifactKind: "structural_fact", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 100000, totalContextBudgetUtf8Bytes: 300000, maxSelectedUnits: options.cap === undefined ? 0 : 1, sccMaxFunctions: 8, sccMaxIterations: 2, sccCostBudget: 100,
    requirementsByFunction: {}, estimatesByFunction: {}, resourcesByFunction: {}, admissionBudgetMode: "complete-admission-cap-v1" };
  if (options.cap !== undefined) policy.admissionBudget = stamped<Omit<AdmissionBudgetInputV1, "fingerprint">>({ version: "complete-admission-cap-v1", scope: "one-immutable-run", executionProfile: "one-execution-per-subintent-v1", context,
    capsByFunction: { [functionId]: { completeBodyMaxUtf8Bytes: { known: true, value: options.cap }, maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } } } });
  const unitId = `unit:${digest({ investigationKind: "structural", functionIds: [functionId] })}`;
  const prefix = `sub:${digest({ unitId, functionId })}`;
  const unit: PlannerResult["units"][number] = { schemaVersion: 1, unitId, snapshotId: snapshot.snapshotId, partitionId: context.partitionId, knowledgeRevision,
    ownedFunctionIds: [functionId], contextFunctionIds: [], investigationKind: "structural", pipeline: "2+1", estimatedCost: { known: false, value: null }, requiredPublicationLevel: 1, state: "PENDING",
    subIntents: (["A", "B", "R"] as const).map(role => ({ subIntentId: `${prefix}:${role}`, functionId, role, harnessIdentity: { sha256: sha, version: binary.version, ea: node.ea }, waitsForSubIntentIds: role === "R" ? [`${prefix}:A`, `${prefix}:B`] : [], sharesFamilyLease: true, outputDisjoint: true })), prerequisites: [], conflicts: [] };
  const structuralBytes = Buffer.byteLength(canonical({ snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, policyVersion: policy.version, unit, functions: [node], requirements: [], dispensations: [] }));
  const cap = options.cap === undefined ? { known: false, value: null } : { known: true, value: Math.max(options.cap, structuralBytes) };
  const planId = `plan:${digest({ snapshot: snapshot.normalizedFingerprint, policy, families: [[functionId]], relationViewVersion: "planner-relations-v1", relationPolicyVersion: "planner-relation-policy-v2", admissionAccountingVersion: "planner-admission-accounting-v1", admissionBudgetContext: context })}`;
  const plan: PlannerResult["plan"] = stamped({ schemaVersion: 1, planId, missionId: "author", snapshotId: snapshot.snapshotId, partitionId: context.partitionId, knowledgeRevision,
    units: [{ unitId, ownedFunctionIds: [functionId], contextFunctionIds: [], requiredPublicationLevel: 1, state: "PENDING", contextEnvelopeUtf8Bytes: cap }], prerequisites: [], g1Edges: [], g2Conflicts: [], g3Affinities: [], sccs: [], selectedUnitIds: options.cap === undefined ? [] : [unitId], decisions: [{ id: "decision:author", unitId, action: options.cap === undefined ? "defer" : "include", reason: "Synthetic explicit admission accounting" }],
    budgets: { unit: "utf8-bytes", contextEnvelopeMaxUtf8Bytes: policy.contextEnvelopeMaxUtf8Bytes, countsSqliteLength: false, nativeLineCharLimit: 2000 }, policyVersion: policy.version, estimationVersion: policy.estimationVersion });
  const sidecar: PlannerResult["sidecar"] = stamped({ schemaVersion: 1, policyVersion: policy.version, estimationVersion: policy.estimationVersion, planId,
    planFingerprint: plan.fingerprint, snapshotFingerprint: snapshot.normalizedFingerprint, knowledgeRevision, policy,
    relationView: { version: "planner-relations-v1", relations: [] }, requirementById: {}, dispensationById: {}, externalReceiptById: {}, localOrders: { [unitId]: { sccIds: [], functionIds: [functionId], recursive: false, maxIterations: 1, publication: "whole-unit-only" } },
    estimatesByUnit: { [unitId]: { version: policy.estimationVersion, cost: { known: false, value: null }, modelCosts: {} } }, resourcesByUnit: {}, envelopeBytesByUnit: cap.known ? { [unitId]: cap.value! } : {}, unitFingerprints: { [unitId]: digest(Object.fromEntries(Object.entries(unit).filter(([key]) => key !== "state"))) }, diagnostics: [],
    admissionBudget: { version: "planner-admission-accounting-v1", context, allocationFingerprint: policy.admissionBudget?.fingerprint ?? null, byUnit: { [unitId]: { structuralEnvelopeUtf8Bytes: structuralBytes, admissionCapUtf8Bytes: cap, maxNewExecutions: { known: true, value: 3 }, totalAdmissionUtf8Bytes: cap.known ? { known: true, value: cap.value! * 3 } : { known: false, value: null } } }, selectedTotalAdmissionUtf8Bytes: cap.known ? cap.value! * 3 : 0 } });
  const planning: PlannerResult = { plan, units: [unit], sidecar, diagnostics: [], binding: stamped({ schemaVersion: 1, planFingerprint: plan.fingerprint, sidecarFingerprint: sidecar.fingerprint }) };
  const groupingConfig: GroupConfig = { version: "heuristic-group-cost-v1", minSize: 1, maxSize: 8, maxContextFunctions: 64, smallPolicy: "preserve-community", costSource: "instructions", costPerUnit: 1, fixedCost: 1 };
  const projectionFingerprint = digest({ version: "group-adjacency-v2", numericBinding: null, nodes: [functionId], adjacency: [[functionId, []]] });
  const hubSetFingerprint = digest([]);
  const contextBinding: GroupMetrics["contextBinding"] = { version: "group-context-binding-v1", projectionSource: "raw-active-control-relations", projectionFingerprint, hubSetFingerprint,
    bindingFingerprint: digest({ version: "group-context-binding-v1", projectionSource: "raw-active-control-relations", projectionFingerprint, hubSetFingerprint, snapshotFingerprint: snapshot.normalizedFingerprint, partitionId: context.partitionId, configFingerprint: digest(groupingConfig) }) };
  const metrics: GroupMetrics = { version: "group-metrics-v1", configFingerprint: digest(groupingConfig), partitionId: context.partitionId, snapshotFingerprint: snapshot.normalizedFingerprint,
    ownerByFunctionId: { [functionId]: "group:author" }, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: { "group:author": [communityId] }, kernelIdsByGroupId: { "group:author": [functionId] }, contextIdListUtf8BytesByGroupId: { "group:author": 2 },
    omittedContextIdsByGroupId: { "group:author": [] }, omittedCommunityContextIds: { [communityId]: [] }, allCapabilityIdsByGroupId: { "group:author": [] }, smallGroupIds: [], isolatedIds: [functionId], hubIds: [], nonCoveredIds: [], coverageStatus: "complete", contextBinding,
    contentFingerprintByGroupId: { "group:author": digest({ version: "group-artifact-content-v1", contextBinding, group: transport.groups[0], sourceCommunities: [communityId], allCapabilityIds: [], omittedContextIds: [], omittedCommunityContextIds: [[communityId, []]] }) }, diagnostics: [] };
  const groupsRef = { kind: "l8-groups-value-v1", codec: "l8-json-c14n-v1" as const, sha256: valueDigest("l8-groups-value-v1", transport.groups) };
  const groupSource: GroupSourceV1 = { groupsRef, groupingConfig: document("l8-grouping-config-source-v1", groupingConfig), groupingMetrics: document("group-metrics-v1", metrics),
    communityBinding: document("l8-community-binding-v1", { version: "l8-community-binding-v1", groups: [{ groupId: "group:author", communityContentId: communityId, kernelIds: [functionId], parentContentIds: [], capabilityIds: [], memberMaturity: [{ functionId, semanticMaturity: "none" }] }] }),
    fullContextByGroup: document("l8-full-context-by-group-v1", { version: "l8-full-context-by-group-v1", groups: [{ groupId: "group:author", functionIds: [functionId], nodes: snapshot.nodes, edges: [], objects: [], unresolved: [], capabilities: [] }] }),
    contextOmissions: document("l8-context-omissions-v1", { version: "l8-context-omissions-v1", byGroup: [{ groupId: "group:author", functionIds: [] }], byCommunity: [{ communityContentId: communityId, functionIds: [] }] }) };
  return completeFixture({ snapshot, fullGraphSnapshot, transport, activation, frozen, template, spec, inputs, mission, context, policy, planning, groupingConfig, groupSource, model }, options.rootCap ?? options.cap);
}
function completeFixture(p: { snapshot: GraphSnapshotV1; fullGraphSnapshot: BoundDocument<GraphSnapshotV1>; transport: MutableFixture<PreparedGraphTransportV3>;
  activation: BoundDocument<{ version: string; missionId: string; lineageId: string; maxActivationAttempts: number; maxCandidateReplacements: number }>;
  frozen: ExecutionMissionSnapshotV1["config"]["knowledge"]; template: GraphExecutionTemplate; spec: GraphExecutionSource; inputs: GraphInputSource;
  mission: ExecutionMissionSnapshotV1; context: AdmissionBudgetContextV1; policy: PlannerPolicy; planning: PlannerResult;
  groupingConfig: GroupConfig; groupSource: GroupSourceV1; model: ModelRef }, rootCap?: number): AuthorFixture {
  const paths: Record<keyof ContractPinsV1, string> = {
    envelopeCodec: "src/graph-execution-envelope.ts", fullSnapshotSchema: "schemas/graph-snapshot-v1.schema.json", fullSnapshotModule: "src/graph.ts", proposalCodec: "src/graph-transport.ts", plannerCodec: "src/planner.ts",
    inputCodec: "src/graph-pure-codecs.ts", admissionCodec: "src/graph-pure-codecs.ts", preparedTransportSchema: "schemas/l8-prepared-graph-v3.schema.json", adoptionTransportSchema: "schemas/l8-partition-adoption-v1.schema.json",
    domainModule: "src/domain.ts", validationModule: "src/validation.ts", plannerDerivedCodec: "src/planner-derived-codecs.ts", functionOrderCodec: "src/function-order.ts", plannerRelationCodec: "src/planner-relation-codecs.ts", sparseGraphCodec: "src/sparse-graph-codecs.ts", groupContextCodec: "src/group-context-codecs.ts",
    lineagePureCodec: "src/lineage-pure-codecs.ts", graphPersistenceErrorsCodec: "src/graph-persistence-errors.ts", rePolicyCodec: "src/re-policy.ts", transportCodec: "src/graph-transport.ts", bProjectionCodec: "src/graph-b-projection.ts", clusterTypesModule: "src/cluster.ts", groupTypesModule: "src/investigation-groups.ts",
    envelopeSchema: "schemas/l8-execution-envelope-v1.schema.json", clusterPartitionSchema: "schemas/cluster-partition-v1.schema.json", workUnitSchema: "schemas/work-unit-v1.schema.json", knowledgeCommitSchema: "schemas/knowledge-commit-v1.schema.json", missionPlanSchema: "schemas/mission-plan-v1.schema.json", investigationGroupSchema: "schemas/investigation-group-v1.schema.json",
  };
  const codecBytes = new Map<string, { ref: ByteRef; base64: string }>();
  const entries = Object.entries(paths).map(([key, path]) => {
    const bytes = readFileSync(join(import.meta.dir, "../..", path));
    const schema = path.endsWith(".json");
    const ref: ByteRef = { kind: schema ? "json-schema-source-v1" : "typescript-source-v1", encoding: schema ? "utf8-json-v1" : "raw-v1", byteLength: bytes.length, sha256: rawHash(bytes) };
    codecBytes.set(canonical(ref), { ref, base64: bytes.toString("base64") });
    return [key, ref];
  });
  const pins = Object.fromEntries(entries) as ContractPinsV1;
  const template = document("l8-execution-template-v1", p.template);
  const spec = document("l8-execution-source-v1", p.spec);
  const planning = document("l8-planning-source-v1", p.planning);
  const planningPolicy = document("l8-planning-policy-source-v1", p.policy);
  const mission = document("l8-source-mission-snapshot-v1", p.mission);
  const allocation = document("l8-admission-allocation-source-v1", p.policy.admissionBudget ?? null);
  const rootAccountId = valueDigest("l8-budget-root-v1", { missionId: "author", lineageId: "lineage:author", rootAllocationRef: allocation.ref });
  const grants: RootSlotGrantsV1 = { version: "l8-root-slot-grants-v1", missionId: "author", lineageId: "lineage:author", rootAccountId,
    rootAllocationRef: allocation.ref, sourceSnapshotRef: p.fullGraphSnapshot.ref, sourcePlanningRef: planning.ref, sourcePolicyRef: planningPolicy.ref,
    grants: rootCap === undefined ? [] : (["A", "B", "R"] as const).map(role => ({ slot: { rootAccountId, functionIdentity: { sha256: sha, version: "fixture-v1", ea: "0x400002" }, role, pass: 1 }, functionId, bodyCapUtf8Bytes: rootCap, reservedDebitUtf8Bytes: rootCap })) };
  const rootModels: RootModelBindingsV1 = { version: "l8-root-model-bindings-v1", missionId: "author", lineageId: "lineage:author", rootAccountId,
    sourceExecutionTemplateRef: template.ref, sourceExecutionSpecRef: spec.ref, bindings: [{ label: "primary", model: p.model }, { label: "alias", model: p.model }],
    roleLabels: { explore: "primary", evaluate: "alias", A: "primary", B: "alias", R: "primary" } };
  const root: RootLimitsV1 = { allocation, contextEnvelopeMaxUtf8Bytes: p.policy.contextEnvelopeMaxUtf8Bytes, totalContextBudgetUtf8Bytes: p.policy.totalContextBudgetUtf8Bytes,
    maxSelectedUnits: p.policy.maxSelectedUnits, executionTemplate: template, rootSlotGrants: document("l8-root-slot-grants-v1", grants), rootModelBindings: document("l8-root-model-bindings-v1", rootModels) };
  const rootLimits = document("l8-root-limits-v1", root);
  const bootstrap = { snapshot: p.fullGraphSnapshot, missionSnapshot: mission, planning, planningPolicy, executionTemplate: template, executionSourceSpec: spec };
  const knowledge = document("l8-knowledge-source-v1", { version: "l8-knowledge-source-v1", missionId: "author", knowledgeRevision: p.snapshot.knowledgeRevision, rootHash: sha, frozen: p.frozen, files: [], facts: [], materializations: [], ledgerRevision: 0, ledgerDigest: sha });
  const approval = document("l8-approval-source-v1", { version: "l8-approval-source-v1", revision: 0, records: [] });
  const inputManifest = { document: document("l8-input-source-v1", p.inputs), files: [{ file: p.inputs.commonInputs[0]!,
    bytes: { ref: { ...p.activation.ref, kind: "l8-artifact-bytes-v1", encoding: "raw-v1" as const }, base64: Buffer.from(p.activation.utf8).toString("base64") } }] };
  const numericVersion = "scaled-binary64-exact-leiden-interval-ppr-v1" as const;
  const numericBinding = digest({ version: numericVersion, weightConvention: "canonical-arcs-v1", projection: { ids: [functionId], arcs: [], out: [[]], incoming: [[]], outDegree: [0], inDegree: [0], totalWeight: 0 }, source: null });
  const numericSource = document("l8-numeric-graph-source-v1", { version: "l8-numeric-graph-source-v1" as const, fullGraphSnapshotRef: p.fullGraphSnapshot.ref, producerModuleRef: pins.clusterTypesModule,
    producerPolicy: document("l8-projection-policy-source-v1", { version: "l8-projection-policy-source-v1" as const, producer: "projectStructural" as const, fullGraphSnapshotRef: p.fullGraphSnapshot.ref, numericPolicyVersion: numericVersion,
      weights: { version: "fixture", direct: 1, tail: 1, indirectHigh: 1, indirectOther: 1, thunk: 1, dispatch: 1, rareData: 1, memoryWeak: 1, memoryWindow: 1, rareObjectMaxUsers: 2, importFactor: 1, utilityFactor: 1, hubThreshold: 1, hubFactor: 1 } }),
    graph: document("sparse-graph-numeric-v1", { version: "sparse-graph-numeric-v1" as const, ids: [functionId], arcs: [], numericPolicy: { version: numericVersion, weightConvention: "canonical-arcs-v1" as const, bindingFingerprint: numericBinding } }), hubIds: [],
    summary: { version: numericVersion, weightConvention: "canonical-arcs-v1" as const, canonicalArcCount: 0, sourceArcCount: 0, retainedSourceArcCount: 0, sourceArcBudget: 1000000, budgetVersion: "numeric-source-arc-budget-v1" as const } });
  const contextSources: PublicContextSourcesV1 = { version: "l8-public-context-sources-v1", partitionContext: numericSource, groupAdjacency: { kind: "raw-active-control-relations" } };
  const body: ExecutionEnvelopeBodyV1 = { version: "l8-execution-envelope-v1", mode: "offline-fixture-v1", missionId: "author", generation: { lineageId: "lineage:author", ordinal: 0, parentGenerationId: null }, contractPins: pins,
    preparedTransport: document("l8-prepared-graph-v3", p.transport), fullGraphSnapshot: p.fullGraphSnapshot, sourceMissionSnapshot: mission, groupSource: p.groupSource, planning,
    admissionSource: { version: "l8-admission-source-v2", admissionCodecVersion: "l8-fixture-admission-codec-v2", cycle: 1, budgetEpoch: 1, executionTemplate: template, executionSourceSpec: spec, inputManifestSource: inputManifest,
      context: p.context, allocation: p.policy.admissionBudget ?? null, sourceFingerprints: { executionTemplate: digest(p.template), executionSourceSpec: digest(p.spec), inputManifest: digest(p.inputs), context: digest(p.context), allocation: p.policy.admissionBudget?.fingerprint ?? null },
      knowledgeSource: knowledge, approvalSource: approval, budgetLineage: { version: "l8-budget-lineage-v1", rootAccountId, rootAllocationRef: allocation.ref, rootLimits, epoch: 1 } },
    activationPolicy: { sourcePolicyRef: p.activation.ref, maxActivationAttempts: 2, maxCandidateReplacements: 1 },
    preparationObservationT0: { observedEventSequence: 0, parentGenerationId: null, headRevision: 0, activePlanRevision: null, sourceMissionRevision: 0, controllerFence: 0, knowledgeRevision: p.snapshot.knowledgeRevision, knowledgeRootHash: sha, knowledgeLedgerRevision: 0, knowledgeLedgerDigest: sha, budgetLedgerRevision: 0, budgetLedgerDigest: sha,
      spentBySlot: [], encumberedBySlot: [], inventoryRevision: null, inventoryDigest: null, partitionStoreDigest: digest(p.transport.partition), authorityRecordRefs: [], proofRecordRefs: [], rootLimitsRef: rootLimits.ref, rootSlotGrantsRef: root.rootSlotGrants!.ref, rootModelBindingsRef: root.rootModelBindings!.ref },
    rootBootstrapSources: bootstrap, planningPolicy, contextSources, adoptionIntent: null,
    ...(p.transport.partition.regime === "B" ? { authorizationKind: "proposal-b-host-fixture-v1" as const,
      sourceRefs: { partitionRef: { kind: "l8-partition-value-v1", codec: "l8-json-c14n-v1" as const, sha256: valueDigest("l8-partition-value-v1", p.transport.partition) }, groupsRef: p.groupSource.groupsRef,
        proposalEvidenceRef: { kind: "l8-proposal-evidence-value-v1", codec: "l8-json-c14n-v1" as const, sha256: valueDigest("l8-proposal-evidence-value-v1", p.transport.proposalEvidence!) },
        lineageRef: { kind: "l8-lineage-value-v1", codec: "l8-json-c14n-v1" as const, sha256: valueDigest("l8-lineage-value-v1", p.transport.proposalEvidence!.result.lineageSidecar) }, partitionStoreDigest: digest(p.transport.partition) } }
      : { authorizationKind: "bootstrap-a-fixture-v1" as const,
        sourceRefs: { partitionRef: { kind: "l8-partition-value-v1", codec: "l8-json-c14n-v1" as const, sha256: valueDigest("l8-partition-value-v1", p.transport.partition) }, groupsRef: p.groupSource.groupsRef, proposalEvidenceRef: null, lineageRef: null, partitionStoreDigest: digest(p.transport.partition) } }) };
  const independent: IndependentlyLoadedSourcesV1 = { fullGraphSnapshot: p.fullGraphSnapshot, sourceMissionSnapshot: mission, executionTemplate: template, executionSourceSpec: spec, inputManifestSource: inputManifest,
    knowledgeSource: knowledge, approvalSource: approval, contractPins: pins, parentEnvelope: null, rootLimits, rootBootstrapSources: bootstrap, planningPolicy, contextSources, groupingConfig: p.groupSource.groupingConfig, codecBytes: [...codecBytes.values()] };
  return { body, independent: structuredClone(independent), policy: structuredClone(p.policy), snapshot: p.snapshot, transport: p.transport, grouping: { groupingConfig: p.groupingConfig, groupingMetrics: decoded(p.groupSource.groupingMetrics), communityBinding: decoded(p.groupSource.communityBinding), fullContextByGroup: decoded(p.groupSource.fullContextByGroup), contextOmissions: decoded(p.groupSource.contextOmissions) } };
}
export function preparation(f: AuthorFixture) {
  const { planning: _planning, ...body } = f.body;
  return body;
}
export function mutateRoot(f: AuthorFixture, edit: (root: RootLimitsV1) => void): void {
  const root = decoded(f.body.admissionSource.budgetLineage.rootLimits); edit(root);
  const bound = document("l8-root-limits-v1", root);
  f.body.admissionSource.budgetLineage.rootLimits = bound;
  f.independent.rootLimits = structuredClone(bound);
  f.body.preparationObservationT0.rootLimitsRef = bound.ref;
  f.body.preparationObservationT0.rootSlotGrantsRef = root.rootSlotGrants?.ref ?? null;
  f.body.preparationObservationT0.rootModelBindingsRef = root.rootModelBindings?.ref ?? null;
}
export function descendant(f: AuthorFixture): void {
  const parent = { ...structuredClone(f.body), fingerprint: valueDigest("l8-execution-envelope-v1", f.body) };
  f.independent.parentEnvelope = document("l8-execution-envelope-v1", parent);
  f.body.generation = { ...f.body.generation, ordinal: 1, parentGenerationId: `l8gen:${parent.fingerprint}` };
  f.body.authorizationKind = "transition-a-fixture-v1";
  f.body.preparationObservationT0.parentGenerationId = f.body.generation.parentGenerationId;
  f.body.preparationObservationT0.headRevision = 1;
}
export function mutateCurrentTemplate(f: AuthorFixture, edit: (template: GraphExecutionTemplate) => void): void {
  const template = decoded(f.body.admissionSource.executionTemplate); edit(template);
  const spec = decoded(f.body.admissionSource.executionSourceSpec); spec.templateFingerprint = digest(template);
  f.body.admissionSource.executionTemplate = document("l8-execution-template-v1", template);
  f.body.admissionSource.executionSourceSpec = document("l8-execution-source-v1", spec);
  f.independent.executionTemplate = structuredClone(f.body.admissionSource.executionTemplate);
  f.independent.executionSourceSpec = structuredClone(f.body.admissionSource.executionSourceSpec);
  f.body.admissionSource.sourceFingerprints.executionTemplate = digest(template);
  f.body.admissionSource.sourceFingerprints.executionSourceSpec = digest(spec);
  f.body.admissionSource.context.executionSpecFingerprint = digest(spec);
  f.body.admissionSource.sourceFingerprints.context = digest(f.body.admissionSource.context);
}

export function knowledgeFixture(options: { attested?: boolean; authors?: boolean } = {}): AuthorFixture {
  const f = fixture({ knowledgeRevision: 1 }), historical = fixture();
  const planning = decoded(historical.body.planning), unit = planning.units[0]!;
  const identity = unit.subIntents[0]!.harnessIdentity;
  const evidence = [{ id: "fixture-evidence", source: "synthetic author test, not native evidence", sha256: sha, detail: "Data-only provenance join witness" }];
  const conclusion = { text: "Synthetic retained knowledge", evidence };
  const model: ModelRef = { providerID: "fixture", id: "historical-not-current", variant: "test" };
  const authority: ParentAuthorityIdentity = { version: 1, role: "parent", missionId: "author", controllerOwner: "fixture-owner", principalId: "fixture-principal", actorId: "parent:fixture", source: "synthetic", sourceHash: sha };
  const results: ResultProvenanceV1[] = unit.subIntents.map((sub, index) => {
    const role = sub.role as "A" | "B" | "R";
    const base = { schemaVersion: 1 as const, missionId: "author", taskId: `task:${role}`, attemptId: `attempt:${role}`, executionId: `execution:${role}`, cycle: 1, authorId: `author:${role}`, inputFingerprint: sha, inputVersions: [], previousResultIds: [], identity };
    const result: WorkerResult = role === "R" ? { ...base, kind: "reconciliation", decision: "certain", propositions: [], contradictions: [], questions: [], conclusion }
      : { ...base, kind: "proposal", role, propositions: [] };
    const content = canonical(result);
    const stored: StoredResult = { resultId: `result:${role}`, path: join(import.meta.dir, `../../synthetic/${role}.json`), sha256: rawHash(content), authorId: base.authorId, executionId: base.executionId,
      sessionId: `session:${role}`, effectiveModel: model, content, document: result };
    const requestDigest = String(index + 1).repeat(64);
    const admission: HistoricalAdmissionDataV1 = { version: "l8-historical-admission-data-v1", missionId: "author", unitId: unit.unitId, executionId: base.executionId, subIntentId: sub.subIntentId,
      familyToken: 7, requestDigest, command: { profile: role === "R" ? "historical-reviewer" : "historical-author", model },
      receiptIdentity: { executionId: base.executionId, requestDigest, nativeSessionId: stored.sessionId, authorId: stored.authorId } };
    const author: NativeAuthorIdentity = { version: 1, missionId: "author", executionId: base.executionId, requestDigest, authorId: stored.authorId, sessionId: stored.sessionId,
      profile: admission.command.profile, model, fresh: true, parentSessionId: null, source: "synthetic-not-native", sourceHash: sha };
    const consumeAuthor = options.authors ?? options.attested ?? false;
    return { subIntentId: sub.subIntentId, stored: document("l8-stored-result-data-v1", stored), retained: document("l8-retained-result-data-v1", { resultId: stored.resultId, executionId: stored.executionId, token: 7, document: result, eligible: true, source: "artifact" as const }),
      nativeAuthor: consumeAuthor ? document("l8-native-author-data-v1", author) : null,
      historicalAdmission: consumeAuthor ? document("l8-historical-admission-data-v1", admission) : null };
  });
  const ids = results.map(r => decoded(r.stored).resultId);
  const attestationBody: Omit<ParentAttestation, "attestationId"> = { version: 1, missionId: "author", unitId: unit.unitId, familyToken: 7, controllerToken: 9, parentActorId: authority.actorId, parentAuthorityDigest: digest(authority),
    bindingFingerprint: planning.binding.fingerprint, planFingerprint: planning.plan.fingerprint, snapshotId: unit.snapshotId, snapshotFingerprint: planning.sidecar.snapshotFingerprint, partitionId: unit.partitionId, knowledgeRevision: unit.knowledgeRevision,
    resultIds: ids, resultDigests: Object.fromEntries(results.map(r => { const stored = decoded(r.stored); return [stored.resultId, digest(stored.document)]; })),
    authorDigests: Object.fromEntries(results.filter(r => r.nativeAuthor !== null).map(r => [decoded(r.stored).executionId, digest(decoded(r.nativeAuthor!))])), evidenceDigest: digest(evidence), validatedFactIds: [ids[2]!],
    checks: [{ id: "fixture-check", kind: "synthetic-data-only", outcome: "pass", evidenceDigest: digest(evidence), detail: "Not a native or scientific acceptance witness" }] };
  const attestation = options.attested ? { ...attestationBody, attestationId: digest(attestationBody) } : null;
  const pendingBody: Omit<KnowledgeCommit, "commitId"> = { schemaVersion: 1, inputRevision: 0, outputRevision: 1, unitId: unit.unitId, resultIds: ids, validatedFactIds: [ids[2]!], evidence,
    publicationLevel: options.attested ? 2 : 1, publicationTargetId: "target:synthetic", readbackStatus: "pending", readbackHash: "d".repeat(64), futurePrerequisiteEffect: "does_not_satisfy", isGitCommit: false };
  const pending: KnowledgeCommit = { ...pendingBody, commitId: digest(pendingBody) };
  const requestDigest = digest(pending);
  const finalBody: Omit<KnowledgeCommit, "commitId"> = { ...pendingBody, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
  const commit: KnowledgeCommit = { ...finalBody, commitId: digest(finalBody) };
  const stored = decoded(results[2]!.stored);
  const file = { path: stored.path, sha256: stored.sha256, version: "1", provenance: "synthetic retained historical result", kind: "knowledge" as const, approvedForBlind: false, identity };
  const fact: ValidatedFact = { schemaVersion: 1, resultId: stored.resultId, identity, inputVersions: [], resultHash: digest(stored.document), publicationReceipt: { idempotencyKey: "publication:fixture", targetId: pending.publicationTargetId, revision: 1, resultHash: digest(stored.document) }, conclusion,
    file, content: stored.content, materialization: "verified" };
  const binding: ArtifactBinding = { version: 1, missionId: "author", producerUnitId: unit.unitId, commitId: commit.commitId, artifactId: "artifact:fixture", artifactSha256: file.sha256, functionId, moduleSha256: sha,
    artifactKind: "structural_fact", knowledgeRevision: 1, publicationLevel: commit.publicationLevel, validation: options.attested ? "parent-validated" : "fixture-only", materialization: "stored-result", content: stored.content,
    sources: [{ resultId: stored.resultId, executionId: stored.executionId, subIntentId: results[2]!.subIntentId, digest: digest(stored.document) }], evidenceDigest: digest(evidence), parentAuthorityDigest: digest(authority), parentActorId: authority.actorId, parentAttestationId: attestation?.attestationId ?? null };
  const materializationReadback = document("l8-materialization-readback-data-v1", { sha256: file.sha256 });
  const validation: WholeUnitValidationDataV1 = { token: 7, resultIds: ids, validation: { evidence, validatedFactIds: [stored.resultId], source: "artifact", parentValidated: !!attestation, ...(attestation ? { parentAttestationId: attestation.attestationId } : {}) } };
  const provenance: KnowledgeProvenanceV1 = { version: "l8-knowledge-provenance-v1", producerUnit: document("work-unit-v1", unit), producerPlanning: historical.body.planning, results,
    wholeUnitValidation: document("l8-whole-unit-validation-data-v1", validation), pendingPublication: document("knowledge-commit-v1", pending),
    publicationEffect: document("l8-publication-effect-data-v1", { version: 1, missionId: "author", unitId: unit.unitId, token: 7, requestDigest, verifiedEffect: "satisfies" }),
    publicationReadback: document("l8-publication-readback-data-v1", { targetId: pending.publicationTargetId, hash: pending.readbackHash, requestDigest, source: "synthetic retained receipt" }), materializationReadback,
    parentAuthority: document("l8-parent-authority-data-v1", authority), parentAttestation: attestation ? document("l8-parent-attestation-data-v1", attestation) : null };
  const materialization: KnowledgeMaterializationV1 = { fileSha256: file.sha256, filePath: file.path, resultId: stored.resultId, producer: { authorId: stored.authorId, executionId: stored.executionId, sessionId: stored.sessionId, model },
    validation: options.attested ? "parent-validated" : "fixture-only", revoked: false, revocationRef: null, binding: document("l8-artifact-binding-v1", binding), commit: document("knowledge-commit-v1", commit), result: results[2]!.stored,
    readback: { status: "verified", sha256: file.sha256, recordRef: materializationReadback.ref }, provenance: document("l8-knowledge-provenance-v1", provenance) };
  const knowledge = decoded(f.body.admissionSource.knowledgeSource);
  knowledge.files = [{ file, bytes: { ref: { kind: "l8-artifact-bytes-v1", encoding: "raw-v1", byteLength: Buffer.byteLength(stored.content), sha256: file.sha256 }, base64: Buffer.from(stored.content).toString("base64") } }];
  knowledge.frozen.files = [file]; knowledge.facts = [fact]; knowledge.materializations = [materialization];
  refreshKnowledge(f, knowledge);
  return f;
}

export function refreshKnowledge(f: AuthorFixture, knowledge: KnowledgeSourceV1): void {
  f.body.admissionSource.knowledgeSource = document("l8-knowledge-source-v1", knowledge);
  f.independent.knowledgeSource = structuredClone(f.body.admissionSource.knowledgeSource);
  const mission = decoded(f.body.sourceMissionSnapshot);
  mission.config.knowledge = structuredClone(knowledge.frozen); mission.cycles[0]!.knowledge = structuredClone(knowledge.frozen);
  f.body.sourceMissionSnapshot = document("l8-source-mission-snapshot-v1", mission);
  f.independent.sourceMissionSnapshot = structuredClone(f.body.sourceMissionSnapshot);
  const input = decoded(f.body.admissionSource.inputManifestSource.document); input.cycleKnowledge = structuredClone(knowledge.frozen);
  f.body.admissionSource.inputManifestSource.document = document("l8-input-source-v1", input);
  f.independent.inputManifestSource = structuredClone(f.body.admissionSource.inputManifestSource);
  const context = f.body.admissionSource.context;
  context.missionConfigFingerprint = digest(mission.config); context.inputManifestFingerprint = digest(input);
  f.body.admissionSource.sourceFingerprints.inputManifest = digest(input);
  f.body.admissionSource.sourceFingerprints.context = digest(context);
  f.body.preparationObservationT0.knowledgeRevision = knowledge.knowledgeRevision;
  f.body.preparationObservationT0.knowledgeRootHash = knowledge.rootHash;
  f.body.preparationObservationT0.knowledgeLedgerRevision = knowledge.ledgerRevision;
  f.body.preparationObservationT0.knowledgeLedgerDigest = knowledge.ledgerDigest;
  const planning = decoded(f.body.planning);
  const planId = `plan:${digest({ snapshot: f.snapshot.normalizedFingerprint, policy: f.policy, families: planning.units.map(u => u.ownedFunctionIds), relationViewVersion: "planner-relations-v1", relationPolicyVersion: "planner-relation-policy-v2", admissionAccountingVersion: "planner-admission-accounting-v1", admissionBudgetContext: context })}`;
  const { fingerprint: _plan, ...plan } = planning.plan;
  planning.plan = stamped({ ...plan, planId });
  const { fingerprint: _sidecar, ...sidecar } = planning.sidecar;
  sidecar.planId = planId; sidecar.planFingerprint = planning.plan.fingerprint;
  sidecar.admissionBudget!.context = structuredClone(context);
  planning.sidecar = stamped(sidecar);
  planning.binding = stamped({ schemaVersion: 1, planFingerprint: planning.plan.fingerprint, sidecarFingerprint: planning.sidecar.fingerprint });
  f.body.planning = document("l8-planning-source-v1", planning);
  f.body.rootBootstrapSources!.planning = f.body.planning;
  f.body.rootBootstrapSources!.missionSnapshot = f.body.sourceMissionSnapshot;
  f.independent.rootBootstrapSources = structuredClone(f.body.rootBootstrapSources);
  mutateRoot(f, root => { const grants = decoded(root.rootSlotGrants!); grants.sourcePlanningRef = f.body.planning.ref; root.rootSlotGrants = document("l8-root-slot-grants-v1", grants); });
}

export function mutateProvenance(f: AuthorFixture, edit: (p: KnowledgeProvenanceV1, m: KnowledgeMaterializationV1) => void,
  repairAttestation = false): void {
  const knowledge = decoded(f.body.admissionSource.knowledgeSource), materialization = knowledge.materializations[0]!;
  const provenance = decoded(materialization.provenance!); edit(provenance, materialization);
  if (repairAttestation && provenance.parentAttestation !== null) {
    const previous = decoded(provenance.parentAttestation);
    previous.authorDigests = Object.fromEntries(provenance.results.filter(r => r.nativeAuthor !== null).map(r => [decoded(r.stored).executionId, digest(decoded(r.nativeAuthor!))]));
    previous.resultDigests = Object.fromEntries(provenance.results.map(r => { const stored = decoded(r.stored); return [stored.resultId, digest(stored.document)]; }));
    const { attestationId: _id, ...content } = previous;
    const attestation = { ...content, attestationId: digest(content) };
    provenance.parentAttestation = document("l8-parent-attestation-data-v1", attestation);
    const validation = decoded(provenance.wholeUnitValidation); validation.validation.parentAttestationId = attestation.attestationId;
    provenance.wholeUnitValidation = document("l8-whole-unit-validation-data-v1", validation);
    const binding = decoded(materialization.binding); binding.parentAttestationId = attestation.attestationId;
    materialization.binding = document("l8-artifact-binding-v1", binding);
  }
  materialization.provenance = document("l8-knowledge-provenance-v1", provenance);
  refreshKnowledge(f, knowledge);
}

export function changeAdmission(p: KnowledgeProvenanceV1, edit: (a: HistoricalAdmissionDataV1) => void): void {
  const result = p.results[0]!, admission = decoded(result.historicalAdmission!); edit(admission);
  result.historicalAdmission = document("l8-historical-admission-data-v1", admission);
}

export function providedAffinity(f: AuthorFixture): void {
  f.body.contextSources.groupAdjacency = { kind: "provided-affinity", source: structuredClone(f.body.contextSources.partitionContext) };
  f.independent.contextSources = structuredClone(f.body.contextSources);
  const source = decoded(f.body.contextSources.partitionContext), numeric = decoded(source.graph);
  const metrics = f.grouping.groupingMetrics;
  const projectionFingerprint = digest({ version: "group-adjacency-v2", numericBinding: numeric.numericPolicy.bindingFingerprint, nodes: [functionId], adjacency: [[functionId, []]] });
  metrics.contextBinding.projectionSource = "provided-affinity"; metrics.contextBinding.projectionFingerprint = projectionFingerprint;
  metrics.contextBinding.bindingFingerprint = digest({ version: "group-context-binding-v1", projectionSource: "provided-affinity", projectionFingerprint,
    hubSetFingerprint: metrics.contextBinding.hubSetFingerprint, snapshotFingerprint: f.snapshot.normalizedFingerprint, partitionId: f.transport.partition.partitionId, configFingerprint: metrics.configFingerprint });
  const communityId = f.transport.partition.communities[0]!.contentId;
  metrics.contentFingerprintByGroupId["group:author"] = digest({ version: "group-artifact-content-v1", contextBinding: metrics.contextBinding,
    group: f.transport.groups[0], sourceCommunities: [communityId], allCapabilityIds: [], omittedContextIds: [], omittedCommunityContextIds: [[communityId, []]] });
  f.body.groupSource.groupingMetrics = document("group-metrics-v1", metrics);
}
