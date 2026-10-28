import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import reference from "./fixtures/generic-target-reference.json";
import {
  genericTargetPlanContract, genericQualificationMode, genericPlanRefusal,
  encodeWindowsArgument, encodeWindowsCommandLine, countControlFileBytes,
} from "../src/generic-target-primitives";

// Independent oracle: frozen QA R3 (byte-identical to QA R2), sha256
// a3a910bfffe77c0c4256c1f6d3e08eb0ed479838b758b703fba3bb2318106f95.
// Literal expectations below precede this TS candidate. No reference/candidate
// import, compiler, native child, OS timeout or historical source file is needed.
// The manifest records unported Q1/broker/coordinator cases as BLOCKED.
test("Q02 / T02 independent reference self-check (not canonical codec coverage)", () => {
  const bytes = Buffer.from(reference.canonicalHex, "hex");
  const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  expect(bytes.length).toBe(862);
  expect(sha(bytes)).toBe("c404dcf72229ed1a11ce51da433ae5889b8d64059bd3927c63ab6b70f66b39cf");
  expect(bytes.length + reference.additionalBytes).toBe(918);
  expect(sha(new Uint8Array(0))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  expect(reference.canonicalLength + reference.paddingFirstThreeBytes + reference.paddingPayloads[0]!).toBe(32767);
  expect(reference.canonicalLength + reference.paddingFirstThreeBytes + reference.paddingPayloads[1]!).toBe(32768);
  expect(reference.canonicalLength + reference.paddingFirstThreeBytes + reference.paddingPayloads[2]!).toBe(32769);
});
describe("Q01 / T01 fixed contract constants", () => {
  test("T01 complete constants, modes and refusal values (metadata, not authority)", () => {
    expect(genericTargetPlanContract).toEqual({
      Version: "generic-t-dual-1", TimeProfileQ1: "V3-Q1",
      WindowsArgvCodecId: "win-quote-v1", WindowsEnvCodecId: "win-env-v1",
      CanonicalEncodingId: "gtplan-canonical-v1", MaxArgumentCount: 128,
      MaxCommandLineChars: 32766, MaxEnvironmentBlockUnits: 32767,
      MaxEnvironmentEntries: 4096, MaxSourcePins: 64, MaxOwnershipRootBindings: 16,
      MaxLabelChars: 259, MaxAdditionalControlArtifacts: 16,
    });
    expect(genericQualificationMode).toEqual({
      C01: 1, C02: 2, C03: 3, C04: 4, C05: 5, C06: 6, C07: 7,
      C08: 8, C09: 9, C10: 10, C11: 11, C12: 12, C13: 13, C14: 14,
    });
    expect(genericPlanRefusal).toEqual({
      None: 0, NullInput: 1, BadIdentity: 2, BadPin: 3, BadLedgerPlanPin: 4,
      BadTargetPath: 5, BadArgv: 6, BadCommandLine: 7, BadWorkingDirectory: 8,
      BadEnvironmentEntries: 9, BadEnvironmentBlock: 10, BadReservationBinding: 11,
      BadSourcePins: 12, BadOwnershipRootBindings: 13, BadQualificationMode: 14,
      ControlBudgetExceeded: 15, InternalEncodingFailure: 16,
      BadControlArtifacts: 17, BadEnvironmentAllowlist: 18,
    });
  });
});

// Transcribed T03-a02..aprev: literal escaped strings, NOT the encoder as oracle.
const argumentGoldens: ReadonlyArray<readonly [string, string, string]> = [
  ["T03-a02", "", '""'], ["T03-a01x", "x", "x"],
  ["T03-a03", "a b", '"a b"'], ["T03-a04", 'ab"c', '"ab\\"c"'],
  ["T03-a05", "dir\\", "dir\\"], ["T03-a06", "a b\\", '"a b\\\\"'],
  ["T03-a07", "x a\\\\", '"x a\\\\\\\\"'], ["T03-a08", "b\\\\c", "b\\\\c"],
  ["T03-a09", 'b\\"c', '"b\\\\\\"c"'], ["T03-a10", 'ab"', '"ab\\""'],
  ["T03-a11", "\uD800\uDC00x", "\uD800\uDC00x"],
  ["T03-a12", "C:\\T\\app.exe", "C:\\T\\app.exe"],
  ["T03-ar", "-r", "-r"], ["T03-apre", "--preload", "--preload"],
  ["T03-aprev", "--preload=x", "--preload=x"],
];
const commandGoldens: ReadonlyArray<readonly [string, string[], string]> = [
  ["T03-c01", ["C:\\T\\app.exe"], "C:\\T\\app.exe"],
  ["T03-c02", ["C:\\T\\app.exe", ""], 'C:\\T\\app.exe ""'],
  ["T03-c03", ["C:\\T\\app.exe", "a b"], 'C:\\T\\app.exe "a b"'],
  ["T03-c05", ["C:\\T\\app.exe", "dir\\"], "C:\\T\\app.exe dir\\"],
  ["T03-c08", ["C:\\T\\app.exe", "b\\\\c"], "C:\\T\\app.exe b\\\\c"],
  ["T03-c15", ["C:\\Program Files\\x\\app.exe"], '"C:\\Program Files\\x\\app.exe"'],
  ["T03-crr", ["C:\\T\\app.exe", "-r"], "C:\\T\\app.exe -r"],
  ["T03-cpre", ["C:\\T\\app.exe", "--preload"], "C:\\T\\app.exe --preload"],
];
describe("Q03 / T03 primitive argv positives", () => {
  for (const [id, input, expected] of argumentGoldens) test(id, () => {
    expect(encodeWindowsArgument(input)).toEqual({ ok: true, value: expected });
  });
  for (const [id, input, expected] of commandGoldens) test(id, () => {
    const before = [...input];
    expect(encodeWindowsCommandLine(input)).toEqual({ ok: true, value: expected });
    expect(input).toEqual(before);
  });
  test("T03-a13 exact command bound", () => {
    const input = ["C:\\T\\app.exe", "x".repeat(32753)];
    const expected = "C:\\T\\app.exe " + "x".repeat(32753);
    expect(expected.length).toBe(32766);
    expect(encodeWindowsCommandLine(input)).toEqual({ ok: true, value: expected });
  });
  test("T03-r07/r07len all 128 argv entries", () => {
    const input = ["C:\\T\\app.exe", ...Array.from({ length: 127 }, (_, i) => "a" + (i + 1))];
    const expected = "C:\\T\\app.exe " + Array.from({ length: 127 }, (_, i) => "a" + (i + 1)).join(" ");
    expect(expected.length).toBe(539);
    expect(encodeWindowsCommandLine(input)).toEqual({ ok: true, value: expected });
  });
});

describe("Q04 / T04 primitive argv refusals", () => {
  for (const [id, input] of [
    ["T04-r01", "\0x"], ["T04-r02", "a\tb"], ["T04-r03", "a\nb"],
    ["T04-r04", "\uD800x"], ["T04-r04b", "\uDC00"],
  ] as const) test(id, () => {
    expect(encodeWindowsArgument(input)).toEqual({ ok: false, value: null });
  });
  const badVectors: Array<[string, string[]]> = [
    ["T04-r06", []],
    ["T04-r05", ["C:\\T\\app.exe", ...Array.from({ length: 128 }, (_, i) => "a" + (i + 1))]],
    ["T04-r08", ["C:\\T\\app.exe", ...Array.from({ length: 128 }, (_, i) => "a" + (i + 1))]],
    ["T04-r09", ["C:\\T\\app.exe", "x".repeat(32754)]],
    ["T04-r01c", ["C:\\T\\app.exe", "\0x"]],
  ];
  for (const [id, input] of badVectors) test(id, () => {
    expect(encodeWindowsCommandLine(input)).toEqual({ ok: false, value: null });
  });
});

describe("additional independent native-unit boundaries (not historical coverage)", () => {
  test("32766 unquoted UTF-16 units admitted, 32767 refused", () => {
    expect(encodeWindowsArgument("x".repeat(32766))).toEqual({ ok: true, value: "x".repeat(32766) });
    expect(encodeWindowsArgument("x".repeat(32767))).toEqual({ ok: false, value: null });
    expect(encodeWindowsCommandLine(["x".repeat(32766)])).toEqual({ ok: true, value: "x".repeat(32766) });
    expect(encodeWindowsCommandLine(["x".repeat(32767)])).toEqual({ ok: false, value: null });
  });
  test("quoted expansion counted before writing", () => {
    const at = " " + "x".repeat(32763);
    expect(encodeWindowsArgument(at)).toEqual({ ok: true, value: '"' + at + '"' });
    expect(encodeWindowsArgument(at + "x")).toEqual({ ok: false, value: null });
    expect(encodeWindowsArgument('"'.repeat(16382))).toEqual({ ok: true, value: '"' + '\\"'.repeat(16382) + '"' });
    expect(encodeWindowsArgument('"'.repeat(16383))).toEqual({ ok: false, value: null });
  });
  test("all C0 code units refused, DEL and surrogate pairs retained", () => {
    for (let unit = 0; unit < 32; unit++) expect(encodeWindowsArgument("a" + String.fromCharCode(unit))).toEqual({ ok: false, value: null });
    expect(encodeWindowsArgument("\u007f")).toEqual({ ok: true, value: "\u007f" });
    expect(encodeWindowsArgument("\uD800\uDC00".repeat(16383))).toEqual({ ok: true, value: "\uD800\uDC00".repeat(16383) });
    expect(encodeWindowsArgument("\uD800\uDC00".repeat(16384))).toEqual({ ok: false, value: null });
  });
  test("null, wrong types, sparse arrays and accessors fail without invoking getters", () => {
    for (const input of [null, undefined, 7, {}]) expect(encodeWindowsArgument(input)).toEqual({ ok: false, value: null });
    for (const input of [null, undefined, "x", [null], new Array(1)]) expect(encodeWindowsCommandLine(input)).toEqual({ ok: false, value: null });
    let calls = 0;
    const input = Object.defineProperty(["x"], "0", { get() { calls++; return "x"; } });
    expect(encodeWindowsCommandLine(input)).toEqual({ ok: false, value: null });
    expect(calls).toBe(0);
  });
});

describe("Q09 / T09-tc standalone control-file counting ONLY", () => {
  for (const [id, lengths, totalBytes] of [
    ["T09-tc-empty", [], 0],
    ["T09-tc-31905", [13, 13, 14, 31865], 31905], ["T09-tc-31906", [13, 13, 14, 31866], 31906],
    ["T09-tc-31907", [13, 13, 14, 31867], 31907], ["T09-tc-32767", [32767], 32767],
    ["T09-tc-32768", [32768], 32768], ["actual-slices-not-backing-buffer", [3, 5], 8],
  ] as Array<[string, number[], number]>) test(id, () => {
    const artifacts = lengths.map(length => new Uint8Array(length + 5).subarray(2, length + 2));
    expect(countControlFileBytes(artifacts)).toEqual({ ok: true, totalBytes });
  });
  test("T09-tc-golden exact four independent artifacts", () => {
    expect(countControlFileBytes(reference.artifactHex.map(hex => Buffer.from(hex, "hex")))).toEqual({ ok: true, totalBytes: 56 });
  });
  for (const [id, input] of [
    ["T09-tc-null", null], ["T09-tc-innernull", [new Uint8Array(1), null]],
    ["T09-tc-32769", [new Uint8Array(32769)]],
    ["aggregate-not-individual-cap", [new Uint8Array(32768), new Uint8Array(1)]],
  ] as const) test(id, () => {
    expect(countControlFileBytes(input)).toEqual({ ok: false, totalBytes: 0 });
  });
  test("no hidden canonical reserve or 16-artifact limit in this primitive", () => {
    expect(countControlFileBytes(Array.from({ length: 17 }, () => new Uint8Array(0)))).toEqual({ ok: true, totalBytes: 0 });
  });
  test("intrinsic byte length cannot be forged by caller metadata", () => {
    const over = Object.defineProperty(new Uint8Array(32769), "byteLength", { value: 0 });
    expect(countControlFileBytes([over])).toEqual({ ok: false, totalBytes: 0 });
    const exact = Object.defineProperty(new Uint8Array(32768), "byteLength", { get() { throw new Error("must not read metadata"); } });
    expect(countControlFileBytes([exact])).toEqual({ ok: true, totalBytes: 32768 });
    expect(countControlFileBytes([{ byteLength: 1 }])).toEqual({ ok: false, totalBytes: 0 });
  });
});
