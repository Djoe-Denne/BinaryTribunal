import type { AdmissionRetryPolicy, ArtifactFile, Assessment, AssessmentRecord, Bridge, Candidate, CandidateState, ControllerContext, ControllerLease, CycleRecord, FailureTrace, FrozenKnowledge, FunctionIdentity, InputAccess, InputBundle, Intent, KnowledgeArtifactSink, PublicationAdapter, PublicationReceipt, ReconciliationRecord, Role, Snapshot, StoredIntent, StoredResult, ValidatedFactMetadata } from "./domain";
import type { Store } from "./store";
import { posix, win32 } from "node:path";
import { checkInputs } from "./inputs";
import { bridgeFailureCategory, canonical, compareText, failureCause, fingerprint, FIXTURE_RETRY_POLICY, hash, identityKey, validateAssessment, validateCandidate, validateConfig, validateKnowledge, validateResult } from "./validation";
export interface EngineOptions { store: Store; bridge: Bridge; publication: PublicationAdapter; inputAccess: InputAccess; controllerId: string; now?: () => number; leaseMs?: number; knowledgeArtifactSink?: KnowledgeArtifactSink; scheduleLeaseHeartbeat?: (callback: () => void, intervalMs: number) => () => void }
/** A durable scientific state machine, deliberately not a capacity/worker scheduler. */
export class Engine {
  private leases = new Map<string, ControllerLease>();
  private now: () => number;
  private leaseMs: number;
  constructor(public readonly options: EngineOptions) {
    if (!options.controllerId.trim()) throw new Error("explicit controller id required");
    this.now = options.now ?? Date.now; this.leaseMs = options.leaseMs ?? 30_000;
    if (!Number.isSafeInteger(this.leaseMs) || this.leaseMs <= 0) throw new Error("invalid lease duration");
  }
  create(value: unknown): Snapshot {
    const config = validateConfig(value);
    if (!config.fixture && this.options.store.path === ":memory:") throw new Error("real mission requires a persistent OWN database path");
    const s: Snapshot = { schemaVersion: 1, missionId: config.missionId, revision: 0, config, status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [this.newCycle(1, config.knowledge)], intents: [], reconciliations: [], noProgressCycles: 0 };
    this.options.store.create(s); return this.attach(s.missionId);
  }
  attach(missionId: string): Snapshot {
    const s = this.snapshot(missionId); validateConfig(s.config);
    if (!s.config.fixture && this.options.store.path === ":memory:") throw new Error("real mission requires a persistent OWN database path");
    this.leases.set(missionId, this.options.store.acquireLease(missionId, this.options.controllerId, this.now(), this.leaseMs)); return s;
  }
  snapshot(missionId: string): Snapshot { return this.options.store.load(missionId); }
  private begin(missionId: string, expectedRevision?: number): Snapshot {
    const s = this.snapshot(missionId); if (expectedRevision !== undefined && s.revision !== expectedRevision) throw new Error("stale controller revision");
    const lease = this.leases.get(missionId); if (!lease) throw new Error("controller must attach to acquire lease");
    this.leases.set(missionId, this.options.store.renewLease(lease, this.now(), this.leaseMs)); return s;
  }
  private controller(s: Snapshot): ControllerContext {
    const lease = this.leases.get(s.missionId)!; this.options.store.assertLease(lease, this.now());
    if (this.snapshot(s.missionId).revision !== s.revision) throw new Error("stale controller revision");
    return { lease: { ...lease }, revision: s.revision };
  }
  private save(s: Snapshot): Snapshot { return this.options.store.commit(s, s.revision, this.leases.get(s.missionId)!, this.now()); }
  /** Keep the OWN controller fence alive during I/O, never reacquire an expired/lost lease. */
  private async leasedOperation<T>(s: Snapshot, run: (context: ControllerContext) => Promise<T>): Promise<T> {
    const renew = () => {
      this.controller(s);
      this.leases.set(s.missionId, this.options.store.renewLease(this.leases.get(s.missionId)!, this.now(), this.leaseMs));
    };
    renew(); let failed = false, failure: unknown;
    const schedule = this.options.scheduleLeaseHeartbeat ?? ((callback: () => void, intervalMs: number) => {
      const timer = setInterval(callback, intervalMs); timer.unref(); return () => clearInterval(timer);
    });
    const cancel = schedule(() => {
      if (failed) return;
      try { renew(); } catch (error) { failed = true; failure = error; }
    }, Math.max(1, Math.floor(this.leaseMs / 3)));
    try {
      // Await the actual effect even if fenced; do not abandon an in-flight operation
      // and close its store or pretend it was cancelled. Durable intents enable recovery.
      const result = await run(this.controller(s));
      if (failed) throw failure;
      renew(); return result;
    } finally { cancel(); }
  }
  private newCycle(number: number, knowledge: FrozenKnowledge): CycleRecord { return { number, knowledge: structuredClone(knowledge), subset: [], frozen: false, groups: [] }; }
  private cycle(s: Snapshot): CycleRecord { return s.cycles.find(c => c.number === s.cycle)!; }
  private candidate(s: Snapshot, key: string): CandidateState { const c = s.candidates.find(c => identityKey(c.candidate.identity) === key); if (!c) throw new Error(`unknown candidate ${key}`); return c; }
  private latest(c: CandidateState): AssessmentRecord | undefined { return c.assessments.findLast(a => a.accepted && a.manifestFingerprint === c.manifestFingerprint); }
  private mergeCandidates(s: Snapshot, candidates: Candidate[]): void {
    const keys = new Set<string>();
    const validated = candidates.map(raw => validateCandidate(raw, s.config.binary, s.config.fixture));
    for (const candidate of validated) {
      const key = identityKey(candidate.identity);
      if (keys.has(key)) throw new Error("duplicate candidate identity in exploration artifact"); keys.add(key);
    }
    for (const candidate of validated) {
      const key = identityKey(candidate.identity);
      const digest = fingerprint(candidate), old = s.candidates.find(c => identityKey(c.candidate.identity) === key);
      if (!old) s.candidates.push({ candidate, manifestFingerprint: digest, assessments: [], eligibleCycle: s.cycle });
      else if (digest !== old.manifestFingerprint) { old.candidate = candidate; old.manifestFingerprint = digest; old.eligibleCycle = s.cycle; delete old.outcome; delete old.reason; }
    }
    s.candidates.sort((a, b) => compareIdentity(a.candidate.identity, b.candidate.identity));
  }
  private assess(s: Snapshot, raw: Assessment, resultId: string): void {
    const assessment = validateAssessment(raw, s.config.binary, s.config.evaluation.method, s.config.evaluation.version);
    const c = this.candidate(s, identityKey(assessment.identity)); if (c.assessments.some(a => a.resultId === resultId)) return;
    const previous = c.assessments.findLast(a => a.accepted), evidenceFingerprint = fingerprint(assessment.evidence.map(e => ({ source: e.source, sha256: e.sha256 })).sort((a, b) => compareText(canonical(a), canonical(b))));
    const oldEvidence = new Set(previous?.assessment.evidence.map(e => `${e.source}:${e.sha256.toLowerCase()}`) ?? []);
    const additionalEvidence = assessment.evidence.some(e => !oldEvidence.has(`${e.source}:${e.sha256.toLowerCase()}`));
    const accepted = !(previous && assessment.difficulty < previous.assessment.difficulty && !additionalEvidence);
    c.assessments.push({ assessment, resultId, cycle: s.cycle, evidenceFingerprint, manifestFingerprint: c.manifestFingerprint, accepted, rejectionReason: accepted ? undefined : "downward_reevaluation_requires_new_evidence" });
    if (!accepted) { c.outcome = "blocked"; c.reason = "downward_reevaluation_requires_new_evidence"; }
  }
  private relevantKeys(c: CandidateState): Set<string> { return new Set([c.candidate.identity, ...c.candidate.dependencies].map(identityKey)); }
  private relevantFile(knowledge: FrozenKnowledge, file: ArtifactFile, relevant: Set<string>): boolean {
    const fact = knowledge.validatedFacts?.find(f => file.version === `validated-conclusion:v1:${f.resultHash}`);
    return fact ? relevant.has(identityKey(fact.identity)) : !file.identity || relevant.has(identityKey(file.identity));
  }
  private projectKnowledge(knowledge: FrozenKnowledge, c?: CandidateState): FrozenKnowledge {
    if (!c) return structuredClone(knowledge);
    const relevant = this.relevantKeys(c), files = knowledge.files.filter(f => this.relevantFile(knowledge, f, relevant));
    const facts = knowledge.validatedFacts?.filter(f => relevant.has(identityKey(f.identity)));
    const leads = knowledge.scopedLeads?.filter(l => relevant.has(identityKey(l.identity)));
    const commonFingerprint = knowledge.commonFingerprint ?? knowledge.fingerprint;
    return { ...structuredClone(knowledge), commonFingerprint, files: structuredClone(files),
      fingerprint: fingerprint({ common: commonFingerprint, files: files.map(f => ({ path: f.path, sha256: f.sha256 })).sort((a, b) => compareText(a.path, b.path)), leads: knowledge.leadsFingerprint, scopedLeads: leads ?? [] }),
      ...(facts ? { validatedFacts: structuredClone(facts) } : {}), ...(leads ? { scopedLeads: structuredClone(leads) } : {}) };
  }
  private functionFingerprint(s: Snapshot, c: CandidateState, knowledge = this.cycle(s).knowledge, assessment = this.latest(c)): string {
    if (!assessment) throw new Error("scientific fingerprint requires a validated assessment");
    const relevant = this.relevantKeys(c), projected = this.projectKnowledge(knowledge, c);
    const files = [...s.config.commonInputs.filter(f => this.relevantFile(knowledge, f, relevant)), ...projected.files].filter(f => f.kind === "native" || f.kind === "rule" || (f.kind === "knowledge" && f.approvedForBlind === true));
    return fingerprint({ manifest: c.manifestFingerprint, assessment: { method: assessment.assessment.method, version: assessment.assessment.version, difficulty: assessment.assessment.difficulty, evidence: assessment.evidenceFingerprint },
      commonKnowledge: projected.commonFingerprint, files: files.map(f => ({ path: f.path, sha256: f.sha256 })).sort((a, b) => compareText(a.path, b.path)),
      commonLeads: knowledge.leadsFingerprint, scopedLeads: [...(projected.scopedLeads ?? [])].sort((a, b) => compareText(identityKey(a.identity), identityKey(b.identity))) });
  }
  private reconciledUnchanged(s: Snapshot, c: CandidateState, digest: string): boolean {
    const key = identityKey(c.candidate.identity);
    return s.reconciliations.some(r => {
      if (r.outcome !== "retained_uncertain" || !r.result.document.identity || identityKey(r.result.document.identity) !== key) return false;
      const cycle = s.cycles.find(old => old.number === r.result.document.cycle);
      const previous = r.scientificInputFingerprint ?? cycle?.functionFingerprints?.[key];
      if (previous) return previous === digest;
      // Legacy fixture histories can be proven from their durable frozen knowledge and assessment.
      const assessment = c.assessments.findLast(a => a.accepted && a.cycle <= r.result.document.cycle && a.manifestFingerprint === c.manifestFingerprint);
      return !!cycle && !!assessment && this.functionFingerprint(s, c, cycle.knowledge, assessment) === digest;
    });
  }
  private bundle(s: Snapshot, role: Role, identity?: FunctionIdentity, proposals?: StoredResult[]): InputBundle {
    const cycle = this.cycle(s), c = identity ? this.candidate(s, identityKey(identity)) : undefined;
    const blind = role === "A" || role === "B";
    const allowed = (f: ArtifactFile) => !blind || (["native", "rule"].includes(f.kind) || (f.kind === "knowledge" && f.approvedForBlind === true));
    const projected = this.projectKnowledge(cycle.knowledge, c), relevant = c ? this.relevantKeys(c) : undefined;
    const knowledge = { ...projected, files: projected.files.filter(allowed) };
    const files = [...s.config.commonInputs, ...knowledge.files, ...(c?.candidate.inputs ?? [])].filter(f => allowed(f) && (!relevant || this.relevantFile(cycle.knowledge, f, relevant)));
    for (const p of proposals ?? []) files.push({ path: p.path, sha256: p.sha256, version: p.resultId, provenance: `native execution ${p.executionId}, author ${p.authorId}`, kind: "proposal" });
    const deduped = new Map<string, ArtifactFile>();
    for (const f of files) { const old = deduped.get(f.path); if (old && canonical(old) !== canonical(f)) throw new Error(`conflicting exact input manifest: ${f.path}`); deduped.set(f.path, f); }
    const bundle: InputBundle = { schemaVersion: 1, role, cycle: s.cycle, identity, files: [...deduped.values()].sort((a, b) => compareText(a.path, b.path)), accessibleRules: [...s.config.accessibleRules], requiredTools: [...s.config.requiredTools], knowledge };
    if (role === "explore") {
      bundle.candidates = s.candidates.map(c => structuredClone(c.candidate));
      bundle.unresolvedResults = s.reconciliations.flatMap(r => (r.decision === "likely" || r.decision === "unlikely") && r.result.document.identity ? [{ resultId: r.result.resultId, identity: r.result.document.identity, decision: r.decision, cycle: r.result.document.cycle, sha256: r.result.sha256 }] : []);
    }
    if (role === "evaluate") { bundle.candidates = [structuredClone(c!.candidate)]; bundle.evaluation = { method: s.config.evaluation.method, version: s.config.evaluation.version, budget: s.config.budget }; }
    if (proposals) bundle.proposals = proposals.map(p => ({ resultId: p.resultId, sha256: p.sha256, path: p.path, authorId: p.authorId, executionId: p.executionId, sessionId: p.sessionId, content: p.content, document: structuredClone(p.document) }));
    return bundle;
  }
  private plan(s: Snapshot, role: Role, identity?: FunctionIdentity, proposals?: StoredResult[]): void {
    if (this.entries(s, [role]).some(e => canonical(e.intent.identity) === canonical(identity))) return;
    const inputs = this.bundle(s, role, identity, proposals), inputFingerprint = fingerprint(inputs);
    const taskId = `${s.missionId}:c${s.cycle}:${role}:${identity ? fingerprint(identity).slice(0, 20) : "discovery"}`;
    const attemptId = `${taskId}:a1`, executionId = `${attemptId}:${inputFingerprint.slice(0, 24)}`;
    const path = /^[a-z]:[\\/]|^\\\\/i.test(s.config.outputDirectory) ? win32 : posix;
    const previousResultIds = identity && role === "R" ? s.reconciliations.filter(r => r.result.document.identity && identityKey(r.result.document.identity) === identityKey(identity)).map(r => r.result.resultId) : [];
    const intent: Intent = { schemaVersion: 1, binary: s.config.binary, fixture: s.config.fixture, missionId: s.missionId, taskId, attemptId, executionId, idempotencyKey: executionId, cycle: s.cycle, role, identity, fresh: true, requestedModel: s.config.models[role], inputs, inputFingerprint, outputPath: path.join(s.config.outputDirectory, `${fingerprint(executionId)}.json`), previousResultIds };
    s.intents.push({ intent, state: "planned" });
  }
  private entries(s: Snapshot, roles: Role[]): StoredIntent[] { return s.intents.filter(i => i.intent.cycle === s.cycle && roles.includes(i.intent.role)); }
  private block(s: Snapshot, entry: StoredIntent, reason: string): void {
    entry.state = "blocked"; entry.error = reason;
    if (entry.intent.identity) { const c = this.candidate(s, identityKey(entry.intent.identity)); c.outcome = "blocked"; c.reason = reason; }
    else { s.status = "suspended"; s.reason = reason; }
  }
  private retryPolicy(s: Snapshot): AdmissionRetryPolicy {
    if (s.config.retryPolicy) return s.config.retryPolicy;
    if (s.config.fixture) return { ...FIXTURE_RETRY_POLICY }; // Compatibility for pre-policy fixture snapshots only.
    throw new Error("explicit real-mode retryPolicy is required");
  }
  private trace(s: Snapshot, operation: FailureTrace["operation"], cause: unknown, entry?: StoredIntent, attempt?: number): FailureTrace {
    const trace: FailureTrace = { operation, at: this.now(), cause: failureCause(cause), ...(entry ? { executionId: entry.intent.executionId } : {}), ...(attempt === undefined ? {} : { attempt }) };
    (s.failureHistory ??= []).push(trace); if (entry) (entry.failureHistory ??= []).push(structuredClone(trace)); return trace;
  }
  private blockTeam(s: Snapshot, roles: Role[], reason: string, trace?: FailureTrace): void {
    for (const entry of this.entries(s, roles)) if (entry.state === "planned" || entry.state === "submitted") {
      if (trace) (entry.failureHistory ??= []).push(structuredClone(trace)); this.block(s, entry, reason);
    }
    for (const key of this.cycle(s).subset) { const c = this.candidate(s, key); if (c.outcome !== "saved_certain") { c.outcome = "blocked"; c.reason = reason; } }
    s.status = "suspended"; s.reason = reason;
  }
  /** Every entry is already committed before ensureTeam, probes, admission, or inspection. */
  private async pump(s: Snapshot, roles: Role[]): Promise<Snapshot> {
    if (!this.entries(s, roles).some(e => ["planned", "submitted"].includes(e.state))) return s;
    const retry = this.retryPolicy(s);
    const readyAdmissions = this.entries(s, roles).some(e => e.state === "planned" && (e.nextAdmissionAt ?? 0) <= this.now());
    let teamReady = !readyAdmissions;
    if (readyAdmissions && (s.nextTeamAdmissionAt ?? 0) <= this.now()) {
      s.teamAdmissionAttempts = (s.teamAdmissionAttempts ?? 0) + 1; s = this.save(s);
      try { await this.leasedOperation(s, context => this.options.bridge.ensureTeam(structuredClone(s.config), context)); }
      catch (e) {
        this.controller(s); const trace = this.trace(s, "ensureTeam", e, undefined, s.teamAdmissionAttempts), typed = bridgeFailureCategory(e);
        if (typed?.recoverable === false) this.blockTeam(s, roles, `bridge_ensureTeam_nonrecoverable:${typed.category}`, trace);
        else if (s.teamAdmissionAttempts! >= retry.maxAttempts) this.blockTeam(s, roles, "max_team_admission_attempts", trace);
        else { s.nextTeamAdmissionAt = this.now() + retry.retryDelayMs; s.reason = "bridge_ensureTeam_retry_pending"; }
        return this.save(s);
      }
      this.controller(s); s.teamAdmissionAttempts = 0; delete s.nextTeamAdmissionAt;
      if (s.reason === "bridge_ensureTeam_retry_pending") delete s.reason; s = this.save(s); teamReady = true;
    }
    this.controller(s);
    for (const entry of this.entries(s, roles)) {
      if (entry.state === "planned") {
        if (entry.intent.identity && this.candidate(s, identityKey(entry.intent.identity)).outcome === "blocked") { this.block(s, entry, this.candidate(s, identityKey(entry.intent.identity)).reason ?? "function_blocked_before_admission"); s = this.save(s); continue; }
        if (!teamReady || (entry.nextAdmissionAt ?? 0) > this.now()) continue;
        if ((entry.admissionAttempts ?? 0) >= retry.maxAttempts) { this.block(s, entry, "max_admission_attempts"); s = this.save(s); continue; }
        const check = await this.leasedOperation(s, () => checkInputs(entry.intent.inputs, this.options.inputAccess, { missionId: s.missionId, executionId: entry.intent.executionId, role: entry.intent.role })); this.controller(s);
        if (!check.ok) { entry.inputIssues = check.issues; this.block(s, entry, `inputs: ${check.issues.map(i => i.kind).join(",")}`); s = this.save(s); continue; }
        entry.admissionAttempts = (entry.admissionAttempts ?? 0) + 1; s = this.save(s);
        try { await this.leasedOperation(s, context => this.options.bridge.submit(structuredClone(entry.intent), context)); }
        catch (e) {
          this.controller(s); this.trace(s, "submit", e, entry, entry.admissionAttempts); const typed = bridgeFailureCategory(e);
          if (typed?.recoverable === false) this.block(s, entry, `bridge_submit_nonrecoverable:${typed.category}`);
          else if (entry.admissionAttempts! >= retry.maxAttempts) this.block(s, entry, "max_admission_attempts");
          else { entry.error = `submit: ${String(e)}`; entry.nextAdmissionAt = this.now() + retry.retryDelayMs; }
          s = this.save(s); continue;
        }
        this.controller(s); entry.state = "submitted"; delete entry.error; delete entry.nextAdmissionAt; s = this.save(s);
      }
      if (entry.state !== "submitted") continue;
      let inspection;
      try { inspection = await this.leasedOperation(s, () => this.options.bridge.inspect(structuredClone(entry.intent))); }
      catch (e) { this.controller(s); this.trace(s, "inspect", e, entry); entry.error = `inspect: ${String(e)}`; s = this.save(s); continue; }
      this.controller(s);
      if (fingerprint(entry.inspectionHistory?.at(-1)) !== fingerprint(inspection)) {
        (entry.inspectionHistory ??= []).push(structuredClone(inspection)); s = this.save(s);
      }
      if (inspection.executionId !== entry.intent.executionId || (inspection.effectiveModel && canonical(inspection.effectiveModel) !== canonical(entry.intent.requestedModel))) {
        this.block(s, entry, "effective native execution/model mismatch"); s = this.save(s); continue;
      }
      if (inspection.status === "failed") { this.block(s, entry, `native task failed: ${inspection.error ?? "unspecified"}`); s = this.save(s); continue; }
      if (inspection.status !== "completed") continue;
      const finalInputs = await this.leasedOperation(s, () => checkInputs(entry.intent.inputs, this.options.inputAccess, { missionId: s.missionId, executionId: entry.intent.executionId, role: entry.intent.role })); this.controller(s);
      if (!finalInputs.ok) { entry.inputIssues = finalInputs.issues; this.block(s, entry, `inputs changed before completion: ${finalInputs.issues.map(i => i.kind).join(",")}`); s = this.save(s); continue; }
      try {
        const document = validateResult(entry.intent, inspection);
        const result: StoredResult = { resultId: `result:${entry.intent.executionId}`, path: inspection.artifact!.path, sha256: inspection.artifact!.sha256, content: inspection.artifact!.content, authorId: inspection.authorId!, sessionId: inspection.sessionId!, executionId: inspection.executionId, effectiveModel: inspection.effectiveModel!, document };
        if (s.intents.some(i => i.result && i.result.executionId !== result.executionId && i.result.sessionId === result.sessionId)) throw new Error("fresh native session reused across executions");
        if (document.kind === "explore") this.mergeCandidates(s, document.candidates);
        if (document.kind === "evaluate") document.assessments.forEach(a => this.assess(s, a, result.resultId));
        entry.result = result; entry.state = "resolved"; delete entry.error;
      } catch (e) { this.block(s, entry, `invalid artifact: ${String(e)}`); }
      s = this.save(s);
    }
    return s;
  }
  private finished(s: Snapshot, roles: Role[]): boolean { return this.entries(s, roles).every(e => e.state === "resolved" || e.state === "blocked"); }
  private proposals(s: Snapshot, key: string): StoredResult[] {
    return this.entries(s, ["A", "B"]).filter(e => e.intent.identity && identityKey(e.intent.identity) === key && e.state === "resolved").map(e => e.result!);
  }
  private independent(proposals: StoredResult[], reconciliation?: StoredResult): boolean {
    if (proposals.length !== 2) return false;
    const all = reconciliation ? [...proposals, reconciliation] : proposals;
    return ["authorId", "sessionId", "executionId"].every(field => new Set(all.map(r => r[field as keyof StoredResult])).size === all.length);
  }
  private workFingerprint(s: Snapshot, subset: string[]): string {
    return fingerprint(subset.map(key => ({ key, scientificInput: this.functionFingerprint(s, this.candidate(s, key)) })));
  }
  private freeze(s: Snapshot): Snapshot {
    const cycle = this.cycle(s); if (cycle.frozen) { s.stage = "analyse"; return this.save(s); }
    let unchanged = 0;
    const eligible = s.candidates.filter(c => {
      if (c.eligibleCycle > s.cycle || ["saved_certain", "blocked"].includes(c.outcome ?? "") || !this.latest(c) || this.latest(c)!.assessment.difficulty > s.config.evaluation.maxDifficulty) return false;
      if (this.reconciledUnchanged(s, c, this.functionFingerprint(s, c))) { unchanged++; return false; } return true;
    });
    eligible.sort((a, b) => this.latest(a)!.assessment.difficulty - this.latest(b)!.assessment.difficulty || compareIdentity(a.candidate.identity, b.candidate.identity));
    const subset: string[] = []; let cost = 0;
    for (const c of eligible) {
      if (s.config.subsetSize !== undefined) { if (subset.length < s.config.subsetSize) subset.push(identityKey(c.candidate.identity)); }
      else {
        const estimatedCost = this.latest(c)!.assessment.estimatedCost;
        if (estimatedCost === undefined) { c.outcome = "blocked"; c.reason = "budget_requires_explicit_estimated_cost"; continue; }
        if (cost + estimatedCost <= s.config.budget!) { subset.push(identityKey(c.candidate.identity)); cost += estimatedCost; }
      }
    }
    const digest = this.workFingerprint(s, subset);
    if ((!subset.length && unchanged > 0) || (subset.length && s.cycles.some(c => c.number < s.cycle && c.fingerprint === digest))) {
      // Do not freeze a new cycle or repeat identical expensive A/B/R work.
      s.status = "suspended"; s.reason = "unchanged_inputs"; return this.save(s);
    }
    cycle.subset = subset; cycle.fingerprint = digest; cycle.functionFingerprints = Object.fromEntries(subset.map(key => [key, this.functionFingerprint(s, this.candidate(s, key))])); cycle.frozen = true;
    for (const key of subset) (this.candidate(s, key).scientificHistory ??= []).push({ cycle: s.cycle, fingerprint: cycle.functionFingerprints[key], phase: "attempted" });
    s.stage = subset.length ? "analyse" : "consolidate"; return this.save(s);
  }
  private retainReconciliations(s: Snapshot): void {
    for (const entry of this.entries(s, ["R"])) {
      if (entry.state !== "resolved" || !entry.result || s.reconciliations.some(r => r.result.resultId === entry.result!.resultId)) continue;
      const doc = entry.result.document; if (doc.kind !== "reconciliation") continue;
      const key = identityKey(entry.intent.identity!), c = this.candidate(s, key), proposals = this.proposals(s, key);
      const independent = this.independent(proposals, entry.result);
      const scientificInputFingerprint = this.cycle(s).functionFingerprints?.[key] ?? this.functionFingerprint(s, c);
      const record: ReconciliationRecord = { result: entry.result, decision: doc.decision, proposalResultIds: proposals.map(p => p.resultId), previousResultIds: entry.intent.previousResultIds, outcome: "blocked", scientificInputFingerprint };
      if (!independent || doc.decision === "blocked") { c.outcome = "blocked"; c.reason = independent ? "reconciliation_blocked" : "authors_not_independent"; }
      else if (doc.decision === "likely" || doc.decision === "unlikely") { record.outcome = "retained_uncertain"; c.outcome = "retained_uncertain"; c.eligibleCycle = s.cycle + 1; }
      else {
        const gate = doc.publicationGate!;
        record.outcome = "publication_pending";
        record.publication = { state: "pending", attempts: 0, request: { idempotencyKey: `publication:${entry.result.resultId}`, missionId: s.missionId, identity: entry.intent.identity!, reconciliationId: entry.result.resultId, resultHash: fingerprint(doc), document: structuredClone(doc), targetId: gate.targetId, expectedRevision: gate.targetRevision, fixture: s.config.fixture } };
      }
      s.reconciliations.push(record);
      (c.scientificHistory ??= []).push({ cycle: s.cycle, fingerprint: scientificInputFingerprint, phase: "reconciled", resultId: entry.result.resultId, decision: doc.decision });
    }
  }
  private receiptMatches(record: ReconciliationRecord, receipt: PublicationReceipt): boolean {
    const r = record.publication!.request;
    return receipt.idempotencyKey === r.idempotencyKey && receipt.targetId === r.targetId && receipt.resultHash === r.resultHash && receipt.revision === r.expectedRevision + 1;
  }
  private async publish(s: Snapshot): Promise<Snapshot> {
    for (const record of s.reconciliations.filter(r => r.outcome === "publication_pending")) {
      const publication = record.publication!;
      let operation: "publish" | "readback" = publication.state === "pending" ? "publish" : "readback";
      try {
        if (publication.state === "pending") {
          publication.attempts++; s = this.save(s); // Journal publication attempt before the adapter side effect.
          const receipt = await this.leasedOperation(s, context => this.options.publication.publish(structuredClone(publication.request), context)); this.controller(s);
          if (!this.receiptMatches(record, receipt)) throw new Error("publication receipt structural mismatch");
          publication.receipt = structuredClone(receipt); publication.state = "published"; delete publication.lastError; s = this.save(s);
        }
        if (publication.state === "published") {
          operation = "readback";
          const receipt = await this.leasedOperation(s, context => this.options.publication.readback(structuredClone(publication.receipt!), context)); this.controller(s);
          if (canonical(receipt) !== canonical(publication.receipt) || !this.receiptMatches(record, receipt)) throw new Error("publication readback structural mismatch");
          publication.state = "verified"; delete publication.lastError; record.outcome = "saved_certain";
          this.candidate(s, identityKey(publication.request.identity)).outcome = "saved_certain"; s = this.save(s);
        }
      } catch (e) { this.controller(s); const trace = this.trace(s, operation, e); (publication.failureHistory ??= []).push(structuredClone(trace)); publication.lastError = String(e); s = this.save(s); }
    }
    if (!s.reconciliations.some(r => r.outcome === "publication_pending")) { s.stage = "consolidate"; s = this.save(s); }
    return s;
  }
  private async flushControl(s: Snapshot): Promise<Snapshot> {
    if (!s.controlPending) return s;
    try {
      await this.leasedOperation(s, async context => {
        if (s.controlPending === "pause") await this.options.bridge.pauseAdmissions(s.missionId, context);
        if (s.controlPending === "stop") await this.options.bridge.stop(s.missionId, context);
        if (s.controlPending === "resume" && this.options.bridge.resumeAdmissions) await this.options.bridge.resumeAdmissions(s.missionId, context);
      });
      this.controller(s); delete s.controlPending; delete s.controlError;
    } catch (e) { this.controller(s); this.trace(s, s.controlPending === "pause" ? "pauseAdmissions" : s.controlPending === "stop" ? "stop" : "resumeAdmissions", e); s.controlError = String(e); }
    return this.save(s);
  }
  private async publicKnowledge(s: Snapshot): Promise<Snapshot> {
    for (const record of s.reconciliations) {
      const doc = record.result.document, publication = record.publication;
      if (record.outcome !== "saved_certain" || doc.kind !== "reconciliation" || !doc.conclusion || publication?.state !== "verified" || !publication.receipt) continue;
      const receipt = publication.receipt;
      const metadata: ValidatedFactMetadata = { schemaVersion: 1, resultId: record.result.resultId, identity: publication.request.identity,
        inputVersions: doc.inputVersions.map(({ path, version, sha256 }) => ({ path, version, sha256 })), resultHash: publication.request.resultHash,
        publicationReceipt: { idempotencyKey: receipt.idempotencyKey, targetId: receipt.targetId, revision: receipt.revision, resultHash: receipt.resultHash },
        conclusion: { text: doc.conclusion.text, evidence: doc.conclusion.evidence.map(({ id, source, sha256, detail }) => ({ id, source, sha256, detail })) } };
      let fact = s.validatedFacts?.find(f => f.resultId === metadata.resultId);
      if (!fact) {
        const content = canonical({ ...metadata, kind: "validated-conclusion" }); const path = /^[a-z]:[\\/]|^\\\\/i.test(s.config.outputDirectory) ? win32 : posix;
        fact = { ...structuredClone(metadata), file: { path: path.join(s.config.outputDirectory, "knowledge", `${metadata.resultHash}.json`), sha256: hash(content), version: `validated-conclusion:v1:${metadata.resultHash}`, provenance: `verified publication ${receipt.targetId}@${receipt.revision}; reconciliation ${metadata.resultId}`, kind: "knowledge", approvedForBlind: true }, content, materialization: "pending" };
        (s.validatedFacts ??= []).push(fact); s = this.save(s);
      }
      if (fact.materialization !== "verified") {
        if (!this.options.knowledgeArtifactSink) { fact.lastError = "knowledge_artifact_sink_required"; s.reason = "knowledge_artifact_sink_required"; return this.save(s); }
        try {
          const receipt = await this.leasedOperation(s, () => this.options.knowledgeArtifactSink!.writeImmutable({ file: structuredClone(fact.file), content: fact.content })); this.controller(s);
          if (receipt.sha256 !== fact.file.sha256) throw new Error("immutable public knowledge hash mismatch");
          fact.materialization = "verified"; delete fact.lastError; s = this.save(s);
        } catch (e) { this.controller(s); this.trace(s, "materializeKnowledge", e); fact.lastError = String(e); s.reason = "knowledge_materialization_pending"; return this.save(s); }
      }
    }
    const added = (s.validatedFacts ?? []).filter(f => f.materialization === "verified" && !s.config.knowledge.validatedFacts?.some(old => old.resultId === f.resultId));
    if (added.length) {
      const files = new Map(s.config.knowledge.files.map(f => [f.path, f]));
      for (const fact of added) { const old = files.get(fact.file.path); if (old && canonical(old) !== canonical(fact.file)) throw new Error("public knowledge manifest alteration denied"); files.set(fact.file.path, fact.file); }
      const facts = [...(s.config.knowledge.validatedFacts ?? []), ...added.map(({ schemaVersion, resultId, identity, inputVersions, resultHash, publicationReceipt, conclusion }) => ({ schemaVersion, resultId, identity, inputVersions, resultHash, publicationReceipt, conclusion }))].sort((a, b) => compareText(a.resultId, b.resultId));
      const delta = added.map(f => ({ resultId: f.resultId, sha256: f.file.sha256 })).sort((a, b) => compareText(a.resultId, b.resultId));
      const previous = s.config.knowledge;
      s.config.knowledge = { ...previous, commonFingerprint: previous.commonFingerprint ?? previous.fingerprint, version: `${previous.version}+verified:${fingerprint(delta).slice(0, 16)}`, fingerprint: fingerprint({ previous: previous.fingerprint, added: delta }), files: [...files.values()].sort((a, b) => compareText(a.path, b.path)), validatedFacts: facts };
      delete s.reason; s = this.save(s);
    }
    return s;
  }
  private async consolidate(s: Snapshot): Promise<Snapshot> {
    s = await this.publicKnowledge(s); if (s.validatedFacts?.some(f => f.materialization === "pending")) return s;
    const cycle = this.cycle(s), remaining = s.candidates.filter(c => !["saved_certain", "blocked"].includes(c.outcome ?? ""));
    const certain = s.reconciliations.some(r => r.result.document.cycle === s.cycle && r.outcome === "saved_certain");
    s.noProgressCycles = certain ? 0 : s.noProgressCycles + 1;
    if (s.cycle >= s.config.maxCycles) { s.status = "complete"; s.reason = "max_cycles"; }
    else if (!remaining.length) { s.status = "complete"; s.reason = "exhausted_candidates"; }
    else if (!cycle.subset.length) { s.status = "suspended"; s.reason = "no_eligible_subset"; }
    else if (s.noProgressCycles >= s.config.stagnationLimit) { s.status = "suspended"; s.reason = "stagnation_limit"; }
    else { s.cycle++; s.cycles.push(this.newCycle(s.cycle, s.config.knowledge)); s.stage = "explore"; delete s.reason; }
    return this.save(s);
  }
  async tick(missionId: string, expectedRevision?: number): Promise<Snapshot> {
    let s = this.begin(missionId, expectedRevision); s = await this.flushControl(s);
    if (s.status !== "running" || s.controlPending) return s;
    switch (s.stage) {
      case "explore": {
        if (s.config.fixture && s.config.fixtureSeeds?.approved) {
          this.mergeCandidates(s, s.config.fixtureSeeds.candidates);
          for (const a of s.config.fixtureSeeds.assessments) {
            const c = this.candidate(s, identityKey(a.identity));
            if (!c.assessments.length) this.assess(s, a, `approved-fixture:${fingerprint(a)}`);
          }
          s.stage = "group"; return this.save(s);
        }
        this.plan(s, "explore"); s = this.save(s); s = await this.pump(s, ["explore"]);
        if (s.status === "running" && this.finished(s, ["explore"])) { s.stage = "group"; s = this.save(s); } return s;
      }
      case "group": {
        this.cycle(s).groups = deterministicGroups(s.candidates.map(c => c.candidate));
        s.stage = "evaluate"; return this.save(s);
      }
      case "evaluate": {
        for (const c of s.candidates) if (!this.latest(c) && c.outcome !== "blocked" && c.outcome !== "saved_certain") this.plan(s, "evaluate", c.candidate.identity);
        s = this.save(s); s = await this.pump(s, ["evaluate"]);
        if (s.status === "running" && this.finished(s, ["evaluate"])) { s.stage = "freeze"; s = this.save(s); } return s;
      }
      case "freeze": return this.freeze(s);
      case "analyse": {
        for (const key of this.cycle(s).subset) {
          const c = this.candidate(s, key); if (c.outcome === "blocked") continue;
          this.plan(s, "A", c.candidate.identity); this.plan(s, "B", c.candidate.identity);
        }
        s = this.save(s); s = await this.pump(s, ["A", "B"]);
        if (s.status === "running" && this.finished(s, ["A", "B"])) {
          for (const key of this.cycle(s).subset) if (this.candidate(s, key).outcome !== "blocked" && !this.independent(this.proposals(s, key))) { const c = this.candidate(s, key); c.outcome = "blocked"; c.reason = "authors_not_independent"; }
          s.stage = "reconcile"; s = this.save(s);
        } return s;
      }
      case "reconcile": {
        for (const key of this.cycle(s).subset) { const c = this.candidate(s, key); if (c.outcome !== "blocked") this.plan(s, "R", c.candidate.identity, this.proposals(s, key)); }
        s = this.save(s); s = await this.pump(s, ["R"]); this.retainReconciliations(s);
        if (s.status === "running" && this.finished(s, ["R"])) s.stage = "validate"; return this.save(s);
      }
      case "validate": return this.publish(s);
      case "consolidate": return this.consolidate(s);
    }
  }
  async advance(missionId: string, expectedRevision?: number): Promise<Snapshot> { return this.tick(missionId, expectedRevision); }
  async pause(missionId: string, expectedRevision?: number): Promise<Snapshot> {
    let s = this.begin(missionId, expectedRevision); if (s.status === "stopped" || s.status === "complete") return s;
    s.status = "paused"; s.controlPending = "pause"; s = this.save(s); return this.flushControl(s);
  }
  async stop(missionId: string, expectedRevision?: number): Promise<Snapshot> {
    let s = this.begin(missionId, expectedRevision); s.status = "stopped"; s.reason = "operator_stop";
    s.controlPending = "stop"; s = this.save(s); return this.flushControl(s);
  }
  async resume(missionId: string, expectedRevision?: number, knowledge?: FrozenKnowledge): Promise<Snapshot> {
    let s = this.begin(missionId, expectedRevision);
    if (s.status === "stopped") throw new Error("stopped mission cannot resume; create a new explicit mission");
    if (s.status === "complete") throw new Error("completed mission cannot resume");
    if (s.status === "running") throw new Error("already running");
    const changed = knowledge && fingerprint({ ...knowledge, version: "" }) !== fingerprint({ ...s.config.knowledge, version: "" });
    if (s.status === "suspended" && !changed) return s; // No synthetic version bump bypasses stagnation.
    if (knowledge) {
      const previous = s.config.knowledge, supplied = validateKnowledge(knowledge);
      const facts = new Map((previous.validatedFacts ?? []).map(f => [f.resultId, f]));
      for (const fact of supplied.validatedFacts ?? []) { const old = facts.get(fact.resultId); if (old && canonical(old) !== canonical(fact)) throw new Error("validated common fact alteration denied"); facts.set(fact.resultId, fact); }
      const files = new Map(supplied.files.map(f => [f.path, f]));
      for (const fact of s.validatedFacts ?? []) if (fact.materialization === "verified") { const old = files.get(fact.file.path); if (old && canonical(old) !== canonical(fact.file)) throw new Error("validated public file alteration denied"); files.set(fact.file.path, fact.file); }
      const commonFingerprint = supplied.fingerprint !== previous.fingerprint && supplied.commonFingerprint === previous.commonFingerprint ? supplied.fingerprint : supplied.commonFingerprint ?? (supplied.fingerprint === previous.fingerprint ? previous.commonFingerprint ?? previous.fingerprint : supplied.fingerprint);
      s.config.knowledge = { ...supplied, commonFingerprint, files: [...files.values()].sort((a, b) => compareText(a.path, b.path)), ...(facts.size ? { validatedFacts: [...facts.values()].sort((a, b) => compareText(a.resultId, b.resultId)) } : {}) };
    }
    if (changed) s.noProgressCycles = 0;
    if (!this.cycle(s).frozen) { this.cycle(s).knowledge = structuredClone(s.config.knowledge); s.stage = "explore"; }
    else if (s.status === "suspended" && s.stage === "consolidate") {
      if (s.cycle >= s.config.maxCycles) throw new Error("max cycles reached");
      s.cycle++; s.cycles.push(this.newCycle(s.cycle, s.config.knowledge)); s.stage = "explore";
    }
    s.status = "running"; s.controlPending = "resume"; delete s.reason; s = this.save(s); return this.flushControl(s);
  }
}

