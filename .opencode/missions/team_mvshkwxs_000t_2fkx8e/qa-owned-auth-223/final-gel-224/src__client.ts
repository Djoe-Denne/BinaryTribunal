import { openOwnDatabase } from "./store";
import { assertRmsWorkCurrentV1, assertLegacyNativeDispatchAbsentV1 } from "./graph-store";
import { canonical, hash } from "./validation";
import { sourceNativeFunctionIdentityMatchesV1 } from "./_native-function-identity";
import { assertAuditContinuation, decodeBulletinSnapshot, type BulletinSnapshot, type CommunicationAudit } from "./bulletin-audit";
import { prepareDispatchJoinV1, refuseNativeRuntimeV1, type PreparedRuntimeV1, type DispatchScopeV1, type DispatchJoinV1 } from "./graph-runtime-binding";
import { assertOwnedNpmHostProvenanceV1, ownedHostLiveFactsMatchV1, ownedWindowsExecutablePathsMatchV1, ownedFileIdentityMatchesV1, ownedFileIdentityDataV1,
  ownedFinalizationBudgetV1, ownedClosureProgressV1, verifyOwnedClosureRowsBoundedV1, ownedClosureFileFactsMatchV1, assertOwnedClosureFileProofV1,
  type OwnedClosureRowV1, type OwnedClosureFileFactsV1, type OwnedClosureCheckV1,
  type OwnedFileIdentityV1, type OwnedNpmHostProvenanceV1, type OwnedHostFilePinV1 } from "./graph-runtime-binding";
import { ownedAuthBudgetV1, ownedAuthChallengeV1, ownedAuthStatusProjectionV1, ownedAuthPublicStatusesV1,
  ownedAuthConnectBodyV1, ownedAuthConnectRouteV1, type OwnedAuthProvenanceV1, type OwnedAuthIntentV1 } from "./graph-runtime-binding";
import { assertExecutionJsonV1, type BoundDocument } from "./graph-execution-envelope";
import { GraphStore, type NativeInvocationSourceV1, type NativeLocalDecisionV1, type NativeLocalPermitV1,
  type NativeRootAcquisitionV1, type NativeRuntimeExpectedV1, type NativeRuntimeHostVerificationV1, type ParentAuthorityProvider } from "./graph-store";
import type { ControllerAuthority } from "./unit-lease";
import type { NativeRuntimeHttpPortV1, NativeRuntimeAdmissionDataV1, OwnedHostCapabilityV1, OwnedHostConnectionViewV1 } from "./native-runtime-transport";
import type { NativeRuntimeObservationV2 } from "./graph-native-observations";
import { connectNativeRuntimeHttpV1, isConnectedNativeRuntimeHttpPortV1, encodeNativeAdmissionWireV1, assertNativeServiceIdentityV1 } from "./native-runtime-transport";
import { connectOwnedNativeRuntimeHttpV1 } from "./native-runtime-transport";
import { connectOwnedAuthHttpV1, OwnedAuthHttpErrorV1, type OwnedAuthConnectionViewV1 } from "./native-runtime-transport";
import { prepareRuntimeExecutionV1, type ExecutionPreparationRequestV1 } from "./graph-execution-prepare";
import { makeBoundDocumentV1, type ByteRef, type GraphRunV3, type RootSlotGrantsV1 } from "./graph-execution-envelope";
import { readRuntimeDocumentV1 } from "./graph-runtime-binding";
import { Store } from "./store";
import { readFileSync, existsSync, lstatSync, realpathSync, mkdirSync, openSync, writeSync, fsyncSync, closeSync, type BigIntStats } from "node:fs";
import { lstat as lstatAsync, realpath as realpathAsync, readFile as readFileAsync } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { Database } from "bun:sqlite";
export interface RpcTransport { call(method: string, input: Record<string, unknown>): Promise<Record<string, unknown>>; serverVersion?: string }
export interface ClientOptions {
  transport: RpcTransport; statePath: string; directory: string; principalId: string;
  token: () => string; controllerId: string; teamName: string; leaseMs: number; maxRunning: number;
  nativeRuntime?: { graph: GraphStore; authority: () => ControllerAuthority; transport: NativeRuntimeHttpPortV1 };
}
interface RequestRow { digest: string; body: string; receipt: string | null }
interface SubmissionImage { payload: Record<string, unknown>; image: string; key: string; digest: string }
const submissionAuthorityFields = ["token", "principalId", "controllerId", "expectedRevision", "directory", "missionId"] as const;
/** Preserve the existing codec; detach its image before any configured callback.
 * Getters/Proxy traps may run during canonical itself, not atomically with it. */
function captureSubmission(input: Record<string, unknown>): SubmissionImage {
  if (input === null || typeof input !== "object" || submissionAuthorityFields.some(key => key in input)) throw new Error("invalid submission identity/authority");
  const image = canonical(input); let decoded: unknown;
  try { decoded = JSON.parse(image); } catch { throw new Error("invalid submission image"); }
  if (decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) throw new Error("invalid submission image");
  const payload = decoded as Record<string, unknown>, key = payload.idempotencyKey;
  // A trap may have introduced authority after the raw presence check. The key
  // must also belong to the captured data, not only the caller's prototype.
  if (submissionAuthorityFields.some(field => field in payload) || !Object.hasOwn(payload, "idempotencyKey") || typeof key !== "string" || !key) throw new Error("invalid submission identity/authority");
  return { payload, image, key, digest: hash(image) };
}
/** A cached receipt or retry may use only the exact captured payload. Historical
 * controller/CAS values are envelope, not payload; contradictory rows are never repaired. */
