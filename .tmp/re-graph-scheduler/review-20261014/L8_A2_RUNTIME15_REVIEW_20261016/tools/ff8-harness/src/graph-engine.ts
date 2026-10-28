import type { Evidence, GraphRun, GraphRunV2, InputAccess, InputBundle, Snapshot, StoredResult } from "./domain";
import type { Store } from "./store";
import { GraphStore, validateGraphDocument, type ArtifactReceipt, type KnowledgeCommit, type ParentScientificCheck, type UnitValidation } from "./graph-store";
import { assertController, type ControllerAuthority, type UnitLease } from "./unit-lease";
import { evaluateReadiness, readySubIntents, selectCompatible, selectReadyUnits, type ActiveUnit, type WorkUnit } from "./planner";
import { checkInputs } from "./inputs";
import { BridgeAdmissionError } from "./client";
import { canonical, fingerprint, hash, identityKey } from "./validation";
import { assertCurrentAdmissionSource, assertReceiptCoherence, graphArray, graphCheck, graphCopy, graphFreeze, graphInteger, graphKeys, graphObject, graphString } from "./graph-pipeline";
import { graphExecutionSlotKey, graphResult, makeExecutionClaim, makeGraphIntent, parseExecutionClaim, parseGraphIntent, parseGraphRun, type FixtureExecutionPort, type GraphExecutionClaim, type GraphIntentRecord, type GraphIntentRecordV2 } from "./graph-adapter";
import type { GraphEvent } from "./eventlog";

export interface GraphReview { evidence: Evidence[]; validatedFactIds: string[]; checks: ParentScientificCheck[] }
export interface FixtureReviewPort {
  readonly kind: "offline-fixture-v1";
  review(context: Readonly<{ run: GraphRun; unit: WorkUnit; results: StoredResult[] }>): Promise<GraphReview>;
}
export interface FixturePublicationPort {
  readonly kind: "offline-fixture-v1";
  write(request: Readonly<{ targetId: string; requestDigest: string; content: string }>): Promise<void>;
  read(request: Readonly<{ targetId: string; requestDigest: string }>): Promise<{ targetId: string; requestDigest: string; content: string; source: string }>;
}
export interface GraphEngineOptions {
  store: Store; graph: GraphStore; missionId: string; authority: () => ControllerAuthority;
  executions: FixtureExecutionPort; review: FixtureReviewPort; publication: FixturePublicationPort; inputAccess: InputAccess;
  inputs: (snapshot: Snapshot, sub: WorkUnit["subIntents"][number], proposals?: StoredResult[]) => InputBundle;
}
type ResultRecord = { version: "l8-graph-result-v1" | "l8-graph-result-v2"; runFingerprint: string; unitId: string; familyToken: number; subIntentId: string; result: StoredResult; inspection: import("./domain").Inspection };
type ReviewRecord = { version: "l8-graph-review-v1" | "l8-graph-review-v2"; runFingerprint: string; unitId: string; familyToken: number; resultIds: string[]; review: GraphReview };
interface Journal { events: GraphEvent[]; run: GraphRun; intents: GraphIntentRecord[]; results: ResultRecord[]; lateResults: ResultRecord[]; reviews: ReviewRecord[]; refused: GraphIntentRecordV2[]; paused: boolean; installed: boolean }
const runtimeRun = (run: GraphRun): GraphRunV2 => { graphCheck(run.version === "l8-graph-run-v2", "v1 graph run is inspectable/read-only, never resumed or migrated"); return run; };

export function graphAnchor(run: GraphRun): NonNullable<import("./domain").CycleRecord["graph"]> {
  const base = { runFingerprint: run.fingerprint, preparedFingerprint: run.prepared.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint,
    snapshotId: run.prepared.snapshot.snapshotId, partitionId: run.prepared.partition.partitionId, knowledgeRevision: run.prepared.snapshot.knowledgeRevision };
  return run.version === "l8-graph-run-v1" ? { ...base, version: "l8-frozen-cycle-v1" } : { ...base, version: "l8-frozen-cycle-v2", admissionContextFingerprint: fingerprint(run.prepared.admissionSource.context), allocationFingerprint: run.prepared.admissionSource.allocation?.fingerprint ?? null,
    budgetScopeKey: run.executionBinding.budgetScopeKey, derivedSpecFingerprint: run.executionBinding.derivedSpecFingerprint };
}
/** Marker presence, NOT truthiness: malformed/future anchors may never become legacy. */
export function assertLegacySnapshot(snapshot: Snapshot): void {
  graphCheck(Array.isArray(snapshot.cycles) && snapshot.cycles.every(cycle => !Object.hasOwn(cycle, "graph")), "graph-owned cycle refuses legacy attach/control/dispatch");
}
export function graphCycleProjection(run: GraphRun): { groups: Array<{ id: string; members: string[] }>; subset: string[] } {
  const byId = new Map(run.prepared.planning.units.flatMap(u => u.subIntents).map(s => [s.functionId, s.harnessIdentity]));
  const groups = run.prepared.groups.map(g => ({ id: g.groupId, members: g.ownedFunctionIds.map(id => { const identity = byId.get(id); graphCheck(identity, "group owner has no functional binding"); return identityKey(identity); }).sort() }));
  const selected = new Set(run.prepared.planning.plan.selectedUnitIds);
  const subset = [...new Set(run.prepared.planning.units.filter(u => selected.has(u.unitId)).flatMap(u => u.ownedFunctionIds.map(id => identityKey(byId.get(id)!))))].sort();
  return { groups, subset };
}
export function assertGraphSnapshot(snapshot: Snapshot, run: GraphRun): void {
  const cycle = snapshot.cycles.find(c => c.number === run.cycle);
  graphCheck(cycle && Object.hasOwn(cycle, "graph"), "orphan graph journal: no durable cycle anchor");
  graphKeys(cycle.graph, ["version", "runFingerprint", "preparedFingerprint", "planFingerprint", "snapshotId", "partitionId", "knowledgeRevision", ...(run.version === "l8-graph-run-v2" ? ["admissionContextFingerprint", "allocationFingerprint", "budgetScopeKey", "derivedSpecFingerprint"] : [])]);
  graphCheck(snapshot.missionId === run.missionId && snapshot.cycle === run.cycle && snapshot.revision === run.missionRevision && fingerprint(snapshot.config) === run.missionConfigFingerprint, "anchored mission/cycle/revision/config mismatch");
  graphCheck(cycle.frozen === true && canonical(cycle.graph) === canonical(graphAnchor(run)) && cycle.fingerprint === run.prepared.fingerprint, "anchor/prepared/plan binding mismatch");
  const projection = graphCycleProjection(run);
  graphCheck(canonical(cycle.groups) === canonical(projection.groups) && canonical(cycle.subset) === canonical(projection.subset), "actual frozen CycleRecord projection changed");
  if (run.version === "l8-graph-run-v2") assertCurrentAdmissionSource(run.prepared, snapshot);
}
export function graphEvents(graph: GraphStore, missionId: string): GraphEvent[] {
  return graph.events.replay<GraphEvent[]>(missionId, [], (events, event) => { events.push(event); return events; });
}
export function preparedGraphRun(graph: GraphStore, missionId: string): GraphRun | undefined {
  return runFromEvents(graphEvents(graph, missionId), missionId);
}
function runFromEvents(events: GraphEvent[], missionId: string): GraphRun | undefined {
  const preparations = events.filter(e => e.kind === "l8.graph.preparing" || e.kind === "l8.graph2.preparing");
  graphCheck(preparations.length <= 1, "multiple graph preparation origins");
  const first = preparations[0]; if (!first) { graphCheck(!events.some(e => e.kind.startsWith("l8.")), "orphan own graph namespace"); return; }
  const payload = graphKeys(first.payload, ["version", "run"]), run = parseGraphRun(payload.run), v2 = run.version === "l8-graph-run-v2", ns = v2 ? "l8.graph2" : "l8.graph";
  graphCheck(payload.version === (v2 ? "l8-graph-preparing-v2" : "l8-graph-preparing-v1") && first.kind === `${ns}.preparing`, "preparation journal version");
  graphCheck(run.missionId === missionId && first.key === `${ns}.prepare:${run.cycle}` && first.unitId === null, "preparation journal scope"); return run;
}
/** Public journal only. A generic event digest never grants scientific authority. */
export function appendGraphPreparation(graph: GraphStore, authority: ControllerAuthority, run: GraphRun): void {
  run = parseGraphRun(run); graphCheck(authority.lease.missionId === run.missionId, "preparation authority scope");
  runtimeRun(run);
  authority = graphCopy(authority);
  graph.db.transaction(() => {
    assertController(graph.db, authority, run.missionId);
    const old = preparedGraphRun(graph, run.missionId);
    if (old) graphCheck(canonical(old) === canonical(run), "immutable preparation changed");
    else graph.events.append(run.missionId, `l8.graph2.prepare:${run.cycle}`, "l8.graph2.preparing", authority.now, { version: "l8-graph-preparing-v2", run }, null, graph.events.cursor(run.missionId).sequence);
    assertController(graph.db, authority, run.missionId);
  }).immediate();
}
/** Synchronous, same-connection N/input-pin/outbox composition ratified by the parent.
 * No port/callback, await, connection constructor, Store write or direct SQL here. */
