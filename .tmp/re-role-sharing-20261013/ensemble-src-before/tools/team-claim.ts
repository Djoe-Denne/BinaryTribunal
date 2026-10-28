import type { Database } from "../db"
import type { ToolDeps } from "../types"
import { requireTeamMember } from "./shared"
import { assertTaskContextClaim } from "../task-context"

/**
 * Atomically claim a pending task for an assignee. Sets status to
 * 'in_progress' and records the assignee. Throws if the task is missing,
 * blocked, already claimed, or no longer pending. Returns the task content
 * on success.
 *
 * Shared by team_claim and team_spawn's claim_task auto-claim so both paths
 * enforce the same atomic claim invariant.
 */
export function claimTask(db: Database, teamId: string, taskId: string, assignee: string, spawnContextRevision?: number): string {
  const mission = db.query("SELECT mission_state FROM team WHERE id = ?").get(teamId) as { mission_state: string } | null
  if (mission?.mission_state === "critical") throw new Error("Mission is critical; resolve the classification safety/budget failure before claiming work")
  const task = db.query("SELECT content, status, assignee, classification_status FROM team_task WHERE id = ? AND team_id = ?")
    .get(taskId, teamId) as { content: string; status: string; assignee: string | null; classification_status: string } | null
  if (!task) throw new Error(`Task "${taskId}" not found`)
  if (!["not_required", "completed"].includes(task.classification_status)) throw new Error(`Task "${taskId}" is awaiting classification (${task.classification_status})`)
  if (task.status === "blocked") throw new Error(`Task "${taskId}" is blocked by unresolved dependencies`)
  if (task.status !== "pending") throw new Error(`Task "${taskId}" is not pending (status: ${task.status})`)
  if (task.assignee) throw new Error(`Task "${taskId}" is already claimed by ${task.assignee}`)
  assertTaskContextClaim(db, teamId, taskId, spawnContextRevision)

  // Atomic claim: UPDATE only if still pending and unassigned
  const result = db.run(
    `UPDATE team_task SET status = 'in_progress', assignee = ?, time_updated = ? WHERE id = ? AND team_id = ? AND status = 'pending' AND assignee IS NULL AND classification_status IN ('not_required', 'completed') AND team_id IN (SELECT id FROM team WHERE mission_state != 'critical')
      AND context_error IS NULL AND ((context_policy IS NULL AND team_id IN (SELECT id FROM team WHERE task_context_required=0)) OR (context_policy IS NOT NULL AND context_revision=?))`,
    [assignee, Date.now(), taskId, teamId, spawnContextRevision ?? -1]
  )

  if (result.changes === 0) {
    throw new Error(`Task "${taskId}" is already claimed (race condition)`)
  }

  return task.content
}

/**
 * Execute the team_claim tool. Atomically claims a pending task.
 * Rejects if the task is already claimed, blocked, or not pending.
 */
export async function executeTeamClaim(
  deps: ToolDeps,
  args: { task_id: string },
  sessionId: string,
): Promise<string> {
  const teamInfo = requireTeamMember(deps, sessionId)

  const claimerName = teamInfo.role === "lead" ? "lead" : (teamInfo.memberName ?? "unknown")
  const content = claimTask(deps.db, teamInfo.teamId, args.task_id, claimerName)

  return `Claimed task: ${content}`
}
