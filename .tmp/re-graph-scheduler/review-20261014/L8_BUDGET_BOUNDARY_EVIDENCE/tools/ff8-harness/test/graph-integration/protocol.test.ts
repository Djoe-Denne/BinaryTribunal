import { describe, expect, test } from "bun:test";
import { BridgeAdmissionError, ExecutionClient } from "../../src/client";
import { fixturePath } from "./fixture-driver";

describe("actual client negative protocol boundary", () => {
  test("legacy constructor remains usable and creates no negative protocol authority", () => {
    const error = new BridgeAdmissionError("quota", "quota", true);
    expect(error.message).toBe("quota"); expect(error.category).toBe("quota"); expect(error.recoverable).toBe(true); expect(error.type).toBeUndefined();
  });
  for (const [label, native, expected] of [
    ["genuine typed response", { type: "execution_rejected", data: { category: "auth", recoverable: false } }, "execution_rejected"],
    ["category is not protocol", { category: "quota", recoverable: true }, undefined],
    ["message is not protocol", new Error("execution_rejected secret-fixture-token"), undefined],
    ["unrecognized type", { type: "other", data: { category: "schema", recoverable: false } }, undefined],
    ["discriminant alone", { type: "execution_rejected" }, "execution_rejected"],
  ] as const) test(label, async () => {
    let calls = 0;
    const client = new ExecutionClient({ statePath: fixturePath(), directory: "offline-fixture", principalId: "fixture-principal", controllerId: "fixture-controller", teamName: "fixture-team", leaseMs: 1000, maxRunning: 1,
      token: () => "secret-fixture-token", transport: { async call() { calls++; throw native; } } });
    try {
      let caught: unknown; try { await client.capabilities(); } catch (error) { caught = error; }
      expect(caught).toBeInstanceOf(BridgeAdmissionError); const error = caught as BridgeAdmissionError;
      expect(error.type).toBe(expected); expect(error.message).not.toContain("secret-fixture-token"); expect(calls).toBe(1);
      if (label === "discriminant alone") { expect(error.category).toBe("unknown"); expect(error.recoverable).toBe(false); }
    } finally { client.close(); }
  });
});
