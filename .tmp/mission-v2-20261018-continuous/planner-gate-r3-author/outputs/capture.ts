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
let finalized = false;

// Only exact built-in prototypes are admitted. Their inherited semantics are
// identified by this tag; own properties, including non-enumerables, are below.
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

function encodeRoots(values: unknown[]): Graph {
  const nodes: Node[] = [];
  const visited = new Set<object>();
  function visit(value: unknown): Atom {
    if (value === null || typeof value === "boolean" || typeof value === "string") return value;
    if (value === undefined) return ["undefined"];
    if (typeof value === "number") return ["number", Object.is(value, -0) ? "-0" : String(value)];
    if (typeof value !== "object") return reject("unsupported primitive: " + typeof value);
    if (typeof types.isProxy !== "function") return reject("proxy detector unavailable");
    if (types.isProxy(value)) return reject("proxy");
    const prototype: object | null = Object.getPrototypeOf(value);
    let kind: string;
    if (Array.isArray(value) && prototype === Array.prototype) kind = "array";
    else if (prototype === Map.prototype) kind = "map";
    else if (prototype === Set.prototype) kind = "set";
    else if (prototype === null) kind = "null-object";
    else if (prototype === Object.prototype) kind = "object";
    else if (prototype !== null && errors.has(prototype)) kind = "error:" + errors.get(prototype)!;
    else return reject("unsupported prototype (includes Promise, Date and custom classes)");
    verifyPrototype(prototype);
    let id = identities.get(value);
    if (id === undefined) {
      id = ++nextIdentity;
      identities.set(value, id);
    }
    if (visited.has(value)) return ["ref", id];
    visited.add(value);
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
        visit(descriptor.value),
      ]);
    }
    // Array own indices + the own length descriptor distinguish holes from
    // undefined and null, and preserve non-index properties and sparse tails.
    if (kind === "map") {
      node.entries = [];
      for (const [key, entry] of Map.prototype.entries.call(value) as IterableIterator<[unknown, unknown]>) {
        node.entries.push([visit(key), visit(entry)]);
      }
    } else if (kind === "set") {
      node.entries = [];
      for (const entry of Set.prototype.values.call(value) as IterableIterator<unknown>) {
        node.entries.push(visit(entry));
      }
    }
    return ["ref", id];
  }
  return { roots: values.map(visit), nodes };
}

function note(stage: string, id: number | null, reason: string): void {
  fatal.push({ stage, id, reason });
}

function record(kind: "BEGIN" | "RETURN" | "THROW", id: number, name: string, values: unknown[]): void {
  // This catch is intentionally outside the producer's try/catch. It neither
  // replaces an original throw nor adds a throw following an original return.
  try {
    if (!destination) return note(kind, id, "missing trace destination");
    const value = encodeRoots(values);
    appendFileSync(destination, JSON.stringify({ kind, id, name, value }) + "\n");
  } catch {
    // Never stringify an arbitrary thrown inspection error or call its getters.
    note(kind, id, "encoding or trace write failed");
  }
}

// A separate final file is mandatory even if tests swallow all product throws.
// wx disallows overwriting a prior footer. Missing/partial/duplicate footer or
// failed trace write is rejected by the gate independently of test assertions.
process.once("exit", () => {
  if (finalized) return;
  finalized = true;
  try {
    if (!metadata) { process.exitCode = 97; return; }
    writeFileSync(metadata, JSON.stringify({
      schema: "planner-full-trace-r3", finalized: true, issued, completed, fatal,
    }) + "\n", { flag: "wx" });
  } catch {
    // A duplicate wx footer can leave an earlier valid file. Mark runner failure
    // as well, never throw into product control flow or trust that stale footer.
    process.exitCode = 97;
    try {
      if (destination) appendFileSync(destination, JSON.stringify({ kind: "INSTRUMENTATION_FATAL", reason: "footer write failed" }) + "\n");
    } catch { /* Nonzero runner status remains the independent fallback. */ }
  }
});

export function traceCall<T>(name: string, args: unknown[], action: () => T): T {
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
