/** Inspection candidate. No filesystem, model instruction execution or native authority.
 * The parent supplies the raw UTF-8 source text of the actual enumerator file and
 * must independently pin that file before invoking it. A code argument is not self-authentication.
 */
import { assertExecutionJsonV1, makeBoundDocumentV1 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { canonical, hash } from "../../../../tools/ff8-harness/src/validation.ts";

const VERSION = "rms-closed-model-enumerator-v1";
const DECISION_SHA = "6d17c83633939ead1971e314e70fb5e4847dd70c15d6f8617a1128b4ab638d3f";
const PARENT_DECISION_SHA = "158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989";
const PARENT_MODEL_SHA = "d447d28b89e3dec58db1e35f1f550d1921be9bbea66e4eaa4d3b24b841e1274c";
const need = (condition, reason) => { if (!condition) throw new Error(`HOLD: ${reason}`); };
const text = value => typeof value === "string" && value.trim().length > 0;
const natural = value => Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
const positive = value => natural(value) && value > 0;
const hex = value => `0x${BigInt(value).toString(16).toUpperCase()}`;
const byteLength = value => new TextEncoder().encode(value).length;

function shape(value, keys, where) {
  need(value !== null && typeof value === "object" && !Array.isArray(value), `${where}: object required`);
  need(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${where}: unsupported/missing fields`);
}

/** Bounded duplicate-key prepass, following the existing private strictJson
 * algorithm in graph-execution-envelope.ts:335-362; no second product codec.
 * JSON.parse alone would silently discard a duplicate tails/closure key.
 */
function parseStrict(raw, where) {
  need(typeof raw === "string" && byteLength(raw) > 0 && byteLength(raw) <= 1048576, `${where}: bounded UTF-8 text required`);
  assertExecutionJsonV1(raw);
  need(raw.charCodeAt(0) !== 0xfeff, `${where}: BOM forbidden`);
  let i = 0;
  const ws = () => { while (/[\x20\t\r\n]/.test(raw[i] ?? "") && i < raw.length) i++; };
  const string = () => {
    need(raw[i] === '"', `${where}: JSON key/string required`);
    const start = i++;
    while (i < raw.length) {
      const c = raw[i++];
      if (c === '"') return JSON.parse(raw.slice(start, i));
      if (c === "\\") {
        need(i < raw.length, `${where}: truncated escape`);
        const escape = raw[i++];
        if (escape === "u") { need(/^[0-9a-fA-F]{4}$/.test(raw.slice(i, i + 4)), `${where}: invalid Unicode escape`); i += 4; }
        else need('"\\/bfnrt'.includes(escape), `${where}: invalid escape`);
      } else need(c.charCodeAt(0) >= 32, `${where}: unescaped control`);
    }
    throw new Error(`HOLD: ${where}: unterminated string`);
  };
  const value = (depth = 0) => {
    need(depth <= 64, `${where}: JSON nesting bound`);
    ws();
    if (raw[i] === "{") {
      i++; ws(); const keys = new Set();
      if (raw[i] === "}") { i++; return; }
      for (;;) {
        ws(); const key = string(); need(!keys.has(key), `${where}: duplicate JSON key ${key}`); keys.add(key);
        ws(); need(raw[i++] === ":", `${where}: JSON colon required`); value(depth + 1);
        ws(); const end = raw[i++]; if (end === "}") return;
        need(end === ",", `${where}: JSON object separator`);
      }
    }
    if (raw[i] === "[") {
      i++; ws(); if (raw[i] === "]") { i++; return; }
      for (;;) { value(depth + 1); ws(); const end = raw[i++]; if (end === "]") return; need(end === ",", `${where}: JSON array separator`); }
    }
    if (raw[i] === '"') { string(); return; }
    const scalar = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(raw.slice(i));
    need(scalar, `${where}: JSON scalar required`); i += scalar[0].length;
  };
  value(); ws(); need(i === raw.length, `${where}: trailing JSON data`);
  const parsed = JSON.parse(raw); assertExecutionJsonV1(parsed); return parsed;
}

function freeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function enumerateClosedModelV1(decisionUtf8, modelUtf8, enumeratorCode) {
  assertExecutionJsonV1({ decisionUtf8, modelUtf8, enumeratorCode });
  shape(enumeratorCode, ["path", "utf8"], "enumeratorCode");
  need(text(enumeratorCode.path) && text(enumeratorCode.utf8), "parent-supplied actual enumerator source bytes/path required");
  const D = parseStrict(decisionUtf8, "D2"), Q = parseStrict(modelUtf8, "Q2");
  need(hash(decisionUtf8) === DECISION_SHA && byteLength(decisionUtf8) === 3395, "ratified D2 raw bytes");
  shape(D, ["version", "status", "fixture", "admissibleAsOracle", "parentDecision", "parentModel", "retainedParentDecisions", "sourceIdentity", "closedUniverse", "enumeratorContract", "preservation", "nativeAuthority"], "D2");
  need(D.version === "rms-closed-qualification-source-decision-v2" && D.fixture === true && D.admissibleAsOracle === false, "D2 fixture version/oracle");
  need(D.parentDecision.sha256 === PARENT_DECISION_SHA && D.parentModel.sha256 === PARENT_MODEL_SHA, "D2 parent pins");
  need(D.enumeratorContract.version === VERSION && D.nativeAuthority.status === "HOLD", "D2 enumeration contract/native HOLD");
  shape(Q, ["version", "fixture", "admissibleAsOracle", "nativeImplementationObserved", "decision", "parentModelSha256", "coordinateSpace", "imageBase", "functions", "closure", "execution", "nativeAuthority"], "Q2");
  need(Q.version === "rms-closed-function-model-v2" && Q.fixture === true && Q.admissibleAsOracle === false
    && Q.nativeImplementationObserved === false && Q.execution === "NOT_EXECUTED" && Q.nativeAuthority === "NONE", "Q2 declared fixture domains");
  shape(Q.decision, ["path", "sha256"], "Q2.decision");
  need(Q.decision.path === ".opencode/missions/team_mvshkwxs_000t_2fkx8e/native-preparation-132/source-decision-v2.json"
    && Q.decision.sha256 === DECISION_SHA && Q.parentModelSha256 === PARENT_MODEL_SHA, "Q2 decision/parent reference");
  need(Q.coordinateSpace === "virtual-model-units-not-machine-bytes" && Q.coordinateSpace === D.sourceIdentity.coordinateSpace
    && Q.imageBase === D.sourceIdentity.imageBase && positive(Q.imageBase), "virtual coordinate space/base");
  const closureKeys = ["functions", "parts", "tails", "relations", "externalPartsAllowed"];
  shape(Q.closure, closureKeys, "Q2.closure");
  for (const key of closureKeys.slice(0, 4)) need(Q.closure[key] === "exact-listed-universe" && D.closedUniverse[key] === Q.closure[key], `closed universe ${key}`);
  need(Q.closure.externalPartsAllowed === false && D.closedUniverse.externalPartsAllowed === false, "external parts forbidden");

  const visits = [], functions = [], functionIds = new Set(), functionRvas = new Set(), globalPartIds = new Set();
  const spans = [], pendingSuccessors = [];
  const table = (values, path, visit) => {
    need(Array.isArray(values), `${path}: explicit table required`);
    need(values.length <= 10000, `${path}: table bound`);
    visits.push({ kind: "table-start", path, length: values.length });
    values.forEach((item, index) => visit(item, index));
    visits.push({ kind: "table-end", path, visited: values.length });
  };
  need(Array.isArray(Q.functions) && Q.functions.length === 1, "D2 single-function model universe");
  table(Q.functions, "functions", (fn, functionIndex) => {
    const path = `functions[${functionIndex}]`;
    shape(fn, ["id", "name", "rva", "parts", "tails", "relations"], path);
    need(text(fn.id) && text(fn.name) && positive(fn.rva) && fn.rva === D.sourceIdentity.functionRva, `${path}: function identity`);
    need(!functionIds.has(fn.id) && !functionRvas.has(fn.rva), `${path}: duplicate function id/RVA`);
    need(Number.isSafeInteger(Q.imageBase + fn.rva) && Q.imageBase + fn.rva === D.sourceIdentity.functionEa
      && Q.imageBase + fn.rva <= 0xffffffff, `${path}: function virtual EA`);
    functionIds.add(fn.id); functionRvas.add(fn.rva);
    visits.push({ kind: "function", path, functionId: fn.id, rva: fn.rva });
    const parts = [], partById = new Map(), ordinals = new Set();
    table(fn.parts, `${path}.parts`, (part, index) => {
      const partPath = `${path}.parts[${index}]`;
      shape(part, ["id", "ordinal", "role", "rva", "endRvaExclusive", "operation", "literal", "successors"], partPath);
      need(text(part.id) && !globalPartIds.has(part.id) && natural(part.ordinal) && !ordinals.has(part.ordinal), `${partPath}: duplicate/invalid part id or ordinal`);
      need(part.role === "entry" || part.role === "tail", `${partPath}: unsupported part role`);
      need(positive(part.rva) && positive(part.endRvaExclusive) && part.endRvaExclusive > part.rva
        && Number.isSafeInteger(Q.imageBase + part.endRvaExclusive) && Q.imageBase + part.endRvaExclusive <= 0xffffffff, `${partPath}: positive virtual span`);
      need(part.operation === "return" && text(part.literal), `${partPath}: unsupported declarative operation/literal`);
      globalPartIds.add(part.id); ordinals.add(part.ordinal); partById.set(part.id, part);
      spans.push({ functionId: fn.id, partId: part.id, start: part.rva, end: part.endRvaExclusive });
      parts.push({ id: part.id, ordinal: part.ordinal, role: part.role, rva: part.rva, endRvaExclusive: part.endRvaExclusive });
      visits.push({ kind: "part", path: partPath, functionId: fn.id, partId: part.id, ordinal: part.ordinal, role: part.role });
      // Only local part-ID strings are supported successor references. No lazy/external objects.
      table(part.successors, `${partPath}.successors`, (target, successorIndex) => {
        need(text(target), `${partPath}: successor must be a local part ID`);
        need(part.successors.indexOf(target) === successorIndex, `${partPath}: duplicate successor`);
        pendingSuccessors.push({ functionId: fn.id, source: part.id, target, path: `${partPath}.successors[${successorIndex}]` });
        visits.push({ kind: "successor", path: `${partPath}.successors[${successorIndex}]`, source: part.id, target });
      });
    });
    const entries = parts.filter(part => part.role === "entry");
    need(entries.length === 1 && entries[0].rva === fn.rva, `${path}: exactly one entry at function RVA`);
    const tails = [], tailIds = new Set();
    table(fn.tails, `${path}.tails`, (id, index) => {
      need(text(id) && !tailIds.has(id), `${path}: duplicate/invalid explicit tail ID`);
      need(partById.has(id) && partById.get(id).role === "tail", `${path}: absent/foreign/non-tail explicit tail`);
      tailIds.add(id); tails.push(id);
      visits.push({ kind: "tail", path: `${path}.tails[${index}]`, functionId: fn.id, partId: id });
    });
    const derivedTails = parts.filter(part => part.role === "tail").map(part => part.id).sort();
    need(canonical([...tails].sort()) === canonical(derivedTails), `${path}: declared/derived tail sets differ`);
    // D2/Q2 define no nonempty relation record grammar. Refuse extensions rather
    // than inventing a relation schema or silently dropping a foreign target.
    table(fn.relations, `${path}.relations`, () => { throw new Error(`HOLD: ${path}: unsupported nonempty relation form`); });
    functions.push({ id: fn.id, name: fn.name, rva: fn.rva, parts, tails, relationCount: 0,
      boundaries: parts.map(part => ({ ordinal: part.ordinal, rva: hex(part.rva), endRvaExclusive: hex(part.endRvaExclusive), role: part.role })) });
  });
  const orderedSpans = [...spans].sort((a, b) => a.start - b.start);
  for (let i = 1; i < orderedSpans.length; i++) need(orderedSpans[i - 1].end <= orderedSpans[i].start, "overlapping virtual model spans");
  for (const successor of pendingSuccessors) {
    const fn = functions.find(item => item.id === successor.functionId);
    need(fn.parts.some(part => part.id === successor.target), `${successor.path}: absent/foreign successor part`);
    visits.push({ kind: "successor-resolved", ...successor });
  }
  visits.push({ kind: "enumeration-end", functionCount: functions.length, partCount: spans.length,
    tailCount: functions.reduce((count, fn) => count + fn.tails.length, 0), successorCount: pendingSuccessors.length, relationCount: 0 });
  const rawRef = (kind, utf8) => ({ kind, encoding: "raw-v1", byteLength: byteLength(utf8), sha256: hash(utf8) });
  const evidence = makeBoundDocumentV1("rms-closed-model-enumeration-proof-v1", {
    version: "rms-closed-model-enumeration-proof-v1", enumeratorVersion: VERSION,
    decisionRef: rawRef("rms-closed-qualification-source-decision-v2", decisionUtf8),
    modelRef: rawRef("rms-closed-function-model-v2", modelUtf8),
    enumeratorSource: { path: enumeratorCode.path, ref: rawRef("rms-closed-model-enumerator-source-v1", enumeratorCode.utf8),
      attribution: "parent-supplied source bytes; parent must verify actual invoked file pin" },
    scope: "Complete declared virtual model only; not a program, machine extraction, execution or semantic oracle",
    fixture: true, admissibleAsOracle: false, nativeAuthority: "NONE", closure: Q.closure,
    functions, visits, completed: true, tailsIterated: true, selfLoopsPreserved: true
  });
  return freeze({ decision: D, model: Q, functions, evidence });
}
