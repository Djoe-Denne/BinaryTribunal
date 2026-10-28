import { describe, expect, test } from "bun:test"
import { routeModel, routeNormalizedModel, selectModelForIntelligence, validateModelRoutingConfig, type ModelRoutingConfig, type RoutingModel, type StructuredOutputCapability } from "../src/model-router"

const capability = (overrides: Partial<StructuredOutputCapability> = {}): StructuredOutputCapability => ({
  supported: true,
  source: "probe",
  checkedAt: "2026-01-02T03:04:05Z",
  strictVerification: "unverified",
  ...overrides,
})

// a/free has no structuredOutput metadata at all: under the constraint it is
// inadmissible, whatever its cost or intelligence.
const models: RoutingModel[] = [
  { id: "a/free", intelligenceScore: 30, averageCostPerTask: 0, available: true },
  { id: "b/mid", intelligenceScore: 46, averageCostPerTask: 0.1, available: true, structuredOutput: capability() },
  { id: "c/strong", intelligenceScore: 54, averageCostPerTask: 1, available: true, structuredOutput: capability() },
]

describe("requireStructuredOutput legacy behavior", () => {
  test("absent flag keeps legacy routing even without any structuredOutput metadata", () => {
    const legacy = routeModel({ complexity: 0, risk: 0, models })
    expect(legacy.selected.id).toBe("a/free")
    expect(routeModel({ complexity: 0, risk: 0, models, requireStructuredOutput: false })).toEqual(legacy)
    expect(routeNormalizedModel({ complexity: 0, risk: 0, models, requireStructuredOutput: false })).toEqual(legacy)
  })

  test("absent flag leaves the full catalogue eligible for selection; degraded mode keeps the legacy weaker-fallback rule", () => {
    const selection = selectModelForIntelligence({ requiredIntelligence: 60, models })
    expect(selection.selected.id).toBe("c/strong")
    // Legacy degraded mode never advertises a weaker fallback as sufficient.
    expect(selection.fallback).toBeNull()
    const strongest = selectModelForIntelligence({ requiredIntelligence: 46, models })
    expect(strongest.selected.id).toBe("b/mid")
    expect(strongest.fallback?.id).toBe("c/strong")
  })

  test("requireStructuredOutput absent from the config type stays optional and unvalidated when undefined", () => {
    const config: ModelRoutingConfig = { beta: 0.35, models }
    expect(() => validateModelRoutingConfig(config)).not.toThrow()
  })
})

