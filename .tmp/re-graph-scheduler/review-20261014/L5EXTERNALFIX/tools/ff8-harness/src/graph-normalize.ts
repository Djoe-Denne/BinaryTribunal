// L2 — deterministic normalization of the tracked native registries into
// GraphSnapshot v1 documents (CONTRAT.md §3.7), plus the versioned port of the
// historical r01 greedy grouping baseline. Pure functions: callers load the
// tracked JSON files and hand the parsed documents in. No wall clock, no I/O.
import { canonical, compareText, fingerprint, hash } from "./validation";
import {
  Addr, BinaryArtifactV1, CapabilityFactV1, EDGE_KIND_ORDER, EdgeKind, EdgeSite, FF8_IMAGE_BASE,
  FF8_MODULE_SHA256, FunctionEdgeV1, FunctionNodeV1, GraphSnapshotV1, MAX_EDGE_SITES,
   Provenance, ReferencedObjectV1, Sha256, SnapshotCoverage, UnknownableInteger, QUARANTINE_EAS,
  UnresolvedReferenceV1, assertSnapshotContract, canonicalAddr, compareEdges, compareFnIds,
  fingerprintWithout, fnId, metricKnown, metricUnknown, validateGraphSnapshot,
} from "./graph";

// ---------------------------------------------------------------- build ----

export interface GraphParts {
  missionId: string;
  snapshotId: string;
  artifacts: BinaryArtifactV1[];
  nodes: FunctionNodeV1[];
  edges: FunctionEdgeV1[];
  objects: ReferencedObjectV1[];
  unresolved: UnresolvedReferenceV1[];
  capabilities: CapabilityFactV1[];
  knowledgeRevision: number;
  scopeDescription: string;
  coverage: SnapshotCoverage;
  toolVersions: GraphSnapshotV1["toolVersions"];
  configFingerprint: Sha256;
}
export interface NormalizeStats {
  inputEdges: number;
  mergedEdges: number;
  truncatedSiteEdges: number;
  droppedDuplicateNodes: number;
  droppedDuplicateObjects: number;
  droppedDuplicateUnresolved: number;
  shardedSiteRelations: number;
}

function requireUnique<T extends { id: string }>(items: T[], kind: string): { unique: T[]; duplicates: number } {
  const byId = new Map<string, T>();
  let duplicates = 0;
  for (const item of items) {
    const previous = byId.get(item.id);
    if (previous === undefined) byId.set(item.id, item);
    else if (canonical(previous) !== canonical(item)) throw new Error(`graph-normalize: conflicting ${kind} id ${item.id}`);
    else duplicates += 1;
  }
  return { unique: [...byId.values()], duplicates };
}

/**
 * Canonically order, merge relations while keeping every site, dedupe, then
 * fingerprint (sha256 of canonical(document without normalizedFingerprint)).
 * Throws when the assembled document violates the frozen v1 contract.
 */
export function buildGraphSnapshot(parts: GraphParts): { snapshot: GraphSnapshotV1; stats: NormalizeStats } {
  const nodeBuild = requireUnique(parts.nodes, "node");
  const objectBuild = requireUnique(parts.objects, "object");
  const unresolvedBuild = requireUnique(parts.unresolved, "unresolved");
  const capabilityBuild = requireUnique(parts.capabilities, "capability");
  const stats: NormalizeStats = { inputEdges: parts.edges.length, mergedEdges: 0, truncatedSiteEdges: 0, shardedSiteRelations: 0, droppedDuplicateNodes: parts.nodes.length - nodeBuild.unique.length, droppedDuplicateObjects: parts.objects.length - objectBuild.unique.length, droppedDuplicateUnresolved: parts.unresolved.length - unresolvedBuild.unique.length };
  const nodes = nodeBuild.unique.sort((a, b) => compareFnIds(a.id, b.id));
  const objects = objectBuild.unique.sort((a, b) => compareText(a.id, b.id));
  const unresolved = unresolvedBuild.unique.sort((a, b) => compareText(a.id, b.id));
  const capabilities = capabilityBuild.unique.sort((a, b) => compareText(a.id, b.id));

  const merged = new Map<string, FunctionEdgeV1>();
  const generatedInputRelations = new Map<string, boolean>();
  const generatedId = (edge: FunctionEdgeV1): boolean => {
    const relation = { destinationId: edge.destinationId, kind: edge.kind, sourceId: edge.sourceId };
    if (!edge.id || edge.id === `edge:${hash(canonical(relation)).slice(0, 40)}`) return true;
    return edge.id === `edge:${hash(canonical({ ...relation, sites: edge.sites })).slice(0, 40)}`;
  };
  for (const edge of parts.edges) {
    if (edge.sites.length === 0) throw new Error(`graph-normalize: edge without sites (${edge.sourceId} -> ${edge.destinationId})`);
    const key = `${edge.sourceId}\u0000${edge.destinationId}\u0000${edge.kind}`;
    const previous = merged.get(key);
    if (previous === undefined) {
      const id = edge.id || `edge:${hash(canonical({ destinationId: edge.destinationId, kind: edge.kind, sourceId: edge.sourceId })).slice(0, 40)}`;
      merged.set(key, { ...edge, id, sites: [...edge.sites] });
      generatedInputRelations.set(key, generatedId(edge));
      continue;
    }
    // IDs of deterministic site shards may differ; all other explicit identity
    // disagreements fail closed rather than picking whichever input arrived first.
    if (edge.id && previous.id !== edge.id && (!generatedId(edge) || !generatedInputRelations.get(key))) throw new Error(`graph-normalize: conflicting relation identities ${key}`);
    if (previous.status !== edge.status || previous.confidence !== edge.confidence || previous.direction !== edge.direction || previous.schedulerRelevance !== edge.schedulerRelevance || previous.appearedInRevision !== edge.appearedInRevision || canonical(previous.retiredInRevision) !== canonical(edge.retiredInRevision)) {
      throw new Error(`graph-normalize: relation ${key} declared twice with different status/confidence`);
    }
    previous.sites.push(...edge.sites);
  }
  const edges: FunctionEdgeV1[] = [];
  stats.mergedEdges = merged.size;
  for (const edge of merged.values()) {
    const unique = new Map<string, EdgeSite>();
    for (const site of edge.sites) unique.set(canonical(site), site);
    const ordered = [...unique.values()].sort((a, b) => {
      const d = BigInt(a.siteRva) - BigInt(b.siteRva);
      return d < 0n ? -1 : d > 0n ? 1 : compareText(canonical(a), canonical(b));
    });
    if (ordered.length > MAX_EDGE_SITES) {
      stats.shardedSiteRelations += 1;
      for (let offset = 0; offset < ordered.length; offset += MAX_EDGE_SITES) {
        const sites = ordered.slice(offset, offset + MAX_EDGE_SITES);
        edges.push({ ...edge, sites, id: `edge:${hash(canonical({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind, sites })).slice(0, 40)}` });
      }
    } else edges.push({ ...edge, sites: ordered, id: edge.id || `edge:${hash(canonical({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind })).slice(0, 40)}` });
  }
  edges.sort(compareEdges);
  const artifacts = [...parts.artifacts].sort((a, b) => compareText(a.contentSha256, b.contentSha256));
  const snapshot: GraphSnapshotV1 = {
    schemaVersion: 1,
    snapshotId: parts.snapshotId,
    missionId: parts.missionId,
    binaryArtifacts: artifacts,
    nodes,
    edges,
    objects,
    unresolved,
    capabilities,
    normalizedFingerprint: "",
    knowledgeRevision: parts.knowledgeRevision,
    scope: { description: parts.scopeDescription, moduleSha256s: artifacts.map(a => a.contentSha256), functionCount: nodes.length },
    coverage: parts.coverage,
    toolVersions: parts.toolVersions,
    configFingerprint: parts.configFingerprint,
  };
  snapshot.normalizedFingerprint = fingerprintWithout(snapshot, "normalizedFingerprint");
  assertSnapshotContract(snapshot);
  return { snapshot, stats };
}
/** Re-embed capability facts and refresh the digest (extraction -> capability evaluation pipeline). */
export function withCapabilities(snapshot: GraphSnapshotV1, facts: CapabilityFactV1[]): GraphSnapshotV1 {
  const next: GraphSnapshotV1 = { ...snapshot, capabilities: [...facts].sort((a, b) => compareText(a.id, b.id)) };
  next.normalizedFingerprint = fingerprintWithout(next, "normalizedFingerprint");
  return assertSnapshotContract(next);
}

