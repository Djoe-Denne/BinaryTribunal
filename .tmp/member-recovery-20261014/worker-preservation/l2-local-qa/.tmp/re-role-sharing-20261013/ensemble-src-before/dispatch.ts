import type { Database } from "./db"
import type { ToolDeps } from "./types"
import { claimTask } from "./tools/team-claim"
import { executeTeamSpawn, SpawnCircuitOpenError } from "./tools/team-spawn"
import { getMemberPromptModel } from "./member-model"
import { log } from "./log"
import { getTeamCapacity, getTeamScheduling, releaseMemberCapacity, reserveMemberCapacity } from "./capacity"
import { drainCapacityQueue } from "./capacity-delivery"
import { routeMissionTaskModel } from "./mission-routing"
import { ModelPreferenceUnavailableError } from "./model-preference"
import { getTaskContextView, TaskContextUnavailableError } from "./task-context"
import { isTeamInDirectory } from "./team-scope"
import { isExecutionPaused } from "./execution-store"

/** A task candidate the pool can hand to an idle member. */
export interface PoolTask {
  id: string
  content: string
}

/** How many candidates to try before giving up (race-fallback bound). */
const MAX_CLAIM_ATTEMPTS = 5

/** Priority rank for deterministic ordering: high=0, medium=1, low=2. */
function priorityRank(priority: string): number {
  return priority === "high" ? 0 : priority === "low" ? 2 : 1
}

/**
 * Pick the board tasks an idle member could take, best first. Eligible tasks
 * are pending, unassigned, and either unaffiliated or reserved for the
 * member's agent type. Order: exact affinity match first, then priority
 * (high > medium > low), then FIFO (the SQL keeps time_created ASC and the
 * sort is stable). Bounded to `limit` candidates.
 */
export function pickNextTask(db: Database, teamId: string, agentType: string, limit = MAX_CLAIM_ATTEMPTS): PoolTask[] {
  const rows = db.query(
    `SELECT id, content, agent, priority FROM team_task
      WHERE team_id = ? AND status = 'pending' AND assignee IS NULL
        AND classification_status IN ('not_required', 'completed')
        AND team_id IN (SELECT id FROM team WHERE mission_state != 'critical')
       AND (agent IS NULL OR agent = ?)
     ORDER BY time_created ASC`,
  ).all(teamId, agentType) as Array<{ id: string; content: string; agent: string | null; priority: string }>

  return rows
    .filter(task => getTaskContextView(db, teamId, task.id).state === "legacy")
    .sort((a, b) => {
      const affinity = Number(b.agent !== null) - Number(a.agent !== null)
      if (affinity !== 0) return affinity
      return priorityRank(a.priority) - priorityRank(b.priority)
    })
    .slice(0, limit)
    .map(({ id, content }) => ({ id, content }))
}

/** Choose the next unused monotonically numbered automatic worker name. */
export function nextWorkerName(db: Database, teamId: string): string {
  const rows = db.query("SELECT name FROM team_member WHERE team_id = ? AND name LIKE 'pool-%'")
    .all(teamId) as Array<{ name: string }>
  let max = 0
  for (const { name } of rows) {
    const n = Number.parseInt(name.slice("pool-".length), 10)
    if (Number.isInteger(n) && n > max) max = n
  }
  return `pool-${max + 1}`
}

/** Auto-scale spawn workers in flight per team — one spawn per pump, no storms. */
const scaleInFlight = new Set<string>()

