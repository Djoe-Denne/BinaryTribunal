import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assessKnowledgeDelta,
  affectedRegion,
  assignCommunityLineage,
  communityContentId,
  comparePartitions,
  isEmptyKnowledgeDelta,
  planAdoption,
  partitionProposalFingerprint,
  knowledgeDeltaId,
  sortFunctionIds,
  type ClusterPartitionView,
  type CommunityDraft,
  type FrozenActiveUnit,
  type KnowledgeDeltaView,
  type RegionGraph,
  type PartitionDetails,
  type DeltaAdmissionContext,
  type UnitQuiescenceProof,
} from "../src/lineage";
import {
  ALGORITHM,
  ALGORITHM_VERSION,
  benchmarkSparseIndex,
  benchmarkMultiviewPipeline,
  buildLexicalIndex,
  clusterMultiview,
  createMemoryEmbeddingCache,
  defaultMultiviewConfig,
  LEXICAL_RULESET_VERSION,
  normalizeTokens,
  validateArchitectureExport,
  type FrozenEncoder,
  type GraphSnapshotView,
  type LinkConstraint,
  type MultiviewConfig,
  type ProvenanceView,
  type FunctionEdgeView,
} from "../src/semantic-index";

const FIXTURES = join(import.meta.dir, "fixtures", "graph");
const CODE = new Set(["direct_call", "tail_jump", "indirect_resolved", "thunk"]);

function fixtureAdmission(delta: KnowledgeDeltaView): DeltaAdmissionContext {
  return delta.validation === "parent-validated"
    ? { currentRevision: delta.fromRevision, mode: "parent", parentReceipt: { deltaId: delta.deltaId, fromRevision: delta.fromRevision, toRevision: delta.toRevision, authorityRef: "fixture:mock-parent-receipt", evidenceSha256s: delta.evidence.map(item => item.sha256) }, verifyParentReceipt: receipt => receipt.authorityRef === "fixture:mock-parent-receipt" }
    : { currentRevision: delta.fromRevision, mode: "fixture" };
}

function partitionDetails(partition: ClusterPartitionView): PartitionDetails {
  const ids = partition.communities.flatMap(item => item.memberIds);
  return { partitionId: partition.partitionId, coverage: ids.map(functionId => ({ functionId, coverage: "fixture-covered" })), costs: ids.map(functionId => ({ functionId, estimatedCost: { known: true, value: 1 } })) };
}

function tinyGraph(n = 3): GraphSnapshotView {
  const moduleSha256 = "1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb";
  return { schemaVersion: 1, snapshotId: "snap:l4-probe", normalizedFingerprint: "cd".repeat(32), objects: [], unresolved: [], capabilities: [], edges: [],
    nodes: Array.from({ length: n }, (_, i) => { const rva = `0x${((i + 1) * 0x100).toString(16).toUpperCase()}`; return { id: `${moduleSha256}:${rva}`, moduleSha256, rva, name: `Fn${i + 1}`, observedDescription: "", semanticMaturity: "reconciled" as const, functionClass: "internal" }; }) };
}

function noViews(): MultiviewConfig {
  return withViews({ structure: false, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false });
}

function call(graph: GraphSnapshotView, from: number, to: number): FunctionEdgeView {
  return { id: `edge:${from}:${to}`, sourceId: graph.nodes[from]!.id, destinationId: graph.nodes[to]!.id, kind: "direct_call", status: "observed", schedulerRelevance: "may_block" };
}

function link(graph: GraphSnapshotView, kind: LinkConstraint["kind"], left: number, right: number): LinkConstraint {
  return { kind, leftId: graph.nodes[left]!.id, rightId: graph.nodes[right]!.id, provenance: provenance(graph.nodes[left]!.moduleSha256), validation: "validated" };
}

function fixtureEncoder(encode: FrozenEncoder["encode"], dimension = 2): FrozenEncoder {
  return { modelId: "fixture-only:encoder", tokenizerRevision: "fixture-v1", parameterFingerprint: "ab".repeat(32), implementationSha256: "12".repeat(32), tokenizerSha256: "34".repeat(32), dimension, encode };
}

function rehashDelta(value: KnowledgeDeltaView): KnowledgeDeltaView {
  const { deltaId: _old, ...body } = value;
  return { ...body, deltaId: knowledgeDeltaId(body) };
}

/** Independent dense definition oracle, deliberately limited to tiny fixtures, never benchmarks. */
function oracleModularity(graph: GraphSnapshotView, partition: ClusterPartitionView): number | null {
  if (graph.nodes.length > 16) throw new Error("dense oracle is limited to 16 fixture nodes");
  const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
  const matrix = graph.nodes.map(() => graph.nodes.map(() => 0));
  for (const edge of graph.edges) {
    if (!CODE.has(edge.kind) || edge.sourceId === edge.destinationId || !["observed", "validated"].includes(edge.status)) continue;
    const i = index.get(edge.sourceId)!, j = index.get(edge.destinationId)!;
    const w = edge.status === "validated" ? 1 : 0.85;
    matrix[i]![j]! += w; matrix[j]![i]! += w;
  }
  const degrees = matrix.map(row => row.reduce((sum, value) => sum + value, 0));
  const volume = degrees.reduce((sum, value) => sum + value, 0);
  if (volume === 0) return null;
  const owners = new Map(partition.communities.flatMap((community, i) => community.memberIds.map(id => [id, i] as const)));
  let q = 0;
  for (let i = 0; i < graph.nodes.length; i++) for (let j = 0; j < graph.nodes.length; j++) if (owners.get(graph.nodes[i]!.id) === owners.get(graph.nodes[j]!.id)) q += matrix[i]![j]! - degrees[i]! * degrees[j]! / volume;
  return q / volume;
}

function load(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURES, name, "content.json"), "utf8"));
}

function snapshot(name: string): GraphSnapshotView {
  return load(name) as GraphSnapshotView;
}

function provenance(moduleSha256: string): ProvenanceView {
  const digest = "af957a39b84ac87a7d2a8a917a7cb38e4b64acd785cdd9f9414d5d124c950259";
  return {
    moduleSha256,
    siteRva: null,
    siteKind: "extractor",
    xrefType: "none",
    source: "fixture-extractor",
    sourceVersion: "v1",
    sourceHash: digest,
    evidenceSha256: digest,
  };
}

function withViews(patch: Partial<MultiviewConfig["views"]>): MultiviewConfig {
  const config = defaultMultiviewConfig();
  config.views = { ...config.views, ...patch };
  return config;
}

function memberGroups(name: string, config?: MultiviewConfig): string[][] {
  const result = clusterMultiview({ snapshot: snapshot(name), config, encoder: null });
  expect(result.partition).not.toBeNull();
  return result.partition!.communities.map(community => community.memberIds);
}

function regionGraph(graph: GraphSnapshotView): RegionGraph {
  const callNeighbors = new Map<string, string[]>();
  const dataNeighbors = new Map<string, string[]>();
  for (const node of graph.nodes) {
    callNeighbors.set(node.id, []);
    dataNeighbors.set(node.id, []);
  }
  for (const edge of graph.edges) {
    if (!CODE.has(edge.kind) || (edge.status !== "observed" && edge.status !== "validated")) continue;
    if (edge.sourceId === edge.destinationId) continue;
    callNeighbors.get(edge.sourceId)?.push(edge.destinationId);
    callNeighbors.get(edge.destinationId)?.push(edge.sourceId);
  }
  const byObject = new Map<string, string[]>();
  for (const ref of graph.unresolved) {
    if (ref.kind !== "data_xref" || !ref.referencedObjectId) continue;
    const list = byObject.get(ref.referencedObjectId) ?? [];
    list.push(ref.fromFunctionId);
    byObject.set(ref.referencedObjectId, list);
  }
  for (const ids of byObject.values()) {
    for (const id of ids) dataNeighbors.set(id, ids.filter(other => other !== id));
  }
  return { functionIds: graph.nodes.map(node => node.id), callNeighbors, dataNeighbors };
}

