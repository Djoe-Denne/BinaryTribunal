import { configFingerprint, validConfig, provenanceReady, ALGORITHM, ALGORITHM_VERSION, LEXICAL_RULESET_VERSION } from "./semantic-config-codec";
export { configFingerprint, validConfig, provenanceReady, ALGORITHM, ALGORITHM_VERSION, LEXICAL_RULESET_VERSION } from "./semantic-config-codec";
import { canonical, hash } from "./validation";
import { stronglyConnectedComponents } from "./scc";
import {
  assignCommunityLineage,
  affectedRegion,
  assessKnowledgeDelta,
  communityContentId,
  compareFunctionIds,
  comparePartitions,
  knowledgeDeltaId,
  planAdoption,
  partitionProposalFingerprint,
  immutableSnapshot,
  snapshotProposalWitness,
  proposalEvidenceFingerprint,
  inspectProposalEvidence,
  isSerializableProposalData,
  sortFunctionIds,
  type ClusterPartitionView,
  type CommunityDraft,
  type Diagnostic,
  type LineageAssignment,
  type UnknownableInteger,
  type KnowledgeDeltaView,
  type ProposalEvidence,
  type ProposalWitness,
  type LocalProposalReceipt,
} from "./lineage";

/**
 * Index lexical déterministe et clustering multivue du régime B.
 * Projection structurale du contrat v1 : pas d'import de graph.ts (owner L2, absent ici).
 * Aucun réseau, aucun LLM, aucun modèle téléchargé. L'encodeur est injecté ou absent.
 */

export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["update", "refresh", "tick"],
  ["state", "status"],
];
const STOPWORDS = new Set(["a", "an", "the", "of", "to", "and", "or", "in", "on", "for", "with", "by"]);
const CODE_KINDS = new Set(["direct_call", "tail_jump", "indirect_resolved", "thunk"]);
const PSEUDO_CAPABILITIES = new Set(["name-similarity"]);
const LOCAL_PROPOSALS = new WeakMap<LocalProposalReceipt, ProposalEvidence>();

/** Read-only lookup. No public operation can certify arbitrary caller evidence. */
export function readLocalProposalReceipt(receipt: unknown): ProposalEvidence | null {
  return receipt !== null && typeof receipt === "object" ? LOCAL_PROPOSALS.get(receipt as LocalProposalReceipt) ?? null : null;
}
const UNKNOWN_METRIC: UnknownableInteger = { known: false, value: null };

const MATURITY_WEIGHT: Record<string, number> = {
  none: 0,
  structural: 0.15,
  partial: 0.45,
  reconciled: 1,
  "published-local": 1,
};

export interface ProvenanceView {
  moduleSha256: string;
  siteRva: string | null;
  siteKind: string;
  xrefType: string;
  source: string;
  sourceVersion: string;
  sourceHash: string;
  evidenceSha256: string;
}

export interface FunctionNodeView {
  id: string;
  moduleSha256: string;
  rva: string;
  name: string;
  observedDescription: string;
  semanticMaturity: "none" | "structural" | "partial" | "reconciled" | "published-local";
  functionClass: string;
}

export interface FunctionEdgeView {
  id: string;
  sourceId: string;
  destinationId: string;
  kind: string;
  status: string;
  schedulerRelevance: string;
  sites?: readonly { siteRva: string; xrefType: string; provenance: ProvenanceView }[];
  confidence?: string;
  appearedInRevision?: number;
  retiredInRevision?: number | null;
}

export interface ReferencedObjectView {
  id: string;
  kind: string;
  name: string;
}

export interface UnresolvedReferenceView {
  fromFunctionId: string;
  kind: string;
  referencedObjectId: string | null;
}

export interface CapabilityFactView {
  id: string;
  subjectKind: string;
  subjectId: string;
  capability: string;
  confidence: string;
  hypotheticalRole: string | null;
}

export interface GraphSnapshotView {
  schemaVersion: 1;
  snapshotId: string;
  normalizedFingerprint: string;
  nodes: FunctionNodeView[];
  edges: FunctionEdgeView[];
  objects: ReferencedObjectView[];
  unresolved: UnresolvedReferenceView[];
  capabilities: CapabilityFactView[];
}

export interface LinkConstraint {
  kind: "must-link" | "cannot-link";
  leftId: string;
  rightId: string;
  provenance: ProvenanceView;
  validation: "validated" | "unvalidated" | "fixture-only";
}

export interface MultiviewViews {
  structure: boolean;
  data: boolean;
  lexical: boolean;
  embeddings: boolean;
  validatedRelations: boolean;
  capabilities: boolean;
}

export interface MultiviewConfig {
  rulesetVersion: string;
  synonyms: boolean;
  bm25: { k1: number; b: number };
  topK: number;
  scoreTieDecimals: number;
  similarityThreshold: number;
  maxPostingDf: number;
  maxCandidates: number;
  hubMinDegree: number;
  hysteresis: number;
  views: MultiviewViews;
}

export interface FrozenEncoder {
  modelId: string;
  tokenizerRevision: string;
  parameterFingerprint: string;
  dimension: number;
  implementationSha256?: string;
  tokenizerSha256?: string;
  encode(tokens: readonly string[]): readonly number[];
}

export interface EmbeddingCache {
  get(key: string): readonly number[] | undefined;
  set(key: string, vector: readonly number[]): void;
}

export interface LexicalHit {
  functionId: string;
  score: number;
  tfidf: number;
}

export interface LexicalIndex {
  rulesetVersion: string;
  documentCount: number;
  termCount: number;
  query(text: string, options?: { topK?: number; threshold?: number; excludeId?: string }): { hits: LexicalHit[]; examined: number };
  score(functionId: string, text: string): number;
}

export interface EmbeddingReport {
  status: "ready" | "absent" | "disabled" | "rejected";
  reason: string;
  modelId: string | null;
  tokenizerRevision: string | null;
  parameterFingerprint: string | null;
  cacheHits: number;
  cacheMisses: number;
  measuredGain: number | null;
  comparedToLexical: boolean;
  comparisons: number;
  rankingDisagreement: number | null;
  qualityOracle: "absent";
  freezeVerification: "not-configured" | "declared-only" | "externally-verified";
}

export interface ArchitectureExport {
  formatVersion: "l4-architecture-1";
  experimental: true;
  oracle: false;
  engine: string;
  functions: Array<{ functionId: string; moduleSha256: string; communityContentId: string; subsystemId: string; semanticSubsystemId?: string }>;
  communities: Array<{ contentId: string; lineageId: string; memberIds: string[]; moduleSha256s: string[] }>;
  subsystems: Array<{ subsystemId: string; moduleSha256: string; communityContentIds: string[]; kind: "module" }>;
  /** Legacy module containers above are not reconstructed semantic subsystems. */
  semanticSubsystems: Array<{ subsystemId: string; communityContentIds: string[]; moduleSha256s: string[]; kind: "community" }>;
  architecture: {
    modules: Array<{ moduleSha256: string; subsystemIds: string[]; functionCount: number; semanticSubsystemIds?: string[] }>;
    transversalCapacities: Array<{ capability: string; functionIds: string[]; moduleSha256s: string[]; spansModules: boolean }>;
  };
}

export interface MultiviewResult {
  pass: boolean;
  partition: ClusterPartitionView | null;
  architecture: ArchitectureExport;
  diagnostics: Diagnostic[];
  constraints: { status: "satisfied" | "unsatisfiable" | "none"; applied: number; rejected: number };
  embeddings: EmbeddingReport;
  views: MultiviewViews;
  configFingerprint: string;
  lineageSidecar: LineageAssignment["sidecar"] | null;
  proposalEvidence: ProposalEvidence | null;
  proposalReceipt: LocalProposalReceipt | null;
  relations: CanonicalRelation[];
  dependencyEdges: Array<{ sourceId: string; destinationId: string; kind: string; status: string; schedulerRelevance?: string; relationKey?: string; transportIds?: string[]; sites?: CanonicalRelation["sites"] }>;
  selfLoopIds: string[];
  metrics: {
    modularity: number | null;
    comparisons: number;
    quadraticPairs: number;
    nodeCount: number;
    similarityEdges: number;
    structureEdges: number;
    dataEdges: number;
    validatedEdges: number;
    communities: Array<{ contentId: string; conductance: number | null }>;
    metricGraph: "derived-undirected-weighted-no-self-loops";
    totalWeight: number;
    communityWeights: Array<{ contentId: string; internalWeight: number; volume: number; cut: number; conductanceDenominator: number }>;
    counters: { transportEdges: number; canonicalRelations: number; transportSiteProofs: number; canonicalSiteProofs: number; softEdges: number; adjacencyVisits: number; constraintChecks: number; metricEdgeVisits: number; lexicalQueries: number; encoderComparisons: number; lineage: LineageAssignment["counters"]; architectureFunctions: number };
  };
}

