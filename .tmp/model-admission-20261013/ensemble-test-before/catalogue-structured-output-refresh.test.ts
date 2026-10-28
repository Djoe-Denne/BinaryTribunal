import { describe, expect, test } from "bun:test"
import { planStructuredOutputRefresh } from "../skills/ensemble-model-catalogue/scripts/sync-structured-output"

const provenance = { source: "https://models.dev/api.json", checkedAt: "2026-10-13T08:00:00.000Z", sha256: "a".repeat(64) }
const row = (id: string, available = true) => ({ id, available, reasoningEffort: "high", intelligenceScore: 40, averageCostPerTask: 0.2, preference: 80, custom: { keep: true } })
const config = () => ({ custom: "preserve", modelRouting: { beta: 0.35, costMode: "effective", intelligenceRange: { min: 10, max: 60 }, models: [row("p/yes"), row("p/no"), row("p/unknown"), row("other/yes"), row("p/disabled", false)] } })
const dataset = { p: { models: { yes: { structured_output: true }, no: { structured_output: false }, unknown: { tool_call: true }, disabled: { structured_output: true } } } }

describe("catalogue structured-output capability refresh", () => {
  test("exact provider/model join, fail-closed exclusion, no activation or metric mutation", () => {
    const before = config(), state = { lastEvaluatedAt: "2026-10-01T00:00:00Z", lastSyncedAt: null, discoveries: [{ decision: "pending" }], custom: 12 }
    const original = structuredClone({ before, state, dataset })
    const plan = planStructuredOutputRefresh(before, state, dataset, provenance)
    expect(plan.config.modelRouting.requireStructuredOutput).toBe(true)
    expect(plan.config.modelRouting.models.map(m => m.available)).toEqual([true, false, false, false, false])
    expect(plan.config.modelRouting.models.map(m => m.structuredOutput?.supported)).toEqual([true, false, null, null, true])
    for (const [i, model] of plan.config.modelRouting.models.entries()) {
      const { available: _available, structuredOutput: _capability, ...rest } = model
      const { available: _oldAvailable, ...old } = before.modelRouting.models[i]!
      expect(rest).toEqual(old)
      expect(model.structuredOutput).toMatchObject({ source: provenance.source, checkedAt: provenance.checkedAt, strictVerification: "unverified" })
    }
    expect(plan.state.lastEvaluatedAt).toBe(state.lastEvaluatedAt); expect(plan.state.lastSyncedAt).toBeNull()
    expect(plan.state.discoveries).toEqual(state.discoveries); expect(plan.state.custom).toBe(12)
    expect({ before, state, dataset }).toEqual(original)
    expect(plan.report.disabled.map(m => m.id)).toEqual(["p/no", "p/unknown", "other/yes"])
  })
  test("slash-containing model IDs remain exact and string booleans are unknown", () => {
    const input = { modelRouting: { beta: 0.35, models: [row("p/family/model"), row("p/string")] } }
    const plan = planStructuredOutputRefresh(input, {}, { p: { models: { "family/model": { structured_output: true }, string: { structured_output: "true" } } } }, provenance)
    expect(plan.config.modelRouting.models.map(m => m.structuredOutput?.supported)).toEqual([true, null])
    expect(plan.config.modelRouting.models.map(m => m.available)).toEqual([true, false])
  })
  test("a later positive declaration never silently reactivates an excluded entry", () => {
    const first = planStructuredOutputRefresh(config(), {}, dataset, provenance)
    const second = planStructuredOutputRefresh(first.config, first.state, { p: { models: { yes: { structured_output: true }, no: { structured_output: true } } } }, provenance)
    expect(second.config.modelRouting.models.find(m => m.id === "p/no")!.available).toBe(false)
    expect(second.config.modelRouting.models.find(m => m.id === "p/no")!.structuredOutput?.supported).toBe(true)
    expect(second.report.disabled.some(m => m.id === "p/no")).toBe(false)
  })
  test("rejects malformed source/provenance instead of applying fabricated support", () => {
    for (const input of [null, [], "bad"]) expect(() => planStructuredOutputRefresh(config(), {}, input, provenance)).toThrow()
    expect(() => planStructuredOutputRefresh(config(), {}, dataset, { ...provenance, checkedAt: "yesterday" })).toThrow()
    expect(() => planStructuredOutputRefresh(config(), {}, dataset, { ...provenance, sha256: "bad" })).toThrow()
    const bad = config(); (bad.modelRouting.models[0] as unknown as { available: unknown }).available = "true"
    expect(() => planStructuredOutputRefresh(bad, {}, dataset, provenance)).toThrow()
  })
})
