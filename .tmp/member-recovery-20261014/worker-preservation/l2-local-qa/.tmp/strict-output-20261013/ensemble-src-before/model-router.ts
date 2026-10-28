import { validateProviderOrder } from "./provider-policy"
import { selectPreferredModel, validateModelPreference, validatePreferenceWeight, type ModelPreferencePolicy, type ModelDistributionState } from "./model-preference"
import { compareModelCosts, modelCost, validateModelCostMode, type ModelCostMode } from "./model-costs"

/** Declarative, dated observation of a model's structured-output support; never inferred from tool calling. */
export interface StructuredOutputCapability {
  supported: boolean | null
  source: string
  checkedAt: string
  strictVerification: "unverified" | "verified" | "unsupported"
}

/** One independently scored model/reasoning-effort combination. */
export interface RoutingModel {
  id: string
  provider?: string
  reasoningEffort?: string
  intelligenceScore: number
  averageCostPerTask: number
  benchmarkCostPerTask?: number
  effectiveCostPerTask?: number
  /** Subscription-allocated estimate on the common AA task basis, not measured billing. */
  amortizedCostPerTask?: number
  accessMode?: "subsidized" | "subscription" | "api" | "unknown"
  available: boolean
  preference?: number
  reserve?: boolean
  cursorBenchCostPerTask?: number
  paidFallback?: string
  level?: string
  usage?: string
  structuredOutput?: StructuredOutputCapability
}

/** Deterministic routing configuration; an empty catalogue disables routing. */
export interface ModelRoutingConfig {
  beta: number
  models: RoutingModel[]
  preference?: ModelPreferencePolicy
  costMode?: ModelCostMode
  intelligenceRange?: { min: number; max: number }
  requireStructuredOutput?: boolean
}

const STRICT_VERIFICATION_VALUES = ["unverified", "verified", "unsupported"]
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

/** Validate declarative provenance only; "verified" is a recorded claim, never a scientific proof. */
function validateStructuredOutputCapability(modelId: string, capability: StructuredOutputCapability): void {
  if (!capability || typeof capability !== "object" || Array.isArray(capability)) {
    throw new Error(`Model ${modelId}: structuredOutput must be a non-null object (not an array)`)
  }
  if (capability.supported !== null && typeof capability.supported !== "boolean") {
    throw new Error(`Model ${modelId}: structuredOutput.supported must be boolean or null`)
  }
  if (typeof capability.source !== "string" || !capability.source.trim()) {
    throw new Error(`Model ${modelId}: structuredOutput.source must be a non-empty string`)
  }
  if (typeof capability.checkedAt !== "string" || !ISO_UTC_TIMESTAMP.test(capability.checkedAt) || Number.isNaN(Date.parse(capability.checkedAt))) {
    throw new Error(`Model ${modelId}: structuredOutput.checkedAt must be a valid ISO UTC timestamp`)
  }
  if (!STRICT_VERIFICATION_VALUES.includes(capability.strictVerification)) {
    throw new Error(`Model ${modelId}: structuredOutput.strictVerification must be unverified, verified, or unsupported`)
  }
}

/** Optional scores; missing dimensions default to zero when routing is requested. */
export interface TaskRoutingScores {
  complexity?: number
  risk?: number
}

/** Selection and an independently eligible alternative, not an automatic retry. */
export interface ModelSelection {
  selected: RoutingModel
  fallback: RoutingModel | null
  reason: string
  distribution?: { key: string; credits: Record<string, number> }
}

/** Full auditable result of the deterministic router. */
export interface ModelRoute extends ModelSelection {
  demand: number
  requiredIntelligence: number
}

/** Validate integer task dimensions without scoring them with a model. */
export function validateTaskRoutingScores(scores: TaskRoutingScores): void {
  Object.entries(scores).forEach(([name, value]) => {
    if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > 100)) {
      throw new Error(`${name} must be an integer from 0 to 100`)
    }
  })
}

