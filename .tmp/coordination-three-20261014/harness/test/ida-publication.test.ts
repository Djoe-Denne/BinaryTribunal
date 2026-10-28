import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildNativePublicationCode, decodeNativePublicationState, IdaPublicationAdapter, type NativeGateAttestation } from "../src/ida-publication";
import { bindNativePublicationCaller, createNativePublicationRpc, type NativePublicationLifecycle, type PublicNativePublicationApi } from "../src/native-publication-rpc";
import type { ControllerContext, PublicationRequest, WorkerResult } from "../src/domain";
import { fingerprint, hash } from "../src/validation";

const roots: string[] = [];
const adapters: IdaPublicationAdapter[] = [];
afterEach(() => { adapters.splice(0).forEach(a => a.close()); roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
const binary = { sha256: hash("binary"), version: "test-9.3" };
const supervisor = { sessionID: "ses_owned_supervisor", profile: "orchestrator", directory: "C:/owned/re-ff8" };
const controller: ControllerContext = { revision: 1, lease: { missionId: "test", owner: "lead", token: 1, expiresAt: Date.now() + 60000 } };

function setup() {
  const root = mkdtempSync(join(tmpdir(), "ff8-publication-")); roots.push(root);
  const identity = { ...binary, ea: "0x401000" };
  const document: WorkerResult = {
    schemaVersion: 1, missionId: "test", taskId: "R", attemptId: "a1", executionId: "e1", cycle: 1,
    authorId: "reviewer", inputFingerprint: hash("inputs"), inputVersions: [{ path: "C:/frozen/asm", sha256: hash("asm"), version: "v1" }],
    previousResultIds: ["A", "B"], identity, kind: "reconciliation", decision: "certain", contradictions: [], questions: [],
    propositions: [{ id: "p1", text: "Computes the unsigned value.", evidence: [{ id: "e", source: "native", sha256: hash("asm"), detail: "return EAX" }], contradictions: [], questions: [] }],
    publicationGate: { nativeAsmChecked: true, independentAuthors: true, inputHashesVerified: true, opcodeCoverageComplete: true, abiChecked: true, contradictionsResolved: true, readbackPlan: true, targetId: "idb+docs:test", targetRevision: 0, evidence: [{ id: "e", source: "native", sha256: hash("asm"), detail: "native gate" }] },
  };
  const request: PublicationRequest = { idempotencyKey: "publication-1", missionId: "test", identity, reconciliationId: "R", resultHash: fingerprint(document), document, targetId: "idb+docs:test", expectedRevision: 0, fixture: false };
  const state = { idbPath: join(root, "test.i64"), binarySha256: binary.sha256, functionBytesSha256: hash("chunks"), comment: "User comment: retain this.", evidenceVerified: true, databaseStatus: { exists: true as const, size: 32, sha256: hash("saved-db") } };
  const checks = ["callees-cdecl", "callers-code-data", "expanded-strides", "signedness", "return-width", "name-evidence"] as const;
  const evidence = [
    { id: "asm1", kind: "asm" as const, ea: "0x401000", bytesHex: "8bc1", disassembly: "mov eax, ecx" },
    { id: "xref1", kind: "xref" as const, from: "0x402000", to: "0x401000", isCode: true, type: 17 },
  ];
  const attestation = {
    schemaVersion: 1 as const, supervisor, identity, resultHash: request.resultHash,
    inputVersions: document.inputVersions, inputFingerprint: document.inputFingerprint,
    targetId: request.targetId, docsDirectory: root, idbPath: state.idbPath, expectedCommentHash: hash(state.comment), targetRevision: 0,
    functionBytesSha256: state.functionBytesSha256, capturedAt: "2026-10-12T12:00:00Z",
    evidence, checks: checks.map(check => ({ check, conclusion: "Supervisor verified against native ASM/xrefs.", evidenceIds: check === "name-evidence" ? ["asm1", "xref1"] : ["asm1"] })),
  };
  let writes = 0, saves = 0, calls = 0, loseAppendReply = false, failSave = false, denied = false;
  const tool = { call: async (_toolId: string, input: { code: string }) => {
    calls++;
    if (denied) throw new Error("native-tool-denied");
    const first = input.code.split("\n")[0];
    const command = JSON.parse(first.slice("# ff8-publication ".length)) as { operation: string; expectedComment?: string; nextComment?: string };
    if (command.operation === "append") {
      expect(state.comment).toBe(command.expectedComment!); state.comment = command.nextComment!; writes++;
      if (loseAppendReply) { loseAppendReply = false; throw new Error("lost reply"); }
    }
    if (command.operation === "save") { saves++; return { ...state, saveOk: !failSave }; }
    return { ...state };
  } };
  const options = { databasePath: join(root, "receipts.sqlite"), docsDirectory: root, idbPath: state.idbPath,
    targetId: request.targetId, binary, publicationDate: "2026-10-12", nativeSupervisorRef: supervisor,
    nativeToolId: "ida-pro-mcp.py_eval", nativeToolCaller: tool,
    attest: async () => attestation,
    authorizeController: async () => {},
  };
  function make(overrides: object = {}) { const adapter = new IdaPublicationAdapter({ ...options, ...overrides }); adapters.push(adapter); return adapter; }
  return { root, request, state, attestation, options, make, counts: () => ({ writes, saves, calls }),
    loseReply: () => { loseAppendReply = true; }, failSave: (value: boolean) => { failSave = value; }, deny: () => { denied = true; } };
}

test("certain publication writes once, preserves user comment and persists readback receipt", async () => {
  const s = setup(), a = s.make();
  const receipt = await a.publish(s.request, controller);
  expect(receipt.revision).toBe(1);
  expect(s.state.comment).toStartWith("User comment: retain this.\n[semantic-triple 2026-10-12]");
  expect(s.state.comment).toContain(s.request.resultHash);
  expect(await a.publish(s.request, controller)).toEqual(receipt);
  expect(await a.readback(receipt, controller)).toEqual(receipt);
  expect(s.counts().writes).toBe(1);
  const docsPath = join(s.root, readdirSync(s.root).find(f => f.endsWith(".md"))!);
  expect(readFileSync(docsPath, "utf8")).toContain(s.request.resultHash);
  writeFileSync(docsPath, "altered docs");
  await expect(a.readback(receipt, controller)).rejects.toThrow("docs");
});

test("lost append reply replays durable plan using native readback, never appends twice", async () => {
  const s = setup(), a = s.make(); s.loseReply();
  await expect(a.publish(s.request, controller)).rejects.toThrow("lost reply");
  a.close(); adapters.pop();
  expect((await s.make().publish(s.request, controller)).revision).toBe(1);
  expect(s.counts().writes).toBe(1);
});

test("save failure retries save only and acquires no early receipt", async () => {
  const s = setup(), a = s.make(); s.failSave(true);
  await expect(a.publish(s.request, controller)).rejects.toThrow("save");
  await expect(a.readback({ idempotencyKey: s.request.idempotencyKey, targetId: s.request.targetId, revision: 1, resultHash: s.request.resultHash }, controller)).rejects.toThrow("receipt");
  s.failSave(false); await a.publish(s.request, controller);
  expect(s.counts()).toMatchObject({ writes: 1, saves: 2 });
});

test.each(["comment", "idbPath", "binarySha256", "functionBytesSha256"] as const)("changed native %s conflicts before mutation", async key => {
  const s = setup(), a = s.make(); s.state[key] += "changed";
  await expect(a.publish(s.request, controller)).rejects.toThrow();
  expect(s.counts().writes).toBe(0);
});

test("changed version and reused request hash conflict", async () => {
  const s = setup(), a = s.make();
  await expect(a.publish({ ...s.request, identity: { ...s.request.identity, version: "v2" } }, controller)).rejects.toThrow();
  await a.publish(s.request, controller);
  await expect(a.publish({ ...s.request, resultHash: hash("different") }, controller)).rejects.toThrow();
  expect(s.counts().writes).toBe(1);
});

test.each(["missing", "incomplete", "non-native", "one-name-proof", "failed-native-evidence"])("gate %s forbids IDB write despite worker booleans", async failure => {
  const s = setup();
  if (failure === "incomplete") s.attestation.checks.pop();
  if (failure === "non-native") s.attestation.evidence.length = 0;
  if (failure === "one-name-proof") s.attestation.checks.at(-1)!.evidenceIds = ["asm1"];
  if (failure === "failed-native-evidence") s.state.evidenceVerified = false;
  const a = s.make(failure === "missing" ? { attest: async () => undefined } : {});
  await expect(a.publish(s.request, controller)).rejects.toThrow();
  expect(s.counts().writes).toBe(0);
});

test("docs failure resumes publication without repeating science or native append", async () => {
  const s = setup(); let attestCalls = 0, docs = "", fail = true;
  const a = s.make({ attest: async () => { attestCalls++; return s.attestation; }, docs: {
    writeOnce: async (_p: string, text: string) => { if (fail) throw new Error("docs offline"); docs = text; },
    read: async () => docs,
  } });
  await expect(a.publish(s.request, controller)).rejects.toThrow("docs offline");
  fail = false; await a.publish(s.request, controller);
  expect(attestCalls).toBe(1); expect(s.counts()).toMatchObject({ writes: 1, saves: 1 });
});

test("docs reopened hash mismatch denies receipt", async () => {
  const s = setup(), a = s.make({ docs: { writeOnce: async () => {}, read: async () => "altered" } });
  await expect(a.publish(s.request, controller)).rejects.toThrow("docs");
});

test("native capability denial has no fallback and performs no mutation", async () => {
  const s = setup(), a = s.make(); s.deny();
  await expect(a.publish(s.request, controller)).rejects.toThrow("native-tool-denied");
  expect(s.counts()).toMatchObject({ writes: 0, saves: 0, calls: 1 });
});

test("conflicting pre-existing semantic tag is rejected", async () => {
  const s = setup(); s.state.comment += "\n[semantic-triple 2026-10-01]\nresult=someone-else";
  s.attestation.expectedCommentHash = hash(s.state.comment);
  await expect(s.make().publish(s.request, controller)).rejects.toThrow();
  expect(s.counts().writes).toBe(0);
});

test("saved disk hash change during docs recovery fails closed", async () => {
  const s = setup(), a = s.make({ docs: { writeOnce: async () => { throw new Error("docs failure"); }, read: async () => "" } });
  await expect(a.publish(s.request, controller)).rejects.toThrow("docs failure");
  s.state.databaseStatus.sha256 = hash("changed on disk");
  await expect(a.publish(s.request, controller)).rejects.toThrow("disk");
  expect(s.counts()).toMatchObject({ writes: 1, saves: 1 });
});

test.each(["resultHash", "inputFingerprint", "targetRevision", "inputVersions"] as const)("attested %s must bind to the exact request", async field => {
  const s = setup();
  if (field === "targetRevision") s.attestation.targetRevision++;
  else if (field === "inputVersions") s.attestation.inputVersions = [];
  else s.attestation[field] = hash("wrong");
  await expect(s.make().publish(s.request, controller)).rejects.toThrow("gate");
  expect(s.counts().writes).toBe(0);
});

test("durable target CAS reserves pending request before native capability I/O", async () => {
  const s = setup(), a = s.make(); s.deny();
  await expect(a.publish(s.request, controller)).rejects.toThrow("native-tool-denied");
  await expect(a.publish({ ...s.request, idempotencyKey: "competing" }, controller)).rejects.toThrow("pending");
  expect(s.counts().calls).toBe(1);
});

test("reopened receipt database rejects changed configured version/target binding", async () => {
  const s = setup(), a = s.make(); await a.publish(s.request, controller); a.close(); adapters.pop();
  expect(() => s.make({ binary: { ...binary, version: "changed-version" } })).toThrow("binding/version");
});

test("native py_eval envelope needs actual native state and on-disk status, not prose", () => {
  const s = setup();
  expect(decodeNativePublicationState({ content: [{ type: "text", text: JSON.stringify({ stdout: `FF8_PUBLICATION_V1:${JSON.stringify(s.state)}\n`, stderr: "" }) }] })).toEqual({ ...s.state, saveOk: false });
  expect(() => decodeNativePublicationState({ stdout: "all good" })).toThrow("binding-unavailable");
  expect(() => decodeNativePublicationState({ ...s.state, databaseStatus: undefined })).toThrow();
});

function nativeBindingFixture() {
  let executions = 0, evaluations = 0, deny = false, owned = true, hooks = 0;
  const s = setup();
  const capability = { operatorCapability: Object.freeze({}), supervisor, toolId: "ida-pro-mcp.py_eval", targetId: s.request.targetId, directory: supervisor.directory, idbPath: s.state.idbPath, docsDirectory: s.root };
  const code = buildNativePublicationCode("inspect", s.attestation);
  const context = { sessionID: supervisor.sessionID, native: true };
  const api: PublicNativePublicationApi<typeof context> = {
    tool: { list: async () => [{ id: capability.toolId, execute: async (_input, ctx) => { expect(ctx).toBe(context); executions++; return "native result"; } }] },
    permission: { evaluate: async input => { evaluations++; expect(input.sessionID).toBe(supervisor.sessionID); return { effect: deny ? "deny" : "allow" }; } },
  };
  const lifecycle: NativePublicationLifecycle<typeof context> = {
    inspectSupervisor: async () => ({ ...supervisor, ownedSupervisor: owned }),
    authorizeCapability: async token => token === capability.operatorCapability,
    permissions: async tool => ({ action: tool.id, resources: [capability.idbPath] }),
    context: async () => context,
    invoke: async (tool, input, ctx) => { hooks++; return await tool.execute(input, ctx); },
  };
  return { api, capability, lifecycle, code, gate: s.attestation, counts: () => ({ executions, evaluations, hooks }), deny: () => { deny = true; }, disown: () => { owned = false; } };
}

test("public tool availability is NOT operational without native lifecycle/context", () => {
  const f = nativeBindingFixture();
  expect(bindNativePublicationCaller(f.capability, f.api, undefined).available).toBe(false);
  expect(f.counts().executions).toBe(0);
});

test("configured native session permission/context/hooks precede public tool.execute", async () => {
  const f = nativeBindingFixture(), bound = bindNativePublicationCaller(f.capability, f.api, f.lifecycle);
  expect(bound.available).toBe(true); if (!bound.available) return;
  expect(await bound.caller.call(f.capability.toolId, { code: f.code }, supervisor)).toBe("native result");
  expect(f.counts()).toEqual({ executions: 1, evaluations: 4, hooks: 1 });
});

test.each(["denied", "foreign-session", "not-owned"])("native binding rejects %s without fallback", async failure => {
  const f = nativeBindingFixture(); if (failure === "denied") f.deny(); if (failure === "not-owned") f.disown();
  const bound = bindNativePublicationCaller(f.capability, f.api, f.lifecycle); if (!bound.available) throw new Error(bound.reason);
  await expect(bound.caller.call(f.capability.toolId, { code: f.code }, failure === "foreign-session" ? { ...supervisor, sessionID: "ses_worker" } : supervisor)).rejects.toThrow("native-tool-denied");
  expect(f.counts().executions).toBe(0);
});

test.each(["injected-code", "changed-scope"])("publication actuator rejects %s even with operator capability", async failure => {
  const f = nativeBindingFixture(), bound = bindNativePublicationCaller(f.capability, f.api, f.lifecycle); if (!bound.available) throw new Error(bound.reason);
  const code = failure === "injected-code" ? `${f.code}\nidc.set_func_cmt(1, 'bad', 0)` : buildNativePublicationCode("inspect", { ...f.gate, docsDirectory: "C:/outside/docs" });
  await expect(bound.caller.call(f.capability.toolId, { code }, supervisor)).rejects.toThrow("native-tool-denied");
  expect(f.counts()).toEqual({ executions: 0, evaluations: 0, hooks: 0 });
});

test("native permission revoked during context acquisition forbids public tool execution", async () => {
  const f = nativeBindingFixture(); const oldContext = f.lifecycle.context;
  f.lifecycle.context = async (tool, ref) => { const context = await oldContext(tool, ref); f.deny(); return context; };
  const bound = bindNativePublicationCaller(f.capability, f.api, f.lifecycle); if (!bound.available) throw new Error(bound.reason);
  await expect(bound.caller.call(f.capability.toolId, { code: f.code }, supervisor)).rejects.toThrow("native-tool-denied");
  expect(f.counts().executions).toBe(0);
});

test("controller fence is rechecked before save and resume keeps one append", async () => {
  const s = setup(); let expired = true;
  const a = s.make({ authorizeController: async () => { if (expired && s.counts().writes > 0) throw new Error("expired controller fence"); } });
  await expect(a.publish(s.request, controller)).rejects.toThrow("controller fence");
  expect(s.counts()).toMatchObject({ writes: 1, saves: 0 });
  expired = false; await a.publish(s.request, controller);
  expect(s.counts()).toMatchObject({ writes: 1, saves: 1 });
});

test("concurrent same-request gates cannot corrupt lost-reply recovery", async () => {
  const s = setup(); let gateCalls = 0;
  const options = { attest: async () => ({ ...s.attestation, capturedAt: `2026-10-12T12:00:0${gateCalls++}Z` }) };
  const a = s.make(options), b = s.make(options); s.loseReply();
  const results = await Promise.allSettled([a.publish(s.request, controller), b.publish(s.request, controller)]);
  expect(results.every(r => r.status === "rejected")).toBe(true);
  expect((await b.publish(s.request, controller)).revision).toBe(1);
  expect(s.counts().writes).toBe(1);
  expect(gateCalls).toBe(2);
});

test("RPC takes controller from authenticated server context, never request sessionID", async () => {
  const s = setup(), a = s.make(); const token = Object.freeze({ operator: true });
  const rpc = createNativePublicationRpc(a, async context => { if (context !== token) throw new Error("RPC authorization denied"); return controller; });
  await expect(rpc.publish(s.request, { sessionID: supervisor.sessionID })).rejects.toThrow("RPC authorization");
  expect(s.counts().writes).toBe(0);
  expect((await rpc.publish(s.request, token)).revision).toBe(1);
});

test("generated Python executes offline stubs: native CAS, proof recheck, append once and save", () => {
  const s = setup(); writeFileSync(s.state.idbPath, "offline IDB fixture");
  const start = 0x401000, end = start + 2;
  const bounds = new Uint8Array(16); const view = new DataView(bounds.buffer);
  view.setBigUint64(0, BigInt(start), true); view.setBigUint64(8, BigInt(end), true);
  s.attestation.functionBytesSha256 = hash(new Uint8Array([...bounds, 0x8b, 0xc1]));
  const next = `${s.state.comment}\n[semantic-triple 2026-10-12]\nrequest=offline\nresult=${s.request.resultHash}`;
  const payload = { gate: s.attestation as NativeGateAttestation, comment: s.state.comment, next,
    inspect: buildNativePublicationCode("inspect", s.attestation), append: buildNativePublicationCode("append", s.attestation, s.state.comment, next),
    save: buildNativePublicationCode("save", s.attestation, next) };
  const python = `import sys,json,types,io,contextlib
p=json.loads(sys.stdin.read())
g=p['gate']; state={'comment':p['comment'],'writes':0,'saves':0}
def module(name, **items):
    m=types.ModuleType(name)
    for k,v in items.items(): setattr(m,k,v)
    sys.modules[name]=m
def set_comment(ea,text,repeatable):
    state['writes']+=1; state['comment']=text; return True
def save_database(path):
    state['saves']+=1; return True
module('ida_bytes',get_bytes=lambda ea,size: bytes.fromhex('8bc1'))
module('ida_funcs',get_func=lambda ea:types.SimpleNamespace(start_ea=0x401000))
module('ida_nalt',retrieve_input_file_sha256=lambda:bytes.fromhex(g['identity']['sha256']))
module('idautils',Chunks=lambda ea:[(0x401000,0x401002)],XrefsTo=lambda ea,flags:[types.SimpleNamespace(frm=0x402000,to=0x401000,iscode=True,type=17)])
module('idc',get_idb_path=lambda:g['idbPath'],get_func_cmt=lambda ea,r:state['comment'],set_func_cmt=set_comment,save_database=save_database,generate_disasm_line=lambda ea,f:'mov eax, ecx')
def run(code):
    with contextlib.redirect_stdout(io.StringIO()) as output: exec(compile(code,'offline-native-test','exec'),{})
    return json.loads(output.getvalue().strip().split('FF8_PUBLICATION_V1:')[-1])
assert run(p['inspect'])['evidenceVerified']
assert run(p['append'])['comment']==p['next']
assert run(p['append'])['comment']==p['next']
assert run(p['save'])['saveOk']
assert state['writes']==1 and state['saves']==1
state['comment']='external user edit'
try: run(p['append']); raise AssertionError('CAS did not reject')
except RuntimeError: pass
assert state['writes']==1
state['comment']=p['comment']
sys.modules['idautils'].XrefsTo=lambda ea,flags:[]
try: run(p['append']); raise AssertionError('native gate did not reject')
except RuntimeError: pass
assert state['writes']==1
print('offline native emitter PASS')`;
  const result = spawnSync("python", ["-c", python], { input: JSON.stringify(payload), encoding: "utf8" });
  expect(result.stderr).toBe(""); expect(result.status).toBe(0); expect(result.stdout).toContain("offline native emitter PASS");
});
