import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateGraphSnapshot, type GraphSnapshotV1 } from "../../src/graph";
import { buildFf8GraphSnapshot, buildGraphSnapshot } from "../../src/graph-normalize";
import { clusterGraph, conductance, directedModularity, exportSparseGraph, importSparseGraph,
  personalizedPageRank, projectStructural, ClusterDiagnosticError } from "../../src/cluster";
import { buildInvestigationGroups } from "../../src/investigation-groups";
import { planMission } from "../../src/planner";
import { FIXTURES, fixture, jsonClone, oracleDigest, partsOf, planned, policyFor, RARE_BRIDGE_V1, REPO,
  sha256, snapshotOf, syntheticRareBridgeDeclaredSpanV1 } from "./graph-interop-support";

function assertCrossedStructure(snapshot: GraphSnapshotV1): void {
  const before = JSON.stringify(snapshot);
  expect(validateGraphSnapshot(snapshot)).toEqual([]);
  expect(snapshot.normalizedFingerprint).toBe(oracleDigest(snapshot, "normalizedFingerprint"));
  const structural = clusterGraph(snapshot, { algorithm: "hub-baseline", maxCommunitySize: 2 });
  const grouped = buildInvestigationGroups(snapshot, structural.partition, { minSize: 1, maxSize: 2, maxContextFunctions: 2 });
  const expected = snapshot.nodes.map(n => n.id).sort(), owned = grouped.groups.flatMap(g => g.ownedFunctionIds);
  expect([...owned].sort()).toEqual(expected);
  expect(new Set(owned).size).toBe(owned.length);
  for (const group of grouped.groups) {
    expect(group.ownedFunctionIds.length).toBeLessThanOrEqual(2);
    expect(group.contextFunctionIds.length).toBeLessThanOrEqual(2);
    expect(group.contextFunctionIds.every(id => expected.includes(id) && !group.ownedFunctionIds.includes(id))).toBe(true);
    const byteCount = Buffer.byteLength(JSON.stringify(group.contextFunctionIds), "utf8");
    expect(grouped.metrics.contextIdListUtf8BytesByGroupId[group.groupId]).toBe(byteCount);
  }
  const policy = policyFor(snapshot, structural.partition.partitionId);
  if (snapshot.coverage.status === "diagnostic") expect(() => planMission(snapshot, grouped.groups, policy)).toThrow();
  else {
    const result = planMission(snapshot, grouped.groups, policy);
    const admissible = snapshot.nodes.filter(n => n.status === "observed" && !["import", "external", "incomplete"].includes(n.functionClass)).map(n => n.id).sort();
    expect(result.units.flatMap(u => u.ownedFunctionIds).sort()).toEqual(admissible);
    expect(result.plan.fingerprint).toBe(oracleDigest(result.plan, "fingerprint"));
    if (!snapshot.coverage.tailsIterated) expect(result.diagnostics.some(d => d.code === "partial-tail-coverage")).toBe(true);
  }
  expect(JSON.stringify(snapshot)).toBe(before);
  expect(snapshot.nodes.every(n => n.admissibleAsOracle === false)).toBe(true);
}

