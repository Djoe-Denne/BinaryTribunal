/** Prospective DATA boundary. No export grants admission or terminality. */
import { assertExecutionJsonV1, makeBoundDocumentV1, parseGraphRunV3, type BoundDocument, type ByteRef } from "./graph-execution-envelope";
import { parseGraphRun } from "./graph-adapter";
import { captureAdmissionImageV3 } from "./graph-generation-budget";
import { canonical, fingerprint, hash } from "./validation";

export type RuntimeOriginV1 =
  | { kind: "graph-v2-fixture"; runRef: ByteRef; stateOwner: "graph-store-v2" }
  | { kind: "graph-v3-data"; runRef: ByteRef; envelopeRef: ByteRef; generationId: string; stateOwner: "generation-store-v3" };
export interface RuntimeBindingV1 {
  version: "rms-runtime-binding-v1"; origin: RuntimeOriginV1;
  admissionCodec: "l8-fixture-admission-codec-v2" | "rms-agent-admission-v1";
  transport: "offline-fixture-v1" | "opencode-v2-rpc-v1";
  knowledgeProjectionPolicyRef: ByteRef | null; nativeQualificationRef: ByteRef | null;
}
export interface PreparedRuntimeV1 { binding: BoundDocument<RuntimeBindingV1>; run: BoundDocument<unknown> }
export interface DispatchScopeV1 {
  missionId: string; cycle: number; unitId: string; functionId: string; subIntentId: string; role: "A" | "B" | "R";
  familyFence: number; controllerFence: number; expectedRevision: number;
  planRef: ByteRef; snapshotRef: ByteRef; inputBundle: BoundDocument<unknown>; outboxRef: ByteRef;
}
export interface DispatchJoinV1 {
  version: "rms-dispatch-join-v1"; bindingRef: ByteRef; origin: RuntimeOriginV1; scope: DispatchScopeV1;
  taskId: string; attemptId: string; executionId: string; idempotencyKey: string;
  requestedProfile: string; requestedModel: { providerID: string; id: string; variant: string };
  admissionRef: ByteRef; clientBodyRef: ByteRef;
  payloadDigest: string; upstreamBodyDigest: string; clientBodyDigest: string;
  /** No RPC bytes observed. Never substitute the durable body digest. */
  rpcBodySha256: null;
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`rms-runtime: ${message}`); }
function closed(value: unknown, keys: string[]): Record<string, any> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  const r = value as Record<string, any>;
  check(Object.keys(r).length === keys.length && keys.every(k => Object.hasOwn(r, k)), "exact fields required"); return r;
}
function text(v: unknown): asserts v is string { check(typeof v === "string" && v.trim().length > 0, "nonempty text required"); }
function integer(v: unknown, min = 0): void { check(Number.isSafeInteger(v) && (v as number) >= min && !Object.is(v, -0), "safe integer required"); }
function byteRef(v: unknown): void {
  const r = closed(v, ["kind", "encoding", "byteLength", "sha256"]); text(r.kind); integer(r.byteLength);
  check(["raw-v1", "utf8-json-v1"].includes(r.encoding) && typeof r.sha256 === "string" && /^[a-f0-9]{64}$/.test(r.sha256), "invalid byte reference");
}
export function readRuntimeDocumentV1<T>(value: BoundDocument<T>): T {
  assertExecutionJsonV1(value); const d = closed(value, ["ref", "utf8"]); byteRef(d.ref); text(d.utf8);
  check(d.ref.encoding === "utf8-json-v1" && Buffer.byteLength(d.utf8, "utf8") === d.ref.byteLength && hash(d.utf8) === d.ref.sha256, "document bytes changed");
  const parsed = JSON.parse(d.utf8); assertExecutionJsonV1(parsed); check(canonical(parsed) === d.utf8, "noncanonical document"); return parsed as T;
}
/** Source bytes only, not a cast between historical run unions. */
export function prepareRuntimeBindingV1(runDocument: BoundDocument<unknown>): PreparedRuntimeV1 {
  const raw = readRuntimeDocumentV1(runDocument) as Record<string, unknown>;
  let origin: RuntimeOriginV1;
  if (raw.version === "l8-graph-run-v3") {
    const parsed = parseGraphRunV3(Buffer.from(runDocument.utf8, "utf8")); check(parsed.ok, "invalid v3 DATA source");
    origin = { kind: "graph-v3-data", runRef: runDocument.ref, envelopeRef: parsed.value.run.envelope.ref,
      generationId: parsed.value.run.generationId, stateOwner: "generation-store-v3" };
  } else {
    const run = parseGraphRun(raw); check(run.version === "l8-graph-run-v2", "only v2 fixture or v3 DATA source");
    origin = { kind: "graph-v2-fixture", runRef: runDocument.ref, stateOwner: "graph-store-v2" };
  }
  const binding = makeBoundDocumentV1<RuntimeBindingV1>("rms-runtime-binding-v1", { version: "rms-runtime-binding-v1", origin,
    admissionCodec: origin.kind === "graph-v2-fixture" ? "l8-fixture-admission-codec-v2" : "rms-agent-admission-v1",
    transport: origin.kind === "graph-v2-fixture" ? "offline-fixture-v1" : "opencode-v2-rpc-v1",
    knowledgeProjectionPolicyRef: null, nativeQualificationRef: null });
  return Object.freeze({ binding, run: makeBoundDocumentV1(runDocument.ref.kind, raw) });
}
export function verifyPreparedRuntimeV1(value: PreparedRuntimeV1): RuntimeBindingV1 {
  assertExecutionJsonV1(value); closed(value, ["binding", "run"]); const actual = prepareRuntimeBindingV1(value.run);
  check(canonical(actual.binding) === canonical(value.binding), "binding/source mismatch or unsupported qualification");
  return readRuntimeDocumentV1(actual.binding);
}
/** Deliberately no enable flag or fixture escape hatch. */
export function refuseNativeRuntimeV1(): never { throw new Error("rms-runtime: native-unavailable; handler/source/version/worker-rights and terminal observer unqualified"); }