describe("requireStructuredOutput filtering", () => {
  test("only available models with structuredOutput.supported true are admissible", () => {
    const catalogue: RoutingModel[] = [
      { id: "p/true", intelligenceScore: 40, averageCostPerTask: 0.2, available: true, structuredOutput: capability({ supported: true }) },
      { id: "q/false", intelligenceScore: 40, averageCostPerTask: 0, available: true, structuredOutput: capability({ supported: false }) },
      { id: "r/null", intelligenceScore: 40, averageCostPerTask: 0, available: true, structuredOutput: capability({ supported: null }) },
      { id: "s/absent", intelligenceScore: 40, averageCostPerTask: 0, available: true },
    ]
    const route = routeModel({ complexity: 100, risk: 100, models: catalogue, requireStructuredOutput: true })
    expect(route.selected.id).toBe("p/true")
    expect(route.fallback).toBeNull()
  })

  test("selection and fallback both come from the supported pool, never an unsupported cheaper model", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/cheap-unsupported", intelligenceScore: 46, averageCostPerTask: 0, available: true },
      { id: "b/supported", intelligenceScore: 46, averageCostPerTask: 0.1, available: true, structuredOutput: capability() },
      { id: "c/supported-alt", intelligenceScore: 46, averageCostPerTask: 0.2, available: true, structuredOutput: capability() },
    ]
    const route = routeModel({ complexity: 0, risk: 0, models: catalogue, requireStructuredOutput: true })
    expect(route.selected.id).toBe("b/supported")
    expect(route.fallback?.id).toBe("c/supported-alt")
    const legacy = routeModel({ complexity: 0, risk: 0, models: catalogue })
    expect(legacy.selected.id).toBe("a/cheap-unsupported")
  })

  test("degraded strongest-available mode does not bypass the capability filter", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/strong-unsupported", intelligenceScore: 54, averageCostPerTask: 1, available: true },
      { id: "b/weak-supported", intelligenceScore: 46, averageCostPerTask: 0.1, available: true, structuredOutput: capability() },
    ]
    const selection = selectModelForIntelligence({ requiredIntelligence: 60, models: catalogue, requireStructuredOutput: true })
    expect(selection.selected.id).toBe("b/weak-supported")
    expect(selection.fallback).toBeNull()
    const route = routeModel({ complexity: 100, risk: 0, models: catalogue, requireStructuredOutput: true })
    expect(route.selected.id).toBe("b/weak-supported")
  })

  test("balanced mode cannot distribute to unsupported models", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/one", intelligenceScore: 46, averageCostPerTask: 0, available: true, structuredOutput: capability() },
      { id: "b/two", intelligenceScore: 46, averageCostPerTask: 0, available: true, structuredOutput: capability() },
      { id: "c/three", intelligenceScore: 46, averageCostPerTask: 0, available: true },
    ]
    const preference = { mode: "balanced" as const, maxIntelligenceGap: 2, models: [] }
    const route = routeModel({ complexity: 100, risk: 100, models: catalogue, preference, requireStructuredOutput: true })
    expect(route.distribution).toBeDefined()
    expect(Object.keys(route.distribution!.credits).sort()).toEqual([JSON.stringify(["a/one", "default"]), JSON.stringify(["b/two", "default"])].sort())
  })

  test("reserve promotion stays inside the supported pool", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/ordinary-unsupported", intelligenceScore: 46, averageCostPerTask: 0, available: true },
      { id: "b/reserve-supported", intelligenceScore: 46, averageCostPerTask: 0, available: true, reserve: true, structuredOutput: capability() },
    ]
    const preference = { mode: "balanced" as const, maxIntelligenceGap: 2, models: [] }
    const route = routeModel({ complexity: 100, risk: 100, models: catalogue, preference, requireStructuredOutput: true })
    expect(route.selected.id).toBe("b/reserve-supported")
    expect(route.reason).toContain("Reserve pool required")
  })
})

describe("requireStructuredOutput zero eligible fail closed", () => {
  test("throws an explicit message when no available model supports structured output", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/unsupported", intelligenceScore: 30, averageCostPerTask: 0, available: true },
      { id: "b/null", intelligenceScore: 40, averageCostPerTask: 0, available: true, structuredOutput: capability({ supported: null }) },
    ]
    expect(() => routeModel({ complexity: 0, risk: 0, models: catalogue, requireStructuredOutput: true })).toThrow("structuredOutput")
    expect(() => routeNormalizedModel({ complexity: 0, risk: 0, models: catalogue, requireStructuredOutput: true })).toThrow("structuredOutput")
    expect(() => selectModelForIntelligence({ requiredIntelligence: 0, models: catalogue, requireStructuredOutput: true })).toThrow("structuredOutput")
  })

  test("wholly unavailable catalogue still reports the legacy availability failure", () => {
    expect(() => routeModel({ complexity: 0, risk: 0, models: models.map(m => ({ ...m, available: false })), requireStructuredOutput: true })).toThrow("available")
  })
})

