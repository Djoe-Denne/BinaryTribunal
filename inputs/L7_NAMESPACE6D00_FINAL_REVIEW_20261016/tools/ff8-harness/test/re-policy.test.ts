import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { EnsembleBridge, type AdapterOptions } from "../src/adapter";
import { ExecutionClient } from "../src/client";
import type { Intent, MissionConfig, Role } from "../src/domain";
import { canonical, hash, identityKey } from "../src/validation";
import { Engine } from "../src/engine";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";
import type { CommunicationAudit } from "../src/bulletin-audit";

const roots: string[] = [];
const clients = new Set<ExecutionClient>();
afterEach(() => { for (const client of clients) client.close(); clients.clear(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const binary = { sha256: hash("synthetic binary"), version: "fixture-v1" };
const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" };
const roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
const members = ["0x10", "0x20"].map(ea => ({ ...binary, ea }));
const neighborhood = { id: hash(canonical(members.map(identityKey).sort())), members };
const policy = (workKind = "decompilation", reconcilerSharing = true) => ({ version: 1, workKind, reconcilerSharing,
  idaReadBindings: [{ operation: "disasm", tool: "registered_ida_disasm", accesses: [{ action: "exact_native_disasm_action", resource: "*" }] },
    { operation: "xrefs_to", tool: "registered_ida_xrefs_to", accesses: [{ action: "exact_native_xrefs_action", resource: "*" }] }] });

function fixture(workKind = "decompilation", reconcilerSharing = true) {
  const base = "C:/Users/djden/AppData/Local/Temp/opencode"; mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "ff8-re-policy-")); roots.push(root);
  const submissions: Record<string, any>[] = [], executions = new Map<string, Record<string, any>>();
  const messages: Record<string, any>[] = [], inspections: string[] = [], snapshotReads: Array<{ missionId: string; channel?: string }> = [];
  let snapshotOverride: Record<string, unknown> | undefined;
  const auditOptions = { statePath: join(root, "audit-client.db"), directory: root, principalId: "offline", controllerId: "fixture", teamName: "fixture", leaseMs: 30000, maxRunning: 2,
    token: () => "offline-only", transport: { call: async () => { throw new Error("no native RPC in fixture audit persistence"); } } };
  let auditClient = new ExecutionClient(auditOptions); clients.add(auditClient);
  let capabilities: Record<string, unknown> = { resourceBoundary: true, nativeAccessWitness: true, outputSchemaStrict: true, scopedBulletin: true, nativeToolBindings: true };
  let ensured = 0;
  const client = { capabilities: async () => capabilities, ensure: async () => { ensured++; }, replay: async () => 0,
    submit: async (_: string, request: Record<string, any>) => { submissions.push(structuredClone(request)); },
    inspect: async (_: string, id: string) => { inspections.push(id); return { version: 1, revision: 1, cursor: 0, execution: structuredClone(executions.get(id)) }; },
    bulletinSnapshot: async (missionId: string, channel?: string) => { snapshotReads.push({ missionId, channel }); return structuredClone(snapshotOverride ?? { version: 1, missionId, revision: 1, messages: messages.filter(m => channel === undefined || m.channel === channel) }); },
    retainCommunicationAudit: (audit: CommunicationAudit) => auditClient.retainCommunicationAudit(audit),
  } as unknown as ExecutionClient;
  const options = { client, directory: root, profiles: Object.fromEntries(roles.map(role => [role, `re-${role}`])),
    approvedSources: [], projectionRoot: join(root, "inputs"), outputDirectory: join(root, "outputs"),
    roleInstructions: Object.fromEntries(roles.map(role => [role, `Scientific ${role} instructions`])), allowedTools: ["read", "execute"],
    admissionMode: "native-boundary-witness", outputMode: "json-schema-strict", rePolicy: policy(workKind, reconcilerSharing) } as unknown as AdapterOptions;
  const control = { lease: { missionId: "synthetic", owner: "test", token: 1, expiresAt: 10000 }, revision: 1 };
  const intent = (role: Role, ea = "0x10", missionId = "synthetic", cycle = 1): Intent => {
    const id = `${missionId}-${cycle}-${role}-${ea}`;
    const inputs = { schemaVersion: 1 as const, role, cycle, identity: { ...binary, ea }, files: [], accessibleRules: [], requiredTools: ["read"],
      knowledge: { version: "k1", fingerprint: "frozen", leadsFingerprint: "frozen-leads", files: [] },
      ...(role === "R" ? { neighborhood } : {}) };
    return { schemaVersion: 1, binary, fixture: true, missionId, taskId: id, attemptId: id, executionId: id, idempotencyKey: id, cycle, role,
      identity: { ...binary, ea }, fresh: true, requestedModel: model, inputs, inputFingerprint: hash(canonical(inputs)), outputPath: join(root, "outputs", `${id}.json`), previousResultIds: [] };
  };
  const complete = (i: Intent) => {
    const request = submissions.findLast(s => s.executionId === i.executionId)!;
    const evidence = [{ id: "asm", source: "synthetic.asm", sha256: hash("asm"), detail: "fixture only" }];
    const payload = i.role === "R" ? { decision: "likely", propositions: [{ id: "r", text: "synthetic provisional", evidence, contradictions: [], questions: [] }], contradictions: [], questions: ["still provisional"], conclusion: null, publicationGate: null }
      : { propositions: [{ id: "p", text: "synthetic", evidence, contradictions: [], questions: [] }] };
    const sessionId = `session-${i.executionId}`, profile = options.profiles[i.role];
    const bindings = request.nativeTools?.map((tool: string) => (options as any).rePolicy.idaReadBindings.find((b: any) => b.tool === tool)).map(({ tool, accesses }: any) => ({ tool, accesses })) ?? [];
    const execution: Record<string, any> = { executionId: i.executionId, missionId: i.missionId, state: "completed", nativeSessionId: sessionId,
      native: { model, directory: root, profile }, selection: { model, directory: root, profile, context: { mode: "fresh" }, worktree: false, nativeToolBindings: bindings,
        hashes: { nativeToolBindings: hash(canonical(bindings)), ...(request.communication ? { communication: hash(canonical(request.communication)) } : {}) } },
      dossier: request.dossier, metadata: request.metadata, accessVerified: true,
      ...(request.communication ? { communication: request.communication, communicationTrace: { published: [], received: [], cursor: 0 } } : {}),
      accessWitnesses: bindings.flatMap((binding: any) => binding.accesses.map((access: any) => ({ ...access, id: hash(binding.tool), sessionId, profile, effect: "allow",
        verifierSource: "public.tool.execute.before+execute.after-leaf-success", native: { messageID: "msg-ida", id: binding.tool, tool: binding.tool, status: "completed" } }))),
      output: request.output, outputWitnesses: [{ executionId: i.executionId, sessionId, transport: "http", schemaSha256: request.output.schemaSha256,
        requestBodySha256: hash("request"), endpoint: "https://api.openai.com/v1/responses", model }],
      structuredResult: { value: payload, sha256: hash(canonical(payload)), schemaSha256: request.output.schemaSha256, native: { sessionId, messageID: "msg-result", model, profile } } };
    executions.set(i.executionId, execution); return execution;
  };
  const publish = (i: Intent, summary = "source-declared provisional lead") => {
    const e = executions.get(i.executionId)!, seq = messages.filter(m => m.channel === e.communication.channel).length + 1;
    const payload = { sourceBinary: binary, kind: "observation", status: "provisional", summary,
      evidence: [{ memberEA: i.identity!.ea, address: i.identity!.ea, asm: "xor eax, eax; ret", tool: "registered_ida_disasm", resource: "*", sha256: hash("publisher-declared source, deliberately not hash(asm)") }], affectedEAs: [i.identity!.ea], questions: ["Verify against native ASM independently"] };
    const message = { id: hash(canonical({ missionId: i.missionId, channel: e.communication.channel, seq, executionId: i.executionId, key: `fixture-${seq}` })), seq, channel: e.communication.channel,
      payload, payloadSha256: hash(canonical(payload)), schemaSha256: e.communication.schemaSha256,
      author: { executionId: i.executionId, sessionId: e.nativeSessionId, model, profile: e.native.profile } };
    messages.push(message); const { payload: _, ...ref } = message; e.communicationTrace.published.push(structuredClone(ref)); return message;
  };
  const receive = (i: Intent, message: Record<string, any>) => {
    const trace = executions.get(i.executionId)!.communicationTrace, { payload: _, ...ref } = message;
    if (!trace.received.some((r: any) => r.id === ref.id)) trace.received.push(structuredClone(ref));
    trace.received.sort((a: any, b: any) => a.seq - b.seq); trace.cursor = Math.max(trace.cursor, ref.seq);
  };
  return { root, options, control, submissions, executions, intent, complete, publish, receive, messages, inspections, snapshotReads, bridge: new EnsembleBridge(options),
    setSnapshot: (response: Record<string, unknown>) => { snapshotOverride = response; },
    restartAuditStore: () => { auditClient.close(); clients.delete(auditClient); auditClient = new ExecutionClient(auditOptions); clients.add(auditClient); },
    setCapabilities: (c: Record<string, unknown>) => { capabilities = c; }, get ensured() { return ensured; } };
}

for (const workKind of ["decompilation", "semantification"]) for (const role of roles) {
  test(`RE role matrix ${workKind}/${role}: exact native grants and R-only bulletin`, async () => {
    const f = fixture(workKind), i = f.intent(role); await f.bridge.submit(i, f.control); const s = f.submissions[0]!;
    const native = role === "R" || (workKind === "semantification" && ["A", "B"].includes(role));
    expect(s.nativeTools ?? []).toEqual(native ? policy().idaReadBindings.map(b => b.tool) : []);
    expect(s.dossier.rePolicy).toMatchObject({ version: 1, workKind, role, access: native ? "ida-readonly" : "frozen-only" });
    expect(s.metadata.rePolicyHash).toBe(hash(canonical(s.dossier.rePolicy)));
    expect(s.resourceBoundary.every((a: any) => ["read", "execute", ...(native ? ["exact_native_disasm_action", "exact_native_xrefs_action"] : [])].includes(a.action))).toBe(true);
    if (role === "R") expect(s.expectedAccess).toContainEqual({ action: "exact_native_disasm_action", resource: "*" });
    expect(s.communication?.mode).toBe(role === "R" ? "bulletin" : undefined);
    expect(s.dossier.rePolicy.instructions.join(" ")).toContain(role === "R" ? "leads" : "blocked");
    if (role !== "R") { expect(s.dossier.inputs.neighborhood).toBeUndefined(); expect(s.dossier.inputs.proposals).toBeUndefined(); }
  });
}

test("R schema/channel are shared by frozen group, separated by mission/cycle; no worker chosen scope", async () => {
  const f = fixture();
  for (const i of [f.intent("R"), f.intent("R", "0x20"), f.intent("R", "0x10", "other"), f.intent("R", "0x10", "synthetic", 2)]) await f.bridge.submit(i, f.control);
  const [a, b, other, next] = f.submissions.map(s => s.communication);
  expect(a).toBeDefined(); expect(a).toEqual(b); expect(other.channel).not.toBe(a.channel); expect(next.channel).not.toBe(a.channel);
  expect(a.schemaSha256).toBe(hash(canonical(a.schema))); expect(a.schema.additionalProperties).toBe(false);
  expect(a.schema.properties.status).toEqual({ type: "string", const: "provisional" });
  expect(a.schema.properties.affectedEAs.items.enum).toEqual(members.map(m => m.ea));
  expect(a.schema.properties.sourceBinary.properties.sha256.const).toBe(binary.sha256);
  expect(JSON.stringify(a.schema)).not.toMatch(/"(?:if|allOf|\$ref|pattern)"/);
  expect(f.submissions[0]!.prompt).toContain("rederive");
  const isolated = f.intent("R", "0x30");
  const ownMembers = [{ ...binary, ea: "0x30" }];
  isolated.inputs.neighborhood = { id: hash(canonical(ownMembers.map(identityKey))), members: ownMembers };
  await f.bridge.submit(isolated, f.control);
  expect(f.submissions[4]!.communication.channel).not.toBe(a.channel);
  expect(f.submissions[4]!.communication.schema.properties.affectedEAs.items.enum).toEqual(["0x30"]);
});

test("R refuses a missing, forged, cross-binary, duplicate or unrelated frozen neighborhood", async () => {
  for (const bad of [undefined, { ...neighborhood, id: "chosen" }, { ...neighborhood, members: [members[0], { ...members[1], sha256: hash("other") }] },
    { ...neighborhood, members: [members[0], members[0]] }, { id: hash(canonical([identityKey(members[1]!)])), members: [members[1]] }]) {
    const f = fixture(), i = f.intent("R"); (i.inputs as any).neighborhood = bad;
    await expect(f.bridge.submit(i, f.control)).rejects.toThrow(/neighborhood/); expect(f.submissions).toHaveLength(0);
  }
});

test("opt-in policy is immutable on replay, including profile and instruction changes", async () => {
  for (const change of ["policy", "profile", "instructions"]) {
    const f = fixture(), i = f.intent("A"); await f.bridge.submit(i, f.control);
    const before = readFileSync(join(f.options.projectionRoot, "A", hash(i.executionId), "dossier.json"), "utf8");
    const options = { ...f.options, profiles: { ...f.options.profiles }, roleInstructions: { ...f.options.roleInstructions } } as any;
    if (change === "policy") options.rePolicy = policy("semantification");
    if (change === "profile") options.profiles.A = "changed";
    if (change === "instructions") options.roleInstructions.A += " changed";
    await expect(new EnsembleBridge(options).submit(i, f.control)).rejects.toThrow(/immutable dossier conflict/);
    expect(readFileSync(join(f.options.projectionRoot, "A", hash(i.executionId), "dossier.json"), "utf8")).toBe(before);
  }
});

test("unsafe operations, duplicate/wildcard IDs and grants, missing disasm, edit/chat/file fallbacks fail closed", () => {
  const f = fixture();
  for (const operation of ["py_eval", "script", "set_type", "SetType", "rename", "set_comments", "save", "dbg_read", "analyze_funcs"]) {
    const p = policy(); p.idaReadBindings[0]!.operation = operation;
    expect(() => new EnsembleBridge({ ...f.options, rePolicy: p } as any)).toThrow(/RE policy/);
  }
  for (const tool of ["*", "read", "team_message", "execution_bulletin_read", "registered_ida_py_eval", "registered_ida_rename"]) {
    const p = policy(); p.idaReadBindings[0]!.tool = tool;
    expect(() => new EnsembleBridge({ ...f.options, rePolicy: p } as any)).toThrow(/RE policy/);
  }
  for (const defect of ["duplicate", "wildcard", "action-wildcard", "pseudo-uri", "edit", "no-disasm", "unknown", "kind-array"]) {
    const p: any = policy();
    if (defect === "duplicate") p.idaReadBindings.push(p.idaReadBindings[0]);
    if (defect === "wildcard") p.idaReadBindings[0].accesses[0].resource = "prefix/*";
    if (defect === "action-wildcard") p.idaReadBindings[0].accesses[0].action = "ida_*";
    if (defect === "pseudo-uri") p.idaReadBindings[0].accesses[0].resource = "ida://binary/disasm";
    if (defect === "edit") p.idaReadBindings[0].accesses[0].action = "edit";
    if (defect === "no-disasm") p.idaReadBindings.shift();
    if (defect === "unknown") p.silentFallback = true;
    if (defect === "kind-array") p.workKind = ["decompilation"];
    expect(() => new EnsembleBridge({ ...f.options, rePolicy: p } as any)).toThrow(/RE policy/);
  }
  for (const allowedTools of [["read", "edit"], ["read", "team_message"], ["read", "shell"]]) expect(() => new EnsembleBridge({ ...f.options, allowedTools })).toThrow();
  expect(() => new EnsembleBridge({ ...f.options, outputMode: "file" })).toThrow(/RE policy/);
  expect(() => new EnsembleBridge({ ...f.options, admissionMode: "native-query" })).toThrow(/RE policy/);
});

test("RE cannot rebind builtin tools or permission actions to claimed readonly IDA operations", () => {
  const f = fixture();
  for (const id of ["write", "apply_patch", "list", "ls", "webfetch", "websearch", "question", "task", "subagent", "skill", "batch", "lsp"]) {
    for (const field of ["tool", "action"]) {
      const p = policy(); if (field === "tool") p.idaReadBindings[0]!.tool = id; else p.idaReadBindings[0]!.accesses[0]!.action = id;
      expect(() => new EnsembleBridge({ ...f.options, rePolicy: p } as any)).toThrow(/RE policy/);
    }
  }
});

test("RE capabilities are checked before team admission, and sharing is explicit", async () => {
  for (const missing of ["scopedBulletin", "nativeToolBindings"]) {
    const f = fixture(); f.setCapabilities({ resourceBoundary: true, nativeAccessWitness: true, outputSchemaStrict: true, scopedBulletin: true, nativeToolBindings: true, [missing]: false });
    const config = { missionId: "synthetic", outputDirectory: f.options.outputDirectory, knowledge: { files: [] }, models: { A: model }, rePolicy: policy() } as unknown as MissionConfig;
    await expect(f.bridge.ensureTeam(config, f.control)).rejects.toThrow(/capabilit/); expect(f.ensured).toBe(0);
  }
  const f = fixture("decompilation", false); await f.bridge.submit(f.intent("R"), f.control);
  expect(f.submissions[0]!.communication).toBeUndefined(); expect(f.submissions[0]!.nativeTools).toContain("registered_ida_disasm");
});

test("blind authors reject injected peer inputs and unselected native grants", async () => {
  for (const role of ["A", "B"] as const) for (const defect of ["neighborhood", "proposals", "file"]) {
    const f = fixture("semantification"), i = f.intent(role);
    if (defect === "neighborhood") i.inputs.neighborhood = neighborhood;
    if (defect === "proposals") i.inputs.proposals = [];
    if (defect === "file") i.inputs.files.push({ path: "C:/other/A.json", kind: "proposal", sha256: hash("peer"), version: "1", provenance: "peer" });
    await expect(f.bridge.submit(i, f.control)).rejects.toThrow(/peer content/); expect(f.submissions).toHaveLength(0);
  }
  const f = fixture(), i = f.intent("A"); await f.bridge.submit(i, f.control); const e = f.complete(i);
  e.selection.nativeToolBindings = [{ tool: "registered_ida_disasm", accesses: policy().idaReadBindings[0]!.accesses }];
  expect((await f.bridge.inspect(i)).status).toBe("failed"); expect(existsSync(i.outputPath)).toBe(false);
});

test("semantic authors accept exact read binding readback without peer authority", async () => {
  for (const role of ["A", "B"] as const) {
    const f = fixture("semantification"), i = f.intent(role); await f.bridge.submit(i, f.control); f.complete(i);
    expect((await f.bridge.inspect(i)).status).toBe("completed");
  }
});

test("communication rejects unknown response aliases and retains raw trace without producing science", async () => {
  const f = fixture(), i = f.intent("R"); await f.bridge.submit(i, f.control); const execution = f.complete(i);
  execution.communicationTrace = { unfrozenWireFixture: true };
  const result = await f.bridge.inspect(i);
  expect(result.status).toBe("failed"); expect(result.error).toMatch(/communication.*audit/);
  expect(result.communicationTrace).toEqual(execution.communicationTrace);
  expect(result.artifact).toBeUndefined(); expect(existsSync(i.outputPath)).toBe(false);
});

async function sharingFixture() {
  const f = fixture(), a = f.intent("R"), b = f.intent("R", "0x20");
  for (const i of [a, b]) { await f.bridge.submit(i, f.control); f.complete(i); }
  const first = f.publish(a), second = f.publish(b); f.receive(a, second); f.receive(b, first);
  return { ...f, a, b, first, second };
}

test("two R native ASM reads plus sourced provisional sharing pass public audit without changing scientific payload", async () => {
  const f = await sharingFixture(); const before = canonical(f.executions.get(f.a.executionId)!.structuredResult);
  const a = await f.bridge.inspect(f.a), b = await f.bridge.inspect(f.b);
  for (const [i, result] of [[f.a, a], [f.b, b]] as const) {
    expect(result.status).toBe("completed"); expect(result.communicationTrace).toEqual(f.executions.get(i.executionId)!.communicationTrace);
    expect((result as any).communicationAudit).toMatchObject({ version: 1, missionId: i.missionId, executionId: i.executionId, status: "scope-verified", channel: f.first.channel });
    expect((result as any).communicationAudit.snapshot.messages).toHaveLength(2);
    expect((result as any).communicationAudit.authors).toHaveLength(2);
    const document = JSON.parse(result.artifact!.content);
    expect(document.communicationAudit).toBeUndefined(); expect(document.communicationTrace).toBeUndefined();
    expect(document.propositions[0].text).toBe("synthetic provisional");
  }
  expect(f.snapshotReads).toEqual([{ missionId: f.a.missionId, channel: f.first.channel }, { missionId: f.b.missionId, channel: f.first.channel }]);
  expect(f.inspections).toContain(f.b.executionId); expect(canonical(f.executions.get(f.a.executionId)!.structuredResult)).toBe(before);
  expect(f.submissions[0]!.prompt).toContain("execution_bulletin_publish({key,payload})");
  expect(f.submissions[0]!.prompt).toContain("execution_bulletin_read({after?,limit?})");
  expect(f.submissions[0]!.resourceBoundary.some((a: any) => a.action.startsWith("execution_bulletin"))).toBe(false);
});

test("an authenticated peer may still be running; source hashes are declarations, not hashes of returned ASM", async () => {
  const f = await sharingFixture(); const peer = f.executions.get(f.b.executionId)!;
  peer.state = "observed_running"; peer.accessVerified = false; peer.accessWitnesses = [];
  expect(f.second.payload.evidence[0]!.sha256).not.toBe(hash(f.second.payload.evidence[0]!.asm));
  expect((await f.bridge.inspect(f.a)).status).toBe("completed");
});

test("R sharing is optional: an empty exact trace/snapshot is auditable without any peer reads", async () => {
  const f = fixture(), i = f.intent("R"); await f.bridge.submit(i, f.control); f.complete(i);
  const result = await f.bridge.inspect(i); expect(result.status).toBe("completed");
  expect((result as any).communicationAudit.trace).toEqual({ published: [], received: [], cursor: 0 });
  expect(f.inspections).toEqual([i.executionId]);
});

for (const defect of ["mission", "channel", "version", "snapshot-alias", "trace-alias", "missing-message", "ref-hash", "payload-hash", "schema-hash", "id", "duplicate", "order", "cursor", "received-above-cursor", "own-author", "binary", "member", "source-tool", "source-hash", "source-address", "payload-alias", "status", "kind-array"] as const) {
  test(`bulletin audit rejects ${defect} before scientific materialization`, async () => {
    const f = await sharingFixture(), e = f.executions.get(f.a.executionId)!;
    const snapshot: Record<string, any> = { version: 1, missionId: f.a.missionId, revision: 1, messages: structuredClone(f.messages) };
    const m = snapshot.messages[1];
    if (defect === "mission") snapshot.missionId = "other";
    if (defect === "channel") m.channel = "other";
    if (defect === "version") snapshot.version = 2;
    if (defect === "snapshot-alias") snapshot.receipts = [];
    if (defect === "trace-alias") e.communicationTrace.receipts = [];
    if (defect === "missing-message") snapshot.messages.pop();
    if (defect === "ref-hash") e.communicationTrace.received[0].payloadSha256 = hash("different");
    if (defect === "payload-hash") m.payloadSha256 = hash("different");
    if (defect === "schema-hash") m.schemaSha256 = hash("different");
    if (defect === "id") m.id = "not-a-sha";
    if (defect === "duplicate") snapshot.messages.push(structuredClone(m));
    if (defect === "order") snapshot.messages.reverse();
    if (defect === "cursor") e.communicationTrace.cursor = 999;
    if (defect === "received-above-cursor") e.communicationTrace.cursor = 0;
    if (defect === "own-author") e.communicationTrace.published[0] = structuredClone(e.communicationTrace.received[0]);
    if (defect === "binary") m.payload.sourceBinary.sha256 = hash("other");
    if (defect === "member") m.payload.affectedEAs = ["0x30"];
    if (defect === "source-tool") m.payload.evidence[0].tool = "registered_ida_py_eval";
    if (defect === "source-hash") m.payload.evidence[0].sha256 = "g".repeat(64);
    if (defect === "source-address") m.payload.evidence[0].address = "not-an-ea";
    if (defect === "payload-alias") m.payload.observation = "unregistered";
    if (defect === "status") m.payload.status = "accepted";
    if (defect === "kind-array") m.payload.kind = ["observation"];
    if (["binary", "member", "source-tool", "source-hash", "source-address", "payload-alias", "status", "kind-array"].includes(defect)) {
      m.payloadSha256 = hash(canonical(m.payload)); e.communicationTrace.received[0].payloadSha256 = m.payloadSha256;
      f.executions.get(f.b.executionId)!.communicationTrace.published[0].payloadSha256 = m.payloadSha256;
    }
    f.setSnapshot(snapshot); const result = await f.bridge.inspect(f.a);
    expect(result.status).toBe("failed"); expect(result.error).toMatch(/communication audit/); expect(result.artifact).toBeUndefined(); expect(existsSync(f.a.outputPath)).toBe(false);
    expect(result.communicationTrace).toEqual(e.communicationTrace);
  });
}

for (const defect of ["session", "model", "profile", "directory", "mission", "role", "group", "cycle", "policy", "bindings", "binding-hash", "communication-hash", "publication", "unknown-author"] as const) {
  test(`bulletin author public inspect rejects ${defect} spoofing`, async () => {
    const f = await sharingFixture(), peer = f.executions.get(f.b.executionId)!;
    if (defect === "session") peer.nativeSessionId = "foreign";
    if (defect === "model") peer.native.model = { ...model, variant: "low" };
    if (defect === "profile") peer.native.profile = "re-A";
    if (defect === "directory") peer.native.directory += "/other";
    if (defect === "mission") peer.missionId = "other";
    if (defect === "role") peer.dossier.role = "A";
    if (defect === "group") peer.dossier.inputs.neighborhood = { id: "foreign", members: [{ ...binary, ea: "0x30" }] };
    if (defect === "cycle") peer.dossier.cycle++;
    if (defect === "policy") peer.dossier.rePolicy.access = "frozen-only";
    if (defect === "bindings") peer.selection.nativeToolBindings.reverse();
    if (defect === "binding-hash") peer.selection.hashes.nativeToolBindings = hash("other");
    if (defect === "communication-hash") peer.selection.hashes.communication = hash("other");
    if (defect === "publication") peer.communicationTrace.published = [];
    if (defect === "unknown-author") f.executions.delete(f.b.executionId);
    const result = await f.bridge.inspect(f.a);
    expect(result.status).toBe("failed"); expect(result.error).toMatch(/communication audit/); expect(result.artifact).toBeUndefined();
  });
}

test("audit replay survives controller restart, accepts later publications/self-read/skipped cursors, refuses trace regression", async () => {
  const f = await sharingFixture();
  const initial = await f.bridge.inspect(f.a); expect(initial.status).toBe("completed"); const content = initial.artifact!.content;
  f.restartAuditStore(); f.receive(f.a, f.first); // An older page may add a receipt before previously delivered seq 2.
  expect((await new EnsembleBridge(f.options).inspect(f.a)).status).toBe("completed");
  const late = f.publish(f.b, "later provisional lead");
  expect((await new EnsembleBridge(f.options).inspect(f.a)).status).toBe("completed");
  // Explicit cursor skip without receiving late is valid according to the wire.
  f.executions.get(f.a.executionId)!.communicationTrace.cursor = late.seq;
  expect((await f.bridge.inspect(f.a)).status).toBe("completed");
  f.restartAuditStore(); f.executions.get(f.a.executionId)!.communicationTrace.received.pop();
  const regressed = await new EnsembleBridge(f.options).inspect(f.a);
  expect(regressed.status).toBe("failed"); expect(regressed.error).toMatch(/communication audit.*replay/);
  expect(readFileSync(f.a.outputPath, "utf8")).toBe(content);
});

for (const defect of ["changed-message", "disappeared-message", "cursor-regression"] as const) {
  test(`durable communication audit refuses ${defect} after restart even when the new wire is internally consistent`, async () => {
    const f = await sharingFixture(), e = f.executions.get(f.a.executionId)!;
    const late = f.publish(f.b, "unread but audited provisional lead");
    if (defect === "cursor-regression") e.communicationTrace.cursor = late.seq;
    expect((await f.bridge.inspect(f.a)).status).toBe("completed"); f.restartAuditStore();
    if (defect === "changed-message") {
      f.second.payload.summary = "rewritten publication"; f.second.payloadSha256 = hash(canonical(f.second.payload));
      e.communicationTrace.received[0].payloadSha256 = f.second.payloadSha256;
      f.executions.get(f.b.executionId)!.communicationTrace.published[0].payloadSha256 = f.second.payloadSha256;
    }
    if (defect === "disappeared-message") f.messages.pop();
    if (defect === "cursor-regression") e.communicationTrace.cursor = 2;
    const result = await new EnsembleBridge(f.options).inspect(f.a);
    expect(result.status).toBe("failed"); expect(result.error).toMatch(/communication audit.*replay/); expect(result.artifact).toBeUndefined();
  });
}

test("R requires a successful exact native disasm witness; file reads and prompt flags cannot fake it", async () => {
  for (const defect of ["missing", "file-tool", "wrong-resource", "wrong-action", "wrong-session", "wrong-profile", "error", "bindings", "verifier", "permission-only", "file-access"]) {
    const f = fixture("decompilation", false), i = f.intent("R"); await f.bridge.submit(i, f.control); const e = f.complete(i);
    if (defect === "missing") e.accessWitnesses = [];
    if (defect === "file-tool") e.accessWitnesses[0].native.tool = "read";
    if (defect === "wrong-resource") e.accessWitnesses[0].resource += "/other";
    if (defect === "wrong-action") e.accessWitnesses[0].action = "read";
    if (defect === "wrong-session") e.accessWitnesses[0].sessionId = "other";
    if (defect === "wrong-profile") e.accessWitnesses[0].profile = "other";
    if (defect === "error") e.accessWitnesses[0].native.status = "error";
    if (defect === "bindings") e.selection.nativeToolBindings = [];
    if (defect === "verifier") e.accessWitnesses[0].verifierSource = "prompt";
    if (defect === "permission-only") e.accessWitnesses[0].verifierSource = "public.permission.evaluate+tool.execute.after";
    if (defect === "file-access") e.accessVerified = false;
    const result = await f.bridge.inspect(i); expect(result.status).toBe("failed"); expect(result.error).toMatch(/native|disasm|binding/);
    expect(result.artifact).toBeUndefined(); expect(existsSync(i.outputPath)).toBe(false);
  }
  const f = fixture("decompilation", false), i = f.intent("R"); await f.bridge.submit(i, f.control); f.complete(i);
  expect((await f.bridge.inspect(i)).status).toBe("completed");
});

test("canonical native MCP permission event uses configured exact action plus literal star resource", async () => {
  const f = fixture("decompilation", false), i = f.intent("R"); await f.bridge.submit(i, f.control);
  // Host event shape from official V2 permissions. IDs deliberately differ from
  // the registry tool name: a punctuation/name heuristic must not replace config.
  const nativeEvent = { action: "exact_native_disasm_action", resources: ["*"] };
  const s = f.submissions[0]!, required = nativeEvent.resources.map(resource => ({ action: nativeEvent.action, resource }));
  for (const access of required) { expect(s.expectedAccess).toContainEqual(access); expect(s.resourceBoundary).toContainEqual(access); }
  expect(s.nativeTools).toContain("registered_ida_disasm");
  expect(s.resourceBoundary).not.toContainEqual({ action: "registered_ida_disasm", resource: "*" });
  const e = f.complete(i); e.accessWitnesses[0].action = nativeEvent.action; e.accessWitnesses[0].resource = nativeEvent.resources[0];
  expect((await f.bridge.inspect(i)).status).toBe("completed");
});

test("offline two-function engine/bridge fixture: deterministic frozen membership, two R share channel, A/B stay blind, no auto-publication", async () => {
  const f = fixture(), statePath = join(f.root, "science.db"), store = new Store(statePath), publication = new FixturePublicationAdapter();
  const evidence = [{ id: "e", source: "fixture", sha256: hash("fixture"), detail: "synthetic offline" }];
  const cfg = { schemaVersion: 1, missionId: "synthetic", binary, fixture: true, evaluation: { method: "fixture", version: "1", maxDifficulty: 5 }, subsetSize: 2,
    maxCycles: 1, stagnationLimit: 1, models: Object.fromEntries(roles.map(role => [role, model])), knowledge: { version: "k", fingerprint: "k", leadsFingerprint: "l", files: [] },
    commonInputs: [], accessibleRules: [], requiredTools: ["read"], outputDirectory: f.options.outputDirectory, rePolicy: policy(),
    fixtureSeeds: { approved: true, candidates: [...members].reverse().map(identity => ({ identity, manifestVersion: "1", evidence, inputs: [], dependencies: identity.ea === "0x10" ? [members[1]] : [] })),
      assessments: members.map(identity => ({ identity, method: "fixture", version: "1", difficulty: 1, reasons: ["synthetic"], evidence })) } } as unknown as MissionConfig;
  const reconcilers: Intent[] = [];
  const bridge = { ensureTeam: f.bridge.ensureTeam.bind(f.bridge), submit: async (i: Intent) => {
    await f.bridge.submit(i, f.control); f.complete(i);
    if (i.role === "R") { reconcilers.push(i); if (reconcilers.length === 2) { const first = f.publish(reconcilers[0]!), second = f.publish(reconcilers[1]!); f.receive(reconcilers[0]!, second); f.receive(reconcilers[1]!, first); } }
  }, inspect: async (i: Intent) => i.role === "R" && reconcilers.length < 2 ? { status: "running" as const, executionId: i.executionId } : f.bridge.inspect(i),
  pauseAdmissions: async () => {}, stop: async () => {} };
  const engine = new Engine({ store, bridge, publication, inputAccess: f.bridge.access, controllerId: "test" });
  try {
    engine.create(cfg); let s = engine.snapshot(cfg.missionId);
    for (let n = 0; n < 20 && s.status === "running"; n++) s = await engine.tick(cfg.missionId);
    const r = f.submissions.filter(i => i.dossier.role === "R"), ab = f.submissions.filter(i => ["A", "B"].includes(i.dossier.role));
    expect(r).toHaveLength(2); expect(ab).toHaveLength(4);
    expect(r[0]!.dossier.inputs.neighborhood).toEqual(neighborhood);
    expect(r[0]!.communication).toEqual(r[1]!.communication);
    for (const a of ab) { expect(a.communication).toBeUndefined(); expect(a.nativeTools ?? []).toEqual([]); expect(a.dossier.inputs.neighborhood).toBeUndefined(); expect(a.dossier.inputs.proposals).toBeUndefined(); }
    expect(s.config.knowledge).toEqual(cfg.knowledge); expect(s.validatedFacts ?? []).toEqual([]); expect(publication.counts()).toEqual({ writes: 0, readbacks: 0 });
    expect(s.reconciliations).toHaveLength(2);
    for (const entry of s.intents.filter(e => e.intent.role === "R")) {
      expect(entry.state).toBe("resolved");
      const audit = (entry.inspectionHistory!.at(-1) as any).communicationAudit;
      expect(audit.status).toBe("scope-verified"); expect(audit.snapshot.messages).toHaveLength(2);
      expect((entry.result!.document as any).communicationAudit).toBeUndefined();
    }
    const persisted = new Store(statePath);
    try { expect(persisted.load(cfg.missionId).intents.map(e => e.inspectionHistory)).toEqual(s.intents.map(e => e.inspectionHistory)); } finally { persisted.close(); }
  } finally { store.close(); publication.close(); }
});
