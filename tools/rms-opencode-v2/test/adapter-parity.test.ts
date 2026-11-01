/** Public V2 transport with fixture spies only; not native acquisition evidence. */
import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { captureExecutionRequestV2, captureExecutionResponseV2 } from "@hueyexe/opencode-ensemble/execution"
import { captureExecutionCommandV1, captureExecutionControlV1, captureExecutionObservationV1, type ExecutionPortV1, type CapturedExecutionObservationV1, type ExecutionEvidenceRefV1, type ExecutionCapabilitiesV1 } from "../../ff8-harness/src/ports/execution"
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
function image<D extends string>(utf8: string, domain: D) { const bytes = new TextEncoder().encode(utf8); return { utf8, ref: { domain, byteLength: bytes.length, sha256: codec.sha256(bytes) } } }
const evidence: ExecutionEvidenceRefV1 = { source: "fixture", recordId: "not-native", bytes: { domain: "execution-evidence-v1", byteLength: 0, sha256: "0".repeat(64) } }
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
      raw = wrongBinding ? { ...envelope(input, capabilities), requestRef: { domain: "ensemble-execution-request-v2", byteLength: 0, sha256: "0".repeat(64) } } : envelope(input, { ...capabilities, operations: ["submit", "control"] })
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
const accepted = captureExecutionObservationV1(command, { version: "rms-native-execution-port-v1", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, sourceStreamId: "stream", eventId: "accepted", sourceSequence: 1, evidenceRefs: [evidence], kind: "accepted", receiptRef: evidence }, codec)
const ambiguous = captureExecutionObservationV1(command, { version: "rms-native-execution-port-v1", identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref, sourceStreamId: "stream", eventId: "ambiguous", sourceSequence: 2, evidenceRefs: [], kind: "ambiguous", reason: "reply lost" }, codec)
type ActiveOperation = "submit" | "observe" | "reconcile"
function activeEnvelope(operation: ActiveOperation, input: unknown, body: unknown) {
  const request = captureExecutionRequestV2(operation, input, codec, caps)
  return { protocol: "ensemble-execution-protocol-v2", operation, requestRef: request.image.ref, scope: request.value.scope, body }
}
function body(operation: ActiveOperation, observation: unknown = accepted, disposition = "current") {
  return operation === "observe" ? { observations: [{ disposition, observation }] } : { disposition, observation }
}
function invoke(port: ExecutionPortV1, operation: ActiveOperation, invalid = false): Promise<CapturedExecutionObservationV1 | readonly CapturedExecutionObservationV1[]> {
  if (operation === "submit") return port.submit(invalid ? null as unknown as typeof command : command)
  if (operation === "observe") return port.observe(invalid ? null as unknown as typeof observationRequest : observationRequest)
  return port.reconcile(invalid ? null as unknown as typeof reconciliationRequest : reconciliationRequest)
}
for (const operation of ["submit", "observe", "reconcile"] as const) {
  test(`${operation} transports exact V2 once and projects accepted or ambiguous RMS captures`, async () => {
    for (const observation of [accepted, ambiguous]) {
      let calls = 0
      const port = createNativeExecutionPort(client(async input => {
        calls++
        const req = captureExecutionRequestV2(operation, input, codec, caps)
        expect(req.value.scope).toEqual(fullScope)
        if (req.value.operation === "submit") expect(req.value.body.command.image).toEqual(command.image)
        return activeEnvelope(operation, input, body(operation, observation))
      }), scope, codec, caps)
      expect(await invoke(port, operation)).toEqual(operation === "observe" ? [observation] : observation)
      expect(calls).toBe(1)
    }
  })
  test(`${operation} captured facade retains full request/response with no second native call`, async () => {
    let calls = 0
    const port = createNativeExecutionPort(client(async input => { calls++; return activeEnvelope(operation, input, body(operation)) }), scope, codec, caps)
    const result = operation === "submit" ? await port.submitCaptured(command) : operation === "observe" ? await port.observeCaptured(observationRequest) : await port.reconcileCaptured(reconciliationRequest)
    expect(result.request.value.operation).toBe(operation)
    expect(captureExecutionResponseV2(result.request, result.response.value, codec, caps).image).toEqual(result.response.image)
    expect(result.response.value.body).toEqual(body(operation))
    expect(Object.isFrozen(result)).toBe(true)
    expect(calls).toBe(1)
  })
  test(`${operation} invalid and closed-before-send inputs never reach RPC`, async () => {
    let calls = 0, closed = false
    const port = createNativeExecutionPort(client(async () => { calls++; throw new Error("must not send") }), scope, codec, caps, () => closed)
    await expect(invoke(port, operation, true)).rejects.toThrow()
    closed = true
    await expect(invoke(port, operation)).rejects.toThrow("disposed")
    expect(calls).toBe(0)
  })
  test(`${operation} native rejection identity survives without retry`, async () => {
    let calls = 0
    const failure = new Error("native SDK rejection")
    const port = createNativeExecutionPort(client(async () => { calls++; throw failure }), scope, codec, caps)
    await expect(invoke(port, operation)).rejects.toBe(failure)
    expect(calls).toBe(1)
  })
  test(`${operation} malformed/binding/late-close errors retain complete raw or captured response`, async () => {
    for (const problem of ["malformed", "binding", "closed", "byte-cap"] as const) {
      let calls = 0, closed = false, raw: unknown
      const port = createNativeExecutionPort(client(async input => {
        calls++
        const response = activeEnvelope(operation, input, body(operation))
        raw = problem === "malformed" ? { entire: "é\r\n😀", nested: { preserve: true } } : problem === "binding" ? { ...response, scope: { ...fullScope, projectRef: "foreign" } } : response
        if (problem === "closed") closed = true
        return raw
      }), scope, codec, problem === "byte-cap" ? { ...caps, maxResponseImageUtf8Bytes: 1 } : caps, () => closed)
      try { await invoke(port, operation); throw new Error("expected projection failure") }
      catch (error) {
        expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
        const retained = error as ExecutionResponseNotProjected
        expect(retained.request.value.operation).toBe(operation)
        expect(retained.cause).toBeInstanceOf(Error)
        if (problem === "closed") expect((retained.response as { value: unknown }).value).toEqual(raw)
        else expect(retained.response).toBe(raw)
      }
      expect(calls).toBe(1)
    }
  })
}
function foreignAdmission() {
  const value = { ...accepted.value, identity: { ...command.value.identity, executionId: "foreign" }, eventId: "foreign" }
  return { value, image: image(JSON.stringify(value), "rms-observation-v1") }
}
test("observe preserves every audit-only foreign observation and its disposition in the captured envelope", async () => {
  let calls = 0
  const foreign = foreignAdmission(), observations = [{ disposition: "current", observation: accepted }, { disposition: "audit-only", observation: foreign }, { disposition: "current", observation: ambiguous }]
  const port = createNativeExecutionPort(client(async input => { calls++; return activeEnvelope("observe", input, { observations }) }), scope, codec, caps)
  const result = await port.observeCaptured(observationRequest)
  expect(result.observations).toEqual([accepted, foreign, ambiguous])
  expect(result.response.value.body.observations).toEqual(observations)
  expect(calls).toBe(1)
  expect(await port.observe(observationRequest)).toEqual([accepted, foreign, ambiguous])
  expect(calls).toBe(2)
})
for (const operation of ["submit", "reconcile"] as const) {
  test(`${operation} audit-only foreign admission becomes an error retaining the full validated envelope`, async () => {
    let calls = 0
    const foreign = foreignAdmission()
    const port = createNativeExecutionPort(client(async input => { calls++; return activeEnvelope(operation, input, body(operation, foreign, "audit-only")) }), scope, codec, caps)
    try { await invoke(port, operation); throw new Error("expected audit-only projection error") }
    catch (error) {
      expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
      const retained = error as ExecutionResponseNotProjected
      expect((retained.response as { value: { body: unknown } }).value.body).toEqual(body(operation, foreign, "audit-only"))
    }
    expect(calls).toBe(1)
  })
}
test("capabilities project exactly supported offerings without silently filtering control", async () => {
  const offered: ExecutionCapabilitiesV1 = { ...capabilities, operations: ["submit", "observe", "reconcile"], evidenceKinds: ["admission-declaration"], hostEvidenceRef: evidence }
  let calls = 0
  const port = createNativeExecutionPort(client(async input => { calls++; return envelope(input, offered) }), scope, codec, caps)
  expect(await port.capabilities()).toEqual(offered)
  expect(calls).toBe(1)
})
test("submit RMS observation byte cap failure retains the valid envelope after one call", async () => {
  const limited = captureExecutionCommandV1({ ...command.value, captureCaps: { ...command.value.captureCaps, maxObservationImageUtf8Bytes: 1 } }, codec)
  const value = { ...accepted.value, commandRef: limited.image.ref }
  const observation = { value, image: image(JSON.stringify(value), "rms-observation-v1") }
  let calls = 0
  const port = createNativeExecutionPort(client(async input => { calls++; return activeEnvelope("submit", input, body("submit", observation)) }), scope, codec, caps)
  try { await port.submit(limited); throw new Error("expected cap error") }
  catch (error) {
    expect(error).toBeInstanceOf(ExecutionResponseNotProjected)
    expect((error as ExecutionResponseNotProjected).cause).toBeInstanceOf(Error)
    expect(((error as ExecutionResponseNotProjected).response as { value: { body: unknown } }).value.body).toEqual(body("submit", observation))
  }
  expect(calls).toBe(1)
})
test("self-consistent command image exceeding its RMS byte cap is rejected before RPC", async () => {
  let calls = 0
  const value = { ...command.value, captureCaps: { ...command.value.captureCaps, maxCommandImageUtf8Bytes: 1 } }
  const limited = { value, image: image(JSON.stringify(value), "rms-command-v1" as const) }
  const port = createNativeExecutionPort(client(async () => { calls++; return null }), scope, codec, caps)
  await expect(port.submit(limited as typeof command)).rejects.toThrow("command byte cap")
  expect(calls).toBe(0)
})
test("readonly request fields and image bindings are validated before sending", async () => {
  let calls = 0, getterCalls = 0
  const port = createNativeExecutionPort(client(async () => { calls++; throw new Error("must not send") }), scope, codec, caps)
  await expect(port.observe({ ...observationRequest, kind: "wrong" } as never)).rejects.toThrow()
  await expect(port.reconcile({ ...reconciliationRequest, extra: true } as never)).rejects.toThrow()
  await expect(port.observe({ ...observationRequest, get cursors() { getterCalls++; return [] } })).rejects.toThrow()
  await expect(port.submit({ ...command, image: { ...command.image, utf8: "changed" } })).rejects.toThrow()
  const foreignBase = createNativeExecutionPort(client(async () => { calls++; return null }), { ...scope, missionId: "foreign" }, codec, caps)
  await expect(foreignBase.submit(command)).rejects.toThrow()
  expect(calls).toBe(0); expect(getterCalls).toBe(0)
})
test("each active request image cap is checked before its RPC, not only at factory construction", async () => {
  const capRequest = captureExecutionRequestV2("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope, body: {} }, codec, caps)
  for (const operation of ["submit", "observe", "reconcile"] as const) {
    let calls = 0
    const port = createNativeExecutionPort(client(async () => { calls++; throw new Error("must not send") }), scope, codec, { ...caps, maxRequestImageUtf8Bytes: capRequest.image.ref.byteLength })
    await expect(invoke(port, operation)).rejects.toThrow()
    expect(calls).toBe(0)
  }
})
test("explicit factory scope and readonly cursor/prior-ref inputs are preserved in the exact V2 requests", async () => {
  const mutableScope = { ...scope }, cursors = [{ sourceStreamId: "é\r\n😀", afterSequence: 3 }], priorObservationRefs = [accepted.image.ref]
  const observed: unknown[] = []
  const rpc = client(async input => {
    const operation = (input as { operation: ActiveOperation }).operation
    const request = captureExecutionRequestV2(operation, input, codec, caps)
    expect(request.value.scope).toEqual(fullScope)
    observed.push(request.value.body)
    return activeEnvelope(operation, input, body(operation))
  })
  const port = createNativeExecutionPort(rpc, mutableScope, codec, caps)
  mutableScope.projectRef = "mutated"
  const observe = await port.observeCaptured({ ...observationRequest, cursors })
  const reconcile = await port.reconcileCaptured({ ...reconciliationRequest, priorObservationRefs })
  expect(observed).toEqual([{ cursors }, { priorObservationRefs }])
  cursors[0]!.afterSequence = 99
  expect(observe.request.value.body).toEqual({ cursors: [{ sourceStreamId: "é\r\n😀", afterSequence: 3 }] })
  expect(reconcile.request.value.body).toEqual({ priorObservationRefs: [accepted.image.ref] })
})