/** Validate the catalogue and the bounded risk coefficient. */
export function validateModelRoutingConfig(config: ModelRoutingConfig): void {
  if (!Number.isFinite(config.beta) || config.beta < 0 || config.beta > 1) {
    throw new Error("modelRouting.beta must be a finite number from 0 to 1")
  }
  if (!Array.isArray(config.models)) throw new Error("modelRouting.models must be an array")
  if (config.preference !== undefined) validateModelPreference(config.preference)
  if (config.costMode !== undefined) validateModelCostMode(config.costMode)
  if (config.intelligenceRange !== undefined) {
    const range = config.intelligenceRange
    if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min < 0 || range.max < range.min) throw new Error("intelligenceRange must have finite non-negative min <= max")
  }
  if (config.requireStructuredOutput !== undefined && typeof config.requireStructuredOutput !== "boolean") {
    throw new Error("requireStructuredOutput must be boolean")
  }
  const identities = new Set<string>()
  config.models.forEach(model => {
    if (!model || typeof model.id !== "string" || !model.id.trim()) throw new Error("Model id must be a non-empty string")
    if (typeof model.available !== "boolean") throw new Error(`Model ${model.id}: available must be boolean`)
    if (model.preference !== undefined) validatePreferenceWeight(model.preference)
    if (model.reserve !== undefined && typeof model.reserve !== "boolean") throw new Error(`Model ${model.id}: reserve must be boolean`)
    if (model.structuredOutput !== undefined) validateStructuredOutputCapability(model.id, model.structuredOutput)
    if (!Number.isFinite(model.intelligenceScore) || model.intelligenceScore < 0) throw new Error(`Model ${model.id}: intelligenceScore must be finite and non-negative`)
    if (!Number.isFinite(model.averageCostPerTask) || model.averageCostPerTask < 0) throw new Error(`Model ${model.id}: averageCostPerTask must be finite and non-negative`)
    ;(["benchmarkCostPerTask", "effectiveCostPerTask", "amortizedCostPerTask"] as const).forEach(field => {
      const value = model[field]
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new Error(`Model ${model.id}: ${field} must be finite and non-negative`)
    })
    if (model.accessMode !== undefined && !["subsidized", "subscription", "api", "unknown"].includes(model.accessMode)) throw new Error(`Model ${model.id}: invalid accessMode`)
    const optionalFields = ["provider", "reasoningEffort"] as const
    optionalFields.forEach(field => {
      if (model[field] !== undefined && (typeof model[field] !== "string" || !model[field]?.trim())) {
        throw new Error(`Model ${model.id}: ${field} must be a non-empty string`)
      }
    })
    const key = JSON.stringify([model.id, model.reasoningEffort ?? "default"])
    if (identities.has(key)) throw new Error(`Duplicate model/reasoning effort: ${key}`)
    identities.add(key)
  })
}

function provider(model: RoutingModel): string {
  return model.provider ?? model.id.split("/")[0] ?? model.id
}