/**
 * Maximize pool utilization: feed every idle member, then spawn additional
 * workers while eligible work remains and the active-member cap allows.
 *
 * Feed phase reuses dispatchNextTask (atomic claims, affinity ordering).
 * Scale phase picks the best remaining task (unaffiliated/build-affinity
 * first, then priority, then FIFO), derives the worker's agent type from the
 * task affinity (default "build"), names it pool-<N>, and spawns through
 * executeTeamSpawn — so the concurrency cap, worktree isolation, permission
 * rules, circuit breaker, and rollback all apply unchanged. Scored tasks use
 * mission provider preference after quality eligibility; otherwise model
 * selection follows the existing configuration/default chain.
 *
 * Drains queued wakes even when automatic board scheduling is disabled. Callers may ignore the
 * returned promise (fire-and-forget per settled decision #10); it resolves
 * once any triggered spawn settles, which makes tests deterministic.
 */
export async function pumpTeam(deps: ToolDeps, teamId: string): Promise<void> {
  if (!isTeamInDirectory(deps.db, teamId, deps.directory)) return
  if (isExecutionPaused(deps.db, teamId)) return
  const scheduling = getTeamScheduling(deps.db, teamId, deps.config)
  const team = deps.db.query("SELECT lead_session_id FROM team WHERE id = ? AND status = 'active' AND mission_state != 'critical'")
    .get(teamId) as { lead_session_id: string } | null
  if (!team) return
  drainCapacityQueue(deps, teamId)
  await deps.execution?.pump(teamId)
  if (!scheduling.autoDispatch && !scheduling.autoScale) return

  if (scheduling.autoDispatch) {
    const idle = deps.db.query(
      "SELECT name FROM team_member WHERE team_id = ? AND status = 'ready' AND spawn_pending = 0 ORDER BY time_updated ASC, name ASC",
    ).all(teamId) as Array<{ name: string }>
    idle.forEach(member => { dispatchNextTask(deps, teamId, member.name) })
  }

  if (!scheduling.autoScale || scaleInFlight.has(teamId)) return
  scaleInFlight.add(teamId)
  try {
    const tasks = deps.db.query(
    `SELECT id, content, agent FROM team_task
      WHERE team_id = ? AND status = 'pending' AND assignee IS NULL
        AND classification_status IN ('not_required', 'completed')
        AND team_id IN (SELECT id FROM team WHERE mission_state != 'critical')
     ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
       time_created ASC, id ASC`,
    ).all(teamId) as Array<{ id: string; content: string; agent: string | null }>
    for (const task of tasks) {
      if (!getTeamScheduling(deps.db, teamId, deps.config).autoScale) break
      if (getTeamCapacity(deps.db, teamId, deps.config.maxActiveMembers).available === 0) break
      const current = deps.db.query("SELECT status,assignee FROM team_task WHERE id = ? AND team_id = ?").get(task.id, teamId) as { status: string; assignee: string | null }
      if (current.status !== "pending" || current.assignee) continue
      const context = getTaskContextView(deps.db, teamId, task.id)
      if (context.state === "pending" || context.state === "error") continue
      const name = nextWorkerName(deps.db, teamId)
      try {
        await executeTeamSpawn(deps, { name, agent: task.agent?.trim() || "build", prompt: dispatchMessage(task), claim_task: task.id }, team.lead_session_id, true)
      } catch (err) {
        log(`pool:scale-up:failed team=${teamId} worker=${name} err=${err instanceof Error ? err.message : String(err)}`)
        if (err instanceof SpawnCircuitOpenError) break
        if (err instanceof ModelPreferenceUnavailableError || err instanceof TaskContextUnavailableError || context.decision) continue
        break
      }
    }
  } finally {
    scaleInFlight.delete(teamId)
  }
}

/** The mission delta delivered to a member alongside an auto-assigned task. */
function dispatchMessage(task: PoolTask): string {
  return [
    `[System] Auto-dispatch: you have been assigned task ${task.id}.`,
    `Task: ${task.content}`,
    "",
    "Work on it now. When done, mark it complete with team_tasks_complete and report to the lead as usual.",
    "If the task is unclear or blocked, message the lead instead of guessing.",
  ].join("\n")
}

