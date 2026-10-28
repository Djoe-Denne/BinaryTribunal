import type { Database } from "./db"
import type { SpawnContext, ToolDeps } from "./types"
import { resolveSpawnContext } from "./session-continuity"

/** A lead/producer decision, never inferred by the scheduler from task prose. */
export interface TaskContextDecision {
  mode: SpawnContext["mode"] | "pending"
  from?: string
  messageID?: string
  reason: string
  worktree?: boolean
}

export interface TaskContextView {
  decision: TaskContextDecision | null
  revision: number
  state: "legacy" | "ready" | "pending" | "error"
  error: string | null
}

export interface TaskContextUpdate {
  task_id: string
  revision: number
  context: TaskContextDecision
}

/** A held context must never degrade to a fresh spawn or a reused worker. */
export class TaskContextUnavailableError extends Error {}

/** Validate the decision payload independently of native transport availability. */
export function validateTaskContext(value: unknown): TaskContextDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Task context must be an object")
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !["mode", "from", "messageID", "reason", "worktree"].includes(key))) throw new Error("Unknown task context field")
  const mode = input.mode
  if (mode !== "fresh" && mode !== "fork" && mode !== "checkpoint" && mode !== "compact_fork" && mode !== "pending") throw new Error("Invalid task context mode")
  if (typeof input.reason !== "string" || !input.reason.trim() || input.reason.length > 4000) throw new Error("Task context requires a reason (1..4000 characters)")
  if (input.worktree !== undefined && typeof input.worktree !== "boolean") throw new Error("Task context worktree must be boolean")
  if (input.from !== undefined && (typeof input.from !== "string" || !input.from.trim())) throw new Error("Invalid task context source")
  if (mode === "fresh" || mode === "pending") {
    if (input.from !== undefined || input.messageID !== undefined) throw new Error(`${mode} task context cannot contain a source or boundary`)
  } else if (mode === "checkpoint") {
    if (typeof input.messageID !== "string" || !input.messageID.startsWith("msg_")) throw new Error("Task checkpoint requires an exclusive native messageID")
  } else if (input.messageID !== undefined) throw new Error("Task context messageID requires checkpoint mode")
  return { mode, reason: input.reason, ...(typeof input.from === "string" ? { from: input.from } : {}), ...(typeof input.messageID === "string" ? { messageID: input.messageID } : {}), ...(input.worktree !== undefined ? { worktree: input.worktree } : {}) }
}

/** Freeze aliases such as current/lead/member to the native source identity at decision time. */
export function bindTaskContext(db: Database, teamId: string, sessionId: string, value: unknown): TaskContextDecision {
  const context = validateTaskContext(value)
  if (context.mode === "fresh" || context.mode === "pending") return context
  const team = db.query("SELECT lead_session_id FROM team WHERE id = ?").get(teamId) as { lead_session_id: string } | null
  if (!team) throw new Error("Task context team not found")
  const from = context.from === undefined || context.from === "current" ? sessionId : context.from
  const source = from === "lead" || from === team.lead_session_id ? team.lead_session_id
    : (db.query("SELECT session_id FROM team_member WHERE team_id = ? AND (name = ? OR session_id = ?)").get(teamId, from, from) as { session_id: string } | null)?.session_id
  if (!source) throw new Error("Task context source must belong to this team")
  return { ...context, from: source }
}

/** Read durable context eligibility without changing dependency or classification state. */
export function getTaskContextView(db: Database, teamId: string, taskId: string): TaskContextView {
  const row = db.query(`SELECT t.context_policy, t.context_revision, t.context_error, m.task_context_required
    FROM team_task t JOIN team m ON m.id=t.team_id WHERE t.id=? AND t.team_id=?`).get(taskId, teamId) as
    { context_policy: string | null; context_revision: number; context_error: string | null; task_context_required: number } | null
  if (!row) throw new Error("Task context task not found")
  try {
    const decision = row.context_policy ? validateTaskContext(JSON.parse(row.context_policy)) : null
    const error = row.context_error
    return { decision, revision: row.context_revision, error, state: error ? "error" : decision ? decision.mode === "pending" ? "pending" : "ready" : row.task_context_required ? "pending" : "legacy" }
  } catch { return { decision: null, revision: row.context_revision, error: "Invalid stored task context decision", state: "error" } }
}

