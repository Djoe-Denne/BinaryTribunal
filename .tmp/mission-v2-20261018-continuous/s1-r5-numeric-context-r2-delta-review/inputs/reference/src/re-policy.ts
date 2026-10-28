import type { FunctionIdentity, Intent, Role } from "./domain";
import { canonical, hash, identityKey, validateIdentity } from "./validation";

/** Operator-vetted semantics, never inferred from an MCP tool ID or a prompt. */
export const IDA_READ_OPERATIONS = ["disasm", "decompile", "lookup_funcs", "list_funcs", "list_globals", "imports", "xrefs_to", "callees", "basic_blocks", "get_bytes", "get_int", "get_string", "get_global_value", "stack_frame", "read_struct"] as const;
export type IdaReadOperation = typeof IDA_READ_OPERATIONS[number];
export interface NativeReadAccess { action: string; resource: "*" }
export interface IdaReadBinding { operation: IdaReadOperation; tool: string; accesses: NativeReadAccess[] }
export interface REPolicy { version: 1; workKind: "decompilation" | "semantification"; idaReadBindings: IdaReadBinding[]; reconcilerSharing: boolean }
export interface Neighborhood { id: string; members: FunctionIdentity[] }
export interface BulletinContract { mode: "bulletin"; channel: string; read: true; publish: true; schema: Record<string, unknown>; schemaSha256: string }
export interface EffectiveREPolicy {
  version: 1; policySha256: string; workKind: REPolicy["workKind"]; role: Role; profile: string; roleInstructionsHash: string;
  access: "frozen-only" | "ida-readonly"; idaReadBindings: IdaReadBinding[]; instructions: string[];
  communication?: BulletinContract;
}
function requirePolicy(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`RE policy: ${message}`); }
function closed(value: unknown, keys: string[], label: string): asserts value is Record<string, unknown> {
  requirePolicy(value !== null && typeof value === "object" && !Array.isArray(value), `${label} object required`);
  requirePolicy(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${label} requires exact fields ${keys.join(",")}`);
}
function exactNativeId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,191}$/.test(value)
    && !["read", "edit", "execute", "shell", "glob", "grep", "patch", "bash", "write", "apply_patch", "list", "ls", "webfetch", "websearch", "question", "task", "subagent", "skill", "batch", "lsp"].includes(value)
    && !/^(team|execution)[_.-]/.test(value)
    && !/(?:^|[_.-])(?:py_eval|script|scripts|set_type|SetType|rename|set_comments|save|patch|put_int|declare_type|infer_types|dbg)(?:$|[_.-])/i.test(value);
}
export function validateREPolicy(value: unknown): REPolicy {
  closed(value, ["version", "workKind", "idaReadBindings", "reconcilerSharing"], "configuration");
  requirePolicy(value.version === 1 && typeof value.workKind === "string" && ["decompilation", "semantification"].includes(value.workKind) && typeof value.reconcilerSharing === "boolean", "explicit version/workKind/reconcilerSharing required");
  requirePolicy(Array.isArray(value.idaReadBindings) && value.idaReadBindings.length > 0 && value.idaReadBindings.length <= IDA_READ_OPERATIONS.length, "bounded exact IDA bindings required");
  const tools = new Set<string>(), operations = new Set<string>(), resources = new Set<string>();
  for (const binding of value.idaReadBindings) {
    closed(binding, ["operation", "tool", "accesses"], "IDA binding");
    requirePolicy(IDA_READ_OPERATIONS.includes(binding.operation as IdaReadOperation) && !operations.has(String(binding.operation)), "unknown/duplicate read operation");
    // These deny checks never confer authority; operation semantics still require an operator-vetted exact mapping.
    requirePolicy(exactNativeId(binding.tool), "exact registered non-reserved readonly tool ID required");
    requirePolicy(!tools.has(binding.tool), "duplicate native tool ID");
    requirePolicy(Array.isArray(binding.accesses) && binding.accesses.length > 0 && binding.accesses.length <= 8, "bounded native accesses required");
    for (const access of binding.accesses) {
      closed(access, ["action", "resource"], "native access");
      requirePolicy(exactNativeId(access.action) && access.resource === "*" && !resources.has(access.action), "unique exact native MCP action and canonical '*' resource required; never infer an action or substitute an ida:// URI");
      resources.add(access.action);
    }
    operations.add(String(binding.operation)); tools.add(binding.tool);
  }
  requirePolicy(operations.has("disasm"), "R requires an exact native disasm binding");
  return structuredClone(value) as unknown as REPolicy;
}
export function validateREMode(policy: REPolicy | undefined, options: { outputMode?: string; admissionMode: string; allowedTools: string[] }): void {
  if (policy === undefined) return;
  validateREPolicy(policy);
  requirePolicy(options.outputMode === "json-schema-strict" && options.admissionMode === "native-boundary-witness", "strict output and native-boundary-witness required");
  requirePolicy(options.allowedTools.includes("read") && options.allowedTools.every(t => t === "read" || t === "execute") && new Set(options.allowedTools).size === options.allowedTools.length, "ordinary tools must be read/execute only");
}
export function validateNeighborhood(intent: Intent): Neighborhood {
  const raw = intent.inputs.neighborhood;
  requirePolicy(intent.role === "R" && raw && intent.identity && intent.inputs.cycle === intent.cycle, "R frozen neighborhood required");
  closed(raw, ["id", "members"], "neighborhood");
  requirePolicy(Array.isArray(raw.members) && raw.members.length > 0 && raw.members.length <= 128, "bounded neighborhood members required");
  let members: FunctionIdentity[];
  try { members = raw.members.map(m => validateIdentity(m, intent.binary)); }
  catch { throw new Error("RE policy: neighborhood binary/identity mismatch"); }
  const keys = members.map(identityKey), sorted = [...keys].sort();
  requirePolicy(new Set(keys).size === keys.length && keys.includes(identityKey(intent.identity)) && canonical(keys) === canonical(sorted)
    && raw.id === hash(canonical(sorted)), "neighborhood membership/order/hash mismatch");
  return { id: raw.id, members };
}
function objectSchema(properties: Record<string, unknown>): Record<string, unknown> {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
/** Finite closed schema in the generic bridge's supported strict subset. */
export function bulletinContract(intent: Intent, bindings: IdaReadBinding[]): BulletinContract {
  const group = validateNeighborhood(intent), eas = group.members.map(m => m.ea), disasm = bindings.find(b => b.operation === "disasm")!;
  const text = (maxLength: number) => ({ type: "string", minLength: 1, maxLength });
  const schema = objectSchema({
    sourceBinary: objectSchema({ sha256: { type: "string", const: intent.binary.sha256 }, version: { type: "string", const: intent.binary.version } }),
    kind: { type: "string", enum: ["observation", "hypothesis"] }, status: { type: "string", const: "provisional" }, summary: text(1800),
    evidence: { type: "array", minItems: 1, maxItems: 32, items: objectSchema({ memberEA: { type: "string", enum: eas }, address: text(18), asm: text(1800),
      tool: { type: "string", const: disasm.tool }, resource: { type: "string", enum: disasm.accesses.map(a => a.resource) }, sha256: { type: "string", minLength: 64, maxLength: 64 } }) },
    affectedEAs: { type: "array", minItems: 1, maxItems: eas.length, items: { type: "string", enum: eas } },
    questions: { type: "array", minItems: 0, maxItems: 32, items: text(1800) },
  });
  return { mode: "bulletin", channel: `ff8-r-${hash(canonical({ mission: intent.missionId, cycle: intent.cycle, group: group.id }))}`, read: true, publish: true, schema, schemaSha256: hash(canonical(schema)) };
}
export function effectiveREPolicy(policy: REPolicy, intent: Intent, profile: string, instructions: string): EffectiveREPolicy {
  const p = validateREPolicy(policy), native = intent.role === "R" || (p.workKind === "semantification" && (intent.role === "A" || intent.role === "B"));
  requirePolicy(intent.inputs.role === intent.role, "input role mismatch");
  if (intent.role !== "R") requirePolicy(intent.inputs.neighborhood === undefined && intent.inputs.proposals === undefined && intent.inputs.files.every(f => f.kind !== "proposal"), "peer content/neighborhood forbidden for authors and frozen roles");
  if (intent.role === "R") validateNeighborhood(intent);
  const communication = intent.role === "R" && p.reconcilerSharing ? bulletinContract(intent, p.idaReadBindings) : undefined;
  return { version: 1, policySha256: hash(canonical(p)), workKind: p.workKind, role: intent.role, profile, roleInstructionsHash: hash(instructions),
    access: native ? "ida-readonly" : "frozen-only", idaReadBindings: native ? p.idaReadBindings : [], ...(communication ? { communication } : {}),
    instructions: [
      native ? "Use only the exact operator-vetted IDA readonly bindings. No scripts, py_eval, mutations, type/rename/comment/save or debugger tools."
        : "Use frozen inputs only. Complexity selection is upstream. Insufficient inputs must be reported as blocked/questions; never query IDA or escalate tools.",
      "Missing inputs or tools must be reported as blocked/questions. No edit, shell, team_message, subagents or peer-author communication.",
      ...(intent.role === "R" ? ["Compare author JSON against native ASM; a successful native disasm read is required in addition to all frozen file reads.",
        "Peer observations/hypotheses are provisional leads only, not independent confirmation. Independently rederive every used lead in native IDA.",
        communication ? "Bulletin access is optional pull-only: execution_bulletin_publish({key,payload}) and execution_bulletin_read({after?,limit?}). Neither tool accepts scope or author selectors; the assigned mission/cycle/neighborhood is immutable. Never forward peer content to ongoing A/B authors or choose another channel."
          : "Peer bulletin communication is disabled.",
        "Bulletin evidence.sha256 is a publisher-declared provisional source fingerprint. Format and source identity checks do not attest the bytes returned by native ASM or the scientific truth of a claim.",
        "Never publish canonical knowledge or write IDB. Only the parent can validate, publish and read back accepted knowledge."] : []),
    ] };
}

/** Readback includes ordered immutable bindings and their generic admission digest. */
export function assertNativeREBindings(policy: EffectiveREPolicy, execution: Record<string, unknown>): void {
  const selection = execution.selection as { nativeToolBindings?: unknown; hashes?: { nativeToolBindings?: unknown } } | undefined;
  const bindings = policy.idaReadBindings.map(({ tool, accesses }) => ({ tool, accesses }));
  requirePolicy(canonical(selection?.nativeToolBindings) === canonical(bindings) && selection?.hashes?.nativeToolBindings === hash(canonical(bindings)), "resolved native binding/hash readback mismatch");
}
export interface NativeReadWitness {
  id: string; action: string; resource: string; sessionId: string; profile: string; effect: "allow"; verifierSource: string;
  native: { messageID: string; id: string; tool: string; status: "completed" };
}
export function disasmWitnesses(policy: EffectiveREPolicy, execution: Record<string, unknown>, sessionId: string): NativeReadWitness[] {
  const disasm = policy.idaReadBindings.find(b => b.operation === "disasm"), witnesses = execution.accessWitnesses;
  if (!disasm || !Array.isArray(witnesses)) return [];
  return witnesses.filter(w => w && disasm.accesses.some(access => w.action === access.action && w.resource === access.resource)
    && w.sessionId === sessionId && w.profile === policy.profile && w.effect === "allow" && typeof w.id === "string" && w.id.length > 0
    && w.verifierSource === "public.tool.execute.before+execute.after-leaf-success"
    && w.native?.tool === disasm.tool && w.native?.status === "completed" && typeof w.native?.messageID === "string" && w.native.messageID.length > 0
    && typeof w.native?.id === "string" && w.native.id.length > 0) as NativeReadWitness[];
}
/** Generic guard-produced witnesses, not assertions in the worker's scientific payload. */
export function assertNativeREAccess(policy: EffectiveREPolicy, execution: Record<string, unknown>, sessionId: string): void {
  assertNativeREBindings(policy, execution);
  requirePolicy(execution.accessVerified === true, "native input access not verified");
  if (policy.role !== "R") return;
  const disasm = policy.idaReadBindings.find(b => b.operation === "disasm")!;
  const witnesses = disasmWitnesses(policy, execution, sessionId);
  requirePolicy(disasm.accesses.every(access => witnesses.some(w => w.action === access.action && w.resource === access.resource)), "successful native disasm read witness missing or mismatched");
}
