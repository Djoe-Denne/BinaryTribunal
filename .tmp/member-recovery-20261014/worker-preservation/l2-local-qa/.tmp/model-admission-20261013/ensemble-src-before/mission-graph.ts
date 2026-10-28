import type { TeamCapacity } from "./capacity"
import { validateProviderOrder, type ProviderPolicyView } from "./provider-policy"
import { validateModelPreference, validatePreferenceWeight } from "./model-preference"
import type { MissionModelPolicyView } from "./model-routing-policy"
import { validateModelCostMode } from "./model-costs"
import { validateTaskContext, type TaskContextView } from "./task-context"

export interface MissionTask {
  id: string
  title: string
  content: string
  status: string
  assignee: string | null
  priority: number
  timeCreated: number
  waitingOn: Array<{ id: string; title: string; missing: boolean }>
  ready: boolean
  context?: TaskContextView
}

export interface MissionAgent {
  name: string
  role: string
  profile: string
  sessionId: string | null
  model: string | null
  state: string
  stateLabel: string
  prompt: string
  retryMessage: string | null
  current: MissionTask[]
  queue: MissionTask[]
  retired: boolean
  timeCreated: number
}

export interface Mission {
  routingPolicy?: ProviderPolicyView | null
  modelPolicy?: MissionModelPolicyView | null
  capacity?: TeamCapacity | null
  id: string
  name: string
  project: string
  status: string
  timeCreated: number
  lead: MissionAgent
  agents: MissionAgent[]
  shared: MissionTask[]
  unrepresented: MissionTask[]
  counts: { total: number; completed: number; running: number; ready: number; blocked: number }
}

export interface MissionSnapshot {
  observedAt: number
  missions: Mission[]
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${label}`)
  return value as Record<string, unknown>
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function priority(value: unknown): number {
  if (value === "high") return 3
  if (value === "medium") return 2
  if (value === "low") return 1
  return number(value)
}

function recordedTaskContext(value: unknown): TaskContextView | undefined {
  if (value === undefined) return undefined
  try {
    const row = record(value, "task context")
    if (!Number.isSafeInteger(row.revision) || number(row.revision) < 0 || !["legacy", "ready", "pending", "error"].includes(String(row.state))) throw new Error("Invalid context metadata")
    const decision = row.decision === null ? null : validateTaskContext(row.decision)
    if (row.state === "ready" && (!decision || decision.mode === "pending")) throw new Error("Context decision not ready")
    return { decision, revision: number(row.revision), state: row.state as TaskContextView["state"], error: text(row.error) || null }
  } catch { return { decision: null, revision: 0, state: "error", error: "Invalid context metadata" } }
}

function recordedCapacity(value: unknown): TeamCapacity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const keys = ["limit", "running", "starting", "queued", "waiting"]
  if (!keys.every(key => typeof row[key] === "number" && Number.isSafeInteger(row[key]) && (row[key] as number) >= 0)) return null
  const limit = number(row.limit), running = number(row.running), starting = number(row.starting)
  return { limit, running, starting, available: limit === 0 ? null : Math.max(0, limit - running - starting), queued: number(row.queued), waiting: number(row.waiting) }
}

function recordedProviderPolicy(value: unknown): ProviderPolicyView | null {
  if (!value) return null
  try {
    const row = record(value, "provider policy")
    if (typeof row.revision !== "number" || !Number.isSafeInteger(row.revision) || row.revision < 0) return null
    return { providerOrder: validateProviderOrder(row.providerOrder), revision: row.revision,
      providers: validateProviderOrder(row.providers ?? []), inventoryAvailable: row.inventoryAvailable === true }
  } catch { return null }
}

function recordedModelPolicy(value: unknown): MissionModelPolicyView | null {
  if (!value) return null
  try {
    const row = record(value, "model policy")
    if (typeof row.revision !== "number" || !Number.isSafeInteger(row.revision) || row.revision < 0) return null
    const catalogue = array(row.catalogue, "model catalogue").map(value => {
      const model = record(value, "routing model")
      validatePreferenceWeight(model.preference)
      if (typeof model.intelligenceScore !== "number" || !Number.isFinite(model.intelligenceScore) || model.intelligenceScore < 0 || typeof model.averageCostPerTask !== "number" || !Number.isFinite(model.averageCostPerTask) || model.averageCostPerTask < 0) throw new Error("Invalid benchmark values")
      const costs: { benchmarkCostPerTask?: number; effectiveCostPerTask?: number; amortizedCostPerTask?: number } = {}
      ;(["benchmarkCostPerTask", "effectiveCostPerTask", "amortizedCostPerTask"] as const).forEach(field => {
        if (model[field] === undefined) return
        if (typeof model[field] !== "number" || !Number.isFinite(model[field]) || model[field] < 0) throw new Error("Invalid cost metadata")
        costs[field] = model[field]
      })
      const accessMode = model.accessMode
      if (accessMode !== undefined && !["subsidized", "subscription", "api", "unknown"].includes(String(accessMode))) throw new Error("Invalid access mode")
      return { id: identifier(model.id, "model"), reasoningEffort: text(model.reasoningEffort, "default"), intelligenceScore: model.intelligenceScore,
        averageCostPerTask: model.averageCostPerTask, ...costs, ...(accessMode !== undefined ? { accessMode: accessMode as "subsidized" | "subscription" | "api" | "unknown" } : {}), preference: number(model.preference), enabled: model.enabled === true, reserve: model.reserve === true }
    })
    const nativeVariants = row.nativeVariants === undefined ? undefined : array(row.nativeVariants, "native variants").map(value => {
      const variant = record(value, "native variant")
      return { id: identifier(variant.id, "model"), reasoningEffort: identifier(variant.reasoningEffort, "effort"), evaluated: variant.evaluated === true }
    })
    return { policy: validateModelPreference(row.policy), revision: row.revision, inherited: row.inherited === true, inventoryAvailable: row.inventoryAvailable === true, catalogue,
      ...(nativeVariants ? { nativeVariants } : {}), ...(row.costMode !== undefined ? { costMode: validateModelCostMode(row.costMode) } : {}) }
  } catch { return null }
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${label}`)
  return value
}

