// PROPOSED SOURCE ONLY. Parent places this file in candidate/tools/ff8-harness/test/.
import { expect, test } from "bun:test";
import { ClusterDiagnosticError as PublicError, clusterGraph, type ClusterInput } from "../src/cluster";
import { ClusterDiagnosticError as CodecError, sparseGraph } from "../src/sparse-graph-codecs";
import {
  prepareGroupContextSource, bindGroupContext, deriveFixedGroupContexts, deriveCommunityContextIds,
  type GroupContextPartition, type FixedGroupOwnership, type BoundGroupContextSource,
} from "../src/group-context-codecs";

const H = "a".repeat(64);
const id = (n: number): string => `${H}:0x${n.toString(16).toUpperCase()}`;
function fixture() {
  const input: ClusterInput = {
    snapshotId: "snapshot:fixed-api", normalizedFingerprint: "b".repeat(64),
    nodes: [16, 32, 48].map(n => ({ id: id(n), moduleSha256: H, rva: `0x${n.toString(16).toUpperCase()}`,
      functionClass: "internal", status: "observed", semanticMaturity: "structural",
      sizeBytes: { known: true, value: 8 }, instructionCount: { known: true, value: 2 } })),
    edges: [], objects: [], unresolved: [], capabilities: [],
    coverage: { status: "complete", uncoveredReason: null },
  };
  const partition: GroupContextPartition = {
    schemaVersion: 1, partitionId: "partition:fixed-api", snapshotId: input.snapshotId,
    snapshotFingerprint: input.normalizedFingerprint,
    communities: [
      { contentId: "community:kernel", memberIds: [id(32), id(16)], kernelIds: [id(16)], externalContextIds: [] },
      { contentId: "community:emptykernel", memberIds: [id(48)], kernelIds: [], externalContextIds: [] },
    ],
  };
  return { input, partition }; // DATA ONLY: no scientific call before a guard.
}
// Local identity/order supplement to structuredClone, not a second event observer.
// Actual object/function identities, prototypes, aliases and Map/Set iteration
// order are retained across each individual call, including a throwing call.
function referenceOrder(value: unknown, seen = new Set<object>()): unknown[] {
  if (value === null || typeof value !== "object" && typeof value !== "function") return [value];
  const out: unknown[] = [value];
  if (seen.has(value)) return out;
  seen.add(value); out.push(Object.getPrototypeOf(value));
  if (typeof value === "function") return out; // only the known bound rank closure
  if (value instanceof Map) for (const [key, item] of value) out.push(...referenceOrder(key, seen), ...referenceOrder(item, seen));
  if (value instanceof Set) for (const item of value) out.push(...referenceOrder(item, seen));
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (d === undefined || !Object.hasOwn(d, "value")) throw new Error("qualification: unsupported guard descriptor");
    const item: unknown = d.value;
    out.push(key, d.enumerable, d.configurable, d.writable, ...referenceOrder(item, seen));
  }
  return out;
}
function guarded<T>(state: unknown, action: () => T, data = () => state): T {
  const before = structuredClone(data()), references = referenceOrder(state);
  try { return action(); }
  finally {
    expect(data()).toEqual(before);
    const after = referenceOrder(state); expect(after).toHaveLength(references.length);
    after.forEach((value, i) => expect(value).toBe(references[i]));
  }
}
function checkedPrepare(input: ClusterInput, partition: GroupContextPartition,
  overrides: Parameters<typeof prepareGroupContextSource>[2], adjacency: Parameters<typeof prepareGroupContextSource>[3]) {
  return guarded({ input, partition, overrides, adjacency }, () => prepareGroupContextSource(input, partition, overrides, adjacency));
}
function checkedBind(prepared: Parameters<typeof bindGroupContext>[0], hubs: string[]) {
  return guarded({ prepared, hubs }, () => bindGroupContext(prepared, hubs));
}
function checkedSource(input: ClusterInput, partition: GroupContextPartition,
  adjacency: Parameters<typeof prepareGroupContextSource>[3] = { kind: "raw-active-control-relations" }) {
  return checkedBind(checkedPrepare(input, partition, {}, adjacency), []);
}
function checkedDerive(source: BoundGroupContextSource, groups: FixedGroupOwnership[]) {
  return guarded({ source, groups }, () => deriveFixedGroupContexts(source, groups),
    () => ({ source: { ...source, contextRank: undefined }, groups }));
}
function checkedGraph(ids: Parameters<typeof sparseGraph>[0], arcs: Parameters<typeof sparseGraph>[1]) {
  return guarded({ ids, arcs }, () => sparseGraph(ids, arcs));
}
function checkedCommunity(graph: Parameters<typeof deriveCommunityContextIds>[0], members: Parameters<typeof deriveCommunityContextIds>[1]) {
  return guarded({ graph, members }, () => deriveCommunityContextIds(graph, members));
}
function refusal(action: () => unknown, message: string): Error {
  let caught: unknown;
  try { action(); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(Error);
  if (!(caught instanceof Error)) throw new Error("qualification: refusal absent");
  expect(caught.name).toBe("Error");
  expect(caught.message).toBe(message);
  return caught;
}
// This is a small, explicit nonmutation readout, not a second general observer.
// structuredClone below separately covers all values and reference aliases.
function mapOrder(source: BoundGroupContextSource) {
  return {
    nodes: [...source.nodes], communities: [...source.communities], membership: [...source.membership],
    neighbors: [...source.neighbors].map(([key, value]) => [key, [...value]]),
    contexts: [...source.contextByCommunity], hubs: [...source.hubSet],
    affinityOut: source.source.kind === "provided-affinity" ? source.source.graph.out.map(m => [...m]) : null,
    affinityIn: source.source.kind === "provided-affinity" ? source.source.graph.incoming.map(m => [...m]) : null,
  };
}

for (const groupId of ["__proto__", "constructor", "toString", "hasOwnProperty", "ordinary:group"]) {
  test(`fixed supplied ID own metrics: ${groupId}`, () => {
    const { input, partition } = fixture(), source = checkedSource(input, partition);
    const groups: FixedGroupOwnership[] = [{ groupId, ownedFunctionIds: [id(16)] }];
    const r = checkedDerive(source, groups);
    expect(r.contexts).toHaveLength(1);
    expect(r.contexts[0]!.groupId).toBe(groupId);
    expect(r.contexts[0]!.contextFunctionIds).toEqual([]);
    expect(r.contexts[0]!.uncoveredIds).toEqual([id(32)]);
    const m = r.metrics;
    for (const record of [m.sourceCommunitiesByGroupId, m.kernelIdsByGroupId,
      m.contextIdListUtf8BytesByGroupId, m.omittedContextIdsByGroupId]) {
      expect(Object.getPrototypeOf(record)).toBe(null);
      expect(Reflect.ownKeys(record)).toEqual([groupId]);
      expect(Object.hasOwn(record, groupId)).toBe(true);
      const restored: unknown = JSON.parse(JSON.stringify(record));
      expect(restored !== null && typeof restored === "object" && Object.hasOwn(restored, groupId)).toBe(true);
      expect(Reflect.ownKeys(restored as object)).toEqual([groupId]);
      expect((restored as Record<string, unknown>)[groupId]).toEqual(record[groupId]);
    }
    expect(groups).toEqual([{ groupId, ownedFunctionIds: [id(16)] }]);
    expect(m.sourceCommunitiesByGroupId[groupId]).toEqual(["community:kernel"]);
    expect(m.kernelIdsByGroupId[groupId]).toEqual([id(16)]);
    expect(m.contextIdListUtf8BytesByGroupId[groupId]).toBe(2); // UTF-8 bytes of literal []
    expect(m.omittedContextIdsByGroupId[groupId]).toEqual([]);
    expect(m.ownerByFunctionId[id(16)]).toBe(groupId);
    expect(m.uncoveredOwnerByFunctionId[id(32)]).toBe(groupId);
    expect(m.uncoveredCommunityByFunctionId[id(48)]).toBe("community:emptykernel");
    expect(m.nonCoveredIds).toEqual([id(32), id(48)]);
  });
}

test("single diagnostic constructor and exact empty-snapshot refusal", () => {
  expect(PublicError).toBe(CodecError);
  const own = new CodecError({ version: "cluster-refusal-v1", code: "unsupported-numeric", detail: "own fixture" });
  expect(own instanceof PublicError).toBe(true);
  expect(own.name).toBe("ClusterDiagnosticError");
  expect(own.message).toBe("cluster: unsupported-numeric: own fixture; no partition produced");
  const { input } = fixture(); input.nodes = [];
  let caught: unknown;
  try { guarded(input, () => clusterGraph(input)); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(PublicError);
  expect(caught).toBeInstanceOf(CodecError);
  if (!(caught instanceof CodecError)) throw new Error("qualification: empty snapshot accepted/wrong error");
  expect(caught.name).toBe("ClusterDiagnosticError");
  expect(caught.diagnostic).toEqual({ version: "cluster-refusal-v1", code: "empty-snapshot-no-partition",
    detail: "L2 empty snapshot is valid, but v1 partition requires at least one nonempty community" });
  expect(Object.hasOwn(caught.diagnostic, "counts")).toBe(false);
  expect(caught.message).toBe("cluster: empty-snapshot-no-partition: L2 empty snapshot is valid, but v1 partition requires at least one nonempty community; no partition produced");
});

test("prepared/bound/maps/graph/caches stay unchanged; ownership refusals and uncovered work", () => {
  const { input, partition } = fixture();
  const graph = checkedGraph(input.nodes.map(n => n.id), [
    { source: 0, target: 2, weight: 1 }, { source: 0, target: 2, weight: 2 ** -54 },
  ]);
  const adjacency = { kind: "provided-affinity" as const, graph };
  const prepared = checkedPrepare(input, partition, {}, adjacency);
  const preparedBefore = structuredClone(prepared), graphBefore = structuredClone(graph);
  const source = checkedBind(prepared, [id(48)]);
  expect(prepared).toEqual(preparedBefore);
  expect(source.nodes).toBe(prepared.nodes); expect(source.neighbors).toBe(prepared.neighbors);
  expect(source.source).toBe(adjacency); expect(source.input).toBe(input); expect(source.partition).toBe(partition);
  const rank = source.contextRank, boundBefore = structuredClone({ ...source, contextRank: undefined });
  const orderBefore = structuredClone(mapOrder(source));
  const references = () => [source.nodes, source.communities, source.membership, source.neighbors,
    source.contextByCommunity, source.hubSet, source.isolatedIds, source.hubIds,
    ...source.neighbors.values(), ...source.contextByCommunity.values(), graph.ids, graph.arcs,
    graph.out, graph.incoming, ...graph.out, ...graph.incoming, graph.outDegree, graph.inDegree,
    graph.numericPolicy, graph.numericSource, graph.numericSource!.arcs];
  const referencesBefore = references();
  const groups: FixedGroupOwnership[] = [{ groupId: "g", ownedFunctionIds: [id(16)] }];
  const groupsBefore = structuredClone(groups);
  checkedDerive(source, groups);
  expect(source.contextRank).toBe(rank);
  expect({ ...source, contextRank: undefined }).toEqual(boundBefore);
  expect(mapOrder(source)).toEqual(orderBefore);
  expect(graph).toEqual(graphBefore); expect(prepared).toEqual(preparedBefore);
  expect(groups).toEqual(groupsBefore);
  for (const [owners, detail] of [
    [[], "fixed groups empty"],
    [[{ groupId: "", ownedFunctionIds: [id(16)] }], "fixed group ID empty/duplicate"],
    [[{ groupId: "g", ownedFunctionIds: [] }], "fixed group empty ownership"],
    [[{ groupId: "g", ownedFunctionIds: [id(32)] }], "fixed owner unknown/non-kernel"],
    [[{ groupId: "g", ownedFunctionIds: [id(999)] }], "fixed owner unknown/non-kernel"],
    [[{ groupId: "g", ownedFunctionIds: [id(16), id(16)] }], "duplicate investigation owner"],
    [[{ groupId: "g", ownedFunctionIds: [id(16)] }, { groupId: "h", ownedFunctionIds: [id(16)] }], "duplicate investigation owner"],
    [[{ groupId: "g", ownedFunctionIds: [id(16)] }, { groupId: "g", ownedFunctionIds: [id(16)] }], "fixed group ID empty/duplicate"],
  ] satisfies Array<[FixedGroupOwnership[], string]>) {
    refusal(() => checkedDerive(source, owners), `investigation-groups: ${detail}`);
  }
  const two = structuredClone(partition);
  two.communities = [{ ...two.communities[0]!, kernelIds: [id(16), id(32)] }, two.communities[1]!];
  const twoSource = checkedSource(input, two);
  refusal(() => checkedDerive(twoSource, groups), "investigation-groups: fixed groups missing kernel owner");
  // Owned-but-unobserved and owned-incomplete remain owners AND uncovered work.
  for (const mode of ["unobserved", "incomplete"] as const) {
    const changed = structuredClone(input);
    if (mode === "unobserved") changed.nodes[0]!.status = "quarantined";
    else changed.nodes[0]!.functionClass = "incomplete";
    const bound = checkedSource(changed, partition);
    const result = checkedDerive(bound, groups);
    expect(result.contexts[0]!.uncoveredIds).toEqual([id(16), id(32)]);
    expect(result.metrics.ownerByFunctionId[id(16)]).toBe("g");
    expect(result.metrics.uncoveredOwnerByFunctionId[id(16)]).toBe("g");
    expect(result.metrics.uncoveredCommunityByFunctionId[id(48)]).toBe("community:emptykernel");
    expect(result.metrics.nonCoveredIds).toEqual([id(16), id(32), id(48)]);
  }
  expect(source.contextRank).toBe(rank);
  expect({ ...source, contextRank: undefined }).toEqual(boundBefore);
  expect(mapOrder(source)).toEqual(orderBefore); expect(prepared).toEqual(preparedBefore);
  expect(graph).toEqual(graphBefore); expect(groups).toEqual(groupsBefore);
  const referencesAfter = references(); expect(referencesAfter).toHaveLength(referencesBefore.length);
  referencesAfter.forEach((value, index) => expect(value).toBe(referencesBefore[index]));
});

test("first NUMERIC 0x2 kernel owns uncovered work despite reversed groups and lexical 0x10", () => {
  const { input, partition } = fixture();
  input.nodes = [2, 16, 48, 64].map(n => ({ ...input.nodes[0]!, id: id(n), rva: `0x${n.toString(16).toUpperCase()}` }));
  partition.communities = [
    { contentId: "community:kernel", memberIds: [id(64), id(16), id(2)], kernelIds: [id(16), id(2)], externalContextIds: [] },
    { contentId: "community:emptykernel", memberIds: [id(48)], kernelIds: [], externalContextIds: [] },
  ];
  const source = checkedSource(input, partition);
  const result = checkedDerive(source, [
    { groupId: "lexical-first-but-numeric-later", ownedFunctionIds: [id(16)] },
    { groupId: "__proto__", ownedFunctionIds: [id(2)] },
  ]);
  expect(result.contexts.map(c => c.groupId)).toEqual(["lexical-first-but-numeric-later", "__proto__"]);
  expect(result.contexts[0]!.uncoveredIds).toEqual([]);
  expect(result.contexts[1]!.uncoveredIds).toEqual([id(64)]);
  expect(result.metrics.uncoveredOwnerByFunctionId[id(64)]).toBe("__proto__");
  expect(result.metrics.uncoveredCommunityByFunctionId[id(48)]).toBe("community:emptykernel");
});

test("partition boundary context is distinct from raw/provided group adjacency", () => {
  const { input, partition } = fixture(), raw = checkedSource(input, partition);
  const provided = checkedGraph(input.nodes.map(n => n.id), [{ source: 0, target: 2, weight: 1 }]);
  const memberGroups = partition.communities.map(c => c.memberIds);
  expect(checkedCommunity(provided, memberGroups)).toEqual([[id(48)], [id(16)]]);
  expect(checkedCommunity(checkedGraph(input.nodes.map(n => n.id), []), memberGroups)).toEqual([[], []]);
  const affinity = checkedSource(input, partition, { kind: "provided-affinity", graph: provided });
  const owners = [{ groupId: "g", ownedFunctionIds: [id(16)] }];
  expect(checkedDerive(raw, owners).contexts[0]!.contextFunctionIds).toEqual([]);
  expect(checkedDerive(affinity, owners).contexts[0]!.contextFunctionIds).toEqual([id(48)]);
  expect(raw.contextBinding.projectionSource).toBe("raw-active-control-relations");
  expect(affinity.contextBinding.projectionSource).toBe("provided-affinity");
  expect(affinity.contextBinding).not.toEqual(raw.contextBinding);
  // Designated local inputs and source roles only; not an authenticity/optimality claim.
});