export interface CanonicalRelation {
  relationKey: string;
  sourceId: string;
  destinationId: string;
  kind: string;
  status: string;
  schedulerRelevance: string;
  transportIds: string[];
  sites: Array<{ siteRva: string; xrefType: string; provenance: ProvenanceView }>;
  evidenceAvailability: "available" | "unavailable";
  policyConflict: boolean;
}

interface IndexedDoc {
  id: string;
  moduleSha256: string;
  tokens: string[];
  tf: Map<string, number>;
  length: number;
  maturity: number;
}

interface SoftEdge {
  a: string;
  b: string;
  weight: number;
  view: "structure" | "data" | "lexical" | "validated";
}

export function defaultMultiviewConfig(): MultiviewConfig {
  return {
    rulesetVersion: LEXICAL_RULESET_VERSION,
    synonyms: true,
    bm25: { k1: 1.2, b: 0.75 },
    topK: 10,
    scoreTieDecimals: 9,
    similarityThreshold: 0.45,
    maxPostingDf: 48,
    maxCandidates: 32,
    hubMinDegree: 8,
    hysteresis: 0.85,
    views: { structure: true, data: true, lexical: true, embeddings: true, validatedRelations: true, capabilities: true },
  };
}


export function createMemoryEmbeddingCache(): EmbeddingCache {
  const store = new Map<string, readonly number[]>();
  return {
    get(key) { return store.get(key)?.slice(); },
    set(key, vector) { store.set(key, vector.slice()); },
  };
}

export function normalizeTokens(text: string, synonyms: boolean): string[] {
  const folded = text.normalize("NFKC").toLowerCase();
  const raw = folded.split(/[^a-z0-9]+/).filter(token => token.length >= 2 && !STOPWORDS.has(token));
  return raw.map(token => synonyms ? canonicalToken(token) : token);
}

export function buildLexicalIndex(snapshot: GraphSnapshotView, config: MultiviewConfig = defaultMultiviewConfig()): LexicalIndex {
  ({ snapshot, config } = immutableSnapshot({ snapshot, config }));
  if (!validConfig(config)) throw new RangeError("invalid multiview configuration");
  const docs = indexDocuments(snapshot, config);
  const docsById = new Map(docs.map(doc => [doc.id, doc]));
  const postings = new Map<string, Array<{ doc: number; tf: number }>>();
  let totalLength = 0;
  docs.forEach((doc, index) => {
    totalLength += doc.length;
    for (const [term, tf] of doc.tf) {
      const list = postings.get(term) ?? [];
      list.push({ doc: index, tf });
      postings.set(term, list);
    }
  });
  for (const list of postings.values()) list.sort((a, b) => a.doc - b.doc);
  const averageLength = docs.length === 0 ? 0 : totalLength / docs.length;
  const idf = new Map<string, number>();
  for (const [term, list] of postings) {
    const df = list.length;
    idf.set(term, Math.log(1 + (docs.length - df + 0.5) / (df + 0.5)));
  }
  return {
    rulesetVersion: config.rulesetVersion,
    documentCount: docs.length,
    termCount: postings.size,
    query(text, options) {
      const tokens = normalizeTokens(text, config.synonyms);
      const topK = Math.min(options?.topK ?? config.topK, 100);
      const threshold = options?.threshold ?? 0;
      const exclude = options?.excludeId;
      const candidateDocs = candidateIndexes(tokens, postings, docs, exclude, config);
      const hits: LexicalHit[] = [];
      for (const index of candidateDocs) {
        const doc = docs[index];
        if (!doc || doc.id === exclude) continue;
        const score = bm25(tokens, doc, idf, averageLength, config);
        if (score < threshold) continue;
        hits.push({ functionId: doc.id, score: roundScore(score, config.scoreTieDecimals), tfidf: roundScore(tfidfCosine(tokens, doc, idf), config.scoreTieDecimals) });
      }
      hits.sort((left, right) => right.score - left.score || right.tfidf - left.tfidf || compareFunctionIds(left.functionId, right.functionId));
      return { hits: hits.slice(0, topK), examined: candidateDocs.length };
    },
    score(functionId, text) {
      const doc = docsById.get(functionId);
      if (!doc) return 0;
      return roundScore(bm25(normalizeTokens(text, config.synonyms), doc, idf, averageLength, config), config.scoreTieDecimals);
    },
  };
}