function identifier(value: unknown, label: string): string {
  const id = text(value)
  if (!id) throw new Error(`Invalid ${label}`)
  return id
}

function title(content: string): string {
  const first = content.trim().split(/\r?\n/)[0]?.replace(/^#+\s*/, "") ?? ""
  return first.length > 100 ? `${first.slice(0, 97)}…` : first
}

function queueOrder(a: MissionTask, b: MissionTask): number {
  return b.priority - a.priority || a.timeCreated - b.timeCreated || a.id.localeCompare(b.id)
}

function modelName(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const model = record(JSON.parse(value), "model")
    const id = text(model.modelID, text(model.id))
    return id ? [text(model.providerID), id, text(model.variant)].filter(Boolean).join(" / ") : value
  } catch {
    return value
  }
}

function activity(member: Record<string, unknown>, observedAt: number): [string, string] {
  if (member.status === "shutdown") return ["stopped", "Arrêté"]
  if (member.status === "shutdown_requested") return ["stopping", "Arrêt demandé"]
  if (number(member.retryUntil) > observedAt) return ["retrying", "Réessai en attente"]
  if (member.status === "error" || ["failed", "timed_out"].includes(text(member.executionStatus))) return ["error", "Erreur"]
  if (member.status === "busy" || ["starting", "running", "completing"].includes(text(member.executionStatus))) return ["active", "Actif"]
  if (member.status === "ready") return ["idle", "Disponible"]
  return ["unknown", "État non renseigné"]
}