describe("requireStructuredOutput intelligence scale", () => {
  test("threshold is computed on all available models before the capability filter", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/supported-46", intelligenceScore: 46, averageCostPerTask: 0.1, available: true, structuredOutput: capability() },
      { id: "b/unsupported-50", intelligenceScore: 50, averageCostPerTask: 1, available: true },
    ]
    const route = routeModel({
      complexity: 50,
      risk: 0,
      models: catalogue,
      intelligenceRange: { min: 46, max: 50 },
      requireStructuredOutput: true,
    })
    // Scale 46..50 kept: required 48; the only admissible model (46) is insufficient,
    // so routing degrades instead of recalibrating the scale to 46..46.
    expect(route.requiredIntelligence).toBe(48)
    expect(route.reason).toContain("No available candidate meets")
    expect(route.selected.id).toBe("a/supported-46")
  })

  test("a fixed intelligence range is honored unchanged under the constraint", () => {
    const route = routeModel({ complexity: 0, risk: 0, models, intelligenceRange: { min: 54, max: 54 }, requireStructuredOutput: true })
    expect(route.requiredIntelligence).toBe(54)
    expect(route.selected.id).toBe("c/strong")
  })
})

describe("structuredOutput metadata validation", () => {
  const withCapability = (structuredOutput: unknown): RoutingModel[] => [{ ...models[0]!, structuredOutput } as RoutingModel]

  test("rejects malformed capability metadata", () => {
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(null) })).toThrow("structuredOutput must be")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability([]) })).toThrow("structuredOutput must be")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ supported: "yes" as unknown as boolean })) })).toThrow("supported")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ source: "" })) })).toThrow("source")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ source: "   " })) })).toThrow("source")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ checkedAt: "2026-01-02 03:04:05" })) })).toThrow("checkedAt")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ checkedAt: "2026-01-02T03:04:05" })) })).toThrow("checkedAt")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ checkedAt: "9999-99-99T99:99:99Z" })) })).toThrow("checkedAt")
    expect(() => routeModel({ complexity: 0, risk: 0, models: withCapability(capability({ strictVerification: "probably" as unknown as StructuredOutputCapability["strictVerification"] })) })).toThrow("strictVerification")
  })

  test("accepts every strictVerification enum value and a null supported flag", () => {
    for (const strictVerification of ["unverified", "verified", "unsupported"] as const) {
      expect(() => validateModelRoutingConfig({ beta: 0.35, models: withCapability(capability({ strictVerification })) })).not.toThrow()
    }
    expect(() => validateModelRoutingConfig({ beta: 0.35, models: withCapability(capability({ supported: null, checkedAt: "2026-01-02T03:04:05.123Z" })) })).not.toThrow()
  })

  test("rejects a non-boolean requireStructuredOutput at config and input level", () => {
    expect(() => validateModelRoutingConfig({ beta: 0.35, models, requireStructuredOutput: "yes" as unknown as boolean })).toThrow("requireStructuredOutput")
    expect(() => routeModel({ complexity: 0, risk: 0, models, requireStructuredOutput: 1 as unknown as boolean })).toThrow("requireStructuredOutput")
    expect(() => selectModelForIntelligence({ requiredIntelligence: 0, models, requireStructuredOutput: "true" as unknown as boolean })).toThrow("requireStructuredOutput")
  })
})

describe("structuredOutput provenance and inputs", () => {
  test("inputs are never mutated by constrained routing", () => {
    const catalogue = structuredClone(models)
    const input = { complexity: 75, risk: 25, models: catalogue, requireStructuredOutput: true }
    const original = structuredClone(input)
    routeModel(input)
    expect(input).toEqual(original)
    expect(catalogue).toEqual(original.models)
  })

  test("declarative capability is routed as declared; verified is not re-derived from other fields", () => {
    const catalogue: RoutingModel[] = [
      { id: "a/tool-caller", level: "tool-use", usage: "structured", intelligenceScore: 54, averageCostPerTask: 0, available: true },
      { id: "b/declared-unsupported", intelligenceScore: 46, averageCostPerTask: 0, available: true, structuredOutput: capability({ supported: true, strictVerification: "unsupported" }) },
    ]
    // No tool-calling inference: the undocumented strong model is excluded and the
    // declared one is taken as-is, even with strictVerification "unsupported".
    const route = routeModel({ complexity: 100, risk: 100, models: catalogue, requireStructuredOutput: true })
    expect(route.selected.id).toBe("b/declared-unsupported")
    expect(route.selected.structuredOutput?.strictVerification).toBe("unsupported")
  })
})
