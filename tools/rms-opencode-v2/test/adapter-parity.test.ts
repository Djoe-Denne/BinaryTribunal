/** Capabilities transport and local DATA/refusal vectors; no execution transport or native evidence. */
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { captureExecutionRequestV2, captureExecutionResponseV2 } from "@hueyexe/opencode-ensemble/execution"
import { captureExecutionCommandV1, captureExecutionControlV1, type ExecutionPortV1 } from "../../ff8-harness/src/ports/execution"
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
  const port = createNativeExecutionPort(client(async input => {
    calls++
    expect(captureExecutionRequestV2("capabilities", input, codec, caps).value.scope).toEqual(scope)
    return envelope(input, capabilities)
  }), mutable, codec, caps)
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
const fullScope = { ...scope, identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref }
const observationRequest = { version: "rms-native-execution-port-v1", kind: "observe-execution", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, cursors: [] } as const
const reconciliationRequest = { version: "rms-native-execution-port-v1", kind: "reconcile-admission", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, priorObservationRefs: [] } as const
const control = captureExecutionControlV1(command, { version: "rms-native-execution-port-v1", kind: "control", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, controlId: "stop-1", action: "stop", sequence: 1, expectedRevision: 0, reason: "fixture" }, codec)
test("RMS V1 Unicode/CRLF captures remain exact inside V2 without any transport", () => {
  const request = captureExecutionRequestV2("submit", { protocol: "ensemble-execution-protocol-v2", operation: "submit", scope: fullScope, body: { command } }, codec, caps)
  if (request.value.operation !== "submit") throw new Error("wrong operation")
  expect(request.value.body.command.image).toEqual(command.image)
  expect(request.value.scope.commandRef).toEqual(command.image.ref)
  expect(command.value.retainedInput.utf8).toBe("é\r\n😀")
  const controlRequest = captureExecutionRequestV2("control", { protocol: "ensemble-execution-protocol-v2", operation: "control", scope: fullScope, body: { control } }, codec, caps)
  if (controlRequest.value.operation !== "control") throw new Error("wrong operation")
  expect(controlRequest.value.body.control.image).toEqual(control.image)
})
test("public capture preserves an audit-only DATA vector locally, not a delivered audit sink", () => {
  const foreign = { ...command.value.identity, executionId: "foreign" }
  const observationValue = { version: "rms-native-execution-port-v1", kind: "absence-reported", identity: foreign, fences: command.value.fences, commandRef: command.image.ref, sourceStreamId: "stream", eventId: "event", sourceSequence: 1, evidenceRefs: [], report: "completed", reason: "not quiescence" }
  const observation = { value: observationValue, image: image(JSON.stringify(observationValue), "rms-observation-v1") }
  const request = captureExecutionRequestV2("observe", { protocol: "ensemble-execution-protocol-v2", operation: "observe", scope: fullScope, body: { cursors: [] } }, codec, caps)
  const response = captureExecutionResponseV2(request, { protocol: "ensemble-execution-protocol-v2", operation: "observe", requestRef: request.image.ref, scope: request.value.scope, body: { observations: [{ disposition: "audit-only", observation }] } }, codec, caps)
  expect(response.value.body.observations).toEqual([{ disposition: "audit-only", observation }])
})
const unsupported: Array<{ operation: "submit" | "observe" | "reconcile" | "control"; invoke: (port: ExecutionPortV1, invalid: boolean) => Promise<unknown> }> = [
  { operation: "submit", invoke: (port, invalid) => port.submit(invalid ? null as unknown as typeof command : command) },
  { operation: "observe", invoke: (port, invalid) => port.observe(invalid ? null as unknown as typeof observationRequest : observationRequest) },
  { operation: "reconcile", invoke: (port, invalid) => port.reconcile(invalid ? null as unknown as typeof reconciliationRequest : reconciliationRequest) },
  { operation: "control", invoke: (port, invalid) => port.control(invalid ? null as unknown as typeof control : control) },
]
for (const { operation, invoke } of unsupported) {
  test(`${operation} refuses locally for valid/invalid input and open/closed port, even with a resolving server`, async () => {
    let calls = 0
    // All RPC methods would resolve rather than refuse if called. No server execution is activated.
    const rpc = client(async () => { calls++; return { accepted: true } })
    let closed = false
    const port = createNativeExecutionPort(rpc, scope, codec, caps, () => closed)
    for (const state of [false, true]) {
      closed = state
      for (const invalid of [false, true]) await expect(invoke(port, invalid)).rejects.toThrow(`not yet implemented: ${operation}`)
    }
    expect(calls).toBe(0)
  })
}
test("capabilities closed before send makes zero calls; closing during a reply retains its envelope", async () => {
  let calls = 0, closed = true
  const rpc = client(async input => { calls++; closed = true; return envelope(input, capabilities) })
  const port = createNativeExecutionPort(rpc, scope, codec, caps, () => closed)
  await expect(port.capabilities()).rejects.toThrow("disposed")
  expect(calls).toBe(0)
  closed = false
  try { await port.capabilities(); throw new Error("expected closed-during-call error") }
  catch (error) {
    expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
    const retained = error as ExecutionResponseNotProjected
    const response = captureExecutionResponseV2(retained.request, (retained.response as { value: unknown }).value, codec, caps)
    expect(response.value.body).toEqual(capabilities)
    expect(retained.cause).toBeInstanceOf(Error)
  }
  expect(calls).toBe(1)
})
test("capabilities unsupported offerings and wrong request binding remain fully inspectable", async () => {
  for (const wrongBinding of [false, true]) {
    let raw: unknown
    const port = createNativeExecutionPort(client(async input => {
      raw = wrongBinding ? { ...envelope(input, capabilities), requestRef: { domain: "ensemble-execution-request-v2", byteLength: 0, sha256: "0".repeat(64) } } : envelope(input, { ...capabilities, operations: ["submit"] })
      return raw
    }), scope, codec, caps)
    try { await port.capabilities(); throw new Error("expected unexpected-capabilities error") }
    catch (error) {
      expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
      const retained = error as ExecutionResponseNotProjected
      if (wrongBinding) expect(retained.response).toBe(raw)
      else expect((retained.response as { value: unknown }).value).toEqual(raw)
    }
  }
})
test("complete image caps reject before any RPC call", async () => {
  let calls = 0
  const rpc = client(async () => { calls++; throw new Error("must not send") })
  expect(() => createNativeExecutionPort(rpc, scope, codec, { ...caps, maxRequestImageUtf8Bytes: 1 })).toThrow()
  expect(calls).toBe(0)
})