function assertPartitionContract(graph: GraphSnapshotView, config = defaultMultiviewConfig()): void {
  const result = clusterMultiview({ snapshot: graph, config, encoder: null });
  expect(result.pass).toBe(true);
  const partition = result.partition!;
  expect(partition.schemaVersion).toBe(1);
  expect(partition.regime).toBe("B");
  expect(partition.seed).toBe("none");
  expect(partition.adopted).toBe(false);
  expect(partition.partitionId).not.toBe(partition.lineageId);
  expect(partition.algorithm).toBe(ALGORITHM);
  expect(partition.modularity).toEqual({ known: false, value: null });
  const seen = new Set<string>();
  for (const community of partition.communities) {
    expect(community.contentId).toBe(communityContentId(partition.algorithm, partition.algorithmVersion, partition.configFingerprint, community.memberIds));
    expect(community.contentId).not.toBe(community.lineageId);
    expect(community.memberIds).toEqual(sortFunctionIds(community.memberIds));
    for (const id of community.kernelIds) expect(community.memberIds).toContain(id);
    for (const id of community.externalContextIds) expect(community.memberIds).not.toContain(id);
    for (const id of community.memberIds) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(community.conductance).toEqual({ known: false, value: null });
  }
  expect([...seen].sort()).toEqual(graph.nodes.map(node => node.id).sort());
  for (const edge of result.dependencyEdges) {
    expect(CODE.has(edge.kind)).toBe(true);
    expect(edge.kind).not.toBe("callback_candidate");
    expect(edge.sourceId).not.toBe(edge.destinationId);
  }
  expect(result.architecture.oracle).toBe(false);
  expect(result.architecture.experimental).toBe(true);
}

describe("lexical index", () => {
  test("versioned synonyms retrieve refresh as update", () => {
    const graph = snapshot("synonym-descriptions");
    const index = buildLexicalIndex(graph);
    expect(index.rulesetVersion).toBe(LEXICAL_RULESET_VERSION);
    expect(normalizeTokens("refresh", true)).toEqual(["update"]);
    const expanded = index.query("refresh").hits.map(hit => hit.functionId);
    expect(expanded).toHaveLength(2);
    const literal = buildLexicalIndex(graph, { ...defaultMultiviewConfig(), synonyms: false }).query("refresh").hits.map(hit => hit.functionId);
    expect(literal).toEqual([graph.nodes.find(node => node.observedDescription.includes("refresh"))!.id]);
  });

  test("tie-break is numeric score then canonical function id", () => {
    const graph = snapshot("near-descriptions-distinct-modules");
    const hits = buildLexicalIndex(graph).query("refresh party state").hits;
    expect(hits.length).toBeGreaterThan(1);
    const ordered = [...hits].sort((a, b) => b.score - a.score || a.functionId.localeCompare(b.functionId) && 0);
    for (let i = 1; i < hits.length; i++) {
      const score = hits[i - 1]!.score - hits[i]!.score;
      if (score === 0) expect(hits[i - 1]!.functionId < hits[i]!.functionId || hits[i - 1]!.functionId === hits[i]!.functionId).toBe(true);
    }
    expect(hits.map(hit => hit.score)).toEqual(ordered.map(hit => hit.score));
  });
});

describe("multiview ablations", () => {
  test("structure separates obvious communities and ablation dissolves them", () => {
    const grouped = memberGroups("communities-obvious");
    expect(grouped).toHaveLength(2);
    expect(grouped.every(group => group.length === 2)).toBe(true);
    const ablated = memberGroups("communities-obvious", withViews({ structure: false, validatedRelations: false }));
    expect(ablated).toHaveLength(4);
  });

  test("shared data links functions without becoming a call", () => {
    const result = clusterMultiview({ snapshot: snapshot("shared-data"), encoder: null });
    expect(result.partition!.communities).toHaveLength(1);
    expect(result.dependencyEdges).toEqual([]);
    expect(result.metrics.dataEdges).toBeGreaterThan(0);
    const ablated = memberGroups("shared-data", withViews({ data: false }));
    expect(ablated).toHaveLength(2);
  });

  test("lexical maturity merges synonyms only inside one module", () => {
    const graph = structuredClone(snapshot("synonym-descriptions")) as GraphSnapshotView;
    for (const node of graph.nodes) node.semanticMaturity = "reconciled";
    const merged = clusterMultiview({ snapshot: graph, encoder: null });
    expect(merged.partition!.communities).toHaveLength(1);
    expect(merged.partition!.maturity).toBe("multiview");
    expect(merged.dependencyEdges).toEqual([]);
    const ablated = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, embeddings: false }), encoder: null });
    expect(ablated.partition!.communities).toHaveLength(2);
    const distinct = clusterMultiview({ snapshot: snapshot("near-descriptions-distinct-modules"), encoder: null });
    expect(distinct.partition!.communities).toHaveLength(2);
    expect(new Set(distinct.architecture.architecture.modules.map(item => item.moduleSha256)).size).toBe(2);
  });

  test("partial maturity does not let text outvote an unknown partner", () => {
    const graph = snapshot("partial-maturity");
    const result = clusterMultiview({ snapshot: graph, encoder: null });
    expect(result.partition!.communities).toHaveLength(2);
    expect(result.partition!.maturity).toBe("partial");
    expect(result.metrics.similarityEdges).toBe(0);
  });

  test("capabilities stay transversal and do not invent a module", () => {
    const graph = structuredClone(snapshot("synonym-descriptions")) as GraphSnapshotView;
    const fact = graph.capabilities[0]!;
    graph.capabilities = graph.nodes.map(node => ({ ...fact, id: `cap:${node.rva}`, subjectId: node.id, capability: "atb-tick", confidence: "observed", hypotheticalRole: null }));
    const result = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, embeddings: false }), encoder: null });
    expect(result.partition!.communities).toHaveLength(2);
    expect(result.architecture.architecture.transversalCapacities).toEqual([
      expect.objectContaining({ capability: "atb-tick", spansModules: false }),
    ]);
    const hidden = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, embeddings: false, capabilities: false }), encoder: null });
    expect(hidden.architecture.architecture.transversalCapacities).toEqual([]);
    expect(hidden.partition!.communities).toHaveLength(2);
  });

  test("embeddings absent and disabled stay explicit", () => {
    const graph = snapshot("communities-obvious");
    const absent = clusterMultiview({ snapshot: graph, encoder: null });
    expect(absent.embeddings.status).toBe("absent");
    expect(absent.embeddings.measuredGain).toBeNull();
    expect(absent.embeddings.comparedToLexical).toBe(false);
    expect(absent.diagnostics.some(item => item.code === "encoder-absent")).toBe(true);
    const disabled = clusterMultiview({ snapshot: graph, config: withViews({ embeddings: false }), encoder: null });
    expect(disabled.embeddings.status).toBe("disabled");
    expect(disabled.embeddings.measuredGain).toBeNull();
    expect(disabled.diagnostics.some(item => item.code === "encoder-absent")).toBe(false);
  });

  test("a frozen local encoder is cached and compared with lexical ranking", () => {
    const graph = structuredClone(snapshot("synonym-descriptions")) as GraphSnapshotView;
    for (const node of graph.nodes) node.semanticMaturity = "reconciled";
    let calls = 0;
    const encoder: FrozenEncoder = {
      modelId: "fixture-bow",
      tokenizerRevision: "v1",
      parameterFingerprint: "ab".repeat(32),
      dimension: 4,
      implementationSha256: "12".repeat(32),
      tokenizerSha256: "34".repeat(32),
      encode(tokens) {
        calls += 1;
        const vector = [0, 0, 0, 0];
        for (const token of tokens) vector[token.length % 4] += 1;
        return vector;
      },
    };
    const cache = createMemoryEmbeddingCache();
    const first = clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true });
    expect(first.embeddings.status).toBe("ready");
    expect(first.embeddings.modelId).toBe("fixture-bow");
    expect(first.embeddings.measuredGain).toBeNull();
    expect(typeof first.embeddings.rankingDisagreement).toBe("number");
    expect(first.embeddings.freezeVerification).toBe("externally-verified");
    expect(first.embeddings.cacheMisses).toBe(graph.nodes.length);
    const encoded = calls;
    const second = clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true });
    expect(second.embeddings.cacheHits).toBe(graph.nodes.length);
    expect(calls).toBe(encoded);
    expect(second.partition!.communities.map(item => item.contentId).sort()).toEqual(first.partition!.communities.map(item => item.contentId).sort());
  });
});

