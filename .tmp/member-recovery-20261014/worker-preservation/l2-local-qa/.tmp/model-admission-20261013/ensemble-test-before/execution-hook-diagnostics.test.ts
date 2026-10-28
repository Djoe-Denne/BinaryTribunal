import { expect, test } from "bun:test"
import { safeExecutionHookShape } from "../src/execution-hook-diagnostics"

test("trusted hook diagnostics retain safe identity/resource shape, never input/results/secrets", () => {
  const safe = safeExecutionHookShape({ sessionID: "ses_worker", agent: "fixture", action: "read", resources: ["C:/fixture/input.asm"], effect: "allow", source: { type: "tool", messageID: "msg", id: "call" }, input: { text: "TOP-SECRET" }, result: { content: "TOP-SECRET" }, metadata: { authorization: "TOP-SECRET" } })
  expect(safe).toMatchObject({ sessionID: "ses_worker", action: "read", resources: ["C:/fixture/input.asm"], source: { type: "tool", messageID: "msg", id: "call" } })
  expect(JSON.stringify(safe)).not.toContain("TOP-SECRET")
  expect(safeExecutionHookShape({ action: "shell", resources: ["curl --header Authorization:SECRET"] }).resources).toEqual(["<redacted-nonpath-resource>"])
})

test("SDK-shaped prototype properties are read explicitly, not discarded by object spread", () => {
  const event = Object.create({ sessionID: "ses_worker", agent: "fixture", action: "read", resources: ["C:/fixture/input.asm"], effect: "allow", source: { type: "tool", messageID: "msg", id: "call" } })
  expect(safeExecutionHookShape(event).sessionID).toBe("ses_worker")
})
