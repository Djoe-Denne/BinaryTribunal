// Test adapter only. All instrumentation failures are reported out of band.
import { appendFileSync, writeFileSync } from "node:fs";
import { types } from "node:util";

type Atom = null | boolean | string | ["undefined"] | ["number", string] | ["ref", number];
type Property = [string, boolean, boolean, boolean, Atom];
type Node = { id: number; kind: string; extensible: boolean; properties: Property[]; entries?: unknown[] };
type Graph = { roots: Atom[]; nodes: Node[] };
type Fatal = { stage: string; id: number | null; reason: string };

const destination = process.env.FF8_PARENT_DIFF_TRACE;
const metadata = process.env.FF8_PARENT_DIFF_META;
const fatal: Fatal[] = [];
const identities = new WeakMap<object, number>();
let nextIdentity = 0;
let issued = 0;
let completed = 0;
let state: "open" | "finalizing" | "finalized" | "failed" = "open";
let traceBytes = 0;
let markerWritten = false;
// Bind the native scheduler before any fixed-corpus producer action. The
// parent-pinned runtime contract excludes explicit exit/abort, hostile queue
// replacement/host-error swallowing and arbitrary OOM/runtime compromise.
const nativeQueueMicrotask = queueMicrotask;
let postSealSignalQueued = false;
// Typed literal copy of the ratified reader/writer seam; no CJS/type escape.
const MAX_RECORD_BYTES = 268435456;
const MAX_TRACE_BYTES = 1073741824;
const MAX_FOOTER_BYTES = 65536;
const FATAL_RESERVE_BYTES = 4096;

// Native brands are checked independently BEFORE these exact prototype tags.
// This encodes the approved producers' DATA contract, not object-origin proof.
const errors = new Map<object, string>([
  [Error.prototype, "Error"], [EvalError.prototype, "EvalError"],
  [RangeError.prototype, "RangeError"], [ReferenceError.prototype, "ReferenceError"],
  [SyntaxError.prototype, "SyntaxError"], [TypeError.prototype, "TypeError"],
  [URIError.prototype, "URIError"], [AggregateError.prototype, "AggregateError"],
]);
const prototypeState = new Map<object, { parent: object | null; descriptors: PropertyDescriptorMap }>();
for (const prototype of [Object.prototype, Array.prototype, Map.prototype, Set.prototype, ...errors.keys()]) {
  prototypeState.set(prototype, {
    parent: Object.getPrototypeOf(prototype), descriptors: Object.getOwnPropertyDescriptors(prototype),
  });
}

function verifyPrototype(prototype: object | null): void {
  if (prototype === null) return;
  const original = prototypeState.get(prototype);
  if (!original || Object.getPrototypeOf(prototype) !== original.parent) reject("mutated built-in prototype chain");
  const current = Object.getOwnPropertyDescriptors(prototype);
  const keys = Reflect.ownKeys(original.descriptors);
  const actualKeys = Reflect.ownKeys(current);
  if (keys.length !== actualKeys.length || keys.some((key, i) => key !== actualKeys[i])) reject("mutated built-in prototype keys");
  for (const key of keys) {
    const before = Reflect.get(original.descriptors, key) as PropertyDescriptor;
    const after = Reflect.get(current, key) as PropertyDescriptor;
    for (const field of ["value", "get", "set", "writable", "enumerable", "configurable"] as const) {
      if (!Object.is(before[field], after[field])) reject("mutated built-in prototype descriptor");
    }
  }
  verifyPrototype(original.parent);
}

function reject(reason: string): never {
  throw new Error(reason);
}

const forbiddenBrands = [
  "isPromise", "isDate", "isRegExp", "isAnyArrayBuffer", "isArrayBufferView",
  "isBoxedPrimitive", "isWeakMap", "isWeakSet", "isArgumentsObject",
  "isGeneratorObject", "isMapIterator", "isSetIterator", "isModuleNamespaceObject",
  "isExternal", "isKeyObject", "isCryptoKey",
] as const;
const requiredBrands = ["isProxy", "isMap", "isSet", "isNativeError", ...forbiddenBrands] as const;

