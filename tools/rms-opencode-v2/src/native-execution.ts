import { captureExecutionRequestV2, captureExecutionResponseV2, type BaseScopeV1, type CapturedRequestV2, type CapturedResponseV2, type CaptureCapsV2 } from "@hueyexe/opencode-ensemble/execution"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import type { RpcClient } from "@opencode/client/promise/api"
import type { ExecutionCodecV1, ExecutionPortV1, ExecutionCapabilitiesV1, ExecutionReadonlyV1, CapturedExecutionObservationV1 } from "../../ff8-harness/src/ports/execution"
/** Only the five public SDK methods; no private Ensemble API or transport authority. */
export type ExecutionRpcClient = Pick<RpcClient<typeof ExecutionRpcV2, { readonly signal?: AbortSignal }>, "capabilities" | "submit" | "observe" | "reconcile" | "control">
/** Complete call retained for the caller's existing persistence, never a second audit store. */
export class ExecutionResponseNotProjected extends Error {
  constructor(readonly request: CapturedRequestV2, readonly response: unknown, cause?: unknown) {
    super("execution response not projected", { cause })
    this.name = "ExecutionResponseNotProjected"
  }
}
type Admission = Awaited<ReturnType<ExecutionPortV1["submit"]>>
export interface CapturedAdmissionCall {
  readonly request: CapturedRequestV2; readonly response: CapturedResponseV2; readonly observation: Admission
}
export interface CapturedObservationCall {
  readonly request: CapturedRequestV2; readonly response: CapturedResponseV2; readonly observations: readonly CapturedExecutionObservationV1[]
}
/** Local enrichment of the same port, not additional RPC operations or storage. */
export interface NativeExecutionPort extends ExecutionPortV1 {
  submitCaptured(command: Parameters<ExecutionPortV1["submit"]>[0]): Promise<CapturedAdmissionCall>
  observeCaptured(request: Parameters<ExecutionPortV1["observe"]>[0]): Promise<CapturedObservationCall>
  reconcileCaptured(request: Parameters<ExecutionPortV1["reconcile"]>[0]): Promise<CapturedAdmissionCall>
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`RMS execution adapter: ${message}`) }
type Data = Record<string, unknown>
/** Detach input DATA before any codec callback, including observe/reconcile fields. */
function detach(value: unknown, seen = new Set<object>(), depth = 0): unknown {
  check(depth <= 128, "DATA nesting limit")
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") { check(Number.isFinite(value) && !Object.is(value, -0), "JSON number required"); return value }
  check(value !== null && typeof value === "object" && !seen.has(value), "plain JSON/cycle required")
  const proto = Object.getPrototypeOf(value), properties = Object.getOwnPropertyDescriptors(value)
  check(proto === Object.prototype || proto === null || (Array.isArray(value) && proto === Array.prototype), "plain DTO required")
  check(Object.getOwnPropertySymbols(value).length === 0, "symbol field")
  seen.add(value)
  let result: unknown
  if (Array.isArray(value)) {
    check(Object.keys(properties).length === value.length + 1, "extended/sparse array")
    const out: unknown[] = []
    for (let n = 0; n < value.length; n++) { const p = properties[String(n)]; check(p?.enumerable && Object.hasOwn(p, "value"), "array accessor/hole"); out.push(detach(p.value, seen, depth + 1)) }
    result = out
  } else {
    const out: Data = Object.create(null)
    for (const [key, p] of Object.entries(properties)) { check(p.enumerable && Object.hasOwn(p, "value"), "accessor/nonenumerable"); out[key] = detach(p.value, seen, depth + 1) }
    result = out
  }
  seen.delete(value)
  return result
}
function fields(value: unknown, keys: readonly string[]): Data {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "object required")
  const v = value as Data
  check(Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k)), "closed RMS request fields required")
  return v
}
/** Scope is supplied by the consumer and snapshotted, never inferred from host location. */
export function createNativeExecutionPort(client: ExecutionRpcClient, scope: BaseScopeV1, codec: ExecutionCodecV1, caps: CaptureCapsV2, isClosed: () => boolean = () => false, signal?: AbortSignal): NativeExecutionPort {
  const limits = Object.freeze(detach(caps)) as CaptureCapsV2
  const base = captureExecutionRequestV2("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope, body: {} }, codec, limits).value.scope
  function open(): void { check(!isClosed() && !signal?.aborted, "disposed") }
  /** One public RPC exactly; transport rejection identity is deliberately outside the catch. */
  async function call<T>(operation: Exclude<CapturedRequestV2["value"]["operation"], "control">, makeInput: () => unknown, project: (response: CapturedResponseV2, request: CapturedRequestV2) => T) {
    open()
    const request = captureExecutionRequestV2(operation, makeInput(), codec, limits)
    if (request.value.operation === "submit") {
      const command = request.value.body.command
      check(new TextEncoder().encode(command.image.utf8).length <= (command.value.captureCaps as { maxCommandImageUtf8Bytes: number }).maxCommandImageUtf8Bytes, "RMS command byte cap exceeded")
    }
    open()
    const raw = await client[operation](request.value, signal ? { signal } : {})
    let response: CapturedResponseV2 | undefined
    try {
      response = captureExecutionResponseV2(request, raw, codec, limits)
      open()
      return Object.freeze({ request, response, projection: project(response, request) })
    } catch (error) { throw new ExecutionResponseNotProjected(request, response ?? raw, error) }
  }
  const envelope = (operation: string, target: Data, body: unknown) => ({ protocol: "ensemble-execution-protocol-v2", operation, scope: { ...base, identity: target.identity, fences: target.fences, commandRef: target.commandRef }, body })
  function readonlyInput(operation: "observe" | "reconcile", input: unknown) {
    const key = operation === "observe" ? "cursors" : "priorObservationRefs"
    const v = fields(detach(input), ["version", "kind", "identity", "fences", "commandRef", key])
    check(v.version === "rms-native-execution-port-v1" && v.kind === (operation === "observe" ? "observe-execution" : "reconcile-admission"), "RMS request version/kind mismatch")
    return envelope(operation, v, { [key]: v[key] })
  }
  function current(response: CapturedResponseV2): Admission {
    check(response.value.body.disposition === "current", "audit-only admission cannot be projected as current")
    return response.value.body.observation as unknown as Admission
  }
  async function submitCaptured(command: Parameters<ExecutionPortV1["submit"]>[0]): Promise<CapturedAdmissionCall> {
    const result = await call("submit", () => {
      const copied = fields(detach(command), ["value", "image"]), v = copied.value as Data, image = copied.image as Data
      return envelope("submit", { identity: v.identity, fences: v.fences, commandRef: image.ref }, { command: copied })
    }, (response, request) => {
      const observation = current(response)
      if (request.value.operation !== "submit") throw new Error("submit request required")
      const command = request.value.body.command.value
      check(new TextEncoder().encode(observation.image.utf8).length <= (command.captureCaps as { maxObservationImageUtf8Bytes: number }).maxObservationImageUtf8Bytes, "RMS observation byte cap exceeded")
      return observation
    })
    return Object.freeze({ request: result.request, response: result.response, observation: result.projection })
  }
  async function reconcileCaptured(input: Parameters<ExecutionPortV1["reconcile"]>[0]): Promise<CapturedAdmissionCall> {
    const result = await call("reconcile", () => readonlyInput("reconcile", input), current)
    return Object.freeze({ request: result.request, response: result.response, observation: result.projection })
  }
  async function observeCaptured(input: Parameters<ExecutionPortV1["observe"]>[0]): Promise<CapturedObservationCall> {
    const result = await call("observe", () => readonlyInput("observe", input), response => {
      const items = response.value.body.observations as readonly { readonly observation: unknown }[]
      return Object.freeze(items.map(item => item.observation as CapturedExecutionObservationV1))
    })
    return Object.freeze({ request: result.request, response: result.response, observations: result.projection })
  }
  return {
    async capabilities() {
      const result = await call("capabilities", () => ({ protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope: base, body: {} }), response => {
        const body = response.value.body
        check((body.operations as readonly string[]).every(op => ["submit", "observe", "reconcile"].includes(op)), "unsupported capability offering")
        return body as unknown as ExecutionReadonlyV1<ExecutionCapabilitiesV1>
      })
      return result.projection
    },
    submitCaptured, observeCaptured, reconcileCaptured,
    async submit(command) { return (await submitCaptured(command)).observation },
    async observe(input) { return (await observeCaptured(input)).observations },
    async reconcile(input) { return (await reconcileCaptured(input)).observation },
    // Local unavailability is unconditional, before closed-state or input inspection.
    async control() { throw new Error("not yet implemented: control") },
  }
}