export function prepareDispatchJoinV1(runtime: PreparedRuntimeV1, scope: DispatchScopeV1, admission: unknown, body: Record<string, unknown>): BoundDocument<DispatchJoinV1> {
  const binding = verifyPreparedRuntimeV1(runtime); assertExecutionJsonV1({ scope, admission, body });
  closed(scope, ["missionId", "cycle", "unitId", "functionId", "subIntentId", "role", "familyFence", "controllerFence", "expectedRevision", "planRef", "snapshotRef", "inputBundle", "outboxRef"]);
  [scope.missionId, scope.unitId, scope.functionId, scope.subIntentId].forEach(text);
  [scope.cycle, scope.familyFence, scope.controllerFence].forEach(n => integer(n, 1)); integer(scope.expectedRevision);
  [scope.planRef, scope.snapshotRef, scope.outboxRef].forEach(byteRef);
  const inputs = readRuntimeDocumentV1(scope.inputBundle) as Record<string, unknown>;
  const image = captureAdmissionImageV3(admission), a = JSON.parse(image.admissionUtf8), command = a.command;
  const run = readRuntimeDocumentV1(runtime.run) as any;
  const source = binding.origin.kind === "graph-v2-fixture" ? run : readRuntimeDocumentV1(run.envelope) as any;
  const planning = binding.origin.kind === "graph-v2-fixture" ? source.prepared.planning : readRuntimeDocumentV1(source.planning) as any;
  const snapshot = binding.origin.kind === "graph-v2-fixture" ? source.prepared.snapshot : readRuntimeDocumentV1(source.fullGraphSnapshot) as any;
  const unit = planning.units.find((u: any) => u.unitId === scope.unitId), sub = unit?.subIntents.find((s: any) => s.subIntentId === scope.subIntentId);
  check(run.missionId === scope.missionId && sub?.functionId === scope.functionId && sub.role === scope.role && a.role === scope.role && a.subIntentId === scope.subIntentId, "admission/source scope mismatch");
  check(canonical(makeBoundDocumentV1(scope.planRef.kind, planning).ref) === canonical(scope.planRef) && canonical(makeBoundDocumentV1(scope.snapshotRef.kind, snapshot).ref) === canonical(scope.snapshotRef), "plan/snapshot bytes mismatch");
  check(fingerprint(a) === scope.outboxRef.sha256 && scope.outboxRef.byteLength === image.admissionUtf8Bytes, "outbox data image mismatch");
  check(["A", "B", "R"].includes(scope.role) && inputs.role === scope.role && inputs.cycle === scope.cycle && canonical(inputs.identity) === canonical(sub.harnessIdentity), "input projection identity mismatch");
  check(command.dossier && canonical(command.dossier.inputs) === scope.inputBundle.utf8 && command.metadata?.inputFingerprint === fingerprint(inputs), "command/input projection mismatch");
  const cycle = binding.origin.kind === "graph-v2-fixture" ? source.cycle : source.admissionSource.cycle;
  const template = binding.origin.kind === "graph-v2-fixture" ? source : readRuntimeDocumentV1(source.admissionSource.executionTemplate) as any;
  const spec = binding.origin.kind === "graph-v2-fixture" ? source.prepared.admissionSource.executionSourceSpec : readRuntimeDocumentV1(source.admissionSource.executionSourceSpec) as any;
  check(scope.cycle === cycle && command.profile === template.settings.profiles[scope.role] && canonical(command.model) === canonical(spec.models[scope.role]), "source profile/model/cycle mismatch");
  const commandBinding = binding.origin.kind === "graph-v2-fixture" ? command.metadata.graphBinding : command.metadata.rmsBinding;
  check(commandBinding && commandBinding.unitId === scope.unitId && commandBinding.subIntentId === scope.subIntentId && commandBinding.functionId === scope.functionId && commandBinding.role === scope.role, "command scope mismatch");
  if (binding.origin.kind === "graph-v2-fixture") check(commandBinding.familyToken === scope.familyFence && commandBinding.originalControllerToken === scope.controllerFence, "fixture fences mismatch");
  else check(commandBinding.version === "rms-agent-binding-data-v1" && commandBinding.familyFence === scope.familyFence && commandBinding.controllerFence === scope.controllerFence && canonical(commandBinding.runtimeBindingRef) === canonical(runtime.binding.ref), "prospective DATA fences/binding mismatch");
  for (const key of ["executionId", "attemptId", "idempotencyKey"]) check(a[key] === command[key] && body[key] === command[key], "command identity mismatch");
  text(command.taskId); text(command.profile); const model = closed(command.model, ["providerID", "id", "variant"]); Object.values(model).forEach(text);
  const { missionId, directory, controllerId, expectedRevision, ...payload } = body; text(directory); text(controllerId);
  check(missionId === scope.missionId && expectedRevision === scope.expectedRevision && canonical(payload) === image.commandUtf8, "durable body mismatch");
  return makeBoundDocumentV1("rms-dispatch-join-v1", { version: "rms-dispatch-join-v1", bindingRef: runtime.binding.ref, origin: binding.origin, scope,
    taskId: command.taskId, attemptId: a.attemptId, executionId: a.executionId, idempotencyKey: a.idempotencyKey,
    requestedProfile: command.profile, requestedModel: command.model, admissionRef: makeBoundDocumentV1("rms-admission-data-v1", a).ref,
    clientBodyRef: makeBoundDocumentV1("rms-client-body-v1", body).ref, payloadDigest: fingerprint(command), upstreamBodyDigest: image.requestDigest,
    clientBodyDigest: fingerprint(body), rpcBodySha256: null });
}
