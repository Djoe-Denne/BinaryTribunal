import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { canonical, hash } from "../src/validation";

const ROOT = join(import.meta.dir, "..");
const SCHEMAS = join(ROOT, "schemas");
const FIXTURES = join(ROOT, "test/fixtures/graph");
const SCHEMA_FILES = [
  "graph-snapshot-v1.schema.json",
  "cluster-partition-v1.schema.json",
  "investigation-group-v1.schema.json",
  "mission-plan-v1.schema.json",
  "work-unit-v1.schema.json",
  "work-attempt-v1.schema.json",
  "knowledge-delta-v1.schema.json",
  "knowledge-commit-v1.schema.json",
];
const BANNED = ["pattern", "patternProperties", "$ref", "$defs", "definitions", "allOf", "anyOf", "oneOf", "if", "then", "else", "not", "const", "format", "unevaluatedProperties", "dependentRequired", "dependentSchemas", "prefixItems", "contains", "propertyNames"];
const KIND_ORDER = ["direct_call", "tail_jump", "indirect_resolved", "thunk", "callback_candidate"];
const CODE_KINDS = new Set(["direct_call", "tail_jump", "indirect_resolved", "thunk"]);
const QUARANTINE = new Set(["0x465720", "0x495960", "0x48D200", "0x48FE20"]);
const FF8 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
interface SchemaNode { [key: string]: unknown }

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}
function walkSchema(node: unknown, visit: (schema: SchemaNode) => void): void {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return;
  const schema = node as SchemaNode;
  visit(schema);
  if (schema.properties && typeof schema.properties === "object") for (const child of Object.values(schema.properties as Record<string, unknown>)) walkSchema(child, visit);
  if (schema.items !== undefined) walkSchema(schema.items, visit);
}
function fail(path: string, detail: string): never {
  throw new Error(`${path} ${detail}`);
}
function matchesType(value: unknown, type: unknown): boolean {
  switch (type) {
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    case "integer": return typeof value === "number" && Number.isSafeInteger(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "array": return Array.isArray(value);
    case "object": return value !== null && typeof value === "object" && !Array.isArray(value);
    default: return false;
  }
}
function validateNode(value: unknown, schema: SchemaNode, path: string): void {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.some(type => matchesType(value, type))) fail(path, `must match type ${JSON.stringify(schema.type)}`);
  if (schema.enum !== undefined && !(schema.enum as unknown[]).some(option => option === value)) fail(path, `must be one of ${JSON.stringify(schema.enum)}`);
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) fail(path, "shorter than minLength");
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) fail(path, "longer than maxLength");
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) fail(path, "below minimum");
    if (typeof schema.maximum === "number" && value > schema.maximum) fail(path, "above maximum");
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) fail(path, "too few items");
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) fail(path, "too many items");
    const items = schema.items as SchemaNode | undefined;
    if (!items) fail(path, "has no items schema");
    value.forEach((item, index) => validateNode(item, items, `${path}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = (schema.properties ?? {}) as Record<string, SchemaNode>;
    const required = Array.isArray(schema.required) ? schema.required as string[] : [];
    for (const key of required) if (!(key in (value as Record<string, unknown>))) fail(path, `missing ${key}`);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (properties[key] === undefined) fail(path, `unexpected ${key}`);
      validateNode((value as Record<string, unknown>)[key], properties[key]!, `${path}.${key}`);
    }
  }
}
function addr(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x[0-9A-F]+$/.test(value)) return null;
  if (value.length > 3 && value[2] === "0") return null;
  return BigInt(value);
}
function compareAddr(a: string, b: string): number {
  const d = BigInt(a) - BigInt(b);
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}
function splitFn(id: string): [string, string] | null {
  const idx = id.lastIndexOf(":0x");
  if (idx < 0) return null;
  return [id.slice(0, idx), id.slice(idx + 1)];
}
function compareFn(a: string, b: string): number {
  const left = splitFn(a), right = splitFn(b);
  if (!left || !right) return a < b ? -1 : a > b ? 1 : 0;
  if (left[0] !== right[0]) return left[0] < right[0] ? -1 : 1;
  return compareAddr(left[1], right[1]);
}
function sortedCopy(ids: string[]): string[] {
  return [...ids].sort(compareFn);
}
function keysDeep(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach(item => keysDeep(item, found));
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) { found.push(key); keysDeep(child, found); }
  return found;
}
function checkUnknownable(value: any, path: string, violations: string[]) {
  if (!value || typeof value !== "object" || !("known" in value) || !("value" in value)) return;
  if (value.known === false && value.value !== null) violations.push(`${path} unknown metric encoded as a value`);
  if (value.known === true && (typeof value.value !== "number" || value.value < 0)) violations.push(`${path} known metric missing a non-negative value`);
  if (value.known === false && value.value === 0) violations.push(`${path} uses zero as unknown`);
}
function fingerprintWithout(doc: any, field: string): string {
  const copy = { ...doc };
  delete copy[field];
  return hash(canonical(copy));
}
function graphViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.normalizedFingerprint !== fingerprintWithout(doc, "normalizedFingerprint")) violations.push("normalizedFingerprint mismatch");
  if (doc.scope.functionCount !== doc.nodes.length) violations.push("functionCount mismatch");
  if (doc.coverage.selfLoopsPreserved !== true) violations.push("self-loop preservation is required");
  if (doc.coverage.status === "complete" && doc.coverage.uncoveredReason !== null) violations.push("complete coverage cannot carry an uncovered reason");
  if (doc.coverage.status !== "complete" && (typeof doc.coverage.uncoveredReason !== "string" || doc.coverage.uncoveredReason.length === 0)) violations.push("partial or diagnostic coverage needs an explicit reason");
  const nodeIds = new Set(doc.nodes.map((n: any) => n.id));
  const objectIds = new Set(doc.objects.map((o: any) => o.id));
  const artifacts = new Map(doc.binaryArtifacts.map((a: any) => [a.contentSha256, a]));
  for (let i = 1; i < doc.nodes.length; i++) if (compareFn(doc.nodes[i - 1].id, doc.nodes[i].id) > 0) violations.push("nodes are not canonically ordered");
  for (const node of doc.nodes) {
    const rva = addr(node.rva), ea = addr(node.ea), base = addr(node.imageBase);
    if (rva === null || rva <= 0n) violations.push(`function RVA is zero or uncanonical: ${node.rva}`);
    if (ea === null || ea <= 0n) violations.push(`function EA is zero or uncanonical: ${node.ea}`);
    if (base === null || rva === null || ea === null || ea !== base + rva) violations.push(`EA is not imageBase + RVA for ${node.id}`);
    if (node.id !== `${node.moduleSha256}:${node.rva}`) violations.push(`function id is not module hash + RVA: ${node.id}`);
    if (!/^[a-f0-9]{64}$/.test(node.moduleSha256)) violations.push("module hash is not lowercase sha256");
    const artifact = artifacts.get(node.moduleSha256) as any;
    if (!artifact || artifact.imageBase !== node.imageBase) violations.push(`node image base does not match its artifact: ${node.id}`);
    checkUnknownable(node.sizeBytes, `${node.id}.sizeBytes`, violations);
    checkUnknownable(node.instructionCount, `${node.id}.instructionCount`, violations);
    checkUnknownable(node.basicBlockCount, `${node.id}.basicBlockCount`, violations);
    if (node.admissibleAsOracle !== false) violations.push("oracle admission is forbidden in v1");
    if (node.status === "quarantined" && ["reconciled", "published-local"].includes(node.semanticMaturity)) violations.push("quarantined node cannot be semantically published");
    const div = node.byteDivergence;
    if (div.known === false && (div.peMismatchByteCount !== null || div.frozenSha256 !== null || div.peSha256 !== null || node.byteAgreement !== "unknown")) violations.push("unknown byte divergence is not explicit");
    if (div.known === true && div.peMismatchByteCount === 0 && node.byteAgreement !== "concordant") violations.push("known zero mismatches must be concordant, not unknown");
    if (div.known === true && div.peMismatchByteCount > 0) {
      if (node.byteAgreement !== "divergent" || node.status !== "quarantined") violations.push("divergent bytes must be quarantined");
      if (div.frozenSha256 === div.peSha256 || !/^[a-f0-9]{64}$/.test(div.frozenSha256 ?? "") || !/^[a-f0-9]{64}$/.test(div.peSha256 ?? "")) violations.push("divergent citation needs two distinct hashes");
    }
  }
  for (let i = 1; i < doc.edges.length; i++) {
    const prev = doc.edges[i - 1], next = doc.edges[i];
    const cmp = compareFn(prev.sourceId, next.sourceId) || compareFn(prev.destinationId, next.destinationId) || KIND_ORDER.indexOf(prev.kind) - KIND_ORDER.indexOf(next.kind) || compareAddr(prev.sites[0].siteRva, next.sites[0].siteRva);
    if (cmp > 0) violations.push("edges are not canonically ordered");
  }
  for (const edge of doc.edges) {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.destinationId)) violations.push(`edge endpoint is not a function: ${edge.id}`);
    if (objectIds.has(edge.destinationId) || objectIds.has(edge.sourceId)) violations.push("data object used as a callee");
    if (edge.direction !== "source_to_destination") violations.push("call direction reversed");
    if (edge.kind === "callback_candidate") {
      if (edge.status === "observed" || edge.status === "validated" || edge.schedulerRelevance !== "hypothesis_not_call") violations.push("callback candidate promoted toward a call");
      if (edge.sites.some((site: any) => site.xrefType !== "data")) violations.push("callback candidate has a code site");
    }
    if (CODE_KINDS.has(edge.kind) && edge.sites.some((site: any) => site.xrefType !== "code")) violations.push("code edge has a DATA site");
    for (const site of edge.sites) if (addr(site.siteRva) === null || addr(site.siteRva)! <= 0n) violations.push("edge site RVA is zero");
  }
  for (const object of doc.objects) {
    if (nodeIds.has(object.id)) violations.push("object id collides with a function id");
    if (object.kind === "import" && object.rva !== null) violations.push("pure import must not be given a fake local RVA in this fixture shape");
    if (object.rva !== null && (addr(object.rva) === null || addr(object.rva)! <= 0n)) violations.push("object RVA is zero");
    checkUnknownable(object.widthBytes, object.id, violations);
  }
  for (const item of doc.unresolved) {
    if (item.fabricatedFunction !== false) violations.push("fabricated function");
    if (!nodeIds.has(item.fromFunctionId)) violations.push("unresolved reference has no source function");
    if (addr(item.siteRva) === null || addr(item.siteRva)! <= 0n) violations.push("unresolved site is zero");
    if (item.referencedObjectId !== null && !objectIds.has(item.referencedObjectId)) violations.push("unresolved object missing");
    if (item.kind === "data_xref" && item.provenance.xrefType !== "data") violations.push("DATA xref provenance is not data");
  }
  return violations;
}
function clusterViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.partitionId === doc.lineageId) violations.push("partition content and lineage collapsed");
  if (doc.seed === "0" || doc.seed.trim() === "") violations.push("seed is a silent zero");
  checkUnknownable(doc.modularity, "modularity", violations);
  const ids = new Set<string>();
  for (const community of doc.communities) {
    if (community.contentId === community.lineageId || community.parentContentIds.includes(community.contentId)) violations.push("community reused its content id as lineage or parent");
    const expected = hash(canonical({ algorithm: doc.algorithm, algorithmVersion: doc.algorithmVersion, configFingerprint: doc.configFingerprint, memberIds: community.memberIds }));
    if (community.contentId !== expected) violations.push("community content id mismatch");
    if (JSON.stringify(community.memberIds) !== JSON.stringify(sortedCopy(community.memberIds))) violations.push("community members are not ordered");
    if (ids.has(community.contentId)) violations.push("duplicate community content id");
    ids.add(community.contentId);
    const members = new Set(community.memberIds);
    if (community.kernelIds.some((id: string) => !members.has(id))) violations.push("kernel escapes membership");
    if (community.externalContextIds.some((id: string) => members.has(id))) violations.push("context fused into membership");
    checkUnknownable(community.conductance, "conductance", violations);
  }
  return violations;
}
function groupViolations(doc: any): string[] {
  const violations: string[] = [];
  const owned = new Set(doc.ownedFunctionIds), context = new Set(doc.contextFunctionIds);
  if ([...owned].some(id => context.has(id))) violations.push("context function is also owned");
  if (JSON.stringify(doc.ownedFunctionIds) !== JSON.stringify(sortedCopy(doc.ownedFunctionIds))) violations.push("owned functions are not ordered");
  for (const item of doc.memberMaturity) if (!owned.has(item.functionId) && !context.has(item.functionId)) violations.push("maturity outside owned/context");
  checkUnknownable(doc.estimatedCost, "estimatedCost", violations);
  return violations;
}
function planViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.fingerprint !== fingerprintWithout(doc, "fingerprint")) violations.push("plan fingerprint mismatch");
  if (doc.budgets.unit !== "utf8-bytes" || doc.budgets.countsSqliteLength !== false) violations.push("budget is not UTF-8 bytes");
  const units = new Map(doc.units.map((unit: any) => [unit.unitId, unit]));
  const included = doc.decisions.filter((decision: any) => decision.action === "include").map((decision: any) => decision.unitId).sort();
  if (JSON.stringify([...doc.selectedUnitIds].sort()) !== JSON.stringify(included)) violations.push("selected units do not match include decisions");
  const selected = new Set(doc.selectedUnitIds);
  for (const pre of doc.prerequisites) {
    if (pre.kind === "obligatory" && pre.dispensed === false && pre.producerUnitId && selected.has(pre.consumerUnitId) && !selected.has(pre.producerUnitId)) violations.push("budget selection omitted an obligatory callee");
    if (pre.dispensed === true && (typeof pre.dispensationReason !== "string" || pre.dispensationReason.length === 0)) violations.push("dispensation has no reason");
  }
  for (const edge of doc.g1Edges) {
    const from = units.get(edge.fromUnitId) as any, to = units.get(edge.toUnitId) as any;
    if (!from || !to) violations.push("G1 endpoint missing");
    else {
      if (!from.ownedFunctionIds.includes(edge.callDestinationFunctionId)) violations.push("G1 from-unit does not own the callee");
      if (!to.ownedFunctionIds.includes(edge.callSourceFunctionId)) violations.push("G1 to-unit does not own the caller");
    }
    if (edge.storedCallDirection !== "source_to_destination") violations.push("stored call direction reversed");
  }
  for (const conflict of doc.g2Conflicts) if (conflict.resourceKey.includes(doc.partitionId)) violations.push("conflict key depends on partition id");
  for (const affinity of doc.g3Affinities) if (affinity.blocking !== false) violations.push("G3 blocks");
  for (const scc of doc.sccs) if (scc.selfLoopPreserved !== true) violations.push("SCC input dropped a self-loop");
  for (const unit of doc.units) checkUnknownable(unit.contextEnvelopeUtf8Bytes, unit.unitId, violations);
  return violations;
}
function unitViolations(doc: any): string[] {
  const violations: string[] = [];
  const owned = new Set(doc.ownedFunctionIds), context = new Set(doc.contextFunctionIds);
  if ([...owned].some(id => context.has(id))) violations.push("context is owned");
  if (doc.pipeline !== "2+1") violations.push("pipeline is not 2+1");
  const byFunction = new Map<string, any[]>();
  for (const sub of doc.subIntents) {
    if (!owned.has(sub.functionId) || context.has(sub.functionId)) violations.push("sub-intent is not exactly one owned function");
    const parsed = splitFn(sub.functionId);
    if (!parsed || sub.harnessIdentity.sha256 !== parsed[0] || sub.harnessIdentity.ea === "0x0") violations.push("harness projection is not one function");
    if (sub.sharesFamilyLease !== true || sub.outputDisjoint !== true) violations.push("family lease or output isolation missing");
    byFunction.set(sub.functionId, [...(byFunction.get(sub.functionId) ?? []), sub]);
  }
  for (const [functionId, subs] of byFunction) {
    const byRole = new Map(subs.map(sub => [sub.role, sub]));
    if (byRole.get("R")) {
      const waits = new Set(byRole.get("R").waitsForSubIntentIds);
      if (!byRole.get("A") || !byRole.get("B") || !waits.has(byRole.get("A").subIntentId) || !waits.has(byRole.get("B").subIntentId)) violations.push(`R does not wait for A and B of ${functionId}`);
    }
    for (const role of ["A", "B"]) if (byRole.get(role)?.waitsForSubIntentIds.length) violations.push("A/B waits inside the family");
  }
  if ([...context].some(id => doc.subIntents.some((sub: any) => sub.functionId === id))) violations.push("context created work");
  checkUnknownable(doc.estimatedCost, "estimatedCost", violations);
  return violations;
}
function attemptViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.state === "COMMITTED") violations.push("attempt published alone");
  if (doc.previousAttemptIds.length !== doc.attemptNumber - 1) violations.push("attempt lineage incomplete");
  if (doc.state === "RUNNING" && doc.errorClass !== "none") violations.push("running attempt has an error class");
  if (doc.lease.expiresAtEvent < 0) violations.push("lease expiry is not a replay event");
  return violations;
}
function deltaViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.deltaId !== fingerprintWithout(doc, "deltaId")) violations.push("delta idempotency key mismatch");
  if (String(doc.origin).startsWith("bulletin")) violations.push("bulletin treated as knowledge");
  if (doc.validation === "parent-validated" && doc.evidence.length === 0) violations.push("validated delta has no evidence");
  if (doc.potentialImpact === "none" && (doc.fromRevision !== doc.toRevision || doc.affectedFunctionIds.length || doc.factIds.length)) violations.push("empty delta is not empty");
  if (doc.toRevision !== doc.fromRevision && doc.toRevision !== doc.fromRevision + 1) violations.push("delta revision skipped");
  return violations;
}
function commitViolations(doc: any): string[] {
  const violations: string[] = [];
  if (doc.commitId !== fingerprintWithout(doc, "commitId")) violations.push("commit idempotency key mismatch");
  if (doc.isGitCommit !== false) violations.push("scientific commit confused with git");
  if (doc.outputRevision !== doc.inputRevision + 1) violations.push("commit revision is not incremental");
  if (doc.futurePrerequisiteEffect === "satisfies" && doc.readbackStatus !== "verified") violations.push("unverified readback satisfies a prerequisite");
  if (/idb/i.test(doc.publicationTargetId)) violations.push("IDB target is outside this mission");
  if (![1, 2].includes(doc.publicationLevel)) violations.push("publication level is not 1 or 2");
  return violations;
}
const CHECKS: Record<string, (doc: any) => string[]> = {
  "graph-snapshot-v1.schema.json": graphViolations,
  "cluster-partition-v1.schema.json": clusterViolations,
  "investigation-group-v1.schema.json": groupViolations,
  "mission-plan-v1.schema.json": planViolations,
  "work-unit-v1.schema.json": unitViolations,
  "work-attempt-v1.schema.json": attemptViolations,
  "knowledge-delta-v1.schema.json": deltaViolations,
  "knowledge-commit-v1.schema.json": commitViolations,
};

describe("graph contract schemas", () => {
  test("new schemas stay inside the strict harness subset and do not replace existing schemas", () => {
    for (const name of ["mission-v1.schema.json", "worker-result-v1.schema.json", "re-policy-v1.schema.json"]) {
      expect(readJson(join(SCHEMAS, name)).$id).toContain("re-ff8.local");
    }
    for (const file of SCHEMA_FILES) {
      const schema = readJson(join(SCHEMAS, file));
      expect(schema.additionalProperties).toBe(false);
      walkSchema(schema, node => {
        for (const banned of BANNED) expect(node).not.toHaveProperty(banned);
        const types = Array.isArray(node.type) ? node.type : [node.type];
        for (const type of types) if (type !== undefined) expect(["string", "number", "integer", "boolean", "null", "object", "array"]).toContain(type);
        if (types.includes("object")) {
          expect(node.additionalProperties).toBe(false);
          expect([...(node.required as string[])].sort()).toEqual(Object.keys(node.properties as Record<string, unknown>).sort());
        }
        if (types.includes("array")) expect(node.items).toBeDefined();
      });
    }
    const attempt = readJson(join(SCHEMAS, "work-attempt-v1.schema.json"));
    const unit = readJson(join(SCHEMAS, "work-unit-v1.schema.json"));
    expect((attempt.properties as any).state.enum).not.toContain("COMMITTED");
    expect((unit.properties as any).state.enum).toContain("COMMITTED");
    expect((unit.properties as any).requiredPublicationLevel.enum).toEqual([1, 2]);
  });
});

describe("graph contract fixtures", () => {
  const dirs = readdirSync(FIXTURES, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  test("covers the required structural and FF8 cases", () => {
    for (const id of ["communities-obvious", "components-disconnected", "hubs-utilities", "cycles-recursion", "indirect-uncertain", "isolates", "bridges-rare", "shared-data", "synonym-descriptions", "near-descriptions-distinct-modules", "partial-maturity", "knowledge-new", "knowledge-empty", "overlapping-contexts", "lineage-split", "lineage-merge", "ff8-chunks-tails", "ff8-data-callback-not-call", "ff8-imports-thunks", "ff8-self-loop", "ff8-identity-rename", "ff8-same-name-different-hash", "ff8-multi-module", "ff8-unknown-metrics", "ff8-idb-pe-quarantine", "budget-omits-callee", "budget-defers-consumer", "utf8-probe"]) {
      expect(dirs).toContain(id);
    }
  });

  for (const id of dirs) {
    test(id, () => {
      const dir = join(FIXTURES, id);
      const manifest = readJson(join(dir, "manifest.json"));
      const content = readJson(join(dir, "content.json"));
      const reordered = readJson(join(dir, "reordered.json"));
      const volatile = readJson(join(dir, "volatile.json"));
      const schema = readJson(join(SCHEMAS, manifest.schemaFile));
      expect(manifest.oracle).toBe(false);
      expect(manifest.volatileKeys.every((key: string) => !(key in content))).toBe(true);
      expect(keysDeep(content).some(key => manifest.volatileKeys.includes(key))).toBe(false);
      expect(Object.keys(volatile).sort()).toEqual([...manifest.volatileKeys].sort());
      expect(hash(canonical(content))).toBe(manifest.contentSha256);
      expect(canonical(content)).toBe(canonical(reordered));
      expect(hash(canonical(schema))).toBe(manifest.schemaCanonicalSha256);
      let schemaError = "";
      try { validateNode(content, schema, id); } catch (error) { schemaError = error instanceof Error ? error.message : String(error); }
      if (manifest.expectedSchema === "accept") expect(schemaError).toBe("");
      else expect(schemaError.length).toBeGreaterThan(0);
      if (manifest.expectedSchema === "accept") {
        const violations = CHECKS[manifest.schemaFile]!(content);
        if (manifest.expectedContract === "accept") expect(violations).toEqual([]);
        else expect(violations.length).toBeGreaterThan(0);
      }
      for (const extra of manifest.extraContents ?? []) {
        const extraDoc = readJson(join(dir, extra.file));
        expect(hash(canonical(extraDoc))).toBe(extra.contentSha256);
        expect(() => validateNode(extraDoc, schema, extra.file)).not.toThrow();
        expect(CHECKS[manifest.schemaFile]!(extraDoc)).toEqual([]);
      }
    });
  }

  test("FF8 invariants: self-loop, callback, import, chunks, quarantine, identity, utf8, budget", () => {
    const self = readJson(join(FIXTURES, "ff8-self-loop/content.json"));
    expect(self.edges).toHaveLength(1);
    expect(self.edges[0].sourceId).toBe(self.edges[0].destinationId);
    const callback = readJson(join(FIXTURES, "ff8-data-callback-not-call/content.json"));
    expect(callback.edges.every((edge: any) => edge.kind === "callback_candidate" && edge.schedulerRelevance === "hypothesis_not_call")).toBe(true);
    expect(callback.edges.some((edge: any) => CODE_KINDS.has(edge.kind))).toBe(false);
    const imports = readJson(join(FIXTURES, "ff8-imports-thunks/content.json"));
    expect(imports.objects.some((object: any) => object.kind === "import" && object.rva === null)).toBe(true);
    expect(imports.edges.every((edge: any) => edge.kind === "thunk")).toBe(true);
    expect(imports.nodes.some((node: any) => node.rva === "0x0" || node.ea === "0x0")).toBe(false);
    const chunks = readJson(join(FIXTURES, "ff8-chunks-tails/content.json"));
    const chunked = chunks.nodes.find((node: any) => node.boundaries.some((span: any) => span.role === "tail"));
    const tail = chunked.boundaries.find((span: any) => span.role === "tail");
    const jump = chunks.edges.find((edge: any) => edge.kind === "tail_jump");
    expect(BigInt(jump.sites[0].siteRva) >= BigInt(tail.rva) && BigInt(jump.sites[0].siteRva) < BigInt(tail.endRvaExclusive)).toBe(true);
    const quarantine = readJson(join(FIXTURES, "ff8-idb-pe-quarantine/content.json"));
    const quarantined = quarantine.nodes.filter((node: any) => node.status === "quarantined");
    expect(quarantined.map((node: any) => node.ea).sort()).toEqual([...QUARANTINE].sort());
    expect(quarantine.binaryArtifacts[0].contentSha256).toBe(FF8);
    expect(quarantined.every((node: any) => node.byteDivergence.frozenSha256 !== node.byteDivergence.peSha256 && node.admissibleAsOracle === false)).toBe(true);
    const concordant = quarantine.nodes.find((node: any) => node.ea === "0x460860");
    expect(concordant.byteAgreement).toBe("concordant");
    expect(concordant.admissibleAsOracle).toBe(false);
    const rename = readJson(join(FIXTURES, "ff8-identity-rename/content.json"));
    const renamed = readJson(join(FIXTURES, "ff8-identity-rename/twin-renamed.json"));
    const rebased = readJson(join(FIXTURES, "ff8-identity-rename/twin-rebased.json"));
    expect(rename.nodes[0].id).toBe(renamed.nodes[0].id);
    expect(rename.nodes[0].id).toBe(rebased.nodes[0].id);
    expect(rename.nodes[0].name).not.toBe(renamed.nodes[0].name);
    expect(rename.nodes[0].ea).not.toBe(rebased.nodes[0].ea);
    expect(rename.nodes[0].rva).toBe(rebased.nodes[0].rva);
    const sameName = readJson(join(FIXTURES, "ff8-same-name-different-hash/content.json"));
    expect(sameName.nodes[0].name).toBe(sameName.nodes[1].name);
    expect(sameName.nodes[0].id).not.toBe(sameName.nodes[1].id);
    const modules = readJson(join(FIXTURES, "ff8-multi-module/content.json"));
    expect(modules.binaryArtifacts).toHaveLength(2);
    expect(modules.nodes[0].rva).toBe(modules.nodes[1].rva);
    expect(modules.nodes[0].id).not.toBe(modules.nodes[1].id);
    const unknown = readJson(join(FIXTURES, "ff8-unknown-metrics/content.json"));
    expect(unknown.nodes[0].sizeBytes).toEqual({ known: false, value: null });
    expect(unknown.nodes[0].instructionCount).toEqual({ known: true, value: 0 });
    const omitted = readJson(join(FIXTURES, "budget-omits-callee/content.json"));
    expect(planViolations(omitted).some(item => item.includes("obligatory callee"))).toBe(true);
    const deferred = readJson(join(FIXTURES, "budget-defers-consumer/content.json"));
    expect(planViolations(deferred)).toEqual([]);
    expect(deferred.selectedUnitIds).not.toContain("unit:caller");
    const probe = readJson(join(FIXTURES, "utf8-probe/content.json"));
    const name = probe.nodes[0].name as string;
    const description = probe.nodes[0].observedDescription as string;
    expect(Buffer.byteLength(name, "utf8")).toBeGreaterThan(name.length);
    expect(Buffer.byteLength(description, "utf8")).toBeGreaterThan(description.length);
    const db = new Database(":memory:");
    db.exec("CREATE TABLE probe(value TEXT)");
    const insert = db.query("INSERT INTO probe(value) VALUES (?)");
    const chars = db.query<{ n: number }, []>("SELECT length(value) AS n FROM probe");
    const bytes = db.query<{ n: number }, []>("SELECT length(cast(value AS BLOB)) AS n FROM probe");
    for (const text of [name, description, "café"]) {
      db.exec("DELETE FROM probe");
      insert.run(text);
      expect(bytes.get()!.n).toBe(Buffer.byteLength(text, "utf8"));
      expect(chars.get()!.n).toBeLessThan(bytes.get()!.n);
    }
    db.close();
  });
});