/**
 * Assign the next eligible board task to an idle member (pull-based pool).
 * Returns the claimed task ID, or null when autoDispatch is off, the member
 * is not claimable (not ready / still initializing / unknown session), or the
 * board has nothing eligible.
 *
 * Claiming goes through the same atomic claimTask as team_claim and
 * spawn's claim_task, so a task is never double-assigned across paths. A
 * lost race falls through to the next candidate. Delivery is fire-and-forget;
 * if it fails, the claim is released back to the pool.
 */
export function dispatchNextTask(deps: ToolDeps, teamId: string, memberName: string): string | null {
  if (!isTeamInDirectory(deps.db, teamId, deps.directory)) return null
  if (!getTeamScheduling(deps.db, teamId, deps.config).autoDispatch) return null

  const member = deps.db.query("SELECT agent, status, spawn_pending, session_id, model_override FROM team_member WHERE team_id = ? AND name = ?")
    .get(teamId, memberName) as { agent: string; status: string; spawn_pending: number; session_id: string; model_override: number } | null
  if (!member || member.status !== "ready" || member.spawn_pending !== 0) return null

  if (deps.db.query("SELECT 1 FROM team_task WHERE team_id = ? AND assignee = ? AND status = 'in_progress'").get(teamId, memberName)) return null

  let attempts = 0
  for (const task of pickNextTask(deps.db, teamId, member.agent, Number.POSITIVE_INFINITY)) {
    // Quality exclusions are not claim races. Skip them without exhausting the
    // bounded claim retries, so a difficult head task cannot starve easier work.
    try { if (!member.model_override) routeMissionTaskModel(deps, teamId, task.id) }
    catch (error) {
      if (error instanceof ModelPreferenceUnavailableError) continue
      if (++attempts >= MAX_CLAIM_ATTEMPTS) return null
      continue
    }
    if (attempts++ >= MAX_CLAIM_ATTEMPTS) return null
    let admission: { token: string | null } | null
    try {
      admission = reserveMemberCapacity(deps.db, teamId, memberName, deps.config.maxActiveMembers, () => {
        if (deps.db.query("SELECT 1 FROM team_task WHERE team_id = ? AND assignee = ? AND status = 'in_progress'").get(teamId, memberName)) throw new Error("Worker already owns unfinished work")
        claimTask(deps.db, teamId, task.id, memberName)
        const routing = member.model_override ? undefined : routeMissionTaskModel(deps, teamId, task.id, {}, "within-transaction")
        if (routing) {
          const variant = routing.selected.reasoningEffort
          deps.db.run("UPDATE team_member SET model = ?, model_variant = ?, model_routing = ? WHERE team_id = ? AND name = ?", [routing.selected.id, variant && variant !== "default" ? variant : null, JSON.stringify(routing), teamId, memberName])
        }
      })
      if (!admission?.token) return null
    } catch {
      continue // Lost a race or state changed — try the next candidate.
    }

    const model = getMemberPromptModel(deps.db, teamId, memberName)
    deps.registry.register(teamId, memberName, member.session_id)
    deps.progressTracker.recordBusyStart(member.session_id)
    deps.client.session.promptAsync({
      sessionID: member.session_id,
      parts: [{ type: "text", text: dispatchMessage(task) }],
      ensemble: { admissionToken: admission.token },
      ...model,
    }).catch(() => {
      if (!releaseMemberCapacity(deps.db, teamId, memberName, admission.token)) return
      // Delivery failed — release the claim so the task returns to the pool.
      deps.db.run(
        "UPDATE team_task SET status = 'pending', assignee = NULL, time_updated = ? WHERE id = ? AND assignee = ? AND status = 'in_progress'",
        [Date.now(), task.id, memberName],
      )
      log(`dispatch:release team=${teamId} member=${memberName} task=${task.id}`)
      deps.scheduleCapacity?.(teamId, 5000)
    })
    log(`dispatch:assigned team=${teamId} member=${memberName} task=${task.id}`)
    return task.id
  }
  return null
}