// ------------------------------------------------- tracked source shapes ----

export interface LedgerChunk { start_va: string; end_va_exclusive: string }
export interface LedgerNode { va: string; rva: string; name: string | null; end_va_exclusive: string; chunks: LedgerChunk[]; segment: string | null; root_categories: string[]; status: string }
export interface LedgerEdge { kind: string; source_va: string; target_va: string; site_va: string; stopped?: string; register_callee_va?: string; confidence?: string }
export interface LedgerDocument {
  schema_version: string;
  generated_at_utc: string;
  generator: string;
  binary: { path: string; sha256: string };
  counts: Record<string, number>;
  nodes: LedgerNode[];
  edges: LedgerEdge[];
  table_edges: Array<{ kind: string; source: string; target_va: string; slot_index_0based: number; magic_id_1based: number }>;
  stopped_crt_targets: Array<{ va: string; name: string }>;
  limitations: string[];
}
export interface PeVerificationMismatch { chunk: string; size: number; pe_mismatch_byte_count: number; live_idb_changed_since_freeze: boolean; frozen_sha256: string; pe_sha256: string }
export interface PeVerificationDocument {
  at_utc: string;
  disk_pe_sha256: string;
  idb_recorded_input_sha256: string;
  results: Array<{ ea: string; idb_equals_pe_and_freeze: boolean; mismatches: PeVerificationMismatch[] }>;
}
export interface Run01Summary { ea: string; label: string; instructions: number; asm_chars: number; blocks: number; path: string; sha256: string }
export interface FrozenNativeFunction {
  ea: string;
  native: Run01BaselineDocument["native"];
  chunks: Array<{ start: string; end: string; hex: string }>;
  cfg: unknown[];
  instruction_count: number;
}
export interface Run01BaselineDocument {
  native: { idb: string; input: string; bits: number; input_sha256: string; exported_utc: string };
  algorithm: string;
  groups: Array<{ id: string; eas: string[] }>;
  functions: Run01Summary[];
  graph: Record<string, { out: string[]; callers: string[] }>;
}
export interface IndirectTarget { kind: string; va: string | null; name: string | null; index?: string | number | null }
export interface IndirectSite {
  site_va: string; opcode: string; parent_va: string; parent_name?: string; parent_status?: string;
  ledger_class?: string; lot_class?: string; family?: string; targets?: IndirectTarget[];
  encoding?: { bytes?: string; form?: string | null; disp?: string | null; scale?: string | number | null };
  closure: string;
}
export interface IndirectDocument {
  schema_version: string;
  generator: string;
  binary: { path: string; name: string; sha256: string; image_base: string };
  counts: Record<string, number>;
  sites: IndirectSite[];
}
export interface MagicFunctionRecord { start_va: string; end_va_exclusive: string; is_thunk: boolean; is_nullsub: boolean; validity: string }
export interface MagicSlotRecord { table: string; slot_va: string; slot_rva: string; pointer_va: string | null; name: string | null; segment?: { name: string; start_va: string; end_va_exclusive: string; permissions: string } | null; function?: MagicFunctionRecord | null }
export interface MagicDocument {
  schema_version: string; generator: string;
  binary?: { observed: { sha256: string; image_base: string; machine: string }; ida_image_base: string };
  entries: Array<{ logic?: MagicSlotRecord | null; texture_load?: MagicSlotRecord | null }>;
  unique_targets?: Array<{ function: MagicFunctionRecord; cfg: { available: boolean; block_count: number } }>;
  tables?: Record<string, { name: string; va: string; rva: string; entry_count: number; slot_size: number }>;
  identity_groups?: {
    byte_identical_groups: Array<{ byte_fingerprint_sha256: Sha256; semantic_equivalence: string; target_vas: string[] }>;
    relocation_aware_identical_groups: Array<{ relocation_aware_fingerprint_sha256: Sha256; semantic_equivalence: string; target_vas: string[] }>;
  };
}

function sha256OfRecord(record: unknown): Sha256 { return hash(canonical(record)); }
function putUniqueJoin<T>(map: Map<string, T>, key: string, record: T, label: string): void {
  const prior = map.get(key);
  if (prior !== undefined && canonical(prior) !== canonical(record)) throw new Error(`graph-normalize: conflicting ${label} join at ${key}`);
  if (prior === undefined) map.set(key, record);
}
function normalizedMagicFunction(record: MagicFunctionRecord): MagicFunctionRecord {
  return { ...record, start_va: canonicalAddr(BigInt(record.start_va)), end_va_exclusive: canonicalAddr(BigInt(record.end_va_exclusive)) };
}
function ledgerProvenance(moduleSha256: Sha256, ledgerSha256: Sha256, extra: Partial<Provenance> & { siteRva: Addr | null; siteKind: Provenance["siteKind"]; xrefType: Provenance["xrefType"]; evidence: unknown }): Provenance {
  return {
    moduleSha256,
    siteRva: extra.siteRva,
    siteKind: extra.siteKind,
    xrefType: extra.xrefType,
    source: "tools/battle_static_graph_ledger.py",
    sourceVersion: "1.1.0",
    sourceHash: ledgerSha256,
    evidenceSha256: sha256OfRecord(extra.evidence),
  };
}
const registryProvenance = (moduleSha256: Sha256, source: string, sourceVersion: string, sourceHash: Sha256, extra: { siteRva: Addr | null; siteKind: Provenance["siteKind"]; xrefType: Provenance["xrefType"]; evidence: unknown }): Provenance => ({
  moduleSha256,
  siteRva: extra.siteRva,
  siteKind: extra.siteKind,
  xrefType: extra.xrefType,
  source,
  sourceVersion,
  sourceHash,
  evidenceSha256: sha256OfRecord(extra.evidence),
});

// -------------------------------------------------------- FF8 adapters ----

export interface Ff8AdapterSources {
  ledger: LedgerDocument;
  ledgerSha256: Sha256;
  indirect?: IndirectDocument;
  indirectSha256?: Sha256;
  magic?: MagicDocument;
  magicSha256?: Sha256;
  run01?: Run01BaselineDocument;
  peVerification?: PeVerificationDocument;
  /** Raw bytes decoded as UTF8, not reserialized JSON: hash must match run01. */
  frozenFunctions?: Array<{ rawUtf8: string; sha256: Sha256 }>;
  missionId: string;
  knowledgeRevision?: number;
}
export interface Ff8AdapterResult { snapshot: GraphSnapshotV1; stats: NormalizeStats; notes: Record<string, number | string> }

