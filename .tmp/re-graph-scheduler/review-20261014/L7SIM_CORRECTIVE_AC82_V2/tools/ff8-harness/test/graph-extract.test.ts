// L2 — unit tests for graph extraction/normalization and local capabilities.
// Sources: the L1 contract fixtures (read-only) and the five tracked native
// registries (read-only). No IDA, no LLM, no network; everything below is
// offline and deterministic.
import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { canonical, hash } from "../src/validation";
import {
  FF8_MODULE_SHA256, FunctionEdgeV1, GraphSnapshotV1, MAX_EDGE_SITES, QUARANTINE_EAS,
  canonicalAddr, compareFnIds, fnId, metricKnown, metricUnknown, validateGraphSnapshot,
  assertSnapshotContract, validateGraphSnapshotSchema, validateStaticJsonSchema, fingerprintWithout, functionRelationKey, projectFunctionRelations,
} from "../src/graph";
import {
  BASELINE_ALGORITHM_VERSION, BaselineGroup, Ff8AdapterResult, IndirectDocument,
  LedgerDocument, MagicDocument, PeVerificationDocument, Run01BaselineDocument,
   assertBaselineMatches, baselineFromRun01, buildFf8GraphSnapshot, buildGraphSnapshot,
   indirectSiteKey, FF8_INDIRECT_SITE_KEYS_SHA256,
   buildIndirectGraphFacts, withCapabilities, greedyBoundedGroups, GraphSnapshotCache, graphCacheKey,
} from "../src/graph-normalize";
import {
  CAPABILITY_RULESET_VERSION, CapabilityCache, DEFAULT_CAPABILITY_CONFIG, capabilityCacheKey,
  evaluateCapabilities, evaluateCapabilitiesCached, evaluateCapaAvailability, importCapaCapabilities,
} from "../src/capabilities";
import { planMission, type PlannerGraphInput, type PlannerPolicy } from "../src/planner";

