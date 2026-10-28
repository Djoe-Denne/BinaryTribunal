/** Offline L7 cross-QA fixtures, not a scheduler or the historical L7 simulator.
 * Expectations below use explicit sets/reachability/JSON rules, never production
 * SCC, relation, ranking, fingerprint or simulation implementations. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateGraphSnapshot, type FunctionEdgeV1, type GraphSnapshotV1, type EdgeSite } from "../../src/graph";
import { buildGraphSnapshot, type GraphParts } from "../../src/graph-normalize";
import { clusterGraph } from "../../src/cluster";
import { buildInvestigationGroups } from "../../src/investigation-groups";
import { evaluateReadiness, planMission, type ArtifactReceipt, type ArtifactRequirement,
  type PlannerGroupInput, type PlannerPolicy, type PlannerResult, type WorkUnit } from "../../src/planner";

export const FIXTURES = join(import.meta.dir, "../fixtures/graph");
export const REPO = join(import.meta.dir, "../../../..");
export const MISSION = "graph-interop-offline";
export const SOURCE = "graph-interop-synthetic-not-native";
export function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, name, "content.json"), "utf8")) as T;
}
export function jsonClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function sha256(value: string | Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }

/** Independent implementation of the contract's finite JSON value encoding. */
export function oracleCanonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const text = JSON.stringify(value);
    if (text === undefined) throw new Error("oracle expects a JSON value");
    return text;
  }
  if (Array.isArray(value)) return `[${value.map(oracleCanonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().filter(k => object[k] !== undefined)
    .map(k => `${JSON.stringify(k)}:${oracleCanonical(object[k])}`).join(",")}}`;
}
export function oracleDigest(value: unknown, omit?: string): string {
  const content = omit ? Object.fromEntries(Object.entries(value as object).filter(([key]) => key !== omit)) : value;
  return sha256(oracleCanonical(content));
}

/** Parent arbitration BRIDGES_RARE_V1, DECISION.md SHA dd290e23...17b8f3.
 * The immutable L1 ORIGINAL is an OPEN data anomaly, correctly rejected by L2.
 * This EXPLICIT new synthetic span declaration is not a permissive loader, a
 * canonical fixture repair, or evidence of native bytes. No private input file
 * or parent-derived JSON is needed to run it. */
