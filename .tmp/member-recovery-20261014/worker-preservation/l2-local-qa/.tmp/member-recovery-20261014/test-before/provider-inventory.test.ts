import { describe, expect, test } from "bun:test"
import { createNativeProviderInventoryReader, parseNativeProviderInventory } from "../src/provider-inventory"

const providers = { data: [
  { id: "openai", activation: "auto", settings: { secret: "must-not-leak" } },
  { id: "empty", activation: "enabled" },
  { id: "disabled", activation: "disabled" },
  { id: "new-connection", activation: "enabled" },
] }
const models = { data: [
  { id: "model-fast", modelID: "model", providerID: "openai", enabled: true },
  { id: "model", modelID: "model", providerID: "openai", enabled: false },
  { id: "hidden", providerID: "empty", enabled: false },
  { id: "hidden", providerID: "disabled", enabled: true },
  { id: "ghost", providerID: "missing", enabled: true },
  { id: "accounts/vendor/model", providerID: "new-connection", enabled: true },
] }

describe("native enabled provider inventory", () => {
  test("exposes exact reasoning IDs without native settings or disabled aliases", () => {
    const inventory = parseNativeProviderInventory(providers, { data: [
      { id: "model-fast", providerID: "openai", enabled: true, variants: [{ id: "Extra High", settings: { secret: "never-copy" } }, { id: "medium" }] },
      { id: "model", providerID: "openai", enabled: false, variants: [{ id: "hidden" }] },
    ] })
    expect(inventory.variants).toEqual({ "openai/model-fast": ["Extra High", "medium"] })
    expect(JSON.stringify(inventory)).not.toContain("never-copy")
  })
  test("uses native connection IDs and enabled alias IDs, independently of an Ensemble catalogue", () => {
    const inventory = parseNativeProviderInventory(providers, models)
    expect(inventory.providers).toEqual(["new-connection", "openai"])
    expect(inventory.models).toEqual(["new-connection/accounts/vendor/model", "openai/model-fast"])
    expect(JSON.stringify(inventory)).not.toContain("must-not-leak")
  })

  test("distinguishes an empty inventory from an invalid response", () => {
    expect(parseNativeProviderInventory({ data: [] }, { data: [] })).toEqual({ providers: [], models: [] })
    expect(() => parseNativeProviderInventory({ error: "unavailable" }, models)).toThrow("inventory")
    expect(() => parseNativeProviderInventory(providers, { data: [{ id: "bad", providerID: "openai" }] })).toThrow("inventory")
  })

  test("coalesces per-project reads and reflects changes after cache expiry", async () => {
    const calls: Array<string | undefined> = []
    let now = 1, enabled = true
    const read = createNativeProviderInventoryReader({ now: () => now, load: async directory => {
      calls.push(directory)
      return [providers, { data: [{ id: "model-fast", providerID: "openai", enabled }] }]
    } })
    const [a, b] = await Promise.all([read("C:/a"), read("C:/a")])
    expect(a.providers).toEqual(["openai"])
    expect(b).toEqual(a)
    expect(calls).toEqual(["C:/a"])
    await read("C:/b")
    enabled = false; now += 5001
    expect((await read("C:/a")).providers).toEqual([])
    expect(calls).toEqual(["C:/a", "C:/b", "C:/a"])
  })

  test("uses authenticated bounded GETs and the native location query", async () => {
    const calls: URL[] = []
    const read = createNativeProviderInventoryReader({ discover: async () => ({ apiUrl: "http://127.0.0.1:9876", authorization: "Bearer fixture" }), request: async (url, init) => {
      const parsed = new URL(url); calls.push(parsed)
      expect(init.method).toBe("GET")
      expect(init.redirect).toBe("error")
      expect(init.headers).toMatchObject({ Authorization: "Bearer fixture" })
      expect(init.signal).toBeDefined()
      return Response.json(parsed.pathname === "/api/provider" ? providers : models)
    } })
    expect((await read("C:/project with spaces")).providers).toEqual(["new-connection", "openai"])
    expect(calls.map(url => url.pathname).sort()).toEqual(["/api/model", "/api/provider"])
    expect(calls.every(url => url.searchParams.get("location[directory]") === "C:/project with spaces")).toBe(true)
  })

  test("reports unavailability and retries after failure instead of caching an empty success", async () => {
    let available = false
    const read = createNativeProviderInventoryReader({ load: async () => {
      if (!available) throw new Error("Native unavailable")
      return [providers, models]
    } })
    await expect(read()).rejects.toThrow("unavailable")
    available = true
    expect((await read()).providers).toContain("openai")
    const remote = createNativeProviderInventoryReader({ discover: async () => ({ apiUrl: "https://unrelated.example" }), request: async () => { throw new Error("Must not send request") } })
    await expect(remote()).rejects.toThrow("local")
  })
})
