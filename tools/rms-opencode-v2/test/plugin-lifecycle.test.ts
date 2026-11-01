/** Strict subset fixture; not a native plugin-loading proof. */
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import { captureExecutionRequestV2 } from "@hueyexe/opencode-ensemble/execution"
import { captureExecutionCommandV1, captureExecutionObservationV1 } from "../../ff8-harness/src/ports/execution"
import { ExecutionResponseNotProjected } from "../src/native-execution"
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
test("plugin lifetime signal is official RPC option; dispose aborts a late submit without claiming quiescence", async () => {
  const image = (utf8: string, domain: string) => { const bytes = new TextEncoder().encode(utf8); return { utf8, ref: { domain, byteLength: bytes.length, sha256: codec.sha256(bytes) } } }
  const evidence = { source: "fixture", recordId: "not-native", bytes: image("evidence", "execution-evidence-v1").ref }
  const command = captureExecutionCommandV1({ version: "rms-native-execution-port-v1", kind: "execute", identity: { missionId: "m", unitId: "u", subIntentId: "s", executionId: "e", generationId: "g", attemptId: "a", idempotencyKey: "key" }, fences: { family: 1, controller: 1 }, retainedInput: image("é\r\n😀", "rms-retained-input-v1"), proposedRuntimeInput: image("native prompt", "rms-proposed-runtime-input-v1"), expectations: { profile: "fixture", modelRef: { providerID: "fixture", id: "model", variant: "medium" }, context: { fresh: true, parentSessionId: null, independenceRef: evidence }, permissionsRef: evidence, policyRef: evidence }, captureCaps: { maxCommandImageUtf8Bytes: 50000, maxObservationImageUtf8Bytes: 50000, maxControlImageUtf8Bytes: 50000 } }, codec)
  const accepted = captureExecutionObservationV1(command, { version: "rms-native-execution-port-v1", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, sourceStreamId: "s", eventId: "e", sourceSequence: 1, evidenceRefs: [evidence], kind: "accepted", receiptRef: evidence }, codec)
  let calls = 0, settled = false, signal: AbortSignal | undefined
  let complete!: (value: unknown) => void
  const pending = new Promise<unknown>(resolve => { complete = resolve })
  let raw: unknown
  const factory = setupRmsPlugin({ rpc: () => ({
    capabilities: async (input, options) => {
      calls++; signal = options?.signal
      const request = captureExecutionRequestV2("capabilities", input, codec, caps)
      return { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", requestRef: request.image.ref, scope: request.value.scope, body: { version: "rms-native-execution-port-v1", operations: [], evidenceKinds: [], hostEvidenceRef: null } }
    },
    submit: async (input, options) => {
      calls++; expect(options?.signal).toBe(signal)
      const request = captureExecutionRequestV2("submit", input, codec, caps)
      raw = { protocol: "ensemble-execution-protocol-v2", operation: "submit", requestRef: request.image.ref, scope: request.value.scope, body: { disposition: "current", observation: accepted } }
      // Fixture deliberately ignores abort and returns late, never native evidence.
      return pending
    },
    observe: async () => { throw new Error("unexpected observe") }, reconcile: async () => { throw new Error("unexpected reconcile") }, control: async () => { throw new Error("unexpected control") },
  }) })
  const port = factory.createPort(scope, codec, caps)
  expect(calls).toBe(0)
  expect((await port.capabilities()).operations).toEqual([])
  expect(signal).toBeInstanceOf(AbortSignal); expect(signal?.aborted).toBe(false)
  const outcome = port.submitCaptured(command).then(value => { settled = true; return { value, error: null } }, error => { settled = true; return { value: null, error } })
  expect(calls).toBe(2)
  factory.dispose(); factory.dispose()
  expect(signal?.aborted).toBe(true)
  expect(settled).toBe(false) // Disposed/aborted is NOT evidence of native quiescence.
  complete(raw)
  const result = await outcome
  expect(result.error).toBeInstanceOf(ExecutionResponseNotProjected)
  expect((result.error as ExecutionResponseNotProjected).response).toHaveProperty("value", raw)
  expect((result.error as ExecutionResponseNotProjected).request.value.operation).toBe("submit")
  await expect(port.submit(command)).rejects.toThrow("disposed")
  expect(calls).toBe(2)
})
