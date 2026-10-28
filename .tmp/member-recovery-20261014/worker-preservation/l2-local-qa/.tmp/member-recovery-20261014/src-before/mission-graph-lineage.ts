import { discoverV2HttpBridge } from "./v2-http-bridge"

export interface NativeSessionInfo {
  sessionId: string
  title: string
  fork: {
    sourceSessionId: string
    boundary: { type: "before" | "through"; messageId: string }
  } | null
}

export type NativeSessionReader = (sessionId: string) => Promise<NativeSessionInfo>

export type SessionLineage =
  | { kind: "fork"; sourceSessionId: string; sourceName: string; boundary: { type: "before" | "through"; messageId: string } }
  | { kind: "unforked" }
  | { kind: "unavailable"; reason: "snapshot-not-recorded" | "native-unavailable" }

export interface NativeSessionReaderOptions {
  discover?: () => Promise<{ apiUrl: string; authorization?: string } | undefined>
  request?: (url: string, init: RequestInit) => Promise<Response>
  now?: () => number
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid session metadata")
  return value as Record<string, unknown>
}

function parseSession(value: unknown, sessionId: string): NativeSessionInfo {
  const data = object(object(value).data)
  if (data.id !== sessionId) throw new Error("Mismatched session metadata identity")
  const title = typeof data.title === "string" ? data.title : ""
  if (data.fork === undefined || data.fork === null) return { sessionId, title, fork: null }
  const fork = object(data.fork)
  const boundary = object(fork.boundary)
  if (typeof fork.sessionID !== "string" || !/^ses[A-Za-z0-9_-]+$/.test(fork.sessionID)
    || fork.sessionID === sessionId || !["before", "through"].includes(String(boundary.type))
    || typeof boundary.messageID !== "string" || !boundary.messageID) {
    throw new Error("Invalid native fork metadata")
  }
  return {
    sessionId, title,
    fork: { sourceSessionId: fork.sessionID, boundary: {
      type: boundary.type as "before" | "through", messageId: boundary.messageID,
    } },
  }
}

/** Discover only an existing service; cache provenance and limit native GETs to two at a time. */
export function createNativeSessionReader(options: NativeSessionReaderOptions = {}): NativeSessionReader {
  const discover = options.discover ?? discoverV2HttpBridge
  const request = options.request ?? fetch
  const now = options.now ?? Date.now
  const cache = new Map<string, { expires: number; value: Promise<NativeSessionInfo> }>()
  let connection: { expires: number; value: ReturnType<typeof discover> } | undefined
  let active = 0
  const waiters: Array<() => void> = []
  const acquire = (): Promise<void> => {
    if (active < 2) { active++; return Promise.resolve() }
    return new Promise(resolve => waiters.push(resolve))
  }
  const release = () => {
    const next = waiters.shift()
    if (next) next()
    else active--
  }
  const load = async (sessionId: string): Promise<NativeSessionInfo> => {
    await acquire()
    try {
      if (!connection || now() >= connection.expires) connection = { expires: now() + 5000, value: discover() }
      const endpoint = await connection.value
      if (!endpoint) throw new Error("Existing OpenCode service unavailable")
      const url = new URL(endpoint.apiUrl)
      if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
        || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        throw new Error("Native metadata requires an existing local service")
      }
      const headers: Record<string, string> = { Accept: "application/json" }
      if (endpoint.authorization) headers.authorization = endpoint.authorization
      const response = await request(new URL(`/api/session/${encodeURIComponent(sessionId)}`, url).href, {
        method: "GET", headers, redirect: "error", signal: AbortSignal.timeout(3000),
      })
      if (!response.ok) throw new Error(`Native session metadata HTTP ${response.status}`)
      return parseSession(await response.json(), sessionId)
    } finally {
      release()
    }
  }
  return async sessionId => {
    if (!/^ses[A-Za-z0-9_-]+$/.test(sessionId)) throw new Error("Invalid session ID")
    const previous = cache.get(sessionId)
    if (previous && now() < previous.expires) return previous.value
    if (cache.size >= 2048) {
      const oldest = cache.keys().next().value
      if (oldest) cache.delete(oldest)
    }
    const value = load(sessionId).catch(error => {
      const entry = cache.get(sessionId)
      if (entry?.value === value) entry.expires = now() + 5000
      throw error
    })
    cache.set(sessionId, { expires: now() + 600_000, value })
    return value
  }
}
