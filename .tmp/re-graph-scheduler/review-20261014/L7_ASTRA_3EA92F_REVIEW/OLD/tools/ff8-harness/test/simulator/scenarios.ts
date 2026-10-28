import { hash } from "../../src/validation";
import type { SimPlanInput, SimScenario, SimUnitInput } from "../../src/simulator";
import type { PlannerGraphInput, PlannerPolicy, PlannerGroupInput } from "../../src/planner";

export const MODULE = hash("independent-L7-fixture");
export const fn = (index: number): string => `${MODULE}:0x${(index + 1).toString(16).toUpperCase()}`;
export function unit(id: string, functions = [fn(id.charCodeAt(0))]): SimUnitInput {
  return { unitId: id, ownedFunctionIds: functions, contextFunctionIds: [], investigationKind: "decompilation", requiredPublicationLevel: 1, knowledgeRevision: 1, prerequisites: [], conflicts: [] };
}
/** Calls A->B supplied explicitly; this adapter reverses once into work B->A. */
export function scenario(ids: string[], calls: Array<[string, string]> = [], workers = 8): SimScenario {
  const units = ids.map(id => unit(id)), byId = new Map(units.map(u => [u.unitId, u]));
  const plan: SimPlanInput = { planId: "plan:manual-L7", missionId: "mission:fixture", knowledgeRevision: 1, units, g1Edges: [], g2Conflicts: [], budgets: { contextEnvelopeMaxUtf8Bytes: 100_000, nativeLineCharLimit: 2000 } };
  for (const [caller, callee] of calls) {
    byId.get(caller)!.prerequisites.push({ producerUnitId: callee, kind: "obligatory", requiredPublicationLevel: 1, dispensed: false });
    plan.g1Edges.push({ fromUnitId: callee, toUnitId: caller, kind: "obligatory", callSourceFunctionId: byId.get(caller)!.ownedFunctionIds[0]!, callDestinationFunctionId: byId.get(callee)!.ownedFunctionIds[0]! });
  }
  return { plan, config: { controllerId: "controller:one", workers: Array.from({ length: workers }, () => ({ profile: "build", accountId: "shared", tools: ["cpu"], model: "offline", slots: 1, cpu: 1, gpu: 0, budget: 1_000_000 })), accountCapacities: { shared: { slots: workers, budget: 1_000_000 } }, leaseTicks: 64, heartbeatEvery: 8, validationTicks: 1, maxAttempts: 3, maxTicks: 10_000_000, policy: "event_driven" }, durations: { A: 2, B: 3, R: 1 } };
}
export function plannerFixture(count: number, calls: Array<[number, number]>, grouped?: number[][]): { graph: PlannerGraphInput; policy: PlannerPolicy; groups: PlannerGroupInput[] } {
  const graph: PlannerGraphInput = { schemaVersion: 1, snapshotId: "snapshot:L7", missionId: "mission:fixture", normalizedFingerprint: hash("snapshot:L7"), knowledgeRevision: 1,
    binaryArtifacts: [{ contentSha256: MODULE, versionLabel: "fixture", imageBase: "0x400000" }],
    nodes: Array.from({ length: count }, (_, n) => ({ id: fn(n), moduleSha256: MODULE, rva: `0x${(n + 1).toString(16).toUpperCase()}`, ea: `0x${(0x400001 + n).toString(16).toUpperCase()}`, imageBase: "0x400000", functionClass: "internal", status: "observed" })),
    edges: calls.map(([a, b], i) => ({ id: `edge:${i}`, sourceId: fn(a), destinationId: fn(b), kind: "direct_call", status: "observed", schedulerRelevance: "may_block", retiredInRevision: null })),
    unresolved: [], coverage: { status: "complete", selfLoopsPreserved: true, tailsIterated: true } };
  const policy: PlannerPolicy = { version: "L7-v1", estimationVersion: "durations:v1", partitionId: "partition:manual", investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 100_000_000, totalContextBudgetUtf8Bytes: 1_000_000_000, maxSelectedUnits: 100_000, sccMaxFunctions: 100_000, sccMaxIterations: 2, sccCostBudget: 100_000_000,
    requirementsByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { functionId: n.id, moduleSha256: MODULE, artifactId: `artifact:${n.id}`, artifactSha256: hash(`C:${n.id}`), artifactKind: "reconciled_c", minimumRevision: 2, maximumRevision: count + 5, publicationLevel: 1, validation: "fixture-only" }])),
    estimatesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { version: "durations:v1", A: 2, B: 3, R: 1, validation: 1 }])),
    resourcesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { profiles: ["build"], models: ["offline"], tools: ["cpu"], accounts: ["shared"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])) };
  const groups = (grouped ?? graph.nodes.map((_, i) => [i])).map((ids, i) => ({ groupId: `manual:${i}`, partitionId: policy.partitionId, ownedFunctionIds: ids.map(fn), contextFunctionIds: [] }));
  return { graph, policy, groups };
}
