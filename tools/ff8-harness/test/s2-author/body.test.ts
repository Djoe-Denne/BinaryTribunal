import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { captureAdmissionImageV3, verifyAdmissionImageV3, checkAdmissionBodyCapsV3 } from "../../src/graph-generation-budget";

// Manual synthetic bytes, specified before the implementation. No S1 QA fixtures,
// producer, transport, credential, root ledger or native preimage is involved.
const COMMAND = '{"extra":{"a":[true,null,2],"z":"é😀"},"prompt":"synthetic"}';
const ADMISSION = '{"attemptId":"a","command":' + COMMAND + ',"executionId":"e","extra":["保",false],"idempotencyKey":"e","role":"A","subIntentId":"s"}';
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const input = () => ({ subIntentId: "s", role: "A", idempotencyKey: "e", extra: ["保", false], executionId: "e",
  command: { prompt: "synthetic", extra: { z: "é😀", a: [true, null, 2] } }, attemptId: "a" });
const literalImage = () => ({ admissionUtf8: ADMISSION, commandUtf8: COMMAND,
  admissionUtf8Bytes: Buffer.byteLength(ADMISSION, "utf8"), commandUtf8Bytes: Buffer.byteLength(COMMAND, "utf8"),
  admissionRawSha256: sha256(ADMISSION), commandRawSha256: sha256(COMMAND), requestDigest: sha256(ADMISSION) });

