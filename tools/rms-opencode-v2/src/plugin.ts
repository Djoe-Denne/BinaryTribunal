import { Plugin } from "@opencode/plugin"
import { ExecutionRpcV2 } from "@hueyexe/opencode-ensemble/execution/rpc"
import type { BaseScopeV1, CaptureCapsV2 } from "@hueyexe/opencode-ensemble/execution"
import type { ExecutionCodecV1 } from "../../ff8-harness/src/ports/execution"
import { createNativeExecutionPort, type ExecutionRpcClient } from "./native-execution"
/** Narrow use of the SDK callable: only this public definition and its five methods. */
export interface RmsPluginContext { readonly rpc: (definition: typeof ExecutionRpcV2) => ExecutionRpcClient }
/** An unactivated factory, for a future explicit business consumer. No mission is invented. */
export function setupRmsPlugin(ctx: RmsPluginContext) {
  const client = ctx.rpc(ExecutionRpcV2)
  let closed = false
  return {
    createPort(scope: BaseScopeV1, codec: ExecutionCodecV1, caps: CaptureCapsV2) {
      if (closed) throw new Error("RMS plugin disposed")
      return createNativeExecutionPort(client, scope, codec, caps, () => closed)
    },
    dispose() { closed = true },
  }
}
export default Plugin.define({
  id: "rms-opencode-v2",
  setup(ctx) {
    const factory = setupRmsPlugin(ctx)
    // Deliberately no port instance, RPC method call, active mission or native work.
    return () => factory.dispose()
  },
})