describe("constraints", () => {
  test("an unsatisfiable must-link and cannot-link fails closed", () => {
    const graph = snapshot("synonym-descriptions");
    const [left, right] = graph.nodes.map(node => node.id) as [string, string];
    const base = { provenance: provenance(graph.nodes[0]!.moduleSha256), validation: "validated" as const };
    const constraints: LinkConstraint[] = [
      { kind: "must-link", leftId: left, rightId: right, ...base },
      { kind: "cannot-link", leftId: left, rightId: right, ...base },
    ];
    const result = clusterMultiview({ snapshot: graph, constraints, encoder: null });
    expect(result.pass).toBe(false);
    expect(result.constraints.status).toBe("unsatisfiable");
    expect(result.partition!.adopted).toBe(false);
    expect(result.partition!.communities).toHaveLength(1); // Rendered contradiction, explicitly NON-admissible.
    expect(result.diagnostics.some(item => item.code === "constraint-final-partition")).toBe(true);
  });

  test("unvalidated constraints are not applied", () => {
    const graph = snapshot("synonym-descriptions");
    const [left, right] = graph.nodes.map(node => node.id) as [string, string];
    const result = clusterMultiview({
      snapshot: graph,
      encoder: null,
      constraints: [{ kind: "must-link", leftId: left, rightId: right, provenance: provenance(graph.nodes[0]!.moduleSha256), validation: "unvalidated" }],
    });
    expect(result.pass).toBe(true);
    expect(result.partition!.communities).toHaveLength(2);
    expect(result.constraints.applied).toBe(0);
    expect(result.constraints.rejected).toBe(1);
  });

  test("a validated must-link merges isolates and a structural cannot-link fails closed", () => {
    const synonyms = snapshot("synonym-descriptions");
    const [left, right] = synonyms.nodes.map(node => node.id) as [string, string];
    const linked = clusterMultiview({
      snapshot: synonyms,
      encoder: null,
      constraints: [{ kind: "must-link", leftId: left, rightId: right, provenance: provenance(synonyms.nodes[0]!.moduleSha256), validation: "validated" }],
    });
    expect(linked.pass).toBe(true);
    expect(linked.partition!.communities).toHaveLength(1);
    const obvious = snapshot("communities-obvious");
    const pair = obvious.edges[0]!;
    const blocked = clusterMultiview({
      snapshot: obvious,
      encoder: null,
      constraints: [{ kind: "cannot-link", leftId: pair.sourceId, rightId: pair.destinationId, provenance: provenance(obvious.nodes[0]!.moduleSha256), validation: "validated" }],
    });
    expect(blocked.pass).toBe(false);
    expect(blocked.constraints.status).toBe("unsatisfiable");
  });
});

describe("lineage and deltas", () => {
  test("fixture content ids stay distinct from lineage ids", () => {
    for (const name of ["lineage-merge", "lineage-split"]) {
      const doc = load(name) as ClusterPartitionView;
      expect(doc.partitionId).not.toBe(doc.lineageId);
      for (const community of doc.communities) {
        expect(communityContentId(doc.algorithm, doc.algorithmVersion, doc.configFingerprint, community.memberIds)).toBe(community.contentId);
        expect(community.lineageId).not.toBe(community.contentId);
      }
    }
    expect(load("lineage-merge").communities[0].parentContentIds).toHaveLength(2);
    expect(load("lineage-split").communities.every((community: { parentContentIds: string[] }) => community.parentContentIds.length === 1)).toBe(true);
  });

  test("merge and split assign new content ids and separate lineage", () => {
    const graph = snapshot("communities-obvious");
    const splitResult = clusterMultiview({ snapshot: graph, encoder: null });
    const split = splitResult.partition!;
    const members = sortFunctionIds(graph.nodes.map(node => node.id));
    const parentDraft: CommunityDraft = { memberIds: members, kernelIds: [members[0]!], externalContextIds: [], conductance: { known: false, value: null } };
    const parent = assignCommunityLineage(null, [parentDraft], {
      algorithm: ALGORITHM,
      algorithmVersion: ALGORITHM_VERSION,
      configFingerprint: split.configFingerprint,
      snapshotId: graph.snapshotId,
      hysteresis: 0.85,
    });
    const parentPartition: ClusterPartitionView = { ...split, communities: parent.communities, lineageId: parent.partitionLineageId, partitionId: parent.partitionId };
    const comparison = comparePartitions(parentPartition, split);
    expect(comparison.splits).toHaveLength(1);
    expect(comparison.splits[0]!.childContentIds).toHaveLength(2);
    expect(comparison.stable).toBe(false);
    const merged = assignCommunityLineage(split, [parentDraft], {
      algorithm: ALGORITHM,
      algorithmVersion: ALGORITHM_VERSION,
      configFingerprint: split.configFingerprint,
      snapshotId: graph.snapshotId,
      hysteresis: 0.85,
    }, splitResult.lineageSidecar!);
    expect(merged.communities).toHaveLength(1);
    expect(merged.diagnostics).toEqual([]);
    expect(merged.communities[0]!.parentContentIds).toHaveLength(2);
    expect(merged.communities[0]!.contentId).not.toBe(split.communities[0]!.contentId);
    expect(merged.communities[0]!.contentId).not.toBe(split.communities[1]!.contentId);
    expect(merged.communities[0]!.lineageId).not.toBe(merged.communities[0]!.contentId);
  });

  test("empty delta is idempotent and a local delta stays in its region", () => {
    const empty = load("knowledge-empty") as KnowledgeDeltaView;
    expect(isEmptyKnowledgeDelta(empty)).toBe(true);
    const first = assessKnowledgeDelta(empty);
    const second = assessKnowledgeDelta(empty);
    expect(first).toEqual(second);
    expect(first.pass && first.empty && first.idempotent && first.digestMatches).toBe(true);
    expect(first.nextRevision).toBe(empty.fromRevision);
    const region = affectedRegion(empty, regionGraph(snapshot("partial-maturity")));
    expect(region.functionIds).toEqual([]);
    expect(region.idempotent).toBe(true);
    const created = load("knowledge-new") as KnowledgeDeltaView;
    const local = affectedRegion(created, regionGraph(snapshot("partial-maturity")), fixtureAdmission(created));
    expect(local.impact).toBe("local");
    expect(local.functionIds).toEqual(created.affectedFunctionIds);
    const bulletin = assessKnowledgeDelta({ ...created, origin: "bulletin-r" });
    expect(bulletin.pass).toBe(false);
  });

  test("identical config is stable and explicit adoption does not rewrite frozen units", () => {
    const graph = snapshot("communities-obvious");
    const before = JSON.stringify(graph);
    const first = clusterMultiview({ snapshot: graph, encoder: null });
    const second = clusterMultiview({ snapshot: graph, previous: first.partition, previousLineageSidecar: first.lineageSidecar!, encoder: null });
    expect(JSON.stringify(graph)).toBe(before);
    expect(second.partition!.communities.map(item => item.contentId).sort()).toEqual(first.partition!.communities.map(item => item.contentId).sort());
    expect(second.partition!.lineageId).toBe(first.partition!.lineageId);
    const comparison = comparePartitions(first.partition!, second.partition!, 0.85, { previous: partitionDetails(first.partition!), next: partitionDetails(second.partition!) });
    expect(comparison.sameConfig).toBe(true);
    expect(comparison.churn).toBe(0);
    expect(comparison.stable).toBe(true);
    const unit: FrozenActiveUnit = {
      unitId: "wu-running",
      state: "RUNNING",
      snapshotId: graph.snapshotId,
      ownedFunctionIds: [graph.nodes[0]!.id],
    };
    const unitBefore = JSON.stringify(unit);
    const adopted = planAdoption({ partition: first.partition!, units: [unit], explicit: true, lineageSidecar: first.lineageSidecar! });
    expect(adopted.destructive).toBe(false);
    expect(adopted.rewroteActiveUnits).toBe(false);
    expect(adopted.adopted).toBe(true);
    expect(adopted.retainedUnits[0]!.snapshotId).toBe(graph.snapshotId);
    expect(adopted.retainedUnits[0]!.ownedFunctionIds).toEqual(unit.ownedFunctionIds);
    expect(first.partition!.adopted).toBe(false);
    expect(JSON.stringify(unit)).toBe(unitBefore);
    expect(planAdoption({ partition: first.partition!, units: [unit], explicit: false }).adopted).toBe(false);
  });

  test("hysteresis reuses lineage when membership barely moves", () => {
    const moduleSha256 = "1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb";
    const ids = Array.from({ length: 20 }, (_, index) => `${moduleSha256}:0x${(0x1000 + index).toString(16).toUpperCase()}`);
    const fingerprint = "ab".repeat(32);
    const meta = { algorithm: ALGORITHM, algorithmVersion: ALGORITHM_VERSION, configFingerprint: fingerprint, snapshotId: "snap:hysteresis", hysteresis: 0.85 };
    const previous = assignCommunityLineage(null, [{ memberIds: ids, kernelIds: [ids[0]!], externalContextIds: [], conductance: { known: false, value: null } }], meta);
    const moved = [...ids.slice(0, 19), `${moduleSha256}:0x2000`];
    const previousPartition: ClusterPartitionView = {
      schemaVersion: 1,
      partitionId: previous.partitionId,
      lineageId: previous.partitionLineageId,
      parentLineageId: null,
      snapshotId: meta.snapshotId,
      snapshotFingerprint: "cd".repeat(32),
      regime: "B",
      algorithm: ALGORITHM,
      algorithmVersion: ALGORITHM_VERSION,
      configFingerprint: fingerprint,
      seed: "none",
      communities: previous.communities,
      modularity: { known: false, value: null },
      maturity: "structural",
      adopted: false,
    };
    previous.sidecar.projectionFingerprint = partitionProposalFingerprint(previousPartition);
    const next = assignCommunityLineage(previousPartition, [{ memberIds: moved, kernelIds: [moved[0]!], externalContextIds: [], conductance: { known: false, value: null } }], meta, previous.sidecar);
    expect(next.diagnostics).toEqual([]);
    expect(next.communities[0]!.lineageId).toBe(previous.communities[0]!.lineageId);
    expect(next.communities[0]!.contentId).not.toBe(previous.communities[0]!.contentId);
  });
});

