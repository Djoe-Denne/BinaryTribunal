import { captureExecutionRequestV2, captureExecutionResponseV2, type BaseScopeV1, type CapturedRequestV2, type CapturedResponseV2, type CaptureCapsV2, type ExecutionOperationV1 } from "@hueyexe/opencode-ensemble/execution"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import type { RpcClient } from "@opencode/client/promise/api"
import type { ExecutionCodecV1, ExecutionPortV1, ExecutionCapabilitiesV1, ExecutionReadonlyV1 } from "../../ff8-harness/src/ports/execution"
/** Only the five public SDK methods; no transport headers/location or private Ensemble API. */
export type ExecutionRpcClient = Pick<RpcClient<typeof ExecutionRpcV2, { readonly signal?: AbortSignal }>, "capabilities" | "submit" | "observe" | "reconcile" | "control">
/** Preserve unexpected responses, including every audit-only item, until a durable consumer exists. */
export class ExecutionResponseNotProjected extends Error {
  constructor(readonly request: CapturedRequestV2, readonly response: unknown, cause?: unknown) {
    super("not yet implemented: execution response/audit projection", { cause })
    this.name = "ExecutionResponseNotProjected"
  }
}
/** Scope is supplied by a business consumer, never synthesized from SDK location/session. */
export function createNativeExecutionPort(client: ExecutionRpcClient, scope: BaseScopeV1, codec: ExecutionCodecV1, caps: CaptureCapsV2, isClosed: () => boolean = () => false): ExecutionPortV1 {
  const limits = Object.freeze({ ...caps })
  const base = captureExecutionRequestV2("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope, body: {} }, codec, limits).value.scope
  async function call(operation: ExecutionOperationV1, input: unknown): Promise<{ request: CapturedRequestV2; response: CapturedResponseV2 }> {
    if (isClosed()) throw new Error("RMS execution adapter disposed")
    const request = captureExecutionRequestV2(operation, input, codec, limits)
    // JSON-schema RPC input/output is unknown: validation is the public capture boundary.
    const raw = await client[operation](request.value)
    let response: CapturedResponseV2
    try { response = captureExecutionResponseV2(request, raw, codec, limits) }
    catch (error) { throw new ExecutionResponseNotProjected(request, raw, error) }
    if (isClosed()) throw new ExecutionResponseNotProjected(request, response, new Error("RMS execution adapter disposed during call"))
    return { request, response }
  }
  async function unprojected(operation: ExecutionOperationV1, input: unknown): Promise<never> {
    const result = await call(operation, input)
    // No silently filtered observation, accepted receipt or audit-only declaration.
    throw new ExecutionResponseNotProjected(result.request, result.response)
  }
  return {
    async capabilities() {
      const result = await call("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope: base, body: {} })
      const body = result.response.value.body
      if ((body.operations as readonly unknown[]).length !== 0) throw new ExecutionResponseNotProjected(result.request, result.response)
      return body as unknown as ExecutionReadonlyV1<ExecutionCapabilitiesV1>
    },
    submit(command) { return unprojected("submit", { protocol: "ensemble-execution-protocol-v2", operation: "submit", scope: { ...base, identity: command.value.identity, fences: command.value.fences, commandRef: command.image.ref }, body: { command } }) },
    observe(request) {
      if (request.version !== "rms-native-execution-port-v1" || request.kind !== "observe-execution") return Promise.reject(new Error("invalid observation request"))
      return unprojected("observe", { protocol: "ensemble-execution-protocol-v2", operation: "observe", scope: { ...base, identity: request.identity, fences: request.fences, commandRef: request.commandRef }, body: { cursors: request.cursors } })
    },
    reconcile(request) {
      if (request.version !== "rms-native-execution-port-v1" || request.kind !== "reconcile-admission") return Promise.reject(new Error("invalid reconciliation request"))
      return unprojected("reconcile", { protocol: "ensemble-execution-protocol-v2", operation: "reconcile", scope: { ...base, identity: request.identity, fences: request.fences, commandRef: request.commandRef }, body: { priorObservationRefs: request.priorObservationRefs } })
    },
    control(command) { return unprojected("control", { protocol: "ensemble-execution-protocol-v2", operation: "control", scope: { ...base, identity: command.value.identity, fences: command.value.fences, commandRef: command.value.commandRef }, body: { control: command } }) },
  }
}
