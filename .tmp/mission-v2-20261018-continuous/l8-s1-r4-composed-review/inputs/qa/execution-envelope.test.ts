/** Independent API-only S1 QA. Runtime UNOBSERVED; see QA_PLAN.md and MANIFEST.json.
 * Target: test/graph-phase2/execution-envelope.test.ts. All paths below target that location.
 * No candidate implementation/schema/DESIGN or foreign QA was consulted.
 */
import { describe, expect, spyOn, test } from "bun:test";
import {
  assertExecutionJsonV1, canonicalExecutionJsonV1, executionValueRefV1,
  makeBoundDocumentV1, makeBoundBytesV1, EXECUTION_DOCUMENT_KINDS_V1 as EXPORTED_K,
  parseExecutionEnvelopeV1, exportExecutionEnvelopeV1, sealExecutionEnvelopeV1,
  bindExecutionPreparationV1, bindExecutionSourcesV1, inspectExecutionEnvelopeV1,
  makeGraphRunV3, parseGraphRunV3, exportGraphRunV3,
} from "../../src/graph-execution-envelope";
import { projectGraphSnapshotViewV1, projectExecutionSourcesForL5V1, projectRegimeBForL5 } from "../../src/graph-b-projection";
import { prepareExecutionV1 } from "../../src/graph-execution-prepare";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { fnId } from "../../src/graph";
import * as clusterProducer from "../../src/cluster";
import { buildInvestigationGroups } from "../../src/investigation-groups";
import * as plannerProducer from "../../src/planner";
import { fingerprint } from "../../src/validation";
import { scientificCommitId } from "../../src/graph-pure-codecs";
import { communityContentId, prefixedId, resolveLineage, proposalEvidenceFingerprint, partitionProposalFingerprint } from "../../src/lineage-pure-codecs";
import { configFingerprint } from "../../src/semantic-config-codec";
import type {
  ByteRef, ValueRef, BoundDocument, CodecResult, ReadonlyData, ContractPinsV1,
  ExecutionEnvelopeBodyV1, ExecutionEnvelopeV1, ExecutionPreparationBodyV1,
  ExecutionMissionSnapshotV1, ParsedExecutionEnvelopeV1, IndependentlyLoadedSourcesV1,
  KnowledgeSourceV1, ApprovalSourceV1, ArtifactBytesV1, RootLimitsV1, GraphRunV3,
} from "../../src/graph-execution-envelope";
import type { DecodedGroupSourceV1 } from "../../src/graph-b-projection";
import type { GraphSnapshotV1, FunctionEdgeV1, Provenance } from "../../src/graph";
import type { GraphSnapshotView, MultiviewConfig } from "../../src/semantic-index";
import type { ClusterPartitionView, ProposalEvidence, LineageAssignment } from "../../src/lineage";
import type { PreparedGraphTransportV3, InvestigationGroupTransportV1 } from "../../src/graph-transport";
import type { GroupConfig, GroupMetrics } from "../../src/investigation-groups";
import type { PlannerPolicy, PlannerResult, AdmissionBudgetInputV1, AdmissionBudgetContextV1 } from "../../src/planner";
import type { ArtifactFile, FrozenKnowledge, GraphExecutionTemplate, GraphExecutionSource, GraphInputSource, ModelRef, StoredResult, ValidatedFact } from "../../src/domain";
import type { ArtifactBinding, KnowledgeCommit } from "../../src/graph-store";

const utf8 = new TextEncoder();
const MODULE = "a".repeat(64);
const MISSION = "s1-independent-qa";
const LINEAGE = "fixture-root-independent-qa";
const IDS = [fnId(MODULE, "0x100"), fnId(MODULE, "0x200"), fnId(MODULE, "0x300")];
const OPAQUE_ROOT = "1".repeat(64), OPAQUE_LEDGER = "2".repeat(64);
const POLICY_PATH = "/s1-qa/activation-policy.json";
// Literal contract data transcribed from the parent API, not obtained from the SUT.
const K = Object.freeze({ envelope: "l8-execution-envelope-v1", run: "l8-graph-run-v3", preparedTransport: "l8-prepared-graph-v3",
  adoption: "l8-partition-adoption-v1", fullGraphSnapshot: "graph-snapshot-v1", sourceMissionSnapshot: "l8-source-mission-snapshot-v1",
  planning: "l8-planning-source-v1", executionTemplate: "l8-execution-template-v1", executionSourceSpec: "l8-execution-source-v1",
  inputManifest: "l8-input-source-v1", knowledge: "l8-knowledge-source-v1", approvals: "l8-approval-source-v1", rootLimits: "l8-root-limits-v1",
  groupingConfig: "l8-grouping-config-source-v1", groupingMetrics: "group-metrics-v1", communityBinding: "l8-community-binding-v1",
  fullContextByGroup: "l8-full-context-by-group-v1", contextOmissions: "l8-context-omissions-v1" });
const sha = (bytes: string | Uint8Array): string => new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
const copy = <T>(value: T): T => structuredClone(value);

// Independent public C1/D oracle, NOT a candidate helper or an upstream fingerprint alias.
// Inputs to this small oracle are the test's own JSON data; hostile objects go directly to the SUT.
function c1(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("oracle only accepts the fixture's JSON scalars");
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(c1).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${c1(Reflect.get(value, key))}`).join(",")}}`;
}
function valueRef(kind: string, value: unknown): ValueRef {
  return { kind, codec: "l8-json-c14n-v1", sha256: sha(c1({ kind, value })) };
}
function byteRef(kind: string, bytes: Uint8Array, encoding: ByteRef["encoding"] = "raw-v1"): ByteRef {
  return { kind, encoding, byteLength: bytes.length, sha256: sha(bytes) };
}
function document<T>(kind: string, value: T, text = c1(value)): BoundDocument<T> {
  return { ref: byteRef(kind, utf8.encode(text), "utf8-json-v1"), utf8: text };
}
function read<T>(doc: BoundDocument<T>): T { return JSON.parse(doc.utf8); }
function rewrite<T>(doc: BoundDocument<T>, edit: (value: T) => void): BoundDocument<T> {
  const value = read(doc); edit(value); return document(doc.ref.kind, value);
}
function rawPin(path: string, byteLength: number, sha256: string): ByteRef {
  return { kind: path, encoding: "raw-v1", byteLength, sha256 };
}
// DATA-ONLY own-codec metadata reconciled by parent R4; this is not loader authority.
const OWN_ENVELOPE_CODEC = rawPin("src/graph-execution-envelope.ts", 79223,
  "a928a96239ed9568544bdef83b5405d0d79d410884eb16a57ee2a91f8db52afe");
function contractPins(): ContractPinsV1 {
  return {
    envelopeCodec: copy(OWN_ENVELOPE_CODEC),
    fullSnapshotSchema: rawPin("schemas/graph-snapshot-v1.schema.json", 47133, "e62f78b47b610e40a701203d4750025161d8ccb787224e650d1fe5b18d7c8bea"),
    fullSnapshotModule: rawPin("src/graph.ts", 36515, "2da7c8778833097b43f23be3e878b352b7d71fc89d3b9daf0aa5478aad96ef6f"),
    proposalCodec: rawPin("src/graph-transport.ts", 22680, "0b81fc928053f8fd602196bbf25500a53373d85a32dd450fa4bcce5643f6e40a"),
    plannerCodec: rawPin("src/planner.ts", 60760, "fd90abe4bf8583d613beef41988d5a63323afdc5083d33ed04659f86cb203b99"),
    inputCodec: rawPin("src/graph-pure-codecs.ts", 46607, "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf"),
    admissionCodec: rawPin("src/graph-pure-codecs.ts", 46607, "7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf"),
    preparedTransportSchema: rawPin("schemas/l8-prepared-graph-v3.schema.json", 104742, "fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9"),
    adoptionTransportSchema: rawPin("schemas/l8-partition-adoption-v1.schema.json", 12396, "c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e"),
  };
}
function blob(file: ArtifactFile, bytes: Uint8Array): ArtifactBytesV1 {
  return { file: copy(file), bytes: { ref: byteRef("fixture-artifact-bytes-v1", bytes), base64: Buffer.from(bytes).toString("base64") } };
}
function ok<T>(result: CodecResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`positive fixture/API failed: ${result.reasons.join(" | ")}`);
  return result.value;
}
function refused<T>(result: CodecResult<T>): void {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("negative unexpectedly accepted");
  expect(result.reasons.length).toBeGreaterThan(0);
}
function envelopeValue(body: ExecutionEnvelopeBodyV1): ExecutionEnvelopeV1 {
  return { ...copy(body), fingerprint: valueRef(K.envelope, body).sha256 };
}
const envelopeBytes = (body: ExecutionEnvelopeBodyV1): Uint8Array => utf8.encode(c1(envelopeValue(body)));
function restamp<T extends { fingerprint: string }>(value: T): void {
  const { fingerprint: _old, ...body } = value; value.fingerprint = fingerprint(body);
}

