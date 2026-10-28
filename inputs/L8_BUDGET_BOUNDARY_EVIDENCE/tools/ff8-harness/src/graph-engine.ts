import type { Evidence, GraphRun, InputAccess, InputBundle, Snapshot, StoredResult } from "./domain";
import type { Store } from "./store";
import { GraphStore, validateGraphDocument, type ArtifactReceipt, type KnowledgeCommit, type ParentScientificCheck, type UnitValidation } from "./graph-store";
import { type ControllerAuthority, type UnitLease } from "./unit-lease";
import { evaluateReadiness, readySubIntents, selectCompatible, selectReadyUnits, type ActiveUnit, type WorkUnit } from "./planner";
import { checkInputs } from "./inputs";
import { BridgeAdmissionError } from "./client";
import { canonical, fingerprint, hash, identityKey } from "./validation";
import { graphArray, graphCheck, graphCopy, graphFreeze, graphInteger, graphKeys, graphObject, graphString } from "./graph-pipeline";
import { graphResult, makeGraphIntent, parseGraphIntent, parseGraphRun, type FixtureExecutionPort, type GraphIntentRecord } from "./graph-adapter";
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
type ResultRecord = { version: "l8-graph-result-v1"; runFingerprint: string; unitId: string; familyToken: number; subIntentId: string; result: StoredResult; inspection: import("./domain").Inspection };
type ReviewRecord = { version: "l8-graph-review-v1"; runFingerprint: string; unitId: string; familyToken: number; resultIds: string[]; review: GraphReview };
interface Journal { events: GraphEvent[]; run: GraphRun; intents: GraphIntentRecord[]; results: ResultRecord[]; reviews: ReviewRecord[]; paused: boolean; installed: boolean }

