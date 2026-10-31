/** Execution protocol DATA. OpenCode owns security and permissions; adapters preserve native evidence and refusals. */
export const EXECUTION_PORT_VERSION_V1 = "rms-native-execution-port-v1" as const;
type Version = typeof EXECUTION_PORT_VERSION_V1;
export type ExecutionReadonlyV1<T> = T extends object ? { readonly [K in keyof T]: ExecutionReadonlyV1<T[K]> } : T;
export type ExecutionDigestDomainV1 = "rms-retained-input-v1" | "rms-proposed-runtime-input-v1" | "rms-command-v1" | "rms-observation-v1" | "rms-control-v1" | "runtime-delivered-input-v1" | "runtime-invocation-v1" | "provider-request-v1" | "execution-result-v1" | "execution-evidence-v1";
export interface ExecutionByteRefV1<D extends ExecutionDigestDomainV1 = ExecutionDigestDomainV1> { domain: D; byteLength: number; sha256: string }
export interface ExecutionEvidenceRefV1 { source: string; recordId: string; bytes: ExecutionByteRefV1<"execution-evidence-v1"> }
export interface ExecutionTextV1<D extends ExecutionDigestDomainV1> { utf8: string; ref: ExecutionByteRefV1<D> }
export interface ExecutionCodecV1 { sha256(bytes: Uint8Array): string }
export interface ExecutionIdentityV1 { missionId: string; unitId: string; subIntentId: string; executionId: string; generationId: string; attemptId: string; idempotencyKey: string }
export interface ExecutionFencesV1 { family: number; controller: number }
export interface ExecutionModelRefV1 { providerID: string; id: string; variant: string }
/** Requested capture caps, NOT lineage allocation, native budget or RPC limits. */
export interface ExecutionCaptureCapsV1 { maxCommandImageUtf8Bytes: number; maxObservationImageUtf8Bytes: number; maxControlImageUtf8Bytes: number }
export interface ExecutionCommandV1 {
  version: Version; kind: "execute"; identity: ExecutionIdentityV1; fences: ExecutionFencesV1;
  retainedInput: ExecutionTextV1<"rms-retained-input-v1">;
  proposedRuntimeInput: ExecutionTextV1<"rms-proposed-runtime-input-v1">;
  expectations: { profile: string; modelRef: ExecutionModelRefV1;
    context: { fresh: true; parentSessionId: null; independenceRef: ExecutionEvidenceRefV1 };
    permissionsRef: ExecutionEvidenceRefV1; policyRef: ExecutionEvidenceRefV1 };
  captureCaps: ExecutionCaptureCapsV1;
}
export interface CapturedExecutionDataV1<T, D extends ExecutionDigestDomainV1> {
  readonly value: ExecutionReadonlyV1<T>;
  /** Complete deterministic DTO image; its own ref is outside the hashed image. */
  readonly image: ExecutionReadonlyV1<ExecutionTextV1<D>>;
}
export type CapturedExecutionCommandV1 = CapturedExecutionDataV1<ExecutionCommandV1, "rms-command-v1">;
export interface CurrentExecutionScopeV1 { identity: ExecutionIdentityV1; fences: ExecutionFencesV1; commandRef: ExecutionByteRefV1<"rms-command-v1"> }
export interface ExecutionObservationBaseV1 extends CurrentExecutionScopeV1 {
  version: Version; sourceStreamId: string; eventId: string; sourceSequence: number; evidenceRefs: ExecutionEvidenceRefV1[];
}
/** Before ANY target runtime/session/tool effect. Audit/refusal logging is not the
 * target actuator and confers no refund. Possible entry/lost response is ambiguous.
 */
