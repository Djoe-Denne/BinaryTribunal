import type { Database } from "./db"
import { isTeamInDirectory } from "./team-scope"
import { createDb, getDbPath } from "./db"
import type { MemberRegistry, DescendantTracker } from "./state"
import { MemberRegistry as MemberRegistryImpl, DescendantTracker as DescendantTrackerImpl, PendingPurgeApprovals } from "./state"
import { dispatchV2Event, type V2EventLike } from "./v2-events"
import type { V2Context } from "./v2-client"
import { createV2Client } from "./v2-client"
import { registerV2Tools } from "./v2-tools"
import type { ToolDeps } from "./types"
import { ProgressTracker } from "./progress"
import { checkToolIsolation, shouldNudgeIdleMember } from "./hooks"
import { pumpTeam } from "./dispatch"
import { withCapacityClient } from "./capacity-delivery"
import { startCapacityRuntime, type CapacityRuntime } from "./capacity-runtime"
import { hasReportedCompletion } from "./messaging"
import { enrichToolError } from "./tool-arg-hint"
import { rehydrateRegistry } from "./recovery"
import { findTeamBySession } from "./types"
import { loadConfig } from "./config"
import { TokenBucket } from "./rate-limit"
import { ActivityBuffer, recordFromToolBefore, recordFromToolAfter } from "./activity"
import { buildLeadSystemPrompt, buildTeammateSystemPrompt, buildTeamCompactionContext } from "./system-prompt"
import { startDashboard, type DashboardServer } from "./dashboard"
import { createNativeProviderInventoryReader } from "./provider-inventory"
import type { Plugin as NativePlugin } from "@opencode/plugin"
import { EnsembleRpc, emitMemberEvent, emitNoticeEvent } from "./v2-rpc"
import { isWorktreeInstance } from "./util"
import { vlog } from "./log"
import { recoverSessionContinuity } from "./session-continuity"
import { MEMBER_TOOLS } from "./v2-continuity"
import { invokeNativeClassifier, invokeNativeGeneralClassifier, removeNativeClassificationHelper, type V2ClassificationContext } from "./v2-classification"
import type { ClassifierTool } from "./classification-protocol"
import { classifyBoardTasks } from "./board-classification"
import { ExecutionRpc } from "./execution-rpc"
import { createExecutionApi, executionFailure, type ExecutionApi, type ExecutionOptions } from "./execution-api"
import { loadExecutionPrincipals } from "./execution-auth"
import { isExecutionOwned } from "./execution-store"
import { safeExecutionHookShape } from "./execution-hook-diagnostics"

/** V2 setup context subset (structural, mock-friendly). */
export interface V2SetupContext {
  location: { directory: string }
  options: Record<string, unknown>
  session: V2Context["session"] & {
    hook(name: string, cb: (event: never) => unknown): Promise<{ dispose(): Promise<void> }>
  }
  worktree: V2Context["worktree"]
  permission: V2Context["permission"]
  agent?: V2Context["agent"]
  provider?: Pick<NativePlugin.Context["provider"], "list">
  model?: Pick<NativePlugin.Context["model"], "list">
  event: {
    subscribe(opts?: { signal?: AbortSignal }): AsyncIterable<V2EventLike>
  }
  tool: {
    list?(): Promise<readonly ClassifierTool[]>
    hook(name: string, cb: (event: never) => unknown): Promise<{ dispose(): Promise<void> }>
    transform(cb: (editor: never) => void): Promise<{ dispose(): Promise<void> }>
  }
  rpc: {
    register(
      definition: unknown,
      handlers: Record<string, (input: unknown, context: unknown) => Promise<unknown>>,
    ): Promise<{ events: { emit(name: string, data: unknown): Promise<unknown> } }>
  }
  shell: {
    hook(name: string, cb: (event: never) => unknown): Promise<{ dispose(): Promise<void> }>
  }
}

/** Extract answer text from a V2 tool result for approval matching. */
export function extractQuestionOutput(result?: {
  content?: string | Array<{ type?: string; text?: string }>
}): string {
  const content = result?.content
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("\n")
  }
  return ""
}

/** Options for setupEnsemble. */
export interface SetupOptions {
  /** Trusted opt-in safe hook diagnostics; never accepted through RPC/operator JSON. */
  hookDiagnostics?: (event: Record<string, unknown>) => Promise<void> | void
  /** SQLite path. Defaults to the global ensemble.db. */
  dbPath?: string
  /** Dashboard port. Defaults to config; 0 disables. */
  dashboardPort?: number
  /** Trusted wrapper-only operator settings; absent means dedicated project file, denied by default. */
  execution?: ExecutionOptions
}

