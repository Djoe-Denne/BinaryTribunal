import type { Database } from "./db"
import type { PluginClient, ToolDeps } from "./types"
import { releaseMemberCapacity, reserveMemberCapacity } from "./capacity"
import { generateId } from "./util"
import { hasReportedCompletion, markDelivered } from "./messaging"
import { log } from "./log"
import { isTeamInDirectory } from "./team-scope"
import { isExecutionPaused } from "./execution-store"

type Prompt = Parameters<PluginClient["session"]["promptAsync"]>[0]

function enqueue(db: Database, teamId: string, name: string, prompt: Prompt, retryAfter = 0): void {
  db.run("INSERT OR IGNORE INTO team_capacity_queue (id,team_id,member_name,payload,message_id,time_created,retry_after) VALUES (?,?,?,?,?,?,?)",
    [generateId("wake"), teamId, name, JSON.stringify(prompt), prompt.ensemble?.messageId ?? null, Date.now(), retryAfter])
}

/** Apply the shared mission budget to every Ensemble prompt delivery. */
export function withCapacityClient<T extends PluginClient>(db: Database, client: T, fallback = 30, schedule?: ToolDeps["scheduleCapacity"]): T {
  return { ...client, session: { ...client.session, promptAsync: async options => {
    const { ensemble, ...native } = options
    const member = db.query("SELECT m.team_id,m.name,m.status,m.execution_status,m.admission_token,t.status AS team_status FROM team_member m JOIN team t ON t.id = m.team_id WHERE m.session_id = ?")
      .get(options.sessionID) as { team_id: string; name: string; status: string; execution_status: string; admission_token: string | null; team_status: string } | null
    if (!member) return client.session.promptAsync(native)
    if (member.team_status !== "active" || ["shutdown", "error"].includes(member.status)) throw new Error("Cannot wake a stopped teammate")
    const ownsStart = member.execution_status === "starting" && member.admission_token !== null && member.admission_token === ensemble?.admissionToken
    // Keep follow-up work out of the host queue: its autonomous next execution could
    // otherwise race a newly freed slot. Persisted messages can still enter context.
    const admission = member.status === "busy" && !ownsStart ? null : reserveMemberCapacity(db, member.team_id, member.name, fallback)
    if (!admission) {
      enqueue(db, member.team_id, member.name, options)
      schedule?.(member.team_id)
      return { capacityQueued: true }
    }
    return client.session.promptAsync(native).then(result => {
      if (ensemble?.messageId) markDelivered(db, ensemble.messageId)
      return result
    }).catch(error => {
      if (releaseMemberCapacity(db, member.team_id, member.name, admission.token)) {
        enqueue(db, member.team_id, member.name, options, Date.now() + 5000)
        schedule?.(member.team_id, 5000)
      }
      throw error
    })
  } } }
}

/** Identify a durable capacity-queued delivery, which is not delivered yet. */
export function isCapacityQueued(result: unknown): boolean {
  return result !== null && typeof result === "object" && "capacityQueued" in result && result.capacityQueued === true
}

/** Resume queued wakes after capacity changes or a worker becomes idle. */
export function drainCapacityQueue(deps: ToolDeps, teamId: string): void {
  if (!isTeamInDirectory(deps.db, teamId, deps.directory)) return
  if (isExecutionPaused(deps.db, teamId)) return
  deps.db.run(`DELETE FROM team_capacity_queue WHERE team_id = ? AND (
    NOT EXISTS (SELECT 1 FROM team_member m WHERE m.team_id = team_capacity_queue.team_id AND m.name = team_capacity_queue.member_name AND m.status IN ('ready','busy'))
    OR NOT EXISTS (SELECT 1 FROM team t WHERE t.id = team_capacity_queue.team_id AND t.status = 'active')
    OR EXISTS (SELECT 1 FROM team_message msg WHERE msg.id = team_capacity_queue.message_id AND msg.to_name != 'all' AND msg.delivered = 1))`, [teamId])
  const rows = deps.db.query(`SELECT q.id,q.member_name,q.payload FROM team_capacity_queue q
    JOIN team_member m ON m.team_id = q.team_id AND m.name = q.member_name
    JOIN team t ON t.id = q.team_id
    WHERE q.team_id = ? AND q.delivering = 0 AND q.retry_after <= ?
      AND m.status = 'ready' AND m.spawn_pending = 0 AND t.status = 'active' AND t.mission_state != 'critical'
    ORDER BY q.time_created ASC,q.id ASC`).all(teamId, Date.now()) as Array<{ id: string; member_name: string; payload: string }>
  rows.forEach(row => {
    const state = deps.db.query("SELECT status FROM team_member WHERE team_id = ? AND name = ?").get(teamId, row.member_name) as { status: string } | null
    if (state?.status !== "ready") return
    const prompt = JSON.parse(row.payload) as Prompt
    if (!prompt.ensemble?.force && hasReportedCompletion(deps.db, teamId, row.member_name)) {
      deps.db.run("DELETE FROM team_capacity_queue WHERE id = ? AND delivering = 0", [row.id])
      return
    }
    let admission: { token: string | null } | null
    const claim = () => {
      if (!deps.db.run("UPDATE team_capacity_queue SET delivering = 1, owner_pid = ? WHERE id = ? AND delivering = 0", [process.pid, row.id]).changes) throw new Error("Wake already admitted")
    }
    try {
      admission = reserveMemberCapacity(deps.db, teamId, row.member_name, deps.config.maxActiveMembers, claim)
      if (!admission) return
    } catch { return }
    deps.progressTracker.recordBusyStart(prompt.sessionID)
    deps.client.session.promptAsync({ ...prompt, ensemble: { ...prompt.ensemble, admissionToken: admission.token ?? undefined } }).then(result => {
      if (isCapacityQueued(result)) {
        deps.db.run("UPDATE team_capacity_queue SET delivering = 0 WHERE id = ?", [row.id])
        return
      }
      if (prompt.ensemble?.messageId) markDelivered(deps.db, prompt.ensemble.messageId)
      deps.db.run("DELETE FROM team_capacity_queue WHERE id = ?", [row.id])
    }).catch(error => {
      releaseMemberCapacity(deps.db, teamId, row.member_name, admission.token)
      deps.db.run("UPDATE team_capacity_queue SET delivering = 0, retry_after = ? WHERE id = ?", [Date.now() + 5000, row.id])
      deps.scheduleCapacity?.(teamId, 5000)
      log(`capacity:delivery-failed member=${row.member_name} ${String(error)}`)
    })
  })
}
