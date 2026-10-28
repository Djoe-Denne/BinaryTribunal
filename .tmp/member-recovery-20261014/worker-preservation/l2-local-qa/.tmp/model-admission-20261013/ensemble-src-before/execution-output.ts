import type { ExecutionModel } from "./execution-rpc"
import { createHash } from "node:crypto"

/** Strict Responses output contract. */
export interface ExecutionOutput { mode: "json_schema"; strict: true; name: string; schema: Record<string, unknown>; schemaSha256: string; route: "openai-responses-v1" }
/** Canonical value and public native provenance. */
export interface ExecutionStructuredResult { value: unknown; sha256: string; schemaSha256: string; native: { sessionId: string; messageID: string; model: ExecutionModel; profile: string } }
/** No request content or credentials are retained in transport witnesses. */
export interface ExecutionOutputWitness { executionId: string; sessionId: string; transport: "http" | "websocket"; schemaSha256: string; requestBodySha256: string; endpoint: string; model: ExecutionModel; time: number }

/** Bounded canonical JSON, shared by the idempotency and structured-value hashes. */
export function canonicalExecutionJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalExecutionJson).join(",")}]`
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalExecutionJson((value as Record<string, unknown>)[k])}`).join(",")}}`
  return JSON.stringify(value) ?? "null"
}
/** SHA256 over recursively key-sorted JSON; array order remains significant. */
export function executionJsonSha256(value: unknown): string { return rawHash(canonicalExecutionJson(value)) }
function rawHash(value: string): string { return createHash("sha256").update(value).digest("hex") }
function reject(message: string): never { throw new Error(`strict output: ${message}`) }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject("expected JSON object")
  return value as Record<string, unknown>
}
function jsonBudget(value: unknown, bytes: number): void {
  let nodes = 0
  const seen = new Set<unknown>()
  const visit = (v: unknown, depth: number): void => {
    if (++nodes > 200000 || depth > 64) reject("JSON complexity limit")
    if (v === null || typeof v === "boolean" || typeof v === "string") return
    if (typeof v === "number" && Number.isFinite(v)) return
    if (typeof v !== "object" || !v || seen.has(v)) reject("non-JSON value")
    if (!Array.isArray(v) && ![Object.prototype, null].includes(Object.getPrototypeOf(v))) reject("non-JSON object")
    seen.add(v)
    Object.values(v).forEach(x => { visit(x, depth + 1) })
    seen.delete(v)
  }
  visit(value, 0)
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > bytes) reject("JSON byte limit")
}
const scalarTypes = ["string", "integer", "number", "boolean", "object", "array", "null"]
function checkSchema(schema: Record<string, unknown>): void {
  jsonBudget(schema, 65536)
  let nodes = 0, properties = 0
  const visit = (raw: unknown, depth: number): void => {
    const s = object(raw)
    if (++nodes > 512 || depth > 16) reject("schema complexity limit")
    if (s.description !== undefined && typeof s.description !== "string") reject("invalid description")
    if (s.anyOf !== undefined) {
      if (depth === 0 || Object.keys(s).some(k => !["anyOf", "description"].includes(k)) || !Array.isArray(s.anyOf) || s.anyOf.length < 1 || s.anyOf.length > 8) reject("invalid anyOf")
      s.anyOf.forEach(child => { visit(child, depth + 1) }); return
    }
    const types = Array.isArray(s.type) ? s.type : [s.type]
    if (types.some(t => typeof t !== "string" || !scalarTypes.includes(t)) || (Array.isArray(s.type) && (types.length !== 2 || new Set(types).size !== 2 || !types.includes("null")))) reject("invalid type")
    if (depth === 0 && s.type !== "object") reject("root must be a non-nullable object")
    const type = types.find(t => t !== "null") ?? "null"
    const keywords: Record<string, string[]> = { object: ["properties", "required", "additionalProperties"], array: ["items", "minItems", "maxItems"], string: ["minLength", "maxLength"], number: ["minimum", "maximum"], integer: ["minimum", "maximum"] }
    const allowed = ["type", "description", "enum", "const", ...(keywords[String(type)] ?? [])]
    if (Object.keys(s).some(k => !allowed.includes(k))) reject("unsupported schema keyword")
    if (s.enum !== undefined && (!Array.isArray(s.enum) || !s.enum.length || s.enum.length > 128 || new Set(s.enum.map(canonicalExecutionJson)).size !== s.enum.length)) reject("invalid enum")
    if (type === "object") {
      const props = object(s.properties), keys = Object.keys(props)
      properties += keys.length
      if (properties > 256 || keys.some(k => k.length > 256) || s.additionalProperties !== false || !Array.isArray(s.required) || s.required.length !== keys.length || new Set(s.required).size !== keys.length || s.required.some(k => typeof k !== "string" || !Object.hasOwn(props, k))) reject("objects must be closed with every property required")
      Object.values(props).forEach(child => { visit(child, depth + 1) })
    }
    if (type === "array") visit(s.items, depth + 1)
    for (const [min, max, bound] of [["minItems", "maxItems", 10000], ["minLength", "maxLength", 1000000]] as const) {
      for (const key of [min, max]) if (s[key] !== undefined && (typeof s[key] !== "number" || !Number.isSafeInteger(s[key]) || Number(s[key]) < 0 || Number(s[key]) > bound)) reject("invalid size constraint")
      if (s[min] !== undefined && s[max] !== undefined && Number(s[min]) > Number(s[max])) reject("inverted size constraint")
    }
    for (const key of ["minimum", "maximum"]) if (s[key] !== undefined && (typeof s[key] !== "number" || !Number.isFinite(s[key]))) reject("invalid numeric constraint")
    if (s.minimum !== undefined && s.maximum !== undefined && Number(s.minimum) > Number(s.maximum)) reject("inverted numeric constraint")
  }
  visit(schema, 0)
}

/** Validate the shared bounded, closed JSON-schema subset without a provider route. */
export function validateExecutionSchema(schema: Record<string, unknown>): void { checkSchema(schema) }

/** Validate a bounded JSON value before hashing or retaining it. */
export function validateExecutionJson(value: unknown, bytes: number): void { jsonBudget(value, bytes) }

/** Validate an untrusted schema declaration. */
export function parseExecutionOutput(value: unknown): ExecutionOutput {
  const v = object(value)
  if (Object.keys(v).some(k => !["mode", "strict", "name", "schema", "schemaSha256", "route"].includes(k)) || v.mode !== "json_schema" || v.strict !== true || v.route !== "openai-responses-v1" || typeof v.name !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(v.name)) reject("invalid contract, name or route")
  const schema = object(v.schema)
  checkSchema(schema)
  if (typeof v.schemaSha256 !== "string" || !/^[a-f0-9]{64}$/.test(v.schemaSha256) || v.schemaSha256 !== executionJsonSha256(schema)) reject("schemaSha256 mismatch")
  return structuredClone(v) as unknown as ExecutionOutput
}
function validateNode(s: Record<string, unknown>, v: unknown): void {
  if (Array.isArray(s.anyOf)) {
    if (!s.anyOf.some(child => { try { validateNode(object(child), v); return true } catch { return false } })) reject("value does not match anyOf")
    return
  }
  const types = Array.isArray(s.type) ? s.type : [s.type]
  const matches = types.some(t => t === "null" ? v === null : t === "object" ? !!v && typeof v === "object" && !Array.isArray(v) : t === "array" ? Array.isArray(v) : t === "integer" ? typeof v === "number" && Number.isInteger(v) : typeof v === t)
  if (!matches) reject("value type mismatch")
  if (Array.isArray(s.enum) && !s.enum.some(x => canonicalExecutionJson(x) === canonicalExecutionJson(v))) reject("value enum mismatch")
  if (Object.hasOwn(s, "const") && canonicalExecutionJson(s.const) !== canonicalExecutionJson(v)) reject("value const mismatch")
  if (v === null) return
  if (Array.isArray(v)) {
    if ((s.minItems !== undefined && v.length < Number(s.minItems)) || (s.maxItems !== undefined && v.length > Number(s.maxItems))) reject("value array size")
    v.forEach(child => { validateNode(object(s.items), child) }); return
  }
  if (typeof v === "object") {
    const props = object(s.properties), value = object(v)
    if (Object.keys(value).some(k => !Object.hasOwn(props, k)) || Object.keys(props).some(k => !Object.hasOwn(value, k))) reject("value object properties")
    Object.entries(props).forEach(([k, child]) => { validateNode(object(child), value[k]) }); return
  }
  if (typeof v === "string" && ((s.minLength !== undefined && [...v].length < Number(s.minLength)) || (s.maxLength !== undefined && [...v].length > Number(s.maxLength)))) reject("value string size")
  if (typeof v === "number" && (!Number.isFinite(v) || (s.minimum !== undefined && v < Number(s.minimum)) || (s.maximum !== undefined && v > Number(s.maximum)))) reject("value numeric constraint")
}
/** Validate a parsed JSON value against the admitted subset. */
export function validateExecutionValue(schema: Record<string, unknown>, value: unknown): void { checkSchema(schema); jsonBudget(value, 2097152); validateNode(schema, value) }

/** Validate the exact public Responses endpoints, including scheme and path. */
export function checkOutputEndpoint(endpoint: string, transport: "http" | "websocket"): void {
  const scheme = transport === "http" ? "https" : "wss"
  if (![`${scheme}://api.openai.com/v1/responses`, `${scheme}://chatgpt.com/backend-api/codex/responses`].includes(endpoint)) reject("unsupported transport endpoint")
}
function inject(output: ExecutionOutput, model: ExecutionModel, body: unknown): Record<string, unknown> {
  const data = object(body)
  if (model.providerID !== "openai" || data.model !== model.id) reject("request model mismatch")
  if (Object.hasOwn(data, "response_format")) reject("conflicting response_format")
  const text = data.text === undefined ? {} : object(data.text)
  const format = { type: "json_schema", name: output.name, schema: output.schema, strict: true }
  if (text.format !== undefined && canonicalExecutionJson(text.format) !== canonicalExecutionJson(format)) reject("conflicting text.format")
  return { ...data, text: { ...text, format } }
}
/** Rewrite an allowlisted Responses request. */
export async function injectOutputHttp(output: ExecutionOutput, model: ExecutionModel, request: Request): Promise<{ request: Request; requestBodySha256: string }> {
  checkOutputEndpoint(request.url, "http")
  if (request.method !== "POST" || request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json" || request.headers.has("content-encoding")) reject("expected JSON POST")
  const raw = await request.clone().text()
  if (Buffer.byteLength(raw) > 16777216) reject("request body size")
  let data: unknown
  try { data = JSON.parse(raw) } catch { reject("invalid request JSON") }
  const body = JSON.stringify(inject(output, model, data)), headers = new Headers(request.headers)
  headers.delete("content-length")
  return { request: new Request(request, { headers, body, redirect: "error" }), requestBodySha256: rawHash(body) }
}
/** Rewrite an outbound Responses create frame. */
export function injectOutputFrame(output: ExecutionOutput, model: ExecutionModel, frame: string): { frame: string; requestBodySha256: string } {
  if (typeof frame !== "string" || Buffer.byteLength(frame) > 16777216) reject("invalid outbound frame")
  let body: Record<string, unknown>
  try { body = object(JSON.parse(frame)) } catch { reject("invalid outbound JSON frame") }
  if (body.type !== "response.create") reject("unsupported outbound frame type")
  const result = JSON.stringify(inject(output, model, body))
  return { frame: result, requestBodySha256: rawHash(result) }
}

/** Reject provider refusals/errors before the native driver can flatten them to text. */
export function checkOutputResponse(value: unknown): { kind: "created" | "completed"; id: string } | undefined {
  const data = object(value), type = String(data.type ?? "")
  if (type === "error" || /^(response\.(refusal\.|failed$|incomplete$))/.test(type) || (data.error !== undefined && data.error !== null)) reject("provider refused or failed strict response")
  const response = data.response === undefined ? data : object(data.response)
  if (["failed", "incomplete", "cancelled"].includes(String(response.status)) || (response.error !== undefined && response.error !== null) || (response.incomplete_details !== undefined && response.incomplete_details !== null)) reject("incomplete strict response")
  const refusal = (v: unknown): boolean => {
    if (!v || typeof v !== "object") return false
    if (Array.isArray(v)) return v.some(refusal)
    const item = v as Record<string, unknown>
    return item.type === "refusal" || item.refusal !== undefined || (Array.isArray(item.content) && item.content.some(refusal))
  }
  if (refusal(data.item) || refusal(data.part) || refusal(response.output)) reject("provider refusal")
  if (type === "response.created" || type === "response.completed" || (data.response === undefined && !type && response.status === "completed")) {
    if (typeof response.id !== "string" || !response.id || (type !== "response.created" && response.status !== "completed")) reject("invalid response completion identity")
    return { kind: type === "response.created" ? "created" : "completed", id: response.id }
  }
}

/** Inspect JSON/SSE responses without buffering or logging the native transcript. */
export function guardOutputResponse(response: Response, failed: () => void, completed?: () => void): Response {
  if (!response.ok || !response.body) { failed(); reject("HTTP strict response failed") }
  const mime = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
  if (mime !== "application/json" && mime !== "text/event-stream") { failed(); reject("unsupported response encoding") }
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let buffer = "", data: string[] = [], total = 0
  const inspect = (text: string): void => { if (text && text !== "[DONE]" && checkOutputResponse(JSON.parse(text))?.kind === "completed") completed?.() }
  const lines = (final: boolean): void => {
    const parts = buffer.split(/\r?\n/); buffer = final ? "" : parts.pop() ?? ""
    for (const line of parts) {
      if (!line) { if (data.length) inspect(data.join("\n")); data = [] }
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart())
    }
    if (final && data.length) { inspect(data.join("\n")); data = [] }
  }
  const body = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      try {
        total += chunk.byteLength
        if (total > 33554432) reject("strict response byte limit")
        buffer += decoder.decode(chunk, { stream: true })
        if (mime === "text/event-stream") lines(false)
        if (buffer.length > 2097152) reject("strict response frame limit")
        controller.enqueue(chunk)
      } catch { failed(); reject("invalid/refused strict response stream") }
    },
    flush() {
      try { buffer += decoder.decode(); if (mime === "text/event-stream") lines(true); else inspect(buffer) }
      catch { failed(); reject("invalid/refused strict response stream") }
    },
  }))
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
}
/** Select only the terminal reply to the owned prompt. */
export function captureExecutionOutput(context: unknown[], input: { sessionID: string; agent: string; model: ExecutionModel; marker: string; output: ExecutionOutput; messageId?: string }): { messageId: string; result: ExecutionStructuredResult } | undefined {
  if (!Array.isArray(context) || context.length > 10000) reject("invalid public context")
  const messages = context.map(object)
  const own = messages.filter(m => m.type === "user" && m.metadata && object(m.metadata)["ensemble.execution.intent"] === input.marker)
  const prompt = own[0]
  if (!prompt) return undefined
  if (own.length !== 1 || typeof prompt.id !== "string" || !prompt.id || (input.messageId !== undefined && prompt.id !== input.messageId)) reject("ambiguous owned prompt receipt")
  if (messages.some(m => m.type === "user" && m !== prompt)) reject("fresh strict session contains another prompt")
  const after = messages.slice(messages.indexOf(prompt) + 1)
  if (after.some(m => ["synthetic", "shell", "compaction"].includes(String(m.type)))) reject("owned prompt was superseded by another context turn")
  const message = after.findLast(m => m.type === "assistant")
  if (!message) return undefined
  if (message.agent !== input.agent || canonicalExecutionJson(message.model) !== canonicalExecutionJson(input.model) || (message.sessionID !== undefined && message.sessionID !== input.sessionID) || typeof message.id !== "string" || !message.id || message.id === prompt.id) reject("terminal native identity mismatch")
  if (message.error != null || message.refusal != null || (typeof message.rawFinish === "string" && /refus|filter|incomplete|length|error/i.test(message.rawFinish))) reject("terminal native refusal/error")
  if (message.finish === undefined || message.finish === "tool-calls") return undefined
  if (message.finish !== "stop" || !message.time || typeof object(message.time).completed !== "number" || !Number.isFinite(object(message.time).completed)) reject("non-terminal or truncated response")
  if (!Array.isArray(message.content) || !message.content.length) reject("missing terminal content")
  const parts = message.content.map(object)
  if (parts.some(p => !["text", "reasoning"].includes(String(p.type)) || p.refusal != null || p.truncated === true || (p.type === "text" && typeof p.text !== "string"))) reject("unsupported terminal content")
  const text = parts.filter(p => p.type === "text").map(p => p.text).join("")
  if (!text.trim() || Buffer.byteLength(text) > 2097152) reject("missing or oversized terminal JSON")
  let value: unknown
  try { value = JSON.parse(text) } catch { reject("terminal text is not complete JSON") }
  validateExecutionValue(input.output.schema, value)
  return { messageId: prompt.id, result: { value, sha256: executionJsonSha256(value), schemaSha256: input.output.schemaSha256, native: { sessionId: input.sessionID, messageID: message.id, model: structuredClone(input.model), profile: input.agent } } }
}