function encodeRoots(values: unknown[]): Graph {
  const nodes: Node[] = [];
  const visited = new Set<object>();
  const ordinary = new Set<object>();
  const parents = new Map<object, Set<object>>();
  const unsafeClone = new Set<object>();
  const brands = new Map<string, (value: unknown) => boolean>();
  for (const name of requiredBrands) {
    const descriptor = Object.getOwnPropertyDescriptor(types, name);
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") reject("required native predicate unavailable: " + name);
    brands.set(name, descriptor.value as (value: unknown) => boolean);
  }
  function branded(name: string, value: object): boolean { return brands.get(name)!(value); }
  function classify(value: object): string {
    // isProxy precedes getPrototypeOf/descriptors; predicates do not run getters.
    if (branded("isProxy", value)) return reject("proxy");
    for (const name of forbiddenBrands) if (branded(name, value)) return reject("forbidden native brand: " + name);
    const prototype: object | null = Object.getPrototypeOf(value);
    let kind: string;
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) return reject("native array/prototype mismatch");
      kind = "array";
    } else if (branded("isMap", value)) {
      if (prototype !== Map.prototype) return reject("native Map/prototype mismatch");
      kind = "map";
    } else if (branded("isSet", value)) {
      if (prototype !== Set.prototype) return reject("native Set/prototype mismatch");
      kind = "set";
    } else if (branded("isNativeError", value)) {
      if (prototype === null || !errors.has(prototype)) return reject("native Error/prototype mismatch");
      kind = "error:" + errors.get(prototype)!;
    } else if (prototype === null) kind = "null-object";
    else if (prototype === Object.prototype) kind = "object";
    else return reject("unsupported or forged native prototype");
    verifyPrototype(prototype);
    return kind;
  }
  function edge(parent: object, child: unknown): Atom {
    if (child !== null && typeof child === "object") {
      let incoming = parents.get(child);
      if (!incoming) { incoming = new Set<object>(); parents.set(child, incoming); }
      incoming.add(parent);
    }
    return visit(child);
  }
  function visit(value: unknown): Atom {
    if (value === null || typeof value === "boolean" || typeof value === "string") return value;
    if (value === undefined) return ["undefined"];
    if (typeof value === "number") return ["number", Object.is(value, -0) ? "-0" : String(value)];
    if (typeof value !== "object") return reject("unsupported primitive: " + typeof value);
    const kind = classify(value);
    let id = identities.get(value);
    if (id === undefined) {
      id = ++nextIdentity;
      identities.set(value, id);
    }
    if (visited.has(value)) return ["ref", id];
    visited.add(value);
    if (kind === "object" || kind === "null-object") ordinary.add(value);
    // Native Error cloning may materialize excluded stack state. Never read its
    // stack descriptor or let the probe reach it, even if the stack looks inert.
    if (kind.startsWith("error:")) unsafeClone.add(value);
    const node: Node = { id, kind, extensible: Object.isExtensible(value), properties: [] };
    nodes.push(node); // Install before recursion, so cycles and aliases are exact.
    // Reflect.ownKeys preserves JS property order. No sorting, getter or toJSON.
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return reject("symbol property");
      // The sole deliberate exclusion: Error.stack contains scratch paths.
      if (kind.startsWith("error:") && key === "stack") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) return reject("accessor property: " + key);
      node.properties.push([
        key, !!descriptor.enumerable, !!descriptor.configurable, !!descriptor.writable,
        edge(value, descriptor.value),
      ]);
    }
    // Array own indices + the own length descriptor distinguish holes from
    // undefined and null, and preserve non-index properties and sparse tails.
    if (kind === "map") {
      node.entries = [];
      for (const [key, entry] of Map.prototype.entries.call(value) as IterableIterator<[unknown, unknown]>) {
        node.entries.push([edge(value, key), edge(value, entry)]);
      }
    } else if (kind === "set") {
      node.entries = [];
      for (const entry of Set.prototype.values.call(value) as IterableIterator<unknown>) {
        node.entries.push(edge(value, entry));
      }
    }
    return ["ref", id];
  }
  const roots = values.map(visit); // Finish all graph/descriptor/proxy validation first.
  if (ordinary.size > 0) {
    // Propagate unsafe native-Error reachability once over reverse edges;
    // cycles are visited once, not rescanned for each ordinary root.
    const queue = [...unsafeClone];
    for (let i = 0; i < queue.length; ++i) for (const parent of parents.get(queue[i]) || []) {
      if (!unsafeClone.has(parent)) { unsafeClone.add(parent); queue.push(parent); }
    }
    if ([...ordinary].some(value => unsafeClone.has(value))) reject("ordinary counter-probe would reach native Error stack state");
    if (typeof structuredClone !== "function") reject("native structuredClone unavailable");
    // Exactly ONE clone for the whole collected list. Its payload is discarded:
    // only native-brand counter-evidence is used, never normalization/equality.
    const cloned: unknown = structuredClone([...ordinary]);
    if (!Array.isArray(cloned) || cloned.length !== ordinary.size) reject("invalid native clone root list");
    for (const value of cloned) {
      if (value === null || typeof value !== "object") reject("ordinary counter-probe changed root type");
      const kind = classify(value);
      if (kind !== "object" && kind !== "null-object") reject("ordinary counter-probe exposed native root");
    }
  }
  return { roots, nodes };
}

