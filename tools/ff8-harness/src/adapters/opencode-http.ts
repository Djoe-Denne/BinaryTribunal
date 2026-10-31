import type { ExecutionPortV1 } from "../ports/execution";

function notImplemented(operation: keyof ExecutionPortV1): never {
  throw new Error(`OpenCode HTTP adapter: ${operation}: not yet implemented`);
}

/**
 * Explicitly deferred HTTP transport. Importing or constructing this adapter
 * does not discover/start a host, perform I/O, or fall back to a native adapter.
 * OpenCode owns security and permissions; no RMS authorization context is required.
 */
export class OpenCodeHttpExecutionAdapter implements ExecutionPortV1 {
  readonly capabilities: ExecutionPortV1["capabilities"] = async () => {
    return notImplemented("capabilities");
  };

  readonly submit: ExecutionPortV1["submit"] = async (_command) => {
    return notImplemented("submit");
  };

  readonly observe: ExecutionPortV1["observe"] = async (_request) => {
    return notImplemented("observe");
  };

  readonly reconcile: ExecutionPortV1["reconcile"] = async (_request) => {
    return notImplemented("reconcile");
  };

  readonly control: ExecutionPortV1["control"] = async (_command) => {
    return notImplemented("control");
  };
}