export function clusterMultiview(input: {
  snapshot: GraphSnapshotView;
  config?: MultiviewConfig;
  encoder?: FrozenEncoder | null;
  cache?: EmbeddingCache;
  constraints?: readonly LinkConstraint[];
  previous?: ClusterPartitionView | null;
  previousLineageSidecar?: LineageAssignment["sidecar"];
  previousProposalWitness?: ProposalWitness;
  verifyEncoderFreeze?: (identity: Omit<FrozenEncoder, "encode">) => boolean;
}): MultiviewResult {
  // Take one scientific snapshot before config validation, hashing, or adapter hooks.
  const state = immutableSnapshot({ snapshot: input.snapshot, config: input.config ?? defaultMultiviewConfig(),
    constraints: input.constraints ?? [], previous: input.previous ?? null, previousLineageSidecar: input.previousLineageSidecar });
  input = { ...state, previousProposalWitness: snapshotProposalWitness(input.previousProposalWitness), encoder: input.encoder, cache: input.cache, verifyEncoderFreeze: input.verifyEncoderFreeze };
  const config = input.config ?? defaultMultiviewConfig();
  const encoder = input.encoder ?? null;
  const cache = input.cache ?? createMemoryEmbeddingCache();
  if (!validConfig(config)) return emptyResult(defaultMultiviewConfig(), hash("invalid-config"), [{ code: "invalid-config", severity: "fail", detail: "multiview parameters must be finite, bounded and versioned", functionIds: [] }], embeddingReport(defaultMultiviewConfig(), null, 0, 0, 0, null));
  const diagnostics: Diagnostic[] = [];
  let fingerprint: string;
  let encoderIdentityException = false;
  let capturedEncoderIdentity: Omit<FrozenEncoder, "encode"> | null = null;
  try {
    // Optional undefined metadata is absent in the serializable source envelope.
    capturedEncoderIdentity = encoder ? immutableSnapshot(Object.fromEntries(Object.entries(encoderIdentity(encoder)).filter(([, value]) => value !== undefined)) as Omit<FrozenEncoder, "encode">) : null;
    fingerprint = configFingerprint(config, capturedEncoderIdentity);
  }
  catch {
    encoderIdentityException = true;
    fingerprint = configFingerprint(config, null);
    diagnostics.push({ code: "encoder-identity-exception", severity: "warning", detail: "optional encoder identity could not be read; lexical fallback is retained", functionIds: [] });
  }
  const nodes = [...input.snapshot.nodes].sort((a, b) => compareFunctionIds(a.id, b.id));
  if (nodes.length === 0) {
    diagnostics.push({ code: "empty-snapshot", severity: "fail", detail: "a partition requires at least one function", functionIds: [] });
    return emptyResult(config, fingerprint, diagnostics, embeddingReport(config, encoder, 0, 0, 0, null));
  }
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) diagnostics.push({ code: "duplicate-node", severity: "fail", detail: "snapshot has duplicate function identities", functionIds: [] });
  const docs = indexDocuments(input.snapshot, config);
  const docsById = new Map(docs.map(doc => [doc.id, doc]));
  const index = buildLexicalIndex(input.snapshot, config);
  const edgeIndex = new Map<string, SoftEdge>();
  const relations = canonicalRelations(input.snapshot.edges, diagnostics);
  const dependencyEdges: MultiviewResult["dependencyEdges"] = [];
  const selfLoopIds: string[] = [];
  const structureDegree = new Map<string, number>();
  let comparisons = 0;
  for (const edge of relations) {
    if (edge.policyConflict) continue;
    if (!byId.has(edge.sourceId) || !byId.has(edge.destinationId)) {
      diagnostics.push({ code: "relation-endpoint", severity: "fail", detail: "relation names a function outside the snapshot", functionIds: [edge.sourceId, edge.destinationId] });
      continue;
    }
    if (edge.sourceId === edge.destinationId) {
      if (CODE_KINDS.has(edge.kind) && (edge.status === "observed" || edge.status === "validated")) selfLoopIds.push(edge.sourceId);
      continue;
    }
    if (!CODE_KINDS.has(edge.kind) || edge.kind === "callback_candidate") continue;
    if (!byId.has(edge.sourceId) || !byId.has(edge.destinationId)) continue;
    const validated = edge.status === "validated";
    const observed = edge.status === "observed";
    if (validated && config.views.validatedRelations) {
      pushEdge(edgeIndex, edge.sourceId, edge.destinationId, 1, "validated");
      dependencyEdges.push({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind, status: edge.status, schedulerRelevance: edge.schedulerRelevance, relationKey: edge.relationKey, transportIds: [...edge.transportIds], sites: structuredClone(edge.sites) });
    } else if (observed && config.views.structure) {
      pushEdge(edgeIndex, edge.sourceId, edge.destinationId, 0.85, "structure");
      dependencyEdges.push({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind, status: edge.status, schedulerRelevance: edge.schedulerRelevance, relationKey: edge.relationKey, transportIds: [...edge.transportIds], sites: structuredClone(edge.sites) });
    }
  }
  selfLoopIds.splice(0, selfLoopIds.length, ...sortFunctionIds([...new Set(selfLoopIds)]));
  if (config.views.data) {
    const byObject = new Map<string, string[]>();
    for (const ref of input.snapshot.unresolved) {
      if (ref.kind !== "data_xref" || !ref.referencedObjectId || !byId.has(ref.fromFunctionId)) continue;
      const list = byObject.get(ref.referencedObjectId) ?? [];
      list.push(ref.fromFunctionId);
      byObject.set(ref.referencedObjectId, list);
    }
    for (const ids of byObject.values()) {
      const unique = sortFunctionIds([...new Set(ids)]);
      for (let j = 1; j < unique.length; j++) pushEdge(edgeIndex, unique[0]!, unique[j]!, 0.7, "data");
    }
  }
  let similarityEdges = 0;
  const queries = new Map<string, LexicalHit[]>();
  if (config.views.lexical || config.views.embeddings) for (const doc of docs) {
    const description = byId.get(doc.id)!.observedDescription;
    if (description.trim().length === 0) continue;
    const queried = index.query(description, { topK: config.topK, threshold: 0, excludeId: doc.id });
    comparisons += queried.examined;
    queries.set(doc.id, queried.hits);
  }
  let embedding: { report: EmbeddingReport; cosine: Map<string, number> };
  try { embedding = encoderIdentityException ? { report: embeddingReport(config, null, 0, 0, 0, null, "rejected", "encoder-identity-exception", null, "declared-only"), cosine: new Map() } : scoreEmbeddings(docs, queries, config, encoder, cache, diagnostics, input.verifyEncoderFreeze); }
  catch {
    diagnostics.push({ code: "encoder-boundary-exception", severity: "warning", detail: "optional adapter threw outside vector encoding; lexical fallback is retained", functionIds: [] });
    embedding = { report: embeddingReport(config, null, 0, 0, 0, null, "rejected", "encoder-boundary-exception"), cosine: new Map() };
  }
  if (config.views.lexical || (config.views.embeddings && embedding.report.status === "ready")) {
    for (const doc of docs) {
      const description = byId.get(doc.id)!.observedDescription;
      const selfScore = index.score(doc.id, description);
      for (const hit of queries.get(doc.id) ?? []) {
        const other = docsById.get(hit.functionId);
        if (!other || other.moduleSha256 !== doc.moduleSha256) continue;
        const ratio = selfScore > 0 ? hit.score / selfScore : 0;
        const maturity = Math.min(doc.maturity, other.maturity);
        let weight = config.views.lexical ? ratio * maturity : 0;
        if (config.views.embeddings && embedding.report.status === "ready") {
          const cosine = embedding.cosine.get(pairKey(doc.id, other.id)) ?? 0;
          weight = Math.max(weight, cosine * maturity);
        }
        if (!Number.isFinite(weight) || weight <= 0 || weight < config.similarityThreshold) continue;
        pushEdge(edgeIndex, doc.id, other.id, weight, "lexical");
        similarityEdges += 1;
      }
    }
  }
  const edges = [...edgeIndex.values()].sort((a, b) => compareFunctionIds(a.a, b.a) || compareFunctionIds(a.b, b.b) || a.view.localeCompare(b.view));
  similarityEdges = edges.filter(edge => edge.view === "lexical").length;
  const structuralPairs = new Set<string>();
  for (const edge of edges) if ((edge.view === "structure" || edge.view === "validated") && !structuralPairs.has(pairKey(edge.a, edge.b))) {
    structuralPairs.add(pairKey(edge.a, edge.b)); bumpDegree(structureDegree, edge.a, edge.b);
  }
  const hubs = new Set([...structureDegree.entries()].filter(([, degree]) => degree >= config.hubMinDegree).map(([id]) => id));
  const constraintReport = applyConstraints(input.constraints ?? [], byId, diagnostics);
  const parent = new Map<string, string>(nodes.map(node => [node.id, node.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (id !== root) { const next = parent.get(id)!; parent.set(id, root); id = next; }
    return root;
  };
  const union = (left: string, right: string) => {
    let a = find(left);
    let b = find(right);
    if (a === b) return;
    if (compareFunctionIds(a, b) > 0) [a, b] = [b, a];
    parent.set(b, a);
  };
  for (const edge of edges) {
    if (hubs.has(edge.a) || hubs.has(edge.b)) continue;
    if (edge.view === "lexical" && edge.weight < config.similarityThreshold) continue;
    union(edge.a, edge.b);
  }
  for (const link of constraintReport.must) union(link.leftId, link.rightId);
  // Authoritative check is on the FINAL union, not an earlier structural-only view.
  for (const link of [...constraintReport.cannot, ...constraintReport.must]) {
    const same = find(link.leftId) === find(link.rightId);
    if ((link.kind === "cannot-link" && same) || (link.kind === "must-link" && !same)) {
      constraintReport.status = "unsatisfiable";
      diagnostics.push({ code: "constraint-final-partition", severity: "fail", detail: "the rendered all-view partition violates a validated constraint", functionIds: sortFunctionIds([link.leftId, link.rightId]) });
    }
  }
  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    const root = find(node.id);
    const list = groups.get(root) ?? [];
    list.push(node.id);
    groups.set(root, list);
  }
  const adjacency = new Map<string, SoftEdge[]>(nodes.map(node => [node.id, []]));
  for (const edge of edges) { adjacency.get(edge.a)!.push(edge); adjacency.get(edge.b)!.push(edge); }
  let adjacencyVisits = 0;
  const drafts: CommunityDraft[] = [...groups.values()].map(memberIds => {
    const sorted = sortFunctionIds(memberIds);
    const members = new Set(sorted);
    let best = -1;
    const degree = new Map<string, number>();
    for (const id of sorted) degree.set(id, 0);
    const external = new Set<string>();
    for (const id of sorted) for (const edge of adjacency.get(id) ?? []) {
      adjacencyVisits += 1;
      const other = edge.a === id ? edge.b : edge.a;
      if (members.has(other) && edge.view !== "lexical") degree.set(id, (degree.get(id) ?? 0) + 1);
      if ((edge.view === "structure" || edge.view === "validated") && hubs.has(other) && !members.has(other)) external.add(other);
    }
    for (const value of degree.values()) best = Math.max(best, value);
    const kernelIds = best <= 0 ? [sorted[0]!] : sorted.filter(id => (degree.get(id) ?? 0) === best);
    return { memberIds: sorted, kernelIds, externalContextIds: sortFunctionIds([...external]), conductance: UNKNOWN_METRIC };
  });
  const lineage = assignCommunityLineage(input.previous ?? null, drafts, {
    algorithm: ALGORITHM,
    algorithmVersion: ALGORITHM_VERSION,
    configFingerprint: fingerprint,
    snapshotId: input.snapshot.snapshotId,
    hysteresis: config.hysteresis,
  }, input.previousLineageSidecar, input.previousProposalWitness);
  diagnostics.push(...lineage.diagnostics);
  const partition: ClusterPartitionView = {
    schemaVersion: 1,
    partitionId: lineage.partitionId,
    lineageId: lineage.partitionLineageId,
    parentLineageId: lineage.parentLineageId,
    snapshotId: input.snapshot.snapshotId,
    snapshotFingerprint: input.snapshot.normalizedFingerprint,
    regime: "B",
    algorithm: ALGORITHM,
    algorithmVersion: ALGORITHM_VERSION,
    configFingerprint: fingerprint,
    seed: "none",
    communities: lineage.communities,
    modularity: UNKNOWN_METRIC,
    maturity: partitionMaturity(nodes, similarityEdges, config),
    adopted: false,
  };
  for (const community of partition.communities) {
    if (community.contentId !== communityContentId(ALGORITHM, ALGORITHM_VERSION, fingerprint, community.memberIds)) {
      diagnostics.push({ code: "content-id-drift", severity: "fail", detail: "community content id diverged from the contract hash", functionIds: community.memberIds });
    }
  }
  const quality = partitionMetrics(partition.communities, edges);
  const conductanceById = new Map(quality.communities.map(item => [item.contentId, item.conductance]));
  const weightsById = new Map(quality.communityWeights.map(item => [item.contentId, item]));
  for (const community of lineage.sidecar.communities) {
    const value = conductanceById.get(community.contentId) ?? null;
    const weights = weightsById.get(community.contentId)!;
    community.conductance = { known: value !== null, value, numerator: weights.cut, denominator: weights.conductanceDenominator };
  }
  const architecture = buildArchitecture(input.snapshot, partition, config);
  if (!architectureReferencesValid(architecture)) diagnostics.push({ code: "architecture-reference", severity: "fail", detail: "architecture contains a dangling or inconsistent reference", functionIds: [] });
  const pass = !diagnostics.some(item => item.severity === "fail") && constraintReport.status !== "unsatisfiable";
  lineage.sidecar.proposalPass = pass;
  lineage.sidecar.projectionFingerprint = partitionProposalFingerprint(partition);
  const result: MultiviewResult = {
    pass,
    partition,
    architecture,
    diagnostics,
    constraints: { status: constraintReport.status, applied: constraintReport.applied, rejected: constraintReport.rejected },
    embeddings: embedding.report,
    views: { ...config.views },
    configFingerprint: fingerprint,
    lineageSidecar: lineage.sidecar,
    proposalEvidence: null,
    proposalReceipt: null,
    relations,
    dependencyEdges: dependencyEdges.sort((a, b) => compareFunctionIds(a.sourceId, b.sourceId) || compareFunctionIds(a.destinationId, b.destinationId) || a.kind.localeCompare(b.kind)),
    selfLoopIds,
    metrics: {
      modularity: quality.modularity,
      comparisons,
      quadraticPairs: nodes.length * Math.max(nodes.length - 1, 0),
      nodeCount: nodes.length,
      similarityEdges,
      structureEdges: edges.filter(edge => edge.view === "structure").length,
      dataEdges: edges.filter(edge => edge.view === "data").length,
      validatedEdges: edges.filter(edge => edge.view === "validated").length,
      communities: quality.communities,
      metricGraph: "derived-undirected-weighted-no-self-loops",
      totalWeight: quality.totalWeight,
      communityWeights: quality.communityWeights,
      counters: { transportEdges: input.snapshot.edges.length, canonicalRelations: relations.length, transportSiteProofs: input.snapshot.edges.reduce((sum, edge) => sum + (edge.sites?.length ?? 0), 0), canonicalSiteProofs: relations.reduce((sum, edge) => sum + edge.sites.length, 0), softEdges: edges.length, adjacencyVisits, constraintChecks: constraintReport.must.length + constraintReport.cannot.length, metricEdgeVisits: edges.length, lexicalQueries: queries.size, encoderComparisons: embedding.report.comparisons, lineage: lineage.counters, architectureFunctions: architecture.functions.length },
    },
  };
  // The only mint path: bind the just-evaluated full source and full result,
  // including negative outcomes. No payload can call a public receipt factory.
  const evidenceBody = { version: "l4-proposal-evidence-1" as const,
    source: { snapshot: input.snapshot, config, constraints: input.constraints ?? [], encoderIdentity: capturedEncoderIdentity,
      encoderIdentityStatus: encoderIdentityException ? "unreadable" as const : encoder ? "captured" as const : "absent" as const,
      previous: lineage.previousSource },
    result: { partition, lineageSidecar: lineage.sidecar, diagnostics, constraints: result.constraints } };
  if (!isSerializableProposalData(evidenceBody)) return result;
  const evidence = immutableSnapshot({ ...evidenceBody, evidenceFingerprint: proposalEvidenceFingerprint(evidenceBody) });
  result.proposalEvidence = evidence;
  if (inspectProposalEvidence(evidence).wellFormed) {
    const receipt: LocalProposalReceipt = Object.freeze({ kind: "l4-local-proposal-receipt" });
    LOCAL_PROPOSALS.set(receipt, evidence);
    result.proposalReceipt = receipt;
  }
  return result;
}

