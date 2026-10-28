import { describe, expect, test } from "bun:test";
import { projectFunctionRelations, validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { projectStructural } from "../../src/cluster";
import { clusterMultiview } from "../../src/semantic-index";
import { planMission } from "../../src/planner";
import { callEdge, fixture, groupsFor, jsonClone, oracleDigest, owner, partsOf, planned, policyFor,
  readiness, receiptFor, shardedSnapshot, siteAt, snapshotOf } from "./graph-interop-support";

describe("L7 interop: L2 transport relations through L3/L4/L5", () => {
  for (const count of [64, 65, 129]) test(`${count} real normalized site proofs survive every downstream projection`, () => {
    const snapshot = jsonClone(shardedSnapshot(count));
    expect(validateGraphSnapshot(snapshot)).toEqual([]);
    expect(snapshot.edges.map(e => e.sites.length).sort((a, b) => b - a)).toEqual(
      count === 64 ? [64] : count === 65 ? [64, 1] : [64, 64, 1]);
    const expectedSites = Array.from({ length: count }, (_, i) => siteAt(snapshot, 0, i + 1, `proof-${i}`));
    const expectedProofs = expectedSites.map(s => `${s.siteRva}:${s.provenance.evidenceSha256}`).sort();
    expect(projectFunctionRelations(snapshot)).toHaveLength(1);
    expect(projectFunctionRelations(snapshot)[0]!.sites.map(s => `${s.siteRva}:${s.provenance.evidenceSha256}`).sort()).toEqual(expectedProofs);
    expect(snapshot.normalizedFingerprint).toBe(oracleDigest(snapshot, "normalizedFingerprint"));
    const structural = projectStructural(snapshot), semantic = clusterMultiview({ snapshot });
    expect(structural.graph.arcs).toHaveLength(1);
    expect(semantic.pass).toBe(true);
    expect(semantic.relations).toHaveLength(1);
    expect(semantic.dependencyEdges).toHaveLength(1);
    expect(semantic.dependencyEdges[0]!.sites).toHaveLength(count);
    const result = planned(snapshot), relation = result.sidecar.relationView.relations[0]!;
    expect(result.sidecar.relationView.relations).toHaveLength(1);
    expect(relation.sites.map(s => `${s.siteRva}:${s.provenance.evidenceSha256}`).sort()).toEqual(expectedProofs);
    for (const origin of snapshot.edges) {
      const observation = relation.observations.find(o => o.sourceEdgeIds.includes(origin.id))!;
      expect(observation.sitesBySourceEdgeId[origin.id]!.map(s => `${s.siteRva}:${s.provenance.evidenceSha256}`).sort())
        .toEqual(origin.sites.map(s => `${s.siteRva}:${s.provenance.evidenceSha256}`).sort());
    }
    const caller = owner(result, snapshot.nodes[0]!.id), callee = owner(result, snapshot.nodes[1]!.id);
    expect(result.plan.g1Edges.map(e => [e.fromUnitId, e.toUnitId])).toEqual([[callee.unitId, caller.unitId]]);
    expect(readiness(result, caller).ready).toBe(false);
    expect(readiness(result, callee).ready).toBe(true);
    expect(result.plan.fingerprint).toBe(oracleDigest(result.plan, "fingerprint"));
    expect(result.sidecar.fingerprint).toBe(oracleDigest(result.sidecar, "fingerprint"));
    const permuted = partsOf(jsonClone(snapshot));
    permuted.nodes.reverse(); permuted.edges.reverse();
    permuted.edges.forEach(e => { e.id = ""; e.sites.reverse(); }); // raw builder sentinel, not a forged content-bound shard ID
    expect(buildGraphSnapshot(permuted).snapshot).toEqual(snapshot);
  });

  test("different valid shard packing changes transport identity, not the call/dependency/proof semantics", () => {
    const original = shardedSnapshot(65), repacked = jsonClone(original), sites = original.edges.flatMap(e => e.sites);
    repacked.edges = [1, 64].map((n, i) => ({ ...jsonClone(original.edges[0]!), id: `transport:repack:${i}`,
      sites: jsonClone(sites.slice(i === 0 ? 0 : 1, i === 0 ? n : 65)) }));
    repacked.normalizedFingerprint = oracleDigest(repacked, "normalizedFingerprint");
    expect(validateGraphSnapshot(repacked)).toEqual([]);
    expect(repacked.normalizedFingerprint).not.toBe(original.normalizedFingerprint);
    for (const snapshot of [original, repacked]) {
      const result = planned(snapshot);
      expect(result.plan.g1Edges).toHaveLength(1);
      expect(result.sidecar.relationView.relations[0]!.sites).toHaveLength(65);
      expect(result.units.map(u => u.ownedFunctionIds)).toEqual(original.nodes.map(n => [n.id]));
      expect(projectStructural(snapshot).graph.arcs.map(a => [a.source, a.target, a.weight])).toEqual([[0, 1, 1]]);
    }
  });

  test("conflicting native shard metadata is rejected before clustering/planning can hide it", () => {
    const snapshot = shardedSnapshot(65), conflicting = jsonClone(snapshot);
    conflicting.edges[1]!.confidence = "low";
    conflicting.normalizedFingerprint = oracleDigest(conflicting, "normalizedFingerprint");
    expect(() => projectFunctionRelations(conflicting)).toThrow();
    expect(() => projectStructural(conflicting)).toThrow();
    const semantic = clusterMultiview({ snapshot: conflicting });
    expect(semantic.pass).toBe(false);
    expect(semantic.diagnostics.some(d => d.severity === "fail")).toBe(true);
    const grouped = groupsFor(snapshot);
    expect(() => planMission(conflicting, grouped.groups, policyFor(conflicting, grouped.partition.partitionId))).toThrow();
  });

  test("callback DATA, retired calls and unresolved imports never become hidden obligatory work", () => {
    const snapshot = snapshotOf(4), parts = partsOf(snapshot);
    const callback = callEdge(snapshot, 0, 1); callback.kind = "callback_candidate";
    callback.status = "inferred"; callback.schedulerRelevance = "hypothesis_not_call";
    callback.sites = callback.sites.map(s => ({ ...s, xrefType: "data", provenance: { ...s.provenance, xrefType: "data" } }));
    const retired = callEdge(snapshot, 0, 2); retired.retiredInRevision = 1;
    parts.edges = [callback, retired, callEdge(snapshot, 3, 3)];
    const result = planned(buildGraphSnapshot(parts).snapshot);
    expect(result.plan.g1Edges).toEqual([]);
    expect(result.plan.sccs.filter(s => s.exclusive).map(s => s.functionIds)).toEqual([[snapshot.nodes[3]!.id]]);
    expect(result.units.every(u => u.prerequisites.every(p => p.kind !== "obligatory"))).toBe(true);
    const imports = fixture<GraphSnapshotV1>("ff8-imports-thunks"), importedPlan = planned(imports);
    const importedObjectIds = new Set(imports.objects.filter(o => o.kind === "import").map(o => o.id));
    expect(importedObjectIds.size).toBeGreaterThan(0);
    expect(importedPlan.units.flatMap(u => u.ownedFunctionIds).some(id => importedObjectIds.has(id))).toBe(false);
    expect(importedPlan.plan.g1Edges.every(e => imports.nodes.some(n => n.id === e.callDestinationFunctionId))).toBe(true);
  });

  for (const id of ["constructor", "toString", "hasOwnProperty"]) test(`own vs inherited policy keys: ${id}`, () => {
    const snapshot = snapshotOf(2, [[0, 1]]); snapshot.edges[0]!.id = id;
    snapshot.normalizedFingerprint = oracleDigest(snapshot, "normalizedFingerprint");
    const grouped = groupsFor(snapshot), base = policyFor(snapshot, grouped.partition.partitionId);
    for (const dictionary of [undefined, {}, Object.create({ [id]: "optional" })]) {
      const result = planMission(snapshot, grouped.groups, { ...base, edgeKinds: dictionary,
        dispensationsByEdge: {}, externalReceiptsByEdge: {} });
      expect(result.plan.g1Edges[0]!.kind).toBe("obligatory");
    }
    const explicit = planMission(snapshot, grouped.groups, { ...base, edgeKinds: { [id]: "optional" } });
    expect(explicit.plan.g1Edges[0]!.kind).toBe("optional");
  });

  for (const selection of ["caller-only", "separate", "same-unit"] as const)
    test(`external null-producer receipt stays external with ${selection}`, () => {
      const snapshot = shardedSnapshot(65), grouped = groupsFor(snapshot, selection === "same-unit" ? 2 : 1);
      const policy = policyFor(snapshot, grouped.partition.partitionId), requirement = policy.requirementsByFunction[snapshot.nodes[1]!.id]!;
      policy.edgeKinds = Object.fromEntries(snapshot.edges.map(e => [e.id, "external_satisfied"]));
      policy.externalReceiptsByEdge = Object.fromEntries(snapshot.edges.map(e => [e.id, receiptFor(requirement, null)]));
      const groups = selection === "caller-only" ? grouped.groups.filter(g => g.ownedFunctionIds.includes(snapshot.nodes[0]!.id)) : grouped.groups;
      const result = planMission(snapshot, groups, policy), caller = owner(result, snapshot.nodes[0]!.id);
      expect(caller.prerequisites).toHaveLength(1);
      expect(caller.prerequisites[0]!.producerUnitId).toBeNull();
      expect(caller.prerequisites[0]!.kind).toBe("external_satisfied");
      expect(readiness(result, caller).ready).toBe(true);
      expect(readiness(result, caller, [{ ...receiptFor(requirement, null), knowledgeRevision: 2,
        futurePrerequisiteEffect: "invalidates_future" }]).ready).toBe(false);
      expect(readiness(result, caller, [{ ...receiptFor(requirement, "unrelated-local-unit"), knowledgeRevision: 0,
        futurePrerequisiteEffect: "invalidates_future" }]).ready).toBe(true);
    });
});
