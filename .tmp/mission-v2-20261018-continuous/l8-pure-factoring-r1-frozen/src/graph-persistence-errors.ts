// One shared error identity; no persistence or runtime value dependency.
import type { ErrorClass } from "./eventlog";

export class GraphPersistenceError extends Error {
  constructor(readonly category: Exclude<ErrorClass, "none">, message: string) { super(message); }
}


export function invariant(value: unknown, message: string, category: Exclude<ErrorClass, "none"> = "input"): asserts value {
  if (!value) throw new GraphPersistenceError(category, message);
}