/** Compatibility name. This now measures the complete proposal pipeline, not only lexical lookup. */
export function benchmarkSparseIndex(nodeCount: number) {
  return benchmarkMultiviewPipeline(nodeCount);
}

export function benchmarkMultiviewPipeline(nodeCount: number) {
  if (!Number.isSafeInteger(nodeCount) || nodeCount < 2 || nodeCount > 100000) throw new RangeError("benchmark N must be an integer in [2,100000]");
  const started = performance.now();
  const count = nodeCount;
  const moduleSha256 = "1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb";
  const nodes: FunctionNodeView[] = [];
  const edges: FunctionEdgeView[] = [];
  const objects: ReferencedObjectView[] = [], unresolved: UnresolvedReferenceView[] = [], capabilities: CapabilityFactView[] = [];
  const id = (i: number) => `${moduleSha256}:0x${i.toString(16).toUpperCase()}`;
  const addEdge = (from: number, to: number) => edges.push({ id: `e:${edges.length}`, sourceId: id(from), destinationId: id(to), kind: "direct_call", status: "observed", schedulerRelevance: "may_block" });
  for (let i = 1; i <= count; i++) {
    const rva = `0x${i.toString(16).toUpperCase()}`;
    const group = Math.floor((i - 1) / 8);
    const word = `term${group}`;
    nodes.push({
      id: `${moduleSha256}:${rva}`,
      moduleSha256,
      rva,
      name: `Fn${i}`,
      observedDescription: `${word} battle state`,
      semanticMaturity: "reconciled",
      functionClass: "internal",
    });
    if ((i - 1) % 8 === 0) objects.push({ id: `obj:${group}`, kind: "table", name: `table${group}` });
    unresolved.push({ fromFunctionId: id(i), kind: "data_xref", referencedObjectId: `obj:${group}` });
    if (i % 8 !== 1) addEdge(i - 1, i);
    if (i % 8 === 0) addEdge(i, i - 7);
    if (i % 64 === 0 && i < count) addEdge(i, i + 1);
    if (i % 97 === 0) addEdge(i, i);
    if (i % 8 === 1) capabilities.push({ id: `cap:${group}`, subjectKind: "function", subjectId: id(i), capability: "fixture:update", confidence: "observed", hypotheticalRole: null });
  }
  const snapshot: GraphSnapshotView = {
    schemaVersion: 1,
    snapshotId: "snap:benchmark",
    normalizedFingerprint: "0".repeat(64),
    nodes,
    edges,
    objects,
    unresolved,
    capabilities,
  };
  const constructed = performance.now();
  const degree = new Map(nodes.map(node => [node.id, 0]));
  const callNeighbors = new Map(nodes.map(node => [node.id, [] as string[]]));
  for (const edge of edges) {
    degree.set(edge.sourceId, degree.get(edge.sourceId)! + 1); degree.set(edge.destinationId, degree.get(edge.destinationId)! + 1);
    callNeighbors.get(edge.sourceId)!.push(edge.destinationId); callNeighbors.get(edge.destinationId)!.push(edge.sourceId);
  }
  const scc = stronglyConnectedComponents(nodes.map(node => node.id), edges.map(edge => ({ from: edge.sourceId, to: edge.destinationId })));
  const condensed = performance.now();
  const config = defaultMultiviewConfig();
  config.views.embeddings = false;
  const result = clusterMultiview({ snapshot, config, encoder: null });
  const initial = performance.now();
  const next = clusterMultiview({ snapshot, config, encoder: null, previous: result.partition, previousLineageSidecar: result.lineageSidecar!,
    previousProposalWitness: { evidence: result.proposalEvidence!, localReceipt: result.proposalReceipt } });
  const proposed = performance.now();
  const details = (partition: ClusterPartitionView) => ({ partitionId: partition.partitionId, coverage: nodes.map(node => ({ functionId: node.id, coverage: "fixture-covered" })), costs: nodes.map(node => ({ functionId: node.id, estimatedCost: { known: true, value: 1 } })) });
  const comparison = comparePartitions(result.partition!, next.partition!, config.hysteresis, { previous: details(result.partition!), next: details(next.partition!) });
  const body: Omit<KnowledgeDeltaView, "deltaId"> = { schemaVersion: 1, fromRevision: 0, toRevision: 1, affectedFunctionIds: [id(1)], factIds: ["fixture:benchmark"], evidence: [], origin: "fixture:benchmark", validation: "fixture-only", invalidations: [], potentialImpact: "local" };
  const delta = { ...body, deltaId: knowledgeDeltaId(body) };
  const admission = { currentRevision: 0, mode: "fixture" as const };
  const assessed = assessKnowledgeDelta(delta, admission);
  const region = affectedRegion(delta, { functionIds: nodes.map(node => node.id), callNeighbors, dataNeighbors: new Map() }, admission);
  const unit = { unitId: "fixture:benchmark-unit", state: "READY" as const, snapshotId: snapshot.snapshotId, ownedFunctionIds: [id(1)], attemptIds: [], claimIds: [] };
  const adoption = planAdoption({ partition: next.partition!, units: [unit], explicit: true, lineageSidecar: next.lineageSidecar!, proposalDiagnostics: next.diagnostics,
    proposalWitness: { evidence: next.proposalEvidence!, localReceipt: next.proposalReceipt },
    quiescence: [{ unitId: unit.unitId, snapshotId: unit.snapshotId, attemptIds: [], claimIds: [], authorityRef: "fixture:offline-only", revision: 0, quiescent: true, released: true, workerStillExecutable: false, leaseHeld: false }], verifyQuiescence: () => true });
  const finished = performance.now();
  const quadraticPairs = count * (count - 1);
  return {
    nodeCount: count,
    edgeCount: edges.length,
    relationCount: result.relations.length,
    densityIncludingSelfLoops: edges.length / (count * count),
    maximumTotalDegree: [...degree.values()].reduce((max, value) => Math.max(max, value), 0),
    degreeDefinition: "in+out; self-loop counts twice" as const,
    sccCount: scc.sccs.length,
    maximumSccSize: scc.sccs.reduce((max, item) => Math.max(max, item.functionIds.length), 0),
    pipeline: ["construct", "scc", "lexical+multiview+lineage+metrics+architecture", "reproposal", "compare+delta+region+adoption"] as const,
    stagesMs: { construction: constructed - started, scc: condensed - constructed, initial: initial - condensed, reproposal: proposed - initial, deltaComparisonAdoption: finished - proposed },
    elapsedMs: finished - started,
    counters: result.metrics.counters,
    repeatCounters: next.metrics.counters,
    comparisonCounters: comparison.counters,
    pass: result.pass && next.pass && comparison.scientificStable && assessed.pass && region.pass && adoption.adopted && adoption.migratableUnitIds.length === 1 && validateArchitectureExport(JSON.parse(JSON.stringify(next.architecture))),
    comparisons: result.metrics.comparisons,
    quadraticPairs,
    bounded: result.metrics.comparisons <= count * config.maxCandidates && next.metrics.comparisons <= count * config.maxCandidates && result.metrics.counters.adjacencyVisits === 2 * result.metrics.counters.softEdges && result.metrics.counters.metricEdgeVisits === result.metrics.counters.softEdges && next.metrics.counters.lineage.overlapMemberVisits <= 2 * count && comparison.counters.overlapMemberVisits <= 2 * count,
  };
}

