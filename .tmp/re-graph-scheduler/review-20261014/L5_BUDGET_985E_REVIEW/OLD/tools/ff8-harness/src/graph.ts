// L2 — contract v1 types, canonical primitives and the graph invariant checker.
// Shapes mirror docs/missions/re-graph-scheduler/contract/CONTRAT.md §3 and
// schemas/graph-snapshot-v1.schema.json exactly. L8 projects these into
// domain.ts (ADR-010); until then this module is the only graph type source.
import { canonical, compareText, hash } from "./validation";
import graphSnapshotSchema from "../schemas/graph-snapshot-v1.schema.json";
export { compareText };

export type Sha256 = string; // 64 lowercase hex
export type Addr = string; // "0x" + uppercase hex, no leading zeros, never zero for a function

export interface UnknownableInteger { known: boolean; value: number | null }
export interface Provenance {
  moduleSha256: Sha256;
  siteRva: Addr | null;
  siteKind: "instruction" | "object" | "import" | "table" | "extractor";
  xrefType: "code" | "data" | "none";
  source: string;
  sourceVersion: string;
  sourceHash: Sha256;
  evidenceSha256: Sha256;
}
export interface EvidenceRef { id: string; source: string; sha256: Sha256; detail: string }
export interface HarnessFunctionIdentity { sha256: Sha256; version: string; ea: Addr }

export interface BinaryArtifactV1 {
  schemaVersion: 1;
  artifactId: string;
  moduleName: string;
  contentSha256: Sha256;
  versionLabel: string;
  format: "PE32" | "PE32+" | "unknown";
  architecture: "x86-32" | "x86-64" | "unknown";
  imageBase: Addr;
  idbIdentity: string;
  sections: Array<{ name: string; rva: Addr; virtualSize: UnknownableInteger; characteristics: string }>;
  provenance: Provenance;
  analysisVersion: string;
  extractorVersion: string;
}
export interface ChunkSpan { ordinal: number; rva: Addr; endRvaExclusive: Addr; role: "entry" | "tail" }
export interface ByteDivergence { known: boolean; peMismatchByteCount: number | null; frozenSha256: Sha256 | null; peSha256: Sha256 | null }
export interface FunctionNodeV1 {
  schemaVersion: 1;
  id: string; // `${moduleSha256}:${rva}`
  moduleSha256: Sha256;
  rva: Addr;
  ea: Addr;
  imageBase: Addr;
  name: string;
  observedDescription: string;
  boundaries: ChunkSpan[];
  sizeBytes: UnknownableInteger;
  instructionCount: UnknownableInteger;
  basicBlockCount: UnknownableInteger;
  functionClass: "internal" | "import" | "external" | "thunk" | "wrapper" | "incomplete";
  status: "observed" | "incomplete" | "quarantined";
  semanticMaturity: "none" | "structural" | "partial" | "reconciled" | "published-local";
  analysisRefs: string[];
  byteAgreement: "unknown" | "concordant" | "divergent";
  admissibleAsOracle: false;
  byteDivergence: ByteDivergence;
}
export type EdgeKind = "direct_call" | "tail_jump" | "indirect_resolved" | "thunk" | "callback_candidate";
export const EDGE_KIND_ORDER: readonly EdgeKind[] = ["direct_call", "tail_jump", "indirect_resolved", "thunk", "callback_candidate"];
export const CODE_EDGE_KINDS: ReadonlySet<EdgeKind> = new Set(["direct_call", "tail_jump", "indirect_resolved", "thunk"]);
export interface EdgeSite { siteRva: Addr; xrefType: "code" | "data"; provenance: Provenance }
export interface FunctionEdgeV1 {
  schemaVersion: 1;
  id: string;
  sourceId: string; // caller
  destinationId: string; // callee, always a FunctionNode id
  kind: EdgeKind;
  direction: "source_to_destination"; // A calls B = A -> B (ADR-002)
  sites: EdgeSite[];
  status: "observed" | "inferred" | "validated" | "invalidated";
  confidence: "high" | "medium" | "low" | "unknown";
  appearedInRevision: number;
  retiredInRevision: number | null;
  schedulerRelevance: "may_block" | "non_blocking" | "hypothesis_not_call" | "context_only";
}
export interface ReferencedObjectV1 {
  schemaVersion: 1;
  id: string;
  moduleSha256: Sha256;
  kind: "data" | "table" | "import" | "structure" | "global" | "vtable" | "string";
  rva: Addr | null; // null for a pure import; never "0x0"
  name: string;
  widthBytes: UnknownableInteger;
  provenance: Provenance;
}
export interface UnresolvedReferenceV1 {
  schemaVersion: 1;
  id: string;
  fromFunctionId: string;
  siteRva: Addr;
  kind: "indirect_call" | "indirect_jump" | "data_xref" | "callback_slot" | "import_unresolved";
  target: "unknown" | "data_object" | "import" | "register" | "table";
  referencedObjectId: string | null;
  fabricatedFunction: false;
  provenance: Provenance;
}
export interface CapabilityFactV1 {
  schemaVersion: 1;
  id: string;
  ruleId: string;
  ruleVersion: string;
  subjectKind: "function" | "region";
  subjectId: string;
  capability: string;
  evidence: EvidenceRef[];
  confidence: "observed" | "inferred";
  scope: "direct" | "propagated";
  hypotheticalRole: string | null;
  provenance: Provenance;
}
export interface GraphSnapshotV1 {
  schemaVersion: 1;
  snapshotId: string;
  missionId: string;
  binaryArtifacts: BinaryArtifactV1[];
  nodes: FunctionNodeV1[];
  edges: FunctionEdgeV1[];
  objects: ReferencedObjectV1[];
  unresolved: UnresolvedReferenceV1[];
  capabilities: CapabilityFactV1[];
  normalizedFingerprint: Sha256;
  knowledgeRevision: number;
  scope: { description: string; moduleSha256s: Sha256[]; functionCount: number };
  coverage: SnapshotCoverage;
  toolVersions: { extractor: string; extractorHash: Sha256; normalizer: string };
  configFingerprint: Sha256;
}
export interface SnapshotCoverage {
  status: "complete" | "partial" | "diagnostic";
  uncoveredReason: string | null;
  tailsIterated: boolean;
  selfLoopsPreserved: boolean;
}