describe("pure capture of an already constructed Admission, never authority", () => {
  test("entire literal images retain extra fields and exact multibyte UTF-8", () => {
    const source = input(), before = structuredClone(source), image = captureAdmissionImageV3(source);
    expect(image).toEqual(literalImage());
    expect(source).toEqual(before);
    expect(image.admissionUtf8Bytes).toBeGreaterThan(ADMISSION.length);
    expect(image.commandUtf8Bytes).toBeGreaterThan(COMMAND.length);
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    // Upstream fingerprint is SHA256(canonical(value)), NOT S1's D(kind,value).
    expect(image.requestDigest).not.toBe(sha256('{"kind":"synthetic-test-only","value":' + ADMISSION + '}'));
  });

  test("capture is detached, frozen, deterministic; numeric keys and JSON extras survive", () => {
    const source = input(), image = captureAdmissionImageV3(source), bytes = image.admissionUtf8;
    source.command.extra.z = "changed"; source.extra.push("later");
    expect(image.admissionUtf8).toBe(bytes); expect(Object.isFrozen(image)).toBe(true);
    const reordered = JSON.parse(ADMISSION) as unknown;
    expect(captureAdmissionImageV3(reordered)).toEqual(literalImage());
    const numeric = { ...input(), command: { "2": "two", "10": "ten", nested: { empty: {}, list: [] } } };
    expect(captureAdmissionImageV3(numeric).commandUtf8).toBe('{"10":"ten","2":"two","nested":{"empty":{},"list":[]}}');
  });

  test("verifies received images independently, without trusting their declared counts", () => {
    const supplied = literalImage(), before = structuredClone(supplied), verified = verifyAdmissionImageV3(supplied);
    expect(verified).toEqual(before); expect(verified).not.toBe(supplied); expect(supplied).toEqual(before);
    supplied.commandUtf8 = "{}"; expect(verified.commandUtf8).toBe(COMMAND);
    for (const field of Object.keys(before)) {
      const damaged = { ...before, [field]: typeof before[field as keyof typeof before] === "number" ? 1 : "changed" };
      expect(() => verifyAdmissionImageV3(damaged)).toThrow();
    }
    expect(() => verifyAdmissionImageV3({ ...before, extra: true })).toThrow();
    expect(() => verifyAdmissionImageV3({ ...before, admissionUtf8: " " + ADMISSION })).toThrow();
    const duplicate = ADMISSION.replace('"role":"A"', '"role":"A","role":"A"');
    expect(() => verifyAdmissionImageV3({ ...before, admissionUtf8: duplicate,
      admissionUtf8Bytes: Buffer.byteLength(duplicate), admissionRawSha256: sha256(duplicate), requestDigest: sha256(duplicate) })).toThrow();
    const otherCommand = '{"different":true}';
    expect(() => verifyAdmissionImageV3({ ...before, commandUtf8: otherCommand,
      commandUtf8Bytes: Buffer.byteLength(otherCommand), commandRawSha256: sha256(otherCommand) })).toThrow();
    // A wholly coherent different capture is data, not authenticated provenance.
    const different = captureAdmissionImageV3({ ...input(), extra: ["different"] });
    expect(verifyAdmissionImageV3(different)).toEqual(different);
  });

  test("actual <= current <= acquired at exact byte boundaries; no reduced debit", () => {
    const image = literalImage(), n = Buffer.byteLength(ADMISSION, "utf8");
    for (const [current, acquired, fits] of [[n - 1, n, false], [n, n, true], [n + 1, n + 1, true],
      [n, n + 1, true], [n + 1, n, false], [0, n, false]] as const) {
      expect(checkAdmissionBodyCapsV3(image, current, acquired)).toEqual({ fits,
        actualBodyUtf8Bytes: n, currentUnitCapUtf8Bytes: current, acquiredSlotCapUtf8Bytes: acquired });
    }
    expect(checkAdmissionBodyCapsV3(image, n, Number.MAX_SAFE_INTEGER).acquiredSlotCapUtf8Bytes).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => checkAdmissionBodyCapsV3({ ...image, admissionUtf8Bytes: 0 }, 1, 1)).toThrow();
    for (const cap of [null, undefined, false, "100", {}, { known: false, value: null }, NaN, Infinity, -1, -0, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => checkAdmissionBodyCapsV3(image, cap, n)).toThrow();
      expect(() => checkAdmissionBodyCapsV3(image, n, cap)).toThrow();
    }
    expect(() => checkAdmissionBodyCapsV3(image, n, 0)).toThrow();
  });

  test("requires five nonempty identities and an object command, not a new command schema", () => {
    for (const key of ["executionId", "attemptId", "role", "subIntentId", "idempotencyKey"]) {
      for (const bad of [undefined, null, "", " ", 1]) expect(() => captureAdmissionImageV3({ ...input(), [key]: bad })).toThrow();
    }
    for (const command of [null, [], "value", 1]) expect(() => captureAdmissionImageV3({ ...input(), command })).toThrow();
    expect(captureAdmissionImageV3({ ...input(), role: "synthetic-uninterpreted-role", command: {} }).commandUtf8).toBe("{}");
  });

  test("strict JSON rejection does not execute getters, proxy traps or toJSON", () => {
    let calls = 0;
    const accessor = Object.defineProperty({}, "nested", { enumerable: true, get() { calls++; throw new Error("getter executed"); } });
    const proxy = new Proxy({}, { ownKeys() { calls++; throw new Error("proxy executed"); }, get() { calls++; throw new Error("proxy get executed"); } });
    const toJSON = { toJSON() { calls++; throw new Error("toJSON executed"); } };
    for (const extra of [accessor, proxy, toJSON, undefined, () => 1, Symbol("x"), 1n, NaN, Infinity, -0,
      new Date(0), Object.create(null), new Array(1), "\ud800", "\udc00", { ["\ud800"]: "invalid key" }]) {
      expect(() => captureAdmissionImageV3({ ...input(), extra })).toThrow();
    }
    const cycle: { self?: unknown } = {}; cycle.self = cycle;
    expect(() => captureAdmissionImageV3({ ...input(), extra: cycle })).toThrow();
    expect(() => captureAdmissionImageV3(proxy)).toThrow();
    expect(() => verifyAdmissionImageV3(proxy)).toThrow();
    expect(() => verifyAdmissionImageV3(Object.defineProperty({}, "admissionUtf8", { enumerable: true, get() { calls++; return ADMISSION; } }))).toThrow();
    expect(() => checkAdmissionBodyCapsV3(literalImage(), proxy, 100)).toThrow();
    expect(calls).toBe(0);
  });
});