describe("L7 interop: L1/L2 -> structural numerics -> groups -> L5", () => {
  for (const [direction, seed, expected] of [
    ["callee", 0, [4 / 7, 2 / 7, 1 / 7]], ["caller", 2, [1 / 7, 2 / 7, 4 / 7]],
  ] as const) test(`closed-form three-node PPR with dangling personalization (${direction})`, () => {
    const snapshot = snapshotOf(3, [[0, 1], [1, 2]]), graph = projectStructural(snapshot).graph;
    const result = personalizedPageRank(graph, [snapshot.nodes[seed]!.id], { damping: .5, direction, tolerance: 1e-12, maxIterations: 300 });
    result.scores.forEach((score, i) => expect(Math.abs(score - expected[i]!)).toBeLessThan(2e-12));
    const [a, b, c] = result.scores, next = direction === "callee" ? [.5 + .5 * c!, .5 * a!, .5 * b!] : [.5 * b!, .5 * c!, .5 + .5 * a!];
    const residual = next.reduce((sum, score, i) => sum + Math.abs(score - result.scores[i]!), 0);
    expect(residual).toBeLessThanOrEqual(result.residualUpperBound);
    expect(Math.abs(result.scoreMass - 1)).toBeLessThan(1e-12);
    expect(result.converged).toBe(true);
    expect(result.numericStatus).toBe("certified");
    expect(result.danglingPolicy).toBe("personalization");
    const roundtrip = importSparseGraph(JSON.parse(JSON.stringify(exportSparseGraph(graph))));
    expect(roundtrip.ids).toEqual(snapshot.nodes.map(n => n.id));
    expect(roundtrip.arcs.map(a => [a.source, a.target, a.weight])).toEqual([[0, 1, 1], [1, 2, 1]]);
  });

  test("direct small cut/modularity equations and numerical refusal labels are preserved", () => {
    const path = projectStructural(snapshotOf(3, [[0, 1], [1, 0], [1, 2], [2, 1]])).graph;
    // m=4; C={0,1}: 2/4-3*3/16; C={2}: 0/4-1*1/16.
    expect(directedModularity(path, [0, 0, 1])).toBe(-1 / 8);
    expect(conductance(path, [0, 1])).toBe(1);
    const empty = snapshotOf(0);
    try { clusterGraph(empty); throw new Error("empty graph unexpectedly produced a v1 partition"); }
    catch (error) {
      expect(error).toBeInstanceOf(ClusterDiagnosticError);
      expect((error as ClusterDiagnosticError).diagnostic).toMatchObject({ version: "cluster-refusal-v1", code: "empty-snapshot-no-partition" });
    }
    const pair = snapshotOf(2, [[0, 1]]), projected = projectStructural(pair).graph;
    const constrained = personalizedPageRank(projected, [pair.nodes[0]!.id], { maxIterations: 1, tolerance: 1e-30 });
    expect(constrained.converged).toBe(false);
    expect(constrained.numericStatus).toBe("iteration-bound");
    expect(() => clusterGraph(pair, { algorithm: "ppr", seedIds: [pair.nodes[0]!.id], ppr: { maxScoreCells: 7 } })).toThrow(ClusterDiagnosticError);
  });

  const cases = ["communities-obvious", "components-disconnected", "hubs-utilities", "cycles-recursion", "isolates",
    "shared-data", "ff8-imports-thunks", "ff8-self-loop", "ff8-unknown-metrics", "ff8-chunks-tails",
    "ff8-idb-pe-quarantine", "ff8-data-callback-not-call", "ff8-multi-module", "ff8-same-name-different-hash",
    "ff8-identity-rename", "ff8-coverage-partial-tails"];
  for (const name of cases) test(`${name}: complete unique group ownership is not a native-completeness claim`, () => {
    assertCrossedStructure(fixture<GraphSnapshotV1>(name));
  });

  test("OPEN L1 anomaly: original pinned bridges-rare is correctly rejected, never skipped/repaired", () => {
    const path = join(FIXTURES, "bridges-rare/content.json"), raw = readFileSync(path), original = JSON.parse(raw.toString("utf8")) as GraphSnapshotV1;
    expect(sha256(raw)).toBe(RARE_BRIDGE_V1.rawSha256);
    expect(oracleDigest(original)).toBe(RARE_BRIDGE_V1.originalContentSha256);
    expect(original.normalizedFingerprint).toBe(RARE_BRIDGE_V1.originalNormalizedFingerprint);
    expect(oracleDigest(original, "normalizedFingerprint")).toBe(RARE_BRIDGE_V1.originalNormalizedFingerprint);
    expect(validateGraphSnapshot(original)).toEqual(["edge instruction site is outside source function chunks"]);
    expect(() => buildGraphSnapshot(partsOf(original))).toThrow("edge instruction site is outside source function chunks");
    expect(readFileSync(path)).toEqual(raw);
  });

  test("syntheticRareBridgeDeclaredSpanV1 is a separate explicit positive, not canonical L1 repair/native evidence", () => {
    const path = join(FIXTURES, "bridges-rare/content.json"), raw = readFileSync(path), original = JSON.parse(raw.toString("utf8")) as GraphSnapshotV1;
    const derived = syntheticRareBridgeDeclaredSpanV1();
    expect(derived.snapshotId).toBe(RARE_BRIDGE_V1.derivedSnapshotId);
    expect(derived.normalizedFingerprint).toBe(RARE_BRIDGE_V1.derivedNormalizedFingerprint);
    expect(derived.snapshotId).not.toBe(original.snapshotId);
    expect(derived.edges).toEqual(original.edges); expect(derived.coverage).toEqual(original.coverage);
    expect(derived.nodes.every(n => n.admissibleAsOracle === false && n.byteAgreement === "unknown")).toBe(true);
    const caller = derived.nodes.find(n => n.id === RARE_BRIDGE_V1.callerId)!;
    expect(caller.sizeBytes).toEqual({ known: true, value: 17 });
    expect(caller.boundaries).toEqual([{ ordinal: 0, rva: "0x2100", endRvaExclusive: "0x2111", role: "entry" }]);
    for (const a of derived.nodes) for (const b of derived.nodes) if (a.id !== b.id)
      for (const x of a.boundaries) for (const y of b.boundaries)
        expect(BigInt(x.endRvaExclusive) <= BigInt(y.rva) || BigInt(y.endRvaExclusive) <= BigInt(x.rva)).toBe(true);
    // Whole-document inverse delta proves no extra provenance/identity/unknown
    // field was silently changed by the explicit synthetic declaration.
    const inverse = jsonClone(derived), revertedCaller = inverse.nodes.find(n => n.id === RARE_BRIDGE_V1.callerId)!;
    inverse.snapshotId = original.snapshotId; inverse.normalizedFingerprint = original.normalizedFingerprint;
    revertedCaller.boundaries[0]!.endRvaExclusive = "0x2110"; revertedCaller.sizeBytes = { known: true, value: 16 };
    expect(inverse).toEqual(original);
    assertCrossedStructure(derived);
    const result = planned(derived), ids = derived.nodes.map(n => n.id);
    expect(result.plan.sccs.map(s => s.functionIds).sort()).toEqual([[ids[0]!, ids[1]!], [ids[2]!, ids[3]!]].sort());
    expect(result.plan.g1Edges).toHaveLength(1);
    expect(result.plan.g1Edges[0]!.callSourceFunctionId).toBe(ids[1]!);
    expect(result.plan.g1Edges[0]!.callDestinationFunctionId).toBe(ids[2]!);
    expect(sha256(readFileSync(path))).toBe(RARE_BRIDGE_V1.rawSha256);
    expect(readFileSync(path)).toEqual(raw);
  });

  test("original FF8 raw98 is hash-bound and remains PARTIAL/quarantined through actual modules", () => {
    const native = join(REPO, ".tmp/ff8-decomp-semantics-20261011-r01/native");
    const manifestBytes = readFileSync(join(native, "TRANSFER_MANIFEST.json"));
    expect(sha256(manifestBytes)).toBe("79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5");
    const manifest = JSON.parse(manifestBytes.toString("utf8").replace(/^\uFEFF/, "")) as { files: number; entries: string[] };
    expect(manifest.files).toBe(98); expect(manifest.entries).toHaveLength(98);
    const frozenFunctions = manifest.entries.map(line => {
      const [name, length, digest] = line.split(" "), bytes = readFileSync(join(native, name!));
      expect(bytes.byteLength).toBe(Number(length)); expect(sha256(bytes)).toBe(digest!);
      return { rawUtf8: bytes.toString("utf8"), sha256: digest! };
    });
    type Input = Parameters<typeof buildFf8GraphSnapshot>[0];
    const document = <T>(path: string): T => JSON.parse(readFileSync(join(REPO, path), "utf8"));
    const discovery = "docs/tech/investigation/battle-static-discovery/", run01 = "docs/missions/ff8-decomp-semantics-2026-10-11-run01/";
    const bytes = (name: string) => readFileSync(join(REPO, discovery, name));
    const { snapshot } = buildFf8GraphSnapshot({ missionId: "graph-interop-frozen-FF8", frozenFunctions,
      ledger: document<Input["ledger"]>(discovery + "battle-graph-ledger.json"), ledgerSha256: sha256(bytes("battle-graph-ledger.json")),
      indirect: document<Input["indirect"]>(discovery + "battle-indirect-registry.json"), indirectSha256: sha256(bytes("battle-indirect-registry.json")),
      magic: document<Input["magic"]>(discovery + "magic-registry.json"), magicSha256: sha256(bytes("magic-registry.json")),
      run01: document<Input["run01"]>(run01 + "native-groups.json"), peVerification: document<Input["peVerification"]>(run01 + "native-pe-verification.json") });
    expect(snapshot.coverage.status).toBe("partial");
    expect(snapshot.nodes.every(n => n.admissibleAsOracle === false)).toBe(true);
    for (const ea of ["0x465720", "0x495960", "0x48D200", "0x48FE20"]) {
      const node = snapshot.nodes.find(n => n.ea === ea)!;
      expect(node.status).toBe("quarantined"); expect(node.byteAgreement).toBe("divergent");
    }
    const clustered = clusterGraph(snapshot, { algorithm: "hub-baseline" });
    const grouped = buildInvestigationGroups(snapshot, clustered.partition, { minSize: 1, maxSize: 8 });
    expect(grouped.groups.flatMap(g => g.ownedFunctionIds).length).toBe(snapshot.nodes.length);
    // Raw98 is legacy evidence with self-loops stripped, NOT a schedulable native
    // graph. Even a zero-selection plan must not launder that missing proof.
    expect(snapshot.coverage.selfLoopsPreserved).toBe(false);
    expect(() => planMission(snapshot, grouped.groups,
      { ...policyFor(snapshot, clustered.partition.partitionId), maxSelectedUnits: 0 }))
      .toThrow("snapshot without preserved self-loops");
    expect(jsonClone(clustered.partition).snapshotFingerprint).toBe(snapshot.normalizedFingerprint);
  }, 30_000);
});
