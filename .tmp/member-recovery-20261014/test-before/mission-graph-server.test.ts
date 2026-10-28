import { afterEach, describe, expect, test } from "bun:test"
import { startMissionViewer, type MissionViewerServer } from "../src/mission-graph-server"
import type { MissionSnapshot } from "../src/mission-graph"
import type { NativeSessionInfo } from "../src/mission-graph-lineage"

const servers: MissionViewerServer[] = []
const lineageState = {
  version: 1, teams: [{ id: "team", name: "Mission", leadSessionId: "ses_lead", members: [
    { name: "producer", agent: "build", sessionId: "ses_author" },
    { name: "discovery", agent: "explore", sessionId: "ses_source" },
  ], tasks: [] }],
}
interface LineageResponse { lineage: Record<string, { kind: string; sourceName?: string; sourceSessionId?: string; boundary?: { type: string; messageId: string }; reason?: string }> }
const nativeSession = (id: string): NativeSessionInfo => ({ sessionId: id, title: "Native session", fork: id === "ses_author" ? {
  sourceSessionId: "ses_source", boundary: { type: "before", messageId: "msg_boundary" },
} : null })
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.stop()))
})

describe("isolated mission viewer", () => {
  test("preserves model/effort policy in snapshots and forwards only revisioned live edits", async () => {
    const modelPolicy = { policy: { mode: "balanced", maxIntelligenceGap: 2, models: [] }, revision: 0, inherited: false, inventoryAvailable: true,
      catalogue: [{ id: "cursor/grok", reasoningEffort: "Extra High", intelligenceScore: 46, averageCostPerTask: 0.3, preference: 80, enabled: true, reserve: false }] }
    const source = { version: 1, teams: [{ id: "team", name: "Mission", status: "active", members: [], tasks: [], modelPolicy }] }
    const writes: string[] = []
    const server = await startMissionViewer({ port: 0, readState: async () => Response.json(source), writePolicy: async (url, init) => {
      writes.push(url)
      expect(JSON.parse(String(init.body))).toMatchObject({ revision: 0, policy: { mode: "balanced" } })
      return Response.json({ policy: { ...modelPolicy, revision: 1 } })
    } })
    servers.push(server)
    const snapshot = await (await fetch(`${server.url}/api/snapshot`)).json() as MissionSnapshot
    expect(snapshot.missions[0]?.modelPolicy?.catalogue[0]?.reasoningEffort).toBe("Extra High")
    const body = JSON.stringify({ teamId: "team", policy: modelPolicy.policy, revision: 0 })
    expect((await fetch(`${server.url}/api/model-policy`, { method: "POST", headers: { "Content-Type": "application/json" }, body })).status).toBe(200)
    expect(writes).toEqual(["http://127.0.0.1:4747/api/model-policy"])
    const frozen = await startMissionViewer({ port: 0, snapshot: { state: source, observedAt: 1 }, writePolicy: async () => { throw new Error("Frozen write") } })
    servers.push(frozen)
    expect((await fetch(`${frozen.url}/api/model-policy`, { method: "POST", headers: { "Content-Type": "application/json" }, body })).status).toBe(405)
  })
  test("proxies only the known live mission provider preference and refreshes its snapshot", async () => {
    const source = { version: 1, teams: [{ id: "team", name: "Mission", status: "active", members: [], tasks: [], routingPolicy: { providerOrder: [] as string[], revision: 0, providers: ["included", "openai"] } }] }
    const writes: string[] = []
    const server = await startMissionViewer({ port: 0,
      readState: async () => Response.json(source),
      writePolicy: async (url, init) => {
        writes.push(url)
        expect(init.method).toBe("POST")
        expect(init.redirect).toBe("error")
        const body = JSON.parse(String(init.body)) as { providerOrder: string[]; revision: number }
        source.teams[0]!.routingPolicy = { ...source.teams[0]!.routingPolicy, providerOrder: body.providerOrder, revision: body.revision + 1 }
        return Response.json({ policy: source.teams[0]!.routingPolicy })
      },
    })
    servers.push(server)
    await fetch(`${server.url}/api/snapshot`)
    const response = await fetch(`${server.url}/api/provider-policy`, { method: "POST", headers: { "Content-Type": "application/json", Origin: server.url }, body: JSON.stringify({ teamId: "team", providerOrder: ["included", "openai"], revision: 0 }) })
    expect(response.status).toBe(200)
    expect(writes).toEqual(["http://127.0.0.1:4747/api/provider-policy"])
    const snapshot = await (await fetch(`${server.url}/api/snapshot`)).json() as MissionSnapshot
    expect(snapshot.missions[0]?.routingPolicy?.providerOrder).toEqual(["included", "openai"])
  })

  test("frozen snapshots reject preferences without contacting any live source", async () => {
    let writes = 0
    const server = await startMissionViewer({ port: 0, snapshot: { state: lineageState, observedAt: 1 }, writePolicy: async () => { writes++; return Response.json({}) } })
    servers.push(server)
    const response = await fetch(`${server.url}/api/provider-policy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: "team", providerOrder: ["included"], revision: 0 }) })
    expect(response.status).toBe(405)
    expect(writes).toBe(0)
  })

  test("blocks foreign-origin policy writes before accessing the live source", async () => {
    let reads = 0, writes = 0
    const server = await startMissionViewer({ port: 0, readState: async () => { reads++; return Response.json(lineageState) }, writePolicy: async () => { writes++; return Response.json({}) } })
    servers.push(server)
    const response = await fetch(`${server.url}/api/provider-policy`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://foreign.example" }, body: JSON.stringify({ teamId: "team", providerOrder: ["included"], revision: 0 }) })
    expect(response.status).toBe(403)
    expect(reads + writes).toBe(0)
  })

  test("serves a graph and reads only the existing snapshot endpoint", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const server = await startMissionViewer({ port: 0, readState: async (url, init) => {
      calls.push({ url, init })
      return Response.json({ version: 1, teams: [] })
    } })
    servers.push(server)
    const page = await fetch(server.url)
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('id="mission-select"')
    expect(page.headers.get("content-security-policy")).toContain("connect-src 'self'")
    expect(calls).toHaveLength(0)
    const response = await fetch(`${server.url}/api/snapshot`)
    expect(response.status).toBe(200)
    expect(((await response.json()) as MissionSnapshot).missions).toEqual([])
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe("http://127.0.0.1:4747/api/state")
    expect(calls[0]!.init.method).toBe("GET")
    expect(calls[0]!.init.redirect).toBe("error")
  })

  test("rejects mutation methods and arbitrary paths without contacting the source", async () => {
    let calls = 0
    const server = await startMissionViewer({ port: 0, readState: async () => {
      calls++
      return Response.json({ version: 1, teams: [] })
    } })
    servers.push(server)
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const response = await fetch(`${server.url}/api/snapshot`, { method })
      expect(response.status).toBe(405)
      expect(response.headers.get("allow")).toBe("GET")
    }
    expect((await fetch(`${server.url}/api/team/shutdown`)).status).toBe(404)
    expect((await fetch(`${server.url}/api/snapshot?url=http://elsewhere`)).status).toBe(400)
    expect(calls).toBe(0)
  })

  test("coalesces simultaneous reads and reuses a short-lived snapshot", async () => {
    let calls = 0
    const server = await startMissionViewer({ port: 0, readState: async () => {
      calls++
      return Response.json({ version: 1, teams: [] })
    } })
    servers.push(server)
    const results = await Promise.all(Array.from({ length: 5 }, () => fetch(`${server.url}/api/snapshot`).then(r => r.json() as Promise<MissionSnapshot>)))
    expect(calls).toBe(1)
    expect(new Set(results.map(result => result.observedAt)).size).toBe(1)
  })

  test("reports upstream failure and recovers on the next request", async () => {
    let fail = true
    const server = await startMissionViewer({ port: 0, readState: async () => {
      if (fail) throw new Error("offline")
      return Response.json({ version: 1, teams: [] })
    } })
    servers.push(server)
    const failed = await fetch(`${server.url}/api/snapshot`)
    expect(failed.status).toBe(502)
    expect(((await failed.json()) as { error: string }).error).toContain("offline")
    fail = false
    expect((await fetch(`${server.url}/api/snapshot`)).status).toBe(200)
  })

  test("rejects incompatible upstream snapshots", async () => {
    const server = await startMissionViewer({ port: 0, readState: async () => Response.json({ version: 50, teams: [] }) })
    servers.push(server)
    expect((await fetch(`${server.url}/api/snapshot`)).status).toBe(502)
  })

  test("replays a captured snapshot without any upstream request", async () => {
    const server = await startMissionViewer({ port: 0,
      snapshot: { state: { version: 1, teams: [] }, observedAt: 1234 },
      readState: async () => { throw new Error("Must not contact the live campaign") },
    })
    servers.push(server)
    const body = await (await fetch(`${server.url}/api/snapshot`)).json() as MissionSnapshot & { frozen: boolean }
    expect(body.observedAt).toBe(1234)
    expect(body.frozen).toBe(true)
  })

  test("requires a local source and never binds to the active dashboard port", async () => {
    for (const source of ["https://example.com", "http://example.com", "http://user:secret@localhost:4747", "http://localhost:4747/command", "http://localhost:4747/?x=1"]) {
      await expect(startMissionViewer({ source, port: 0 })).rejects.toThrow("source")
    }
    await expect(startMissionViewer({ source: "http://127.0.0.1:4747", port: 4747 })).rejects.toThrow("port")
  })

  test("returns native origin names and exact boundaries for known mission members", async () => {
    const reads: string[] = []
    const server = await startMissionViewer({ port: 0,
      readState: async () => Response.json(lineageState),
      readNativeSession: async id => { reads.push(id); return nativeSession(id) },
    })
    servers.push(server)
    const response = await fetch(`${server.url}/api/lineage?session=ses_author&session=ses_author`)
    expect(response.status).toBe(200)
    const body = await response.json() as LineageResponse
    expect(body.lineage.ses_author).toEqual({ kind: "fork", sourceName: "discovery", sourceSessionId: "ses_source",
      boundary: { type: "before", messageId: "msg_boundary" } })
    expect(reads).toEqual(["ses_author"])
  })

  test("rejects arbitrary sessions, extra parameters and mutation requests", async () => {
    let reads = 0
    const server = await startMissionViewer({ port: 0,
      readState: async () => Response.json(lineageState),
      readNativeSession: async id => { reads++; return nativeSession(id) },
    })
    servers.push(server)
    expect((await fetch(`${server.url}/api/lineage?session=ses_unrelated`)).status).toBe(404)
    expect((await fetch(`${server.url}/api/lineage?session=../stop`)).status).toBe(400)
    expect((await fetch(`${server.url}/api/lineage?session=ses_author&url=anything`)).status).toBe(400)
    expect((await fetch(`${server.url}/api/lineage?session=ses_author`, { method: "POST" })).status).toBe(405)
    expect(reads).toBe(0)
  })

  test("keeps unavailable provenance distinct from confirmed absence of a native fork", async () => {
    const server = await startMissionViewer({ port: 0,
      readState: async () => Response.json(lineageState),
      readNativeSession: async id => { if (id === "ses_author") throw new Error("private transport detail"); return nativeSession(id) },
    })
    servers.push(server)
    const body = await (await fetch(`${server.url}/api/lineage?session=ses_author&session=ses_source`)).json() as LineageResponse
    expect(body.lineage.ses_author).toEqual({ kind: "unavailable", reason: "native-unavailable" })
    expect(body.lineage.ses_source).toEqual({ kind: "unforked" })
    expect(JSON.stringify(body)).not.toContain("private transport")
  })

  test("never queries current sessions when replaying an older snapshot", async () => {
    let reads = 0
    const server = await startMissionViewer({ port: 0, snapshot: { state: lineageState, observedAt: 123 },
      readNativeSession: async id => { reads++; return nativeSession(id) },
    })
    servers.push(server)
    const body = await (await fetch(`${server.url}/api/lineage?session=ses_author`)).json() as LineageResponse
    expect(body.lineage.ses_author).toEqual({ kind: "unavailable", reason: "snapshot-not-recorded" })
    expect(reads).toBe(0)
  })

  test("can name a verified source outside the current graph", async () => {
    const state = structuredClone(lineageState)
    state.teams[0]!.members = state.teams[0]!.members.slice(0, 1)
    const server = await startMissionViewer({ port: 0,
      readState: async () => Response.json(state),
      readNativeSession: async id => id === "ses_source" ? { sessionId: id, title: "External factual context", fork: null } : nativeSession(id),
    })
    servers.push(server)
    const body = await (await fetch(`${server.url}/api/lineage?session=ses_author`)).json() as LineageResponse
    expect(body.lineage.ses_author?.sourceName).toBe("External factual context")
  })
})