// Contract names, alongside the version-explicit names used by consumers.
export type BinaryArtifact = BinaryArtifactV1;
export type FunctionNode = FunctionNodeV1;
export type FunctionEdge = FunctionEdgeV1;
export type ReferencedObject = ReferencedObjectV1;
export type UnresolvedReference = UnresolvedReferenceV1;
export type CapabilityFact = CapabilityFactV1;
export type GraphSnapshot = GraphSnapshotV1;

export const SCHEMA_VERSION = 1 as const;
// FF8 PC EXE (GO_ACTIVATION.md); quarantined IDB/PE divergences stay out of every oracle.
export const FF8_MODULE_SHA256 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570";
export const FF8_IMAGE_BASE = 0x400000;
export const QUARANTINE_EAS: readonly Addr[] = ["0x465720", "0x495960", "0x48D200", "0x48FE20"];
export const MAX_EDGE_SITES = 64; // graph-snapshot-v1 schema hard cap on sites per relation

export function canonicalAddr(value: bigint | number | string): Addr {
  if (typeof value === "number" && !Number.isSafeInteger(value)) throw new Error(`graph: address out of range: ${value}`);
  const v = BigInt(value);
  if (v <= 0n || v > 0xffffffffffffffffn) throw new Error(`graph: address out of range: ${value}`);
  return `0x${v.toString(16).toUpperCase()}`;
}
export function parseAddr(value: string): bigint {
  if (typeof value !== "string" || !/^0x[0-9A-Fa-f]+$/.test(value) || BigInt(value) === 0n) throw new Error(`graph: uncanonical address: ${String(value)}`);
  return BigInt(value);
}
/** Canonical function id: module content hash + canonical RVA. Names and EAs are attributes (ADR-001). */
export function fnId(moduleSha256: Sha256, rva: Addr | bigint | number): string {
  const sha = moduleSha256.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error(`graph: module hash is not lowercase sha256: ${moduleSha256}`);
  return `${sha}:${canonicalAddr(typeof rva === "string" ? parseAddr(rva) : rva)}`;
}
export function metricKnown(value: number): UnknownableInteger {
  if (!isNonnegativeInteger(value)) throw new Error(`graph: known metric must be a canonical non-negative safe integer: ${value}`);
  return { known: true, value };
}
export function metricUnknown(): UnknownableInteger {
  return { known: false, value: null }; // ADR-006: unknown is never zero
}
function splitFn(id: string): [string, string] | null {
  const idx = id.lastIndexOf(":0x");
  return idx < 0 ? null : [id.slice(0, idx), id.slice(idx + 1)];
}
/** Numeric RVA ordering, code-unit module ordering; never the lexicographic "sha:rva" order (0x10 vs 0x2). */
export function compareFnIds(a: string, b: string): number {
  const left = splitFn(a);
  const right = splitFn(b);
  if (!left || !right) return compareText(a, b);
  if (left[0] !== right[0]) return compareText(left[0], right[0]);
  if (!/^0x[0-9A-Fa-f]+$/.test(left[1]) || !/^0x[0-9A-Fa-f]+$/.test(right[1])) return compareText(a, b);
  const d = BigInt(left[1]) - BigInt(right[1]);
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}
function compareAddrValues(a: string, b: string): number {
  const d = BigInt(a) - BigInt(b);
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}
/** Canonical edge order: source, destination, kind enum rank, then the first site RVA numerically. */
export function compareEdges(a: FunctionEdgeV1, b: FunctionEdgeV1): number {
  const bySource = compareFnIds(a.sourceId, b.sourceId);
  if (bySource !== 0) return bySource;
  const byDest = compareFnIds(a.destinationId, b.destinationId);
  if (byDest !== 0) return byDest;
  const byKind = EDGE_KIND_ORDER.indexOf(a.kind) - EDGE_KIND_ORDER.indexOf(b.kind);
  if (byKind !== 0) return byKind;
  return compareAddrValues(a.sites[0]!.siteRva, b.sites[0]!.siteRva);
}
export function compareIds(a: string, b: string): number { return compareText(a, b); }

