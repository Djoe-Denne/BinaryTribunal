import type { ToolDeps } from "./types"
import { getModelPolicy } from "./model-routing-policy"
import { effectiveModelPreference, ModelPreferenceUnavailableError } from "./model-preference"
import { getProviderPolicy } from "./provider-policy"
import path from "node:path"

export function sessionPolicyDirectory(deps: Pick<ToolDeps, "db">, sessionID: string, fallback: string): string {
  const row = deps.db.query("SELECT project_id FROM team WHERE id IN (SELECT team_id FROM team_member WHERE session_id=? UNION SELECT id FROM team WHERE lead_session_id=? UNION SELECT team_id FROM classification_helper WHERE session_id=?)").get(sessionID, sessionID, sessionID) as { project_id: string } | null
  return row?.project_id && path.isAbsolute(row.project_id) ? row.project_id : fallback
}

export function ownsModelRequestLocation(deps: Pick<ToolDeps, "db">, teamId: string, sessionID: string, directory: string): boolean {
  const root = sessionPolicyDirectory(deps, sessionID, "")
  if (root && path.relative(root, directory) === "") return true
  const member = deps.db.query("SELECT worktree_dir FROM team_member WHERE team_id=? AND session_id=?").get(teamId, sessionID) as { worktree_dir: string | null } | null
  return !!member?.worktree_dir && path.relative(member.worktree_dir, directory) === ""
}

export class ModelSelectionDeniedError extends ModelPreferenceUnavailableError {
  constructor(reason: string) { super(`Model selection denied: ${reason}`); this.name = "ModelSelectionDeniedError" }
}
export function selectionIsConfigured(config: ToolDeps["config"]): boolean {
  return config.modelRouting.selectionConfigured === true || config.modelRouting.models.length > 0
}

/** Exact native pair; a suffix is never sent as part of the native model ID. */
export function normalizeModelSelection(value: string, variant?: string): { model: string; variant?: string } {
  if (typeof value !== "string" || value.trim() !== value || !/^[^\s/#]+\/[^\s#]+(?:#[^\s#]+)?$/.test(value)) throw new ModelSelectionDeniedError("invalid provider/model#variant")
  const [model, suffix] = value.split("#")
  if (variant !== undefined && (typeof variant !== "string" || !variant.trim() || variant.trim() !== variant || /[#\r\n]/.test(variant))) throw new ModelSelectionDeniedError("invalid variant")
  if (suffix !== undefined && variant !== undefined && suffix !== variant) throw new ModelSelectionDeniedError("conflicting pinned variants")
  return { model: model!, ...((suffix ?? variant) !== undefined ? { variant: suffix ?? variant } : {}) }
}

/** Authorization, not routing: never selects, substitutes or upgrades a model. */
export function assertMissionModelAllowed(deps: Pick<ToolDeps, "db" | "config">, teamId: string | undefined, value?: string, variant?: string): void {
  if (teamId && deps.config.modelRouting.pausedTeams?.includes(teamId)) throw new ModelSelectionDeniedError(`mission ${teamId} is paused by the operator; no request or retry until explicit resume`)
  if (!selectionIsConfigured(deps.config)) return // No operator selection: preserve the unconfigured legacy plugin.
  if (!value) throw new ModelSelectionDeniedError("an explicit effective model is required by the configured selection")
  const pair = normalizeModelSelection(value, variant), effort = pair.variant ?? "default"
  const candidate = deps.config.modelRouting.models.find(m => m.id === pair.model && (m.reasoningEffort ?? "default") === effort)
  if (!candidate || !candidate.available) throw new ModelSelectionDeniedError(`${pair.model}#${effort} is absent or unavailable in the operator selection`)
  const globalPolicy = deps.config.modelRouting.preference ?? { mode: "legacy", maxIntelligenceGap: 2, models: [] }
  const globalPreference = effectiveModelPreference(candidate, globalPolicy, [])
  if (!globalPreference.enabled || globalPreference.preference === 0) throw new ModelSelectionDeniedError(`${pair.model}#${effort} is disabled by the operator preference policy`)
  const policy = teamId ? getModelPolicy(deps.db, teamId, deps.config.modelRouting).policy : deps.config.modelRouting.preference ?? { mode: "legacy", maxIntelligenceGap: 2, models: [] }
  const resolved = effectiveModelPreference(candidate, policy, teamId ? getProviderPolicy(deps.db, teamId).providerOrder : [])
  if (!resolved.enabled || resolved.preference === 0) throw new ModelSelectionDeniedError(`${pair.model}#${effort} is disabled by the effective preference policy`)
}

/** Used at every native delivery, including old sessions and implicit profile defaults. */
export function authorizeSessionModel(deps: Pick<ToolDeps, "db" | "config">, sessionID: string, value: unknown): void {
  const row = deps.db.query("SELECT team_id FROM team_member WHERE session_id=? UNION SELECT id AS team_id FROM team WHERE lead_session_id=? UNION SELECT team_id FROM classification_helper WHERE session_id=?").get(sessionID, sessionID, sessionID) as { team_id: string } | null
  if (row && deps.config.modelRouting.pausedTeams?.includes(row.team_id)) throw new ModelSelectionDeniedError(`mission ${row.team_id} is paused by the operator; no request or retry until explicit resume`)
  if (!selectionIsConfigured(deps.config)) return
  const model = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  if (typeof model.providerID !== "string" || typeof model.id !== "string" || (model.variant !== undefined && typeof model.variant !== "string")) throw new ModelSelectionDeniedError("native effective model cannot be verified")
  assertMissionModelAllowed(deps, row?.team_id, `${model.providerID}/${model.id}`, model.variant as string | undefined)
}