function provenance(siteRva: string | null = null): Provenance {
  return { moduleSha256: MODULE, siteRva, siteKind: siteRva ? "instruction" : "extractor", xrefType: siteRva ? "code" : "none",
    source: "heap-independent-fixture", sourceVersion: "1", sourceHash: sha("fixture source"), evidenceSha256: sha("fixture evidence") };
}
function snapshot(): GraphSnapshotV1 {
  const nodes: GraphSnapshotV1["nodes"] = IDS.map((id, i) => {
    const rva = `0x${((i + 1) * 256).toString(16).toUpperCase()}`;
    return { schemaVersion: 1, id, moduleSha256: MODULE, rva, ea: `0x${(0x400000 + (i + 1) * 256).toString(16).toUpperCase()}`,
      imageBase: "0x400000", name: `fixture_${i}`, observedDescription: "é 漢 independent fixture", boundaries: [{ ordinal: 0, rva,
        endRvaExclusive: `0x${((i + 1) * 256 + 240).toString(16).toUpperCase()}`, role: "entry" }],
      sizeBytes: { known: true, value: 240 }, instructionCount: { known: true, value: 5 }, basicBlockCount: { known: true, value: 1 },
      functionClass: "internal", status: "observed", semanticMaturity: "structural", analysisRefs: [], byteAgreement: "unknown", admissibleAsOracle: false,
      byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null } };
  });
  const edge = (source: number, destination: number, kind: FunctionEdgeV1["kind"], status: FunctionEdgeV1["status"], count = 1): FunctionEdgeV1 => ({
    schemaVersion: 1, id: "", sourceId: IDS[source]!, destinationId: IDS[destination]!, kind, direction: "source_to_destination",
    sites: Array.from({ length: count }, (_, i) => { const siteRva = `0x${((source + 1) * 256 + i).toString(16).toUpperCase()}`;
      return { siteRva, xrefType: "code", provenance: provenance(siteRva) }; }),
    status, confidence: "high", appearedInRevision: 0, retiredInRevision: status === "invalidated" ? 1 : null,
    schedulerRelevance: kind === "callback_candidate" ? "hypothesis_not_call" : "may_block",
  });
  return buildGraphSnapshot({ missionId: MISSION, snapshotId: "snapshot:heap-s1", artifacts: [{ schemaVersion: 1, artifactId: "binary:qa",
    moduleName: "fixture.exe", contentSha256: MODULE, versionLabel: "qa-v1", format: "PE32", architecture: "x86-32", imageBase: "0x400000",
    idbIdentity: "fixture-only-not-an-idb", sections: [{ name: ".text", rva: "0x100", virtualSize: { known: true, value: 1024 }, characteristics: "RX" },
      { name: ".rdata", rva: "0x800", virtualSize: { known: true, value: 256 }, characteristics: "R" }],
    provenance: provenance(), analysisVersion: "1", extractorVersion: "1" }], nodes,
    edges: [edge(0, 1, "direct_call", "observed", 65), edge(1, 2, "direct_call", "inferred"), edge(2, 0, "tail_jump", "invalidated"),
      edge(2, 2, "direct_call", "validated"), edge(0, 2, "callback_candidate", "observed")],
    objects: [{ schemaVersion: 1, id: "object:fixture", moduleSha256: MODULE, kind: "table", rva: "0x800", name: "fixture_table",
      widthBytes: { known: false, value: null }, provenance: provenance() }],
    unresolved: [{ schemaVersion: 1, id: "unresolved:fixture", fromFunctionId: IDS[1]!, siteRva: "0x201", kind: "indirect_call",
      target: "table", referencedObjectId: "object:fixture", fabricatedFunction: false, provenance: provenance("0x201") }],
    capabilities: [{ schemaVersion: 1, id: "capability:fixture", ruleId: "fixture-rule", ruleVersion: "1", subjectKind: "function", subjectId: IDS[0]!,
      capability: "fixture-only", evidence: [{ id: "evidence:fixture", source: "heap", sha256: sha("capability"), detail: "fixture, not native" }],
      confidence: "observed", scope: "direct", hypotheticalRole: null, provenance: provenance() }],
    knowledgeRevision: 1, scopeDescription: "three heap functions, never native evidence",
    coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true },
    toolVersions: { extractor: "fixture", extractorHash: sha("fixture extractor"), normalizer: "fixture" }, configFingerprint: sha("fixture graph config") }).snapshot;
}
// Explicit L4 view from the qualified public type, independent of the candidate projection.
function sourceView(s: GraphSnapshotV1): GraphSnapshotView {
  return { schemaVersion: 1, snapshotId: s.snapshotId, normalizedFingerprint: s.normalizedFingerprint,
    nodes: s.nodes.map(n => ({ id: n.id, moduleSha256: n.moduleSha256, rva: n.rva, name: n.name, observedDescription: n.observedDescription,
      semanticMaturity: n.semanticMaturity, functionClass: n.functionClass })),
    edges: s.edges.map(e => ({ id: e.id, sourceId: e.sourceId, destinationId: e.destinationId, kind: e.kind, status: e.status,
      schedulerRelevance: e.schedulerRelevance, sites: copy(e.sites), confidence: e.confidence, appearedInRevision: e.appearedInRevision, retiredInRevision: e.retiredInRevision })),
    objects: s.objects.map(o => ({ id: o.id, kind: o.kind, name: o.name })),
    unresolved: s.unresolved.map(u => ({ fromFunctionId: u.fromFunctionId, kind: u.kind, referencedObjectId: u.referencedObjectId })),
    capabilities: s.capabilities.map(c => ({ id: c.id, subjectKind: c.subjectKind, subjectId: c.subjectId, capability: c.capability,
      confidence: c.confidence, hypotheticalRole: c.hypotheticalRole })) };
}
const GROUP_CONFIG: GroupConfig = { version: "heuristic-group-cost-v1", minSize: 1, maxSize: 1, maxContextFunctions: 1,
  smallPolicy: "preserve-community", costSource: "instructions", costPerUnit: 1, fixedCost: 1 };
function bData(s: GraphSnapshotV1, negative = false): { partition: ClusterPartitionView & { regime: "B"; adopted: false }; evidence: ProposalEvidence } {
  const config: MultiviewConfig = { rulesetVersion: "ff8-tech-syn-1", synonyms: true, bm25: { k1: 1.2, b: 0.75 }, topK: 10,
    scoreTieDecimals: 9, similarityThreshold: 0.45, maxPostingDf: 48, maxCandidates: 32, hubMinDegree: 8, hysteresis: 0.85,
    views: { structure: true, data: true, lexical: true, embeddings: false, validatedRelations: true, capabilities: true } };
  const cfg = configFingerprint(config, null), algorithm = "multiview-components", algorithmVersion = "2";
  const contentId = communityContentId(algorithm, algorithmVersion, cfg, IDS), contentIds = [contentId];
  const partitionId = prefixedId("part:", { role: "partition", configFingerprint: cfg, snapshotId: s.snapshotId, contentIds });
  const ancestry = resolveLineage(null, { contentId, memberIds: IDS }, [], { algorithm, algorithmVersion, configFingerprint: cfg, hysteresis: config.hysteresis }, new Set(), new Map());
  const partition: ClusterPartitionView & { regime: "B"; adopted: false } = { schemaVersion: 1, partitionId,
    lineageId: prefixedId("lin:p:", { role: "partition-lineage", configFingerprint: cfg, snapshotId: s.snapshotId, contentIds }), parentLineageId: null,
    snapshotId: s.snapshotId, snapshotFingerprint: s.normalizedFingerprint, regime: "B", algorithm, algorithmVersion, configFingerprint: cfg, seed: "none",
    communities: [{ contentId, ...ancestry, memberIds: [...IDS], kernelIds: [...IDS], externalContextIds: [], conductance: { known: false, value: null } }],
    modularity: { known: false, value: null }, maturity: "multiview", adopted: false };
  const lineageSidecar: LineageAssignment["sidecar"] = { version: "l4-lineage-2", partitionId, v1Compatible: true, proposalPass: !negative,
    projectionFingerprint: partitionProposalFingerprint(partition),
    communities: [{ contentId, parentContentIds: [], conductance: { known: false, value: null, numerator: 0, denominator: 0 } }] };
  const body: Omit<ProposalEvidence, "evidenceFingerprint"> = { version: "l4-proposal-evidence-1",
    source: { snapshot: sourceView(s), config, constraints: [], encoderIdentity: null, encoderIdentityStatus: "absent", previous: null },
    result: { partition, lineageSidecar, diagnostics: negative ? [{ code: "fixture-negative-observation", severity: "fail", detail: "preserved negative fixture", functionIds: [IDS[0]!] }] : [],
      constraints: { status: "none", applied: 0, rejected: 0 } } };
  return { partition, evidence: { ...body, evidenceFingerprint: proposalEvidenceFingerprint(body) } };
}
// B is declarative data, NOT a B-as-A call to buildInvestigationGroups. This fixed
// three-node example spells out all adjacency/context facts; it is not a second clustering implementation.
function bGroups(s: GraphSnapshotV1, p: ClusterPartitionView): { groups: InvestigationGroupTransportV1[]; metrics: GroupMetrics } {
  const cfg = fingerprint(GROUP_CONFIG), cid = p.communities[0]!.contentId;
  const adjacency = [[IDS[0], [[IDS[1], 1]]], [IDS[1], [[IDS[0], 1], [IDS[2], 1]]], [IDS[2], [[IDS[1], 1]]]];
  const projectionFingerprint = fingerprint({ version: "group-adjacency-v2", numericBinding: null, nodes: IDS, adjacency });
  const hubSetFingerprint = fingerprint([]);
  const contextBinding: GroupMetrics["contextBinding"] = { version: "group-context-binding-v1", projectionSource: "raw-active-control-relations",
    projectionFingerprint, hubSetFingerprint, bindingFingerprint: fingerprint({ version: "group-context-binding-v1", projectionSource: "raw-active-control-relations",
      projectionFingerprint, hubSetFingerprint, snapshotFingerprint: s.normalizedFingerprint, partitionId: p.partitionId, configFingerprint: cfg }) };
  const metrics: GroupMetrics = { version: "group-metrics-v1", configFingerprint: cfg, partitionId: p.partitionId, snapshotFingerprint: s.normalizedFingerprint,
    ownerByFunctionId: {}, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: {}, kernelIdsByGroupId: {},
    contextIdListUtf8BytesByGroupId: {}, omittedContextIdsByGroupId: {}, omittedCommunityContextIds: { [cid]: [] }, allCapabilityIdsByGroupId: {},
    smallGroupIds: [], isolatedIds: [], hubIds: [], nonCoveredIds: [], coverageStatus: "complete", contextBinding, contentFingerprintByGroupId: {},
    diagnostics: ["context byte metric counts serialized ID list only, not execution envelope", "groupId is logical family identity; L8 content reuse requires contextBinding and per-group contentFingerprint"] };
  const contexts = [[IDS[1]!], [IDS[0]!], [IDS[1]!]], omissions = [[], [IDS[2]!], []];
  const groups: InvestigationGroupTransportV1[] = IDS.map((id, i) => {
    const ownedFunctionIds = [id], sourceCommunities = [cid], uncoveredIds: string[] = [];
    const groupId = fingerprint({ version: GROUP_CONFIG.version, configFingerprint: cfg, partitionId: p.partitionId, sourceCommunities, ownedFunctionIds, uncoveredIds });
    const capabilityIds = i === 0 ? ["capability:fixture"] : [];
    const group: InvestigationGroupTransportV1 = { schemaVersion: 1, groupId, partitionId: p.partitionId, communityContentId: cid, ownedFunctionIds,
      contextFunctionIds: contexts[i]!, capabilityIds, granularity: "function", estimatedCost: { known: true, value: 6 }, uncoveredIds,
      memberMaturity: [{ functionId: id, semanticMaturity: "structural" }] };
    metrics.ownerByFunctionId[id] = groupId; metrics.sourceCommunitiesByGroupId[groupId] = sourceCommunities;
    metrics.kernelIdsByGroupId[groupId] = ownedFunctionIds; metrics.allCapabilityIdsByGroupId[groupId] = capabilityIds;
    metrics.contextIdListUtf8BytesByGroupId[groupId] = utf8.encode(JSON.stringify(contexts[i])).length;
    metrics.omittedContextIdsByGroupId[groupId] = omissions[i]!;
    metrics.contentFingerprintByGroupId[groupId] = fingerprint({ version: "group-artifact-content-v1", contextBinding, group, sourceCommunities,
      allCapabilityIds: capabilityIds, omittedContextIds: omissions[i], omittedCommunityContextIds: [[cid, []]] });
    return group;
  });
  return { groups, metrics };
}
function grouping(s: GraphSnapshotV1, p: ClusterPartitionView, groups: readonly InvestigationGroupTransportV1[], metrics: GroupMetrics): DecodedGroupSourceV1 {
  return { groupingConfig: copy(GROUP_CONFIG), groupingMetrics: copy(metrics),
    communityBinding: { version: "l8-community-binding-v1", groups: groups.map(g => ({ groupId: g.groupId, communityContentId: g.communityContentId,
      kernelIds: copy(metrics.kernelIdsByGroupId[g.groupId]!), parentContentIds: copy(p.communities.find(c => c.contentId === g.communityContentId)!.parentContentIds),
      capabilityIds: copy(metrics.allCapabilityIdsByGroupId[g.groupId]!), memberMaturity: copy(g.memberMaturity) })) },
    fullContextByGroup: { version: "l8-full-context-by-group-v1", groups: groups.map(g => {
      const functionIds = [...new Set([...g.ownedFunctionIds, ...g.contextFunctionIds, ...(metrics.omittedContextIdsByGroupId[g.groupId] ?? []),
        ...(metrics.omittedCommunityContextIds[g.communityContentId] ?? [])])].sort();
      const set = new Set(functionIds), unresolved = s.unresolved.filter(u => set.has(u.fromFunctionId));
      return { groupId: g.groupId, functionIds, nodes: copy(s.nodes.filter(n => set.has(n.id))),
        edges: copy(s.edges.filter(e => set.has(e.sourceId) && set.has(e.destinationId))),
        objects: copy(s.objects.filter(o => unresolved.some(u => u.referencedObjectId === o.id))), unresolved: copy(unresolved),
        capabilities: copy(s.capabilities.filter(c => set.has(c.subjectId))) };
    }) },
    contextOmissions: { version: "l8-context-omissions-v1", byGroup: groups.map(g => ({ groupId: g.groupId, functionIds: copy(metrics.omittedContextIdsByGroupId[g.groupId] ?? []) })),
      byCommunity: p.communities.map(c => ({ communityContentId: c.contentId, functionIds: copy(metrics.omittedCommunityContextIds[c.contentId] ?? []) })) } };
}

