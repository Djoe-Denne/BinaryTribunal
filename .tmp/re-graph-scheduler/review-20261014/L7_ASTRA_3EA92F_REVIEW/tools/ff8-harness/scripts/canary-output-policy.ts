import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ModelRef } from "../src/domain";
import type { OutputMode } from "../src/adapter";
import type { RpcTransport } from "../src/client";

/** Select a transport contract, not a provider fallback or an inference about JSON mode. */
export function canaryOutputPolicy(model: ModelRef, outputMode: OutputMode = "json-schema-strict") {
  if (!["file", "json-schema-strict"].includes(outputMode)) throw new Error("unknown canary output mode");
  if (outputMode === "json-schema-strict" && model.providerID !== "openai") throw new Error("strict schema route not implemented for this selected provider; no JSON-mode fallback");
  return { outputMode, allowedTools: outputMode === "json-schema-strict" ? ["read", "execute"] : ["read", "edit", "execute", "team_message"], requiredTools: outputMode === "json-schema-strict" ? ["read"] : ["read", "edit"] };
}
/** The operator can request shutdown without destroying the controller's ephemeral token. */
export function canaryStopRequested(root: string): boolean { return existsSync(join(root, "STOP_REQUESTED")); }

/** Retain only observed native creations, including replies hidden by the crash fixture. */
export function rememberNativeExecutionRefs(refs: Map<string, string>, reply: Record<string, unknown>): void {
  const executions = Array.isArray(reply.executions) ? reply.executions : reply.execution ? [reply.execution] : [];
  for (const raw of executions) {
    if (!raw || typeof raw !== "object" || !("native" in raw) || !raw.native) continue;
    const e = raw as { executionId?: unknown; nativeSessionId?: unknown };
    if (typeof e.executionId !== "string" || !e.executionId || typeof e.nativeSessionId !== "string" || !e.nativeSessionId
      || (refs.has(e.executionId) && refs.get(e.executionId) !== e.nativeSessionId)
      || [...refs].some(([id, session]) => id !== e.executionId && session === e.nativeSessionId)) throw new Error("native execution identity changed or duplicated");
    refs.set(e.executionId, e.nativeSessionId);
  }
}

/** Keep observation below the disposable fault injector and every resumed client. */
export function observeNativeExecutions(inner: RpcTransport, refs: Map<string, string>): RpcTransport {
  return { serverVersion: inner.serverVersion, call: async (method, input) => {
    const reply = await inner.call(method, input);
    rememberNativeExecutionRefs(refs, reply);
    return reply;
  } };
}

/** Public control/readback receipt, separate from scientific/native output acceptance. */
export async function confirmCanaryClosure(client: { stopMission(id: string): Promise<void>; snapshot(id: string): Promise<Record<string, unknown>> }, missionId: string, expected: readonly { executionId: string; sessionId: string }[]) {
  await client.stopMission(missionId);
  const snapshot = await client.snapshot(missionId), admissions = snapshot.admissions as { paused?: boolean } | undefined;
  if (admissions?.paused !== true || !Array.isArray(snapshot.executions)) throw new Error("native closure not confirmed by public snapshot");
  const executions = snapshot.executions as Array<{ executionId: string; nativeSessionId: string; state: string }>;
  if (executions.some(e => !e || typeof e.executionId !== "string" || !e.executionId || typeof e.nativeSessionId !== "string" || !e.nativeSessionId || e.state !== "stopped")) throw new Error("native closure has missing or non-stopped execution");
  const expectedPairs = new Map(expected.map(e => [e.executionId, e.sessionId]));
  if (expectedPairs.size !== expected.length || new Set(expected.map(e => e.sessionId)).size !== expected.length || expected.some(e => !e.executionId || !e.sessionId)
    || executions.length !== expected.length || new Set(executions.map(e => e.executionId)).size !== executions.length
    || executions.some(e => expectedPairs.get(e.executionId) !== e.nativeSessionId)) throw new Error("native closure identity set differs from observed executions");
  return { verified: true, at: new Date().toISOString(), admissionsPaused: true, revision: snapshot.revision,
    executions: executions.map(e => ({ executionId: e.executionId, sessionId: e.nativeSessionId, state: e.state })) };
}