function scoreEmbeddings(
  docs: IndexedDoc[],
  queries: Map<string, LexicalHit[]>,
  config: MultiviewConfig,
  encoder: FrozenEncoder | null,
  cache: EmbeddingCache,
  diagnostics: Diagnostic[],
  verifyFreeze?: (identity: Omit<FrozenEncoder, "encode">) => boolean,
): { report: EmbeddingReport; cosine: Map<string, number> } {
  const cosine = new Map<string, number>();
  if (!config.views.embeddings) return { report: embeddingReport(config, encoder, 0, 0, 0, null, "disabled", "embeddings-disabled"), cosine };
  if (!encoder) {
    diagnostics.push({ code: "encoder-absent", severity: "info", detail: "local encoder is absent; lexical ranking is the fallback", functionIds: [] });
    return { report: embeddingReport(config, null, 0, 0, 0, null, "absent", "encoder-not-configured"), cosine };
  }
  if (!/^[a-f0-9]{64}$/.test(encoder.parameterFingerprint) || !Number.isSafeInteger(encoder.dimension) || encoder.dimension < 1 || encoder.dimension > 65536
    || typeof encoder.modelId !== "string" || encoder.modelId.length === 0 || typeof encoder.tokenizerRevision !== "string" || encoder.tokenizerRevision.length === 0 || typeof encoder.encode !== "function") {
    diagnostics.push({ code: "encoder-rejected", severity: "warning", detail: "encoder identity is not a frozen local parameter fingerprint", functionIds: [] });
    return { report: embeddingReport(config, encoder, 0, 0, 0, null, "rejected", "encoder-identity-invalid"), cosine };
  }
  const identity = encoderIdentity(encoder);
  const identityDigest = hash(canonical(identity));
  const encode = encoder.encode;
  let freezeVerified = false;
  try { freezeVerified = /^[a-f0-9]{64}$/.test(identity.implementationSha256 ?? "") && /^[a-f0-9]{64}$/.test(identity.tokenizerSha256 ?? "") && verifyFreeze?.(structuredClone(identity)) === true; } catch { /* fail closed */ }
  if (!freezeVerified || hash(canonical(encoderIdentity(encoder))) !== identityDigest || encoder.encode !== encode) {
    diagnostics.push({ code: "encoder-freeze-unverified", severity: "warning", detail: "declared metadata/trusted-local is not verification of frozen implementation and tokenizer; lexical fallback is retained", functionIds: [] });
    return { report: embeddingReport(config, encoder, 0, 0, 0, null, "rejected", "encoder-freeze-unverified"), cosine };
  }
  let hits = 0;
  let misses = 0;
  let comparisons = 0;
  let disagreements = 0;
  let ranked = 0;
  const vectors = new Map<string, readonly number[]>();
  const docsById = new Map(docs.map(doc => [doc.id, doc]));
  for (const doc of docs) {
    const encoded = cachedEncode(encoder, cache, doc.tokens, () => { misses += 1; }, () => { hits += 1; });
    if (!encoded.vector || hash(canonical(encoderIdentity(encoder))) !== identityDigest || encoder.encode !== encode) {
      const reason = encoded.vector ? "encoder-identity-drift" : encoded.reason;
      diagnostics.push({ code: "encoder-vector-rejected", severity: "warning", detail: reason, functionIds: [doc.id] });
      return { report: embeddingReport(config, encoder, hits, misses, comparisons, null, "rejected", reason, null, "externally-verified"), cosine: new Map() };
    }
    vectors.set(doc.id, encoded.vector);
  }
  for (const doc of docs) {
    const pool = (queries.get(doc.id) ?? []).filter(hit => docsById.get(hit.functionId)?.moduleSha256 === doc.moduleSha256);
    if (pool.length === 0) continue;
    ranked += 1;
    const left = vectors.get(doc.id)!;
    let bestId = pool[0]!.functionId;
    let best = -2;
    for (const hit of pool) {
      const right = vectors.get(hit.functionId);
      if (!right) continue;
      const score = cosineSimilarity(left, right);
      if (!Number.isFinite(score)) {
        diagnostics.push({ code: "encoder-cosine-rejected", severity: "warning", detail: "cosine was not finite", functionIds: [doc.id, hit.functionId] });
        return { report: embeddingReport(config, encoder, hits, misses, comparisons, null, "rejected", "encoder-cosine-invalid", null, "externally-verified"), cosine: new Map() };
      }
      comparisons += 1;
      cosine.set(pairKey(doc.id, hit.functionId), score);
      if (score > best || (score === best && compareFunctionIds(hit.functionId, bestId) < 0)) {
        best = score;
        bestId = hit.functionId;
      }
    }
    if (bestId !== pool[0]!.functionId) disagreements += 1;
  }
  const disagreement = ranked === 0 ? null : disagreements / ranked;
  return { report: embeddingReport(config, encoder, hits, misses, comparisons, null, "ready", "verified-local-encoder-lexical-candidate-pool", disagreement, "externally-verified"), cosine };
}