export function graphAnchor(run: GraphRun): NonNullable<import("./domain").CycleRecord["graph"]> {
  return { version: "l8-frozen-cycle-v1", runFingerprint: run.fingerprint, preparedFingerprint: run.prepared.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint,
    snapshotId: run.prepared.snapshot.snapshotId, partitionId: run.prepared.partition.partitionId, knowledgeRevision: run.prepared.snapshot.knowledgeRevision };
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
  graphKeys(cycle.graph, ["version", "runFingerprint", "preparedFingerprint", "planFingerprint", "snapshotId", "partitionId", "knowledgeRevision"]);
  graphCheck(snapshot.missionId === run.missionId && snapshot.cycle === run.cycle && snapshot.revision === run.missionRevision && fingerprint(snapshot.config) === run.missionConfigFingerprint, "anchored mission/cycle/revision/config mismatch");
  graphCheck(cycle.frozen === true && canonical(cycle.graph) === canonical(graphAnchor(run)) && cycle.fingerprint === run.prepared.fingerprint, "anchor/prepared/plan binding mismatch");
  const projection = graphCycleProjection(run);
  graphCheck(canonical(cycle.groups) === canonical(projection.groups) && canonical(cycle.subset) === canonical(projection.subset), "actual frozen CycleRecord projection changed");
}
export function graphEvents(graph: GraphStore, missionId: string): GraphEvent[] {
  return graph.events.replay<GraphEvent[]>(missionId, [], (events, event) => { events.push(event); return events; });
}
export function preparedGraphRun(graph: GraphStore, missionId: string): GraphRun | undefined {
  const events = graphEvents(graph, missionId), preparations = events.filter(e => e.kind === "l8.graph.preparing");
  graphCheck(preparations.length <= 1, "multiple graph preparation origins");
  const first = preparations[0]; if (!first) { graphCheck(!events.some(e => e.kind.startsWith("l8.")), "orphan own graph namespace"); return; }
  const payload = graphKeys(first.payload, ["version", "run"]); graphCheck(payload.version === "l8-graph-preparing-v1", "preparation journal version");
  const run = parseGraphRun(payload.run); graphCheck(run.missionId === missionId && first.key === `l8.graph.prepare:${run.cycle}` && first.unitId === null, "preparation journal scope"); return run;
}
/** Public journal only. A generic event digest never grants scientific authority. */
export function appendGraphPreparation(graph: GraphStore, authority: ControllerAuthority, run: GraphRun): void {
  run = parseGraphRun(run); graphCheck(authority.lease.missionId === run.missionId, "preparation authority scope");
  const old = preparedGraphRun(graph, run.missionId); if (old) { graphCheck(canonical(old) === canonical(run), "immutable preparation changed"); return; }
  graph.events.append(run.missionId, `l8.graph.prepare:${run.cycle}`, "l8.graph.preparing", authority.now, { version: "l8-graph-preparing-v1", run }, null, graph.events.cursor(run.missionId).sequence);
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
    const graph = this.options.graph, authority = this.authority(), old = graphEvents(graph, this.options.missionId).find(e => e.key === key);
    if (old) { graphCheck(old.kind === kind && old.unitId === unitId && canonical(old.payload) === canonical(payload), "immutable runtime event changed"); return; }
    graph.events.append(this.options.missionId, key, kind, authority.now, graphCopy(payload), unitId, graph.events.cursor(this.options.missionId).sequence);
    this.options.store.assertLease(authority.lease, authority.now);
  }
  /** Called only AFTER the actual Store cycle CAS; may finish an interrupted projection. */
  install(): void {
    const graph = this.options.graph, run = preparedGraphRun(graph, this.options.missionId); graphCheck(run, "missing graph preparation"); assertGraphSnapshot(this.snapshot(), run);
    this.verifyEntry();
    const authority = this.authority(); graph.putSnapshot(authority, graphObject(run.prepared.snapshot)); graph.putPartition(authority, graphObject(run.prepared.partition));
    for (const unit of run.prepared.planning.units) graph.addUnit(authority, unit);
    let revision = 0;
    if (graphEvents(graph, run.missionId).some(e => e.kind === "plan_frozen")) {
      const expected = graph.reservationExpectation(run.missionId);
      graphCheck(expected.planFingerprint === run.prepared.planning.plan.fingerprint && expected.bindingFingerprint === run.prepared.planning.binding.fingerprint, "cannot substitute another active plan during recovery"); revision = expected.activePlanRevision;
    }
    graph.freezePlan(authority, run.prepared.planning.plan, run.prepared.planning.sidecar, run.prepared.planning.binding, revision);
    this.append(`l8.graph.ready:${run.fingerprint}`, "l8.graph.ready", { version: "l8-graph-ready-v1", runFingerprint: run.fingerprint, missionRevision: run.missionRevision, bindingFingerprint: run.prepared.planning.binding.fingerprint });
  }
  /** Strict, read-only preflight, usable before an explicit graph lease attach. */
  verifyEntry(): void { this.journal(); }
  private journal(): Journal {
    const graph = this.options.graph, run = preparedGraphRun(graph, this.options.missionId); graphCheck(run, "graph preparation unavailable");
    const snapshot = this.snapshot(); assertGraphSnapshot(snapshot, run);
    const events = graphEvents(graph, run.missionId), intents: GraphIntentRecord[] = [], results: ResultRecord[] = [], reviews: ReviewRecord[] = [];
    let installed = false, paused = false;
    for (const event of events.filter(e => e.kind.startsWith("l8."))) {
      if (event.kind === "l8.graph.preparing") continue;
      if (event.kind === "l8.graph.ready") {
        const p = graphKeys(event.payload, ["version", "runFingerprint", "missionRevision", "bindingFingerprint"]);
        graphCheck(p.version === "l8-graph-ready-v1" && p.runFingerprint === run.fingerprint && p.missionRevision === run.missionRevision && p.bindingFingerprint === run.prepared.planning.binding.fingerprint && event.key === `l8.graph.ready:${run.fingerprint}` && event.unitId === null, "runtime initialization binding"); installed = true;
      } else if (event.kind === "l8.graph.intent") {
        graphCheck(installed, "admission before anchored projection"); const record = parseGraphIntent(event.payload, run, snapshot);
        graphCheck(event.key === `l8.graph.intent:${record.intent.executionId}` && event.unitId === record.unitId && !intents.some(r => r.intent.executionId === record.intent.executionId), "intent journal identity"); intents.push(record);
      } else if (event.kind === "l8.graph.result" || event.kind === "l8.graph.late-result") {
        const p = graphKeys(event.payload, ["version", "runFingerprint", "unitId", "familyToken", "subIntentId", "result", "inspection"]); storedResult(p.result);
        graphCheck(p.version === "l8-graph-result-v1" && p.runFingerprint === run.fingerprint, "result journal version"); graphInteger(p.familyToken, 1);
        const result = p.result as unknown as StoredResult, record = intents.find(r => r.intent.executionId === result.executionId);
        graphCheck(record && p.unitId === record.unitId && p.familyToken === record.familyToken && p.subIntentId === record.subIntentId && event.unitId === record.unitId && event.key === `${event.kind}:${result.resultId}`, "result journal attribution");
        graphKeys(p.inspection, ["status", "executionId", "authorId", "sessionId", "effectiveModel", "fresh", "artifact"], ["parentSessionId"]);
        const actual = graphResult(record, p.inspection as unknown as import("./domain").Inspection, results.map(r => r.result));
        graphCheck(canonical(actual) === canonical(result), "result bytes/session/header changed");
        const retained = events.find(e => e.key === `result:${result.resultId}` && e.kind === "result_retained" && e.unitId === record.unitId), payload = graphObject(retained?.payload);
        graphCheck(payload.executionId === result.executionId && payload.token === record.familyToken && canonical(payload.document) === canonical(result.document), "result lacks exact v6 retention record");
        if (event.kind === "l8.graph.result") { graphCheck(payload.eligible === true && graph.admission(result.executionId)?.state === "TERMINAL", "unproven result cannot unblock"); results.push(p as unknown as ResultRecord); }
        else graphCheck(payload.eligible === false, "late result incorrectly eligible");
      } else if (event.kind === "l8.graph.review") {
        const p = graphKeys(event.payload, ["version", "runFingerprint", "unitId", "familyToken", "resultIds", "review"]), unit = run.prepared.planning.units.find(u => u.unitId === p.unitId);
        graphCheck(p.version === "l8-graph-review-v1" && p.runFingerprint === run.fingerprint && unit && event.unitId === unit.unitId && event.key === `l8.graph.review:${unit.unitId}:${p.familyToken}`, "review journal binding"); graphInteger(p.familyToken, 1); graphArray(p.resultIds); p.resultIds.forEach(graphString);
        const family = results.filter(r => r.unitId === unit.unitId && r.familyToken === p.familyToken);
        graphCheck(family.length === unit.subIntents.length && canonical(p.resultIds) === canonical(family.map(r => r.result.resultId).sort()), "review lacks complete family"); parseReview(p.review, run, unit); reviews.push(p as unknown as ReviewRecord);
      } else if (event.kind === "l8.graph.control") {
        const p = graphKeys(event.payload, ["version", "runFingerprint", "action"]); graphCheck(p.version === "l8-graph-control-v1" && p.runFingerprint === run.fingerprint && ["pause", "resume"].some(x => x === p.action) && event.key === `l8.graph.control:${event.sequence}` && event.unitId === null, "control journal schema"); paused = p.action === "pause";
      } else throw new Error("graph: unknown own journal namespace/version");
    }
    return { events, run, intents, results, reviews, paused, installed };
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
    // These are only preflight hints. L6 reserve verifies every tuple against
    // actual durable artifact bindings/commits; this journal is not authority.
    return j.events.filter(e => e.kind === "artifact_receipt").map(e => graphCopy(e.payload) as import("./planner").ArtifactReceipt);
  }
  private checkFamilies(j: Journal): void {
    for (const unit of j.run.prepared.planning.units) {
      const lease = this.options.graph.leases.get(j.run.missionId, unit.unitId); if (!lease || lease.state !== "active") continue;
      try { this.options.graph.leases.assert(lease, this.authority()); }
      catch { this.options.graph.leases.quarantine(this.authority(), lease, "controller/family fence expired or changed; authenticated terminal readback required"); }
    }
  }
  private async submit(record: GraphIntentRecord, lease: UnitLease, run: GraphRun): Promise<void> {
    const graph = this.options.graph, admission = graph.admission(record.intent.executionId);
    if (!admission) { graph.freezeAdmissionInputs(this.authority(), lease, record.subIntentId, record.intent.inputs); graph.prepareAdmission(this.authority(), lease, record.admission, run.settings.maxAdmissionAttempts, run.settings.retryDelayMs); }
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
  }
  private async observe(j: Journal): Promise<void> {
    for (const record of j.intents.filter(r => !j.results.some(x => x.result.executionId === r.intent.executionId))) {
      const graph = this.options.graph, lease = graph.leases.get(j.run.missionId, record.unitId); graphCheck(lease && lease.token === record.familyToken, "missing original family fence");
      const state = graph.admission(record.intent.executionId)?.state;
      if (!state || state === "PREPARED") { if (lease.state === "active") await this.submit(record, lease, j.run); continue; }
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
      const result = graphResult(record, observation.inspection, this.journal().results.map(r => r.result));
      const eligible = graph.retainResult(this.authority(), lease, record.intent.executionId, result.resultId, graphObject(result.document));
      const kind = eligible ? "l8.graph.result" : "l8.graph.late-result";
      this.append(`${kind}:${result.resultId}`, kind, { version: "l8-graph-result-v1", runFingerprint: j.run.fingerprint, unitId: record.unitId, familyToken: record.familyToken, subIntentId: record.subIntentId, result, inspection: observation.inspection }, record.unitId);
    }
  }
  private async finish(j: Journal): Promise<void> {
    const graph = this.options.graph;
    for (const planned of j.run.prepared.planning.units) {
      const unit = this.unit(j.run, planned), lease = graph.leases.get(j.run.missionId, unit.unitId);
      if (!lease || lease.state !== "active" || !["RESERVED", "RUNNING", "VALIDATING"].includes(unit.state)) continue;
      graph.leases.assert(lease, this.authority());
      const family = j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.result);
      if (family.length !== unit.subIntents.length) continue;
      graphCheck(family.filter(r => r.document.kind === "reconciliation").every(r => r.document.kind === "reconciliation" && r.document.decision === "certain"), "uncertain reconciliation never commits");
      const resultIds = family.map(r => r.resultId).sort(); let review = j.reviews.find(r => r.unitId === unit.unitId && r.familyToken === lease.token)?.review;
      if (!review) {
        review = parseReview(await this.options.review.review(graphFreeze({ run: j.run, unit, results: family })), j.run, unit);
        this.append(`l8.graph.review:${unit.unitId}:${lease.token}`, "l8.graph.review", { version: "l8-graph-review-v1", runFingerprint: j.run.fingerprint, unitId: unit.unitId, familyToken: lease.token, resultIds, review }, unit.unitId);
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
      const targetId = `fixture:graph:${hash(j.run.missionId)}:${hash(unit.unitId)}`;
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
      for (const functionId of unit.ownedFunctionIds) {
        const artifact = j.run.publicationsByFunction[functionId]!, source = family.find(r => r.document.kind === "reconciliation" && unit.subIntents.some(s => s.functionId === functionId && s.role === "R" && j.intents.some(i => i.subIntentId === s.subIntentId && i.intent.executionId === r.executionId)))!;
        const binding = graph.recordArtifactBinding(this.authority(), { commitId: commit.commitId, artifactId: artifact.artifactId, functionId, artifactKind: artifact.artifactKind, sourceResultIds: [source.resultId], content: artifact.content });
        const receipt: ArtifactReceipt = { artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, functionId: binding.functionId, moduleSha256: binding.moduleSha256, artifactKind: binding.artifactKind,
          knowledgeRevision: binding.knowledgeRevision, publicationLevel: binding.publicationLevel, validation: binding.validation, producerUnitId: binding.producerUnitId, commitId: binding.commitId, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
        graph.recordKnowledgeReceipt(this.authority(), receipt);
      }
    }
  }
  private async fill(): Promise<void> {
    // Bounded by new immutable sub-intents, not a polling/waiting loop.
    for (;;) {
      const j = this.journal(); if (j.paused) return; const capacity = this.capacity(j); if (capacity.pending.length >= j.run.settings.maxConcurrent) return;
      const active = this.allActive(j), receipts = this.receipts(j), readyAtEvent = Object.fromEntries(j.run.prepared.planning.units.map(u => [u.unitId, j.events.find(e => e.kind === "unit_added" && e.unitId === u.unitId)?.sequence ?? 0]));
      let scheduled = false;
      for (const planned of j.run.prepared.planning.units) {
        const unit = this.unit(j.run, planned), lease = this.options.graph.leases.get(j.run.missionId, unit.unitId);
        if (!lease || lease.state !== "active" || !["RESERVED", "RUNNING"].includes(unit.state)) continue;
        this.options.graph.leases.assert(lease, this.authority());
        const done = j.results.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.subIntentId), started = j.intents.filter(r => r.unitId === unit.unitId && r.familyToken === lease.token).map(r => r.subIntentId);
        for (const sub of readySubIntents(unit, done, started)) {
          const model = this.snapshot().config.models[sub.role], resources = j.run.prepared.planning.sidecar.resourcesByUnit[unit.unitId]!;
          const requirements = { ...resources, profiles: resources.profiles.filter(p => p === j.run.settings.profiles[sub.role as "A" | "B" | "R"]), models: resources.models.filter(m => m === `${model.providerID}/${model.id}#${model.variant}`) };
          const compatible = selectCompatible([{ unit, readiness: { ready: true, reasons: [] }, requirements }], capacity.workers, capacity.accounts, active.filter(a => a.unit.unitId !== unit.unitId));
          const assignment = compatible.assignments[0]; if (!assignment) continue;
          const worker = j.run.workers.find(w => w.workerId === assignment.workerId)!, proposals = sub.role === "R" ? j.results.filter(r => unit.subIntents.some(s => s.functionId === sub.functionId && ["A", "B"].includes(s.role) && s.subIntentId === r.subIntentId)).map(r => r.result) : undefined;
          const snapshot = this.snapshot(), inputs = this.options.inputs(graphFreeze(snapshot) as Snapshot, graphFreeze(sub) as WorkUnit["subIntents"][number], proposals ? graphCopy(proposals) : undefined);
          const record = makeGraphIntent(j.run, snapshot, unit, sub, lease, inputs, worker);
          const checked = await checkInputs(record.intent.inputs, this.options.inputAccess, { missionId: j.run.missionId, executionId: record.intent.executionId, role: sub.role });
          graphCheck(checked.ok, "effective fixture input access/hash check failed");
          this.options.graph.leases.assert(lease, this.authority());
          this.append(`l8.graph.intent:${record.intent.executionId}`, "l8.graph.intent", record, unit.unitId); await this.submit(record, lease, j.run); scheduled = true; break;
        }
        if (scheduled) break;
      }
      if (scheduled) continue;
      const candidates = { ...j.run.prepared.planning, units: j.run.prepared.planning.units.map(u => this.unit(j.run, u)) };
      const selected = selectReadyUnits(candidates, { readyAtEvent, aging: { eventNumber: this.options.graph.events.cursor(j.run.missionId).sequence, quantum: 100, version: "l8-aging-v1" }, policy: "fifo" },
        { expectedSidecarFingerprint: j.run.prepared.planning.binding.sidecarFingerprint, snapshotFingerprint: j.run.prepared.snapshot.normalizedFingerprint, knowledgeRevision: j.run.prepared.snapshot.knowledgeRevision, validContext: true, cancelled: false, receipts }, capacity.workers, capacity.accounts, active);
      const assignment = selected.assignments[0]; if (!assignment) return;
      const unit = candidates.units.find(u => u.unitId === assignment.unitId)!;
      if (unit.state !== "READY") this.options.graph.transition(this.authority(), unit.unitId, "READY", "frozen-plan typed prerequisites now satisfied");
      this.options.graph.reserve(this.authority(), unit.unitId, j.run.settings.familyTtlEvents, this.options.graph.reservationExpectation(j.run.missionId));
    }
  }
  async step(): Promise<ReturnType<GraphEngine["view"]>> {
    let j = this.journal(); graphCheck(j.installed, "anchored projection not installed"); this.authority(); this.checkFamilies(j);
    await this.observe(j); j = this.journal(); await this.finish(j); await this.fill(); return this.view();
  }
  pause(): void { const j = this.journal(), sequence = this.options.graph.events.cursor(j.run.missionId).sequence + 1; this.append(`l8.graph.control:${sequence}`, "l8.graph.control", { version: "l8-graph-control-v1", runFingerprint: j.run.fingerprint, action: "pause" }); }
  resume(): void { const j = this.journal(), sequence = this.options.graph.events.cursor(j.run.missionId).sequence + 1; this.append(`l8.graph.control:${sequence}`, "l8.graph.control", { version: "l8-graph-control-v1", runFingerprint: j.run.fingerprint, action: "resume" }); }
  view() {
    const j = this.journal(), units = j.run.prepared.planning.units.filter(u => j.run.prepared.planning.plan.selectedUnitIds.includes(u.unitId)).map(u => this.unit(j.run, u));
    return { version: "l8-graph-view-v1" as const, fixture: true as const, nativeVerified: false as const, runFingerprint: j.run.fingerprint, preparedFingerprint: j.run.prepared.fingerprint,
      status: units.length > 0 && units.every(u => u.state === "COMMITTED" && this.options.graph.satisfies(j.run.missionId, u.unitId, u.requiredPublicationLevel)) ? "complete" : j.paused ? "paused" : "waiting",
      units: units.map(u => ({ unitId: u.unitId, state: u.state })), intents: j.intents, resultIds: j.results.map(r => r.result.resultId), sequence: this.options.graph.events.cursor(j.run.missionId).sequence };
  }
}
