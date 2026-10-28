import { afterEach, describe, expect, test } from "bun:test"
import { getProviderPolicy, saveProviderPolicy, validateProviderOrder } from "../src/provider-policy"
import { routeModel, selectModelForIntelligence, type RoutingModel } from "../src/model-router"
import { insertTeam, setupDb } from "./helpers"

const databases: ReturnType<typeof setupDb>[] = []
function fixture() {
  const db = setupDb(); databases.push(db)
  insertTeam(db, "a", "mission-a", "ses_a")
  insertTeam(db, "b", "mission-b", "ses_b")
  return db
}
afterEach(() => { databases.splice(0).forEach(db => db.close()) })
const models: RoutingModel[] = [
  { id: "openai/strong", intelligenceScore: 90, averageCostPerTask: 0.01, available: true },
  { id: "included/strong", intelligenceScore: 85, averageCostPerTask: 0.2, available: true },
  { id: "included/weak", intelligenceScore: 20, averageCostPerTask: 0, available: true },
  { id: "openai-backup/strong", provider: "openai", intelligenceScore: 90, averageCostPerTask: 0.1, available: true },
]

describe("persisted mission provider order", () => {
  test("starts without an imposed preference and keeps missions independent", () => {
    const db = fixture()
    expect(getProviderPolicy(db, "a")).toEqual({ providerOrder: [], revision: 0 })
    const saved = saveProviderPolicy(db, "a", ["included", "openai"], 0)
    expect(saved).toEqual({ providerOrder: ["included", "openai"], revision: 1 })
    expect(getProviderPolicy(db, "a")).toEqual(saved)
    expect(getProviderPolicy(db, "b")).toEqual({ providerOrder: [], revision: 0 })
    expect(db.query("SELECT provider_order FROM team WHERE id = 'a'").get()).toEqual({ provider_order: '["included","openai"]' })
  })

  test("rejects stale edits instead of overwriting another UI or supervisor update", () => {
    const db = fixture()
    saveProviderPolicy(db, "a", ["included"], 0)
    expect(() => saveProviderPolicy(db, "a", ["openai"], 0)).toThrow("changed")
    expect(getProviderPolicy(db, "a").providerOrder).toEqual(["included"])
    expect(saveProviderPolicy(db, "a", [], 1)).toEqual({ providerOrder: [], revision: 2 })
  })

  test("validates IDs and refuses archived or missing missions", () => {
    for (const value of [null, "openai", [""], ["openai/model"], ["openai", "openai"], [1], Array.from({ length: 65 }, (_, i) => `p${i}`)]) {
      expect(() => validateProviderOrder(value)).toThrow("provider")
    }
    expect(validateProviderOrder([" local-proxy ", "openai-backup"])).toEqual(["local-proxy", "openai-backup"])
    const db = fixture()
    db.run("UPDATE team SET status = 'archived' WHERE id = 'b'")
    expect(() => saveProviderPolicy(db, "b", ["included"])).toThrow("active")
    expect(() => saveProviderPolicy(db, "missing", [])).toThrow("found")
  })
})

describe("provider preference after quality eligibility", () => {
  test("prefers the configured provider over cheaper candidates without lowering the quality threshold", () => {
    const input = { models, requiredIntelligence: 80, providerOrder: ["included", "openai"] }
    expect(selectModelForIntelligence(input).selected.id).toBe("included/strong")
    expect(selectModelForIntelligence({ ...input, requiredIntelligence: 90 }).selected.id).toBe("openai/strong")
    expect(routeModel({ models, complexity: 50, risk: 0, providerOrder: input.providerOrder }).selected.id).toBe("included/strong")
  })

  test("ranks connection IDs independently even when their vendor metadata is the same", () => {
    expect(selectModelForIntelligence({ models, requiredIntelligence: 80, providerOrder: ["openai-backup", "openai"] }).selected.id).toBe("openai-backup/strong")
    expect(selectModelForIntelligence({ models, requiredIntelligence: 80, providerOrder: ["openai-backup", "openai"] }).fallback?.id).toBe("openai/strong")
  })

  test("keeps cost ordering without preference and falls back when the preferred provider is unavailable", () => {
    expect(selectModelForIntelligence({ models, requiredIntelligence: 80 }).selected.id).toBe("openai/strong")
    const unavailable = models.map(model => ({ ...model, available: !model.id.startsWith("included/") }))
    expect(selectModelForIntelligence({ models: unavailable, requiredIntelligence: 80, providerOrder: ["included"] }).selected.id).toBe("openai/strong")
    expect(selectModelForIntelligence({ models, requiredIntelligence: 100, providerOrder: ["included", "openai-backup"] }).selected.id).toBe("openai-backup/strong")
  })
})