const REPO = join(import.meta.dir, "..", "..", "..");
const DISCOVERY = join(REPO, "docs", "tech", "investigation", "battle-static-discovery");
const RUN01_DIR = join(REPO, "docs", "missions", "ff8-decomp-semantics-2026-10-11-run01");
const FIXTURES = join(import.meta.dir, "fixtures", "graph");
const readJson = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const fileSha = (path: string): string => hash(new Uint8Array(readFileSync(path)));
function schemaErrors(value: any, schema: any, path = "$", errors: string[] = []): string[] {
  if (schema.$ref || schema.oneOf || schema.anyOf) throw new Error("unsupported schema construct: test must not silently bypass it");
  const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.includes(actual) && !(actual === "integer" && types.includes("number"))) { errors.push(`${path}: type ${actual}`); return errors; }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: enum`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) errors.push(`${path}: minLength`);
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) errors.push(`${path}: maxLength`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: minimum`);
  if (actual === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: minItems`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: maxItems`);
    value.forEach((v: unknown, i: number) => schemaErrors(v, schema.items, `${path}[${i}]`, errors));
  }
  if (actual === "object") {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: required`);
    for (const [key, v] of Object.entries(value)) {
      if (schema.properties?.[key]) schemaErrors(v, schema.properties[key], `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unexpected`);
    }
  }
  return errors;
}

const LEDGER_PATH = join(DISCOVERY, "battle-graph-ledger.json");
const INDIRECT_PATH = join(DISCOVERY, "battle-indirect-registry.json");
const MAGIC_PATH = join(DISCOVERY, "magic-registry.json");
const RUN01_PATH = join(RUN01_DIR, "native-groups.json");
const VERIFY_PATH = join(RUN01_DIR, "native-pe-verification.json");
const MISSION_ID = "re-graph-scheduler-20261013";
const NATIVE_DIR = join(REPO, ".tmp", "ff8-decomp-semantics-20261011-r01", "native");
const NATIVE_MANIFEST = join(NATIVE_DIR, "TRANSFER_MANIFEST.json");
function frozenInputs(): Array<{ rawUtf8: string; sha256: string }> {
  const manifest = JSON.parse(readFileSync(NATIVE_MANIFEST, "utf8").replace(/^\uFEFF/, ""));
  expect(manifest.files).toBe(98);
  expect(manifest.entries.length).toBe(98);
  return manifest.entries.map((line: string) => {
    const [name, bytes, sha256] = line.split(" ");
    expect(name).toMatch(/^0x[0-9A-F]+\.json$/);
    const raw = readFileSync(join(NATIVE_DIR, name!));
    expect(raw.length).toBe(Number(bytes));
    expect(hash(new Uint8Array(raw))).toBe(sha256!);
    return { rawUtf8: raw.toString("utf8"), sha256: sha256! };
  });
}
function ff8Sources() {
  return {
    missionId: MISSION_ID,
    ledger: readJson(LEDGER_PATH) as LedgerDocument, ledgerSha256: fileSha(LEDGER_PATH),
    indirect: readJson(INDIRECT_PATH) as IndirectDocument, indirectSha256: fileSha(INDIRECT_PATH),
    magic: readJson(MAGIC_PATH) as MagicDocument, magicSha256: fileSha(MAGIC_PATH),
    run01: readJson(RUN01_PATH) as Run01BaselineDocument,
    peVerification: readJson(VERIFY_PATH) as PeVerificationDocument,
  };
}

// Heavy FF8 build shared across tests; built at most once per file run.
let ff8: Ff8AdapterResult | null = null;
function ff8Result(): Ff8AdapterResult {
  if (ff8 === null) {
    ff8 = buildFf8GraphSnapshot({ ...ff8Sources(), frozenFunctions: existsSync(NATIVE_MANIFEST) ? frozenInputs() : undefined });
  }
  return ff8!;
}

// ------------------------------------------------------- tiny builders ----

const MOD = "a".repeat(64);
const nodeAt = (rva: number, overrides: Partial<any> = {}): any => ({
  schemaVersion: 1,
  id: fnId(MOD, canonicalAddr(rva)),
  moduleSha256: MOD,
  rva: canonicalAddr(rva),
  ea: canonicalAddr(0x400000 + rva),
  imageBase: "0x400000",
  name: `sub_${rva.toString(16)}`,
  observedDescription: "",
  boundaries: [{ ordinal: 0, rva: canonicalAddr(rva), endRvaExclusive: canonicalAddr(rva + 0x10), role: "entry" }],
  sizeBytes: metricKnown(0x10),
  instructionCount: metricUnknown(),
  basicBlockCount: metricUnknown(),
  functionClass: "internal",
  status: "observed",
  semanticMaturity: "structural",
  analysisRefs: [],
  byteAgreement: "unknown",
  admissibleAsOracle: false,
  byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null },
  ...overrides,
});
const artifactFor = (): any => ({
  schemaVersion: 1,
  artifactId: `mod:${MOD}`,
  moduleName: "fixture.exe",
  contentSha256: MOD,
  versionLabel: "fixture-v1",
  format: "PE32",
  architecture: "x86-32",
  imageBase: "0x400000",
  idbIdentity: "",
  sections: [],
  provenance: {
    moduleSha256: MOD, siteRva: null, siteKind: "extractor", xrefType: "none",
    source: "test", sourceVersion: "v1", sourceHash: hash("test"), evidenceSha256: hash("test"),
  },
  analysisVersion: "test",
  extractorVersion: "test",
});
const site = (rva: number, xrefType: "code" | "data" = "code"): any => ({
  siteRva: canonicalAddr(rva),
  xrefType,
  provenance: {
    moduleSha256: MOD, siteRva: canonicalAddr(rva), siteKind: "instruction", xrefType,
    source: "test", sourceVersion: "v1", sourceHash: hash("test"), evidenceSha256: hash(`site${rva}`),
  },
});
const edge = (sourceId: string, destinationId: string, kind: FunctionEdgeV1["kind"], siteList: any[], overrides: Partial<any> = {}): FunctionEdgeV1 => ({
  schemaVersion: 1,
  id: "",
  sourceId,
  destinationId,
  kind,
  direction: "source_to_destination",
  sites: siteList,
  status: kind === "callback_candidate" ? "inferred" : "observed",
  confidence: kind === "callback_candidate" ? "low" : "high",
  appearedInRevision: 0,
  retiredInRevision: null,
  schedulerRelevance: kind === "callback_candidate" ? "hypothesis_not_call" : "may_block",
  ...overrides,
});
const build = (parts: Partial<any> = {}): GraphSnapshotV1 => buildGraphSnapshot({
  missionId: MISSION_ID,
  snapshotId: "snap:test",
  artifacts: [artifactFor()],
  nodes: [],
  edges: [],
  objects: [],
  unresolved: [],
  capabilities: [],
  knowledgeRevision: 0,
  scopeDescription: "test scope",
  coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true },
  toolVersions: { extractor: "test", extractorHash: hash("test"), normalizer: "test" },
  configFingerprint: hash("config"),
  ...parts,
}).snapshot;

// ---------------------------------------------------------------- tests ----

describe("graph primitives", () => {
  test("addresses are canonical: uppercase hex, no leading zeros, never zero", () => {
    expect(canonicalAddr(0x400000)).toBe("0x400000");
    expect(canonicalAddr(0x2)).toBe("0x2");
    expect(canonicalAddr(0x48d200)).toBe("0x48D200");
    expect(() => canonicalAddr(0)).toThrow(/out of range/);
    expect(() => fnId(MOD, "0x0")).toThrow(/uncanonical/);
  });
  test("function ids are module hash + RVA; numeric RVA ordering is not lexicographic", () => {
    expect(fnId(MOD, 0x10)).toBe(`${MOD}:0x10`);
    expect(compareFnIds(`${MOD}:0x2`, `${MOD}:0x10`)).toBeLessThan(0);
    expect(`${MOD}:0x10` < `${MOD}:0x2`).toBe(true); // lexicographic order would disagree
  });
  test("quarantined EA list matches the four known IDB/PE divergences", () => {
    expect([...QUARANTINE_EAS].sort()).toEqual(["0x465720", "0x48D200", "0x48FE20", "0x495960"]);
  });
});

describe("buildGraphSnapshot normalization", () => {
  const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000), C = fnId(MOD, 0x3000), D = fnId(MOD, 0x4000);
  const baseEdges = (): FunctionEdgeV1[] => [
    edge(A, B, "direct_call", [site(0x1004), site(0x1008)]),
    edge(A, B, "direct_call", [site(0x1002)]), // duplicate relation: sites merge
    edge(C, C, "direct_call", [site(0x3000)]), // self-loop
    edge(A, D, "callback_candidate", [site(0x1006, "data")]),
    edge(B, C, "tail_jump", [site(0x2000)]),
  ];
  test("relations dedupe while every site is kept; self-loops survive; output is canonically ordered", () => {
    const { snapshot, stats } = buildGraphSnapshot({
      missionId: MISSION_ID, snapshotId: "snap:test", artifacts: [artifactFor()],
      nodes: [nodeAt(0x4000), nodeAt(0x2000), nodeAt(0x1000), nodeAt(0x3000)],
      edges: baseEdges(), objects: [], unresolved: [], capabilities: [], knowledgeRevision: 0,
      scopeDescription: "test", coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true },
      toolVersions: { extractor: "t", extractorHash: hash("t"), normalizer: "t" }, configFingerprint: hash("c"),
    });
    expect(stats.mergedEdges).toBe(4);
    const direct = snapshot.edges.find(e => e.kind === "direct_call")!;
    expect(direct.sites.map(s => s.siteRva)).toEqual(["0x1002", "0x1004", "0x1008"]);
    const selfLoop = snapshot.edges.find(e => e.sourceId === e.destinationId)!;
    expect(selfLoop).toBeDefined();
    const ids = snapshot.nodes.map(n => n.id);
    expect(ids).toEqual([...ids].sort(compareFnIds));
    expect(snapshot.edges.map(e => e.id)).toEqual([...new Set(snapshot.edges.map(e => e.id))]);
    expect(snapshot.edges.every((e, i, all) => i === 0 || compareFnIds(all[i - 1]!.sourceId, e.sourceId) <= 0)).toBe(true);
  });
  test("digest is stable under input reordering and key reordering", () => {
    const first = build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(fnId(MOD, 0x1000), fnId(MOD, 0x2000), "direct_call", [site(0x1000)])] });
    const second = build({ nodes: [nodeAt(0x2000), nodeAt(0x1000)], edges: [edge(fnId(MOD, 0x1000), fnId(MOD, 0x2000), "direct_call", [site(0x1000)])] });
    expect(first.normalizedFingerprint).toBe(second.normalizedFingerprint);
  });
  test("site overflow uses lossless deterministic 64-site shards", () => {
    const X = fnId(MOD, 0x9000), Y = fnId(MOD, 0x9100);
    const sites = Array.from({ length: MAX_EDGE_SITES + 6 }, (_, i) => site(0x9000 + i * 2));
    const { snapshot, stats } = buildGraphSnapshot({
      missionId: MISSION_ID, snapshotId: "snap:test", artifacts: [artifactFor()],
    nodes: [nodeAt(0x9000, { boundaries: [{ ordinal: 0, rva: "0x9000", endRvaExclusive: "0x90A0", role: "entry" }], sizeBytes: metricKnown(0xA0) }), nodeAt(0x9100)], edges: [edge(X, Y, "direct_call", sites)],
      objects: [], unresolved: [], capabilities: [], knowledgeRevision: 0, scopeDescription: "test",
      coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true },
      toolVersions: { extractor: "t", extractorHash: hash("t"), normalizer: "t" }, configFingerprint: hash("c"),
    });
    expect(snapshot.edges[0]!.sites.length).toBe(MAX_EDGE_SITES);
    expect(snapshot.edges.reduce((n, e) => n + e.sites.length, 0)).toBe(sites.length);
    expect(stats.truncatedSiteEdges).toBe(0);
    expect(stats.shardedSiteRelations).toBe(1);
    const normalizedAgain = build({ ...snapshot, artifacts: snapshot.binaryArtifacts });
    expect(normalizedAgain.edges).toEqual(snapshot.edges);
  });
  test("contract violations fail the build (callback promotion, DATA callee, zero EA, unknown endpoint)", () => {
    const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000);
    const nodes = [nodeAt(0x1000), nodeAt(0x2000)];
    const common = { missionId: MISSION_ID, snapshotId: "snap:test", artifacts: [artifactFor()], objects: [], unresolved: [], capabilities: [], knowledgeRevision: 0, scopeDescription: "test", coverage: { status: "complete", uncoveredReason: null, tailsIterated: true, selfLoopsPreserved: true }, toolVersions: { extractor: "t", extractorHash: hash("t"), normalizer: "t" }, configFingerprint: hash("c") };
    expect(() => build({ ...common, nodes, edges: [edge(A, B, "callback_candidate", [site(0x1000, "data")], { status: "observed" })] })).toThrow(/callback/);
    expect(() => build({ ...common, nodes, edges: [edge(A, B, "direct_call", [site(0x1004, "data")])] })).toThrow(/DATA/);
    expect(() => build({ ...common, nodes: [nodeAt(0)], edges: [] })).toThrow();
    expect(() => build({ ...common, nodes: [nodeAt(0x1000)], edges: [edge(A, `${MOD}:0x9999`, "direct_call", [site(0x1000)])] })).toThrow(/endpoint/);
  });
});

describe("L1 fixture cross-check", () => {
  const ACCEPT = [
    "communities-obvious", "ff8-chunks-tails", "ff8-data-callback-not-call", "ff8-idb-pe-quarantine",
    "ff8-imports-thunks", "ff8-multi-module", "ff8-self-loop", "ff8-unknown-metrics",
  ];
  for (const id of ACCEPT) {
    test(`${id}: passes the L2 invariant checker and normalizes idempotently`, () => {
      const content = readJson(join(FIXTURES, id, "content.json"));
      expect(validateGraphSnapshot(content)).toEqual([]);
      const once = buildGraphSnapshot({
        missionId: content.missionId, snapshotId: content.snapshotId,
        artifacts: content.binaryArtifacts, nodes: content.nodes, edges: content.edges,
        objects: content.objects, unresolved: content.unresolved, capabilities: content.capabilities,
        knowledgeRevision: content.knowledgeRevision, scopeDescription: content.scope.description,
        coverage: content.coverage, toolVersions: content.toolVersions, configFingerprint: content.configFingerprint,
      }).snapshot;
      const twice = buildGraphSnapshot({
        missionId: once.missionId, snapshotId: once.snapshotId, artifacts: once.binaryArtifacts,
        nodes: once.nodes, edges: once.edges, objects: once.objects, unresolved: once.unresolved,
        capabilities: once.capabilities, knowledgeRevision: once.knowledgeRevision,
        scopeDescription: once.scope.description, coverage: once.coverage,
        toolVersions: once.toolVersions, configFingerprint: once.configFingerprint,
      }).snapshot;
      expect(canonical(twice)).toBe(canonical(once));
      expect(twice.normalizedFingerprint).toBe(once.normalizedFingerprint);
    });
  }
  for (const id of ["negative-data-as-callee", "negative-ea-zero", "negative-self-loop-stripped"]) {
    test(`${id}: rejected by the L2 invariant checker`, () => {
      const content = readJson(join(FIXTURES, id, "content.json"));
      expect(validateGraphSnapshot(content).length).toBeGreaterThan(0);
    });
  }
});

describe("r01 greedy baseline (versioned port)", () => {
  const run01 = () => readJson(RUN01_PATH) as Run01BaselineDocument;
  test("port reproduces the frozen native-groups.json grouping exactly", () => {
    const doc = run01();
    const groups = baselineFromRun01(doc);
    expect(BASELINE_ALGORITHM_VERSION).toBe("v1");
    expect(groups.length).toBe(36);
    expect(groups.reduce((sum, group) => sum + group.eas.length, 0)).toBe(98);
    expect(groups.every(group => group.eas.length <= 6)).toBe(true);
    expect(groups.map(group => group.id)).toEqual(Array.from({ length: 36 }, (_, i) => `g${String(i + 1).padStart(2, "0")}`));
    assertBaselineMatches(doc, groups);
  });
  test("the port is deterministic", () => {
    const doc = run01();
    const first: BaselineGroup[] = greedyBoundedGroups(doc.graph);
    const second: BaselineGroup[] = greedyBoundedGroups(doc.graph);
    expect(canonical(first)).toBe(canonical(second));
  });
});

describe("FF8 native snapshot from tracked registries", () => {
  const snapshot = (): GraphSnapshotV1 => ff8Result().snapshot;
  test("builds once, validates, and self-consistent digest", () => {
    const doc = snapshot();
    expect(validateGraphSnapshot(doc)).toEqual([]);
    expect(doc.scope.functionCount).toBe(doc.nodes.length);
    expect(doc.missionId).toBe(MISSION_ID);
    expect(doc.snapshotId.startsWith(`snap:${MISSION_ID}:`)).toBe(true);
  }, 120000);
  test("export with capability facts fits the complete frozen strict transport schema", () => {
    const doc = withCapabilities(snapshot(), evaluateCapabilities(snapshot()));
    const schema = readJson(join(import.meta.dir, "..", "schemas", "graph-snapshot-v1.schema.json"));
    expect(schemaErrors(JSON.parse(JSON.stringify(doc)), schema)).toEqual([]);
  }, 120000);
  test("node count = ledger closure + CRT stop-set terminals + resolved indirect targets", () => {
    const ledger = readJson(LEDGER_PATH) as LedgerDocument;
    expect(snapshot().nodes.length).toBe(ledger.nodes.length + ledger.stopped_crt_targets.length + 2);
  }, 120000);
  test("callback candidates stay hypotheses with DATA sites and every site preserved", () => {
    const ledger = readJson(LEDGER_PATH) as LedgerDocument;
    const doc = snapshot();
    const callbackEdges = doc.edges.filter(e => e.kind === "callback_candidate");
    expect(callbackEdges.length).toBeGreaterThan(0);
    expect(callbackEdges.every(e => e.status === "inferred" && e.schedulerRelevance === "hypothesis_not_call")).toBe(true);
    expect(callbackEdges.every(e => e.sites.every(s => s.xrefType === "data"))).toBe(true);
    const callbackSiteTotal = callbackEdges.reduce((sum, e) => sum + e.sites.length, 0);
    const ledgerCallbacks = ledger.edges.filter(e => e.kind === "callback_candidate").length;
    expect(callbackSiteTotal).toBe(ledgerCallbacks);
    const directSiteTotal = doc.edges.filter(e => e.kind === "direct_call").reduce((sum, e) => sum + e.sites.length, 0);
    const tailSiteTotal = doc.edges.filter(e => e.kind === "tail_jump").reduce((sum, e) => sum + e.sites.length, 0);
    expect(directSiteTotal).toBe(ledger.edges.filter(e => e.kind === "direct_call").length);
    expect(tailSiteTotal).toBe(ledger.edges.filter(e => e.kind === "tail").length);
  }, 120000);
  test("64-site cap never silently drops sites", () => {
    const { stats } = ff8Result();
    expect(stats.truncatedSiteEdges).toBe(0);
    expect(stats.shardedSiteRelations).toBe(1);
    expect(stats.inputEdges).toBe(readJson(LEDGER_PATH).edges.length + 2);
  }, 120000);
  test("the four divergent EAs stay quarantined with two distinct hashes; positive historical agreement remains unknown", () => {
    const verification = readJson(VERIFY_PATH) as PeVerificationDocument;
    const doc = snapshot();
    const byEa = new Map(doc.nodes.map(node => [node.ea, node]));
    const expectedCounts = new Map(verification.results.map(result => [canonicalAddr(BigInt(result.ea)), result.mismatches.reduce((sum, item) => sum + item.pe_mismatch_byte_count, 0)]));
    for (const ea of QUARANTINE_EAS) {
      const node = byEa.get(ea)!;
      expect(node.status).toBe("quarantined");
      expect(node.byteAgreement).toBe("divergent");
      expect(node.byteDivergence.known).toBe(true);
      expect(node.byteDivergence.peMismatchByteCount).toBe(expectedCounts.get(ea)!);
      expect(node.byteDivergence.frozenSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(node.byteDivergence.peSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(node.byteDivergence.frozenSha256).not.toBe(node.byteDivergence.peSha256);
      expect(node.admissibleAsOracle).toBe(false);
      expect(node.semanticMaturity).not.toBe("reconciled");
    }
    const positive = byEa.get("0x460860")!;
    expect(positive.byteAgreement).toBe("unknown");
    expect(positive.byteDivergence).toEqual({ known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null });
    expect(positive.analysisRefs.some(ref => ref.startsWith("run01:positive-pe-agreement-unproven:"))).toBe(true);
    expect(positive.admissibleAsOracle).toBe(false);
    const divergentCount = doc.nodes.filter(node => node.status === "quarantined").length;
    expect(divergentCount).toBe(4);
  }, 120000);
  test("coverage is explicit: partial, self-loops not preserved, tails iterated", () => {
    const doc = snapshot();
    expect(doc.coverage.status).toBe("partial");
    expect(doc.coverage.selfLoopsPreserved).toBe(false);
    expect(doc.coverage.tailsIterated).toBe(true);
    expect(doc.coverage.uncoveredReason).toContain("self-loop");
    expect(doc.coverage.uncoveredReason).toContain("quarantined");
  }, 120000);
  test("run01 joins: instruction/block metrics for scope functions; unknown stays unknown elsewhere", () => {
    const doc = snapshot();
    const byEa = new Map(doc.nodes.map(node => [node.ea, node]));
    const gte = byEa.get("0x460860")!;
    expect(gte.instructionCount).toEqual(metricKnown(177));
    expect(gte.basicBlockCount).toEqual(metricKnown(22));
    const unknownMetric = doc.nodes.find(node => node.ea === "0x4020B0")!;
    expect(unknownMetric.instructionCount).toEqual({ known: false, value: null });
    expect(unknownMetric.basicBlockCount).toEqual({ known: false, value: null });
    expect(doc.nodes.filter(node => node.analysisRefs.includes("run01:native-groups")).length).toBe(98 - 9);
    expect(doc.nodes.filter(node => node.analysisRefs.includes("magic-registry@1.1.0")).length).toBeGreaterThan(600);
    const cloneCitations = doc.nodes.filter(node => node.analysisRefs.some(r => r.startsWith("magic:relocation-aware:")));
    expect(cloneCitations.length).toBe(17);
    expect(cloneCitations.every(n => n.semanticMaturity === "structural" && n.admissibleAsOracle === false)).toBe(true);
    expect(doc.objects.filter(o => o.name.startsWith("MagicList:")).length).toBe(2);
  }, 120000);
  test("indirect inventory: ghosts excluded, imports are objects (rva null), no DATA callee, resolved count matches", () => {
    const indirect = readJson(INDIRECT_PATH) as IndirectDocument;
    const doc = snapshot();
    expect(indirect.counts.sites).toBe(493);
    const ghosts = indirect.sites.filter(s => s.closure === "ghost_not_indirect").length;
    const resolved = indirect.sites.filter(s => s.closure === "closed_static" && (s.targets ?? []).filter(t => ["code", "ctor", "factory"].includes(t.kind) && t.va).length === 1 && !(s.targets ?? []).some(t => t.kind === "import")).length;
    const importSites = indirect.sites.filter(s => s.closure !== "ghost_not_indirect" && (s.targets ?? []).some(t => t.kind === "import")).length;
    expect(ff8Result().notes.indirectGhostSites).toBe(ghosts);
    expect(ff8Result().notes.indirectResolvedEdges).toBe(resolved);
    expect(new Set(doc.unresolved.filter(u => u.kind !== "data_xref").map(u => `${u.provenance.moduleSha256}:${u.siteRva}`)).size).toBe(indirect.sites.length - ghosts - resolved);
    expect(doc.unresolved.filter(u => u.kind === "import_unresolved").length).toBe(importSites);
    expect(doc.unresolved.every(u => u.fabricatedFunction === false)).toBe(true);
    const nodeIds = new Set(doc.nodes.map(n => n.id));
    expect(doc.unresolved.every(u => nodeIds.has(u.fromFunctionId))).toBe(true);
    expect(doc.edges.every(e => !doc.objects.some(o => o.id === e.destinationId || o.id === e.sourceId))).toBe(true);
    const sleepImport = doc.objects.find(o => o.kind === "import" && o.name === "KERNEL32.dll!Sleep");
    expect(sleepImport).toBeDefined();
    expect(sleepImport!.rva).toBeNull();
    const primDispatch = doc.objects.find(o => o.kind === "table" && o.name === "g_SoftwarePrimDispatch");
    expect(primDispatch).toBeDefined();
    const unresolvedWithObject = doc.unresolved.filter(u => u.referencedObjectId !== null);
    expect(unresolvedWithObject.every(u => doc.objects.some(o => o.id === u.referencedObjectId))).toBe(true);
  }, 120000);
  test("artifact identity: FF8 module hash, PE32/x86-32, image base, observed .text section", () => {
    const doc = snapshot();
    const artifact = doc.binaryArtifacts[0]!;
    expect(artifact.contentSha256).toBe(FF8_MODULE_SHA256);
    expect(artifact.format).toBe("PE32");
    expect(artifact.architecture).toBe("x86-32");
    expect(artifact.imageBase).toBe("0x400000");
    expect(artifact.versionLabel).toBe("mission-label:ff8-en-pc");
    expect(artifact.idbIdentity).toContain("FF8_EN.exe");
    const text = artifact.sections.find(section => section.name === ".text");
    expect(text).toBeDefined();
    expect(text!.virtualSize.known).toBe(true);
    expect((text!.virtualSize.value ?? 0)).toBeGreaterThan(0);
  }, 120000);
});

describe("audit regressions / immutable exports", () => {
  test("checker reports malformed nodes/edges instead of throwing", () => {
    const doc = build();
    expect(validateGraphSnapshot({ ...doc, nodes: [null, {}], edges: [null, {}] }).length).toBeGreaterThan(0);
  });
  test("checker detects digest alteration, missing tail coverage and duplicate objects", () => {
    const doc = build();
    expect(validateGraphSnapshot({ ...doc, missionId: "altered" })).toContain("snapshot fingerprint does not match its content");
    expect(() => build({ coverage: { status: "complete", uncoveredReason: null, tailsIterated: false, selfLoopsPreserved: true } })).toThrow(/tails/);
    const object = readJson(join(FIXTURES, "ff8-data-callback-not-call", "content.json")).objects[0];
    expect(validateGraphSnapshot({ ...doc, objects: [object, object] }).some(e => e.includes("duplicate object"))).toBe(true);
  });
  test("all source joins are identity-bound and registry counts fail closed", () => {
    const s = ff8Sources();
    expect(() => buildFf8GraphSnapshot({ ...s, indirect: { ...s.indirect, counts: { ...s.indirect.counts, sites: 492 } } })).toThrow(/493/);
    expect(() => buildFf8GraphSnapshot({ ...s, run01: { ...s.run01, native: { ...s.run01.native, input_sha256: MOD } } })).toThrow(/run01/);
    expect(() => buildFf8GraphSnapshot({ ...s, peVerification: { ...s.peVerification, disk_pe_sha256: MOD } })).toThrow(/IDB\/PE/);
    expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, binary: { ...s.magic.binary!, observed: { ...s.magic.binary!.observed, sha256: MOD } } } })).toThrow(/magic registry/);
    expect(() => buildFf8GraphSnapshot({ ...s, ledger: { ...s.ledger, counts: { ...s.ledger.counts, nodes: 1 } } })).toThrow(/count mismatch/);
  });
  test("absence of byte verification never lifts the four historical quarantines", () => {
    const doc = buildFf8GraphSnapshot({ ...ff8Sources(), peVerification: undefined }).snapshot;
    expect(doc.nodes.filter(n => QUARANTINE_EAS.includes(n.ea)).every(n => n.status === "quarantined" && n.byteAgreement === "unknown")).toBe(true);
  }, 120000);
  test("indirect adapter does not mutate caller node sets and validates counts", () => {
    const caller = fnId(MOD, 0x1000), known = new Set([caller]);
    const d: IndirectDocument = { schema_version: "1.1.0", generator: "test", binary: { path: "x", name: "x", sha256: MOD, image_base: "0x400000" }, counts: { sites: 1 }, sites: [{ parent_va: "0x401000", site_va: "0x401004", opcode: "call", closure: "closed_static", targets: [{ kind: "code", va: "0x402000", name: "target" }] }] };
    buildIndirectGraphFacts(d, hash("source"), known);
    expect([...known]).toEqual([caller]);
    expect(() => buildIndirectGraphFacts({ ...d, counts: { sites: 2 } }, hash("source"), known)).toThrow(/count mismatch/);
  });
  test("graph cache binds every module/content/tool/config version and returns defensive copies", () => {
    const doc: PlannerGraphInput & GraphSnapshotV1 = build({ nodes: [nodeAt(0x1000)] }); // L5 structural API interop
    const cache = new GraphSnapshotCache(1), key = graphCacheKey(doc);
    cache.set(key, doc);
    cache.get(key)!.nodes[0]!.name = "poisoned";
    expect(cache.get(key)!.nodes[0]!.name).not.toBe("poisoned");
    expect(cache.get({ ...key, normalizerVersion: "other" })).toBeUndefined();
    const other = build({ nodes: [nodeAt(0x2000)] });
    expect(() => cache.set(key, other)).toThrow(/bind/);
    cache.set(graphCacheKey(other), other);
    expect(cache.get(key)).toBeUndefined();
    expect(cache.invalidate(MOD)).toBe(1);
  });
  test("L5 consumes the normalized API: B precedes A; DATA callback creates no obligatory dependency", () => {
    const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000), C = fnId(MOD, 0x3000);
    const graph = build({ nodes: [nodeAt(0x1000), nodeAt(0x2000), nodeAt(0x3000)], edges: [edge(A, B, "direct_call", [site(0x1004)]), edge(A, C, "callback_candidate", [site(0x1008, "data")])] });
    const policy: PlannerPolicy = { version: "interop-fixture-v1", estimationVersion: "cost-fixture-v1", partitionId: "partition:interop", investigationKind: "structural", artifactKind: "structural_fact", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 1000000, totalContextBudgetUtf8Bytes: 10000000, maxSelectedUnits: 10, sccMaxFunctions: 10, sccMaxIterations: 2, sccCostBudget: 100,
      requirementsByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { functionId: n.id, moduleSha256: MOD, artifactId: `proof:${n.id}`, artifactSha256: hash(n.id), artifactKind: "structural_fact", minimumRevision: 1, maximumRevision: 10, publicationLevel: 1, validation: "fixture-only" }])),
      estimatesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { version: "cost-fixture-v1", A: 1, B: 1, R: 1, validation: 1 }])),
      resourcesByFunction: Object.fromEntries(graph.nodes.map(n => [n.id, { profiles: ["build"], models: ["offline"], tools: ["cpu"], accounts: ["fixture"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])) };
    const groups = graph.nodes.map(n => ({ groupId: `group:${n.id}`, partitionId: policy.partitionId, ownedFunctionIds: [n.id], contextFunctionIds: [] }));
    const result = planMission(graph, groups, policy);
    const unit = (id: string) => result.units.find(u => u.ownedFunctionIds.includes(id))!;
    const obligation = result.plan.g1Edges.find(e => e.kind === "obligatory")!;
    expect(obligation.fromUnitId).toBe(unit(B).unitId);
    expect(obligation.toUnitId).toBe(unit(A).unitId);
    expect(result.plan.g1Edges.some(e => e.kind === "obligatory" && e.callDestinationFunctionId === C)).toBe(false);
    expect(() => planMission({ ...graph, coverage: { ...graph.coverage, selfLoopsPreserved: false } }, groups, policy)).toThrow(/self-loops/);
  });
  (existsSync(NATIVE_MANIFEST) ? test : test.skip)("98 frozen native files match their transfer manifest and tracked summaries (not oracle admission)", () => {
    const sources = ff8Sources(), frozenFunctions = frozenInputs();
    const doc = buildFf8GraphSnapshot({ ...sources, frozenFunctions });
    expect(doc.notes.frozenNativeFunctionsVerified).toBe(98);
    expect(doc.snapshot.nodes.filter(n => n.analysisRefs.some(r => r.startsWith("run01:frozen-native:"))).length).toBe(89);
    expect(doc.snapshot.nodes.every(n => n.admissibleAsOracle === false)).toBe(true);
    const invalid = { ...frozenFunctions[0]!, rawUtf8: frozenFunctions[0]!.rawUtf8 + " " };
    expect(() => buildFf8GraphSnapshot({ ...sources, frozenFunctions: [invalid] })).toThrow(/source hash/);
  }, 120000);
});

describe("capability safety and optional capa", () => {
  test("multi-module provenance follows its object/source, not binaryArtifacts[0]", () => {
    const doc = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    const module = doc.binaryArtifacts[1]!.contentSha256;
    doc.objects.push({ schemaVersion: 1, id: "multi-import", moduleSha256: module, kind: "import", rva: null, name: "KERNEL32.dll!ReadFile", widthBytes: metricUnknown(), provenance: { ...doc.binaryArtifacts[1]!.provenance, siteKind: "import" } });
    doc.normalizedFingerprint = fingerprintWithout(doc, "normalizedFingerprint");
    const facts = evaluateCapabilities(doc);
    expect(facts.find(f => f.subjectId === "multi-import")!.provenance.moduleSha256).toBe(module);
  });
  test("invalidated callback hypotheses and invalidated direct edges do not propagate", () => {
    const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000);
    const doc = build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", [site(0x1004)], { status: "invalidated" }), edge(B, A, "callback_candidate", [site(0x2004, "data")])] });
    expect(evaluateCapabilities(doc, { propagationDepth: 1, maxPropagationTotal: 32 }).filter(f => f.scope === "propagated")).toEqual([]);
    const dead = build({ nodes: doc.nodes, edges: doc.edges.map(e => ({ ...e, status: "invalidated" })) });
    expect(evaluateCapabilities(dead)).toEqual([]);
    expect(() => evaluateCapabilities(doc, { propagationDepth: 1, maxPropagationTotal: -1 })).toThrow(/bounded/);
  });
  test("capability cache copies protect against caller poisoning", () => {
    const cache = new CapabilityCache(), snapshot = ff8Result().snapshot;
    const first = evaluateCapabilitiesCached(snapshot, cache);
    const original = first[0]!.capability;
    first[0]!.capability = "poisoned";
    expect(evaluateCapabilitiesCached(snapshot, cache)[0]!.capability).toBe(original);
    expect(evaluateCapabilities(snapshot).some(f => f.subjectKind === "function" && f.ruleId === "import-use")).toBe(true);
    expect(evaluateCapabilities(snapshot).filter(f => f.ruleId === "table-dispatch").every(f => f.confidence === "inferred")).toBe(true);
  }, 120000);
  test("input permutations keep facts stable and cache invalidates the second module", () => {
    const snapshot = ff8Result().snapshot;
    const reversed = build({ ...snapshot, artifacts: snapshot.binaryArtifacts, scopeDescription: snapshot.scope.description, objects: [...snapshot.objects].reverse(), edges: [...snapshot.edges].reverse(), unresolved: [...snapshot.unresolved].reverse() });
    const config = { propagationDepth: 1 as const, maxPropagationTotal: 17 };
    expect(evaluateCapabilities(reversed, config)).toEqual(evaluateCapabilities(snapshot, config));
    const multi = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    const cache = new CapabilityCache();
    evaluateCapabilitiesCached(multi, cache);
    expect(cache.invalidate(multi.binaryArtifacts[1]!.contentSha256)).toBe(1);
  }, 120000);
  test("capa absence is explicit, zero-install fallback; frozen import binds module/chunk sites", () => {
    expect(evaluateCapaAvailability().status).toBe("absent");
    expect(evaluateCapaAvailability().automaticInstall).toBe(false);
    const snapshot = build({ nodes: [nodeAt(0x1000)] });
    const report = { moduleSha256: MOD, tool: { version: "fixture-capa", license: "Apache-2.0", backend: "file" as const, rulesSha256: hash("rules"), sourceSha256: hash("source") }, matches: [{ functionRva: "0x1000", ruleId: "fixture-rule", capability: "files.read", siteRvas: ["0x1004"], evidence: [{ id: "ev:capa", source: "fixture", sha256: hash("evidence"), detail: "fixture only, not a native run" }] }] };
    const imported = importCapaCapabilities(snapshot, report);
    expect(imported[0]!.subjectId).toBe(snapshot.nodes[0]!.id);
    expect(imported[0]!.hypotheticalRole).toBeNull();
    expect(validateGraphSnapshot(withCapabilities(snapshot, imported))).toEqual([]);
    expect(() => importCapaCapabilities(snapshot, { ...report, moduleSha256: "b".repeat(64) })).toThrow(/module/);
    expect(() => importCapaCapabilities(snapshot, { ...report, matches: [{ ...report.matches[0]!, siteRvas: ["0x2000"] }] })).toThrow(/outside/);
  });
});

describe("L2-FIX independent-review attacks", () => {
  const rehash = (doc: GraphSnapshotV1): GraphSnapshotV1 => ({ ...doc, normalizedFingerprint: fingerprintWithout(doc, "normalizedFingerprint") });
  test("RV2-01: alpha source -> beta import is valid; proof must bind source and cap subject, not target", () => {
    const fixture = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    const source = fixture.nodes[0]!, targetModule = fixture.binaryArtifacts.find(a => a.contentSha256 !== source.moduleSha256)!;
    const siteRva = source.rva;
    const object = { schemaVersion: 1 as const, id: "beta:ReadFile", moduleSha256: targetModule.contentSha256, kind: "import" as const, rva: null, name: "KERNEL32.dll!ReadFile", widthBytes: metricUnknown(), provenance: { ...targetModule.provenance, siteRva: null, siteKind: "import" as const, xrefType: "none" as const } };
    const reference = { schemaVersion: 1 as const, id: "alpha-import-use", fromFunctionId: source.id, siteRva, kind: "import_unresolved" as const, target: "import" as const, referencedObjectId: object.id, fabricatedFunction: false as const, provenance: { ...fixture.binaryArtifacts.find(a => a.contentSha256 === source.moduleSha256)!.provenance, moduleSha256: source.moduleSha256, siteRva, siteKind: "instruction" as const, xrefType: "code" as const } };
    const snapshot = build({ artifacts: fixture.binaryArtifacts, nodes: fixture.nodes, objects: [object], unresolved: [reference] });
    expect(validateGraphSnapshot(snapshot)).toEqual([]);
    const facts = evaluateCapabilities(snapshot), fact = facts.find(f => f.subjectId === source.id)!;
    expect(fact.provenance.moduleSha256).toBe(source.moduleSha256);
    expect(validateGraphSnapshot(withCapabilities(snapshot, facts))).toEqual([]);
    expect(() => build({ artifacts: fixture.binaryArtifacts, nodes: fixture.nodes, objects: [object], unresolved: [{ ...reference, provenance: { ...reference.provenance, moduleSha256: targetModule.contentSha256 } }] })).toThrow(/source function module\/site/);
    expect(() => build({ artifacts: fixture.binaryArtifacts, nodes: fixture.nodes, objects: [object], unresolved: [{ ...reference, provenance: { ...reference.provenance, siteRva: "0xFFFF" } }] })).toThrow(/source function module\/site/);
    expect(() => build({ artifacts: fixture.binaryArtifacts, nodes: fixture.nodes, objects: [object], unresolved: [{ ...reference, siteRva: "0xFFFF", provenance: { ...reference.provenance, siteRva: "0xFFFF" } }] })).toThrow(/outside source/);
    expect(() => withCapabilities(snapshot, [{ ...fact, provenance: { ...fact.provenance, moduleSha256: targetModule.contentSha256 } }])).toThrow(/function subject module/);
  });
  for (const attack of ["schemaVersion", "functionClass", "extra", "tools", "boundary", "string-bound"]) {
    test(`RV2-03: rehashed ${attack} fails strict runtime schema and both cache entry points`, () => {
      const doc = structuredClone(build({ nodes: [nodeAt(0x1000)] }));
      if (attack === "schemaVersion") doc.nodes[0]!.schemaVersion = 99 as any;
      if (attack === "functionClass") doc.nodes[0]!.functionClass = "BOGUS" as any;
      if (attack === "extra") (doc as any).volatile = "must not be silently hashed";
      if (attack === "tools") doc.toolVersions = {} as any;
      if (attack === "boundary") doc.nodes[0]!.boundaries[0]!.role = "BOGUS" as any;
      if (attack === "string-bound") doc.toolVersions.normalizer = "n".repeat(1000);
      const altered = rehash(doc);
      expect(validateGraphSnapshotSchema(altered).length).toBeGreaterThan(0);
      expect(() => assertSnapshotContract(altered)).toThrow(/contract/);
      expect(() => graphCacheKey(altered)).toThrow(/contract/);
      expect(() => capabilityCacheKey(altered, DEFAULT_CAPABILITY_CONFIG)).toThrow(/contract/);
    });
  }
  test("RV2-03 reusable static validator rejects required/enums/bounds/extras and unsupported schema constructs", () => {
    const schema = { type: "object", required: ["n"], additionalProperties: false, properties: { n: { type: "integer", enum: [1, 2], minimum: 1, maximum: 2 } } };
    expect(validateStaticJsonSchema({ n: 1 }, schema)).toEqual([]);
    for (const input of [{}, { n: 3 }, { n: 1, extra: true }, { n: 1.5 }]) expect(validateStaticJsonSchema(input, schema).length).toBeGreaterThan(0);
    expect(() => validateStaticJsonSchema(1, { type: "integer", oneOf: [] })).toThrow(/unsupported/);
  });
  test("RV2-02 PE contradictory duplicate EA is rejected in both arrival orders; identical copies dedupe", () => {
    const s = ff8Sources(), clean = s.peVerification.results.find(r => r.ea === "0x460860")!;
    const bad = { ...clean, idb_equals_pe_and_freeze: false, mismatches: [{ chunk: "0x460860", size: 654, pe_mismatch_byte_count: 1, live_idb_changed_since_freeze: false, frozen_sha256: hash("frozen"), pe_sha256: hash("differentPE") }] };
    for (const records of [[clean, bad], [bad, clean]]) expect(() => buildFf8GraphSnapshot({ ...s, peVerification: { ...s.peVerification, results: records } })).toThrow(/conflicting PE function/);
    const identical = buildFf8GraphSnapshot({ ...s, peVerification: { ...s.peVerification, results: [clean, { ...clean, ea: "0x0460860" }] } });
    expect(identical.notes.peReportFunctions).toBe(1);
    expect(identical.notes.verifiedNodes).toBe(0);
    expect(identical.snapshot.nodes.find(n => n.ea === "0x460860")!.byteAgreement).toBe("unknown");
  }, 120000);
  test("RV2-02 run01 duplicates are canonical, exact copies dedupe; contradictions fail regardless of order", () => {
    const s = ff8Sources(), first = s.run01.functions[0]!;
    const conflict = { ...first, instructions: first.instructions + 1 };
    for (const records of [[first, conflict], [conflict, first]]) expect(() => buildFf8GraphSnapshot({ ...s, run01: { ...s.run01, functions: records } })).toThrow(/conflicting run01 function/);
    const doc = buildFf8GraphSnapshot({ ...s, run01: { ...s.run01, functions: [first, { ...first, ea: "0x0" + first.ea.slice(2) }] } });
    expect(doc.snapshot.nodes.filter(n => n.analysisRefs.includes("run01:native-groups")).length + Number(doc.notes.run01OutsideClosure)).toBe(1);
  }, 120000);
  test("RV2-02 magic target/function/slot/segment maps cannot last-win conflicting duplicates", () => {
    const s = ff8Sources(), first = s.magic.entries.find(e => e.logic?.function)!;
    const altered = { ...first, logic: { ...first.logic!, function: { ...first.logic!.function!, is_thunk: !first.logic!.function!.is_thunk } } };
    for (const entries of [[first, altered], [altered, first]]) expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, entries } })).toThrow(/conflicting magic/);
    const target = s.magic.unique_targets![0]!, conflict = { ...target, cfg: { ...target.cfg, block_count: target.cfg.block_count + 1 } };
    for (const records of [[target, conflict], [conflict, target]]) expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, unique_targets: records } })).toThrow(/conflicting magic/);
    const segmentConflict = { ...first, logic: { ...first.logic!, slot_rva: "0x998877", slot_va: "0xD98877", segment: { ...first.logic!.segment!, end_va_exclusive: "0xB69001" } } };
    expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, entries: [first, segmentConflict] } })).toThrow(/conflicting magic segment/);
    expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, entries: [...s.magic.entries, structuredClone(first)] } })).not.toThrow();
  }, 120000);
  test("RV2-04 duplicating/replacing a site cannot satisfy the 493-site gate; type/family changes are rejected", () => {
    const s = ff8Sources(), sites = structuredClone(s.indirect.sites);
    const first = sites.find(site => site.site_va === "0x40218D")!, lost = sites.findIndex(site => site.site_va === "0x40221B");
    sites[lost] = structuredClone(first);
    expect(() => buildFf8GraphSnapshot({ ...s, indirect: { ...s.indirect, sites } })).toThrow(/duplicate\/conflicting physical/);
    const replacement = structuredClone(s.indirect.sites);
    replacement[lost]!.site_va = "0x40221C";
    expect(() => buildFf8GraphSnapshot({ ...s, indirect: { ...s.indirect, sites: replacement } })).toThrow(/inventory omission/);
    const unknownFamily = structuredClone(s.indirect.sites);
    unknownFamily[lost]!.family = "BOGUS";
    expect(() => buildFf8GraphSnapshot({ ...s, indirect: { ...s.indirect, sites: unknownFamily } })).toThrow(/invalid FF8 indirect family/);
  });
  test("RV2-04 multiple object candidates at one instruction retain every reference, not first target only", () => {
    const sourceId = fnId(MOD, 0x1000);
    const d: IndirectDocument = { schema_version: "1.1.0", generator: "fixture", binary: { path: "fixture", name: "fixture", sha256: MOD, image_base: "0x400000" }, counts: { sites: 1, call: 1, jmp: 0 }, sites: [{ site_va: "0x401004", parent_va: "0x401000", opcode: "call", family: "fixture", closure: "open_static_bounded", targets: [{ kind: "table", va: "0x405000", name: "tableA" }, { kind: "table", va: "0x406000", name: "tableB" }] }] };
    const one = buildIndirectGraphFacts(d, hash("fixture"), new Set([sourceId]));
    const two = buildIndirectGraphFacts({ ...d, sites: [{ ...d.sites[0]!, targets: [...d.sites[0]!.targets!].reverse() }] }, hash("fixture"), new Set([sourceId]));
    expect(one.objects.length).toBe(2);
    expect(one.unresolved.length).toBe(2);
    expect(one.edges).toEqual([]);
    expect(new Set(one.unresolved.map(r => r.referencedObjectId)).size).toBe(2);
    expect(one.unresolved.map(r => r.id).sort()).toEqual(two.unresolved.map(r => r.id).sort());
  });
  test("reordering all immutable joined record streams preserves nodes, typed relations and references", () => {
    const s = ff8Sources();
    const forward = buildFf8GraphSnapshot(s).snapshot;
    const reverse = buildFf8GraphSnapshot({ ...s, ledger: { ...s.ledger, nodes: [...s.ledger.nodes].reverse(), edges: [...s.ledger.edges].reverse() }, indirect: { ...s.indirect, sites: [...s.indirect.sites].reverse() }, magic: { ...s.magic, entries: [...s.magic.entries].reverse(), unique_targets: [...s.magic.unique_targets!].reverse() }, run01: { ...s.run01, functions: [...s.run01.functions].reverse() }, peVerification: { ...s.peVerification, results: [...s.peVerification.results].reverse() } }).snapshot;
    expect(reverse.nodes).toEqual(forward.nodes);
    expect(reverse.edges).toEqual(forward.edges);
    expect(reverse.objects).toEqual(forward.objects);
    expect(reverse.unresolved).toEqual(forward.unresolved);
    // Source/config digests may change when the cited serialization changes;
    // no such audit difference may change whether a function is quarantined.
  }, 120000);
  (existsSync(NATIVE_MANIFEST) ? test : test.skip)("RV2-05 frozen hash is insufficient if ledger entry/chunk spans change", () => {
    const s = ff8Sources(), raw = readFileSync(join(NATIVE_DIR, "0x460860.json"), "utf8");
    const frozenFunctions = [{ rawUtf8: raw, sha256: hash(raw) }];
    const mutate = (kind: "chunkEnd" | "entryEnd" | "extraChunk") => {
      const ledger = structuredClone(s.ledger), node = ledger.nodes.find(n => n.va === "0x460860")!;
      if (kind === "chunkEnd") node.chunks[0]!.end_va_exclusive = canonicalAddr(BigInt(node.chunks[0]!.end_va_exclusive) + 1n);
      if (kind === "entryEnd") node.end_va_exclusive = canonicalAddr(BigInt(node.end_va_exclusive) + 1n);
      if (kind === "extraChunk") node.chunks.push({ start_va: "0x460B00", end_va_exclusive: "0x460B10" });
      return { ...s, ledger, ledgerSha256: hash(canonical(ledger)), frozenFunctions };
    };
    for (const kind of ["chunkEnd", "entryEnd", "extraChunk"] as const) expect(() => buildFf8GraphSnapshot(mutate(kind))).toThrow(/ledger\/frozen entry or chunk-set extent/);
    const exact = buildFf8GraphSnapshot({ ...s, frozenFunctions });
    expect(exact.snapshot.nodes.find(n => n.ea === "0x460860")!.byteAgreement).toBe("unknown");
  }, 120000);
  (existsSync(NATIVE_MANIFEST) ? test : test.skip)("RV2-05 PE chunk extent and frozen-byte source hashes must match the actual gel", () => {
    const s = ff8Sources(), raw = readFileSync(join(NATIVE_DIR, "0x48D200.json"), "utf8");
    const frozenFunctions = [{ rawUtf8: raw, sha256: hash(raw) }];
    const pe = structuredClone(s.peVerification), report = pe.results.find(r => r.ea === "0x48D200")!;
    report.mismatches[0]!.size += 1;
    expect(() => buildFf8GraphSnapshot({ ...s, peVerification: pe, frozenFunctions })).toThrow(/ledger\/PE chunk extent/);
    const wrongHash = structuredClone(s.peVerification);
    wrongHash.results.find(r => r.ea === "0x48D200")!.mismatches[0]!.frozen_sha256 = hash("unrelated-bytes");
    expect(() => buildFf8GraphSnapshot({ ...s, peVerification: wrongHash, frozenFunctions })).toThrow(/source-hash binding/);
  }, 120000);
  test("RV2-05 missing gel cannot certify historical PE concordance; source extents still gate negative evidence", () => {
    const s = ff8Sources(), doc = buildFf8GraphSnapshot(s).snapshot;
    expect(doc.nodes.find(n => n.ea === "0x460860")!.byteDivergence).toEqual({ known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null });
    expect(doc.nodes.filter(n => QUARANTINE_EAS.includes(n.ea)).every(n => n.status === "quarantined")).toBe(true);
    const ledger = structuredClone(s.ledger), node = ledger.nodes.find(n => n.va === "0x48D200")!;
    node.chunks[0]!.end_va_exclusive = canonicalAddr(BigInt(node.chunks[0]!.end_va_exclusive) + 1n);
    expect(() => buildFf8GraphSnapshot({ ...s, ledger, ledgerSha256: hash(canonical(ledger)) })).toThrow(/ledger\/PE chunk extent/);
  }, 120000);
  test("RV2-06 pure relation projection unions shard sites without mutating snapshot or creating call semantics", () => {
    const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000);
    const doc = build({ nodes: [nodeAt(0x1000, { boundaries: [{ ordinal: 0, rva: "0x1000", endRvaExclusive: "0x1080", role: "entry" }], sizeBytes: metricKnown(0x80) }), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", Array.from({ length: 70 }, (_, i) => site(0x1000 + i))), edge(A, B, "callback_candidate", [site(0x1008, "data")])] });
    expect(doc.edges.length).toBe(3);
    const projected = projectFunctionRelations(doc), direct = projected.find(e => e.kind === "direct_call")!;
    expect(projected.length).toBe(2);
    expect(direct.sites.length).toBe(70);
    expect(direct.edgeRecordIds.length).toBe(2);
    expect(direct.id).toBe(functionRelationKey(doc.edges.find(e => e.kind === "direct_call")!));
    expect(projected.find(e => e.kind === "callback_candidate")!.schedulerRelevance).toBe("hypothesis_not_call");
    direct.sites[0]!.provenance.source = "poisoned";
    expect(doc.edges.every(e => e.sites.every(s => s.provenance.source !== "poisoned"))).toBe(true);
    expect(projectFunctionRelations(rehash({ ...doc, edges: [...doc.edges] }))).toEqual(projectFunctionRelations(doc));
  });
});

describe("L2-FIX-MAX final QA regressions", () => {
  const A = fnId(MOD, 0x1000), B = fnId(MOD, 0x2000);
  const coveredA = () => nodeAt(0x1000, { boundaries: [{ ordinal: 0, rva: "0x1000", endRvaExclusive: "0x1200", role: "entry" }], sizeBytes: metricKnown(0x200) });
  const rehash = (doc: GraphSnapshotV1): GraphSnapshotV1 => ({ ...doc, normalizedFingerprint: fingerprintWithout(doc, "normalizedFingerprint") });
  const normalize = (doc: GraphSnapshotV1): GraphSnapshotV1 => build({ ...doc, artifacts: doc.binaryArtifacts, scopeDescription: doc.scope.description });
  const fragmentedEdge = (original: FunctionEdgeV1, sites: FunctionEdgeV1["sites"]): FunctionEdgeV1 => ({ ...original, sites, id: `edge:${hash(canonical({ sourceId: original.sourceId, destinationId: original.destinationId, kind: original.kind, sites })).slice(0, 40)}` });
  const guarded = (doc: GraphSnapshotV1, diagnostic: RegExp): void => {
    expect(validateGraphSnapshot(doc).some(error => diagnostic.test(error))).toBe(true);
    expect(() => assertSnapshotContract(doc)).toThrow(diagnostic);
    expect(() => graphCacheKey(doc)).toThrow(diagnostic);
    expect(() => capabilityCacheKey(doc, DEFAULT_CAPABILITY_CONFIG)).toThrow(diagnostic);
    expect(() => evaluateCapabilities(doc)).toThrow(diagnostic);
    expect(() => evaluateCapabilitiesCached(doc, new CapabilityCache())).toThrow(diagnostic);
  };

  test("NQA01/RV2MAX01: every raw declaration is checked before fusion in BOTH arrival orders", () => {
    const fixture = readJson(join(FIXTURES, "ff8-chunks-tails", "content.json")) as GraphSnapshotV1;
    const good = fixture.edges[0]!;
    for (const mutation of [{ schemaVersion: 99 }, { extra: "unexpected" }, { direction: "destination_to_source" }, { appearedInRevision: -0 }]) {
      const bad = { ...structuredClone(good), ...mutation } as FunctionEdgeV1;
      for (const edges of [[good, bad], [bad, good]]) expect(() => normalize({ ...fixture, edges })).toThrow(/raw declarations.*contract/s);
    }
    expect(validateGraphSnapshot(normalize({ ...fixture, edges: [good, structuredClone(good)] }))).toEqual([]);
    const tiny = build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", [site(0x1004)])] });
    const raw = { ...tiny.edges[0]!, id: "" };
    expect(normalize({ ...tiny, edges: [raw] }).edges[0]!.id).toMatch(/^edge:[a-f0-9]{40}$/);
    expect(validateGraphSnapshot(rehash({ ...tiny, edges: [raw] })).length).toBeGreaterThan(0); // empty id is NEVER transport
    const withFacts = withCapabilities(build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "callback_candidate", [site(0x1004, "data")])] }), evaluateCapabilities(build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "callback_candidate", [site(0x1004, "data")])] })));
    for (const collection of ["nodes", "edges", "capabilities"] as const) {
      const item = withFacts[collection][0]!;
      const bad = { ...item, schemaVersion: 99, extra: "cannot disappear" };
      for (const records of [[item, bad], [bad, item]]) expect(() => normalize({ ...withFacts, [collection]: records })).toThrow(/raw declarations.*contract/s);
    }
    const data = readJson(join(FIXTURES, "ff8-data-callback-not-call", "content.json")) as GraphSnapshotV1;
    for (const collection of ["binaryArtifacts", "objects", "unresolved"] as const) {
      const item = data[collection][0]!;
      expect(item).toBeDefined();
      const bad = { ...item, schemaVersion: 99, extra: "cannot disappear" };
      for (const records of [[item, bad], [bad, item]]) expect(() => normalize({ ...data, [collection]: records })).toThrow(/raw declarations.*contract/s);
    }
  });

  test("NQA02/RV2MAX01: public and cached evaluation reject node schema99, stale digests and malformed cached facts", () => {
    const doc = build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "callback_candidate", [site(0x1004, "data")])] });
    expect(evaluateCapabilities(doc).length).toBe(1);
    const bad = structuredClone(doc);
    bad.nodes[0]!.schemaVersion = 99 as any;
    guarded(rehash(bad), /enum/);
    expect(() => withCapabilities(rehash(bad), [])).toThrow(/enum/);
    guarded({ ...doc, snapshotId: "altered-without-rehash" }, /fingerprint/);
    const cache = new CapabilityCache(), key = capabilityCacheKey(doc, DEFAULT_CAPABILITY_CONFIG), facts = evaluateCapabilities(doc);
    cache.set(key, [{ ...facts[0]!, schemaVersion: 99 as any }]);
    expect(() => evaluateCapabilitiesCached(doc, cache)).toThrow(/enum/);
    const wrongSubject = { ...facts[0]!, subjectId: "absent-function" };
    cache.set(key, [wrongSubject]);
    expect(() => evaluateCapabilitiesCached(doc, cache)).toThrow(/subject absent/);
    cache.set(key, facts);
    expect(evaluateCapabilitiesCached(doc, cache)).toEqual(facts);
    const embedded = withCapabilities(doc, facts);
    embedded.capabilities[0]!.schemaVersion = 99 as any;
    expect(() => withCapabilities(rehash(embedded), [])).toThrow(/enum/); // replacement is not a repair/authority API
  });

  for (const kind of ["direct_call", "callback_candidate"] as const) {
    for (const conflict of ["status", "retiredInRevision", "confidence"] as const) {
      test(`NQA03: ${kind} ${conflict} is reconciled across ALL shards before filtering/propagation/cache`, () => {
        const sites = Array.from({ length: 65 }, (_, i) => site(0x1000 + i, kind === "callback_candidate" ? "data" : "code"));
        const doc = build({ knowledgeRevision: 3, nodes: [coveredA(), nodeAt(0x2000)], edges: [edge(A, B, kind, sites), edge(B, A, "callback_candidate", [site(0x2004, "data")])] });
        const indices = doc.edges.map((record, index) => record.kind === kind && record.sourceId === A ? index : -1).filter(index => index >= 0);
        expect(indices.length).toBe(2);
        const altered = structuredClone(doc), second = altered.edges[indices[1]!]!;
        if (conflict === "status") second.status = "invalidated";
        if (conflict === "retiredInRevision") second.retiredInRevision = 2;
        if (conflict === "confidence") second.confidence = "unknown";
        const bad = rehash(altered);
        guarded(bad, /conflicting relation shard metadata/);
        expect(() => projectFunctionRelations(bad)).toThrow(/conflicting relation shard metadata/);
        expect(() => evaluateCapabilities(bad, { propagationDepth: 1, maxPropagationTotal: 10 })).toThrow(/conflicting relation shard metadata/);
        expect(() => evaluateCapabilitiesCached(bad, new CapabilityCache(), { propagationDepth: 1, maxPropagationTotal: 10 })).toThrow(/conflicting relation shard metadata/);
        const retired = normalize({ ...doc, edges: doc.edges.map(record => record.sourceId === A && record.kind === kind ? { ...record, retiredInRevision: 2 } : record) });
        expect(evaluateCapabilities(retired, { propagationDepth: 1, maxPropagationTotal: 10 }).filter(fact => fact.subjectId === A)).toEqual([]);
      });
    }
  }

  test("NQA03/06: callback and propagation evidence union all sites and ignore transport packing/record IDs", () => {
    const direct = edge(A, B, "direct_call", Array.from({ length: 129 }, (_, i) => site(0x1000 + i)));
    const callback = edge(B, A, "callback_candidate", [site(0x2004, "data")]);
    const doc = build({ nodes: [coveredA(), nodeAt(0x2000)], edges: [direct, callback] });
    const repacked = rehash({ ...doc, edges: [...Array.from({ length: 5 }, (_, i) => ({ ...direct, id: `manual-packing:${i}`, sites: direct.sites.slice(i * 32, Math.min(129, (i + 1) * 32)) })), doc.edges.find(record => record.kind === "callback_candidate")!] });
    expect(validateGraphSnapshot(repacked)).toEqual([]);
    const config = { propagationDepth: 1 as const, maxPropagationTotal: 10 };
    const facts = evaluateCapabilities(doc, config);
    expect(evaluateCapabilities(repacked, config)).toEqual(facts);
    const propagated = facts.find(fact => fact.scope === "propagated")!;
    expect(propagated.evidence[0]!.detail).toContain("129 sites");
    const changed = structuredClone(repacked);
    changed.edges[0]!.sites[0]!.provenance.evidenceSha256 = hash("new proof for same site");
    expect(evaluateCapabilities(rehash(changed), config).find(fact => fact.scope === "propagated")!.evidence[0]!.sha256).not.toBe(propagated.evidence[0]!.sha256);
    const cb = build({ nodes: [coveredA(), nodeAt(0x2000)], edges: [edge(A, B, "callback_candidate", direct.sites.map(item => ({ ...item, xrefType: "data", provenance: { ...item.provenance, xrefType: "data" } })))] });
    const firstCb = cb.edges[0]!;
    const cbRepacked = rehash({ ...cb, edges: Array.from({ length: 5 }, (_, i) => ({ ...firstCb, id: `callback-packing:${i}`, sites: projectFunctionRelations(cb)[0]!.sites.slice(i * 32, Math.min(129, (i + 1) * 32)) })) });
    expect(evaluateCapabilities(cbRepacked)).toEqual(evaluateCapabilities(cb));
  });

  test("NQA04/RV2MAX02: instruction sites bind CALLER chunks, not callee chunks or a fabricated siteKind", () => {
    const doc = readJson(join(FIXTURES, "ff8-chunks-tails", "content.json")) as GraphSnapshotV1;
    expect(validateGraphSnapshot(doc)).toEqual([]);
    for (const siteKind of ["instruction", "import", "table"] as const) {
      const bad = structuredClone(doc), tail = bad.edges.find(record => record.kind === "tail_jump")!;
      tail.sites[0]!.siteRva = "0xC108";
      tail.sites[0]!.provenance = { ...tail.sites[0]!.provenance, siteRva: "0xC108", siteKind };
      guarded(rehash(bad), /outside source function chunks/);
      expect(() => normalize(bad)).toThrow(/outside source function chunks/);
    }
    const multi = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    const from = multi.nodes[0]!, to = multi.nodes.find(node => node.moduleSha256 !== from.moduleSha256)!;
    const local = site(Number(BigInt(from.rva)));
    local.provenance.moduleSha256 = from.moduleSha256;
    expect(validateGraphSnapshot(build({ artifacts: multi.binaryArtifacts, nodes: multi.nodes, edges: [edge(from.id, to.id, "direct_call", [local])] }))).toEqual([]);
  });

  test("NQA04: DATA/global tables and pure import provenance are NOT caller instructions; unknown chunks cannot claim complete", () => {
    const data = site(0xD008, "data");
    data.provenance.siteKind = "table";
    const object = { schemaVersion: 1 as const, id: "global-callback-table", moduleSha256: MOD, kind: "table" as const, rva: "0xD000", name: "dispatch", widthBytes: metricUnknown(), provenance: { ...data.provenance, siteRva: "0xD000" } };
    const ref = { schemaVersion: 1 as const, id: "global-data-ref", fromFunctionId: A, siteRva: "0xD008", kind: "data_xref" as const, target: "table" as const, referencedObjectId: object.id, fabricatedFunction: false as const, provenance: data.provenance };
    expect(validateGraphSnapshot(build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "callback_candidate", [data])], objects: [object], unresolved: [ref] }))).toEqual([]);
    const imported = { ...object, id: "pure-import", kind: "import" as const, rva: null, name: "KERNEL32.dll!ReadFile", provenance: { ...artifactFor().provenance, siteKind: "import" as const } };
    const importRef = { ...ref, id: "import-citation-not-an-instruction", kind: "import_unresolved" as const, target: "import" as const, referencedObjectId: imported.id, provenance: { ...imported.provenance, siteRva: "0xD008" } };
    const importDoc = build({ nodes: [nodeAt(0x1000)], objects: [imported], unresolved: [importRef] });
    expect(evaluateCapabilities(importDoc).every(fact => fact.subjectKind === "region")).toBe(true);
    const unknown = { nodes: [nodeAt(0x1000, { boundaries: [], sizeBytes: metricUnknown(), status: "incomplete", semanticMaturity: "none" }), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", [site(0x1004)])] };
    expect(() => build(unknown)).toThrow(/complete coverage.*without source function chunks/);
    const partial = build({ ...unknown, coverage: { status: "partial", uncoveredReason: "Caller chunks unavailable; site containment unproven", tailsIterated: false, selfLoopsPreserved: true } });
    expect(validateGraphSnapshot(partial)).toEqual([]);
    expect(partial.coverage.uncoveredReason).toContain("unproven");
  });

  for (const mutation of ["extractor-nonhex", "extractor-uppercase", "artifact-module", "revision-negative-zero", "metric-negative-zero", "ordinal-unsafe", "byte-hash-nonhex"] as const) {
    test(`NQA05: ${mutation} cannot be laundered by rehashing or either cache`, () => {
      const doc = build({ nodes: [nodeAt(0x1000)] }), bad = structuredClone(doc);
      if (mutation === "extractor-nonhex") bad.toolVersions.extractorHash = "z".repeat(64);
      if (mutation === "extractor-uppercase") bad.toolVersions.extractorHash = "A".repeat(64);
      if (mutation === "artifact-module") bad.binaryArtifacts[0]!.provenance.moduleSha256 = "b".repeat(64);
      if (mutation === "revision-negative-zero") bad.knowledgeRevision = -0;
      if (mutation === "metric-negative-zero") bad.nodes[0]!.sizeBytes.value = -0;
      if (mutation === "ordinal-unsafe") bad.nodes[0]!.boundaries[0]!.ordinal = 2 ** 54;
      if (mutation === "byte-hash-nonhex") { bad.nodes[0]!.byteAgreement = "concordant"; bad.nodes[0]!.byteDivergence = { known: true, peMismatchByteCount: 0, frozenSha256: "z".repeat(64), peSha256: "z".repeat(64) }; }
      guarded(rehash(bad), /sha256|module content hash|negative zero|unsafe integer/);
      expect(() => normalize(bad)).toThrow();
    });
  }
  test("NQA05: valid multi-module artifact proofs remain subject-local; -0 known metrics are rejected", () => {
    const multi = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    expect(validateGraphSnapshot(multi)).toEqual([]);
    const bad = structuredClone(multi);
    bad.binaryArtifacts[0]!.provenance.moduleSha256 = multi.binaryArtifacts[1]!.contentSha256;
    guarded(rehash(bad), /module content hash/);
    expect(() => metricKnown(-0)).toThrow(/canonical/);
  });

  for (const count of [64, 65, 129]) {
    test(`NQA01/06/RV2MAX05: ${count} raw sites survive, generated IDs come from canonical UNION, not first fragment`, () => {
      const raw = edge(A, B, "direct_call", Array.from({ length: count }, (_, i) => site(0x1000 + i)));
      const full = build({ nodes: [coveredA(), nodeAt(0x2000)], edges: [raw] });
      const fragments = Array.from({ length: Math.ceil(count / 32) }, (_, i) => fragmentedEdge(raw, raw.sites.slice(i * 32, (i + 1) * 32)));
      for (const records of [fragments, [...fragments].reverse(), fragments.map(record => fragmentedEdge(record, [...record.sites].reverse()))]) {
        const repacked = build({ nodes: [coveredA(), nodeAt(0x2000)], edges: records });
        expect(repacked.normalizedFingerprint).toBe(full.normalizedFingerprint);
        expect(repacked.edges).toEqual(full.edges);
        expect(repacked.edges.every(record => record.sites.length <= 64)).toBe(true);
        expect(projectFunctionRelations(repacked)[0]!.sites.length).toBe(count);
        expect(normalize(repacked)).toEqual(repacked);
      }
      const bad = { ...raw, schemaVersion: 99 as any, extra: "invalid oversized record" };
      for (const records of [[raw, bad], [bad, raw]]) expect(() => build({ nodes: [coveredA(), nodeAt(0x2000)], edges: records })).toThrow(/raw declarations.*contract/s);
      if (count > 64) expect(validateGraphSnapshotSchema(rehash({ ...full, edges: [{ ...raw, id: "explicit-transport-id" }] })).some(error => /maxItems/.test(error))).toBe(true);
    });
  }
  test("NQA06: explicit conflicting/mixed identities fail closed in both orders, identical explicit identity survives", () => {
    const one = edge(A, B, "direct_call", [site(0x1004)], { id: "explicit-one" }), two = edge(A, B, "direct_call", [site(0x1008)], { id: "explicit-two" });
    for (const records of [[one, two], [two, one], [one, { ...two, id: "" }], [{ ...two, id: "" }, one]]) expect(() => build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: records })).toThrow(/conflicting relation identities/);
    expect(build({ nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [one, { ...two, id: one.id }] }).edges[0]!.id).toBe(one.id);
  });
  test("NQA06: indirect terminal attribute disagreements cannot first-win; exact declarations are order stable", () => {
    const records = ["alpha", "beta"].map((name, i) => ({ site_va: canonicalAddr(0x401004 + i * 4), parent_va: "0x401000", opcode: "call", closure: "closed_static", targets: [{ kind: "code", va: "0x40D000", name }] }));
    const doc = (sites: typeof records): IndirectDocument => ({ schema_version: "1.1.0", generator: "fixture", binary: { path: "fixture", name: "fixture", sha256: MOD, image_base: "0x400000" }, counts: { sites: 2, call: 2, jmp: 0 }, sites });
    for (const sites of [records, [...records].reverse()]) expect(() => buildIndirectGraphFacts(doc(sites), hash("fixture"), new Set([A]))).toThrow(/conflicting indirect terminal attributes/);
    const exact = records.map(record => ({ ...record, targets: [{ ...record.targets[0]!, name: "alpha" }] }));
    const forward = buildIndirectGraphFacts(doc(exact), hash("fixture"), new Set([A])), reverse = buildIndirectGraphFacts(doc([...exact].reverse()), hash("fixture"), new Set([A]));
    expect(forward.extraNodes).toEqual(reverse.extraNodes);
    expect(forward.extraNodes[0]!.name).toBe("alpha");
    expect(build({ nodes: [nodeAt(0x1000), ...forward.extraNodes], edges: forward.edges }).normalizedFingerprint).toBe(build({ nodes: [nodeAt(0x1000), ...reverse.extraNodes], edges: reverse.edges }).normalizedFingerprint);
  });

  for (const mutation of ["IAT-count", "LOT2-count", "e2-families", "e2-closures", "stack-handlers", "draw-tables", "missing-count", "lot-class", "ledger-class", "closure", "missing-class", "unknown-version"] as const) {
    test(`RV2MAX04: 493 checksum alone cannot admit ${mutation}`, () => {
      const s = ff8Sources(), bad = structuredClone(s.indirect) as any;
      if (mutation === "IAT-count") bad.counts.IAT -= 1;
      if (mutation === "LOT2-count") bad.counts.LOT2 -= 1;
      if (mutation === "e2-families") bad.counts.e2_families.stack_switch -= 1;
      if (mutation === "e2-closures") bad.counts.e2_closures.closed_static -= 1;
      if (mutation === "stack-handlers") bad.counts.stack_switch_handlers -= 1;
      if (mutation === "draw-tables") bad.counts.draw_tables -= 1;
      if (mutation === "missing-count") delete bad.counts.IAT;
      const iat = bad.sites.find((record: any) => record.family === "iat")!;
      if (mutation === "lot-class") { iat.lot_class = "LOT2"; bad.counts.IAT -= 1; bad.counts.LOT2 += 1; }
      if (mutation === "ledger-class") iat.ledger_class = "true_indirect";
      if (mutation === "closure") iat.closure = "open_static_bounded";
      if (mutation === "missing-class") delete iat.ledger_class;
      if (mutation === "unknown-version") bad.schema_version = "99.0.0";
      expect(hash(canonical(bad.sites.map((record: any) => indirectSiteKey(bad.binary.sha256, bad.binary.image_base, record)).sort()))).toBe(FF8_INDIRECT_SITE_KEYS_SHA256);
      const known = new Set(s.indirect.sites.map(record => fnId(FF8_MODULE_SHA256, BigInt(record.parent_va) - 0x400000n)));
      expect(() => buildIndirectGraphFacts(bad, hash(canonical(bad)), known)).toThrow(/count mismatch|classification|version/);
    });
  }
  test("RV2MAX04: supported magic1.1.0 control; unsupported magic/ledger versions and indirect source hashes fail closed", () => {
    const s = ff8Sources();
    expect(s.magic.schema_version).toBe("1.1.0");
    expect(() => buildFf8GraphSnapshot({ ...s, magic: { ...s.magic, schema_version: "99.0.0" } })).toThrow(/unsupported magic registry version/);
    expect(() => buildFf8GraphSnapshot({ ...s, ledger: { ...s.ledger, schema_version: "99.0.0" } })).toThrow(/unsupported ledger/);
    expect(() => buildFf8GraphSnapshot({ ...s, indirectSha256: "z".repeat(64) })).toThrow(/source hash/);
    const known = new Set(s.indirect.sites.map(record => fnId(FF8_MODULE_SHA256, BigInt(record.parent_va) - 0x400000n)));
    expect(buildIndirectGraphFacts(s.indirect, s.indirectSha256, known).ghostSiteCount).toBe(5);
  });

  for (const mutation of ["appearance-future", "appearance-negative", "appearance-negative-zero", "appearance-unsafe", "retirement-negative", "retirement-negative-zero", "retirement-unsafe", "retirement-before-appearance", "retirement-after-snapshot", "missing-appearance", "missing-retirement"] as const) {
    test(`RV2MAX06: local snapshot chronology rejects ${mutation} without rewriting history`, () => {
      const doc = build({ knowledgeRevision: 3, nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", [site(0x1004)], { appearedInRevision: 1 })] }), bad = structuredClone(doc), record = bad.edges[0]!;
      if (mutation === "appearance-future") record.appearedInRevision = 4;
      if (mutation === "appearance-negative") record.appearedInRevision = -1;
      if (mutation === "appearance-negative-zero") record.appearedInRevision = -0;
      if (mutation === "appearance-unsafe") record.appearedInRevision = 2 ** 54;
      if (mutation === "retirement-negative") record.retiredInRevision = -1;
      if (mutation === "retirement-negative-zero") record.retiredInRevision = -0;
      if (mutation === "retirement-unsafe") record.retiredInRevision = 2 ** 54;
      if (mutation === "retirement-before-appearance") record.retiredInRevision = 0;
      if (mutation === "retirement-after-snapshot") record.retiredInRevision = 4;
      if (mutation === "missing-appearance") delete (record as any).appearedInRevision;
      if (mutation === "missing-retirement") delete (record as any).retiredInRevision;
      guarded(rehash(bad), /revision|chronology|minimum|negative zero|unsafe integer|required/);
      expect(() => normalize(bad)).toThrow();
    });
  }
  test("RV2MAX06: known local appearance<=retirement<=snapshot is accepted; null is preserved; retirement is not a future schedule", () => {
    for (const retiredInRevision of [null, 1, 3]) {
      const doc = build({ knowledgeRevision: 3, nodes: [nodeAt(0x1000), nodeAt(0x2000)], edges: [edge(A, B, "direct_call", [site(0x1004)], { appearedInRevision: 1, retiredInRevision })] });
      expect(validateGraphSnapshot(doc)).toEqual([]);
      expect(normalize(doc).edges[0]!.retiredInRevision).toBe(retiredInRevision);
    }
  });

  test("NQA07: zero mismatch count contradicting unequal local PE/frozen hashes is rejected, coherent citations remain UNKNOWN", () => {
    const s = ff8Sources(), raw = readFileSync(join(NATIVE_DIR, "0x460860.json"), "utf8"), frozen = JSON.parse(raw.replace(/^\uFEFF/, "")), chunk = frozen.chunks[0];
    const digest = hash(new Uint8Array(Buffer.from(chunk.hex, "hex"))), pe = structuredClone(s.peVerification), report = pe.results.find(record => record.ea === "0x460860")!;
    report.mismatches = [{ chunk: chunk.start, size: Number(BigInt(chunk.end) - BigInt(chunk.start)), pe_mismatch_byte_count: 0, live_idb_changed_since_freeze: false, frozen_sha256: digest, pe_sha256: "b".repeat(64) }];
    const frozenFunctions = [{ rawUtf8: raw, sha256: hash(raw) }];
    expect(() => buildFf8GraphSnapshot({ ...s, peVerification: pe, frozenFunctions })).toThrow(/contradictory PE chunk count\/hash/);
    report.mismatches[0]!.pe_sha256 = digest;
    const exactCitation = buildFf8GraphSnapshot({ ...s, peVerification: pe, frozenFunctions });
    expect(exactCitation.snapshot.nodes.find(node => node.ea === "0x460860")!.byteAgreement).toBe("unknown");
    expect(exactCitation.notes.positivePeProof).toContain("unavailable");
    expect(exactCitation.snapshot.coverage.status).toBe("partial");
  }, 120000);
  test("RV2MAX03: modifying gel bytes and coherently recomputing summary/raw hashes cannot reuse a historical PE boolean as proof", () => {
    const s = ff8Sources(), original = readFileSync(join(NATIVE_DIR, "0x460860.json"), "utf8"), frozen = JSON.parse(original.replace(/^\uFEFF/, ""));
    expect(frozen.chunks[0].hex.slice(0, 2)).not.toBe("00");
    frozen.chunks[0].hex = "00" + frozen.chunks[0].hex.slice(2);
    const rawUtf8 = JSON.stringify(frozen), sha256 = hash(rawUtf8), run01 = structuredClone(s.run01);
    run01.functions.find(record => record.ea === "0x460860")!.sha256 = sha256;
    expect(s.peVerification.results.find(record => record.ea === "0x460860")!.idb_equals_pe_and_freeze).toBe(true);
    const result = buildFf8GraphSnapshot({ ...s, run01, frozenFunctions: [{ rawUtf8, sha256 }] }), node = result.snapshot.nodes.find(record => record.ea === "0x460860")!;
    expect(node.byteAgreement).toBe("unknown");
    expect(node.byteDivergence.known).toBe(false);
    expect(node.analysisRefs.some(ref => ref.startsWith("run01:positive-pe-agreement-unproven:"))).toBe(true);
    expect(result.notes.concordantNodes).toBe(0);
    expect(result.snapshot.nodes.filter(record => record.status === "quarantined").map(record => record.ea).sort()).toEqual([...QUARANTINE_EAS].sort());
    expect(result.snapshot.coverage.selfLoopsPreserved).toBe(false);
    expect(result.snapshot.nodes.every(record => record.admissibleAsOracle === false)).toBe(true);
    expect(fileSha(join(NATIVE_DIR, "0x460860.json"))).toBe(hash(original));
  }, 120000);
  test("NQA07 positive control: all98 original gels stay hash-bound and immutable, but no exact PE proof => no concordant/oracle promotion", () => {
    expect(fileSha(NATIVE_MANIFEST)).toBe("79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5");
    expect(frozenInputs().length).toBe(98);
    const result = ff8Result();
    expect(result.notes.frozenNativeFunctionsVerified).toBe(98);
    expect(result.notes.concordantNodes).toBe(0);
    expect(result.notes.divergentNodes).toBe(4);
    expect(result.notes.unboundPositivePeReports).toBe(94);
    expect(result.snapshot.coverage.status).toBe("partial");
    expect(result.snapshot.nodes.every(record => record.admissibleAsOracle === false)).toBe(true);
  }, 120000);
});

describe("indirect adapter edge cases (synthetic)", () => {
  const MOD2 = "b".repeat(64);
  const mkNode = (rva: number) => ({
    schemaVersion: 1, id: fnId(MOD2, canonicalAddr(rva)), moduleSha256: MOD2, rva: canonicalAddr(rva),
    ea: canonicalAddr(0x400000 + rva), imageBase: "0x400000", name: "", observedDescription: "",
    boundaries: [], sizeBytes: metricUnknown(), instructionCount: metricUnknown(), basicBlockCount: metricUnknown(),
    functionClass: "internal" as const, status: "observed" as const, semanticMaturity: "none" as const,
    analysisRefs: [], byteAgreement: "unknown" as const, admissibleAsOracle: false as const,
    byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null },
  });
  const doc = (sites: any[]): IndirectDocument => ({
    schema_version: "1.1.0",
    generator: "test",
    binary: { path: "x", name: "x.exe", sha256: MOD2, image_base: "0x400000" },
    counts: { sites: sites.length },
    sites,
  });
  test("closed_static single code target in scope becomes indirect_resolved; ghost skipped; import stays unresolved object", () => {
    const caller = fnId(MOD2, 0x1000), target = fnId(MOD2, 0x2000);
    const facts = buildIndirectGraphFacts(doc([
      { site_va: "0x401004", opcode: "call", parent_va: "0x401000", closure: "closed_static", targets: [{ kind: "code", va: "0x402000", name: "sub_402000" }] },
      { site_va: "0x401008", opcode: "call", parent_va: "0x401000", closure: "ghost_not_indirect", targets: [] },
      { site_va: "0x40100C", opcode: "call", parent_va: "0x401000", closure: "closed_static", targets: [{ kind: "import", va: "0xB69094", name: "KERNEL32.dll!Sleep" }] },
    ]), hash("ind"), new Set([caller, target]));
    expect(facts.edges.length).toBe(1);
    expect(facts.edges[0]!.kind).toBe("indirect_resolved");
    expect(facts.edges[0]!.destinationId).toBe(target);
    expect(facts.edges[0]!.sites[0]!.xrefType).toBe("code");
    expect(facts.ghostSiteCount).toBe(1);
    expect(facts.unresolved.length).toBe(1);
    expect(facts.unresolved[0]!.kind).toBe("import_unresolved");
    expect(facts.objects.length).toBe(1);
    expect(facts.objects[0]!.kind).toBe("import");
    expect(facts.objects[0]!.rva).toBeNull();
    expect(facts.extraNodes.length).toBe(0);
  });
  test("resolved target outside the closure becomes an observed terminal node, never a fake callee", () => {
    const caller = fnId(MOD2, 0x1000);
    const facts = buildIndirectGraphFacts(doc([
      { site_va: "0x401010", opcode: "call", parent_va: "0x401000", closure: "closed_static", targets: [{ kind: "code", va: "0x4A09A0", name: "sub_4A09A0" }] },
    ]), hash("ind"), new Set([caller]));
    expect(facts.edges.length).toBe(1);
    expect(facts.extraNodes.length).toBe(1);
    expect(facts.extraNodes[0]!.id).toBe(fnId(MOD2, 0xA09A0));
    expect(facts.extraNodes[0]!.status).toBe("incomplete");
    expect(facts.extraNodes[0]!.rva).toBe(canonicalAddr(0xA09A0));
  });
});

describe("local capability rules", () => {
  const snapshot = (): GraphSnapshotV1 => ff8Result().snapshot;
  test("deterministic; import and table rules fire on FF8 evidence", () => {
    const first = evaluateCapabilities(snapshot());
    const second = evaluateCapabilities(snapshot());
    expect(canonical(first)).toBe(canonical(second));
    const capabilities = new Set(first.map(fact => fact.capability));
    expect(capabilities.has("audio.compression.acm")).toBe(true);
    expect(capabilities.has("rendering.opengl")).toBe(true);
    expect(capabilities.has("rendering.prim-dispatch-table")).toBe(true);
    expect(capabilities.has("magic.table-dispatch")).toBe(true);
    expect(capabilities.has("callback.registration-hypothesis")).toBe(true);
    const callbackFacts = first.filter(fact => fact.capability === "callback.registration-hypothesis");
    expect(callbackFacts.every(fact => fact.confidence === "inferred" && fact.hypotheticalRole === null)).toBe(true);
    const factsById = new Set(first.map(fact => fact.id));
    expect(factsById.size).toBe(first.length);
    expect(first.every(fact => fact.ruleVersion === CAPABILITY_RULESET_VERSION)).toBe(true);
    expect(first.every(fact => fact.evidence.length > 0 && fact.evidence.every(item => /^[a-f0-9]{64}$/.test(item.sha256)))).toBe(true);
  }, 120000);
  test("no propagated facts by default; depth-1 propagation is bounded and deterministic", () => {
    expect(evaluateCapabilities(snapshot()).every(fact => fact.scope === "direct")).toBe(true);
    const config = { propagationDepth: 1 as const, maxPropagationTotal: 32 };
    const propagated = evaluateCapabilities(snapshot(), config).filter(fact => fact.scope === "propagated");
    expect(propagated.length).toBeGreaterThan(0);
    expect(propagated.length).toBeLessThanOrEqual(32);
    expect(propagated.every(fact => fact.confidence === "inferred")).toBe(true);
  }, 120000);
  test("cache: miss -> hit, config change -> miss, embedding capabilities does not change the key, explicit invalidation evicts", () => {
    const cache = new CapabilityCache();
    const config = DEFAULT_CAPABILITY_CONFIG;
    const first = evaluateCapabilitiesCached(snapshot(), cache, config);
    expect(cache.stats().misses).toBe(1);
    const second = evaluateCapabilitiesCached(snapshot(), cache, config);
    expect(cache.stats().hits).toBe(1);
    expect(canonical(second)).toBe(canonical(first));
    const embedded = withCapabilities(snapshot(), first);
    expect(capabilityCacheKey(embedded, config)).toEqual(capabilityCacheKey(snapshot(), config));
    const otherConfig = { propagationDepth: 1 as const, maxPropagationTotal: 32 };
    evaluateCapabilitiesCached(snapshot(), cache, otherConfig);
    expect(cache.stats().misses).toBe(2);
    expect(cache.invalidate(FF8_MODULE_SHA256)).toBe(2);
    expect(cache.stats().size).toBe(0);
    expect(validateGraphSnapshot(embedded)).toEqual([]);
    expect(embedded.capabilities.length).toBe(first.length);
    expect(embedded.normalizedFingerprint).not.toBe(snapshot().normalizedFingerprint);
  }, 120000);
});

describe("L2-POST-GO capa metadata guard addendum", () => {
  const metadata = { version: "fixture-capa", license: "Apache-2.0", backend: "file" as const, rulesSha256: hash("local-rules-metadata") };
  const invalid: Array<[string, unknown]> = [
    ["backend BOGUS", { ...metadata, backend: "BOGUS" }],
    ["backend numeric 7", { ...metadata, backend: 7 }],
    ["backend null", { ...metadata, backend: null }],
    ["backend missing", { version: metadata.version, license: metadata.license, rulesSha256: metadata.rulesSha256 }],
    ["version numeric", { ...metadata, version: 7 }],
    ["version boolean", { ...metadata, version: true }],
    ["version array", { ...metadata, version: [metadata.version] }],
    ["version empty", { ...metadata, version: "" }],
    ["version null", { ...metadata, version: null }],
    ["license numeric", { ...metadata, license: 7 }],
    ["license boolean", { ...metadata, license: true }],
    ["license array", { ...metadata, license: [metadata.license] }],
    ["license empty", { ...metadata, license: "" }],
    ["license null", { ...metadata, license: null }],
    ["rules uppercase", { ...metadata, rulesSha256: "A".repeat(64) }],
    ["rules nonhex", { ...metadata, rulesSha256: "z".repeat(64) }],
    ["rules short", { ...metadata, rulesSha256: "a".repeat(63) }],
    ["rules primitive", { ...metadata, rulesSha256: 7 }],
    ["rules array with coercible digest", { ...metadata, rulesSha256: [metadata.rulesSha256] }],
    ["metadata array with valid attributes", Object.assign([], metadata)],
    ["metadata function with valid attributes", Object.assign(() => {}, metadata)],
    ["metadata number zero", 0],
    ["metadata boolean false", false],
    ["metadata empty primitive string", ""],
    ["metadata nonempty primitive string", "metadata"],
  ];
  for (const [label, local] of invalid) {
    test(`${label}: fail closed instead of truthy availability/falsy absence`, () => {
      expect(() => evaluateCapaAvailability(local as any)).toThrow(/explicit version\/license\/backend\/rules digest required/);
    });
  }
  for (const backend of ["file", "ida"] as const) {
    test(`valid ${backend} metadata retains the existing result, METADATA ONLY without analyzer invocation`, () => {
      const local = { ...metadata, backend };
      expect(evaluateCapaAvailability(local)).toEqual({
        status: "available", ...local,
        limitation: "Explicit local metadata only; backend coverage and accuracy need a separate measured native evaluation. Runtime consumes frozen exports; no implicit analyzer invocation.",
        automaticInstall: false, networkRequired: false,
      });
    });
  }
  test("null and omitted metadata retain the existing absent result and zero-install fallback", () => {
    expect(evaluateCapaAvailability(null)).toEqual(evaluateCapaAvailability());
    expect(evaluateCapaAvailability(null)).toEqual({
      status: "absent", version: null, license: null, backend: null, rulesSha256: null,
      limitation: "No local capa metadata supplied; bounded local rules are the deterministic fallback. Neither capa nor its IDA adapter is installed by this module.",
      automaticInstall: false, networkRequired: false,
    });
  });
});

describe("L2-IDS RV2FINAL01 bounded identities and lossless source bindings", () => {
  const schema = readJson(join(REPO, "tools", "ff8-harness", "schemas", "graph-snapshot-v1.schema.json"));
  const rehash = (doc: GraphSnapshotV1): GraphSnapshotV1 => ({ ...doc, normalizedFingerprint: fingerprintWithout(doc, "normalizedFingerprint") });
  const citationId = (evidence: { detail: string }): string => JSON.parse(evidence.detail.slice(evidence.detail.lastIndexOf("\n") + 1)).sourceId;
  const objectAt = (id: string, kind: "import" | "table", moduleSha256 = MOD): any => ({
    schemaVersion: 1, id, moduleSha256, kind, rva: kind === "import" ? null : "0x3000",
    name: kind === "import" ? "DDRAW.dll!DirectDrawCreate" : "g_PrimDispatch", widthBytes: metricUnknown(),
    provenance: { ...artifactFor().provenance, moduleSha256, siteRva: kind === "import" ? null : "0x3000", siteKind: kind === "import" ? "import" : "object", xrefType: kind === "import" ? "none" : "data" },
  });
  const referenceTo = (id: string, source = nodeAt(0x1000), refId = "ids:import-use"): any => ({
    schemaVersion: 1, id: refId, fromFunctionId: source.id, siteRva: source.rva,
    kind: "import_unresolved", target: "import", referencedObjectId: id, fabricatedFunction: false,
    provenance: { ...artifactFor().provenance, moduleSha256: source.moduleSha256, siteRva: source.rva, siteKind: "instruction", xrefType: "code" },
  });
  const input = (kind: "import" | "table", id: string): GraphSnapshotV1 => build({
    nodes: [nodeAt(0x1000)], objects: [objectAt(id, kind)], unresolved: kind === "import" ? [referenceTo(id)] : [],
  });
  function validOutput(doc: GraphSnapshotV1, facts: ReturnType<typeof evaluateCapabilities>): GraphSnapshotV1 {
    const candidate = rehash({ ...doc, capabilities: facts });
    expect(schemaErrors(candidate, schema)).toEqual([]); // independent code-point-aware L1 oracle
    expect(validateGraphSnapshot(candidate)).toEqual([]);
    for (const fact of facts) {
      expect(fact.id).toMatch(/^cap:[a-f0-9]{64}$/);
      expect([...fact.subjectId].length).toBeLessThanOrEqual(128);
      expect(fact.provenance.evidenceSha256).toBe(hash(canonical(fact.evidence)));
      for (const evidence of fact.evidence) {
        expect(evidence.id).toMatch(/^ev:[a-f0-9]{64}$/);
        expect([...evidence.detail].length).toBeLessThanOrEqual(1800);
      }
    }
    return candidate;
  }

  for (const kind of ["import", "table"] as const) for (const glyph of ["x", "💠"]) for (const length of [125, 126, 128, 129, 160]) {
    test(`${kind}: ${length} ${glyph === "x" ? "ASCII" : "astral Unicode"} points, ordinary raw / empty miss / identical hit are all L1-valid`, () => {
      const id = glyph.repeat(length), doc = input(kind, id), before = canonical(doc);
      expect(schemaErrors(doc, schema)).toEqual([]);
      expect(validateGraphSnapshot(doc)).toEqual([]);
      const facts = evaluateCapabilities(doc), region = facts.find(fact => fact.subjectKind === "region")!;
      expect(facts.length).toBe(kind === "import" ? 2 : 1);
      if (length <= 128) expect(region.subjectId).toBe(id); // UTF16 .length would wrongly alias astral IDs
      else { expect(region.subjectId).not.toBe(id); expect(doc.objects[0]!.id).toBe(id); }
      expect(citationId(region.evidence[0]!)).toBe(id);
      expect(region.evidence[0]!.source).toBe("snapshot.objects");
      expect(region.evidence[0]!.sha256).toBe(hash(canonical(doc.objects[0])));
      expect(region.provenance.moduleSha256).toBe(MOD);
      if (kind === "import") {
        const seed = facts.find(fact => fact.ruleId === "import-use")!;
        expect(seed.subjectId).toBe(doc.nodes[0]!.id);
        expect(seed.evidence[0]).toEqual(region.evidence[0]);
        expect(seed.evidence[1]!.sha256).toBe(hash(canonical(doc.unresolved)));
        expect(doc.unresolved[0]!.referencedObjectId).toBe(id);
      }
      validOutput(doc, facts);
      const cache = new CapabilityCache();
      expect(cache.stats()).toEqual({ size: 0, misses: 0, hits: 0 });
      const miss = evaluateCapabilitiesCached(doc, cache);
      expect(cache.stats()).toEqual({ size: 1, misses: 1, hits: 0 });
      const hit = evaluateCapabilitiesCached(doc, cache);
      expect(cache.stats()).toEqual({ size: 1, misses: 1, hits: 1 });
      expect(miss).toEqual(facts);
      expect(hit).toEqual(facts);
      validOutput(doc, miss);
      validOutput(doc, hit);
      expect(canonical(doc)).toBe(before); // no original/historical snapshot rewrite
    });
  }

  test("160-point escaped source citations survive exactly, distinct tails and same names cannot collide", () => {
    const prefix = Array.from('obj:\u0000"\\\n💠'.repeat(32)).slice(0, 159).join("");
    const ids = [prefix + "A", prefix + "B"];
    const doc = build({ objects: ids.map(id => objectAt(id, "import")) });
    expect(validateGraphSnapshot(doc)).toEqual([]);
    const facts = evaluateCapabilities(doc);
    validOutput(doc, facts);
    expect(new Set(facts.map(fact => fact.id)).size).toBe(2);
    expect(new Set(facts.map(fact => fact.subjectId)).size).toBe(2);
    expect(new Set(facts.map(fact => fact.evidence[0]!.id)).size).toBe(2);
    expect(facts.map(fact => citationId(fact.evidence[0]!)).sort()).toEqual([...ids].sort());
    for (const fact of facts) expect(fact.evidence[0]!.sha256).toBe(hash(canonical(doc.objects.find(object => object.id === citationId(fact.evidence[0]!)))));
  });

  test("natural alias namespace collisions reserve matching AND nonmatching originals, including suffixes, before canonical allocation", () => {
    const longId = "collision:" + "x".repeat(150), seed = input("import", longId);
    const firstAlias = evaluateCapabilities(seed).find(fact => fact.subjectKind === "region")!.subjectId;
    const blockers = [firstAlias, `${firstAlias}:1`, `${firstAlias}:2`].map((id, i) => ({ ...objectAt(id, "import"), name: i === 0 ? "DDRAW.dll!DirectDrawCreate" : "unmatched import" }));
    const doc = build({ nodes: seed.nodes, objects: [...blockers, ...seed.objects], unresolved: seed.unresolved });
    const facts = evaluateCapabilities(doc), longRegion = facts.find(fact => fact.subjectKind === "region" && citationId(fact.evidence[0]!) === longId)!;
    expect(longRegion.subjectId).toBe(`${firstAlias}:3`);
    expect(facts.find(fact => fact.subjectKind === "region" && citationId(fact.evidence[0]!) === firstAlias)!.subjectId).toBe(firstAlias);
    expect(new Set(facts.filter(fact => fact.subjectKind === "region").map(fact => fact.subjectId)).size).toBe(2);
    expect(facts.find(fact => fact.ruleId === "import-use")!.evidence[0]).toEqual(longRegion.evidence[0]);
    expect(evaluateCapabilities(rehash({ ...doc, objects: [...doc.objects].reverse(), unresolved: [...doc.unresolved].reverse() }))).toEqual(facts);
    validOutput(doc, facts);
  });

  test("long cross-module target retains original reference -> source function seed and module provenance; renaming is not identity", () => {
    const fixture = readJson(join(FIXTURES, "ff8-multi-module", "content.json")) as GraphSnapshotV1;
    const source = fixture.nodes[0]!, targetModule = fixture.binaryArtifacts.find(artifact => artifact.contentSha256 !== source.moduleSha256)!;
    const id = "target:" + "💠".repeat(153), object = objectAt(id, "import", targetModule.contentSha256);
    const doc = build({ artifacts: fixture.binaryArtifacts, nodes: fixture.nodes, objects: [object], unresolved: [referenceTo(id, source)] });
    const facts = evaluateCapabilities(doc), region = facts.find(fact => fact.subjectKind === "region")!, seed = facts.find(fact => fact.ruleId === "import-use")!;
    expect(seed.subjectId).toBe(source.id);
    expect(seed.provenance.moduleSha256).toBe(source.moduleSha256);
    expect(region.provenance.moduleSha256).toBe(targetModule.contentSha256);
    expect(seed.evidence[0]).toEqual(region.evidence[0]);
    validOutput(doc, facts);
    const renamed = rehash({ ...doc, objects: [{ ...object, name: "observed:DDRAW.dll!DirectDrawCreate" }] });
    const renamedRegion = evaluateCapabilities(renamed).find(fact => fact.subjectKind === "region")!;
    expect(renamedRegion.subjectId).toBe(region.subjectId);
    expect(renamedRegion.id).toBe(region.id);
    expect(renamedRegion.evidence[0]!.sha256).not.toBe(region.evidence[0]!.sha256);
    const rebound = objectAt(id, "import", source.moduleSha256);
    const otherModule = rehash({ ...doc, objects: [rebound] });
    expect(evaluateCapabilities(otherModule).find(fact => fact.subjectKind === "region")!.subjectId).not.toBe(region.subjectId);
    const cache = new CapabilityCache();
    expect(evaluateCapabilitiesCached(doc, cache)).toEqual(facts);
    expect(evaluateCapabilitiesCached(doc, cache)).toEqual(facts);
    expect(cache.invalidate(targetModule.contentSha256)).toBe(1);
  });

  test("long import seeds, callback and propagated full-hash citations survive 129-site transport repacking and cache clones", () => {
    const original = input("import", "long:" + "x".repeat(155)), callee = original.nodes[0]!;
    const caller = nodeAt(0x2000, { boundaries: [{ ordinal: 0, rva: "0x2000", endRvaExclusive: "0x2200", role: "entry" }], sizeBytes: metricKnown(0x200) });
    const direct = edge(caller.id, callee.id, "direct_call", Array.from({ length: 129 }, (_, i) => site(0x2000 + i)));
    const doc = build({ nodes: [callee, caller], objects: original.objects, unresolved: original.unresolved, edges: [direct, edge(callee.id, caller.id, "callback_candidate", [site(0x1004, "data")])] });
    const repacked = rehash({ ...doc, edges: [doc.edges.find(record => record.kind === "callback_candidate")!, ...Array.from({ length: 5 }, (_, i) => ({ ...direct, id: `ids:repacked:${i}`, sites: direct.sites.slice(i * 32, (i + 1) * 32) }))] });
    const config = { propagationDepth: 1 as const, maxPropagationTotal: 10 }, facts = evaluateCapabilities(doc, config);
    expect(evaluateCapabilities(repacked, config)).toEqual(facts);
    expect(facts.some(fact => fact.scope === "propagated" && fact.subjectId === caller.id && fact.capability === "rendering.directdraw")).toBe(true);
    expect(facts.some(fact => fact.ruleId === "callback-hypothesis")).toBe(true);
    validOutput(doc, facts);
    const cache = new CapabilityCache(), first = evaluateCapabilitiesCached(repacked, cache, config);
    first[0]!.evidence[0]!.detail = "caller mutation";
    expect(evaluateCapabilitiesCached(repacked, cache, config)).toEqual(facts);
    const embedded = validOutput(repacked, facts);
    expect(capabilityCacheKey(embedded, config)).toEqual(capabilityCacheKey(repacked, config));
    expect(evaluateCapabilitiesCached(embedded, cache, config)).toEqual(facts);
    expect(capabilityCacheKey(doc, config).rulesetVersion).toStartWith("l2-local-rules-v5:");
  });

  for (const attack of ["subject", "citation", "record-hash", "capability", "seed-citation", "missing-seed"] as const) {
    test(`shape-valid cached ${attack} cannot forge original-object/alias/function bindings`, () => {
      const doc = input("import", "x".repeat(160)), facts = evaluateCapabilities(doc);
      const forged = structuredClone(facts), region = forged.find(fact => fact.subjectKind === "region")!, seed = forged.find(fact => fact.ruleId === "import-use")!;
      if (attack === "subject") region.subjectId = "region:unrelated-but-L1-shaped";
      if (attack === "citation") region.evidence[0]!.detail = `unrelated source\n${canonical({ sourceId: "another-object" })}`;
      if (attack === "record-hash") region.evidence[0]!.sha256 = hash("unrelated record");
      if (attack === "capability") region.capability = "files.read";
      if (attack === "seed-citation") seed.evidence[1]!.sha256 = hash("unrelated reference");
      if (attack === "missing-seed") forged.splice(forged.indexOf(seed), 1);
      for (const fact of forged) fact.provenance.evidenceSha256 = hash(canonical(fact.evidence));
      validOutput(doc, forged); // strict shape/self-hash alone is insufficient
      const cache = new CapabilityCache();
      cache.set(capabilityCacheKey(doc, DEFAULT_CAPABILITY_CONFIG), forged);
      expect(() => evaluateCapabilitiesCached(doc, cache)).toThrow(/do not bind/);
      expect(evaluateCapabilities(doc)).toEqual(facts);
    });
  }

  test("raw/miss/hit retain malformed-input and malformed-output guards, without storing on failed misses", () => {
    const doc = input("import", "x".repeat(160)), bad = rehash({ ...doc, objects: [{ ...doc.objects[0]!, schemaVersion: 99 as any }] });
    expect(() => evaluateCapabilities(bad)).toThrow(/contract/);
    const cache = new CapabilityCache();
    expect(() => evaluateCapabilitiesCached(bad, cache)).toThrow(/contract/);
    expect(cache.stats()).toEqual({ size: 0, hits: 0, misses: 0 });
    const facts = evaluateCapabilities(doc);
    facts[0]!.evidence[0]!.id = "x".repeat(129);
    cache.set(capabilityCacheKey(doc, DEFAULT_CAPABILITY_CONFIG), facts);
    expect(() => evaluateCapabilitiesCached(doc, cache)).toThrow(/maxLength/);
    expect(cache.invalidate()).toBe(1);
    expect(evaluateCapabilitiesCached(doc, cache)).toEqual(evaluateCapabilities(doc));
  });
});
