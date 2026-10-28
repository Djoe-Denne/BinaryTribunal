import { Rpc } from "@opencode/plugin/rpc"
import type { ExecutionOutput, ExecutionOutputWitness, ExecutionStructuredResult } from "./execution-output"
export type { ExecutionOutput, ExecutionOutputWitness, ExecutionStructuredResult } from "./execution-output"

/** Effective native V2 model selection; independent of historical transcript prose. */
export interface ExecutionModel { providerID: string; id: string; variant?: string }
/** Exact generic native action/resource authorization requirement (never file contents). */
export interface ExecutionAccess { action: string; resource: string }
/** Exact operator mapping for a non-builtin native tool. */
export interface ExecutionNativeToolBinding { tool: string; accesses: ExecutionAccess[] }
/** Optional controller-assigned, provider-independent communication contract. */
export interface ExecutionCommunication { mode: "bulletin"; channel: string; read: boolean; publish: boolean; schema: Record<string, unknown>; schemaSha256: string }
/** Immutable scoped publication and native authorship. */
export interface ExecutionBulletinMessage { id: string; seq: number; channel: string; payload: unknown; payloadSha256: string; schemaSha256: string; author: { executionId: string; sessionId: string; model: ExecutionModel; profile: string } }
/** Durable references only; explicit tool inputs are separate from final output. */
export interface ExecutionCommunicationTrace { published: Omit<ExecutionBulletinMessage, "payload">[]; received: Omit<ExecutionBulletinMessage, "payload">[]; cursor: number }
/** Evaluated native worker decision, independent of raw permission overrides. */
export interface ExecutionAccessEvaluation extends ExecutionAccess { effect: "allow" | "deny" | "ask"; sessionId: string; profile: string; verifierSource: string }
/** Actual allowed native request followed by its correlated successful tool completion. */
export interface ExecutionAccessWitness extends ExecutionAccessEvaluation { id: string; native: { messageID: string; id: string; tool: string; status: "completed" } }
/** Computed native effect and the restrictive (never broadening) boundary outcome. */
export interface ExecutionAccessDecision { id: string; sessionId: string; profile: string; action: string; resources: readonly string[]; nativeResources?: readonly string[]; nativeEffect: string; effect: string; boundaryAllowed: boolean; source?: { type: "tool"; messageID: string; id: string }; verifierSource: string }
/** Explicit operator credentials, independent of native caller sessions. */
export interface ExecutionCredentials { principalId: string; token: string }
/** Mandatory project/mission boundary on every scoped method. */
export interface ExecutionScope extends ExecutionCredentials { missionId: string; directory: string }
/** CAS plus leased controller identity for mutating an existing mission. */
export interface ExecutionMutation extends ExecutionScope { controllerId: string; expectedRevision: number }
/** Create only a new bridge-owned team and its inert native lead. */
export interface EnsureTeamInput extends ExecutionScope { teamName: string; controllerId: string; leaseMs: number; maxRunning?: number }
/** Version-one execution submission. No history or model is inferred from opaque prose. */
export interface SubmitExecutionInput extends ExecutionMutation { taskId: string; attemptId: string; executionId: string; idempotencyKey: string; profile: string; model: ExecutionModel; prompt: string; dossier?: Record<string, unknown>; metadata?: Record<string, unknown>; context?: { mode: "fresh" | "fork" | "checkpoint" | "compact_fork"; from?: string; messageID?: string }; worktree?: boolean; requiredAccess?: ExecutionAccess[]; resourceBoundary?: ExecutionAccess[]; expectedAccess?: ExecutionAccess[]; output?: ExecutionOutput; communication?: ExecutionCommunication; nativeTools?: string[] }
/** Pause/resume admission, renew the current lease, or explicitly recover an expired lease. */
export interface ControlExecutionInput extends ExecutionMutation { action: "pause" | "resume" | "renew" | "recover"; leaseMs?: number }
/** Branch-safe stop of one execution, not of unrelated mission members. */
export interface StopExecutionInput extends ExecutionMutation { executionId: string }
/** Inspect one execution belonging to the authorized mission. */
export interface InspectExecutionInput extends ExecutionScope { executionId: string }
/** Authenticated durable journal page; RPC calls this method `replay`. */
export interface ReplayExecutionInput extends ExecutionScope { cursor?: number; limit?: number }
/** Authenticated controller inspection, with no worker publication or delivery. */
export interface BulletinSnapshotInput extends ExecutionScope { channel?: string }
/** Explicit failure provenance, not an inferred context error. */
export interface ExecutionFailure { category: "auth" | "permission" | "input" | "context" | "provider" | "quota" | "transport" | "native_creation" | "unknown"; message: string; recoverable: boolean }
/** Durable version-one journal event. */
export interface ExecutionEvent { version: 1; id: number; missionId: string; executionId?: string; revision: number; kind: string; time: number; data: Record<string, unknown> }
/** Portable execution state, references only (never whole transcripts). */
export interface ExecutionRecord {
  missionId: string; taskId: string; attemptId: string; executionId: string; nativeSessionId: string; memberName: string
  state: "accepted" | "session_created" | "message_transmitted" | "observed_running" | "completed" | "failed" | "ambiguous" | "stop_requested" | "stopped"
  selection: { model: ExecutionModel; profile: string; override: boolean; routing: unknown; directory: string; worktree: false; permissions: unknown; profileInfo: unknown; hashes: Record<string, string>; context: { mode: "fresh" }; revision: number; requiredAccess?: ExecutionAccess[]; evaluatedAccess?: ExecutionAccessEvaluation[]; resourceBoundary?: ExecutionAccess[]; expectedAccess?: ExecutionAccess[]; accessMethod?: "native_hook_boundary_witness" | "native_tool_boundary_witness"; nativeToolBindings?: ExecutionNativeToolBinding[] }
  native?: { model: ExecutionModel; directory: string; profile: string; permissions: unknown }
  prompt: string; dossier: Record<string, unknown>; metadata: Record<string, unknown>; failure?: ExecutionFailure
  reports?: Array<{ id: string; from: string; time: number; status?: string; summary?: string }>
  accessWitnesses?: ExecutionAccessWitness[]
  accessDecisions?: ExecutionAccessDecision[]
  boundaryChecks?: Array<{ tool: string; messageID: string; id: string; sessionId: string; profile: string; resources: ExecutionAccess[]; boundaryAllowed: boolean; verifierSource: string }>
  accessVerified?: boolean
  missingExpectedAccess?: ExecutionAccess[]
  verificationBlock?: { category: "input_preconditions"; message: string; recoverable: true }
  nativeStage?: "creation" | "delivery"
  transmissionMarker?: string
  nativeIntentReceipt?: { messageId: string }
  output?: ExecutionOutput
  structuredResult?: ExecutionStructuredResult
  outputWitnesses?: ExecutionOutputWitness[]
  communication?: ExecutionCommunication
  communicationTrace?: ExecutionCommunicationTrace
}
/** Method response envelope; revision is the mission control CAS version. */
export interface ExecutionResponse { version: 1; revision?: number; missionId?: string; teamId?: string; leadSessionId?: string; executionId?: string; state?: string; execution?: ExecutionRecord; executions?: ExecutionRecord[]; events?: ExecutionEvent[]; messages?: ExecutionBulletinMessage[]; cursor?: number; capabilities?: Record<string, unknown>; admissions?: { paused: boolean; controllerId: string; leaseUntil: number } }

