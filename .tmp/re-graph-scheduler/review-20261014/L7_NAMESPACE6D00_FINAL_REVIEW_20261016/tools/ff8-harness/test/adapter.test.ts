import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectionAccess } from "../src/adapter";
import type { AdapterOptions } from "../src/adapter";
import type { ExecutionClient } from "../src/client";
import type { Intent } from "../src/domain";
import { EnsembleBridge } from "../src/adapter";
import { hash } from "../src/validation";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ff8-projection-")); const native = join(root, "native.asm"); writeFileSync(native, "xor eax,eax\nret");
  mkdirSync(join(root, "outputs")); const neighbor = join(root, "outputs", "B.json"); writeFileSync(neighbor, "private B proposal");
  const o: AdapterOptions = { client: {} as ExecutionClient, directory: root, profiles: { explore: "e", evaluate: "e", A: "a", B: "b", R: "r" }, approvedSources: [native], projectionRoot: join(root, "inputs"), outputDirectory: join(root, "outputs"), roleInstructions: { explore: "e", evaluate: "e", A: "a", B: "b", R: "r" }, allowedTools: ["read", "edit"], admissionMode: "native-boundary-witness" };
  return { root, native, neighbor, access: new ProjectionAccess(o), done: () => rmSync(root, { recursive: true, force: true }) };
}
test("blind role cannot read a neighbor proposal even when controller can", async () => {
  const f = fixture(); try { const a = { missionId: "m", executionId: "a", role: "A" as const }; expect((await f.access.read(f.neighbor, a)).status).toBe("denied-read"); expect((await f.access.read(f.native, a)).status).toBe("ok"); expect((await f.access.read(f.neighbor, { ...a, role: "R" })).status).toBe("ok"); } finally { f.done(); }
});
test("role/execution projections are disjoint, immutable and maintain exact paths", async () => {
  const f = fixture(); try { const a = { missionId: "m", executionId: "a", role: "A" as const }; const b = { ...a, role: "B" as const, executionId: "b" }; await f.access.read(f.native, a); await f.access.read(f.native, b); expect(f.access.projected(f.native, a)).not.toBe(f.access.projected(f.native, b)); writeFileSync(f.native, "altered"); expect((await f.access.read(f.native, a)).status).toBe("ok"); } finally { f.done(); }
});
test("absent authorized input and refused access/tool remain different", async () => {
  const f = fixture(); try { const a = { missionId: "m", executionId: "a", role: "A" as const }; rmSync(f.native); expect((await f.access.read(f.native, a)).status).toBe("missing"); expect((await f.access.read(join(f.root, "secret"), a)).status).toBe("denied-read"); expect(await f.access.tool("shell", a)).toBe(false); expect(await f.access.tool("read", a)).toBe(true); } finally { f.done(); }
});
test("terminal native/access failure retains useful output bytes without accepting science", async () => {
  const f = fixture(); try {
    const client = { replay: async () => 1, inspect: async () => ({ version: 1, execution: { executionId: "b", nativeSessionId: "ses-b", state: "failed", native: { model: { providerID: "fixture", id: "model", variant: "high" }, directory: f.root, profile: "b" }, failure: { category: "permission", message: "native input denied" }, accessVerified: false } }) } as unknown as ExecutionClient;
    const bridge = new EnsembleBridge({ ...f.access.options, client });
    const intent = { missionId: "m", executionId: "b", role: "B", outputPath: f.neighbor } as Intent;
    const result = await bridge.inspect(intent); expect(result.status).toBe("failed"); expect(result.artifact?.content).toBe("private B proposal");
  } finally { f.done(); }
});
test("only publication-bound public conclusions become blind-readable knowledge", async () => {
  const f = fixture(); try {
    const resultHash = "a".repeat(64), path = join(f.root, "outputs", "knowledge", `${resultHash}.json`); mkdirSync(join(f.root, "outputs", "knowledge")); writeFileSync(path, "validated contract only");
    const file = { path, sha256: hash("validated contract only"), version: `validated-conclusion:v1:${resultHash}`, provenance: "verified fixture publication", kind: "knowledge" as const, approvedForBlind: true };
    const fact = { schemaVersion: 1 as const, resultId: "r1", identity: { sha256: "b".repeat(64), version: "fixture", ea: "0x1000" }, inputVersions: [], resultHash, publicationReceipt: { idempotencyKey: "p1", targetId: "fixture:target", revision: 1, resultHash }, conclusion: { text: "validated contract", evidence: [{ id: "e", source: "fixture.asm", sha256: "c".repeat(64), detail: "fixture" }] } };
    const context = { missionId: "m", executionId: "a", role: "A" as const };
    expect((await f.access.read(path, context)).status).toBe("denied-read");
    f.access.approveKnowledge({ version: "k2", fingerprint: "new", leadsFingerprint: "same", files: [file], validatedFacts: [fact] });
    expect((await f.access.read(path, context)).status).toBe("ok");
    expect((await f.access.read(f.neighbor, context)).status).toBe("denied-read");
    expect(() => f.access.approveKnowledge({ version: "k3", fingerprint: "forged", leadsFingerprint: "same", files: [{ ...file, path: f.neighbor }], validatedFacts: [fact] })).toThrow(/binding/);
  } finally { f.done(); }
});
test("every role receives an explicit flat WorkerResult envelope, never a nested resultHeader", async () => {
  const f = fixture(); try {
    const requests: Record<string, any>[] = [];
    const client = { submit: async (_mission: string, request: Record<string, unknown>) => { requests.push(request); } } as unknown as ExecutionClient;
    const bridge = new EnsembleBridge({ ...f.access.options, client });
    for (const role of ["explore", "evaluate", "A", "B", "R"] as const) {
      const intent: Intent = { schemaVersion: 1, binary: { sha256: hash("binary"), version: "fixture" }, fixture: true,
        missionId: "m", taskId: `task-${role}`, attemptId: `attempt-${role}`, executionId: `execution-${role}`, idempotencyKey: `execution-${role}`, cycle: 1, role, fresh: true,
        requestedModel: { providerID: "fixture", id: "model", variant: "high" },
        inputs: { schemaVersion: 1, role, cycle: 1, files: [], accessibleRules: [], requiredTools: [], knowledge: { version: "k1", fingerprint: "k", leadsFingerprint: "l", files: [] } },
        inputFingerprint: hash(role), outputPath: join(f.root, "outputs", `${role}.json`), previousResultIds: [] };
      await bridge.submit(intent, { lease: { missionId: "m", owner: "fixture", token: 1, expiresAt: 1000 }, revision: 1 });
      const request = requests.at(-1)!, dossier = request.dossier;
      expect(dossier.resultEnvelope.schemaVersion).toBe(1); expect(dossier.resultEnvelope.executionId).toBe(intent.executionId);
      expect(dossier.resultEnvelope.kind).toBe(role === "A" || role === "B" ? "proposal" : role === "R" ? "reconciliation" : role);
      expect(dossier.resultEnvelope.resultHeader).toBeUndefined(); expect(dossier.resultEnvelope.role).toBe(role === "A" || role === "B" ? role : undefined);
      expect(request.prompt).toContain("not nested under resultHeader");
    }
  } finally { f.done(); }
});
