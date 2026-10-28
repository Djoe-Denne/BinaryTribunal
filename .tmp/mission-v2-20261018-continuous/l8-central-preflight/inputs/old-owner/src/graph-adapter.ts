import { join } from "node:path";
import type { GraphRun, GraphRunV1, GraphRunV2, InputBundle, Intent, Inspection, PreparedGraph, PreparedGraphV2, Snapshot, StoredResult } from "./domain";
import type { Admission, AdmissionObservation } from "./graph-store";
import type { WorkUnit, WorkerCapacity } from "./planner";
import type { UnitLease } from "./unit-lease";
import { canonical, compareText, fingerprint, hash, identityKey, validateKnowledge, validateResult } from "./validation";
import { admissionScopeKey, assertCurrentAdmissionSource, graphArray, graphCheck, graphCopy, graphDigest, graphInteger, graphJson, graphKeys, graphObject, graphString, parsePreparedGraph } from "./graph-pipeline";

export type GraphRunSpec = Pick<GraphRunV1, "settings" | "workers" | "accounts" | "inputsByFunction" | "publicationsByFunction"> & { prepared: PreparedGraph };
export interface GraphIntentRecordV1 {
  version: "l8-graph-intent-v1"; runFingerprint: string; unitId: string; familyToken: number;
  subIntentId: string; workerId: string; accountId: string; intent: Intent; admission: Admission;
}
export interface GraphIntentRecordV2 extends Omit<GraphIntentRecordV1, "version"> { version: "l8-graph-intent-v2"; controllerToken: number }
export type GraphIntentRecord = GraphIntentRecordV1 | GraphIntentRecordV2;
export interface GraphExecutionClaim {
  version: "l8-execution-claim-v1"; budgetScopeKey: string; runFingerprint: string; contextFingerprint: string; allocationFingerprint: string;
  bindingFingerprint: string; unitId: string; functionId: string; subIntentId: string; role: "A" | "B" | "R";
  executionId: string; attemptId: string; admissionSha256: string; admissionUtf8Bytes: number; C: number; N: number;
  originalFamilyToken: number; originalControllerToken: number; maxAttempts: number; retryDelayMs: number; record: GraphIntentRecordV2;
}
export interface FixtureExecutionPort {
  readonly kind: "offline-fixture-v1";
  submit(missionId: string, command: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** A configured fixture observer, NOT an invented Ensemble/native RPC. */
  observe(record: Readonly<GraphIntentRecord>): Promise<{
    inspection: Inspection;
    terminalProof?: Record<string, unknown>;
    admissionObservation?: AdmissionObservation;
  }>;
}
const FIXTURE_PROMPT = "Offline fixture only. One functional A/B/R result; no native tools or scientific authority.";
function strings(value: unknown): void { graphArray(value); value.forEach(graphString); }
function file(value: unknown): void {
  const r = graphKeys(value, ["path", "sha256", "version", "provenance", "kind"], ["approvedForBlind", "identity"]);
  [r.path, r.version, r.provenance].forEach(graphString);
  graphCheck(typeof r.sha256 === "string" && /^[a-f0-9]{64}$/.test(r.sha256), "input hash");
  graphCheck(["native", "rule", "knowledge", "proposal", "score", "manifest"].some(x => x === r.kind), "input kind");
  if (r.approvedForBlind !== undefined) graphCheck(typeof r.approvedForBlind === "boolean", "blind approval");
  if (r.identity !== undefined) { const i = graphKeys(r.identity, ["sha256", "version", "ea"]); Object.values(i).forEach(graphString); }
}
/** Strict graph-owned transport envelope; scientific documents keep their existing validators. */
export function parseGraphInputs(value: unknown): InputBundle {
  const r = graphKeys(graphCopy(value), ["schemaVersion", "role", "cycle", "identity", "files", "accessibleRules", "requiredTools", "knowledge"], ["proposals", "neighborhood"]);
  graphCheck(r.schemaVersion === 1 && ["A", "B", "R"].some(role => role === r.role), "graph input version/role"); graphInteger(r.cycle, 1);
  const identity = graphKeys(r.identity, ["sha256", "version", "ea"]); Object.values(identity).forEach(graphString);
  graphArray(r.files); r.files.forEach(file); strings(r.accessibleRules); strings(r.requiredTools);
  const knowledge = graphKeys(r.knowledge, ["version", "fingerprint", "leadsFingerprint", "files"], ["validatedFacts", "commonFingerprint", "scopedLeads"]);
  validateKnowledge(knowledge); graphArray(knowledge.files); knowledge.files.forEach(file);
  if (r.proposals !== undefined) {
    graphCheck(r.role === "R", "proposals only belong to R"); graphArray(r.proposals);
    for (const value of r.proposals) {
      const p = graphKeys(value, ["resultId", "sha256", "path", "authorId", "executionId", "sessionId", "content", "document"]); [p.resultId, p.path, p.authorId, p.executionId, p.sessionId, p.content].forEach(graphString);
      graphCheck(p.sha256 === hash(String(p.content)) && canonical(JSON.parse(String(p.content))) === canonical(p.document), "frozen proposal byte/document mismatch");
      const document = graphObject(p.document); graphCheck(document.kind === "proposal" && ["A", "B"].some(role => role === document.role) && document.authorId === p.authorId && document.executionId === p.executionId && canonical(document.identity) === canonical(identity), "proposal identity/author mismatch");
    }
  }
  if (r.neighborhood !== undefined) {
    graphCheck(r.role === "R", "neighborhood only belongs to R"); const n = graphKeys(r.neighborhood, ["id", "members"]); graphString(n.id); graphArray(n.members);
    for (const member of n.members) Object.values(graphKeys(member, ["sha256", "version", "ea"])).forEach(graphString);
  }
  return r as unknown as InputBundle;
}
export function validateGraphRunSpec(value: unknown): asserts value is GraphRunSpec {
  graphJson(value); const r = graphKeys(value, ["prepared", "settings", "workers", "accounts", "inputsByFunction", "publicationsByFunction"]);
  const prepared = parsePreparedGraph(r.prepared), settings = graphKeys(r.settings, ["profiles", "maxConcurrent", "familyTtlEvents", "maxAdmissionAttempts", "retryDelayMs"]);
  const profiles = graphKeys(settings.profiles, ["A", "B", "R"]); Object.values(profiles).forEach(graphString);
  graphInteger(settings.maxConcurrent, 1); graphInteger(settings.familyTtlEvents, 2); graphCheck(settings.familyTtlEvents <= 10000, "family TTL bound");
  graphInteger(settings.maxAdmissionAttempts, 1); graphCheck(settings.maxAdmissionAttempts <= 10, "retry bound"); graphInteger(settings.retryDelayMs);
  graphArray(r.workers); graphArray(r.accounts);
  const workerIds = new Set<string>(), accountIds = new Set<string>();
  for (const worker of r.workers) {
    const w = graphKeys(worker, ["workerId", "profile", "model", "tools", "accountId", "slots", "cpu", "gpu", "budget", "available"]);
    [w.workerId, w.profile, w.model, w.accountId].forEach(graphString); strings(w.tools);
    for (const key of ["slots", "cpu", "gpu", "budget"]) graphInteger(w[key]);
    graphCheck(typeof w.available === "boolean" && !workerIds.has(String(w.workerId)), "worker inventory"); workerIds.add(String(w.workerId));
  }
  for (const account of r.accounts) {
    const a = graphKeys(account, ["accountId", "slots", "budget"]); graphString(a.accountId); graphInteger(a.slots); graphInteger(a.budget);
    graphCheck(!accountIds.has(a.accountId), "duplicate account"); accountIds.add(a.accountId);
  }
  graphCheck(r.workers.every(w => accountIds.has(String(graphObject(w).accountId))), "unknown worker account");
  const functions = new Set(prepared.snapshot.nodes.map(n => n.id));
  for (const [id, files] of Object.entries(graphObject(r.inputsByFunction))) { graphCheck(functions.has(id), "unknown input function"); graphArray(files); files.forEach(file); }
  for (const [id, publication] of Object.entries(graphObject(r.publicationsByFunction))) {
    graphCheck(functions.has(id), "unknown publication function"); const p = graphKeys(publication, ["artifactId", "artifactKind", "content"]);
    graphString(p.artifactId); graphString(p.content);
    graphCheck(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].some(x => x === p.artifactKind), "publication kind");
    const requirement = prepared.planning.sidecar.policy.requirementsByFunction[id];
    graphCheck(requirement && requirement.artifactId === p.artifactId && requirement.artifactKind === p.artifactKind && requirement.artifactSha256 === hash(p.content), "frozen publication requirement mismatch");
  }
  graphCheck(prepared.planning.units.filter(u => prepared.planning.plan.selectedUnitIds.includes(u.unitId)).every(u => u.ownedFunctionIds.every(id => Object.hasOwn(graphObject(r.publicationsByFunction), id))), "missing explicit publication bytes");
}
export function makeGraphRun(snapshot: Snapshot, spec: GraphRunSpec): GraphRunV1 {
  validateGraphRunSpec(spec); const frozen = graphCopy(spec);
  graphCheck(frozen.prepared.version === "l8-prepared-graph-v1", "v1 cannot wrap a prospective budget plan");
  graphCheck(snapshot.config.fixture === true && snapshot.status === "running", "only explicit offline fixture graph runs are enabled");
  graphCheck(frozen.prepared.snapshot.missionId === snapshot.missionId, "graph mission mismatch");
  for (const unit of frozen.prepared.planning.units) for (const sub of unit.subIntents) graphCheck(sub.harnessIdentity.sha256 === snapshot.config.binary.sha256 && sub.harnessIdentity.version === snapshot.config.binary.version, "graph function/module label differs from mission");
  const body = { version: "l8-graph-run-v1" as const, fixture: true as const, missionId: snapshot.missionId, cycle: snapshot.cycle, missionRevision: snapshot.revision + 1,
    missionConfigFingerprint: fingerprint(snapshot.config), ...frozen };
  const parsed = parseGraphRun({ ...body, fingerprint: fingerprint(body) }); graphCheck(parsed.version === "l8-graph-run-v1", "v1 wrapper mismatch"); return parsed;
}
function executionBinding(prepared: PreparedGraphV2): GraphRunV2["executionBinding"] {
  const source = prepared.admissionSource, planning = prepared.planning;
  const derivedSpec = { version: "l8-execution-derived-v1" as const, sourceSpecFingerprint: source.executionSourceSpecFingerprint, templateFingerprint: source.executionTemplateFingerprint, inputManifestFingerprint: source.inputManifestFingerprint,
    preparedFingerprint: prepared.fingerprint, planId: planning.plan.planId, planFingerprint: planning.plan.fingerprint, sidecarFingerprint: planning.sidecar.fingerprint, bindingFingerprint: planning.binding.fingerprint,
    snapshotId: prepared.snapshot.snapshotId, partitionId: prepared.partition.partitionId, knowledgeRevision: prepared.snapshot.knowledgeRevision };
  return { version: "l8-execution-binding-v1", derivedSpec, derivedSpecFingerprint: fingerprint(derivedSpec), budgetScopeKey: admissionScopeKey(source) };
}
export function makeGraphRunV2(snapshot: Snapshot, prepared: PreparedGraphV2): GraphRunV2 {
  assertCurrentAdmissionSource(prepared, snapshot);
  const source = prepared.admissionSource, template = source.executionTemplate, input = source.inputManifestSource;
  const spec = { prepared, settings: template.settings, workers: template.workers, accounts: template.accounts, inputsByFunction: input.inputsByFunction, publicationsByFunction: input.publicationsByFunction };
  validateGraphRunSpec(spec); graphCheck(snapshot.config.fixture && snapshot.status === "running", "explicit running fixture required");
  graphCheck(prepared.planning.units.every(u => u.subIntents.every(s => s.harnessIdentity.sha256 === snapshot.config.binary.sha256 && s.harnessIdentity.version === snapshot.config.binary.version)), "source module differs from actual configured binary");
  const body = { version: "l8-graph-run-v2" as const, fixture: true as const, missionId: snapshot.missionId, cycle: snapshot.cycle, missionRevision: snapshot.revision + 1,
    missionConfigFingerprint: fingerprint(snapshot.config), ...graphCopy(spec), executionBinding: executionBinding(prepared) };
  const run = parseGraphRun({ ...body, fingerprint: fingerprint(body) }); graphCheck(run.version === "l8-graph-run-v2", "v2 wrapper mismatch"); return run;
}
export function parseGraphRun(value: unknown): GraphRun {
  graphJson(value); const version = graphObject(value).version;
  graphCheck(version === "l8-graph-run-v1" || version === "l8-graph-run-v2", "graph run version/mode");
  const r = graphKeys(graphCopy(value), ["version", "fixture", "missionId", "cycle", "missionRevision", "missionConfigFingerprint", "prepared", "settings", "workers", "accounts", "inputsByFunction", "publicationsByFunction", "fingerprint", ...(version === "l8-graph-run-v2" ? ["executionBinding"] : [])]);
  graphCheck(r.fixture === true, "fixture graph run required"); graphString(r.missionId); graphInteger(r.cycle, 1); graphInteger(r.missionRevision, 1); graphString(r.missionConfigFingerprint); graphDigest(r);
  validateGraphRunSpec({ prepared: r.prepared, settings: r.settings, workers: r.workers, accounts: r.accounts, inputsByFunction: r.inputsByFunction, publicationsByFunction: r.publicationsByFunction });
  const prepared = parsePreparedGraph(r.prepared); graphCheck(prepared.snapshot.missionId === r.missionId, "run/plan mission mismatch");
  graphCheck((version === "l8-graph-run-v1") === (prepared.version === "l8-prepared-graph-v1"), "run/prepared versions cannot be stripped or mixed");
  if (prepared.version === "l8-prepared-graph-v2") {
    const source = prepared.admissionSource;
    graphCheck(source.context.missionConfigFingerprint === r.missionConfigFingerprint && source.cycle === r.cycle, "run source context/config");
    graphCheck(prepared.planning.units.every(u => u.subIntents.every(s => s.harnessIdentity.sha256 === source.executionSourceSpec.binary.sha256 && s.harnessIdentity.version === source.executionSourceSpec.binary.version)), "frozen run binary/source module mismatch");
    graphCheck(canonical({ settings: r.settings, workers: r.workers, accounts: r.accounts }) === canonical({ settings: source.executionTemplate.settings, workers: source.executionTemplate.workers, accounts: source.executionTemplate.accounts })
      && canonical(r.inputsByFunction) === canonical(source.inputManifestSource.inputsByFunction) && canonical(r.publicationsByFunction) === canonical(source.inputManifestSource.publicationsByFunction), "template is not the operative execution spec");
    graphCheck(canonical(r.executionBinding) === canonical(executionBinding(prepared)), "derived/source spec binding mismatch");
  }
  return r as unknown as GraphRun;
}
/** The legacy Engine supplies its existing blind-projection bundle builder. */
/** Pure operative source projection; proposals alone are late-bound and checked
 * against actual eligible results by the transaction, never by a caller flag. */
