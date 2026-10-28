import type { ToolDeps } from "./types"
import { routeNormalizedModel, validateTaskRoutingScores, type ModelRoute, type TaskRoutingScores } from "./model-router"
import { getProviderPolicy } from "./provider-policy"
import { parseModelId } from "./member-model"
import { getModelPolicy } from "./model-routing-policy"
import { assertMissionModelAllowed } from "./model-authorization"

/** Preview by default; commit at departure, joining an existing admission transaction when requested. */
export function routeMissionTaskModel(deps: Pick<ToolDeps, "db" | "config">, teamId: string, taskId?: string, overrides: TaskRoutingScores & { model?: string; variant?: string } = {}, admission: "preview" | "standalone" | "within-transaction" = "preview"): ModelRoute | undefined {
  if (overrides.model) assertMissionModelAllowed(deps, teamId, overrides.model, overrides.variant)
  if (admission !== "preview") {
    const consume = (): ModelRoute | undefined => {
      const route = routeMissionTaskModel(deps, teamId, taskId, overrides)
      if (route?.distribution) deps.db.run(
        `INSERT INTO team_model_distribution (team_id,cohort,credits,admissions,time_updated) VALUES (?,?,?,1,?)
         ON CONFLICT(team_id,cohort) DO UPDATE SET credits=excluded.credits,admissions=admissions+1,time_updated=excluded.time_updated`,
        [teamId, route.distribution.key, JSON.stringify(route.distribution.credits), Date.now()],
      )
      return route
    }
    return admission === "within-transaction" ? consume() : deps.db.transaction(consume)()
  }
  const task = taskId ? deps.db.query("SELECT complexity,risk,classification_status,classification_result FROM team_task WHERE id = ? AND team_id = ?").get(taskId, teamId) as {
    complexity: number | null; risk: number | null; classification_status: string; classification_result: string | null
  } | null : null
  if (task && !["not_required", "completed"].includes(task.classification_status)) throw new Error(`Task ${taskId} is awaiting classification (${task.classification_status})`)
  const classified = task?.classification_result ? JSON.parse(task.classification_result) as { complexity: number; risk: number } : undefined
  const scores = { complexity: overrides.complexity ?? task?.complexity ?? undefined, risk: overrides.risk ?? task?.risk ?? undefined }
  validateTaskRoutingScores(scores)
  if (overrides.model || !deps.config.modelRouting.models.length || (scores.complexity === undefined && scores.risk === undefined && !classified)) return undefined
  const preference = getModelPolicy(deps.db, teamId, deps.config.modelRouting).policy
  const history = preference.mode === "balanced" ? deps.db.query("SELECT cohort,credits FROM team_model_distribution WHERE team_id = ?").all(teamId) as { cohort: string; credits: string }[] : []
  const route = routeNormalizedModel({
    ...deps.config.modelRouting,
    complexity: scores.complexity !== undefined ? scores.complexity / 100 : classified?.complexity ?? 0,
    risk: scores.risk !== undefined ? scores.risk / 100 : classified?.risk ?? 0,
    providerOrder: getProviderPolicy(deps.db, teamId).providerOrder,
    preference,
    distributionState: Object.fromEntries(history.map(row => [row.cohort, JSON.parse(row.credits)])),
  })
  if (!parseModelId(route.selected.id)) throw new Error(`Routed model id must be in provider/model format: ${route.selected.id}`)
  assertMissionModelAllowed(deps, teamId, route.selected.id, route.selected.reasoningEffort === "default" ? undefined : route.selected.reasoningEffort)
  return route
}
