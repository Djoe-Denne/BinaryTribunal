import { createServer, type ServerResponse } from "node:http"
import { buildMissionSnapshot, type MissionSnapshot } from "./mission-graph"
import { createNativeSessionReader, type NativeSessionReader, type SessionLineage } from "./mission-graph-lineage"
import { MISSION_GRAPH_HTML } from "./mission-graph-page"
import { readProviderPolicyInput } from "./provider-policy-http"
import { readModelPolicyInput } from "./model-policy-http"
import { ProviderPolicyError } from "./provider-policy"

export interface MissionViewerOptions {
  source?: string
  port?: number
  snapshot?: { state: unknown; observedAt: number }
  readState?: (url: string, init: RequestInit) => Promise<Response>
  writePolicy?: (url: string, init: RequestInit) => Promise<Response>
  readNativeSession?: NativeSessionReader
}

export interface MissionViewerServer {
  url: string
  stop: () => Promise<void>
}

function sourceUrl(input: string): URL {
  const url = new URL(input)
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Viewer source must be a local HTTP dashboard origin")
  }
  return url
}

function json(res: ServerResponse, status: number, data: unknown): void {
  if (res.destroyed) return
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
  res.end(JSON.stringify(data))
}

/** Start a loopback graph viewer with a narrowly scoped live provider-preference proxy. */
export async function startMissionViewer(options: MissionViewerOptions = {}): Promise<MissionViewerServer> {
  const source = sourceUrl(options.source ?? "http://127.0.0.1:4747")
  const port = options.port ?? 4748
  if (!Number.isInteger(port) || port < 0 || port > 65535 || port === Number(source.port || 80)) {
    throw new Error("Viewer port must be valid and different from the source port")
  }
  const frozen = options.snapshot
    ? { ...buildMissionSnapshot(options.snapshot.state, options.snapshot.observedAt), frozen: true }
    : null
  let cached: MissionSnapshot | null = null
  let pending: Promise<MissionSnapshot> | null = null
  const readState = options.readState ?? fetch
  const writePolicy = options.writePolicy ?? fetch
  const readNativeSession = options.readNativeSession ?? createNativeSessionReader()
  const snapshot = (): Promise<MissionSnapshot> => {
    if (frozen) return Promise.resolve(frozen)
    if (cached && Date.now() - cached.observedAt < 2000) return Promise.resolve(cached)
    if (pending) return pending
    pending = (async () => {
      const response = await readState(new URL("/api/state", source).href, {
        method: "GET", redirect: "error", signal: AbortSignal.timeout(3000),
        headers: { Accept: "application/json" },
      })
      if (!response.ok) throw new Error(`Dashboard HTTP ${response.status}`)
      cached = buildMissionSnapshot(await response.json())
      return cached
    })().finally(() => { pending = null })
    return pending
  }
  const server = createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    const url = new URL(req.url ?? "/", "http://127.0.0.1")
    if (["/api/provider-policy", "/api/model-policy"].includes(url.pathname) && req.method === "POST" && !frozen) {
      const save = async (): Promise<void> => {
        if (url.search) throw new ProviderPolicyError("Provider preference parameters are not supported")
        const modelPolicy = url.pathname === "/api/model-policy"
        const input = modelPolicy ? await readModelPolicyInput(req) : await readProviderPolicyInput(req)
        const current = await snapshot()
        const mission = current.missions.find(mission => mission.id === input.teamId)
        if (!mission) throw new ProviderPolicyError("Mission not found in this source", 404)
        if (mission.status !== "active") throw new ProviderPolicyError("Only active missions can change provider order", 409)
        if (!(modelPolicy ? mission.modelPolicy : mission.routingPolicy)) throw new ProviderPolicyError("This source does not expose editable routing preferences; update the Ensemble source first", 501)
        const response = await writePolicy(new URL(url.pathname, source).href, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
          headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(input),
        })
        // A read started before the save must not repopulate the old cached revision.
        if (pending) await pending.catch(() => undefined)
        cached = null
        const result = await response.json() as { error?: string; policy?: unknown }
        if (!response.ok) throw new ProviderPolicyError(result.error || `Dashboard HTTP ${response.status}`, response.status >= 400 && response.status < 500 ? response.status : 502)
        json(res, 200, result)
      }
      void save().catch(error => json(res, error instanceof ProviderPolicyError ? error.statusCode : 502, { error: error instanceof Error ? error.message : "Unable to save provider preferences" }))
      return
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET")
      json(res, 405, { error: "Read-only viewer: GET only" })
      return
    }
    if (url.pathname === "/api/snapshot") {
      if (url.search) { json(res, 400, { error: "Snapshot parameters are not supported" }); return }
      snapshot().then(data => json(res, 200, data)).catch(error => {
        json(res, 502, { error: error instanceof Error ? error.message : "Dashboard unavailable" })
      })
      return
    }
    if (url.pathname === "/api/lineage") {
      const requested = url.searchParams.getAll("session")
      if (!requested.length || requested.length > 16 || Array.from(url.searchParams.keys()).some(key => key !== "session")
        || requested.some(id => !/^ses[A-Za-z0-9_-]+$/.test(id))) {
        json(res, 400, { error: "Provide up to 16 mission session IDs" })
        return
      }
      const ids = [...new Set(requested)]
      snapshot().then(async current => {
        const agents = current.missions.flatMap(mission => [mission.lead, ...mission.agents])
        const known = new Map(agents.flatMap(agent => agent.sessionId ? [[agent.sessionId, agent] as const] : []))
        if (ids.some(id => !known.has(id))) {
          json(res, 404, { error: "Session absent from the mission snapshot" })
          return
        }
        const lineage = await Promise.all(ids.map(async (id): Promise<[string, SessionLineage]> => {
          if (frozen) return [id, { kind: "unavailable", reason: "snapshot-not-recorded" }]
          try {
            const session = await readNativeSession(id)
            if (!session.fork) return [id, { kind: "unforked" }]
            const { sourceSessionId, boundary } = session.fork
            const source = known.get(sourceSessionId)
            const sourceName = source ? (source.name === "lead" ? "Superviseur" : source.name)
              : (await readNativeSession(sourceSessionId).catch(() => null))?.title || sourceSessionId
            return [id, { kind: "fork", sourceSessionId, sourceName, boundary }]
          } catch {
            return [id, { kind: "unavailable", reason: "native-unavailable" }]
          }
        }))
        json(res, 200, { lineage: Object.fromEntries(lineage) })
      }).catch(() => json(res, 502, { error: "Mission snapshot unavailable" }))
      return
    }
    if (url.pathname === "/") {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'",
      })
      res.end(MISSION_GRAPH_HTML)
      return
    }
    if (url.pathname === "/favicon.ico") { res.writeHead(204); res.end(); return }
    json(res, 404, { error: "Not found" })
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "127.0.0.1", () => { server.off("error", reject); resolve() })
  })
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Viewer address unavailable")
  return {
    url: `http://127.0.0.1:${address.port}`,
    stop: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
      server.closeAllConnections()
    }),
  }
}
