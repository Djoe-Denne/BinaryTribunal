import { discoverV2HttpBridge } from "./v2-http-bridge"

export interface NativeProviderInventory {
  providers: string[]
  models: string[]
  variants?: Record<string, string[]>
}

export type NativeProviderInventoryReader = (directory?: string) => Promise<NativeProviderInventory>

export interface NativeProviderInventoryOptions {
  discover?: () => Promise<{ apiUrl: string; authorization?: string } | undefined>
  request?: (url: string, init: RequestInit) => Promise<Response>
  load?: (directory?: string) => Promise<[unknown, unknown]>
  now?: () => number
}

function rows(value: unknown): Record<string, unknown>[] {
  const data = value && typeof value === "object" && "data" in value ? value.data : undefined
  if (!Array.isArray(data) || data.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new Error("Invalid native inventory response")
  return data as Record<string, unknown>[]
}

/** Extract enabled native connection/model IDs without copying provider secrets. */
export function parseNativeProviderInventory(providers: unknown, models: unknown): NativeProviderInventory {
  const available = new Set(rows(providers).flatMap(provider => {
    if (typeof provider.id !== "string" || !provider.id || !["auto", "enabled", "disabled"].includes(String(provider.activation))) throw new Error("Invalid native provider inventory")
    return provider.activation === "disabled" ? [] : [provider.id]
  }))
  const activeProviders = new Set<string>()
  const variants: Record<string, string[]> = {}
  const activeModels = new Set(rows(models).flatMap(model => {
    if (typeof model.id !== "string" || !model.id || typeof model.providerID !== "string" || !model.providerID || typeof model.enabled !== "boolean") throw new Error("Invalid native model inventory")
    if (!model.enabled || !available.has(model.providerID)) return []
    activeProviders.add(model.providerID)
    if (Array.isArray(model.variants)) variants[`${model.providerID}/${model.id}`] = model.variants.flatMap((variant: unknown) => {
      if (!variant || typeof variant !== "object" || !("id" in variant) || typeof variant.id !== "string" || !variant.id) throw new Error("Invalid native variant inventory")
      return [variant.id]
    }).sort()
    // id is the selectable alias; modelID may be shared by disabled/fast aliases.
    return [`${model.providerID}/${model.id}`]
  }))
  return { providers: [...activeProviders].sort(), models: [...activeModels].sort(), ...(Object.keys(variants).length ? { variants } : {}) }
}

/** Read the effective V2 inventory, coalescing requests per project for five seconds. */
export function createNativeProviderInventoryReader(options: NativeProviderInventoryOptions = {}): NativeProviderInventoryReader {
  const discover = options.discover ?? discoverV2HttpBridge
  const request = options.request ?? fetch
  const now = options.now ?? Date.now
  const cache = new Map<string, { expires: number; value: Promise<NativeProviderInventory> }>()
  const load = options.load ?? (async (directory?: string): Promise<[unknown, unknown]> => {
    const endpoint = await discover()
    if (!endpoint) throw new Error("Native provider inventory unavailable")
    const origin = new URL(endpoint.apiUrl)
    if (origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)
      || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Native inventory requires an existing local service")
    const get = async (path: string): Promise<unknown> => {
      const url = new URL(path, origin)
      if (directory) url.searchParams.set("location[directory]", directory)
      const response = await request(url.href, {
        method: "GET", redirect: "error", signal: AbortSignal.timeout(3000),
        headers: { Accept: "application/json", ...(endpoint.authorization ? { Authorization: endpoint.authorization } : {}) },
      })
      if (!response.ok) throw new Error(`Native inventory HTTP ${response.status}`)
      return response.json()
    }
    return Promise.all([get("/api/provider"), get("/api/model")])
  })
  return (directory?: string): Promise<NativeProviderInventory> => {
    const key = directory ?? ""
    const existing = cache.get(key)
    if (existing && now() < existing.expires) return existing.value
    const value = Promise.resolve().then(() => load(directory)).then(([providers, models]) => parseNativeProviderInventory(providers, models)).catch(error => {
      if (cache.get(key)?.value === value) cache.delete(key)
      throw error
    })
    cache.set(key, { expires: now() + 5000, value })
    return value
  }
}
