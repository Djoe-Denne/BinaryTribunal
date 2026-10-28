/** Pure capture/comparison of a supplied Admission, NOT a ledger or authorization.
 * Does not establish final scientific completeness, source authenticity, acquired
 * capacity, RPC bytes, transport exclusions, or permission to dispatch anything.
 */
import type { Admission } from "./graph-store";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { canonical, fingerprint, hash } from "./validation";

export interface AdmissionImageV3 {
  readonly admissionUtf8: string;
  readonly commandUtf8: string;
  readonly admissionUtf8Bytes: number;
  readonly commandUtf8Bytes: number;
  readonly admissionRawSha256: string;
  readonly commandRawSha256: string;
  /** Upstream fingerprint(Admission), never S1 D(kind,value) or fingerprint(command). */
  readonly requestDigest: string;
}

export interface AdmissionBodyCapCheckV3 {
  readonly fits: boolean;
  readonly actualBodyUtf8Bytes: number;
  readonly currentUnitCapUtf8Bytes: number;
  readonly acquiredSlotCapUtf8Bytes: number;
}

const imageKeys: readonly (keyof AdmissionImageV3)[] = ["admissionUtf8", "commandUtf8", "admissionUtf8Bytes",
  "commandUtf8Bytes", "admissionRawSha256", "commandRawSha256", "requestDigest"];

function requireBody(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`admission-image: ${message}`);
}

function assertAdmission(value: unknown): asserts value is Admission {
  // This function only receives detached strict JSON, never the caller's heap.
  requireBody(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  const record = value as Record<string, unknown>;
  for (const key of ["executionId", "attemptId", "role", "subIntentId", "idempotencyKey"]) {
    const identity = record[key];
    requireBody(typeof identity === "string" && identity.trim().length > 0, "five nonempty string identities required");
  }
  requireBody(record.command !== null && typeof record.command === "object" && !Array.isArray(record.command), "object command required");
}

/** Capture the entire supplied JSON value. Extra Admission/command fields survive.
 * No field is interpreted as a credential or silently removed; callers must only
 * supply approved synthetic data in this tranche. No IO, logging or mutation.
 */
export function captureAdmissionImageV3(value: unknown): AdmissionImageV3 {
  // The qualified primitive rejects proxies/accessors/non-JSON/invalid Unicode
  // before canonical() can read a field or JSON cloning can lose a value.
  assertExecutionJsonV1(value);
  const admission = JSON.parse(canonical(value)) as unknown;
  assertAdmission(admission);
  const admissionUtf8 = canonical(admission), commandUtf8 = canonical(admission.command);
  const admissionBytes = Buffer.from(admissionUtf8, "utf8"), commandBytes = Buffer.from(commandUtf8, "utf8");
  return Object.freeze({ admissionUtf8, commandUtf8,
    admissionUtf8Bytes: admissionBytes.byteLength, commandUtf8Bytes: commandBytes.byteLength,
    admissionRawSha256: hash(admissionBytes), commandRawSha256: hash(commandBytes),
    // These names express different domains/roles. With upstream's present
    // canonical UTF-8 implementation, this hex value equals admissionRawSha256.
    requestDigest: fingerprint(admission) });
}

/** Recompute everything; a cofabricated small count cannot bypass a comparison.
 * A coherent different Admission is still just data, not authenticated origin.
 */
export function verifyAdmissionImageV3(value: unknown): AdmissionImageV3 {
  assertExecutionJsonV1(value);
  requireBody(value !== null && typeof value === "object" && !Array.isArray(value), "image object required");
  const supplied = JSON.parse(canonical(value)) as Record<string, unknown>;
  const keys = Object.keys(supplied);
  requireBody(keys.length === imageKeys.length && imageKeys.every(key => Object.hasOwn(supplied, key)), "exact image fields required");
  requireBody(typeof supplied.admissionUtf8 === "string", "admission UTF-8 text required");
  let admission: unknown;
  try { admission = JSON.parse(supplied.admissionUtf8); }
  catch { throw new Error("admission-image: invalid admission JSON text"); }
  const actual = captureAdmissionImageV3(admission);
  // This also rejects noncanonical text, duplicate keys, alternate number/escape
  // representations, a substituted command, wrong raw hashes and wrong domains.
  for (const key of imageKeys) requireBody(supplied[key] === actual[key], "image integrity mismatch");
  return actual;
}

function explicitCap(value: unknown, minimum: number): number {
  requireBody(typeof value === "number" && Number.isSafeInteger(value) && !Object.is(value, -0) && value >= minimum,
    "explicit safe integer cap required");
  return value;
}

/** Only actualBytes <= CunitCourant <= CrootAcquired. Unknown/malformed caps
 * throw; well-formed exceeded caps produce fits:false. No sums, remaining-root
 * inference, per-function Cf rule, acquired-debit reduction or durable effect.
 */
export function checkAdmissionBodyCapsV3(image: unknown, currentUnitCap: unknown, acquiredSlotCap: unknown): AdmissionBodyCapCheckV3 {
  const actual = verifyAdmissionImageV3(image);
  const current = explicitCap(currentUnitCap, 0), acquired = explicitCap(acquiredSlotCap, 1);
  return Object.freeze({ fits: actual.admissionUtf8Bytes <= current && current <= acquired,
    actualBodyUtf8Bytes: actual.admissionUtf8Bytes, currentUnitCapUtf8Bytes: current, acquiredSlotCapUtf8Bytes: acquired });
}