export function prepareGraphExecution(graph: GraphStore, store: Store, rawRun: GraphRunV2, rawAuthority: ControllerAuthority, rawLease: UnitLease, rawRecord: GraphIntentRecordV2): GraphExecutionClaim {
  const run = runtimeRun(parseGraphRun(rawRun)), authority = graphCopy(rawAuthority), lease = graphCopy(rawLease);
  const snapshot = store.load(run.missionId), parsed = parseGraphIntent(rawRecord, run, snapshot); graphCheck(parsed.version === "l8-graph-intent-v2", "v2 execution required");
  const record = graphFreeze(parsed), claim = makeExecutionClaim(run, record); // FINAL canonical UTF8 <= C, BEFORE tx
  graphCheck(graph.db === graph.events.db && graph.db === graph.leases.db && graph.events === graph.leases.events && graph.path === store.path, "transaction components must use the same OWN connection");
  return graph.db.transaction(() => {
    assertController(graph.db, authority, run.missionId); graph.leases.assert(lease, authority);
    const current = store.load(run.missionId); assertGraphSnapshot(current, run); graphCheck(current.status === "running", "graph source is not running");
    assertProposals(record, run, readGraphJournal(graph, current).results);
    const expectation = graph.reservationExpectation(run.missionId);
    graphCheck(expectation.bindingFingerprint === run.prepared.planning.binding.fingerprint && expectation.planFingerprint === run.prepared.planning.plan.fingerprint && expectation.sidecarFingerprint === run.prepared.planning.sidecar.fingerprint && expectation.missionRevision === run.missionRevision && expectation.knowledgeRevision === run.prepared.snapshot.knowledgeRevision, "current durable reservation/context mismatch");
    graphCheck(lease.unitId === record.unitId && lease.token === record.familyToken && authority.lease.token === record.controllerToken, "original execution/controller/family fence changed");
    graph.freezeAdmissionInputs(authority, lease, record.subIntentId, record.intent.inputs);
    const key = graphExecutionSlotKey(run, record.unitId, record.subIntentId), old = graphEvents(graph, run.missionId).find(e => e.key === key);
    if (old) {
      graphCheck(old.kind === "l8.graph2.execution-claimed" && old.unitId === record.unitId, "invalid original budget claim carrier");
      graphCheck(canonical(parseExecutionClaim(old.payload, run, current)) === canonical(claim), "spent execution slot cannot change body/ID/generation/pass/retry policy");
      // Deliberately do not append at now: EventLog.digest includes ORIGINAL time.
    } else graph.events.append(run.missionId, key, "l8.graph2.execution-claimed", authority.now, claim, record.unitId, graph.events.cursor(run.missionId).sequence);
    graph.prepareAdmission(authority, lease, record.admission, claim.maxAttempts, claim.retryDelayMs);
    assertController(graph.db, authority, run.missionId); graph.leases.assert(lease, authority); // appends can expire an event lease
    return graphCopy(claim);
  }).immediate();
}
function parseReview(value: unknown, run: GraphRun, unit: WorkUnit): GraphReview {
  const r = graphKeys(graphCopy(value), ["evidence", "validatedFactIds", "checks"]); graphArray(r.evidence); graphArray(r.validatedFactIds); graphArray(r.checks);
  graphCheck(r.evidence.length > 0 && r.checks.length > 0, "complete executed fixture review required");
  for (const value of r.evidence) { const e = graphKeys(value, ["id", "source", "sha256", "detail"]); [e.id, e.source, e.detail].forEach(graphString); graphCheck(typeof e.sha256 === "string" && /^[a-f0-9]{64}$/.test(e.sha256), "review evidence hash"); }
  r.validatedFactIds.forEach(graphString);
  graphCheck(canonical(r.validatedFactIds) === canonical(unit.ownedFunctionIds.map(id => run.publicationsByFunction[id]!.artifactId).sort()), "review fact/function attribution changed");
  for (const value of r.checks) { const c = graphKeys(value, ["id", "kind", "outcome", "evidenceDigest", "detail"]); [c.id, c.kind, c.detail].forEach(graphString); graphCheck(c.outcome === "pass" && c.evidenceDigest === fingerprint(r.evidence), "review checks/evidence mismatch"); }
  return r as unknown as GraphReview;
}
function storedResult(value: unknown): void {
  const r = graphKeys(value, ["resultId", "path", "sha256", "authorId", "executionId", "sessionId", "effectiveModel", "content", "document"]);
  for (const key of ["resultId", "path", "sha256", "authorId", "executionId", "sessionId", "content"]) graphString(r[key]);
  const model = graphKeys(r.effectiveModel, ["providerID", "id", "variant"]); Object.values(model).forEach(graphString);
}
function assertProposals(record: GraphIntentRecord, run: GraphRun, results: ResultRecord[]): void {
  if (record.intent.role !== "R") return;
  const unit = run.prepared.planning.units.find(u => u.unitId === record.unitId)!, sub = unit.subIntents.find(s => s.subIntentId === record.subIntentId)!;
  const expected = results.filter(result => result.unitId === unit.unitId && result.familyToken === record.familyToken && unit.subIntents.some(s => s.functionId === sub.functionId && ["A", "B"].includes(s.role) && s.subIntentId === result.subIntentId)).map(r => r.result);
  graphCheck(expected.length === 2 && canonical(record.intent.inputs.proposals) === canonical(expected.map(({ resultId, sha256, path, authorId, executionId, sessionId, content, document }) => ({ resultId, sha256, path, authorId, executionId, sessionId, content, document }))), "R must consume the exact eligible same-function/same-family A+B bytes");
}
/** Historical reservation bytes ONLY, never a replacement/current lease. L6
 * retainResult checks them against the original outbox and marks them ineligible
 * after the real current fence has changed. */