/** Apply a revision-checked batch atomically; only unassigned queued tasks may change. */
export function updateTaskContexts(db: Database, teamId: string, sessionId: string, updates: TaskContextUpdate[], requireContext?: boolean, beforeWrite?: () => void): void {
  if (!Array.isArray(updates)) throw new Error("context_updates must be an array")
  if (requireContext !== undefined && typeof requireContext !== "boolean") throw new Error("require_context must be boolean")
  const keys = new Set<string>()
  const decisions = updates.map(update => {
    if (!update || typeof update.task_id !== "string" || keys.has(update.task_id)) throw new Error("Duplicate or invalid context task ID")
    keys.add(update.task_id)
    if (!Number.isSafeInteger(update.revision) || update.revision < 0) throw new Error("Invalid context revision")
    return { ...update, context: bindTaskContext(db, teamId, sessionId, update.context) }
  })
  db.transaction(() => {
    beforeWrite?.()
    decisions.forEach(update => {
      const changed = db.run(`UPDATE team_task SET context_policy=?, context_revision=context_revision+1, context_error=NULL, time_updated=?
        WHERE team_id=? AND id=? AND context_revision=? AND status IN ('pending','blocked') AND assignee IS NULL`,
      [JSON.stringify(update.context), Date.now(), teamId, update.task_id, update.revision])
      if (changed.changes !== 1) throw new Error(`Task context revision changed or task is not queued: ${update.task_id}`)
    })
    if (requireContext !== undefined) db.run("UPDATE team SET task_context_required=? WHERE id=?", [Number(requireContext), teamId])
  })()
}

/** Resolve a saved decision before any session/worktree/capacity allocation. */
export function taskContextForSpawn(deps: ToolDeps, teamId: string, taskId: string, sessionId: string, explicit?: SpawnContext): { context?: SpawnContext; revision?: number; worktree?: boolean } {
  const view = getTaskContextView(deps.db, teamId, taskId)
  if (view.state === "error" || view.state === "pending") throw new TaskContextUnavailableError(`Task context unavailable: ${view.error ?? view.decision?.reason ?? "decision required"}`)
  if (!view.decision) return { context: explicit }
  const { mode, from, messageID } = view.decision
  if (mode === "pending") throw new TaskContextUnavailableError("Task context decision pending")
  const context: SpawnContext = { mode, ...(from ? { from } : {}), ...(messageID ? { messageID } : {}) }
  if (explicit && JSON.stringify(resolveSpawnContext(deps, explicit, teamId, sessionId)) !== JSON.stringify(resolveSpawnContext(deps, context, teamId, sessionId))) {
    throw new TaskContextUnavailableError("Explicit context conflicts with the task context decision")
  }
  return { context, revision: view.revision, worktree: view.decision.worktree }
}

/** Guard manual/reuse claims as well as the atomic initial spawn claim. */
export function assertTaskContextClaim(db: Database, teamId: string, taskId: string, spawnRevision?: number): void {
  const view = getTaskContextView(db, teamId, taskId)
  if (view.state === "legacy") return
  if (view.state !== "ready" || spawnRevision !== view.revision) throw new TaskContextUnavailableError(`Task context requires an independent planned spawn: ${view.error ?? view.decision?.reason ?? "decision required"}`)
}

/** Hold a failed planned admission until its decision is explicitly reviewed/updated. */
export function holdTaskContext(db: Database, teamId: string, taskId: string, revision: number, error: unknown): void {
  db.run("UPDATE team_task SET context_error=? WHERE team_id=? AND id=? AND context_revision=? AND status='pending' AND assignee IS NULL", [String(error).slice(0,2000), teamId, taskId, revision])
}