function isObject(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function isSha(value: unknown): value is Sha256 { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
}
function isAddr(value: unknown): value is Addr {
  if (typeof value !== "string" || !/^0x[0-9A-F]+$/.test(value)) return false;
  if (value.length > 3 && value[2] === "0") return false; // no leading zeros
  return BigInt(value) > 0n && BigInt(value) <= 0xffffffffffffffffn;
}
function isUnknownable(value: unknown): value is UnknownableInteger {
  if (!isObject(value) || typeof value.known !== "boolean") return false;
  if (value.known) return isNonnegativeInteger(value.value);
  return value.value === null; // ADR-006: zero is not an unknown sentinel
}
function isProvenance(value: unknown): value is Provenance {
  if (!isObject(value)) return false;
  return isSha(value.moduleSha256) && (value.siteRva === null || isAddr(value.siteRva))
    && (value.siteRva !== null || value.siteKind === "import" || value.siteKind === "extractor")
    && ["instruction", "object", "import", "table", "extractor"].includes(String(value.siteKind))
    && ["code", "data", "none"].includes(String(value.xrefType))
    && typeof value.source === "string" && value.source.length > 0
    && typeof value.sourceVersion === "string" && value.sourceVersion.length > 0
    && isSha(value.sourceHash) && isSha(value.evidenceSha256);
}
function siteInKnownChunks(node: Record<string, unknown>, siteRva: unknown): boolean {
  return isAddr(siteRva) && (node.boundaries as ChunkSpan[]).some(span => isAddr(span.rva) && isAddr(span.endRvaExclusive) && BigInt(siteRva) >= BigInt(span.rva) && BigInt(siteRva) < BigInt(span.endRvaExclusive));
}

export interface StaticJsonSchema {
  type?: string | string[];
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, StaticJsonSchema>;
  additionalProperties?: boolean;
  items?: StaticJsonSchema;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  [keyword: string]: unknown;
}
/** Pure validator for the frozen strict JSON subset; no I/O or stateful dependency. */
export function validateStaticJsonSchema(value: unknown, schema: StaticJsonSchema, path = "$"): string[] {
  const errors: string[] = [];
  const supported = new Set(["$schema", "$id", "title", "description", "type", "enum", "required", "properties", "additionalProperties", "items", "minimum", "maximum", "minItems", "maxItems", "minLength", "maxLength"]);
  const inspectRule = (rule: StaticJsonSchema): void => {
    for (const keyword of Object.keys(rule)) if (!supported.has(keyword)) throw new Error(`graph-schema: unsupported keyword ${keyword}`);
    for (const child of Object.values(rule.properties ?? {})) inspectRule(child);
    if (rule.items) inspectRule(rule.items);
  };
  inspectRule(schema);
  const visit = (input: unknown, rule: StaticJsonSchema, at: string): void => {
    const actual = input === null ? "null" : Array.isArray(input) ? "array" : typeof input === "number" && Number.isInteger(input) ? "integer" : typeof input;
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.includes(actual) && !(actual === "integer" && types.includes("number"))) { errors.push(`${at}: invalid type ${actual}`); return; }
    if (rule.enum && !rule.enum.some(v => canonical(v) === canonical(input))) errors.push(`${at}: enum violation`);
    if (typeof input === "number") {
      if (!Number.isFinite(input)) errors.push(`${at}: non-finite number`);
      if (Object.is(input, -0)) errors.push(`${at}: non-canonical negative zero`);
      if (actual === "integer" && !Number.isSafeInteger(input)) errors.push(`${at}: unsafe integer`);
      if (rule.minimum !== undefined && input < rule.minimum) errors.push(`${at}: minimum violation`);
      if (rule.maximum !== undefined && input > rule.maximum) errors.push(`${at}: maximum violation`);
    }
    if (typeof input === "string") {
      const length = [...input].length;
      if (rule.minLength !== undefined && length < rule.minLength) errors.push(`${at}: minLength violation`);
      if (rule.maxLength !== undefined && length > rule.maxLength) errors.push(`${at}: maxLength violation`);
    }
    if (Array.isArray(input)) {
      if (rule.minItems !== undefined && input.length < rule.minItems) errors.push(`${at}: minItems violation`);
      if (rule.maxItems !== undefined && input.length > rule.maxItems) errors.push(`${at}: maxItems violation`);
      if (rule.items) for (let i = 0; i < input.length; i++) visit(input[i], rule.items, `${at}[${i}]`);
    } else if (isObject(input)) {
      for (const field of rule.required ?? []) if (!Object.hasOwn(input, field)) errors.push(`${at}.${field}: required`);
      for (const [field, item] of Object.entries(input)) {
        const child = rule.properties?.[field];
        if (child) visit(item, child, `${at}.${field}`);
        else if (rule.additionalProperties === false) errors.push(`${at}.${field}: additionalProperties forbidden`);
      }
    }
  };
  visit(value, schema, path);
  return errors;
}

