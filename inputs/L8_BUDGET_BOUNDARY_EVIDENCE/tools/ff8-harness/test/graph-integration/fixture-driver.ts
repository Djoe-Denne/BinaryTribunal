/** Central integration fixtures, NOT the historical L7 scheduler/simulator. */
import { readFileSync, mkdtempSync } from "node:fs";
import { dirname, join } from "node:path";
import type { InputBundle, MissionConfig, Snapshot, StoredResult } from "../../src/domain";
import type { GraphRunSpec } from "../../src/graph-adapter";
import type { WorkUnit } from "../../src/planner";
import { assertSnapshotContract, type GraphSnapshotV1 } from "../../src/graph";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { prepareGraph, type GraphPreparation } from "../../src/graph-pipeline";
import { hash } from "../../src/validation";

export function snapshotFixture(count = 4, calls: Array<[number, number]> = []): GraphSnapshotV1 {
  const source = assertSnapshotContract(JSON.parse(readFileSync(join(import.meta.dir, "..", "fixtures/graph/communities-obvious/content.json"), "utf8")));
  const template = source.nodes[0]!, edge = source.edges[0]!;
  const nodes = Array.from({ length: count }, (_, i) => {
    const rva = 0x2000 + i * 0x100, hex = (n: number) => `0x${n.toString(16).toUpperCase()}`;
    return { ...structuredClone(template), id: `${template.moduleSha256}:${hex(rva)}`, rva: hex(rva), ea: hex(0x400000 + rva), boundaries: [{ ordinal: 0, rva: hex(rva), endRvaExclusive: hex(rva + 16), role: "entry" as const }] };
  });
  const edges = calls.map(([from, to], i) => {
    const caller = nodes[from]!, callee = nodes[to]!, siteRva = `0x${(BigInt(caller.rva) + 4n).toString(16).toUpperCase()}`;
    return { ...structuredClone(edge), id: `edge:central-fixture:${i}`, sourceId: caller.id, destinationId: callee.id,
      sites: [{ ...structuredClone(edge.sites[0]!), siteRva, provenance: { ...structuredClone(edge.sites[0]!.provenance), siteRva, evidenceSha256: hash(`offline-site:${siteRva}:${i}`) } }] };
  });
  return buildGraphSnapshot({ missionId: "central-fixture", snapshotId: `snapshot:central:${count}:${hash(JSON.stringify(calls)).slice(0, 12)}`, artifacts: source.binaryArtifacts, nodes, edges,
    objects: [], unresolved: [], capabilities: [], knowledgeRevision: 1, scopeDescription: "Explicit synthetic central integration fixture, no native authority", coverage: source.coverage,
    toolVersions: source.toolVersions, configFingerprint: source.configFingerprint }).snapshot;
}
export function preparation(snapshot = snapshotFixture()): GraphPreparation {
  return { version: "l8-graph-preparation-v1", snapshot, cluster: { algorithm: "historical-cc" }, groups: { minSize: 1, maxSize: 1 },
    policy: { version: "central-fixture-policy-v1", estimationVersion: "central-estimates-v1", investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
      contextEnvelopeMaxUtf8Bytes: 1_000_000, totalContextBudgetUtf8Bytes: 100_000_000, maxSelectedUnits: 1000, sccMaxFunctions: 1000, sccMaxIterations: 2, sccCostBudget: 1_000_000,
      requirementsByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { functionId: node.id, moduleSha256: node.moduleSha256, artifactId: `artifact:${hash(node.id)}`,
        artifactSha256: hash(`C:${node.id}`), artifactKind: "reconciled_c" as const, minimumRevision: 2, maximumRevision: 2, publicationLevel: 1 as const, validation: "fixture-only" as const }])),
      estimatesByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { version: "central-estimates-v1", A: 1, B: 1, R: 1, validation: 1 }])),
      resourcesByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { profiles: ["fixture-worker"], models: ["fixture/local#high"], tools: [], accounts: ["fixture-account"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])) } };
}
export function preparedFixture(snapshot = snapshotFixture()) { return prepareGraph(preparation(snapshot)); }
/** Unique retained directory: no deletes of fixture databases or WAL evidence. */
export function fixturePath(): string { return join(mkdtempSync(join(process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Temp/opencode") : process.env.TEMP!, "l8-central-")), "own.db"); }
export function missionFixture(snapshot = snapshotFixture()): MissionConfig {
  const artifact = snapshot.binaryArtifacts[0]!, model = { providerID: "fixture", id: "local", variant: "high" };
  return { schemaVersion: 1, missionId: snapshot.missionId, binary: { sha256: artifact.contentSha256, version: artifact.versionLabel }, fixture: true,
    evaluation: { method: "fixture", version: "v1", maxDifficulty: 100 }, subsetSize: snapshot.nodes.length, maxCycles: 2, stagnationLimit: 2,
    models: { A: model, B: model, R: model, explore: model, evaluate: model }, knowledge: { version: "fixture-knowledge-v1", fingerprint: hash("fixture-knowledge"), leadsFingerprint: hash("fixture-leads"), files: [] },
    commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: join(dirname(fixturePath()), "output") };
}
export function initialSnapshot(config: MissionConfig): Snapshot {
  return { schemaVersion: 1, missionId: config.missionId, revision: 0, config, status: "running", cycle: 1, stage: "group", candidates: [],
    cycles: [{ number: 1, knowledge: structuredClone(config.knowledge), groups: [], subset: [], frozen: false }], intents: [], reconciliations: [], noProgressCycles: 0 };
}
export function graphSpec(snapshot = snapshotFixture(), maxConcurrent = 4): GraphRunSpec {
  return { prepared: preparedFixture(snapshot), settings: { profiles: { A: "fixture-worker", B: "fixture-worker", R: "fixture-worker" }, maxConcurrent, familyTtlEvents: 10000, maxAdmissionAttempts: 3, retryDelayMs: 10 },
    workers: Array.from({ length: maxConcurrent }, (_, i) => ({ workerId: `fixture-worker:${i}`, profile: "fixture-worker", model: "fixture/local#high", tools: [], accountId: "fixture-account", slots: 1, cpu: 1, gpu: 0, budget: 1000, available: true })),
    accounts: [{ accountId: "fixture-account", slots: maxConcurrent, budget: 10000 }], inputsByFunction: {},
    publicationsByFunction: Object.fromEntries(snapshot.nodes.map(n => [n.id, { artifactId: `artifact:${hash(n.id)}`, artifactKind: "reconciled_c" as const, content: `C:${n.id}` }])) };
}
export function fixtureInputs(snapshot: Snapshot, sub: WorkUnit["subIntents"][number], proposals?: StoredResult[]): InputBundle {
  return { schemaVersion: 1, role: sub.role, cycle: snapshot.cycle, identity: structuredClone(sub.harnessIdentity), files: proposals?.map(p => ({ path: p.path, sha256: p.sha256, version: p.resultId, kind: "proposal" as const, provenance: "explicit fixture proposal" })) ?? [],
    accessibleRules: [], requiredTools: [], knowledge: structuredClone(snapshot.config.knowledge), ...(proposals ? { proposals: proposals.map(({ resultId, sha256, path, authorId, executionId, sessionId, content, document }) => ({ resultId, sha256, path, authorId, executionId, sessionId, content, document })) } : {}) };
}
