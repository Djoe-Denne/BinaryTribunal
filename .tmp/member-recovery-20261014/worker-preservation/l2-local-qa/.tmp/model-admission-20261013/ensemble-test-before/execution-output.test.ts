import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { parseExecutionOutput, validateExecutionValue, injectOutputHttp, injectOutputFrame, captureExecutionOutput } from "../src/execution-output"

const hash = (v: unknown): string => createHash("sha256").update(canonical(v)).digest("hex")
function canonical(v: unknown): string { return Array.isArray(v) ? `[${v.map(canonical).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}` : JSON.stringify(v) }
const schema = { type: "object", properties: { answer: { type: "string", minLength: 1 }, count: { type: "integer", minimum: 0 } }, required: ["answer", "count"], additionalProperties: false }
const output = { mode: "json_schema" as const, strict: true as const, name: "result", schema, schemaSha256: hash(schema), route: "openai-responses-v1" as const }
const model = { providerID: "openai", id: "gpt-6-astra", variant: "high" }

describe("bounded strict output schema", () => {
  test("canonical schema hash, closed objects and value constraints", () => {
    expect(parseExecutionOutput(output)).toEqual(output)
    expect(() => validateExecutionValue(schema, { count: 1, answer: "yes" })).not.toThrow()
    for (const value of [{ count: 1.5, answer: "yes" }, { count: -1, answer: "yes" }, { count: 1, answer: "" }, { count: 1 }, { count: 1, answer: "yes", extra: true }]) expect(() => validateExecutionValue(schema, value)).toThrow()
    expect(() => parseExecutionOutput({ ...output, schemaSha256: "0".repeat(64) })).toThrow()
  })
  test.each(["$ref", "if", "then", "allOf", "pattern", "format", "unevaluatedProperties"])("unsupported %s is rejected, never ignored", keyword => {
    const bad = { ...schema, [keyword]: {} }
    expect(() => parseExecutionOutput({ ...output, schema: bad, schemaSha256: hash(bad) })).toThrow()
  })
  test("nested closure, required, bounds, keyword applicability and finite schema budget", () => {
    for (const bad of [{ ...schema, additionalProperties: true }, { ...schema, required: ["answer"] }, { ...schema, minLength: 1 }, { type: "array", items: { type: "string" } }, { ...schema, description: "x".repeat(70000) }, { ...schema, properties: { child: { type: "object", properties: {} } } }]) expect(() => parseExecutionOutput({ ...output, schema: bad, schemaSha256: hash(bad) })).toThrow()
    let deep: Record<string, unknown> = { type: "string" }
    for (let i = 0; i < 30; i++) deep = { type: "array", items: deep }
    const bad = { type: "object", properties: { deep }, required: ["deep"], additionalProperties: false }
    expect(() => parseExecutionOutput({ ...output, schema: bad, schemaSha256: hash(bad) })).toThrow()
  })
  test("nullable, anyOf, arrays, enum and const use the same value validator", () => {
    const s = { type: "object", properties: { a: { type: ["string", "null"], maxLength: 2 }, b: { type: "array", minItems: 1, maxItems: 2, items: { anyOf: [{ type: "boolean", const: true }, { type: "number", enum: [1, 2], maximum: 2 }] } } }, required: ["a", "b"], additionalProperties: false }
    expect(parseExecutionOutput({ ...output, schema: s, schemaSha256: hash(s) }).schema).toEqual(s)
    expect(() => validateExecutionValue(s, { a: null, b: [true, 2] })).not.toThrow()
    for (const v of [{ a: "long", b: [true] }, { a: "ok", b: [] }, { a: "ok", b: [false] }, { a: "ok", b: [3] }]) expect(() => validateExecutionValue(s, v)).toThrow()
  })
})

