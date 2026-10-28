// Parent-owned test adapter. Does not alter producer bodies or their choices.
import { appendFileSync } from "node:fs";
function encode(value: unknown, active = new Set<object>()): unknown {
  if (value === undefined) return ["undefined"];
  if (typeof value === "number") return ["number", Object.is(value, -0) ? "-0" : String(value)];
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return ["bigint", String(value)];
  if (typeof value === "function") return ["function", value.name];
  if (typeof value === "symbol") return ["symbol", String(value)];
  if (active.has(value as object)) throw new Error("differential trace cyclic value");
  active.add(value as object);
  let result: unknown;
  if (Array.isArray(value)) result = ["array", value.map(v => encode(v, active))];
  else if (value instanceof Map) result = ["map", [...value].map(([k,v]) => [encode(k,active),encode(v,active)])];
  else if (value instanceof Set) result = ["set", [...value].map(v => encode(v,active))];
  else if (value instanceof Date) result = ["date", value.toISOString()];
  else if (value instanceof Error) result = ["error", value.name, value.message, Object.keys(value).map(k => [k,encode((value as unknown as Record<string,unknown>)[k],active)])];
  else result = ["object", Object.keys(value as object).map(k => [k,encode((value as Record<string,unknown>)[k],active)])];
  active.delete(value as object);
  return result;
}
export function traceCall<T>(name: string, args: unknown[], action: () => T): T {
  const destination = process.env.FF8_PARENT_DIFF_TRACE;
  if (!destination) throw new Error("missing parent differential trace destination");
  const before = encode(args);
  let value: T;
  try { value = action(); }
  catch (error) {
    appendFileSync(destination, JSON.stringify({ name, before, after: encode(args), threw: encode(error) }) + "\n");
    throw error;
  }
  appendFileSync(destination, JSON.stringify({ name, before, after: encode(args), result: encode(value) }) + "\n");
  return value;
}
