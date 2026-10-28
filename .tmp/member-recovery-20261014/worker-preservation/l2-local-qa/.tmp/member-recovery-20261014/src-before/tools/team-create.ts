import type { ToolDeps } from "../types"
import { generateId, generateProjectName, validateProjectName, validateTeamName } from "../util"
import { findTeamBySession } from "../types"
import { isSessionAlive } from "../recovery"
import { resolveMissionClassification, type MissionClassificationConfig } from "../mission-classification"
import { formatTeamCapacity, getTeamCapacity, validateWorkerLimit } from "../capacity"
import { formatProviderPolicy, getProviderPolicy, validateProviderOrder } from "../provider-policy"
import { formatModelPolicy, getModelPolicy, validateCataloguePolicy } from "../model-routing-policy"
import type { ModelPreferencePolicy } from "../model-preference"

/**
 * Execute the team_create tool. Creates a new team with the caller as lead.
 */
export async function executeTeamCreate(
  deps: ToolDeps,
  args: { name: string; project_name?: string; mission_mode?: "supervised" | "long_run"; classification?: Partial<MissionClassificationConfig>; max_running_members?: number; auto_dispatch?: boolean; auto_scale?: boolean; provider_order?: string[]; model_policy?: ModelPreferencePolicy },
  sessionId: string,
): Promise<string> {
  const providerOrder = validateProviderOrder(args.provider_order ?? [])
  const modelPolicy = args.model_policy === undefined ? null : validateCataloguePolicy(args.model_policy, deps.config.modelRouting.models)
  const workerLimit = args.max_running_members ?? deps.config.maxActiveMembers
  validateWorkerLimit(workerLimit)
  const nameError = validateTeamName(args.name)
  if (nameError) throw new Error(nameError)
  if (args.project_name) {
    const projectNameError = validateProjectName(args.project_name)
    if (projectNameError) throw new Error(projectNameError)
  }

  // Check if team name already exists
  const projectId = deps.directory
  const existing = deps.db.query("SELECT id, lead_session_id FROM team WHERE name = ? AND project_id = ? AND status = 'active'")
    .get(args.name, projectId) as { id: string; lead_session_id: string } | undefined
  if (existing) {
    // The existing team's lead session may have been deleted externally (via
    // OpenCode's own session UI/API, not team_cleanup) rather than genuinely
    // still being in use. Reconcile on demand rather than block this call on a
    // team nobody can ever be lead of again -- don't wait for the next plugin
    // restart's periodic recoverOrphanedTeams pass to notice.
    if (await isSessionAlive(deps.client, existing.lead_session_id)) {
      throw new Error(`Team "${args.name}" already exists`)
    }
    deps.db.run("UPDATE team SET status = 'archived', time_updated = ? WHERE id = ?", [Date.now(), existing.id])
    deps.registry.unregisterTeam(existing.id)
  }

  // Check if session already leads a team
  const lead = findTeamBySession(deps.db, deps.registry, sessionId)
  if (lead) throw new Error(`This session already belongs to team "${lead.teamName}"`)

  const classification = await resolveMissionClassification(deps, { ...args.classification, ...(args.mission_mode !== undefined ? { missionMode: args.mission_mode } : {}) })

  const id = generateId("team")
  const now = Date.now()
  const projectName = args.project_name ?? generateProjectName()
  deps.db.run(
    `INSERT INTO project (id, name, path, status, time_created, time_updated)
     VALUES (?, ?, ?, 'active', ?, ?)
     ON CONFLICT(id) DO UPDATE SET time_updated = excluded.time_updated`,
    [projectId, projectName, projectId, now, now]
  )
  deps.db.run(
    "INSERT INTO team (id, name, project_id, lead_session_id, status, delegate, time_created, time_updated, classification_policy, mission_mode, max_running_members, auto_dispatch, auto_scale, provider_order, model_policy) VALUES (?, ?, ?, ?, 'active', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, args.name, projectId, sessionId, now, now, JSON.stringify(classification), classification.missionMode ?? "supervised", workerLimit, Number(args.auto_dispatch ?? deps.config.autoDispatch), Number(args.auto_scale ?? deps.config.autoScale), JSON.stringify(providerOrder), modelPolicy ? JSON.stringify(modelPolicy) : null]
  )

  return `Team "${args.name}" created. You are the lead. Use team_spawn to add teammates.\n${formatTeamCapacity(getTeamCapacity(deps.db, id))}\n${formatProviderPolicy(getProviderPolicy(deps.db, id))}\n${formatModelPolicy(getModelPolicy(deps.db, id, deps.config.modelRouting))}\nClassification: ${classification.reason}`
}
