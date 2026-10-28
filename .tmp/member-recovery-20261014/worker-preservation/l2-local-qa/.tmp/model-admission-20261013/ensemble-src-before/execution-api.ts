import type { ToolDeps } from "./types"
import type { ExecutionResponse, ExecutionNativeToolBinding, ExecutionCommunication, ExecutionBulletinMessage } from "./execution-rpc"
import type { ExecutionEvent, ExecutionFailure, ExecutionModel, ExecutionRecord, ExecutionAccess, ExecutionAccessDecision, ExecutionAccessWitness } from "./execution-rpc"
import { randomUUID } from "node:crypto"
import { initializeExecutionStore, isExecutionPaused, isExecutionLifecycleActive, claimExecutionLifecycle, releaseExecutionLifecycle } from "./execution-store"
import { verifyExecutionPrincipal } from "./execution-auth"
import { executeTeamCreate } from "./tools/team-create"
import { executeTeamTasksAdd } from "./tools/team-tasks-add"
import { executeTeamTasksComplete } from "./tools/team-tasks-complete"
import { executeTeamSpawn } from "./tools/team-spawn"
import { executeTeamShutdown } from "./tools/team-shutdown"
import { getTeamCapacity } from "./capacity"
import { pumpTeam } from "./dispatch"
import { isTeamInDirectory } from "./team-scope"
import { parseTaskResult } from "./result-parser"
import { isCapacityQueued } from "./capacity-delivery"
import { preserveBranch } from "./tools/merge-helper"
import type { Database } from "./db"
import { matchesExecutionResource, sameExecutionResource, validateExecutionBoundary } from "./execution-boundary"
import { safeExecutionHookShape } from "./execution-hook-diagnostics"
import { mapExecutionNativeTool, normalizeExecutionPermissionResources } from "./execution-native-tools"
import { canonicalExecutionJson as canonical, executionJsonSha256 as digest, parseExecutionOutput, injectOutputHttp, injectOutputFrame, checkOutputEndpoint, checkOutputResponse, guardOutputResponse, captureExecutionOutput, type ExecutionOutput, type ExecutionOutputWitness } from "./execution-output"
import { selectNativeToolBindings } from "./execution-bindings"
import { parseExecutionCommunication, admitBulletinScope, verifyBulletinScope, parseBulletinPublish, parseBulletinRead, publishBulletin, readBulletin, bulletinSnapshot, bulletinTrace, bulletinName } from "./execution-bulletin"

const activeByDatabase = new WeakMap<Database, Set<string>>()

/** Operator-controlled, project-specific principal. Store only a SHA256 token digest. */
export interface ExecutionPrincipal { id: string; tokenSha256: string; directories: string[]; profiles: string[]; models: string[]; strictOutputModels?: string[]; teamNamePrefix?: string; bulletin?: boolean; nativeToolBindings?: ExecutionNativeToolBinding[] }
/** Injectable public capabilities and clock for isolated wrappers and tests. */
export interface ExecutionOptions { principals: ExecutionPrincipal[]; now?: () => number; profile?: (id: string) => Promise<unknown>; permissionEvaluator?: ToolDeps["permissionEvaluator"]; nativeAccessWitness?: boolean; nativeOutputHooks?: boolean; nativeBulletinTools?: boolean; nativeToolInventory?: () => Promise<readonly string[]>; hookDiagnostics?: (event: Record<string, unknown>) => Promise<void> | void }
/** Native SDK transport identity; never constructed from RPC metadata. */
export interface ExecutionTransportIdentity { sessionID: string; agent: string; model: ExecutionModel; kind: string }
/** Public native hook event; caller-provided RPC metadata is never fed into this callback. */
export interface ExecutionPermissionEvent { sessionID: string; agent?: string; action: string; resources: readonly string[]; effect: string; source?: { type: "tool"; messageID: string; id: string } }
/** Public native tool completion reference (no transcript or resource inference from input text). */
export interface ExecutionToolEvent { sessionID: string; agent: string; tool: string; messageID: string; id: string; status: string; input?: unknown; mappedResources?: ExecutionAccess[] }
/** Actual public execute.before shape; effects are mapped only from known native schemas. */
export interface ExecutionToolBeforeEvent { sessionID: string; agent: string; tool: string; messageID: string; id: string; input: unknown }
/** Testable public handler and native observation seam. */
export interface ExecutionApi {
  bulletinPublish(sessionID: string, input: unknown): Promise<ExecutionBulletinMessage>
  bulletinRead(sessionID: string, input: unknown): Promise<{ messages: ExecutionBulletinMessage[]; cursor: number }>
  handle(method: string, input: unknown): Promise<ExecutionResponse>; observe(sessionId: string): Promise<void>; pump(teamId: string): Promise<void>; enforcePermission(event: ExecutionPermissionEvent): Promise<void>; observeTool(event: ExecutionToolEvent): Promise<void>; beforeTool(event: ExecutionToolBeforeEvent): Promise<void>
  beforeHttp(event: ExecutionTransportIdentity & { request: Request }): Promise<void>
  afterHttp(event: ExecutionTransportIdentity & { request: Request; response: Response }): Promise<void>
  beforeWsHandshake(event: ExecutionTransportIdentity & { url: string; headers: Record<string, string> }): Promise<void>
  beforeWsSend(event: ExecutionTransportIdentity & { frame: string }): Promise<void>
  afterWsReceive(event: ExecutionTransportIdentity & { frame: string }): Promise<void>
}
/** Create the bridge over the shared team services. */
interface Mission {
  mission_id: string; principal_id: string; directory: string; team_name: string; lead_session_id: string; team_id: string | null
  revision: number; controller_id: string; lease_until: number; paused: number; creation_started: number
}
interface Stored { execution_id: string; mission_id: string; payload: string; receipt: string; digest: string; phase: string }
type StrictExecutionRecord = ExecutionRecord & { output: ExecutionOutput }

class ExecutionError extends Error {
  constructor(readonly category: ExecutionFailure["category"], message: string, readonly recoverable = false) { super(`${category}: ${message}`) }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ExecutionError("input", "expected object")
  return value as Record<string, unknown>
}
function text(input: Record<string, unknown>, key: string): string {
  const value = input[key]
  if (typeof value !== "string" || !value.trim()) throw new ExecutionError("input", `missing ${key}`)
  return value
}
function integer(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const result = value === undefined ? fallback : value
  if (typeof result !== "number" || !Number.isSafeInteger(result) || result < min || result > max) throw new ExecutionError("input", "invalid integer")
  return result
}
function redact(value: unknown, token = ""): unknown {
  if (typeof value === "string") return token ? value.split(token).join("[redacted]") : value
  if (Array.isArray(value)) return value.map(v => redact(v, token))
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /token|authorization|password|secret/i.test(k) ? "[redacted]" : redact(v, token)]))
  return value
}
function failure(error: unknown, token = ""): ExecutionFailure {
  const data = error && typeof error === "object" ? error as Record<string, unknown> : {}
  const fallback = [data.message, data.name, data._tag, data.category].find(value => typeof value === "string" && !!value.trim())
  const message = String(redact(typeof fallback === "string" ? fallback : typeof error === "string" && error.trim() ? error : "Unknown execution failure", token))
  const known: Record<string, ExecutionFailure["category"]> = { auth: "auth", permission: "permission", input: "input", context: "context", provider: "provider", quota: "quota", transport: "transport", native_creation: "native_creation", Unauthorized: "auth", PermissionDenied: "permission", RateLimitError: "quota", ContextOverflow: "context", TransportError: "transport", SessionNotFoundError: "native_creation", ECONNRESET: "transport", ECONNREFUSED: "transport", ETIMEDOUT: "transport" }
  const category = error instanceof ExecutionError ? error.category : data.status === 401 ? "auth" : data.status === 403 ? "permission" : data.status === 429 ? "quota" : known[String(data.category ?? data.type ?? data._tag ?? data.code ?? "")] ?? "unknown"
  return { category, message, recoverable: error instanceof ExecutionError ? error.recoverable : true }
}

/** Convert an execution error to a portable failure without leaking operator tokens. */
export function executionFailure(error: unknown, token = ""): ExecutionFailure { return failure(error, token) }
function nativeRef(value: unknown): NonNullable<ExecutionRecord["native"]> {
  const session = object(value)
  const location = object(session.location)
  const model = object(session.model)
  return { model: { providerID: text(model, "providerID"), id: text(model, "id"), ...(typeof model.variant === "string" ? { variant: model.variant } : {}) }, directory: text(location, "directory"), profile: text(session, "agent"), permissions: session.permissions ?? null }
}