function boundRequestBody(row: RequestRow, captured: SubmissionImage): Record<string, unknown> {
  if (row.digest !== captured.digest) throw new Error("idempotency key payload changed");
  let decoded: unknown;
  try { decoded = JSON.parse(row.body); } catch { throw new Error("incoherent durable submission body"); }
  if (decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) throw new Error("incoherent durable submission body");
  const body = decoded as Record<string, unknown>;
  const { missionId: _mission, directory: _directory, controllerId: _controller, expectedRevision: _revision, ...payload } = body;
  if (canonical(payload) !== captured.image) throw new Error("idempotency key durable payload changed");
  return body;
}
/** Admission provenance for deterministic permanent-block versus retry transitions. */
export class BridgeAdmissionError extends Error {
  constructor(message: string, readonly category: string, readonly recoverable: boolean, readonly type?: "execution_rejected") { super(message); }
}
/** Durable client for the public generic bridge. */
export class ExecutionClient {
  private db;
  private readonly nativeRuntime?: NonNullable<ClientOptions["nativeRuntime"]>;
  /** Owner identity, not an authority factory or a new connection. */
  nativeRuntimeOwner(): GraphStore | undefined { return this.nativeRuntime?.graph; }
  /** Read the already configured operative lease, never acquire or mint it. */
  nativeRuntimeAuthorityV1(): ControllerAuthority | undefined {
    const a = this.nativeRuntime?.authority(); return a ? { now: a.now, lease: { ...a.lease } } : undefined;
  }
  constructor(readonly options: ClientOptions) {
    if (!options.controllerId || !options.principalId || !options.directory || options.leaseMs < 1 || options.leaseMs > 300000 || !Number.isInteger(options.maxRunning) || options.maxRunning < 1) throw new Error("invalid explicit bridge connection parameters");
    if (options.nativeRuntime) {
      if (options.nativeRuntime.graph.path !== options.statePath) throw new Error("native runtime requires the same OWN owner");
      this.nativeRuntime = Object.freeze({ graph: options.nativeRuntime.graph,
        authority: options.nativeRuntime.authority, transport: options.nativeRuntime.transport });
    }
    this.db = openOwnDatabase(options.statePath, "engine");
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS ff8_bridge_missions(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, cursor INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS ff8_bridge_requests(mission TEXT NOT NULL, key TEXT NOT NULL, digest TEXT NOT NULL, body TEXT NOT NULL, receipt TEXT, PRIMARY KEY(mission,key));
      CREATE TABLE IF NOT EXISTS ff8_bridge_command_attempts(seq INTEGER PRIMARY KEY AUTOINCREMENT, mission TEXT NOT NULL, key TEXT NOT NULL, time INTEGER NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ff8_bridge_events(mission TEXT NOT NULL, id INTEGER NOT NULL, event TEXT NOT NULL, PRIMARY KEY(mission,id));
      CREATE TABLE IF NOT EXISTS ff8_bridge_communication_audits(mission TEXT NOT NULL, execution TEXT NOT NULL, audit TEXT NOT NULL, PRIMARY KEY(mission,execution));
      CREATE TABLE IF NOT EXISTS ff8_bridge_dispatch_joins(mission TEXT NOT NULL, key TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(mission,key));`);
  }
  /** Local DATA retention, not admission. No snapshot/token/network/controller renewal. */
  prepareRuntimeDispatch(runtime: PreparedRuntimeV1, scope: DispatchScopeV1, admission: unknown): BoundDocument<DispatchJoinV1> {
    assertExecutionJsonV1({ runtime, scope, admission });
    const a = admission as { command: Record<string, unknown> };
    const captured = captureSubmission(a.command);
    const body = { ...captured.payload, ...this.scope(scope.missionId), controllerId: this.options.controllerId, expectedRevision: scope.expectedRevision };
    const document = prepareDispatchJoinV1(runtime, scope, admission, body), image = canonical(document), bodyImage = canonical(body);
    this.db.transaction(() => {
      const old = this.db.query("SELECT document FROM ff8_bridge_dispatch_joins WHERE mission=? AND key=?").get(scope.missionId, captured.key) as { document: string } | null;
      const request = this.db.query("SELECT digest,body,receipt FROM ff8_bridge_requests WHERE mission=? AND key=?").get(scope.missionId, captured.key) as RequestRow | null;
      if (old || request) {
        if (!old || !request || old.document !== image || request.body !== bodyImage || request.digest !== captured.digest || request.receipt !== null) throw new Error("prospective idempotency/body/join conflict");
        return;
      }
      this.db.query("INSERT INTO ff8_bridge_requests(mission,key,digest,body) VALUES(?,?,?,?)").run(scope.missionId, captured.key, captured.digest, bodyImage);
      this.db.query("INSERT INTO ff8_bridge_dispatch_joins VALUES(?,?,?)").run(scope.missionId, captured.key, image);
    }).immediate();
    return document;
  }
  /** Not implemented as a fixture fallback: native source/version/rights are missing. */
  async submitRuntime(missionId: string, key: string): Promise<NativeRuntimeAdmissionDataV1> {
    const native = this.nativeRuntime; if (!native) return refuseNativeRuntimeV1();
    const authority = native.authority();
    if (authority.lease.missionId !== missionId) throw new Error("native runtime mission/owner mismatch");
    // The graph owner rereads the retained operation and authority at every
    // boundary. No token, ensureTeam, RPC, fixture submit or new image here.
    return native.graph.submitNativeRuntimeV1(native.authority, key, native.transport);
  }
  async observeRuntime(missionId: string, key: string): Promise<NativeRuntimeObservationV2> {
    const native = this.nativeRuntime; if (!native) return refuseNativeRuntimeV1();
    if (native.authority().lease.missionId !== missionId) throw new Error("native runtime mission/owner mismatch");
    return native.graph.observeNativeRuntimeV2(native.authority, key, native.transport);
  }
  async notifyRuntime(missionId: string, executionId: string, commandId: string): Promise<Record<string, unknown> | null> {
    const native = this.nativeRuntime; if (!native) return refuseNativeRuntimeV1();
    if (native.authority().lease.missionId !== missionId) throw new Error("native runtime mission/owner mismatch");
    return native.graph.deliverNativeOrderedCommandV1(native.authority, executionId, commandId, native.transport);
  }
  private assertLegacyDispatchKey(missionId: string, key: string): void {
    assertLegacyNativeDispatchAbsentV1(this.db, missionId, [key]);
    if (this.db.query("SELECT key FROM ff8_bridge_dispatch_joins WHERE key=?").get(key)) throw new Error("prospective runtime requires qualified native dispatch; legacy submit forbidden");
  }
  private scope(missionId: string) { return { missionId, directory: this.options.directory }; }
  private async call(method: string, body: Record<string, unknown>) {
    const nativeGuard = () => assertLegacyNativeDispatchAbsentV1(this.db, typeof body.missionId === "string" ? body.missionId : "", [body.idempotencyKey, body.executionId, body.attemptId, body.taskId]);
    nativeGuard();
    const token = this.options.token(); if (!token) throw new Error("operator token missing (use the configured environment variable)");
    nativeGuard();
    let r: Record<string, unknown>;
    try { r = await this.options.transport.call(method, { ...body, principalId: this.options.principalId, token }); }
    catch (error) {
      nativeGuard();
      const native = error && typeof error === "object" ? error as Record<string, unknown> : {};
      const data = native.data && typeof native.data === "object" ? native.data as Record<string, unknown> : native;
      const message = (error instanceof Error && error.message ? error.message : String(native.type ?? native._tag ?? "bridge transport error")).split(token).join("[redacted]");
      const declared = native.type === "execution_rejected" || typeof data.category === "string";
      const mapped: Record<string, string> = { UnauthorizedError: "auth", ForbiddenError: "permission", InvalidRequestError: "input", RpcInternalError: "schema", ServiceUnavailableError: "transport" };
      const category = declared ? String(data.category ?? "unknown") : mapped[String(native._tag)] ?? "transport";
      throw new BridgeAdmissionError(message, category, declared ? data.recoverable === true : category === "transport",
        native.type === "execution_rejected" ? "execution_rejected" : undefined);
    }
    nativeGuard();
    if (r.version !== 1) throw new Error("unsupported execution bridge version"); return r;
  }
  private revision(missionId: string): number {
    const r = this.db.query("SELECT revision FROM ff8_bridge_missions WHERE id=?").get(missionId) as { revision: number } | null;
    if (!r) throw new Error("bridge mission has not been ensured"); return r.revision;
  }
  private recordRevision(missionId: string, response: Record<string, unknown>) {
    const revision = response.revision; if (!Number.isSafeInteger(revision) || (revision as number) < 1) throw new Error("bridge response lacks a valid revision");
    this.db.query("INSERT INTO ff8_bridge_missions(id,revision) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET revision=max(revision,excluded.revision)").run(missionId, revision as number);
  }
  /** Discover actual bridge capabilities; never substitute a simulation. */
  async capabilities(): Promise<Record<string, unknown>> {
    const r = await this.call("capabilities", {}); const c = r.capabilities as Record<string, unknown> | undefined;
    if (!c || c.rpc !== "ensemble.execution.v1" || c.fresh !== true || c.replay !== true) throw new Error("required execution bridge capabilities unavailable"); return c;
  }
  async ensure(missionId: string): Promise<void> {
    assertLegacyNativeDispatchAbsentV1(this.db, missionId);
    await this.capabilities();
    assertLegacyNativeDispatchAbsentV1(this.db, missionId);
    const r = await this.call("ensureTeam", { ...this.scope(missionId), teamName: this.options.teamName, controllerId: this.options.controllerId, leaseMs: this.options.leaseMs, maxRunning: this.options.maxRunning });
    this.recordRevision(missionId, r);
  }
  async submit(missionId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const captured = captureSubmission(input), { key, digest } = captured;
    // Caller binding is an assertion only: the shared guard derives the target
    // from the durable execution and refuses unit/task aliases before any I/O.
    const binding = (captured.payload.metadata as { graphBinding?: { unitId?: string } } | undefined)?.graphBinding;
    const current = () => {
      const header = (captured.payload.dossier as any)?.resultHeader;
      assertLegacyNativeDispatchAbsentV1(this.db, missionId, [key, captured.payload.executionId, captured.payload.taskId, captured.payload.attemptId,
        header?.executionId, header?.taskId, header?.attemptId, (captured.payload.metadata as any)?.rmsBinding?.runRef?.sha256]);
      assertRmsWorkCurrentV1(this.db, missionId, binding?.unitId, String(captured.payload.executionId), String(captured.payload.taskId));
    };
    current();
    this.assertLegacyDispatchKey(missionId, key);
    let row = this.db.query("SELECT digest,body,receipt FROM ff8_bridge_requests WHERE mission=? AND key=?").get(missionId, key) as RequestRow | null;
    if (row) boundRequestBody(row, captured);
    if (row?.receipt) return JSON.parse(row.receipt) as Record<string, unknown>;
    if (!row) {
      const state = await this.snapshot(missionId); this.assertSubmissionSnapshot(state); const admission = state.admissions as { controllerId: string; leaseUntil: number } | undefined;
      if (admission && (admission.controllerId !== this.options.controllerId || admission.leaseUntil <= Date.now())) throw new Error("controller lease unavailable; explicit recover required");
      if (admission && admission.leaseUntil - Date.now() < this.options.leaseMs / 2) await this.control(missionId, "renew");
      const body = { ...captured.payload, ...this.scope(missionId), controllerId: this.options.controllerId, expectedRevision: this.revision(missionId) };
      // Arbitrate AFTER all awaits, under the same write transaction as reservation.
      // If prospective preparation won, do not consume its request via ON CONFLICT.
      // If legacy wins, its retained request makes prospective preparation refuse.
      row = this.db.transaction(() => {
        current();
        this.assertLegacyDispatchKey(missionId, key);
        this.db.query("INSERT INTO ff8_bridge_requests(mission,key,digest,body) VALUES(?,?,?,?) ON CONFLICT(mission,key) DO NOTHING").run(missionId, key, digest, canonical(body));
        const retained = this.db.query("SELECT digest,body,receipt FROM ff8_bridge_requests WHERE mission=? AND key=?").get(missionId, key) as RequestRow | null;
        if (!retained || retained.digest !== digest) throw new Error("concurrent idempotency conflict");
        boundRequestBody(retained, captured); return retained;
      }).immediate();
      if (row.receipt) return JSON.parse(row.receipt) as Record<string, unknown>;
    } else {
      const state = await this.snapshot(missionId); this.assertSubmissionSnapshot(state); const pending = boundRequestBody(row, captured);
      current();
      const executions = state.executions;
      if (!Array.isArray(executions)) throw new Error("cannot reconcile pending command without native execution snapshot");
      const accepted = executions.some((e: Record<string, unknown>) => e.executionId === pending.executionId);
      if (!accepted) {
        const admission = state.admissions as { controllerId: string; leaseUntil: number } | undefined;
        if (!admission || admission.controllerId !== this.options.controllerId || admission.leaseUntil <= Date.now()) throw new Error("pending command lacks current controller lease; explicit recover required");
        // Absence from a transactional public snapshot proves no admission record.
        // The server rechecks the active lease/CAS inside acceptance, so a delayed
        // old-controller command cannot create an unrecorded worker after fencing.
        pending.controllerId = this.options.controllerId; pending.expectedRevision = this.revision(missionId);
        const rebasedBody = canonical(pending); row.body = rebasedBody;
        this.db.transaction(() => {
          current();
          // Classification and pending-body mutation must share the write lock:
          // an earlier empty lookup can precede a prospective reservation.
          this.assertLegacyDispatchKey(missionId, key);
          this.db.query("UPDATE ff8_bridge_requests SET body=? WHERE mission=? AND key=? AND receipt IS NULL").run(rebasedBody, missionId, key);
        }).immediate();
      }
    }
    // The exact command was durably committed before network I/O. Tokens remain in memory only.
    const command = boundRequestBody(row, captured), attemptBody = row.body;
    this.db.transaction(() => {
      current();
      this.assertLegacyDispatchKey(missionId, key);
      this.db.query("INSERT INTO ff8_bridge_command_attempts(mission,key,time,body) VALUES(?,?,?,?)").run(missionId, key, Date.now(), attemptBody);
    }).immediate();
    current();
    const response = await this.call("submit", command);
    current(); this.assertLegacyDispatchKey(missionId, key);
    if (response.executionId !== command.executionId || response.state !== "accepted" || !Number.isSafeInteger(response.revision) || (response.revision as number) < 1) throw new Error("invalid acceptance receipt identity/state/revision");
    this.db.transaction(() => { this.db.query("UPDATE ff8_bridge_requests SET receipt=? WHERE mission=? AND key=?").run(canonical(response), missionId, key); this.recordRevision(missionId, response); }).immediate();
    return response;
  }
  private assertSubmissionSnapshot(state: Record<string, unknown>): void {
    const a = state.admissions as Record<string, unknown> | undefined;
    if (!a || a.controllerId !== this.options.controllerId || a.paused !== false || !Number.isSafeInteger(a.leaseUntil) || (a.leaseUntil as number) <= Date.now() || !Array.isArray(state.executions) || !state.executions.every(e => e !== null && typeof e === "object" && typeof e.executionId === "string" && e.executionId.length > 0)) throw new Error("ambiguous/paused admission snapshot or controller lease unavailable; explicit recover required");
  }
  async snapshot(missionId: string): Promise<Record<string, unknown>> {
    const r = await this.call("snapshot", this.scope(missionId)); this.recordRevision(missionId, r); return r;
  }
  /** Explicit leased mutation. A lost control reply is recovered from snapshot, not guessed. */
  async control(missionId: string, action: "pause" | "resume" | "renew" | "recover"): Promise<void> {
    await this.snapshot(missionId);
    const r = await this.call("control", { ...this.scope(missionId), controllerId: this.options.controllerId, expectedRevision: this.revision(missionId), action, leaseMs: this.options.leaseMs }); this.recordRevision(missionId, r);
  }
  /** Stop only executions in this authenticated mission, after pausing its admissions. */
  async stopMission(missionId: string): Promise<void> {
    await this.control(missionId, "pause"); const s = await this.snapshot(missionId);
    for (const raw of (s.executions ?? []) as Record<string, unknown>[]) {
      if (raw.state === "stopped") continue;
      const r = await this.call("stop", { ...this.scope(missionId), controllerId: this.options.controllerId, expectedRevision: this.revision(missionId), executionId: raw.executionId }); this.recordRevision(missionId, r);
      if (r.state !== "stopped") throw new Error(`stop pending for ${String(raw.executionId)}; inspect and retry stop`);
    }
  }
  /** Inspect native execution facts, not its scientific acceptability. */
  async inspect(missionId: string, executionId: string): Promise<Record<string, unknown>> {
    return this.call("inspect", { ...this.scope(missionId), executionId });
  }
  /** Authenticated controller-only observation; never advances a worker's cursor. */
  async bulletinSnapshot(missionId: string, channel?: string): Promise<BulletinSnapshot> {
    const r = decodeBulletinSnapshot(await this.call("bulletinSnapshot", { ...this.scope(missionId), ...(channel === undefined ? {} : { channel }) }), missionId, channel);
    this.recordRevision(missionId, { revision: r.revision }); return r;
  }
  /** Own client journal only. The engine additionally persists the audit in Inspection history. */
  retainCommunicationAudit(audit: CommunicationAudit): void {
    this.db.transaction(() => {
      const old = this.db.query("SELECT audit FROM ff8_bridge_communication_audits WHERE mission=? AND execution=?").get(audit.missionId, audit.executionId) as { audit: string } | null;
      if (old) assertAuditContinuation(JSON.parse(old.audit) as CommunicationAudit, audit);
      const content = canonical(audit); if (old?.audit === content) return;
      this.db.query("INSERT INTO ff8_bridge_communication_audits VALUES(?,?,?) ON CONFLICT(mission,execution) DO UPDATE SET audit=excluded.audit").run(audit.missionId, audit.executionId, content);
    }).immediate();
  }
  async replay(missionId: string): Promise<number> {
    let cursor = (this.db.query("SELECT cursor FROM ff8_bridge_missions WHERE id=?").get(missionId) as { cursor: number } | null)?.cursor ?? 0;
    for (;;) {
      const r = await this.call("replay", { ...this.scope(missionId), cursor, limit: 1000 });
      if (!Array.isArray(r.events) || !Number.isSafeInteger(r.cursor) || (r.cursor as number) < cursor) throw new Error("invalid bridge journal page");
      const events = r.events as Record<string, unknown>[];
      this.db.transaction(() => {
        for (const e of events) {
          if (e.version !== 1 || e.missionId !== missionId || !Number.isSafeInteger(e.id)) throw new Error("invalid scoped journal event");
          const old = this.db.query("SELECT event FROM ff8_bridge_events WHERE mission=? AND id=?").get(missionId, e.id as number) as { event: string } | null;
          if (old && old.event !== canonical(e)) throw new Error("journal event identity changed");
          this.db.query("INSERT OR IGNORE INTO ff8_bridge_events VALUES(?,?,?)").run(missionId, e.id as number, canonical(e));
        }
        this.db.query("UPDATE ff8_bridge_missions SET cursor=? WHERE id=?").run(r.cursor as number, missionId);
      }).immediate();
      const next = r.cursor as number; if (events.length < 1000 || next === cursor) return next; cursor = next;
    }
  }
  close(): void { this.db.close(); }
}

/** Public V2 service discovery/authentication and RPC transport; never reads Ensemble SQLite. */
export async function connectPublic(directory: string, registrationFile?: string): Promise<RpcTransport> {
  const { Service } = await import("@opencode/client/service"); const { OpenCode } = await import("@opencode/client");
  const endpoint = await Service.discover(registrationFile ? { file: registrationFile } : {});
  if (!endpoint) throw new Error("No healthy compatible OpenCode service discovered; start it explicitly or provide its public registration file");
  const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
  // Public location/plugin discovery initializes this location before RPC use.
  await client.location.get({ location: { directory } });
  await client.plugin.list({ location: { directory } });
  const serverInfo = await client.server.info();
  return { serverVersion: serverInfo.version, async call(method, input) {
    const r = await client.rpc.call({ rpcID: "ensemble.execution.v1", method, input: JSON.parse(JSON.stringify(input)), location: { directory } });
    if (!r.output || typeof r.output !== "object" || Array.isArray(r.output)) throw new Error("invalid RPC response envelope"); return r.output as Record<string, unknown>;
  } };
}

interface PinnedNativeJsonV1 { path: string; byteLength: number; sha256: string }
interface NativeParentRequestV1 {
  version: "rms-parent-native-request-v1"; missionId: string; ownPath: string; directory: string; registrationFile?: string;
  controllerId: string; principalId: string; actorId: string; mandateRef: ByteRef; leaseMs: number;
  body: PinnedNativeJsonV1; independentSources: PinnedNativeJsonV1; policy: PinnedNativeJsonV1;
  admission: PinnedNativeJsonV1; acquisition: PinnedNativeJsonV1; permit: PinnedNativeJsonV1;
  permissionsEvidence: PinnedNativeJsonV1;
  orderedCommand?: PinnedNativeJsonV1;
  rootAccountId: string; permitId: string; unitId: string; sessionId: string; messageId: string;
  expiresAt: number;
}
function readPinnedNativeJsonV1<T>(input: PinnedNativeJsonV1): T {
  const bytes = readFileSync(resolve(input.path));
  if (!Number.isSafeInteger(input.byteLength) || bytes.length !== input.byteLength || hash(bytes) !== input.sha256)
    throw new Error("native parent pinned source bytes mismatch");
  const result = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); assertExecutionJsonV1(result); return result as T;
}
/** Parse DATA only. Actor/session strings cannot mint the private invocation. */
function parseNativeParentRequestV1(value: unknown): Readonly<NativeParentRequestV1> {
  assertExecutionJsonV1(value); const v = value as NativeParentRequestV1;
  if (!v || v.version !== "rms-parent-native-request-v1" || ![v.missionId, v.ownPath, v.directory, v.controllerId, v.principalId, v.actorId,
    v.rootAccountId, v.permitId, v.unitId].every(s => typeof s === "string" && s.length > 0)
    || !Number.isSafeInteger(v.leaseMs) || v.leaseMs < 1 || v.leaseMs > 300000 || !Number.isSafeInteger(v.expiresAt)
    || !/^ses_[A-Za-z0-9_]+$/.test(v.sessionId) || !/^msg_[A-Za-z0-9_]+$/.test(v.messageId)
    || !v.mandateRef || !/^[a-f0-9]{64}$/.test(v.mandateRef.sha256)) throw new Error("native parent scope malformed");
  if (Object.keys(v).some(k => !["version", "missionId", "ownPath", "directory", "registrationFile", "controllerId", "principalId", "actorId", "mandateRef", "leaseMs",
    "body", "independentSources", "policy", "admission", "acquisition", "permit", "permissionsEvidence", "orderedCommand", "rootAccountId", "permitId", "unitId", "sessionId", "messageId", "expiresAt"].includes(k)))
    throw new Error("native parent request contains unsupported fields");
  for (const file of [v.body, v.independentSources, v.policy, v.admission, v.acquisition, v.permit, v.permissionsEvidence, ...(v.orderedCommand ? [v.orderedCommand] : [])]) {
    if (!file || typeof file.path !== "string" || !Number.isSafeInteger(file.byteLength) || file.byteLength < 1 || file.byteLength > 16777216
      || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error("native parent source pin malformed");
  }
  return Object.freeze(JSON.parse(canonical(v)));
}
interface OwnedParentInvocationV1 { capability: object; source: NativeInvocationSourceV1 }
const ownedParentInvocations = new WeakSet<object>();
type NativeInvocationConfigV1 = Pick<NativeParentRequestV1, "missionId" | "ownPath" | "controllerId" | "principalId" | "actorId" | "mandateRef" | "expiresAt">;
function localInvocationProviderV1(invocation: OwnedParentInvocationV1, config: NativeInvocationConfigV1): ParentAuthorityProvider {
  const identity = { version: 1 as const, role: "parent" as const, missionId: config.missionId, controllerOwner: config.controllerId,
    principalId: config.principalId, actorId: config.actorId, source: "supervisor-owned native local invocation; external tool receipt required",
    sourceHash: hash(canonical({ domain: "local-parent-delegation-v1", missionId: config.missionId, controllerId: config.controllerId,
      principalId: config.principalId, actorId: config.actorId, mandateRef: config.mandateRef })) };
  return { verifyParent(a) { return ownedParentInvocations.has(invocation.capability) && Date.now() < invocation.source.expiresAt
    && a.lease.token === invocation.source.controllerFence && a.lease.owner === config.controllerId && a.lease.missionId === config.missionId ? identity : undefined; },
    verifyNativeAuthor() { return undefined; } };
}
/** Local cancel/inspect must not depend on remote availability or old input
 * files. This provider deliberately supplies NO native runtime qualification. */
function localNativeControlV1(invocation: OwnedParentInvocationV1, config: NativeParentRequestV1, action: string, extra: string[]) {
  if (!ownedParentInvocations.has(invocation.capability) || Date.now() >= invocation.source.expiresAt || !existsSync(resolve(config.ownPath))) throw new Error("native local control requires owned invocation/OWN");
  const store = new Store(resolve(config.ownPath)), graph = new GraphStore(store.path, { parentAuthority: localInvocationProviderV1(invocation, config), nativeParentInvocation: invocation });
  try {
    const lease = { missionId: config.missionId, owner: config.controllerId, token: invocation.source.controllerFence ?? -1, expiresAt: config.expiresAt };
    store.assertLease(lease, Date.now()); const a = { lease, now: Math.max(Date.now(), graph.events.cursor(config.missionId).time) };
    if (action === "revoke") {
      const [id, revision, rights] = extra;
      if (!id || !/^(0|[1-9][0-9]*)$/.test(revision ?? "") || !["effect", "physical", "all"].includes(rights ?? "")) throw new Error("native parent explicit revoke arguments required");
      return graph.revokeNativeRuntimePermitV1(a, invocation.capability, id, Number(revision),
        rights === "all" ? { effect: false, physical: false } : rights === "effect" ? { effect: false } : { physical: false });
    }
    if (action === "command") {
      if (!config.orderedCommand) throw new Error("native parent pinned ordered command required");
      return graph.retainOrderedCommandV1(a, readPinnedNativeJsonV1<import("./graph-store").OrderedCommandRequestV1>(config.orderedCommand));
    }
    const s = store.load(config.missionId), unit = graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(config.missionId, config.unitId);
    const describe = (d: NativeLocalDecisionV1 | undefined) => d ? { id: d.id, revision: d.revision, rights: d.rights, expiresAt: d.expiresAt,
      documentRef: makeBoundDocumentV1("rms-native-local-decision-v1", d).ref, source: d.source, lastInvocationSource: d.lastInvocationSource,
      ...(d.subject.version === "rms-native-root-acquisition-v1" ? { root: d.subject.root, inventoryRef: d.subject.inventory.ref }
        : { expected: d.subject.expected, profile: d.subject.profile, model: d.subject.model }) } : null;
    return { state: "LOCAL_INSPECTION_NO_NATIVE_EFFECT", missionId: s.missionId, missionRevision: s.revision, unit,
      eventCursor: graph.events.cursor(s.missionId), family: graph.leases.get(s.missionId, config.unitId), controller: lease,
      acquisition: describe(graph.nativeLocalDecisionV1(`root-acquisition:${config.rootAccountId}`, config.missionId)),
      permit: describe(graph.nativeLocalDecisionV1(`host-permit:${config.permitId}`, config.missionId)) };
  } finally { graph.close(); store.close(); ownedParentInvocations.delete(invocation.capability); }
}

/** This issuer is deliberately private and invoked ONLY by import.meta.main.
 * The native supervisor's actual tool invocation is the trust root; the child
 * neither authenticates a lead via JSON nor manufactures its external receipt. */
function issueOwnedParentInvocationV1(config: NativeInvocationConfigV1, action: string): OwnedParentInvocationV1 {
  if (!import.meta.main) throw new Error("native parent issuer requires owned direct invocation");
  if (config.expiresAt <= Date.now()) throw new Error("native parent invocation scope expired");
  let controllerFence: number | null = null;
  if (existsSync(resolve(config.ownPath))) {
    const witness = new Database(resolve(config.ownPath), { readonly: true });
    try {
      const row = witness.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(config.missionId) as { lease_owner: string; lease_token: number; lease_until: number } | null;
      if (row) {
        if (row.lease_owner !== config.controllerId || row.lease_until <= Date.now()) throw new Error("native parent initial controller is not current");
        controllerFence = row.lease_token;
      }
    } finally { witness.close(); }
  }
  const capability = Object.freeze({}), source: NativeInvocationSourceV1 = { version: "rms-parent-owned-invocation-v1",
    invocationId: randomUUID(), pid: process.pid, startedAt: Date.now(), expiresAt: config.expiresAt, ownPath: resolve(config.ownPath),
    missionId: config.missionId, controllerOwner: config.controllerId, controllerFence,
    programSha256: hash(readFileSync(import.meta.path)), scopeSha256: hash(canonical({ config, action, argv: process.argv.slice(2) })), externalReceiptRef: null };
  ownedParentInvocations.add(capability); return Object.freeze({ capability, source: Object.freeze(source) });
}
/** Tranche A request DATA. No caller URL, password, service registration or
 * capability can be supplied. Only main's private composition can create a cap. */
interface OwnedReadonlyParentRequestV2 extends NativeInvocationConfigV1 {
  version: "rms-parent-owned-readonly-request-v2";
  purpose: "inspect-owned-http-readonly-v1";
  expectedControllerFence: number;
  connection: { kind: "owned-bun-http-readonly-v1"; namespace: string; provenance: OwnedNpmHostProvenanceV1 };
}
const ownedHostRootV1 = "C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180";
const ownedPathKeyV1 = (p: string) => resolve(p).toLowerCase();
function ownedNeedV1(ok: unknown, label: string): asserts ok { if (!ok) throw new Error(`owned readonly HOLD: ${label}`); }
function parseOwnedReadonlyParentRequestV2(value: unknown): OwnedReadonlyParentRequestV2 {
  assertExecutionJsonV1(value); const v = value as OwnedReadonlyParentRequestV2;
  const closed = (o: object, keys: string[]) => ownedNeedV1(o && typeof o === "object" && !Array.isArray(o)
    && canonical(Object.keys(o).sort()) === canonical([...keys].sort()), "closed request shape");
  closed(v, ["version", "purpose", "missionId", "ownPath", "controllerId", "principalId", "actorId", "mandateRef", "expiresAt", "expectedControllerFence", "connection"]);
  closed(v.connection, ["kind", "namespace", "provenance"]);
  closed(v.mandateRef, ["kind", "encoding", "byteLength", "sha256"]);
  ownedNeedV1(v.version === "rms-parent-owned-readonly-request-v2" && v.purpose === "inspect-owned-http-readonly-v1"
    && v.connection.kind === "owned-bun-http-readonly-v1" && ownedPathKeyV1(v.connection.namespace) === ownedPathKeyV1(ownedHostRootV1), "request purpose/connection");
  ownedNeedV1([v.missionId, v.ownPath, v.controllerId, v.principalId, v.actorId].every(s => typeof s === "string" && s.trim())
    && /^[A-Za-z]:[\\/]/.test(v.ownPath) && Number.isSafeInteger(v.expectedControllerFence) && v.expectedControllerFence > 0
    && Number.isSafeInteger(v.expiresAt) && typeof v.mandateRef.kind === "string" && v.mandateRef.kind.length > 0
    && ["raw-v1", "utf8-json-v1"].includes(v.mandateRef.encoding) && Number.isSafeInteger(v.mandateRef.byteLength) && v.mandateRef.byteLength > 0
    && /^[a-f0-9]{64}$/.test(v.mandateRef.sha256), "request scope");
  assertOwnedNpmHostProvenanceV1(v.connection.provenance);
  return Object.freeze(JSON.parse(canonical(v)));
}
interface OwnedPinStampV1 extends OwnedFileIdentityV1 { pin: OwnedHostFilePinV1; size: bigint; mtimeNs: bigint; ctimeNs: bigint }
function readOwnedPinV1(pin: OwnedHostFilePinV1): { bytes: Buffer; stamp: OwnedPinStampV1 } {
  const a = lstatSync(pin.path, { bigint: true });
  ownedNeedV1(a.isFile() && !a.isSymbolicLink() && ownedPathKeyV1(realpathSync(pin.path)) === ownedPathKeyV1(pin.path)
    && a.size === BigInt(pin.byteLength) && a.size <= 100n * 1024n * 1024n, "pin type/path/length");
  const bytes = readFileSync(pin.path), z = lstatSync(pin.path, { bigint: true });
  ownedNeedV1(ownedFileIdentityMatchesV1(a, z) && a.size === z.size && typeof a.mtimeNs === "bigint" && typeof a.ctimeNs === "bigint"
    && a.mtimeNs === z.mtimeNs && a.ctimeNs === z.ctimeNs
    && hash(bytes) === pin.sha256, "pin bytes changed");
  return { bytes, stamp: { pin, dev: z.dev, ino: z.ino, size: z.size, mtimeNs: z.mtimeNs, ctimeNs: z.ctimeNs } };
}
/** RO helper custody only: current private invocation, existing immutable parent
 * proof and controller lease/fence. No root-physical170/model permit is exercised;
 * no bootstrapParentAuthority/lease acquisition/GraphStore write occurs here. */
function assertOwnedCustodyV1(invocation: OwnedParentInvocationV1, config: NativeInvocationConfigV1 & { expectedControllerFence: number }): void {
  ownedNeedV1(import.meta.main && ownedParentInvocations.has(invocation.capability) && invocation.source.pid === process.pid
    && invocation.source.ownPath === resolve(config.ownPath) && invocation.source.controllerFence === config.expectedControllerFence
    && Date.now() < Math.min(config.expiresAt, invocation.source.expiresAt)
    && hash(readFileSync(import.meta.path)) === invocation.source.programSha256, "private current invocation");
  const db = new Database(resolve(config.ownPath), { readonly: true });
  try { db.transaction(() => {
    const lease = db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(config.missionId) as { lease_owner: string; lease_token: number; lease_until: number } | null;
    ownedNeedV1(lease && lease.lease_owner === config.controllerId && lease.lease_token === config.expectedControllerFence
      && Number.isSafeInteger(lease.lease_until) && lease.lease_until > Date.now(), "current controller custody fence");
    const identity = localInvocationProviderV1(invocation, config).verifyParent({ now: Date.now(), lease: { missionId: config.missionId,
      owner: lease.lease_owner, token: lease.lease_token, expiresAt: lease.lease_until } });
    const parent = db.query("SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?").get(config.missionId) as { document: string; digest: string; event_key: string } | null;
    ownedNeedV1(identity && parent && parent.document === canonical(identity) && parent.digest === hash(canonical(identity)), "retained parent custody identity");
    const event = db.query("SELECT kind,time,payload,unit_id,digest FROM ff8_events WHERE mission=? AND key=?").get(config.missionId, parent.event_key) as { kind: string; time: number; payload: string; unit_id: string | null; digest: string } | null;
    ownedNeedV1(event && event.kind === "parent_authority_bootstrapped" && event.payload === canonical(identity)
      && event.digest === hash(canonical({ kind: event.kind, time: event.time, payload: identity, unitId: event.unit_id })), "retained parent custody event");
  })(); } finally { db.close(); }
}
interface LiveOwnedHostV1 {
  invocation: OwnedParentInvocationV1; config: OwnedReadonlyParentRequestV2; child: ChildProcess; pid: number; parentPid: number;
  origin: string; nonce: string; password: string; authorization: string; epoch: string;
  expiresAt: number; monotonicExpiry: number; abort: AbortController; closed: boolean;
  provenance: OwnedNpmHostProvenanceV1; stamps: OwnedPinStampV1[];
  nativeDb: OwnedFileIdentityV1 & { path: string }; ownDb: OwnedFileIdentityV1 & { path: string };
}
const ownedLiveHostsV1 = new WeakMap<object, LiveOwnedHostV1>();
interface OwnedAuthParentRequestV1 extends NativeInvocationConfigV1 {
  version: "rms-parent-owned-auth-request-v1"; purpose: "connect-owned-openai-auth-v1"; expectedControllerFence: number;
  intentId: string; ui: "private-parent-ipc-v1";
  connection: { kind: "owned-bun-openai-auth-v1"; namespace: string; provenance: OwnedAuthProvenanceV1 };
}
// Fixed deployment destinations. Candidate files are delivered under mission222;
// only the parent deploys them. These candidate byte pins confer no launch GO.
const ownedAuthBootstrapPinV1: OwnedHostFilePinV1 = { path: `${ownedHostRootV1}/bootstrap-auth-v1.mjs`, byteLength: 10124, sha256: "398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76" };
const ownedAuthPlanPinV1: OwnedHostFilePinV1 = { path: `${ownedHostRootV1}/host-plan-auth-v1.json`, byteLength: 1329, sha256: "2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880" };
function parseOwnedAuthParentRequestV1(value: unknown): OwnedAuthParentRequestV1 {
  assertExecutionJsonV1(value); const v = value as OwnedAuthParentRequestV1;
  ownedNeedV1(v && canonical(Object.keys(v).sort()) === canonical(["version", "purpose", "missionId", "ownPath", "controllerId", "principalId", "actorId", "mandateRef", "expiresAt", "expectedControllerFence", "intentId", "ui", "connection"].sort())
    && v.version === "rms-parent-owned-auth-request-v1" && v.purpose === "connect-owned-openai-auth-v1" && v.ui === "private-parent-ipc-v1"
    && /^[A-Za-z0-9_-]{1,80}$/.test(v.intentId), "auth request refused");
  ownedNeedV1(v.connection && canonical(Object.keys(v.connection).sort()) === canonical(["kind", "namespace", "provenance"])
    && v.connection.kind === "owned-bun-openai-auth-v1" && ownedPathKeyV1(v.connection.namespace) === ownedPathKeyV1(ownedHostRootV1), "auth connection refused");
  const p = v.connection.provenance;
  ownedNeedV1(p && canonical(Object.keys(p).sort()) === canonical(["base", "bootstrap", "plan", "version"])
    && p.version === "rms-owned-auth-provenance-v1" && canonical(p.bootstrap) === canonical(ownedAuthBootstrapPinV1)
    && canonical(p.plan) === canonical(ownedAuthPlanPinV1), "auth reviewed bootstrap/plan required");
  parseOwnedReadonlyParentRequestV2({ version: "rms-parent-owned-readonly-request-v2", purpose: "inspect-owned-http-readonly-v1",
    missionId: v.missionId, ownPath: v.ownPath, controllerId: v.controllerId, principalId: v.principalId, actorId: v.actorId,
    mandateRef: v.mandateRef, expiresAt: v.expiresAt, expectedControllerFence: v.expectedControllerFence,
    connection: { kind: "owned-bun-http-readonly-v1", namespace: v.connection.namespace, provenance: p.base } });
  return Object.freeze(JSON.parse(canonical(v)));
}
interface LiveOwnedAuthV1 {
  invocation: OwnedParentInvocationV1; config: OwnedAuthParentRequestV1; graph: GraphStore; child: ChildProcess; pid: number; parentPid: number;
  origin: string; authorization: string; epoch: string; expiresAt: number; monotonicExpiry: number; abort: AbortController; closed: boolean;
  stamps: OwnedPinStampV1[]; nativeDb: OwnedFileIdentityV1 & { path: string }; ownDb: OwnedFileIdentityV1 & { path: string };
}
const ownedAuthHostsV1 = new WeakMap<object, LiveOwnedAuthV1>();
function ownedAuthAuthorityV1(s: Pick<LiveOwnedAuthV1, "config" | "graph">): ControllerAuthority {
  const row = s.graph.db.query("SELECT lease_until FROM ff8_missions WHERE id=?").get(s.config.missionId) as { lease_until: number } | null;
  ownedNeedV1(row, "auth controller unavailable");
  return { now: Math.max(Date.now(), s.graph.events.cursor(s.config.missionId).time), lease: { missionId: s.config.missionId,
    owner: s.config.controllerId, token: s.config.expectedControllerFence, expiresAt: row.lease_until } };
}
/** NON-MINTING verifier, separate WeakMap and port domain from readonly/work. */
export function verifyOwnedAuthHostCapabilityV1(capability: unknown): OwnedAuthConnectionViewV1 | undefined {
  if (!capability || typeof capability !== "object") return undefined;
  const s = ownedAuthHostsV1.get(capability); if (!s) return undefined;
  try {
    ownedNeedV1(ownedHostLiveFactsMatchV1({ closed: s.closed, aborted: s.abort.signal.aborted, connected: s.child.connected,
      exitCode: s.child.exitCode, signalCode: s.child.signalCode, pid: s.child.pid ?? 0, expectedPid: s.pid, parentPid: s.parentPid,
      expectedParentPid: process.pid, expiresAt: s.expiresAt, monotonicExpiry: s.monotonicExpiry }, Date.now(), performance.now())
      && process.connected && ownedWindowsExecutablePathsMatchV1(s.child.spawnfile, s.config.connection.provenance.base.runtime.executable.path), "auth live handle refused");
    assertOwnedCustodyV1(s.invocation, s.config);
    const state = s.graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1(s), s.invocation.capability, s.config.intentId, hash(canonical(s.config.connection.provenance)));
    for (const held of s.stamps) {
      const now = lstatSync(held.pin.path, { bigint: true });
      ownedNeedV1(now.isFile() && !now.isSymbolicLink() && ownedFileIdentityMatchesV1(now, held) && now.size === held.size
        && now.mtimeNs === held.mtimeNs && now.ctimeNs === held.ctimeNs && ownedPathKeyV1(realpathSync(held.pin.path)) === ownedPathKeyV1(held.pin.path), "auth pin changed");
    }
    for (const file of [s.nativeDb, s.ownDb]) { const st = lstatSync(file.path, { bigint: true });
      ownedNeedV1(st.isFile() && !st.isSymbolicLink() && ownedFileIdentityMatchesV1(st, file)
        && ownedPathKeyV1(realpathSync(file.path)) === ownedPathKeyV1(file.path), "auth DB identity changed"); }
    return { kind: "owned-openai-auth-only-v1", origin: s.origin, pid: s.pid, epoch: s.epoch, authorization: s.authorization,
      signal: s.abort.signal, intentId: s.config.intentId, pinsSha256: state.intent.pinsSha256, attemptId: state.attemptId };
  } catch { s.closed = true; s.abort.abort(); ownedAuthHostsV1.delete(capability); return undefined; }
}
/** Transport calls this statically; callers cannot supply a claim/verifier. */
export function claimOwnedAuthConnectV1(capability: unknown): boolean {
  if (!verifyOwnedAuthHostCapabilityV1(capability)) return false;
  const s = ownedAuthHostsV1.get(capability as object)!;
  const state = s.graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1(s), s.invocation.capability, s.config.intentId, hash(canonical(s.config.connection.provenance)));
  if (state.claimed || state.stopped) return false;
  s.graph.transitionOwnedAuthIntentV1(ownedAuthAuthorityV1(s), s.invocation.capability, state.intent.id, state.intent.pinsSha256, state.revision, state.digest, "CONNECT_CLAIMED", null);
  return !!verifyOwnedAuthHostCapabilityV1(capability);
}
function invalidateOwnedHostV1(state: LiveOwnedHostV1): void { state.closed = true; state.abort.abort(); }
/** NON-MINTING. Imported statically by the transport; no caller verifier/register
 * hook exists. JSON, stale receipts and successful pure fact checks cannot pass. */
export function verifyOwnedNativeHostCapabilityV1(capability: unknown): OwnedHostConnectionViewV1 | undefined {
  if (!capability || typeof capability !== "object") return undefined;
  const state = ownedLiveHostsV1.get(capability); if (!state) return undefined;
  try {
    ownedNeedV1(ownedHostLiveFactsMatchV1({ closed: state.closed, aborted: state.abort.signal.aborted, connected: state.child.connected, exitCode: state.child.exitCode,
      signalCode: state.child.signalCode, pid: state.child.pid ?? 0, expectedPid: state.pid, parentPid: state.parentPid,
      expectedParentPid: process.pid, expiresAt: state.expiresAt, monotonicExpiry: state.monotonicExpiry }, Date.now(), performance.now())
      && ownedPathKeyV1(state.child.spawnfile) === ownedPathKeyV1(state.provenance.runtime.executable.path), "live owned child");
    assertOwnedCustodyV1(state.invocation, state.config);
    for (const held of state.stamps) {
      const now = lstatSync(held.pin.path, { bigint: true });
      ownedNeedV1(now.isFile() && !now.isSymbolicLink() && ownedFileIdentityMatchesV1(now, held) && now.size === held.size
        && now.mtimeNs === held.mtimeNs && now.ctimeNs === held.ctimeNs
        && ownedPathKeyV1(realpathSync(held.pin.path)) === ownedPathKeyV1(held.pin.path), "live pinned file changed");
    }
    for (const file of [state.nativeDb, state.ownDb]) { const s = lstatSync(file.path, { bigint: true });
      ownedNeedV1(s.isFile() && !s.isSymbolicLink() && ownedFileIdentityMatchesV1(s, file)
        && ownedPathKeyV1(realpathSync(file.path)) === ownedPathKeyV1(file.path), "owned DB identity changed"); }
    return { origin: state.origin, pid: state.pid, epoch: state.epoch, authorization: state.authorization,
      signal: state.abort.signal, provenance: JSON.parse(canonical(state.provenance)) };
  } catch { invalidateOwnedHostV1(state); ownedLiveHostsV1.delete(capability); return undefined; }
}
function writeOwnedNewV1(file: string, bytes: Buffer | string): void {
  const fd = openSync(file, "wx", 0o600), b = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes); let failed = false;
  try { let offset = 0, calls = 0;
    while (offset < b.length) { if (calls++ >= Math.min(b.length, 4096)) throw new Error("write bound");
      const n = writeSync(fd, b, offset, b.length - offset, null);
      if (!Number.isInteger(n) || n < 1 || n > b.length - offset) throw new Error("write progress");
      if (n < b.length - offset) failed = true; offset += n; }
  } catch { failed = true; }
  try { fsyncSync(fd); } catch { failed = true; } try { closeSync(fd); } catch { failed = true; }
  ownedNeedV1(!failed, "owned output I/O; partial preserved");
}
async function ownedBoundedWaitV1<T>(pending: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([pending, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("owned wait deadline")), Math.max(1, ms)); })]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}
/** Lexical installed-file verification with the existing readFile(signal) API.
 * Admission bytes are DECLARED/NOMINAL only: a file growing after pre-stat may
 * allocate more. Hash/length/post-stat reject it, not retroactively bound RSS. */
async function verifyOwnedInstalledFileV1(root: string, row: OwnedClosureRowV1, context: OwnedClosureCheckV1, signal: AbortSignal): Promise<void> {
  const file = join(root, row.path);
  const wait = async <T>(stage: string, op: () => Promise<T>): Promise<T> => {
    context.check(stage); try { return await op(); } finally { context.check(stage); }
  };
  const facts = (s: BigIntStats, canonicalPath: boolean): OwnedClosureFileFactsV1 => ({
    dev: s.dev, ino: s.ino, size: s.size, mtimeNs: s.mtimeNs, ctimeNs: s.ctimeNs,
    regular: s.isFile(), nonLink: !s.isSymbolicLink(), canonical: canonicalPath });
  const preStat = await wait("lstat-before", () => lstatAsync(file, { bigint: true }));
  const preReal = await wait("realpath-before", () => realpathAsync(file));
  const before = facts(preStat, ownedPathKeyV1(preReal) === ownedPathKeyV1(file));
  ownedNeedV1(ownedClosureFileFactsMatchV1(row, before, before), "installed pre-read path/identity");
  const bytes = await wait("read", () => readFileAsync(file, { signal }));
  context.check("hash"); const sha256 = hash(bytes); context.check("hash");
  const postStat = await wait("lstat-after", () => lstatAsync(file, { bigint: true }));
  const postReal = await wait("realpath-after", () => realpathAsync(file));
  assertOwnedClosureFileProofV1(row, before, facts(postStat, ownedPathKeyV1(postReal) === ownedPathKeyV1(file)), bytes.length, sha256);
}
/** Private, fixed lexical read body, not a caller callback/worker API. Bun owns
 * Bun directly here. Node->Bun193 does NOT qualify this new launch boundary. */
async function withOwnedNativeHostV1(invocation: OwnedParentInvocationV1, config: OwnedReadonlyParentRequestV2): Promise<Record<string, unknown>> {
  const started = performance.now(), expiresAt = Math.min(config.expiresAt, Date.now() + 120000);
  const monotonicDeadline = started + Math.min(120000, Math.max(0, expiresAt - Date.now()));
  const budget = ownedFinalizationBudgetV1(started, monotonicDeadline);
  const abort = new AbortController(), nonce = randomBytes(32).toString("hex"), password = randomBytes(32).toString("hex");
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`;
  const privateValues = [nonce, password, authorization, authorization.slice(6)];
  let root: string | undefined, child: ChildProcess | undefined, pid: number | undefined, live: LiveOwnedHostV1 | undefined;
  let cap: OwnedHostCapabilityV1 | undefined, fault: string | undefined, forced = false, closed = false, scopeClosed = false, stopping = false;
  let readyReceived = false;
  let childExit: { code: number | null; signal: string | null } | undefined, resolveClose!: () => void, resolveReady!: (m: any) => void, rejectReady!: (e: Error) => void;
  const close = new Promise<void>(r => { resolveClose = r; }), ready = new Promise<any>((r, j) => { resolveReady = r; rejectReady = j; }); void ready.catch(() => {});
  const phases: string[] = [], stamps: OwnedPinStampV1[] = [], checks: Array<Record<string, unknown>> = [];
  const preflight = ownedClosureProgressV1(32227); let preflightHoldEmitted = false;
  const logs = ["stdout", "stderr"].map(channel => ({ channel, chunks: [] as Buffer[], received: 0, kept: 0, truncated: false }));
  const hold = (reason: string) => {
    fault ??= reason; abort.abort(); rejectReady(new Error("owned readonly boundary refused"));
    if (preflight.phase !== "complete") {
      preflight.hold = true; preflight.phase = preflight.inFlight ? "draining" : "HOLD"; preflight.elapsedMs = Math.max(preflight.elapsedMs, performance.now() - started);
      if (!preflightHoldEmitted) { preflightHoldEmitted = true;
        try { console.log(JSON.stringify({ event: "native-owned-preflight-progress-v1", status: "HOLD", invocationId: invocation.source.invocationId, progress: { ...preflight } })); } catch {}
      }
    }
  };
  const deadlineCheck = () => { const ok = budget.checkpoint(); if (!ok) hold("owned total monotonic deadline exceeded during finalization"); return ok; };
  const left = () => Math.max(0, monotonicDeadline - performance.now());
  const kill = () => { if (!child || closed || forced) return; forced = true;
    if (child.pid !== pid || !pid || pid === process.pid || ownedPathKeyV1(child.spawnfile) !== ownedPathKeyV1(config.connection.provenance.runtime.executable.path)) { hold("owned kill identity refused"); return; }
    try { if (!child.kill("SIGKILL")) hold("owned child kill unconfirmed"); } catch { hold("owned child kill refused"); } };
  const workTimer = setTimeout(() => hold("owned work deadline; reserve shutdown"), Math.min(105000, Math.max(1, expiresAt - Date.now() - 15000)));
  const forceTimer = setTimeout(kill, Math.min(115000, Math.max(1, expiresAt - Date.now() - 5000)));
  const totalTimer = setTimeout(() => { hold("owned total deadline"); kill(); }, Math.max(1, expiresAt - Date.now()));
  const result: Record<string, unknown> = { version: "rms-owned-readonly-observation-v2", status: "HOLD", purpose: config.purpose,
    nativeLoadEvidence: "UNPROVEN", bunParentBoundary: "UNQUALIFIED_BEFORE_PARENT_TEST", scientificAuthority: false, requestedSessionOrModelEffects: 0, checks, preflightProgress: preflight };
  try {
    assertOwnedCustodyV1(invocation, config);
    ownedNeedV1(deadlineCheck(), "owned initial deadline");
    ownedNeedV1(process.platform === "win32" && process.arch === "x64" && process.versions.bun === "1.4.2"
      && process.execArgv.length === 0 && import.meta.url.startsWith("file:") && !import.meta.url.includes("$bunfs")
      && (!Bun.embeddedFiles || Bun.embeddedFiles.length === 0), "direct Bun parent runtime");
    const p = config.connection.provenance;
    // Closed reviewed bootstrap/policy, not caller-selected executable code.
    ownedNeedV1(ownedPathKeyV1(p.plan.path) === ownedPathKeyV1(join(ownedHostRootV1, "host-plan.json"))
      && p.plan.byteLength === 16302 && p.plan.sha256 === "5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67"
      && ownedPathKeyV1(p.bootstrap.path) === ownedPathKeyV1(join(ownedHostRootV1, "bootstrap-host.mjs"))
      && p.bootstrap.byteLength === 10061 && p.bootstrap.sha256 === "e25c43c7b4b2fd9a9f1dba7ece1dcc42d27a7650ee3444f9b2c2eec340cf9a99"
      && p.runtime.executable.sha256 === "15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4"
      && p.runtime.executable.byteLength === 86096984 && ownedPathKeyV1(process.execPath) === ownedPathKeyV1(p.runtime.executable.path), "approved bootstrap/runtime policy pins");
    const retainPin = (pin: OwnedHostFilePinV1) => { const read = readOwnedPinV1(pin); stamps.push(read.stamp); return read.bytes; };
    const plan = JSON.parse(retainPin(p.plan).toString("utf8"));
    ownedNeedV1(plan.namespace === ownedHostRootV1 && plan.totalMs === 120000 && canonical(plan.allowedRawTargets) === canonical(["/api/info", "/openapi.json"])
      && canonical(plan.scripts.bootstrap) === canonical(p.bootstrap) && canonical(plan.runtime.bun) === canonical({ ...p.runtime.executable, version: "1.4.2" }), "pinned public host options");
    retainPin(p.bootstrap); retainPin(p.runtime.executable);
    for (const pin of plan.inputs) retainPin({ path: pin.path, byteLength: pin.byteLength, sha256: pin.sha256 });
    const rolePin = (role: string) => { const q = plan.inputs.find((v: any) => v.role === role); ownedNeedV1(q, "pinned closure role"); return { path: q.path, byteLength: q.byteLength, sha256: q.sha256 }; };
    ownedNeedV1(canonical(rolePin("host-source-referent-raw-npm-server-distribution")) === canonical(p.rawSource.archive)
      && canonical(rolePin("installed-closure")) === canonical(p.closure.installed)
      && canonical(rolePin("archive-closure-367-parent-sri-evidence")) === canonical(p.closure.archives), "typed raw source/closure pins");
    const proposedRoot = join(ownedHostRootV1, `qualification-${randomUUID()}`); mkdirSync(proposedRoot); root = proposedRoot;
    result.outputRoot = root; result.provenance = p;
    const closure = JSON.parse(readOwnedPinV1(p.closure.installed).bytes.toString("utf8"));
    ownedNeedV1(canonical(Object.keys(closure).sort()) === canonical(["fileCount", "files", "lockSha256", "meaning", "root", "totalBytes", "version"])
      && closure.version === "rms-owned-installed-file-closure-v1" && closure.fileCount === 32227 && Array.isArray(closure.files) && closure.files.length === 32227 && closure.totalBytes === 332635368
      && closure.lockSha256 === plan.lockSha256 && ownedPathKeyV1(closure.root) === ownedPathKeyV1(join(ownedHostRootV1, "node_modules")), "retained installed closure");
    const complete = await verifyOwnedClosureRowsBoundedV1(closure.files, preflight, {
      signal: abort.signal,
      check() { abort.signal.throwIfAborted(); ownedNeedV1(deadlineCheck(), "installed preflight deadline"); },
      boundary() { assertOwnedCustodyV1(invocation, config); abort.signal.throwIfAborted(); ownedNeedV1(deadlineCheck(), "installed batch custody/deadline"); },
      onHold() { hold("owned installed preflight HOLD; drain only admitted reads"); },
      elapsedMs: () => performance.now() - started,
      verify: (row, context) => verifyOwnedInstalledFileV1(closure.root, row, context, abort.signal),
    });
    ownedNeedV1(complete && preflight.phase === "complete" && !preflight.hold && preflight.verified === 32227 && preflight.settled === 32227
      && preflight.failed === 0 && preflight.inFlight === 0 && preflight.reservedDeclaredBytes === 0 && preflight.bytesVerified === 332635368, "full installed closure required before spawn");
    result.preflightInstalledFiles = preflight.verified;
    const env: Record<string, string> = { SystemRoot: "C:\\Windows", WINDIR: "C:\\Windows", ComSpec: "C:\\Windows\\System32\\cmd.exe", OS: "Windows_NT", PATH: `${dirname(p.runtime.executable.path)};C:\\Windows\\System32` };
    const locations = { HOME: "home", USERPROFILE: "home", APPDATA: "appdata", LOCALAPPDATA: "localappdata", XDG_DATA_HOME: "data", XDG_CACHE_HOME: "cache", XDG_CONFIG_HOME: "xdg-config", XDG_STATE_HOME: "state", TEMP: "tmp", TMP: "tmp", ProgramData: "program-data" };
    for (const [name, rel] of Object.entries(locations)) { env[name] = join(root, rel); if (!existsSync(env[name])) mkdirSync(env[name]); }
    for (const rel of ["work", "config", "responses"]) mkdirSync(join(root, rel));
    writeOwnedNewV1(join(root, "OWN.json"), JSON.stringify({ version: 1, runnerPid: process.pid, runId: invocation.source.invocationId,
      planSha256: p.plan.sha256, purpose: config.purpose, custodyScopeSha256: invocation.source.scopeSha256 }));
    assertOwnedCustodyV1(invocation, config); abort.signal.throwIfAborted(); ownedNeedV1(deadlineCheck(), "owned spawn deadline");
    child = spawn(p.runtime.executable.path, ["run", p.bootstrap.path, p.plan.sha256, root], { cwd: join(root, "work"), env, windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"], serialization: "json" });
    pid = child.pid;
    child.on("error", () => hold("owned child/IPC error"));
    child.on("exit", () => { if (live) invalidateOwnedHostV1(live); });
    child.on("close", (code, signal) => { closed = true; childExit = { code, signal }; if (live) invalidateOwnedHostV1(live); resolveClose(); rejectReady(new Error("owned child closed")); });
    for (const [i, stream] of [child.stdout, child.stderr].entries()) { ownedNeedV1(stream, "owned log pipe"); stream.on("data", (chunk: Buffer) => {
      try { const log = logs[i]!; ownedNeedV1(Buffer.isBuffer(chunk), "owned log bytes"); log.received += chunk.length;
        if (log.received > 1048576) { log.truncated = true; hold("owned log cap"); return; } log.chunks.push(chunk); log.kept += chunk.length;
      } catch { hold("owned log capture error"); }
    }); }
    ownedNeedV1(pid && pid > 0 && pid !== process.pid && child.spawnfile === p.runtime.executable.path, "OS child handle identity");
    child.on("message", (message: unknown) => { try {
      const m = message as any; ownedNeedV1(m && typeof m === "object" && !Array.isArray(m) && m.nonce === nonce && Number.isSafeInteger(m.at), "private IPC envelope");
      const keys: Record<string, string[]> = { PHASE: ["type", "name", "at", "nonce"], READY: ["type", "at", "pid", "parentPid", "execPath", "runtime", "platform", "arch", "port", "tmp", "nativeLoadEvidence", "nonce"], SCOPE_CLOSED: ["type", "at", "pid", "nonce"], HOLD: ["type", "at", "reason", "nonce"] };
      ownedNeedV1(keys[m.type] && canonical(Object.keys(m).sort()) === canonical(keys[m.type]!.slice().sort()), "closed IPC message");
      if (m.type === "SCOPE_CLOSED") { ownedNeedV1(stopping && m.pid === pid, "owned scope shutdown identity"); scopeClosed = true; return; }
      if (m.type === "HOLD") { hold("bootstrap guard/import/scope refused"); return; }
      assertOwnedCustodyV1(invocation, config); abort.signal.throwIfAborted();
      if (m.type === "PHASE") { ownedNeedV1(m.name === ["APPLICATION_IMPORT_BEGIN", "SCOPED_START_BEGIN"][phases.length], "owned phase order"); phases.push(m.name); return; }
       ownedNeedV1(phases.length === 2 && !readyReceived && !live && m.pid === pid && m.parentPid === process.pid && ownedWindowsExecutablePathsMatchV1(m.execPath, p.runtime.executable.path)
        && m.runtime === "1.4.2" && m.platform === "win32" && m.arch === "x64" && Number.isInteger(m.port) && m.port > 0 && m.port <= 65535
        && ownedPathKeyV1(m.tmp) === ownedPathKeyV1(join(root!, "tmp/opencode")) && m.nativeLoadEvidence === "UNPROVEN", "owned READY identity"); readyReceived = true; resolveReady(m);
    } catch { hold("owned IPC/custody divergence"); } });
    child.send({ type: "INIT", nonce, password, runRoot: root, planSha256: p.plan.sha256 }, error => { if (error) hold("owned INIT send failed"); });
    const cancelled = new Promise<never>((_, reject) => { const stop = () => reject(new Error("owned scope cancelled")); if (abort.signal.aborted) stop(); else abort.signal.addEventListener("abort", stop, { once: true }); }); void cancelled.catch(() => {});
    const readyMessage = await Promise.race([ready, cancelled]);
    assertOwnedCustodyV1(invocation, config); abort.signal.throwIfAborted(); ownedNeedV1(deadlineCheck(), "owned READY deadline");
    const nativePath = join(root, "native.sqlite"), nativeStat = lstatSync(nativePath, { bigint: true }), ownStat = lstatSync(resolve(config.ownPath), { bigint: true });
    ownedNeedV1(nativeStat.isFile() && !nativeStat.isSymbolicLink() && ownedPathKeyV1(realpathSync(nativePath)) === ownedPathKeyV1(nativePath), "owned native DB created by child");
    live = { invocation, config, child, pid, parentPid: readyMessage.parentPid, origin: `http://127.0.0.1:${readyMessage.port}`, nonce, password, authorization,
      epoch: randomUUID(), expiresAt, monotonicExpiry: monotonicDeadline, abort, closed: false,
      provenance: JSON.parse(canonical(p)), stamps, nativeDb: { path: nativePath, dev: nativeStat.dev, ino: nativeStat.ino }, ownDb: { path: resolve(config.ownPath), dev: ownStat.dev, ino: ownStat.ino } };
    result.custodyData = { version: "rms-owned-readonly-custody-DATA-v2", parentPid: process.pid, childPid: pid,
      origin: live.origin, epoch: live.epoch, expiresAt: live.expiresAt, controllerFence: invocation.source.controllerFence,
      parentProgramSha256: invocation.source.programSha256, scopeSha256: invocation.source.scopeSha256,
      ownDb: { path: live.ownDb.path, ...ownedFileIdentityDataV1(live.ownDb) },
      nativeDb: { path: live.nativeDb.path, ...ownedFileIdentityDataV1(live.nativeDb) }, memoryEquivalence: false, authorityFromReceipt: false };
    // The only mint: inside main's owned invocation, after the real handle/READY.
    cap = Object.freeze({}) as OwnedHostCapabilityV1; ownedLiveHostsV1.set(cap, live);
    ownedNeedV1(verifyOwnedNativeHostCapabilityV1(cap), "new cap still live");
    const port = await connectOwnedNativeRuntimeHttpV1(cap);
    // Fixed lexical read body; no callback, generic HTTP, session or model API.
    for (const target of ["/api/info", "/openapi.json"] as const) {
      const response = await port.request("GET", target, undefined, abort.signal), bytes = Buffer.from(await response.arrayBuffer());
      ownedNeedV1(verifyOwnedNativeHostCapabilityV1(cap), "custody after read body");
      ownedNeedV1(response.status === 200 && (response.headers.get("content-type") ?? "").split(";")[0]?.trim() === "application/json"
        && !privateValues.some(secret => bytes.includes(Buffer.from(secret))), "readonly response/refuse secret");
      const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      if (target === "/api/info") ownedNeedV1(data.pid === pid && data.version === "2.2.1" && Array.isArray(data.urls) && data.urls.includes(live.origin)
        && ownedPathKeyV1(data.paths?.tmp ?? "") === ownedPathKeyV1(join(root, "tmp/opencode")), "owned info readback");
      else ownedNeedV1(typeof data.openapi === "string" && data.openapi.startsWith("3.") && data.paths?.["/api/info"]?.get, "owned OpenAPI shape");
      const file = join(root, "responses", target === "/api/info" ? "info.bin" : "openapi.bin");
      ownedNeedV1(deadlineCheck(), "owned response write deadline"); writeOwnedNewV1(file, bytes);
      ownedNeedV1(deadlineCheck(), "owned response sync deadline");
      checks.push({ method: "GET", rawTarget: target, status: response.status, response: { path: file, byteLength: bytes.length, sha256: hash(bytes) } });
    }
  } catch { hold("owned readonly preparation/custody/read refused"); }
  finally {
    clearTimeout(workTimer); stopping = true;
    if (live) invalidateOwnedHostV1(live); else abort.abort(); if (cap) ownedLiveHostsV1.delete(cap);
    if (child && !closed) {
      try { if (child.connected) child.send({ type: "STOP", nonce }, error => { if (error) hold("owned STOP send failed"); }); } catch { hold("owned STOP threw"); }
      try { await ownedBoundedWaitV1(close, Math.min(8000, Math.max(1, left() - 6000))); } catch { kill(); }
      if (!closed) try { await ownedBoundedWaitV1(close, Math.max(1, left() - 1000)); } catch { hold("owned child close unproven"); }
    }
    // Total/force timers and the sticky monotonic guard remain armed through
    // logs, fsync/close, provisional receipt readback AND candidate publication.
    try {
      if (child && !closed) { try { child.stdout?.destroy(); child.stderr?.destroy(); if (child.connected) child.disconnect(); child.unref(); } catch { hold("owned detached cleanup uncertain"); } }
      const logFacts: Array<Record<string, unknown>> = [];
      deadlineCheck();
      for (const log of logs) {
        deadlineCheck();
        const raw = Buffer.concat(log.chunks), secret = privateValues.some(s => raw.includes(Buffer.from(s)));
        const safe = secret ? Buffer.from(privateValues.reduce((text, s) => text.replaceAll(s, "[PRIVATE_REDACTED]"), raw.toString("utf8"))) : raw;
        if (secret || log.truncated) hold("owned log redaction/truncation");
        if (/Failed to load lib|Failed to initialize OpenTUI|Failed to enable PTY|shared library not found/.test(safe.toString("utf8"))) hold("owned native initialization error observed");
        let written = false; if (root) try { deadlineCheck(); writeOwnedNewV1(join(root, `${log.channel}.bin`), safe); written = true; }
        catch { hold("owned log output I/O; partial retained"); } finally { deadlineCheck(); }
        logFacts.push({ channel: log.channel, receivedBytes: log.received, keptBytes: log.kept, redacted: secret, truncated: log.truncated,
          byteExact: written && closed && !secret && !log.truncated && log.received === raw.length });
      }
      if (!closed || !scopeClosed || childExit?.code !== 0 || forced) hold("owned graceful scope/child closure not proved");
      Object.assign(result, { failure: fault ?? null, pid: pid ?? null, scopeClosed, childClosed: closed,
        childExit: childExit ?? null, forced, logs: logFacts, invocationId: invocation.source.invocationId, noRetryOrCleanup: true,
        completionProtocol: { version: "rms-owned-readonly-parent-final-outcome-v1", provisionalAloneAdoptable: false,
          candidateAloneAdoptable: false, requiresExactProvisionalReceiptSha256: true, requiresExactCandidateSha256: true,
          requiresCandidateStatus: "READONLY_BOUNDARIES_MATCHED_NATIVE_LOAD_UNPROVEN", requiresParentObservedInvocationExitZero: true,
          requiresParentConfigurationNotExpired: true, requiresParentMeasuredWholeInvocationAtMostMs: Math.min(120000, monotonicDeadline - started),
          hardMaximumTotalMs: 120000 } });
      let receiptReady = false;
      if (root) try {
        deadlineCheck();
        // NEVER prewrite a successful receipt. Even a complete late fsync leaves
        // only a provisional artifact, not an adoptable SUCCESS on disk.
        const provisional = { ...result, version: "rms-owned-readonly-provisional-receipt-v2", status: "PROVISIONAL_NOT_ADOPTABLE",
          deadline: budget.snapshot(), durationMs: Math.round(performance.now() - started) };
        const bytes = Buffer.from(JSON.stringify(provisional, null, 2)), file = join(root, "receipt.json");
        deadlineCheck(); writeOwnedNewV1(file, bytes); deadlineCheck();
        const receiptRef = { path: file, byteLength: bytes.length, sha256: hash(bytes) };
        deadlineCheck(); readOwnedPinV1(receiptRef); deadlineCheck();
        result.provisionalReceipt = receiptRef; receiptReady = true;
      } catch { hold("owned provisional receipt I/O failed; partial preserved"); }
      finally { deadlineCheck(); }
      if (!receiptReady) hold("owned provisional receipt unavailable");
      deadlineCheck();
      const finalBudgetOutcome = budget.outcome(!fault && checks.length === 2 && receiptReady);
      if (finalBudgetOutcome === "HOLD_TOTAL_DEADLINE") deadlineCheck();
      Object.assign(result, { status: finalBudgetOutcome === "CANDIDATE_WITHIN_DEADLINE" ? "READONLY_BOUNDARIES_MATCHED_NATIVE_LOAD_UNPROVEN" : finalBudgetOutcome,
        failure: fault ?? null, deadline: budget.snapshot(), durationMs: Math.round(performance.now() - started) });
      // This is a CANDIDATE, not the parent's final attestation. Adoption also
      // requires the parent's actual end/exit/duration and both exact hashes.
      let envelope = JSON.stringify({ event: "native-owned-readonly-candidate-v2", invocationId: invocation.source.invocationId,
        resultSha256: hash(canonical(result)), data: result, nativeQualification: "NOT_ATTESTED" });
      if (!deadlineCheck()) envelope = JSON.stringify({ event: "native-owned-readonly-candidate-refused-v2", status: "HOLD_TOTAL_DEADLINE",
        invocationId: invocation.source.invocationId, provisionalReceipt: result.provisionalReceipt ?? null });
      try { console.log(envelope); } catch { hold("owned candidate output failed"); }
      if (!deadlineCheck()) {
        result.status = "HOLD_TOTAL_DEADLINE";
        try { console.error(JSON.stringify({ event: "native-owned-readonly-candidate-invalidated-v2", status: "HOLD_TOTAL_DEADLINE",
          invocationId: invocation.source.invocationId, provisionalReceipt: result.provisionalReceipt ?? null })); } catch {}
      }
    } finally {
      if (!deadlineCheck()) result.status = "HOLD_TOTAL_DEADLINE";
      else if (fault) result.status = "HOLD";
      result.failure = fault ?? null; result.deadline = budget.snapshot(); result.durationMs = Math.round(performance.now() - started);
      clearTimeout(forceTimer); clearTimeout(totalTimer); ownedParentInvocations.delete(invocation.capability);
    }
  }
  if (!deadlineCheck()) result.status = "HOLD_TOTAL_DEADLINE";
  else if (fault) result.status = "HOLD";
  result.failure = fault ?? null; result.deadline = budget.snapshot(); result.durationMs = Math.round(performance.now() - started);
  return result;
}
async function nativeHostJsonV1(port: NativeRuntimeHttpPortV1, route: string, signal: AbortSignal): Promise<any | null> {
  signal.throwIfAborted(); const r = await port.request("GET", route, undefined, signal);
  if (r.status === 404) { await r.body?.cancel().catch(() => {}); return null; }
  if (!r.ok || r.redirected || (r.headers.get("content-type") ?? "").split(";")[0]?.trim() !== "application/json")
    throw new Error("native host authenticated snapshot unavailable");
  const reader = r.body?.getReader(); if (!reader) throw new Error("native host snapshot empty");
  const chunks: Uint8Array[] = []; let bytes = 0;
  try { for (;;) { signal.throwIfAborted(); const next = await reader.read(); if (next.done) break;
    bytes += next.value.length; if (bytes > 262144) throw new Error("native host snapshot bound exceeded"); chunks.push(next.value);
  } } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); assertExecutionJsonV1(value); return value;
}
/** Auth-only composition. No callback-supplied verifier, model grant or work body.
 * The native parent must provide a PRIVATE IPC UI relay, never a captured stdout
 * or file. No HTTP effect is admitted until that relay acknowledges readiness. */
async function withOwnedAuthHostV1(invocation: OwnedParentInvocationV1, config: OwnedAuthParentRequestV1): Promise<Record<string, unknown>> {
  const started = performance.now(), expiresAt = Math.min(config.expiresAt, Date.now() + 240000);
  const deadline = started + Math.max(0, expiresAt - Date.now()), budget = ownedAuthBudgetV1(started, deadline);
  const abort = new AbortController(), nonce = randomBytes(32).toString("hex"), password = randomBytes(32).toString("hex");
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`;
  let graph: GraphStore | undefined, child: ChildProcess | undefined, live: LiveOwnedAuthV1 | undefined, cap: object | undefined;
  let fault: string | undefined, closed = false, scopeClosed = false, stopping = false, forced = false, pid: number | undefined;
  let childExit: { code: number | null; signal: string | null } | undefined, resolveClose!: () => void, resolveReady!: (m: any) => void;
  let resolveAttempt: (() => void) | undefined, attemptId: string | null = null, complete = false, retainedIntent = false, readyReceived = false;
  const close = new Promise<void>(resolve => { resolveClose = resolve; }), ready = new Promise<any>(resolve => { resolveReady = resolve; });
  const preflight = ownedClosureProgressV1(32227), stamps: OwnedPinStampV1[] = [], phases: string[] = [];
  const logs = ["stdout", "stderr"].map(channel => ({ channel, receivedBytes: 0, retainedBytes: 0, discarded: true, byteExact: false }));
  const hold = (code: string) => { fault ??= code; abort.abort(); };
  const parentDisconnected = () => hold("AUTH_PRIVATE_PARENT_DISCONNECTED"); process.once("disconnect", parentDisconnected);
  const checkpoint = () => { if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE"); abort.signal.throwIfAborted(); };
  const left = () => Math.max(0, deadline - performance.now());
  const kill = () => { if (!child || closed || forced) return; forced = true;
    if (pid && child.pid === pid && pid !== process.pid && ownedWindowsExecutablePathsMatchV1(child.spawnfile, config.connection.provenance.base.runtime.executable.path)) {
      try { child.kill("SIGKILL"); } catch { hold("AUTH_CHILD_KILL_REFUSED"); }
    } else hold("AUTH_CHILD_KILL_IDENTITY_REFUSED"); };
  const workTimer = setTimeout(() => hold("AUTH_WORK_DEADLINE_RESERVE_CLOSE"), Math.max(1, left() - 15000));
  const forceTimer = setTimeout(kill, Math.max(1, left() - 5000));
  const totalTimer = setTimeout(() => { hold("AUTH_TOTAL_DEADLINE"); kill(); }, Math.max(1, left()));
  const result: Record<string, unknown> = { version: "rms-owned-auth-outcome-v1", status: "HOLD", authOnly: true, provider: "openai", method: "chatgpt-headless",
    intentId: config.intentId, invocationId: invocation.source.invocationId, nativeLoadEvidence: "UNPROVEN", workAuthority: false,
    modelOrSessionEffects: 0, rootOrOriginAuthority: false, preflightProgress: preflight, logs, noRetryOrCleanup: true };
  const current = () => { checkpoint(); ownedNeedV1(process.connected, "auth private parent disconnected"); assertOwnedCustodyV1(invocation, config);
    ownedNeedV1(graph, "auth OWN unavailable"); return graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1({ graph, config }), invocation.capability, config.intentId, hash(canonical(config.connection.provenance))); };
  const transition = (status: import("./graph-runtime-binding").OwnedAuthTransitionV1["status"], id: string | null) => {
    const s = current(); return graph!.transitionOwnedAuthIntentV1(ownedAuthAuthorityV1({ graph: graph!, config }), invocation.capability,
      config.intentId, s.intent.pinsSha256, s.revision, s.digest, status, id);
  };
  const wait = async <T>(op: () => Promise<T>): Promise<T> => { current(); try { return await op(); } finally { current(); } };
  const privateUi = async (challenge?: ReturnType<typeof ownedAuthChallengeV1>) => {
    current(); ownedNeedV1(process.connected && typeof process.send === "function", "auth private parent UI IPC required");
    const uiNonce = randomBytes(32).toString("hex"), type = challenge ? "RMS_AUTH_PRIVATE_UI_CHALLENGE" : "RMS_AUTH_PRIVATE_UI_READY";
    let listener!: (m: unknown) => void, stop!: () => void, timer: ReturnType<typeof setTimeout> | undefined;
    try { await new Promise<void>((resolveUi, rejectUi) => {
      const refuse = () => { hold("AUTH_PRIVATE_UI_UNAVAILABLE"); rejectUi(new Error("AUTH_PRIVATE_UI_UNAVAILABLE")); }; stop = refuse;
      listener = (message: unknown) => { const m = message as any;
        if (m?.type !== `${type}_ACK`) return;
        if (canonical(Object.keys(m).sort()) !== canonical(["type", "intentId", "uiNonce"].sort()) || m.intentId !== config.intentId || m.uiNonce !== uiNonce) return refuse();
        resolveUi(); };
      process.on("message", listener); abort.signal.addEventListener("abort", stop, { once: true });
      timer = setTimeout(refuse, Math.min(5000, Math.max(1, left() - 15000)));
      if (abort.signal.aborted) return refuse();
      process.send!({ type, intentId: config.intentId, uiNonce, ...(challenge ? { challenge } : {}) }, (error: Error | null) => { if (error) refuse(); });
    }); } finally { if (timer !== undefined) clearTimeout(timer); if (listener) process.off("message", listener); if (stop) abort.signal.removeEventListener("abort", stop); current(); }
  };
  try {
    assertOwnedCustodyV1(invocation, config); checkpoint();
    ownedNeedV1(process.connected && typeof process.send === "function" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(config.intentId), "auth native private UI and UUID required");
    ownedNeedV1(process.platform === "win32" && process.arch === "x64" && process.versions.bun === "1.4.2" && process.execArgv.length === 0
      && import.meta.url.startsWith("file:") && !import.meta.url.includes("$bunfs") && (!Bun.embeddedFiles || Bun.embeddedFiles.length === 0), "auth direct Bun parent required");
    graph = new GraphStore(resolve(config.ownPath), { parentAuthority: localInvocationProviderV1(invocation, config), nativeParentInvocation: invocation });
    const a = ownedAuthAuthorityV1({ graph, config }), intent: OwnedAuthIntentV1 = { version: "rms-owned-auth-intent-v1", id: config.intentId,
      authOnly: true, provider: "openai", method: "chatgpt-headless", missionId: config.missionId, controllerOwner: config.controllerId,
      controllerFence: config.expectedControllerFence, principalId: config.principalId, actorId: config.actorId, invocationId: invocation.source.invocationId,
      pid: process.pid, ownPath: resolve(config.ownPath), programSha256: invocation.source.programSha256, scopeSha256: invocation.source.scopeSha256,
      pinsSha256: hash(canonical(config.connection.provenance)), issuedAt: a.now, expiresAt };
    graph.retainOwnedAuthIntentV1(a, invocation.capability, intent); retainedIntent = true; current(); await privateUi();
    const provenance = config.connection.provenance, p = provenance.base;
    ownedNeedV1(p.plan.byteLength === 16302 && p.plan.sha256 === "5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67"
      && ownedPathKeyV1(p.plan.path) === ownedPathKeyV1(join(ownedHostRootV1, "host-plan.json"))
      && p.bootstrap.byteLength === 10061 && p.bootstrap.sha256 === "e25c43c7b4b2fd9a9f1dba7ece1dcc42d27a7650ee3444f9b2c2eec340cf9a99"
      && p.runtime.executable.byteLength === 86096984 && p.runtime.executable.sha256 === "15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4"
      && ownedWindowsExecutablePathsMatchV1(process.execPath, p.runtime.executable.path), "auth base/runtime pins refused");
    const pin = (v: OwnedHostFilePinV1) => { current(); const r = readOwnedPinV1(v); stamps.push(r.stamp); current(); return r.bytes; };
    const authPlan = JSON.parse(pin(provenance.plan).toString("utf8")), plan = JSON.parse(pin(p.plan).toString("utf8"));
    ownedNeedV1(authPlan.version === "rms-owned-auth-host-plan-v1" && authPlan.namespace === ownedHostRootV1 && authPlan.totalMs === 240000
      && authPlan.closeReserveMs === 15000 && authPlan.provider === "openai" && authPlan.method === "chatgpt-headless" && authPlan.authOnly === true
      && authPlan.simulation === false && canonical(authPlan.bootstrap) === canonical(provenance.bootstrap) && canonical(authPlan.basePlan) === canonical(p.plan)
      && plan.namespace === ownedHostRootV1 && plan.totalMs === 120000 && canonical(plan.scripts.bootstrap) === canonical(p.bootstrap)
      && canonical(plan.allowedRawTargets) === canonical(["/api/info", "/openapi.json"])
      && canonical(plan.runtime.bun) === canonical({ ...p.runtime.executable, version: "1.4.2" }), "auth public options refused");
    pin(provenance.bootstrap); pin(p.bootstrap); pin(p.runtime.executable);
    for (const v of plan.inputs) pin({ path: v.path, byteLength: v.byteLength, sha256: v.sha256 });
    for (const [role, retained] of [["installed-closure", p.closure.installed], ["archive-closure-367-parent-sri-evidence", p.closure.archives], ["host-source-referent-raw-npm-server-distribution", p.rawSource.archive]] as const) {
      const q = plan.inputs.find((v: any) => v.role === role); ownedNeedV1(q && canonical({ path: q.path, byteLength: q.byteLength, sha256: q.sha256 }) === canonical(retained), "auth source family pin refused"); }
    const closure = JSON.parse(pin(p.closure.installed).toString("utf8"));
    ownedNeedV1(canonical(Object.keys(closure).sort()) === canonical(["fileCount", "files", "lockSha256", "meaning", "root", "totalBytes", "version"])
      && closure.version === "rms-owned-installed-file-closure-v1" && closure.fileCount === 32227 && closure.totalBytes === 332635368
      && closure.lockSha256 === plan.lockSha256 && ownedPathKeyV1(closure.root) === ownedPathKeyV1(join(ownedHostRootV1, "node_modules")), "auth full manifest required");
    const verified = await verifyOwnedClosureRowsBoundedV1(closure.files, preflight, { signal: abort.signal, check: checkpoint, boundary: () => { current(); },
      onHold: () => hold("AUTH_PREFLIGHT_HOLD"), elapsedMs: () => performance.now() - started, verify: (row, context) => verifyOwnedInstalledFileV1(closure.root, row, context, abort.signal) });
    current(); ownedNeedV1(verified && preflight.verified === 32227 && preflight.bytesVerified === 332635368 && preflight.inFlight === 0 && !preflight.hold, "auth full closure not completed");
    const root = join(ownedHostRootV1, `auth-private-${config.intentId}`); mkdirSync(root, { mode: 0o700 });
    const env: Record<string, string> = { SystemRoot: "C:\\Windows", WINDIR: "C:\\Windows", ComSpec: "C:\\Windows\\System32\\cmd.exe", OS: "Windows_NT", PATH: `${dirname(p.runtime.executable.path)};C:\\Windows\\System32` };
    for (const [name, rel] of Object.entries({ HOME: "home", USERPROFILE: "home", APPDATA: "appdata", LOCALAPPDATA: "localappdata", XDG_DATA_HOME: "data", XDG_CACHE_HOME: "cache", XDG_CONFIG_HOME: "xdg-config", XDG_STATE_HOME: "state", TEMP: "tmp", TMP: "tmp", ProgramData: "program-data" })) {
      env[name] = join(root, rel); if (!existsSync(env[name])) mkdirSync(env[name], { mode: 0o700 }); }
    for (const rel of ["work", "config"]) mkdirSync(join(root, rel), { mode: 0o700 });
    writeOwnedNewV1(join(root, "OWN.json"), JSON.stringify({ runnerPid: process.pid, planSha256: provenance.plan.sha256, intentDigest: current().digest }));
    current(); child = spawn(p.runtime.executable.path, ["run", provenance.bootstrap.path, provenance.plan.sha256, root], { cwd: join(root, "work"), env, windowsHide: true,
      stdio: ["ignore", "pipe", "pipe", "ipc"], serialization: "json" }); pid = child.pid;
    child.on("error", () => hold("AUTH_CHILD_ERROR")); child.on("exit", () => { if (live) { live.closed = true; live.abort.abort(); } });
    child.on("close", (code, signal) => { closed = true; childExit = { code, signal }; if (live) live.closed = true; resolveClose(); });
    for (const [i, stream] of [child.stdout, child.stderr].entries()) { ownedNeedV1(stream, "auth log pipe required");
      stream.on("data", (chunk: Buffer) => { if (!Buffer.isBuffer(chunk)) return hold("AUTH_LOG_SHAPE"); logs[i]!.receivedBytes += chunk.length;
        // NEVER retain, decode, hash, print or write imported native logs.
        if (logs[i]!.receivedBytes > 1048576) hold("AUTH_LOG_BOUND"); }); }
    ownedNeedV1(pid && pid !== process.pid && child.spawnfile === p.runtime.executable.path, "auth child OS handle refused");
    child.on("message", (message: unknown) => { try {
      const m = message as any; ownedNeedV1(m && m.nonce === nonce && Number.isSafeInteger(m.at), "auth IPC envelope refused");
      const keys: Record<string, string[]> = { PHASE: ["type", "name", "at", "nonce"], READY: ["type", "at", "pid", "parentPid", "execPath", "runtime", "platform", "arch", "port", "tmp", "nativeLoadEvidence", "policy", "nonce"],
        SCOPE_CLOSED: ["type", "at", "pid", "nonce"], HOLD: ["type", "at", "reason", "nonce"], AUTH_ATTEMPT_RETAINED: ["type", "attemptId", "at", "nonce"] };
      ownedNeedV1(keys[m.type] && canonical(Object.keys(m).sort()) === canonical(keys[m.type]!.slice().sort()), "auth closed IPC refused");
      if (m.type === "SCOPE_CLOSED") { ownedNeedV1(stopping && m.pid === pid, "auth closed scope identity"); scopeClosed = true; return; }
      if (m.type === "HOLD") return hold("AUTH_BOOTSTRAP_HOLD");
      current();
      if (m.type === "AUTH_ATTEMPT_RETAINED") { ownedNeedV1(attemptId !== null && m.attemptId === attemptId && resolveAttempt, "auth attempt IPC refused"); resolveAttempt!(); resolveAttempt = undefined; return; }
      if (m.type === "PHASE") { ownedNeedV1(m.name === ["APPLICATION_IMPORT_BEGIN", "SCOPED_START_BEGIN"][phases.length], "auth phases refused"); phases.push(m.name); return; }
      ownedNeedV1(!readyReceived && !live && phases.length === 2 && m.pid === pid && m.parentPid === process.pid && ownedWindowsExecutablePathsMatchV1(m.execPath, p.runtime.executable.path)
        && m.runtime === "1.4.2" && m.platform === "win32" && m.arch === "x64" && Number.isInteger(m.port) && m.port > 0 && m.port <= 65535
        && m.policy === "rms-owned-openai-auth-policy-v1" && m.nativeLoadEvidence === "UNPROVEN" && ownedPathKeyV1(m.tmp) === ownedPathKeyV1(join(root, "tmp/opencode")), "auth READY refused"); readyReceived = true; resolveReady(m);
    } catch { hold("AUTH_IPC_OR_CUSTODY_REFUSED"); } });
    child.send({ type: "INIT", nonce, password, planSha256: provenance.plan.sha256, runRoot: root, intentDigest: current().digest }, error => { if (error) hold("AUTH_INIT_FAILED"); });
    const cancelled = new Promise<never>((_, reject) => { const stop = () => reject(new Error("AUTH_CANCELLED")); if (abort.signal.aborted) stop(); else abort.signal.addEventListener("abort", stop, { once: true }); }); void cancelled.catch(() => {});
    const m = await wait(() => Promise.race([ready, close.then(() => { throw new Error("AUTH_CHILD_CLOSED_BEFORE_READY"); }), cancelled]));
    const nativePath = join(root, "native.sqlite"), ns = lstatSync(nativePath, { bigint: true }), os = lstatSync(resolve(config.ownPath), { bigint: true });
    ownedNeedV1(ns.isFile() && !ns.isSymbolicLink() && ownedPathKeyV1(realpathSync(nativePath)) === ownedPathKeyV1(nativePath), "auth native DB identity required");
    live = { invocation, config, graph, child, pid: pid!, parentPid: m.parentPid, origin: `http://127.0.0.1:${m.port}`, authorization, epoch: randomUUID(), expiresAt,
      monotonicExpiry: deadline, abort, closed: false, stamps, nativeDb: { path: nativePath, dev: ns.dev, ino: ns.ino }, ownDb: { path: resolve(config.ownPath), dev: os.dev, ino: os.ino } };
    cap = Object.freeze({}); ownedAuthHostsV1.set(cap, live); ownedNeedV1(verifyOwnedAuthHostCapabilityV1(cap), "auth cap refused after READY");
    const port = await wait(() => connectOwnedAuthHttpV1(cap));
    const json = async (method: "GET" | "POST", route: string, body?: string) => await wait(async () => { const r = await port.request(method, route, body, abort.signal); return await r.json(); });
    const info = await json("GET", "/api/info") as any;
    ownedNeedV1(info.pid === pid && info.version === "2.2.1" && Array.isArray(info.urls) && info.urls.includes(live.origin)
      && ownedPathKeyV1(info.paths?.tmp ?? "") === ownedPathKeyV1(join(root, "tmp/opencode")), "auth info identity refused");
    await json("GET", "/api/integration"); // factory returns only OpenAI metadata projection
    await privateUi(); // readiness rechecked immediately before CONNECT claim
    const rawAttempt = await json("POST", ownedAuthConnectRouteV1, ownedAuthConnectBodyV1);
    const challenge = ownedAuthChallengeV1(rawAttempt, Date.now()); attemptId = challenge.attemptId;
    transition("ATTEMPT_KNOWN", attemptId);
    const acknowledged = new Promise<void>(resolve => { resolveAttempt = resolve; });
    current(); child.send({ type: "AUTH_ATTEMPT", nonce, attemptId }, error => { if (error) hold("AUTH_ATTEMPT_SEND_FAILED"); });
    await wait(() => ownedBoundedWaitV1(Promise.race([acknowledged, cancelled]), Math.min(5000, Math.max(1, left() - 15000))));
    await privateUi(challenge); // code/url only here, never in result/journal/logs
    for (let polls = 0; polls < 150; polls++) {
      const status = ownedAuthStatusProjectionV1(await json("GET", `${ownedAuthConnectRouteV1}/${attemptId}`));
      if (Date.now() >= Math.min(expiresAt, challenge.expires)) { hold("AUTH_EXPIRED"); throw new Error("AUTH_EXPIRED"); }
      ownedNeedV1(status.created === challenge.created && status.expires === challenge.expires && Date.now() < Math.min(expiresAt, challenge.expires), "auth status instance/time refused");
      transition(status.status, attemptId);
      if (status.status === "COMPLETE") { complete = true; break; }
      if (status.status !== "PENDING") { hold(status.status === "FAILED" ? "AUTH_REFUSED" : "AUTH_EXPIRED"); throw new Error("AUTH_TERMINAL_NOT_COMPLETE"); }
      await wait(() => new Promise<void>((resolvePoll, rejectPoll) => { const stop = () => { clearTimeout(timer); rejectPoll(new Error("AUTH_POLL_ABORT")); };
        const timer = setTimeout(() => { abort.signal.removeEventListener("abort", stop); resolvePoll(); }, 1500);
        abort.signal.addEventListener("abort", stop, { once: true }); if (abort.signal.aborted) stop(); }));
    }
    ownedNeedV1(complete, "auth incomplete");
    result.nativeDbIdentity = ownedFileIdentityDataV1(live.nativeDb); result.runtimeAuthPersisted = true;
  } catch (error) { hold(error instanceof OwnedAuthHttpErrorV1 ? `AUTH_${error.code}` : "AUTH_REFUSED_OR_AMBIGUOUS_NO_RETRY"); }
  finally {
    clearTimeout(workTimer); stopping = true;
    if (retainedIntent && graph && (fault || !complete)) try {
      const s = graph.ownedAuthIntentStateV1(config.missionId, config.intentId);
      if (s && !["HOLD", "REVOKED"].includes(s.status)) graph.transitionOwnedAuthIntentV1(ownedAuthAuthorityV1({ graph, config }), invocation.capability, config.intentId,
        s.intent.pinsSha256, s.revision, s.digest, "HOLD", s.attemptId);
    } catch { /* Expiry/revocation never creates fresh append rights. Outcome stays HOLD. */ }
    if (live) live.closed = true; abort.abort(); if (cap) ownedAuthHostsV1.delete(cap);
    if (child && !closed) {
      try { if (child.connected) child.send({ type: "STOP", nonce }, error => { if (error) hold("AUTH_STOP_SEND_FAILED"); }); } catch { hold("AUTH_STOP_FAILED"); }
      try { await ownedBoundedWaitV1(close, Math.min(8000, Math.max(1, left() - 6000))); } catch { kill(); }
      if (!closed) try { await ownedBoundedWaitV1(close, Math.max(1, left() - 1000)); } catch { hold("AUTH_CHILD_CLOSE_UNPROVEN"); }
    }
    try {
      if (child && !closed) try { child.stdout?.destroy(); child.stderr?.destroy(); if (child.connected) child.disconnect(); child.unref(); }
      catch { hold("AUTH_DETACHED_CLEANUP_UNCERTAIN"); }
      if (!closed || !scopeClosed || childExit?.code !== 0 || forced) hold("AUTH_GRACEFUL_CLOSURE_UNPROVEN");
      if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE");
      const state = graph?.ownedAuthIntentStateV1(config.missionId, config.intentId);
      if (complete && graph) try {
        assertOwnedCustodyV1(invocation, config);
        graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1({ graph, config }), invocation.capability, config.intentId, hash(canonical(config.connection.provenance)));
        ownedNeedV1(state?.status === "COMPLETE", "auth completion revoked before finalization");
      } catch { hold("AUTH_AUTHORITY_CHANGED_BEFORE_FINALIZATION"); }
      Object.assign(result, { connectClaimed: state?.claimed ?? false, attemptId: state?.attemptId ?? null, authStatus: state?.status ?? "NOT_RETAINED",
        credentialMayHavePersisted: state?.claimed ?? false, runtimeAuthPersisted: complete ? true : null, failure: fault ?? null,
        pid: pid ?? null, scopeClosed, childClosed: closed, childExit: childExit ?? null, forced, durationMs: Math.round(performance.now() - started),
        privateNativeDirectoryMustBePreservedNotIngested: true, nativeDbNeverReadOrCopiedOrHashed: true,
        completionProtocol: { provisionalAloneAdoptable: false, candidateAloneAdoptable: false, parentObservedExitZeroRequired: true,
          parentMeasuredWholeInvocationAtMostMs: 240000, parentExactCandidateAndReceiptHashesRequired: true } });
      result.publicStatuses = ownedAuthPublicStatusesV1({ claimed: state?.claimed ?? false, persisted: complete, authStatus: state?.status ?? "NOT_RETAINED",
        failure: fault ?? null, childStarted: !!child, childClosed: closed, scopeClosed, exitCode: childExit?.code ?? null, forced });
      const bytes = Buffer.from(JSON.stringify({ ...result, status: "PROVISIONAL_NOT_ADOPTABLE" }, null, 2));
      if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE");
      const file = join(ownedHostRootV1, `auth-receipt-${config.intentId}.json`); writeOwnedNewV1(file, bytes);
      if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE");
      const pin = { path: file, byteLength: bytes.length, sha256: hash(bytes) }; readOwnedPinV1(pin);
      if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE"); result.provisionalReceipt = pin;
      if (complete && graph) {
        assertOwnedCustodyV1(invocation, config);
        graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1({ graph, config }), invocation.capability, config.intentId, hash(canonical(config.connection.provenance)));
      }
      result.status = complete && !fault && closed && scopeClosed && childExit?.code === 0 && !forced ? "AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY" : "HOLD";
      result.failure = fault ?? null; result.durationMs = Math.round(performance.now() - started); result.deadline = budget.snapshot();
      result.publicStatuses = ownedAuthPublicStatusesV1({ claimed: state?.claimed ?? false, persisted: complete, authStatus: state?.status ?? "NOT_RETAINED",
        failure: fault ?? null, childStarted: !!child, childClosed: closed, scopeClosed, exitCode: childExit?.code ?? null, forced });
      let envelope = JSON.stringify({ event: "native-owned-auth-candidate-v1", resultSha256: hash(canonical(result)), data: result });
      if (!budget.checkpoint()) { hold("AUTH_TOTAL_DEADLINE"); envelope = JSON.stringify({ event: "native-owned-auth-refused-v1", intentId: config.intentId, status: "HOLD" }); }
      console.log(envelope);
      if (!budget.checkpoint()) { hold("AUTH_TOTAL_DEADLINE"); console.error("native-owned-auth candidate invalidated: HOLD_TOTAL_DEADLINE"); }
    } catch { hold("AUTH_FINALIZATION_FAILED"); result.status = "HOLD"; }
    finally {
      try {
        if (complete && graph) { assertOwnedCustodyV1(invocation, config);
          graph.assertOwnedAuthIntentCurrentV1(ownedAuthAuthorityV1({ graph, config }), invocation.capability, config.intentId, hash(canonical(config.connection.provenance))); }
      } catch { hold("AUTH_FINAL_AUTHORITY_CHANGED"); }
      try { graph?.close(); } catch { hold("AUTH_OWN_CLOSE_FAILED"); }
      finally { if (!budget.checkpoint()) hold("AUTH_TOTAL_DEADLINE");
        clearTimeout(forceTimer); clearTimeout(totalTimer); ownedParentInvocations.delete(invocation.capability);
        process.off("disconnect", parentDisconnected);
        if (fault) result.status = "HOLD"; }
    }
  }
  if (!budget.checkpoint()) { fault ??= "AUTH_TOTAL_DEADLINE"; result.status = "HOLD"; }
  result.failure = fault ?? null;
  result.publicStatuses = ownedAuthPublicStatusesV1({ claimed: result.connectClaimed === true, persisted: complete, authStatus: typeof result.authStatus === "string" ? result.authStatus : "NOT_RETAINED",
    failure: fault ?? null, childStarted: !!child, childClosed: closed, scopeClosed, exitCode: childExit?.code ?? null, forced });
  return result;
}
/** Whitelisted catalog DATA, never auth/quota or effective permissions. */
export function nativeModelCatalogProjectionV1(m: any): { id: string; modelID: string; providerID: string; enabled: boolean; status: string; variants: string[]; capabilities: unknown } {
  if (!m || typeof m.id !== "string" || typeof m.modelID !== "string" || typeof m.providerID !== "string" || typeof m.enabled !== "boolean"
    || typeof m.status !== "string" || !Array.isArray(m.variants) || !m.variants.every((v: any) => v && typeof v === "object" && !Array.isArray(v)
      && typeof v.id === "string" && Object.keys(v).every(k => ["id", "settings", "headers", "body"].includes(k)))
    || !m.capabilities || typeof m.capabilities !== "object" || Array.isArray(m.capabilities)) throw new Error("native model catalog schema unverified");
  return { id: m.id, modelID: m.modelID, providerID: m.providerID, enabled: m.enabled, status: m.status, variants: m.variants.map((v: { id: string }) => v.id), capabilities: structuredClone(m.capabilities) };
}
/** Trusted local composition, intentionally NOT exported to a worker/RPC API. */
async function composeNativeQualificationV1(invocation: OwnedParentInvocationV1, config: NativeParentRequestV1, action: string, extra: string[]) {
  if (!ownedParentInvocations.has(invocation.capability) || invocation.source.ownPath !== resolve(config.ownPath))
    throw new Error("native parent owned invocation missing");
  if (["inspect", "revoke", "command"].includes(action)) return localNativeControlV1(invocation, config, action, extra);
  const request: ExecutionPreparationRequestV1 = { body: readPinnedNativeJsonV1(config.body), independentSources: readPinnedNativeJsonV1(config.independentSources), policy: readPinnedNativeJsonV1(config.policy) };
  const prepared = prepareRuntimeExecutionV1(request); if (!prepared.ok) throw new Error("native parent preparation/source binding refused");
  const run = readRuntimeDocumentV1(prepared.value.run) as GraphRunV3, envelope = readRuntimeDocumentV1(run.envelope);
  if (run.missionId !== config.missionId) throw new Error("native parent prepared mission differs from invocation scope");
  const sourceMission = readRuntimeDocumentV1(envelope.sourceMissionSnapshot), spec = readRuntimeDocumentV1(envelope.admissionSource.executionSourceSpec);
  if (Object.values(spec.models).some(m => m.providerID !== "openai" || typeof m.variant !== "string" || !m.variant))
    throw new Error("native parent source models must be explicit OpenAI variants, not fixture substitutions");
  const admission = readPinnedNativeJsonV1<import("./graph-store").Admission>(config.admission);
  const proposed = readPinnedNativeJsonV1<NativeLocalPermitV1>(config.permit);
  const rights = readPinnedNativeJsonV1<{ version: string; scope: string; profile: string; model: NativeLocalPermitV1["model"];
    agentRules: NativeLocalPermitV1["permissions"]; sessionRules: NativeLocalPermitV1["permissions"];
    compositionRefs: ByteRef[]; unknowns: string[]; nativeExerciseRefs: ByteRef[] }>(config.permissionsEvidence);
  if (rights.version !== "rms-native-permission-scope-evidence-v1" || rights.scope !== "bounded-coupling-qualification-only"
    || rights.profile !== proposed.profile || canonical(rights.model) !== canonical(proposed.model)
    || canonical(rights.agentRules) !== canonical(proposed.agentPermissions) || canonical(rights.sessionRules) !== canonical(proposed.permissions)
    || !Array.isArray(rights.unknowns) || rights.unknowns.length > 0 || !Array.isArray(rights.compositionRefs) || rights.compositionRefs.length === 0
    || !Array.isArray(rights.nativeExerciseRefs)
    || canonical(makeBoundDocumentV1("rms-native-permission-scope-evidence-v1", rights).ref) !== canonical(proposed.permissionsEvidenceRef))
    throw new Error("native parent permission scope/evidence unresolved; GET metadata is not enforcement");
  const planning = readRuntimeDocumentV1(envelope.planning), sub = planning.units.find(u => u.unitId === config.unitId)?.subIntents.find(s => s.subIntentId === admission.subIntentId);
  if (!sub || proposed.role !== sub.role || !sourceNativeFunctionIdentityMatchesV1(sub.harnessIdentity, proposed.functionIdentity)
    || proposed.profile !== admission.command.profile || canonical(proposed.model) !== canonical(admission.command.model))
    throw new Error("native parent permit function/role differs from verified sources");
  const sourceRequestRef = makeBoundDocumentV1("rms-native-source-request-v1", request).ref;
  const wire = encodeNativeAdmissionWireV1(admission, { sessionId: config.sessionId, messageId: config.messageId,
    directory: resolve(config.directory), permissions: proposed.permissions });
  const wireDescription = { sessionId: wire.sessionId, messageId: wire.messageId, imageSha256: hash(canonical(wire)),
    create: { route: wire.create.route, byteLength: wire.create.byteLength, sha256: wire.create.sha256 },
    prompt: { route: wire.prompt.route, byteLength: wire.prompt.byteLength, sha256: wire.prompt.sha256 }, totalBodyUtf8Bytes: wire.totalBodyUtf8Bytes };
  if (action === "inspect-inputs") return { version: "rms-native-input-description-DATA-v1", sourceRequestRef, runRef: prepared.value.run.ref,
    unitId: config.unitId, identity: sub.harnessIdentity, role: sub.role, wire: wireDescription, nativeQualification: "NOT_ATTESTED" };
  let permitWireSha256 = hash(canonical(wire));
  if (proposed.expected.commandId !== undefined) {
    const witness = new Database(resolve(config.ownPath), { readonly: true });
    try {
      const row = witness.query("SELECT document,digest FROM ff8_graph_ordered_commands WHERE mission=? AND command_id=?").get(run.missionId, proposed.expected.commandId) as { document: string; digest: string } | null;
      if (!row || hash(canonical(JSON.parse(row.document))) !== row.digest) throw new Error("native parent durable notification image missing");
      const image = JSON.parse(row.document);
      if (image.request.executionId !== admission.executionId || image.request.unitId !== config.unitId || image.request.sessionId !== config.sessionId || !image.nativeWire)
        throw new Error("native parent notification scope mismatch");
      permitWireSha256 = hash(canonical(image.nativeWire));
    } finally { witness.close(); }
  }
  if (canonical(sourceRequestRef) !== canonical(proposed.sourceRequestRef) || canonical(proposed.expected.runRef) !== canonical(prepared.value.run.ref)
    || proposed.expected.imageSha256 !== permitWireSha256 || proposed.expected.unitId !== config.unitId
    || proposed.expected.executionId !== admission.executionId || proposed.expected.missionId !== run.missionId)
    throw new Error("native parent permit does not cover the exact prepared source/admission/wire");
  if (action === "preflight") {
    const p = await connectNativeRuntimeHttpV1(resolve(config.directory), config.registrationFile), signal = AbortSignal.timeout(10000);
    const info = await nativeHostJsonV1(p, "/api/info", signal); assertNativeServiceIdentityV1(info, proposed.server);
    const query = `?${new URLSearchParams({ "location[directory]": resolve(config.directory) })}`;
    const agent = await nativeHostJsonV1(p, `/api/agent/${encodeURIComponent(proposed.profile)}${query}`, signal);
    const catalog = await nativeHostJsonV1(p, `/api/model${query}`, signal);
    const selected = catalog?.data?.find((m: any) => m.providerID === proposed.model.providerID && (m.id === proposed.model.id || m.modelID === proposed.model.id));
    const model = nativeModelCatalogProjectionV1(selected);
    if (agent?.location?.directory !== resolve(config.directory) || catalog?.location?.directory !== resolve(config.directory)
      || agent?.data?.id !== proposed.profile || !Array.isArray(agent.data.permissions)) throw new Error("native preflight scoped metadata unavailable");
    return { version: "rms-native-preflight-DATA-v1", server: { version: info.version, pid: info.pid },
      agent: { id: agent.data.id, model: agent.data.model ?? null, mode: agent.data.mode, permissions: agent.data.permissions },
      model, modelCatalogRef: makeBoundDocumentV1("rms-native-model-catalog-entry-v1", model).ref,
      sourceRequestRef, wire: wireDescription, permissionsEvaluation: "NOT_PROVEN_BY_GET", nativeQualification: "NOT_ATTESTED" };
  }
  if (action !== "init" && !existsSync(resolve(config.ownPath))) throw new Error("native parent OWN must be explicitly initialized");
  const { Engine } = await import("./engine");
  const store = new Store(resolve(config.ownPath)); let graph: GraphStore, client: ExecutionClient | undefined;
  const refuse = async (): Promise<never> => { throw new Error("native parent legacy/science route forbidden"); };
  let transport: NativeRuntimeHttpPortV1 | undefined;
  type NativeHostViewV1 = { expiresAt: number; monotonicExpiry: number; effectExpiry: number; effectMonotonicExpiry: number;
    effectFactsHash: string | null; key: string; factsHash: string; session: any; author?: import("./graph-store").NativeAuthorIdentity };
  let view: NativeHostViewV1 | undefined;
  const rootDecision = () => graph.nativeLocalDecisionV1(`root-acquisition:${config.rootAccountId}`, run.missionId);
  const permitDecision = (e: NativeRuntimeExpectedV1) => {
    const { purpose: _purpose, ...scope } = e;
    const rows = graph.db.query("SELECT binding_id FROM ff8_graph_native_bindings WHERE mission=? AND binding_id LIKE 'host-permit:%'").all(e.missionId) as Array<{ binding_id: string }>;
    const matches = rows.map(r => graph.nativeLocalDecisionV1(r.binding_id, e.missionId)).filter(d => d?.subject.version === "rms-native-local-permit-v1"
      && canonical(d.subject.expected) === canonical(scope));
    return matches.length === 1 ? matches[0] : undefined;
  };
  const key = (e: NativeRuntimeExpectedV1) => canonical({ missionId: e.missionId, executionId: e.executionId, commandId: e.commandId ?? null, image: e.imageSha256 });
  const provider: ParentAuthorityProvider = {
    ...localInvocationProviderV1(invocation, config),
    verifyNativeAuthor(_a, e) { return view && view.expiresAt > Date.now() && view.monotonicExpiry > performance.now()
      && view.author?.executionId === e.executionId && view.author.requestDigest === e.requestDigest ? view.author : undefined; },
    async refreshNativeRuntime(a, db, expected, port, signal, observation) {
      const previous = view;
      view = undefined;
      if (db !== graph.db || !transport || port && port !== transport || !isConnectedNativeRuntimeHttpPortV1(transport)) throw new Error("native parent live connection mismatch");
      const d = permitDecision(expected); if (!d || d.subject.version !== "rms-native-local-permit-v1") throw new Error("native parent exact private permit missing");
      const acquired = rootDecision();
      const now = Math.max(a.now, Date.now());
      if (!acquired || acquired.issuedAt > now || acquired.expiresAt <= now || d.issuedAt > now || d.expiresAt <= now
        || d.expiresAt > acquired.expiresAt || now >= invocation.source.expiresAt || !d.rights.physical || !acquired.rights.physical
        || expected.purpose !== "physical-observation" && (!d.rights.effect || !acquired.rights.effect))
        throw new Error("native parent local right revoked/expired before service read");
      const hostExpiry = Math.min(a.lease.expiresAt, d.expiresAt, acquired.expiresAt, invocation.source.expiresAt);
      const p = d.subject, info = await nativeHostJsonV1(transport, "/api/info", signal); assertNativeServiceIdentityV1(info, p.server);
      const session = await nativeHostJsonV1(transport, `/api/session/${config.sessionId}`, signal);
      const s = session?.data;
      if (s && (s.id !== config.sessionId || s.parentID !== undefined || s.fork !== undefined)) throw new Error("native parent physical session identity changed");
      const sameSession = !s || s.agent === p.profile && canonical(s.model) === canonical(p.model) && canonical(s.permissions) === canonical(p.permissions);
      const physical = expected.purpose === "physical-observation";
      let effectExpiry = physical && previous?.key === key(expected) && sameSession ? previous.effectExpiry : 0;
      let effectMonotonicExpiry = physical && previous?.key === key(expected) && sameSession ? previous.effectMonotonicExpiry : 0;
      let declared: object = {};
      if (!physical) {
        if (!sameSession) throw new Error("native parent session profile/model/rules changed; hold without retry");
        const query = `?${new URLSearchParams({ "location[directory]": resolve(config.directory) })}`;
        const agent = await nativeHostJsonV1(transport, `/api/agent/${encodeURIComponent(p.profile)}${query}`, signal);
        const catalog = await nativeHostJsonV1(transport, `/api/model${query}`, signal);
        const selected = catalog?.data?.find((m: any) => m.providerID === p.model.providerID && (m.id === p.model.id || m.modelID === p.model.id));
        if (agent?.location?.directory !== resolve(config.directory) || agent?.data?.id !== p.profile || !Array.isArray(agent.data.permissions)
          || agent.data.mode !== p.agentMode || canonical(agent.data.permissions) !== canonical(p.agentPermissions)
          || catalog?.location?.directory !== resolve(config.directory) || !selected?.enabled) throw new Error("native parent declared agent/model unavailable");
        const model = nativeModelCatalogProjectionV1(selected);
        if (!model.variants.includes(p.model.variant) || canonical(makeBoundDocumentV1("rms-native-model-catalog-entry-v1", model).ref) !== canonical(p.modelCatalogRef))
          throw new Error("native parent model catalog changed/unverified; hold without retry");
        declared = { agent: { id: agent.data.id, model: agent.data.model ?? null, mode: agent.data.mode, permissions: agent.data.permissions }, model };
        effectExpiry = Math.min(Date.now() + 10000, hostExpiry); effectMonotonicExpiry = performance.now() + 10000;
      }
      const facts = { server: { version: info.version, pid: info.pid }, ...declared,
        session: s ? { id: s.id, agent: s.agent ?? null, model: s.model ?? null, permissions: s.permissions ?? null } : null, permissionsEvaluation: "NOT_PROVEN_BY_GET" };
      const next: NativeHostViewV1 = { expiresAt: Math.min(Date.now() + 10000, hostExpiry), monotonicExpiry: performance.now() + 10000,
        effectExpiry, effectMonotonicExpiry, effectFactsHash: physical && previous?.key === key(expected) && sameSession ? previous.effectFactsHash : null,
        key: key(expected), factsHash: hash(canonical(facts)), session: s };
      if (!physical) next.effectFactsHash = next.factsHash;
      if (observation?.assistant && s) {
        const message = await nativeHostJsonV1(transport, `/api/session/${config.sessionId}/message/${observation.assistant.id}`, signal);
        if (message?.data?.type === "assistant" && message.data.id === observation.assistant.id && message.data.agent === p.profile
          && canonical(message.data.model) === canonical(p.model) && hash(canonical(message.data)) === observation.assistant.messageSha256) {
          const outbox = graph.db.query("SELECT digest,create_claim FROM ff8_graph_native_operations WHERE execution_id=?").get(expected.executionId) as { digest: string; create_claim: number } | null;
          const admissionRow = graph.db.query("SELECT digest FROM ff8_graph_outbox WHERE execution_id=?").get(expected.executionId) as { digest: string } | null;
          if (outbox?.create_claim === 1 && admissionRow) next.author = { version: 1, missionId: expected.missionId, executionId: expected.executionId,
            requestDigest: admissionRow.digest, authorId: expected.executionId, sessionId: config.sessionId, profile: p.profile, model: p.model,
            fresh: true, parentSessionId: null, source: "OWN execution to retained native session/message readback; scoped interval only, permissions require parent attestation",
            sourceHash: hash(canonical({ factsHash: next.factsHash, executionId: expected.executionId, sessionId: config.sessionId,
              requestDigest: admissionRow.digest, assistant: observation.assistant })) };
        }
      }
      signal.throwIfAborted();
      graph.db.transaction(() => {
        store.assertLease(a.lease, Date.now()); const live = permitDecision(expected), held = rootDecision();
        if (!live?.rights.physical || !held?.rights.physical || live.expiresAt <= Math.max(a.now, Date.now())
          || held.expiresAt <= Math.max(a.now, Date.now()) || live.expiresAt > held.expiresAt || Date.now() >= invocation.source.expiresAt)
          throw new Error("native parent physical ownership revoked during service read");
        const cursor = graph.events.cursor(expected.missionId);
        graph.events.append(expected.missionId, `rms.native.host-data:${invocation.source.invocationId}:${cursor.sequence + 1}`,
          "rms_native_host_snapshot_data", Math.max(Date.now(), cursor.time),
          { expected, invocation: invocation.source, permitRef: makeBoundDocumentV1("rms-native-local-decision-v1", live).ref,
            facts, factsHash: next.factsHash, expiresAt: next.expiresAt, rightsExercised: false, nativeQualification: "NOT_ATTESTED" }, expected.unitId);
        store.assertLease(a.lease, Date.now());
        const finalPermit = permitDecision(expected), finalRoot = rootDecision(), finalNow = Math.max(a.now, Date.now());
        if (!finalPermit?.rights.physical || !finalRoot?.rights.physical || finalPermit.expiresAt <= finalNow || finalRoot.expiresAt <= finalNow
          || finalNow >= invocation.source.expiresAt) throw new Error("native parent physical ownership changed/expired after append");
      }).immediate();
      view = next;
    },
    verifyNativeRuntime(a, db, expected, port): NativeRuntimeHostVerificationV1 | undefined {
      const acquisition = rootDecision(), d = permitDecision(expected);
      if (!ownedParentInvocations.has(invocation.capability) || Date.now() >= invocation.source.expiresAt || db !== graph.db || a.lease.owner !== config.controllerId || a.lease.token !== invocation.source.controllerFence
        || !transport || port && port !== transport || !view || view.key !== key(expected) || view.expiresAt <= Date.now() || view.monotonicExpiry <= performance.now()
        || expected.purpose !== "physical-observation" && (view.effectExpiry <= Date.now() || view.effectMonotonicExpiry <= performance.now())
        || !acquisition || acquisition.subject.version !== "rms-native-root-acquisition-v1" || !d || d.subject.version !== "rms-native-local-permit-v1"
        || acquisition.issuedAt > Math.max(a.now, Date.now()) || acquisition.expiresAt <= Math.max(a.now, Date.now())
        || d.issuedAt > Math.max(a.now, Date.now()) || d.expiresAt <= Math.max(a.now, Date.now()) || d.expiresAt > acquisition.expiresAt
        || !d.rights.physical || !acquisition.rights.physical
        || expected.purpose !== "physical-observation" && (!d.rights.effect || !acquisition.rights.effect)) return undefined;
      const row = db.query("SELECT document FROM ff8_graph_native_roots WHERE root_id=?").get(config.rootAccountId) as { document: string } | null;
      const root = row ? JSON.parse(row.document) : acquisition.subject.root, p = d.subject;
      return { transport, rootLedger: root, independentSources: request.independentSources, permit: p.permit,
        authority: { version: "rms-native-runtime-authority-v1", missionId: expected.missionId, lineageId: root.lineageId, rootAccountId: root.rootAccountId,
          generationId: root.generationId, headRevision: root.headRevision, controllerOwner: a.lease.owner, controllerFence: a.lease.token,
          sourceRefs: p.sourceRefs, proofRefs: [makeBoundDocumentV1("rms-authenticated-host-observation-v1", { hash: view.factsHash,
            expiresAt: view.expiresAt, effectFactsHash: view.effectFactsHash, effectExpiresAt: view.effectExpiry,
            invocation: invocation.source.invocationId }).ref], historyRef: root.historyRef, server: p.server } };
    },
  };
  graph = new GraphStore(store.path, { parentAuthority: provider, nativeParentInvocation: invocation });
  const engine = new Engine({ store, controllerId: config.controllerId, leaseMs: config.leaseMs, bridge: { ensureTeam: refuse, submit: refuse, inspect: refuse, pauseAdmissions: refuse, stop: refuse },
    publication: { publish: refuse, readback: refuse }, inputAccess: { read: refuse, list: refuse, tool: refuse } });
  try {
    if (action === "init") { engine.create(sourceMission.config); return { state: "LOCAL_MISSION_INITIALIZED_NO_NATIVE_EFFECT", invocation: invocation.source }; }
    const r = graph.db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(run.missionId) as { lease_owner: string; lease_token: number; lease_until: number } | null;
    if (!r || r.lease_owner !== config.controllerId) throw new Error("native parent current controller owner unavailable");
    const ownedLease = Object.freeze({ missionId: run.missionId, owner: r.lease_owner, token: r.lease_token, expiresAt: r.lease_until });
    if (ownedLease.token !== invocation.source.controllerFence) throw new Error("native parent invocation controller epoch changed");
    const authority = (): ControllerAuthority => { store.assertLease(ownedLease, Date.now());
      return { lease: ownedLease, now: Math.max(Date.now(), graph.events.cursor(run.missionId).time) }; };
    if (action === "authorize-root") {
      const acquisition = readPinnedNativeJsonV1<NativeRootAcquisitionV1>(config.acquisition);
      if (acquisition.root.rootAccountId !== config.rootAccountId || acquisition.root.lineageId !== envelope.generation.lineageId
        || canonical(acquisition.allocationRef) !== canonical(envelope.admissionSource.budgetLineage.rootAllocationRef)
        || !envelope.rootBootstrapSources || canonical(acquisition.planningRef) !== canonical(envelope.rootBootstrapSources.planning.ref))
        throw new Error("native acquisition differs from independently bound allocation/planning/lineage");
      const limits = readRuntimeDocumentV1(envelope.admissionSource.budgetLineage.rootLimits);
      if (!limits.rootSlotGrants) throw new Error("native acquisition root slot bounds unknown");
      const bounded = readRuntimeDocumentV1<RootSlotGrantsV1>(limits.rootSlotGrants);
      for (const g of acquisition.grants) {
        const bound = bounded.grants.find(b => b.slot.rootAccountId === config.rootAccountId && b.slot.role === g.role && b.slot.pass === g.pass
          && sourceNativeFunctionIdentityMatchesV1(b.slot.functionIdentity, g.functionIdentity));
        if (!bound || g.capUtf8Bytes > bound.bodyCapUtf8Bytes || g.acquiredUtf8Bytes > bound.reservedDebitUtf8Bytes)
          throw new Error("native acquisition exceeds independently bound slot limits; limits are not acquisition");
      }
      return graph.authorizeNativeRootV1(authority(), invocation.capability, acquisition, config.expiresAt);
    }
    if (action === "grant") return graph.grantNativeRuntimePermitV1(authority(), invocation.capability, config.permitId, config.rootAccountId, proposed, config.expiresAt);
    transport = await connectNativeRuntimeHttpV1(resolve(config.directory), config.registrationFile);
    client = new ExecutionClient({ transport: { call: refuse }, statePath: store.path, directory: resolve(config.directory), principalId: config.principalId,
      controllerId: config.controllerId, teamName: "native-parent-owned", leaseMs: config.leaseMs, maxRunning: 1, token: () => { throw new Error("native parent RPC token forbidden"); },
      nativeRuntime: { graph, authority, transport } });
    const port = { kind: "graph-store-native-v1" as const, client };
    if (action === "prepare") return (await engine.startNativeGraphAsync(run.missionId, { run: prepared.value.run, unitId: config.unitId, admission, wire }, port)).binding;
    const handle = engine.openNativeGraph(run.missionId, admission.executionId, port);
    if (action === "submit") return await handle.submit();
    if (action === "observe") return await handle.observe();
    if (action === "notify") { if (extra.length !== 1 || extra[0] !== proposed.expected.commandId) throw new Error("native parent notification commandId required and scoped"); return await handle.notify(extra[0]!); }
    throw new Error("native parent action is not closed");
  } finally { client?.close(); graph.close(); store.close(); view = undefined; ownedParentInvocations.delete(invocation.capability); }
}

