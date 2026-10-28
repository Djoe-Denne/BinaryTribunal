import { expect, test } from "bun:test"
import { ExecutionRpc } from "../src/execution-rpc"

test("portable versioned contract exposes authenticated methods, no caller session authority", () => {
  expect(ExecutionRpc.id).toBe("ensemble.execution.v1")
  expect(Object.keys(ExecutionRpc.methods).sort()).toEqual(["capabilities", "control", "ensureTeam", "inspect", "replay", "snapshot", "stop", "submit"])
  const input = ExecutionRpc.methods.submit.input as { required?: string[]; properties?: Record<string, unknown> }
  expect(input.required).toContain("principalId")
  expect(input.required).toContain("token")
  expect(input.properties).not.toHaveProperty("sessionID")
})
