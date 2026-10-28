import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { EnsembleBridge } from "../src/adapter";
import { ExecutionClient } from "../src/client";
import type { FunctionIdentity, Intent, Role } from "../src/domain";
import type { REPolicy } from "../src/re-policy";
import { canonical, hash, identityKey } from "../src/validation";

// Explicit local source path only. No service discovery, provider, native IDA or
// production database is contacted. The plugin owns its in-memory test database;
// the FF8 client uses exclusively the real public execution API.
const plugin = process.env.FF8_ENSEMBLE_SOURCE;
const crossProject = plugin ? test : test.skip;
crossProject("real FF8 adapter + real Ensemble API: blind authors, two R, scoped sharing, strict capture and restart", async () => {
  const load = (file: string) => import(pathToFileURL(join(plugin!, file)).href);
  const [{ createExecutionApi }, { registerBulletinTools }, { setupDeps }] = await Promise.all([
    load("src/execution-api.ts"), load("src/execution-bulletin.ts"), load("test/helpers.ts"),
  ]);
  const temp = join(tmpdir(), "opencode"); mkdirSync(temp, { recursive: true });
  const root = mkdtempSync(join(temp, "ff8-role-offline-"));
  const deps = setupDeps(); deps.directory = root; deps.config.maxActiveMembers = 20;
  const sessions = new Map<string, any>(), contexts = new Map<string, any[]>(), tools = new Map<string, any>();
  const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" };
  const binary = { sha256: hash("offline fixture binary, not FF8"), version: "offline-only" };
  const ids: FunctionIdentity[] = ["0x1000", "0x2000"].map(ea => ({ ...binary, ea }));
  const profiles = { explore: "fixture-e", evaluate: "fixture-v", A: "fixture-a", B: "fixture-b", R: "fixture-r" };
  const binding = { operation: "disasm" as const, tool: "fixture_disasm", accesses: [{ action: "fixture_disasm_permission", resource: "*" as const }] };
  const policy: REPolicy = { version: 1, workKind: "decompilation", reconcilerSharing: true, idaReadBindings: [binding] };
  let creates = 0, prompts = 0, serial = 0;
  deps.client.session.create = async (input: any) => {
    creates++;
    sessions.set(input.id, { id: input.id, agent: input.agent, model: input.model, location: { directory: root }, permissions: input.permission, metadata: input.metadata });
    return { data: { id: input.id } };
  };
  deps.client.session.get = async ({ sessionID }: any) => ({ data: sessions.get(sessionID) });
  deps.client.session.findIntent = async ({ sessionID }: any) => contexts.has(sessionID) ? { messageId: `user-${sessionID}` } : undefined;
  deps.client.session.promptAsync = async (input: any) => {
    prompts++; contexts.set(input.sessionID, [{ id: `user-${input.sessionID}`, type: "user", metadata: input.metadata }]);
    return { messageID: `user-${input.sessionID}` };
  };
  deps.client.session.readOutputContext = async ({ sessionID }: any) => contexts.get(sessionID) ?? [];
  const auth = { principalId: "offline-operator", token: "offline-fixture-token" };
  const apiOptions = { profile: async (id: string) => ({ id }), nativeAccessWitness: true, nativeOutputHooks: true, nativeBulletinTools: true,
    nativeToolInventory: async () => [binding.tool], principals: [{ id: auth.principalId, tokenSha256: hash(auth.token), directories: [root], profiles: Object.values(profiles),
      models: ["openai/gpt-6-astra#high"], strictOutputModels: ["openai/gpt-6-astra#high"], bulletin: true, nativeToolBindings: [{ tool: binding.tool, accesses: binding.accesses }] }] };
  let api = createExecutionApi(deps, apiOptions);
  const registerTools = async () => registerBulletinTools({ transform: async (callback: any) => { callback({ add: (tool: any) => tools.set(tool.name, tool) }); return { dispose: async () => {} }; } }, api);
  await registerTools();
  const calls: string[] = [];
  const options = { directory: root, principalId: auth.principalId, token: () => auth.token, controllerId: "offline-controller", teamName: "offline-role-sharing", leaseMs: 300000, maxRunning: 20,
    statePath: join(root, "client.db"), transport: { call: async (method: string, input: Record<string, unknown>) => { calls.push(method); return api.handle(method, input); } } };
  let client = new ExecutionClient(options);
  const bridgeOptions = () => ({ client, directory: root, profiles, approvedSources: [root], projectionRoot: join(root, "inputs"), outputDirectory: join(root, "outputs"),
    roleInstructions: { explore: "fixture", evaluate: "fixture", A: "independent fixture", B: "independent fixture", R: "compare fixture against ASM; observations are provisional" },
    allowedTools: ["read", "execute"], admissionMode: "native-boundary-witness" as const, outputMode: "json-schema-strict" as const, rePolicy: policy });
  let bridge = new EnsembleBridge(bridgeOptions());
  const control = { lease: { missionId: "offline-mission", owner: "fixture", token: 1, expiresAt: Date.now() + 300000 }, revision: 1 };
  const neighborhood = { id: hash(canonical(ids.map(identityKey).sort())), members: ids };
  const intent = (role: Role, identity: FunctionIdentity, proposals: any[] = []): Intent => {
    const key = `${role}-${identity.ea}`;
    const files = proposals.map(p => ({ path: p.path, sha256: p.sha256, version: p.resultId, provenance: `native execution ${p.executionId}, author ${p.authorId}`, kind: "proposal" as const }));
    const inputs = { schemaVersion: 1 as const, role, cycle: 1, files, accessibleRules: [], requiredTools: ["read"], knowledge: { version: "k1", fingerprint: hash("knowledge"), leadsFingerprint: hash("leads"), files: [] },
      ...(role === "R" ? { neighborhood, proposals } : {}) };
    return { schemaVersion: 1, binary, fixture: true, missionId: "offline-mission", taskId: `task-${key}`, attemptId: `attempt-${key}`, executionId: `execution-${key}`, idempotencyKey: `execution-${key}`,
      cycle: 1, role, fresh: true, requestedModel: model, identity, inputs, inputFingerprint: hash(canonical(inputs)), outputPath: join(root, "outputs", `${key}.json`), previousResultIds: proposals.map(p => p.resultId) };
  };
  const record = async (i: Intent): Promise<any> => (await client.inspect(i.missionId, i.executionId)).execution;
  const invoke = async (rec: any, tool: string, input: any) => {
    const event = { sessionID: rec.nativeSessionId, agent: rec.selection.profile, messageID: `assistant-${rec.executionId}`, id: `call-${++serial}`, tool, input };
    await api.beforeTool(event);
    if (tool === binding.tool) {
      const permission = { sessionID: event.sessionID, agent: event.agent, action: binding.accesses[0]!.action, resources: ["*"], effect: "allow", source: { type: "tool", messageID: event.messageID, id: event.id } };
      await api.beforePermission(permission); expect(permission.effect).toBe("allow");
    }
    let value: any;
    if (tools.has(tool)) value = JSON.parse((await tools.get(tool).execute(input, { sessionID: event.sessionID, agent: event.agent, messageID: event.messageID, id: event.id })).content);
    await api.observeTool({ ...event, status: "completed" });
    return value;
  };
  const readInputs = async (rec: any) => {
    for (const access of rec.selection.expectedAccess) if (access.action === "read") await invoke(rec, "read", { path: access.resource });
  };
  const evidence = [{ id: "fixture-asm", source: "offline ASM fixture", sha256: hash("xor eax,eax; ret"), detail: "xor eax,eax; ret (simulation only)" }];
  const proposition = { id: "fixture-proposition", text: "Offline synthetic return-zero observation", evidence, contradictions: [], questions: [] };
  const finish = async (i: Intent, payload: unknown) => {
    const rec = await record(i), identity = { sessionID: rec.nativeSessionId, agent: rec.selection.profile, model, kind: "primary" };
    const request = { ...identity, request: new Request("https://chatgpt.com/backend-api/codex/responses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: model.id, input: "offline fixture; never sent", tools: [] }) }) };
    await api.beforeHttp(request);
    const response = { ...request, response: new Response('data: {"type":"response.completed","response":{"id":"offline-response","status":"completed"}}\n\n', { headers: { "content-type": "text/event-stream" } }) };
    await api.afterHttp(response); await response.response.text();
    contexts.get(rec.nativeSessionId)!.push({ id: `result-${i.executionId}`, type: "assistant", agent: rec.selection.profile, model, finish: "stop", time: { created: 10, completed: 20 }, content: [{ type: "text", text: JSON.stringify(payload) }] });
    sessions.get(rec.nativeSessionId).outcome = "succeeded";
    return bridge.inspect(i);
  };
  try {
    const capabilities = await client.capabilities();
    expect(capabilities).toMatchObject({ scopedBulletin: true, nativeToolBindings: true, outputSchemaStrict: true });
    await client.ensure("offline-mission");
    const proposals = new Map<string, any[]>();
    for (const id of ids) {
      const frozen = [];
      for (const role of ["A", "B"] as const) {
        const i = intent(role, id); await bridge.submit(i, control); const rec = await record(i);
        expect(rec.communication).toBeUndefined(); expect(rec.selection.nativeToolBindings).toEqual([]);
        await expect(invoke(rec, binding.tool, { addr: id.ea })).rejects.toThrow();
        await expect(invoke(rec, "execution_bulletin_read", {})).rejects.toThrow();
        await readInputs(rec); const inspected = await finish(i, { propositions: [proposition] });
        expect(inspected.status).toBe("completed");
        const artifact = inspected.artifact!, document = JSON.parse(artifact.content);
        frozen.push({ resultId: document.resultId, sha256: artifact.sha256, path: artifact.path, authorId: i.executionId, executionId: i.executionId, sessionId: rec.nativeSessionId, content: artifact.content, document });
      }
      proposals.set(id.ea, frozen);
    }
    const rIntents = ids.map(id => intent("R", id, proposals.get(id.ea)!));
    for (const i of rIntents) await bridge.submit(i, control);
    const records = await Promise.all(rIntents.map(record));
    expect(records[0].communication).toEqual(records[1].communication);
    for (const rec of records) { await readInputs(rec); await invoke(rec, binding.tool, { addr: rec.dossier.function.ea }); }
    const payload = { sourceBinary: binary, kind: "observation", status: "provisional", summary: "Synthetic neighbor observation, not a validated finding",
      evidence: [{ memberEA: ids[0]!.ea, address: ids[0]!.ea, asm: "xor eax,eax; ret", tool: binding.tool, resource: "*", sha256: hash("xor eax,eax; ret") }], affectedEAs: ids.map(i => i.ea), questions: [] };
    const first = await invoke(records[0], "execution_bulletin_publish", { key: "first", payload });
    expect((await invoke(records[1], "execution_bulletin_read", {})).messages).toEqual([first]);
    const second = await invoke(records[1], "execution_bulletin_publish", { key: "second", payload: { ...payload, kind: "hypothesis" } });
    expect((await invoke(records[0], "execution_bulletin_read", {})).messages).toEqual([first, second]);
    const beforeRestart = { creates, prompts };
    client.close(); api = createExecutionApi(deps, apiOptions); await registerTools();
    client = new ExecutionClient(options); bridge = new EnsembleBridge(bridgeOptions());
    expect((await invoke(records[1], "execution_bulletin_read", {})).messages).toEqual([second]);
    expect((await invoke(records[1], "execution_bulletin_read", {})).messages).toEqual([]);
    for (const i of rIntents) await bridge.submit(i, control);
    expect({ creates, prompts }).toEqual(beforeRestart);
    for (const i of rIntents) {
      const payload = { decision: "likely", propositions: [proposition], contradictions: [], questions: ["Offline simulation; parent must validate any real finding"], conclusion: { text: "Synthetic conclusion only", evidence }, publicationGate: null };
      const inspected = await finish(i, payload);
      expect(inspected.status).toBe("completed"); expect(inspected.error).toBeUndefined();
      expect(inspected.communicationTrace).toBeDefined();
      const document = JSON.parse(inspected.artifact!.content);
      expect(document.communicationTrace).toBeUndefined(); expect(document.publicationGate).toBeUndefined();
      expect(document.propositions).toEqual(payload.propositions);
    }
    expect(calls).toContain("bulletinSnapshot");
    expect(prompts).toBe(6); expect(creates).toBe(7); // six fresh workers plus inert lead
  } finally { client.close(); deps.db.close(); rmSync(root, { recursive: true, force: true }); }
}, 60000);