export interface ExecutionBeforeEffectV1 { scope: "before-any-native-command-effect"; evidenceRefs: ExecutionEvidenceRefV1[] }
export type ExecutionAdmissionDeclarationV1 = ExecutionObservationBaseV1 & (
  { kind: "accepted"; receiptRef: ExecutionEvidenceRefV1 } |
  { kind: "rejected-definitive" | "unavailable-before-effect"; reason: string; beforeEffect: ExecutionBeforeEffectV1 } |
  { kind: "ambiguous"; reason: string }
);
export type ExecutionObservationV1 = ExecutionAdmissionDeclarationV1 | (ExecutionObservationBaseV1 & (
  { kind: "delivery-observed"; deliveredInput: ExecutionTextV1<"runtime-delivered-input-v1">;
    runtimeInvocationRef: ExecutionByteRefV1<"runtime-invocation-v1"> | null;
    providerRequestRef: ExecutionByteRefV1<"provider-request-v1"> | null;
    hostIdentityRef: ExecutionEvidenceRefV1 | null; modelRef: ExecutionModelRefV1 | null;
    permissionsRef: ExecutionEvidenceRefV1 | null; authorIdentityRef: ExecutionEvidenceRefV1 | null; contextRef: ExecutionEvidenceRefV1 | null } |
  { kind: "result-received"; result: ExecutionTextV1<"execution-result-v1"> } |
  { kind: "quiescence-reported"; reason: string; terminalEvidenceRefs: ExecutionEvidenceRefV1[] } |
  { kind: "absence-reported"; report: "absent" | "idle" | "completed"; reason: string }
));
export type CapturedExecutionObservationV1 = CapturedExecutionDataV1<ExecutionObservationV1, "rms-observation-v1">;
export interface ExecutionControlV1 extends CurrentExecutionScopeV1 {
  version: Version; kind: "control"; controlId: string; action: "pause" | "stop" | "obsolete";
  sequence: number; expectedRevision: number; reason: string;
}
export type CapturedExecutionControlV1 = CapturedExecutionDataV1<ExecutionControlV1, "rms-control-v1">;
export interface ExecutionObservationRequestV1 extends CurrentExecutionScopeV1 {
  version: Version; kind: "observe-execution"; cursors: { sourceStreamId: string; afterSequence: number }[];
}
export interface ExecutionAdmissionReconciliationRequestV1 extends CurrentExecutionScopeV1 {
  version: Version; kind: "reconcile-admission"; priorObservationRefs: ExecutionByteRefV1<"rms-observation-v1">[];
}
export interface ExecutionCapabilitiesV1 {
  version: Version; operations: ("submit" | "observe" | "reconcile" | "control")[];
  evidenceKinds: string[]; hostEvidenceRef: ExecutionEvidenceRefV1 | null;
}
export type ExecutionControlReceiptV1 = {
  version: Version; controlRef: ExecutionByteRefV1<"rms-control-v1">; evidenceRefs: ExecutionEvidenceRefV1[];
} & ({ declaration: "recorded" } | { declaration: "ambiguous"; reason: string } |
  { declaration: "unavailable-before-effect"; reason: string; beforeEffect: ExecutionBeforeEffectV1 });
/** Business execution operations. SDK adapters use the normal host APIs and permissions. */
export interface ExecutionPortV1 {
  capabilities(): Promise<ExecutionReadonlyV1<ExecutionCapabilitiesV1>>;
  submit(command: CapturedExecutionCommandV1): Promise<CapturedExecutionDataV1<ExecutionAdmissionDeclarationV1, "rms-observation-v1">>;
  observe(request: ExecutionReadonlyV1<ExecutionObservationRequestV1>): Promise<readonly CapturedExecutionObservationV1[]>;
  reconcile(request: ExecutionReadonlyV1<ExecutionAdmissionReconciliationRequestV1>): Promise<CapturedExecutionDataV1<ExecutionAdmissionDeclarationV1, "rms-observation-v1">>;
  control(command: CapturedExecutionControlV1): Promise<ExecutionReadonlyV1<ExecutionControlReceiptV1>>;
}

type Data = Record<string, unknown>;
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`execution DATA: ${message}`); }
/** Boundary DTO checks, not a JS sandbox or universal Proxy detector. Trusted
 * codec/wiring and actual JSON boundaries remain the adapter's responsibility.
 */