function cachedEncode(
  encoder: FrozenEncoder,
  cache: EmbeddingCache,
  tokens: readonly string[],
  onMiss: () => void,
  onHit: () => void,
): { vector: number[] | null; reason: string } {
  try {
    const key = hash(canonical({ ...encoderIdentity(encoder), tokens: [...tokens] }));
    const cached = cache.get(key);
    if (cached !== undefined) {
      onHit();
      return { vector: defensiveVector(cached, encoder.dimension), reason: "encoder-cache-vector-invalid" };
    }
    onMiss();
    const vector = defensiveVector(encoder.encode(Object.freeze([...tokens])), encoder.dimension);
    if (!vector) return { vector: null, reason: "encoder-vector-invalid" };
    // Never expose the vector retained by this run to an arbitrary cache implementation.
    cache.set(key, [...vector]);
    return { vector, reason: "ok" };
  } catch { return { vector: null, reason: "encoder-or-cache-exception" }; }
}

function encoderIdentity(encoder: FrozenEncoder): Omit<FrozenEncoder, "encode"> {
  return { modelId: encoder.modelId, tokenizerRevision: encoder.tokenizerRevision, parameterFingerprint: encoder.parameterFingerprint, dimension: encoder.dimension, implementationSha256: encoder.implementationSha256, tokenizerSha256: encoder.tokenizerSha256 };
}

function defensiveVector(value: unknown, dimension: number): number[] | null {
  if (!Array.isArray(value) || value.length !== dimension) return null;
  const vector = [...value]; // Materialize holes: Array.every on a sparse array would skip them.
  if (!vector.every(item => typeof item === "number" && Number.isFinite(item)) || !vector.some(item => item !== 0)) return null;
  return vector;
}

function buildArchitecture(snapshot: GraphSnapshotView, partition: ClusterPartitionView, config: MultiviewConfig): ArchitectureExport {
  const moduleOf = new Map(snapshot.nodes.map(node => [node.id, node.moduleSha256]));
  const semanticId = (contentId: string) => `ss:${hash(canonical({ role: "experimental-semantic-subsystem", communityContentIds: [contentId] }))}`;
  const functions = partition.communities.flatMap(community => community.memberIds.map(functionId => {
    const moduleSha256 = moduleOf.get(functionId) ?? "";
    return { functionId, moduleSha256, communityContentId: community.contentId, subsystemId: `sub:${moduleSha256}`, semanticSubsystemId: semanticId(community.contentId) };
  })).sort((a, b) => compareFunctionIds(a.functionId, b.functionId));
  const communities = partition.communities.map(community => ({
    contentId: community.contentId,
    lineageId: community.lineageId,
    memberIds: [...community.memberIds],
    moduleSha256s: [...new Set(community.memberIds.map(id => moduleOf.get(id) ?? ""))].sort(),
  }));
  const subsystemIds = new Map<string, Set<string>>();
  for (const community of communities) {
    for (const moduleSha256 of community.moduleSha256s) {
      const list = subsystemIds.get(moduleSha256) ?? new Set<string>();
      list.add(community.contentId);
      subsystemIds.set(moduleSha256, list);
    }
  }
  const subsystems = [...subsystemIds.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([moduleSha256, communityContentIds]) => ({
    subsystemId: `sub:${moduleSha256}`,
    moduleSha256,
    communityContentIds: [...communityContentIds].sort(),
    kind: "module" as const,
  }));
  const semanticSubsystems = communities.map(community => ({ subsystemId: semanticId(community.contentId), communityContentIds: [community.contentId], moduleSha256s: [...community.moduleSha256s], kind: "community" as const }));
  const semanticIdsByModule = new Map<string, string[]>();
  for (const subsystem of semanticSubsystems) for (const moduleSha256 of subsystem.moduleSha256s) {
    const ids = semanticIdsByModule.get(moduleSha256) ?? []; ids.push(subsystem.subsystemId); semanticIdsByModule.set(moduleSha256, ids);
  }
  const counts = new Map<string, number>();
  for (const node of snapshot.nodes) counts.set(node.moduleSha256, (counts.get(node.moduleSha256) ?? 0) + 1);
  const modules = [...counts.entries()].sort(([a], [b]) => a < b ? -1 : 1).map(([moduleSha256, functionCount]) => ({
    moduleSha256,
    subsystemIds: subsystemIds.has(moduleSha256) ? [`sub:${moduleSha256}`] : [],
    semanticSubsystemIds: [...(semanticIdsByModule.get(moduleSha256) ?? [])].sort(),
    functionCount,
  }));
  const transversal = new Map<string, string[]>();
  if (config.views.capabilities) {
    for (const fact of snapshot.capabilities) {
      if (fact.subjectKind !== "function" || fact.confidence !== "observed" || PSEUDO_CAPABILITIES.has(fact.capability) || !moduleOf.has(fact.subjectId)) continue;
      const list = transversal.get(fact.capability) ?? [];
      list.push(fact.subjectId);
      transversal.set(fact.capability, list);
    }
  }
  return {
    formatVersion: "l4-architecture-1",
    experimental: true,
    oracle: false,
    engine: `${ALGORITHM}-${ALGORITHM_VERSION}`,
    functions,
    communities,
    subsystems,
    semanticSubsystems,
    architecture: {
      modules,
      transversalCapacities: [...transversal.entries()].sort(([a], [b]) => a < b ? -1 : 1).map(([capability, functionIds]) => {
        const ids = sortFunctionIds([...new Set(functionIds)]);
        const moduleSha256s = [...new Set(ids.map(id => moduleOf.get(id) ?? ""))].sort();
        return { capability, functionIds: ids, moduleSha256s, spansModules: moduleSha256s.length > 1 };
      }),
    },
  };
}

function applyConstraints(
  constraints: readonly LinkConstraint[],
  nodes: Map<string, FunctionNodeView>,
  diagnostics: Diagnostic[],
): { status: "satisfied" | "unsatisfiable" | "none"; applied: number; rejected: number; must: LinkConstraint[]; cannot: LinkConstraint[] } {
  if (constraints.length === 0) return { status: "none", applied: 0, rejected: 0, must: [], cannot: [] };
  const accepted: LinkConstraint[] = [];
  let rejected = 0;
  for (const constraint of constraints) {
    if (!constraint || !["must-link", "cannot-link"].includes(constraint.kind) || !nodes.has(constraint.leftId) || !nodes.has(constraint.rightId) || constraint.leftId === constraint.rightId) {
      rejected += 1;
      diagnostics.push({ code: "constraint-endpoint", severity: "fail", detail: "constraint endpoint is not a typed pair of functions", functionIds: constraint ? [constraint.leftId, constraint.rightId] : [] });
      continue;
    }
    if (constraint.validation !== "validated" || !provenanceReady(constraint.provenance)
      || (constraint.provenance.moduleSha256 !== nodes.get(constraint.leftId)!.moduleSha256 && constraint.provenance.moduleSha256 !== nodes.get(constraint.rightId)!.moduleSha256)) {
      rejected += 1;
      diagnostics.push({ code: "constraint-not-validated", severity: "warning", detail: "must-link and cannot-link require validation and provenance", functionIds: [constraint.leftId, constraint.rightId] });
      continue;
    }
    accepted.push(constraint);
  }
  const must = accepted.filter(item => item.kind === "must-link");
  const cannot = accepted.filter(item => item.kind === "cannot-link");
  if (diagnostics.some(item => item.code === "constraint-endpoint")) return { status: "unsatisfiable", applied: accepted.length, rejected, must, cannot };
  return { status: accepted.length ? "satisfied" : "none", applied: accepted.length, rejected, must, cannot };
}

