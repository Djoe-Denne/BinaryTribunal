import { afterEach, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EnsembleBridge, type AdapterOptions } from "../src/adapter";
import type { ExecutionClient } from "../src/client";
import type { Intent, MissionConfig } from "../src/domain";
import { canonical, hash } from "../src/validation";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ff8-strict-adapter-")); roots.push(root); mkdirSync(join(root, "outputs"));
  const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" };
  const intent: Intent = { schemaVersion: 1, binary: { sha256: hash("binary"), version: "fixture" }, fixture: true,
    missionId: "m", taskId: "task-A", attemptId: "attempt-A", executionId: "execution-A", idempotencyKey: "execution-A", cycle: 1, role: "A", fresh: true,
    requestedModel: model, identity: { sha256: hash("binary"), version: "fixture", ea: "0x1000" },
    inputs: { schemaVersion: 1, role: "A", cycle: 1, files: [], accessibleRules: [], requiredTools: ["read"], knowledge: { version: "k1", fingerprint: "k", leadsFingerprint: "l", files: [] } },
    inputFingerprint: hash("A"), outputPath: join(root, "outputs", "A.json"), previousResultIds: [] };
  let submitted: Record<string, any> = {};
  let execution: Record<string, any> = {};
  let ensured = 0;
  let capabilities: Record<string, unknown> = { resourceBoundary: true, nativeAccessWitness: true, outputSchemaStrict: true };
  const client = { capabilities: async () => capabilities, ensure: async () => { ensured++; },
    submit: async (_: string, input: Record<string, unknown>) => { submitted = input; }, replay: async () => 0,
    inspect: async () => ({ version: 1, execution }) } as unknown as ExecutionClient;
  const options: AdapterOptions = { client, directory: root, profiles: { explore: "e", evaluate: "v", A: "a", B: "b", R: "r" },
    approvedSources: [], projectionRoot: join(root, "inputs"), outputDirectory: join(root, "outputs"),
    roleInstructions: { explore: "derive", evaluate: "assess", A: "derive", B: "derive", R: "reconcile" }, allowedTools: ["read", "execute"],
    admissionMode: "native-boundary-witness", outputMode: "json-schema-strict" };
  const bridge = new EnsembleBridge(options);
  const control = { lease: { missionId: "m", owner: "fixture", token: 1, expiresAt: 1000 }, revision: 1 };
  await bridge.submit(intent, control);
  const payload = { propositions: [{ id: "A-1", text: "Returns zero", evidence: [{ id: "e", source: "fixture.asm", sha256: hash("asm"), detail: "xor eax,eax; ret" }], contradictions: [], questions: [] }] };
  execution = { executionId: intent.executionId, state: "completed", nativeSessionId: "ses-a", native: { model, directory: root, profile: "a" }, accessVerified: true,
    output: submitted.output,
    outputWitnesses: [{ executionId: intent.executionId, sessionId: "ses-a", transport: "http", schemaSha256: submitted.output?.schemaSha256, requestBodySha256: hash("request"), endpoint: "https://chatgpt.com/backend-api/codex/responses", model, time: 1 }],
    structuredResult: { value: payload, sha256: hash(canonical(payload)), schemaSha256: submitted.output?.schemaSha256,
      native: { sessionId: "ses-a", messageID: "msg-result", model, profile: "a" } } };
  return { root, intent, control, bridge, options, payload, get submitted() { return submitted; }, get execution() { return execution; },
    setCapabilities: (value: Record<string, unknown>) => { capabilities = value; }, get ensured() { return ensured; } };
}

test("strict submission transports its schema and requires reads, never a worker edit", async () => {
  const f = await fixture();
  expect(f.submitted.output).toMatchObject({ mode: "json_schema", strict: true, route: "openai-responses-v1" });
  expect(f.submitted.output.schemaSha256).toBe(hash(canonical(f.submitted.output.schema)));
  expect(f.submitted.output.schema.properties.propositions).toBeDefined();
  expect(f.submitted.output.schema.properties.missionId).toBeUndefined();
  expect(f.submitted.expectedAccess.every((a: { action: string }) => a.action === "read")).toBe(true);
  expect(f.submitted.resourceBoundary.some((a: { action: string }) => a.action === "edit")).toBe(false);
  expect(f.submitted.prompt).toContain("Do not write a file");
  expect(f.submitted.prompt).not.toContain("Write ONE flat WorkerResult");
});