describe("Responses wire contract", () => {
  test.each(["https://api.openai.com/v1/responses", "https://chatgpt.com/backend-api/codex/responses"])("HTTP exact strict injection at %s", async endpoint => {
    const body = { model: model.id, input: [{ role: "user", content: "private prompt" }], tools: [{ type: "function", name: "read" }], text: { verbosity: "low" }, reasoning: { effort: "high" }, stream: true }
    const original = new Request(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: "secret", "x-keep": "yes" }, body: JSON.stringify(body) })
    const result = await injectOutputHttp(output, model, original)
    expect(await result.request.json()).toEqual({ ...body, text: { ...body.text, format: { type: "json_schema", name: output.name, schema, strict: true } } })
    expect(result.request.headers.get("authorization")).toBe("secret")
    expect(result.request.headers.get("x-keep")).toBe("yes")
    expect(await original.json()).toEqual(body)
    expect(result.requestBodySha256).toMatch(/^[a-f0-9]{64}$/)
  })
  test.each([
    { url: "https://example.com/v1/responses" }, { url: "https://api.openai.com/v1/responses?x=1" }, { url: "https://chatgpt.com/backend-api/codex" },
    { body: { model: "other" } }, { body: { model: model.id, response_format: { type: "json_object" } } }, { body: { model: model.id, text: { format: { type: "json_object" } } } }, { raw: "not json" }, { method: "PUT" }, { contentType: "text/plain" },
  ])("HTTP rejects unproven route/model/body/format %#", async (bad: { url?: string; body?: unknown; raw?: string; method?: string; contentType?: string }) => {
    const request = new Request(bad.url ?? "https://api.openai.com/v1/responses", { method: bad.method ?? "POST", headers: { "content-type": bad.contentType ?? "application/json" }, body: bad.raw ?? JSON.stringify(bad.body ?? { model: model.id }) })
    await expect(injectOutputHttp(output, model, request)).rejects.toThrow()
  })
  test("WS flat response.create preserves model, options and tools; unknown frames fail closed", () => {
    const body = { type: "response.create", model: model.id, input: [], tools: [], reasoning: { effort: "high" } }
    const result = injectOutputFrame(output, model, JSON.stringify(body))
    expect(JSON.parse(result.frame)).toEqual({ ...body, text: { format: { type: "json_schema", name: "result", schema, strict: true } } })
    for (const v of ["invalid", JSON.stringify({ type: "ping" }), JSON.stringify({ ...body, model: "other" })]) expect(() => injectOutputFrame(output, model, v)).toThrow()
  })
})

describe("owned terminal public context capture", () => {
  const user = { type: "user", id: "user-id", metadata: { "ensemble.execution.intent": "intent" } }
  const assistant = { type: "assistant", id: "assistant-id", agent: "explore", model, finish: "stop", time: { created: 10, completed: 20 }, content: [{ type: "text", text: '{"count":1,"answer":"ok"}' }] }
  const input = { sessionID: "owned", agent: "explore", model, marker: "intent", output }
  test("returns parsed value with canonical hash and native message provenance", () => {
    const captured = captureExecutionOutput([user, assistant], input)
    expect(captured?.result).toEqual({ value: { answer: "ok", count: 1 }, sha256: hash({ answer: "ok", count: 1 }), schemaSha256: output.schemaSha256, native: { sessionId: "owned", messageID: "assistant-id", profile: "explore", model } })
    expect(captured?.messageId).toBe("user-id")
  })
  test.each([
    { finish: "length" }, { finish: "content-filter" }, { error: { message: "failed" } }, { agent: "other" }, { model: { ...model, variant: "default" } },
    { content: [{ type: "refusal", text: '{"count":1,"answer":"ok"}' }] }, { content: [{ type: "tool" }] }, { content: [{ type: "text", text: '{"count":' }] }, { content: [{ type: "text", text: '{"count":1.5,"answer":"ok"}' }] },
  ])("invalid/truncated/refused/foreign capture %#", bad => {
    expect(() => captureExecutionOutput([user, { ...assistant, ...bad }], input)).toThrow()
  })
  test("old, absent, unfinished or another user response never becomes final", () => {
    expect(captureExecutionOutput([assistant, user], input)).toBeUndefined()
    expect(captureExecutionOutput([assistant], input)).toBeUndefined()
    expect(captureExecutionOutput([user], input)).toBeUndefined()
    expect(captureExecutionOutput([user, { ...assistant, finish: undefined, time: { created: 10 } }], input)).toBeUndefined()
    expect(() => captureExecutionOutput([user, { ...user, id: "foreign", metadata: {} }, assistant], input)).toThrow()
    expect(() => captureExecutionOutput([user, { type: "synthetic", id: "another-wake", text: "unrelated task" }, assistant], input)).toThrow()
  })
})
