import { describe, expect, test } from "bun:test"
import { createNativeSessionReader } from "../src/mission-graph-lineage"

const discover = async () => ({ apiUrl: "http://127.0.0.1:45678", authorization: "Basic test-credential" })
const session = (id: string) => ({ id, title: "Factual discovery", fork: {
  sessionID: "ses_source", boundary: { type: "before", messageID: "msg_boundary" },
} })

describe("native fork provenance", () => {
  test("uses the explicit native fork and its boundary with authenticated GET only", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const read = createNativeSessionReader({ discover, request: async (url, init) => {
      calls.push({ url, init })
      return Response.json({ data: session("ses_child") })
    } })
    expect(await read("ses_child")).toEqual({ sessionId: "ses_child", title: "Factual discovery", fork: {
      sourceSessionId: "ses_source", boundary: { type: "before", messageId: "msg_boundary" },
    } })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe("http://127.0.0.1:45678/api/session/ses_child")
    expect(calls[0]?.init.method).toBe("GET")
    expect(calls[0]?.init.redirect).toBe("error")
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Basic test-credential")
  })

  test("does not treat a delegation parent or a fork-looking title as native lineage", async () => {
    const read = createNativeSessionReader({ discover, request: async () => Response.json({ data: {
      id: "ses_child", parentID: "ses_parent", title: "Discovery (fork #1)",
    } }) })
    expect((await read("ses_child")).fork).toBeNull()
  })

  test("preserves inclusive through-message fork boundaries", async () => {
    const read = createNativeSessionReader({ discover, request: async () => Response.json({ data: {
      ...session("ses_child"), fork: { sessionID: "ses_source", boundary: { type: "through", messageID: "msg_last" } },
    } }) })
    expect((await read("ses_child")).fork?.boundary).toEqual({ type: "through", messageId: "msg_last" })
  })

  test("coalesces requests and reuses metadata instead of rereading it on every refresh", async () => {
    let calls = 0
    let discoveries = 0
    const read = createNativeSessionReader({ discover: async () => { discoveries++; return discover() }, request: async () => {
      calls++
      return Response.json({ data: session("ses_child") })
    } })
    const results = await Promise.all([read("ses_child"), read("ses_child"), read("ses_child")])
    await read("ses_child")
    expect(results.every(result => result.fork?.sourceSessionId === "ses_source")).toBe(true)
    expect(calls).toBe(1)
    expect(discoveries).toBe(1)
  })

  test("limits metadata reads to two concurrent requests", async () => {
    let concurrent = 0
    let maximum = 0
    const read = createNativeSessionReader({ discover, request: async url => {
      concurrent++
      maximum = Math.max(maximum, concurrent)
      await new Promise<void>(resolve => setTimeout(resolve, 5))
      concurrent--
      return Response.json({ data: session(url.split("/").at(-1) ?? "") })
    } })
    await Promise.all(Array.from({ length: 8 }, (_, i) => read(`ses_child_${i}`)))
    expect(maximum).toBeLessThanOrEqual(2)
  })

  test("leaves a stopped service stopped and caches its unavailability briefly", async () => {
    let discoveries = 0
    let calls = 0
    const read = createNativeSessionReader({ discover: async () => { discoveries++; return undefined }, request: async () => {
      calls++
      return Response.json({})
    } })
    await expect(read("ses_child")).rejects.toThrow("unavailable")
    await expect(read("ses_child")).rejects.toThrow("unavailable")
    expect(discoveries).toBe(1)
    expect(calls).toBe(0)
  })

  test("retries failed metadata reads after the short error cache expires", async () => {
    let now = 0
    let fail = true
    const read = createNativeSessionReader({ discover, now: () => now, request: async () => fail
      ? new Response("offline", { status: 503 }) : Response.json({ data: session("ses_child") }) })
    await expect(read("ses_child")).rejects.toThrow("503")
    fail = false
    now = 6000
    expect((await read("ses_child")).fork?.sourceSessionId).toBe("ses_source")
  })

  test("rejects malformed lineage and mismatched identities instead of inventing a fresh session", async () => {
    for (const data of [
      { ...session("ses_other") },
      { ...session("ses_child"), fork: { sessionID: "ses_source" } },
      { ...session("ses_child"), fork: { sessionID: "ses_source", boundary: { type: "guessed", messageID: "msg_1" } } },
    ]) {
      const read = createNativeSessionReader({ discover, request: async () => Response.json({ data }) })
      await expect(read("ses_child")).rejects.toThrow("metadata")
    }
  })

  test("rejects arbitrary paths and non-local discovered endpoints", async () => {
    const read = createNativeSessionReader({ discover, request: async () => { throw new Error("Must not request") } })
    await expect(read("../stop")).rejects.toThrow("session ID")
    const remote = createNativeSessionReader({ discover: async () => ({ apiUrl: "http://example.com" }) })
    await expect(remote("ses_child")).rejects.toThrow("local")
  })
})
