import type { Database } from "./db"
import type { ModelRoutingConfig, RoutingModel } from "./model-router"
import { effectiveModelPreference, modelPreferenceKey, validateModelPreference, type ModelPreferencePolicy } from "./model-preference"
import { getProviderPolicy, ProviderPolicyError } from "./provider-policy"
import type { NativeProviderInventory } from "./provider-inventory"
import type { ModelCostMode } from "./model-costs"

export interface MissionModelPolicy {
  policy: ModelPreferencePolicy
  revision: number
  inherited: boolean
}

export interface MissionModelPolicyView extends MissionModelPolicy {
  inventoryAvailable: boolean
  costMode?: ModelCostMode
  nativeVariants?: Array<{ id: string; reasoningEffort: string; evaluated: boolean }>
  catalogue: Array<Pick<RoutingModel, "id" | "reasoningEffort" | "intelligenceScore" | "averageCostPerTask" | "benchmarkCostPerTask" | "effectiveCostPerTask" | "amortizedCostPerTask" | "accessMode"> & { preference: number; reserve: boolean; enabled: boolean }>
}

/** A reasoning choice is exposed only when its native ID is currently selectable. */
export function isNativeRoutingModel(model: Pick<RoutingModel, "id" | "reasoningEffort">, inventory: NativeProviderInventory): boolean {
  return inventory.models.includes(model.id) && (!model.reasoningEffort || model.reasoningEffort === "default" || inventory.variants?.[model.id]?.includes(model.reasoningEffort) === true)
}

/** Build a secret-free editor view using evaluated, enabled native candidates only. */
export function getModelPolicyView(db: Database, teamId: string, config: ModelRoutingConfig, inventory: NativeProviderInventory | null): MissionModelPolicyView {
  const view = getModelPolicy(db, teamId, config)
  const order = getProviderPolicy(db, teamId).providerOrder
  const catalogue = config.models.filter(model => model.available && inventory && isNativeRoutingModel(model, inventory)).map(model => ({
    id: model.id, reasoningEffort: model.reasoningEffort ?? "default", intelligenceScore: model.intelligenceScore, averageCostPerTask: model.averageCostPerTask,
    ...(model.benchmarkCostPerTask !== undefined ? { benchmarkCostPerTask: model.benchmarkCostPerTask } : {}),
    ...(model.effectiveCostPerTask !== undefined ? { effectiveCostPerTask: model.effectiveCostPerTask } : {}),
    ...(model.amortizedCostPerTask !== undefined ? { amortizedCostPerTask: model.amortizedCostPerTask } : {}),
    ...(model.accessMode !== undefined ? { accessMode: model.accessMode } : {}),
    ...effectiveModelPreference(model, view.policy, order),
  }))
  const keys = new Set(catalogue.map(modelPreferenceKey))
  const nativeVariants = [...new Set(config.models.filter(model => model.available && inventory?.models.includes(model.id)).map(model => model.id))].flatMap(id => {
    const efforts = inventory?.variants?.[id] ?? []
    const variants = [...new Set([...efforts, ...catalogue.filter(model => model.id === id).map(model => model.reasoningEffort ?? "default")])]
    return variants.map(reasoningEffort => ({ id, reasoningEffort, evaluated: keys.has(modelPreferenceKey({ id, reasoningEffort })) }))
  })
  return { ...view, inventoryAvailable: inventory !== null, catalogue, nativeVariants, costMode: view.policy.costMode ?? config.costMode ?? "legacy" }
}

/** Reject unevaluated/invented reasoning variants without modifying benchmark data. */
export function validateCataloguePolicy(value: unknown, models: readonly RoutingModel[]): ModelPreferencePolicy {
  const policy = validateModelPreference(value)
  const keys = new Set(models.map(modelPreferenceKey))
  policy.models.forEach(entry => {
    if (!keys.has(modelPreferenceKey(entry))) throw new ProviderPolicyError(`Model/effort is not in the evaluated catalogue: ${entry.id} (${entry.reasoningEffort ?? "default"})`)
  })
  return policy
}

/** Read a mission override, otherwise inherit the owning project's routing policy. */
export function getModelPolicy(db: Database, teamId: string, config?: ModelRoutingConfig): MissionModelPolicy {
  const row = db.query("SELECT model_policy,model_policy_revision FROM team WHERE id = ?").get(teamId) as { model_policy: string | null; model_policy_revision: number } | null
  if (!row) throw new ProviderPolicyError("Mission not found", 404)
  return { policy: validateModelPreference(row.model_policy ? JSON.parse(row.model_policy) : config?.preference ?? {}), revision: row.model_policy_revision, inherited: row.model_policy === null }
}

/** Persist a revisioned lead/UI policy; null explicitly restores project inheritance. */
export function saveModelPolicy(db: Database, teamId: string, value: unknown, config: ModelRoutingConfig, revision?: number): MissionModelPolicy {
  const policy = value === null ? null : validateCataloguePolicy(value, config.models)
  if (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 0)) throw new ProviderPolicyError("Invalid model policy revision")
  return db.transaction(() => {
    const current = getModelPolicy(db, teamId, config)
    const team = db.query("SELECT status FROM team WHERE id = ?").get(teamId) as { status: string }
    if (team.status !== "active") throw new ProviderPolicyError("Only active missions can change model policy", 409)
    if (revision !== undefined && revision !== current.revision) throw new ProviderPolicyError("Model policy changed; reload the mission before saving", 409)
    db.run("UPDATE team SET model_policy = ?, model_policy_revision = model_policy_revision + 1, time_updated = ? WHERE id = ?", [policy ? JSON.stringify(policy) : null, Date.now(), teamId])
    return getModelPolicy(db, teamId, config)
  })()
}

/** Render the same effective policy for status, supervisors and workers. */
export function formatModelPolicy(view: MissionModelPolicy): string {
  const entries = view.policy.models.map(entry => `${entry.id} (${entry.reasoningEffort ?? "default"}): weight=${entry.preference ?? "inherited"}${entry.enabled === false ? ", disabled" : ""}${entry.reserve === true ? ", reserve" : ""}`)
  return `Mission model policy (revision ${view.revision}${view.inherited ? ", inherited" : ""}): ${view.policy.mode}; max gap ${view.policy.maxIntelligenceGap} intelligence points, shrinking with demand/risk. ${view.policy.mode === "balanced" ? "Provider order supplies default weights, not a strict priority. Weighted admission history persists; reserves run only when ordinary candidates miss the quality floor." : "Legacy provider-order/cost selection."}${view.policy.costMode ? ` Cost basis: ${view.policy.costMode}; benchmark prices are not subscription bills, unknown effective costs are never inferred.` : ""}${entries.length ? ` Overrides: ${entries.join("; ")}.` : ""} Explicit model+variant overrides remain pinned.`
}
