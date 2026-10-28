import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canaryOutputPolicy, canaryStopRequested, confirmCanaryClosure, rememberNativeExecutionRefs, observeNativeExecutions } from "../scripts/canary-output-policy";
import { configureFixture } from "../scripts/configure-fixture";
import { prepareFixtureMission } from "../scripts/native-canary";

test("canary defaults to strict capture, never worker-edited JSON", () => {
  const p = canaryOutputPolicy({ providerID: "openai", id: "gpt-6-astra", variant: "high" });
  expect(p.outputMode).toBe("json-schema-strict");
  expect(p.allowedTools).toEqual(["read", "execute"]);
  expect(p.requiredTools).toEqual(["read"]);
  expect(() => canaryOutputPolicy({ providerID: "zai-coding-plan", id: "glm-5.3-flash", variant: "high" })).toThrow(/strict.*route/);
  expect(() => canaryOutputPolicy({ providerID: "opencode-go", id: "glm-5.3-flash", variant: "high" })).toThrow(/strict.*route/);
});
test("legacy file output must be explicitly selected, never an automatic fallback", () => {
  expect(canaryOutputPolicy({ providerID: "fixture", id: "model", variant: "high" }, "file").allowedTools).toContain("edit");
  expect(() => canaryOutputPolicy({ providerID: "openai", id: "gpt-6-astra", variant: "high" }, "guess" as "file")).toThrow(/output mode/);
});
test("new runnable fixture configuration also defaults to strict mode before filesystem work", () => {
  expect(() => configureFixture("Z:/nonexistent/strict-fixture-plugin", "zai-coding-plan/glm-5.3-flash#high", "fixture-token")).toThrow(/strict.*route/);
});
test("exported fixture factory does not silently default to editable free-form JSON", () => {
  expect(() => prepareFixtureMission("Z:/nonexistent/strict-fixture-plugin", "zai-coding-plan/glm-5.3-flash#high")).toThrow(/strict.*route/);
});
test("owned stop marker can cancel without killing the token-owning controller", () => {
  const root = mkdtempSync(join(tmpdir(), "ff8-canary-stop-"));
  try {
    expect(canaryStopRequested(root)).toBe(false);
    writeFileSync(join(root, "STOP_REQUESTED"), "operator stop");
    expect(canaryStopRequested(root)).toBe(true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("closure requires public stop followed by a complete stopped/paused readback", async () => {
  const calls: string[] = [];
  const client = { stopMission: async (id: string) => { calls.push(`stop:${id}`); }, snapshot: async (id: string) => {
    calls.push(`snapshot:${id}`); return { admissions: { paused: true }, revision: 4, executions: [{ executionId: "e", nativeSessionId: "s", state: "stopped" }] };
  } };
  const expected = [{ executionId: "e", sessionId: "s" }];
  expect(await confirmCanaryClosure(client, "m", expected)).toMatchObject({ verified: true, admissionsPaused: true, revision: 4, executions: [{ executionId: "e", sessionId: "s", state: "stopped" }] });
  expect(calls).toEqual(["stop:m", "snapshot:m"]);
  for (const snapshot of [{ admissions: { paused: false }, executions: [] }, { admissions: { paused: true } }, { admissions: { paused: true }, executions: [{ executionId: "e", nativeSessionId: "s", state: "observed_running" }] }]) {
    await expect(confirmCanaryClosure({ stopMission: async () => {}, snapshot: async () => snapshot }, "m", expected)).rejects.toThrow(/closure/);
  }
});

test("closure refuses missing, foreign, duplicated or replaced native identities", async () => {
  const expected = [{ executionId: "e", sessionId: "s" }];
  const good = { executionId: "e", nativeSessionId: "s", state: "stopped" };
  for (const executions of [[], [good, good], [{ ...good, nativeSessionId: "other" }], [{ ...good, executionId: "other" }], [good, { ...good, executionId: "other", nativeSessionId: "other" }]]) {
    await expect(confirmCanaryClosure({ stopMission: async () => {}, snapshot: async () => ({ admissions: { paused: true }, executions }) }, "m", expected)).rejects.toThrow(/closure/);
  }
});

test("observed native pairs survive lost-reply paths and cannot be rebound", () => {
  const refs = new Map<string, string>();
  rememberNativeExecutionRefs(refs, { execution: { executionId: "e", nativeSessionId: "s" } });
  expect(refs.size).toBe(0); // Reserved ID alone is not a native creation readback.
  const execution = { executionId: "e", nativeSessionId: "s", native: { profile: "fixture" } };
  rememberNativeExecutionRefs(refs, { execution });
  rememberNativeExecutionRefs(refs, { executions: [execution] });
  expect([...refs]).toEqual([["e", "s"]]);
  expect(() => rememberNativeExecutionRefs(refs, { execution: { ...execution, nativeSessionId: "other" } })).toThrow(/identity/);
  expect([...refs]).toEqual([["e", "s"]]);
});

test("native identity observation survives controller replacement after the one-shot lost reply", async () => {
  const refs = new Map<string, string>(); let calls = 0;
  const transport = observeNativeExecutions({ serverVersion: "fixture", call: async (_method, input) => {
    calls++; return { execution: { executionId: input.executionId, nativeSessionId: `session-${input.executionId}`, native: { profile: "fixture" } } };
  } }, refs);
  const lossy = { call: async () => { await transport.call("inspect", { executionId: "explore" }); throw new Error("lost reply"); } };
  await expect(lossy.call()).rejects.toThrow("lost reply");
  // The resumed controller uses the underlying observed transport, not the lossy wrapper.
  await transport.call("inspect", { executionId: "R" });
  expect([...refs]).toEqual([["explore", "session-explore"], ["R", "session-R"]]);
  expect(transport.serverVersion).toBe("fixture"); expect(calls).toBe(2);
});