function agent(member: Record<string, unknown>, tasks: MissionTask[], observedAt: number): MissionAgent {
  const name = identifier(member.name, "agent name")
  const [state, stateLabel] = activity(member, observedAt)
  const assigned = tasks.filter(task => task.assignee === name)
  return {
    name,
    role: text(member.role, text(member.agent, "Profil non renseigné")),
    profile: text(member.agent),
    sessionId: text(member.sessionId) || null,
    model: modelName(member.model),
    state, stateLabel,
    prompt: text(member.prompt),
    retryMessage: state === "retrying" ? text(member.retryMessage) || null : null,
    current: assigned.filter(task => task.status === "in_progress").sort(queueOrder),
    queue: assigned.filter(task => task.status === "pending" || task.status === "blocked").sort(queueOrder),
    retired: member.status === "shutdown",
    timeCreated: number(member.timeCreated),
  }
}

/** Project the existing read-only dashboard snapshot without inferring scheduler decisions. */
export function buildMissionSnapshot(input: unknown, observedAt = Date.now()): MissionSnapshot {
  const root = record(input, "snapshot")
  if (root.version !== 1) throw new Error("Unsupported dashboard snapshot version")
  const projects = new Map((Array.isArray(root.projects) ? root.projects : []).map(value => {
    const project = record(value, "project")
    return [text(project.id), text(project.name)]
  }))
  const missions = array(root.teams, "teams").map(value => {
    const team = record(value, "mission")
    const id = identifier(team.id, "mission id")
    const rows = array(team.tasks, "tasks").map(value => record(value, "task"))
    const byId = new Map(rows.map(task => [identifier(task.id, "task id"), task]))
    const tasks: MissionTask[] = rows.map(task => {
      const context = recordedTaskContext(task.context)
      const waitingOn = array(task.dependsOn ?? [], "dependencies").flatMap(dependency => {
        const id = identifier(dependency, "dependency id")
        const prerequisite = byId.get(id)
        if (prerequisite?.status === "completed") return []
        return [{ id, title: prerequisite ? title(text(prerequisite.content)) : id, missing: !prerequisite }]
      })
      return {
        id: identifier(task.id, "task id"),
        title: title(text(task.content)),
        content: text(task.content),
        status: text(task.status, "unknown"),
        assignee: text(task.assignee) || null,
        priority: priority(task.priority),
        timeCreated: number(task.timeCreated),
        waitingOn,
        ready: task.status === "pending" && waitingOn.length === 0 && (!context || context.state === "legacy" || context.state === "ready"),
        ...(context ? { context } : {}),
      }
    })
    const agents = array(team.members, "members")
      .map(member => agent(record(member, "member"), tasks, observedAt))
      .sort((a, b) => a.timeCreated - b.timeCreated || a.name.localeCompare(b.name))
    const names = new Set(["lead", ...agents.map(member => member.name)])
    const pending = tasks.filter(task => task.status === "pending" || task.status === "blocked")
    const unfinished = tasks.filter(task => task.status !== "completed")
    const lead = agent({ name: "lead", agent: team.leadAgent, role: "Superviseur", sessionId: team.leadSessionId }, tasks, observedAt)
    return {
      id,
      name: text(team.name, id),
      project: projects.get(text(team.projectId)) || "Projet",
      status: text(team.status, "unknown"),
      timeCreated: number(team.timeCreated),
      lead, agents,
      capacity: recordedCapacity(team.capacity),
      routingPolicy: recordedProviderPolicy(team.routingPolicy),
      modelPolicy: recordedModelPolicy(team.modelPolicy),
      shared: unfinished.filter(task => !task.assignee).sort(queueOrder),
      unrepresented: unfinished.filter(task => task.assignee && !names.has(task.assignee)).sort(queueOrder),
      counts: {
        total: tasks.length,
        completed: tasks.filter(task => task.status === "completed").length,
        running: tasks.filter(task => task.status === "in_progress").length,
        ready: pending.filter(task => task.ready).length,
        blocked: pending.filter(task => !task.ready).length,
      },
    }
  }).sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || b.timeCreated - a.timeCreated || a.id.localeCompare(b.id))
  return { observedAt, missions }
}