describe("fixture non-regression", () => {
  test("every owned fixture keeps a total function partition", () => {
    for (const name of [
      "communities-obvious",
      "components-disconnected",
      "shared-data",
      "synonym-descriptions",
      "near-descriptions-distinct-modules",
      "partial-maturity",
      "isolates",
      "ff8-data-callback-not-call",
      "ff8-self-loop",
    ]) assertPartitionContract(snapshot(name));
    const callback = clusterMultiview({ snapshot: snapshot("ff8-data-callback-not-call"), encoder: null });
    expect(callback.dependencyEdges.every(edge => edge.kind !== "callback_candidate")).toBe(true);
    const loop = clusterMultiview({ snapshot: snapshot("ff8-self-loop"), encoder: null });
    expect(loop.selfLoopIds.length).toBeGreaterThan(0);
    expect(loop.dependencyEdges.some(edge => edge.sourceId === edge.destinationId)).toBe(false);
  });

  test("sparse benchmark stays under the all-pairs bound", () => {
    const report = benchmarkSparseIndex(400);
    expect(report.bounded).toBe(true);
    expect(report.comparisons).toBeLessThan(report.quadraticPairs);
    expect(report.nodeCount).toBe(400);
  });
});

describe("L4 parent counterexamples: final all-view constraints", () => {
  test("cannot-link through DATA is diagnosed on the rendered partition", () => {
    const graph = tinyGraph(2);
    graph.objects = [{ id: "object:shared", kind: "table", name: "shared" }];
    graph.unresolved = graph.nodes.map(node => ({ fromFunctionId: node.id, kind: "data_xref", referencedObjectId: "object:shared" }));
    const result = clusterMultiview({ snapshot: graph, config: { ...noViews(), views: { ...noViews().views, data: true } }, constraints: [link(graph, "cannot-link", 0, 1)] });
    expect(result.partition!.communities).toHaveLength(1);
    expect(result.pass).toBe(false);
    expect(result.constraints.status).toBe("unsatisfiable");
    expect(result.lineageSidecar!.proposalPass).toBe(false);
    expect(planAdoption({ partition: result.partition!, lineageSidecar: result.lineageSidecar!, explicit: true, units: [] }).adopted).toBe(false);
  });

  test("cannot-link through lexical similarity is never a false satisfied", () => {
    const graph = tinyGraph(2);
    for (const node of graph.nodes) node.observedDescription = "update battle state";
    const config = noViews(); config.views.lexical = true;
    const result = clusterMultiview({ snapshot: graph, config, constraints: [link(graph, "cannot-link", 0, 1)] });
    expect(result.metrics.similarityEdges).toBe(1);
    expect(result.partition!.communities).toHaveLength(1);
    expect(result.pass).toBe(false);
    expect(result.constraints.status).toBe("unsatisfiable");
  });

  test("mixed structure+must and transitive must chains are checked after every union", () => {
    for (const structure of [true, false]) {
      const graph = tinyGraph();
      graph.edges = structure ? [call(graph, 0, 1)] : [];
      const constraints = [link(graph, "must-link", 1, 2), link(graph, "cannot-link", 0, 2), ...(structure ? [] : [link(graph, "must-link", 0, 1)])];
      for (const order of [constraints, [...constraints].reverse()]) {
        const result = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, embeddings: false, data: false }), constraints: order });
        expect(result.partition!.communities).toHaveLength(1);
        expect(result.pass).toBe(false);
        expect(result.constraints.status).toBe("unsatisfiable");
      }
    }
  });

  test("hubs do not conceal DATA+must contradictions, while disconnected cannot is satisfiable", () => {
    const graph = tinyGraph(4); graph.edges = [call(graph, 0, 1), call(graph, 0, 2), call(graph, 0, 3)];
    graph.objects = [{ id: "object:shared", kind: "table", name: "shared" }];
    graph.unresolved = [1, 2].map(i => ({ fromFunctionId: graph.nodes[i]!.id, kind: "data_xref", referencedObjectId: "object:shared" }));
    const config = withViews({ lexical: false, embeddings: false }); config.hubMinDegree = 2;
    const result = clusterMultiview({ snapshot: graph, config, constraints: [link(graph, "must-link", 0, 2), link(graph, "cannot-link", 0, 1)] });
    expect(result.pass).toBe(false);
    expect(result.constraints.status).toBe("unsatisfiable");
    const isolated = tinyGraph(2);
    const valid = clusterMultiview({ snapshot: isolated, config: noViews(), constraints: [link(isolated, "cannot-link", 0, 1)] });
    expect(valid.pass).toBe(true);
    expect(valid.partition!.communities).toHaveLength(2);
    expect(valid.constraints.status).toBe("satisfied");
  });
});