function indexDocuments(snapshot: GraphSnapshotView, config: MultiviewConfig): IndexedDoc[] {
  return [...snapshot.nodes].sort((a, b) => compareFunctionIds(a.id, b.id)).map(node => {
    const tokens = normalizeTokens(`${node.name} ${node.observedDescription}`, config.synonyms);
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    return { id: node.id, moduleSha256: node.moduleSha256, tokens, tf, length: tokens.length, maturity: MATURITY_WEIGHT[node.semanticMaturity] ?? 0 };
  });
}

function candidateIndexes(
  tokens: readonly string[],
  postings: Map<string, Array<{ doc: number; tf: number }>>,
  docs: IndexedDoc[],
  excludeId: string | undefined,
  config: MultiviewConfig,
): number[] {
  const maxDf = docs.length <= config.maxPostingDf ? docs.length : config.maxPostingDf;
  const lists = [...new Set(tokens)]
    .map(term => postings.get(term) ?? [])
    .filter(list => list.length > 0 && list.length <= maxDf)
    .sort((a, b) => a.length - b.length || a[0]!.doc - b[0]!.doc);
  const chosen: number[] = [];
  const seen = new Set<number>();
  for (const list of lists) {
    for (const posting of list) {
      const doc = docs[posting.doc];
      if (!doc || doc.id === excludeId || seen.has(posting.doc)) continue;
      seen.add(posting.doc);
      chosen.push(posting.doc);
      if (chosen.length >= config.maxCandidates) return chosen;
    }
  }
  return chosen;
}

function bm25(tokens: readonly string[], doc: IndexedDoc, idf: Map<string, number>, averageLength: number, config: MultiviewConfig): number {
  let score = 0;
  const unique = [...new Set(tokens)];
  for (const term of unique) {
    const tf = doc.tf.get(term) ?? 0;
    if (tf === 0) continue;
    const weight = idf.get(term) ?? 0;
    const norm = tf + config.bm25.k1 * (1 - config.bm25.b + config.bm25.b * (averageLength === 0 ? 0 : doc.length / averageLength));
    score += weight * (tf * (config.bm25.k1 + 1)) / norm;
  }
  return score;
}

function tfidfCosine(tokens: readonly string[], doc: IndexedDoc, idf: Map<string, number>): number {
  let dot = 0;
  let left = 0;
  let right = 0;
  const query = new Map<string, number>();
  for (const token of tokens) query.set(token, (query.get(token) ?? 0) + 1);
  const terms = new Set([...query.keys(), ...doc.tf.keys()]);
  for (const term of terms) {
    const weight = idf.get(term) ?? 0;
    const q = (query.get(term) ?? 0) * weight;
    const d = (doc.tf.get(term) ?? 0) * weight;
    dot += q * d;
    left += q * q;
    right += d * d;
  }
  if (left === 0 || right === 0) return 0;
  return dot / Math.sqrt(left * right);
}

function pushEdge(edges: Map<string, SoftEdge>, left: string, right: string, weight: number, view: SoftEdge["view"]): void {
  if (!Number.isFinite(weight) || weight <= 0 || left === right) return;
  const [a, b] = compareFunctionIds(left, right) <= 0 ? [left, right] : [right, left];
  const key = `${view}:${pairKey(a, b)}`;
  const existing = edges.get(key);
  if (existing) existing.weight = Math.max(existing.weight, weight);
  else edges.set(key, { a, b, weight, view });
}

function bumpDegree(degree: Map<string, number>, left: string, right: string): void {
  degree.set(left, (degree.get(left) ?? 0) + 1);
  degree.set(right, (degree.get(right) ?? 0) + 1);
}

function pairKey(left: string, right: string): string {
  return compareFunctionIds(left, right) <= 0 ? `${left}|${right}` : `${right}|${left}`;
}

function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  let leftScale = 0, rightScale = 0;
  for (const value of left) leftScale = Math.max(leftScale, Math.abs(value));
  for (const value of right) rightScale = Math.max(rightScale, Math.abs(value));
  if (left.length !== right.length || leftScale === 0 || rightScale === 0) return NaN;
  let dot = 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < left.length; i++) {
    const x = left[i]! / leftScale, y = right[i]! / rightScale;
    dot += x * y;
    a += x * x;
    b += y * y;
  }
  return Math.max(-1, Math.min(1, dot / Math.sqrt(a * b)));
}

function roundScore(score: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(score * scale) / scale;
}

function partitionMaturity(nodes: FunctionNodeView[], similarityEdges: number, config: MultiviewConfig): ClusterPartitionView["maturity"] {
  if (similarityEdges > 0 && (config.views.lexical || config.views.embeddings)) return "multiview";
  if (nodes.some(node => node.semanticMaturity === "partial" || node.semanticMaturity === "reconciled" || node.semanticMaturity === "published-local")) return "partial";
  return "structural";
}

function partitionMetrics(communities: readonly { contentId: string; memberIds: string[] }[], edges: readonly SoftEdge[]): Pick<MultiviewResult["metrics"], "modularity" | "communities" | "totalWeight" | "communityWeights"> {
  const owner = new Map<string, string>();
  const stats = new Map(communities.map(item => [item.contentId, { contentId: item.contentId, internalWeight: 0, volume: 0, cut: 0, conductanceDenominator: 0 }]));
  for (const community of communities) for (const id of community.memberIds) owner.set(id, community.contentId);
  let totalWeight = 0;
  for (const edge of edges) {
    const left = stats.get(owner.get(edge.a)!)!, right = stats.get(owner.get(edge.b)!)!;
    totalWeight += edge.weight;
    left.volume += edge.weight; right.volume += edge.weight;
    if (left === right) left.internalWeight += edge.weight;
    else { left.cut += edge.weight; right.cut += edge.weight; }
  }
  let modularity: number | null = totalWeight === 0 ? null : 0;
  for (const item of stats.values()) {
    if (totalWeight > 0) modularity! += item.internalWeight / totalWeight - (item.volume / (2 * totalWeight)) ** 2;
    item.conductanceDenominator = Math.max(0, Math.min(item.volume, 2 * totalWeight - item.volume));
  }
  return { modularity, totalWeight, communityWeights: [...stats.values()], communities: [...stats.values()].map(item => ({ contentId: item.contentId, conductance: item.conductanceDenominator > 0 ? item.cut / item.conductanceDenominator : null })) };
}


function embeddingReport(
  config: MultiviewConfig,
  encoder: FrozenEncoder | null,
  cacheHits: number,
  cacheMisses: number,
  comparisons: number,
  measuredGain: number | null,
  status: EmbeddingReport["status"] = "absent",
  reason = "encoder-not-configured",
  rankingDisagreement: number | null = null,
  freezeVerification: EmbeddingReport["freezeVerification"] = encoder ? "declared-only" : "not-configured",
): EmbeddingReport {
  const ready = status === "ready" && encoder !== null;
  return {
    status,
    reason,
    modelId: ready && encoder ? encoder.modelId : null,
    tokenizerRevision: ready && encoder ? encoder.tokenizerRevision : null,
    parameterFingerprint: ready && encoder ? encoder.parameterFingerprint : null,
    cacheHits,
    cacheMisses,
    measuredGain: null, // No independent relevance oracle was supplied. Disagreement is not gain.
    rankingDisagreement: status === "ready" ? rankingDisagreement : null,
    qualityOracle: "absent",
    freezeVerification,
    comparedToLexical: status === "ready" && rankingDisagreement !== null,
    comparisons,
  };
}