test("strict native payload is validated and materialized once with controller-owned header", async () => {
  const f = await fixture(); expect(existsSync(f.intent.outputPath)).toBe(false);
  const capture = canonical(f.execution.structuredResult);
  const first = await f.bridge.inspect(f.intent);
  expect(first.status).toBe("completed");
  const doc = JSON.parse(first.artifact!.content);
  expect(doc).toMatchObject({ missionId: "m", executionId: "execution-A", authorId: "execution-A", kind: "proposal", role: "A", ...f.payload });
  expect(doc.identity).toEqual(f.intent.identity);
  expect(doc).toEqual({ ...f.payload, ...f.submitted.dossier.resultEnvelope });
  expect(first.artifact!.content).toBe(JSON.stringify(JSON.parse(canonical(doc)), null, 2) + "\n");
  expect(Math.max(...first.artifact!.content.split("\n").map(line => line.length))).toBeLessThanOrEqual(2000);
  expect(first.artifact!.sha256).toBe(hash(readFileSync(f.intent.outputPath)));
  expect(canonical(f.execution.structuredResult)).toBe(capture);
  expect((await f.bridge.inspect(f.intent)).artifact).toEqual(first.artifact);
  expect(readFileSync(f.intent.outputPath, "utf8")).toBe(first.artifact!.content);
  writeFileSync(f.intent.outputPath, "tampered");
  await expect(f.bridge.inspect(f.intent)).rejects.toThrow(/immutable/);
  expect(readFileSync(f.intent.outputPath, "utf8")).toBe("tampered");
});

test("strict refuses an unreadable scientific output field without creating or coercing an artifact", async () => {
  const f = await fixture(); f.payload.propositions[0]!.evidence[0]!.detail = "x".repeat(2001);
  f.execution.structuredResult.sha256 = hash(canonical(f.payload)); const capture = canonical(f.execution.structuredResult);
  const result = await f.bridge.inspect(f.intent);
  expect(result.status).toBe("failed"); expect(result.error).toContain("native_read_line_limit");
  expect(result.artifact).toBeUndefined(); expect(existsSync(f.intent.outputPath)).toBe(false);
  expect(canonical(f.execution.structuredResult)).toBe(capture);
});

test("strict never reformats a preexisting compact artifact with identical scientific values", async () => {
  const f = await fixture(), oldBytes = canonical({ ...f.payload, ...f.submitted.dossier.resultEnvelope });
  writeFileSync(f.intent.outputPath, oldBytes);
  await expect(f.bridge.inspect(f.intent)).rejects.toThrow(/immutable structured artifact conflict/);
  expect(readFileSync(f.intent.outputPath, "utf8")).toBe(oldBytes);
});

test("strict success cannot be inferred from native outcome, an old file or unwitnessed output", async () => {
  for (const defect of ["result", "witness", "access", "schema", "session", "model", "hash", "endpoint", "mixed-witness"] as const) {
    const f = await fixture();
    if (defect === "result") delete f.execution.structuredResult;
    if (defect === "witness") f.execution.outputWitnesses = [];
    if (defect === "access") f.execution.accessVerified = false;
    if (defect === "schema") f.execution.structuredResult.schemaSha256 = hash("wrong");
    if (defect === "session") f.execution.structuredResult.native.sessionId = "other";
    if (defect === "model") f.execution.structuredResult.native.model = { ...f.intent.requestedModel, variant: "low" };
    if (defect === "hash") f.execution.structuredResult.sha256 = hash("wrong");
    if (defect === "endpoint") f.execution.outputWitnesses[0].endpoint = "https://other.invalid/responses";
    if (defect === "mixed-witness") f.execution.outputWitnesses.push({ ...f.execution.outputWitnesses[0], schemaSha256: hash("unguarded-request") });
    const result = await f.bridge.inspect(f.intent);
    expect(result.status).toBe("failed"); expect(result.artifact).toBeUndefined(); expect(existsSync(f.intent.outputPath)).toBe(false);
  }
});