export function graphInputs(run: GraphRunV2, snapshot: Snapshot, sub: WorkUnit["subIntents"][number], proposals?: StoredResult[]): InputBundle {
  assertCurrentAdmissionSource(run.prepared, snapshot);
  const source = run.prepared.admissionSource.inputManifestSource, knowledge = source.cycleKnowledge;
  const relevant = new Set([identityKey(sub.harnessIdentity)]);
  for (const relation of run.prepared.planning.sidecar.relationView.relations.filter(r => r.sourceId === sub.functionId && r.kind !== "callback_candidate")) {
    const other = run.prepared.planning.units.flatMap(u => u.subIntents).find(s => s.functionId === relation.destinationId); if (other) relevant.add(identityKey(other.harnessIdentity));
  }
  const relevantFile = (file: InputBundle["files"][number]) => {
    const fact = knowledge.validatedFacts?.find(f => file.version === `validated-conclusion:v1:${f.resultHash}`);
    return fact ? relevant.has(identityKey(fact.identity)) : !file.identity || relevant.has(identityKey(file.identity));
  };
  const files = knowledge.files.filter(relevantFile), facts = knowledge.validatedFacts?.filter(f => relevant.has(identityKey(f.identity))), leads = knowledge.scopedLeads?.filter(l => relevant.has(identityKey(l.identity)));
  const commonFingerprint = knowledge.commonFingerprint ?? knowledge.fingerprint;
  const projected = { ...graphCopy(knowledge), commonFingerprint, files,
    fingerprint: fingerprint({ common: commonFingerprint, files: files.map(f => ({ path: f.path, sha256: f.sha256 })).sort((a, b) => compareText(a.path, b.path)), leads: knowledge.leadsFingerprint, scopedLeads: leads ?? [] }),
    ...(facts ? { validatedFacts: facts } : {}), ...(leads ? { scopedLeads: leads } : {}) };
  const blind = sub.role === "A" || sub.role === "B", allowed = (f: InputBundle["files"][number]) => !blind || f.kind === "native" || f.kind === "rule" || (f.kind === "knowledge" && f.approvedForBlind === true);
  const scopedKnowledge = { ...projected, files: projected.files.filter(allowed) }, dedup = new Map<string, InputBundle["files"][number]>();
  const all = [...source.commonInputs, ...scopedKnowledge.files, ...(source.inputsByFunction[sub.functionId] ?? [])].filter(f => allowed(f) && relevantFile(f));
  for (const p of proposals ?? []) all.push({ path: p.path, sha256: p.sha256, version: p.resultId, provenance: `offline fixture execution ${p.executionId}, author ${p.authorId}`, kind: "proposal" });
  for (const file of all) { const old = dedup.get(file.path); graphCheck(!old || canonical(old) === canonical(file), "conflicting exact input source path"); dedup.set(file.path, file); }
  const bundle: InputBundle = { schemaVersion: 1, role: sub.role, cycle: run.cycle, identity: graphCopy(sub.harnessIdentity), files: [...dedup.values()].sort((a, b) => compareText(a.path, b.path)),
    accessibleRules: graphCopy(source.accessibleRules), requiredTools: graphCopy(source.requiredTools), knowledge: scopedKnowledge,
    ...(proposals ? { proposals: proposals.map(({ resultId, sha256, path, authorId, executionId, sessionId, content, document }) => ({ resultId, sha256, path, authorId, executionId, sessionId, content, document })) } : {}) };
  if (sub.role === "R" && snapshot.config.rePolicy) {
    const group = run.prepared.groups.find(g => g.ownedFunctionIds.includes(sub.functionId)); graphCheck(group, "missing frozen R neighborhood");
    bundle.neighborhood = { id: group.groupId, members: group.ownedFunctionIds.map(id => run.prepared.planning.units.flatMap(u => u.subIntents).find(s => s.functionId === id)!.harnessIdentity) };
  }
  return parseGraphInputs(bundle);
}
export function makeGraphIntent(run: GraphRun, snapshot: Snapshot, unit: WorkUnit, sub: WorkUnit["subIntents"][number], lease: UnitLease, inputs: InputBundle, worker: WorkerCapacity, controllerToken?: number): GraphIntentRecord {
  run = parseGraphRun(run); inputs = parseGraphInputs(inputs);
  graphCheck(snapshot.missionId === run.missionId && snapshot.cycle === run.cycle && snapshot.revision === run.missionRevision && fingerprint(snapshot.config) === run.missionConfigFingerprint, "frozen mission revision changed");
  graphCheck(unit.subIntents.some(s => canonical(s) === canonical(sub)) && unit.ownedFunctionIds.includes(sub.functionId), "sub-intent attribution");
  const actualUnit = run.prepared.planning.units.find(u => u.unitId === unit.unitId);
  graphCheck(actualUnit && canonical({ ...unit, state: actualUnit.state }) === canonical(actualUnit) && lease.unitId === unit.unitId && lease.missionId === run.missionId, "immutable scientific unit/family changed");
  graphCheck(["A", "B", "R"].includes(sub.role), "graph role");
  graphCheck(inputs.role === sub.role && inputs.cycle === run.cycle && canonical(inputs.identity) === canonical(sub.harnessIdentity), "functional input identity");
  if (sub.role === "A" || sub.role === "B") graphCheck(!inputs.proposals && !inputs.candidates && !inputs.unresolvedResults && [...inputs.files, ...inputs.knowledge.files].every(f => f.kind === "native" || f.kind === "rule" || (f.kind === "knowledge" && f.approvedForBlind === true)), "blind input contamination");
  if (sub.role === "R") {
    graphCheck(inputs.proposals?.length === 2 && inputs.proposals.every(p => canonical(p.document.identity) === canonical(sub.harnessIdentity)), "R requires its own exact A+B");
    graphCheck(new Set(inputs.proposals.map(p => p.authorId)).size === 2 && new Set(inputs.proposals.map(p => p.sessionId)).size === 2, "A/B authors not independent");
    graphCheck(new Set(inputs.proposals.map(p => p.document.kind === "proposal" ? p.document.role : "invalid")).size === 2, "R needs one A and one B");
  }
  const inputFingerprint = fingerprint(inputs), taskId = `${run.missionId}:graph:${hash(unit.unitId).slice(0, 12)}:${hash(sub.subIntentId).slice(0, 12)}`;
  const attemptId = `${taskId}:f${lease.token}:a1`, executionId = `${attemptId}:${inputFingerprint.slice(0, 24)}`, model = snapshot.config.models[sub.role];
  graphCheck(worker.profile === run.settings.profiles[sub.role as "A" | "B" | "R"] && worker.model === `${model.providerID}/${model.id}#${model.variant}`, "worker/model/profile mismatch; no substitution");
  const intent: Intent = { schemaVersion: 1, fixture: true, binary: graphCopy(snapshot.config.binary), missionId: run.missionId, taskId, attemptId, executionId, idempotencyKey: executionId,
    cycle: run.cycle, role: sub.role, identity: graphCopy(sub.harnessIdentity), fresh: true, requestedModel: graphCopy(model), inputs, inputFingerprint,
    outputPath: join(snapshot.config.outputDirectory, `${hash(executionId)}.json`), previousResultIds: run.version === "l8-graph-run-v2" ? inputs.proposals?.map(p => p.resultId) ?? [] : [] };
  const baseBinding = { version: "l8-functional-binding-v1", missionId: run.missionId, cycle: run.cycle, missionRevision: run.missionRevision, unitId: unit.unitId,
    planId: run.prepared.planning.plan.planId, planFingerprint: run.prepared.planning.plan.fingerprint, snapshotId: unit.snapshotId, snapshotFingerprint: run.prepared.snapshot.normalizedFingerprint,
    partitionId: unit.partitionId, knowledgeRevision: unit.knowledgeRevision, familyToken: lease.token, subIntentId: sub.subIntentId, functionId: sub.functionId, role: sub.role,
    attemptId, executionId, inputFingerprint, inputVersions: inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })) };
  if (run.version === "l8-graph-run-v2") graphInteger(controllerToken, 1);
  const binding = run.version === "l8-graph-run-v2" ? { ...baseBinding, version: "l8-functional-binding-v2", originalControllerToken: controllerToken!, budgetScopeKey: run.executionBinding.budgetScopeKey,
    admissionContextFingerprint: fingerprint(run.prepared.admissionSource.context), allocationFingerprint: run.prepared.admissionSource.allocation?.fingerprint ?? null, executionSourceSpecFingerprint: run.prepared.admissionSource.executionSourceSpecFingerprint, derivedSpecFingerprint: run.executionBinding.derivedSpecFingerprint } : baseBinding;
  const header = { schemaVersion: 1, missionId: run.missionId, taskId, attemptId, executionId, cycle: run.cycle, authorId: executionId, identity: intent.identity, inputFingerprint, inputVersions: binding.inputVersions, previousResultIds: intent.previousResultIds };
  const command = { taskId, attemptId, executionId, idempotencyKey: executionId, profile: worker.profile, model: intent.requestedModel,
    prompt: FIXTURE_PROMPT,
    dossier: { version: 1, fixture: true, functionId: sub.functionId, function: intent.identity, role: sub.role, cycle: run.cycle, ...(run.version === "l8-graph-run-v2" ? { effectiveModel: intent.requestedModel } : {}), inputs, resultHeader: header },
    metadata: { inputFingerprint, graphBinding: binding }, context: { mode: "fresh" }, worktree: false,
    requiredAccess: inputs.files.map(f => ({ action: "read", resource: f.path })) };
  const admission: Admission = { executionId, attemptId, role: sub.role, subIntentId: sub.subIntentId, idempotencyKey: executionId, command };
  const record = { runFingerprint: run.fingerprint, unitId: unit.unitId, familyToken: lease.token, subIntentId: sub.subIntentId, workerId: worker.workerId, accountId: worker.accountId, intent, admission };
  return run.version === "l8-graph-run-v2" ? graphCopy({ ...record, version: "l8-graph-intent-v2", controllerToken: controllerToken! }) : graphCopy({ ...record, version: "l8-graph-intent-v1" });
}
export function parseGraphIntent(value: unknown, run: GraphRun, snapshot: Snapshot): GraphIntentRecord {
  const v2 = run.version === "l8-graph-run-v2";
  const r = graphKeys(graphCopy(value), ["version", "runFingerprint", "unitId", "familyToken", "subIntentId", "workerId", "accountId", "intent", "admission", ...(v2 ? ["controllerToken"] : [])]);
  graphCheck(r.version === (v2 ? "l8-graph-intent-v2" : "l8-graph-intent-v1") && r.runFingerprint === run.fingerprint, "intent journal version/run"); graphInteger(r.familyToken, 1); if (v2) graphInteger(r.controllerToken, 1);
  const unit = run.prepared.planning.units.find(u => u.unitId === r.unitId), sub = unit?.subIntents.find(s => s.subIntentId === r.subIntentId), worker = run.workers.find(w => w.workerId === r.workerId);
  graphCheck(unit && sub && worker && worker.accountId === r.accountId, "journal intent owner/inventory");
  const rawIntent = graphKeys(r.intent, ["schemaVersion", "fixture", "binary", "missionId", "taskId", "attemptId", "executionId", "idempotencyKey", "cycle", "role", "identity", "fresh", "requestedModel", "inputs", "inputFingerprint", "outputPath", "previousResultIds"]);
  // Read ORIGINAL bytes/IDs. No intent factory, nonce or replanning during replay.
  const inputs = parseGraphInputs(rawIntent.inputs), admission = graphKeys(r.admission, ["executionId", "subIntentId", "attemptId", "role", "idempotencyKey", "command"]);
  if (sub.role === "A" || sub.role === "B") graphCheck(!inputs.proposals && [...inputs.files, ...inputs.knowledge.files].every(f => f.kind === "native" || f.kind === "rule" || (f.kind === "knowledge" && f.approvedForBlind === true)), "replayed blind input contamination");
  else graphCheck(inputs.proposals?.length === 2 && inputs.proposals.every(p => canonical(p.document.identity) === canonical(sub.harnessIdentity)) && new Set(inputs.proposals.map(p => p.document.kind === "proposal" ? p.document.role : "invalid")).size === 2 && new Set(inputs.proposals.map(p => p.sessionId)).size === 2 && new Set(inputs.proposals.map(p => p.authorId)).size === 2, "replayed R attribution/independence");
  const command = graphKeys(admission.command, ["taskId", "attemptId", "executionId", "idempotencyKey", "profile", "model", "prompt", "dossier", "metadata", "context", "worktree", "requiredAccess"]);
  const dossier = graphKeys(command.dossier, ["version", "fixture", "functionId", "function", "role", "cycle", "inputs", "resultHeader", ...(v2 ? ["effectiveModel"] : [])]);
  const header = graphKeys(dossier.resultHeader, ["schemaVersion", "missionId", "taskId", "attemptId", "executionId", "cycle", "authorId", "identity", "inputFingerprint", "inputVersions", "previousResultIds"]);
  graphCheck(snapshot.missionId === run.missionId && snapshot.cycle === run.cycle && snapshot.revision === run.missionRevision && fingerprint(snapshot.config) === run.missionConfigFingerprint, "intent current mission revision/config mismatch");
  graphCheck(rawIntent.schemaVersion === 1 && rawIntent.fixture === true && rawIntent.fresh === true && rawIntent.role === sub.role && canonical(rawIntent.binary) === canonical(snapshot.config.binary) && canonical(rawIntent.identity) === canonical(sub.harnessIdentity)
    && rawIntent.missionId === run.missionId && rawIntent.cycle === run.cycle && canonical(rawIntent.requestedModel) === canonical(snapshot.config.models[sub.role]) && rawIntent.inputFingerprint === fingerprint(inputs) && inputs.role === sub.role && canonical(inputs.identity) === canonical(sub.harnessIdentity), "functional intent context changed");
  for (const key of ["taskId", "attemptId", "executionId"]) { graphString(rawIntent[key]); graphCheck(rawIntent[key] === command[key] && rawIntent[key] === header[key], "original identity/header mismatch"); }
  graphCheck(rawIntent.idempotencyKey === rawIntent.executionId && admission.idempotencyKey === rawIntent.executionId && command.idempotencyKey === rawIntent.executionId && admission.executionId === rawIntent.executionId && admission.attemptId === rawIntent.attemptId && admission.subIntentId === sub.subIntentId && admission.role === sub.role, "original admission identity mismatch");
  graphCheck(header.schemaVersion === 1 && header.missionId === run.missionId && header.cycle === run.cycle && header.authorId === rawIntent.executionId && canonical(header.identity) === canonical(sub.harnessIdentity) && header.inputFingerprint === rawIntent.inputFingerprint
    && canonical(header.inputVersions) === canonical(inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 }))) && canonical(header.previousResultIds) === canonical(rawIntent.previousResultIds), "frozen result header mismatch");
  graphCheck(dossier.version === 1 && dossier.fixture === true && dossier.functionId === sub.functionId && canonical(dossier.function) === canonical(sub.harnessIdentity) && dossier.role === sub.role && dossier.cycle === run.cycle && canonical(dossier.inputs) === canonical(inputs)
    && command.worktree === false && canonical(command.context) === canonical({ mode: "fresh" }) && canonical(command.model) === canonical(rawIntent.requestedModel) && command.profile === worker.profile && worker.profile === run.settings.profiles[sub.role as "A" | "B" | "R"], "original dossier/profile/context mismatch");
  const selectedModel = snapshot.config.models[sub.role]; graphCheck(worker.model === `${selectedModel.providerID}/${selectedModel.id}#${selectedModel.variant}`, "replayed provider/model substitution");
  graphCheck(command.prompt === FIXTURE_PROMPT, "operative codec/prompt changed (no padding or retry body rebuild)");
  const task = `${run.missionId}:graph:${hash(unit.unitId).slice(0, 12)}:${hash(sub.subIntentId).slice(0, 12)}`, attempt = `${task}:f${r.familyToken}:a1`;
  graphCheck(rawIntent.taskId === task && rawIntent.attemptId === attempt && rawIntent.executionId === `${attempt}:${String(rawIntent.inputFingerprint).slice(0, 24)}` && inputs.cycle === run.cycle, "original execution ID must match its frozen functional input/fence");
  graphCheck(rawIntent.outputPath === join(snapshot.config.outputDirectory, `${hash(String(rawIntent.executionId))}.json`), "exact output path changed");
  const metadata = graphKeys(command.metadata, ["inputFingerprint", "graphBinding"]), binding = graphObject(metadata.graphBinding);
  graphCheck(metadata.inputFingerprint === rawIntent.inputFingerprint && binding.unitId === unit.unitId && binding.subIntentId === sub.subIntentId && binding.functionId === sub.functionId && binding.executionId === rawIntent.executionId && binding.attemptId === rawIntent.attemptId && binding.familyToken === r.familyToken && binding.inputFingerprint === rawIntent.inputFingerprint
    && binding.planFingerprint === run.prepared.planning.plan.fingerprint && binding.snapshotFingerprint === run.prepared.snapshot.normalizedFingerprint && binding.missionRevision === run.missionRevision, "original durable binding mismatch");
  graphCheck(binding.missionId === run.missionId && binding.cycle === run.cycle && binding.planId === run.prepared.planning.plan.planId && binding.snapshotId === unit.snapshotId && binding.partitionId === unit.partitionId && binding.knowledgeRevision === unit.knowledgeRevision && binding.role === sub.role && canonical(binding.inputVersions) === canonical(header.inputVersions), "full functional binding tuple mismatch");
  if (v2) {
    graphKeys(binding, ["version", "missionId", "cycle", "missionRevision", "unitId", "planId", "planFingerprint", "snapshotId", "snapshotFingerprint", "partitionId", "knowledgeRevision", "familyToken", "subIntentId", "functionId", "role", "attemptId", "executionId", "inputFingerprint", "inputVersions", "originalControllerToken", "budgetScopeKey", "admissionContextFingerprint", "allocationFingerprint", "executionSourceSpecFingerprint", "derivedSpecFingerprint"]);
    graphCheck(binding.version === "l8-functional-binding-v2" && binding.originalControllerToken === r.controllerToken && binding.budgetScopeKey === run.executionBinding.budgetScopeKey && binding.admissionContextFingerprint === fingerprint(run.prepared.admissionSource.context) && binding.allocationFingerprint === run.prepared.admissionSource.allocation?.fingerprint && binding.executionSourceSpecFingerprint === run.prepared.admissionSource.executionSourceSpecFingerprint && binding.derivedSpecFingerprint === run.executionBinding.derivedSpecFingerprint
      && canonical(dossier.effectiveModel) === canonical(rawIntent.requestedModel) && canonical(rawIntent.previousResultIds) === canonical(inputs.proposals?.map(p => p.resultId) ?? []), "v2 source/derived/header binding mismatch");
    graphCheck(canonical(inputs) === canonical(graphInputs(run, snapshot, sub, inputs.proposals as StoredResult[] | undefined)) && canonical(command.requiredAccess) === canonical(inputs.files.map(f => ({ action: "read", resource: f.path }))), "actual functional inputs/access differ from immutable operative source");
  }
  return r as unknown as GraphIntentRecord;
}
export function graphExecutionSlotKey(run: GraphRunV2, unitId: string, subIntentId: string): string {
  return `l8.graph2.execution-claim:${fingerprint({ scopeKey: run.executionBinding.budgetScopeKey, unitId, subIntentId })}`;
}
export function makeExecutionClaim(run: GraphRunV2, record: GraphIntentRecordV2): GraphExecutionClaim {
  const unit = run.prepared.planning.units.find(u => u.unitId === record.unitId), sub = unit?.subIntents.find(s => s.subIntentId === record.subIntentId);
  graphCheck(unit && sub && ["A", "B", "R"].includes(sub.role) && run.prepared.planning.plan.selectedUnitIds.includes(unit.unitId), "claim is not a selected real sub-intent");
  const accounting = run.prepared.planning.sidecar.admissionBudget!.byUnit[unit.unitId]!;
  graphCheck(accounting.admissionCapUtf8Bytes.known && accounting.maxNewExecutions.known && accounting.maxNewExecutions.value === unit.subIntents.length, "unknown/inconsistent C/N");
  const size = Buffer.byteLength(canonical(record.admission), "utf8"); graphCheck(size <= accounting.admissionCapUtf8Bytes.value!, "final complete admission exceeds frozen C; evidence must be retained");
  return { version: "l8-execution-claim-v1", budgetScopeKey: run.executionBinding.budgetScopeKey, runFingerprint: run.fingerprint, contextFingerprint: fingerprint(run.prepared.admissionSource.context), allocationFingerprint: run.prepared.admissionSource.allocation!.fingerprint,
    bindingFingerprint: run.prepared.planning.binding.fingerprint, unitId: unit.unitId, functionId: sub.functionId, subIntentId: sub.subIntentId, role: sub.role as "A" | "B" | "R", executionId: record.intent.executionId, attemptId: record.intent.attemptId,
    admissionSha256: fingerprint(record.admission), admissionUtf8Bytes: size, C: accounting.admissionCapUtf8Bytes.value!, N: accounting.maxNewExecutions.value!, originalFamilyToken: record.familyToken, originalControllerToken: record.controllerToken,
    maxAttempts: run.settings.maxAdmissionAttempts, retryDelayMs: run.settings.retryDelayMs, record: graphCopy(record) };
}
export function parseExecutionClaim(value: unknown, run: GraphRunV2, snapshot: Snapshot): GraphExecutionClaim {
  const r = graphKeys(graphCopy(value), ["version", "budgetScopeKey", "runFingerprint", "contextFingerprint", "allocationFingerprint", "bindingFingerprint", "unitId", "functionId", "subIntentId", "role", "executionId", "attemptId", "admissionSha256", "admissionUtf8Bytes", "C", "N", "originalFamilyToken", "originalControllerToken", "maxAttempts", "retryDelayMs", "record"]);
  const record = parseGraphIntent(r.record, run, snapshot); graphCheck(record.version === "l8-graph-intent-v2", "claim wrapped old intent");
  graphCheck(canonical(r) === canonical(makeExecutionClaim(run, record)), "execution claim/body/source/counts corrupt"); return r as unknown as GraphExecutionClaim;
}
export function graphResult(record: GraphIntentRecord, inspection: Inspection, prior: StoredResult[]): StoredResult {
  inspection = graphCopy(inspection);
  graphCheck(inspection.status === "completed" && inspection.fresh === true && !inspection.parentSessionId && inspection.sessionId && inspection.authorId && canonical(inspection.effectiveModel) === canonical(record.intent.requestedModel), "observed fresh session/model facts required");
  graphCheck(!prior.some(r => r.executionId !== inspection.executionId && (r.sessionId === inspection.sessionId || r.authorId === inspection.authorId)), "reused scientific author/session");
  const document = validateResult(record.intent, inspection); graphCheck(inspection.artifact, "missing result artifact");
  return { resultId: `result:${hash(record.intent.executionId)}`, path: inspection.artifact.path, sha256: inspection.artifact.sha256, authorId: inspection.authorId,
    executionId: record.intent.executionId, sessionId: inspection.sessionId, effectiveModel: graphCopy(inspection.effectiveModel!), content: inspection.artifact.content, document };
}