function emptyResult(config: MultiviewConfig, fingerprint: string, diagnostics: Diagnostic[], embeddings: EmbeddingReport): MultiviewResult {
  return {
    pass: false,
    partition: null,
    architecture: {
      formatVersion: "l4-architecture-1",
      experimental: true,
      oracle: false,
      engine: `${ALGORITHM}-${ALGORITHM_VERSION}`,
      functions: [],
      communities: [],
      subsystems: [],
      semanticSubsystems: [],
      architecture: { modules: [], transversalCapacities: [] },
    },
    diagnostics,
    constraints: { status: "none", applied: 0, rejected: 0 },
    embeddings,
    views: { ...config.views },
    configFingerprint: fingerprint,
    lineageSidecar: null,
    proposalEvidence: null,
    proposalReceipt: null,
    relations: [],
    dependencyEdges: [],
    selfLoopIds: [],
    metrics: {
      modularity: null,
      comparisons: 0,
      quadraticPairs: 0,
      nodeCount: 0,
      similarityEdges: 0,
      structureEdges: 0,
      dataEdges: 0,
      validatedEdges: 0,
      communities: [],
      metricGraph: "derived-undirected-weighted-no-self-loops",
      totalWeight: 0,
      communityWeights: [],
      counters: { transportEdges: 0, canonicalRelations: 0, transportSiteProofs: 0, canonicalSiteProofs: 0, softEdges: 0, adjacencyVisits: 0, constraintChecks: 0, metricEdgeVisits: 0, lexicalQueries: 0, encoderComparisons: 0, lineage: { draftMembers: 0, indexedMemberVisits: 0, overlapMemberVisits: 0, overlapPairs: 0 }, architectureFunctions: 0 },
    },
  };
}

function canonicalToken(token: string): string {
  for (const group of SYNONYM_GROUPS) if (group.includes(token)) return group[0]!;
  return token;
}


function canonicalRelations(edges: readonly FunctionEdgeView[], diagnostics: Diagnostic[]): CanonicalRelation[] {
  const groups = new Map<string, { relation: CanonicalRelation; policy: string; transport: Set<string>; sites: Map<string, CanonicalRelation["sites"][number]> }>();
  for (const edge of edges) {
    const relationKey = `rel:${hash(canonical({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind }))}`;
    const policy = canonical({ status: edge.status, schedulerRelevance: edge.schedulerRelevance, confidence: edge.confidence, appearedInRevision: edge.appearedInRevision, retiredInRevision: edge.retiredInRevision });
    let group = groups.get(relationKey);
    if (!group) {
      group = { relation: { relationKey, sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind, status: edge.status, schedulerRelevance: edge.schedulerRelevance, transportIds: [], sites: [], evidenceAvailability: "unavailable", policyConflict: false }, policy, transport: new Set(), sites: new Map() };
      groups.set(relationKey, group);
    } else if (group.policy !== policy) {
      group.relation.policyConflict = true;
      // A deterministic display only. Conflicting policy NEVER contributes an admitted edge.
      if (policy < group.policy) { group.policy = policy; group.relation.status = edge.status; group.relation.schedulerRelevance = edge.schedulerRelevance; }
    }
    group.transport.add(edge.id);
    for (const site of edge.sites ?? []) {
      if (!site || !provenanceReady(site.provenance) || site.provenance.moduleSha256 !== edge.sourceId.split(":")[0]
        || site.provenance.siteRva !== site.siteRva || site.provenance.xrefType !== site.xrefType || (CODE_KINDS.has(edge.kind) && site.xrefType !== "code") || (edge.kind === "callback_candidate" && site.xrefType !== "data")) {
        diagnostics.push({ code: "relation-site-provenance", severity: "fail", detail: "site evidence must bind to the relation caller/module/site/xref", functionIds: [edge.sourceId, edge.destinationId] });
        continue;
      }
      group.sites.set(canonical(site), structuredClone(site));
    }
  }
  for (const group of groups.values()) {
    group.relation.transportIds = [...group.transport].sort();
    group.relation.sites = [...group.sites.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, site]) => site);
    group.relation.evidenceAvailability = group.relation.sites.length > 0 ? "available" : "unavailable";
    if (group.relation.policyConflict) diagnostics.push({ code: "relation-policy-conflict", severity: "fail", detail: `transport shards disagree on semantic policy for ${group.relation.relationKey}`, functionIds: [group.relation.sourceId, group.relation.destinationId] });
  }
  return [...groups.values()].map(group => group.relation).sort((a, b) => compareFunctionIds(a.sourceId, b.sourceId) || compareFunctionIds(a.destinationId, b.destinationId) || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
}

/** Round-trip reference validation; this is an experimental hierarchy, not an architecture oracle. */
export function validateArchitectureExport(value: unknown): boolean {
  try { return architectureReferencesValid(value as ArchitectureExport); } catch { return false; }
}

function architectureReferencesValid(value: ArchitectureExport): boolean {
  if (!value || value.formatVersion !== "l4-architecture-1" || value.experimental !== true || value.oracle !== false) return false;
  const functions = new Map(value.functions.map(item => [item.functionId, item]));
  const communities = new Map(value.communities.map(item => [item.contentId, item]));
  const modules = new Map(value.architecture.modules.map(item => [item.moduleSha256, item]));
  const containers = new Map(value.subsystems.map(item => [item.subsystemId, item]));
  const semantic = new Map(value.semanticSubsystems.map(item => [item.subsystemId, item]));
  const containerCommunities = new Map(value.subsystems.map(item => [item.subsystemId, new Set(item.communityContentIds)]));
  const semanticCommunities = new Map(value.semanticSubsystems.map(item => [item.subsystemId, new Set(item.communityContentIds)]));
  const semanticModules = new Map(value.semanticSubsystems.map(item => [item.subsystemId, new Set(item.moduleSha256s)]));
  const communityModules = new Map(value.communities.map(item => [item.contentId, new Set(item.moduleSha256s)]));
  if (functions.size !== value.functions.length || communities.size !== value.communities.length || modules.size !== value.architecture.modules.length || containers.size !== value.subsystems.length || semantic.size !== value.semanticSubsystems.length) return false;
  const members = new Set<string>(), counts = new Map<string, number>();
  for (const community of communities.values()) {
    if (!/^[a-f0-9]{64}$/.test(community.contentId)) return false;
    const actualModules = new Set<string>();
    for (const id of community.memberIds) {
      const fn = functions.get(id);
      if (members.has(id) || !fn || fn.communityContentId !== community.contentId) return false;
      members.add(id); actualModules.add(fn.moduleSha256);
    }
    if (community.moduleSha256s.length !== actualModules.size || community.moduleSha256s.some(id => !actualModules.has(id) || !modules.has(id))) return false;
  }
  if (members.size !== functions.size) return false;
  for (const fn of functions.values()) {
    const container = containers.get(fn.subsystemId), subsystem = semantic.get(fn.semanticSubsystemId ?? "");
    if (!fn.functionId.startsWith(`${fn.moduleSha256}:`) || !modules.has(fn.moduleSha256) || container?.moduleSha256 !== fn.moduleSha256 || !containerCommunities.get(fn.subsystemId)?.has(fn.communityContentId)
      || !subsystem || !semanticCommunities.get(subsystem.subsystemId)?.has(fn.communityContentId) || !semanticModules.get(subsystem.subsystemId)?.has(fn.moduleSha256)) return false;
    counts.set(fn.moduleSha256, (counts.get(fn.moduleSha256) ?? 0) + 1);
  }
  for (const container of containers.values()) if (container.kind !== "module" || container.subsystemId !== `sub:${container.moduleSha256}` || !modules.has(container.moduleSha256)
    || container.communityContentIds.some(id => !communityModules.get(id)?.has(container.moduleSha256))) return false;
  for (const subsystem of semantic.values()) if (subsystem.kind !== "community" || !/^ss:[a-f0-9]{64}$/.test(subsystem.subsystemId)
    || subsystem.communityContentIds.some(id => !communities.has(id)) || subsystem.moduleSha256s.some(id => !modules.has(id))) return false;
  for (const module of modules.values()) if (!/^[a-f0-9]{64}$/.test(module.moduleSha256) || module.functionCount !== (counts.get(module.moduleSha256) ?? 0)
    || module.subsystemIds.some(id => containers.get(id)?.moduleSha256 !== module.moduleSha256)
    || (module.semanticSubsystemIds ?? []).some(id => !semanticModules.get(id)?.has(module.moduleSha256))) return false;
  for (const capacity of value.architecture.transversalCapacities) {
    const actual = new Set<string>();
    for (const id of capacity.functionIds) { const fn = functions.get(id); if (!fn) return false; actual.add(fn.moduleSha256); }
    if (capacity.moduleSha256s.length !== actual.size || capacity.moduleSha256s.some(id => !actual.has(id)) || capacity.spansModules !== (actual.size > 1)) return false;
  }
  return true;
}
