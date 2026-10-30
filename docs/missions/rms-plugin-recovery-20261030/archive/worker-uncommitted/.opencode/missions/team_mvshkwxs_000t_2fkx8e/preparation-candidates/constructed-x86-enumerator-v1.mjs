/** Inspection candidate: fixed fixture-recipe verification, never a code executor.
 * No filesystem, generator, compiler, generic disassembler or native authority.
 * The parent supplies actual raw/source-file bytes and verifies the invoked file pin.
 */
import { assertExecutionJsonV1, makeBoundDocumentV1 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { canonical, hash, exactPath } from "../../../../tools/ff8-harness/src/validation.ts";
const VERSION = "rms-constructed-x86-enumerator-v1";
const DECISION_SHA = "1796363315de98e1866a4648441ccb99da1acfee2dbae66db75d8248a0234950";
const RAW_SHA = "6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020";
const need = (condition, reason) => { if (!condition) throw new Error(`HOLD: ${reason}`); };
const text = value => typeof value === "string" && value.trim().length > 0;
const natural = value => Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
const length = value => new TextEncoder().encode(value).length;
const hex = value => `0x${BigInt(value).toString(16).toUpperCase()}`;
function shape(value, keys, where) {
  need(value !== null && typeof value === "object" && !Array.isArray(value), `${where}: object required`);
  need(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${where}: unsupported/missing fields`);
}
/** Same bounded duplicate-key prepass as the V2 candidate; private product
 * strictJson is not exported. This is not a replacement product JSON codec. */
function parseStrict(raw, where) {
  need(typeof raw === "string" && length(raw) > 0 && length(raw) <= 1048576, `${where}: bounded UTF-8 text required`);
  assertExecutionJsonV1(raw); need(raw.charCodeAt(0) !== 0xfeff, `${where}: BOM forbidden`);
  let i = 0;
  const ws = () => { while (i < raw.length && /[\x20\t\r\n]/.test(raw[i])) i++; };
  const string = () => {
    need(raw[i] === '"', `${where}: JSON string required`); const start = i++;
    while (i < raw.length) {
      const c = raw[i++]; if (c === '"') return JSON.parse(raw.slice(start, i));
      if (c === "\\") {
        need(i < raw.length, `${where}: truncated escape`); const e = raw[i++];
        if (e === "u") { need(/^[0-9a-fA-F]{4}$/.test(raw.slice(i, i + 4)), `${where}: Unicode escape`); i += 4; }
        else need('"\\/bfnrt'.includes(e), `${where}: invalid escape`);
      } else need(c.charCodeAt(0) >= 32, `${where}: unescaped control`);
    }
    throw new Error(`HOLD: ${where}: unterminated string`);
  };
  const value = (depth = 0) => {
    need(depth <= 64, `${where}: nesting bound`); ws();
    if (raw[i] === "{") {
      i++; ws(); const keys = new Set(); if (raw[i] === "}") { i++; return; }
      for (;;) {
        ws(); const key = string(); need(!keys.has(key), `${where}: duplicate JSON key ${key}`); keys.add(key);
        ws(); need(raw[i++] === ":", `${where}: colon required`); value(depth + 1); ws();
        const end = raw[i++]; if (end === "}") return; need(end === ",", `${where}: object separator`);
      }
    }
    if (raw[i] === "[") {
      i++; ws(); if (raw[i] === "]") { i++; return; }
      for (;;) { value(depth + 1); ws(); const end = raw[i++]; if (end === "]") return; need(end === ",", `${where}: array separator`); }
    }
    if (raw[i] === '"') { string(); return; }
    const scalar = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(raw.slice(i));
    need(scalar, `${where}: scalar required`); i += scalar[0].length;
  };
  value(); ws(); need(i === raw.length, `${where}: trailing JSON data`);
  const result = JSON.parse(raw); assertExecutionJsonV1(result); return result;
}
function freeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function enumerateConstructedX86V1(decisionUtf8, modelUtf8, rawArtifact, enumeratorCode) {
  assertExecutionJsonV1({ decisionUtf8, modelUtf8, rawArtifact, enumeratorCode });
  shape(enumeratorCode, ["path", "utf8"], "enumeratorCode");
  need(text(enumeratorCode.path) && text(enumeratorCode.utf8), "parent-loaded actual enumerator file required");
  shape(rawArtifact, ["path", "base64", "byteLength", "sha256"], "rawArtifact");
  exactPath(rawArtifact.path);
  need(rawArtifact.byteLength === 262 && rawArtifact.sha256 === RAW_SHA, "raw artifact metadata pin");
  need(typeof rawArtifact.base64 === "string" && rawArtifact.base64.length === 352
    && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(rawArtifact.base64), "strict bounded raw base64");
  const raw = Buffer.from(rawArtifact.base64, "base64");
  need(raw.toString("base64") === rawArtifact.base64 && raw.byteLength === 262, "canonical base64/262 actual decoded bytes");
  const D = parseStrict(decisionUtf8, "D3"), Q = parseStrict(modelUtf8, "Q3");
  need(length(decisionUtf8) === 3872 && hash(decisionUtf8) === DECISION_SHA, "ratified D3 raw bytes");
  shape(D, ["version", "status", "fixture", "admissibleAsOracle", "parentDecisions", "parentModels", "inheritedDecisionsOnly", "construction", "functionDefinition", "proofRequired", "nativeClaimsForbidden", "preservation", "nativeAuthority"], "D3");
  need(D.version === "rms-constructed-x86-fixture-decision-v3" && D.fixture === true && D.admissibleAsOracle === false && D.nativeAuthority.status === "HOLD", "D3 fixture/native domains");
  shape(Q, ["version", "fixture", "admissibleAsOracle", "generatedCodeExecuted", "nativeAuthority", "decision", "module", "functions", "closure", "qualificationMeaning"], "Q3");
  need(Q.version === "rms-constructed-x86-function-model-v3" && Q.fixture === true && Q.admissibleAsOracle === false
    && Q.generatedCodeExecuted === false && Q.nativeAuthority === "NONE", "Q3 fixture/nonexecution domains");
  shape(Q.decision, ["path", "sha256"], "Q3.decision");
  need(Q.decision.path === ".opencode/missions/team_mvshkwxs_000t_2fkx8e/native-preparation-136/source-decision-v3.json" && Q.decision.sha256 === DECISION_SHA, "Q3 decision ref");
  shape(Q.module, ["targetArchitecture", "modeProvenance", "format", "rawPath", "rawByteLength", "rawSha256", "versionLabel", "moduleName", "imageBase", "offsetToRva", "segments"], "Q3.module");
  const C = D.construction;
  need(C.targetArchitecture === "x86-32" && Q.module.targetArchitecture === C.targetArchitecture && text(Q.module.modeProvenance), "declared generation target must be x86-32, not inferred from bytes");
  need(Q.module.format === "unknown" && C.format === "unknown" && Q.module.offsetToRva === "identity"
    && C.fileOffsetToRva === "identity for this raw fixture only", "raw format/offset-to-RVA mapping");
  need(Q.module.rawPath === C.rawPath && Q.module.rawByteLength === 262 && C.rawByteLength === 262
    && Q.module.rawSha256 === RAW_SHA && C.rawSha256 === RAW_SHA, "module descriptor/raw pin");
  need(Q.module.imageBase === C.imageBase && Q.module.imageBase === 268435456
    && Q.module.versionLabel === C.versionLabel && Q.module.moduleName === C.moduleName, "module identity/base/label");
  shape(Q.closure, ["functions", "parts", "tails", "relations", "instructions", "externalPartsAllowed"], "Q3.closure");
  for (const key of ["functions", "parts", "tails", "relations"]) need(Q.closure[key] === "exact-listed-universe", `closed ${key} universe`);
  need(Q.closure.instructions === "exact-listed-universe-within-function-spans" && Q.closure.externalPartsAllowed === false, "closed instruction universe/no external parts");
  const visits = [], functions = [], instructionFacts = [];
  const table = (values, path, visitor) => {
    need(Array.isArray(values) && values.length <= 10000, `${path}: bounded explicit table`);
    visits.push({ kind: "table-start", path, length: values.length });
    values.forEach((item, index) => visitor(item, index));
    visits.push({ kind: "table-end", path, visited: values.length });
  };
  need(canonical(Q.module.segments) === canonical(C.segments), "raw layout must match fixed construction recipe");
  let byteCursor = 0;
  table(Q.module.segments, "module.segments", (segment, index) => {
    need(index < 2, "unsupported segment");
    shape(segment, index === 0 ? ["kind", "fileOffset", "byteLength", "fillHex"] : ["kind", "fileOffset", "byteLength", "hex"], `segments[${index}]`);
    need(natural(segment.fileOffset) && segment.fileOffset === byteCursor && natural(segment.byteLength) && segment.byteLength > 0
      && segment.fileOffset + segment.byteLength <= raw.length, "layout must partition actual bytes without holes/overlap");
    if (index === 0) {
      need(segment.kind === "reserved-non-function-data" && segment.fileOffset === 0 && segment.byteLength === 256 && segment.fillHex === "00", "fixed non-function padding layout");
      for (let at = 0; at < 256; at++) need(raw[at] === 0, `nonzero reserved byte at ${at}`);
    } else {
      need(segment.kind === "function-code" && segment.fileOffset === 256 && segment.byteLength === 6 && segment.hex === "b800000000c3", "fixed function segment layout");
      need(raw.subarray(256, 262).toString("hex") === segment.hex, "actual six code bytes differ from fixed recipe");
    }
    byteCursor += segment.byteLength;
    visits.push({ kind: "raw-segment-verified", index, fileOffset: segment.fileOffset, byteLength: segment.byteLength });
  });
  need(Q.module.segments.length === 2 && byteCursor === raw.length, "every raw byte must belong to exactly one declared segment");
  need(hash(raw) === RAW_SHA && hash(raw) === rawArtifact.sha256, "actual RAW bytes SHA, never descriptor SHA");
  need(Array.isArray(Q.functions) && Q.functions.length === 1, "fixed single-function universe");
  const functionIds = new Set(), partIds = new Set(), ordinals = new Set();
  table(Q.functions, "functions", (fn, functionIndex) => {
    shape(fn, ["id", "name", "rva", "parts", "tails", "relations"], `functions[${functionIndex}]`);
    need(fn.id === "fixtureReturnZero" && fn.name === D.functionDefinition.name && fn.rva === D.functionDefinition.rva
      && fn.rva === 256 && !functionIds.has(fn.id), "fixed function identity/RVA"); functionIds.add(fn.id);
    need(Q.module.imageBase + fn.rva === D.functionDefinition.ea && Q.module.imageBase + 262 < 0x100000000, "canonical x86-32 virtual mapping bounds");
    visits.push({ kind: "function", id: fn.id, rva: fn.rva });
    const parts = [], localParts = new Map(), pendingSuccessors = [];
    need(Array.isArray(fn.parts) && fn.parts.length === 1, "fixed D3 function has exactly one entry chunk");
    table(fn.parts, "functions[0].parts", part => {
      shape(part, ["id", "ordinal", "role", "rva", "endRvaExclusive", "instructions", "successors"], "part");
      need(text(part.id) && !partIds.has(part.id) && natural(part.ordinal) && !ordinals.has(part.ordinal), "unique part ID/ordinal required");
      need(part.ordinal === 0 && part.role === "entry" && part.rva === 256 && part.endRvaExclusive === 262
        && part.rva === D.functionDefinition.entrySpan.rva && part.endRvaExclusive === D.functionDefinition.entrySpan.endRvaExclusive, "exact positive entry span [256,262)");
      partIds.add(part.id); ordinals.add(part.ordinal); localParts.set(part.id, part);
      visits.push({ kind: "part", id: part.id, ordinal: part.ordinal, role: part.role, rva: part.rva, endRvaExclusive: part.endRvaExclusive });
      let instructionCursor = part.rva;
      need(Array.isArray(part.instructions) && part.instructions.length === 2, "fixed two-instruction recipe");
      table(part.instructions, "functions[0].parts[0].instructions", (instruction, index) => {
        shape(instruction, ["fileOffset", "byteLength", "hex", "decodedInTargetMode"], "instruction");
        const expected = D.functionDefinition.staticDecodeInDeclaredMode[index];
        need(instruction.fileOffset === instructionCursor && instruction.fileOffset === expected.fileOffset
          && instruction.byteLength === expected.byteLength && instruction.hex === expected.hex, "instruction offset/width/hex must match fixed target recipe");
        need(instruction.fileOffset >= part.rva && instruction.fileOffset + instruction.byteLength <= part.endRvaExclusive
          && raw.subarray(instruction.fileOffset, instruction.fileOffset + instruction.byteLength).toString("hex") === instruction.hex, "instruction bytes must cover actual function span");
        if (index === 0) {
          need(instruction.fileOffset === 256 && instruction.byteLength === 5 && raw[256] === 0xb8 && raw.readUInt32LE(257) === 0
            && instruction.decodedInTargetMode === "mov eax, 0", "fixed B8 imm32 little-endian zero in declared 32-bit target");
        } else need(instruction.fileOffset === 261 && instruction.byteLength === 1 && raw[261] === 0xc3
          && instruction.decodedInTargetMode === "ret", "fixed C3 ret encoding");
        instructionFacts.push({ ...instruction, targetArchitecture: C.targetArchitecture, executed: false });
        visits.push({ kind: "instruction-verified", index, fileOffset: instruction.fileOffset, byteLength: instruction.byteLength });
        instructionCursor += instruction.byteLength;
      });
      need(instructionCursor === part.endRvaExclusive, "instruction table must exhaust chunk without hidden bytes");
      table(part.successors, "functions[0].parts[0].successors", (target, index) => {
        need(text(target), "successor must be a local part ID");
        pendingSuccessors.push(target); visits.push({ kind: "successor", index, target });
      });
      parts.push({ id: part.id, ordinal: part.ordinal, role: part.role, rva: part.rva, endRvaExclusive: part.endRvaExclusive });
    });
    const tails = [];
    table(fn.tails, "functions[0].tails", (id, index) => {
      need(text(id) && localParts.has(id) && localParts.get(id).role === "tail" && !tails.includes(id), "absent/foreign/duplicate/non-tail explicit tail");
      tails.push(id); visits.push({ kind: "tail", index, id });
    });
    need(canonical([...tails].sort()) === canonical(parts.filter(part => part.role === "tail").map(part => part.id).sort()), "declared/derived tail sets differ");
    for (const target of pendingSuccessors) need(localParts.has(target), "absent/foreign successor target");
    need(pendingSuccessors.length === 0, "fixed return-zero recipe has no successors");
    table(fn.relations, "functions[0].relations", () => { throw new Error("HOLD: unsupported nonempty relation form in fixed D3 recipe"); });
    functions.push({ id: fn.id, name: fn.name, rva: fn.rva, parts, tails, relationCount: 0,
      boundaries: parts.map(part => ({ ordinal: part.ordinal, role: part.role, rva: hex(part.rva), endRvaExclusive: hex(part.endRvaExclusive) })) });
  });
  visits.push({ kind: "enumeration-end", rawBytesVerified: byteCursor, functionCount: functions.length,
    partCount: partIds.size, tailCount: 0, successorCount: 0, relationCount: 0, instructionsVerified: instructionFacts.length });
  const rawRef = (kind, utf8) => ({ kind, encoding: "raw-v1", byteLength: length(utf8), sha256: hash(utf8) });
  const evidence = makeBoundDocumentV1("rms-constructed-x86-enumeration-proof-v1", {
    version: "rms-constructed-x86-enumeration-proof-v1", enumeratorVersion: VERSION,
    decisionRef: rawRef("rms-constructed-x86-fixture-decision-v3", decisionUtf8),
    modelRef: rawRef("rms-constructed-x86-function-model-v3", modelUtf8),
    rawArtifact: { path: rawArtifact.path, ref: { kind: "rms-constructed-x86-raw-v3", encoding: "raw-v1", byteLength: raw.length, sha256: hash(raw) } },
    enumeratorSource: { path: enumeratorCode.path, ref: rawRef("rms-constructed-x86-enumerator-source-v1", enumeratorCode.utf8),
      attribution: "parent-loaded source bytes; parent must pin the actual invoked file" },
    architecture: { target: C.targetArchitecture, basis: "pinned construction target plus verified raw fixed-recipe encoding/layout; not uniquely inferred from bytes", nativeOrServerArchitectureObserved: false },
    scope: "Constructed RAW fixture only; not a native program, installed image, execution or semantic oracle",
    fixture: true, admissibleAsOracle: false, generatedCodeExecuted: false, nativeAuthority: "NONE",
    closure: Q.closure, functions, instructionFacts, visits, completed: true, tailsIterated: true, selfLoopsPreserved: true
  });
  return freeze({ decision: D, model: Q, functions, evidence });
}
