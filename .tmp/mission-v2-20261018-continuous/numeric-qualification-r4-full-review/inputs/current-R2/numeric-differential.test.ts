// PROPOSED, NEVER EXECUTED BY THE AUTHOR. Future location: qualification/test/.
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { isAbsolute, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as B from "../../baseline/tools/ff8-harness/src/cluster";
import * as C from "../../candidate/tools/ff8-harness/src/cluster";
import * as D from "../../candidate/tools/ff8-harness/src/sparse-graph-codecs";
import { buildInvestigationGroups as BG } from "../../baseline/tools/ff8-harness/src/investigation-groups";
import { buildInvestigationGroups as CG } from "../../candidate/tools/ff8-harness/src/investigation-groups";
import { fingerprint as BF } from "../../baseline/tools/ff8-harness/src/validation";
import { fingerprint as CF } from "../../candidate/tools/ff8-harness/src/validation";

type Side = "baseline" | "candidate";
type NumericApi = Pick<typeof B, "sparseGraph" | "importSparseGraph" | "exportSparseGraph" | "validateSparseGraph">;
type Work = { state: unknown; action: () => unknown };
type Guard = <T>(label: string, inputs: unknown, call: () => T) => T;
type StageProof = { label: string; before: string; after: string; referenceCount: number; referencesStable: boolean; returned: boolean };
type Expected = { kind: "value" } | { kind: "refusal"; code: string; message?: string };
type ProposedCase = {
  id: string; inputHash: string; config: unknown; expected: Expected; oracle: string;
  make: (side: Side, guard: Guard) => Work;
};
const LIMIT = 2 * 1024 * 1024, BRANCH_LIMIT = 128 * 1024 * 1024;
const SEED = "numeric-context-qualification-v1", H = "a".repeat(64);
const id = (i: number): string => `${H}:0x${(16 + i * 16).toString(16).toUpperCase()}`;
const sha = (bytes: string | Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
function insist(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`qualification: ${message}`);
}
function bits(value: number): string {
  const bytes = Buffer.alloc(8); bytes.writeDoubleBE(value); return bytes.toString("hex");
}

// The ONLY generic observer. A closed, bounded event stream: not canonical JSON,
// not a digest comparator. Event strings contain bit strings, NEVER JSON numbers.
// References (including representable cycles), own-key order, holes, descriptors,
// Map/Set order and null prototypes are explicit. No accessors/custom prototypes.
function observe(value: unknown, references?: object[]): string {
  const events: string[] = [], seen = new Map<object, string>(); let bytes = 0;
  const emit = (...event: string[]): void => {
    const line = JSON.stringify(event); bytes += Buffer.byteLength(line, "utf8") + 1;
    insist(bytes <= LIMIT, "observation exceeds 2 MiB; fatal, not cropped"); events.push(line);
  };
  const visit = (v: unknown, depth: number): void => {
    insist(depth <= 128, "observer depth unsupported");
    if (v === null) { emit("null"); return; }
    switch (typeof v) {
      case "undefined": emit("undefined"); return;
      case "boolean": emit("boolean", v ? "true" : "false"); return;
      case "string": emit("string", v); return;
      case "number": emit("binary64", bits(v)); return;
      case "bigint": emit("bigint", v.toString()); return;
      case "object": break;
      default: throw new Error(`qualification: unsupported observer type ${typeof v}`);
    }
    const previous = seen.get(v);
    if (previous !== undefined) { emit("ref", previous); return; }
    insist(seen.size < 65536, "observer object cap");
    const ref = String(seen.size); seen.set(v, ref); references?.push(v);
    const proto: unknown = Object.getPrototypeOf(v);
    let tag: string;
    if (Array.isArray(v) && proto === Array.prototype) tag = "Array";
    else if (v instanceof Map && proto === Map.prototype) tag = "Map";
    else if (v instanceof Set && proto === Set.prototype) tag = "Set";
    else if (proto === null) tag = "null-record";
    else if (proto === Object.prototype) tag = "record";
    else throw new Error("qualification: unsupported observer prototype (including Error in data)");
    emit("begin", ref, tag);
    if (v instanceof Map) for (const [key, item] of v) { emit("entry"); visit(key, depth + 1); visit(item, depth + 1); }
    if (v instanceof Set) for (const item of v) { emit("item"); visit(item, depth + 1); }
    for (const key of Reflect.ownKeys(v)) {
      insist(typeof key === "string", "symbol own key unsupported");
      const d = Object.getOwnPropertyDescriptor(v, key);
      insist(d !== undefined && Object.hasOwn(d, "value") && !Object.hasOwn(d, "get") && !Object.hasOwn(d, "set"), "accessor/absent descriptor unsupported");
      emit("own", key, String(d.enumerable), String(d.configurable), String(d.writable));
      const item: unknown = d.value; visit(item, depth + 1);
    }
    emit("end", ref);
  };
  visit(value, 0); return events.join("\n");
}

// Fixture order is literally cluster.test.ts:357. The 17th packet fixture,
// ff8-identity-rename, remains in the unchanged original test, not the 16x4 matrix.
const F = "1c8c2893ed9b6bb1f299e0f3878518fbe1df27db1df21c5043699d1728d385bb";
const fixturePins = [
  ["communities-obvious", "fd452804a2c098d68ce4ed18f6dbf5c678af27b221e3f9276005a20c979073e4", `${F}:0x2000`],
  ["components-disconnected", "71079dd202b0bbd50a337f0d1466b1bfb87c68396fe8f51e29ff2823ecb20242", `${F}:0x1000`],
  ["hubs-utilities", "1e38704f35b7325d9277a7fa6dc13aa0c25d0cdc62ce7b407ed4bdbfaf8893aa", `${F}:0x1000`],
  ["cycles-recursion", "e787e99c859f77ea1be54273f163b6c65320382ba7cd5417cf3ca2e2c38091a9", `${F}:0x5100`],
  ["indirect-uncertain", "1e3830d78b077e3f7d09f6effcf325cf360ebcf1c2cddd1ba54039319f379f75", `${F}:0x7000`],
  ["isolates", "658b438153ce8ecac1719457792334a3043efe09c1df1f264e511749e31dd1af", `${F}:0x6000`],
  ["bridges-rare", "69278ee8e28390b623f525774e8fe036231873934fb30ed0e98a2c33353105c4", `${F}:0x2000`],
  ["shared-data", "09b2ce91c3d4c2d0499a0e6d376a8ed534ac12c3d44688084f699d9d77dc0eb8", `${F}:0x8000`],
  ["ff8-chunks-tails", "dcaf79b23970660ec930f56d233b75580a28f5f45f5717488ba0569b31567501", `${F}:0xC000`],
  ["ff8-imports-thunks", "010857160b1eec0509bf9ed3d182d2018b2ea2597174137a5427e2ff90639d41", `${F}:0xB000`],
  ["ff8-data-callback-not-call", "3982efd1696451724029483da7193fbf74eb0064e3bc4aafb0e01862fbdf94d4", `${F}:0xA000`],
  ["ff8-idb-pe-quarantine", "35f019b2caf28aa3346507d3309baaa837df27c987d234f8726ebfcf28db7dd2", "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570:0x60860"],
  ["ff8-multi-module", "513561269a3ae03630a823365bcc11ef259651f2d4fae5cdf0a7d64ca26ff794", `${F}:0x1000`],
  ["ff8-self-loop", "0fe3ac5b2d981992df569db199a9c9d95001ea54950c46ca97053f4edff0127f", `${F}:0x9000`],
  ["ff8-unknown-metrics", "261c31eb7130a916d6525ad5820ba28d2c35d8d8e7c549a65131ee5c0d89079c", `${F}:0xF000`],
  ["ff8-coverage-partial-tails", "b5f5ace60d6e037bb1021177e08df9e2aedff2ac96fbc80ce0c5b96163dbd3c9", `${F}:0xD000`],
] as const;
function loadFixture(name: string, hash: string): B.ClusterInput {
  const bytes = readFileSync(resolve(import.meta.dir, "../../baseline/tools/ff8-harness/test/fixtures/graph", name, "content.json"));
  insist(sha(bytes) === hash, `fixture pin ${name}`);
  // Packet JSON is independently parsed for EVERY branch/case; no cross-branch object.
  const parsed: unknown = JSON.parse(bytes.toString("utf8")); return parsed as B.ClusterInput;
}
function synthetic(n: number, pairs: Array<[number, number]>): B.ClusterInput {
  return {
    snapshotId: `synthetic:${n}`, normalizedFingerprint: BF({ n, pairs }),
    nodes: Array.from({ length: n }, (_, i) => ({ id: id(i), moduleSha256: H, rva: id(i).split(":")[1]!,
      functionClass: "internal", status: "observed", semanticMaturity: "structural",
      sizeBytes: { known: true, value: 16 }, instructionCount: { known: true, value: 4 } })),
    edges: pairs.map(([a, b], i) => ({ sourceId: id(a), destinationId: id(b), kind: "direct_call", status: "observed",
      confidence: "high", retiredInRevision: null, sites: [{ siteRva: `0x${(i + 1).toString(16).toUpperCase()}`, xrefType: "code" }] })),
    objects: [], unresolved: [], capabilities: [], coverage: { status: "complete", uncoveredReason: null },
  };
}
function matrixConfig(algorithm: B.ClusterConfig["algorithm"], firstId: string | undefined): B.ClusterConfig {
  return { algorithm, maxCommunitySize: 128, weights: {}, seedIds: algorithm === "ppr" && firstId !== undefined ? [firstId] : [],
    seedCapabilityIds: [], ppr: {}, leiden: { seed: SEED } };
}
const ok: Expected = { kind: "value" };
const numericNo: Expected = { kind: "refusal", code: "unsupported-numeric" };
function matrixCases(): ProposedCase[] {
  const cases: ProposedCase[] = [];
  for (const [name, hash, firstId] of fixturePins) for (const algorithm of ["historical-cc", "hub-baseline", "leiden", "ppr"] as const) {
    const config = matrixConfig(algorithm, firstId);
    const stem = `fixture/${name}/${algorithm}`;
    cases.push({ id: `${stem}/cluster`, inputHash: hash, config, expected: ok, oracle: "cluster.test.ts:354-367 + explicit PPR seed",
      make: (side, guard) => {
        const api = side === "baseline" ? B : C, input = loadFixture(name, hash), cfg = structuredClone(config);
        const projected = guard("matrix/projectStructural", { input }, () => api.projectStructural(input));
        insist(projected.graph.ids[0] === firstId, `first projected admissible seed ${stem}`);
        return { state: { input, cfg, projected }, action: () => guard("matrix/clusterGraph", { input, cfg }, () => api.clusterGraph(input, cfg)) };
      } });
    for (const mode of ["raw", "provided-affinity"] as const) cases.push({ id: `${stem}/groups/${mode}`, inputHash: hash,
      config: { cluster: config, group: {}, adjacency: mode }, expected: ok, oracle: "cluster.test.ts:354-367; independent branch partition/projection",
      make: (side, guard) => {
        const api = side === "baseline" ? B : C, build = side === "baseline" ? BG : CG;
        const input = loadFixture(name, hash), cfg = structuredClone(config);
        const result = guard("matrix/groups/clusterGraph", { input, cfg }, () => api.clusterGraph(input, cfg));
        insist(result.projection.graph.ids[0] === firstId, `first projected admissible seed ${stem}`);
        const options = mode === "raw" ? {} : { graph: result.projection.graph, hubIds: result.metrics.hubIds };
        const overrides = {};
        return { state: { input, cfg, result, options, overrides }, action: () => guard("matrix/buildInvestigationGroups", { input, partition: result.partition, overrides, options }, () => build(input, result.partition, overrides, options)) };
      } });
  }
  return cases;
}

// Pins and literal moved spans from candidate/MANIFEST.json. These classify
// technical origin evidence; they NEVER replace the scientific comparison.
const productPins: Record<Side, Record<string, string>> = {
  baseline: { "cluster.ts": "c34d02cb1d32f9ccf336c59f1ce4dc421504bb638d9a3c3e94fc2bfe0ffe9303", "investigation-groups.ts": "cf3201b0e6d6ae5d67afc628a8a59e7ecda2a830a07049a1923001033be38525" },
  candidate: { "cluster.ts": "09c2035a16c1d4a1bfe03fc00807920d0af5202b290b0a68d7172a33319a3542", "investigation-groups.ts": "162c979a5c65a6c08625f255d33aba7cb16ba3bb85ddfc7937925b95073d3b1a", "sparse-graph-codecs.ts": "4ca2bed30e2609d87ef499a0b1ad5c0f2d687565161059ae7e6049db25b0f718", "group-context-codecs.ts": "37ef5a09f4d4e6b8172b3962e30cf1442566cef4607295ef493fe4cce6774986" },
};
type Span = readonly [file: string, first: number, last: number, baselineFile: string, baselineFirst: number];
const moved: readonly Span[] = [
  ["sparse-graph-codecs.ts", 12, 12, "cluster.ts", 50], ["sparse-graph-codecs.ts", 16, 21, "cluster.ts", 54],
  ["sparse-graph-codecs.ts", 23, 44, "cluster.ts", 76], ["sparse-graph-codecs.ts", 51, 56, "cluster.ts", 104],
  ["sparse-graph-codecs.ts", 58, 88, "cluster.ts", 115], ["sparse-graph-codecs.ts", 95, 168, "cluster.ts", 191],
  ["sparse-graph-codecs.ts", 174, 231, "cluster.ts", 270],
  ["cluster.ts", 71, 110, "cluster.ts", 146], ["cluster.ts", 111, 592, "cluster.ts", 328],
  ["cluster.ts", 599, 616, "cluster.ts", 816],
  ["group-context-codecs.ts", 46, 54, "investigation-groups.ts", 16],
  ["group-context-codecs.ts", 56, 58, "investigation-groups.ts", 44],
  ["group-context-codecs.ts", 65, 90, "investigation-groups.ts", 58],
  ["group-context-codecs.ts", 93, 108, "investigation-groups.ts", 86],
  ["group-context-codecs.ts", 116, 122, "investigation-groups.ts", 120],
  ["group-context-codecs.ts", 124, 129, "investigation-groups.ts", 128],
  ["group-context-codecs.ts", 131, 132, "investigation-groups.ts", 135],
  ["group-context-codecs.ts", 148, 155, "investigation-groups.ts", 146],
  ["investigation-groups.ts", 51, 67, "investigation-groups.ts", 102],
  ["investigation-groups.ts", 83, 88, "investigation-groups.ts", 154],
  ["investigation-groups.ts", 90, 98, "investigation-groups.ts", 161],
  ["investigation-groups.ts", 101, 112, "investigation-groups.ts", 173],
];
function sourceFile(side: Side, file: string): string {
  return resolve(import.meta.dir, `../../${side}/tools/ff8-harness/src`, file);
}
type Origin = {
  raw: string; file: string; line: number; column: number; sourceHash: string; sourceLine: string;
  kind: "product" | "test" | "prepare-wrapper"; classification: string;
  mappedFile: string | null; mappedLine: number | null; mappedColumn: number | null; mappedSourceHash: string | null;
};
function origins(stack: string, error: Error, side: Side): Origin[] {
  const lines = stack.split(/\r?\n/);
  insist(lines.shift() === `${error.name}: ${error.message}`, "unclassified stack header");
  insist(lines.length > 0, "missing error source frames");
  return lines.map<Origin>(raw => {
    // Only concrete file:line:column frames. Native/eval/async/unavailable source
    // mappings are FATAL parent investigation, never guessed or path-stripped.
    const match = /^\s*at (?:[^()]+? \()?(.+):(\d+):(\d+)\)?$/.exec(raw);
    insist(match !== null, `unavailable origin mapping: ${raw}`);
    const location = match[1]!, file = resolve(location.startsWith("file:") ? fileURLToPath(location) : location);
    const line = Number(match[2]), column = Number(match[3]);
    insist(Number.isSafeInteger(line) && Number.isSafeInteger(column), "noninteger source coordinates");
    const ownTest = file === resolve(import.meta.path);
    const leaf = Object.keys(productPins[side]).find(name => sourceFile(side, name) === file);
    insist(ownTest || leaf !== undefined, "source frame outside closed pinned tree; do not read foreign origin");
    const bytes = readFileSync(file), text = bytes.toString("utf8").split(/\r?\n/), sourceHash = sha(bytes);
    insist(line >= 1 && line <= text.length && column >= 1 && column <= text[line - 1]!.length + 1, "source coordinates outside pinned text");
    const sourceLine = text[line - 1]!;
    if (ownTest) return { raw, file, line, column, sourceHash, sourceLine, kind: "test",
      mappedFile: file, mappedLine: line, mappedColumn: column, mappedSourceHash: sourceHash,
      classification: "exact common authored-test file/hash/line/column; no generic frame token" };
    insist(leaf !== undefined && sourceHash === productPins[side][leaf], "source frame outside pinned product tree");
    if (side === "baseline") return { raw, file, line, column, sourceHash, sourceLine, kind: "product",
      mappedFile: file, mappedLine: line, mappedColumn: column, mappedSourceHash: sourceHash,
      classification: `baseline:${leaf}:${line}:${column}` };
    const span = moved.find(([name, first, last]) => name === leaf && line >= first && line <= last);
    if (span) {
      const baselineLine = span[4] + line - span[1], originalBytes = readFileSync(sourceFile("baseline", span[3]));
      insist(sha(originalBytes) === productPins.baseline[span[3]], "baseline origin pin drift");
      const original = originalBytes.toString("utf8").split(/\r?\n/);
      const exportPrefix = leaf === "sparse-graph-codecs.ts" && [51, 52, 65, 68, 71, 74, 78, 88].includes(line)
        || leaf === "group-context-codecs.ts" && line === 56;
      insist(text[line - 1] === (exportPrefix ? `export ${original[baselineLine - 1]}` : original[baselineLine - 1]), "moved source line differs beyond declared linkage prefix");
      const mappedColumn = column - (exportPrefix ? 7 : 0);
      insist(mappedColumn >= 1 && mappedColumn <= original[baselineLine - 1]!.length + 1, "unjustifiable export-prefix/source column");
      return { raw, file, line, column, sourceHash, sourceLine, kind: "product",
        mappedFile: sourceFile("baseline", span[3]), mappedLine: baselineLine, mappedColumn,
        mappedSourceHash: sha(originalBytes), classification: exportPrefix ? "proved exact 7-character export prefix plus moved line" : "literal moved source line and unchanged column" };
    }
    // Only this callsite can add a frame in the 226 expected refusals. It has
    // NO invented baseline coordinate; pair reconciliation must justify it.
    if (leaf === "investigation-groups.ts" && line === 49)
      return { raw, file, line, column, sourceHash, sourceLine, kind: "prepare-wrapper",
        mappedFile: null, mappedLine: null, mappedColumn: null, mappedSourceHash: null,
        classification: "candidate-only producer call to prepareGroupContextSource; requires closed neighbor proof" };
    throw new Error(`qualification: unavailable origin mapping ${leaf}:${line}; parent investigation required`);
  });
}
type ErrorOwn = Array<{ key: string; descriptor: { enumerable: boolean; configurable: boolean; writable: boolean; value: unknown } }>;
function semanticOwn(raw: ErrorOwn): ErrorOwn {
  return raw.map(entry => ({ key: entry.key, descriptor: { ...entry.descriptor,
    value: entry.key === "stack" ? { technicalValue: "raw-stack-string-retained-separately-v2" } : entry.descriptor.value } }));
}
function sameOrigin(a: Origin | undefined, b: Origin | undefined): boolean {
  return a !== undefined && b !== undefined && a.kind !== "prepare-wrapper" && b.kind !== "prepare-wrapper"
    && a.kind === b.kind && a.mappedFile === b.mappedFile && a.mappedLine === b.mappedLine
    && a.mappedColumn === b.mappedColumn && a.mappedSourceHash === b.mappedSourceHash
    && (a.kind !== "test" || a.file === b.file && a.sourceHash === b.sourceHash && a.line === b.line && a.column === b.column);
}
// Finite source-derived insertion table, not a drop-wrapper whitelist. At each
// row, candidate prepare's exact callee site corresponds to the baseline inlined
// producer site; the additional producer frame is ONLY candidate inv-groups:49.
const prepareInsertions = [
  { rule: "prepare/minimum-size", candidateCalleeLine: 67, baselineCalleeLine: 60, call: "requireThat(" },
  { rule: "prepare/empty-partition", candidateCalleeLine: 72, baselineCalleeLine: 65, call: "requireThat(" },
  { rule: "prepare/affinity-validation", candidateCalleeLine: 93, baselineCalleeLine: 86, call: "validateSparseGraph(" },
] as const;
function reconcileOrigins(baseline: readonly Origin[], candidate: readonly Origin[]) {
  const proof: Array<{ kind: string; baselineIndices: number[]; candidateIndices: number[]; evidence: unknown }> = [];
  const consumedBaseline: number[] = [], consumedCandidate: number[] = [];
  let bi = 0, ci = 0;
  while (bi < baseline.length || ci < candidate.length) {
    const b = baseline[bi], c = candidate[ci];
    if (sameOrigin(b, c)) {
      proof.push({ kind: "aligned-source-coordinate", baselineIndices: [bi], candidateIndices: [ci], evidence: { baseline: b, candidate: c } });
      consumedBaseline.push(bi++); consumedCandidate.push(ci++); continue;
    }
    const previousB = baseline[bi - 1], previousC = candidate[ci - 1], nextC = candidate[ci + 1];
    const row = prepareInsertions.find(r => previousC?.file === sourceFile("candidate", "group-context-codecs.ts")
      && previousC.line === r.candidateCalleeLine && previousB?.file === sourceFile("baseline", "investigation-groups.ts")
      && previousB.line === r.baselineCalleeLine);
    const callStart = c?.sourceLine.indexOf("prepareGroupContextSource(") ?? -1;
    const callerIsReviewedTestCall = nextC?.kind === "test" && (nextC.sourceLine.includes("build(") || nextC.sourceLine.includes("BG : CG"));
    if (c?.kind === "prepare-wrapper" && c.file === sourceFile("candidate", "investigation-groups.ts") && c.line === 49
      && c.sourceHash === productPins.candidate["investigation-groups.ts"] && callStart >= 0 && c.column >= callStart + 1
      && row !== undefined && sameOrigin(previousB, previousC) && previousC?.sourceLine.includes(row.call)
      && proof.at(-1)?.kind === "aligned-source-coordinate" && callerIsReviewedTestCall && sameOrigin(b, nextC)) {
      proof.push({ kind: "source-justified-candidate-prepare-insertion", baselineIndices: [], candidateIndices: [ci], evidence: {
        rule: row, wrapper: c, previousAligned: { baselineIndex: bi - 1, candidateIndex: ci - 1, baseline: previousB, candidate: previousC },
        nextAligned: { baselineIndex: bi, candidateIndex: ci + 1, baseline: b, candidate: nextC },
        rationale: "Pinned producer:49 calls prepareGroupContextSource; exact callee line maps the former inline site; immediate caller remains the exact shared reviewed test coordinate. This step consumes, retains and justifies the inserted frame." } });
      consumedCandidate.push(ci++); continue;
    }
    throw new Error(`qualification: full origin chain incompatible at baseline[${bi}] candidate[${ci}]; no frame omitted`);
  }
  insist(consumedBaseline.length === baseline.length && consumedBaseline.every((index, i) => index === i)
    && consumedCandidate.length === candidate.length && consumedCandidate.every((index, i) => index === i), "origin proof must consume every frame index on both sides");
  return { baselineCount: baseline.length, candidateCount: candidate.length, consumedBaseline, consumedCandidate, proof };
}
function refusalObservation(caught: unknown, side: Side) {
  insist(caught instanceof Error, "non-Error refusal unsupported");
  const api = side === "baseline" ? B : C;
  const diagnosticError = caught instanceof api.ClusterDiagnosticError;
  const diagnostic = caught instanceof api.ClusterDiagnosticError ? caught.diagnostic : undefined;
  insist(diagnosticError || (Object.getPrototypeOf(caught) === Error.prototype && /^(cluster|investigation-groups): /.test(caught.message)), "not a scientific refusal (import/path/runner errors are fatal)");
  const raw: ErrorOwn = [];
  for (const key of Reflect.ownKeys(caught)) {
    insist(typeof key === "string" && ["message", "stack", "name", "diagnostic"].includes(key), "unknown Error property; parent investigation required");
    const d = Object.getOwnPropertyDescriptor(caught, key);
    insist(d !== undefined && Object.hasOwn(d, "value") && !Object.hasOwn(d, "get") && !Object.hasOwn(d, "set"), "Error accessor descriptor unsupported");
    const value: unknown = d.value;
    const entry = { key, descriptor: { enumerable: !!d.enumerable, configurable: !!d.configurable, writable: !!d.writable, value } };
    raw.push(entry);
  }
  insist(typeof caught.stack === "string", "missing raw stack");
  const frames = origins(caught.stack, caught, side);
  insist(frames[0]!.kind === "product", "scientific refusal has no mapped throwing origin");
  return { semantic: { name: caught.name, message: caught.message, own: semanticOwn(raw),
    code: diagnostic === undefined ? "Error" : diagnostic.code },
    raw: { own: raw, rawStack: caught.stack, frames } };
}

// The source-only corpus builder below returns data/closures. It is invoked only
// inside the future test body, never while loading this proposed test module.
function numericCases(): ProposedCase[] {
  const result: ProposedCase[] = [];
  const add = (name: string, config: unknown, expected: Expected, oracle: string, make: ProposedCase["make"]): void => {
    result.push({ id: `numeric/${name}`, inputHash: sha(observe(config)), config, expected, oracle, make });
  };
  for (const direct of [false, true]) for (const scale of [2 ** -1000, 1, 2 ** 990]) {
    add(`roundtrip/${direct ? "direct" : "public"}/${bits(scale)}`, { direct, scale, seed: "roundtrip", tolerance: .5 * scale, pprDirections: ["callee", "caller", "both"] }, ok, "cluster.test.ts:568-586", (side, guard) => {
      const api = side === "baseline" ? B : C, codec: NumericApi = side === "candidate" && direct ? D : api;
      const arcs = [{ source: 0, target: 1, weight: scale }, { source: 0, target: 1, weight: scale * 2 ** -54 }, { source: 2, target: 3, weight: scale }];
      const ids = [id(0), id(1), id(2), id(3)];
      const graph = guard("roundtrip/sparseGraph", { ids, arcs }, () => codec.sparseGraph(ids, arcs));
      return { state: { graph, arcs }, action: () => {
        if (side === "candidate") { expect(C.sparseGraph).toBe(D.sparseGraph); expect(C.exportSparseGraph).toBe(D.exportSparseGraph); expect(C.importSparseGraph).toBe(D.importSparseGraph); }
        const snapshot = guard("roundtrip/export", graph, () => codec.exportSparseGraph(graph));
        const imported: unknown = JSON.parse(JSON.stringify(snapshot));
        const restored = guard("roundtrip/import", imported, () => codec.importSparseGraph(imported));
        const reexported = guard("roundtrip/reexport", restored, () => codec.exportSparseGraph(restored));
        insist(observe(reexported) === observe(snapshot), "exact snapshot reexport roundtrip");
        const leidenConfig = { seed: "roundtrip", temperature: 0, tolerance: .5 * scale };
        const lr = guard("roundtrip/leiden", { restored, leidenConfig }, () => api.leiden(restored, leidenConfig));
        const ppr = (["callee", "caller", "both"] as const).map(direction => {
          const seeds = [id(0)], config = { direction, tolerance: 1e-11 };
          const p = guard(`roundtrip/ppr/${direction}`, { restored, seeds, config }, () => api.personalizedPageRank(restored, seeds, config));
          expect(cmp(pprOracle(4, arcs, [0], direction, .85).residual(p.scores), fromNumber(p.residualUpperBound))).toBeLessThanOrEqual(0); return p;
        });
        const labels = [0, 0, 1, 1];
        return { graph, snapshot, restored, reexported, lr, ppr, modularity: guard("roundtrip/modularity", { restored, labels }, () => api.directedModularity(restored, labels)) };
      } };
    });
  }
  for (const direct of [false, true]) add(`legacy/${direct ? "direct" : "public"}`, { direct, seed: SEED }, ok, "cluster.test.ts:588-592", (side, guard) => {
    const api = side === "baseline" ? B : C, codec: NumericApi = side === "candidate" && direct ? D : api;
    const ids = [id(0), id(1)], arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }];
    const graph = guard("legacy/sparseGraph", { ids, arcs }, () => codec.sparseGraph(ids, arcs));
    delete graph.numericPolicy; delete graph.numericSource;
    return { state: graph, action: () => {
      const exported = guard("legacy/export", graph, () => codec.exportSparseGraph(graph));
      const restored = guard("legacy/import", exported, () => codec.importSparseGraph(exported));
      insist(exported.numericPolicy.weightConvention === "canonical-arcs-v1", "legacy convention");
      const config = { seed: SEED, temperature: 0 };
      return { graph, exported, restored, leiden: guard("legacy/leiden", { graph, config }, () => api.leiden(graph, config)) };
    } };
  });
  const poison: Array<[string, (g: B.SparseGraph, side: Side) => void]> = [
    ["arc", g => { g.arcs[0]!.weight *= 2; }], ["id", g => { g.ids[0] = id(99); }],
    ["out", g => { g.out[0]!.set(1, 2); }], ["incoming", g => { g.incoming[1]!.set(0, 2); }],
    ["outDegree", g => { g.outDegree[0]!++; }], ["inDegree", g => { g.inDegree[1]!++; }],
    ["totalWeight", g => { g.totalWeight++; }], ["negativeZeroCache", g => { g.outDegree[1] = -0; }],
    ["summandWeight", g => { g.numericSource!.arcs[0]!.weight *= 2; }], ["summandEndpoint", g => { g.numericSource!.arcs[0]!.source = 99; }],
    ["summandZero", g => { g.numericSource!.arcs[0]!.weight = 0; }], ["summandNegativeZero", g => { g.numericSource!.arcs[0]!.weight = -0; }],
    ["summandInfinity", g => { g.numericSource!.arcs[0]!.weight = Infinity; }], ["summandNaN", g => { g.numericSource!.arcs[0]!.weight = NaN; }],
    ["summandOrder", g => { g.numericSource!.arcs.reverse(); }], ["rawCount", g => { g.numericSource!.rawArcCount++; }],
    ["sourceBudget", g => { g.numericSource!.maxArcs = 1; }], ["sourceVersion", g => { (g.numericSource as { version: string }).version = "unknown"; }],
    ["binding", g => { g.numericSource!.bindingFingerprint = "0".repeat(64); }], ["missingSource", g => { delete g.numericSource; }],
    ["missingPolicy", g => { delete g.numericPolicy; }], ["convention", g => { g.numericPolicy!.weightConvention = "canonical-arcs-v1"; }],
    ["rehashedStaleCaches", (g, side) => {
      g.totalWeight = 99; const s = g.numericSource!, fingerprint = side === "baseline" ? BF : CF;
      const binding = fingerprint({ version: B.NUMERIC_POLICY_VERSION, weightConvention: "source-summands-v1",
        projection: { ids: g.ids, arcs: g.arcs, out: g.out.map(m => [...m]), incoming: g.incoming.map(m => [...m]), outDegree: g.outDegree, inDegree: g.inDegree, totalWeight: g.totalWeight },
        source: { version: s.version, arcs: s.arcs, rawArcCount: s.rawArcCount, budgetVersion: s.budgetVersion, maxArcs: s.maxArcs } });
      s.bindingFingerprint = g.numericPolicy!.bindingFingerprint = binding;
    }],
  ];
  const consumers = ["validate", "components", "conductance", "sweep", "ppr", "modularity", "leiden", "export", "groups"] as const;
  for (const [name, change] of poison) for (const consumer of consumers) add(`poison/${name}/${consumer}`, { poison: name, consumer, seed: SEED }, numericNo, "cluster.test.ts:594-613", (side, guard) => {
    const api = side === "baseline" ? B : C, input = synthetic(4, [[0, 1], [2, 3]]);
    const config: B.ClusterConfig = { algorithm: "hub-baseline", leiden: { seed: SEED } };
    const partition = guard("poison/clusterGraph", { input, config }, () => api.clusterGraph(input, config)).partition;
    const ids = input.nodes.map(n => n.id), arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }, { source: 2, target: 3, weight: 1 }];
    const graph = guard("poison/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
    change(graph, side);
    const members = [0], scores = [.5, .5, 0, 0], seeds = [id(0)], labels = [0, 0, 1, 1];
    const leidenConfig = { seed: SEED }, groupOverrides = {}, groupOptions = { graph };
    return { state: { input, partition, graph, members, scores, seeds, labels, leidenConfig, groupOverrides, groupOptions }, action: () => {
      switch (consumer) {
        case "validate": return api.validateSparseGraph(graph);
        case "components": return api.weakComponents(graph);
        case "conductance": return api.conductance(graph, members);
        case "sweep": return api.sweepCut(graph, scores, 2);
        case "ppr": return api.personalizedPageRank(graph, seeds);
        case "modularity": return api.directedModularity(graph, labels);
        case "leiden": return api.leiden(graph, leidenConfig);
        case "export": return api.exportSparseGraph(graph);
        case "groups": return (side === "baseline" ? BG : CG)(input, partition, groupOverrides, groupOptions);
      }
    } };
  });
  for (const direct of [false, true]) for (const mode of ["missingSource", "mutatedSnapshot"] as const) add(`import-refusal/${direct ? "direct" : "public"}/${mode}`, { direct, mode }, numericNo, "cluster.test.ts:585-586,614", (side, guard) => {
    const api = side === "baseline" ? B : C, codec: NumericApi = side === "candidate" && direct ? D : api;
    const ids = [id(0), id(1)], arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }];
    const graph = guard("import-refusal/sparseGraph", { ids, arcs }, () => codec.sparseGraph(ids, arcs));
    const snapshot = guard("import-refusal/export", graph, () => codec.exportSparseGraph(graph));
    if (mode === "missingSource") delete snapshot.numericSource; else snapshot.numericSource!.arcs[0]!.weight *= 2;
    guard("import-refusal/validate-owned-source", graph, () => codec.validateSparseGraph(graph));
    return { state: { graph, snapshot }, action: () => codec.importSparseGraph(snapshot) };
  });
  add("stale-after-validation", { poison: "outDegree-after-valid-receipt" }, numericNo, "cluster.test.ts:615", (side, guard) => {
    const api = side === "baseline" ? B : C, ids = [id(0), id(1)], arcs = [{ source: 0, target: 1, weight: 1 }];
    const g = guard("stale/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
    guard("stale/initial-validation", g, () => api.validateSparseGraph(g)); g.outDegree[0]!++;
    return { state: g, action: () => api.validateSparseGraph(g) };
  });
  add("summand-binding-groups", { source: "raw-summands-versus-rounded" }, ok, "cluster.test.ts:616-619", (side, guard) => {
    const api = side === "baseline" ? B : C, build = side === "baseline" ? BG : CG, input = synthetic(4, [[0, 1], [2, 3]]);
    const config: B.ClusterConfig = { algorithm: "hub-baseline", leiden: { seed: SEED } };
    const partition = guard("binding/clusterGraph", { input, config }, () => api.clusterGraph(input, config)).partition;
    const ids = input.nodes.map(n => n.id), arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 ** -54 }, { source: 2, target: 3, weight: 1 }];
    const graph = guard("binding/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
    const rounded = guard("binding/roundedSparseGraph", graph, () => api.sparseGraph(graph.ids, graph.arcs));
    return { state: { input, partition, graph, rounded }, action: () => {
      const overrides = {}, aOptions = { graph }, bOptions = { graph: rounded };
      const a = guard("binding/build-original", { input, partition, overrides, aOptions }, () => build(input, partition, overrides, aOptions));
      const b = guard("binding/build-rounded", { input, partition, overrides, bOptions }, () => build(input, partition, overrides, bOptions));
      expect(a.groups.map(g => g.groupId)).toEqual(b.groups.map(g => g.groupId));
      expect(a.metrics.contextBinding.bindingFingerprint).not.toBe(b.metrics.contextBinding.bindingFingerprint);
      return { a, b };
    } };
  });
  for (const mode of ["source-refusal", "retained-success", "score-refusal", "unique-no-retention"] as const) add(`budgets/${mode}`, { mode, sourceBudget: mode === "source-refusal" ? 3 : 8, scoreBudget: mode === "score-refusal" ? 7 : 8 }, mode === "source-refusal" ? { kind: "refusal", code: "numeric-source-budget-exceeded" } : mode === "score-refusal" ? { kind: "refusal", code: "ppr-score-budget-exceeded" } : ok, "cluster.test.ts:621-631", (side, guard) => {
    const api = side === "baseline" ? B : C;
    const arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 1, weight: 2 }, { source: 1, target: 0, weight: 1 }, { source: 1, target: 0, weight: 2 }];
    return { state: arcs, action: () => {
      const ids = [id(0), id(1)], options = { maxNumericSourceArcs: mode === "source-refusal" ? 3 : 8 };
      const graph = guard("budget/sparseGraph", { ids, arcs, options }, () => api.sparseGraph(ids, arcs, options));
      if (mode === "unique-no-retention") { const unique = { maxNumericSourceArcs: 1 }; return guard("budget/unique-sparseGraph", { graph, unique }, () => api.sparseGraph(graph.ids, graph.arcs, unique)); }
      const seeds = [id(0)], config: Partial<B.PprConfig> = { direction: "both", maxScoreCells: mode === "score-refusal" ? 7 : 8 };
      const ppr = guard("budget/ppr", { graph, seeds, config }, () => api.personalizedPageRank(graph, seeds, config));
      expect(ppr.numericArcStorage).toEqual({ inputRetainedSummands: 4, viewRetainedSummands: 8, transitionEntries: 8, rowEntries: 8 });
      return { graph, ppr };
    } };
  });
  for (const weight of [Number.MIN_VALUE, 1e-320, 1, 2 ** 1000]) add(`tiny-cycles/${bits(weight)}`, { weight, seedIds: [id(0)], tolerance: 1e-12 }, ok, "cluster.test.ts:532-542 (same rational oracle)", (side, guard) => {
    const api = side === "baseline" ? B : C, arcs = [[0, 1], [1, 0], [2, 3], [3, 2]].map(([source, target]) => ({ source: source!, target: target!, weight }));
    const ids = [id(0), id(1), id(2), id(3)];
    const graph = guard("tiny/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
    return { state: graph, action: () => {
      const seeds = [id(0)], config = { tolerance: 1e-12 };
      const ppr = guard("tiny/ppr", { graph, seeds, config }, () => api.personalizedPageRank(graph, seeds, config));
      expect(ppr.converged).toBe(true); expect(ppr.scores.slice(2)).toEqual([0, 0]);
      expect(cmp(pprOracle(4, arcs, [0], "callee", .85).residual(ppr.scores), fromNumber(ppr.residualUpperBound))).toBeLessThanOrEqual(0);
      return { graph, ppr };
    } };
  });
  add("subnormal-gain", { seed: "rv-subnormal", tolerance: Number.MIN_VALUE, temperature: 0 }, ok, "cluster.test.ts:544-553", (side, guard) => {
    const api = side === "baseline" ? B : C, u = Number.MIN_VALUE;
    const arcs = [{ source: 0, target: 1, weight: 3 * u }, { source: 2, target: 3, weight: 2 * u }], ids = [id(0), id(1), id(2), id(3)];
    const graph = guard("gain/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
    return { state: graph, action: () => {
      const before = movesOracle(4, arcs, [0, 1, 2, 3], u);
      expect(before.max).toEqual(r(6n, 25n)); expect(before.threshold).toEqual(r(1n, 5n));
      const config = { seed: "rv-subnormal", resolution: 1, temperature: 0, tolerance: u };
      const leiden = guard("gain/leiden", { graph, config }, () => api.leiden(graph, config));
      expect(leiden.modularity).toBe(.48); expect(leiden.originalGainTolerance).toBe(.2);
      expect(movesOracle(4, arcs, leiden.labels, u).improving).toBe(0);
      return { graph, leiden };
    } };
  });
  for (const mode of ["huge-success", "duplicate-overflow", "total-overflow", "range-ppr", "range-leiden", "projection-underflow"] as const) add(`range/${mode}`, { mode, seed: SEED }, mode === "huge-success" ? ok : numericNo, "cluster.test.ts:710-720", (side, guard) => {
    const api = side === "baseline" ? B : C;
    if (mode === "projection-underflow") {
      const input = synthetic(2, [[0, 1]]); input.nodes[0]!.functionClass = "import";
      const config: B.ClusterConfig = { algorithm: "leiden", weights: { direct: Number.MIN_VALUE, importFactor: .5 }, leiden: { seed: SEED } };
      return { state: { input, config }, action: () => guard("range/projection-underflow", { input, config }, () => api.clusterGraph(input, config)) };
    }
    const arcs = mode === "duplicate-overflow" ? [{ source: 0, target: 1, weight: Number.MAX_VALUE }, { source: 0, target: 1, weight: Number.MAX_VALUE }] : mode === "total-overflow" ? [{ source: 0, target: 1, weight: Number.MAX_VALUE }, { source: 1, target: 0, weight: Number.MAX_VALUE }] : mode.startsWith("range-") ? [{ source: 0, target: 1, weight: Number.MIN_VALUE }, { source: 0, target: 0, weight: 1e308 }] : [{ source: 0, target: 1, weight: 1e308 }];
    return { state: arcs, action: () => {
      const ids = [id(0), id(1)];
      const graph = guard("range/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs));
      const seeds = [id(0)], config = { seed: SEED };
      if (mode === "range-ppr") return guard("range/ppr", { graph, seeds }, () => api.personalizedPageRank(graph, seeds));
      if (mode === "range-leiden") return guard("range/leiden", { graph, config }, () => api.leiden(graph, config));
      if (mode !== "huge-success") return graph;
      const members = [0], labels = [0, 0];
      const cut = guard("huge/conductance", { graph, members }, () => api.conductance(graph, members));
      const modularity = guard("huge/modularity", { graph, labels }, () => api.directedModularity(graph, labels));
      expect(cut).toBe(1); expect(modularity).toBe(0);
      const leidenConfig = { seed: SEED, tolerance: 1e295, temperature: 0 };
      return { graph, cut, modularity, ppr: guard("huge/ppr", { graph, seeds }, () => api.personalizedPageRank(graph, seeds)), leiden: guard("huge/leiden", { graph, leidenConfig }, () => api.leiden(graph, leidenConfig)) };
    } };
  });
  for (const [direct, importFactor, utilityFactor] of [[1e-200, 1e-200, 1e200], [1e200, 1e200, 1e-200]] as const) add(`projection-product/${bits(direct)}`, { direct, importFactor, utilityFactor }, ok, "cluster.test.ts:722-727", side => {
    const api = side === "baseline" ? B : C, input = synthetic(2, [[0, 1]]); input.nodes[0]!.functionClass = "import"; input.nodes[1]!.functionClass = "wrapper";
    const overrides = { direct, importFactor, utilityFactor };
    return { state: { input, overrides }, action: () => api.projectStructural(input, overrides) };
  });
  for (const algorithm of ["historical-cc", "hub-baseline", "ppr", "leiden"] as const) add(`empty/${algorithm}`, matrixConfig(algorithm, undefined), { kind: "refusal", code: "empty-snapshot-no-partition" }, "cluster.test.ts:415-422", side => {
    const api = side === "baseline" ? B : C, input = synthetic(0, []), config = matrixConfig(algorithm, undefined);
    return { state: { input, config }, action: () => api.clusterGraph(input, config) };
  });
  return result;
}

function groupCases(): ProposedCase[] {
  const modes = ["balanced-split", "preserve", "attach", "unknown-cost", "known-cost", "hub-cap", "empty-kernel", "capability-overflow", "context-raw", "context-affinity", "context-hub", "context-community-omission", "partial-coverage", "cost-overflow", "invalid-sizes", "empty-partition"] as const;
  return modes.map<ProposedCase>(mode => ({ id: `synthetic-groups/${mode}`, inputHash: sha(observe({ mode })), config: { mode, seed: SEED },
    expected: mode === "cost-overflow" ? { kind: "refusal", code: "Error", message: "investigation-groups: cost overflow" } : mode === "invalid-sizes" ? { kind: "refusal", code: "Error", message: "investigation-groups: minimum exceeds maximum" } : mode === "empty-partition" ? { kind: "refusal", code: "Error", message: "investigation-groups: empty snapshot/partition: no v1 partition exists; do not synthesize empty groups" } : ok,
    oracle: "cluster.test.ts:368-437; closed named variants", make: (side, guard) => {
      const api = side === "baseline" ? B : C, build = side === "baseline" ? BG : CG;
      const n = mode === "balanced-split" ? 17 : mode === "hub-cap" ? 5 : mode.startsWith("context-") || ["known-cost", "unknown-cost"].includes(mode) ? 3 : 2;
      const pairs: Array<[number, number]> = mode === "hub-cap" ? [[0, 4], [1, 4], [2, 4], [3, 4]] : mode.startsWith("context-") ? [] : Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
      const input = synthetic(n, pairs);
      const clusterConfig: B.ClusterConfig = { algorithm: mode === "balanced-split" || mode === "known-cost" || mode === "unknown-cost" ? "historical-cc" : "hub-baseline", maxCommunitySize: ["preserve", "attach"].includes(mode) ? 1 : 128, weights: mode === "hub-cap" ? { hubThreshold: 4 } : {}, leiden: { seed: SEED } };
      const cluster = guard("synthetic-groups/clusterGraph", { input, clusterConfig }, () => api.clusterGraph(input, clusterConfig));
      const partition = cluster.partition;
      const overrides = mode === "balanced-split" ? { minSize: 4, maxSize: 6 } : mode === "attach" ? { smallPolicy: "attach-adjacent" as const } : mode === "invalid-sizes" ? { minSize: 5, maxSize: 2 } : mode === "hub-cap" || mode.startsWith("context-") ? { maxContextFunctions: 1 } : {};
      if (mode === "known-cost" || mode === "unknown-cost") { partition.communities[0]!.kernelIds = [id(0), id(1)]; input.nodes[1]!.status = "quarantined"; input.nodes[1]!.semanticMaturity = "partial"; if (mode === "unknown-cost") input.nodes[0]!.instructionCount = { known: false, value: null }; }
      if (mode === "empty-kernel") partition.communities[0]!.kernelIds = [];
      if (mode === "context-community-omission") partition.communities[0]!.externalContextIds = [id(1), id(2)];
      if (mode === "capability-overflow") input.capabilities = Array.from({ length: 300 }, (_, i) => ({ id: `cap:${i}`, subjectId: id(0), subjectKind: "function", capability: "entry" }));
      if (mode === "partial-coverage") input.coverage = { status: "partial", uncoveredReason: "fixture partial scope" };
      if (mode === "cost-overflow") input.nodes[0]!.instructionCount = { known: true, value: Number.MAX_SAFE_INTEGER };
      if (mode === "empty-partition") { input.nodes = []; input.edges = []; partition.communities = []; }
      const ids = input.nodes.map(n => n.id), arcs = [{ source: 0, target: 1, weight: 1 }, { source: 0, target: 2, weight: 2 }];
      const graph = mode.startsWith("context-") ? guard("synthetic-groups/sparseGraph", { ids, arcs }, () => api.sparseGraph(ids, arcs)) : cluster.projection.graph;
      const options = mode === "context-raw" ? {} : { graph, hubIds: mode === "context-hub" ? [id(2)] : cluster.metrics.hubIds };
      return { state: { input, partition, graph, options, overrides }, action: () => {
        const groups = build(input, partition, overrides, options);
        if (mode === "balanced-split") expect(groups.groups.map(g => g.ownedFunctionIds.length)).toEqual([6, 6, 5]);
        if (mode === "preserve") expect(groups.groups).toHaveLength(2);
        if (mode === "attach") expect(groups.groups).toHaveLength(1);
        if (mode === "unknown-cost") expect(groups.groups[0]!.estimatedCost).toEqual({ known: false, value: null });
        if (mode === "known-cost") expect(groups.groups[0]!.estimatedCost).toEqual({ known: true, value: 9 });
        if (mode === "empty-kernel") { expect(groups.groups).toEqual([]); expect(groups.metrics.nonCoveredIds).toEqual([id(0), id(1)]); }
        if (mode === "capability-overflow") { expect(groups.groups[0]!.capabilityIds).toHaveLength(256); expect(groups.metrics.allCapabilityIdsByGroupId[groups.groups[0]!.groupId]).toHaveLength(300); }
        if (mode.startsWith("context-")) expect(groups.groups[0]!.contextFunctionIds).toEqual(mode === "context-raw" ? [] : mode === "context-hub" ? [id(2)] : [id(1)]);
        if (mode === "context-affinity" || mode === "context-hub" || mode === "context-community-omission") expect(groups.metrics.omittedContextIdsByGroupId[groups.groups[0]!.groupId]).toEqual(mode === "context-hub" ? [id(1)] : [id(2)]);
        if (mode === "context-community-omission") expect(groups.metrics.omittedCommunityContextIds[partition.communities[0]!.contentId]).toEqual([id(2)]);
        return groups;
      } };
    } }));
}

// Existing rational oracle bodies copied (not reinvented) from the PINNED
// cluster.test.ts:460-478,486-525. No expectRounded/tolerance comparator is copied.
type R = { p: bigint; q: bigint };
const zero: R = { p: 0n, q: 1n }, one: R = { p: 1n, q: 1n };
function r(p: bigint, q = 1n): R {
  if (q < 0n) { p = -p; q = -q; }
  let a = p < 0n ? -p : p, b = q; while (b) [a, b] = [b, a % b];
  return { p: p / a, q: q / a };
}
const add = (a: R, b: R) => r(a.p * b.q + b.p * a.q, a.q * b.q);
const sub = (a: R, b: R) => r(a.p * b.q - b.p * a.q, a.q * b.q);
const mul = (a: R, b: R) => r(a.p * b.p, a.q * b.q);
const div = (a: R, b: R) => r(a.p * b.q, a.q * b.p);
const cmp = (a: R, b: R) => a.p * b.q < b.p * a.q ? -1 : a.p * b.q > b.p * a.q ? 1 : 0;
const abs = (a: R) => ({ p: a.p < 0n ? -a.p : a.p, q: a.q });
const total = (values: R[]) => values.reduce(add, zero);
function fromNumber(value: number): R {
  const [whole, fraction = ""] = Math.abs(value).toString(2).split(".");
  return r((value < 0 ? -1n : 1n) * BigInt(`0b${whole}${fraction}`), 1n << BigInt(fraction.length));
}
function matrix(n: number, arcs: B.Arc[]): R[][] {
  const a = Array.from({ length: n }, () => Array.from({ length: n }, () => zero));
  for (const e of arcs) a[e.source]![e.target] = add(a[e.source]![e.target]!, fromNumber(e.weight));
  return a;
}
function qOracle(n: number, arcs: B.Arc[], labels: number[], gamma = 1): R {
  const a = matrix(n, arcs), m = total(a.flat()); if (!m.p) return zero;
  const normalized = a.map(row => row.map(x => div(x, m))), rows = normalized.map(total), columns = a.map((_, j) => total(normalized.map(row => row[j]!)));
  let answer = zero;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (labels[i] === labels[j]) answer = add(answer, sub(normalized[i]![j]!, mul(fromNumber(gamma), mul(rows[i]!, columns[j]!))));
  return answer;
}
function movesOracle(n: number, arcs: B.Arc[], labels: number[], tolerance: number, gamma = 1) {
  const q = qOracle(n, arcs, labels, gamma), threshold = div(fromNumber(tolerance), total(matrix(n, arcs).flat()));
  let max = zero, improving = 0;
  for (let node = 0; node < n; node++) {
    let best = zero;
    for (const target of [...new Set(labels), Math.max(...labels) + 1]) {
      const changed = labels.slice(); changed[node] = target;
      const gain = sub(qOracle(n, arcs, changed, gamma), q); if (cmp(gain, best) > 0) best = gain;
    }
    if (cmp(best, threshold) > 0) improving++;
    if (cmp(best, max) > 0) max = best;
  }
  return { max, improving, threshold };
}
function pprOracle(n: number, arcs: B.Arc[], seeds: number[], direction: "callee" | "caller" | "both", damping: number) {
  const directed = direction === "callee" ? arcs : direction === "caller" ? arcs.map(e => ({ ...e, source: e.target, target: e.source })) : arcs.flatMap(e => [e, { ...e, source: e.target, target: e.source }]);
  const a = matrix(n, directed), rows = a.map(total), p = Array.from({ length: n }, (_, i) => seeds.includes(i) ? r(1n, BigInt(seeds.length)) : zero), d = fromNumber(damping);
  const transition = a.map((row, i) => rows[i]!.p ? row.map(w => div(w, rows[i]!)) : p);
  const b = p.map(v => mul(sub(one, d), v));
  const system = Array.from({ length: n }, (_, target) => [...Array.from({ length: n }, (_, source) => sub(source === target ? one : zero, mul(d, transition[source]![target]!))), b[target]!]);
  for (let k = 0; k < n; k++) {
    const pivot = system.findIndex((row, i) => i >= k && row[k]!.p !== 0n); expect(pivot).toBeGreaterThanOrEqual(k);
    [system[k], system[pivot]] = [system[pivot]!, system[k]!];
    const divisor = system[k]![k]!; system[k] = system[k]!.map(x => div(x, divisor));
    for (let i = 0; i < n; i++) if (i !== k) { const factor = system[i]![k]!; system[i] = system[i]!.map((x, j) => sub(x, mul(factor, system[k]![j]!))); }
  }
  return { solution: system.map(row => row[n]!), residual: (scores: number[]) => total(b.map((v, j) => abs(sub(add(v, total(transition.map((row, i) => mul(d, mul(row[j]!, fromNumber(scores[i]!)))))), fromNumber(scores[j]!))))) };
}

test("FULL bounded numeric/context differential (source proposal; parent gates required)", () => {
  const supplied = process.env.PARENT_NUMERIC_EVIDENCE_DIR;
  insist(supplied !== undefined && isAbsolute(supplied), "parent must supply an absolute OWN evidence root");
  const root = join(supplied, "numeric-context-qualification-v1");
  mkdirSync(root); // exclusive namespace; existing path is fatal, no cleanup/reuse.
  insist(observe(0) !== observe(-0), "observer must distinguish signed zero");
  insist(observe({ absent: undefined }) !== observe({}), "observer must retain undefined own fields");
  insist(observe(new Map([["a", 1], ["b", 2]])) !== observe(new Map([["b", 2], ["a", 1]])), "observer must retain Map order");
  const shared = {};
  insist(observe([shared, shared]) !== observe([{}, {}]), "observer must retain reference aliases");
  insist(observe(new Array<undefined>(1)) !== observe([undefined]), "observer must retain array holes");
  // Synthetic oracle counterexamples, NOT runtime Error/Bun profile samples and
  // NOT new scientific paired cases. Only stack VALUE is technical, never shape.
  const descriptor = (value: unknown) => ({ enumerable: false, configurable: true, writable: true, value });
  const shape: ErrorOwn = [{ key: "message", descriptor: descriptor("synthetic") }, { key: "stack", descriptor: descriptor("synthetic stack A") }];
  const shapeObservation = observe(semanticOwn(shape));
  for (const flag of ["enumerable", "configurable", "writable"] as const) {
    const changed = structuredClone(shape); changed[1]!.descriptor[flag] = !changed[1]!.descriptor[flag];
    insist(observe(semanticOwn(changed)) !== shapeObservation, `stack ${flag} mismatch must remain semantic`);
  }
  insist(observe(semanticOwn([shape[1]!, shape[0]!])) !== shapeObservation, "stack position mismatch must remain semantic");
  insist(observe(semanticOwn([shape[0]!])) !== shapeObservation, "stack presence mismatch must remain semantic");
  const changedValue = structuredClone(shape); changedValue[1]!.descriptor.value = "synthetic stack B";
  insist(observe(semanticOwn(changedValue)) === shapeObservation, "only raw stack value takes the explicit technical tag");
  const ownBytes = readFileSync(import.meta.path), ownLines = ownBytes.toString("utf8").split(/\r?\n/), ownFile = resolve(import.meta.path), ownHash = sha(ownBytes);
  const syntheticOrigin: Origin = { raw: "synthetic negative-oracle location; not a runtime frame", file: ownFile, line: 1, column: 1,
    sourceHash: ownHash, sourceLine: ownLines[0]!, kind: "test", classification: "synthetic oracle only",
    mappedFile: ownFile, mappedLine: 1, mappedColumn: 1, mappedSourceHash: ownHash };
  const extraOrigin: Origin = { ...syntheticOrigin, line: 2, sourceLine: ownLines[1]!, mappedLine: 2 };
  expect(() => reconcileOrigins([syntheticOrigin], [syntheticOrigin, extraOrigin])).toThrow("full origin chain incompatible");
  const totals: Record<Side, number> = { baseline: 0, candidate: 0 };
  const caseTotals: Record<Side, number> = { baseline: 0, candidate: 0 };
  const cases = [...matrixCases(), ...numericCases(), ...groupCases()];
  insist(new Set(cases.map(c => c.id)).size === cases.length, "duplicate case ledger ID");
  insist(cases.length === 450 && cases.filter(c => c.expected.kind === "value").length === 224
    && cases.filter(c => c.expected.kind === "refusal").length === 226, "unchanged 450-case expectation ledger");
  const persist = (side: Side, index: number, kind: string, body: unknown): void => {
    const text = JSON.stringify(body); const length = Buffer.byteLength(text, "utf8");
    // Budget failures preserve a SMALL FATAL marker, never a cropped observation.
    if (caseTotals[side] + length + 1024 > LIMIT || totals[side] + length + 1024 > BRANCH_LIMIT) {
      const marker = JSON.stringify({ id: cases[index]?.id, kind, attemptedBytes: length, priorCaseBytes: caseTotals[side], priorBranchBytes: totals[side], fatal: "evidence budget; no cropped result" });
      const markerBytes = Buffer.byteLength(marker, "utf8");
      insist(markerBytes <= 1024 && caseTotals[side] + markerBytes <= LIMIT && totals[side] + markerBytes <= BRANCH_LIMIT, "fatal-marker reserve invariant");
      writeFileSync(join(root, `${side}-${index}-CAP-FATAL.json`), marker, { flag: "wx" });
      totals[side] += markerBytes; caseTotals[side] += markerBytes;
      throw new Error("qualification: 2 MiB case / 128 MiB branch cap exceeded");
    }
    totals[side] += length; caseTotals[side] += length;
    writeFileSync(join(root, `${side}-${index}-${kind}.json`), text, { flag: "wx" });
  };
  for (let index = 0; index < cases.length; index++) {
    const c = cases[index]!, pair: Partial<Record<Side, string>> = {}, pairOrigins: Partial<Record<Side, Origin[]>> = {};
    caseTotals.baseline = 0; caseTotals.candidate = 0;
    for (const side of ["baseline", "candidate"] as const) {
      const stageProofs: StageProof[] = [], stageRawErrors: unknown[] = [];
      const guard: Guard = <T>(label: string, inputs: unknown, call: () => T): T => {
        const references: object[] = [], before = observe(inputs, references); let returned = false;
        try { const value = call(); returned = true; return value; }
        catch (error) {
          const own = error instanceof Error ? Reflect.ownKeys(error).map(key => ({ key, descriptor: Object.getOwnPropertyDescriptor(error, key) })) : { thrown: error };
          stageRawErrors.push({ label, descriptorEvidence: observe(own), rawStack: error instanceof Error ? error.stack : undefined });
          throw error;
        } finally {
          const afterReferences: object[] = [], after = observe(inputs, afterReferences);
          const referencesStable = references.length === afterReferences.length && references.every((ref, i) => ref === afterReferences[i]);
          stageProofs.push({ label, before, after, referenceCount: references.length, referencesStable, returned });
          observe(stageProofs); observe(stageRawErrors); // Same closed 2 MiB domain, no unbounded stage accumulation.
          insist(before === after && referencesStable, `stage mutation ${c.id} ${side} ${label}`);
        }
      };
      try {
        const work = c.make(side, guard), references: object[] = [], before = observe(work.state, references);
        let value: unknown, thrown: unknown, failed = false;
        try { value = work.action(); } catch (error) { thrown = error; failed = true; }
        if (failed) {
          const own = thrown instanceof Error ? Reflect.ownKeys(thrown).map(key => ({ key, descriptor: Object.getOwnPropertyDescriptor(thrown, key) })) : { thrown };
          persist(side, index, "RAW-ERROR", { id: c.id, descriptorEvidence: observe(own), rawStack: thrown instanceof Error ? thrown.stack : undefined });
        }
        const afterReferences: object[] = [], after = observe(work.state, afterReferences);
        const referencesStable = references.length === afterReferences.length && references.every((ref, i) => ref === afterReferences[i]);
        if (before !== after || !referencesStable) {
          persist(side, index, "MUTATION-FATAL", { id: c.id, before, after, referencesStable, stageProofs: observe(stageProofs), stageRawErrors: observe(stageRawErrors), fatal: "STOP: full input-state mutation" });
          throw new Error(`qualification: mutation ${c.id} ${side}`);
        }
        let observation: string, raw: unknown = null;
        if (failed) {
          const error = refusalObservation(thrown, side); raw = error.raw; pairOrigins[side] = error.raw.frames;
          insist(c.expected.kind === "refusal", `unexpected baseline/candidate refusal ${c.id}`);
          insist(error.semantic.code === c.expected.code, `wrong refusal code ${c.id}`);
          if (c.expected.message !== undefined) insist(error.semantic.message === c.expected.message, `wrong refusal message ${c.id}`);
          observation = observe({ kind: "refusal", state: work.state, error: error.semantic, stageProofs });
        } else {
          insist(c.expected.kind === "value", `expected refusal was accepted ${c.id}`);
          observation = observe({ kind: "value", state: work.state, value, stageProofs });
        }
        persist(side, index, "observation", { status: "OBSERVED_NOT_YET_PAIR_ACCEPTED", id: c.id, inputHash: sha(before), sourceFixtureOrCaseSpecHash: c.inputHash,
          config: observe(c.config), expected: c.expected, oracle: c.oracle, observation,
          rawErrorEvidence: observe(raw), stageRawErrors: observe(stageRawErrors), authoredTestSha256: sha(readFileSync(import.meta.path)) });
        pair[side] = observation;
      } catch (error) {
        if (error instanceof Error && error.message === "qualification: 2 MiB case / 128 MiB branch cap exceeded") throw error;
        const raw = error instanceof Error ? Reflect.ownKeys(error).map(key => ({ key, descriptor: Object.getOwnPropertyDescriptor(error, key) })) : { thrown: error };
        // Fatal markers are not scientific refusal observations and cannot pass a pair.
        persist(side, index, "FATAL", { id: c.id, fatal: "STOP parent investigation; no retry/autofix", rawDescriptorEvidence: observe(raw), rawStack: error instanceof Error ? error.stack : undefined, stageProofs: observe(stageProofs), stageRawErrors: observe(stageRawErrors) });
        throw error;
      }
    }
    if (pair.baseline === undefined || pair.candidate === undefined || pair.baseline !== pair.candidate) {
      const error = new Error(`qualification: FULL bit/shape/order/alias mismatch ${c.id}; raw evidence retained`);
      const raw = Reflect.ownKeys(error).map(key => ({ key, descriptor: Object.getOwnPropertyDescriptor(error, key) }));
      for (const side of ["baseline", "candidate"] as const) persist(side, index, "MISMATCH-FATAL", { id: c.id, rawDescriptorEvidence: observe(raw), rawStack: error.stack });
      throw error;
    }
    let originChainProof: unknown = null;
    if (c.expected.kind === "refusal") {
      const b = pairOrigins.baseline, candidate = pairOrigins.candidate;
      insist(b !== undefined && candidate !== undefined, "missing complete paired origin chains");
      try { originChainProof = reconcileOrigins(b, candidate); }
      catch (error) {
        const own = error instanceof Error ? Reflect.ownKeys(error).map(key => ({ key, descriptor: Object.getOwnPropertyDescriptor(error, key) })) : { thrown: error };
        for (const side of ["baseline", "candidate"] as const) persist(side, index, "ORIGIN-FATAL", { id: c.id,
          chains: observe({ baseline: b, candidate }), rawDescriptorEvidence: observe(own), rawStack: error instanceof Error ? error.stack : undefined });
        throw error;
      }
    }
    // A ledger row is retained only after full equality, never a digest-only PASS.
    for (const side of ["baseline", "candidate"] as const) persist(side, index, "PAIRED", { id: c.id, sourceFixtureOrCaseSpecHash: c.inputHash,
      config: observe(c.config), expected: c.expected, oracle: c.oracle, fullObservationEqual: true, originChainProof: observe(originChainProof) });
  }
  for (const side of ["baseline", "candidate"] as const) {
    caseTotals[side] = 0;
    persist(side, cases.length, "COMPLETE", { proposedCaseCount: cases.length, observedPairCount: cases.length,
      branchBytesBeforeCompletion: totals, limits: { caseBytes: LIMIT, branchBytes: BRANCH_LIMIT }, qualifiedNativeOrFull44: false });
  }
}, 120000);
