import { test, expect, spyOn } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { ExecutionClient, nativeModelCatalogProjectionV1, sourceNativeFunctionIdentityMatchesV1,
  nativeAcquisitionGrantMatchesSourceV1, type RpcTransport } from "../src/client";
import { prepareRuntimeExecutionV1 } from "../src/graph-execution-prepare";
import { readRuntimeDocumentV1, type DispatchScopeV1 } from "../src/graph-runtime-binding";
import { fixture, preparation, decoded, document, digest } from "./s2-author/s1-source-fixtures";
import { graphHarness } from "./graph-integration/fixture-driver";
import { Engine } from "../src/engine";
import { Store } from "../src/store";
import { GraphStore, type Admission, type ParentAuthorityProvider, type NativeRuntimeHostVerificationV1, type WorkUnit,
  type NativeInvocationSourceV1, type NativeRootAcquisitionV1, type NativeLocalPermitV1, type NativeRuntimeExpectedV1, type AdmissionInputPin } from "../src/graph-store";
import { parseExecutionEnvelopeV1, bindExecutionSourcesV1, makeBoundDocumentV1, type GraphRunV3, type RootSlotGrantsV1 } from "../src/graph-execution-envelope";
import { nativeFrozenGraphInputsV1 } from "../src/graph-adapter";
import { encodeNativeAdmissionWireV1, isConnectedNativeRuntimeHttpPortV1, type NativeRuntimeHttpPortV1 } from "../src/native-runtime-transport";
import type { NativeRootLedgerV1 } from "../src/graph-runtime-binding";
import { canonical, fingerprint } from "../src/validation";
import { createHash } from "node:crypto";
import * as clientModule from "../src/client";
import type { NativeRuntimeObservationV2 } from "../src/graph-native-observations";

/** OFFLINE host/HTTP simulation, not native qualification or a production host.
 * The original frozen source is DATA; target Engine.create makes a fresh OWN
 * cycle. Bootstrap origin/debits are independently explicit, never copied away. */