if (import.meta.main) {
  // Native supervisor invocation is required by policy; imports cannot mint an
  // issuer. The external native receipt must attest PID/program/scope afterward.
  void (async () => {
    const [mode, action, configPath, ...extra] = process.argv.slice(2);
    if (mode === "native-owned-auth") {
      ownedNeedV1(action === "connect" && configPath && extra.length === 0, "closed auth invocation arguments");
      const config = parseOwnedAuthParentRequestV1(JSON.parse(readFileSync(resolve(configPath), "utf8")));
      const invocation = issueOwnedParentInvocationV1(config, "connect-owned-openai-auth-v1");
      try { const result = await withOwnedAuthHostV1(invocation, config); if (result.status !== "AUTH_CONNECTED_ONLY_NO_WORK_AUTHORITY") process.exitCode = 1; }
      finally { ownedParentInvocations.delete(invocation.capability); }
      return;
    }
    if (mode === "native-owned-readonly") {
      ownedNeedV1(action === "inspect" && configPath && extra.length === 0, "closed readonly invocation arguments");
      const config = parseOwnedReadonlyParentRequestV2(JSON.parse(readFileSync(resolve(configPath), "utf8")));
      const invocation = issueOwnedParentInvocationV1(config, "inspect-owned-http-readonly-v1");
      try {
        const result = await withOwnedNativeHostV1(invocation, config);
        if (result.status !== "READONLY_BOUNDARIES_MATCHED_NATIVE_LOAD_UNPROVEN") process.exitCode = 1;
      } finally { ownedParentInvocations.delete(invocation.capability); }
      return;
    }
    if (mode !== "native-qualify" || !action || !["inspect-inputs", "preflight", "init", "authorize-root", "grant", "revoke", "command", "inspect", "prepare", "submit", "observe", "notify"].includes(action) || !configPath)
      throw new Error("usage: client.ts native-qualify <action> <pinned-request.json> [explicit revoke/notification arguments]");
    if (extra.length !== (action === "revoke" ? 3 : action === "notify" ? 1 : 0)) throw new Error("native parent action arguments incomplete/unsupported");
    const config = parseNativeParentRequestV1(JSON.parse(readFileSync(resolve(configPath), "utf8"))), invocation = issueOwnedParentInvocationV1(config, action);
    console.log(JSON.stringify({ event: "native-parent-invocation-start", ...invocation.source, nativeQualification: "NOT_ATTESTED" }));
    const result = await composeNativeQualificationV1(invocation, config, action, extra);
    console.log(JSON.stringify({ event: "native-parent-invocation-result", invocationId: invocation.source.invocationId, resultSha256: hash(canonical(result)),
      ...(["preflight", "inspect-inputs", "inspect"].includes(action) ? { data: result } : {}), nativeQualification: "NOT_ATTESTED" }));
  })().catch(() => { console.error("native parent action refused; no automatic retry; external receipt/evidence required"); process.exitCode = 1; });
}