for (const field of ["executionId", "sessionId"] as const) {
  for (const defect of ["foreign", "missing"] as const) {
    for (const mixed of [false, true]) {
      test(`strict rejects ${defect} witness ${field}${mixed ? " even alongside a valid witness" : ""} before materialization`, async () => {
        const f = await fixture(); const valid = f.execution.outputWitnesses[0]; const invalid = { ...valid };
        if (defect === "missing") delete invalid[field]; else invalid[field] = `other-${field}`;
        f.execution.outputWitnesses = mixed ? [valid, invalid] : [invalid];
        const result = await f.bridge.inspect(f.intent);
        expect(result.status).toBe("failed"); expect(result.error).toMatch(/witness/);
        expect(result.artifact).toBeUndefined(); expect(existsSync(f.intent.outputPath)).toBe(false);
      });
    }
  }
}

for (const defect of ["foreign", "missing"] as const) {
  test(`strict rejects ${defect} execution identity before materialization`, async () => {
    const f = await fixture();
    if (defect === "missing") delete f.execution.executionId; else f.execution.executionId = "other-execution";
    await expect(f.bridge.inspect(f.intent)).rejects.toThrow(/execution identity/);
    expect(existsSync(f.intent.outputPath)).toBe(false);
  });
}

for (const boundaryExists of [true, false]) {
  test(`strict refuses an ancestor junction before ${boundaryExists ? "writing in an existing" : "creating an absent"} output boundary`, async () => {
    const f = await fixture(); const target = join(f.root, "target"), alias = join(f.root, "alias");
    mkdirSync(target); if (boundaryExists) mkdirSync(join(target, "outputs"));
    // Both the link and its sibling target are owned by this fixture's cleanup root.
    // A platform/permission failure must fail this test, never become a fake pass or skip.
    symlinkSync(target, alias, process.platform === "win32" ? "junction" : "dir");
    expect(lstatSync(alias).isSymbolicLink()).toBe(true); expect(realpathSync(alias)).toBe(realpathSync(target));
    const boundary = join(alias, "outputs"), intent = { ...f.intent, outputPath: join(boundary, "A.json") };
    const bridge = new EnsembleBridge({ ...f.options, outputDirectory: boundary });
    await expect(bridge.inspect(intent)).rejects.toThrow(/symlink boundary/);
    expect(readdirSync(target)).toEqual(boundaryExists ? ["outputs"] : []);
    if (boundaryExists) expect(readdirSync(join(target, "outputs"))).toEqual([]);
    expect(existsSync(join(target, "outputs", "A.json"))).toBe(false);
  });
}

test("strict capture rejects aliases and reserved fields without post-hoc repair", async () => {
  for (const payload of [{ proposals: [] }, { propositions: [], missionId: "forged" }]) {
    const f = await fixture(); f.execution.structuredResult.value = payload; f.execution.structuredResult.sha256 = hash(canonical(payload));
    const result = await f.bridge.inspect(f.intent);
    expect(result.status).toBe("failed"); expect(existsSync(f.intent.outputPath)).toBe(false);
  }
});

test("strict mode refuses missing bridge capability before team allocation", async () => {
  const f = await fixture(); f.setCapabilities({ resourceBoundary: true, nativeAccessWitness: true });
  await expect(f.bridge.ensureTeam({ missionId: "m", outputDirectory: f.options.outputDirectory, knowledge: { files: [] }, models: { A: f.intent.requestedModel } } as unknown as MissionConfig, f.control)).rejects.toThrow(/strict/);
  expect(f.ensured).toBe(0);
});

test("strict mode cannot grant worker file edits or silently fall back to another provider", async () => {
  const f = await fixture();
  expect(() => new EnsembleBridge({ ...f.options, allowedTools: ["read", "edit"] })).toThrow(/edit/);
  await expect(f.bridge.submit({ ...f.intent, requestedModel: { providerID: "zai-coding-plan", id: "glm-5.3-flash", variant: "high" } }, f.control)).rejects.toThrow(/route/);
});
