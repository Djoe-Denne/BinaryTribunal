import type { RoutingModel } from "./model-router"

/** Cost bases are deliberately independent: a subscription is not an API bill. */
export type ModelCostMode = "legacy" | "benchmark" | "effective" | "amortized"

/** Validate a cost selection without estimating discounts or remaining quotas. */
export function validateModelCostMode(value: unknown): ModelCostMode {
  if (value !== "legacy" && value !== "benchmark" && value !== "effective" && value !== "amortized") throw new Error("costMode must be legacy, benchmark, effective or amortized")
  return value
}

/** Return only the chosen basis; an unknown effective cost never falls back to API pricing. */
export function modelCost(model: RoutingModel, mode: ModelCostMode): number | undefined {
  return mode === "effective" ? model.effectiveCostPerTask : mode === "amortized" ? model.amortizedCostPerTask : mode === "benchmark" ? model.benchmarkCostPerTask : model.averageCostPerTask
}

/** Known comparable costs rank first; unknowns tie deterministically, not at a fabricated zero. */
export function compareModelCosts(a: RoutingModel, b: RoutingModel, mode: ModelCostMode): number {
  const ac = modelCost(a, mode)
  const bc = modelCost(b, mode)
  if (ac === undefined || bc === undefined) return ac === bc ? 0 : ac === undefined ? 1 : -1
  return ac - bc
}