describe("L4 parent counterexamples: encoder is an untrusted optional boundary", () => {
  test("declared hashes and trusted-local labels do not prove frozen implementation", () => {
    let calls = 0;
    const graph = tinyGraph(2), encoder = fixtureEncoder(() => { calls++; return [1, 0]; });
    const result = clusterMultiview({ snapshot: graph, encoder });
    expect(result.embeddings.status).toBe("rejected");
    expect(result.embeddings.freezeVerification).toBe("declared-only");
    expect(calls).toBe(0);
    expect(clusterMultiview({ snapshot: graph, encoder, verifyEncoderFreeze: () => { throw new Error("fixture refusal"); } }).embeddings.status).toBe("rejected");
  });

  test("NaN, Infinity, zero, wrong length and invalid dimensions reject rather than merge", () => {
    const graph = tinyGraph(2); graph.nodes.forEach(node => { node.observedDescription = "update state"; });
    const config = noViews(); config.views.embeddings = true;
    for (const vector of [[NaN], [Infinity], [-Infinity], [0], [], [1, 2]]) {
      const result = clusterMultiview({ snapshot: graph, config, encoder: fixtureEncoder(() => vector, 1), verifyEncoderFreeze: () => true });
      expect(result.embeddings.status).toBe("rejected");
      expect(result.embeddings.measuredGain).toBeNull();
      expect(result.partition!.communities).toHaveLength(2);
      expect(result.metrics.similarityEdges).toBe(0);
    }
    for (const dimension of [NaN, Infinity, 0, -1, 1.5, 65537]) expect(clusterMultiview({ snapshot: graph, config, encoder: fixtureEncoder(() => [1], dimension), verifyEncoderFreeze: () => true }).embeddings.status).toBe("rejected");
  });

  test("large and subnormal finite vectors produce bounded finite cosine", () => {
    const graph = tinyGraph(2); graph.nodes.forEach(node => { node.observedDescription = "update state"; });
    const config = noViews(); config.views.embeddings = true;
    for (const value of [1e308, Number.MIN_VALUE]) {
      const result = clusterMultiview({ snapshot: graph, config, encoder: fixtureEncoder(() => [value, value]), verifyEncoderFreeze: () => true });
      expect(result.embeddings.status).toBe("ready");
      expect(result.metrics.similarityEdges).toBe(1);
      expect(result.metrics.modularity).toBeCloseTo(0, 12);
      expect(result.embeddings.measuredGain).toBeNull();
      expect(result.embeddings.qualityOracle).toBe("absent");
    }
  });

  test("encoder/cache exceptions and poisoned cached vectors fall back explicitly", () => {
    const graph = tinyGraph(2), encoder = fixtureEncoder(() => [1, 0]);
    const caches = [
      { get() { throw new Error("fixture cache get"); }, set() {} },
      { get() { return undefined; }, set() { throw new Error("fixture cache set"); } },
      { get() { return [NaN, 1]; }, set() {} },
      { get() { return [0, 0]; }, set() {} },
      { get() { return [1]; }, set() {} },
    ];
    for (const cache of caches) {
      const result = clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true });
      expect(result.pass).toBe(true); // Scientific input remains usable without this optional view.
      expect(result.embeddings.status).toBe("rejected");
      expect(result.embeddings.measuredGain).toBeNull();
    }
    expect(clusterMultiview({ snapshot: graph, encoder: fixtureEncoder(() => { throw new Error("fixture encode"); }), verifyEncoderFreeze: () => true }).embeddings.reason).toBe("encoder-or-cache-exception");
  });

  test("cache identity includes dimension and implementation/tokenizer, not only declared parameters", () => {
    const graph = tinyGraph(2), cache = createMemoryEmbeddingCache(); let calls = 0;
    for (const dimension of [1, 2]) {
      const encoder = fixtureEncoder(() => { calls++; return Array.from({ length: dimension }, (_, i) => i === 0 ? 1 : 0); }, dimension);
      const result = clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true });
      expect(result.embeddings.status).toBe("ready"); expect(result.embeddings.cacheHits).toBe(0);
    }
    expect(calls).toBe(4);
    const encoder = fixtureEncoder(() => { calls++; return [1, 0]; }); encoder.tokenizerSha256 = "56".repeat(32);
    expect(clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true }).embeddings.cacheMisses).toBe(2);
    encoder.implementationSha256 = "78".repeat(32);
    expect(clusterMultiview({ snapshot: graph, encoder, cache, verifyEncoderFreeze: () => true }).embeddings.cacheMisses).toBe(2);
  });

  test("get/set/encode buffers cannot mutate vectors held by the run", () => {
    const memory = createMemoryEmbeddingCache(), initial = [1, 0]; memory.set("x", initial); initial[0] = NaN;
    const read = memory.get("x")! as number[]; read[0] = NaN;
    expect(memory.get("x")).toEqual([1, 0]);
    const graph = tinyGraph(2); graph.nodes.forEach(node => { node.observedDescription = "update state"; });
    const config = noViews(); config.views.embeddings = true;
    const shared = [1, 0]; let reads = 0;
    const cache = { get() { reads++; shared[0] = reads === 1 ? 1 : 0; shared[1] = reads === 1 ? 0 : 1; return shared; }, set() {} };
    const copied = clusterMultiview({ snapshot: graph, config, encoder: fixtureEncoder(() => [1, 0]), cache, verifyEncoderFreeze: () => true });
    expect(copied.embeddings.status).toBe("ready"); expect(copied.metrics.similarityEdges).toBe(0); expect(copied.partition!.communities).toHaveLength(2);
    const mutatedSet = { get() { return undefined; }, set(_key: string, vector: readonly number[]) { (vector as number[])[0] = NaN; } };
    const result = clusterMultiview({ snapshot: graph, config, encoder: fixtureEncoder(() => [1, 0]), cache: mutatedSet, verifyEncoderFreeze: () => true });
    expect(result.embeddings.status).toBe("ready"); expect(result.metrics.similarityEdges).toBe(1);
  });

  test("identity mutation during encode is not accepted as a frozen adapter", () => {
    const graph = tinyGraph(2);
    const encoder = fixtureEncoder(() => { encoder.parameterFingerprint = "99".repeat(32); return [1, 0]; });
    expect(clusterMultiview({ snapshot: graph, encoder, verifyEncoderFreeze: () => true }).embeddings.reason).toBe("encoder-identity-drift");
  });

  test("a positive ranking disagreement is not a measured quality gain", () => {
    const graph = tinyGraph(); graph.nodes.forEach(node => { node.observedDescription = "update state"; });
    const encoder = fixtureEncoder(tokens => tokens.includes("fn2") ? [0, 1] : [1, 0]);
    const result = clusterMultiview({ snapshot: graph, encoder, verifyEncoderFreeze: () => true });
    expect(result.embeddings.status).toBe("ready"); expect(result.embeddings.rankingDisagreement).toBeGreaterThan(0);
    expect(result.embeddings.measuredGain).toBeNull(); expect(result.embeddings.qualityOracle).toBe("absent");
  });

  test("sparse buffers and throwing adapter properties are rejected even without a candidate pool", () => {
    const graph = tinyGraph(2), vector = [1]; vector.length = 2;
    expect(clusterMultiview({ snapshot: graph, encoder: fixtureEncoder(() => vector), verifyEncoderFreeze: () => true }).embeddings.status).toBe("rejected");
    const encoder = fixtureEncoder(() => [1, 0]); Object.defineProperty(encoder, "parameterFingerprint", { get() { throw new Error("fixture metadata getter"); } });
    const result = clusterMultiview({ snapshot: graph, encoder });
    expect(result.pass).toBe(true); expect(result.embeddings.status).toBe("rejected"); expect(result.embeddings.reason).toBe("encoder-identity-exception");
  });
});