function object(value: unknown): Data {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  const proto = Object.getPrototypeOf(value);
  check(proto === Object.prototype || proto === null, "plain DTO required");
  check(Object.getOwnPropertySymbols(value).length === 0, "symbol property");
  const descriptors = Object.getOwnPropertyDescriptors(value), copy: Data = Object.create(null);
  for (const key of Object.getOwnPropertyNames(descriptors)) {
    const descriptor = descriptors[key];
    check(descriptor.enumerable && Object.hasOwn(descriptor, "value"), "accessor/non-enumerable property");
    Object.defineProperty(copy, key, { value: descriptor.value, enumerable: true });
  }
  return copy;
}
function closed(value: unknown, keys: readonly string[]): Data {
  const copy = object(value), actual = Object.keys(copy);
  check(actual.length === keys.length && keys.every(key => Object.hasOwn(copy, key)), "closed DTO fields");
  return copy;
}
function text(value: unknown, allowEmpty = false): string {
  check(typeof value === "string" && (allowEmpty || value.length > 0), "string required");
  // No silent replacement of unpaired UTF-16 surrogates by TextEncoder.
  check(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value), "unpaired surrogate");
  return value;
}
function integer(value: unknown, minimum = 1): number { check(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum, "safe integer required"); return value; }
function literal<T extends string>(value: unknown, expected: T): T { check(value === expected, `expected ${expected}`); return expected; }
function choice<T extends string>(value: unknown, choices: readonly T[]): T { check(typeof value === "string" && choices.includes(value as T), "unknown declaration"); return value as T; }
function array<T>(value: unknown, decode: (item: unknown) => T, minimum = 0): T[] {
  check(Array.isArray(value), "array required");
  check(Object.getPrototypeOf(value) === Array.prototype && Object.getOwnPropertySymbols(value).length === 0, "plain array required");
  const names = Object.getOwnPropertyNames(value);
  check(names.length === value.length + 1, "array extra properties or holes");
  const result: T[] = [];
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    check(descriptor?.enumerable && Object.hasOwn(descriptor, "value"), "array accessor or hole");
    result.push(decode(descriptor.value));
  }
  check(result.length >= minimum, "missing evidence references");
  return result;
}
function detach(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return text(value, true);
  if (typeof value === "number") { check(Number.isFinite(value), "finite JSON number required"); return value; }
  check(typeof value === "object" && value !== null, "JSON DATA required");
  check(!ancestors.has(value), "cyclic DTO"); ancestors.add(value);
  let copy: unknown;
  if (Array.isArray(value)) copy = array(value, item => detach(item, ancestors));
  else {
    const source = object(value), target: Data = Object.create(null);
    for (const key of Object.keys(source)) Object.defineProperty(target, key, { value: detach(source[key], ancestors), enumerable: true });
    copy = target;
  }
  ancestors.delete(value);
  return copy;
}
function ref<D extends ExecutionDigestDomainV1>(value: unknown, domain: D): ExecutionByteRefV1<D> {
  const v = closed(value, ["domain", "byteLength", "sha256"]), sha256 = text(v.sha256);
  check(/^[a-f0-9]{64}$/.test(sha256), "SHA-256 required");
  return { domain: literal(v.domain, domain), byteLength: integer(v.byteLength, 0), sha256 };
}
function measure<D extends ExecutionDigestDomainV1>(utf8: string, domain: D, codec: ExecutionCodecV1): ExecutionByteRefV1<D> {
  const bytes = new TextEncoder().encode(utf8), sha256 = codec.sha256(bytes.slice());
  return ref({ domain, byteLength: bytes.length, sha256 }, domain);
}
function equal(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function boundText<D extends ExecutionDigestDomainV1>(value: unknown, domain: D, codec: ExecutionCodecV1): ExecutionTextV1<D> {
  const v = closed(value, ["utf8", "ref"]), utf8 = text(v.utf8, true), supplied = ref(v.ref, domain);
  check(equal(supplied, measure(utf8, domain, codec)), "text bytes/digest mismatch");
  return { utf8, ref: supplied };
}
function evidence(value: unknown): ExecutionEvidenceRefV1 {
  const v = closed(value, ["source", "recordId", "bytes"]);
  return { source: text(v.source), recordId: text(v.recordId), bytes: ref(v.bytes, "execution-evidence-v1") };
}
function nullable<T>(value: unknown, decode: (item: unknown) => T): T | null { return value === null ? null : decode(value); }
const identityKeys = ["missionId", "unitId", "subIntentId", "executionId", "generationId", "attemptId", "idempotencyKey"] as const;
function identity(value: unknown): ExecutionIdentityV1 {
  const v = closed(value, identityKeys);
  return { missionId: text(v.missionId), unitId: text(v.unitId), subIntentId: text(v.subIntentId), executionId: text(v.executionId), generationId: text(v.generationId), attemptId: text(v.attemptId), idempotencyKey: text(v.idempotencyKey) };
}
function fences(value: unknown): ExecutionFencesV1 { const v = closed(value, ["family", "controller"]); return { family: integer(v.family), controller: integer(v.controller) }; }
function model(value: unknown): ExecutionModelRefV1 { const v = closed(value, ["providerID", "id", "variant"]); return { providerID: text(v.providerID), id: text(v.id), variant: text(v.variant) }; }
function scope(value: unknown): CurrentExecutionScopeV1 {
  const v = closed(value, ["identity", "fences", "commandRef"]);
  return { identity: identity(v.identity), fences: fences(v.fences), commandRef: ref(v.commandRef, "rms-command-v1") };
}
function freeze<T>(value: T): ExecutionReadonlyV1<T> {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as ExecutionReadonlyV1<T>;
}
function capture<T, D extends ExecutionDigestDomainV1>(value: T, domain: D, cap: number, codec: ExecutionCodecV1): CapturedExecutionDataV1<T, D> {
  const utf8 = JSON.stringify(value);
  // Include the complete DTO image, escaping and refs; exclude only its own ref.
  check(new TextEncoder().encode(utf8).length <= cap, `${domain} complete image exceeds capture cap`);
  return freeze({ value, image: { utf8, ref: measure(utf8, domain, codec) } });
}
export function captureExecutionCommandV1(input: unknown, codec: ExecutionCodecV1): CapturedExecutionCommandV1 {
  const v = closed(input, ["version", "kind", "identity", "fences", "retainedInput", "proposedRuntimeInput", "expectations", "captureCaps"]);
  const e = closed(v.expectations, ["profile", "modelRef", "context", "permissionsRef", "policyRef"]);
  const c = closed(e.context, ["fresh", "parentSessionId", "independenceRef"]), limits = closed(v.captureCaps, ["maxCommandImageUtf8Bytes", "maxObservationImageUtf8Bytes", "maxControlImageUtf8Bytes"]);
  check(c.fresh === true && c.parentSessionId === null, "fresh independent context expectation required");
  // Normalize/copy ALL fields before invoking the configured codec.
  const capturedIdentity = identity(v.identity), capturedFences = fences(v.fences);
  const expectations = { profile: text(e.profile), modelRef: model(e.modelRef), context: { fresh: true as const, parentSessionId: null, independenceRef: evidence(c.independenceRef) }, permissionsRef: evidence(e.permissionsRef), policyRef: evidence(e.policyRef) };
  const captureCaps = { maxCommandImageUtf8Bytes: integer(limits.maxCommandImageUtf8Bytes), maxObservationImageUtf8Bytes: integer(limits.maxObservationImageUtf8Bytes), maxControlImageUtf8Bytes: integer(limits.maxControlImageUtf8Bytes) };
  const retained = closed(v.retainedInput, ["utf8", "ref"]), proposed = closed(v.proposedRuntimeInput, ["utf8", "ref"]);
  const retainedInput = { utf8: text(retained.utf8, true), ref: ref(retained.ref, "rms-retained-input-v1") };
  const proposedRuntimeInput = { utf8: text(proposed.utf8, true), ref: ref(proposed.ref, "rms-proposed-runtime-input-v1") };
  const value: ExecutionCommandV1 = { version: literal(v.version, EXECUTION_PORT_VERSION_V1), kind: literal(v.kind, "execute"), identity: capturedIdentity, fences: capturedFences, retainedInput, proposedRuntimeInput, expectations, captureCaps };
  boundText(retainedInput, "rms-retained-input-v1", codec); boundText(proposedRuntimeInput, "rms-proposed-runtime-input-v1", codec);
  return capture(value, "rms-command-v1", captureCaps.maxCommandImageUtf8Bytes, codec);
}
function checkedCommand(command: CapturedExecutionCommandV1, codec: ExecutionCodecV1): CapturedExecutionCommandV1 {
  const v = closed(command, ["value", "image"]), next = captureExecutionCommandV1(v.value, codec);
  check(equal(boundText(v.image, "rms-command-v1", codec), next.image), "captured command image conflict");
  return next;
}
/** Exact DATA replay check only. Never authorizes a retry or sends anything. */
export function assertExactExecutionRetryV1(retained: CapturedExecutionCommandV1, candidate: unknown, codec: ExecutionCodecV1): CapturedExecutionCommandV1 {
  const copiedCandidate = detach(candidate);
  const old = checkedCommand(retained, codec), next = captureExecutionCommandV1(copiedCandidate, codec);
  check(equal(old.image, next.image), "exact replay conflict");
  return next;
}
const observationBaseKeys = ["version", "kind", "identity", "fences", "commandRef", "sourceStreamId", "eventId", "sourceSequence", "evidenceRefs"];
export function captureExecutionObservationV1(command: CapturedExecutionCommandV1, input: unknown, codec: ExecutionCodecV1): CapturedExecutionObservationV1 {
  const copiedInput = detach(input);
  const retained = checkedCommand(command, codec), initial = object(copiedInput), kind = text(initial.kind);
  const extras: Record<string, string[]> = {
    accepted: ["receiptRef"], "rejected-definitive": ["reason", "beforeEffect"], "unavailable-before-effect": ["reason", "beforeEffect"], ambiguous: ["reason"],
    "delivery-observed": ["deliveredInput", "runtimeInvocationRef", "providerRequestRef", "hostIdentityRef", "modelRef", "permissionsRef", "authorIdentityRef", "contextRef"],
    "result-received": ["result"], "quiescence-reported": ["reason", "terminalEvidenceRefs"], "absence-reported": ["report", "reason"],
  };
  check(Object.hasOwn(extras, kind), "unknown observation kind");
  const v = closed(initial, [...observationBaseKeys, ...extras[kind]]);
  const base: ExecutionObservationBaseV1 = { version: literal(v.version, EXECUTION_PORT_VERSION_V1), identity: identity(v.identity), fences: fences(v.fences), commandRef: ref(v.commandRef, "rms-command-v1"), sourceStreamId: text(v.sourceStreamId), eventId: text(v.eventId), sourceSequence: integer(v.sourceSequence), evidenceRefs: array(v.evidenceRefs, evidence) };
  let value: ExecutionObservationV1;
  switch (kind) {
    case "accepted": value = { ...base, kind, receiptRef: evidence(v.receiptRef) }; break;
    case "rejected-definitive": case "unavailable-before-effect": {
      const b = closed(v.beforeEffect, ["scope", "evidenceRefs"]);
      value = { ...base, kind, reason: text(v.reason), beforeEffect: { scope: literal(b.scope, "before-any-native-command-effect"), evidenceRefs: array(b.evidenceRefs, evidence, 1) } }; break;
    }
    case "ambiguous": value = { ...base, kind, reason: text(v.reason) }; break;
    case "delivery-observed": {
      // Capture every field BEFORE any codec callback can mutate caller data.
      const d = closed(v.deliveredInput, ["utf8", "ref"]), deliveredInput = { utf8: text(d.utf8, true), ref: ref(d.ref, "runtime-delivered-input-v1") };
      value = { ...base, kind, deliveredInput, runtimeInvocationRef: nullable(v.runtimeInvocationRef, x => ref(x, "runtime-invocation-v1")), providerRequestRef: nullable(v.providerRequestRef, x => ref(x, "provider-request-v1")), hostIdentityRef: nullable(v.hostIdentityRef, evidence), modelRef: nullable(v.modelRef, model), permissionsRef: nullable(v.permissionsRef, evidence), authorIdentityRef: nullable(v.authorIdentityRef, evidence), contextRef: nullable(v.contextRef, evidence) };
      boundText(deliveredInput, "runtime-delivered-input-v1", codec); break;
    }
    case "result-received": value = { ...base, kind, result: boundText(v.result, "execution-result-v1", codec) }; break;
    case "quiescence-reported": value = { ...base, kind, reason: text(v.reason), terminalEvidenceRefs: array(v.terminalEvidenceRefs, evidence, 1) }; break;
    default: value = { ...base, kind: "absence-reported", report: choice(v.report, ["absent", "idle", "completed"]), reason: text(v.reason) };
  }
  return capture(value, "rms-observation-v1", retained.value.captureCaps.maxObservationImageUtf8Bytes, codec);
}
function differences(actual: CurrentExecutionScopeV1, current: CurrentExecutionScopeV1): string[] {
  const reasons: string[] = [];
  for (const key of identityKeys) if (actual.identity[key] !== current.identity[key]) reasons.push(`identity.${key}`);
  for (const key of ["family", "controller"] as const) if (actual.fences[key] !== current.fences[key]) reasons.push(`fences.${key}`);
  if (!equal(actual.commandRef, current.commandRef)) reasons.push("commandRef");
  return reasons;
}
export function captureExecutionControlV1(command: CapturedExecutionCommandV1, input: unknown, codec: ExecutionCodecV1): CapturedExecutionControlV1 {
  const copiedInput = detach(input);
  const retained = checkedCommand(command, codec), v = closed(copiedInput, ["version", "kind", "identity", "fences", "commandRef", "controlId", "action", "sequence", "expectedRevision", "reason"]);
  const target = scope({ identity: v.identity, fences: v.fences, commandRef: v.commandRef });
  check(differences(target, { identity: retained.value.identity, fences: retained.value.fences, commandRef: retained.image.ref }).length === 0, "control target conflict");
  const value: ExecutionControlV1 = { version: literal(v.version, EXECUTION_PORT_VERSION_V1), kind: literal(v.kind, "control"), ...target, controlId: text(v.controlId), action: choice(v.action, ["pause", "stop", "obsolete"]), sequence: integer(v.sequence), expectedRevision: integer(v.expectedRevision, 0), reason: text(v.reason) };
  return capture(value, "rms-control-v1", retained.value.captureCaps.maxControlImageUtf8Bytes, codec);
}
export interface ExecutionObservationAuditV1 {
  declarations: { observation: CapturedExecutionObservationV1; disposition: "current" | "audit-only"; differences: string[] }[];
  duplicates: { sourceStreamId: string; eventId: string; originalIndex: number; duplicateIndex: number }[];
  conflicts: { kind: "event-image-divergence" | "source-sequence-collision" | "admission-declaration-conflict" | "delivery-input-mismatch"; indices: number[] }[];
}
/** Descriptive audit projection only. Original images/collisions are all retained.
 * No global source order, favorable-last-wins, native qualification, CAS, credits,
 * action flag, release decision or inferred quiescence exists here.
 */
export function summarizeExecutionObservationsV1(command: CapturedExecutionCommandV1, observations: readonly CapturedExecutionObservationV1[], currentInput: unknown, codec: ExecutionCodecV1): ExecutionReadonlyV1<ExecutionObservationAuditV1> {
  const copiedCurrent = detach(currentInput), copiedObservations = array(observations, item => closed(detach(item), ["value", "image"]));
  const retained = checkedCommand(command, codec), current = scope(copiedCurrent);
  const expected: CurrentExecutionScopeV1 = { identity: retained.value.identity, fences: retained.value.fences, commandRef: retained.image.ref };
  const audit: ExecutionObservationAuditV1 = { declarations: [], duplicates: [], conflicts: [] };
  for (const item of copiedObservations) {
    const envelope = closed(item, ["value", "image"]), observation = captureExecutionObservationV1(retained, envelope.value, codec);
    check(equal(boundText(envelope.image, "rms-observation-v1", codec), observation.image), "captured observation image conflict");
    const v = observation.value, index = audit.declarations.length;
    const reasons = [...new Set([...differences(expected, current), ...differences(v, expected), ...differences(v, current)])];
    for (let i = 0; i < audit.declarations.length; i++) {
      const prior = audit.declarations[i].observation;
      if (prior.value.sourceStreamId === v.sourceStreamId && prior.value.eventId === v.eventId) {
        if (equal(prior.image, observation.image)) audit.duplicates.push({ sourceStreamId: v.sourceStreamId, eventId: v.eventId, originalIndex: i, duplicateIndex: index });
        else audit.conflicts.push({ kind: "event-image-divergence", indices: [i, index] });
      }
      if (prior.value.sourceStreamId === v.sourceStreamId && prior.value.sourceSequence === v.sourceSequence && prior.value.eventId !== v.eventId) audit.conflicts.push({ kind: "source-sequence-collision", indices: [i, index] });
      const beforeEffect = (k: string) => k === "rejected-definitive" || k === "unavailable-before-effect";
      const effect = (k: string) => k === "accepted" || k === "delivery-observed" || k === "result-received" || k === "quiescence-reported";
      if (differences(prior.value, v).length === 0 && ((beforeEffect(prior.value.kind) && effect(v.kind)) || (effect(prior.value.kind) && beforeEffect(v.kind)))) audit.conflicts.push({ kind: "admission-declaration-conflict", indices: [i, index] });
    }
    if (v.kind === "delivery-observed" && differences(v, expected).length === 0 && v.deliveredInput.utf8 !== retained.value.proposedRuntimeInput.utf8) audit.conflicts.push({ kind: "delivery-input-mismatch", indices: [index] });
    audit.declarations.push({ observation, disposition: reasons.length ? "audit-only" : "current", differences: reasons });
  }
  return freeze(audit);
}