const LEDGER_EDGE_KIND: Record<string, EdgeKind> = { direct_call: "direct_call", tail: "tail_jump", callback_candidate: "callback_candidate" };

/** Relations whose merged site count exceeds the v1 schema cap (64 sites). */
function siteOverflowRelations(edges: LedgerEdge[]): number {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    const key = `${edge.source_va}\u0000${edge.target_va}\u0000${edge.kind}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let overflow = 0;
  for (const count of counts.values()) if (count > MAX_EDGE_SITES) overflow += 1;
  return overflow;
}

/**
 * Adapt the tracked battle-graph-ledger.json (plus optional tracked joins:
 * native-pe-verification.json, run01/native-groups.json summaries,
 * battle-indirect-registry.json, magic-registry.json) into a GraphSnapshot v1.
 * Self-loops: the ledger extractor v1.1.0 records none, so the snapshot is
 * declared selfLoopsPreserved:false and stays inadmissible for SCC/planning
 * until a native re-extraction records them. Coverage is never claimed complete.
 */
export function buildFf8GraphSnapshot(sources: Ff8AdapterSources): Ff8AdapterResult {
  const ledger = sources.ledger;
  const moduleSha256 = ledger.binary.sha256.toLowerCase();
  if (moduleSha256 !== FF8_MODULE_SHA256) throw new Error(`graph-normalize: unexpected FF8 module hash ${moduleSha256}`);
  const imageBase = FF8_IMAGE_BASE;
  const missionId = sources.missionId;
  const notes: Record<string, number | string> = {};
  if (ledger.schema_version !== "1.1.0") throw new Error("graph-normalize: unsupported ledger extraction version/coverage");
  const countGate = (key: string, actual: number): void => {
    if (ledger.counts[key] !== actual) throw new Error(`graph-normalize: ledger count mismatch ${key}`);
  };
  countGate("nodes", ledger.nodes.length);
  countGate("stopped_crt_targets", ledger.stopped_crt_targets.length);
  countGate("table_edges", ledger.table_edges.length);
  for (const [key, kind] of [["direct_call_edges", "direct_call"], ["tail_edges", "tail"], ["callback_candidate_edges", "callback_candidate"]]) countGate(key!, ledger.edges.filter(e => e.kind === kind).length);
  if (sources.indirect && (sources.indirect.binary.sha256.toLowerCase() !== moduleSha256 || BigInt(sources.indirect.binary.image_base) !== BigInt(imageBase) || sources.indirect.counts.sites !== 493)) throw new Error("graph-normalize: indirect registry identity/493-site gate mismatch");
  if (sources.run01 && (sources.run01.native.input_sha256 !== moduleSha256 || sources.run01.native.bits !== 32)) throw new Error("graph-normalize: run01 module/architecture mismatch");
  if (sources.peVerification && (sources.peVerification.disk_pe_sha256 !== moduleSha256 || sources.peVerification.idb_recorded_input_sha256 !== moduleSha256)) throw new Error("graph-normalize: IDB/PE verification belongs to another binary");
  const observedBinary = sources.magic?.binary?.observed;
  if (sources.magic && (!observedBinary || observedBinary.sha256 !== moduleSha256 || BigInt(observedBinary.image_base) !== BigInt(imageBase) || observedBinary.machine !== "0x14C" || BigInt(sources.magic.binary!.ida_image_base) !== BigInt(imageBase))) throw new Error("graph-normalize: magic registry PE/IDB identity mismatch");

  const magicThunkByVa = new Map<string, MagicFunctionRecord>();
  const magicMetricsByVa = new Map<string, { available: boolean; block_count: number }>();
  const magicTargetsByVa = new Map<string, NonNullable<MagicDocument["unique_targets"]>[number]>();
  for (const target of sources.magic?.unique_targets ?? []) {
    const record = normalizedMagicFunction(target.function);
    putUniqueJoin(magicTargetsByVa, record.start_va, { ...target, function: record }, "magic target");
    putUniqueJoin(magicMetricsByVa, record.start_va, target.cfg, "magic CFG");
  }
  const cloneRefsByVa = new Map<string, string[]>();
  const relocationByVa = new Map<string, string>();
  for (const group of sources.magic?.identity_groups?.relocation_aware_identical_groups ?? []) {
    if (!/^[a-f0-9]{64}$/.test(group.relocation_aware_fingerprint_sha256)) throw new Error("graph-normalize: malformed relocation-aware identity citation");
    for (const va of group.target_vas) putUniqueJoin(relocationByVa, canonicalAddr(BigInt(va)), `magic:relocation-aware:${group.relocation_aware_fingerprint_sha256}:semantic-equivalence-unproven`, "magic relocation identity");
  }
  const bytesByVa = new Map<string, string>();
  for (const group of sources.magic?.identity_groups?.byte_identical_groups ?? []) {
    if (!/^[a-f0-9]{64}$/.test(group.byte_fingerprint_sha256)) throw new Error("graph-normalize: malformed byte identity citation");
    for (const va of group.target_vas) {
      const key = canonicalAddr(BigInt(va));
      putUniqueJoin(bytesByVa, key, `magic:byte-identity:${group.byte_fingerprint_sha256}:semantic-equivalence-unproven`, "magic byte identity");
    }
  }
  for (const key of new Set([...relocationByVa.keys(), ...bytesByVa.keys()])) cloneRefsByVa.set(key, [relocationByVa.get(key), bytesByVa.get(key)].filter((ref): ref is string => ref !== undefined));
  const segments = new Map<string, { name: string; start: Addr; end: Addr; permissions: string }>();
  const magicSlotsByRva = new Map<string, MagicSlotRecord>();
  if (sources.magic) {
    for (const entry of sources.magic.entries) {
      for (const slot of [entry.logic, entry.texture_load]) {
        const record = slot?.function;
        if (slot) putUniqueJoin(magicSlotsByRva, canonicalAddr(BigInt(slot.slot_rva)), { ...slot, slot_rva: canonicalAddr(BigInt(slot.slot_rva)), slot_va: canonicalAddr(BigInt(slot.slot_va)), pointer_va: slot.pointer_va === null ? null : canonicalAddr(BigInt(slot.pointer_va)), function: record ? normalizedMagicFunction(record) : record }, "magic slot");
        if (record) putUniqueJoin(magicThunkByVa, canonicalAddr(BigInt(record.start_va)), normalizedMagicFunction(record), "magic function");
        const segment = slot?.segment;
        if (segment) putUniqueJoin(segments, segment.name, { name: segment.name, start: canonicalAddr(BigInt(segment.start_va)), end: canonicalAddr(BigInt(segment.end_va_exclusive)), permissions: segment.permissions }, "magic segment");
      }
    }
  }
  for (const [va, target] of magicTargetsByVa) {
    const slotFunction = magicThunkByVa.get(va);
    if (slotFunction) for (const field of ["start_va", "end_va_exclusive", "is_thunk", "is_nullsub", "validity"] as const) {
      if (target.function[field] !== slotFunction[field]) throw new Error(`graph-normalize: conflicting magic target/function join at ${va}`);
    }
  }

  const sections = [...segments.values()].map(segment => ({
    name: segment.name,
    rva: canonicalAddr(BigInt(segment.start) - BigInt(imageBase)),
    virtualSize: metricKnown(Number(BigInt(segment.end) - BigInt(segment.start))),
    characteristics: segment.permissions,
  })).sort((a, b) => compareText(a.name, b.name));
  const artifact: BinaryArtifactV1 = {
    schemaVersion: 1,
    artifactId: `mod:${moduleSha256}`,
    moduleName: ledger.binary.path.split(/[\\/]/).pop() ?? "FF8_EN.exe",
    contentSha256: moduleSha256,
    versionLabel: "mission-label:ff8-en-pc",
    format: observedBinary ? "PE32" : "unknown",
    architecture: observedBinary ? "x86-32" : "unknown",
    imageBase: canonicalAddr(imageBase),
    idbIdentity: sources.run01?.native.idb ?? "",
    sections,
    provenance: ledgerProvenance(moduleSha256, sources.ledgerSha256, { siteRva: null, siteKind: "extractor", xrefType: "none", evidence: { ledger: "battle-graph-ledger.json", sha256: sources.ledgerSha256 } }),
    analysisVersion: "l2-adapter-v3",
    extractorVersion: ledger.schema_version,
  };

  const peRecordsByEa = new Map<string, PeVerificationDocument["results"][number]>();
  for (const result of sources.peVerification?.results ?? []) {
    if (result.mismatches.some(item => !Number.isSafeInteger(item.pe_mismatch_byte_count) || item.pe_mismatch_byte_count < 0)) throw new Error("graph-normalize: invalid PE mismatch count");
    const mismatchCount = result.mismatches.reduce((sum, item) => sum + item.pe_mismatch_byte_count, 0);
    if (result.idb_equals_pe_and_freeze !== (mismatchCount === 0)) throw new Error("graph-normalize: contradictory byte agreement report");
    const mismatches = new Map<string, PeVerificationMismatch>();
    for (const item of result.mismatches) putUniqueJoin(mismatches, canonicalAddr(BigInt(item.chunk)), { ...item, chunk: canonicalAddr(BigInt(item.chunk)) }, "PE chunk");
    const ea = canonicalAddr(BigInt(result.ea));
    putUniqueJoin(peRecordsByEa, ea, { ...result, ea, mismatches: [...mismatches.values()].sort((a, b) => compareText(a.chunk, b.chunk)) }, "PE function");
  }
  const verificationByEa = new Map<string, { mismatchCount: number; frozen: Sha256 | null; pe: Sha256 | null }>();
  for (const [ea, result] of peRecordsByEa) {
    const mismatchCount = result.mismatches.reduce((sum, item) => sum + item.pe_mismatch_byte_count, 0);
    const citation = result.mismatches.find(item => item.pe_mismatch_byte_count > 0);
    verificationByEa.set(ea, { mismatchCount, frozen: citation?.frozen_sha256 ?? null, pe: citation?.pe_sha256 ?? null });
  }
  const run01ByEa = new Map<string, Run01Summary>();
  for (const summary of sources.run01?.functions ?? []) {
    const ea = canonicalAddr(BigInt(summary.ea));
    putUniqueJoin(run01ByEa, ea, { ...summary, ea }, "run01 function");
  }
  const frozenByEa = new Map<string, { document: FrozenNativeFunction; sha256: Sha256 }>();
  for (const frozen of sources.frozenFunctions ?? []) {
    if (hash(frozen.rawUtf8) !== frozen.sha256) throw new Error("graph-normalize: frozen native source hash mismatch");
    const document = JSON.parse(frozen.rawUtf8.replace(/^\uFEFF/, "")) as FrozenNativeFunction;
    const ea = canonicalAddr(BigInt(document.ea)), summary = run01ByEa.get(ea);
    if (!summary || summary.sha256 !== frozen.sha256 || document.native.input_sha256 !== moduleSha256 || document.native.bits !== 32 || document.instruction_count !== summary.instructions || document.cfg.length !== summary.blocks) throw new Error("graph-normalize: frozen native identity/summary gate mismatch");
    for (const chunk of document.chunks) if (!/^(?:[a-fA-F0-9]{2})+$/.test(chunk.hex) || BigInt(chunk.end) - BigInt(chunk.start) !== BigInt(chunk.hex.length / 2)) throw new Error("graph-normalize: malformed frozen chunk bytes/boundaries");
    putUniqueJoin(frozenByEa, ea, { document, sha256: frozen.sha256 }, "frozen function");
  }
  notes.frozenNativeFunctionsVerified = frozenByEa.size;
  const ledgerByEa = new Map(ledger.nodes.map(n => [canonicalAddr(BigInt(n.va)), n]));
  const spanSet = (spans: Array<{ start: string; end: string }>): string[] => {
    const set = new Set<string>();
    for (const span of spans) {
      const start = canonicalAddr(BigInt(span.start)), end = canonicalAddr(BigInt(span.end));
      if (BigInt(end) <= BigInt(start) || set.has(`${start}:${end}`)) throw new Error("graph-normalize: duplicate/reversed chunk extent");
      set.add(`${start}:${end}`);
    }
    return [...set].sort(compareText);
  };
  for (const [ea, frozen] of frozenByEa) {
    const nativeEntry = frozen.document.chunks.find(c => BigInt(c.start) === BigInt(ea));
    if (!nativeEntry) throw new Error(`graph-normalize: frozen entry chunk absent at ${ea}`);
    const nativeSpans = spanSet(frozen.document.chunks);
    const node = ledgerByEa.get(ea);
    if (node && (BigInt(node.end_va_exclusive) !== BigInt(nativeEntry.end) || canonical(spanSet(node.chunks.map(c => ({ start: c.start_va, end: c.end_va_exclusive })))) !== canonical(nativeSpans))) throw new Error(`graph-normalize: ledger/frozen entry or chunk-set extent mismatch at ${ea}`);
  }
  for (const [ea, result] of peRecordsByEa) {
    const frozen = frozenByEa.get(ea), ledgerNode = ledgerByEa.get(ea);
    for (const mismatch of result.mismatches) {
      if (!Number.isSafeInteger(mismatch.size) || mismatch.size < 1 || mismatch.pe_mismatch_byte_count > mismatch.size || !/^[a-f0-9]{64}$/.test(mismatch.frozen_sha256) || !/^[a-f0-9]{64}$/.test(mismatch.pe_sha256)) throw new Error("graph-normalize: malformed PE chunk extent/hash citation");
      if (mismatch.live_idb_changed_since_freeze) throw new Error("graph-normalize: PE verification reports a changed live IDB; not a concordance proof");
      const start = BigInt(mismatch.chunk), end = start + BigInt(mismatch.size);
      if (ledgerNode && !ledgerNode.chunks.some(c => BigInt(c.start_va) === start && BigInt(c.end_va_exclusive) === end)) throw new Error(`graph-normalize: ledger/PE chunk extent mismatch at ${ea}`);
      if (frozen) {
        const chunk = frozen.document.chunks.find(c => BigInt(c.start) === start && BigInt(c.end) === end);
        if (!chunk || hash(new Uint8Array(Buffer.from(chunk.hex, "hex"))) !== mismatch.frozen_sha256) throw new Error(`graph-normalize: frozen/PE chunk extent or source-hash binding mismatch at ${ea}`);
      }
    }
  }

  const nodes: FunctionNodeV1[] = [];
  const nodeIdByVa = new Map<string, string>();
  const addNode = (node: FunctionNodeV1): void => {
    if (nodeIdByVa.has(node.rva)) throw new Error(`graph-normalize: duplicate FF8 node at ${node.rva}`);
    nodeIdByVa.set(node.rva, node.id);
    nodes.push(node);
  };
  for (const ledgerNode of ledger.nodes) {
    const va = canonicalAddr(BigInt(ledgerNode.va));
    const rva = canonicalAddr(BigInt(ledgerNode.va) - BigInt(imageBase));
    const magic = magicThunkByVa.get(va);
    const magicCfg = magicMetricsByVa.get(va);
    const analysisRefs: string[] = [];
    if (magic) analysisRefs.push("magic-registry@1.1.0");
    analysisRefs.push(...(cloneRefsByVa.get(va) ?? []));
    if (BigInt(ledgerNode.rva) !== BigInt(rva)) throw new Error("graph-normalize: ledger EA/RVA mismatch");
    const boundaries = [...ledgerNode.chunks].sort((a, b) => Number(BigInt(a.start_va) - BigInt(b.start_va))).map((chunk, ordinal) => ({
      ordinal,
      rva: canonicalAddr(BigInt(chunk.start_va) - BigInt(imageBase)),
      endRvaExclusive: canonicalAddr(BigInt(chunk.end_va_exclusive) - BigInt(imageBase)),
      role: BigInt(chunk.start_va) === BigInt(ledgerNode.va) ? ("entry" as const) : ("tail" as const),
    }));
    const spanBytes = ledgerNode.chunks.reduce((sum, chunk) => sum + Number(BigInt(chunk.end_va_exclusive) - BigInt(chunk.start_va)), 0);
    const verification = verificationByEa.get(va);
    if (verification) analysisRefs.push("run01:native-pe-verification");
    const summary = run01ByEa.get(va);
    if (summary && magicCfg?.available && summary.blocks !== magicCfg.block_count) throw new Error(`graph-normalize: run01/magic CFG join mismatch at ${va}`);
    if (summary) analysisRefs.push("run01:native-groups");
    const frozen = frozenByEa.get(va);
    if (frozen) analysisRefs.push(`run01:frozen-native:${frozen.sha256}`);
    const divergent = verification !== undefined && verification.mismatchCount > 0;
    // A positive historical PE report lacking the actual frozen extent binding
    // is still unknown, not a newly admitted concordance. Negative evidence is
    // retained and quarantined even when the original gel is unavailable.
    const byteVerified = verification !== undefined && (divergent || frozen !== undefined);
    addNode({
      schemaVersion: 1,
      id: fnId(moduleSha256, rva),
      moduleSha256,
      rva,
      ea: canonicalAddr(BigInt(ledgerNode.va)),
      imageBase: canonicalAddr(imageBase),
      name: ledgerNode.name ?? "",
      observedDescription: "",
      boundaries,
      sizeBytes: boundaries.length > 0 ? metricKnown(spanBytes) : metricUnknown(),
      instructionCount: summary ? metricKnown(summary.instructions) : metricUnknown(),
      basicBlockCount: summary ? metricKnown(summary.blocks) : magicCfg?.available ? metricKnown(magicCfg.block_count) : metricUnknown(),
      functionClass: magic?.is_thunk ? "thunk" : "internal",
      status: divergent || QUARANTINE_EAS.includes(va) ? "quarantined" : "observed",
      semanticMaturity: boundaries.length > 0 ? "structural" : "none",
      analysisRefs: [...new Set(analysisRefs)].sort(compareText),
      byteAgreement: !byteVerified ? "unknown" : divergent ? "divergent" : "concordant",
      admissibleAsOracle: false,
      byteDivergence: !byteVerified
        ? { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null }
        : divergent
          ? { known: true, peMismatchByteCount: verification.mismatchCount, frozenSha256: verification.frozen, peSha256: verification.pe }
          : { known: true, peMismatchByteCount: 0, frozenSha256: null, peSha256: null },
    });
  }
  // CRT stop-set targets: observed function starts outside the traversal closure.
  for (const stopped of ledger.stopped_crt_targets) {
    const va = canonicalAddr(BigInt(stopped.va));
    const rva = canonicalAddr(BigInt(stopped.va) - BigInt(imageBase));
    if (nodeIdByVa.has(rva)) continue;
    addNode({
      schemaVersion: 1,
      id: fnId(moduleSha256, rva),
      moduleSha256,
      rva,
      ea: va,
      imageBase: canonicalAddr(imageBase),
      name: stopped.name ?? "",
      observedDescription: "",
      boundaries: [],
      sizeBytes: metricUnknown(),
      instructionCount: metricUnknown(),
      basicBlockCount: metricUnknown(),
      functionClass: "internal",
      status: "incomplete",
      semanticMaturity: "none",
      analysisRefs: [],
      byteAgreement: "unknown",
      admissibleAsOracle: false,
      byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null },
    });
  }
    const run01OutsideClosure = [...run01ByEa.values()].filter(summary => !nodeIdByVa.has(canonicalAddr(BigInt(summary.ea) - BigInt(imageBase)))).length;

  const edges: FunctionEdgeV1[] = [];
  const nodeByVaMissing: string[] = [];
  for (const ledgerEdge of ledger.edges) {
    const kind = LEDGER_EDGE_KIND[ledgerEdge.kind];
    if (kind === undefined) throw new Error(`graph-normalize: unknown ledger edge kind ${ledgerEdge.kind}`);
    const sourceId = nodeIdByVa.get(canonicalAddr(BigInt(ledgerEdge.source_va) - BigInt(imageBase)));
    const destinationId = nodeIdByVa.get(canonicalAddr(BigInt(ledgerEdge.target_va) - BigInt(imageBase)));
    if (!sourceId || !destinationId) { nodeByVaMissing.push(ledgerEdge.site_va); continue; }
    const siteRva = canonicalAddr(BigInt(ledgerEdge.site_va) - BigInt(imageBase));
    const callback = kind === "callback_candidate";
    edges.push({
      schemaVersion: 1,
      id: "",
      sourceId,
      destinationId,
      kind,
      direction: "source_to_destination",
      sites: [{
        siteRva,
        xrefType: callback ? "data" : "code",
        provenance: ledgerProvenance(moduleSha256, sources.ledgerSha256, { siteRva, siteKind: "instruction", xrefType: callback ? "data" : "code", evidence: ledgerEdge }),
      }],
      status: callback ? "inferred" : "observed",
      confidence: callback ? "low" : "high",
      appearedInRevision: sources.knowledgeRevision ?? 0,
      retiredInRevision: null,
      schedulerRelevance: callback ? "hypothesis_not_call" : "may_block",
    });
  }
  if (nodeByVaMissing.length > 0) throw new Error(`graph-normalize: ${nodeByVaMissing.length} ledger edges lack endpoints (fail-closed)`);

  let objects: ReferencedObjectV1[] = [];
  let unresolved: UnresolvedReferenceV1[] = [];
  if (sources.indirect) {
    const facts = buildIndirectGraphFacts(sources.indirect, sources.indirectSha256 ?? sha256OfRecord(sources.indirect), new Set(nodeIdByVa.values()));
    objects = facts.objects;
    unresolved = facts.unresolved;
    edges.push(...facts.edges.map(e => ({ ...e, appearedInRevision: sources.knowledgeRevision ?? 0 })));
    for (const extra of facts.extraNodes) {
      if (!nodeIdByVa.has(extra.rva)) { nodeIdByVa.set(extra.rva, extra.id); nodes.push(extra); }
    }
    notes.indirectGhostSites = facts.ghostSiteCount;
    notes.indirectResolvedEdges = facts.edges.length;
    notes.indirectUnresolved = facts.unresolved.length;
  }
  // DATA-owned dispatch tables have no caller function. Preserve them as
  // objects with their frozen slot inventory cited, never synthesize callees.
  for (const [name, table] of Object.entries(sources.magic?.tables ?? {}).sort((a, b) => compareText(a[0], b[0]))) {
    const rva = canonicalAddr(BigInt(table.va) - BigInt(imageBase));
    if (BigInt(table.rva) !== BigInt(rva)) throw new Error("graph-normalize: magic table EA/RVA mismatch");
    const slots = [...magicSlotsByRva.values()].filter(slot => slot.table === name).sort((a, b) => BigInt(a.slot_rva) < BigInt(b.slot_rva) ? -1 : BigInt(a.slot_rva) > BigInt(b.slot_rva) ? 1 : 0);
    if (slots.length !== table.entry_count) throw new Error(`graph-normalize: magic table unique-slot coverage mismatch for ${name}`);
    objects.push({ schemaVersion: 1, id: `obj:${hash(canonical({ moduleSha256, kind: "table", rva, name: `MagicList:${name}` })).slice(0, 24)}`, moduleSha256, kind: "table", rva, name: `MagicList:${name}`, widthBytes: metricKnown(table.entry_count * table.slot_size), provenance: registryProvenance(moduleSha256, "tools/magic_registry.py", sources.magic!.schema_version, sources.magicSha256 ?? sha256OfRecord(sources.magic), { siteRva: rva, siteKind: "table", xrefType: "data", evidence: { table, slots } }) });
  }

  const { snapshot, stats } = buildGraphSnapshot({
    missionId,
    snapshotId: `snap:${missionId}:ff8-ledger-${ledger.schema_version}`,
    artifacts: [artifact],
    nodes,
    edges,
    objects,
    unresolved,
    capabilities: [],
    knowledgeRevision: sources.knowledgeRevision ?? 0,
    scopeDescription: `FF8_EN.exe battle/render root closure from battle-graph-ledger.json v${ledger.schema_version} (${ledger.counts.root_addresses} roots + MagicList tables); ${ledger.stopped_crt_targets.length} CRT stop-set terminals; indirect inventory from battle-indirect-registry.json. Root-closure scope, not the whole binary.`,
    coverage: {
      status: "partial",
      uncoveredReason: `Ledger v${ledger.schema_version} scope is the root closure, not the whole binary; the extractor records no self-loop calls, so recursion singletons are invisible and this snapshot is inadmissible for SCC/planning until native re-extraction; CRT stop-set subtrees are terminal nodes; ${siteOverflowRelations(ledger.edges)} relation(s) use lossless 64-site shards; positive PE citations lacking raw frozen entry/chunk extent binding remain byteAgreement unknown; IDB/PE divergences 0x465720/0x495960/0x48D200/0x48FE20 stay quarantined.`,
      tailsIterated: true,
      selfLoopsPreserved: false,
    },
    toolVersions: {
      extractor: `tools/battle_static_graph_ledger.py@${ledger.schema_version}+battle-indirect-registry@${sources.indirect?.schema_version ?? "absent"}+magic-registry@${sources.magic?.schema_version ?? "absent"}`,
      extractorHash: sources.ledgerSha256,
      normalizer: "tools/ff8-harness/src/graph-normalize.ts@l2-v3",
    },
    configFingerprint: fingerprint({ moduleSha256, imageBase: canonicalAddr(imageBase), joins: { indirect: sources.indirect ? sources.indirectSha256 ?? sha256OfRecord(sources.indirect) : null, magic: sources.magic ? sources.magicSha256 ?? sha256OfRecord(sources.magic) : null, run01: sources.run01 ? sha256OfRecord(sources.run01) : null, peVerification: sources.peVerification ? sha256OfRecord(sources.peVerification) : null, frozenNative: [...frozenByEa.values()].map(f => f.sha256).sort(compareText) }, adapter: "l2-v3" }),
  });
  notes.run01OutsideClosure = run01OutsideClosure;
  notes.peReportFunctions = peRecordsByEa.size;
  notes.concordantNodes = nodes.filter(n => n.byteAgreement === "concordant").length;
  notes.divergentNodes = nodes.filter(n => n.byteAgreement === "divergent").length;
  notes.verifiedNodes = Number(notes.concordantNodes) + Number(notes.divergentNodes); // known cited agreement, not a fresh native verification
  notes.unboundPositivePeReports = [...peRecordsByEa.entries()].filter(([ea, r]) => r.idb_equals_pe_and_freeze && !frozenByEa.has(ea)).length;
  return { snapshot, stats, notes };
}

// ------------------------------------------- battle-indirect-registry ----

const FUNCTION_TARGET_KINDS = new Set(["code", "ctor", "factory"]);
const TABLE_TARGET_KINDS = new Set(["table", "slot", "list"]);
const VTABLE_TARGET_KINDS = new Set(["vtable_slot", "com_slot"]);
const GLOBAL_TARGET_KINDS = new Set(["bss_ptr", "bss_record", "global_ptr"]);
const INDIRECT_CLOSURES = new Set(["closed_static", "ghost_not_indirect", "open_static_bounded", "runtime_com", "runtime_only"]);
const FF8_INDIRECT_FAMILIES = new Set(["action_seq", "action_table_1D28C44", "arg_callback", "bdlink_pump", "cardgame", "com_ddraw", "com_dinput", "com_dmusic", "com_dsound", "drawlist_walk", "familyb_draw", "file_archive_callback", "file_callback", "gfx_driver", "ghost_not_indirect", "hud_bss_1D768D0", "hud_bss_1D768D4", "hud_bss_1D768D8", "hud_widget_callback", "iat", "iat_via_reg", "menu_list_callback", "menu_sprite_table_1D2B550", "obj_field_fp", "ot_gpu", "relay71", "script_vm", "sound_vtable", "stack_switch", "swirl_vtable", "tpage_init", "type2_factory"]);
// Frozen v1.1.0 inventory, SHA256(canonical(sorted module:RVA:opcode:family keys)).
// Refreshing this historical inventory requires a separately versioned extraction.
export const FF8_INDIRECT_SITE_KEYS_SHA256 = "417b6f9bcbeabcb91949891cb05ca27661af4f11205bbe3fe4ced66f375c2bea";

export function indirectSiteKey(moduleSha256: Sha256, imageBase: Addr, site: IndirectSite): string {
  return `${fnId(moduleSha256, canonicalAddr(BigInt(site.site_va) - BigInt(imageBase)))}:${site.opcode}:${site.family ?? "unspecified"}`;
}

export interface IndirectFacts {
  objects: ReferencedObjectV1[];
  unresolved: UnresolvedReferenceV1[];
  edges: FunctionEdgeV1[];
  extraNodes: FunctionNodeV1[];
  ghostSiteCount: number;
}
/**
 * Typed indirect sites become ReferencedObject + UnresolvedReference records;
 * a single statically-closed code target becomes one indirect_resolved edge
 * (with an observed terminal node when the target sits outside the closure).
 * Imports, tables and globals never become callees (ADR-003).
 */
export function buildIndirectGraphFacts(indirect: IndirectDocument, indirectSha256: Sha256, existingNodeIds: ReadonlySet<string>): IndirectFacts {
  const knownNodeIds = new Set(existingNodeIds);
  const inventoryModule = indirect.binary.sha256.toLowerCase();
  const physicalSites = new Set<string>();
  const inventoryKeys: string[] = [];
  for (const site of indirect.sites) {
    if (!["call", "jmp"].includes(site.opcode) || !INDIRECT_CLOSURES.has(site.closure)) throw new Error("graph-normalize: invalid indirect site opcode/closure");
    const physicalKey = fnId(indirect.binary.sha256, canonicalAddr(BigInt(site.site_va) - BigInt(indirect.binary.image_base)));
    if (physicalSites.has(physicalKey)) throw new Error(`graph-normalize: duplicate/conflicting physical indirect site ${physicalKey}`);
    physicalSites.add(physicalKey);
    if (inventoryModule === FF8_MODULE_SHA256 && (!site.family || !FF8_INDIRECT_FAMILIES.has(site.family) || !["DRAW", "GHOST", "HUD_DRAW_FILE", "IAT", "LOT2"].includes(site.lot_class ?? ""))) throw new Error("graph-normalize: invalid FF8 indirect family/lot class");
    inventoryKeys.push(indirectSiteKey(indirect.binary.sha256, indirect.binary.image_base, site));
  }
  if (inventoryModule === FF8_MODULE_SHA256 && (indirect.schema_version !== "1.1.0" || physicalSites.size !== 493 || hash(canonical(inventoryKeys.sort(compareText))) !== FF8_INDIRECT_SITE_KEYS_SHA256)) throw new Error("graph-normalize: frozen 493-site inventory omission/type/family mismatch");
  if (indirect.counts.sites !== indirect.sites.length) throw new Error("graph-normalize: indirect site count mismatch");
  for (const opcode of ["call", "jmp"]) if (indirect.counts[opcode] !== undefined && indirect.counts[opcode] !== indirect.sites.filter(s => s.opcode === opcode).length) throw new Error(`graph-normalize: indirect ${opcode} count mismatch`);
  if (indirect.counts.GHOST !== undefined && indirect.counts.GHOST !== indirect.sites.filter(s => s.closure === "ghost_not_indirect").length) throw new Error("graph-normalize: indirect ghost count mismatch");
  const moduleSha256 = indirect.binary.sha256.toLowerCase();
  const imageBase = BigInt(indirect.binary.image_base);
  const rvaOf = (va: string): Addr => canonicalAddr(BigInt(va) - imageBase);
  const idOf = (va: string): string => fnId(moduleSha256, rvaOf(va));
  const objects: ReferencedObjectV1[] = [];
  const unresolved: UnresolvedReferenceV1[] = [];
  const edges: FunctionEdgeV1[] = [];
  const extraNodes: FunctionNodeV1[] = [];
  const objectByKey = new Map<string, ReferencedObjectV1>();
  let ghostSiteCount = 0;

  const internObject = (kind: ReferencedObjectV1["kind"], rva: Addr | null, name: string, site: IndirectSite): ReferencedObjectV1 => {
    const key = `${kind}\u0000${rva ?? "import"}\u0000${name}`;
    const existing = objectByKey.get(key);
    if (existing) return existing;
    const object: ReferencedObjectV1 = {
      schemaVersion: 1,
      id: `obj:${hash(canonical({ moduleSha256, kind, rva, name })).slice(0, 24)}`,
      moduleSha256,
      kind,
      rva,
      name,
      widthBytes: metricUnknown(), // x86 pointer load width does not establish the referenced object's extent
      provenance: registryProvenance(moduleSha256, "tools/battle_indirect_registry.py", indirect.schema_version, indirectSha256, {
        siteRva: rva,
        siteKind: kind === "import" ? "import" : "object",
        xrefType: kind === "import" ? "none" : "data",
        evidence: { target: { kind, va: rva, name } }, // object identity independent of site iteration order
      }),
    };
    objectByKey.set(key, object);
    objects.push(object);
    return object;
  };
  const terminalNode = (va: string, name: string | null): FunctionNodeV1 => ({
    schemaVersion: 1,
    id: idOf(va),
    moduleSha256,
    rva: rvaOf(va),
    ea: canonicalAddr(BigInt(va)),
    imageBase: canonicalAddr(imageBase),
    name: name ?? "",
    observedDescription: "",
    boundaries: [],
    sizeBytes: metricUnknown(),
    instructionCount: metricUnknown(),
    basicBlockCount: metricUnknown(),
    functionClass: "internal",
    status: "incomplete",
    semanticMaturity: "none",
    analysisRefs: ["battle-indirect-registry@1.1.0"],
    byteAgreement: "unknown",
    admissibleAsOracle: false,
    byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null },
  });

  for (const site of indirect.sites) {
    if (!existingNodeIds.has(idOf(site.parent_va))) throw new Error(`graph-normalize: indirect site ${site.site_va} has a parent outside the node set (fail-closed)`);
    if (site.closure === "ghost_not_indirect") { ghostSiteCount += 1; continue; }
    const targets = site.targets ?? [];
    const importTargets = targets.filter(target => target.kind === "import" && target.name);
    const functionTargets = targets.filter(target => FUNCTION_TARGET_KINDS.has(target.kind) && target.va);
    const fromFunctionId = idOf(site.parent_va);
    const siteRva = rvaOf(site.site_va);
    const siteProvenance = (xrefType: Provenance["xrefType"], evidence: unknown): Provenance =>
      registryProvenance(moduleSha256, "tools/battle_indirect_registry.py", indirect.schema_version, indirectSha256, { siteRva, siteKind: "instruction", xrefType, evidence });

    const resolvedAtSite = site.closure === "closed_static" && functionTargets.length === 1 && importTargets.length === 0 && !targets.some(t => ["unknown", "register", "null"].includes(t.kind));
    if (resolvedAtSite) {
      const target = functionTargets[0]!;
      const destinationId = idOf(target.va!);
      if (!knownNodeIds.has(destinationId)) {
        const node = terminalNode(target.va!, target.name);
        knownNodeIds.add(node.id);
        extraNodes.push(node);
      }
      edges.push({
        schemaVersion: 1,
        id: "",
        sourceId: fromFunctionId,
        destinationId,
        kind: "indirect_resolved",
        direction: "source_to_destination",
        sites: [{ siteRva, xrefType: "code", provenance: siteProvenance("code", site) }],
        status: "observed",
        confidence: "medium",
        appearedInRevision: 0,
        retiredInRevision: null,
        schedulerRelevance: "may_block",
      });
    }

    const references = new Map<string, ReferencedObjectV1>();
    for (const candidate of targets) {
      const kind = candidate.kind === "import" && candidate.name ? "import" : TABLE_TARGET_KINDS.has(candidate.kind) && candidate.va ? "table" : VTABLE_TARGET_KINDS.has(candidate.kind) && candidate.va ? "vtable" : GLOBAL_TARGET_KINDS.has(candidate.kind) && candidate.va ? "global" : null;
      if (!kind) continue;
      const object = internObject(kind, kind === "import" ? null : rvaOf(candidate.va!), candidate.name ?? `${kind}@${candidate.va}`, site);
      references.set(object.id, object);
    }
    // One typed reference per witnessed object candidate. Other (e.g. code or
    // runtime) candidates remain in the full-site provenance, not fake callees.
    const hasOtherCandidates = !resolvedAtSite && targets.some(candidate => !(["import", ...TABLE_TARGET_KINDS, ...VTABLE_TARGET_KINDS, ...GLOBAL_TARGET_KINDS].includes(candidate.kind)));
    const referencedObjects: Array<ReferencedObjectV1 | null> = [...references.values()].sort((a, b) => compareText(a.id, b.id));
    if ((!referencedObjects.length && !resolvedAtSite) || hasOtherCandidates) referencedObjects.push(null);
    for (const referenced of referencedObjects) {
      const kind: UnresolvedReferenceV1["kind"] = resolvedAtSite ? "data_xref" : referenced?.kind === "import" ? "import_unresolved" : site.opcode === "jmp" ? "indirect_jump" : "indirect_call";
      const target: UnresolvedReferenceV1["target"] = referenced?.kind === "import" ? "import" : referenced?.kind === "table" ? "table" : referenced ? "data_object" : site.encoding?.form === "reg" || targets.some(t => t.kind === "register") ? "register" : "unknown";
      unresolved.push({
      schemaVersion: 1,
      id: `unres:${hash(canonical({ fromFunctionId, siteRva, kind, objectId: referenced?.id ?? null })).slice(0, 24)}`,
      fromFunctionId,
      siteRva,
      kind,
      target,
      referencedObjectId: referenced?.id ?? null,
      fabricatedFunction: false,
      provenance: siteProvenance(referenced ? "data" : "none", site),
      });
    }
  }
  return { objects, unresolved, edges, extraNodes, ghostSiteCount };
}

// --------------------------------------------------- r01 greedy baseline ----

export const BASELINE_ALGORITHM_ID = "r01-greedy-direct100-callers3-targets1-cap6";
export const BASELINE_ALGORITHM_VERSION = "v1";
export interface BaselineGroup { id: string; eas: string[] }

const toNumber = (ea: string): number => Number(BigInt(ea));
const formatEa = (value: number): string => `0x${value.toString(16).toUpperCase().padStart(6, "0")}`;

/**
 * Exact port of the historical r01 exporter grouping (native-groups.json
 * "algorithm": "v1 direct=100 shared-code-callers=3 shared-code-targets=1;
 * greedy max6; no zero-score joins"). Deterministic: seed = smallest EA,
 * candidate = max by (score, then smallest EA), score recomputed over all
 * selected members, zero-score joins refused, six-member cap.
 */
export function greedyBoundedGroups(graph: Record<string, { out: string[]; callers: string[] }>): BaselineGroup[] {
  const parsed = new Map<number, { out: Set<number>; callers: Set<number> }>();
  for (const [ea, entry] of Object.entries(graph)) {
    parsed.set(toNumber(ea), { out: new Set(entry.out.map(toNumber)), callers: new Set(entry.callers.map(toNumber)) });
  }
  const scoreOf = (candidate: number, selected: number[]): number =>
    selected.reduce((sum, a) => {
      const ga = parsed.get(a)!;
      const gc = parsed.get(candidate)!;
      const direct = gc.out.has(a) || ga.out.has(candidate) ? 100 : 0;
      return sum + direct + 3 * [...ga.callers].filter(caller => gc.callers.has(caller)).length + [...ga.out].filter(out => gc.out.has(out)).length;
    }, 0);
  const remaining = new Set(parsed.keys());
  const orderedSeeds = [...remaining].sort((a, b) => a - b);
  let seedIndex = 0;
  const groups: BaselineGroup[] = [];
  while (remaining.size > 0) {
    while (!remaining.has(orderedSeeds[seedIndex]!)) seedIndex += 1;
    const seed = orderedSeeds[seedIndex]!;
    const selected: number[] = [seed];
    remaining.delete(seed);
    while (selected.length < 6 && remaining.size > 0) {
      let best: number | null = null;
      let bestScore = 0;
      for (const candidate of remaining) {
        const score = scoreOf(candidate, selected);
        if (score <= 0) continue;
        if (best === null || score > bestScore || (score === bestScore && candidate < best)) { best = candidate; bestScore = score; }
      }
      if (best === null) break; // no zero-score joins
      selected.push(best);
      remaining.delete(best);
    }
    groups.push({ id: `g${String(groups.length + 1).padStart(2, "0")}`, eas: selected.map(formatEa) });
  }
  return groups;
}
export function baselineFromRun01(document: Run01BaselineDocument): BaselineGroup[] { return greedyBoundedGroups(document.graph); }
/** Freeze gate: the ported baseline must reproduce the tracked historical grouping exactly. */
export function assertBaselineMatches(document: Run01BaselineDocument, groups: BaselineGroup[]): void {
  if (JSON.stringify(groups) !== JSON.stringify(document.groups)) throw new Error("graph-normalize: baseline port diverges from the frozen native-groups.json grouping");
}

export interface GraphCacheKey {
  moduleSha256s: Sha256[];
  snapshotFingerprint: Sha256;
  extractorVersion: string;
  extractorHash: Sha256;
  normalizerVersion: string;
  configFingerprint: Sha256;
}
export function graphCacheKey(snapshot: GraphSnapshotV1): GraphCacheKey {
  assertSnapshotContract(snapshot);
  return { moduleSha256s: [...snapshot.scope.moduleSha256s], snapshotFingerprint: snapshot.normalizedFingerprint, extractorVersion: snapshot.toolVersions.extractor, extractorHash: snapshot.toolVersions.extractorHash, normalizerVersion: snapshot.toolVersions.normalizer, configFingerprint: snapshot.configFingerprint };
}
/** Immutable in-memory export cache. Revisions/configuration/tools are never aliases. */
export class GraphSnapshotCache {
  private entries = new Map<string, { key: GraphCacheKey; snapshot: GraphSnapshotV1 }>();
  constructor(private readonly maxEntries = 16) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) throw new Error("graph-cache: positive entry bound required");
  }
  get(key: GraphCacheKey): GraphSnapshotV1 | undefined {
    const value = this.entries.get(canonical(key));
    return value ? structuredClone(value.snapshot) : undefined;
  }
  set(key: GraphCacheKey, snapshot: GraphSnapshotV1): void {
    if (canonical(key) !== canonical(graphCacheKey(snapshot))) throw new Error("graph-cache: key does not bind the snapshot");
    const id = canonical(key);
    if (!this.entries.has(id) && this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(id, { key: structuredClone(key), snapshot: structuredClone(snapshot) });
  }
  invalidate(moduleSha256?: Sha256): number {
    let count = 0;
    for (const [id, entry] of this.entries) if (moduleSha256 === undefined || entry.key.moduleSha256s.includes(moduleSha256)) { this.entries.delete(id); count += 1; }
    return count;
  }
  size(): number { return this.entries.size; }
}