export const RARE_BRIDGE_V1 = Object.freeze({
  rawSha256: "69278ee8e28390b623f525774e8fe036231873934fb30ed0e98a2c33353105c4",
  originalContentSha256: "21e7adc63cdb73a8b78f2cacd9258258e46117e1d0f9bc5fdde7a022686a28f0",
  originalNormalizedFingerprint: "21e42bba205f9b55415f74176c005bb7e766a690592b8e9ee15f841c776b9774",
  callerId: "1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb:0x2100",
  edgeId: "edge:b6d08bd48f2db9a252d08e39bac277cbb23849d9d963407889566b4ab4285fb1",
  derivedSnapshotId: "fixture:bridges-rare:caller-span-v1:dfa3df47740344acc62b2fcd56d1579b3e9d695fc06ad7cc50da699c056a4cef",
  derivedNormalizedFingerprint: "bb3b194a9d51d181c61118a742223d91676983059a8ea8a549116a3627204630",
});
export function syntheticRareBridgeDeclaredSpanV1(): GraphSnapshotV1 {
  const raw = readFileSync(join(FIXTURES, "bridges-rare/content.json"));
  if (sha256(raw) !== RARE_BRIDGE_V1.rawSha256) throw new Error("rare-bridge ORIGINAL raw pin changed; parent arbitration required");
  const original = JSON.parse(raw.toString("utf8")) as GraphSnapshotV1;
  if (oracleDigest(original) !== RARE_BRIDGE_V1.originalContentSha256
    || original.normalizedFingerprint !== RARE_BRIDGE_V1.originalNormalizedFingerprint
    || oracleDigest(original, "normalizedFingerprint") !== RARE_BRIDGE_V1.originalNormalizedFingerprint)
    throw new Error("rare-bridge ORIGINAL content pin changed");
  const caller = original.nodes.find(n => n.id === RARE_BRIDGE_V1.callerId), edge = original.edges.find(e => e.id === RARE_BRIDGE_V1.edgeId);
  if (!caller || oracleCanonical(caller.boundaries) !== oracleCanonical([{ ordinal: 0, rva: "0x2100", endRvaExclusive: "0x2110", role: "entry" }])
    || oracleCanonical(caller.sizeBytes) !== oracleCanonical({ known: true, value: 16 })
    || !edge || edge.sourceId !== caller.id || edge.sites.length !== 1 || edge.sites[0]!.siteRva !== "0x2110"
    || edge.sites[0]!.provenance.siteRva !== "0x2110" || edge.sites[0]!.provenance.siteKind !== "instruction"
    || oracleCanonical(validateGraphSnapshot(original)) !== oracleCanonical(["edge instruction site is outside source function chunks"]))
    throw new Error("rare-bridge ORIGINAL edge/span/size/site/rejection preconditions changed");
  const derived = jsonClone(original), declared = derived.nodes.find(n => n.id === caller.id)!;
  declared.boundaries[0]!.endRvaExclusive = "0x2111";
  declared.sizeBytes = { known: true, value: 17 };
  derived.snapshotId = "fixture:bridges-rare:caller-span-v1:" + oracleDigest({
    domain: "re-graph-scheduler-test-only-bridges-rare-span-v1", originalContentSha256: RARE_BRIDGE_V1.originalContentSha256,
    callerId: caller.id, oldEnd: "0x2110", newEnd: "0x2111" });
  derived.normalizedFingerprint = oracleDigest(derived, "normalizedFingerprint");
  return derived;
}
export function addr(value: number): string { return `0x${value.toString(16).toUpperCase()}`; }
export function partsOf(snapshot: GraphSnapshotV1): GraphParts {
  return { missionId: snapshot.missionId, snapshotId: snapshot.snapshotId, artifacts: snapshot.binaryArtifacts,
    nodes: snapshot.nodes, edges: snapshot.edges, objects: snapshot.objects, unresolved: snapshot.unresolved,
    capabilities: snapshot.capabilities, knowledgeRevision: snapshot.knowledgeRevision,
    scopeDescription: snapshot.scope.description, coverage: snapshot.coverage,
    toolVersions: snapshot.toolVersions, configFingerprint: snapshot.configFingerprint };
}
export function siteAt(snapshot: GraphSnapshotV1, source: number, offset = 4, citation = "site"): EdgeSite {
  const node = snapshot.nodes[source]!, rva = addr(Number(BigInt(node.rva)) + offset);
  return { siteRva: rva, xrefType: "code", provenance: { moduleSha256: node.moduleSha256, siteRva: rva,
    siteKind: "instruction", xrefType: "code", source: SOURCE, sourceVersion: "1",
    sourceHash: sha256(SOURCE), evidenceSha256: sha256(`${citation}:${rva}`) } };
}
export function callEdge(snapshot: GraphSnapshotV1, source: number, destination: number,
  sites: EdgeSite[] = [siteAt(snapshot, source)]): FunctionEdgeV1 {
  return { schemaVersion: 1, id: "", sourceId: snapshot.nodes[source]!.id, destinationId: snapshot.nodes[destination]!.id,
    kind: "direct_call", direction: "source_to_destination", sites, status: "observed", confidence: "high",
    appearedInRevision: 1, retiredInRevision: null, schedulerRelevance: "may_block" };
}
export function snapshotOf(count: number, calls: readonly (readonly [number, number])[] = []): GraphSnapshotV1 {
  const template = fixture<GraphSnapshotV1>("communities-obvious"), base = template.nodes[0]!;
  const nodes = Array.from({ length: count }, (_, i) => {
    const rva = 0x1000 + i * 0x1000;
    return { ...jsonClone(base), id: `${base.moduleSha256}:${addr(rva)}`, rva: addr(rva), ea: addr(0x400000 + rva),
      name: `interop_${i}`, boundaries: [{ ordinal: 0, rva: addr(rva), endRvaExclusive: addr(rva + 0x800), role: "entry" as const }],
      sizeBytes: { known: true, value: 0x800 }, instructionCount: { known: false, value: null } };
  });
  const empty = { ...template, missionId: MISSION, snapshotId: `snapshot:interop:${count}`, nodes,
    edges: [], objects: [], unresolved: [], capabilities: [], knowledgeRevision: 1 };
  const parts = partsOf(empty);
  parts.edges = calls.map(([a, b]) => callEdge(empty, a, b));
  parts.scopeDescription = "Synthetic offline cross-QA; not native FF8 evidence";
  return buildGraphSnapshot(parts).snapshot;
}
export function rebuilt(snapshot: GraphSnapshotV1): GraphSnapshotV1 { return buildGraphSnapshot(partsOf(snapshot)).snapshot; }
export function shardedSnapshot(siteCount: number): GraphSnapshotV1 {
  const snapshot = snapshotOf(2), parts = partsOf(snapshot);
  parts.edges = [callEdge(snapshot, 0, 1, Array.from({ length: siteCount }, (_, i) => siteAt(snapshot, 0, i + 1, `proof-${i}`)))];
  return buildGraphSnapshot(parts).snapshot;
}
export function policyFor(snapshot: GraphSnapshotV1, partitionId: string): PlannerPolicy {
  return { version: "graph-interop-policy-1", estimationVersion: "fixture-estimates-1", partitionId,
    investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 2_000_000, totalContextBudgetUtf8Bytes: 64_000_000, maxSelectedUnits: 100_000,
    sccMaxFunctions: 10_000, sccMaxIterations: 8, sccCostBudget: 1_000_000,
    requirementsByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, {
      artifactId: `artifact:${node.id}`, artifactSha256: sha256(`bytes:${node.id}`), functionId: node.id,
      moduleSha256: node.moduleSha256, artifactKind: "reconciled_c", minimumRevision: 1, maximumRevision: 1,
      publicationLevel: 1, validation: "fixture-only" }])),
    estimatesByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, {
      version: "fixture-estimates-1", A: 1, B: 1, R: 1, validation: 1 }])), resourcesByFunction: {} };
}
export function groupsFor(snapshot: GraphSnapshotV1, maxSize = 1) {
  const structural = clusterGraph(snapshot, { algorithm: "historical-cc" });
  const grouped = buildInvestigationGroups(snapshot, structural.partition, { minSize: 1, maxSize });
  return { ...structural, ...grouped };
}
export function planned(snapshot: GraphSnapshotV1, maxSize = 1): PlannerResult {
  const grouped = groupsFor(snapshot, maxSize);
  return planMission(snapshot, grouped.groups, policyFor(snapshot, grouped.partition.partitionId));
}
export function singletonGroups(snapshot: GraphSnapshotV1, partitionId: string): PlannerGroupInput[] {
  return snapshot.nodes.map((node, i) => ({ groupId: `explicit-singleton:${i}`, partitionId,
    ownedFunctionIds: [node.id], contextFunctionIds: [] }));
}
export function owner(result: PlannerResult, functionId: string): WorkUnit {
  const unit = result.units.find(u => u.ownedFunctionIds.includes(functionId));
  if (!unit) throw new Error(`missing planned owner: ${functionId}`);
  return unit;
}
export function receiptFor(requirement: ArtifactRequirement, producerUnitId: string | null): ArtifactReceipt {
  const { minimumRevision, maximumRevision: _maximum, ...identity } = requirement;
  return { ...identity, knowledgeRevision: minimumRevision, producerUnitId,
    commitId: sha256(`fixture-commit:${producerUnitId}:${requirement.artifactId}`),
    readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
}
export function readiness(result: PlannerResult, unit: WorkUnit, receipts: readonly ArtifactReceipt[] = []) {
  return evaluateReadiness({ plan: result.plan, sidecar: result.sidecar, unit, receipts,
    expectedSidecarFingerprint: result.sidecar.fingerprint, snapshotFingerprint: result.sidecar.snapshotFingerprint,
    knowledgeRevision: result.plan.knowledgeRevision, validContext: true, cancelled: false });
}
/** Bounded O(N^3) reference; deliberately unlike the production iterative Tarjan. */
export function reachability(count: number, calls: readonly (readonly [number, number])[]): boolean[][] {
  const matrix = Array.from({ length: count }, (_, a) => Array.from({ length: count }, (_, b) => a === b));
  for (const [a, b] of calls) matrix[a]![b] = true;
  for (let k = 0; k < count; k++) for (let a = 0; a < count; a++) for (let b = 0; b < count; b++)
    matrix[a]![b] = matrix[a]![b]! || (matrix[a]![k]! && matrix[k]![b]!);
  return matrix;
}
export function oracleComponents(count: number, calls: readonly (readonly [number, number])[]): number[][] {
  const closure = reachability(count, calls), remaining = new Set(Array.from({ length: count }, (_, i) => i));
  const groups: number[][] = [];
  for (const a of remaining) {
    const group = [...remaining].filter(b => closure[a]![b] && closure[b]![a]);
    group.forEach(b => remaining.delete(b)); groups.push(group);
  }
  return groups;
}
export function memberships(partition: { communities: Array<{ memberIds: string[] }> }): string[][] {
  return partition.communities.map(c => [...c.memberIds].sort()).sort((a, b) => a.join("|").localeCompare(b.join("|")));
}