export function validateGraphSnapshotSchema(doc: unknown): string[] {
  return validateStaticJsonSchema(doc, graphSnapshotSchema as StaticJsonSchema);
}

/**
 * Cross-field contract invariants (CONTRAT.md §3; mirrors test/graph-contract.test.ts).
 * Returns violation texts; producers must treat a nonempty list as a build failure.
 */
export function validateGraphSnapshot(doc: unknown): string[] {
  const schemaErrors = validateGraphSnapshotSchema(doc);
  if (schemaErrors.length) return schemaErrors;
  const v: string[] = [];
  const bad = (text: string): void => { v.push(text); };
  if (!isObject(doc)) return ["snapshot must be an object"];
  if (doc.schemaVersion !== 1) bad("unsupported schema version");
  for (const field of ["nodes", "edges", "objects", "unresolved", "capabilities"]) if (Array.isArray(doc[field]) && (doc[field] as unknown[]).length > 100000) bad(`${field} exceeds transport bound`);
  if (Array.isArray(doc.binaryArtifacts) && doc.binaryArtifacts.length > 16) bad("binaryArtifacts exceeds transport bound");
  for (const field of ["snapshotId", "missionId"]) if (typeof doc[field] !== "string" || !(doc[field] as string).length) bad(`missing ${field}`);
  if (!isNonnegativeInteger(doc.knowledgeRevision)) bad("invalid knowledge revision");
  const artifacts = doc.binaryArtifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0) bad("binaryArtifacts must be a nonempty array");
  const artifactBySha = new Map<string, Record<string, unknown>>();
  for (const artifact of Array.isArray(artifacts) ? artifacts as Record<string, unknown>[] : []) {
    if (!isObject(artifact)) { bad("artifact must be an object"); continue; }
    if (!isSha(artifact.contentSha256)) bad("artifact contentSha256 is not lowercase sha256");
    else if (!artifactBySha.has(artifact.contentSha256 as string)) artifactBySha.set(artifact.contentSha256 as string, artifact);
    else bad("duplicate module artifact");
    if (!isAddr(artifact.imageBase)) bad("artifact image base is uncanonical");
    if (!Array.isArray(artifact.sections)) bad("artifact sections must be an array");
    else for (const section of artifact.sections as Record<string, unknown>[]) {
      if (!isObject(section)) { bad("section must be an object"); continue; }
      if (!isAddr(section.rva)) bad("section rva is uncanonical");
      if (!isUnknownable(section.virtualSize)) bad("section virtualSize violates unknown-metric rules");
    }
    if (!isProvenance(artifact.provenance)) bad("artifact provenance missing or malformed (ADR-008)");
    else if (artifact.provenance.moduleSha256 !== artifact.contentSha256) bad("artifact provenance does not bind its module content hash");
  }
  const nodes = doc.nodes;
  const nodeById = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(nodes)) bad("nodes must be an array");
  const nodeIds = new Set<string>();
  const objectIds = new Set<string>();
  for (const object of Array.isArray(doc.objects) ? doc.objects as Record<string, unknown>[] : []) {
    if (isObject(object) && typeof object.id === "string") objectIds.add(object.id);
  }
  for (const node of Array.isArray(nodes) ? nodes as Record<string, unknown>[] : []) {
    if (!isObject(node)) { bad("node must be an object"); continue; }
    const rva = isAddr(node.rva) ? BigInt(node.rva as string) : null;
    const ea = isAddr(node.ea) ? BigInt(node.ea as string) : null;
    const base = isAddr(node.imageBase) ? BigInt(node.imageBase as string) : null;
    if (rva === null) bad(`function RVA is zero or uncanonical: ${String(node.rva)}`);
    if (ea === null) bad(`function EA is zero or uncanonical: ${String(node.ea)}`);
    if (base === null || rva === null || ea === null || ea !== base + rva) bad(`EA is not imageBase + RVA for ${String(node.id)}`);
    if (node.id !== `${String(node.moduleSha256)}:${String(node.rva)}`) bad(`function id is not module hash + RVA: ${String(node.id)}`);
    if (!isSha(node.moduleSha256)) bad("node module hash is not lowercase sha256");
    else {
      const artifact = artifactBySha.get(node.moduleSha256 as string);
      if (!artifact) bad(`node module is not in binaryArtifacts: ${String(node.id)}`);
      else if (artifact.imageBase !== node.imageBase) bad(`node image base does not match its artifact: ${String(node.id)}`);
    }
    if (!Array.isArray(node.boundaries)) bad("node boundaries must be an array");
    else for (const span of node.boundaries as Record<string, unknown>[]) {
      if (!isObject(span) || !isAddr(span.rva) || !isAddr(span.endRvaExclusive)) { bad("chunk span has uncanonical addresses"); continue; }
      if (BigInt(span.endRvaExclusive as string) <= BigInt(span.rva as string)) bad("chunk span is empty or reversed");
      if (!["entry", "tail"].includes(String(span.role))) bad("chunk role must be entry or tail");
    }
    if (!isUnknownable(node.sizeBytes)) bad(`sizeBytes violates unknown-metric rules for ${String(node.id)}`);
    if (!isUnknownable(node.instructionCount)) bad(`instructionCount violates unknown-metric rules for ${String(node.id)}`);
    if (!isUnknownable(node.basicBlockCount)) bad(`basicBlockCount violates unknown-metric rules for ${String(node.id)}`);
    if (node.admissibleAsOracle !== false) bad("oracle admission is forbidden in v1");
    if (node.moduleSha256 === FF8_MODULE_SHA256 && QUARANTINE_EAS.some(ea => `0x${(BigInt(ea) - BigInt(FF8_IMAGE_BASE)).toString(16).toUpperCase()}` === node.rva) && node.status !== "quarantined") bad("historical FF8 byte divergence must remain quarantined");
    if (node.status === "quarantined" && ["reconciled", "published-local"].includes(String(node.semanticMaturity))) bad("quarantined node cannot be semantically published");
    const div = node.byteDivergence;
    if (!isObject(div)) bad("byteDivergence must be an object");
    else {
      if (typeof div.known !== "boolean") bad("byte divergence known flag missing");
      if (div.known === true && !isNonnegativeInteger(div.peMismatchByteCount)) bad("known byte divergence count invalid");
      if (div.known === false && (div.peMismatchByteCount !== null || div.frozenSha256 !== null || div.peSha256 !== null || node.byteAgreement !== "unknown")) bad("unknown byte divergence is not explicit");
      for (const field of ["frozenSha256", "peSha256"]) if (div[field] !== null && !isSha(div[field])) bad("byte divergence hash is not lowercase sha256");
      if (div.known === true && div.peMismatchByteCount === 0 && node.byteAgreement !== "concordant") bad("known zero mismatches must be concordant, not unknown");
      if (div.known === true && div.peMismatchByteCount === 0 && div.frozenSha256 !== div.peSha256) bad("known zero mismatches contradict unequal byte hashes");
      if (div.known === true && typeof div.peMismatchByteCount === "number" && div.peMismatchByteCount > 0) {
        if (node.byteAgreement !== "divergent" || node.status !== "quarantined") bad("divergent bytes must be quarantined");
        if (div.frozenSha256 === div.peSha256 || !isSha(div.frozenSha256) || !isSha(div.peSha256)) bad("divergent citation needs two distinct hashes");
      }
    }
    if (typeof node.id === "string") {
      if (nodeIds.has(node.id)) bad(`duplicate node id: ${node.id}`);
      nodeIds.add(node.id);
      nodeById.set(node.id, node);
    }
  }
  for (let i = 1; i < (Array.isArray(nodes) ? nodes.length : 0); i++) {
    const previous = (nodes as Record<string, unknown>[])[i - 1]!, current = (nodes as Record<string, unknown>[])[i]!;
    if (isObject(previous) && isObject(current) && typeof previous.id === "string" && typeof current.id === "string" && compareFnIds(previous.id, current.id) > 0) bad("nodes are not canonically ordered");
  }
  const edges = doc.edges;
  const edgeIds = new Set<string>();
  const relationMetadata = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(edges)) bad("edges must be an array");
  for (const edge of Array.isArray(edges) ? edges as Record<string, unknown>[] : []) {
    if (!isObject(edge)) { bad("edge must be an object"); continue; }
    if (typeof edge.id !== "string" || !edge.id.length || edgeIds.has(edge.id)) bad("edge identity missing or duplicated");
    else edgeIds.add(edge.id);
    if (!EDGE_KIND_ORDER.includes(edge.kind as EdgeKind)) bad("unknown edge kind");
    if (!["observed", "inferred", "validated", "invalidated"].includes(String(edge.status))) bad("unknown edge status");
    if (typeof edge.sourceId !== "string" || typeof edge.destinationId !== "string" || !nodeIds.has(edge.sourceId) || !nodeIds.has(edge.destinationId)) bad(`edge endpoint is not a function: ${String(edge.id)}`);
    if (objectIds.has(edge.destinationId as string) || objectIds.has(edge.sourceId as string)) bad("data object used as a callee");
    if (edge.direction !== "source_to_destination") bad("call direction reversed");
    if (!isNonnegativeInteger(edge.appearedInRevision) || (isNonnegativeInteger(doc.knowledgeRevision) && (edge.appearedInRevision as number) > doc.knowledgeRevision)) bad("edge appearance revision is not canonical or is after the snapshot");
    if (edge.retiredInRevision !== null && (!isNonnegativeInteger(edge.retiredInRevision) || (isNonnegativeInteger(edge.appearedInRevision) && (edge.retiredInRevision as number) < edge.appearedInRevision) || (isNonnegativeInteger(doc.knowledgeRevision) && (edge.retiredInRevision as number) > doc.knowledgeRevision))) bad("edge retirement revision is not canonical or violates snapshot chronology");
    const key = `${edge.sourceId}\u0000${edge.destinationId}\u0000${edge.kind}`;
    const prior = relationMetadata.get(key);
    if (prior) {
      for (const field of ["schemaVersion", "direction", "status", "confidence", "appearedInRevision", "retiredInRevision", "schedulerRelevance"]) if (prior[field] !== edge[field]) bad(`conflicting relation shard metadata ${key}: ${field}`);
    } else relationMetadata.set(key, edge);
    if (!Array.isArray(edge.sites) || edge.sites.length === 0) bad("edge sites must be nonempty");
    else {
      if (edge.sites.length > MAX_EDGE_SITES) bad("edge sites exceed the schema cap");
      for (const site of edge.sites as Record<string, unknown>[]) {
        if (!isObject(site) || !isAddr(site.siteRva)) { bad("edge site RVA is zero or uncanonical"); continue; }
        if (!isProvenance(site.provenance)) bad("edge site provenance missing or malformed (ADR-008)");
        else if (typeof edge.sourceId !== "string" || site.provenance.moduleSha256 !== edge.sourceId.split(":")[0] || site.provenance.siteRva !== site.siteRva || site.provenance.xrefType !== site.xrefType) bad("edge site provenance does not match its source/site/xref");
        const kind = String(edge.kind);
        if (kind === "callback_candidate" && site.xrefType !== "data") bad("callback candidate has a code site");
        if (CODE_EDGE_KINDS.has(kind as EdgeKind) && site.xrefType !== "code") bad("code edge has a DATA site");
        // Instruction provenance describes the caller's instruction, not the
        // callee's bytes. A global DATA/table slot and a pure import are not
        // caller instructions and must not inherit this containment rule.
        if (CODE_EDGE_KINDS.has(kind as EdgeKind) || (isObject(site.provenance) && site.provenance.siteKind === "instruction")) {
          const source = nodeById.get(edge.sourceId as string);
          if (source && (source.boundaries as ChunkSpan[]).length && !siteInKnownChunks(source, site.siteRva)) bad("edge instruction site is outside source function chunks");
          else if (source && !(source.boundaries as ChunkSpan[]).length && isObject(doc.coverage) && doc.coverage.status === "complete") bad("complete coverage cannot certify an instruction site without source function chunks");
        }
      }
    }
    if (edge.kind === "callback_candidate") {
      if (edge.status === "observed" || edge.status === "validated" || edge.schedulerRelevance !== "hypothesis_not_call") bad("callback candidate promoted toward a call (ADR-004)");
    }
  }
  for (let i = 1; i < (Array.isArray(edges) ? edges.length : 0); i++) {
    const previous = (edges as FunctionEdgeV1[])[i - 1]!, current = (edges as FunctionEdgeV1[])[i]!;
    if (isObject(previous) && isObject(current) && typeof previous.sourceId === "string" && typeof current.sourceId === "string" && typeof previous.destinationId === "string" && typeof current.destinationId === "string" && Array.isArray(previous.sites) && Array.isArray(current.sites) && isObject(previous.sites[0]) && isObject(current.sites[0]) && isAddr(previous.sites[0].siteRva) && isAddr(current.sites[0].siteRva) && compareEdges(previous, current) > 0) bad("edges are not canonically ordered");
  }
  const objects = doc.objects;
  if (!Array.isArray(objects)) bad("objects must be an array");
  const seenObjects = new Set<string>();
  for (const object of Array.isArray(objects) ? objects as Record<string, unknown>[] : []) {
    if (!isObject(object)) { bad("object must be an object"); continue; }
    if (typeof object.id === "string") {
      if (nodeIds.has(object.id)) bad("object id collides with a function id");
      if (seenObjects.has(object.id)) bad(`duplicate object id: ${String(object.id)}`);
      seenObjects.add(object.id);
    }
    if (object.kind === "import" && object.rva !== null) bad("pure import must not be given a fake local RVA");
    if (object.rva !== null && !isAddr(object.rva)) bad("object RVA is zero or uncanonical");
    if (!isUnknownable(object.widthBytes)) bad(`widthBytes violates unknown-metric rules for ${String(object.id)}`);
    if (!isProvenance(object.provenance)) bad("object provenance missing or malformed (ADR-008)");
    else if (object.provenance.moduleSha256 !== object.moduleSha256 || !artifactBySha.has(object.moduleSha256 as string)) bad("object/provenance module identity mismatch");
  }
  const unresolvedIds = new Set<string>();
  for (const item of Array.isArray(doc.unresolved) ? doc.unresolved as Record<string, unknown>[] : []) {
    if (!isObject(item)) { bad("unresolved must be an object"); continue; }
    if (typeof item.id !== "string" || !item.id.length || unresolvedIds.has(item.id)) bad("unresolved identity missing or duplicated");
    else unresolvedIds.add(item.id);
    if (item.fabricatedFunction !== false) bad("fabricated function");
    if (typeof item.fromFunctionId !== "string" || !nodeIds.has(item.fromFunctionId)) bad("unresolved reference has no source function");
    if (!isAddr(item.siteRva)) bad("unresolved site is zero or uncanonical");
    if (item.referencedObjectId !== null && (!objectIds.has(item.referencedObjectId as string))) bad("unresolved object missing");
    if (item.kind === "data_xref" && isObject(item.provenance) && item.provenance.xrefType !== "data") bad("DATA xref provenance is not data");
    if (!isProvenance(item.provenance)) bad("unresolved provenance missing or malformed (ADR-008)");
    else {
      const source = nodeById.get(item.fromFunctionId as string);
      if (!source || item.provenance.moduleSha256 !== source.moduleSha256 || item.provenance.siteRva !== item.siteRva) bad("unresolved provenance does not bind the source function module/site");
      else if (item.provenance.siteKind === "instruction" && (source.boundaries as ChunkSpan[]).length && !siteInKnownChunks(source, item.siteRva)) bad("unresolved instruction site is outside source function chunks");
      else if (item.provenance.siteKind === "instruction" && !(source.boundaries as ChunkSpan[]).length && isObject(doc.coverage) && doc.coverage.status === "complete") bad("complete coverage cannot certify an unresolved instruction site without source function chunks");
    }
  }
  if (!Array.isArray(doc.unresolved)) bad("unresolved must be an array");
  if (!Array.isArray(doc.capabilities)) bad("capabilities must be an array");
  const capabilityIds = new Set<string>();
  for (const fact of Array.isArray(doc.capabilities) ? doc.capabilities as Record<string, unknown>[] : []) {
    if (!isObject(fact)) { bad("capability must be an object"); continue; }
    if (typeof fact.id !== "string" || !fact.id.length || capabilityIds.has(fact.id)) bad("capability identity missing or duplicated");
    else capabilityIds.add(fact.id);
    if (fact.subjectKind === "function" && !nodeIds.has(fact.subjectId as string)) bad("capability function subject absent");
    if (!artifactBySha.has(isObject(fact.provenance) ? fact.provenance.moduleSha256 as string : "")) bad("capability module absent");
    if (!Array.isArray(fact.evidence) || fact.evidence.length === 0) bad("capability fact requires nonempty evidence");
    else for (const item of fact.evidence as Record<string, unknown>[]) {
      if (!isObject(item) || typeof item.id !== "string" || item.id.length === 0 || typeof item.source !== "string" || !isSha(item.sha256) || typeof item.detail !== "string" || item.detail.length === 0) bad("capability evidence item malformed");
    }
    if (!isProvenance(fact.provenance)) bad("capability provenance missing or malformed (ADR-008)");
    else if (fact.subjectKind === "function" && fact.provenance.moduleSha256 !== nodeById.get(fact.subjectId as string)?.moduleSha256) bad("capability provenance does not bind the function subject module");
    else if (fact.subjectKind === "function" && fact.provenance.siteKind === "instruction" && fact.provenance.siteRva !== null) {
      const subject = nodeById.get(fact.subjectId as string);
      if (subject && (subject.boundaries as ChunkSpan[]).length && !siteInKnownChunks(subject, fact.provenance.siteRva)) bad("capability instruction site is outside subject function chunks");
      else if (subject && !(subject.boundaries as ChunkSpan[]).length && isObject(doc.coverage) && doc.coverage.status === "complete") bad("complete coverage cannot certify a capability instruction site without subject function chunks");
    }
  }
  const scope = doc.scope;
  if (!isObject(scope)) bad("scope must be an object");
  else {
    if (scope.functionCount !== (Array.isArray(nodes) ? nodes.length : -1)) bad("functionCount mismatch");
    if (!Array.isArray(scope.moduleSha256s) || canonical(scope.moduleSha256s) !== canonical([...artifactBySha.keys()].sort(compareText))) bad("scope module hashes mismatch");
  }
  const coverage = doc.coverage;
  if (!isObject(coverage)) bad("coverage must be an object");
  else {
    if (coverage.selfLoopsPreserved !== true && coverage.status === "complete") bad("complete coverage cannot drop self-loops (ADR-005)");
    if (typeof coverage.selfLoopsPreserved !== "boolean" || typeof coverage.tailsIterated !== "boolean") bad("coverage flags must be explicit booleans");
    if (!["complete", "partial", "diagnostic"].includes(String(coverage.status))) bad("unknown coverage status");
    if (!coverage.tailsIterated && coverage.status === "complete") bad("complete coverage cannot hide unknown tails");
    if (coverage.status === "complete" && coverage.uncoveredReason !== null) bad("complete coverage cannot carry an uncovered reason");
    if (coverage.status !== "complete" && (typeof coverage.uncoveredReason !== "string" || coverage.uncoveredReason.length === 0)) bad("partial or diagnostic coverage needs an explicit reason");
  }
  if (!isSha(doc.normalizedFingerprint)) bad("normalizedFingerprint is not a sha256");
  else if (doc.normalizedFingerprint !== fingerprintWithout(doc, "normalizedFingerprint")) bad("snapshot fingerprint does not match its content");
  if (!isSha(doc.configFingerprint)) bad("configFingerprint is not a sha256");
  if (!isObject(doc.toolVersions) || !isSha(doc.toolVersions.extractorHash)) bad("extractorHash is not a lowercase sha256");
  return v;
}
export function assertSnapshotContract(doc: unknown): GraphSnapshotV1 {
  const violations = validateGraphSnapshot(doc);
  if (violations.length > 0) throw new Error(`graph: snapshot violates the v1 contract:\n  - ${violations.join("\n  - ")}`);
  return doc as GraphSnapshotV1;
}
/** sha256(canonical(document without the digest field)) — CONTRAT.md §2 digest rule. */
export function fingerprintWithout(doc: unknown, field: string): Sha256 {
  const copy = { ...(doc as Record<string, unknown>) };
  delete copy[field];
  return hash(canonical(copy));
}

