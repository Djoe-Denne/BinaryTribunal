import { describe, expect, test } from "bun:test"
import { runInNewContext } from "node:vm"
import { MISSION_GRAPH_MODELS_JS, MISSION_GRAPH_MODELS_HTML } from "../src/mission-graph-js-models"

function editor() {
  const elements: Record<string, { value: string; addEventListener(): void }> = {}
  const context = { $: (id: string) => elements[id] ??= { value: id === "model-mode" ? "balanced" : id === "model-cost-mode" ? "effective" : "2", addEventListener() {} } }
  return runInNewContext(`${MISSION_GRAPH_MODELS_JS}\n({groupModelVariants,modelDraft,modelEditor})`, context) as {
    groupModelVariants: (rows: object[], native: object[]) => { id: string; rows: { reasoningEffort: string; evaluated: boolean }[] }[]
    modelDraft: () => { costMode: string; models: { id: string; enabled?: boolean }[] }
    modelEditor: { rows: object[]; retained: object[] }
  }
}
describe("grouped per-model reasoning choices", () => {
  test("groups by exact connection, showing unknown efforts without manufacturing measurements", () => {
    const ui = editor()
    const groups = ui.groupModelVariants([{ id: "go/glm", reasoningEffort: "max", enabled: true }, { id: "zai/glm", reasoningEffort: "max", enabled: true }], [
      { id: "go/glm", reasoningEffort: "low", evaluated: false }, { id: "go/glm", reasoningEffort: "max", evaluated: true }, { id: "zai/glm", reasoningEffort: "max", evaluated: true },
    ])
    expect(groups.map(g => g.id)).toEqual(["go/glm", "zai/glm"])
    expect(groups[0]?.rows).toHaveLength(2)
    expect(groups[0]?.rows.find(r => r.reasoningEffort === "low")?.evaluated).toBe(false)
  })
  test("saving evaluated toggles preserves hidden/temporarily unavailable overrides", () => {
    const ui = editor()
    ui.modelEditor.rows = [{ id: "go/glm", reasoningEffort: "max", preference: 50, enabled: true, reserve: false }]
    ui.modelEditor.retained = [{ id: "cursor/hidden", reasoningEffort: "High", enabled: false }]
    expect(ui.modelDraft().costMode).toBe("effective")
    expect(ui.modelDraft().models.map(m => m.id)).toEqual(["cursor/hidden", "go/glm"])
  })
  test("interface names the different cost bases instead of equating benchmark costs with bills", () => {
    expect(MISSION_GRAPH_MODELS_HTML).toContain("Coût effectif")
    expect(MISSION_GRAPH_MODELS_HTML).toContain("benchmark")
    expect(MISSION_GRAPH_MODELS_JS.replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))).toContain("Non évalué")
    expect(MISSION_GRAPH_MODELS_JS).toContain("data-unscored")
  })
})