describe("L4 parent counterexamples: strict delta transport is not scientific admission", () => {
  test("schema version, revision bounds, evidence shape and extra properties cannot be fixed by rehashing", () => {
    const original = load("knowledge-new") as KnowledgeDeltaView;
    const attacks: any[] = [
      { ...original, schemaVersion: 99 }, { ...original, fromRevision: -1, toRevision: 0 }, { ...original, fromRevision: 1.5, toRevision: 2.5 },
      { ...original, fromRevision: 100000000, toRevision: 100000001 }, { ...original, fromRevision: NaN },
      { ...original, evidence: [{}] }, { ...original, evidence: [{ ...original.evidence[0], sha256: "g".repeat(64) }] },
      { ...original, evidence: [{ ...original.evidence[0], injected: true }] }, { ...original, extra: "must-not-disappear" },
      { ...original, affectedFunctionIds: ["not-a-function-id".padEnd(70, "x")] }, { ...original, factIds: ["same", "same"] },
    ];
    for (const attack of attacks) {
      const delta = rehashDelta(attack);
      const result = assessKnowledgeDelta(delta, fixtureAdmission(original));
      expect(result.pass).toBe(false); expect(result.admissible).toBe(false); expect(result.nextRevision).toBe(original.fromRevision);
      expect(affectedRegion(delta, regionGraph(tinyGraph()), fixtureAdmission(original)).functionIds).toEqual([]);
    }
    for (const value of [null, [], 1, "delta", {}]) expect(assessKnowledgeDelta(value).pass).toBe(false);
  });

  test("unvalidated or body-only parent-validated knowledge cannot advance a revision", () => {
    const original = load("knowledge-new") as KnowledgeDeltaView;
    expect(assessKnowledgeDelta(original).transportPass).toBe(true);
    expect(assessKnowledgeDelta(original).pass).toBe(false);
    expect(assessKnowledgeDelta(original).nextRevision).toBe(original.fromRevision);
    const unvalidated = rehashDelta({ ...original, validation: "unvalidated" });
    expect(assessKnowledgeDelta(unvalidated, fixtureAdmission(unvalidated)).pass).toBe(false);
    const fixture = rehashDelta({ ...original, validation: "fixture-only" });
    expect(assessKnowledgeDelta(fixture).pass).toBe(false);
    expect(assessKnowledgeDelta(fixture, { currentRevision: fixture.fromRevision, mode: "fixture" }).pass).toBe(true);
    expect(assessKnowledgeDelta(fixture, { currentRevision: fixture.toRevision, mode: "fixture" }).pass).toBe(false);
    expect(assessKnowledgeDelta(fixture, { currentRevision: fixture.fromRevision, mode: "parent" }).pass).toBe(false);
  });

  test("verified receipt binds authority, digest, evidence and exact revision; verifier errors fail closed", () => {
    const delta = load("knowledge-new") as KnowledgeDeltaView, admission = fixtureAdmission(delta);
    expect(assessKnowledgeDelta(delta, admission).pass).toBe(true);
    expect(assessKnowledgeDelta(delta, { ...admission, currentRevision: delta.toRevision }).pass).toBe(false);
    expect(assessKnowledgeDelta(delta, { ...admission, verifyParentReceipt: undefined }).pass).toBe(false);
    expect(assessKnowledgeDelta(delta, { ...admission, verifyParentReceipt: () => false }).pass).toBe(false);
    expect(assessKnowledgeDelta(delta, { ...admission, verifyParentReceipt: () => { throw new Error("fixture authority failure"); } }).pass).toBe(false);
    for (const patch of [{ deltaId: "11".repeat(32) }, { evidenceSha256s: [] }, { fromRevision: 0 }, { toRevision: 0 }, { authorityRef: "" }]) expect(assessKnowledgeDelta(delta, { ...admission, parentReceipt: { ...admission.parentReceipt!, ...patch } }).pass).toBe(false);
  });

  test("negative zero revisions and noncanonical function order are transport failures", () => {
    const original = load("knowledge-new") as KnowledgeDeltaView;
    const zero = rehashDelta({ ...original, fromRevision: -0, toRevision: 1, validation: "fixture-only" });
    const assessment = assessKnowledgeDelta(zero, { currentRevision: 0, mode: "fixture" });
    expect(assessment.transportPass).toBe(false); expect(assessment.diagnostics.some(item => item.code === "delta-negative-zero")).toBe(true);
    const graph = tinyGraph(2), reversed = rehashDelta({ ...original, affectedFunctionIds: graph.nodes.map(node => node.id).reverse(), validation: "fixture-only" });
    expect(assessKnowledgeDelta(reversed, { currentRevision: reversed.fromRevision, mode: "fixture" }).transportPass).toBe(false);
  });

  test("a verifier cannot mutate the delta body used for the admitted revision", () => {
    const delta = load("knowledge-new") as KnowledgeDeltaView, admission = fixtureAdmission(delta), expected = delta.toRevision;
    const result = assessKnowledgeDelta(delta, { ...admission, verifyParentReceipt: () => { delta.toRevision = 999; delta.affectedFunctionIds.length = 0; return true; } });
    expect(result.pass).toBe(true); expect(result.nextRevision).toBe(expected);
    expect(result.admittedDelta!.toRevision).toBe(expected); expect(result.admittedDelta!.affectedFunctionIds).not.toEqual(delta.affectedFunctionIds);
  });
});

describe("L4 parent counterexamples: shard-independent relations and rendered metrics", () => {
  test("64/65/512 sites preserve relation, degrees, dependency and proof union across transport sharding", () => {
    const signatures: string[] = [];
    for (const count of [64, 65, 512]) {
      const graph = tinyGraph(2), edge = call(graph, 0, 1);
      const sites = Array.from({ length: count }, (_, i) => {
        const siteRva = `0x${(0x1001 + i).toString(16).toUpperCase()}`;
        return { siteRva, xrefType: "code", provenance: { ...provenance(graph.nodes[0]!.moduleSha256), siteRva, siteKind: "instruction", xrefType: "code" } };
      });
      graph.edges = [];
      for (let i = 0; i < sites.length; i += 64) graph.edges.push({ ...edge, id: `transport:${i / 64}`, sites: sites.slice(i, i + 64) });
      // Duplicate a transport proof and permute shards: neither changes semantic counts.
      graph.edges.push({ ...graph.edges[0]!, id: "transport:duplicate" });
      const config = withViews({ lexical: false, data: false, embeddings: false }); config.hubMinDegree = 2;
      const result = clusterMultiview({ snapshot: graph, config });
      expect(result.pass).toBe(true); expect(result.relations).toHaveLength(1); expect(result.relations[0]!.sites).toHaveLength(count);
      expect(result.relations[0]!.evidenceAvailability).toBe("available");
      expect(result.dependencyEdges).toHaveLength(1); expect(result.metrics.structureEdges).toBe(1); expect(result.partition!.communities).toHaveLength(1);
      expect(result.dependencyEdges[0]!.sites).toHaveLength(count); expect(result.dependencyEdges[0]!.schedulerRelevance).toBe("may_block");
      expect(result.metrics.counters.canonicalRelations).toBe(1); expect(result.metrics.counters.transportEdges).toBe(graph.edges.length);
      signatures.push(JSON.stringify(result.partition!.communities.map(item => ({ contentId: item.contentId, kernel: item.kernelIds, context: item.externalContextIds }))));
      const reordered = clusterMultiview({ snapshot: { ...graph, edges: [...graph.edges].reverse() }, config });
      expect(reordered.relations).toEqual(result.relations); expect(reordered.partition).toEqual(result.partition);
    }
    expect(new Set(signatures).size).toBe(1);
  });

  test("conflicting policy shards fail closed instead of promoting or averaging them", () => {
    const graph = tinyGraph(2), edge = call(graph, 0, 1);
    graph.edges = [edge, { ...edge, id: "conflict", schedulerRelevance: "context_only" }];
    const first = clusterMultiview({ snapshot: graph }), second = clusterMultiview({ snapshot: { ...graph, edges: [...graph.edges].reverse() } });
    expect(first.pass).toBe(false); expect(first.dependencyEdges).toEqual([]); expect(first.relations[0]!.policyConflict).toBe(true);
    expect(first.relations).toEqual(second.relations); expect(first.partition!.communities).toHaveLength(2);
    expect(first.diagnostics.some(item => item.code === "relation-policy-conflict")).toBe(true);
  });

  test("different control-flow kinds preserve typed relations without multiplying neighbor hub degree", () => {
    const graph = tinyGraph(2), edge = call(graph, 0, 1);
    graph.edges = ["direct_call", "tail_jump", "thunk"].map(kind => ({ ...edge, id: `edge:${kind}`, kind }));
    const config = withViews({ lexical: false, data: false, embeddings: false }); config.hubMinDegree = 2;
    const result = clusterMultiview({ snapshot: graph, config });
    expect(result.pass).toBe(true); expect(result.relations).toHaveLength(3); expect(result.dependencyEdges).toHaveLength(3);
    expect(result.metrics.structureEdges).toBe(1); expect(result.partition!.communities).toHaveLength(1);
  });

  test("one edge in one rendered community has Q=0, not the previous false .5", () => {
    const graph = tinyGraph(2); graph.edges = [call(graph, 0, 1)];
    const result = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, data: false, embeddings: false }) });
    expect(result.partition!.communities).toHaveLength(1); expect(result.metrics.modularity).toBeCloseTo(0, 12);
    expect(result.metrics.modularity).toBeCloseTo(oracleModularity(graph, result.partition!)!, 12);
    expect(result.partition!.modularity).toEqual({ known: false, value: null });
  });

  test("dense independent Q oracle sees actual hub separation and must contraction", () => {
    const graph = tinyGraph(5); graph.edges = [1, 2, 3, 4].map(i => call(graph, 0, i));
    const config = withViews({ lexical: false, data: false, embeddings: false }); config.hubMinDegree = 3;
    for (const constraints of [[], [link(graph, "must-link", 0, 1)]]) {
      const result = clusterMultiview({ snapshot: graph, config, constraints });
      expect(result.pass).toBe(true);
      expect(result.metrics.modularity).toBeCloseTo(oracleModularity(graph, result.partition!)!, 12);
      expect(result.metrics.communities.every(item => item.conductance === 1)).toBe(true);
      expect(result.metrics.counters.adjacencyVisits).toBe(2 * result.metrics.counters.softEdges);
      expect(result.metrics.counters.metricEdgeVisits).toBe(result.metrics.counters.softEdges);
    }
    const isolated = clusterMultiview({ snapshot: graph, config }); expect(isolated.metrics.modularity).toBeCloseTo(-0.3125, 12);
    const disconnected = tinyGraph(4); disconnected.edges = [call(disconnected, 0, 1), call(disconnected, 2, 3)];
    const two = clusterMultiview({ snapshot: disconnected, config: withViews({ lexical: false, data: false, embeddings: false }) });
    expect(two.metrics.modularity).toBeCloseTo(0.5, 12); expect(two.metrics.modularity).toBeCloseTo(oracleModularity(disconnected, two.partition!)!, 12);
    expect(clusterMultiview({ snapshot: tinyGraph(2), config }).metrics.modularity).toBeNull();
  });
});

