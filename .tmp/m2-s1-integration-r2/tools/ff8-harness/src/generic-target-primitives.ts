/** Q1 data primitives only, not a target plan, permission, launcher or OS guard.
 * The remaining Q1/broker/coordinator contracts are NOT implemented here.
 * Provenance and scenario coverage: M1_REMPLACEMENTS_20261020.{md,json}.
 */
export const genericTargetPlanContract = Object.freeze({
  Version: "generic-t-dual-1", TimeProfileQ1: "V3-Q1",
  WindowsArgvCodecId: "win-quote-v1", WindowsEnvCodecId: "win-env-v1",
  CanonicalEncodingId: "gtplan-canonical-v1", MaxArgumentCount: 128,
  MaxCommandLineChars: 32766, MaxEnvironmentBlockUnits: 32767,
  MaxEnvironmentEntries: 4096, MaxSourcePins: 64, MaxOwnershipRootBindings: 16,
  MaxLabelChars: 259, MaxAdditionalControlArtifacts: 16,
});
export const genericQualificationMode = Object.freeze({
  C01: 1, C02: 2, C03: 3, C04: 4, C05: 5, C06: 6, C07: 7,
  C08: 8, C09: 9, C10: 10, C11: 11, C12: 12, C13: 13, C14: 14,
});
export const genericPlanRefusal = Object.freeze({
  None: 0, NullInput: 1, BadIdentity: 2, BadPin: 3, BadLedgerPlanPin: 4,
  BadTargetPath: 5, BadArgv: 6, BadCommandLine: 7, BadWorkingDirectory: 8,
  BadEnvironmentEntries: 9, BadEnvironmentBlock: 10, BadReservationBinding: 11,
  BadSourcePins: 12, BadOwnershipRootBindings: 13, BadQualificationMode: 14,
  ControlBudgetExceeded: 15, InternalEncodingFailure: 16,
  BadControlArtifacts: 17, BadEnvironmentAllowlist: 18,
});

export type WindowsArgvEncoding = { ok: true; value: string } | { ok: false; value: null };
const refused = (): WindowsArgvEncoding => ({ ok: false, value: null });
const actualByteLength = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")!.get!;

// JavaScript string.length, like the reference, counts UTF-16 code units.
// Reject C0 and unmatched surrogates; DEL and valid surrogate pairs are allowed.
function validArgument(value: unknown): value is string {
  if (typeof value !== "string" || value.length > genericTargetPlanContract.MaxCommandLineChars) return false;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit < 32) return false;
    if (unit >= 0xd800 && unit <= 0xdfff) {
      if (unit > 0xdbff || i + 1 >= value.length) return false;
      const low = value.charCodeAt(++i);
      if (low < 0xdc00 || low > 0xdfff) return false;
    }
  }
  return true;
}
const needsQuotes = (argument: string) => argument.length === 0 || argument.includes(" ") || argument.includes('"');

/** Requires valid raw data. Refuse the encoded bound BEFORE constructing output. */
function encodedUnits(argument: string): number | null {
  if (!needsQuotes(argument)) return argument.length;
  let units = 2;
  for (let i = 0; i < argument.length;) {
    if (argument[i] === "\\") {
      const start = i;
      while (i < argument.length && argument[i] === "\\") i++;
      const run = i - start;
      if (argument[i] === '"') { units += 2 * run + 2; i++; }
      else units += i === argument.length ? 2 * run : run;
    } else { units += argument[i++] === '"' ? 2 : 1; }
    if (units > genericTargetPlanContract.MaxCommandLineChars) return null;
  }
  return units;
}
function writeArgument(argument: string): string {
  if (!needsQuotes(argument)) return argument;
  const parts = ['"'];
  for (let i = 0; i < argument.length;) {
    if (argument[i] === "\\") {
      const start = i;
      while (i < argument.length && argument[i] === "\\") i++;
      const run = i - start;
      if (argument[i] === '"') { parts.push("\\".repeat(2 * run + 1), '"'); i++; }
      else parts.push("\\".repeat(i === argument.length ? 2 * run : run));
    } else {
      if (argument[i] === '"') parts.push("\\");
      parts.push(argument[i++]!);
    }
  }
  parts.push('"');
  return parts.join("");
}

/** Primitive quoting has NO closed-flag policy: -r/--preload remain data here. */
export function encodeWindowsArgument(argument: unknown): WindowsArgvEncoding {
  try {
    if (!validArgument(argument)) return refused();
    const units = encodedUnits(argument);
    if (units === null) return refused();
    const value = writeArgument(argument);
    return value.length === units ? { ok: true, value } : refused();
  } catch { return refused(); }
}

/** Copies the bounded vector; success is data encoding, never execution approval. */
export function encodeWindowsCommandLine(argv: unknown): WindowsArgvEncoding {
  try {
    if (!Array.isArray(argv) || argv.length < 1 || argv.length > genericTargetPlanContract.MaxArgumentCount) return refused();
    const snapshot: string[] = [];
    // A managed string[] has no holes/accessors; do not invoke JS getters.
    for (let i = 0; i < argv.length; i++) {
      const field = Object.getOwnPropertyDescriptor(argv, String(i));
      if (!field || !("value" in field) || !validArgument(field.value)) return refused();
      snapshot.push(field.value);
    }
    let units = snapshot.length - 1;
    for (const argument of snapshot) {
      const one = encodedUnits(argument);
      if (one === null || units + one > genericTargetPlanContract.MaxCommandLineChars) return refused();
      units += one;
    }
    const value = snapshot.map(writeArgument).join(" ");
    return value.length === units ? { ok: true, value } : refused();
  } catch { return refused(); }
}

/** Counts the actual supplied bytes, not a canonical-plan reserve or artifact cap.
 * On refusal the reference's out total is zero, never a partial debit/refund.
 * This does NOT implement the plan builder's additional-artifact count policy.
 */
export function countControlFileBytes(artifacts: unknown): { ok: boolean; totalBytes: number } {
  const failure = { ok: false, totalBytes: 0 };
  try {
    if (!Array.isArray(artifacts)) return failure;
    let totalBytes = 0;
    for (let i = 0; i < artifacts.length; i++) {
      const field = Object.getOwnPropertyDescriptor(artifacts, String(i));
      if (!field || !("value" in field) || !(field.value instanceof Uint8Array)) return failure;
      // The managed reference uses the array's intrinsic Length, not metadata
      // a JS caller can shadow with an own property or subclass getter.
      totalBytes += actualByteLength.call(field.value);
      if (totalBytes > 32768) return failure;
    }
    return { ok: true, totalBytes };
  } catch { return failure; }
}
