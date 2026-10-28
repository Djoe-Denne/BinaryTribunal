import { describe, expect, test } from "bun:test"
import { routeModel, validateModelRoutingConfig } from "../src/model-router"

const models = [
  { id: "local/small", intelligenceScore: 30, averageCostPerTask: 0, available: true, preference: 0 },
  { id: "go/glm", intelligenceScore: 42, averageCostPerTask: 0.25, available: true, preference: 50 },
  { id: "cursor/grok", reasoningEffort: "High", intelligenceScore: 46, averageCostPerTask: 0.3, available: true, preference: 80 },
  { id: "openai/sol", reasoningEffort: "medium", intelligenceScore: 48, averageCostPerTask: 0.21, available: true, preference: 10, reserve: true },
  { id: "openai/astra", reasoningEffort: "high", intelligenceScore: 51, averageCostPerTask: 1.7, available: true, preference: 10, reserve: true },
]
const preference = { mode: "balanced" as const, maxIntelligenceGap: 2, models: [] }

describe("bounded model/effort preferences", () => {
  test("a preferred near miss may beat a stronger reserve, without changing benchmark scores", () => {
    const input = { models, preference, complexity: 78, risk: 0 }
    const result = routeModel(input)
    expect(result.requiredIntelligence).toBeCloseTo(46.38)
    expect(result.selected.id).toBe("cursor/grok")
    expect(result.selected.intelligenceScore).toBe(46)
    expect(result.reason).toContain("quality floor")
    expect(routeModel({ ...input, preference: { ...preference, maxIntelligenceGap: 0 } }).selected.id).toBe("openai/sol")
  })

  test("a clear useful capability advantage and high risk cannot be overcome by preference", () => {
    expect(routeModel({ models, preference, complexity: 80, risk: 50 }).selected.id).toBe("openai/sol")
    expect(routeModel({ models, preference, complexity: 80, risk: 100 }).selected.id).toBe("openai/astra")
  })

  test("reserves do not consume easy work while ordinary candidates are capable", () => {
    const result = routeModel({ models, preference, complexity: 20, risk: 0 })
    expect(result.selected.id).toBe("cursor/grok")
    expect(result.fallback?.id).toBe("go/glm")
  })

  test("reasoning choices are exact catalogue identities; a disabled effort is never routed", () => {
    const variants = [
      { ...models[2]!, reasoningEffort: "High", preference: 100, averageCostPerTask: 0.1 },
      { ...models[2]!, reasoningEffort: "Extra High", preference: 25 },
    ]
    const policy = { ...preference, models: [{ id: "cursor/grok", reasoningEffort: "High", enabled: false }] }
    const result = routeModel({ models: variants, preference: policy, complexity: 50, risk: 0 })
    expect(result.selected.reasoningEffort).toBe("Extra High")
  })

  test("weighted distribution is reproducible, independent of catalogue ordering, and survives a state round trip", () => {
    const candidates = [
      { id: "go/glm", intelligenceScore: 46, averageCostPerTask: 0.25, available: true, preference: 75 },
      { id: "cursor/grok", intelligenceScore: 46, averageCostPerTask: 0.3, available: true, preference: 25 },
    ]
    function sequence(catalogue: typeof candidates) {
      const distributionState: Record<string, Record<string, number>> = {}
      return Array.from({ length: 40 }, () => {
        const result = routeModel({ models: catalogue, preference, distributionState, complexity: 50, risk: 0 })
        if (result.distribution) distributionState[result.distribution.key] = JSON.parse(JSON.stringify(result.distribution.credits))
        return result.selected.id
      })
    }
    const first = sequence(candidates)
    expect(first.filter(id => id === "go/glm")).toHaveLength(30)
    expect(first.filter(id => id === "cursor/grok")).toHaveLength(10)
    expect(sequence([...candidates].reverse())).toEqual(first)
  })

  test("cost breaks equal distribution credits, including genuinely free models", () => {
    const candidates = [
      { ...models[1]!, intelligenceScore: 46, preference: 50, averageCostPerTask: 0 },
      { ...models[2]!, preference: 50 },
    ]
    expect(routeModel({ models: candidates, preference, complexity: 50, risk: 0 }).selected.id).toBe("go/glm")
  })

  test("exclusions do not rescale difficulty or silently downgrade a difficult task", () => {
    const policy = { ...preference, models: models.filter(m => m.reserve).map(m => ({ id: m.id, reasoningEffort: m.reasoningEffort, enabled: false })) }
    expect(() => routeModel({ models, preference: policy, complexity: 100, risk: 100 })).toThrow("quality floor")
  })

  test("invalid preferences and overly broad gaps are rejected", () => {
    expect(() => validateModelRoutingConfig({ beta: 0.35, models: [{ ...models[1]!, preference: -1 }] })).toThrow("preference")
    expect(() => validateModelRoutingConfig({ beta: 0.35, models, preference: { ...preference, maxIntelligenceGap: 11 } })).toThrow("maxIntelligenceGap")
    expect(() => validateModelRoutingConfig({ beta: 0.35, models, preference: { ...preference, models: [{ id: "go/glm", reserve: "yes" as unknown as boolean }] } })).toThrow("reserve")
  })

  test("omitting the policy preserves legacy provider-order/cost routing", () => {
    expect(routeModel({ models, complexity: 78, risk: 0 }).selected.id).toBe("openai/sol")
  })
})