function note(stage: string, id: number | null, reason: string): void {
  // One fatal suffices to refuse, even if tests swallow many capture failures.
  if (fatal.length === 0) fatal.push({ stage, id, reason });
}

function fatalMarker(): void {
  if (markerWritten) return;
  process.exitCode = 97;
  try {
    const text = JSON.stringify({ kind: "INSTRUMENTATION_FATAL", reason: "capture failed or call after seal" }) + "\n";
    const bytes = Buffer.byteLength(text, "utf8");
    if (!destination || bytes > FATAL_RESERVE_BYTES || traceBytes + bytes > MAX_TRACE_BYTES) return;
    appendFileSync(destination, text);
    markerWritten = true; // Written, not merely attempted; failure may retry.
    traceBytes += bytes;
  } catch { /* Hook failure, footer/totality and partial data remain red. */ }
}

function signalPostSeal(): void {
  if (postSealSignalQueued) return;
  nativeQueueMicrotask(() => {
    // Uncaught HOST error, not a producer throw or an already-returned hook.
    // No filesystem/footer write or mutable exitCode is needed for this signal.
    throw new Error("FF8 R5 postseal capture fatal");
  });
  postSealSignalQueued = true;
}

function record(kind: "BEGIN" | "RETURN" | "THROW", id: number, name: string, values: unknown[]): void {
  // This catch is intentionally outside the producer's try/catch. It neither
  // replaces an original throw nor adds a throw following an original return.
  try {
    if (!destination) return note(kind, id, "missing trace destination");
    const value = encodeRoots(values);
    const text = JSON.stringify({ kind, id, name, value }) + "\n";
    const bytes = Buffer.byteLength(text, "utf8");
    if (bytes > MAX_RECORD_BYTES || traceBytes + bytes > MAX_TRACE_BYTES - FATAL_RESERVE_BYTES) {
      return note(kind, id, "record or reserved trace byte cap exceeded");
    }
    appendFileSync(destination, text);
    traceBytes += bytes;
  } catch {
    // Never stringify an arbitrary thrown inspection error or call its getters.
    note(kind, id, "encoding or trace write failed");
  }
}

// Only this private mechanism owns counters/footer. No external count, repair
// or trace-derived footer. The exported hook has no arguments or assertions.
function finish(finalizedBy: "afterAll" | "exit"): boolean {
  if (state === "finalized") return true;
  if (state === "failed") return false;
  if (state === "finalizing") {
    note("FINALIZE", null, "reentrant finalization");
    state = "failed";
    fatalMarker();
    return false;
  }
  state = "finalizing";
  try {
    if (!metadata) reject("missing footer destination");
    if (issued !== completed) note("FINALIZE", null, "incomplete private capture");
    const text = JSON.stringify({
      schema: "planner-full-trace-r5", finalized: true, issued, completed, fatal, finalizedBy,
    }) + "\n";
    if (Buffer.byteLength(text, "utf8") > MAX_FOOTER_BYTES) reject("footer byte cap exceeded");
    writeFileSync(metadata!, text, { flag: "wx" });
    if (fatal.length) {
      state = "failed";
      fatalMarker();
      return false;
    }
    state = "finalized";
    return true;
  } catch {
    note("FINALIZE", null, "footer write failed");
    state = "failed";
    fatalMarker();
    return false;
  }
}

export function finalizeCapture(): boolean { return finish("afterAll"); }
process.once("exit", () => { if (!finish("exit")) process.exitCode = 97; });

export function traceCall<T>(name: string, args: unknown[], action: () => T): T {
  if (state !== "open") {
    signalPostSeal(); // Queue BEFORE action, including an identical product throw.
    note("POST_SEAL", null, "call after seal");
    state = "failed";
    fatalMarker();
    return action(); // Exactly once; preserve identical return/throw.
  }
  const id = ++issued;
  record("BEGIN", id, name, [args]);
  let value: T;
  try {
    value = action();
  } catch (error) {
    ++completed;
    record("THROW", id, name, [args, error]);
    throw error; // Preserve exact identity of the producer's exception.
  }
  ++completed;
  record("RETURN", id, name, [args, value]);
  return value; // Instrumentation has no success-to-throw path.
}
