import type { ToolDeps } from "./types"
import { releaseMemberCapacity, releaseSpawnCapacity } from "./capacity"
import { pumpTeam } from "./dispatch"
import { releaseMemberTasks } from "./tasks"
import { log } from "./log"
import { isTeamInDirectory } from "./team-scope"

export interface CapacityRuntime {
  request(teamId: string, delayMs?: number): void
  dispose(): void
}

function ownerAlive(pid: number): boolean {
  if (pid <= 0) return false
  try { process.kill(pid, 0); return true } catch (error) {
    return (error as { code?: string }).code !== "ESRCH"
  }
}

async function recoverAdmissions(deps: ToolDeps, teamIds: string[]): Promise<void> {
  const starts = teamIds.flatMap(teamId => {
    const reservations = deps.db.query("SELECT member_name,token,owner_pid FROM team_spawn_reservation WHERE team_id = ?").all(teamId) as Array<{ member_name: string; token: string; owner_pid: number }>
    reservations.filter(row => !ownerAlive(row.owner_pid)).forEach(row => {
      deps.db.transaction(() => {
        releaseSpawnCapacity(deps.db, row.token)
        if (!deps.db.query("SELECT 1 FROM team_member WHERE team_id = ? AND name = ?").get(teamId, row.member_name)) releaseMemberTasks(deps.db, teamId, row.member_name)
      })()
    })
    const deliveries = deps.db.query("SELECT id,owner_pid FROM team_capacity_queue WHERE team_id = ? AND delivering = 1").all(teamId) as Array<{ id: string; owner_pid: number | null }>
    deliveries.filter(row => row.owner_pid !== null && !ownerAlive(row.owner_pid)).forEach(row => {
      deps.db.run("UPDATE team_capacity_queue SET delivering = 0, owner_pid = NULL WHERE id = ?", [row.id])
    })
    const members = deps.db.query("SELECT name,session_id,admission_token,admission_owner_pid FROM team_member WHERE team_id = ? AND status = 'busy' AND execution_status = 'starting' AND admission_token IS NOT NULL").all(teamId) as Array<{ name: string; session_id: string; admission_token: string; admission_owner_pid: number | null }>
    return members.filter(row => row.admission_owner_pid !== null && !ownerAlive(row.admission_owner_pid)).map(row => ({ ...row, teamId }))
  })
  if (starts.length === 0) return
  try {
    const statuses = (await deps.client.session.status()).data
    if (!statuses) return
    starts.forEach(row => {
      if (statuses[row.session_id]?.type === "busy" || statuses[row.session_id]?.type === "retry") {
        deps.db.run("UPDATE team_member SET execution_status = 'running', admission_token = NULL, admission_owner_pid = NULL WHERE team_id = ? AND name = ? AND admission_token = ?", [row.teamId, row.name, row.admission_token])
      } else if (releaseMemberCapacity(deps.db, row.teamId, row.name, row.admission_token)) {
        releaseMemberTasks(deps.db, row.teamId, row.name)
      }
    })
  } catch (error) { log(`capacity:recovery-unavailable ${String(error)}`) }
}

/** Resume persisted admissions and schedule event-driven queue retries for this project. */
export async function startCapacityRuntime(deps: ToolDeps): Promise<CapacityRuntime> {
  const teams = (deps.db.query("SELECT id FROM team WHERE status = 'active'").all() as Array<{ id: string }>)
    .filter(team => isTeamInDirectory(deps.db, team.id, deps.directory))
  teams.forEach(team => {
    deps.db.run("UPDATE team SET max_running_members = COALESCE(max_running_members, ?), auto_dispatch = COALESCE(auto_dispatch, ?), auto_scale = COALESCE(auto_scale, ?) WHERE id = ?", [deps.config.maxActiveMembers, Number(deps.config.autoDispatch), Number(deps.config.autoScale), team.id])
  })
  await recoverAdmissions(deps, teams.map(team => team.id))
  const timers = new Map<string, { timer: ReturnType<typeof setTimeout>; at: number }>()
  let disposed = false
  const request = (teamId: string, delayMs = 0): void => {
    if (disposed || !isTeamInDirectory(deps.db, teamId, deps.directory)) return
    const at = Date.now() + Math.max(0, delayMs)
    const current = timers.get(teamId)
    if (current && current.at <= at) return
    if (current) clearTimeout(current.timer)
    const timer = setTimeout(() => {
      timers.delete(teamId)
      if (disposed) return
      void pumpTeam(deps, teamId).catch(error => log(`capacity:pump-failed ${String(error)}`)).finally(() => {
        if (disposed) return
        const team = deps.db.query("SELECT status,mission_state FROM team WHERE id = ?").get(teamId) as { status: string; mission_state: string } | null
        if (!team || team.status !== "active" || team.mission_state === "critical") return
        const retry = deps.db.query("SELECT MIN(retry_after) AS at FROM team_capacity_queue WHERE team_id = ? AND delivering = 0 AND retry_after > ?").get(teamId, Date.now()) as { at: number | null }
        if (retry.at !== null) request(teamId, Math.max(1, retry.at - Date.now()))
      })
    }, Math.min(2_147_483_647, Math.max(0, delayMs)))
    timer.unref?.()
    timers.set(teamId, { timer, at })
  }
  deps.scheduleCapacity = request
  teams.forEach(team => { request(team.id) })
  return {
    request,
    dispose: () => {
      disposed = true
      timers.forEach(({ timer }) => { clearTimeout(timer) })
      timers.clear()
    },
  }
}
