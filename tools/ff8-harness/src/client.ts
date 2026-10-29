import { openOwnDatabase } from "./store";
import { assertRmsWorkCurrentV1 } from "./graph-store";
import { canonical, hash } from "./validation";
import { assertAuditContinuation, decodeBulletinSnapshot, type BulletinSnapshot, type CommunicationAudit } from "./bulletin-audit";
import { prepareDispatchJoinV1, refuseNativeRuntimeV1, type PreparedRuntimeV1, type DispatchScopeV1, type DispatchJoinV1 } from "./graph-runtime-binding";
import { assertExecutionJsonV1, type BoundDocument } from "./graph-execution-envelope";
export interface RpcTransport { call(method: string, input: Record<string, unknown>): Promise<Record<string, unknown>>; serverVersion?: string }
export interface ClientOptions {
  transport: RpcTransport; statePath: string; directory: string; principalId: string;
  token: () => string; controllerId: string; teamName: string; leaseMs: number; maxRunning: number;
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
  constructor(readonly options: ClientOptions) {
    if (!options.controllerId || !options.principalId || !options.directory || options.leaseMs < 1 || options.leaseMs > 300000 || !Number.isInteger(options.maxRunning) || options.maxRunning < 1) throw new Error("invalid explicit bridge connection parameters");
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
  async submitRuntime(_missionId: string, _key: string): Promise<never> { return refuseNativeRuntimeV1(); }
  async observeRuntime(_missionId: string, _key: string): Promise<never> { return refuseNativeRuntimeV1(); }
  private assertLegacyDispatchKey(missionId: string, key: string): void {
    if (this.db.query("SELECT key FROM ff8_bridge_dispatch_joins WHERE mission=? AND key=?").get(missionId, key)) throw new Error("prospective runtime requires qualified native dispatch; legacy submit forbidden");
  }
  private scope(missionId: string) { return { missionId, directory: this.options.directory }; }
  private async call(method: string, body: Record<string, unknown>) {
    const token = this.options.token(); if (!token) throw new Error("operator token missing (use the configured environment variable)");
    let r: Record<string, unknown>;
    try { r = await this.options.transport.call(method, { ...body, principalId: this.options.principalId, token }); }
    catch (error) {
      const native = error && typeof error === "object" ? error as Record<string, unknown> : {};
      const data = native.data && typeof native.data === "object" ? native.data as Record<string, unknown> : native;
      const message = (error instanceof Error && error.message ? error.message : String(native.type ?? native._tag ?? "bridge transport error")).split(token).join("[redacted]");
      const declared = native.type === "execution_rejected" || typeof data.category === "string";
      const mapped: Record<string, string> = { UnauthorizedError: "auth", ForbiddenError: "permission", InvalidRequestError: "input", RpcInternalError: "schema", ServiceUnavailableError: "transport" };
      const category = declared ? String(data.category ?? "unknown") : mapped[String(native._tag)] ?? "transport";
      throw new BridgeAdmissionError(message, category, declared ? data.recoverable === true : category === "transport",
        native.type === "execution_rejected" ? "execution_rejected" : undefined);
    }
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
    await this.capabilities();
    const r = await this.call("ensureTeam", { ...this.scope(missionId), teamName: this.options.teamName, controllerId: this.options.controllerId, leaseMs: this.options.leaseMs, maxRunning: this.options.maxRunning });
    this.recordRevision(missionId, r);
  }
  async submit(missionId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const captured = captureSubmission(input), { key, digest } = captured;
    // Caller binding is an assertion only: the shared guard derives the target
    // from the durable execution and refuses unit/task aliases before any I/O.
    const binding = (captured.payload.metadata as { graphBinding?: { unitId?: string } } | undefined)?.graphBinding;
    const current = () => assertRmsWorkCurrentV1(this.db, missionId, binding?.unitId, String(captured.payload.executionId), String(captured.payload.taskId));
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