function originalFamilyLease(j: Journal, record: GraphIntentRecord): UnitLease {
  const event = j.events.find(e => e.key === `reserve:${record.unitId}:${record.familyToken}` && e.kind === "unit_reserved" && e.unitId === record.unitId);
  const p = graphKeys(event?.payload, ["lease", "controllerToken", "bindingFingerprint"]), lease = graphKeys(p.lease, ["missionId", "unitId", "owner", "token", "expiresAtEvent", "state", "resourceKeys"]);
  graphCheck(p.bindingFingerprint === j.run.prepared.planning.binding.fingerprint && (record.version !== "l8-graph-intent-v2" || p.controllerToken === record.controllerToken) && lease.missionId === j.run.missionId && lease.unitId === record.unitId && lease.token === record.familyToken && lease.state === "active", "missing original historical family reservation");
  graphString(lease.owner); graphInteger(lease.expiresAtEvent, 1); graphArray(lease.resourceKeys); lease.resourceKeys.forEach(graphString); return graphCopy(lease) as unknown as UnitLease;
}
export function readGraphJournal(graph: GraphStore, snapshot: Snapshot): Journal {
  const events = graphEvents(graph, snapshot.missionId), run = runFromEvents(events, snapshot.missionId); graphCheck(run, "graph preparation unavailable"); assertGraphSnapshot(snapshot, run);
  const v2 = run.version === "l8-graph-run-v2", ns = v2 ? "l8.graph2" : "l8.graph", suffix = v2 ? "v2" : "v1";
  const intents: GraphIntentRecord[] = [], results: ResultRecord[] = [], lateResults: ResultRecord[] = [], observed: StoredResult[] = [], reviews: ReviewRecord[] = [], refused: GraphIntentRecordV2[] = [];
  let installed = false, paused = false;
  for (const event of events.filter(e => e.kind.startsWith("l8."))) {
    if (event.kind === `${ns}.preparing`) continue;
    if (event.kind === `${ns}.ready`) {
      const p = graphKeys(event.payload, ["version", "runFingerprint", "missionRevision", "bindingFingerprint"]);
      graphCheck(p.version === `l8-graph-ready-${suffix}` && p.runFingerprint === run.fingerprint && p.missionRevision === run.missionRevision && p.bindingFingerprint === run.prepared.planning.binding.fingerprint && event.key === `${ns}.ready:${run.fingerprint}` && event.unitId === null, "runtime initialization binding"); installed = true;
    } else if ((!v2 && event.kind === "l8.graph.intent") || (v2 && event.kind === "l8.graph2.execution-claimed")) {
      graphCheck(installed, "admission before anchored projection");
      const record = v2 ? parseExecutionClaim(event.payload, run, snapshot).record : parseGraphIntent(event.payload, run, snapshot);
      graphCheck(event.key === (v2 ? graphExecutionSlotKey(run, record.unitId, record.subIntentId) : `l8.graph.intent:${record.intent.executionId}`) && event.unitId === record.unitId && !intents.some(r => r.unitId === record.unitId && r.subIntentId === record.subIntentId), "duplicate/orphan/changed execution slot");
      assertProposals(record, run, results);
      if (v2) {
        const admission = graph.admission(record.intent.executionId), prepared = events.find(e => e.key === `admission:${record.intent.executionId}` && e.kind === "admission_prepared"), payload = graphObject(prepared?.payload);
        graphCheck(admission && admission.digest === fingerprint(record.admission) && canonical(payload.body) === canonical(record.admission) && payload.token === record.familyToken && payload.maxAttempts === run.settings.maxAdmissionAttempts && payload.retryDelayMs === run.settings.retryDelayMs, "claim/outbox atomic binding missing or changed");
      }
      intents.push(record);
    } else if (v2 && event.kind === `${ns}.admission-refused`) {
      const p = graphKeys(event.payload, ["version", "runFingerprint", "reason", "record", "admissionSha256", "admissionUtf8Bytes", "C"]), record = parseGraphIntent(p.record, run, snapshot);
      graphCheck(p.version === "l8-graph-refused-v2" && p.reason === "body-over-C" && p.runFingerprint === run.fingerprint && record.version === "l8-graph-intent-v2", "budget refusal schema");
      const budget = run.prepared.planning.sidecar.admissionBudget!.byUnit[record.unitId];
      graphCheck(budget?.admissionCapUtf8Bytes.known && p.C === budget.admissionCapUtf8Bytes.value && p.admissionSha256 === fingerprint(record.admission) && p.admissionUtf8Bytes === Buffer.byteLength(canonical(record.admission), "utf8") && Number(p.admissionUtf8Bytes) > Number(p.C)
        && event.unitId === record.unitId && event.key === `${ns}.refused:${fingerprint({ unitId: record.unitId, subIntentId: record.subIntentId, body: p.admissionSha256 })}`, "refused full evidence/count binding");
      refused.push(record);
    } else if (event.kind === `${ns}.result` || event.kind === `${ns}.late-result`) {
      const p = graphKeys(event.payload, ["version", "runFingerprint", "unitId", "familyToken", "subIntentId", "result", "inspection"]); storedResult(p.result);
      graphCheck(p.version === `l8-graph-result-${suffix}` && p.runFingerprint === run.fingerprint, "result journal version"); graphInteger(p.familyToken, 1);
      const result = p.result as unknown as StoredResult, record = intents.find(r => r.intent.executionId === result.executionId);
      graphCheck(record && p.unitId === record.unitId && p.familyToken === record.familyToken && p.subIntentId === record.subIntentId && event.unitId === record.unitId && event.key === `${event.kind}:${result.resultId}`, "result journal attribution");
      graphKeys(p.inspection, ["status", "executionId", "authorId", "sessionId", "effectiveModel", "fresh", "artifact"], ["parentSessionId"]);
      const actual = graphResult(record, p.inspection as unknown as import("./domain").Inspection, observed); graphCheck(canonical(actual) === canonical(result), "result bytes/session/header changed"); observed.push(result);
      const retained = events.find(e => e.key === `result:${result.resultId}` && e.kind === "result_retained" && e.unitId === record.unitId), payload = graphObject(retained?.payload);
      graphCheck(payload.executionId === result.executionId && payload.token === record.familyToken && canonical(payload.document) === canonical(result.document), "result lacks exact v6 retention record");
      if (event.kind === `${ns}.result`) { graphCheck(payload.eligible === true && graph.admission(result.executionId)?.state === "TERMINAL", "unproven result cannot unblock"); results.push(p as unknown as ResultRecord); }
      else { graphCheck(payload.eligible === false, "late result incorrectly eligible"); lateResults.push(p as unknown as ResultRecord); }
    } else if (event.kind === `${ns}.review`) {
      const p = graphKeys(event.payload, ["version", "runFingerprint", "unitId", "familyToken", "resultIds", "review"]), unit = run.prepared.planning.units.find(u => u.unitId === p.unitId);
      graphCheck(p.version === `l8-graph-review-${suffix}` && p.runFingerprint === run.fingerprint && unit && event.unitId === unit.unitId && event.key === `${ns}.review:${unit.unitId}:${p.familyToken}`, "review journal binding"); graphInteger(p.familyToken, 1); graphArray(p.resultIds); p.resultIds.forEach(graphString);
      const family = results.filter(r => r.unitId === unit.unitId && r.familyToken === p.familyToken);
      graphCheck(family.length === unit.subIntents.length && canonical(p.resultIds) === canonical(family.map(r => r.result.resultId).sort()), "review lacks complete family"); parseReview(p.review, run, unit); reviews.push(p as unknown as ReviewRecord);
    } else if (event.kind === `${ns}.control`) {
      const p = graphKeys(event.payload, ["version", "runFingerprint", "action"]); graphCheck(p.version === `l8-graph-control-${suffix}` && p.runFingerprint === run.fingerprint && ["pause", "resume"].some(x => x === p.action) && event.key === `${ns}.control:${event.sequence}` && event.unitId === null, "control journal schema"); paused = p.action === "pause";
    } else throw new Error("graph: unknown own journal namespace/version");
  }
  if (v2) for (const unit of run.prepared.planning.units) graphCheck(intents.filter(r => r.unitId === unit.unitId).length <= run.prepared.planning.sidecar.admissionBudget!.byUnit[unit.unitId]!.maxNewExecutions.value!, "durable N exceeded across generations/passes");
  return { events, run, intents, results, lateResults, reviews, refused, paused, installed };
}
function verifiedReceiptHints(graph: GraphStore, j: Journal): import("./planner").ArtifactReceipt[] {
  return j.events.filter(e => e.kind === "artifact_receipt").map(e => {
    assertReceiptCoherence(e.payload); const receipt = graphCopy(e.payload) as import("./planner").ArtifactReceipt;
    graphCheck(receipt.producerUnitId, "external producer=null lacks a supported public authority import; STOP");
    const binding = graph.artifactBinding(j.run.missionId, receipt.commitId, receipt.artifactId);
    const exact = { artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, functionId: binding.functionId, moduleSha256: binding.moduleSha256, artifactKind: binding.artifactKind,
      knowledgeRevision: binding.knowledgeRevision, publicationLevel: binding.publicationLevel, validation: binding.validation, producerUnitId: binding.producerUnitId, commitId: binding.commitId, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
    graphCheck(canonical(receipt) === canonical(exact) && graph.satisfies(j.run.missionId, receipt.producerUnitId, receipt.publicationLevel), "receipt differs from current artifact/commit/parent/readback tuple");
    // Preflight only. L6 reserve additionally verifies the private durable receipt
    // row through its public API. No event/self-hash is admission authority.
    return receipt;
  });
}
export function inspectGraphState(graph: GraphStore, snapshot: Snapshot) {
  const j = readGraphJournal(graph, snapshot), receipts = verifiedReceiptHints(graph, j);
  const units = j.run.prepared.planning.units.filter(u => j.run.prepared.planning.plan.selectedUnitIds.includes(u.unitId)).map(original => {
    const current = graph.unit(j.run.missionId, original.unitId); validateGraphDocument("work-unit", current);
    const { state: _a, ...a } = current, { state: _b, ...b } = original; graphCheck(canonical(a) === canonical(b), "immutable unit changed during inspection"); return current;
  });
  const complete = units.length > 0 && units.every(u => u.state === "COMMITTED" && graph.satisfies(j.run.missionId, u.unitId, u.requiredPublicationLevel)
    && u.ownedFunctionIds.every(id => receipts.some(r => r.producerUnitId === u.unitId && r.functionId === id)));
  return { version: "l8-graph-view-v2" as const, fixture: true as const, nativeVerified: false as const, scientificAuthority: false as const, runVersion: j.run.version, readOnly: j.run.version === "l8-graph-run-v1",
    runFingerprint: j.run.fingerprint, preparedFingerprint: j.run.prepared.fingerprint,
    status: j.run.version === "l8-graph-run-v1" ? "read-only" : complete ? "complete" : j.paused ? "paused" : !units.length || units.some(u => ["FAILED", "CANCELLED", "QUARANTINED", "STOP_PENDING"].includes(u.state) || graph.leases.get(j.run.missionId, u.unitId)?.state === "quarantined") ? "blocked" : "waiting",
    units: units.map(u => ({ unitId: u.unitId, state: u.state })), intents: j.intents, refused: j.refused, resultIds: j.results.map(r => r.result.resultId), lateResultIds: j.lateResults.map(r => r.result.resultId), sequence: graph.events.cursor(j.run.missionId).sequence,
    admissionAccounting: j.run.version === "l8-graph-run-v2" ? j.run.prepared.planning.sidecar.admissionBudget : null };
}

/** Event-driven fixture integration. This module has no native/client connection factory. */
export class GraphEngine {
  constructor(readonly options: GraphEngineOptions) {
    graphCheck(options.store.path !== ":memory:" && options.store.path === options.graph.path, "graph and legacy Store require the same persistent OWN file");
    graphCheck([options.executions.kind, options.review.kind, options.publication.kind].every(kind => kind === "offline-fixture-v1"), "only explicitly configured fixture ports are enabled");
  }
  close(): void { this.options.graph.close(); }
  private snapshot(): Snapshot { return this.options.store.load(this.options.missionId); }
  private authority(): ControllerAuthority {
    const authority = this.options.authority(); this.options.store.assertLease(authority.lease, authority.now);
    const cursor = this.options.graph.events.cursor(this.options.missionId); return { lease: graphCopy(authority.lease), now: Math.max(authority.now, cursor.time) };
  }
  private append(key: string, kind: string, payload: unknown, unitId: string | null = null): void {
    const graph = this.options.graph, authority = this.authority(), data = graphCopy(payload);
    graph.db.transaction(() => {
      assertController(graph.db, authority, this.options.missionId);
      const old = graphEvents(graph, this.options.missionId).find(e => e.key === key);
      if (old) graphCheck(old.kind === kind && old.unitId === unitId && canonical(old.payload) === canonical(data), "immutable runtime event changed");
      else graph.events.append(this.options.missionId, key, kind, authority.now, data, unitId, graph.events.cursor(this.options.missionId).sequence);
      assertController(graph.db, authority, this.options.missionId);
    }).immediate();
  }
  /** Called only AFTER the actual Store cycle CAS; may finish an interrupted projection. */
  install(): void {
    const graph = this.options.graph, run = preparedGraphRun(graph, this.options.missionId); graphCheck(run, "missing graph preparation"); assertGraphSnapshot(this.snapshot(), run);
    runtimeRun(run);
    this.verifyEntry();
    const authority = this.authority(); graph.putSnapshot(authority, graphObject(run.prepared.snapshot)); graph.putPartition(authority, graphObject(run.prepared.partition));
    for (const unit of run.prepared.planning.units) graph.addUnit(authority, unit);
    let revision = 0;
    if (graphEvents(graph, run.missionId).some(e => e.kind === "plan_frozen")) {
      const expected = graph.reservationExpectation(run.missionId);
      graphCheck(expected.planFingerprint === run.prepared.planning.plan.fingerprint && expected.bindingFingerprint === run.prepared.planning.binding.fingerprint, "cannot substitute another active plan during recovery"); revision = expected.activePlanRevision;
    }
    graph.freezePlan(authority, run.prepared.planning.plan, run.prepared.planning.sidecar, run.prepared.planning.binding, revision);
    this.append(`l8.graph2.ready:${run.fingerprint}`, "l8.graph2.ready", { version: "l8-graph-ready-v2", runFingerprint: run.fingerprint, missionRevision: run.missionRevision, bindingFingerprint: run.prepared.planning.binding.fingerprint });
  }
  /** Strict, read-only preflight, usable before an explicit graph lease attach. */
  verifyEntry(): void { this.journal(); }
  private journal(): Journal {
    return readGraphJournal(this.options.graph, this.snapshot());
  }
  private unit(run: GraphRun, unit: WorkUnit): WorkUnit {
    const current = this.options.graph.unit(run.missionId, unit.unitId); validateGraphDocument("work-unit", current);
    const { state: _a, ...a } = current, { state: _b, ...b } = unit; graphCheck(canonical(a) === canonical(b), "immutable unit content changed");
    return { ...graphCopy(unit), state: current.state };
  }
  private allActive(journal: Journal): ActiveUnit[] {
    const graph = this.options.graph, added = journal.events.filter(e => e.kind === "unit_added");
    return added.flatMap(event => {
      validateGraphDocument("work-unit", event.payload); const original = event.payload as WorkUnit, lease = graph.leases.get(journal.run.missionId, original.unitId);
      if (!lease || lease.state === "released") return [];
      const current = graph.unit(journal.run.missionId, original.unitId); validateGraphDocument("work-unit", current);
      return [{ unit: { ...graphCopy(original), state: current.state }, familyLeaseKey: `family:${original.unitId}:${lease.token}`, planId: journal.run.prepared.planning.plan.planId, workerMayStillRun: true }];
    });
  }
  private pending(j: Journal): GraphIntentRecord[] { return j.intents.filter(r => !j.results.some(result => result.result.executionId === r.intent.executionId) && !["REJECTED", "TERMINAL"].includes(this.options.graph.admission(r.intent.executionId)?.state ?? "PREPARED")); }
  private capacity(j: Journal) {
    const pending = this.pending(j), busy = new Set(pending.map(r => r.workerId)), accounts = graphCopy(j.run.accounts);
    for (const record of pending) {
      const resources = j.run.prepared.planning.sidecar.resourcesByUnit[record.unitId]!, account = accounts.find(a => a.accountId === record.accountId);
      if (account) { account.slots = Math.max(0, account.slots - resources.slots); account.budget = Math.max(0, account.budget - resources.budget); }
    }
    return { pending, accounts, workers: j.run.workers.map(w => ({ ...graphCopy(w), available: w.available && !busy.has(w.workerId) })) };
  }
  private receipts(j: Journal): import("./planner").ArtifactReceipt[] {
    return verifiedReceiptHints(this.options.graph, j);
  }
  private checkFamilies(j: Journal): void {
    for (const unit of j.run.prepared.planning.units) {
      const lease = this.options.graph.leases.get(j.run.missionId, unit.unitId); if (!lease || lease.state !== "active") continue;
      try { this.options.graph.leases.assert(lease, this.authority()); }
      catch { this.options.graph.leases.quarantine(this.authority(), lease, "controller/family fence expired or changed; authenticated terminal readback required"); }
    }
  }
  private async submit(record: GraphIntentRecord, lease: UnitLease, run: GraphRun): Promise<void> {
    const activeRun = runtimeRun(run); graphCheck(record.version === "l8-graph-intent-v2", "v1 execution is read-only");
    const graph = this.options.graph, admission = graph.admission(record.intent.executionId);
    if (admission && admission.state !== "PREPARED") return;
    const capturedAuthority = this.authority(); // any Store lease renewal is OUTSIDE the outer transaction
    prepareGraphExecution(graph, this.options.store, activeRun, capturedAuthority, lease, record);
    const current = graph.admission(record.intent.executionId)!; if (current.state !== "PREPARED") return;
    const sending = graphEvents(graph, run.missionId).filter(e => e.kind === "admission_sending" && graphObject(e.payload).executionId === record.intent.executionId).at(-1);
    if (sending && this.authority().now < sending.time + run.settings.retryDelayMs) return;
    try {
      await graph.dispatch(this.authority(), lease, record.intent.executionId, { submit: async (mission, command) => {
        try { return await this.options.executions.submit(mission, command); }
        catch (error) {
          const e = error !== null && typeof error === "object" ? error as Record<string, unknown> : {};
          throw new BridgeAdmissionError("offline fixture admission failed; original transport details not journaled", typeof e.category === "string" ? e.category : "transport", e.recoverable === true, e.type === "execution_rejected" ? "execution_rejected" : undefined);
        }
      } });
    } catch { /* L6 retained the actual bounded rejection/ambiguity, never release here. */ }
    if (graph.admission(record.intent.executionId)?.state === "REJECTED") this.failQuiescentFamilies(this.journal());
  }
  private async observe(j: Journal): Promise<void> {
    runtimeRun(j.run);
    const prior = [...j.results, ...j.lateResults].map(r => r.result);
    for (const record of j.intents.filter(r => !j.results.some(x => x.result.executionId === r.intent.executionId))) {
      const graph = this.options.graph, currentLease = graph.leases.get(j.run.missionId, record.unitId);
      const lease = currentLease?.token === record.familyToken ? currentLease : originalFamilyLease(j, record);
      const state = graph.admission(record.intent.executionId)?.state;
      if (!state || state === "PREPARED") { if (currentLease?.token === record.familyToken && currentLease.state === "active") await this.submit(record, currentLease, j.run); continue; }
      if (state === "REJECTED") continue;
      const observation = graphCopy(await this.options.executions.observe(graphFreeze(record)));
      graphKeys(observation, ["inspection"], ["terminalProof", "admissionObservation"]);
      if (observation.admissionObservation) {
        const a = graphKeys(observation.admissionObservation, ["executionId", "requestDigest", "state", "receipt", "proof"]); graphString(a.proof);
        graphCheck(a.executionId === record.intent.executionId && a.requestDigest === graph.admission(record.intent.executionId)!.digest && ["accepted", "absent", "unknown", "rejected"].some(s => s === a.state), "admission observation binding");
        graph.reconcileAdmission(this.authority(), lease, observation.admissionObservation);
      }
      if (observation.inspection.status !== "completed") continue;
      graphCheck(observation.terminalProof, "terminal result requires configured observer's proof");
      graph.proveTerminal(this.authority(), record.unitId, record.intent.executionId, "completed", observation.terminalProof);
      const result = graphResult(record, observation.inspection, prior);
      const eligible = graph.retainResult(this.authority(), lease, record.intent.executionId, result.resultId, graphObject(result.document));
      const kind = eligible ? "l8.graph2.result" : "l8.graph2.late-result";
      this.append(`${kind}:${result.resultId}`, kind, { version: "l8-graph-result-v2", runFingerprint: j.run.fingerprint, unitId: record.unitId, familyToken: record.familyToken, subIntentId: record.subIntentId, result, inspection: observation.inspection }, record.unitId);
      prior.push(result); // next observation also sees this already retained author/session
    }
  }
  private async finish(j: Journal): Promise<void> {
    const graph = this.options.graph;
    for (const planned of j.run.prepared.planning.units) {
      const unit = this.unit(j.run, planned), lease = graph.leases.get(j.run.missionId, unit.unitId);
      if (lease && unit.state === "COMMITTED") {
        const commitEvent = graphEvents(graph, j.run.missionId).find(e => e.key === `commit:${unit.unitId}` && e.kind === "knowledge_committed");
        graphCheck(commitEvent, "COMMITTED without durable commit"); validateGraphDocument("knowledge-commit", commitEvent.payload);
        this.materializeArtifacts(j, unit, commitEvent.payload as KnowledgeCommit, j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.result));
        continue;
      }
      if (!lease || lease.state !== "active" || !["RESERVED", "RUNNING", "VALIDATING"].includes(unit.state)) continue;
      graph.leases.assert(lease, this.authority());
      const family = j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.result);
      if (family.length !== unit.subIntents.length) continue;
      if (!family.filter(r => r.document.kind === "reconciliation").every(r => r.document.kind === "reconciliation" && r.document.decision === "certain")) {
        graph.retireFamily(this.authority(), lease, "FAILED", "uncertain reconciliation retained, no publication or additional SCC pass", "scientific_block"); continue;
      }
      const resultIds = family.map(r => r.resultId).sort(); let review = j.reviews.find(r => r.unitId === unit.unitId && r.familyToken === lease.token)?.review;
      if (!review) {
        review = parseReview(await this.options.review.review(graphFreeze({ run: j.run, unit, results: family })), j.run, unit);
        this.append(`l8.graph2.review:${unit.unitId}:${lease.token}`, "l8.graph2.review", { version: "l8-graph-review-v2", runFingerprint: j.run.fingerprint, unitId: unit.unitId, familyToken: lease.token, resultIds, review }, unit.unitId);
      }
      const events = graphEvents(graph, j.run.missionId), priorValidation = events.find(e => e.key === `validation:${unit.unitId}:${lease.token}`);
      if (!priorValidation) {
        const attestation = graph.recordParentAttestation(this.authority(), lease, { bindingFingerprint: j.run.prepared.planning.binding.fingerprint, planFingerprint: j.run.prepared.planning.plan.fingerprint,
          snapshotId: unit.snapshotId, knowledgeRevision: unit.knowledgeRevision, resultIds, resultDigests: Object.fromEntries(family.map(r => [r.resultId, fingerprint(r.document)])), evidence: review.evidence, validatedFactIds: review.validatedFactIds, checks: review.checks });
        const validation: UnitValidation = { source: "artifact", parentValidated: false, parentAttestationId: attestation.attestationId, evidence: review.evidence, validatedFactIds: review.validatedFactIds };
        graph.validateUnit(this.authority(), lease, resultIds, validation);
      }
      const content = canonical({ version: "l8-fixture-publication-v1", missionId: j.run.missionId, unitId: unit.unitId, planFingerprint: j.run.prepared.planning.plan.fingerprint, resultIds,
        artifacts: unit.ownedFunctionIds.map(functionId => ({ functionId, ...j.run.publicationsByFunction[functionId]! })) });
      const targetId = `fixture:graph:${fingerprint({ missionId: j.run.missionId, unitId: unit.unitId })}`;
      const pendingContent = { schemaVersion: 1 as const, inputRevision: unit.knowledgeRevision, outputRevision: unit.knowledgeRevision + 1, unitId: unit.unitId, resultIds,
        validatedFactIds: review.validatedFactIds, evidence: review.evidence, publicationLevel: unit.requiredPublicationLevel, publicationTargetId: targetId, readbackStatus: "pending" as const,
        readbackHash: hash(content), futurePrerequisiteEffect: "does_not_satisfy" as const, isGitCommit: false as const };
      const pending: KnowledgeCommit = { ...pendingContent, commitId: fingerprint(pendingContent) };
      graph.preparePublication(this.authority(), lease, pending, { verifiedEffect: "satisfies" });
      const request = { targetId, requestDigest: fingerprint(pending), content };
      await this.options.publication.write(graphFreeze(request));
      const readback = graphCopy(await this.options.publication.read(graphFreeze({ targetId, requestDigest: request.requestDigest })));
      graphKeys(readback, ["targetId", "requestDigest", "content", "source"]); graphString(readback.source);
      graphCheck(readback.targetId === targetId && readback.requestDigest === request.requestDigest && readback.content === content, "actual fixture publication byte readback mismatch");
      const commit = graph.commitReadback(this.authority(), lease, { targetId, requestDigest: request.requestDigest, hash: hash(readback.content), source: readback.source });
      this.materializeArtifacts(j, unit, commit, family);
      await this.fill(); // immediately after THIS commit/receipts, not after unrelated validation branches
    }
  }
  private materializeArtifacts(j: Journal, unit: WorkUnit, commit: KnowledgeCommit, family: StoredResult[]): void {
    const graph = this.options.graph;
    graphCheck(graph.satisfies(j.run.missionId, unit.unitId, unit.requiredPublicationLevel), "publication no longer satisfies its level/proofs");
    for (const functionId of unit.ownedFunctionIds) {
      const artifact = j.run.publicationsByFunction[functionId]!, source = family.find(r => r.document.kind === "reconciliation" && unit.subIntents.some(s => s.functionId === functionId && s.role === "R" && j.intents.some(i => i.subIntentId === s.subIntentId && i.intent.executionId === r.executionId)));
      graphCheck(source, "artifact source must be this function's exact R");
      const binding = graph.recordArtifactBinding(this.authority(), { commitId: commit.commitId, artifactId: artifact.artifactId, functionId, artifactKind: artifact.artifactKind, sourceResultIds: [source.resultId], content: artifact.content });
      const receipt: ArtifactReceipt = { artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, functionId: binding.functionId, moduleSha256: binding.moduleSha256, artifactKind: binding.artifactKind,
        knowledgeRevision: binding.knowledgeRevision, publicationLevel: binding.publicationLevel, validation: binding.validation, producerUnitId: binding.producerUnitId, commitId: binding.commitId, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
      assertReceiptCoherence(receipt); graph.recordKnowledgeReceipt(this.authority(), receipt);
    }
  }
  private failQuiescentFamilies(j: Journal): void {
    const graph = this.options.graph;
    for (const planned of j.run.prepared.planning.units) {
      const unit = this.unit(j.run, planned), lease = graph.leases.get(j.run.missionId, unit.unitId);
      if (!lease || lease.state !== "active" || !["RESERVED", "RUNNING", "STOP_PENDING"].includes(unit.state)) continue;
      if (!j.intents.some(r => r.unitId === unit.unitId && r.familyToken === lease.token && graph.admission(r.intent.executionId)?.state === "REJECTED")) continue;
      try { graph.retireFamily(this.authority(), lease, unit.state === "RESERVED" ? "CANCELLED" : "FAILED", "definitive v6 rejection; allocation remains spent", "input"); }
      catch { if (unit.state !== "STOP_PENDING") graph.transition(this.authority(), unit.unitId, "STOP_PENDING", "rejection while another worker may still run; claims retained"); }
    }
  }
  private async fill(): Promise<void> {
    // Bounded by new immutable sub-intents, not a polling/waiting loop.
    for (;;) {
      const j = this.journal(), run = runtimeRun(j.run); if (j.paused) return; const capacity = this.capacity(j); if (capacity.pending.length >= j.run.settings.maxConcurrent) return;
      const active = this.allActive(j), receipts = this.receipts(j);
      if (active.some(a => !j.run.prepared.planning.units.some(u => u.unitId === a.unit.unitId))) return; // no invented quota inventory for an older unknown runtime
      let readyChanged = false;
      for (const planned of run.prepared.planning.units) {
        const unit = this.unit(run, planned); if (!["PENDING", "BLOCKED", "READY"].includes(unit.state)) continue;
        const ready = evaluateReadiness({ plan: run.prepared.planning.plan, sidecar: run.prepared.planning.sidecar, expectedSidecarFingerprint: run.prepared.planning.binding.sidecarFingerprint, unit, receipts, snapshotFingerprint: run.prepared.snapshot.normalizedFingerprint, knowledgeRevision: run.prepared.snapshot.knowledgeRevision, admissionBudgetContext: run.prepared.admissionSource.context, validContext: true, cancelled: false });
        if (ready.ready && unit.state !== "READY") { this.options.graph.transition(this.authority(), unit.unitId, "READY", "typed prerequisites and current admission context satisfied"); readyChanged = true; }
        else if (!ready.ready && unit.state === "READY") { this.options.graph.transition(this.authority(), unit.unitId, "BLOCKED", "typed readiness or current source proof unavailable"); readyChanged = true; }
      }
      if (readyChanged) continue;
      const readyAtEvent = Object.fromEntries(run.prepared.planning.units.map(u => [u.unitId, j.events.findLast(e => e.unitId === u.unitId && ((e.kind === "unit_state" && graphObject(e.payload).state === "READY") || (e.kind === "unit_added" && graphObject(e.payload).state === "READY")))?.sequence ?? this.options.graph.events.cursor(run.missionId).sequence]));
      let scheduled = false;
      for (const planned of j.run.prepared.planning.units) {
        const unit = this.unit(j.run, planned), lease = this.options.graph.leases.get(j.run.missionId, unit.unitId);
        if (!lease || lease.state !== "active" || !["RESERVED", "RUNNING"].includes(unit.state)) continue;
        this.options.graph.leases.assert(lease, this.authority());
        if (j.refused.some(r => r.unitId === unit.unitId) || j.intents.some(r => r.unitId === unit.unitId && r.familyToken !== lease.token)) {
          this.options.graph.leases.quarantine(this.authority(), lease, "original execution allocation cannot be reauthorized under another generation or after refusal"); continue;
        }
        const done = j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.subIntentId), started = j.intents.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.subIntentId);
        for (const sub of readySubIntents(unit, done, started)) {
          const model = this.snapshot().config.models[sub.role], resources = j.run.prepared.planning.sidecar.resourcesByUnit[unit.unitId]!;
          const requirements = { ...resources, profiles: resources.profiles.filter(p => p === j.run.settings.profiles[sub.role as "A" | "B" | "R"]), models: resources.models.filter(m => m === `${model.providerID}/${model.id}#${model.variant}`) };
          const compatible = selectCompatible([{ unit, readiness: { ready: true, reasons: [] }, requirements }], capacity.workers, capacity.accounts, active.filter(a => a.unit.unitId !== unit.unitId));
          const assignment = compatible.assignments[0]; if (!assignment) continue;
          const worker = j.run.workers.find(w => w.workerId === assignment.workerId)!, proposals = sub.role === "R" ? j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token && unit.subIntents.some(s => s.functionId === sub.functionId && ["A", "B"].includes(s.role) && s.subIntentId === r.subIntentId)).map(r => r.result) : undefined;
          const snapshot = this.snapshot(), inputs = this.options.inputs(graphFreeze(snapshot) as Snapshot, graphFreeze(sub) as WorkUnit["subIntents"][number], proposals ? graphCopy(proposals) : undefined);
          const capturedAuthority = this.authority(), record = makeGraphIntent(j.run, snapshot, unit, sub, lease, inputs, worker, capturedAuthority.lease.token);
          graphCheck(record.version === "l8-graph-intent-v2", "prospective record version");
          const checked = await checkInputs(record.intent.inputs, this.options.inputAccess, { missionId: j.run.missionId, executionId: record.intent.executionId, role: sub.role });
          graphCheck(checked.ok, "effective fixture input access/hash check failed");
          this.options.graph.leases.assert(lease, this.authority());
          const size = Buffer.byteLength(canonical(record.admission), "utf8"), C = run.prepared.planning.sidecar.admissionBudget!.byUnit[unit.unitId]!.admissionCapUtf8Bytes;
          graphCheck(C.known, "unknown admission C must never be selected");
          if (size > C.value!) {
            const sha = fingerprint(record.admission);
            this.append(`l8.graph2.refused:${fingerprint({ unitId: unit.unitId, subIntentId: sub.subIntentId, body: sha })}`, "l8.graph2.admission-refused", { version: "l8-graph-refused-v2", runFingerprint: run.fingerprint, reason: "body-over-C", record, admissionSha256: sha, admissionUtf8Bytes: size, C: C.value }, unit.unitId);
            // Evidence is complete and N is NOT refunded/reassigned. Only v6 may
            // release genuinely quiescent families, never an oversized-result flag.
            try { this.options.graph.retireFamily(this.authority(), lease, unit.state === "RESERVED" ? "CANCELLED" : "FAILED", "complete immutable body exceeds frozen C", "schema"); }
            catch { this.options.graph.leases.quarantine(this.authority(), lease, "oversized body while worker quiescence is not proven"); }
          } else await this.submit(record, lease, j.run);
          scheduled = true; break;
        }
        if (scheduled) break;
      }
      if (scheduled) continue;
      const candidates = { ...j.run.prepared.planning, units: j.run.prepared.planning.units.map(u => this.unit(j.run, u)) };
      const selected = selectReadyUnits(candidates, { readyAtEvent, aging: { eventNumber: this.options.graph.events.cursor(j.run.missionId).sequence, quantum: 100, version: "l8-aging-v1" }, policy: "fifo" },
        { expectedSidecarFingerprint: j.run.prepared.planning.binding.sidecarFingerprint, snapshotFingerprint: j.run.prepared.snapshot.normalizedFingerprint, knowledgeRevision: j.run.prepared.snapshot.knowledgeRevision, admissionBudgetContext: run.prepared.admissionSource.context, validContext: true, cancelled: false, receipts }, capacity.workers, capacity.accounts, active);
      const assignment = selected.assignments[0]; if (!assignment) return;
      const unit = candidates.units.find(u => u.unitId === assignment.unitId)!;
      if (unit.state !== "READY") this.options.graph.transition(this.authority(), unit.unitId, "READY", "frozen-plan typed prerequisites now satisfied");
      this.options.graph.reserve(this.authority(), unit.unitId, j.run.settings.familyTtlEvents, this.options.graph.reservationExpectation(j.run.missionId));
    }
  }
  async step(): Promise<ReturnType<GraphEngine["view"]>> {
    let j = this.journal(); runtimeRun(j.run); graphCheck(j.installed, "anchored projection not installed"); this.authority(); this.checkFamilies(j);
    await this.observe(j); j = this.journal(); this.failQuiescentFamilies(j); await this.finish(this.journal()); await this.fill(); return this.view();
  }
  pause(): void { const j = this.journal(); runtimeRun(j.run); const sequence = this.options.graph.events.cursor(j.run.missionId).sequence + 1; this.append(`l8.graph2.control:${sequence}`, "l8.graph2.control", { version: "l8-graph-control-v2", runFingerprint: j.run.fingerprint, action: "pause" }); }
  resume(): void { const j = this.journal(); runtimeRun(j.run); const sequence = this.options.graph.events.cursor(j.run.missionId).sequence + 1; this.append(`l8.graph2.control:${sequence}`, "l8.graph2.control", { version: "l8-graph-control-v2", runFingerprint: j.run.fingerprint, action: "resume" }); }
  view() {
    return inspectGraphState(this.options.graph, this.snapshot());
  }
}
