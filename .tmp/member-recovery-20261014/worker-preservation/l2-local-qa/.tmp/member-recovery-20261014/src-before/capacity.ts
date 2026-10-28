import type { Database } from "./db"
import { DEFAULT_CONFIG } from "./config"
import { generateId } from "./util"

export interface TeamCapacity {
  limit: number
  running: number
  starting: number
  available: number | null
  queued: number
  waiting: number
}

/** Read the mission's shared execution budget. */
export function getTeamCapacity(db: Database, teamId: string, fallback = DEFAULT_CONFIG.maxActiveMembers): TeamCapacity {
  const team = db.query("SELECT max_running_members FROM team WHERE id = ?").get(teamId) as { max_running_members: number | null } | null
  if (!team) throw new Error("Mission not found")
  const limit = team.max_running_members ?? fallback
  const slots = db.query(`SELECT member_name, MAX(weight) AS weight FROM (
    SELECT name AS member_name, CASE WHEN execution_status = 'starting' OR spawn_pending = 1 THEN 1 ELSE 2 END AS weight
      FROM team_member WHERE team_id = ? AND status NOT IN ('shutdown', 'error') AND (status IN ('busy', 'shutdown_requested') OR spawn_pending = 1)
    UNION ALL SELECT member_name, 1 AS weight FROM team_spawn_reservation WHERE team_id = ?
  ) GROUP BY member_name`).all(teamId, teamId) as Array<{ weight: number }>
  const starting = slots.filter(slot => slot.weight === 1).length
  const running = slots.length - starting
  const queued = (db.query("SELECT COUNT(*) AS n FROM team_task WHERE team_id = ? AND status = 'pending' AND assignee IS NULL AND classification_status IN ('not_required','completed')").get(teamId) as { n: number }).n
  const waiting = (db.query("SELECT COUNT(DISTINCT member_name) AS n FROM team_capacity_queue WHERE team_id = ?").get(teamId) as { n: number }).n
  return { limit, running, starting, available: limit === 0 ? null : Math.max(0, limit - slots.length), queued, waiting }
}

/** Persist a supervisor-selected execution limit. */
export function setTeamCapacity(db: Database, teamId: string, limit: number): void {
  validateWorkerLimit(limit)
  if (!db.run("UPDATE team SET max_running_members = ?, time_updated = ? WHERE id = ?", [limit, Date.now(), teamId]).changes) throw new Error("Mission not found")
}

/** Validate a limit before creating or changing a mission. */
export function validateWorkerLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error("Worker limit must be a non-negative integer (0 means unlimited)")
}

/** Resolve the persisted mission policy before consulting host-local defaults. */
export function getTeamScheduling(db: Database, teamId: string, fallback = DEFAULT_CONFIG): { autoDispatch: boolean; autoScale: boolean } {
  const row = db.query("SELECT auto_dispatch,auto_scale FROM team WHERE id = ?").get(teamId) as { auto_dispatch: number | null; auto_scale: number | null } | null
  return { autoDispatch: row?.auto_dispatch == null ? fallback.autoDispatch : row.auto_dispatch === 1,
    autoScale: row?.auto_scale == null ? fallback.autoScale : row.auto_scale === 1 }
}

/** Reserve capacity before allocating any native spawn resource. */
export function reserveSpawnCapacity(db: Database, teamId: string, name: string, fallback = DEFAULT_CONFIG.maxActiveMembers, onReserved?: () => void): string {
  return db.transaction(() => {
    const capacity = getTeamCapacity(db, teamId, fallback)
    if (capacity.available === 0) throw new Error(`Concurrent worker limit reached: ${capacity.running + capacity.starting}/${capacity.limit}. Wait for a slot or ask the lead to update max_running_members.`)
    const token = generateId("admission")
    db.run("INSERT INTO team_spawn_reservation (team_id,member_name,token,owner_pid,time_created) VALUES (?,?,?,?,?)", [teamId, name, token, process.pid, Date.now()])
    onReserved?.()
    return token
  })()
}

/** Release a spawn reservation by its unique ownership token. */
export function releaseSpawnCapacity(db: Database, token: string): void {
  db.run("DELETE FROM team_spawn_reservation WHERE token = ?", [token])
}

/** Admit an idle member atomically, or reuse its already occupied slot. */
export function reserveMemberCapacity(db: Database, teamId: string, name: string, fallback = DEFAULT_CONFIG.maxActiveMembers, onReserved?: () => void): { token: string | null } | null {
  return db.transaction(() => {
    const member = db.query("SELECT status, spawn_pending FROM team_member WHERE team_id = ? AND name = ?").get(teamId, name) as { status: string; spawn_pending: number } | null
    if (!member) return null
    if (member.status === "busy" || member.status === "shutdown_requested") return onReserved ? null : { token: null }
    if (member.status !== "ready" || member.spawn_pending || getTeamCapacity(db, teamId, fallback).available === 0) return null
    const token = generateId("admission")
    const result = db.run("UPDATE team_member SET status = 'busy', execution_status = 'starting', admission_token = ?, admission_owner_pid = ?, reported_to_lead = 0, time_updated = ? WHERE team_id = ? AND name = ? AND status = 'ready' AND spawn_pending = 0", [token, process.pid, Date.now(), teamId, name])
    if (result.changes) onReserved?.()
    return result.changes ? { token } : null
  })()
}

/** Roll back only a still-starting admission owned by this delivery. */
export function releaseMemberCapacity(db: Database, teamId: string, name: string, token: string | null): boolean {
  if (!token) return false
  return db.run("UPDATE team_member SET status = 'ready', execution_status = 'idle', admission_token = NULL, admission_owner_pid = NULL, time_updated = ? WHERE team_id = ? AND name = ? AND admission_token = ? AND execution_status = 'starting' AND status = 'busy'", [Date.now(), teamId, name, token]).changes > 0
}

/** Render the same capacity information for lead, worker and status views. */
export function formatTeamCapacity(capacity: TeamCapacity): string {
  return `Worker capacity: ${capacity.running} running + ${capacity.starting} starting / ${capacity.limit || "unlimited"}; ${capacity.available ?? "unlimited"} free; ${capacity.queued} queued tasks; ${capacity.waiting} queued wakes. Idle sessions and the lead do not consume worker slots. Only the lead can change max_running_members.`
}