describe("L4 parent counterexamples: scientific comparisons and lossless lineage", () => {
  test("membership equality cannot hide kernel, context, coverage or cost changes", () => {
    const graph = tinyGraph(); graph.edges = [call(graph, 0, 1)];
    const first = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, data: false, embeddings: false }) });
    const partition = first.partition!, details = partitionDetails(partition);
    const absent = comparePartitions(partition, structuredClone(partition));
    expect(absent.membershipStable).toBe(true); expect(absent.scientificStable).toBe(false); expect(absent.detailsComplete).toBe(false);
    for (const field of ["kernelIds", "externalContextIds"] as const) {
      const changed = structuredClone(partition); changed.communities[0]![field] = field === "kernelIds" ? [graph.nodes[0]!.id] : [graph.nodes[2]!.id];
      const comparison = comparePartitions(partition, changed, 0.85, { previous: details, next: details });
      expect(comparison.membershipStable).toBe(true); expect(comparison.stable).toBe(false); expect(comparison.moves).toEqual([]);
      expect(field === "kernelIds" ? comparison.kernelChanges.length : comparison.contextChanges.length).toBe(1);
    }
    const newDetails = structuredClone(details); newDetails.coverage[0]!.coverage = "partial"; newDetails.costs[0]!.estimatedCost = { known: false, value: null };
    const changed = comparePartitions(partition, partition, 0.85, { previous: details, next: newDetails });
    expect(changed.coverageChanges).toHaveLength(1); expect(changed.costChanges).toHaveLength(1); expect(changed.detailsComplete).toBe(false);
    expect(changed.costChanges[0]!.after).toEqual({ known: false, value: null });
    const unknownBoth = comparePartitions(partition, partition, 0.85, { previous: newDetails, next: structuredClone(newDetails) });
    expect(unknownBoth.costChanges).toEqual([]); expect(unknownBoth.scientificStable).toBe(false);
    expect(comparePartitions(partition, partition, 0.85, { previous: details, next: structuredClone(details) }).scientificStable).toBe(true);
    const changedSnapshot = comparePartitions(partition, { ...partition, snapshotFingerprint: "ef".repeat(32) }, 0.85, { previous: details, next: details });
    expect(changedSnapshot.membershipStable).toBe(true); expect(changedSnapshot.snapshotChanged && !changedSnapshot.scientificStable).toBe(true);
  });

  test("fractional conductance is preserved losslessly outside KnownInteger", () => {
    const graph = tinyGraph(2), base = clusterMultiview({ snapshot: graph, config: noViews() }).partition!;
    const draft = { memberIds: graph.nodes.map(node => node.id), kernelIds: [graph.nodes[0]!.id], externalContextIds: [], conductance: { known: true, value: 0.5 } };
    const result = assignCommunityLineage(null, [draft], { algorithm: base.algorithm, algorithmVersion: base.algorithmVersion, configFingerprint: base.configFingerprint, snapshotId: graph.snapshotId, hysteresis: 0.85 });
    expect(result.communities[0]!.conductance).toEqual({ known: false, value: null });
    expect(result.sidecar.communities[0]!.conductance).toEqual({ known: true, value: 0.5 });
    expect(JSON.parse(JSON.stringify(result.sidecar))).toEqual(result.sidecar); expect(result.diagnostics).toEqual([]);
    const invalid = assignCommunityLineage(null, [{ ...draft, conductance: { known: true, value: NaN } }], { algorithm: base.algorithm, algorithmVersion: base.algorithmVersion, configFingerprint: base.configFingerprint, snapshotId: graph.snapshotId, hysteresis: 0.85 });
    expect(invalid.sidecar.v1Compatible).toBe(false);
  });

  test("3-parent merge keeps every parent in sidecar, refuses adoption, and cannot erase ancestry on replay", () => {
    const graph = tinyGraph(), root = clusterMultiview({ snapshot: graph, config: noViews() });
    const meta = { algorithm: root.partition!.algorithm, algorithmVersion: root.partition!.algorithmVersion, configFingerprint: root.configFingerprint, snapshotId: graph.snapshotId, hysteresis: 0.85 };
    const draft = { memberIds: graph.nodes.map(node => node.id), kernelIds: [graph.nodes[0]!.id], externalContextIds: [], conductance: { known: false, value: null } };
    const merged = assignCommunityLineage(root.partition, [draft], meta, root.lineageSidecar!);
    expect(merged.sidecar.communities[0]!.parentContentIds).toEqual(root.partition!.communities.map(item => item.contentId).sort());
    expect(merged.communities[0]!.parentContentIds).toEqual([]); // Not a silently truncated fake 2-parent merge.
    expect(merged.sidecar.v1Compatible).toBe(false); expect(merged.diagnostics.some(item => item.code === "lineage-v1-parent-limit")).toBe(true);
    const partition = { ...root.partition!, partitionId: merged.partitionId, lineageId: merged.partitionLineageId, parentLineageId: merged.parentLineageId, communities: merged.communities };
    merged.sidecar.projectionFingerprint = partitionProposalFingerprint(partition);
    expect(planAdoption({ partition, lineageSidecar: merged.sidecar, explicit: true, units: [] }).adopted).toBe(false);
    const replay = assignCommunityLineage(partition, [draft], meta, merged.sidecar);
    expect(replay.sidecar.communities[0]!.parentContentIds).toHaveLength(3); expect(replay.sidecar.proposalPass).toBe(false);
    const absent = assignCommunityLineage(partition, [draft], meta); expect(absent.sidecar.proposalPass).toBe(false); expect(absent.diagnostics.some(item => item.code === "lineage-previous-sidecar-missing")).toBe(true);
  });

  test("algorithm version is a lineage boundary, ties use canonical prior content ID, not input order", () => {
    const graph = tinyGraph(4), base = clusterMultiview({ snapshot: graph, config: noViews() }).partition!;
    const meta = { algorithm: "fixture:tie", algorithmVersion: "1", configFingerprint: base.configFingerprint, snapshotId: graph.snapshotId, hysteresis: 0.3 };
    const draft = (indexes: number[]) => ({ memberIds: indexes.map(i => graph.nodes[i]!.id), kernelIds: [], externalContextIds: [], conductance: { known: false, value: null } });
    const root = assignCommunityLineage(null, [draft([0, 1]), draft([2, 3])], meta);
    const partition = { ...base, algorithm: meta.algorithm, algorithmVersion: meta.algorithmVersion, partitionId: root.partitionId, lineageId: root.partitionLineageId, communities: root.communities };
    const first = assignCommunityLineage(partition, [draft([0, 2])], meta);
    const reordered = assignCommunityLineage({ ...partition, communities: [...partition.communities].reverse() }, [draft([2, 0])], meta);
    expect(first.communities).toEqual(reordered.communities);
    const expected = [...root.communities].sort((a, b) => a.contentId < b.contentId ? -1 : 1)[0]!.lineageId;
    expect(first.communities[0]!.lineageId).toBe(expected);
    const changedVersion = assignCommunityLineage(partition, [draft([0, 1])], { ...meta, algorithmVersion: "2" });
    expect(changedVersion.communities[0]!.lineageId).not.toBe(root.communities[0]!.lineageId); expect(changedVersion.communities[0]!.parentContentIds).toEqual([]);
  });
});

