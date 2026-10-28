import { describe, expect, test } from "bun:test"
import { getModelPolicyView } from "../src/model-routing-policy"
import { buildMissionSnapshot } from "../src/mission-graph"
import { insertTeam, setupDb } from "./helpers"

describe("reasoning editor data", () => {
  test("shows all native efforts only for authorized model connections, with cost metadata", () => {
    const db = setupDb()
    try {
      insertTeam(db, "t", "mission", "ses_lead")
      const config = { beta: 0.35, costMode: "effective" as const, models: [{ id: "cursor/grok", reasoningEffort: "High", intelligenceScore: 46, averageCostPerTask: 0.313, benchmarkCostPerTask: 2.73, amortizedCostPerTask: 0.182, accessMode: "subsidized" as const, available: true }] }
      const inventory = { models: ["cursor/grok", "other/unapproved"], providers: ["cursor", "other"], variants: { "cursor/grok": ["Low", "High", "Extra High"], "other/unapproved": ["max"] } }
      const view = getModelPolicyView(db, "t", config, inventory)
      expect(view.costMode).toBe("effective")
      expect(view.catalogue[0]).toMatchObject({ benchmarkCostPerTask: 2.73, amortizedCostPerTask: 0.182, accessMode: "subsidized" })
      expect(view.nativeVariants).toEqual([
        { id: "cursor/grok", reasoningEffort: "Low", evaluated: false },
        { id: "cursor/grok", reasoningEffort: "High", evaluated: true },
        { id: "cursor/grok", reasoningEffort: "Extra High", evaluated: false },
      ])
      const snapshot = buildMissionSnapshot({ version: 1, teams: [{ id: "t", name: "mission", status: "active", members: [], tasks: [], modelPolicy: view }] })
      expect(snapshot.missions[0]?.modelPolicy).toEqual(view)
    } finally { db.close() }
  })
})
