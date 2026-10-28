import type { ControllerContext, PublicationAdapter, PublicationReceipt, PublicationRequest } from "./domain";
import { buildNativePublicationCode, PublicationError, type NativeGateAttestation, type NativeSupervisorRef, type NativeToolCaller } from "./ida-publication";
import { canonical, exactPath } from "./validation";

/** Narrow projection of installed V2 Tool.Info.execute; the SDK context stays opaque. */
export interface PublicNativeTool<Context> {
  readonly id: string;
  execute(input: { code: string }, context: Context): Promise<unknown>;
}
/** Public V2 API projection. Parent adapts SDK types without private Ensemble imports. */
export interface PublicNativePublicationApi<Context> {
  tool: { list(): Promise<readonly PublicNativeTool<Context>[]> };
  permission: {
    evaluate(input: { sessionID: string; action: string; resources: string[] }): Promise<{ effect: "allow" | "ask" | "deny" }>;
  };
}
/** Trusted operator scope, loaded from server configuration rather than RPC request fields. */
export interface NativePublicationCapability {
  /** Opaque in-process capability; never serialize it into a worker input or RPC body. */
  operatorCapability: object;
  supervisor: NativeSupervisorRef; toolId: string; targetId: string; directory: string; idbPath: string; docsDirectory: string;
}
/** Parent must implement the native public-SDK execution lifecycle, not fabricate context. */
export interface NativePublicationLifecycle<Context> {
  /** Native session/profile/directory readback, including current supervisor ownership. */
  inspectSupervisor(sessionID: string): Promise<NativeSupervisorRef & { ownedSupervisor: boolean }>;
  /** Verify the configured capability against current operator/native session authorization. */
  authorizeCapability(capability: object, supervisor: NativeSupervisorRef): Promise<boolean>;
  /** Resolve this real tool's effective action/resources (not guessed generic permissions). */
  permissions(tool: PublicNativeTool<Context>, input: { code: string }): Promise<{ action: string; resources: string[] }>;
  /** Acquire complete native ToolContext including abort, call/session identity, ask and metadata. */
  context(tool: PublicNativeTool<Context>, supervisor: NativeSupervisorRef): Promise<Context>;
  /** Run the public tool with available before/after hooks and native execution bookkeeping. */
  invoke(tool: PublicNativeTool<Context>, input: { code: string }, context: Context): Promise<unknown>;
}
/** Availability is explicit: merely finding py_eval in tool.list is not an actuator. */
export type NativePublicationBinding =
  { available: true; caller: NativeToolCaller } |
  { available: false; reason: string };

/**
 * Bind parent-owned py_eval through public V2 primitives. No direct Tool.Info.execute
 * shortcut exists: missing complete context/permission/hook lifecycle means unavailable.
 */
