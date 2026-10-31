import { captureExecutionRequestV2, captureExecutionResponseV2, type BaseScopeV1, type CapturedRequestV2, type CapturedResponseV2, type CaptureCapsV2 } from "@hueyexe/opencode-ensemble/execution"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import type { RpcClient } from "@opencode/client/promise/api"
import type { ExecutionCodecV1, ExecutionPortV1, ExecutionCapabilitiesV1, ExecutionReadonlyV1 } from "../../ff8-harness/src/ports/execution"
/** Only the five public SDK methods; no transport headers/location or private Ensemble API. */
export type ExecutionRpcClient = Pick<RpcClient<typeof ExecutionRpcV2, { readonly signal?: AbortSignal }>, "capabilities" | "submit" | "observe" | "reconcile" | "control">
/** Preserve an unexpected capabilities response in full; not a durable audit sink. */
export class ExecutionResponseNotProjected extends Error {
  constructor(readonly request: CapturedRequestV2, readonly response: unknown, cause?: unknown) {
    super("not yet implemented: capabilities response projection", { cause })
    this.name = "ExecutionResponseNotProjected"
  }
}
/** Scope is supplied by a business consumer, never synthesized from SDK location/session. */
export function createNativeExecutionPort(client: ExecutionRpcClient, scope: BaseScopeV1, codec: ExecutionCodecV1, caps: CaptureCapsV2, isClosed: () => boolean = () => false): ExecutionPortV1 {
  const limits = Object.freeze({ ...caps })
  const base = captureExecutionRequestV2("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope, body: {} }, codec, limits).value.scope
  async function capabilitiesResponse(): Promise<{ request: CapturedRequestV2; response: CapturedResponseV2 }> {
    if (isClosed()) throw new Error("RMS execution adapter disposed")
    const request = captureExecutionRequestV2("capabilities", { protocol: "ensemble-execution-protocol-v2", operation: "capabilities", scope: base, body: {} }, codec, limits)
    // JSON-schema RPC input/output is unknown: validation is the public capture boundary.
    const raw = await client.capabilities(request.value)
    let response: CapturedResponseV2
    try { response = captureExecutionResponseV2(request, raw, codec, limits) }
    catch (error) { throw new ExecutionResponseNotProjected(request, raw, error) }
    if (isClosed()) throw new ExecutionResponseNotProjected(request, response, new Error("RMS execution adapter disposed during call"))
    return { request, response }
  }
  return {
    async capabilities() {
      const result = await capabilitiesResponse()
      const body = result.response.value.body
      if ((body.operations as readonly unknown[]).length !== 0) throw new ExecutionResponseNotProjected(result.request, result.response)
      return body as unknown as ExecutionReadonlyV1<ExecutionCapabilitiesV1>
    },
    // Unsupported locally, even if a future server would accept. Do not inspect
    // inputs or call an RPC merely to discover missing execution/audit projection.
    async submit() { throw new Error("not yet implemented: submit") },
    async observe() { throw new Error("not yet implemented: observe") },
    async reconcile() { throw new Error("not yet implemented: reconcile") },
    async control() { throw new Error("not yet implemented: control") },
  }
}
