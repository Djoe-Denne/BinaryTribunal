import { join } from "node:path";
import type { GraphRun, InputBundle, Intent, Inspection, Snapshot, StoredResult } from "./domain";
import type { Admission, AdmissionObservation } from "./graph-store";
import type { WorkUnit, WorkerCapacity } from "./planner";
import type { UnitLease } from "./unit-lease";
import { canonical, fingerprint, hash, validateKnowledge, validateResult } from "./validation";
import { graphArray, graphCheck, graphCopy, graphDigest, graphInteger, graphJson, graphKeys, graphObject, graphString, parsePreparedGraph } from "./graph-pipeline";

export type GraphRunSpec = Pick<GraphRun, "prepared" | "settings" | "workers" | "accounts" | "inputsByFunction" | "publicationsByFunction">;
export interface GraphIntentRecord {
  version: "l8-graph-intent-v1"; runFingerprint: string; unitId: string; familyToken: number;
  subIntentId: string; workerId: string; accountId: string; intent: Intent; admission: Admission;
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
export function makeGraphRun(snapshot: Snapshot, spec: GraphRunSpec): GraphRun {
  validateGraphRunSpec(spec); const frozen = graphCopy(spec);
  graphCheck(snapshot.config.fixture === true && snapshot.status === "running", "only explicit offline fixture graph runs are enabled");
  graphCheck(frozen.prepared.snapshot.missionId === snapshot.missionId, "graph mission mismatch");
  for (const unit of frozen.prepared.planning.units) for (const sub of unit.subIntents) graphCheck(sub.harnessIdentity.sha256 === snapshot.config.binary.sha256 && sub.harnessIdentity.version === snapshot.config.binary.version, "graph function/module label differs from mission");
  const body = { version: "l8-graph-run-v1" as const, fixture: true as const, missionId: snapshot.missionId, cycle: snapshot.cycle, missionRevision: snapshot.revision + 1,
    missionConfigFingerprint: fingerprint(snapshot.config), ...frozen };
  return parseGraphRun({ ...body, fingerprint: fingerprint(body) });
}
export function parseGraphRun(value: unknown): GraphRun {
  graphJson(value); const r = graphKeys(graphCopy(value), ["version", "fixture", "missionId", "cycle", "missionRevision", "missionConfigFingerprint", "prepared", "settings", "workers", "accounts", "inputsByFunction", "publicationsByFunction", "fingerprint"]);
  graphCheck(r.version === "l8-graph-run-v1" && r.fixture === true, "graph run version/mode"); graphString(r.missionId); graphInteger(r.cycle, 1); graphInteger(r.missionRevision, 1); graphString(r.missionConfigFingerprint); graphDigest(r);
  validateGraphRunSpec({ prepared: r.prepared, settings: r.settings, workers: r.workers, accounts: r.accounts, inputsByFunction: r.inputsByFunction, publicationsByFunction: r.publicationsByFunction });
  const prepared = parsePreparedGraph(r.prepared); graphCheck(prepared.snapshot.missionId === r.missionId, "run/plan mission mismatch");
  return r as unknown as GraphRun;
}
/** The legacy Engine supplies its existing blind-projection bundle builder. */
export function makeGraphIntent(run: GraphRun, snapshot: Snapshot, unit: WorkUnit, sub: WorkUnit["subIntents"][number], lease: UnitLease, inputs: InputBundle, worker: WorkerCapacity): GraphIntentRecord {
  run = parseGraphRun(run); inputs = parseGraphInputs(inputs);
  graphCheck(snapshot.missionId === run.missionId && snapshot.cycle === run.cycle && snapshot.revision === run.missionRevision && fingerprint(snapshot.config) === run.missionConfigFingerprint, "frozen mission revision changed");
  graphCheck(unit.subIntents.some(s => canonical(s) === canonical(sub)) && unit.ownedFunctionIds.includes(sub.functionId), "sub-intent attribution");
  graphCheck(["A", "B", "R"].includes(sub.role), "graph role");
  graphCheck(inputs.role === sub.role && inputs.cycle === run.cycle && canonical(inputs.identity) === canonical(sub.harnessIdentity), "functional input identity");
  if (sub.role === "A" || sub.role === "B") graphCheck(!inputs.proposals && !inputs.candidates && !inputs.unresolvedResults && [...inputs.files, ...inputs.knowledge.files].every(f => f.kind === "native" || f.kind === "rule" || (f.kind === "knowledge" && f.approvedForBlind === true)), "blind input contamination");
  if (sub.role === "R") {
    graphCheck(inputs.proposals?.length === 2 && inputs.proposals.every(p => canonical(p.document.identity) === canonical(sub.harnessIdentity)), "R requires its own exact A+B");
    graphCheck(new Set(inputs.proposals.map(p => p.authorId)).size === 2 && new Set(inputs.proposals.map(p => p.sessionId)).size === 2, "A/B authors not independent");
  }
  const inputFingerprint = fingerprint(inputs), taskId = `${run.missionId}:graph:${hash(unit.unitId).slice(0, 12)}:${hash(sub.subIntentId).slice(0, 12)}`;
  const attemptId = `${taskId}:f${lease.token}:a1`, executionId = `${attemptId}:${inputFingerprint.slice(0, 24)}`, model = snapshot.config.models[sub.role];
  graphCheck(worker.profile === run.settings.profiles[sub.role as "A" | "B" | "R"] && worker.model === `${model.providerID}/${model.id}#${model.variant}`, "worker/model/profile mismatch; no substitution");
  const intent: Intent = { schemaVersion: 1, fixture: true, binary: graphCopy(snapshot.config.binary), missionId: run.missionId, taskId, attemptId, executionId, idempotencyKey: executionId,
    cycle: run.cycle, role: sub.role, identity: graphCopy(sub.harnessIdentity), fresh: true, requestedModel: graphCopy(model), inputs, inputFingerprint,
    outputPath: join(snapshot.config.outputDirectory, `${hash(executionId)}.json`), previousResultIds: [] };
  const binding = { version: "l8-functional-binding-v1", missionId: run.missionId, cycle: run.cycle, missionRevision: run.missionRevision, unitId: unit.unitId,
    planId: run.prepared.planning.plan.planId, planFingerprint: run.prepared.planning.plan.fingerprint, snapshotId: unit.snapshotId, snapshotFingerprint: run.prepared.snapshot.normalizedFingerprint,
    partitionId: unit.partitionId, knowledgeRevision: unit.knowledgeRevision, familyToken: lease.token, subIntentId: sub.subIntentId, functionId: sub.functionId, role: sub.role,
    attemptId, executionId, inputFingerprint, inputVersions: inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })) };
  const header = { schemaVersion: 1, missionId: run.missionId, taskId, attemptId, executionId, cycle: run.cycle, authorId: executionId, identity: intent.identity, inputFingerprint, inputVersions: binding.inputVersions, previousResultIds: [] };
  const command = { taskId, attemptId, executionId, idempotencyKey: executionId, profile: worker.profile, model: intent.requestedModel,
    prompt: "Offline fixture only. One functional A/B/R result; no native tools or scientific authority.",
    dossier: { version: 1, fixture: true, functionId: sub.functionId, function: intent.identity, role: sub.role, cycle: run.cycle, inputs, resultHeader: header },
    metadata: { inputFingerprint, graphBinding: binding }, context: { mode: "fresh" }, worktree: false,
    requiredAccess: inputs.files.map(f => ({ action: "read", resource: f.path })) };
  const admission: Admission = { executionId, attemptId, role: sub.role, subIntentId: sub.subIntentId, idempotencyKey: executionId, command };
  return graphCopy({ version: "l8-graph-intent-v1", runFingerprint: run.fingerprint, unitId: unit.unitId, familyToken: lease.token, subIntentId: sub.subIntentId, workerId: worker.workerId, accountId: worker.accountId, intent, admission });
}
export function parseGraphIntent(value: unknown, run: GraphRun, snapshot: Snapshot): GraphIntentRecord {
  const r = graphKeys(graphCopy(value), ["version", "runFingerprint", "unitId", "familyToken", "subIntentId", "workerId", "accountId", "intent", "admission"]);
  graphCheck(r.version === "l8-graph-intent-v1" && r.runFingerprint === run.fingerprint, "intent journal version/run"); graphInteger(r.familyToken, 1);
  const unit = run.prepared.planning.units.find(u => u.unitId === r.unitId), sub = unit?.subIntents.find(s => s.subIntentId === r.subIntentId), worker = run.workers.find(w => w.workerId === r.workerId);
  graphCheck(unit && sub && worker && worker.accountId === r.accountId, "journal intent owner/inventory");
  const rawIntent = graphKeys(r.intent, ["schemaVersion", "fixture", "binary", "missionId", "taskId", "attemptId", "executionId", "idempotencyKey", "cycle", "role", "identity", "fresh", "requestedModel", "inputs", "inputFingerprint", "outputPath", "previousResultIds"]);
  // Reconstruct only the deterministic envelope, NEVER a new execution/plan.
  const reconstructed = makeGraphIntent(run, snapshot, unit, sub, { missionId: run.missionId, unitId: unit.unitId, owner: "journal-check-only", token: r.familyToken, expiresAtEvent: 0, state: "active", resourceKeys: [] }, parseGraphInputs(rawIntent.inputs), worker);
  graphCheck(canonical(reconstructed) === canonical(r), "functional journal envelope changed");
  return reconstructed;
}
export function graphResult(record: GraphIntentRecord, inspection: Inspection, prior: StoredResult[]): StoredResult {
  inspection = graphCopy(inspection);
  graphCheck(inspection.status === "completed" && inspection.fresh === true && !inspection.parentSessionId && inspection.sessionId && inspection.authorId && canonical(inspection.effectiveModel) === canonical(record.intent.requestedModel), "observed fresh session/model facts required");
  graphCheck(!prior.some(r => r.executionId !== inspection.executionId && (r.sessionId === inspection.sessionId || r.authorId === inspection.authorId)), "reused scientific author/session");
  const document = validateResult(record.intent, inspection); graphCheck(inspection.artifact, "missing result artifact");
  return { resultId: `result:${hash(record.intent.executionId)}`, path: inspection.artifact.path, sha256: inspection.artifact.sha256, authorId: inspection.authorId,
    executionId: record.intent.executionId, sessionId: inspection.sessionId, effectiveModel: graphCopy(inspection.effectiveModel!), content: inspection.artifact.content, document };
}