export function bindNativePublicationCaller<Context>(
  capability: NativePublicationCapability,
  api: PublicNativePublicationApi<Context> | undefined,
  lifecycle: NativePublicationLifecycle<Context> | undefined,
): NativePublicationBinding {
  if (!api?.tool?.list || !api.permission?.evaluate || !lifecycle?.context || !lifecycle.invoke || !lifecycle.permissions || !lifecycle.inspectSupervisor || !lifecycle.authorizeCapability) {
    return { available: false, reason: "Public tool listing alone cannot provide permission-safe native ToolContext and hooks; parent SDK lifecycle binding required." };
  }
  exactPath(capability.directory); exactPath(capability.idbPath); exactPath(capability.docsDirectory);
  if (capability.directory !== capability.supervisor.directory || !capability.supervisor.sessionID || !capability.supervisor.profile || !capability.toolId || !capability.targetId.startsWith("idb+docs:") || !capability.operatorCapability) return { available: false, reason: "Exact operator directory, idb+docs target and owned native supervisor capability are required." };
  const trusted = { ...capability, supervisor: structuredClone(capability.supervisor) };
  return { available: true, caller: {
    async call(toolId, input, suppliedRef) {
      if (toolId !== trusted.toolId || (suppliedRef !== undefined && canonical(suppliedRef) !== canonical(trusted.supervisor))) throw new PublicationError("native-tool-denied", "caller cannot substitute tool/session/profile/directory authority");
      // This optional actuator is publication-specific, never a generic Python RPC.
      let command: { operation: "inspect" | "append" | "save"; gate: NativeGateAttestation; expectedComment?: string; nextComment?: string };
      try {
        const value: unknown = JSON.parse(input.code.split("\n")[0].slice("# ff8-publication ".length));
        if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("publication object required");
        command = value as typeof command;
      } catch { throw new PublicationError("native-tool-denied", "unrecognized publication program"); }
      if (!input.code.startsWith("# ff8-publication ") || !["inspect", "append", "save"].includes(command.operation) || !command.gate || command.gate.idbPath !== trusted.idbPath || command.gate.docsDirectory !== trusted.docsDirectory || command.gate.targetId !== trusted.targetId || canonical(command.gate.supervisor) !== canonical(trusted.supervisor) || input.code !== buildNativePublicationCode(command.operation, command.gate, command.expectedComment, command.nextComment)) throw new PublicationError("native-tool-denied", "Python program or publication scope is not the configured parent-owned actuator");
      const supervisor = await lifecycle.inspectSupervisor(trusted.supervisor.sessionID);
      const { ownedSupervisor, ...nativeRef } = supervisor;
      if (!ownedSupervisor || canonical(nativeRef) !== canonical(trusted.supervisor) || !await lifecycle.authorizeCapability(trusted.operatorCapability, trusted.supervisor)) throw new PublicationError("native-tool-denied", "configured operator/native supervisor authorization denied");
      const tool = (await api.tool.list()).find(t => t.id === trusted.toolId);
      if (!tool || typeof tool.execute !== "function") throw new PublicationError("binding-unavailable", "configured executable native tool is absent from public V2 tool.list()");
      const permission = await lifecycle.permissions(tool, input);
      // Actual tool permission identity must be accompanied by the exact FF8-owned scope.
      if (!permission.action || permission.resources.length === 0) throw new PublicationError("binding-unavailable", "native tool action/resources unavailable");
      const evaluate = async () => {
        for (const probe of [permission, { action: "edit", resources: [trusted.idbPath, trusted.docsDirectory] }]) {
          const verdict = await api.permission.evaluate({ sessionID: trusted.supervisor.sessionID, action: probe.action, resources: [...probe.resources] });
          if (verdict.effect !== "allow") throw new PublicationError("native-tool-denied", "native supervisor permission is denied or requires explicit operator approval");
        }
      };
      await evaluate();
      const context = await lifecycle.context(tool, trusted.supervisor);
      // Permission/session can change while acquiring a native context; verify again.
      const fresh = await lifecycle.inspectSupervisor(trusted.supervisor.sessionID);
      if (!fresh.ownedSupervisor || canonical({ sessionID: fresh.sessionID, profile: fresh.profile, directory: fresh.directory }) !== canonical(trusted.supervisor) || !await lifecycle.authorizeCapability(trusted.operatorCapability, trusted.supervisor)) throw new PublicationError("native-tool-denied", "supervisor authorization changed before execution");
      await evaluate();
      return await lifecycle.invoke(tool, input, context);
    },
  } };
}

/** Authenticated FF8-owned RPC surface: publication only, never arbitrary Python/sessionID. */
export interface NativePublicationRpc<InvocationContext> {
  publish(request: PublicationRequest, context: InvocationContext): Promise<PublicationReceipt>;
  readback(receipt: PublicationReceipt, context: InvocationContext): Promise<PublicationReceipt>;
}
/**
 * Create server handlers for optional public Rpc.define registration by the parent.
 * Context authorization is a trusted server callback, not a body/sessionID authority.
 * This module is NOT an Ensemble plugin and does not register/load itself.
 */
export function createNativePublicationRpc<InvocationContext>(
  adapter: PublicationAdapter,
  authorizeInvocation: (context: InvocationContext) => Promise<ControllerContext>,
): NativePublicationRpc<InvocationContext> {
  return {
    publish: async (request, context) => await adapter.publish(request, await authorizeInvocation(context)),
    readback: async (receipt, context) => await adapter.readback(receipt, await authorizeInvocation(context)),
  };
}
