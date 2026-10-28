import { describe, expect, test } from "bun:test"
import { routeModel, validateModelRoutingConfig } from "../src/model-router"
import { validateModelPreference } from "../src/model-preference"

const models = [
  { id: "cursor/grok", intelligenceScore: 46, averageCostPerTask: 0.313, benchmarkCostPerTask: 2.73, available: true },
  { id: "openai/sol", intelligenceScore: 46, averageCostPerTask: 0.21, benchmarkCostPerTask: 0.21, available: true },
]
describe("connection costs remain distinct from benchmark costs", () => {
  test("amortized subscription estimates are an explicit separate basis, not measured effective prices", () => {
    const catalogue = models.map(model => ({ ...model, amortizedCostPerTask: model.benchmarkCostPerTask * 200 / 3000 }))
    const preference = validateModelPreference({ mode: "balanced", maxIntelligenceGap: 2, models: [], costMode: "amortized" })
    const route = routeModel({ models: catalogue, preference, complexity: 0, risk: 0 })
    expect(route.selected.id).toBe("openai/sol")
    expect(catalogue[0]?.amortizedCostPerTask).toBeCloseTo(0.182)
    expect(route.reason).toContain("amortized")
    expect(route.selected.effectiveCostPerTask).toBeUndefined()
    expect(() => validateModelRoutingConfig({ beta: 0.35, models: [{ ...catalogue[0]!, amortizedCostPerTask: -1 }] })).toThrow("amortizedCostPerTask")
  })
  test("legacy cost remains intact while effective mode never substitutes API benchmark prices", () => {
    expect(routeModel({ models, complexity: 0, risk: 0 }).selected.id).toBe("openai/sol")
    const route = routeModel({ models, complexity: 0, risk: 0, costMode: "effective" })
    expect(route.selected.id).toBe("cursor/grok")
    expect(route.selected.averageCostPerTask).toBe(0.313)
    expect(route.reason).toContain("effective cost unknown")
  })
  test("explicit effective zero is valid, separate from expensive benchmark results", () => {
    const catalogue = [{ ...models[0]!, effectiveCostPerTask: 0 }, { ...models[1]!, effectiveCostPerTask: 0.01 }]
    expect(routeModel({ models: catalogue, complexity: 0, risk: 0, costMode: "effective" }).selected.id).toBe("cursor/grok")
    expect(routeModel({ models: catalogue, complexity: 0, risk: 0, costMode: "benchmark" }).selected.id).toBe("openai/sol")
  })
  test("mission cost mode takes precedence and is persisted without altering weights", () => {
    const preference = validateModelPreference({ mode: "balanced", maxIntelligenceGap: 2, models: [], costMode: "effective" })
    const route = routeModel({ models, preference, costMode: "benchmark", complexity: 0, risk: 0 })
    expect(route.selected.id).toBe("cursor/grok")
    expect(preference.costMode).toBe("effective")
    expect(route.reason).toContain("effective")
  })
  test("adding evaluated efforts does not silently rescale a pinned intelligence range", () => {
    const catalogue = [...models, { id: "openai/max", intelligenceScore: 58, averageCostPerTask: 6, available: true }]
    const route = routeModel({ models: catalogue, intelligenceRange: { min: 30, max: 51 }, complexity: 100, risk: 100 })
    expect(route.requiredIntelligence).toBe(51)
  })
  test("invalid price metadata, modes and ranges are rejected", () => {
    expect(() => validateModelRoutingConfig({ beta: 0.35, models: [{ ...models[0]!, effectiveCostPerTask: -1 }] })).toThrow("effectiveCostPerTask")
    expect(() => validateModelRoutingConfig({ beta: 0.35, models: [{ ...models[0]!, benchmarkCostPerTask: Number.NaN }] })).toThrow("benchmarkCostPerTask")
    expect(() => validateModelPreference({ mode: "balanced", models: [], costMode: "invented" })).toThrow("costMode")
    expect(() => validateModelRoutingConfig({ beta: 0.35, models, intelligenceRange: { min: 51, max: 30 } })).toThrow("intelligenceRange")
  })
})