/** Create an authenticated, durable bridge using only shared scheduling/services and public native capabilities. */
export function createExecutionApi(deps: ToolDeps, options: ExecutionOptions): ExecutionApi {
  const { db } = deps
  initializeExecutionStore(db)
  const now = options.now ?? Date.now
  const diagnostic = async (kind: string, data: Record<string, unknown>): Promise<void> => { try { await options.hookDiagnostics?.({ kind, directory: deps.directory, ...data }) } catch { /* Diagnostics never change native authorization. */ } }
  const active = activeByDatabase.get(db) ?? new Set<string>()
  activeByDatabase.set(db, active)
  const lifecycleActive = (executionId: string): boolean => active.has(executionId) || isExecutionLifecycleActive(db, executionId)
  const readNative = async (sessionID: string): Promise<unknown> => {
    try { return (await deps.client.session.get({ sessionID })).data }
    catch (error) {
      const details = error && typeof error === "object" ? error as Record<string, unknown> : {}
      if (details.status === 404 || ["NotFound", "NotFoundError", "SessionNotFoundError", "Session.NotFoundError", "session.not_found"].includes(String(details.type ?? details._tag ?? ""))) return undefined
      throw error
    }
  }
  // Freeze operator authority at initialization; a worker changing the file cannot
  // install a new principal into a running bridge. Operators must protect it by ACL.
  const principals = structuredClone(options.principals)
  const missionById = (id: string): Mission | undefined => (db.query("SELECT * FROM execution_mission WHERE mission_id=?").get(id) as Mission | null) ?? undefined
  const requireMission = (id: string): Mission => {
    const mission = missionById(id)
    if (!mission) throw new ExecutionError("input", "mission not found")
    return mission
  }
  const recordById = (id: string): Stored | undefined => (db.query("SELECT * FROM execution_record WHERE execution_id=?").get(id) as Stored | null) ?? undefined
  const outputRuntime = (): boolean => options.nativeOutputHooks === true && typeof deps.client.session.readOutputContext === "function"
  const outputRecord = (sessionID: string): StrictExecutionRecord | undefined => {
    const row = db.query("SELECT r.payload FROM execution_record r JOIN execution_mission m ON m.mission_id=r.mission_id WHERE m.directory=? AND json_extract(r.payload,'$.nativeSessionId')=?").get(deps.directory, sessionID) as { payload: string } | null
    const record = row ? JSON.parse(row.payload) as ExecutionRecord : undefined
    return record?.output ? record as StrictExecutionRecord : undefined
  }
  const refreshOutput = (record: ExecutionRecord): boolean => {
    const output = record.output
    if (!output) return false
    record.outputWitnesses = (db.query("SELECT payload FROM execution_output_witness WHERE execution_id=? ORDER BY id").all(record.executionId) as Array<{ payload: string }>).map(row => JSON.parse(row.payload) as ExecutionOutputWitness)
    // Keep raw history visible; neither filter foreign rows nor backfill legacy IDs.
    return record.outputWitnesses.length > 0 && record.outputWitnesses.every(w => w && w.executionId === record.executionId && w.sessionId === record.nativeSessionId && w.schemaSha256 === output.schemaSha256 && canonical(w.model) === canonical(record.selection.model) && typeof w.requestBodySha256 === "string" && /^[a-f0-9]{64}$/.test(w.requestBodySha256))
  }
  const records = (missionId: string): Stored[] => db.query("SELECT * FROM execution_record WHERE mission_id=? ORDER BY rowid").all(missionId) as Stored[]
  const boundaryRecord = (sessionID: string): ExecutionRecord | undefined => {
    const row = db.query("SELECT r.payload FROM execution_record r JOIN execution_mission m ON m.mission_id=r.mission_id WHERE m.directory=? AND json_extract(r.payload,'$.nativeSessionId')=?").get(deps.directory, sessionID) as { payload: string } | null
    const record = row ? JSON.parse(row.payload) as ExecutionRecord : undefined
    return record
  }
  const refreshAccess = (record: ExecutionRecord): void => {
    if (!record.selection.resourceBoundary) return
    const decisions = (db.query("SELECT payload FROM execution_access_request WHERE execution_id=? ORDER BY rowid").all(record.executionId) as Array<{ payload: string }>).map(row => JSON.parse(row.payload) as ExecutionAccessDecision)
    const tools = (db.query("SELECT payload FROM execution_tool_leaf WHERE execution_id=? ORDER BY rowid").all(record.executionId) as Array<{ payload: string }>).map(row => JSON.parse(row.payload) as ExecutionToolEvent)
    const checks = (db.query("SELECT payload FROM execution_tool_boundary WHERE execution_id=? ORDER BY rowid").all(record.executionId) as Array<{ payload: string }>).map(row => JSON.parse(row.payload) as NonNullable<ExecutionRecord["boundaryChecks"]>[number])
    const witnesses: ExecutionAccessWitness[] = decisions.flatMap(decision => {
      const source = decision.source
      if (!source || decision.effect !== "allow" || !decision.boundaryAllowed || decision.profile !== record.selection.profile) return []
      const sameCall = decisions.filter(d => d.source?.messageID === source.messageID && d.source.id === source.id)
      if (sameCall.some(d => d.effect !== "allow" || !d.boundaryAllowed || d.profile !== record.selection.profile)) return []
      const tool = tools.find(t => t.messageID === source.messageID && t.id === source.id && t.tool !== "execute") ?? tools.find(t => t.messageID === source.messageID && t.id === source.id)
      if (!tool || tool.status !== "completed" || tool.sessionID !== record.nativeSessionId || tool.agent !== record.selection.profile) return []
      // Selected native bindings require the correlated before/after guard proof
      // below; a permission callback alone cannot replace a missing tool guard.
      if (record.selection.nativeToolBindings?.some(binding => binding.tool === tool.tool)) return []
      // An umbrella Code Mode completion cannot prove a nested file operation
      // succeeded (its script could catch a failed nested operation).
      if (tool.tool === "execute" && decision.action !== "execute") return []
      return decision.resources.map(resource => ({ id: digest({ request: decision.id, resource, tool: tool.tool }), sessionId: record.nativeSessionId, profile: record.selection.profile, action: decision.action, resource, effect: "allow" as const, verifierSource: "public.permission.evaluate+tool.execute.after", native: { messageID: source.messageID, id: source.id, tool: tool.tool, status: "completed" as const } }))
    })
    checks.forEach(check => {
      if (!check.boundaryAllowed || check.sessionId !== record.nativeSessionId || check.profile !== record.selection.profile) return
      const tool = tools.find(t => t.messageID === check.messageID && t.id === check.id && t.tool === check.tool)
      if (!tool || tool.status !== "completed" || tool.agent !== record.selection.profile || canonical(tool.mappedResources) !== canonical(check.resources)) return
      if (record.selection.nativeToolBindings?.some(binding => binding.tool === check.tool) && decisions.some(decision => decision.source?.messageID === check.messageID && decision.source.id === check.id && (decision.effect !== "allow" || !decision.boundaryAllowed || decision.profile !== record.selection.profile))) return
      check.resources.forEach(resource => { witnesses.push({ ...resource, id: digest({ check, resource }), sessionId: check.sessionId, profile: check.profile, effect: "allow", verifierSource: "public.tool.execute.before+execute.after-leaf-success", native: { messageID: check.messageID, id: check.id, tool: check.tool, status: "completed" } }) })
    })
    record.accessDecisions = decisions
    record.accessWitnesses = witnesses
    record.boundaryChecks = checks
    record.missingExpectedAccess = (record.selection.expectedAccess ?? []).filter(expected => !witnesses.some(w => w.action === expected.action && matchesExecutionResource(expected.resource, w.resource)))
    record.accessVerified = record.missingExpectedAccess.length === 0
    if (record.accessVerified) delete record.verificationBlock
    else record.verificationBlock = { category: "input_preconditions", message: "Expected native access successes are not witnessed; missing callbacks cannot be reconstructed from an outcome or raw permission rules", recoverable: true }
  }
  const journal = (mission: Mission, kind: string, executionId?: string, data: Record<string, unknown> = {}): void => {
    const event: ExecutionEvent = { version: 1, id: 0, missionId: mission.mission_id, revision: mission.revision, kind, time: now(), ...(executionId ? { executionId } : {}), data }
    db.run("INSERT INTO execution_event (mission_id,payload) VALUES (?,?)", [mission.mission_id, JSON.stringify(event)])
    event.id = (db.query("SELECT last_insert_rowid() AS id").get() as { id: number }).id
    db.run("UPDATE execution_event SET payload=? WHERE id=?", [JSON.stringify(event), event.id])
  }
  const save = (record: ExecutionRecord, phase?: string, policyRevoked = false): void => {
    db.transaction(() => {
      const old = recordById(record.executionId)
      if (!old) throw new ExecutionError("input", "execution not found")
      if (["stopping", "stopped"].includes(old.phase) && !["stop_requested", "stopped"].includes(record.state)) return
      const prior = JSON.parse(old.payload) as ExecutionRecord
      if (!policyRevoked && record.output && ["completed", "failed"].includes(prior.state) && !["stop_requested", "stopped"].includes(record.state)) {
        record.state = prior.state
        record.failure = prior.failure
        record.structuredResult = prior.structuredResult
        record.nativeIntentReceipt = prior.nativeIntentReceipt
        phase = old.phase
      }
      // An asynchronous admission receipt cannot undo positive native execution
      // observations or terminal state recorded while the transport was pending.
      const progressRank: Partial<Record<ExecutionRecord["state"], number>> = { accepted: 0, session_created: 1, message_transmitted: 2, observed_running: 3 }
      if ((progressRank[record.state] !== undefined && progressRank[prior.state] !== undefined && Number(progressRank[record.state]) < Number(progressRank[prior.state])) || (["accepted", "session_created", "message_transmitted", "ambiguous"].includes(record.state) && ["observed_running", "completed", "failed"].includes(prior.state))) {
        record.state = prior.state
        record.reports = prior.reports
        record.failure = prior.failure
        if (phase && ["queued", "creating", "created"].includes(phase)) phase = old.phase
      }
      refreshAccess(record)
      if (record.communication) record.communicationTrace = bulletinTrace(db, record.executionId)
      const outputVerified = refreshOutput(record)
      if (record.output && record.state === "completed" && !outputVerified) {
        // Retain prior journal events and witnesses, but do not re-accept a legacy
        // or foreign proof as the current strict result after recovery.
        record.state = "failed"
        record.failure = { category: "provider", message: "Strict output witnesses are not fully correlated to execution/session/schema/model", recoverable: false }
        delete record.structuredResult
        phase = "failed"
      }
      const payload = JSON.stringify(record)
      if (old.payload === payload && (!phase || old.phase === phase)) return
      db.run("UPDATE execution_record SET payload=?,phase=? WHERE execution_id=?", [payload, phase ?? old.phase, record.executionId])
      if (old.payload !== payload) journal(requireMission(record.missionId), record.state, record.executionId, { state: record.state, ...(record.failure ? { failure: record.failure } : {}) })
    })()
  }
  const bound = (input: Record<string, unknown>, principal: ExecutionPrincipal): Mission => {
    const directory = text(input, "directory")
    if (directory !== deps.directory || !principal.directories.includes(directory)) throw new ExecutionError("permission", "directory is not authorized for this plugin")
    const mission = missionById(text(input, "missionId"))
    if (!mission) throw new ExecutionError("input", "mission not found")
    if (mission.principal_id !== principal.id) throw new ExecutionError("permission", "mission principal mismatch")
    if (mission.directory !== directory) throw new ExecutionError("permission", "mission directory mismatch")
    if (mission.team_id && !isTeamInDirectory(db, mission.team_id, directory)) throw new ExecutionError("permission", "team project/directory mismatch")
    if (mission.team_id) {
      const team = db.query("SELECT lead_session_id,status FROM team WHERE id=?").get(mission.team_id) as { lead_session_id: string; status: string } | null
      if (!team || team.lead_session_id !== mission.lead_session_id || team.status !== "active") throw new ExecutionError("permission", "bridge team ownership is no longer valid")
    }
    return mission
  }
  const controller = (mission: Mission, input: Record<string, unknown>, recovering = false): void => {
    if (recovering) {
      if (mission.lease_until > now()) throw new ExecutionError("permission", "controller lease has not expired")
    } else {
      if (mission.controller_id !== text(input, "controllerId")) throw new ExecutionError("permission", "controller mismatch; explicit lease recovery required")
      if (mission.lease_until <= now()) throw new ExecutionError("permission", "controller lease expired; explicit recovery required")
    }
    if (integer(input.expectedRevision, -1) !== mission.revision) throw new ExecutionError("input", "stale mission revision")
  }
  const selected = (input: Record<string, unknown>, principal: ExecutionPrincipal): { model: ExecutionModel; profile: string } => {
    const profile = text(input, "profile")
    const raw = object(input.model)
    const model: ExecutionModel = { providerID: text(raw, "providerID"), id: text(raw, "id"), ...(raw.variant === undefined ? {} : { variant: text(raw, "variant") }) }
    if (model.id.includes("#") || model.id.includes("/") || model.providerID.includes("/")) throw new ExecutionError("input", "model must be a native ref, without suffixes")
    if (!principal.profiles.includes(profile)) throw new ExecutionError("permission", "profile is not authorized")
    const key = `${model.providerID}/${model.id}${model.variant ? `#${model.variant}` : ""}`
    if (!principal.models.includes(key)) throw new ExecutionError("permission", "model/variant is not authorized")
    return { model, profile }
  }
  const verifyNative = async (record: ExecutionRecord): Promise<void> => {
    const data = (await deps.client.session.get({ sessionID: record.nativeSessionId })).data
    const ref = nativeRef(data)
    const metadata = object(object(data).metadata)
    if (object(data).id !== record.nativeSessionId || metadata["ensemble.execution"] !== record.executionId || metadata["ensemble.mission"] !== record.missionId || !sameExecutionResource(record.selection.directory, ref.directory) || ref.profile !== record.selection.profile || canonical(ref.model) !== canonical(record.selection.model)) throw new ExecutionError("input", "native model/directory/profile readback mismatch")
    record.native = ref
  }
  const bulletinRuntime = (): boolean => options.nativeAccessWitness === true && options.nativeBulletinTools === true
  const bindingInventory = async (): Promise<readonly string[]> => {
    if (!options.nativeAccessWitness || !options.nativeToolInventory) throw new ExecutionError("permission", "native tool inventory/guard runtime unavailable")
    const ids = await options.nativeToolInventory()
    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string" || !id)) throw new ExecutionError("permission", "invalid native tool inventory")
    return ids
  }
  const admitCommunication = (raw: unknown, principal: ExecutionPrincipal): ExecutionCommunication => {
    if (principal.bulletin !== true || !bulletinRuntime()) throw new ExecutionError("permission", "bulletin opt-in/native runtime unavailable")
    try { return parseExecutionCommunication(raw) } catch { throw new ExecutionError("input", "invalid bulletin contract/schema/hash") }
  }
  const admitBindings = async (raw: unknown, principal: ExecutionPrincipal): Promise<ExecutionNativeToolBinding[]> => {
    let bindings: ExecutionNativeToolBinding[]
    try { bindings = selectNativeToolBindings(raw, principal.nativeToolBindings) } catch (error) { throw new ExecutionError("permission", error instanceof Error ? error.message : "invalid native bindings") }
    const inventory = await bindingInventory()
    if (bindings.some(binding => !inventory.includes(binding.tool))) throw new ExecutionError("permission", "selected native tool absent from inventory")
    return bindings
  }
  const principalFor = (record: ExecutionRecord): ExecutionPrincipal => {
    const mission = requireMission(record.missionId), principal = principals.find(p => p.id === mission.principal_id)
    if (!principal) throw new ExecutionError("permission", "execution principal unavailable")
    bound({ missionId: record.missionId, directory: deps.directory }, principal)
    selected(record.selection, principal)
    return principal
  }
  const verifySelection = async (record: ExecutionRecord): Promise<void> => {
    const principal = principalFor(record)
    if (record.communication) { admitCommunication(record.communication, principal); verifyBulletinScope(db, record) }
    if (record.selection.nativeToolBindings !== undefined) {
      const resolved = await admitBindings(record.selection.nativeToolBindings.map(b => b.tool), principal)
      if (canonical(resolved) !== canonical(record.selection.nativeToolBindings) || digest(resolved) !== record.selection.hashes.nativeToolBindings) throw new ExecutionError("permission", "immutable native tool grants changed or revoked")
      if (!record.selection.resourceBoundary) throw new ExecutionError("permission", "native bindings require a resource boundary")
      validateExecutionBoundary(record.selection.resourceBoundary, resolved.flatMap(b => b.accesses))
    }
  }
  const activeRecord = (sessionID: string): ExecutionRecord => {
    const record = boundaryRecord(sessionID)
    if (!record) throw new ExecutionError("permission", "native session is not an owned execution")
    principalFor(record)
    const mission = requireMission(record.missionId)
    if (mission.paused || mission.lease_until <= now() || record.nativeStage !== "delivery" || ["accepted", "completed", "failed", "stop_requested", "stopped"].includes(record.state)) throw new ExecutionError("permission", "execution is paused, inactive or terminal")
    const member = db.query("SELECT status FROM team_member WHERE team_id=? AND name=? AND session_id=? AND agent=?").get(mission.team_id, record.memberName, sessionID, record.selection.profile) as { status: string } | null
    if (!member || !["ready", "busy"].includes(member.status)) throw new ExecutionError("permission", "native member ownership is inactive")
    return record
  }
  const authorizeBulletin = async (sessionID: string, right: "read" | "publish"): Promise<ExecutionRecord> => {
    const record = activeRecord(sessionID)
    if (!record.communication?.[right]) throw new ExecutionError("permission", "bulletin right not granted")
    await verifySelection(record)
    await verifyNative(record)
    const latest = activeRecord(sessionID)
    if (canonical(latest.selection) !== canonical(record.selection) || canonical(latest.communication) !== canonical(record.communication)) throw new ExecutionError("permission", "execution contract changed during native readback")
    verifyBulletinScope(db, latest)
    return latest
  }
  const bulletinPublish: ExecutionApi["bulletinPublish"] = async (sessionID, input) => {
    await authorizeBulletin(sessionID, "publish")
    return db.transaction(() => {
      const record = activeRecord(sessionID), message = publishBulletin(db, record, input)
      save(record)
      return message
    })()
  }
  const bulletinRead: ExecutionApi["bulletinRead"] = async (sessionID, input) => {
    await authorizeBulletin(sessionID, "read")
    return db.transaction(() => {
      const record = activeRecord(sessionID), result = readBulletin(db, record, input)
      save(record)
      return result
    })()
  }
  const bulletinToolRight = (tool: string): "read" | "publish" | undefined => tool === "execution_bulletin_read" ? "read" : tool === "execution_bulletin_publish" ? "publish" : undefined
  const mapSelectedTool = (record: ExecutionRecord, tool: string, input: unknown): ExecutionAccess[] => {
    const binding = record.selection.nativeToolBindings?.find(b => b.tool === tool)
    return binding ? structuredClone(binding.accesses) : mapExecutionNativeTool(record.selection.directory, tool, input)
  }
  const admitOutput = (raw: unknown, principal: ExecutionPrincipal, selection: { model: ExecutionModel; profile: string }): ExecutionOutput => {
    let output: ExecutionOutput
    try { output = parseExecutionOutput(raw) } catch { throw new ExecutionError("input", "invalid strict output contract/schema/hash") }
    if (!outputRuntime()) throw new ExecutionError("permission", "strict output transport/capture runtime unavailable")
    const key = `${selection.model.providerID}/${selection.model.id}#${selection.model.variant ?? ""}`
    if (selection.model.providerID !== "openai" || !/^openai\/[A-Za-z0-9._-]+#[A-Za-z0-9._-]+$/.test(key) || !principal.strictOutputModels?.includes(key) || !principal.models.includes(key) || !principal.profiles.includes(selection.profile)) throw new ExecutionError("permission", "exact strict model/profile/variant opt-in required")
    return output
  }
  const verifyOutput = async (record: ExecutionRecord, identity?: ExecutionTransportIdentity): Promise<void> => {
    const mission = requireMission(record.missionId)
    const principal = principals.find(p => p.id === mission.principal_id && p.directories.includes(deps.directory))
    if (!principal) throw new ExecutionError("permission", "strict principal unavailable")
    selected(record.selection, principal)
    admitOutput(record.output, principal, record.selection)
    if (record.communication || record.selection.nativeToolBindings !== undefined) await verifySelection(record)
    if (["completed", "failed", "stop_requested", "stopped"].includes(record.state)) throw new ExecutionError("permission", "strict execution is terminal")
    if (record.nativeStage !== "delivery" || (identity && (identity.agent !== record.selection.profile || canonical(identity.model) !== canonical(record.selection.model)))) throw new ExecutionError("permission", "strict native request identity mismatch")
    await verifyNative(record)
    const row = recordById(record.executionId)
    if (!row) throw new ExecutionError("input", "execution not found")
    const latest = JSON.parse(row.payload) as ExecutionRecord
    if (["completed", "failed", "stop_requested", "stopped"].includes(latest.state)) throw new ExecutionError("permission", "strict execution stopped during native readback")
  }
  const outputFailure = (record: ExecutionRecord): void => {
    record.state = "failed"
    record.failure = { category: "provider", message: "Strict output transport, identity or terminal validation failed", recoverable: false }
    delete record.structuredResult
    save(record, "failed")
  }
  const witnessOutput = (record: StrictExecutionRecord, transport: ExecutionOutputWitness["transport"], endpoint: string, requestBodySha256: string): void => {
    const witness: ExecutionOutputWitness = { executionId: record.executionId, sessionId: record.nativeSessionId, transport, schemaSha256: record.output.schemaSha256, requestBodySha256, endpoint, model: structuredClone(record.selection.model), time: now() }
    db.transaction(() => {
      const row = recordById(record.executionId)
      if (!row) throw new ExecutionError("input", "execution not found")
      const latest = JSON.parse(row.payload) as ExecutionRecord
      if (["completed", "failed", "stop_requested", "stopped"].includes(latest.state)) throw new ExecutionError("permission", "strict execution no longer transmittable")
      if (db.query("SELECT 1 FROM execution_output_witness WHERE execution_id=? AND json_extract(payload,'$.requestBodySha256')=?").get(record.executionId, requestBodySha256)) throw new ExecutionError("transport", "strict native request already witnessed; no automatic regeneration")
      if (db.query("SELECT 1 FROM execution_output_pending WHERE execution_id=?").get(record.executionId)) throw new ExecutionError("transport", "strict primary request remains unsettled; no automatic regeneration")
      db.run("INSERT INTO execution_output_pending (execution_id,request_body_sha256) VALUES (?,?)", [record.executionId, requestBodySha256])
      db.run("INSERT INTO execution_output_witness (execution_id,payload) VALUES (?,?)", [record.executionId, JSON.stringify(witness)])
      journal(requireMission(record.missionId), "output_constraint_injected", record.executionId, { witness })
      save(latest)
    })()
  }
  const selectOutputTransport = (record: ExecutionRecord, transport: ExecutionOutputWitness["transport"], endpoint: string): void => {
    db.transaction(() => {
      db.run("INSERT OR IGNORE INTO execution_output_transport (execution_id,transport,endpoint) VALUES (?,?,?)", [record.executionId, transport, endpoint])
      const prior = db.query("SELECT transport,endpoint FROM execution_output_transport WHERE execution_id=?").get(record.executionId) as { transport: string; endpoint: string }
      if (prior.transport !== transport || prior.endpoint !== endpoint) throw new ExecutionError("transport", "strict transport/endpoint fallback prohibited")
    })()
  }
  const withOutput = async (event: ExecutionTransportIdentity, action: (record: StrictExecutionRecord) => Promise<void> | void): Promise<void> => {
    if (event.kind !== "primary") return
    const record = outputRecord(event.sessionID)
    if (!record) return
    try { await verifyOutput(record, event); await action(record) }
    catch { outputFailure(record); throw new ExecutionError("provider", "strict output hook blocked native transport", false) }
  }
  const beforeHttp: ExecutionApi["beforeHttp"] = event => withOutput(event, async record => {
    const injected = await injectOutputHttp(record.output, record.selection.model, event.request)
    await verifyOutput(record, event)
    selectOutputTransport(record, "http", injected.request.url)
    witnessOutput(record, "http", injected.request.url, injected.requestBodySha256)
    event.request = injected.request
  })
  const afterHttp: ExecutionApi["afterHttp"] = event => withOutput(event, record => {
    checkOutputEndpoint(event.request.url, "http")
    const pending = db.query("SELECT request_body_sha256 FROM execution_output_pending WHERE execution_id=?").get(record.executionId) as { request_body_sha256: string } | null
    if (!pending) throw new Error("no matching strict HTTP request")
    event.response = guardOutputResponse(event.response, () => outputFailure(record), () => {
      db.run("DELETE FROM execution_output_pending WHERE execution_id=? AND request_body_sha256=?", [record.executionId, pending.request_body_sha256])
    })
  })
  const wsConnections = new Map<string, { endpoint: string; model: ExecutionModel; agent: string }>()
  const beforeWsHandshake: ExecutionApi["beforeWsHandshake"] = event => withOutput(event, record => {
    wsConnections.delete(event.sessionID)
    checkOutputEndpoint(event.url, "websocket")
    selectOutputTransport(record, "websocket", event.url)
    wsConnections.set(event.sessionID, { endpoint: event.url, model: structuredClone(record.selection.model), agent: event.agent })
  })
  const beforeWsSend: ExecutionApi["beforeWsSend"] = event => withOutput(event, record => {
    const connection = wsConnections.get(event.sessionID)
    if (!connection || connection.agent !== event.agent || canonical(connection.model) !== canonical(event.model)) throw new Error("missing strict websocket handshake")
    const injected = injectOutputFrame(record.output, record.selection.model, event.frame)
    witnessOutput(record, "websocket", connection.endpoint, injected.requestBodySha256)
    event.frame = injected.frame
    wsConnections.delete(event.sessionID)
  })
  const afterWsReceive: ExecutionApi["afterWsReceive"] = event => withOutput(event, record => {
    if (typeof event.frame !== "string" || Buffer.byteLength(event.frame) > 2097152) throw new Error("invalid strict websocket response")
    const signal = checkOutputResponse(JSON.parse(event.frame))
    if (!signal) return
    db.transaction(() => {
      const pending = db.query("SELECT request_body_sha256,response_id FROM execution_output_pending WHERE execution_id=?").get(record.executionId) as { request_body_sha256: string; response_id: string | null } | null
      if (!pending || (pending.response_id !== null && pending.response_id !== signal.id) || (signal.kind === "completed" && pending.response_id === null)) throw new Error("unmatched strict websocket response identity")
      if (signal.kind === "created") db.run("UPDATE execution_output_pending SET response_id=? WHERE execution_id=? AND request_body_sha256=?", [signal.id, record.executionId, pending.request_body_sha256])
      else db.run("DELETE FROM execution_output_pending WHERE execution_id=? AND request_body_sha256=? AND response_id=?", [record.executionId, pending.request_body_sha256, signal.id])
    })()
  })
  const permissionEvaluator = () => {
    const evaluator = deps.permissionEvaluator ?? options.permissionEvaluator
    return evaluator?.source.trim() && typeof evaluator.evaluate === "function" ? evaluator : undefined
  }
  const preflight = async (record: ExecutionRecord): Promise<void> => {
    if (record.selection.requiredAccess === undefined) return
    const evaluator = permissionEvaluator()
    if (!evaluator?.source.trim()) throw new ExecutionError("permission", "native worker action/resource evaluation capability unavailable")
    await verifyNative(record)
    record.selection.evaluatedAccess = []
    for (const access of record.selection.requiredAccess) {
      const decision = await evaluator.evaluate({ sessionID: record.nativeSessionId, agent: record.selection.profile, action: access.action, resources: [access.resource] })
      if (!["allow", "deny", "ask"].includes(decision.effect)) throw new ExecutionError("permission", "native permission evaluator returned an invalid effect")
      record.selection.evaluatedAccess.push({ ...access, effect: decision.effect, sessionId: record.nativeSessionId, profile: record.selection.profile, verifierSource: evaluator.source })
      save(record)
      if (decision.effect !== "allow") throw new ExecutionError("permission", `worker ${access.action} access is ${decision.effect} for the exact requested resource`)
    }
  }
  const enforcePermission = async (event: ExecutionPermissionEvent): Promise<void> => {
    const record = boundaryRecord(event.sessionID)
    await diagnostic("permission_scope", { ...safeExecutionHookShape(event), matched: !!record })
    if (!record?.selection.resourceBoundary) return // Unrelated teams/sessions keep their own native policy.
    const nativeEffect = event.effect
    let scoped = event.agent === undefined || event.agent === record.selection.profile
    try { await verifySelection(record); await verifyNative(record) } catch { scoped = false }
    let resources = [...event.resources]
    if (scoped) {
      try { resources = normalizeExecutionPermissionResources(record.selection.directory, event.action, event.resources) }
      catch { scoped = false } // Invalid/foreign paths never inherit the owning directory's rights.
    }
    await diagnostic("permission_readback", { sessionID: event.sessionID, scoped, expectedProfile: record.selection.profile })
    const mappedAction = ["read", "edit", "glob", "list", "external_directory", "execute", "team_message"].includes(event.action)
    const exactSelectedEffects = record.selection.nativeToolBindings?.flatMap(binding => binding.accesses) ?? []
    const boundaryAllowed = scoped && resources.length > 0 && resources.every(resource => (mappedAction || exactSelectedEffects.some(access => access.action === event.action && sameExecutionResource(access.resource, resource))) && record.selection.resourceBoundary?.some(allowed => allowed.action === event.action && matchesExecutionResource(allowed.resource, resource)))
    if (!boundaryAllowed || !["allow", "deny", "ask"].includes(nativeEffect)) event.effect = "deny"
    const source = event.source?.type === "tool" && event.source.messageID && event.source.id ? { ...event.source } : undefined
    const data = { sessionId: event.sessionID, profile: event.agent ?? record.selection.profile, action: event.action, resources, nativeResources: [...event.resources], nativeEffect, effect: event.effect, boundaryAllowed, ...(source ? { source } : {}), verifierSource: "public.permission.evaluate.restrictive-boundary" }
    const decision: ExecutionAccessDecision = { id: digest({ executionId: record.executionId, ...data }), ...data }
    db.transaction(() => {
      if (!db.run("INSERT OR IGNORE INTO execution_access_request (id,execution_id,session_id,message_id,call_id,payload) VALUES (?,?,?,?,?,?)", [decision.id, record.executionId, event.sessionID, source?.messageID ?? null, source?.id ?? null, JSON.stringify(decision)]).changes) return
      journal(requireMission(record.missionId), "access_decision", record.executionId, { decision })
      save(record)
    })()
  }
    const beforeTool = async (event: ExecutionToolBeforeEvent): Promise<void> => {
      const right = bulletinToolRight(event.tool)
      const record = right ? await authorizeBulletin(event.sessionID, right) : boundaryRecord(event.sessionID)
      if (!record) return
      if ((record.output || record.communication) && event.tool.startsWith("team_")) throw new ExecutionError("permission", "isolated execution team tools are disabled")
      if (record.selection.nativeToolBindings !== undefined && !record.selection.resourceBoundary) throw new ExecutionError("permission", "native bindings require a resource boundary")
      if (!right && !record.selection.resourceBoundary) return
      await diagnostic("tool_before_scope", { ...safeExecutionHookShape(event), matched: true })
      let resources: ExecutionAccess[] = []
      let blocked: Error | undefined
      try {
        if (event.agent !== record.selection.profile || !event.id || !event.messageID) throw new Error("native tool scope does not match the owned worker")
        await verifySelection(record)
        await verifyNative(record)
        if (right) {
          const latest = activeRecord(event.sessionID), contract = verifyBulletinScope(db, latest)
          if (!contract[right]) throw new Error("bulletin right revoked")
          if (right === "publish") parseBulletinPublish(event.input, contract); else parseBulletinRead(event.input)
          resources = [{ action: event.tool, resource: `bulletin:${digest({ missionId: record.missionId, channel: contract.channel })}` }]
        } else {
          resources = mapSelectedTool(record, event.tool, event.input)
          if (record.selection.nativeToolBindings?.length) activeRecord(event.sessionID)
          if (!resources.length || !resources.every(resource => record.selection.resourceBoundary?.some(allowed => allowed.action === resource.action && matchesExecutionResource(allowed.resource, resource.resource)))) throw new Error("native tool effects are outside the explicit resource boundary")
        }
      } catch (error) { blocked = error instanceof Error ? error : new Error("native boundary mapping failed") }
      const check: NonNullable<ExecutionRecord["boundaryChecks"]>[number] = { tool: event.tool, messageID: event.messageID, id: event.id, sessionId: event.sessionID, profile: event.agent, resources, boundaryAllowed: !blocked, verifierSource: "public.tool.execute.before-known-native-schema" }
      const prior = db.query("SELECT payload FROM execution_tool_boundary WHERE execution_id=? AND message_id=? AND call_id=? AND tool=?").get(record.executionId, event.messageID, event.id, event.tool) as { payload: string } | null
      if (prior && canonical(JSON.parse(prior.payload)) !== canonical(check)) { check.boundaryAllowed = false; blocked = new Error("conflicting native leaf input violates the resource boundary") }
      db.transaction(() => {
        db.run("INSERT INTO execution_tool_boundary (execution_id,message_id,call_id,tool,payload) VALUES (?,?,?,?,?) ON CONFLICT(execution_id,message_id,call_id,tool) DO UPDATE SET payload=excluded.payload", [record.executionId, event.messageID, event.id, event.tool, JSON.stringify(check)])
        if (!prior || prior.payload !== JSON.stringify(check)) journal(requireMission(record.missionId), "native_boundary_check", record.executionId, { check })
        save(record)
      })()
      if (blocked) throw new ExecutionError("permission", blocked.message)
    }
    const observeTool = async (event: ExecutionToolEvent): Promise<void> => {
    const right = bulletinToolRight(event.tool)
    const record = right ? await authorizeBulletin(event.sessionID, right) : boundaryRecord(event.sessionID)
    await diagnostic("tool_scope", { ...safeExecutionHookShape(event), matched: !!record })
    if (!record || (!right && !record.selection.resourceBoundary) || event.agent !== record.selection.profile || !event.id || !event.messageID || !["completed", "error"].includes(event.status)) return
    try { await verifySelection(record); await verifyNative(record) } catch { return }
    db.transaction(() => {
      const prior = db.query("SELECT payload FROM execution_tool_leaf WHERE execution_id=? AND message_id=? AND call_id=? AND tool=?").get(record.executionId, event.messageID, event.id, event.tool) as { payload: string } | null
      const clean: ExecutionToolEvent = { sessionID: event.sessionID, agent: event.agent, tool: event.tool, messageID: event.messageID, id: event.id, status: event.status }
      if (event.status === "completed") {
        try {
          if (right) {
            const contract = verifyBulletinScope(db, activeRecord(event.sessionID))
            if (right === "publish") parseBulletinPublish(event.input, contract); else parseBulletinRead(event.input)
            clean.mappedResources = [{ action: event.tool, resource: `bulletin:${digest({ missionId: record.missionId, channel: contract.channel })}` }]
          } else {
            // Exact selected bindings, not a caller-provided mappedResources override.
            const mapped = record.selection.nativeToolBindings?.some(b => b.tool === event.tool) ? mapSelectedTool(record, event.tool, event.input) : event.mappedResources ?? (event.input === undefined ? undefined : mapSelectedTool(record, event.tool, event.input))
            if (mapped !== undefined) clean.mappedResources = mapped
          }
        }
        catch { clean.status = "unmapped" }
      }
      if (prior) {
        const old = JSON.parse(prior.payload) as ExecutionToolEvent
        if (canonical(old) === canonical(clean)) return
        clean.status = "conflict" // Ambiguous shared/reused call IDs never prove access.
      }
      db.run("INSERT INTO execution_tool_leaf (execution_id,message_id,call_id,tool,payload) VALUES (?,?,?,?,?) ON CONFLICT(execution_id,message_id,call_id,tool) DO UPDATE SET payload=excluded.payload", [record.executionId, event.messageID, event.id, event.tool, JSON.stringify(clean)])
      journal(requireMission(record.missionId), "native_tool_outcome", record.executionId, { native: clean })
      save(record)
    })()
  }
  const finishStop = async (record: ExecutionRecord, mission: Mission): Promise<boolean> => {
    if (lifecycleActive(record.executionId)) return false
    const member = db.query("SELECT status FROM team_member WHERE team_id=? AND name=? AND session_id=?").get(mission.team_id, record.memberName, record.nativeSessionId) as { status: string } | null
    if (member && member.status !== "shutdown") {
      await executeTeamShutdown(deps, { member: record.memberName, force: true }, mission.lead_session_id, undefined, async (source, target, directory) => {
        const preserved = await (deps.preserveBranch ?? preserveBranch)(source, target, directory)
        if (!preserved) throw new ExecutionError("permission", "could not preserve branch; native stop denied", true)
        return true
      })
    } else if (!member && await readNative(record.nativeSessionId)) return false
    db.run("UPDATE team_task SET status='cancelled',assignee=NULL WHERE id=? AND team_id=? AND status!='completed'", [record.taskId, mission.team_id])
    record.state = "stopped"
    delete record.failure
    save(record, "stopped")
    return true
  }
  const reconcile = async (record: ExecutionRecord, phase: string): Promise<void> => {
    const mission = requireMission(record.missionId)
    if (!mission.team_id || !isTeamInDirectory(db, mission.team_id, deps.directory)) return
    if (phase === "stopping") {
      try { await finishStop(record, mission) }
      catch (error) { record.failure = failure(error); save(record, "stopping") }
      return
    }
    if (record.communication || record.selection.nativeToolBindings !== undefined) {
      try { await verifySelection(record) }
      catch (error) {
        record.state = "failed"
        record.failure = { ...failure(error), category: "permission", recoverable: false }
        delete record.structuredResult
        save(record, "failed", true)
        return
      }
    }
    const member = db.query("SELECT session_id,status,execution_status,model,model_variant,model_routing,model_override,agent,worktree_dir FROM team_member WHERE team_id=? AND name=?").get(mission.team_id, record.memberName) as { session_id: string; status: string; execution_status: string; model: string | null; model_variant: string | null; model_routing: string | null; model_override: number; agent: string; worktree_dir: string | null } | null
    if (member && member.session_id !== record.nativeSessionId) throw new ExecutionError("permission", "native member ownership mismatch")
    const reports = db.query("SELECT id,from_name,content,time_created FROM team_message WHERE team_id=? AND from_name=? AND to_name IN ('lead','all') ORDER BY time_created,id").all(mission.team_id, record.memberName) as Array<{ id: string; from_name: string; content: string; time_created: number }>
    record.reports = reports.map(row => {
      const result = parseTaskResult(row.content)
      return { id: row.id, from: row.from_name, time: row.time_created, ...(result ? { status: result.status, summary: result.summary } : {}) }
    })
    const creationRecovery = record.nativeStage === "creation" || (record.nativeStage === undefined && !member)
    if (!lifecycleActive(record.executionId) && (["creating", "sending", "created"].includes(phase) || phase === "ambiguous")) {
      // An intent survived process loss. Observe the same ID; never allocate or
      // retransmit to guess whether a native operation took effect.
      try {
        const native = await readNative(record.nativeSessionId)
        if (native && creationRecovery && !member) {
          await verifyNative(record)
          record.state = "session_created"
          delete record.failure
          save(record, "queued")
          return
        }
        record.state = "ambiguous"
      } catch { record.state = "ambiguous" }
      record.failure = { category: "transport", message: "Native admission outcome requires reconciliation; no automatic retransmission", recoverable: true }
      save(record, "ambiguous")
    }
    if (record.nativeStage === "delivery" && ["ambiguous", "session_created"].includes(record.state) && deps.client.session.findIntent && record.transmissionMarker) {
      try {
        await verifyNative(record)
        const receipt = await deps.client.session.findIntent({ sessionID: record.nativeSessionId, marker: record.transmissionMarker })
        if (receipt) { record.nativeIntentReceipt = receipt; record.state = "message_transmitted"; delete record.failure; save(record, "done") }
      } catch { /* A failed/absent lookup never authorizes retransmission. */ }
    }
    if (record.native) {
      try { await verifyNative(record) }
      catch (error) {
        record.failure = failure(error)
        if (record.failure.category !== "input" && record.failure.category !== "permission") { save(record); return }
        record.state = "failed"; save(record, "failed"); return
      }
    }
    if (!["completed", "failed", "stop_requested", "stopped"].includes(record.state) && record.native && ["done", "sending", "ambiguous"].includes(phase)) {
      const session = await readNative(record.nativeSessionId)
      const outcome = session && typeof session === "object" && "outcome" in session ? session.outcome : undefined
      if (outcome === "succeeded" && !record.output) record.state = "completed"
      if (outcome === "failed") {
        record.state = "failed"
        record.failure = { category: "unknown", message: "Native session reports failed outcome; details remain in native report references", recoverable: false }
      }
    }
    const terminal = ["completed", "failed", "stop_requested", "stopped"].includes(record.state)
    if (!terminal && member?.execution_status === "running") record.state = "observed_running"
    const result = record.reports.findLast(report => report.status === "completed" || report.status === "failed")
    if (!terminal && result && !record.output) {
      record.state = result.status === "completed" ? "completed" : "failed"
      if (record.state === "failed") record.failure = { category: "unknown", message: result.summary ?? "Native worker reported failure", recoverable: false }
    } else if (!terminal && member && ["failed", "timed_out"].includes(member.execution_status)) {
      record.state = "failed"; record.failure = { category: "unknown", message: `Native execution ${member.execution_status}`, recoverable: false }
    }
    if (["observed_running", "completed", "message_transmitted"].includes(record.state) && record.failure?.recoverable && ["transport", "unknown", "native_creation"].includes(record.failure.category)) delete record.failure
    let captured: ReturnType<typeof captureExecutionOutput>
    if (record.output && !terminal && record.nativeStage === "delivery") {
      try {
        await verifyOutput(record)
        const witnessed = refreshOutput(record)
        if (witnessed) {
          const marker = record.transmissionMarker
          if (!deps.client.session.readOutputContext || !marker) throw new ExecutionError("permission", "strict capture capability/intent unavailable")
          const context = await deps.client.session.readOutputContext({ sessionID: record.nativeSessionId })
          await verifyOutput(record)
          captured = captureExecutionOutput(context, { sessionID: record.nativeSessionId, agent: record.selection.profile, model: record.selection.model, marker, output: record.output, messageId: record.nativeIntentReceipt?.messageId })
        }
      } catch { outputFailure(record); return }
    }
    if (record.selection.resourceBoundary && (record.state === "completed" || captured) && deps.client.session.findToolOutcomes) {
      const pending = db.query("SELECT b.payload FROM execution_tool_boundary b LEFT JOIN execution_tool_leaf l ON l.execution_id=b.execution_id AND l.message_id=b.message_id AND l.call_id=b.call_id AND l.tool=b.tool WHERE b.execution_id=? AND l.payload IS NULL").all(record.executionId) as Array<{ payload: string }>
      const references = pending.map(row => JSON.parse(row.payload) as NonNullable<ExecutionRecord["boundaryChecks"]>[number]).filter(check => check.boundaryAllowed).map(check => ({ messageID: check.messageID, id: check.id, tool: check.tool }))
      if (references.length) {
        try {
          const outcomes = await deps.client.session.findToolOutcomes({ sessionID: record.nativeSessionId, agent: record.selection.profile, model: record.selection.model, directory: record.selection.directory, references })
          for (const outcome of outcomes) if (references.some(ref => ref.messageID === outcome.messageID && ref.id === outcome.id && ref.tool === outcome.tool)) await observeTool(outcome)
        } catch { /* Missing public leaf metadata stays unverified, never guessed. */ }
      }
    }
    // Keep both acceptance gates and result persistence in the same transaction:
    // native stop is not proof that the current provider request has settled.
    db.transaction(() => {
      if (captured) {
        refreshAccess(record)
        const needsAccessWitnesses = record.selection.resourceBoundary !== undefined || (record.selection.expectedAccess?.length ?? 0) > 0
        const settled = !db.query("SELECT 1 FROM execution_output_pending WHERE execution_id=?").get(record.executionId)
        if (settled && refreshOutput(record) && (!needsAccessWitnesses || record.accessVerified === true)) {
          record.structuredResult = captured.result
          record.nativeIntentReceipt = { messageId: captured.messageId }
          record.state = "completed"
          delete record.failure
        }
      }
      save(record)
    })()
    if (record.state === "completed") {
      const task = db.query("SELECT status FROM team_task WHERE id=? AND team_id=?").get(record.taskId, mission.team_id) as { status: string } | null
      if (task && !["completed", "cancelled"].includes(task.status)) await executeTeamTasksComplete({ ...deps, execution: undefined }, { task_id: record.taskId }, mission.lead_session_id)
    }
  }
  const pump = async (teamId: string): Promise<void> => {
    const mission = db.query("SELECT * FROM execution_mission WHERE team_id=? AND directory=?").get(teamId, deps.directory) as Mission | null
    if (!mission || isExecutionPaused(db, teamId) || !isTeamInDirectory(db, teamId, deps.directory)) return
    const principal = principals.find(p => p.id === mission.principal_id && p.directories.includes(deps.directory))
    if (!principal) return
    if (principal.teamNamePrefix && !mission.team_name.startsWith(principal.teamNamePrefix)) return
    const owningTeam = db.query("SELECT lead_session_id FROM team WHERE id=? AND status='active'").get(teamId) as { lead_session_id: string } | null
    if (owningTeam?.lead_session_id !== mission.lead_session_id) return
    for (const row of records(mission.mission_id)) {
      if (["creating", "created", "sending", "ambiguous"].includes(row.phase) && !lifecycleActive(row.execution_id)) await reconcile(JSON.parse(row.payload) as ExecutionRecord, row.phase)
    }
    for (const stored of records(mission.mission_id)) {
      if (stored.phase !== "queued" || getTeamCapacity(db, teamId, deps.config.maxActiveMembers).available === 0) continue
      const ownerToken = randomUUID()
      if (!claimExecutionLifecycle(db, stored.execution_id, ownerToken)) continue
      const record = JSON.parse(stored.payload) as ExecutionRecord
      active.add(record.executionId)
      let nativeSend = false
      let deliveryPending = false
      let creationPending = false
      let pumpFinished = false
      let explicitFailure: ExecutionFailure | undefined
      try {
        selected({ profile: record.selection.profile, model: record.selection.model }, principal)
        if (record.communication || record.selection.nativeToolBindings !== undefined) await verifySelection(record)
        if (record.output) {
          admitOutput(record.output, principal, record.selection)
          const profile = await options.profile?.(record.selection.profile)
          if (!profile || object(profile).id !== record.selection.profile) throw new ExecutionError("permission", "strict profile unavailable before native allocation")
        }
        if (record.selection.requiredAccess !== undefined && !permissionEvaluator()) throw new ExecutionError("permission", "native worker action/resource evaluation capability unavailable during admission")
        if (!db.query("SELECT 1 FROM team_task WHERE id=? AND team_id=?").get(record.taskId, teamId)) {
          await executeTeamTasksAdd(deps, { tasks: [{ content: `${record.prompt}\n\nOpaque dossier:\n${JSON.stringify(record.dossier)}`, priority: "medium", agent: record.selection.profile }] }, mission.lead_session_id, [record.taskId])
        }
        const client = { ...deps.client, session: { ...deps.client.session,
          create: async (input: Parameters<ToolDeps["client"]["session"]["create"]>[0]) => {
            creationPending = true
            try {
            // The durable ID and execution identity exist before calling native create.
            const existing = await readNative(record.nativeSessionId)
            if (existing) {
              record.state = "session_created"
              try { await verifyNative(record); await preflight(record) }
              catch (error) { explicitFailure = failure(error); throw error }
              save(record, "created")
              return { data: { id: record.nativeSessionId } }
            }
            // Bridge workers retain their approved profile's execute/report
            // policy. Never grant all team tools or execute over a profile deny.
            const permissions = input.permission?.filter(rule => !(rule.action === "allow" && (rule.permission === "execute" || rule.permission.startsWith("team_")))) ?? []
            record.selection.permissions = permissions
            save(record, "creating")
            nativeSend = true
            let created: Awaited<ReturnType<ToolDeps["client"]["session"]["create"]>>
            try { created = await deps.client.session.create({ ...input, permission: permissions, id: record.nativeSessionId, agent: record.selection.profile, model: record.selection.model, directory: deps.directory, metadata: { "ensemble.execution": record.executionId, "ensemble.mission": record.missionId } }) }
            catch (error) {
              // A lost response is safely resolvable only by exact native ID and
              // ownership readback. The create call itself is NEVER repeated.
              if (!await readNative(record.nativeSessionId)) throw error
              await verifyNative(record)
              created = { data: { id: record.nativeSessionId } }
            }
            if (created.data?.id !== record.nativeSessionId) throw new ExecutionError("native_creation", "host did not honor preallocated session ID", true)
            record.state = "session_created"
            try { await verifyNative(record); await preflight(record) }
            catch (error) { explicitFailure = failure(error); throw error }
            save(record, "created")
            return created
            } finally {
              creationPending = false
              if (pumpFinished && !deliveryPending) { active.delete(record.executionId); releaseExecutionLifecycle(db, record.executionId, ownerToken) }
            }
          },
          promptAsync: (input: Parameters<ToolDeps["client"]["session"]["promptAsync"]>[0]) => {
            const effective = { providerID: input.model?.providerID, id: input.model?.modelID, ...(input.variant ? { variant: input.variant } : {}) }
            if (canonical(effective) !== canonical(record.selection.model) || input.agent !== record.selection.profile) return Promise.reject(new ExecutionError("input", "effective selected model/profile changed before transmission"))
            const member = db.query("SELECT model_routing,model_override FROM team_member WHERE team_id=? AND name=?").get(teamId, record.memberName) as { model_routing: string | null; model_override: number }
            record.selection.routing = member.model_routing ? JSON.parse(member.model_routing) : null
            record.selection.override = member.model_override === 1
            deliveryPending = true
            const transmit = () => {
                record.nativeStage = "delivery"
                save(record, "sending")
              const send = () => deps.client.session.promptAsync({ ...input, metadata: { ...input.metadata, "ensemble.execution.intent": record.transmissionMarker } })
              const sending = record.output ? verifyOutput(record).then(send, error => { outputFailure(record); throw error }) : send()
              return sending.then(async result => {
              if (!isCapacityQueued(result)) {
                try { await verifyNative(record); record.state = "message_transmitted"; save(record, "done") }
                catch (error) { record.state = "failed"; record.failure = failure(error); save(record, "failed") }
              }
              return result
            }).catch(error => {
              record.state = "ambiguous"; record.failure = failure(error); save(record, "ambiguous")
              // Do not invoke fresh-spawn's destructive rollback for an uncertain
              // delivery. Keep its native session/member for observational recovery.
              return { executionAmbiguous: true }
              })
            }
            const delivery = record.selection.requiredAccess === undefined ? transmit() : preflight(record).then(transmit, error => {
              record.state = "failed"
              record.failure = { ...failure(error), category: "permission", recoverable: false }
              save(record, "failed")
              throw error
            })
            return delivery.finally(() => { active.delete(record.executionId); releaseExecutionLifecycle(db, record.executionId, ownerToken) })
          },
        } }
        const resuming = record.state === "session_created" && record.nativeStage === "creation"
        if (resuming) { await verifyNative(record); await preflight(record) }
        const sealedModel = `${record.selection.model.providerID}/${record.selection.model.id}`
        await executeTeamSpawn({ ...deps, client }, { name: record.memberName, agent: record.selection.profile, prompt: `${record.prompt}\n\nOpaque dossier:\n${JSON.stringify(record.dossier)}`, model: sealedModel, variant: record.selection.model.variant, claim_task: record.taskId, worktree: false, ...(resuming ? { resume_native: { id: record.nativeSessionId, model: sealedModel, variant: record.selection.model.variant } } : {}) }, mission.lead_session_id, true)
      } catch (error) {
        const details = explicitFailure ?? failure(error)
        record.failure = details
        record.state = nativeSend && !["input", "permission"].includes(details.category) ? "ambiguous" : "failed"
        if (/Concurrent worker limit|admissions are paused/.test(details.message) && !nativeSend) {
          record.state = "accepted"; delete record.failure; save(record, "queued")
        } else save(record, record.state)
      } finally { pumpFinished = true; if (!deliveryPending && !creationPending) { active.delete(record.executionId); releaseExecutionLifecycle(db, record.executionId, ownerToken) } }
    }
  }
  const observe = async (sessionId: string): Promise<void> => {
    const rows = db.query("SELECT r.* FROM execution_record r JOIN execution_mission m ON m.mission_id=r.mission_id WHERE m.directory=?").all(deps.directory) as Stored[]
    for (const row of rows) {
      const record = JSON.parse(row.payload) as ExecutionRecord
      if (record.nativeSessionId === sessionId) await reconcile(record, row.phase)
    }
  }
  const handle = async (method: string, value: unknown): Promise<ExecutionResponse> => {
    const input = object(value)
    const principal = (() => {
      try { return verifyExecutionPrincipal(principals, typeof input.principalId === "string" ? input.principalId : "", typeof input.token === "string" ? input.token : "") }
      catch { throw new ExecutionError("auth", "invalid execution principal credentials") }
    })()
    const token = text(input, "token")
    if (method === "capabilities") {
      const nativeToolBindings = await bindingInventory().then(() => true, () => false)
      return { version: 1, capabilities: { rpc: "ensemble.execution.v1", scopedBulletin: bulletinRuntime(), nativeToolBindings, outputSchemaStrict: outputRuntime(), outputSchemaProtocols: outputRuntime() ? ["openai-responses-v1"] : [], nativePreallocatedId: true, fresh: true, continuity: false, worktree: false, admissionPause: true, replay: true, oneAttemptPerTask: true, permissionPreflight: !!permissionEvaluator(), resourceBoundary: options.nativeAccessWitness === true, nativeAccessWitness: options.nativeAccessWitness === true, nativeIntentLookup: deps.client.session.findIntent ? "public-owned-user-message-metadata" : false, nativeQueuedInboxLookup: false, lifecycleFencing: "sqlite-live-process-owner", permissionVerifierSource: permissionEvaluator()?.source ?? null, permissionPreflightLimit: permissionEvaluator() ? null : "No native per-worker action/resource evaluation query is available; permission hooks and raw overrides are not proof", instructionFileHashes: false, maxLeaseMs: 300000, authentication: "operator-principal-sha256", unsupported: ["fork", "checkpoint", "compact_fork", "worktree", "automatic ambiguous retransmission"] } }
    }
    if (method === "ensureTeam") {
      const directory = text(input, "directory")
      if (directory !== deps.directory || !principal.directories.includes(directory)) throw new ExecutionError("permission", "directory is not authorized")
      const id = text(input, "missionId")
      const name = text(input, "teamName")
      const controllerId = text(input, "controllerId")
      const leaseMs = integer(input.leaseMs, 30000, 1, 300000)
      const maxRunning = integer(input.maxRunning, 1, 1)
      if (principal.teamNamePrefix && !name.startsWith(principal.teamNamePrefix)) throw new ExecutionError("permission", "team name prefix mismatch")
      let mission = missionById(id)
      if (!mission) {
        db.transaction(() => {
          if (db.query("SELECT 1 FROM team WHERE name=? AND project_id=? AND status='active'").get(name, directory)) throw new ExecutionError("permission", "cannot adopt an existing team")
          db.run("INSERT INTO execution_mission (mission_id,principal_id,directory,team_name,lead_session_id,revision,controller_id,lease_until) VALUES (?,?,?,?,?,1,?,?)", [id, principal.id, directory, name, `ses_${randomUUID().replaceAll("-", "")}`, controllerId, now() + leaseMs])
          journal(requireMission(id), "mission_intent")
        })()
        mission = requireMission(id)
      } else {
        mission = bound(input, principal)
        if (mission.team_name !== name || mission.controller_id !== controllerId) throw new ExecutionError("permission", "mission/controller binding mismatch")
      }
      if (!mission.team_id) {
        const existing = await readNative(mission.lead_session_id)
        if (existing) {
          const data = object(existing)
          if (object(data.metadata)["ensemble.execution.lead"] !== id || object(data.location).directory !== directory) throw new ExecutionError("permission", "native lead ownership mismatch")
        } else {
          if (mission.creation_started) throw new ExecutionError("native_creation", "ambiguous lead creation; same-ID observation required", true)
          if (!db.run("UPDATE execution_mission SET creation_started=1 WHERE mission_id=? AND creation_started=0", [id]).changes) throw new ExecutionError("native_creation", "lead creation already in progress; inspect the preallocated ID", true)
          const created = await deps.client.session.create({ id: mission.lead_session_id, title: `External execution lead: ${name}`, directory, metadata: { "ensemble.execution.lead": id }, permission: [{ permission: "*", pattern: "*", action: "deny" }] })
          if (created.data?.id !== mission.lead_session_id) throw new ExecutionError("native_creation", "host did not honor preallocated lead ID", true)
        }
        const team = db.query("SELECT id,lead_session_id FROM team WHERE project_id=? AND name=? AND status='active'").get(directory, name) as { id: string; lead_session_id: string } | null
        if (team && team.lead_session_id !== mission.lead_session_id) throw new ExecutionError("permission", "cannot adopt a foreign team")
        if (!team) await executeTeamCreate(deps, { name, max_running_members: maxRunning, auto_dispatch: false, auto_scale: false, classification: { mode: "off" } }, mission.lead_session_id)
        const createdTeam = db.query("SELECT id FROM team WHERE lead_session_id=? AND project_id=? AND status='active'").get(mission.lead_session_id, directory) as { id: string }
        db.transaction(() => { db.run("UPDATE execution_mission SET team_id=? WHERE mission_id=?", [createdTeam.id, id]); journal(requireMission(id), "team_created") })()
        mission = requireMission(id)
      }
      return { version: 1, missionId: id, revision: mission.revision, teamId: mission.team_id ?? undefined, leadSessionId: mission.lead_session_id }
    }
    let mission = bound(input, principal)
    if (!mission.team_id) throw new ExecutionError("native_creation", "mission lead/team initialization incomplete", true)
    if (method === "submit") {
      const key = text(input, "idempotencyKey")
      const communication = input.communication === undefined ? undefined : admitCommunication(input.communication, principal)
      const nativeToolBindings = input.nativeTools === undefined ? undefined : await admitBindings(input.nativeTools, principal)
      const { token: _token, expectedRevision: _revision, ...digestInput } = input
      const requestDigest = digest({ ...digestInput, ...(nativeToolBindings === undefined ? {} : { resolvedNativeToolBindings: nativeToolBindings }) })
      const previous = db.query("SELECT * FROM execution_record WHERE mission_id=? AND idempotency_key=?").get(mission.mission_id, key) as Stored | null
      if (previous) {
        if (previous.digest !== requestDigest) throw new ExecutionError("input", "idempotency key payload changed")
        const record = JSON.parse(previous.payload) as ExecutionRecord
        if (record.communication || record.selection.nativeToolBindings !== undefined) await verifySelection(record)
        return JSON.parse(previous.receipt) as ExecutionResponse
      }
      controller(mission, input)
      let resourceBoundary: ExecutionAccess[] | undefined
      let expectedAccess: ExecutionAccess[] | undefined
      if (input.resourceBoundary !== undefined || input.expectedAccess !== undefined) {
        if (input.requiredAccess !== undefined) throw new ExecutionError("input", "native-query and boundary-witness admission modes must not be mixed")
        if (!options.nativeAccessWitness) throw new ExecutionError("permission", "native boundary/witness hooks unavailable")
        const parseAccess = (value: unknown): ExecutionAccess[] => {
          if (!Array.isArray(value) || value.length > 256) throw new ExecutionError("input", "expected boundary/access array")
          return value.map(raw => { const entry = object(raw); const access = { action: text(entry, "action"), resource: text(entry, "resource") }; if (access.action.includes(token) || access.resource.includes(token)) throw new ExecutionError("input", "boundary/access must not contain operator credentials"); return access })
        }
        resourceBoundary = parseAccess(input.resourceBoundary)
        expectedAccess = parseAccess(input.expectedAccess ?? [])
        try { validateExecutionBoundary(resourceBoundary, expectedAccess) }
        catch (error) { throw new ExecutionError("input", error instanceof Error ? error.message : "invalid resource boundary") }
      }
      if (nativeToolBindings !== undefined) {
        if (!resourceBoundary) throw new ExecutionError("input", "native bindings require a resource boundary")
        try { validateExecutionBoundary(resourceBoundary, nativeToolBindings.flatMap(b => b.accesses)) }
        catch { throw new ExecutionError("permission", "native bindings exceed resource boundary") }
      }
      let requiredAccess: ExecutionAccess[] | undefined
      if (input.requiredAccess !== undefined) {
        if (!Array.isArray(input.requiredAccess) || input.requiredAccess.length > 256) throw new ExecutionError("input", "requiredAccess must be an array of at most 256 action/resource pairs")
        requiredAccess = input.requiredAccess.map(raw => {
          const access = object(raw)
          const result = { action: text(access, "action"), resource: text(access, "resource") }
          if (result.action.includes(token) || result.resource.includes(token)) throw new ExecutionError("input", "requiredAccess must not contain operator credentials")
          return result
        })
        if (!permissionEvaluator()?.source.trim()) throw new ExecutionError("permission", "requiredAccess requires unavailable native worker action/resource evaluation capability")
      }
      const context = input.context === undefined ? { mode: "fresh" } : object(input.context)
      if (context.mode !== "fresh" || context.from !== undefined || context.messageID !== undefined) throw new ExecutionError("context", "continuity unsupported by crash-safe version-one bridge")
      if (input.worktree !== undefined && input.worktree !== false) throw new ExecutionError("input", "worktree execution unsupported by version-one bridge")
      const selection = selected(input, principal)
      const output = input.output === undefined ? undefined : admitOutput(input.output, principal, selection)
      if (!options.profile) throw new ExecutionError("permission", "public profile readback capability unavailable")
      const profileInfo = await options.profile(selection.profile)
      if (!profileInfo) throw new ExecutionError("permission", "profile not found")
      if (output && object(profileInfo).id !== selection.profile) throw new ExecutionError("permission", "strict profile readback mismatch")
      const record: ExecutionRecord = { missionId: mission.mission_id, taskId: text(input, "taskId"), attemptId: text(input, "attemptId"), executionId: text(input, "executionId"), nativeSessionId: `ses_${randomUUID().replaceAll("-", "")}`, memberName: `exec-${randomUUID().replaceAll("-", "")}`, state: "accepted", prompt: text(input, "prompt"), dossier: redact(input.dossier === undefined ? {} : object(input.dossier), token) as Record<string, unknown>, metadata: redact(input.metadata === undefined ? {} : object(input.metadata), token) as Record<string, unknown>, selection: { ...selection, override: true, routing: null, directory: deps.directory, worktree: false, context: { mode: "fresh" }, permissions: null, profileInfo: redact(profileInfo, token), hashes: { profileInfo: digest(redact(profileInfo, token)) }, revision: mission.revision + 1, ...(requiredAccess === undefined ? {} : { requiredAccess, evaluatedAccess: [] }) } }
      record.nativeStage = "creation"
      if (output) record.output = output
      if (communication) {
        record.communication = communication
        record.selection.hashes.communication = digest(communication)
        record.communicationTrace = { published: [], received: [], cursor: 0 }
      }
      if (nativeToolBindings !== undefined) {
        record.selection.nativeToolBindings = nativeToolBindings
        record.selection.hashes.nativeToolBindings = digest(nativeToolBindings)
      }
      record.transmissionMarker = `ensemble-intent-${randomUUID()}`
      if (resourceBoundary) {
        record.selection.resourceBoundary = resourceBoundary
        record.selection.expectedAccess = expectedAccess ?? []
        record.selection.accessMethod = "native_tool_boundary_witness"
        refreshAccess(record)
      }
      record.prompt = String(redact(record.prompt, token))
      const receipt: ExecutionResponse = { version: 1, missionId: mission.mission_id, executionId: record.executionId, revision: mission.revision + 1, state: "accepted" }
      const persisted = db.transaction(() => {
        mission = bound(input, principal)
        const concurrent = db.query("SELECT * FROM execution_record WHERE mission_id=? AND idempotency_key=?").get(mission.mission_id, key) as Stored | null
        if (concurrent) {
          if (concurrent.digest !== requestDigest) throw new ExecutionError("input", "idempotency key payload changed")
          return { inserted: false, receipt: JSON.parse(concurrent.receipt) as ExecutionResponse }
        }
        controller(mission, input)
        if (new Set([record.taskId, record.attemptId, record.executionId]).size !== 3) throw new ExecutionError("input", "task, attempt and execution identities must be distinct")
        if (db.query("SELECT 1 FROM execution_record WHERE execution_id=? OR (mission_id=? AND (task_id=? OR attempt_id=?))").get(record.executionId, mission.mission_id, record.taskId, record.attemptId)) throw new ExecutionError("input", "execution/task/attempt identity already used; one attempt per task")
        if (communication) admitBulletinScope(db, mission.mission_id, communication)
        db.run("UPDATE execution_mission SET revision=revision+1 WHERE mission_id=? AND revision=?", [mission.mission_id, mission.revision])
        db.run("INSERT INTO execution_record (execution_id,mission_id,task_id,attempt_id,idempotency_key,digest,receipt,payload) VALUES (?,?,?,?,?,?,?,?)", [record.executionId, mission.mission_id, record.taskId, record.attemptId, key, requestDigest, JSON.stringify(receipt), JSON.stringify(record)])
        journal(requireMission(mission.mission_id), "accepted", record.executionId)
        return { inserted: true, receipt }
      })()
      if (persisted.inserted) await pumpTeam({ ...deps, execution: { pump } }, mission.team_id)
      return persisted.receipt
    }
    if (method === "control") {
      const action = text(input, "action")
      if (!["pause", "resume", "renew", "recover"].includes(action)) throw new ExecutionError("input", "unknown control action")
      db.transaction(() => {
        mission = bound(input, principal); controller(mission, input, action === "recover")
        const lease = ["recover", "renew"].includes(action) ? now() + integer(input.leaseMs, 30000, 1, 300000) : mission.lease_until
        const paused = action === "pause" ? 1 : action === "resume" ? 0 : mission.paused
        db.run("UPDATE execution_mission SET revision=revision+1,controller_id=?,lease_until=?,paused=? WHERE mission_id=? AND revision=?", [text(input, "controllerId"), lease, paused, mission.mission_id, mission.revision])
        mission = requireMission(mission.mission_id); journal(mission, action, undefined, { paused: mission.paused === 1, controllerId: mission.controller_id, leaseUntil: mission.lease_until })
      })()
      if (action === "resume" && mission.team_id) await pumpTeam({ ...deps, execution: { pump } }, mission.team_id)
      return { version: 1, missionId: mission.mission_id, revision: mission.revision }
    }
    if (method === "stop") {
      const stored = recordById(text(input, "executionId"))
      if (!stored || stored.mission_id !== mission.mission_id) throw new ExecutionError("permission", "execution mission mismatch")
      const record = JSON.parse(stored.payload) as ExecutionRecord
      record.state = "stop_requested"
      db.transaction(() => { mission = bound(input, principal); controller(mission, input); db.run("UPDATE execution_mission SET revision=revision+1 WHERE mission_id=?", [mission.mission_id]); save(record, "stopping") })()
      try { await finishStop(record, mission) }
      catch (error) { record.failure = failure(error, token); save(record, "stopping"); throw error }
      return { version: 1, missionId: mission.mission_id, revision: mission.revision + 1, executionId: record.executionId, state: record.state }
    }
    if (method === "bulletinSnapshot") {
      if (Object.keys(input).some(k => !["principalId", "token", "directory", "missionId", "channel"].includes(k))) throw new ExecutionError("input", "invalid bulletinSnapshot fields")
      const channel = input.channel === undefined ? undefined : bulletinName(input.channel)
      return { version: 1, missionId: mission.mission_id, revision: mission.revision, messages: bulletinSnapshot(db, mission.mission_id, channel) }
    }
    if (!["inspect", "snapshot", "events", "replay"].includes(method)) throw new ExecutionError("input", "unknown execution method")
    for (const row of records(mission.mission_id)) await reconcile(JSON.parse(row.payload) as ExecutionRecord, row.phase)
    await pumpTeam({ ...deps, execution: { pump } }, mission.team_id)
    mission = bound(input, principal)
    if (method === "events" || method === "replay") {
      const cursor = integer(input.cursor, 0)
      const limit = integer(input.limit, 100, 1, 1000)
      const rows = db.query("SELECT id,payload FROM execution_event WHERE mission_id=? AND id>? ORDER BY id LIMIT ?").all(mission.mission_id, cursor, limit) as Array<{ id: number; payload: string }>
      const events = rows.map(row => ({ ...JSON.parse(row.payload) as ExecutionEvent, id: row.id }))
      return { version: 1, revision: mission.revision, events, cursor: events.at(-1)?.id ?? cursor }
    }
    const packet = db.transaction(() => ({
      mission: bound(input, principal),
      executions: records(mission.mission_id).map(row => JSON.parse(row.payload) as ExecutionRecord),
      cursor: (db.query("SELECT COALESCE(MAX(id),0) AS id FROM execution_event WHERE mission_id=?").get(mission.mission_id) as { id: number }).id,
    }))()
    const { executions, cursor } = packet
    mission = packet.mission
    if (method === "snapshot") return { version: 1, revision: mission.revision, missionId: mission.mission_id, teamId: mission.team_id ?? undefined, leadSessionId: mission.lead_session_id, admissions: { paused: mission.paused === 1, controllerId: mission.controller_id, leaseUntil: mission.lease_until }, executions, cursor }
    const execution = executions.find(r => r.executionId === text(input, "executionId"))
    if (!execution) throw new ExecutionError("permission", "execution not in authorized mission")
    return { version: 1, revision: mission.revision, execution, cursor }
  }
  return { handle, observe, pump, enforcePermission, observeTool, beforeTool, beforeHttp, afterHttp, beforeWsHandshake, beforeWsSend, afterWsReceive, bulletinPublish, bulletinRead }
}