/** Live handle for a V2 ensemble instance. */
export interface EnsembleHandle {
  db: Database
  registry: MemberRegistry
  tracker: DescendantTracker
  /** Same service registered on the public ensemble.execution.v1 RPC. */
  execution: ExecutionApi
  /** Dispatch one event (used by the live subscription loop; tests call directly). */
  dispatch(event: V2EventLike): Promise<void>
  /** Stop the event loop and release resources. */
  dispose(): Promise<void>
}

/**
 * Initialize Ensemble on a V2 plugin context: database, registries, event
 * subscription, tool hooks, session hooks, and shell env. Tool registration
 * lands in the next slice.
 */
export async function setupEnsemble(
  ctx: V2SetupContext,
  options: SetupOptions = {},
): Promise<EnsembleHandle> {
  const db = createDb(options.dbPath ?? getDbPath())
  const diagnostic = async (kind: string, data: Record<string, unknown>): Promise<void> => { try { await options.hookDiagnostics?.({ kind, directory: ctx.location.directory, databasePath: options.dbPath ?? getDbPath(), ...data }) } catch { /* Diagnostics must not broaden or interrupt authorization. */ } }
  const config = loadConfig(ctx.location.directory)
  const registry: MemberRegistry = new MemberRegistryImpl()
  const tracker: DescendantTracker = new DescendantTrackerImpl()
  const purgeApprovals = new PendingPurgeApprovals()
  const activityBuffer = new ActivityBuffer()
  const progressTracker = new ProgressTracker()
  const nudgedMembers = new Set<string>()
  const continuityOptions = { apiUrl: config.v2ApiUrl, authorization: process.env.OPENCODE_ENSEMBLE_V2_AUTHORIZATION }
  let capacityRuntime: CapacityRuntime | undefined
  const scheduleCapacity = (teamId: string, delay?: number): void => capacityRuntime?.request(teamId, delay)
  const wakeClient = withCapacityClient(db, createV2Client(ctx, continuityOptions), config.maxActiveMembers, scheduleCapacity)
  await recoverSessionContinuity({ db, registry, tracker, purgeApprovals, progressTracker, config,
    directory: ctx.location.directory, client: wakeClient })

  // Rehydrate the in-memory registry from SQLite so members from before a
  // restart are visible again. Without this, their events are ignored and
  // teams freeze silently after every server restart (seen live 2026-09-14).
  const rehydrated = rehydrateRegistry(db, registry)
  if (rehydrated > 0) vlog(`init:registry:rehydrated members=${rehydrated}`)

  /** Send the idle-without-report nudge once per member. */
  const nudgeMember = (teamId: string, memberName: string, sessionId: string): void => {
    if (!isTeamInDirectory(db, teamId, ctx.location.directory)) return
    const nudgeKey = `${teamId}:${memberName}`
    if (nudgedMembers.has(nudgeKey)) return
    if (!shouldNudgeIdleMember(db, teamId, memberName)) return
    if (hasReportedCompletion(db, teamId, memberName)) return
    nudgedMembers.add(nudgeKey)
    // Persist so hot-reloads don't re-nudge: every setup re-runs the sweep,
    // and without this each file save re-nudged every silent member (seen
    // live 2026-09-14 — 40+ nudges on one scout).
    db.run("UPDATE team_member SET last_nudged_at = ? WHERE team_id = ? AND name = ?", [
      Date.now(),
      teamId,
      memberName,
    ])
    vlog(`nudge:idle-without-report name=${memberName}`)
    wakeClient.session.promptAsync({
      sessionID: sessionId,
      parts: [{ type: "text", text: "[System]: You completed your work but did not report results. Send your findings to the lead via team_message now." }],
    }).catch((err) => {
      vlog(`nudge:idle-without-report:failed name=${memberName} err=${err instanceof Error ? err.message : String(err)}`)
    })
  }

  // Startup sweep: members already idle (e.g. finished while the plugin was
  // down) never emit a fresh transition, so nudge them now. Skip members
  // nudged within the hour — the guard survives reloads via the DB column.
  const nudgeCutoff = Date.now() - 60 * 60 * 1000
  const silent = db.query(
    `SELECT tm.team_id, tm.name, tm.session_id FROM team_member tm
     JOIN team t ON tm.team_id = t.id
     WHERE t.status = 'active' AND tm.status = 'ready'
       AND (tm.last_nudged_at IS NULL OR tm.last_nudged_at < ?)`,
  ).all(nudgeCutoff) as Array<{ team_id: string; name: string; session_id: string }>
  for (const member of silent) nudgeMember(member.team_id, member.name, member.session_id)
  const rateLimiter = new TokenBucket({
    capacity: config.rateLimitCapacity,
    refillRate: 2,
    refillIntervalMs: 1000,
  })
  const controller = new AbortController()
  let execution: ExecutionApi | undefined

  const dispatch = async (event: V2EventLike): Promise<void> => {
    const transition = dispatchV2Event(db, registry, tracker, event, ctx.location.directory)
    // Idle-without-report nudge (parity with V1): a member that went idle
    // without ever messaging the lead gets ONE reminder to report via
    // team_message. Without this, weak models finish silently and the lead
    // waits forever — the exact failure seen live on 2026-09-14.
    if (transition && transition.to === "ready" && transition.from === "busy") {
      const entry = registry.getByName(transition.teamId, transition.memberName)
      if (entry) {
        nudgeMember(transition.teamId, transition.memberName, entry.sessionId)
        // Pull-based pool: feed the newly idle member, then scale up if work
        // remains and the cap allows (opt-in — docs/task-pool.md). deps is
        // captured lazily; events only flow after setup completes.
        void pumpTeam(deps, transition.teamId).catch(error => vlog(`capacity:pump-failed ${String(error)}`))
      }
    }
    if (transition && ["shutdown", "error"].includes(transition.to)) scheduleCapacity(transition.teamId)
    const sessionId = event.data && typeof event.data === "object" && "sessionID" in event.data ? event.data.sessionID : undefined
    if (typeof sessionId === "string") await execution?.observe(sessionId)
    if (transition && rpc) {
      await emitMemberEvent(rpc, transition).catch(() => {
        // Companions are optional — never break the state machine for them.
      })
      if (transition.to === "ready" && transition.from === "busy") {
        await emitNoticeEvent(rpc, {
          title: "Team",
          message: `${transition.memberName} finished`,
          variant: "success",
        }).catch(() => undefined)
      } else if (transition.to === "error") {
        await emitNoticeEvent(rpc, {
          title: "Team",
          message: `${transition.memberName} errored`,
          variant: "error",
        }).catch(() => undefined)
      }
    }
  }

  // RPC bridge for terminal companions (toasts, navigation). Best-effort:
  // a failed registration must not break tools, hooks, or events.
  let rpc: { events: { emit(name: string, data: unknown): Promise<unknown> } } | null = null
  try {
    rpc = await ctx.rpc.register(EnsembleRpc, {
      summary: async (input) => {
        const team = (input as { team?: string }).team ?? ""
        const row = db.query("SELECT status FROM team WHERE name = ?").get(team) as {
          status: string
        } | null
        if (!row) return { text: `No team "${team}".` }
        const members = db.query("SELECT name, status FROM team_member WHERE team_id IN (SELECT id FROM team WHERE name = ?)").all(team) as Array<{
          name: string
          status: string
        }>
        const summary = members.map((m) => `${m.name}: ${m.status}`).join(", ")
        return { text: `Team "${team}" (${row.status}): ${summary || "no members"}` }
      },
      teamContext: async (input) => {
        const sessionID = (input as { sessionID?: string }).sessionID ?? ""
        const teamInfo = findTeamBySession(db, registry, sessionID)
        if (!teamInfo) return { team: null, members: [], tasks: { pending: 0, done: 0 } }
        const members = db.query("SELECT name, status FROM team_member WHERE team_id = ?").all(
          teamInfo.teamId,
        ) as Array<{ name: string; status: string }>
        const pending = (
          db.query("SELECT COUNT(*) as c FROM team_task WHERE team_id = ? AND status != 'completed'").get(
            teamInfo.teamId,
          ) as { c: number }
        ).c
        const done = (
          db.query("SELECT COUNT(*) as c FROM team_task WHERE team_id = ? AND status = 'completed'").get(
            teamInfo.teamId,
          ) as { c: number }
        ).c
        return { team: teamInfo.teamName, members, tasks: { pending, done } }
      },
    })
  } catch (err) {
    vlog(`init:rpc:failed err=${err instanceof Error ? err.message : String(err)}`)
  }

  // Live event loop — fire-and-forget; dispose() aborts it.
  void (async () => {
    try {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        await dispatch(event)
      }
    } catch {
      // Aborted on dispose or stream error — nothing to report.
    }
  })()

  const toolBeforeRegistration = await ctx.tool.hook("execute.before", async (raw) => {
    await diagnostic("tool_before_hook", safeExecutionHookShape(raw))
    const input = raw as unknown as { tool: string; sessionID: string; agent?: string; messageID?: string; id?: string; input?: unknown }
    checkToolIsolation(registry, tracker, input.tool, input.sessionID, db)
    const membership = findTeamBySession(db, registry, input.sessionID)
    if (membership?.role === "member" && isExecutionOwned(db, membership.teamId)) {
      if (input.tool === "team_broadcast") throw new Error("External execution workers may only report to the lead")
      if (input.tool === "team_message" && (!input.input || typeof input.input !== "object" || !("to" in input.input) || input.input.to !== "lead")) throw new Error("External execution workers may only message the lead")
    }
    if (execution) await execution.beforeTool({ sessionID: input.sessionID, agent: input.agent ?? "", messageID: input.messageID ?? "", id: input.id ?? "", tool: input.tool, input: input.input })
    if (input.tool.startsWith("team_")) {
      if (!rateLimiter.tryConsume()) {
        return rateLimiter.waitForToken().then(() => undefined)
      }
    }
    recordFromToolBefore({ sessionID: input.sessionID, tool: input.tool }, registry, activityBuffer)
  })
  await diagnostic("tool_before_registration", { available: typeof ctx.tool.hook === "function", registered: !!toolBeforeRegistration && typeof toolBeforeRegistration.dispose === "function" })

  const toolAfterRegistration = await ctx.tool.hook("execute.after", async (raw) => {
    await diagnostic("tool_after_hook", safeExecutionHookShape(raw))
    const event = raw as unknown as {
      tool: string
      sessionID: string
      agent?: string
      messageID?: string
      id?: string
      input: unknown
      status: string
      result?: { content?: string | Array<{ type?: string; text?: string }> }
      error?: { message?: unknown }
    }
    if (event.status === "error" && event.error) {
      // Weak-model arg fumbles (issue #39): the call is already dead from
      // validation, so append an explicit "the param is X, not Y" hint to
      // the error the model sees. Arguments are never rewritten — the
      // model stays in the correction loop. Fail-open by design: a
      // non-fumble error is returned untouched.
      if (enrichToolError(event.tool, event.error, event.input)) {
        vlog(`tool-arg-hint:fired tool=${event.tool} session=${event.sessionID}`)
      }
    }
    if (event.tool === "question") {
      // Feed the answer text to purge approvals (team_cleanup confirm flow).
      // The question tool renders in every client, so this is the universal
      // approval channel on V2 — no forms or TUI needed.
      purgeApprovals.recordQuestionAnswer(
        event.sessionID,
        extractQuestionOutput(event.result),
        event.input,
      )
    }
    recordFromToolAfter(
      { sessionID: event.sessionID, tool: event.tool },
      {},
      registry,
      activityBuffer,
    )
    if (event.agent && event.messageID && event.id) await execution?.observeTool({ sessionID: event.sessionID, agent: event.agent, messageID: event.messageID, id: event.id, tool: event.tool, status: event.status, input: event.input })
    if (event.sessionID) await execution?.observe(event.sessionID)
  })
  await diagnostic("tool_after_registration", { available: typeof ctx.tool.hook === "function", registered: !!toolAfterRegistration && typeof toolAfterRegistration.dispose === "function", keys: toolAfterRegistration ? Object.keys(toolAfterRegistration) : [], contextToolKeys: Object.keys(ctx.tool) })

  await ctx.session.hook("context", (raw) => {
    const event = raw as unknown as {
      sessionID: string
      system: Array<{ type: string; text: string }>
      messages?: unknown[]
    }
    if (!event.sessionID) return
    // Native switchAgent can wake an idle fork. Stop dispatch until isolation is
    // bound; no provider/tools may run at the source location during preparation.
    const preparing = db.query("SELECT spawn_pending FROM team_member WHERE session_id = ?").get(event.sessionID) as { spawn_pending: number } | null
    if (preparing?.spawn_pending && (preparing.spawn_pending === 1 || !JSON.stringify(event.messages ?? []).includes(`[Ensemble task ${event.sessionID}]`))) {
      throw new Error("Ensemble teammate initialization is still in progress")
    }
    const teamInfo = findTeamBySession(db, registry, event.sessionID)
    if (!teamInfo) return
    const prompt =
      teamInfo.role === "lead"
        ? buildLeadSystemPrompt(db, teamInfo.teamId, config)
        : buildTeammateSystemPrompt(db, teamInfo.teamId, teamInfo.memberName ?? "unknown", config)
    vlog(`system-prompt:injected role=${teamInfo.role} len=${prompt.length}`)
    event.system.push({ type: "text", text: prompt })
    if (teamInfo.role === "member") {
      // V2 invokes plugin tools through Code Mode, not direct calls —
      // without this hint teammates attempt direct calls that the runtime
      // rejects with "No tool named team_message is currently available"
      // (seen live 2026-09-14: explore scout denied twice, gave up).
      event.system.push({
        type: "text",
        text: 'Ensemble tools on this platform are called through the execute tool, e.g. tools.team_message({ to: "lead", text: "..." }). Do not call them directly.',
      })
    }
  })

  await ctx.session.hook("compaction", (raw) => {
    const event = raw as unknown as {
      sessionID: string
      system: Array<{ type: string; text: string }>
    }
    if (!event.sessionID) return
    const teamInfo = findTeamBySession(db, registry, event.sessionID)
    if (!teamInfo) return
    const context = buildTeamCompactionContext(db, teamInfo.teamId, teamInfo.role, teamInfo.memberName)
    event.system.push({ type: "text", text: context })
  })

  // Preserve legacy team-tool grants, but never override a bridge worker's
  // approved native profile policy, including execute and inspection denies.
  const permissionRegistration = await ctx.permission?.hook?.("evaluate", async event => {
    await diagnostic("permission_hook", safeExecutionHookShape(event))
    if (execution) {
      const native = { sessionID: event.sessionID, agent: event.agent, action: event.action, resources: event.resources ?? [], source: event.source, effect: event.effect }
      await execution.enforcePermission(native)
      event.effect = native.effect
    }
    if (event.action !== "execute" && !(MEMBER_TOOLS as readonly string[]).includes(event.action)) return
    const team = findTeamBySession(db, registry, event.sessionID)
    if (team?.role === "member" && !isExecutionOwned(db, team.teamId)) event.effect = "allow"
  })
  await diagnostic("permission_registration", { available: typeof ctx.permission?.hook === "function", registered: !!permissionRegistration && typeof permissionRegistration === "object" && "dispose" in permissionRegistration && typeof permissionRegistration.dispose === "function", keys: permissionRegistration && typeof permissionRegistration === "object" ? Object.keys(permissionRegistration) : [], contextPermissionKeys: Object.keys(ctx.permission ?? {}) })

  // OQ-V2-shell: the V2 shell hook carries no sessionID, so per-session
  // ENSEMBLE_* env cannot be scoped. Registered as a placeholder until the
  // API gains session scope — team tools and prompts carry identity instead.
  await ctx.shell.hook("create.before", () => undefined)

  const client = withCapacityClient(db, createV2Client(ctx, { ...continuityOptions, ...(rpc ? { rpcEmitter: rpc } : {}) }), config.maxActiveMembers, scheduleCapacity)
  const deps: ToolDeps = {
    db,
    registry,
    tracker,
    purgeApprovals,
    client,
    directory: ctx.location.directory,
    config,
    progressTracker,
  }
  const listClassifiers = ctx.tool.list?.bind(ctx.tool)
  if (listClassifiers && ctx.session.wait && ctx.session.remove && ctx.permission?.hook) {
    deps.classifier = { list: listClassifiers, invoke: request => invokeNativeClassifier(ctx as unknown as V2ClassificationContext, { ...request, signal: controller.signal }), general: request => invokeNativeGeneralClassifier(ctx as unknown as V2ClassificationContext, { ...request, signal: controller.signal }), removeHelper: sessionID => removeNativeClassificationHelper(ctx as unknown as V2ClassificationContext, sessionID) }
  }
  const executionOptions = options.execution ?? {
    principals: loadExecutionPrincipals(ctx.location.directory),
    ...(ctx.agent ? { profile: (id: string) => ctx.agent?.get({ agentID: id }) ?? Promise.resolve(undefined) } : {}),
  }
  const permissionHookRegistered = !!permissionRegistration && typeof permissionRegistration === "object" && "dispose" in permissionRegistration && typeof permissionRegistration.dispose === "function"
  const toolAfterHookRegistered = !!toolAfterRegistration && typeof toolAfterRegistration.dispose === "function"
  const toolBeforeHookRegistered = !!toolBeforeRegistration && typeof toolBeforeRegistration.dispose === "function"
  await diagnostic("native_boundary_method", { method: "public.execute.before+execute.after", permissionHookRegistered, toolBeforeHookRegistered, toolAfterHookRegistered })
  execution = createExecutionApi(deps, { ...executionOptions, ...(options.hookDiagnostics ? { hookDiagnostics: options.hookDiagnostics } : {}), nativeAccessWitness: executionOptions.nativeAccessWitness !== false && toolBeforeHookRegistered && toolAfterHookRegistered })
  deps.execution = execution
  if (ctx.rpc) {
    const api = execution
    await ctx.rpc.register(ExecutionRpc, Object.fromEntries(Object.keys(ExecutionRpc.methods).map(method => [method, async (input: unknown, context: unknown) => {
      try { return await api.handle(method, input) }
      catch (error) {
        const token = input && typeof input === "object" && "token" in input && typeof input.token === "string" ? input.token : ""
        const details = executionFailure(error, token)
        const handler = context as { error?: (type: string, message: string, data: unknown) => unknown } | undefined
        if (handler?.error) throw handler.error("execution_rejected", details.message, details)
        throw error
      }
    }])))
  }
  await registerV2Tools(ctx.tool, deps)
  capacityRuntime = await startCapacityRuntime(deps)

  // Resume pending work and arm a single wake at the next persisted lease expiry.
  // No idle polling; helpers use native wait and their own bounded cleanup.
  const classificationTimers = new Set<ReturnType<typeof setTimeout>>()
  const resumeClassifications = (teamId: string): void => {
    if (controller.signal.aborted) return
    void classifyBoardTasks(deps, teamId).catch(error => { vlog(`classification:recovery-failed ${String(error)}`) }).then(() => {
      if (controller.signal.aborted) return
      const team = db.query("SELECT mission_state FROM team WHERE id = ?").get(teamId) as { mission_state: string } | null
      if (!team || team.mission_state === "critical") return
      const next = db.query("SELECT MIN(due) AS until FROM (SELECT classification_until AS due FROM team_task WHERE team_id = ? AND classification_status = 'running' UNION ALL SELECT lease_until AS due FROM classification_helper WHERE team_id = ? AND lease_until > ?)").get(teamId, teamId, Date.now()) as { until: number | null }
      if (next.until === null) return
      const timer = setTimeout(() => { classificationTimers.delete(timer); resumeClassifications(teamId) }, Math.max(1, Math.min(2_147_483_647, next.until - Date.now() + 1)))
      classificationTimers.add(timer)
    })
  }
  const recoverable = db.query("SELECT id FROM team WHERE project_id = ? AND status = 'active' AND (id IN (SELECT team_id FROM team_task WHERE classification_status IN ('pending', 'running')) OR id IN (SELECT team_id FROM classification_helper))").all(ctx.location.directory) as Array<{ id: string }>
  recoverable.forEach(team => { resumeClassifications(team.id) })

  // Dashboard mirrors V1: main instance only, skipped when port is 0.
  let dashboard: DashboardServer | null = null
  const dashboardPort = options.dashboardPort ?? config.dashboardPort
  if (dashboardPort !== 0 && !isWorktreeInstance(ctx.location.directory)) {
    const { provider, model } = ctx
    const readProviderInventory = provider && model ? createNativeProviderInventoryReader({ load: directory => Promise.all([
      provider.list({ location: { directory } }), model.list({ location: { directory } }),
    ]) }) : undefined
    dashboard = await startDashboard(db, dashboardPort, { activityBuffer, client, readProviderInventory }).catch((err) => {
      vlog(`init:dashboard:failed err=${err instanceof Error ? err.message : String(err)}`)
      return null
    })
  }

  return {
    db,
    registry,
    tracker,
    execution,
    dispatch,
    dispose: async () => {
      controller.abort()
      classificationTimers.forEach(clearTimeout)
      capacityRuntime?.dispose()
      dashboard?.stop()
    },
  }
}