/** Identify the native connection independently of optional vendor metadata. */
export function routingProviderId(model: RoutingModel): string {
  return model.id.includes("/") ? model.id.slice(0, model.id.indexOf("/")) : provider(model)
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

// Deterministic ties: cost, stronger intelligence, then code-point identity.
function compareCost(a: RoutingModel, b: RoutingModel, mode: ModelCostMode = "legacy"): number {
  return compareModelCosts(a, b, mode) || b.intelligenceScore - a.intelligenceScore ||
    compareText(a.id, b.id) || compareText(a.reasoningEffort ?? "default", b.reasoningEffort ?? "default")
}

function availableModels(models: readonly RoutingModel[]): RoutingModel[] {
  validateModelRoutingConfig({ beta: 0.35, models: [...models] })
  const available = models.filter(model => model.available)
  if (!available.length) throw new Error("Model routing requires at least one available model")
  return available
}

/** Select the cheapest sufficient candidate, or the strongest available candidate. */
export function selectModelForIntelligence(input: { models: readonly RoutingModel[]; requiredIntelligence: number; providerOrder?: readonly string[]; preference?: ModelPreferencePolicy; distributionState?: ModelDistributionState; demand?: number; risk?: number; costMode?: ModelCostMode; requireStructuredOutput?: boolean }): ModelSelection {
  if (!Number.isFinite(input.requiredIntelligence)) throw new Error("requiredIntelligence must be finite")
  if (input.requireStructuredOutput !== undefined && typeof input.requireStructuredOutput !== "boolean") throw new Error("requireStructuredOutput must be boolean")
  const order = validateProviderOrder(input.providerOrder ?? [])
  const rank = (model: RoutingModel): number => {
    const position = order.indexOf(routingProviderId(model))
    return position < 0 ? order.length : position
  }
  const costMode = validateModelCostMode(input.preference?.costMode ?? input.costMode ?? "legacy")
  const costCompare = (a: RoutingModel, b: RoutingModel): number => compareCost(a, b, costMode)
  const compare = (a: RoutingModel, b: RoutingModel): number => rank(a) - rank(b) || costCompare(a, b)
  const available = availableModels(input.models)
  // Capability filtering happens at selection time only: the intelligence scale was
  // already fixed upstream, and only a declarative structuredOutput.supported === true
  // is admissible — never inferred from tool calling or any other field.
  const admissible = input.requireStructuredOutput === true
    ? available.filter(model => model.structuredOutput?.supported === true)
    : available
  if (input.requireStructuredOutput === true && !admissible.length) {
    throw new Error("Model routing requires at least one available model with structuredOutput.supported true")
  }
  if (input.preference?.mode === "balanced") {
    const result = selectPreferredModel({ ...input, models: admissible, preference: input.preference, providerOrder: order, demand: input.demand ?? 1, risk: input.risk ?? 1, compareCost: costCompare })
    return { ...result, reason: `${result.reason} Cost basis: ${costMode}; ${costMode} cost ${modelCost(result.selected, costMode) ?? "unknown"}.${costMode === "amortized" ? " Subscription-allocated estimate, not measured billing." : ""}` }
  }
  const sufficient = admissible.filter(model => model.intelligenceScore >= input.requiredIntelligence).sort(compare)
  const ranked = sufficient.length ? sufficient : [...admissible].sort((a, b) => b.intelligenceScore - a.intelligenceScore || compare(a, b))
  const selected = ranked[0]
  if (!selected) throw new Error("Model routing requires at least one available model")
  // In degraded mode never advertise a weaker fallback as sufficient.
  const alternatives = ranked.slice(1).filter(model => sufficient.length || model.intelligenceScore === selected.intelligenceScore)
  const fallback = alternatives.find(model => routingProviderId(model) !== routingProviderId(selected)) ?? alternatives[0] ?? null
  const choice = `${selected.id} (${selected.reasoningEffort ?? "default"}), intelligence ${selected.intelligenceScore}, ${costMode} cost ${modelCost(selected, costMode) ?? "unknown"}`
  const explanation = sufficient.length
    ? `Selected ${choice}: ${order.length ? `provider preference (${order.join(" > ")}), then cheapest` : "cheapest"} available candidate meeting required intelligence ${input.requiredIntelligence}.`
    : `No available candidate meets required intelligence ${input.requiredIntelligence}; selected strongest available ${choice}.`
  const fallbackReason = fallback
    ? ` Fallback: ${fallback.id} (${fallback.reasoningEffort ?? "default"})${routingProviderId(fallback) !== routingProviderId(selected) ? " from a different provider" : " from the same provider (no different-provider alternative)"}.`
    : " No eligible fallback."
  return { selected, fallback, reason: explanation + fallbackReason + (costMode === "amortized" ? " Subscription-allocated estimate, not measured billing." : "") }
}

/** Route solely by supplied scores, catalogue intelligence and comparable costs. */
export function routeModel(input: { complexity: number; risk: number; models: readonly RoutingModel[]; beta?: number; providerOrder?: readonly string[]; preference?: ModelPreferencePolicy; distributionState?: ModelDistributionState; costMode?: ModelCostMode; intelligenceRange?: { min: number; max: number }; requireStructuredOutput?: boolean }): ModelRoute {
  validateTaskRoutingScores({ complexity: input.complexity, risk: input.risk })
  return routeNormalizedModel({ ...input, complexity: input.complexity / 100, risk: input.risk / 100 })
}

/** Route native 0..1 classification scores without a 0..100 round-trip. */
export function routeNormalizedModel(input: { complexity: number; risk: number; models: readonly RoutingModel[]; beta?: number; providerOrder?: readonly string[]; preference?: ModelPreferencePolicy; distributionState?: ModelDistributionState; costMode?: ModelCostMode; intelligenceRange?: { min: number; max: number }; requireStructuredOutput?: boolean }): ModelRoute {
  Object.entries({ complexity: input.complexity, risk: input.risk }).forEach(([dimension, score]) => {
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error(`${dimension} must be a finite normalized score from 0 to 1`)
    }
  })
  const beta = input.beta ?? 0.35
  validateModelRoutingConfig({ beta, models: [...input.models], preference: input.preference, costMode: input.costMode, intelligenceRange: input.intelligenceRange, requireStructuredOutput: input.requireStructuredOutput })
  const available = availableModels(input.models)
  // Scale fixed on every available model BEFORE the capability filter, so the
  // constraint narrows the candidate pool without recalibrating the threshold.
  const minI = input.intelligenceRange?.min ?? Math.min(...available.map(model => model.intelligenceScore))
  const maxI = input.intelligenceRange?.max ?? Math.max(...available.map(model => model.intelligenceScore))
  const c = input.complexity
  const r = input.risk
  const demand = c + beta * r * (1 - c)
  // Clamp arithmetic round-off at the endpoints, not the catalogue's scale.
  const requiredIntelligence = Math.min(maxI, Math.max(minI, minI + demand * (maxI - minI)))
  return {
    ...selectModelForIntelligence({ models: available, requiredIntelligence, providerOrder: input.providerOrder, preference: input.preference, distributionState: input.distributionState, demand, risk: r, costMode: input.costMode, requireStructuredOutput: input.requireStructuredOutput }),
    demand,
    requiredIntelligence,
  }
}
