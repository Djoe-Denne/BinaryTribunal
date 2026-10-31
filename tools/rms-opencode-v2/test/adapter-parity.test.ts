/** Pure transport vectors only. No host, SQLite, model, session or audit sink. */
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { captureExecutionRequestV2, captureExecutionResponseV2 } from "@hueyexe/opencode-ensemble/execution"
import { captureExecutionCommandV1, captureExecutionControlV1 } from "../../ff8-harness/src/ports/execution"
import { createNativeExecutionPort, ExecutionResponseNotProjected, type ExecutionRpcClient } from "../src/native-execution"
const codec = { sha256: (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex") }
const caps = { maxRequestImageUtf8Bytes: 100000, maxResponseImageUtf8Bytes: 100000 }
const scope = { missionId: "m", rootLineageId: "r", parentSessionId: "p", projectRef: "project", generationId: "g" }
function client(method: (input: unknown) => Promise<unknown>): ExecutionRpcClient { return { capabilities: method, submit: method, observe: method, reconcile: method, control: method } }
function envelope(input: unknown, body: unknown) {
  const request = captureExecutionRequestV2("capabilities", input, codec, caps)
  return { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", requestRef: request.image.ref, scope: request.value.scope, body }
}
const capabilities = { version: "rms-native-execution-port-v1", operations: [], evidenceKinds: [], hostEvidenceRef: null } as const
test("capabilities uses exact V2 request binding and explicit scope snapshot", async () => {
  const mutable = { ...scope }; let calls = 0
  const port = createNativeExecutionPort(client(async input => { calls++; return envelope(input, capabilities) }), mutable, codec, caps)
  mutable.missionId = "later"
  expect(await port.capabilities()).toEqual(capabilities)
  expect(calls).toBe(1)
})
test("native failures keep their identity; corrupt responses remain inspectable", async () => {
  const failure = new Error("not yet implemented")
  await expect(createNativeExecutionPort(client(async () => { throw failure }), scope, codec, caps).capabilities()).rejects.toBe(failure)
  const corrupt = { malformed: "é\r\n😀" }
  try { await createNativeExecutionPort(client(async () => corrupt), scope, codec, caps).capabilities(); throw new Error("expected response error") }
  catch (error) { expect(error).toBeInstanceOf(ExecutionResponseNotProjected); expect((error as ExecutionResponseNotProjected).response).toBe(corrupt) }
})
function image(utf8: string, domain: string) { const bytes = new TextEncoder().encode(utf8); return { utf8, ref: { domain, byteLength: bytes.length, sha256: codec.sha256(bytes) } } }
const evidence = { source: "fixture", recordId: "not-native", bytes: { domain: "execution-evidence-v1", byteLength: 0, sha256: "0".repeat(64) } }
const command = captureExecutionCommandV1({ version: "rms-native-execution-port-v1", kind: "execute",
  identity: { missionId: "m", unitId: "u", subIntentId: "s", executionId: "e", generationId: "g", attemptId: "a", idempotencyKey: "key" }, fences: { family: 1, controller: 1 },
  retainedInput: image("é\r\n😀", "rms-retained-input-v1"), proposedRuntimeInput: image("{\"bytes\":\"é\\r\\n😀\"}", "rms-proposed-runtime-input-v1"),
  expectations: { profile: "fixture", modelRef: { providerID: "fixture", id: "model", variant: "none" }, context: { fresh: true, parentSessionId: null, independenceRef: evidence }, permissionsRef: evidence, policyRef: evidence },
  captureCaps: { maxCommandImageUtf8Bytes: 50000, maxObservationImageUtf8Bytes: 50000, maxControlImageUtf8Bytes: 50000 },
}, codec)
test("submit preserves complete captured RMS V1 bytes and does not retry a native failure", async () => {
  let calls = 0
  const failure = new Error("not yet implemented")
  const rpc = client(async input => {
    calls++
    const request = captureExecutionRequestV2("submit", input, codec, caps)
    if (request.value.operation !== "submit") throw new Error("wrong method")
    expect(request.value.body.command.image).toEqual(command.image)
    expect(request.value.scope.commandRef).toEqual(command.image.ref)
    throw failure
  })
  await expect(createNativeExecutionPort(rpc, scope, codec, caps).submit(command)).rejects.toBe(failure)
  expect(calls).toBe(1)
})
test("unexpected audit-only observations are retained in full, never silently projected", async () => {
  const foreign = { ...command.value.identity, executionId: "foreign" }
  const observationValue = { version: "rms-native-execution-port-v1", kind: "absence-reported", identity: foreign, fences: command.value.fences, commandRef: command.image.ref, sourceStreamId: "stream", eventId: "event", sourceSequence: 1, evidenceRefs: [], report: "completed", reason: "not quiescence" }
  const observation = { value: observationValue, image: image(JSON.stringify(observationValue), "rms-observation-v1") }
  let stored: unknown
  const rpc = client(async input => {
    const request = captureExecutionRequestV2("observe", input, codec, caps)
    const response = captureExecutionResponseV2(request, { protocol: "ensemble-execution-protocol-v2", operation: "observe", requestRef: request.image.ref, scope: request.value.scope, body: { observations: [{ disposition: "audit-only", observation }] } }, codec, caps)
    stored = response
    return response.value
  })
  try {
    await createNativeExecutionPort(rpc, scope, codec, caps).observe({ version: "rms-native-execution-port-v1", kind: "observe-execution", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, cursors: [] })
    throw new Error("expected unimplemented projection")
  } catch (error) {
    expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
    expect((error as ExecutionResponseNotProjected).response).toEqual(stored)
  }
})
test("reconcile and control keep exact business scope and native error identity", async () => {
  const control = captureExecutionControlV1(command, { version: "rms-native-execution-port-v1", kind: "control", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, controlId: "stop-1", action: "stop", sequence: 1, expectedRevision: 0, reason: "fixture" }, codec)
  let reconciles = 0, controls = 0
  const failure = new Error("not yet implemented")
  const rpc: ExecutionRpcClient = {
    ...client(async () => { throw new Error("unexpected method") }),
    reconcile: async input => { reconciles++; captureExecutionRequestV2("reconcile", input, codec, caps); throw failure },
    control: async input => {
      controls++
      const request = captureExecutionRequestV2("control", input, codec, caps)
      if (request.value.operation !== "control") throw new Error("wrong method")
      expect(request.value.body.control.image).toEqual(control.image)
      throw failure
    },
  }
  const port = createNativeExecutionPort(rpc, scope, codec, caps)
  await expect(port.reconcile({ version: "rms-native-execution-port-v1", kind: "reconcile-admission", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, priorObservationRefs: [] })).rejects.toBe(failure)
  await expect(port.control(control)).rejects.toBe(failure)
  expect(reconciles).toBe(1); expect(controls).toBe(1)
})
test("complete image caps reject before any RPC call", async () => {
  let calls = 0
  const rpc = client(async () => { calls++; throw new Error("must not send") })
  expect(() => createNativeExecutionPort(rpc, scope, codec, { ...caps, maxRequestImageUtf8Bytes: 1 })).toThrow()
  expect(calls).toBe(0)
})