/** Public external RPC contract (implementation is registered only by the V2 server). */
const string = { type: "string", minLength: 1 } as const
const integer = { type: "integer", minimum: 0 } as const
const opaque = { type: "object", additionalProperties: true } as const
const auth = { principalId: string, token: string }
const scope = { ...auth, missionId: string, directory: string }
const mutation = { ...scope, controllerId: string, expectedRevision: integer }
const output = { type: "object", properties: { version: { const: 1 } }, required: ["version"], additionalProperties: true } as const
function method<const P extends Record<string, object>>(properties: P, required: string[]) {
  return { input: { type: "object" as const, properties, required, additionalProperties: false }, output,
    errors: { execution_rejected: { type: "object" as const, properties: { category: string, message: string, recoverable: { type: "boolean" as const } }, required: ["category", "message", "recoverable"], additionalProperties: false } },
  }
}
const scopeRequired = ["principalId", "token", "missionId", "directory"]
const mutationRequired = [...scopeRequired, "controllerId", "expectedRevision"]

export const ExecutionRpc = Rpc.define({
  id: "ensemble.execution.v1",
  methods: {
    capabilities: method(auth, ["principalId", "token"]),
    ensureTeam: method({ ...scope, teamName: string, controllerId: string, leaseMs: { type: "integer", minimum: 1, maximum: 300000 }, maxRunning: { type: "integer", minimum: 1 } }, [...scopeRequired, "teamName", "controllerId", "leaseMs"]),
    submit: method({ ...mutation, taskId: string, attemptId: string, executionId: string, idempotencyKey: string, profile: string,
      model: { type: "object", properties: { providerID: string, id: string, variant: string }, required: ["providerID", "id"], additionalProperties: false },
      prompt: string, dossier: opaque, metadata: opaque, context: { type: "object", properties: { mode: { enum: ["fresh", "fork", "checkpoint", "compact_fork"] }, from: string, messageID: string }, required: ["mode"], additionalProperties: false }, worktree: { type: "boolean" },
      requiredAccess: { type: "array", maxItems: 256, items: { type: "object", properties: { action: string, resource: string }, required: ["action", "resource"], additionalProperties: false } },
      resourceBoundary: { type: "array", minItems: 1, maxItems: 256, items: { type: "object", properties: { action: string, resource: string }, required: ["action", "resource"], additionalProperties: false } },
      expectedAccess: { type: "array", maxItems: 256, items: { type: "object", properties: { action: string, resource: string }, required: ["action", "resource"], additionalProperties: false } },
      // Native RPC safe validation forbids regex keywords. Exact name/hash checks
      // remain mandatory in parseExecutionOutput before any native allocation.
      output: { type: "object", properties: { mode: { const: "json_schema" }, strict: { const: true }, name: { type: "string", minLength: 1, maxLength: 64 }, schema: opaque, schemaSha256: { type: "string", minLength: 64, maxLength: 64 }, route: { const: "openai-responses-v1" } }, required: ["mode", "strict", "name", "schema", "schemaSha256", "route"], additionalProperties: false },
      communication: { type: "object", properties: { mode: { const: "bulletin" }, channel: { type: "string", minLength: 1, maxLength: 128 }, read: { type: "boolean" }, publish: { type: "boolean" }, schema: opaque, schemaSha256: { type: "string", minLength: 64, maxLength: 64 } }, required: ["mode", "channel", "read", "publish", "schema", "schemaSha256"], additionalProperties: false },
      nativeTools: { type: "array", maxItems: 128, items: { type: "string", minLength: 1, maxLength: 192 } },
    }, [...mutationRequired, "taskId", "attemptId", "executionId", "idempotencyKey", "profile", "model", "prompt"]),
    inspect: method({ ...scope, executionId: string }, [...scopeRequired, "executionId"]),
    snapshot: method(scope, scopeRequired),
    bulletinSnapshot: method({ ...scope, channel: { type: "string", minLength: 1, maxLength: 128 } }, scopeRequired),
    replay: method({ ...scope, cursor: integer, limit: { type: "integer", minimum: 1, maximum: 1000 } }, scopeRequired),
    control: method({ ...mutation, action: { enum: ["pause", "resume", "renew", "recover"] }, leaseMs: { type: "integer", minimum: 1, maximum: 300000 } }, [...mutationRequired, "action"]),
    stop: method({ ...mutation, executionId: string }, [...mutationRequired, "executionId"]),
  },
  // Journal access is authenticated per method. Do not broadcast private mission
  // data on RPC events, which have no per-subscriber operator authorization.
  events: {},
})