function nativeOfflineCase(loss?: "create" | "prompt", options: { localParent?: boolean;
  refresh?: (expected: NativeRuntimeExpectedV1, graph: GraphStore, observation?: NativeRuntimeObservationV2) => Promise<void>;
  author?: ParentAuthorityProvider["verifyNativeAuthor"] } = {}) {
  const f = fixture({ cap: 100000, rootCap: 100000 }), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
  if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
  const run = readRuntimeDocumentV1(prepared.value.run) as GraphRunV3, envelope = readRuntimeDocumentV1(run.envelope);
  const parsed = parseExecutionEnvelopeV1(Buffer.from(run.envelope.utf8)); if (!parsed.ok) throw new Error(parsed.reasons.join(";"));
  const bound = bindExecutionSourcesV1(parsed.value, f.independent); if (!bound.ok) throw new Error(bound.reasons.join(";"));
  const sourceBefore = JSON.stringify({ run: prepared.value.run, independent: f.independent });
  const sourceMission = readRuntimeDocumentV1(envelope.sourceMissionSnapshot);
  expect(sourceMission.cycles[0]!.frozen).toBe(true);
  const selected = bound.value.planning.plan.selectedUnitIds[0]; if (!selected) throw new Error("OFFLINE fixture requires explicit selected unit");
  const unit: WorkUnit = JSON.parse(canonical(bound.value.planning.units.find(u => u.unitId === selected)));
  const sub = unit.subIntents.find(s => s.role === "A"); if (!sub) throw new Error("OFFLINE fixture requires selected A");
  const cap = bound.value.planning.sidecar.admissionBudget?.byUnit[unit.unitId]?.admissionCapUtf8Bytes;
  if (!cap?.known || typeof cap.value !== "number") throw new Error("OFFLINE fixture Cunit must be known, never skipped");
  const capValue = cap.value, rootDir = mkdtempSync(join(tmpdir(), "ff8-native-OFFLINE-")), path = join(rootDir, "own.db");
  const sha = (s: string) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
  const proof = makeBoundDocumentV1("OFFLINE-NOT-NATIVE-HOST-PROOF", { testOnly: true }).ref;
  const grantsDocument = readRuntimeDocumentV1(envelope.admissionSource.budgetLineage.rootLimits).rootSlotGrants;
  if (!grantsDocument) throw new Error("OFFLINE fixture requires explicit root grants");
  const grants = readRuntimeDocumentV1<RootSlotGrantsV1>(grantsDocument);
  const baseline: NativeRootLedgerV1 = { version: "rms-native-root-ledger-v1", missionId: run.missionId, lineageId: envelope.generation.lineageId,
    rootAccountId: envelope.admissionSource.budgetLineage.rootAccountId, revision: 0, generationId: "OFFLINE-native-head-not-fixture-head", headRevision: 0,
    controllerFence: 1, historyRef: proof, origins: [{ originId: "OFFLINE-bootstrap-counted", sourceRef: proof }],
    slots: grants.grants.map(g => ({ slotKey: `OFFLINE:${g.slot.role}`, grantRef: grantsDocument.ref, capUtf8Bytes: g.bodyCapUtf8Bytes,
      acquiredUtf8Bytes: g.reservedDebitUtf8Bytes, encumberedUtf8Bytes: g.slot.role === "A" ? 17 : 0, spentUtf8Bytes: g.slot.role === "A" ? 17 : 0, burnedUtf8Bytes: 0 })) };
  const localCapability = Object.freeze({});
  const localSource: NativeInvocationSourceV1 = { version: "rms-parent-owned-invocation-v1", invocationId: "OFFLINE-ONLY-not-a-native-invocation",
    pid: 1, startedAt: 1000, expiresAt: 100000, missionId: run.missionId, controllerOwner: "OFFLINE-native-controller", controllerFence: 1,
    ownPath: path, programSha256: sha("OFFLINE program"), scopeSha256: sha("OFFLINE scope"), externalReceiptRef: null };
  const invocation = options.localParent ? { capability: localCapability, source: localSource } : undefined;
  let store = new Store(path), graph: GraphStore, client: ExecutionClient, engine: Engine;
  let now = 1000, runtimeChecks = 0, allowed = true, physicalAllowed = true, lost = false, loseNotification = false, permitMismatch: "image" | "scope" | undefined;
  let permitOverride: Partial<NativeRuntimeHostVerificationV1["permit"]> = {};
  let onCreate: ((s: Record<string, any>) => void) | undefined;
  let onNotification: ((item: Record<string, any>) => void) | undefined;
  let onGet: ((route: string) => Response | undefined) | undefined;
  let session: Record<string, any> | undefined;
  const inbox: Array<Record<string, any>> = [], calls: Array<{ method: string; route: string; utf8?: string }> = [];
  const controller = "OFFLINE-native-controller";
  const authority = () => {
    const r = graph.db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(run.missionId) as { lease_owner: string; lease_token: number; lease_until: number } | null;
    if (!r || typeof r.lease_owner !== "string" || !r.lease_owner || !Number.isSafeInteger(r.lease_token) || !Number.isSafeInteger(r.lease_until))
      throw new Error("OFFLINE current controller lease row absent or invalid");
    return { now, lease: { missionId: run.missionId, owner: r.lease_owner, token: r.lease_token, expiresAt: r.lease_until } };
  };
  const root = (): NativeRootLedgerV1 => {
    const r = graph.db.query("SELECT document FROM ff8_graph_native_roots WHERE root_id=?").get(baseline.rootAccountId) as { document: string } | null;
    if (r) return JSON.parse(r.document);
    const acquired = options.localParent ? graph.nativeLocalDecisionV1(`root-acquisition:${baseline.rootAccountId}`, run.missionId) : undefined;
    return acquired?.subject.version === "rms-native-root-acquisition-v1" ? structuredClone(acquired.subject.root) : structuredClone(baseline);
  };
  const wirePort: NativeRuntimeHttpPortV1 = { async request(method, route, utf8) {
    calls.push({ method, route, utf8 });
    if (method === "GET") { const response = onGet?.(route); if (response) return response; }
    if (method === "POST") {
      // A separate READ-ONLY connection must see committed images/claims before
      // the fake remote effect. Reading the writer connection alone is no oracle.
      const witness = new Database(path, { readonly: true });
      try {
        const operation = witness.query("SELECT document,create_claim,prompt_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(admission.executionId) as { document: string; create_claim: number; prompt_claim: number };
        expect(JSON.parse(operation.document).wire).toEqual(wire);
        if (route === "/api/session") expect(operation.create_claim).toBe(1);
        else if (JSON.parse(utf8!).id === wire.messageId) expect(operation.prompt_claim).toBe(1);
        else {
          const rows = witness.query("SELECT document,delivery FROM ff8_graph_ordered_commands").all() as Array<{ document: string; delivery: string }>;
          const command = rows.find(r => JSON.parse(r.document).nativeWire?.messageId === JSON.parse(utf8!).id);
          expect(command?.delivery).toBe("SENDING"); expect(JSON.parse(command!.document).nativeWire.utf8).toBe(utf8);
        }
        const currentRoot = JSON.parse((witness.query("SELECT document FROM ff8_graph_native_roots WHERE root_id=?").get(baseline.rootAccountId) as { document: string }).document) as NativeRootLedgerV1;
        const emitted = calls.filter(c => c.method === "POST").reduce((sum, c) => sum + Buffer.byteLength(c.utf8!, "utf8"), 0);
        expect(currentRoot.slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17 + emitted);
      } finally { witness.close(); }
    }
    if (method === "GET" && route === "/api/info") return Response.json({ version: "2.2.1", pid: 42, urls: [], paths: { tmp: "OFFLINE" } });
    if (method === "POST" && route === "/api/session") {
      expect((graph.db.query("SELECT create_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(admission.executionId) as { create_claim: number }).create_claim).toBe(1);
      const created: Record<string, any> = { ...JSON.parse(utf8!), projectID: "OFFLINE", cost: 0, tokens: {}, time: { created: 1000, updated: 1000 } };
      onCreate?.(created); session = created;
      if (loss === "create" && !lost) { lost = true; throw new Error("OFFLINE response lost AFTER persisted create"); }
      return Response.json({ data: session });
    }
    if (method === "POST" && route.endsWith("/prompt")) {
      const body = JSON.parse(utf8!);
      if (body.id === wire.messageId) expect((graph.db.query("SELECT prompt_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(admission.executionId) as { prompt_claim: number }).prompt_claim).toBe(1);
      else {
        const commands = graph.db.query("SELECT document,delivery FROM ff8_graph_ordered_commands").all() as Array<{ document: string; delivery: string }>;
        expect(commands.find(c => JSON.parse(c.document).nativeWire?.messageId === body.id)?.delivery).toBe("SENDING");
        expect(body.resume).toBe(false);
      }
      const item = { id: body.id, sessionID: wire.sessionId, time: { created: 1000 }, type: "user", delivery: body.delivery, payload: { text: body.text, metadata: body.metadata } };
      expect(inbox.some(i => i.id === item.id)).toBe(false); inbox.push(item);
      if (body.id !== wire.messageId) onNotification?.(item);
      if (loss === "prompt" && !lost && body.id === wire.messageId) { lost = true; throw new Error("OFFLINE response lost AFTER persisted prompt"); }
      if (loseNotification && body.id !== wire.messageId) { loseNotification = false; throw new Error("OFFLINE response lost AFTER persisted notification"); }
      return Response.json({ data: item });
    }
    if (route.includes("/log?")) return new Response(`data: ${JSON.stringify({ type: "log.synced", aggregateID: wire.sessionId, seq: 0 })}\n\n`, { headers: { "content-type": "text/event-stream" } });
    if (route.endsWith("/inbox")) return Response.json({ data: inbox });
    if (route.includes("/message/")) return new Response("", { status: 404 });
    return session ? Response.json({ data: session }) : new Response("", { status: 404 });
  } };
  const provider: ParentAuthorityProvider = {
    ...(options.refresh ? { async refreshNativeRuntime(_a: unknown, _db: unknown, expected: NativeRuntimeExpectedV1, _port: unknown, _signal: AbortSignal, observation?: NativeRuntimeObservationV2) {
      const refresh = options.refresh; if (!refresh) throw new Error("OFFLINE refresh removed"); await refresh(expected, graph, observation);
    } } : {}),
    verifyParent(a) { return a.lease.owner === controller ? { version: 1, role: "parent", missionId: run.missionId, controllerOwner: controller,
      principalId: "OFFLINE", actorId: "OFFLINE-parent", source: "OFFLINE simulation only, NOT native evidence", sourceHash: sha("OFFLINE parent") } : undefined; },
    verifyNativeAuthor(a, e) { return options.author?.(a, e); },
    verifyNativeRuntime(a, db, expected, actualPort): NativeRuntimeHostVerificationV1 | undefined {
      runtimeChecks++;
      if (db !== graph.db || a.lease.owner !== controller || !physicalAllowed || !allowed && expected.purpose !== "physical-observation") return undefined;
      const ledger = root();
      return { transport: wirePort, authority: { version: "rms-native-runtime-authority-v1", missionId: run.missionId,
        lineageId: ledger.lineageId, rootAccountId: ledger.rootAccountId, generationId: ledger.generationId, headRevision: ledger.headRevision,
        controllerOwner: controller, controllerFence: a.lease.token, sourceRefs: [proof], proofRefs: [proof], historyRef: proof,
        server: { version: "2.2.1", pid: 42, binarySha256: sha("OFFLINE binary"), sourceSha256: sha("OFFLINE source"), openapiSha256: sha("OFFLINE schema") } },
        independentSources: structuredClone(f.independent), rootLedger: ledger,
        permit: { version: "rms-native-qualification-permit-v1", missionId: run.missionId, unitId: permitMismatch === "scope" ? "OFFLINE-other-unit" : expected.unitId, executionId: expected.executionId,
          runRef: prepared.value.run.ref, imageSha256: permitMismatch === "image" ? sha("OFFLINE-other-image") : expected.imageSha256, originId: "OFFLINE-native-origin-counted", slotKey: "OFFLINE:A", maxBodyUtf8Bytes: capValue,
           proofRefs: [proof], physicalOwnershipRef: proof, ...(expected.commandId ? { commandId: expected.commandId } : {}), ...permitOverride } };
    },
  };
  const refused = async (): Promise<never> => { throw new Error("OFFLINE legacy/science route must not execute"); };
  const fileData = new Map(bound.value.body.admissionSource.inputManifestSource.files.map(a => [a.file.path, Buffer.from(a.bytes.base64, "base64")]));
  const availableTools = new Set(bound.value.inputSource.requiredTools);
  const makeEngine = () => new Engine({ store, controllerId: controller, now: () => now,
    bridge: { ensureTeam: refused, submit: refused, inspect: refused, pauseAdmissions: refused, stop: refused }, publication: { publish: refused, readback: refused },
    inputAccess: { read: async file => fileData.has(file) ? { status: "ok", content: fileData.get(file)! } : { status: "denied-read" },
      list: async directory => ({ status: "ok", entries: [...fileData.keys()].filter(file => dirname(file) === directory) }), tool: async tool => availableTools.has(tool) } });
  graph = new GraphStore(path, { parentAuthority: provider, nativeParentInvocation: invocation }); engine = makeEngine(); engine.create(JSON.parse(canonical(sourceMission.config)));
  expect(store.load(run.missionId).cycles[0]!.frozen).toBe(false);
  const inputs = nativeFrozenGraphInputsV1(bound.value, sub), inputFingerprint = fingerprint(inputs), taskId = `${run.missionId}:OFFLINE-native:A`, attemptId = `${taskId}:f1:a1`, executionId = `${attemptId}:${inputFingerprint.slice(0, 16)}`;
  const model = bound.value.sourceSpec.models.A;
  const admission: Admission = { executionId, attemptId, role: "A", subIntentId: sub.subIntentId, idempotencyKey: executionId,
    command: { taskId, attemptId, executionId, idempotencyKey: executionId, profile: bound.value.template.settings.profiles.A, model,
      prompt: "OFFLINE qualification-only frozen bytes", context: { mode: "fresh" }, worktree: false,
      dossier: { version: 1, fixture: false, functionId: sub.functionId, function: sub.harnessIdentity, role: "A", cycle: inputs.cycle, effectiveModel: model, inputs,
        resultHeader: { schemaVersion: 1, missionId: run.missionId, taskId, attemptId, executionId, authorId: executionId, cycle: inputs.cycle,
          identity: sub.harnessIdentity, inputFingerprint, inputVersions: inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: [] } },
      metadata: { inputFingerprint, rmsBinding: { version: "rms-native-admission-binding-v1", missionId: run.missionId, unitId: unit.unitId,
        functionId: sub.functionId, subIntentId: sub.subIntentId, role: sub.role, runRef: prepared.value.run.ref, familyFence: 1, controllerFence: 1 } },
      requiredAccess: inputs.files.map(file => ({ action: "read", resource: file.path })) } };
  const wire = encodeNativeAdmissionWireV1(admission, { sessionId: "ses_OFFLINE_retained", messageId: "msg_OFFLINE_retained", directory: rootDir,
    permissions: [{ action: "*", resource: "*", effect: "deny" }, ...inputs.files.map(file => ({ action: "read", resource: file.path, effect: "allow" as const }))] });
  expect(wire.totalBodyUtf8Bytes).toBeLessThanOrEqual(capValue); expect(capValue).toBeLessThanOrEqual(baseline.slots.find(s => s.slotKey === "OFFLINE:A")!.capUtf8Bytes);
  const makeClient = (transport: NativeRuntimeHttpPortV1 = wirePort) => new ExecutionClient({ transport: { call: refused }, statePath: path, directory: rootDir, principalId: "OFFLINE", token: () => { throw new Error("RPC token must not be requested"); },
    controllerId: controller, teamName: "OFFLINE", leaseMs: 300000, maxRunning: 1, nativeRuntime: { graph, authority, transport } });
  client = makeClient();
  const handle = () => engine.openNativeGraph(run.missionId, executionId, { kind: "graph-store-native-v1", client });
  const start = () => engine.startNativeGraph(run.missionId, { run: prepared.value.run, unitId: unit.unitId, admission, wire }, { kind: "graph-store-native-v1", client });
  const startAsync = () => engine.startNativeGraphAsync(run.missionId, { run: prepared.value.run, unitId: unit.unitId, admission, wire }, { kind: "graph-store-native-v1", client });
  const reopen = () => { client.close(); graph.close(); store.close(); store = new Store(path); graph = new GraphStore(path, { parentAuthority: provider, nativeParentInvocation: invocation }); client = makeClient(); engine = makeEngine(); return handle(); };
  const command = (commandId: string, sequence: number, action: "notify" | "obsolete" = "notify", notify = true) => {
    graph.bootstrapParentAuthority(authority());
    const unitRow = graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(run.missionId, unit.unitId) as { revision: number };
    const request = { commandId, unitId: unit.unitId, executionId, sessionId: wire.sessionId, action, reason: "OFFLINE supervisor control", sequence,
      expectedMissionRevision: store.load(run.missionId).revision, expectedUnitRevision: unitRow.revision,
      expectedEventSequence: graph.events.cursor(run.missionId).sequence, expectedFamilyToken: graph.leases.get(run.missionId, unit.unitId)?.token ?? null, notify };
    return { request, receipt: graph.retainOrderedCommandV1(authority(), request) };
  };
  const functionIdentity = { ...sub.harnessIdentity, ea: Number(sub.harnessIdentity.ea) };
  const acquisition = (): NativeRootAcquisitionV1 => {
    if (!envelope.rootBootstrapSources) throw new Error("OFFLINE explicit bootstrap sources missing");
    return { version: "rms-native-root-acquisition-v1", mode: "first-acquisition",
    priorAuthority: "no-linked-prior-authority-established", allocationRef: envelope.admissionSource.budgetLineage.rootAllocationRef,
    planningRef: envelope.rootBootstrapSources.planning.ref, attributionRef: proof, root: structuredClone(baseline),
    inventory: makeBoundDocumentV1("rms-native-inventory-attribution-v1", { version: "rms-native-inventory-attribution-v1" as const,
      missionId: run.missionId, lineageId: baseline.lineageId, rootAccountId: baseline.rootAccountId, origins: structuredClone(baseline.origins),
      resourceRefs: [proof], evidenceRefs: [proof], unresolved: [] }),
    grants: baseline.slots.map(s => ({ slotKey: s.slotKey, functionIdentity, role: s.slotKey.split(":").at(-1) as "A" | "B" | "R", pass: 1 as const,
      capUtf8Bytes: s.capUtf8Bytes, acquiredUtf8Bytes: s.acquiredUtf8Bytes, provenanceRef: proof })) }; };
  const localPermit = (): NativeLocalPermitV1 => ({ version: "rms-native-local-permit-v1", expected: { missionId: run.missionId, unitId: unit.unitId,
    executionId, runRef: prepared.value.run.ref, imageSha256: sha(canonical(wire)) }, permit: { version: "rms-native-qualification-permit-v1",
    missionId: run.missionId, unitId: unit.unitId, executionId, runRef: prepared.value.run.ref, imageSha256: sha(canonical(wire)),
    originId: "OFFLINE-native-origin-counted", slotKey: "OFFLINE:A", maxBodyUtf8Bytes: capValue, proofRefs: [proof], physicalOwnershipRef: proof },
    server: { version: "2.2.1", pid: 42, binarySha256: sha("OFFLINE"), sourceSha256: sha("OFFLINE"), openapiSha256: sha("OFFLINE") },
    sourceRefs: [proof], permissionsEvidenceRef: proof, sourceRequestRef: proof, profile: "OFFLINE-only-no-native-caller", model: { providerID: "openai", id: "OFFLINE-never-executed", variant: "high" },
    permissions: [{ action: "*", resource: "*", effect: "deny" }], agentMode: "subagent", agentPermissions: [], modelCatalogRef: proof, functionIdentity, role: "A" });
  return { start, startAsync, handle, reopen, root, wire, admission, unit, authority, calls, sha, missionId: run.missionId, sourceGenerationId: run.generationId,
    graph: () => graph, sourceUnchanged: () => expect(JSON.stringify({ run: prepared.value.run, independent: f.independent })).toBe(sourceBefore),
    revoke: () => { allowed = false; }, onCreate: (fn: (s: Record<string, any>) => void) => { onCreate = fn; },
    revokePhysical: () => { physicalAllowed = false; }, onNotification: (fn: (item: Record<string, any>) => void) => { onNotification = fn; },
    command, loseNextNotification: () => { loseNotification = true; }, mismatchPermit: (kind: "image" | "scope") => { permitMismatch = kind; },
    alternateClient: makeClient,
    localCapability, acquisition, localPermit,
    setNow: (time: number) => { if (time < now) throw new Error("OFFLINE clock cannot reset"); now = time; },
    onGet: (fn: (route: string) => Response | undefined) => { onGet = fn; },
    openLocalPeer: () => new GraphStore(path, { parentAuthority: provider, nativeParentInvocation: invocation }),
    runtimeChecks: () => runtimeChecks,
    assertHistoricalAdmission: () => {
      const check: unknown = Reflect.get(graph, "assertDurableAdmission");
      const row = graph.db.query("SELECT * FROM ff8_graph_outbox WHERE execution_id=?").get(executionId);
      if (typeof check !== "function" || !row) throw new Error("OFFLINE historical admission entry/row required");
      Reflect.apply(check, graph, [row]);
    },
    updatePermit: (patch: Partial<NativeRuntimeHostVerificationV1["permit"]>) => { permitOverride = { ...permitOverride, ...patch }; },
    assertReopenIntegrity: () => { const reopened = new GraphStore(path, { parentAuthority: provider }); reopened.close(); },
    legacyClient: (transport: RpcTransport, token: () => string) => new ExecutionClient({ transport, token, statePath: path, directory: rootDir,
      principalId: "OFFLINE", controllerId: controller, teamName: "OFFLINE", leaseMs: 300000, maxRunning: 1 }),
    close: () => { client.close(); graph.close(); store.close(); rmSync(rootDir, { recursive: true, force: true }); } };
}

/** Independent literal OFFLINE remote transcript, never a native witness. */
function offlineRuntimeCompletion(s: ReturnType<typeof nativeOfflineCase>) {
  const model = s.admission.command.model, profile = s.admission.command.profile;
  if (typeof model !== "object" || model === null || Array.isArray(model)
    || Object.keys(model).some(k => !["providerID", "id", "variant"].includes(k))
    || !("providerID" in model) || typeof model.providerID !== "string" || model.providerID.trim().length === 0
    || !("id" in model) || typeof model.id !== "string" || model.id.trim().length === 0
    || !("variant" in model) || typeof model.variant !== "string" || model.variant.trim().length === 0
    || typeof profile !== "string" || profile.trim().length === 0) throw new Error("OFFLINE closed explicit model/profile required");
  const message = { id: "msg_OFFLINE_assistant", type: "assistant", agent: profile,
    model: { providerID: model.providerID, id: model.id, variant: model.variant }, time: { completed: 1004 }, finish: "stop",
    content: [{ type: "text", text: "OFFLINE completion DATA, not scientific result" }] };
  const events = [
    { type: "session.execution.started", data: { sessionID: s.wire.sessionId } },
    { type: "session.inbox.delivered", data: { sessionID: s.wire.sessionId, inboxID: s.wire.messageId } },
    { type: "session.step.ended", data: { sessionID: s.wire.sessionId, assistantMessageID: message.id } },
    { type: "session.execution.succeeded", data: { sessionID: s.wire.sessionId } },
  ].map((event, i) => ({ ...event, id: `evt_OFFLINE_${i + 1}`, created: 1001 + i,
    durable: { version: 1, aggregateID: s.wire.sessionId, seq: i + 1 } }));
  const frames = [...events, { type: "log.synced", aggregateID: s.wire.sessionId, seq: 4 }].map(e => `data: ${JSON.stringify(e)}\n\n`).join("");
  const data: NativeRuntimeObservationV2 = { version: "rms-native-runtime-observation-v2", imageSha256: s.sha(canonical(s.wire)),
    sessionId: s.wire.sessionId, messageId: s.wire.messageId, after: null, watermark: 4, complete: true,
    facts: events.map(e => ({ seq: e.durable.seq, type: e.type, sha256: s.sha(canonical({ domain: "native-runtime-event-v2", data: e })),
      inboxId: "inboxID" in e.data && typeof e.data.inboxID === "string" ? e.data.inboxID : null,
      assistantMessageId: "assistantMessageID" in e.data && typeof e.data.assistantMessageID === "string" ? e.data.assistantMessageID : null })),
    assistant: { id: message.id, profile: message.agent, model: message.model, completed: 1004, finish: "stop",
      textSha256: s.sha(message.content[0]!.text), messageSha256: s.sha(canonical(message)) }, terminalProof: null, reason: "OK" };
  return { data, response: (route: string): Response | undefined => route.includes("/log?")
    ? new Response(frames, { headers: { "content-type": "text/event-stream" } })
    : route.endsWith(`/message/${message.id}`) ? Response.json({ data: message }) : undefined };
}
function setup(loseReply = false) {
  const root = mkdtempSync(join(tmpdir(), "ff8-client-")); const requests: Record<string, unknown>[] = [];
  let revision = 1; let lost = false; const receipts = new Map<string, Record<string, unknown>>();
  const transport: RpcTransport = { async call(method, input) {
    if (method === "capabilities") return { version: 1, capabilities: { rpc: "ensemble.execution.v1", fresh: true, replay: true } };
    if (method === "ensureTeam") return { version: 1, revision, teamId: "team-test", leadSessionId: "ses-test" };
    if (method === "snapshot") return { version: 1, revision, cursor: 2, admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: false }, executions: [...receipts.values()] };
    if (method === "replay") return { version: 1, cursor: 2, events: [{ version: 1, id: 1, missionId: "m", kind: "accepted" }, { version: 1, id: 1, missionId: "m", kind: "accepted" }, { version: 1, id: 2, missionId: "m", kind: "completed" }] };
    if (method === "control") return { version: 1, revision: ++revision };
    if (method === "submit") { requests.push(input); const key = String(input.idempotencyKey); let r = receipts.get(key); if (!r) { if (input.expectedRevision !== revision) throw new Error("stale remote revision"); r = { version: 1, revision: ++revision, executionId: input.executionId, state: "accepted" }; receipts.set(key, r); } if (loseReply && !lost) { lost = true; throw new Error("lost response"); } return r; }
    throw new Error(method);
  } };
  const options = { transport, statePath: join(root, "client.db"), directory: root, principalId: "op", token: () => "TOP-SECRET", controllerId: "ctl", teamName: "external-test", leaseMs: 300000, maxRunning: 2 };
  const cleanup = () => rmSync(root, { recursive: true, force: true });
  return { client: new ExecutionClient(options), options, requests, cleanup, receipts };
}
test("RMSN- parent library import exposes no issuer/composer and model metadata excludes variant secrets", () => {
  expect(Object.hasOwn(clientModule, "issueOwnedParentInvocationV1")).toBe(false);
  expect(Object.hasOwn(clientModule, "composeNativeQualificationV1")).toBe(false);
  expect(Object.hasOwn(clientModule, "parseNativeParentRequestV1")).toBe(false);
  expect(isConnectedNativeRuntimeHttpPortV1({ request: async () => { throw new Error("must not run"); } })).toBe(false);
  const m = { id: "OFFLINE", modelID: "OFFLINE", providerID: "openai", enabled: true, status: "active", capabilities: { text: true },
    variants: [{ id: "high", headers: { secret: "NOT-FOR-PROJECTION" }, settings: {}, body: { secret: "NOT-FOR-PROJECTION" } }], headers: { secret: "NOT-FOR-PROJECTION" } };
  const data = nativeModelCatalogProjectionV1(m); expect(data.variants).toEqual(["high"]);
  expect(JSON.stringify(data)).not.toContain("NOT-FOR-PROJECTION");
  m.capabilities.text = false; expect(data.capabilities).toEqual({ text: true });
  expect(() => nativeModelCatalogProjectionV1({ ...m, variants: ["high"] })).toThrow("schema unverified");
});

test("RMSN-ADDRESSBRIDGE exact literal source/native identity is immutable", () => {
  const source = Object.freeze({ sha256: "a".repeat(64), version: "RAM-identity-v1", ea: "0x10000100" });
  const native = Object.freeze({ sha256: "a".repeat(64), version: "RAM-identity-v1", ea: 268435712 });
  const before = structuredClone({ source, native });
  expect(sourceNativeFunctionIdentityMatchesV1(source, native)).toBe(true);
  expect({ source, native }).toEqual(before);
});

test("RMSN-ADDRESSBRIDGE rejects complete-identity mismatch and unsafe domains", () => {
  const source = { sha256: "a".repeat(64), version: "RAM-identity-v1", ea: "0x10000100" };
  const native = { sha256: "a".repeat(64), version: "RAM-identity-v1", ea: 268435712 };
  const cases: Array<{ name: string; source: unknown; native: unknown }> = [
    { name: "different SHA", source, native: { ...native, sha256: "b".repeat(64) } },
    { name: "no hash case folding", source: { ...source, sha256: "A".repeat(64) }, native },
    { name: "different version", source, native: { ...native, version: "RAM-identity-v2" } },
    { name: "version type", source, native: { ...native, version: 1 } },
    { name: "different address", source, native: { ...native, ea: 268435713 } },
    ...["0x10000100", 268435712.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, 0, -0, -1, 0x100000000]
      .map((ea, index) => ({ name: `native EA defect ${index}`, source, native: { ...native, ea } })),
    ...[268435712, "268435712", "not-hex", "0x0", "0x10000000000000000"]
      .map((ea, index) => ({ name: `source EA defect ${index}`, source: { ...source, ea }, native })),
    { name: "source above uint32 before conversion", source: { ...source, ea: "0x100000001" }, native: { ...native, ea: 0x100000001 } },
    { name: "no rounded unsafe source/native pair", source: { ...source, ea: "0x20000000000001" }, native: { ...native, ea: 9007199254740992 } },
    { name: "source extra is not dropped", source: { ...source, extra: "source" }, native },
    { name: "native extra is not dropped", source, native: { ...native, extra: "native" } },
    { name: "even identical extras are not valid identity shape", source: { ...source, extra: "same" }, native: { ...native, extra: "same" } },
    { name: "null source", source: null, native },
    { name: "array native", source, native: [] }
  ];
  for (const c of cases) {
    const before = structuredClone(c);
    expect({ name: c.name, matches: sourceNativeFunctionIdentityMatchesV1(c.source, c.native) }).toEqual({ name: c.name, matches: false });
    expect(c).toEqual(before);
  }
});

test("RMSN-ADDRESSBRIDGE production acquisition pipeline retains root role pass cap and debit", () => {
  // Pure matching DATA only: no issuer, acquisition, authority, DB or native work.
  const rootAccountId = "f".repeat(64);
  const source = { sha256: "a".repeat(64), version: "RAM-identity-v1", ea: "0x10000100" };
  const native = { sha256: "a".repeat(64), version: "RAM-identity-v1", ea: 268435712 };
  const grants: RootSlotGrantsV1["grants"] = [{ slot: { rootAccountId, functionIdentity: source, role: "A", pass: 1 },
    functionId: "RAM-function-only", bodyCapUtf8Bytes: 262144, reservedDebitUtf8Bytes: 131072 }];
  const grant = { functionIdentity: native, role: "A", pass: 1, capUtf8Bytes: 262144, acquiredUtf8Bytes: 131072 };
  const before = structuredClone({ grants, grant });
  expect(nativeAcquisitionGrantMatchesSourceV1(rootAccountId, grants, grant)).toBe(true);
  expect(nativeAcquisitionGrantMatchesSourceV1(rootAccountId, grants, { ...grant, capUtf8Bytes: 100, acquiredUtf8Bytes: 50 })).toBe(true);
  const cases = [
    { name: "root", root: "e".repeat(64), grant },
    { name: "role", root: rootAccountId, grant: { ...grant, role: "B" } },
    { name: "pass", root: rootAccountId, grant: { ...grant, pass: 2 } },
    { name: "identity", root: rootAccountId, grant: { ...grant, functionIdentity: { ...native, ea: 268435713 } } },
    { name: "cap", root: rootAccountId, grant: { ...grant, capUtf8Bytes: 262145 } },
    { name: "debit independent of cap", root: rootAccountId, grant: { ...grant, acquiredUtf8Bytes: 131073 } },
    { name: "zero cap", root: rootAccountId, grant: { ...grant, capUtf8Bytes: 0 } },
    { name: "zero debit", root: rootAccountId, grant: { ...grant, acquiredUtf8Bytes: 0 } },
    { name: "cap type", root: rootAccountId, grant: { ...grant, capUtf8Bytes: "262144" } },
    { name: "debit fraction", root: rootAccountId, grant: { ...grant, acquiredUtf8Bytes: 1.5 } }
  ];
  for (const c of cases) {
    const beforeCase = structuredClone(c);
    expect({ name: c.name, matches: nativeAcquisitionGrantMatchesSourceV1(c.root, grants, c.grant) }).toEqual({ name: c.name, matches: false });
    expect(c).toEqual(beforeCase);
  }
  expect({ grants, grant }).toEqual(before);
});

for (const defect of ["wrong-capability", "unknown-inventory", "zero-acquisition", "duplicate-slot"] as const)
  test(`RMSN- OFFLINE local first acquisition refuses ${defect} without any native grant/effect proof`, () => {
    const s = nativeOfflineCase(undefined, { localParent: true });
    try {
      const p = s.acquisition();
      if (defect === "unknown-inventory") {
        const inventory = readRuntimeDocumentV1(p.inventory);
        p.inventory = makeBoundDocumentV1("rms-native-inventory-attribution-v1", { ...inventory, unresolved: ["OFFLINE historical attribution UNKNOWN"] });
      } else if (defect === "zero-acquisition") p.grants[0]!.acquiredUtf8Bytes = 0;
      else if (defect === "duplicate-slot") p.grants[1] = { ...p.grants[0]!, slotKey: p.grants[1]!.slotKey };
      expect(() => s.graph().authorizeNativeRootV1(s.authority(), defect === "wrong-capability" ? { role: "parent", actorId: "forged", pid: 1 } : s.localCapability, p, 10000)).toThrow();
      expect(s.graph().db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_bindings").get()).toEqual({ n: 0 });
      expect(s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_local_decision")).toHaveLength(0);
      expect(s.calls).toHaveLength(0); s.sourceUnchanged();
    } finally { s.close(); }
  }, 600000);

test("RMSN- OFFLINE local acquisition is immutable, independently held and cannot enable a legacy route", async () => {
  const s = nativeOfflineCase(undefined, { localParent: true }); let legacy: ExecutionClient | undefined;
  try {
    const proposal = s.acquisition(), d = s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, proposal, 10000);
    expect(d.subject.version).toBe("rms-native-root-acquisition-v1"); expect(d.source.externalReceiptRef).toBeNull();
    expect(Object.isFrozen(d)).toBe(true); expect(proposal.root.slots[0]!.grantRef).not.toEqual((d.subject as NativeRootAcquisitionV1).root.slots[0]!.grantRef);
    expect((d.subject as NativeRootAcquisitionV1).root.slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17);
    expect(s.graph().db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_roots").get()).toEqual({ n: 0 });
    expect(() => s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, proposal, 10000)).toThrow("cannot replace");
    let tokens = 0, rpc = 0;
    legacy = s.legacyClient({ async call() { rpc++; throw new Error("must not run"); } }, () => { tokens++; return "OFFLINE"; });
    await expect(legacy.ensure(s.missionId)).rejects.toThrow("legacy downgrade forbidden");
    expect(tokens).toBe(0); expect(rpc).toBe(0); expect(s.calls).toHaveLength(0); s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { legacy?.close(); s.close(); }
}, 600000);

test("RMSN- OFFLINE private local revoke uses CAS and separates effect from physical permission", () => {
  const s = nativeOfflineCase(undefined, { localParent: true });
  try {
    s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 10000);
    const p = s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-local", s.root().rootAccountId, s.localPermit(), 10000);
    const revoked = s.graph().revokeNativeRuntimePermitV1(s.authority(), s.localCapability, p.id, 0, { effect: false });
    expect(revoked.rights).toEqual({ effect: false, physical: true }); expect(revoked.revision).toBe(1);
    expect(() => s.graph().revokeNativeRuntimePermitV1(s.authority(), {}, p.id, 1, { physical: false })).toThrow("owning invocation");
    expect(() => s.graph().revokeNativeRuntimePermitV1(s.authority(), s.localCapability, p.id, 0, { physical: false })).toThrow("CAS");
    expect(() => s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-replacement", s.root().rootAccountId, s.localPermit(), 10000)).toThrow("no replacement");
    expect(s.graph().nativeLocalDecisionV1(p.id)?.rights).toEqual({ effect: false, physical: true });
    s.assertReopenIntegrity(); expect(s.calls).toHaveLength(0); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE local decision rolls back if controller epoch changes during append", () => {
  const s = nativeOfflineCase(undefined, { localParent: true }); let restore = () => {};
  try {
    const g = s.graph(), real = g.events.append.bind(g.events), before = s.authority().lease.token;
    const spy = spyOn(g.events, "append").mockImplementation((...args) => {
      const e = real(...args); if (args[2] === "rms_native_local_decision") g.db.query("UPDATE ff8_missions SET lease_token=lease_token+1 WHERE id=?").run(s.missionId); return e;
    }); restore = () => spy.mockRestore();
    expect(() => g.authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 10000)).toThrow("stale or expired");
    expect(s.authority().lease.token).toBe(before); expect(g.db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_bindings").get()).toEqual({ n: 0 });
    expect(s.calls).toHaveLength(0); s.sourceUnchanged();
  } finally { restore(); s.close(); }
}, 600000);

for (const outlives of [false, true]) test(`RMSN- OFFLINE local permit cannot ${outlives ? "outlive" : "renew an expired"} root acquisition`, () => {
  const s = nativeOfflineCase(undefined, { localParent: true });
  try {
    const root = s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 1500);
    if (!outlives) s.setNow(2000);
    const before = s.graph().events.cursor(s.missionId);
    expect(() => s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-too-late", root.rootAccountId, s.localPermit(), 8000))
      .toThrow("unexpired authentic acquired root");
    expect(s.graph().events.cursor(s.missionId)).toEqual(before);
    expect(s.graph().nativeLocalDecisionV1(root.id)).toEqual(root);
    expect(s.graph().db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_bindings WHERE binding_id LIKE 'host-permit:%'").get()).toEqual({ n: 0 });
    expect(s.calls).toHaveLength(0); s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const purpose of ["effect", "physical-observation"] as const)
  test(`RMSN- OFFLINE acquisition expiry during authenticated await refuses ${purpose} before IO`, async () => {
    let expire = () => {}, reachedAwait = 0;
    const s = nativeOfflineCase(undefined, { localParent: true, refresh: async e => { await Promise.resolve(); if (e.purpose === purpose) { reachedAwait++; expire(); } } });
    try {
      const root = s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 1500);
      s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-timed", root.rootAccountId, s.localPermit(), 1500);
      const handle = s.start(), before = canonical(s.root());
      expect(s.graph().db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_operations").get()).toEqual({ n: 1 });
      expect(readRuntimeDocumentV1(handle.binding).stateOwner).toBe("graph-store-native-v1"); expect(reachedAwait).toBe(0);
      expire = () => s.setNow(2000);
      await expect(purpose === "effect" ? handle.submit() : handle.observe()).rejects.toThrow("expired or revoked");
      expect(reachedAwait).toBe(1);
      expect(s.calls).toHaveLength(0); expect(canonical(s.root())).toBe(before);
      expect(s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get()).toEqual({ create_claim: 0, prompt_claim: 0, revision: 0 });
      expect(s.graph().events.read(s.missionId).filter(e => ["rms_native_runtime_observation", "rms_native_interval_data"].includes(e.kind))).toHaveLength(0);
      s.assertReopenIntegrity(); s.sourceUnchanged();
    } finally { s.close(); }
  }, 600000);

test("RMSN- OFFLINE immutable native admission remains inspectable after expiry/reopen without a timed host or dispatch right", async () => {
  const s = nativeOfflineCase(undefined, { localParent: true });
  try {
    const root = s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 1500);
    s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-history", root.rootAccountId, s.localPermit(), 1500);
    const handle = s.start(), beforeRoot = canonical(s.root()), beforeEvents = s.graph().events.cursor(s.missionId);
    s.setNow(2000); s.revoke(); s.revokePhysical();
    const beforeChecks = s.runtimeChecks();
    expect(() => s.assertHistoricalAdmission()).not.toThrow(); expect(s.runtimeChecks()).toBe(beforeChecks);
    const reopened = s.reopen(); expect(() => s.assertHistoricalAdmission()).not.toThrow(); expect(s.runtimeChecks()).toBe(beforeChecks);
    expect(reopened.binding).toEqual(handle.binding);
    expect(s.graph().events.cursor(s.missionId)).toEqual(beforeEvents); expect(canonical(s.root())).toBe(beforeRoot);
    await expect(reopened.submit()).rejects.toThrow("expired or revoked");
    expect(s.calls).toHaveLength(0); expect(s.graph().db.query("SELECT create_claim,prompt_claim FROM ff8_graph_native_operations").get()).toEqual({ create_claim: 0, prompt_claim: 0 });
    s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const changed of ["pin", "event", "image", "role"] as const)
  test(`RMSN- OFFLINE historical native integrity after expiry still refuses changed ${changed}`, () => {
    const s = nativeOfflineCase(undefined, { localParent: true });
    try {
      const root = s.graph().authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 1500);
      s.graph().grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-history-corrupt", root.rootAccountId, s.localPermit(), 1500);
      s.start(); s.setNow(2000); const g = s.graph();
      expect(() => s.assertHistoricalAdmission()).not.toThrow();
      if (changed === "image") {
        const row = g.db.query("SELECT document FROM ff8_graph_native_operations WHERE execution_id=?").get(s.admission.executionId) as { document: string };
        const op = JSON.parse(row.document); op.wire.prompt.utf8 += " ";
        // A self-consistent row hash is not the original committed image/event.
        g.db.query("UPDATE ff8_graph_native_operations SET document=?,digest=? WHERE execution_id=?").run(canonical(op), fingerprint(op), s.admission.executionId);
      } else {
        const row = g.db.query("SELECT document,event_key FROM ff8_graph_input_pins WHERE mission=? AND unit_id=? AND sub_intent=?")
          .get(s.missionId, s.unit.unitId, s.admission.subIntentId) as { document: string; event_key: string };
        const pin = JSON.parse(row.document) as AdmissionInputPin;
        const event = g.db.query("SELECT kind,time,unit_id,payload FROM ff8_events WHERE mission=? AND key=?").get(s.missionId, row.event_key) as {
          kind: string; time: number; unit_id: string | null; payload: string };
        if (changed === "pin") {
          pin.snapshotId += ":OFFLINE-forged";
          g.db.query("UPDATE ff8_graph_input_pins SET document=?,digest=? WHERE mission=? AND event_key=?").run(canonical(pin), fingerprint(pin), s.missionId, row.event_key);
        } else {
          const payload = JSON.parse(event.payload) as AdmissionInputPin;
          if (changed === "role") {
            pin.role = "B"; payload.role = "B";
            g.db.query("UPDATE ff8_graph_input_pins SET document=?,digest=? WHERE mission=? AND event_key=?").run(canonical(pin), fingerprint(pin), s.missionId, row.event_key);
          } else payload.planFingerprint = s.sha("OFFLINE forged input-pin event plan");
          g.db.query("UPDATE ff8_events SET payload=?,digest=? WHERE mission=? AND key=?")
            .run(canonical(payload), fingerprint({ kind: event.kind, time: event.time, unitId: event.unit_id, payload }), s.missionId, row.event_key);
        }
      }
      const beforeChecks = s.runtimeChecks(); expect(() => s.assertHistoricalAdmission()).toThrow(); expect(s.runtimeChecks()).toBe(beforeChecks);
      expect(s.calls).toHaveLength(0); s.sourceUnchanged();
    } finally { s.close(); }
  }, 600000);

test("RMSN- OFFLINE permit scope interposition across two connections is refused inside IMMEDIATE and revoked scope stays unique", () => {
  const s = nativeOfflineCase(undefined, { localParent: true }); let peer: GraphStore | undefined, restore = () => {};
  try {
    const g = s.graph(), root = g.authorizeNativeRootV1(s.authority(), s.localCapability, s.acquisition(), 10000);
    peer = s.openLocalPeer(); const other = peer, query = g.db.query.bind(g.db);
    let armed = true, interpositions = 0;
    const result: { committed?: ReturnType<GraphStore["grantNativeRuntimePermitV1"]> } = {};
    const intercept = spyOn(g.db, "query").mockImplementation(function(sql: string) {
      const statement = query(sql);
      if (sql !== "SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'host-permit:%'") return statement;
      return new Proxy(statement, { get(target, property) {
        if (property === "all") return (...params: any[]) => {
          const rows = target.all(...params);
          // B commits AFTER A's empty preflight result, before A enters IMMEDIATE.
          if (armed && rows.length === 0) {
            armed = false; interpositions++;
            result.committed = other.grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-winner", root.rootAccountId, s.localPermit(), 10000);
          }
          return rows;
        };
        const value = Reflect.get(target, property, target); return typeof value === "function" ? value.bind(target) : value;
      } });
    } as typeof Database.prototype.query); restore = () => intercept.mockRestore();
    expect(() => g.grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-loser", root.rootAccountId, s.localPermit(), 10000))
      .toThrow("scope already retained");
    restore(); expect(interpositions).toBe(1); if (!result.committed) throw new Error("OFFLINE interposition did not commit");
    const winner = result.committed;
    const retained = g.db.query("SELECT document FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'host-permit:%'").all(s.missionId) as Array<{ document: string }>;
    expect(retained.map(r => JSON.parse(r.document))).toEqual([winner]);
    const events = g.events.read(s.missionId).filter(e => e.kind === "rms_native_local_decision" && (e.payload as { id: string }).id.startsWith("host-permit:"));
    expect(events).toHaveLength(1); expect(events[0]!.payload).toEqual(winner); expect(events[0]!.key).toBe(`rms.native.local:${winner.id}:0`);
    other.revokeNativeRuntimePermitV1(s.authority(), s.localCapability, winner.id, 0, { effect: false, physical: false });
    expect(() => g.grantNativeRuntimePermitV1(s.authority(), s.localCapability, "OFFLINE-replacement", root.rootAccountId, s.localPermit(), 10000)).toThrow("no replacement");
    expect(g.db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_bindings WHERE binding_id LIKE 'host-permit:%'").get()).toEqual({ n: 1 });
    expect(s.calls).toHaveLength(0); s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { restore(); peer?.close(); s.close(); }
}, 600000);

for (const reducedCap of [false, true]) test(`RMSN- OFFLINE post-receipt author refresh failure preserves exact DATA/cursor${reducedCap ? " with cap1" : ""} but no witness`, async () => {
  let expected: NativeRuntimeObservationV2 | undefined, postRefresh = 0, authorChecks = 0;
  const s = nativeOfflineCase(undefined, { refresh: async (_e, graph, data) => {
    if (!data) return;
    if (expected === undefined) throw new Error("OFFLINE expected observation must be established before author refresh");
    postRefresh++; expect(data).toEqual(expected);
    const witness = new Database(graph.path, { readonly: true });
    try {
      const rows = witness.query("SELECT payload FROM ff8_events WHERE kind='rms_native_runtime_observation'").all() as Array<{ payload: string }>;
      expect(rows.map(r => JSON.parse(r.payload))).toEqual([expected]);
    } finally { witness.close(); }
    throw new Error("OFFLINE GETinfo author refresh failed after committed DATA");
  }, author: () => { authorChecks++; throw new Error("OFFLINE stale author must not be consulted"); } });
  try {
    const handle = s.start(), transcript = offlineRuntimeCompletion(s); expected = transcript.data; s.onGet(transcript.response);
    if (reducedCap) s.updatePermit({ maxBodyUtf8Bytes: 1 }); s.revoke();
    const rootBefore = canonical(s.root()), leaseBefore = s.graph().leases.get(s.missionId, s.unit.unitId);
    await expect(handle.observe()).rejects.toThrow("author refresh failed after committed DATA");
    const observations = s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_runtime_observation");
    expect(observations).toHaveLength(1); expect(observations[0]!.payload).toEqual(transcript.data);
    expect(s.graph().events.cursor(s.missionId).sequence).toBe(observations[0]!.sequence);
    expect(postRefresh).toBe(1); expect(authorChecks).toBe(0);
    expect(s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_interval_data")).toHaveLength(0);
    expect(s.calls.every(c => c.method === "GET")).toBe(true); expect(canonical(s.root())).toBe(rootBefore);
    expect(s.graph().leases.get(s.missionId, s.unit.unitId)).toEqual(leaseBefore);
    s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE physical revocation during DATA append rolls back receipt and never starts author refresh", async () => {
  let postRefresh = 0; const s = nativeOfflineCase(undefined, { refresh: async (_e, _g, data) => { if (data) postRefresh++; } });
  let restore = () => {};
  try {
    const handle = s.start(), transcript = offlineRuntimeCompletion(s); s.onGet(transcript.response);
    const g = s.graph(), before = g.events.cursor(s.missionId), append = g.events.append.bind(g.events);
    const intercept = spyOn(g.events, "append").mockImplementation((...args) => {
      const event = append(...args); if (args[2] === "rms_native_runtime_observation") s.revokePhysical(); return event;
    }); restore = () => intercept.mockRestore();
    await expect(handle.observe()).rejects.toThrow("host authority");
    expect(postRefresh).toBe(0); expect(g.events.cursor(s.missionId)).toEqual(before);
    expect(g.events.read(s.missionId).filter(e => ["rms_native_runtime_observation", "rms_native_interval_data"].includes(e.kind))).toHaveLength(0);
    expect(s.calls.every(c => c.method === "GET")).toBe(true); s.sourceUnchanged();
  } finally { restore(); s.close(); }
}, 600000);

test("RMSN- OFFLINE divergent observation conservation CAS refuses without replacing the independently committed cursor", async () => {
  const s = nativeOfflineCase(); let peer: GraphStore | undefined;
  try {
    const handle = s.start(), transcript = offlineRuntimeCompletion(s); peer = s.openLocalPeer(); const other = peer;
    let infoReads = 0;
    const competing: NativeRuntimeObservationV2 = { ...transcript.data, facts: transcript.data.facts.slice(0, 2), assistant: null, watermark: 2 };
    s.onGet(route => {
      if (route === "/api/info" && ++infoReads === 2) {
        const cursor = other.events.cursor(s.missionId);
        other.events.append(s.missionId, "OFFLINE-independent-competing-cursor", "rms_native_runtime_observation", 1000, competing, s.unit.unitId, cursor.sequence);
      }
      return transcript.response(route);
    });
    await expect(handle.observe()).rejects.toThrow("observation cursor CAS changed");
    const observations = s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_runtime_observation");
    expect(infoReads).toBe(2); expect(observations).toHaveLength(1); expect(observations[0]!.payload).toEqual(competing);
    expect(s.graph().events.cursor(s.missionId).sequence).toBe(observations[0]!.sequence);
    expect(s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_interval_data")).toHaveLength(0);
    expect(s.calls.every(c => c.method === "GET")).toBe(true); s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { peer?.close(); s.close(); }
}, 600000);

test("RMSN- OFFLINE witness append failure cannot roll back already committed observation DATA", async () => {
  let expected: NativeRuntimeObservationV2 | undefined, witnessAttempts = 0;
  const s = nativeOfflineCase(undefined, { refresh: async () => {}, author: (_a, e) => {
    if (!expected?.assistant) throw new Error("OFFLINE explicit assistant missing");
    return { version: 1, missionId: e.missionId, executionId: e.executionId, requestDigest: e.requestDigest, authorId: e.executionId,
      sessionId: expected.sessionId, profile: expected.assistant.profile, model: expected.assistant.model, fresh: true, parentSessionId: null,
      source: "OFFLINE author only, not native qualification", sourceHash: "a".repeat(64) };
  } }); let restore = () => {};
  try {
    const handle = s.start(), transcript = offlineRuntimeCompletion(s); expected = transcript.data; s.onGet(transcript.response);
    const g = s.graph(), append = g.events.append.bind(g.events);
    const intercept = spyOn(g.events, "append").mockImplementation((...args) => {
      const event = append(...args);
      if (args[2] === "rms_native_interval_data") { witnessAttempts++; throw new Error("OFFLINE witness append refused"); } return event;
    }); restore = () => intercept.mockRestore();
    await expect(handle.observe()).rejects.toThrow("witness append refused");
    expect(witnessAttempts).toBe(1);
    const observations = g.events.read(s.missionId).filter(e => e.kind === "rms_native_runtime_observation");
    expect(observations).toHaveLength(1); expect(observations[0]!.payload).toEqual(transcript.data);
    expect(g.events.cursor(s.missionId).sequence).toBe(observations[0]!.sequence);
    expect(g.events.read(s.missionId).filter(e => e.kind === "rms_native_interval_data")).toHaveLength(0);
    expect(s.calls.every(c => c.method === "GET")).toBe(true); s.assertReopenIntegrity(); s.sourceUnchanged();
  } finally { restore(); s.close(); }
}, 600000);

test("RMSN- OFFLINE async authenticated refresh refuses a changed controller before any IO", async () => {
  let changed = false;
  const s = nativeOfflineCase(undefined, { refresh: async (e, graph) => { await Promise.resolve();
    if (e.purpose === "effect" && !changed) { changed = true; graph.db.query("UPDATE ff8_missions SET lease_token=lease_token+1 WHERE id=?").run(e.missionId); } } });
  try {
    const handle = s.start(), before = JSON.stringify(s.root());
    await expect(handle.submit()).rejects.toThrow("changed during authenticated refresh");
    expect(s.calls).toHaveLength(0); expect(JSON.stringify(s.root())).toBe(before);
    expect(s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get()).toEqual({ create_claim: 0, prompt_claim: 0, revision: 0 }); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE async native reopen adopts the same operative lease without new origin or dispatch", async () => {
  let refreshed = 0;
  const s = nativeOfflineCase(undefined, { refresh: async () => { refreshed++; await Promise.resolve(); } });
  try {
    const original = s.start(), token = s.authority().lease.token, before = JSON.stringify(s.root()); s.reopen();
    const reopened = await s.startAsync(); expect(reopened.binding).toEqual(original.binding); expect(s.authority().lease.token).toBe(token);
    expect(refreshed).toBeGreaterThan(0); expect(s.calls).toHaveLength(0); expect(JSON.stringify(s.root())).toBe(before); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const loss of ["create", "prompt"] as const) test(`RMSN- OFFLINE exact preparation/client/owner/REST recovers lost ${loss} after reopen without another POST`, async () => {
  const s = nativeOfflineCase(loss);
  try {
    const handle = s.start();
    expect(readRuntimeDocumentV1(handle.binding).generationId).not.toBe(s.sourceGenerationId);
    expect(s.root().origins.map(o => o.originId)).toEqual(["OFFLINE-bootstrap-counted", "OFFLINE-native-origin-counted"]);
    expect(await handle.submit()).toMatchObject({ status: "AMBIGUOUS", sessionId: s.wire.sessionId, messageId: s.wire.messageId, terminalProof: null });
    const beforeReopen = s.calls.length, reopened = s.reopen();
    expect(s.calls.length).toBe(beforeReopen);
    expect(await reopened.submit()).toMatchObject({ status: "CONFIRMED", sessionId: s.wire.sessionId, messageId: s.wire.messageId, terminalProof: null });
    const posts = s.calls.filter(c => c.method === "POST");
    expect(posts.map(c => c.route)).toEqual(["/api/session", s.wire.prompt.route]);
    expect(posts[0]!.utf8).toBe(s.wire.create.utf8); expect(posts[1]!.utf8).toBe(s.wire.prompt.utf8);
    expect(s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes)
      .toBe(17 + posts.reduce((sum, c) => sum + Buffer.byteLength(c.utf8!, "utf8"), 0));
    expect(s.root().origins).toHaveLength(2);
    expect(s.graph().unit(s.missionId, s.unit.unitId).state).toBe("RESERVED");
    expect(s.graph().leases.get(s.missionId, s.unit.unitId)?.state).toBe("active");
    expect(() => s.graph().satisfies(s.missionId, s.unit.unitId, 1)).toThrow("qualification-only");
    s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE simultaneous submit claims each native POST once and preserves bootstrap debit", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); await Promise.all([handle.submit(), handle.submit()]);
    expect((await handle.submit()).status).toBe("CONFIRMED");
    const posts = s.calls.filter(c => c.method === "POST"); expect(posts).toHaveLength(2);
    expect(posts.filter(c => c.route === "/api/session")).toHaveLength(1);
    expect(posts.filter(c => c.route.endsWith("/prompt"))).toHaveLength(1);
    const slot = s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!;
    expect(slot.spentUtf8Bytes).toBe(17 + Buffer.byteLength(s.wire.create.utf8, "utf8") + Buffer.byteLength(s.wire.prompt.utf8, "utf8"));
    expect(slot.encumberedUtf8Bytes).toBe(slot.spentUtf8Bytes); expect(s.root().origins).toHaveLength(2); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const divergence of ["model", "rights"] as const) test(`RMSN- OFFLINE native ${divergence} divergence refuses prompt without refund or invented terminality`, async () => {
  const s = nativeOfflineCase();
  try {
    s.onCreate(session => { if (divergence === "model") session.model = { ...session.model, variant: "divergent" }; else session.permissions = []; });
    expect((await s.start().submit()).status).toBe("AMBIGUOUS");
    const posts = s.calls.filter(c => c.method === "POST"); expect(posts.map(c => c.route)).toEqual(["/api/session"]);
    const slot = s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!;
    expect(slot.spentUtf8Bytes).toBe(17 + Buffer.byteLength(s.wire.create.utf8, "utf8"));
    expect(slot.encumberedUtf8Bytes).toBe(17 + s.wire.totalBodyUtf8Bytes);
    expect(s.graph().admission(s.admission.executionId)?.state).not.toBe("TERMINAL"); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE revocation between await boundaries forbids following prompt and retry", async () => {
  const s = nativeOfflineCase();
  try {
    s.onCreate(() => s.revoke()); expect((await s.start().submit()).status).toBe("AMBIGUOUS");
    expect(s.calls.filter(c => c.method === "POST").map(c => c.route)).toEqual(["/api/session"]);
    const count = s.calls.length; await expect(s.handle().submit()).rejects.toThrow("host authority");
    expect(s.calls.length).toBe(count); expect(s.root().origins).toHaveLength(2); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);
for (const mismatch of ["image", "scope"] as const) test(`RMSN- OFFLINE permit for another ${mismatch} cannot prepare an operation or emit`, () => {
  const s = nativeOfflineCase();
  try {
    s.mismatchPermit(mismatch); expect(() => s.start()).toThrow("qualification permit");
    expect(s.calls).toHaveLength(0);
    expect(s.graph().db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_operations").get()).toEqual({ n: 0 });
    expect(s.root().origins).toHaveLength(1); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE postappend revocation rolls back claim/debit before native POST", async () => {
  const s = nativeOfflineCase(); let restore = () => {};
  try {
    const handle = s.start(), g = s.graph(), real = g.events.append.bind(g.events);
    const spy = spyOn(g.events, "append").mockImplementation((...args) => { const result = real(...args); if (args[2] === "rms_native_effect_engaged") s.revoke(); return result; });
    restore = () => spy.mockRestore();
    expect((await handle.submit()).status).toBe("AMBIGUOUS");
    expect(s.calls.filter(c => c.method === "POST")).toHaveLength(0);
    expect(s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17);
    expect(g.db.query("SELECT create_claim,prompt_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(s.admission.executionId)).toEqual({ create_claim: 0, prompt_claim: 0 });
    expect(g.events.read(s.missionId).filter(e => e.kind === "rms_native_effect_engaged")).toHaveLength(0); s.sourceUnchanged();
  } finally { restore(); s.close(); }
}, 600000);
test("RMSN- OFFLINE root postimage changed during append rolls back the entire preparation", () => {
  const s = nativeOfflineCase(); let restore = () => {};
  try {
    const g = s.graph(), real = g.events.append.bind(g.events);
    const spy = spyOn(g.events, "append").mockImplementation((...args) => {
      const result = real(...args);
      if (args[2] === "rms_native_operation_prepared") {
        const stored = g.db.query("SELECT root_id,document FROM ff8_graph_native_roots").get() as { root_id: string; document: string };
        const changed = JSON.parse(stored.document); changed.revision++;
        g.db.query("UPDATE ff8_graph_native_roots SET document=?,digest=?,revision=? WHERE root_id=?").run(canonical(changed), s.sha(canonical(changed)), changed.revision, stored.root_id);
      }
      return result;
    }); restore = () => spy.mockRestore();
    expect(() => s.start()).toThrow("native current root/head detached");
    expect(g.db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_operations").get()).toEqual({ n: 0 });
    expect(g.db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_roots").get()).toEqual({ n: 0 });
    expect(s.calls).toHaveLength(0); expect(s.root().origins).toHaveLength(1); s.sourceUnchanged();
  } finally { restore(); s.close(); }
}, 600000);

test("RMSN- OFFLINE correct wire cannot be sent through an unverified live transport capability", async () => {
  const s = nativeOfflineCase(); let other: ExecutionClient | undefined;
  try {
    s.start(); let calls = 0;
    other = s.alternateClient({ request: async () => { calls++; throw new Error("must not run"); } });
    await expect(other.submitRuntime(s.missionId, s.admission.executionId)).rejects.toThrow("independently verified HOST capability");
    expect(calls).toBe(0); expect(s.calls).toHaveLength(0);
    expect(s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17); s.sourceUnchanged();
  } finally { other?.close(); s.close(); }
}, 600000);

test("RMSN- OFFLINE ordered notifications reconcile lost reply, block next admission and retain one debit", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    const first = s.command("OFFLINE-notify-1", 1); s.command("OFFLINE-notify-2", 2); s.loseNextNotification();
    expect(await handle.notify(first.request.commandId)).toBeNull();
    const beforeNext = s.calls.length;
    await expect(handle.notify("OFFLINE-notify-2")).rejects.toThrow("previous command admission unknown");
    expect(s.calls).toHaveLength(beforeNext);
    const reopened = s.reopen(); expect(s.calls).toHaveLength(beforeNext);
    expect(await reopened.notify("OFFLINE-notify-1")).toMatchObject({ commandId: "OFFLINE-notify-1", state: "admitted", applicationProven: false });
    expect(await reopened.notify("OFFLINE-notify-2")).toMatchObject({ commandId: "OFFLINE-notify-2", state: "admitted", applicationProven: false });
    const beforeRetry = s.calls.length, receipt = await reopened.notify("OFFLINE-notify-1");
    expect(receipt).toMatchObject({ imageDigest: first.receipt.imageDigest }); expect(s.calls).toHaveLength(beforeRetry);
    const posts = s.calls.filter(c => c.method === "POST"); expect(posts).toHaveLength(4);
    const notifications = posts.filter(c => c.route.endsWith("/prompt") && JSON.parse(c.utf8!).id !== s.wire.messageId);
    expect(notifications.map(c => JSON.parse(JSON.parse(c.utf8!).text).request.sequence)).toEqual([1, 2]);
    expect(notifications.every(c => JSON.parse(c.utf8!).resume === false && JSON.parse(c.utf8!).delivery === "queue")).toBe(true);
    expect(s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17 + posts.reduce((sum, c) => sum + Buffer.byteLength(c.utf8!, "utf8"), 0));
    expect(s.root().origins).toHaveLength(2);
    expect(() => s.graph().retainOrderedCommandV1(s.authority(), { ...first.request, reason: "divergent under same command identity" })).toThrow("identity diverged");
    expect(s.calls).toHaveLength(beforeRetry); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE obsolete work cannot retry after reopen while late DATA preserves ownership and cost", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    const beforeRoot = JSON.stringify(s.root()), beforeLease = s.graph().leases.get(s.missionId, s.unit.unitId);
    s.command("OFFLINE-obsolete", 1, "obsolete", false);
    const calls = s.calls.length;
    await expect(handle.submit()).rejects.toThrow("obsolete"); expect(s.calls).toHaveLength(calls);
    const reopened = s.reopen(); expect(s.calls).toHaveLength(calls);
    await expect(reopened.submit()).rejects.toThrow("obsolete"); expect(s.calls).toHaveLength(calls);
    const data = await reopened.observe(); expect(data.complete).toBe(true); expect(data.terminalProof).toBeNull();
    expect(s.graph().leases.get(s.missionId, s.unit.unitId)).toEqual(beforeLease);
    expect(JSON.stringify(s.root())).toBe(beforeRoot);
    expect(s.graph().unit(s.missionId, s.unit.unitId).state).toBe("RESERVED");
    expect(s.calls.filter(c => c.method === "POST")).toHaveLength(2); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);
test("RMSN- OFFLINE obsolete admission with cap1 still permits owned late GET DATA but no effect or consumption", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    const beforeRoot = JSON.stringify(s.root()), beforeLease = s.graph().leases.get(s.missionId, s.unit.unitId);
    if (!beforeLease) throw new Error("OFFLINE physical lease missing");
    const beforeClaims = s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get();
    s.command("OFFLINE-obsolete-cap-reduced", 1, "obsolete", false);
    await expect(handle.submit()).rejects.toThrow("obsolete");
    s.updatePermit({ maxBodyUtf8Bytes: 1 });
    const count = s.calls.length, reopened = s.reopen(); expect(s.calls).toHaveLength(count);
    await expect(reopened.submit()).rejects.toThrow("body cap"); expect(s.calls).toHaveLength(count);
    const data = await reopened.observe(); expect(data.complete).toBe(true); expect(data.terminalProof).toBeNull();
    const reads = s.calls.slice(count); expect(reads.length).toBeGreaterThan(0); expect(reads.every(c => c.method === "GET")).toBe(true);
    expect(s.graph().events.read(s.missionId).filter(e => e.kind === "rms_native_runtime_observation").at(-1)?.payload).toEqual(data);
    const resultId = "OFFLINE-late-result-not-scientific";
    expect(s.graph().retainResult(s.authority(), beforeLease, s.admission.executionId, resultId,
      { version: "OFFLINE-late-result-DATA", executionId: s.admission.executionId, evidence: "simulation only, no native result" })).toBe(false);
    expect(() => s.graph().assertResultCurrent(s.missionId, s.unit.unitId, resultId)).toThrow("obsolete");
    expect(s.graph().db.query("SELECT eligible FROM ff8_graph_results WHERE mission=? AND result_id=?").get(s.missionId, resultId)).toEqual({ eligible: 0 });
    expect(s.graph().leases.get(s.missionId, s.unit.unitId)).toEqual(beforeLease); expect(JSON.stringify(s.root())).toBe(beforeRoot);
    expect(s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get()).toEqual(beforeClaims);
    expect(s.calls.filter(c => c.method === "POST")).toHaveLength(2);
    const beforeRevocation = s.calls.length; s.revokePhysical();
    await expect(reopened.observe()).rejects.toThrow("host authority"); expect(s.calls).toHaveLength(beforeRevocation);
    expect(JSON.stringify(s.root())).toBe(beforeRoot); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const changed of ["origin", "slot"] as const) test(`RMSN- OFFLINE late observation with reduced cap still refuses substituted ${changed}`, async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    s.updatePermit({ maxBodyUtf8Bytes: 1, ...(changed === "origin" ? { originId: "OFFLINE-bootstrap-counted" } : { slotKey: "OFFLINE:B" }) });
    const count = s.calls.length, before = JSON.stringify(s.root());
    await expect(handle.observe()).rejects.toThrow("stable grant");
    expect(s.calls).toHaveLength(count); expect(JSON.stringify(s.root())).toBe(before); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);
const body = { executionId: "exec-1", taskId: "task-1", attemptId: "attempt-1", idempotencyKey: "key-1", prompt: "exact dossier", profile: "worker", model: { providerID: "fixture", id: "model", variant: "high" } };
test("RMSN- OFFLINE durable native identities cannot downgrade through client or graph legacy routes", async () => {
  const s = nativeOfflineCase(); let legacy: ExecutionClient | undefined;
  try {
    s.start(); let tokens = 0, rpc = 0;
    legacy = s.legacyClient({ async call() { rpc++; throw new Error("legacy transport must not run"); } }, () => { tokens++; return "OFFLINE"; });
    for (const mission of [s.missionId, "OFFLINE-supplied-mission-alias"]) {
      await expect(legacy.submit(mission, structuredClone(s.admission.command))).rejects.toThrow("legacy downgrade forbidden");
    }
    await expect(legacy.ensure(s.missionId)).rejects.toThrow("legacy downgrade forbidden");
    const lease = s.graph().leases.get(s.missionId, s.unit.unitId); if (!lease) throw new Error("native lease missing");
    await expect(s.graph().dispatch(s.authority(), lease, s.admission.executionId, { submit: async () => { rpc++; throw new Error("must not run"); } }))
      .rejects.toThrow("legacy downgrade forbidden");
    expect(() => s.graph().proveTerminal(s.authority(), s.unit.unitId, s.admission.executionId, "completed", { fixture: true }))
      .toThrow("legacy downgrade forbidden");
    expect(tokens).toBe(0); expect(rpc).toBe(0); expect(s.calls).toHaveLength(0);
    expect(s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!.spentUtf8Bytes).toBe(17); s.sourceUnchanged();
  } finally { legacy?.close(); s.close(); }
}, 600000);

test("RMSN- OFFLINE native retention during legacy await refuses its response and further RPC", async () => {
  const s = nativeOfflineCase(); let legacy: ExecutionClient | undefined;
  try {
    let rpc = 0, tokens = 0;
    legacy = s.legacyClient({ async call(method) {
      rpc++; expect(method).toBe("capabilities"); s.start();
      return { version: 1, capabilities: { rpc: "ensemble.execution.v1", fresh: true, replay: true } };
    } }, () => { tokens++; return "OFFLINE"; });
    await expect(legacy.ensure(s.missionId)).rejects.toThrow("legacy downgrade forbidden");
    expect(rpc).toBe(1); expect(tokens).toBe(1); expect(s.calls).toHaveLength(0);
    await expect(legacy.submit(s.missionId, s.admission.command)).rejects.toThrow("legacy downgrade forbidden");
    expect(rpc).toBe(1); expect(tokens).toBe(1); s.sourceUnchanged();
  } finally { legacy?.close(); s.close(); }
}, 600000);

test("RMSN- OFFLINE lost private operation does not erase native classification for legacy fallback", async () => {
  const s = nativeOfflineCase(); let legacy: ExecutionClient | undefined;
  try {
    s.start(); let tokens = 0, rpc = 0;
    legacy = s.legacyClient({ async call() { rpc++; throw new Error("must not run"); } }, () => { tokens++; return "OFFLINE"; });
    s.graph().db.query("DELETE FROM ff8_graph_native_operations WHERE execution_id=?").run(s.admission.executionId);
    await expect(legacy.submit("OFFLINE-mission-alias", s.admission.command)).rejects.toThrow();
    expect(tokens).toBe(0); expect(rpc).toBe(0); expect(s.calls).toHaveLength(0);
    expect(() => s.assertReopenIntegrity()).toThrow(); s.sourceUnchanged();
  } finally { legacy?.close(); s.close(); }
}, 600000);

for (const changed of ["cap", "origin", "slot"] as const) test(`RMSN- OFFLINE current ${changed} cannot replace retained native grant before IO or after reopen`, async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(), before = JSON.stringify(s.root());
    s.updatePermit(changed === "cap" ? { maxBodyUtf8Bytes: 1 } : changed === "origin" ? { originId: "OFFLINE-substituted-origin" } : { slotKey: "OFFLINE:B" });
    await expect(handle.submit()).rejects.toThrow(changed === "cap" ? "body cap" : "stable grant");
    expect(s.calls).toHaveLength(0); expect(JSON.stringify(s.root())).toBe(before);
    const reopened = s.reopen(); await expect(reopened.submit()).rejects.toThrow(changed === "cap" ? "body cap" : "stable grant");
    expect(s.calls).toHaveLength(0); expect(JSON.stringify(s.root())).toBe(before); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE renewed proof refs preserve grant and allow only the same exact effects", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(), retained = s.graph().db.query("SELECT document,digest FROM ff8_graph_native_operations").get();
    const renewed = makeBoundDocumentV1("OFFLINE-renewed-proof-NOT-NATIVE", { revision: 2 }).ref;
    s.updatePermit({ proofRefs: [renewed], physicalOwnershipRef: renewed });
    expect((await handle.submit()).status).toBe("CONFIRMED");
    s.command("OFFLINE-renewable-grant", 1); expect(await handle.notify("OFFLINE-renewable-grant")).toMatchObject({ state: "admitted" });
    const later = makeBoundDocumentV1("OFFLINE-renewed-proof-NOT-NATIVE", { revision: 3 }).ref;
    s.updatePermit({ proofRefs: [later], physicalOwnershipRef: later });
    const before = JSON.stringify(s.root()), count = s.calls.length;
    expect(await handle.notify("OFFLINE-renewable-grant")).toMatchObject({ state: "admitted" });
    expect(s.calls).toHaveLength(count); expect(JSON.stringify(s.root())).toBe(before);
    expect(s.graph().db.query("SELECT document,digest FROM ff8_graph_native_operations").get()).toEqual(retained);
    expect(s.calls.filter(c => c.method === "POST")).toHaveLength(3); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE current cap reduction after create forbids prompt without refund", async () => {
  const s = nativeOfflineCase();
  try {
    let responseHash: string | undefined;
    s.onCreate(created => { responseHash = s.sha(JSON.stringify({ data: created })); s.updatePermit({ maxBodyUtf8Bytes: 1 }); });
    expect((await s.start().submit()).status).toBe("AMBIGUOUS");
    if (!responseHash) throw new Error("OFFLINE create response hash absent");
    expect(s.graph().events.read(s.missionId).some(e => e.kind === "rms_native_io_data" && (e.payload as any).phase === "POST:/api/session"
      && (e.payload as any).responseSha256 === responseHash && (e.payload as any).terminalProof === null)).toBe(true);
    expect(s.calls.filter(c => c.method === "POST").map(c => c.route)).toEqual(["/api/session"]);
    const slot = s.root().slots.find(slot => slot.slotKey === "OFFLINE:A")!;
    expect(slot.spentUtf8Bytes).toBe(17 + s.wire.create.byteLength); expect(slot.encumberedUtf8Bytes).toBe(17 + s.wire.totalBodyUtf8Bytes);
    expect(s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get()).toEqual({ create_claim: 1, prompt_claim: 0, revision: 1 });
    const count = s.calls.length; await expect(s.handle().submit()).rejects.toThrow("body cap"); expect(s.calls).toHaveLength(count);
    s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE notification response DATA survives a reduced cap without a second effect", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    const commandId = "OFFLINE-notification-cap-changed-after-effect"; s.command(commandId, 1);
    let responseHash: string | undefined;
    s.onNotification(item => { responseHash = s.sha(JSON.stringify({ data: item })); s.updatePermit({ maxBodyUtf8Bytes: 1 }); });
    await expect(handle.notify(commandId)).rejects.toThrow("body cap");
    if (!responseHash) throw new Error("OFFLINE notification response hash absent");
    expect(s.graph().events.read(s.missionId).some(e => e.kind === "rms_native_ordered_io_data"
      && (e.payload as any).commandId === commandId && (e.payload as any).phase === `POST:${s.wire.prompt.route}`
      && (e.payload as any).responseSha256 === responseHash && (e.payload as any).applicationProven === false)).toBe(true);
    expect(s.calls.filter(c => c.method === "POST")).toHaveLength(3);
    const before = JSON.stringify(s.root()), claims = s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get(), count = s.calls.length;
    expect(s.graph().db.query("SELECT delivery,remote_receipt FROM ff8_graph_ordered_commands WHERE command_id=?").get(commandId)).toEqual({ delivery: "SENDING", remote_receipt: null });
    await expect(handle.notify(commandId)).rejects.toThrow("body cap"); expect(s.calls).toHaveLength(count);
    s.updatePermit({ maxBodyUtf8Bytes: 100000 });
    expect(await handle.notify(commandId)).toMatchObject({ state: "admitted", applicationProven: false });
    expect(s.calls.slice(count).every(c => c.method === "GET")).toBe(true); expect(s.calls.filter(c => c.method === "POST")).toHaveLength(3);
    expect(JSON.stringify(s.root())).toBe(before);
    expect(s.graph().db.query("SELECT create_claim,prompt_claim,revision FROM ff8_graph_native_operations").get()).toEqual(claims); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- OFFLINE retained notification grant cannot substitute origin or bypass a reduced cap", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    s.command("OFFLINE-notification-current-grant", 1); s.loseNextNotification();
    expect(await handle.notify("OFFLINE-notification-current-grant")).toBeNull();
    const count = s.calls.length, before = JSON.stringify(s.root());
    s.updatePermit({ maxBodyUtf8Bytes: 1 });
    await expect(handle.notify("OFFLINE-notification-current-grant")).rejects.toThrow("body cap");
    s.updatePermit({ maxBodyUtf8Bytes: 100000, originId: "OFFLINE-bootstrap-counted" });
    await expect(handle.notify("OFFLINE-notification-current-grant")).rejects.toThrow("stable grant");
    expect(s.calls).toHaveLength(count); expect(JSON.stringify(s.root())).toBe(before); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

for (const corrupt of ["rootDigest", "rehashedRootDigest", "eventUnit", "eventTime", "eventKind", "eventKey", "createClaim", "revision", "rootRevision"] as const)
  test(`RMSN- OFFLINE corrupt ${corrupt} fails closed before effect and reopen`, async () => {
    const s = nativeOfflineCase();
    try {
      const handle = s.start(), g = s.graph();
      if (corrupt === "createClaim") g.db.query("UPDATE ff8_graph_native_operations SET create_claim=1,revision=1").run();
      else if (corrupt === "revision") g.db.query("UPDATE ff8_graph_native_operations SET revision=7").run();
      else if (corrupt === "rootRevision") g.db.query("UPDATE ff8_graph_native_roots SET revision=revision+1").run();
      else {
        const e = g.db.query("SELECT * FROM ff8_events WHERE kind='rms_native_operation_prepared'").get() as { mission: string; key: string; kind: string; time: number; unit_id: string; payload: string; digest: string };
        const p = JSON.parse(e.payload); let unit = e.unit_id;
        if (corrupt === "eventUnit") unit = "OFFLINE-other-unit"; else p.rootDigest = "f".repeat(64);
        const digest = corrupt === "rootDigest" ? e.digest : s.sha(canonical({ kind: e.kind, time: e.time, payload: p, unitId: unit }));
        if (corrupt === "eventTime") g.db.query("UPDATE ff8_events SET time=time+1 WHERE mission=? AND key=?").run(e.mission, e.key);
        else if (corrupt === "eventKind") g.db.query("UPDATE ff8_events SET kind='OFFLINE-substituted-kind' WHERE mission=? AND key=?").run(e.mission, e.key);
        else if (corrupt === "eventKey") g.db.query("UPDATE ff8_events SET key='OFFLINE-substituted-key' WHERE mission=? AND key=?").run(e.mission, e.key);
        else g.db.query("UPDATE ff8_events SET payload=?,unit_id=?,digest=? WHERE mission=? AND key=?").run(canonical(p), unit, digest, e.mission, e.key);
      }
      await expect(handle.submit()).rejects.toThrow(); expect(s.calls).toHaveLength(0);
      expect(() => s.assertReopenIntegrity()).toThrow(); expect(s.calls).toHaveLength(0);
      expect(g.db.query("SELECT COUNT(*) AS n FROM ff8_graph_native_operations").get()).toEqual({ n: 1 }); s.sourceUnchanged();
    } finally { s.close(); }
  }, 600000);

test("RMSN- OFFLINE clearing a spent claim cannot manufacture a fresh effect after restart", async () => {
  const s = nativeOfflineCase();
  try {
    const handle = s.start(); expect((await handle.submit()).status).toBe("CONFIRMED");
    const count = s.calls.length, before = JSON.stringify(s.root());
    s.graph().db.query("UPDATE ff8_graph_native_operations SET prompt_claim=0,revision=1").run();
    await expect(handle.submit()).rejects.toThrow("claim flag/history mismatch");
    expect(() => s.assertReopenIntegrity()).toThrow("claim flag/history mismatch");
    expect(s.calls).toHaveLength(count); expect(JSON.stringify(s.root())).toBe(before); s.sourceUnchanged();
  } finally { s.close(); }
}, 600000);

test("RMSN- missing native host refuses before token, RPC or legacy fallback", async () => {
  const s = setup(); let tokens = 0, rpc = 0;
  const original = s.options.transport.call;
  s.options.token = () => { tokens++; return "never-requested"; };
  s.options.transport.call = async () => { rpc++; throw new Error("must not run"); };
  try {
    expect(s.client.nativeRuntimeOwner()).toBeUndefined();
    await expect(s.client.submitRuntime("m", "unknown")).rejects.toThrow("native-unavailable");
    await expect(s.client.observeRuntime("m", "unknown")).rejects.toThrow("native-unavailable");
    await expect(s.client.notifyRuntime("m", "unknown", "command-unknown")).rejects.toThrow("native-unavailable");
    expect(tokens).toBe(0); expect(rpc).toBe(0); expect(s.requests).toHaveLength(0);
  } finally { s.options.transport.call = original; s.client.close(); s.cleanup(); }
});
test("RMSO- client derives durable execution target and refuses supplied unit/task aliases without transport", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined;
  try {
    h.start(); await h.step(); const command = h.host.submissions[0]!.command;
    client = new ExecutionClient({ ...s.options, statePath: h.path }); await client.ensure(h.missionId);
    const metadata = command.metadata as Record<string, unknown>, binding = metadata.graphBinding as Record<string, unknown>;
    await expect(client.submit(h.missionId, { ...command, metadata: { ...metadata, graphBinding: { ...binding, unitId: "unrelated-alias" } } })).rejects.toThrow(/contradicts durable target/);
    await expect(client.submit(h.missionId, { ...command, taskId: "unrelated-task" })).rejects.toThrow(/contradicts durable target/);
    expect(s.requests).toHaveLength(0); expect(h.host.submissions[0]!.command).toEqual(command);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
function obsoleteClientFixture(h: ReturnType<typeof graphHarness>) {
  const command = h.host.submissions[0]!.command, graph = h.runtime.options.graph, authority = h.runtime.options.authority(); graph.bootstrapParentAuthority(authority);
  const unitId = (command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId;
  const revision = (graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(h.missionId, unitId) as { revision: number }).revision;
  graph.retainOrderedCommandV1(authority, { commandId: "client-fixture-obsolete", unitId, executionId: null, sessionId: null, action: "obsolete", reason: "voluntary fixture decision", sequence: 1,
    expectedMissionRevision: h.store.load(h.missionId).revision, expectedUnitRevision: revision, expectedEventSequence: graph.events.cursor(h.missionId).sequence,
    expectedFamilyToken: graph.leases.get(h.missionId, unitId)?.token ?? null, notify: false });
  return command;
}
test("RMSO- global execution cannot hide obsolete durable mission behind a supplied mission alias", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined, transportCalls = 0;
  try {
    h.start(); await h.step(); const command = obsoleteClientFixture(h), original = JSON.stringify(command), transport = s.options.transport;
    client = new ExecutionClient({ ...s.options, statePath: h.path, transport: { async call(method, image) { transportCalls++; return transport.call(method, image); } } });
    // The rejection precedes snapshot/ensure/revision lookup for the alias.
    await expect(client.submit(`${h.missionId}:alias`, command)).rejects.toThrow(/mission.*contradicts durable target/);
    expect(transportCalls).toBe(0); expect(s.requests).toHaveLength(0); expect(JSON.stringify(command)).toBe(original);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
test("RMSO- corrupt decision digest from a normal durable decision is refused before any transport", async () => {
  const h = graphHarness(), s = setup(); let client: ExecutionClient | undefined, transportCalls = 0;
  try {
    h.start(); await h.step(); const command = obsoleteClientFixture(h), graph = h.runtime.options.graph, transport = s.options.transport;
    // Fixture-only corruption after a real private-row + event API decision.
    graph.db.query("UPDATE ff8_graph_ordered_commands SET digest=? WHERE mission=? AND command_id=?").run("wrong-digest", h.missionId, "client-fixture-obsolete");
    client = new ExecutionClient({ ...s.options, statePath: h.path, transport: { async call(method, image) { transportCalls++; return transport.call(method, image); } } });
    await expect(client.submit(h.missionId, command)).rejects.toThrow(/corrupt RMS decision/); expect(transportCalls).toBe(0); expect(s.requests).toHaveLength(0);
  } finally { client?.close(); h.close(); s.client.close(); s.cleanup(); }
}, 600000);
test("RMSO- legitimate legacy command without a graph outbox retains its existing admission path", async () => {
  const s = setup(); try { await s.client.ensure("m"); expect((await s.client.submit("m", body)).executionId).toBe(body.executionId); expect(s.requests).toHaveLength(1); }
  finally { s.client.close(); s.cleanup(); }
}, 600000);
test("client commits submission before send and reuses it after a lost response/reopen", async () => {
  const s = setup(true); try { await s.client.ensure("m"); await expect(s.client.submit("m", body)).rejects.toThrow("lost"); s.client.close(); const next = new ExecutionClient(s.options); const r = await next.submit("m", body); expect(r.state).toBe("accepted"); expect(s.receipts.size).toBe(1); expect(s.requests[0]).toEqual(s.requests[1]); next.close(); expect(readFileSync(s.options.statePath).includes(Buffer.from("TOP-SECRET"))).toBe(false); } finally { s.cleanup(); }
});
test("changed payload under an existing idempotency key is refused locally", async () => {
  const s = setup(); try { await s.client.ensure("m"); await s.client.submit("m", body); await expect(s.client.submit("m", { ...body, prompt: "changed" })).rejects.toThrow(/idempotency/); expect(s.requests).toHaveLength(1); } finally { s.client.close(); s.cleanup(); }
});
test("public client replay hashes native selections, RE policy metadata and scoped communication", async () => {
  for (const field of ["nativeTools", "communication", "metadata"]) {
    const s = setup();
    try {
      await s.client.ensure("m");
      const input = { ...body, nativeTools: ["exact_registered_disasm"], communication: { mode: "bulletin", channel: "assigned", read: true, publish: true, schema: { type: "object", properties: {}, required: [], additionalProperties: false }, schemaSha256: "a".repeat(64) }, metadata: { rePolicyHash: "b".repeat(64) } };
      await s.client.submit("m", input); s.client.close(); const restarted = new ExecutionClient(s.options);
      try { await expect(restarted.submit("m", { ...input, [field]: field === "nativeTools" ? [] : field === "communication" ? { ...input.communication, channel: "other" } : { rePolicyHash: "c".repeat(64) } })).rejects.toThrow(/idempotency/); }
      finally { restarted.close(); }
      expect(s.requests).toHaveLength(1);
    } finally { s.cleanup(); }
  }
});
test("journal consumption tolerates duplicates and restart, using durable cursor", async () => {
  const s = setup(); try { await s.client.ensure("m"); expect(await s.client.replay("m")).toBe(2); s.client.close(); const next = new ExecutionClient(s.options); expect(await next.replay("m")).toBe(2); next.close(); } finally { s.cleanup(); }
});
test("client refuses an unsupported wire version", async () => {
  const s = setup(); s.options.transport = { call: async () => ({ version: 2 }) }; const next = new ExecutionClient(s.options); try { await expect(next.ensure("m")).rejects.toThrow(/version/); } finally { s.client.close(); next.close(); s.cleanup(); }
});
test("bulletinSnapshot uses only public authenticated mission/directory scope and optional assigned channel", async () => {
  const s = setup(), calls: Array<{ method: string; input: Record<string, unknown> }> = [];
  s.options.transport = { call: async (method, input) => { calls.push({ method, input }); return { version: 1, missionId: "m", revision: 2, messages: [] }; } };
  const client = new ExecutionClient(s.options);
  try {
    expect(await client.bulletinSnapshot("m", "assigned")).toEqual({ version: 1, missionId: "m", revision: 2, messages: [] });
    expect(calls).toEqual([{ method: "bulletinSnapshot", input: { missionId: "m", directory: s.options.directory, principalId: "op", token: "TOP-SECRET", channel: "assigned" } }]);
    await client.bulletinSnapshot("m"); expect(calls[1]!.input.channel).toBeUndefined();
  } finally { client.close(); s.client.close(); s.cleanup(); }
});
test("declared admission refusal preserves typed permanent cause and redacts credentials", async () => {
  const s = setup(); s.options.transport = { call: async () => { throw Object.assign(new Error("TOP-SECRET denied"), { type: "execution_rejected", data: { category: "permission", recoverable: false } }); } };
  const next = new ExecutionClient(s.options); try { await expect(next.ensure("m")).rejects.toMatchObject({ category: "permission", recoverable: false, message: "[redacted] denied" }); } finally { next.close(); s.client.close(); s.cleanup(); }
});
test("unaccepted pending command can refresh revision only after snapshot proves no execution", async () => {
  const s = setup(); const real = s.options.transport; let drop = true;
  s.options.transport = { async call(method, input) { if (method === "submit" && drop) { drop = false; throw new Error("cut before acceptance"); } return real.call(method, input); } };
  try { await s.client.ensure("m"); await expect(s.client.submit("m", body)).rejects.toThrow("cut"); await s.client.control("m", "renew"); expect((await s.client.submit("m", body)).state).toBe("accepted"); expect(s.receipts.size).toBe(1); expect(s.requests[0].expectedRevision).toBe(2); } finally { s.client.close(); s.cleanup(); }
});
for (const [native, category, recoverable] of [
  [{ _tag: "UnauthorizedError", message: "TOP-SECRET unauthorized" }, "auth", false],
  [{ _tag: "ForbiddenError", message: "TOP-SECRET forbidden" }, "permission", false],
  [{ _tag: "InvalidRequestError", message: "TOP-SECRET invalid" }, "input", false],
  [{ _tag: "RpcInternalError", type: "rpc.invalid_output", message: "TOP-SECRET invalid output" }, "schema", false],
  [{ _tag: "ServiceUnavailableError", message: "TOP-SECRET unavailable" }, "transport", true],
  [{ _tag: "RpcError", type: "execution_rejected", message: "TOP-SECRET quota", data: { category: "quota", recoverable: true } }, "quota", true],
] as const) test(`public error ${native._tag}/${category} survives submit/inspect/control without invented refusal authority`, async () => {
  for (const operation of ["submit", "inspect", "control"] as const) {
    const s = setup(), real = s.options.transport; let fail = false;
    s.options.transport = { call: async (method, input) => { if (fail && method === operation) throw native; return real.call(method, input); } };
    const client = new ExecutionClient(s.options);
    try {
      await client.ensure("m"); fail = true;
      const action = operation === "submit" ? client.submit("m", body) : operation === "inspect" ? client.inspect("m", body.executionId) : client.control("m", "pause");
      await expect(action).rejects.toMatchObject({ category, recoverable, type: native._tag === "RpcError" ? "execution_rejected" : undefined });
      fail = false;
      if (operation === "submit") expect((await client.submit("m", body)).state).toBe("accepted");
    } finally { client.close(); s.client.close(); s.cleanup(); }
  }
});
for (const state of [
  { executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Number.NaN, paused: false }, executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: true }, executions: [] },
  { admissions: { controllerId: "ctl", leaseUntil: Date.now() + 300000, paused: false }, executions: [null] },
]) test("ambiguous or paused admission snapshot cannot send a new command", async () => {
  const s = setup(), real = s.options.transport;
  s.options.transport = { call: async (method, input) => method === "snapshot" ? { version: 1, revision: 1, ...state } : real.call(method, input) };
  const client = new ExecutionClient(s.options);
  try { await client.ensure("m"); await expect(client.submit("m", body)).rejects.toThrow(); expect(s.requests).toHaveLength(0); }
  finally { client.close(); s.client.close(); s.cleanup(); }
});
test("invalid acceptance receipt is not cached and retry keeps the original identity", async () => {
  const s = setup(), real = s.options.transport; let invalid = true;
  s.options.transport = { call: async (method, input) => method === "submit" && invalid ? { version: 1, revision: 2, executionId: "other", state: "accepted" } : real.call(method, input) };
  const client = new ExecutionClient(s.options);
  try { await client.ensure("m"); await expect(client.submit("m", body)).rejects.toThrow(/receipt/); invalid = false; expect((await client.submit("m", body)).executionId).toBe(body.executionId); expect(s.receipts.size).toBe(1); }
  finally { client.close(); s.client.close(); s.cleanup(); }
});

test("prospective DATA join/body survive reopen; exact retry has no transport and divergent retry refuses", async () => {
  const s = setup(); let calls = 0;
  s.options.transport = { async call() { calls++; throw new Error("unexpected transport"); } };
  s.options.token = () => { calls++; throw new Error("unexpected token"); };
  const client = new ExecutionClient(s.options);
  let next: ExecutionClient | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const planning = decoded<any>(envelope.planning), unit = planning.units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "prospective-exec", attemptId: "prospective-attempt", taskId: "prospective-task", idempotencyKey: "prospective-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic DATA only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    const first = client.prepareRuntimeDispatch(runtime, scope, admission), joinData = decoded(first);
    expect(joinData.payloadDigest).toBe(digest(command)); expect(joinData.upstreamBodyDigest).toBe(digest(admission));
    expect(joinData.clientBodyDigest).toBe(digest({ ...command, missionId: scope.missionId, directory: s.options.directory, controllerId: "ctl", expectedRevision: 0 }));
    expect(new Set([joinData.payloadDigest, joinData.upstreamBodyDigest, joinData.clientBodyDigest]).size).toBe(3);
    expect(joinData.rpcBodySha256).toBeNull();
    client.close(); next = new ExecutionClient(s.options);
    expect(next.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(first);
    expect(() => next!.prepareRuntimeDispatch(runtime, { ...scope, expectedRevision: 1 }, admission)).toThrow("conflict");
    await expect(next.submitRuntime(scope.missionId, command.idempotencyKey)).rejects.toThrow("native-unavailable");
    await expect(next.observeRuntime(scope.missionId, command.idempotencyKey)).rejects.toThrow("native-unavailable");
    await expect(next.submit(scope.missionId, command)).rejects.toThrow("legacy submit forbidden");
    expect(calls).toBe(0);
  } finally { next?.close(); client.close(); s.client.close(); s.cleanup(); }
}, 15000);

test("prospective reservation wins while legacy submit awaits snapshot: no legacy emission and retained images unchanged", async () => {
  const s = setup(), real = s.options.transport;
  let entered!: () => void, release!: () => void;
  const snapshotEntered = new Promise<void>(done => { entered = done; });
  const snapshotRelease = new Promise<void>(done => { release = done; });
  let holdSnapshot = false, submitEmissions = 0;
  s.options.transport = { async call(method, input) {
    if (method === "snapshot" && holdSnapshot) { entered(); await snapshotRelease; }
    // Independent effect oracle counts entry, even if the mock later rejects CAS.
    if (method === "submit") submitEmissions++;
    return real.call(method, input);
  } };
  const client = new ExecutionClient(s.options);
  let pending: Promise<{ error: unknown }> | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const planning = decoded<any>(envelope.planning), unit = planning.units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "prospective-race-exec", attemptId: "prospective-race-attempt", taskId: "prospective-race-task", idempotencyKey: "prospective-race-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic DATA race only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    await client.ensure(scope.missionId); holdSnapshot = true;
    pending = client.submit(scope.missionId, command).then(() => ({ error: undefined }), error => ({ error }));
    await snapshotEntered;
    const retained = client.prepareRuntimeDispatch(runtime, scope, admission);
    release(); const outcome = await pending;
    expect(submitEmissions).toBe(0);
    expect(outcome.error).toBeInstanceOf(Error);
    expect((outcome.error as Error).message).toContain("legacy submit forbidden");
    expect(client.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(retained);
    expect(decoded(retained).clientBodyDigest).toBe(digest({ ...command, missionId: scope.missionId, directory: s.options.directory, controllerId: "ctl", expectedRevision: 0 }));
    expect(decoded(retained).upstreamBodyDigest).toBe(digest(admission));
  } finally { release(); await pending; client.close(); s.client.close(); s.cleanup(); }
}, 15000);

test("prospective retention wins between legacy classification lookup and request read: raw body unchanged", async () => {
  const s = setup(), real = s.options.transport;
  let submitEmissions = 0;
  s.options.transport = { async call(method, input) { if (method === "submit") submitEmissions++; return real.call(method, input); } };
  const a = new ExecutionClient(s.options), b = new ExecutionClient(s.options);
  const observer = new Database(s.options.statePath, { readonly: true });
  let restore: (() => void) | undefined;
  try {
    const f = fixture(), prepared = prepareRuntimeExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
    if (!prepared.ok) throw new Error(prepared.reasons.join(";"));
    const runtime = prepared.value, run = readRuntimeDocumentV1(runtime.run) as any, envelope = decoded<any>(run.envelope);
    const unit = decoded<any>(envelope.planning).units[0], sub = unit.subIntents.find((x: any) => x.role === "A");
    const input = { schemaVersion: 1, role: "A", cycle: 1, identity: sub.harnessIdentity, files: [], accessibleRules: [], requiredTools: [], knowledge: decoded<any>(envelope.admissionSource.knowledgeSource).frozen };
    const command = { executionId: "retention-exec", attemptId: "retention-attempt", taskId: "retention-task", idempotencyKey: "retention-key", profile: decoded<any>(envelope.admissionSource.executionTemplate).settings.profiles.A,
      model: decoded<any>(envelope.admissionSource.executionSourceSpec).models.A, prompt: "synthetic retention DATA only", dossier: { inputs: input }, metadata: { inputFingerprint: digest(input), rmsBinding: { version: "rms-agent-binding-data-v1", runtimeBindingRef: runtime.binding.ref, unitId: unit.unitId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: "A", familyFence: 1, controllerFence: 1 } } };
    const admission = { executionId: command.executionId, attemptId: command.attemptId, idempotencyKey: command.idempotencyKey, subIntentId: sub.subIntentId, role: "A", command };
    const scope: DispatchScopeV1 = { missionId: run.missionId, cycle: 1, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: "A", familyFence: 1, controllerFence: 1, expectedRevision: 0,
      planRef: envelope.planning.ref, snapshotRef: envelope.fullGraphSnapshot.ref, inputBundle: document("rms-inputs-data-v1", input), outboxRef: document("rms-admission-data-v1", admission).ref };
    await a.ensure(scope.missionId);
    const rawBody = () => (observer.query("SELECT body FROM ff8_bridge_requests WHERE mission=? AND key=?").get(scope.missionId, command.idempotencyKey) as { body: string }).body;
    let armed = true, interpositions = 0, retained: ReturnType<ExecutionClient["prepareRuntimeDispatch"]> | undefined, before: string | undefined;
    const originalQuery = Database.prototype.query;
    const interception = spyOn(Database.prototype, "query").mockImplementation(function(this: Database, sql: string) {
      const statement = originalQuery.call(this, sql);
      if (sql !== "SELECT key FROM ff8_bridge_dispatch_joins WHERE mission=? AND key=?") return statement;
      return new Proxy(statement, { get(target, property) {
        if (property === "get") return (...params: any[]) => {
          const row = target.get(...params);
          // Simulate B's legal interposition AFTER A's empty lookup completes.
          if (armed && row == null) { armed = false; interpositions++; retained = b.prepareRuntimeDispatch(runtime, scope, admission); before = rawBody(); }
          return row;
        };
        const value = Reflect.get(target, property, target); return typeof value === "function" ? value.bind(target) : value;
      } });
    } as typeof Database.prototype.query);
    restore = () => interception.mockRestore();
    const outcome = await a.submit(scope.missionId, command).then(() => ({ error: undefined }), error => ({ error }));
    restore(); restore = undefined;
    expect(interpositions).toBe(1); expect(submitEmissions).toBe(0);
    expect(rawBody()).toBe(before!);
    expect(b.prepareRuntimeDispatch(runtime, scope, admission)).toEqual(retained!);
    expect(outcome.error).toBeInstanceOf(Error);
    expect((outcome.error as Error).message).toContain("legacy submit forbidden");
  } finally { restore?.(); observer.close(); a.close(); b.close(); s.client.close(); s.cleanup(); }
}, 15000);