describe("L4 parent counterexamples: architecture reference integrity", () => {
  test("cross-module community with identical 12-hex prefixes has real modules, distinct fullhash containers and a semantic subsystem", () => {
    const graph = tinyGraph(2);
    graph.nodes.forEach((node, i) => { node.moduleSha256 = "a".repeat(12) + String(i + 1).repeat(52); node.id = `${node.moduleSha256}:${node.rva}`; });
    graph.edges = [call(graph, 0, 1)];
    const result = clusterMultiview({ snapshot: graph, config: withViews({ lexical: false, data: false, embeddings: false }) });
    expect(result.pass).toBe(true); expect(result.partition!.communities).toHaveLength(1);
    expect(result.architecture.subsystems).toHaveLength(2); expect(result.architecture.semanticSubsystems).toHaveLength(1);
    expect(result.architecture.semanticSubsystems[0]!.moduleSha256s).toHaveLength(2);
    expect(new Set(result.architecture.subsystems.map(item => item.subsystemId)).size).toBe(2);
    for (const item of result.architecture.subsystems) { expect(item.moduleSha256).toHaveLength(64); expect(item.subsystemId).toBe(`sub:${item.moduleSha256}`); }
    const reloaded = JSON.parse(JSON.stringify(result.architecture)); expect(validateArchitectureExport(reloaded)).toBe(true);
    reloaded.functions[0].subsystemId = "sub:dangling"; expect(validateArchitectureExport(reloaded)).toBe(false);
    const missing = structuredClone(result.architecture); missing.semanticSubsystems = []; expect(validateArchitectureExport(missing)).toBe(false);
    expect(validateArchitectureExport({})).toBe(false);
  });
});

describe("L4 parent counterexamples: proposal adoption is not state-based native admission", () => {
  test("absence of authoritative attempt+claim inventories blocks migration even READY/BLOCKED", () => {
    const result = clusterMultiview({ snapshot: tinyGraph(2), config: noViews() });
    for (const state of ["PENDING", "BLOCKED", "READY"] as const) {
      const unit = { unitId: `fixture:${state}`, state, snapshotId: "snap:old", ownedFunctionIds: [result.partition!.communities[0]!.memberIds[0]!] };
      const adoption = planAdoption({ partition: result.partition!, lineageSidecar: result.lineageSidecar!, units: [unit], explicit: true });
      expect(adoption.adopted).toBe(true); // Proposal for future work only, NOT native migration.
      expect(adoption.migratableUnitIds).toEqual([]); expect(adoption.retainedUnits).toEqual([unit]); expect(adoption.untouchedUnitIds).toEqual([unit.unitId]);
      expect(adoption.retainedUnits[0]!.snapshotId).toBe("snap:old");
    }
    expect(planAdoption({ partition: result.partition!, units: [], explicit: true }).adopted).toBe(false);
  });

  test("proof must match unit, old snapshot, every attempt/claim; active workers or claims and authority refusal block migration", () => {
    const result = clusterMultiview({ snapshot: tinyGraph(2), config: noViews() });
    const unit: FrozenActiveUnit = { unitId: "fixture:unit", state: "READY", snapshotId: "snap:old", ownedFunctionIds: [result.partition!.communities[0]!.memberIds[0]!], attemptIds: ["attempt:1"], claimIds: ["claim:1"], executionContext: { prompt: "frozen prompt", dependencyIds: ["required"], budgetBytes: 100 } };
    const proof: UnitQuiescenceProof = { unitId: unit.unitId, snapshotId: unit.snapshotId, attemptIds: [...unit.attemptIds!], claimIds: [...unit.claimIds!], authorityRef: "fixture:authority", revision: 1, quiescent: true, released: true, workerStillExecutable: false, leaseHeld: false };
    const input = { partition: result.partition!, lineageSidecar: result.lineageSidecar!, units: [unit], explicit: true, quiescence: [proof], verifyQuiescence: () => true };
    expect(planAdoption(input).migratableUnitIds).toEqual([unit.unitId]);
    for (const patch of [{ unitId: "other" }, { snapshotId: result.partition!.snapshotId }, { attemptIds: [] }, { claimIds: [] }, { authorityRef: "" }, { revision: -1 }, { workerStillExecutable: true }, { leaseHeld: true }, { released: false }, { quiescent: false }]) {
      const blocked = planAdoption({ ...input, quiescence: [{ ...proof, ...patch }] }); expect(blocked.migratableUnitIds).toEqual([]); expect(blocked.retainedUnits).toEqual([unit]);
    }
    for (const verifyQuiescence of [undefined, () => false, () => { throw new Error("fixture authority error"); }]) expect(planAdoption({ ...input, verifyQuiescence }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, quiescence: [proof, structuredClone(proof)] }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, units: [{ ...unit, leaseHeld: true }] }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, units: [{ ...unit, workerStillExecutable: true }] }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, units: [{ ...unit, attempts: [{ attemptId: "attempt:1", snapshotId: unit.snapshotId, workerStillExecutable: true }] }] }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, units: [{ ...unit, claims: [{ claimId: "claim:1", snapshotId: unit.snapshotId, leaseHeld: true }] }] }).migratableUnitIds).toEqual([]);
    const retained = planAdoption({ ...input, units: [{ ...unit, state: "RUNNING", extraExecutionField: { fence: 42 } } as FrozenActiveUnit] });
    expect(retained.migratableUnitIds).toEqual([]); expect((retained.retainedUnits[0] as any).extraExecutionField).toEqual({ fence: 42 }); expect(retained.retainedUnits[0]!.executionContext).toEqual(unit.executionContext);
    (retained.retainedUnits[0]!.executionContext as any).prompt = "changed clone"; expect((unit.executionContext as any).prompt).toBe("frozen prompt");
    const altered = structuredClone(result.partition!); altered.communities[0]!.kernelIds = [];
    expect(planAdoption({ ...input, partition: altered }).adopted).toBe(false);
    const proposal = structuredClone(result.partition!), expected = structuredClone(proposal.communities);
    const frozen = planAdoption({ ...input, partition: proposal, verifyQuiescence: () => { proposal.communities.length = 0; return true; } });
    expect(frozen.partition.communities).toEqual(expected); expect(frozen.migratableUnitIds).toEqual([unit.unitId]);
  });
});

describe("L4 FULL pipeline sparse benchmarks", () => {
  test("1k/10k include E/degrees/SCC and whole proposal, delta, comparison and adoption stages", () => {
    const reports = [1000, 10000].map(benchmarkMultiviewPipeline);
    for (const report of reports) {
      expect(report.pass).toBe(true); expect(report.bounded).toBe(true);
      expect(report.edgeCount).toBeGreaterThan(report.nodeCount); expect(report.relationCount).toBe(report.edgeCount);
      expect(report.sccCount).toBe(report.nodeCount / 8); expect(report.maximumSccSize).toBe(8);
      expect(report.maximumTotalDegree).toBeLessThanOrEqual(5);
      expect(report.counters.adjacencyVisits).toBe(2 * report.counters.softEdges); expect(report.counters.metricEdgeVisits).toBe(report.counters.softEdges);
      expect(report.pipeline).toContain("compare+delta+region+adoption"); expect(report.elapsedMs).toBeGreaterThan(0);
      expect(report.comparisons).toBeLessThan(report.quadraticPairs); expect(report.counters.canonicalRelations).toBe(report.relationCount);
      const { lineage: initialLineage, ...initialCounters } = report.counters;
      const { lineage: repeatedLineage, ...repeatedCounters } = report.repeatCounters;
      expect(repeatedCounters).toEqual(initialCounters);
      expect(initialLineage.draftMembers).toBe(report.nodeCount); expect(initialLineage.overlapMemberVisits).toBe(0);
      expect(repeatedLineage.overlapMemberVisits).toBe(2 * report.nodeCount); expect(repeatedLineage.indexedMemberVisits).toBe(2 * report.nodeCount);
      expect(report.comparisonCounters.overlapMemberVisits).toBe(2 * report.nodeCount); expect(report.comparisonCounters.indexedMemberVisits).toBe(4 * report.nodeCount);
    }
    expect(reports[1]!.counters.adjacencyVisits / reports[0]!.counters.adjacencyVisits).toBeLessThan(12);
  }, 60000);
});