function knowledge(enriched: boolean): { source: KnowledgeSourceV1; approvals: ApprovalSourceV1 } {
  const empty: FrozenKnowledge = { version: "fixture-k1", fingerprint: sha("independent legacy frozen knowledge"), leadsFingerprint: sha("independent leads"), files: [] };
  const source: KnowledgeSourceV1 = { version: "l8-knowledge-source-v1", missionId: MISSION, knowledgeRevision: 1,
    rootHash: OPAQUE_ROOT, frozen: empty, files: [], facts: [], materializations: [], ledgerRevision: 1, ledgerDigest: OPAQUE_LEDGER };
  const approvals: ApprovalSourceV1 = { version: "l8-approval-source-v1", revision: 1, records: [] };
  if (!enriched) return { source, approvals };
  const identity = { sha256: MODULE, version: "qa-v1", ea: "0x400100" };
  const evidence = [{ id: "fixture-source-evidence", source: "heap fixture bytes", sha256: sha("independent fixture statement"),
    detail: "Known heap-fixture input; not a native ASM observation or promotion witness" }];
  const conclusion = { text: "fixture-only retained information, not a certain native finding", evidence };
  const resultDocument: StoredResult["document"] = { schemaVersion: 1, missionId: MISSION, taskId: "fixture-task", attemptId: "fixture-attempt", executionId: "fixture-execution",
    cycle: 1, authorId: "fixture-author", inputFingerprint: sha("fixture scientific input"), inputVersions: [], previousResultIds: [], identity,
    kind: "reconciliation", decision: "likely", propositions: [{ id: "fixture-proposition", text: "independent fixture statement", evidence, contradictions: [], questions: [] }],
    contradictions: [], questions: [], conclusion };
  const content = c1(resultDocument), resultSHA = sha(content), resultId = "fixture-result";
  const result: StoredResult = { resultId, path: "/s1-qa/result.json", sha256: resultSHA, authorId: "fixture-author", executionId: "fixture-execution",
    sessionId: "fixture-session", effectiveModel: { providerID: "fixture", id: "independent-result", variant: "high" }, content, document: resultDocument };
  const factContent = content, fileSHA = sha(factContent);
  const file: ArtifactFile = { path: "/s1-qa/knowledge.json", sha256: fileSHA, version: "1", provenance: "fixture-only stored-result materialization; explicit operator approval, not certainty",
    kind: "knowledge", approvedForBlind: true, identity };
  const fact: ValidatedFact = { schemaVersion: 1, resultId, identity, inputVersions: [], resultHash: resultSHA,
    publicationReceipt: { idempotencyKey: "fixture-publication", targetId: "fixture-target", revision: 1, resultHash: resultSHA }, conclusion,
    file, content: factContent, materialization: "verified" };
  const commit: KnowledgeCommit = { schemaVersion: 1, commitId: "", inputRevision: 0, outputRevision: 1, unitId: "fixture-producer-unit", resultIds: [resultId],
    validatedFactIds: [resultId], evidence, publicationLevel: 1, publicationTargetId: "fixture-target", readbackStatus: "verified", readbackHash: fileSHA,
    futurePrerequisiteEffect: "satisfies", isGitCommit: false };
  commit.commitId = scientificCommitId(commit);
  const sources = [{ resultId, executionId: result.executionId, subIntentId: "fixture-producer-R", digest: resultSHA }];
  const binding: ArtifactBinding = { version: 1, missionId: MISSION, artifactId: resultId, artifactSha256: fileSHA, functionId: IDS[0]!, moduleSha256: MODULE,
    artifactKind: "structural_fact", publicationLevel: 1, validation: "fixture-only", knowledgeRevision: 1, producerUnitId: commit.unitId, commitId: commit.commitId,
    materialization: "stored-result", content: factContent, sources, evidenceDigest: fingerprint(commit.evidence), parentAuthorityDigest: sha("fixture authority DATA, not capability"),
    parentActorId: "fixture-parent-label", parentAttestationId: null };
  source.files = [blob(file, utf8.encode(factContent))]; source.facts = [fact];
  source.frozen.files = [copy(file)];
  source.frozen.validatedFacts = [{ schemaVersion: 1, resultId, identity, inputVersions: [], resultHash: resultSHA, publicationReceipt: fact.publicationReceipt, conclusion }];
  source.materializations = [{ fileSha256: fileSHA, filePath: file.path, resultId, producer: { authorId: result.authorId, executionId: result.executionId,
    sessionId: result.sessionId, model: result.effectiveModel }, validation: "fixture-only", revoked: false, revocationRef: null,
    binding: document("fixture-artifact-binding-v1", binding), commit: document("knowledge-commit-v1", commit), result: document("fixture-stored-result-v1", result),
    readback: { status: "verified", sha256: fileSHA, recordRef: document("fixture-readback-record-v1", { resultId, sha256: fileSHA, status: "verified" }).ref } }];
  const record = { approvalId: "fixture-approval", issuerRef: document("fixture-issuer-record-v1", { issuer: "fixture-operator", revision: 1 }).ref,
    authorityRevision: 1, functionIdentity: identity, fileSha256: fileSHA, filePath: file.path, sourceResultIds: [resultId],
    allowedRoles: ["A", "B", "R"] as Array<"A" | "B" | "R">, knowledgeRevision: 1, decision: "approved" as const };
  approvals.records = [{ ...record, recordRef: document("fixture-approval-record-v1", record).ref }];
  return { source, approvals };
}