function compareIdentity(a: FunctionIdentity, b: FunctionIdentity): number {
  const binary = compareText(`${a.sha256}:${a.version}`, `${b.sha256}:${b.version}`); if (binary) return binary;
  return BigInt(a.ea) < BigInt(b.ea) ? -1 : BigInt(a.ea) > BigInt(b.ea) ? 1 : 0;
}
/** Groups are metadata only. Selection NEVER expands to dependency closure. */
export function deterministicGroups(candidates: Candidate[]): Array<{ id: string; members: string[] }> {
  const edges = new Map(candidates.map(c => [identityKey(c.identity), new Set<string>()]));
  for (const c of candidates) for (const dependency of c.dependencies) {
    const a = identityKey(c.identity), b = identityKey(dependency); if (edges.has(b)) { edges.get(a)!.add(b); edges.get(b)!.add(a); }
  }
  const visited = new Set<string>(), groups: Array<{ id: string; members: string[] }> = [];
  for (const start of [...edges.keys()].sort()) {
    if (visited.has(start)) continue; const pending = [start], members: string[] = [];
    while (pending.length) { const key = pending.pop()!; if (visited.has(key)) continue; visited.add(key); members.push(key); pending.push(...[...edges.get(key)!].sort()); }
    members.sort(); groups.push({ id: fingerprint(members), members });
  }
  return groups.sort((a, b) => compareText(a.members[0], b.members[0]));
}