export function functionRelationKey(edge: Pick<FunctionEdgeV1, "sourceId" | "destinationId" | "kind">): string {
  return `relation:${hash(canonical({ sourceId: edge.sourceId, destinationId: edge.destinationId, kind: edge.kind }))}`;
}
/** Derived view, not a v1 transport edge: its union of sites may exceed 64. */
export interface FunctionRelationProjection extends Omit<FunctionEdgeV1, "id"> {
  id: string;
  relationKey: string;
  edgeRecordIds: string[];
}
export function projectFunctionRelations(snapshot: GraphSnapshotV1): FunctionRelationProjection[] {
  assertSnapshotContract(snapshot);
  const relations = new Map<string, FunctionRelationProjection>();
  for (const edge of snapshot.edges) {
    const relationKey = functionRelationKey(edge);
    const previous = relations.get(relationKey);
    if (!previous) { relations.set(relationKey, { ...structuredClone(edge), id: relationKey, relationKey, edgeRecordIds: [edge.id] }); continue; }
    for (const field of ["schemaVersion", "direction", "status", "confidence", "appearedInRevision", "retiredInRevision", "schedulerRelevance"] as const) if (previous[field] !== edge[field]) throw new Error(`graph: conflicting relation shard metadata ${relationKey}`);
    previous.sites.push(...structuredClone(edge.sites));
    previous.edgeRecordIds.push(edge.id);
  }
  for (const relation of relations.values()) {
    relation.edgeRecordIds.sort(compareText);
    relation.sites = [...new Map(relation.sites.map(site => [canonical(site), site])).values()].sort((a, b) => compareAddrValues(a.siteRva, b.siteRva) || compareText(canonical(a), canonical(b)));
  }
  return [...relations.values()].sort(compareEdges);
}
