import { expect, test } from "bun:test"
import { ExecutionRpc } from "../src/execution-rpc"
import { executionJsonSha256, parseExecutionOutput } from "../src/execution-output"

// Native attempt12 rejected RPC schema.pattern before admission. The plugin SDK's
// generic Effect importer alone accepts it and does not reproduce the service policy.
test("public RPC envelopes contain no regex keywords rejected by native safe validation", () => {
  const inspect = (value: unknown): void => {
    if (!value || typeof value !== "object") return
    if (Array.isArray(value)) { for (const child of value) inspect(child); return }
    expect(Object.hasOwn(value, "pattern")).toBe(false)
    expect(Object.hasOwn(value, "patternProperties")).toBe(false)
    for (const child of Object.values(value)) inspect(child)
  }
  for (const method of Object.values(ExecutionRpc.methods)) inspect(method.input)
})

test("strict admission still enforces names and exact schema hashes without RPC regex keywords", () => {
  const schema = { type: "object", properties: { value: { type: "string" } }, required: ["value"], additionalProperties: false }
  const output = { mode: "json_schema", strict: true, name: "safe_name", schema, schemaSha256: executionJsonSha256(schema), route: "openai-responses-v1" }
  expect(parseExecutionOutput(output).name).toBe("safe_name")
  expect(() => parseExecutionOutput({ ...output, name: "unsafe name" })).toThrow()
  expect(() => parseExecutionOutput({ ...output, schemaSha256: "g".repeat(64) })).toThrow()
  expect(() => parseExecutionOutput({ ...output, schemaSha256: "0".repeat(64) })).toThrow()
})