interface Fixture {
  body: ExecutionEnvelopeBodyV1;
  independent: IndependentlyLoadedSourcesV1;
  snapshot: GraphSnapshotV1;
  transport: PreparedGraphTransportV3;
  grouping: DecodedGroupSourceV1;
  policy: PlannerPolicy;
}
function fixture(regime: "A" | "B", parent?: ReadonlyData<ParsedExecutionEnvelopeV1>, enriched = false, negativeB = false,
  allocationState: "known" | "unknown" | "none" = "known"): Fixture {
  const s = snapshot();
  let transport: PreparedGraphTransportV3, decoded: DecodedGroupSourceV1;
  if (regime === "A") {
    const clustered = clusterProducer.clusterGraph(s, { algorithm: "historical-cc" });
    const g = buildInvestigationGroups(s, clustered.partition, GROUP_CONFIG);
    transport = { schemaVersion: 3, partition: clustered.partition, groups: g.groups };
    decoded = grouping(s, clustered.partition, g.groups, g.metrics);
  } else {
    const b = bData(s, negativeB), g = bGroups(s, b.partition);
    transport = { schemaVersion: 3, partition: b.partition, groups: g.groups, proposalEvidence: b.evidence };
    decoded = grouping(s, b.partition, g.groups, g.metrics);
  }
  const k = knowledge(enriched), activationSource = { version: "l8-activation-policy-source-v1", missionId: MISSION, lineageId: LINEAGE,
    maxActivationAttempts: 2, maxCandidateReplacements: 1 };
  const policyDoc = document("l8-activation-policy-source-v1", activationSource);
  const policyFile: ArtifactFile = { path: POLICY_PATH, sha256: policyDoc.ref.sha256, version: "1", provenance: "fixture operator-selected common rule DATA",
    kind: "rule", approvedForBlind: false };
  const model: ModelRef = { providerID: "fixture", id: "independent-s1", variant: "high" };
  const models = { explore: copy(model), evaluate: copy(model), A: copy(model), B: copy(model), R: copy(model) };
  const template: GraphExecutionTemplate = { version: "l8-execution-template-v1", settings: { profiles: { A: "fixture-A", B: "fixture-B", R: "fixture-R" },
    maxConcurrent: 3, familyTtlEvents: 20, maxAdmissionAttempts: 2, retryDelayMs: 0 },
    workers: ["A", "B", "R"].map(role => ({ workerId: `fixture-${role}`, profile: `fixture-${role}`, model: model.id,
      tools: [], accountId: "fixture-account", slots: 1, cpu: 1, gpu: 0, budget: 1000, available: true })),
    accounts: [{ accountId: "fixture-account", slots: 3, budget: 3000 }] };
  const spec: GraphExecutionSource = { version: "l8-execution-source-v1", templateFingerprint: fingerprint(template), models,
    binary: { sha256: MODULE, version: "qa-v1" }, outputDirectory: "/s1-qa/outputs", rePolicy: null };
  const input: GraphInputSource = { version: "l8-input-source-v1", commonInputs: [copy(policyFile)], cycleKnowledge: copy(k.source.frozen),
    inputsByFunction: Object.fromEntries(IDS.map((id, i) => [id, i === 0 ? copy(k.source.frozen.files) : []])), accessibleRules: [POLICY_PATH], requiredTools: [], publicationsByFunction: {},
    proposalPolicy: "exact-validated-same-function-A+B-v1" };
  const mission: ExecutionMissionSnapshotV1 = { schemaVersion: 1, missionId: MISSION, revision: parent ? 2 : 1, config: { schemaVersion: 1, missionId: MISSION,
    binary: spec.binary, fixture: true, evaluation: { method: "fixture", version: "1", maxDifficulty: 100 }, subsetSize: 3, maxCycles: 3, stagnationLimit: 2,
    models, knowledge: copy(k.source.frozen), commonInputs: [copy(policyFile)], accessibleRules: [POLICY_PATH], requiredTools: [], outputDirectory: spec.outputDirectory,
    retryPolicy: { maxAttempts: 2, retryDelayMs: 0, fixtureSynthetic: true } }, status: "running", cycle: 1, stage: "freeze", candidates: [],
    cycles: [{ number: 1, knowledge: copy(k.source.frozen), subset: [], frozen: true, groups: [] }], intents: [], reconciliations: [], noProgressCycles: 0,
    validatedFacts: copy(k.source.facts) };
  if (parent) {
    const run = ok(makeGraphRunV3(parent));
    mission.cycles[0]!.graph = { version: "l8-frozen-cycle-v3", lineageId: LINEAGE, generationId: parent.generationId,
      envelopeFingerprint: parent.envelope.fingerprint, runFingerprint: run.run.fingerprint, envelopeRef: copy(parent.document.ref), runRef: copy(run.document.ref) };
  }
  const context: AdmissionBudgetContextV1 = { version: "planner-admission-context-v1", missionId: MISSION, snapshotId: s.snapshotId,
    snapshotFingerprint: s.normalizedFingerprint, partitionId: transport.partition.partitionId, knowledgeRevision: 1, missionConfigFingerprint: fingerprint(mission.config),
    executionSpecFingerprint: fingerprint(spec), inputManifestFingerprint: fingerprint(input), admissionCodecVersion: "l8-fixture-admission-codec-v2", cycle: 1, budgetEpoch: 1 };
  const allocation: AdmissionBudgetInputV1 | null = allocationState === "none" ? null : {
    version: "complete-admission-cap-v1", scope: "one-immutable-run", executionProfile: "one-execution-per-subintent-v1", context: copy(context),
    capsByFunction: Object.fromEntries(IDS.map(id => [id, { completeBodyMaxUtf8Bytes: allocationState === "unknown" ? { known: false, value: null } : { known: true, value: 500000 },
      maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } }])), fingerprint: "" };
  if (allocation) restamp(allocation);
  const policy: PlannerPolicy = { version: "complete-admission-cap-v1:qa", estimationVersion: "qa-estimate-v1", partitionId: transport.partition.partitionId,
    investigationKind: "structural", artifactKind: "structural_fact", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 1000000,
    totalContextBudgetUtf8Bytes: 10000000, maxSelectedUnits: 9, sccMaxFunctions: 8, sccMaxIterations: 3, sccCostBudget: 1000, requirementsByFunction: {},
    estimatesByFunction: Object.fromEntries(IDS.map(id => [id, { version: "qa-estimate-v1", A: 1, B: 1, R: 1, validation: 1 }])),
    resourcesByFunction: Object.fromEntries(IDS.map(id => [id, { profiles: ["fixture-A", "fixture-B", "fixture-R"], models: [model.id], tools: [],
      accounts: ["fixture-account"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])), admissionBudgetMode: "complete-admission-cap-v1",
    ...(allocation ? { admissionBudget: copy(allocation) } : {}) };
  // Qualified producer receives the FULL snapshot, not a reduced PlannerNode/view;
  // otherwise its scientific-envelope byte metric would be an invalid baseline.
  const planning = plannerProducer.planMission(s, transport.groups.map(g => ({ groupId: g.groupId, partitionId: g.partitionId,
    ownedFunctionIds: [...g.ownedFunctionIds], contextFunctionIds: [...g.contextFunctionIds] })), policy, context);
  const templateDoc = document(K.executionTemplate, template), specDoc = document(K.executionSourceSpec, spec), inputDoc = document(K.inputManifest, input);
  const rootAllocation = document("l8-root-allocation-v1", allocation);
  const limits: RootLimitsV1 = { allocation: rootAllocation, contextEnvelopeMaxUtf8Bytes: policy.contextEnvelopeMaxUtf8Bytes,
    totalContextBudgetUtf8Bytes: policy.totalContextBudgetUtf8Bytes, maxSelectedUnits: policy.maxSelectedUnits, executionTemplate: templateDoc };
  const rootLimits = parent ? copy(parent.envelope.admissionSource.budgetLineage.rootLimits) : document(K.rootLimits, limits);
  const rootAllocationRef = parent ? copy(parent.envelope.admissionSource.budgetLineage.rootAllocationRef) : rootAllocation.ref;
  const fullDoc = document(K.fullGraphSnapshot, s), missionDoc = document(K.sourceMissionSnapshot, mission), knowledgeDoc = document(K.knowledge, k.source), approvalsDoc = document(K.approvals, k.approvals);
  const groupsRef = valueRef("l8-groups-value-v1", transport.groups), partitionRef = valueRef("l8-partition-value-v1", transport.partition);
  const partitionStoreDigest = fingerprint(transport.partition), inputFiles = [blob(policyFile, utf8.encode(policyDoc.utf8)), ...copy(k.source.files)];
  const common = { version: "l8-execution-envelope-v1" as const, mode: "offline-fixture-v1" as const, missionId: MISSION,
    generation: { lineageId: LINEAGE, ordinal: parent ? parent.envelope.generation.ordinal + 1 : 0, parentGenerationId: parent?.generationId ?? null },
    contractPins: contractPins(), preparedTransport: document(K.preparedTransport, transport), fullGraphSnapshot: fullDoc, sourceMissionSnapshot: missionDoc,
    groupSource: { groupsRef, groupingConfig: document(K.groupingConfig, decoded.groupingConfig), groupingMetrics: document(K.groupingMetrics, decoded.groupingMetrics),
      communityBinding: document(K.communityBinding, decoded.communityBinding), fullContextByGroup: document(K.fullContextByGroup, decoded.fullContextByGroup),
      contextOmissions: document(K.contextOmissions, decoded.contextOmissions) }, planning: document(K.planning, planning),
    admissionSource: { version: "l8-admission-source-v2" as const, admissionCodecVersion: "l8-fixture-admission-codec-v2" as const, cycle: 1, budgetEpoch: 1,
      executionTemplate: templateDoc, executionSourceSpec: specDoc, inputManifestSource: { document: inputDoc, files: inputFiles }, context, allocation,
      sourceFingerprints: { executionTemplate: fingerprint(template), executionSourceSpec: fingerprint(spec), inputManifest: fingerprint(input),
        context: fingerprint(context), allocation: allocation?.fingerprint ?? null }, knowledgeSource: knowledgeDoc, approvalSource: approvalsDoc,
      budgetLineage: { version: "l8-budget-lineage-v1" as const, rootAccountId: valueRef("l8-budget-root-v1", { missionId: MISSION, lineageId: LINEAGE, rootAllocationRef }).sha256,
        rootAllocationRef, rootLimits, epoch: 1 } },
    activationPolicy: { sourcePolicyRef: policyDoc.ref, maxActivationAttempts: activationSource.maxActivationAttempts, maxCandidateReplacements: activationSource.maxCandidateReplacements },
    preparationObservationT0: { observedEventSequence: parent ? 2 : 0, parentGenerationId: parent?.generationId ?? null, headRevision: parent ? 1 : 0,
      activePlanRevision: parent ? 1 : null, sourceMissionRevision: mission.revision, controllerFence: 1, knowledgeRevision: 1, knowledgeRootHash: OPAQUE_ROOT,
      knowledgeLedgerRevision: 1, knowledgeLedgerDigest: OPAQUE_LEDGER, budgetLedgerRevision: 1, budgetLedgerDigest: sha("fixture opaque budget ledger"),
      spentBySlot: null, encumberedBySlot: null, inventoryRevision: null, inventoryDigest: null, partitionStoreDigest, authorityRecordRefs: null, proofRecordRefs: null } };
  const body: ExecutionEnvelopeBodyV1 = regime === "A" ? { ...common, authorizationKind: parent ? "transition-a-fixture-v1" : "bootstrap-a-fixture-v1", adoptionIntent: null,
    sourceRefs: { partitionRef, groupsRef, proposalEvidenceRef: null, lineageRef: null, partitionStoreDigest } } :
    { ...common, authorizationKind: "proposal-b-host-fixture-v1", adoptionIntent: null, sourceRefs: { partitionRef, groupsRef,
      proposalEvidenceRef: valueRef("l8-proposal-evidence-value-v1", transport.proposalEvidence),
      lineageRef: valueRef("l8-lineage-value-v1", transport.proposalEvidence!.result.lineageSidecar), partitionStoreDigest } };
  const independent: IndependentlyLoadedSourcesV1 = { fullGraphSnapshot: copy(fullDoc), sourceMissionSnapshot: copy(missionDoc), executionTemplate: copy(templateDoc),
    executionSourceSpec: copy(specDoc), inputManifestSource: copy(body.admissionSource.inputManifestSource), knowledgeSource: copy(knowledgeDoc), approvalSource: copy(approvalsDoc),
    contractPins: copy(body.contractPins), parentEnvelope: parent ? copy(parent.document) : null };
  return { body, independent, snapshot: s, transport, grouping: decoded, policy };
}

function positive(f: Fixture): ReadonlyData<ParsedExecutionEnvelopeV1> {
  const bytes = envelopeBytes(f.body), before = c1(f);
  const parsed = ok(parseExecutionEnvelopeV1(bytes));
  expect(parsed.envelope.fingerprint).toBe(valueRef(K.envelope, f.body).sha256);
  expect(parsed.generationId).toBe(`l8gen:${parsed.envelope.fingerprint}`);
  expect([...ok(exportExecutionEnvelopeV1(parsed))]).toEqual([...bytes]);
  expect(ok(sealExecutionEnvelopeV1(f.body)).envelope).toEqual(parsed.envelope);
  ok(bindExecutionSourcesV1(parsed, f.independent));
  const inspection = inspectExecutionEnvelopeV1(bytes, f.independent);
  expect(inspection.shape).toBe(true); expect(inspection.coherent).toBe(true);
  expect(inspection.proposalAdmissible).toBe(f.transport.partition.regime === "A" ? null : true);
  expect(inspection.authorityVerified).toBe(false); expect(inspection.activationState).toBe("not-established");
  expect(c1(f)).toBe(before);
  return parsed;
}
function checked(regime: "A" | "B" = "B", enriched = false): { f: Fixture; origin: ReadonlyData<ParsedExecutionEnvelopeV1> } {
  const f = fixture(regime, undefined, enriched); return { f, origin: positive(f) };
}
function semanticRejection(f: Fixture): void {
  // The mutation's envelope/document/upstream fingerprints have already been
  // realigned by the caller. Shape and semantic coherence must remain distinct.
  const inspection = inspectExecutionEnvelopeV1(envelopeBytes(f.body), f.independent);
  expect(inspection.shape).toBe(true); expect(inspection.coherent).toBe(false);
  expect(inspection.authorityVerified).toBe(false); expect(inspection.activationState).toBe("not-established");
  expect(inspection.reasons.length).toBeGreaterThan(0);
}
function tamperPlanning(f: Fixture, edit: (p: PlannerResult) => void): void {
  const p = read(f.body.planning); edit(p); restamp(p.sidecar);
  p.binding.planFingerprint = p.plan.fingerprint; p.binding.sidecarFingerprint = p.sidecar.fingerprint; restamp(p.binding);
  f.body.planning = document(K.planning, p);
  expect(p.sidecar.fingerprint).toBe(fingerprint((({ fingerprint: _f, ...v }) => v)(p.sidecar)));
  expect(p.binding.sidecarFingerprint).toBe(p.sidecar.fingerprint);
}

function preparationBody(f: Fixture): ExecutionPreparationBodyV1 {
  const { planning: _planning, ...body } = copy(f.body); return body;
}
function directRelation(p: PlannerResult): PlannerResult["sidecar"]["relationView"]["relations"][number] {
  const relation = p.sidecar.relationView.relations.find(r => r.sourceId === IDS[0] && r.destinationId === IDS[1] && r.kind === "direct_call");
  if (!relation) throw new Error("positive planner omitted the fixture's 65-site relation");
  return relation;
}

describe("S1 complete, independent positive controls", () => {
  for (const regime of ["A", "B"] as const) {
    test(`${regime}: complete source binding, snapshot retained, immutable origin and run bytes`, () => {
      const { f, origin } = checked(regime);
      const bound = ok(bindExecutionSourcesV1(origin, f.independent));
      expect(bound.snapshot).toEqual(f.snapshot);
      expect(bound.projection.regime).toBe(regime);
      expect(bound.planning).toEqual(read(f.body.planning));
      expect(Object.isFrozen(origin)).toBe(true);
      expect(Object.isFrozen(origin.envelope)).toBe(true);
      expect(Object.isFrozen(bound.snapshot.nodes)).toBe(true);
      const run = ok(makeGraphRunV3(origin)), bytes = ok(exportGraphRunV3(run)), again = ok(parseGraphRunV3(bytes));
      expect([...ok(exportGraphRunV3(again))]).toEqual([...bytes]);
      expect(again.run.envelope).toEqual(origin.document);
      expect(again.run.generationId).toBe(origin.generationId);
      expect(again.run.derivedSpec.envelopeFingerprint).toBe(origin.envelope.fingerprint);
      expect(again.run.derivedSpec.planFingerprint).toBe(bound.planning.plan.fingerprint);
      expect(again.run.derivedSpec.sidecarFingerprint).toBe(bound.planning.sidecar.fingerprint);
      expect(again.run.derivedSpec.bindingFingerprint).toBe(bound.planning.binding.fingerprint);
      expect(again.run.derivedSpec.snapshotId).toBe(f.snapshot.snapshotId);
      expect(again.run.derivedSpec.partitionId).toBe(f.transport.partition.partitionId);
      expect(again.run.derivedSpec.knowledgeRevision).toBe(1);
      expect(again.run.derivedSpec.sourceSpecFingerprint).toBe(f.body.admissionSource.sourceFingerprints.executionSourceSpec);
      expect(again.run.derivedSpec.templateFingerprint).toBe(f.body.admissionSource.sourceFingerprints.executionTemplate);
      expect(again.run.derivedSpec.inputManifestFingerprint).toBe(f.body.admissionSource.sourceFingerprints.inputManifest);
      expect(again.run.derivedSpecFingerprint).toBe(valueRef("l8-execution-derived-v3", again.run.derivedSpec).sha256);
      const { fingerprint: _runFingerprint, ...runBody } = again.run;
      expect(again.run.fingerprint).toBe(valueRef(K.run, runBody).sha256);
      const oldText = origin.document.utf8;
      f.snapshot.nodes[0]!.name = "caller mutation";
      f.independent.fullGraphSnapshot.utf8 = "{}";
      expect(origin.document.utf8).toBe(oldText);
      expect(bound.snapshot.nodes[0]!.name).toBe("fixture_0");
    });
    test(`${regime}: actual materialization, source bytes, explicit blind approval and opaque backend witnesses`, () => {
      const { f } = checked(regime, true);
      const source = read(f.body.admissionSource.knowledgeSource), approvals = read(f.body.admissionSource.approvalSource);
      expect(source.rootHash).toBe(OPAQUE_ROOT); expect(source.ledgerDigest).toBe(OPAQUE_LEDGER);
      expect(source.rootHash).not.toBe(source.frozen.fingerprint);
      const materialization = source.materializations[0]!, fact = source.facts[0]!, bytes = source.files[0]!;
      expect(sha(Buffer.from(bytes.bytes.base64, "base64"))).toBe(fact.file.sha256);
      expect(sha(fact.content)).toBe(fact.file.sha256);
      expect(read(materialization.result).sha256).toBe(fact.resultHash);
      expect(materialization.producer.model).toEqual(read(materialization.result).effectiveModel);
      expect(read(materialization.commit).commitId).toBe(read(materialization.binding).commitId);
      expect(approvals.records[0]!.sourceResultIds).toEqual([fact.resultId]);
      expect(approvals.records[0]!.functionIdentity).toEqual(fact.identity);
      expect(approvals.records[0]!.allowedRoles).toEqual(["A", "B", "R"]);
    });
  }
  test("A bootstrap -> A transition preserves its independently supplied parent and root limits", () => {
    const root = checked("A"), child = fixture("A", root.origin), parsed = positive(child);
    expect(child.body.authorizationKind).toBe("transition-a-fixture-v1");
    expect(parsed.envelope.generation.ordinal).toBe(1);
    expect(parsed.envelope.generation.parentGenerationId).toBe(root.origin.generationId);
    expect(child.body.admissionSource.budgetLineage).toEqual(root.f.body.admissionSource.budgetLineage);
    expect(child.body.activationPolicy).toEqual(root.f.body.activationPolicy);
    expect(root.origin.envelope.generation.ordinal).toBe(0);
    expect(root.origin.envelope.preparationObservationT0.parentGenerationId).toBeNull();
  });
  for (const allocation of ["unknown", "none"] as const) {
    test(`${allocation} allocation is explicit diagnostic data, not executable selection`, () => {
      checked("B");
      const f = fixture("B", undefined, false, false, allocation);
      positive(f);
      expect(read(f.body.planning).plan.selectedUnitIds).toEqual([]);
      expect(inspectExecutionEnvelopeV1(envelopeBytes(f.body), f.independent).authorityVerified).toBe(false);
    });
  }
  test("well-formed, coherent negative B remains inspectable without becoming admissible or authoritative", () => {
    checked("B");
    const f = fixture("B", undefined, false, true, "none"), bytes = envelopeBytes(f.body);
    const parsed = ok(parseExecutionEnvelopeV1(bytes));
    ok(bindExecutionSourcesV1(parsed, f.independent));
    const inspection = inspectExecutionEnvelopeV1(bytes, f.independent);
    expect(inspection.shape).toBe(true); expect(inspection.coherent).toBe(true); expect(inspection.proposalAdmissible).toBe(false);
    expect(inspection.authorityVerified).toBe(false); expect(inspection.activationState).toBe("not-established");
    expect(read(f.body.preparedTransport).proposalEvidence!.result.diagnostics[0]!.severity).toBe("fail");
    expect(read(f.body.planning).plan.selectedUnitIds).toEqual([]);
  });
});

describe("public JSON and byte helpers: independent C1 and raw-byte oracles", () => {
  test("public literal protocol tags match the ratified API rather than a candidate-selected domain", () => {
    checked("A"); expect(EXPORTED_K).toEqual(K);
  });
  test("C1 sorts UTF-16 keys, preserves array order/Unicode and domain-separates ValueRef", () => {
    checked("A");
    const data = { z: [3, 2, 1], a: "é e\u0301 漢", "😀": 0.5, "\uE000": true };
    expect(canonicalExecutionJsonV1(data)).toBe(c1(data));
    expect(executionValueRefV1("fixture-kind", data)).toEqual(valueRef("fixture-kind", data));
    expect(executionValueRefV1("other-kind", data).sha256).not.toBe(valueRef("fixture-kind", data).sha256);
    expect(canonicalExecutionJsonV1({ x: Number.MAX_VALUE })).toBe(c1({ x: Number.MAX_VALUE }));
    const shared = { value: 1 }; expect(() => assertExecutionJsonV1([shared, shared])).not.toThrow();
  });
  test("BoundDocument/BoundBytes detach caller data and count UTF-8, not JS string length", () => {
    checked("A");
    const data = { text: "é漢😀" }, expected = document("fixture-document", data), got = makeBoundDocumentV1("fixture-document", data);
    expect(got).toEqual(expected); expect(got.ref.byteLength).toBe(utf8.encode(got.utf8).length);
    expect(got.ref.byteLength).toBeGreaterThan(got.utf8.length);
    data.text = "changed"; expect(got.utf8).toBe(expected.utf8);
    const bytes = Uint8Array.from([0, 0xff, 0xc3, 0xa9]), bound = makeBoundBytesV1("fixture-raw", bytes);
    expect(bound.ref).toEqual(byteRef("fixture-raw", bytes)); expect(bound.base64).toBe(Buffer.from(bytes).toString("base64"));
    const before = bound.base64; bytes.fill(7); expect(bound.base64).toBe(before);
  });
  const hostile: Array<{ name: string; build: () => unknown }> = [
    { name: "undefined", build: () => undefined }, { name: "bigint", build: () => 1n },
    { name: "function", build: () => () => 1 }, { name: "symbol", build: () => Symbol("fixture") },
    { name: "NaN", build: () => NaN }, { name: "infinity", build: () => Infinity }, { name: "negative zero", build: () => -0 },
    { name: "lone surrogate", build: () => "\uD800" }, { name: "array hole", build: () => new Array(1) },
    { name: "array extra property", build: () => Object.assign([1], { extra: 1 }) },
    { name: "Date prototype", build: () => new Date(0) }, { name: "class prototype", build: () => new (class Foreign { value = 1; })() },
    { name: "inherited prototype", build: () => Object.assign(Object.create({ inherited: true }), { value: 1 }) },
    { name: "symbol property", build: () => ({ [Symbol("key")]: 1 }) },
    { name: "non-enumerable property", build: () => Object.defineProperty({}, "hidden", { value: 1 }) },
    { name: "accessor", build: () => Object.defineProperty({}, "value", { enumerable: true, get: () => { throw new Error("must not invoke getter"); } }) },
    { name: "Proxy", build: () => new Proxy({ value: 1 }, {}) },
    { name: "cycle", build: () => { const x: { self?: object } = {}; x.self = x; return x; } },
  ];
  for (const item of hostile) {
    test(`rejects non-JSON ${item.name} through throwing public helpers`, () => {
      checked("A");
      expect(() => assertExecutionJsonV1(item.build())).toThrow();
      expect(() => canonicalExecutionJsonV1(item.build())).toThrow();
      expect(() => executionValueRefV1("fixture", item.build())).toThrow();
      expect(() => makeBoundDocumentV1("fixture", item.build())).toThrow();
    });
  }
  test("accessors are rejected without executing their code", () => {
    checked("A"); let reads = 0;
    const data = Object.defineProperty({}, "value", { enumerable: true, get() { reads++; return 1; } });
    expect(() => assertExecutionJsonV1(data)).toThrow(); expect(reads).toBe(0);
  });
});

describe("wire envelope parsing: no normalization, duplicate-key repair or schema widening", () => {
  test("original pretty-printed UTF-8 envelope bytes survive export unchanged", () => {
    const { f } = checked("B"), bytes = utf8.encode(JSON.stringify(envelopeValue(f.body), null, 2) + "\n");
    const parsed = ok(parseExecutionEnvelopeV1(bytes)); ok(bindExecutionSourcesV1(parsed, f.independent));
    expect(parsed.document.ref).toEqual(byteRef(K.envelope, bytes, "utf8-json-v1"));
    expect([...ok(exportExecutionEnvelopeV1(parsed))]).toEqual([...bytes]);
    expect(parsed.document.ref.sha256).not.toBe(sha(envelopeBytes(f.body)));
  });
  const badWire: Array<{ name: string; bytes: (valid: Uint8Array, text: string) => Uint8Array }> = [
    { name: "UTF-8 BOM", bytes: valid => Uint8Array.from([0xef, 0xbb, 0xbf, ...valid]) },
    { name: "invalid UTF-8", bytes: valid => Uint8Array.from([0xc3, 0x28, ...valid]) },
    { name: "trailing text", bytes: (_v, text) => utf8.encode(text + "x") },
    { name: "same-value duplicate top-level key", bytes: (_v, text) => utf8.encode('{"version":"l8-execution-envelope-v1",' + text.slice(1)) },
    { name: "escaped duplicate top-level key", bytes: (_v, text) => utf8.encode('{"vers\\u0069on":"l8-execution-envelope-v1",' + text.slice(1)) },
    { name: "lone surrogate escape", bytes: (_v, text) => utf8.encode(text.replace('"missionId":"s1-independent-qa"', '"missionId":"\\ud800"')) },
    { name: "negative-zero counter with otherwise unchanged decoded numeric value", bytes: (_v, text) => utf8.encode(text.replace('"headRevision":0', '"headRevision":-0')) },
  ];
  for (const item of badWire) {
    test(`rejects ${item.name}`, () => {
      const { f } = checked("B"), valid = envelopeBytes(f.body), text = new TextDecoder().decode(valid);
      refused(parseExecutionEnvelopeV1(item.bytes(valid, text)));
    });
  }
  test("nested duplicate document keys are rejected even with exact raw refs and otherwise identical decoded content", () => {
    const { f } = checked("B"), source = f.body.fullGraphSnapshot;
    const text = '{"schemaVersion":1,' + source.utf8.slice(1);
    f.body.fullGraphSnapshot = document(K.fullGraphSnapshot, f.snapshot, text);
    f.independent.fullGraphSnapshot = copy(f.body.fullGraphSnapshot);
    refused(parseExecutionEnvelopeV1(envelopeBytes(f.body)));
  });
  const malformed: Array<{ name: string; mutate: (f: Fixture) => void }> = [
    { name: "unknown top-level field", mutate: f => { Reflect.set(f.body, "callerAuthority", true); } },
    { name: "unknown T0 field", mutate: f => { Reflect.set(f.body.preparationObservationT0, "quiescent", true); } },
    { name: "version substitution", mutate: f => { Reflect.set(f.body, "version", "l8-execution-envelope-v99"); } },
    { name: "unsafe ordinal", mutate: f => { f.body.generation.ordinal = Number.MAX_SAFE_INTEGER + 1; } },
    { name: "fractional revision", mutate: f => { f.body.preparationObservationT0.headRevision = 0.5; } },
    { name: "negative byte length", mutate: f => { f.body.fullGraphSnapshot.ref.byteLength = -1; } },
    { name: "uppercase SHA", mutate: f => { f.body.fullGraphSnapshot.ref.sha256 = f.body.fullGraphSnapshot.ref.sha256.toUpperCase(); } },
    { name: "extra ByteRef field", mutate: f => { Reflect.set(f.body.fullGraphSnapshot.ref, "trusted", true); } },
    { name: "bootstrap ordinal without a parent", mutate: f => { f.body.generation.ordinal = 1; } },
    { name: "A polluted with scientific B lineage", mutate: f => { Reflect.set(f.body.sourceRefs, "lineageRef", valueRef("l8-lineage-value-v1", {})); } },
    { name: "A polluted with B evidence", mutate: f => { Reflect.set(f.body.sourceRefs, "proposalEvidenceRef", valueRef("l8-proposal-evidence-value-v1", {})); } },
  ];
  for (const item of malformed) {
    test(`closed schema rejects ${item.name}`, () => {
      const { f } = checked("A"); item.mutate(f); refused(parseExecutionEnvelopeV1(envelopeBytes(f.body)));
    });
  }
  for (const field of ["sha256", "byteLength"] as const) {
    test(`BoundDocument ${field} must describe its actual UTF-8 bytes`, () => {
      const { f } = checked("B");
      if (field === "sha256") f.body.fullGraphSnapshot.ref.sha256 = "f".repeat(64);
      else f.body.fullGraphSnapshot.ref.byteLength++;
      refused(parseExecutionEnvelopeV1(envelopeBytes(f.body)));
    });
  }
});

describe("lossless A/B projection and semantic relation-source binding", () => {
  for (const regime of ["A", "B"] as const) {
    test(`${regime}: explicit L4 view, full L5 source and hand-checked two-record/65-site relation`, () => {
      const { f, origin } = checked(regime);
      expect(ok(projectGraphSnapshotViewV1(f.snapshot))).toEqual(sourceView(f.snapshot));
      const projection = ok(projectExecutionSourcesForL5V1(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context));
      expect(projection.regime).toBe(regime); expect(projection.graph.edges).toEqual(f.snapshot.edges);
      expect(projection.graph.nodes).toEqual(f.snapshot.nodes);
      expect(projection.snapshotView).toEqual(sourceView(f.snapshot));
      if (regime === "B") expect(ok(projectRegimeBForL5(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context))).toEqual(projection);
      const bound = ok(bindExecutionSourcesV1(origin, f.independent)), relation = directRelation(read(f.body.planning));
      const raw = f.snapshot.edges.filter(e => e.sourceId === IDS[0] && e.destinationId === IDS[1]);
      expect(raw).toHaveLength(2); expect(raw.map(e => e.sites.length).sort((a, b) => a - b)).toEqual([1, 64]);
      const sites = Array.from({ length: 65 }, (_, i) => { const siteRva = `0x${(256 + i).toString(16).toUpperCase()}`;
        return { siteRva, xrefType: "code", provenance: provenance(siteRva) }; });
      const records = [sites.slice(0, 64), sites.slice(64)].map(part => ({
        id: `edge:${sha(c1({ sourceId: IDS[0], destinationId: IDS[1], kind: "direct_call", sites: part })).slice(0, 40)}`, sites: part }));
      expect(relation.relationId).toBe(`relation:v1:${fingerprint({ sourceId: IDS[0], destinationId: IDS[1], kind: "direct_call" })}`);
      expect(relation.sourceEdgeIds).toEqual(records.map(r => r.id).sort());
      expect(relation.sites).toEqual(sites);
      expect(relation.observations).toHaveLength(1);
      expect(relation.observations[0]!.metadata).toEqual({ schemaVersion: 1, direction: "source_to_destination", status: "observed", confidence: "high",
        appearedInRevision: 0, retiredInRevision: null, schedulerRelevance: "may_block" });
      expect(relation.observations[0]!.sourceEdgeIds).toEqual(records.map(r => r.id).sort());
      expect(relation.observations[0]!.sites).toEqual(sites);
      expect(relation.observations[0]!.sitesBySourceEdgeId).toEqual(Object.fromEntries(records.map(r => [r.id, r.sites])));
      expect(bound.planning.sidecar.relationView).toEqual(read(f.body.planning).sidecar.relationView);
      expect(f.snapshot.edges.some(e => e.status === "inferred")).toBe(true);
      expect(f.snapshot.edges.some(e => e.retiredInRevision === 1)).toBe(true);
      expect(f.snapshot.edges.some(e => e.sourceId === e.destinationId)).toBe(true);
      expect(f.grouping.contextOmissions.byGroup.some(g => g.functionIds.length > 0)).toBe(true);
    });
  }
  test("B-specific projection refuses a complete A source rather than casting its regime", () => {
    const { f } = checked("A");
    refused(projectRegimeBForL5(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context));
  });
  test("a snapshot-view cannot stand in for independently supplied full snapshot bytes", () => {
    const { f } = checked("B");
    refused(projectRegimeBForL5(sourceView(f.snapshot), f.transport, f.grouping, f.policy, f.body.admissionSource.context));
  });
  const relationTampering: Array<{ name: string; edit: (p: PlannerResult) => void }> = [
    { name: "confidence observation", edit: p => { directRelation(p).observations[0]!.metadata.confidence = "low"; } },
    { name: "source appearance observation", edit: p => { directRelation(p).observations[0]!.metadata.appearedInRevision = 1; } },
    { name: "source retirement observation", edit: p => { directRelation(p).observations[0]!.metadata.retiredInRevision = 1; } },
    { name: "same-union wrong per-source site association", edit: p => {
      const o = directRelation(p).observations[0]!, ids = o.sourceEdgeIds;
      const first = o.sitesBySourceEdgeId[ids[0]!]!; o.sitesBySourceEdgeId[ids[0]!] = o.sitesBySourceEdgeId[ids[1]!]!; o.sitesBySourceEdgeId[ids[1]!] = first;
    } },
    { name: "internally consistent omitted real site", edit: p => {
      const r = directRelation(p), last = c1(r.sites[r.sites.length - 1]), keep = (sites: typeof r.sites) => sites.filter(s => c1(s) !== last);
      r.sites = keep(r.sites); for (const o of r.observations) { o.sites = keep(o.sites);
        for (const id of o.sourceEdgeIds) o.sitesBySourceEdgeId[id] = keep(o.sitesBySourceEdgeId[id]!); }
    } },
    { name: "fabricated transport source identity", edit: p => {
      const r = directRelation(p), old = r.sourceEdgeIds[0]!, next = "edge:fixture-fabricated";
      r.sourceEdgeIds = r.sourceEdgeIds.map(id => id === old ? next : id).sort();
      for (const o of r.observations) if (o.sourceEdgeIds.includes(old)) { o.sourceEdgeIds = o.sourceEdgeIds.map(id => id === old ? next : id).sort();
        o.sitesBySourceEdgeId[next] = o.sitesBySourceEdgeId[old]!; delete o.sitesBySourceEdgeId[old]; }
    } },
    { name: "retired source relation removed from audit view", edit: p => {
      p.sidecar.relationView.relations = p.sidecar.relationView.relations.filter(r => !r.observations.some(o => o.metadata.retiredInRevision === 1));
    } },
    { name: "inferred source relation removed from audit view", edit: p => {
      p.sidecar.relationView.relations = p.sidecar.relationView.relations.filter(r => !r.observations.some(o => o.metadata.status === "inferred"));
    } },
    { name: "legacy shard policies disagree before canonical relation reduction", edit: p => {
      const ids = directRelation(p).sourceEdgeIds; p.sidecar.policy.edgeKinds = { [ids[0]!]: "obligatory", [ids[1]!]: "optional" };
    } },
    { name: "policy references nonexistent transport record", edit: p => {
      p.sidecar.policy.edgeKinds = { "edge:nonexistent": "optional" };
    } },
  ];
  for (const regime of ["A", "B"] as const) for (const item of relationTampering) {
    test(`${regime}: semantic ${item.name} rejected after digest realignment`, () => {
      const { f } = checked(regime); tamperPlanning(f, item.edit); semanticRejection(f);
    });
  }
  const groupTampering: Array<{ name: string; edit: (f: Fixture) => void }> = [
    { name: "full-context node body", edit: f => { f.body.groupSource.fullContextByGroup = rewrite(f.body.groupSource.fullContextByGroup, v => { v.groups[0]!.nodes[0]!.observedDescription = "claimed replacement"; }); } },
    { name: "full-context raw site provenance", edit: f => { f.body.groupSource.fullContextByGroup = rewrite(f.body.groupSource.fullContextByGroup, v => {
      const edge = v.groups.flatMap(g => g.edges).find(e => e.sites.length > 1); if (!edge) throw new Error("fixture lacks full relation context");
      edge.sites[0]!.provenance.sourceHash = sha("not the source"); }); } },
    { name: "community kernel", edit: f => { f.body.groupSource.communityBinding = rewrite(f.body.groupSource.communityBinding, v => { v.groups[0]!.kernelIds = []; }); } },
    { name: "community parents", edit: f => { f.body.groupSource.communityBinding = rewrite(f.body.groupSource.communityBinding, v => { v.groups[0]!.parentContentIds = ["e".repeat(64)]; }); } },
    { name: "omitted context falsely absent", edit: f => { f.body.groupSource.contextOmissions = rewrite(f.body.groupSource.contextOmissions, v => {
      const item = v.byGroup.find(g => g.functionIds.length > 0); if (!item) throw new Error("fixture requires a real omission"); item.functionIds = []; }); } },
    { name: "owner metrics", edit: f => { f.body.groupSource.groupingMetrics = rewrite(f.body.groupSource.groupingMetrics, v => { v.ownerByFunctionId[IDS[0]!] = "other-owner"; }); } },
  ];
  for (const item of groupTampering) {
    test(`B semantic ${item.name} rejected with newly bound document bytes`, () => {
      const { f } = checked("B"); item.edit(f); semanticRejection(f);
    });
  }
});

describe("independently loaded sources, not agreement between two self-claimed digests", () => {
  const substitutions: Array<{ name: string; edit: (f: Fixture) => void }> = [
    { name: "full snapshot", edit: f => { f.independent.fullGraphSnapshot = rewrite(f.independent.fullGraphSnapshot, s => {
      s.nodes[0]!.name = "independent replacement";
      const { normalizedFingerprint: _old, ...content } = s; s.normalizedFingerprint = fingerprint(content);
    }); } },
    { name: "source mission snapshot", edit: f => { f.independent.sourceMissionSnapshot = rewrite(f.independent.sourceMissionSnapshot, s => { s.revision++; }); } },
    { name: "template", edit: f => { f.independent.executionTemplate = rewrite(f.independent.executionTemplate, s => { s.settings.maxConcurrent++; }); } },
    { name: "source model variant", edit: f => { f.independent.executionSourceSpec = rewrite(f.independent.executionSourceSpec, s => { s.models.A.variant = "other-variant"; }); } },
    { name: "input source", edit: f => { f.independent.inputManifestSource.document = rewrite(f.independent.inputManifestSource.document, s => { s.requiredTools = ["different-tool"]; }); } },
    { name: "actual input blob", edit: f => { const b = f.independent.inputManifestSource.files[0]!.bytes;
      const bytes = Buffer.from(b.base64, "base64"); bytes[0] = bytes[0]! ^ 1; b.base64 = bytes.toString("base64"); } },
    { name: "opaque knowledge root at same revision", edit: f => { f.independent.knowledgeSource = rewrite(f.independent.knowledgeSource, s => { s.rootHash = "3".repeat(64); }); } },
    { name: "opaque knowledge ledger at same revision", edit: f => { f.independent.knowledgeSource = rewrite(f.independent.knowledgeSource, s => { s.ledgerDigest = "4".repeat(64); }); } },
    { name: "approval registry", edit: f => { f.independent.approvalSource = rewrite(f.independent.approvalSource, s => { s.revision++; }); } },
    { name: "planner codec pin", edit: f => { f.independent.contractPins.plannerCodec.sha256 = "5".repeat(64); } },
    { name: "own envelope codec peer pin", edit: f => { f.independent.contractPins.envelopeCodec.sha256 = "6".repeat(64); } },
    { name: "unexpected bootstrap parent", edit: f => { f.independent.parentEnvelope = document(K.envelope, envelopeValue(f.body)); } },
  ];
  for (const item of substitutions) {
    test(`rejects independently substituted ${item.name}`, () => {
      const { f, origin } = checked("B"); item.edit(f);
      refused(bindExecutionSourcesV1(origin, f.independent));
      semanticRejection(f);
    });
  }
  test("same-state T0 root mismatch is rejected without inventing a root preimage", () => {
    const { f } = checked("A"); f.body.preparationObservationT0.knowledgeRootHash = "7".repeat(64); semanticRejection(f);
  });
  test("same-state T0 ledger mismatch is rejected without rehashing acquired facts", () => {
    const { f } = checked("A"); f.body.preparationObservationT0.knowledgeLedgerDigest = "8".repeat(64); semanticRejection(f);
  });
  test("all same-state opaque witnesses may agree on other explicit backend-provided values", () => {
    const { f } = checked("A");
    const source = read(f.body.admissionSource.knowledgeSource); source.rootHash = "b".repeat(64); source.ledgerDigest = "c".repeat(64);
    f.body.admissionSource.knowledgeSource = document(K.knowledge, source); f.independent.knowledgeSource = copy(f.body.admissionSource.knowledgeSource);
    f.body.preparationObservationT0.knowledgeRootHash = source.rootHash; f.body.preparationObservationT0.knowledgeLedgerDigest = source.ledgerDigest;
    positive(f); // No implied preimage, backend readback, HOST or J->K witness.
  });
});

function replaceKnowledge(f: Fixture, edit: (k: KnowledgeSourceV1) => void): void {
  const source = read(f.body.admissionSource.knowledgeSource); edit(source);
  f.body.admissionSource.knowledgeSource = document(K.knowledge, source); f.independent.knowledgeSource = copy(f.body.admissionSource.knowledgeSource);
}
function replaceApprovals(f: Fixture, edit: (a: ApprovalSourceV1) => void): void {
  const approvals = read(f.body.admissionSource.approvalSource); edit(approvals);
  f.body.admissionSource.approvalSource = document(K.approvals, approvals); f.independent.approvalSource = copy(f.body.admissionSource.approvalSource);
}
describe("opaque roots do not waive knowledge bytes, materialization and approval checks", () => {
  const knowledgeCases: Array<{ name: string; edit: (k: KnowledgeSourceV1) => void }> = [
    { name: "fact content not matching actual file", edit: k => { k.facts[0]!.content += "changed"; } },
    { name: "raw blob hash correct but ArtifactFile SHA wrong", edit: k => {
      const b = k.files[0]!, bytes = utf8.encode("different actual knowledge bytes"); b.bytes.base64 = Buffer.from(bytes).toString("base64");
      b.bytes.ref = byteRef(b.bytes.ref.kind, bytes);
    } },
    { name: "materialization producer session", edit: k => { k.materializations[0]!.producer.sessionId = "not-the-result-session"; } },
    { name: "materialization function identity", edit: k => { const m = k.materializations[0]!;
      m.binding = rewrite(m.binding, b => { b.functionId = IDS[1]!; }); } },
    { name: "stored result content hash", edit: k => { const m = k.materializations[0]!;
      m.result = rewrite(m.result, r => { r.content += " "; }); } },
    { name: "pending readback", edit: k => { k.materializations[0]!.readback.status = "pending"; } },
    { name: "revoked blind materialization", edit: k => { const m = k.materializations[0]!; m.revoked = true;
      m.revocationRef = document("fixture-revocation-record-v1", { resultId: m.resultId, revoked: true }).ref; } },
    { name: "commit readback pending, other commit references realigned", edit: k => { const m = k.materializations[0]!, commit = read(m.commit);
      commit.readbackStatus = "pending"; commit.commitId = scientificCommitId(commit); m.commit = document(m.commit.ref.kind, commit);
      m.binding = rewrite(m.binding, b => { b.commitId = commit.commitId; }); } },
  ];
  for (const item of knowledgeCases) {
    test(`rejects ${item.name} with equal independent knowledge document and opaque root`, () => {
      const { f } = checked("B", true); replaceKnowledge(f, item.edit); semanticRejection(f);
    });
  }
  const approvalCases: Array<{ name: string; edit: (a: ApprovalSourceV1) => void }> = [
    { name: "absent approval", edit: a => { a.records = []; } },
    { name: "denied decision", edit: a => { a.records[0]!.decision = "denied"; } },
    { name: "revoked decision", edit: a => { a.records[0]!.decision = "revoked"; } },
    { name: "missing blind B role", edit: a => { a.records[0]!.allowedRoles = ["A", "R"]; } },
    { name: "other function", edit: a => { a.records[0]!.functionIdentity.ea = "0x400200"; } },
    { name: "other file SHA", edit: a => { a.records[0]!.fileSha256 = "d".repeat(64); } },
    { name: "other source result", edit: a => { a.records[0]!.sourceResultIds = ["unrelated-result"]; } },
    { name: "other knowledge revision", edit: a => { a.records[0]!.knowledgeRevision++; } },
  ];
  for (const item of approvalCases) {
    test(`rejects blind file with ${item.name}, not merely an approval-document hash mismatch`, () => {
      const { f } = checked("B", true); replaceApprovals(f, item.edit); semanticRejection(f);
    });
  }
});

// Explicit test-fixture producer path only. After editing a genuine source, keep
// the other upstream commitments valid so the negative reaches the policy/root guard.
function realignAdmissionFixture(f: Fixture): void {
  const a = f.body.admissionSource, mission = read(f.body.sourceMissionSnapshot), input = read(a.inputManifestSource.document);
  const template = read(a.executionTemplate), spec = read(a.executionSourceSpec);
  spec.templateFingerprint = fingerprint(template); a.executionSourceSpec = document(K.executionSourceSpec, spec);
  a.context = { ...a.context, missionConfigFingerprint: fingerprint(mission.config), executionSpecFingerprint: fingerprint(spec), inputManifestFingerprint: fingerprint(input) };
  if (a.allocation) { a.allocation.context = copy(a.context); restamp(a.allocation); f.policy.admissionBudget = copy(a.allocation); }
  else delete f.policy.admissionBudget;
  a.sourceFingerprints = { executionTemplate: fingerprint(template), executionSourceSpec: fingerprint(spec), inputManifest: fingerprint(input),
    context: fingerprint(a.context), allocation: a.allocation?.fingerprint ?? null };
  const planning = plannerProducer.planMission(f.snapshot, f.transport.groups.map(g => ({ groupId: g.groupId, partitionId: g.partitionId,
    ownedFunctionIds: [...g.ownedFunctionIds], contextFunctionIds: [...g.contextFunctionIds] })), f.policy, a.context);
  f.body.planning = document(K.planning, planning);
  if (f.body.generation.ordinal === 0) {
    const limits = read(a.budgetLineage.rootLimits); limits.allocation = document(limits.allocation.ref.kind, a.allocation);
    a.budgetLineage.rootAllocationRef = limits.allocation.ref; a.budgetLineage.rootLimits = document(K.rootLimits, limits);
    a.budgetLineage.rootAccountId = valueRef("l8-budget-root-v1", { missionId: MISSION, lineageId: LINEAGE, rootAllocationRef: limits.allocation.ref }).sha256;
  }
  f.independent.sourceMissionSnapshot = copy(f.body.sourceMissionSnapshot);
  f.independent.executionTemplate = copy(a.executionTemplate); f.independent.executionSourceSpec = copy(a.executionSourceSpec);
  f.independent.inputManifestSource = copy(a.inputManifestSource);
}
function policyBytes(f: Fixture, text: string): void {
  const bytes = utf8.encode(text), index = f.body.admissionSource.inputManifestSource.files.findIndex(b => b.file.path === POLICY_PATH);
  if (index < 0) throw new Error("positive fixture lost its source policy file");
  const file = { ...f.body.admissionSource.inputManifestSource.files[index]!.file, sha256: sha(bytes) };
  f.body.admissionSource.inputManifestSource.files[index] = blob(file, bytes);
  f.body.activationPolicy.sourcePolicyRef = byteRef("l8-activation-policy-source-v1", bytes, "utf8-json-v1");
  f.body.admissionSource.inputManifestSource.document = rewrite(f.body.admissionSource.inputManifestSource.document, input => {
    input.commonInputs = input.commonInputs.map(old => old.path === POLICY_PATH ? copy(file) : old);
  });
  f.body.sourceMissionSnapshot = rewrite(f.body.sourceMissionSnapshot, mission => {
    mission.config.commonInputs = mission.config.commonInputs.map(old => old.path === POLICY_PATH ? copy(file) : old);
  });
  realignAdmissionFixture(f);
}
describe("the selected policy rule is actual independently supplied JSON bytes", () => {
  test("positive policy ByteRef resolves to a selected, unscoped, non-blind common rule", () => {
    const { f } = checked("B"), a = f.body.admissionSource, policy = a.inputManifestSource.files.find(b => b.file.path === POLICY_PATH)!;
    const bytes = Buffer.from(policy.bytes.base64, "base64"), value = JSON.parse(new TextDecoder().decode(bytes));
    expect(f.body.activationPolicy.sourcePolicyRef).toEqual(byteRef("l8-activation-policy-source-v1", bytes, "utf8-json-v1"));
    expect(policy.bytes.ref).toEqual(byteRef(policy.bytes.ref.kind, bytes));
    expect(policy.file.sha256).toBe(sha(bytes)); expect(policy.file.kind).toBe("rule");
    expect(Object.hasOwn(policy.file, "identity")).toBe(false); expect(policy.file.approvedForBlind).toBe(false);
    expect(value).toEqual({ version: "l8-activation-policy-source-v1", missionId: MISSION, lineageId: LINEAGE,
      maxActivationAttempts: f.body.activationPolicy.maxActivationAttempts, maxCandidateReplacements: f.body.activationPolicy.maxCandidateReplacements });
    expect(read(a.inputManifestSource.document).accessibleRules).toContain(POLICY_PATH);
    expect(read(f.independent.sourceMissionSnapshot).config.accessibleRules).toContain(POLICY_PATH);
  });
  const edits: Array<{ name: string; edit: (value: Record<string, unknown>) => void }> = [
    { name: "wrong version", edit: v => { v.version = "other-policy-v1"; } },
    { name: "wrong mission", edit: v => { v.missionId = "another-mission"; } },
    { name: "wrong root lineage", edit: v => { v.lineageId = "another-lineage"; } },
    { name: "different activation ceiling", edit: v => { v.maxActivationAttempts = 3; } },
    { name: "different replacement ceiling", edit: v => { v.maxCandidateReplacements = 2; } },
    { name: "unknown authorized boolean", edit: v => { v.authorized = true; } },
    { name: "fractional attempts", edit: v => { v.maxActivationAttempts = 1.5; } },
  ];
  for (const item of edits) {
    test(`rejects actual policy ${item.name}, even after file/source/context/planning/root digests realign`, () => {
      const { f } = checked("B"), file = f.body.admissionSource.inputManifestSource.files.find(b => b.file.path === POLICY_PATH)!;
      const value: Record<string, unknown> = JSON.parse(Buffer.from(file.bytes.base64, "base64").toString("utf8"));
      item.edit(value); policyBytes(f, c1(value)); semanticRejection(f);
    });
  }
  test("different valid formatting has a different policy ByteRef but remains valid when all actual sources agree", () => {
    const { f } = checked("A"), file = f.body.admissionSource.inputManifestSource.files.find(b => b.file.path === POLICY_PATH)!;
    const oldRef = copy(f.body.activationPolicy.sourcePolicyRef), value = JSON.parse(Buffer.from(file.bytes.base64, "base64").toString("utf8"));
    policyBytes(f, JSON.stringify(value, null, 2) + "\n"); positive(f);
    expect(f.body.activationPolicy.sourcePolicyRef.sha256).not.toBe(oldRef.sha256);
  });
  test("same-value duplicate policy keys are not repaired by rehashing the raw blob", () => {
    const { f } = checked("B"), b = f.body.admissionSource.inputManifestSource.files.find(b => b.file.path === POLICY_PATH)!;
    const text = Buffer.from(b.bytes.base64, "base64").toString("utf8");
    policyBytes(f, '{"version":"l8-activation-policy-source-v1",' + text.slice(1)); semanticRejection(f);
  });
  test("policy reference with no resolvable input bytes is refused, not reconstructed from its declared ceilings", () => {
    const { f } = checked("A"); f.body.admissionSource.inputManifestSource.files = [];
    f.independent.inputManifestSource.files = []; semanticRejection(f);
  });
  test("actual bytes cannot be replaced by an echoed ValueRef digest", () => {
    const { f } = checked("B"), value = { maxActivationAttempts: 2, maxCandidateReplacements: 1 };
    f.body.activationPolicy.sourcePolicyRef.sha256 = valueRef("l8-activation-policy-source-v1", value).sha256;
    semanticRejection(f);
  });
  test("policy must be accessible in both independently bound manifests", () => {
    const { f } = checked("A");
    f.body.admissionSource.inputManifestSource.document = rewrite(f.body.admissionSource.inputManifestSource.document, input => { input.accessibleRules = []; });
    f.body.sourceMissionSnapshot = rewrite(f.body.sourceMissionSnapshot, mission => { mission.config.accessibleRules = []; });
    realignAdmissionFixture(f); semanticRejection(f);
  });
  for (const invalid of ["scoped", "blind", "non-rule"] as const) {
    test(`policy file cannot be ${invalid} despite matching bytes and manifests`, () => {
      const { f } = checked("B"), entry = f.body.admissionSource.inputManifestSource.files.find(b => b.file.path === POLICY_PATH)!;
      if (invalid === "scoped") entry.file.identity = { sha256: MODULE, version: "qa-v1", ea: "0x400100" };
      else if (invalid === "blind") entry.file.approvedForBlind = true;
      else entry.file.kind = "manifest";
      f.body.admissionSource.inputManifestSource.document = rewrite(f.body.admissionSource.inputManifestSource.document, input => { input.commonInputs = [copy(entry.file)]; });
      f.body.sourceMissionSnapshot = rewrite(f.body.sourceMissionSnapshot, mission => { mission.config.commonInputs = [copy(entry.file)]; });
      realignAdmissionFixture(f); semanticRejection(f);
    });
  }
});

describe("generation/T0/root lineage is immutable data, not a backend activation simulation", () => {
  const generationCases: Array<{ name: string; edit: (f: Fixture) => void }> = [
    { name: "T0 parent disagrees", edit: f => { f.body.preparationObservationT0.parentGenerationId = `l8gen:${"d".repeat(64)}`; } },
    { name: "T0 partition store digest", edit: f => { f.body.preparationObservationT0.partitionStoreDigest = "e".repeat(64); } },
    { name: "T0 mission revision", edit: f => { f.body.preparationObservationT0.sourceMissionRevision++; } },
    { name: "root account identity", edit: f => { f.body.admissionSource.budgetLineage.rootAccountId = "f".repeat(64); } },
    { name: "root allocation identity", edit: f => { f.body.admissionSource.budgetLineage.rootAllocationRef.sha256 = "9".repeat(64); } },
  ];
  for (const item of generationCases) {
    test(`rejects ${item.name}`, () => { const { f } = checked("A"); item.edit(f); semanticRejection(f); });
  }
  test("A transition requires its actual independent parent document", () => {
    const root = checked("A"), child = fixture("A", root.origin), origin = positive(child);
    child.independent.parentEnvelope = null; refused(bindExecutionSourcesV1(origin, child.independent)); semanticRejection(child);
  });
  test("A transition increments ordinal exactly once", () => {
    const root = checked("A"), child = fixture("A", root.origin); positive(child);
    child.body.generation.ordinal++; semanticRejection(child);
  });
  test("a complete B parent never authorizes B -> A by changing a discriminant", () => {
    const a = checked("A"), control = fixture("A", a.origin); positive(control);
    const b = checked("B"), prohibited = fixture("A", b.origin);
    semanticRejection(prohibited);
  });
  for (const ceiling of ["contextEnvelopeMaxUtf8Bytes", "totalContextBudgetUtf8Bytes", "maxSelectedUnits"] as const) {
    test(`A transition cannot augment root ${ceiling} through an otherwise newly planned child`, () => {
      const root = checked("A"), child = fixture("A", root.origin); positive(child);
      child.policy[ceiling]++; realignAdmissionFixture(child);
      expect(child.body.admissionSource.budgetLineage.rootLimits).toEqual(root.f.body.admissionSource.budgetLineage.rootLimits);
      semanticRejection(child);
    });
  }
  test("a new epoch label cannot augment root per-function C", () => {
    const root = checked("A"), child = fixture("A", root.origin); positive(child);
    const a = child.body.admissionSource; if (!a.allocation) throw new Error("requires known positive allocation");
    a.allocation.capsByFunction[IDS[0]!]!.completeBodyMaxUtf8Bytes.value = 500001;
    a.context.budgetEpoch = 2; a.budgetEpoch = 2; a.budgetLineage.epoch = 2; realignAdmissionFixture(child);
    semanticRejection(child);
  });
  test("root policy ceilings cannot increase without changed policy bytes", () => {
    const { f } = checked("A"); f.body.activationPolicy.maxActivationAttempts++; semanticRejection(f);
  });
  test("T1/T2 lifecycle data cannot be injected into the scientific origin", () => {
    const { f } = checked("B"); Reflect.set(f.body, "expectationsT2", { controllerFence: 1 });
    refused(parseExecutionEnvelopeV1(envelopeBytes(f.body)));
  });
});

describe("derived run v3 binding, pure loaders and the separate prepare producer", () => {
  const runCases: Array<{ name: string; edit: (run: GraphRunV3, alternate: ReadonlyData<ParsedExecutionEnvelopeV1>) => void }> = [
    { name: "snapshot", edit: r => { r.derivedSpec.snapshotId = "snapshot:substitution"; } },
    { name: "plan", edit: r => { r.derivedSpec.planFingerprint = "b".repeat(64); } },
    { name: "sidecar", edit: r => { r.derivedSpec.sidecarFingerprint = "c".repeat(64); } },
    { name: "binding", edit: r => { r.derivedSpec.bindingFingerprint = "d".repeat(64); } },
    { name: "source spec", edit: r => { r.derivedSpec.sourceSpecFingerprint = "e".repeat(64); } },
    { name: "template", edit: r => { r.derivedSpec.templateFingerprint = "f".repeat(64); } },
    { name: "input", edit: r => { r.derivedSpec.inputManifestFingerprint = "9".repeat(64); } },
    { name: "knowledge revision", edit: r => { r.derivedSpec.knowledgeRevision++; } },
    { name: "generation identity", edit: r => { r.generationId = `l8gen:${"8".repeat(64)}`; } },
    { name: "embedded origin", edit: (r, a) => { r.envelope = copy(a.document); } },
  ];
  for (const item of runCases) {
    test(`rejects substituted run ${item.name} after new derived/run digests`, () => {
      const { origin } = checked("B"), alternate = checked("A").origin, base = ok(makeGraphRunV3(origin));
      ok(parseGraphRunV3(ok(exportGraphRunV3(base))));
      const run: GraphRunV3 = JSON.parse(base.document.utf8); item.edit(run, alternate);
      run.derivedSpecFingerprint = valueRef("l8-execution-derived-v3", run.derivedSpec).sha256;
      const { fingerprint: _old, ...body } = run; run.fingerprint = valueRef(K.run, body).sha256;
      refused(parseGraphRunV3(utf8.encode(c1(run))));
    });
  }
  test("load/inspect/bind/export/run paths do not invoke qualified planner or A clustering, including refusal", () => {
    const { f, origin } = checked("B");
    const planner = spyOn(plannerProducer, "planMission"), cluster = spyOn(clusterProducer, "clusterGraph");
    try {
      const bytes = envelopeBytes(f.body), parsed = ok(parseExecutionEnvelopeV1(bytes));
      ok(bindExecutionPreparationV1(preparationBody(f), f.independent, f.policy));
      ok(bindExecutionSourcesV1(parsed, f.independent));
      expect(inspectExecutionEnvelopeV1(bytes, f.independent).coherent).toBe(true);
      ok(exportExecutionEnvelopeV1(origin));
      const run = ok(makeGraphRunV3(parsed)); ok(parseGraphRunV3(ok(exportGraphRunV3(run))));
      refused(parseExecutionEnvelopeV1(Uint8Array.from([0xff])));
      const changed = copy(f.independent); changed.fullGraphSnapshot.utf8 += " ";
      refused(bindExecutionSourcesV1(origin, changed));
      expect(planner).not.toHaveBeenCalled(); expect(cluster).not.toHaveBeenCalled();
    } finally { planner.mockRestore(); cluster.mockRestore(); }
  });
  test("prepare alone explicitly plans once and binds the resulting origin/run to the complete sources", () => {
    const { f } = checked("B");
    const planner = spyOn(plannerProducer, "planMission"), cluster = spyOn(clusterProducer, "clusterGraph");
    try {
      const prepared = ok(prepareExecutionV1({ body: preparationBody(f), independentSources: f.independent, policy: f.policy }));
      expect(planner).toHaveBeenCalledTimes(1); expect(cluster).not.toHaveBeenCalled();
      expect(prepared.origin.envelope).toEqual(envelopeValue(f.body));
      ok(bindExecutionSourcesV1(prepared.origin, f.independent));
      expect(prepared.run.run.envelope).toEqual(prepared.origin.document);
      expect(prepared.run.run.envelopeFingerprint).toBe(prepared.origin.envelope.fingerprint);
      expect(planner).toHaveBeenCalledTimes(1);
    } finally { planner.mockRestore(); cluster.mockRestore(); }
  });
});
