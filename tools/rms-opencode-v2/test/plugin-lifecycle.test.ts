/** Strict subset fixture; not a native plugin-loading proof. */
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import plugin, { setupRmsPlugin, type RmsPluginContext } from "../src/plugin"
const codec = { sha256: (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex") }
const caps = { maxRequestImageUtf8Bytes: 10000, maxResponseImageUtf8Bytes: 10000 }
const scope = { missionId: "m", rootLineageId: "r", parentSessionId: "p", projectRef: "project", generationId: "g" }
test("setup selects the public definition without invoking any RPC or inventing a scope", async () => {
  let selected = 0, calls = 0
  const rpc: RmsPluginContext["rpc"] = definition => {
    selected++
    expect(definition).toBe(ExecutionRpcV2)
    const method = async () => { calls++; throw new Error("method must not run during setup") }
    return { capabilities: method, submit: method, observe: method, reconcile: method, control: method }
  }
  const factory = setupRmsPlugin({ rpc })
  expect(plugin.id).toBe("rms-opencode-v2")
  expect(selected).toBe(1); expect(calls).toBe(0)
  const port = factory.createPort(scope, codec, caps)
  expect(calls).toBe(0)
  factory.dispose(); factory.dispose()
  expect(() => factory.createPort(scope, codec, caps)).toThrow("disposed")
  await expect(port.capabilities()).rejects.toThrow("disposed")
  expect(calls).toBe(0)
})
test("subclient creation failures are not swallowed", () => {
  const failure = new Error("SDK client unavailable")
  const rpc: RmsPluginContext["rpc"] = () => { throw failure }
  expect(() => setupRmsPlugin({ rpc })).toThrow("SDK client unavailable")
})
