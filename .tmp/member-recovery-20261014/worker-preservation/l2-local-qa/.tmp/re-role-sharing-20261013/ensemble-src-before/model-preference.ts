import type { ModelSelection, RoutingModel } from "./model-router"
import { validateModelCostMode, type ModelCostMode } from "./model-costs"

/** Mission overrides address an exact native model/effort pair. */
export interface ModelPreferenceEntry {
  id: string
  reasoningEffort?: string
  preference?: number
  enabled?: boolean
  reserve?: boolean
}

/** Independent policy; intelligence and benchmark costs are never rewritten. */
export interface ModelPreferencePolicy {
  mode: "legacy" | "balanced"
  maxIntelligenceGap: number
  models: ModelPreferenceEntry[]
  costMode?: ModelCostMode
}

/** Persisted smooth weighted-round-robin credits, isolated by eligible cohort. */
export type ModelDistributionState = Record<string, Record<string, number>>

/** A valid policy can leave one task waiting while other tasks remain routable. */
export class ModelPreferenceUnavailableError extends Error {}

/** Stable identity, including the reasoning variant rather than just model ID. */
export function modelPreferenceKey(model: Pick<RoutingModel, "id" | "reasoningEffort">): string {
  return JSON.stringify([model.id, model.reasoningEffort ?? "default"])
}

/** Validate a human-selected traffic weight, not a benchmark or quota estimate. */
export function validatePreferenceWeight(value: unknown): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) throw new Error("preference must be an integer from 0 to 100")
}

/** Normalize untrusted policy input and reject misspelled fields and identities. */
export function validateModelPreference(value: unknown): ModelPreferencePolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("model preference must be an object")
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !["mode", "maxIntelligenceGap", "models", "costMode"].includes(key))) throw new Error("Unsupported model preference field")
  const mode = input.mode ?? "legacy"
  if (mode !== "legacy" && mode !== "balanced") throw new Error("model preference mode must be legacy or balanced")
  const gap = input.maxIntelligenceGap ?? 2
  if (typeof gap !== "number" || !Number.isFinite(gap) || gap < 0 || gap > 10) throw new Error("maxIntelligenceGap must be finite and between 0 and 10 intelligence points")
  const entries = input.models ?? []
  if (!Array.isArray(entries) || entries.length > 128) throw new Error("model preference models must be an array of at most 128 entries")
  const seen = new Set<string>()
  const models = entries.map((entry: unknown): ModelPreferenceEntry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid model preference entry")
    const row = entry as Record<string, unknown>
    if (Object.keys(row).some(key => !["id", "reasoningEffort", "preference", "enabled", "reserve"].includes(key))) throw new Error("Unsupported model preference entry field")
    if (typeof row.id !== "string" || !/^[^\s/]+\/[^\s]+$/.test(row.id) || row.id.length > 256) throw new Error("Model preference id must be provider/model")
    if (row.reasoningEffort !== undefined && (typeof row.reasoningEffort !== "string" || !row.reasoningEffort.trim() || row.reasoningEffort.length > 128)) throw new Error("Invalid reasoningEffort")
    if (row.preference !== undefined) validatePreferenceWeight(row.preference)
    ;(["enabled", "reserve"] as const).forEach(field => {
      if (row[field] !== undefined && typeof row[field] !== "boolean") throw new Error(`${field} must be boolean`)
    })
    const result = { ...row } as unknown as ModelPreferenceEntry
    const key = modelPreferenceKey(result)
    if (seen.has(key)) throw new Error("Duplicate model/reasoning preference")
    seen.add(key)
    return result
  })
  return { mode, maxIntelligenceGap: gap, models, ...(input.costMode !== undefined ? { costMode: validateModelCostMode(input.costMode) } : {}) }
}

/** Resolve the same model/effort weight and switches for routing and the editor. */
export function effectiveModelPreference(model: RoutingModel, policy: ModelPreferencePolicy, providerOrder: readonly string[]): { preference: number; enabled: boolean; reserve: boolean } {
  const override = policy.models.find(entry => modelPreferenceKey(entry) === modelPreferenceKey(model))
  const rank = providerOrder.indexOf(model.id.split("/")[0] ?? model.id)
  const inherited = providerOrder.length ? rank < 0 ? 10 : Math.max(1, Math.round(100 / (rank + 1))) : 50
  return { preference: override?.preference ?? model.preference ?? inherited, enabled: model.available && override?.enabled !== false, reserve: override?.reserve ?? model.reserve ?? false }
}

/** Select only within a shrinking quality window, then distribute bounded peers. */
export function selectPreferredModel(input: {
  models: readonly RoutingModel[]
  requiredIntelligence: number
  demand: number
  risk: number
  preference: ModelPreferencePolicy
  providerOrder: readonly string[]
  distributionState?: ModelDistributionState
  compareCost: (a: RoutingModel, b: RoutingModel) => number
}): ModelSelection {
  const policy = validateModelPreference(input.preference)
  const margin = policy.maxIntelligenceGap * (1 - Math.max(input.demand, input.risk))
  const floor = Math.max(0, input.requiredIntelligence - margin)
  const eligible = input.models.flatMap(model => {
    const key = modelPreferenceKey(model)
    const resolved = effectiveModelPreference(model, policy, input.providerOrder)
    const weight = resolved.preference
    if (!resolved.enabled || weight === 0 || model.intelligenceScore < floor) return []
    return [{ model, key, weight, reserve: resolved.reserve }]
  })
  const ordinary = eligible.filter(entry => !entry.reserve)
  const cohort = (ordinary.length ? ordinary : eligible).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  if (!cohort.length) throw new ModelPreferenceUnavailableError(`No enabled model/effort meets quality floor ${floor} (target ${input.requiredIntelligence}); keep the task queued or revise the policy`)
  // Cohorts exclude score values: similar tasks share one fair clock. Changes to
  // eligibility/weights naturally create a new clock without resetting others.
  const key = JSON.stringify(cohort.map(entry => [entry.key, entry.weight]))
  const previous = input.distributionState?.[key] ?? {}
  const credits = Object.fromEntries(cohort.map(entry => [entry.key, (previous[entry.key] ?? 0) + entry.weight]))
  if (Object.values(credits).some(value => !Number.isFinite(value))) throw new Error("Invalid persisted model distribution credits")
  const ranked = [...cohort].sort((a, b) => (credits[b.key] ?? 0) - (credits[a.key] ?? 0) || input.compareCost(a.model, b.model))
  const chosen = ranked[0]
  if (!chosen) throw new ModelPreferenceUnavailableError("No eligible model in the quality floor cohort")
  credits[chosen.key] = (credits[chosen.key] ?? 0) - cohort.reduce((sum, entry) => sum + entry.weight, 0)
  const alternatives = ranked.slice(1)
  const fallback = alternatives.find(entry => entry.model.id.split("/")[0] !== chosen.model.id.split("/")[0]) ?? alternatives[0]
  return {
    selected: chosen.model,
    fallback: fallback?.model ?? null,
    distribution: { key, credits },
    reason: `Selected ${chosen.model.id} (${chosen.model.reasoningEffort ?? "default"}): bounded weighted preference ${chosen.weight}; quality floor ${floor}, target ${input.requiredIntelligence}, permitted gap ${margin}. ${ordinary.length ? "Ordinary pool; reserves retained." : "Reserve pool required."} ${cohort.length} eligible candidate(s); cost breaks equal credits. No quota estimate.`,
  }
}
