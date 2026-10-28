// Parent validation probe: malformed inputs only, never a proposal/adoption success.
import { strict as assert } from "node:assert";
import { decodePreparedGraphV3, decodePartitionAdoptionV1, inspectPreparedGraphV3, inspectPartitionAdoptionV1 } from "../tools/ff8-harness/src/graph-transport.ts";
let assertions = 0, apiCalls = 0, getterCalls = 0;
const check = (value: unknown, expected: unknown) => { assertions++; assert.deepEqual(value, expected); };
for (const value of [undefined, null, false, 1, "{}", [], {}]) {
  for (const decode of [decodePreparedGraphV3, decodePartitionAdoptionV1]) {
    apiCalls++; const result = decode(value); check(result.ok, false);
    if (!result.ok) check(result.errors.length > 0, true);
  }
  for (const inspect of [inspectPreparedGraphV3, inspectPartitionAdoptionV1]) {
    apiCalls++; const result = inspect(value); check(result.wellFormed, false);
    check(result.coherent, false); check(result.stats, null);
    check(result.authority, "untrusted"); check(result.adoptionReady, false);
  }
}
const accessor = Object.defineProperty({}, "schemaVersion", { enumerable: true, get() { getterCalls++; throw new Error("getter must not execute"); } });
for (const decode of [decodePreparedGraphV3, decodePartitionAdoptionV1]) { apiCalls++; check(decode(accessor).ok, false); }
check(getterCalls, 0);
console.log(JSON.stringify({ kind: "parent-malformed-transport-smoke", apiCalls, assertions, getterCalls, positiveDocumentsExercised: false, authority: "untrusted", adoptionReady: false }));
