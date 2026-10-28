import { describe, expect, test } from "bun:test";
import { Engine, type EngineOptions } from "../src/engine";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";
import { FileKnowledgeArtifactSink } from "../src/inputs";
import { canonical, hash, identityKey, validateConfig, validateResult } from "../src/validation";
import type { Assessment, Bridge, Candidate, ControllerContext, Decision, FunctionIdentity, Inspection, Intent, MissionConfig, PublicationAdapter, Snapshot, WorkerResult } from "../src/domain";
const binary = { sha256: "a".repeat(64), version: "FF8-fixture-v1" };
const model = { providerID: "fixture", id: "model", variant: "high" };
const evidence = [{ id: "native-1", source: "fixture.asm", sha256: hash("asm"), detail: "explicit fixture evidence, not real RE" }];
const identity = (ea: string): FunctionIdentity => ({ ...binary, ea });
const candidate = (ea: string, dependencies: FunctionIdentity[] = []): Candidate => ({ identity: identity(ea), manifestVersion: "1", evidence, inputs: [], dependencies });
const assessment = (ea: string, difficulty: number): Assessment => ({ identity: identity(ea), method: "fixture-ordinal", version: "1", difficulty, reasons: ["fixture reason"], evidence });
function config(candidates = [candidate("0x10")], assessments = [assessment("0x10", 2)]): MissionConfig {
  return { schemaVersion: 1, missionId: "fixture-m", binary, fixture: true, evaluation: { method: "fixture-ordinal", version: "1", maxDifficulty: 10 }, subsetSize: 2, maxCycles: 3, stagnationLimit: 2, models: { explore: model, evaluate: model, A: model, B: model, R: model }, knowledge: { version: "k1", fingerprint: "native-k", leadsFingerprint: "lead-1", files: [] }, commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: "C:/fixture/outputs", fixtureSeeds: { approved: true, candidates, assessments } };
}
class FixtureBridge implements Bridge {
  submissions: Intent[] = []; executions = new Set<string>(); decisions: Decision[] = ["certain"];
  loseReply = false; invalid = false; missing = false; wrongModel = false; sameAuthor = false;
  transform?: (document: WorkerResult, intent: Intent) => WorkerResult;
  observeSubmit?: (intent: Intent) => void;
  async ensureTeam() {}
  async submit(intent: Intent, _controller: ControllerContext) {
    this.observeSubmit?.(intent);
    if (!this.executions.has(intent.executionId)) { this.executions.add(intent.executionId); this.submissions.push(structuredClone(intent)); }
    if (this.loseReply) { this.loseReply = false; throw new Error("lost reply after native admission"); }
  }
  async inspect(intent: Intent): Promise<Inspection> {
    if (!this.executions.has(intent.executionId)) return { status: "pending", executionId: intent.executionId };
    const authorId = this.sameAuthor ? "same" : `author-${intent.executionId}`;
    const base = { schemaVersion: 1 as const, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId, identity: intent.identity, inputFingerprint: intent.inputFingerprint, inputVersions: intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: intent.previousResultIds };
    const propositions = [{ id: "p", text: "fixture proposition", evidence, contradictions: [], questions: [] }];
    let document: WorkerResult;
    if (intent.role === "explore") document = { ...base, kind: "explore", candidates: [candidate("0x10")] };
    else if (intent.role === "evaluate") document = { ...base, kind: "evaluate", assessments: [assessment(intent.identity!.ea, 2)] };
    else if (intent.role === "R") {
      const decision = this.decisions[Math.min(intent.cycle - 1, this.decisions.length - 1)];
      document = { ...base, kind: "reconciliation", decision, propositions, contradictions: decision === "certain" ? [] : ["fixture contradiction retained"], questions: decision === "certain" ? [] : ["fixture unresolved question"], publicationGate: decision === "certain" ? { nativeAsmChecked: true, independentAuthors: true, inputHashesVerified: true, opcodeCoverageComplete: true, abiChecked: true, contradictionsResolved: true, readbackPlan: true, targetId: `fixture:${identityKey(intent.identity!)}`, targetRevision: 0, evidence } : undefined };
    } else document = { ...base, kind: "proposal", role: intent.role, propositions };
    if (this.invalid) (document as any).executionId = "wrong";
    if (this.transform) document = this.transform(document, intent);
    const content = JSON.stringify(document);
    return { status: "completed", executionId: intent.executionId, authorId, sessionId: `session-${intent.executionId}`, effectiveModel: this.wrongModel ? { ...model, variant: "default" } : model, fresh: true, artifact: this.missing ? undefined : { path: intent.outputPath, sha256: hash(content), content } };
  }
  async pauseAdmissions() {}
  async stop() {}
}
function setup(cfg = config()) {
  const store = new Store(); const bridge = new FixtureBridge(); const publication = new FixturePublicationAdapter();
  for (const c of cfg.fixtureSeeds?.candidates || []) publication.seedTarget(`fixture:${identityKey(c.identity)}`);
  const options: EngineOptions = { store, bridge, publication, inputAccess: { read: async (path: string) => {
    const intent = bridge.submissions.find(i => i.outputPath === path); if (!intent) return { status: "missing" as const };
    const result = await bridge.inspect(intent); return result.artifact ? { status: "ok" as const, content: result.artifact.content } : { status: "missing" as const };
  }, list: async () => ({ status: "ok" as const, entries: [] }), tool: async () => true }, controllerId: "controller", now: () => 100, leaseMs: 10000 };
  const engine = new Engine(options); engine.create(cfg); return { store, bridge, publication, engine, options };
}
async function until(engine: Engine, predicate: (s: Snapshot) => boolean, limit = 40) {
  let s = engine.snapshot("fixture-m"); for (let n = 0; n < limit && !predicate(s); n++) s = await engine.tick("fixture-m");
  expect(predicate(s)).toBe(true); return s;
}
describe("explicit scientific configuration", () => {
  test("no defaults for threshold, method, version, cycles, stagnation or subset", () => {
    for (const key of ["maxCycles", "stagnationLimit", "subsetSize"]) { const c = config() as any; delete c[key]; expect(() => validateConfig(c)).toThrow(); }
    for (const key of ["method", "version", "maxDifficulty"]) { const c = config() as any; delete c.evaluation[key]; expect(() => validateConfig(c)).toThrow(); }
    expect(validateConfig(config()).evaluation.maxDifficulty).toBe(10);
  });
  test("real mode cannot consume fixture scores or EA-only identities", () => {
    expect(() => validateConfig({ ...config(), fixture: false })).toThrow();
    const c = config(); (c.fixtureSeeds!.candidates[0].identity as any).sha256 = undefined; expect(() => validateConfig(c)).toThrow();
  });
});
test("easy-first deterministic threshold with NO dependency closure, frozen subset", async () => {
  const cfg = config([candidate("0x30", [identity("0x20")]), candidate("0x20"), candidate("0x10")], [assessment("0x30", 3), assessment("0x20", 80), assessment("0x10", 1)]);
  const { engine, bridge } = setup(cfg); const s = await until(engine, s => s.cycles[0].frozen);
  expect(s.cycles[0].subset).toEqual([identityKey(identity("0x10")), identityKey(identity("0x30"))]);
  const frozen = canonical(s.cycles[0].subset); await until(engine, s => s.status === "complete" || s.status === "suspended");
  expect(canonical(engine.snapshot("fixture-m").cycles[0].subset)).toBe(frozen);
  expect(engine.snapshot("fixture-m").candidates.find(c => c.candidate.identity.ea === "0x20")!.assessments[0].assessment.difficulty).toBe(80);
  expect(bridge.submissions.some(i => i.identity?.ea === "0x20")).toBe(false);
});
test("certain saves once, reads back once, and A+B are fresh blind distinct executions", async () => {
  const { engine, bridge, publication } = setup(); const s = await until(engine, s => s.status === "complete");
  expect(s.candidates[0].outcome).toBe("saved_certain"); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
  await engine.tick("fixture-m"); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
  const authors = bridge.submissions.filter(i => i.role === "A" || i.role === "B"); expect(authors.length).toBe(2);
  expect(authors[0].executionId).not.toBe(authors[1].executionId);
  for (const i of authors) { expect(i.fresh).toBe(true); expect(i.inputs.proposals).toBeUndefined(); expect(i.inputs.files.some(f => ["proposal", "score"].includes(f.kind))).toBe(false); }
  expect(bridge.submissions.find(i => i.role === "R")!.inputs.proposals!.length).toBe(2);
});
test("likely AND unlikely history retained, later cycle requires changed leads and links prior result", async () => {
  const { engine, bridge } = setup(); bridge.decisions = ["likely", "unlikely"];
  let s = await until(engine, s => s.status === "suspended");
  expect(s.reconciliations[0].decision).toBe("likely"); expect(s.candidates[0].eligibleCycle).toBe(2);
  const expensive = bridge.submissions.length; await engine.tick("fixture-m"); expect(bridge.submissions.length).toBe(expensive);
  s = await engine.resume("fixture-m", s.revision, { ...s.config.knowledge, version: "k2", leadsFingerprint: "new-lead" });
  s = await until(engine, s => s.reconciliations.length === 2 && s.status === "suspended");
  expect(s.reconciliations.map(r => r.decision)).toEqual(["likely", "unlikely"]);
  expect(s.reconciliations[1].previousResultIds).toEqual([s.reconciliations[0].result.resultId]);
  expect((s.reconciliations[1].result.document as any).contradictions).toEqual(["fixture contradiction retained"]);
  expect((s.reconciliations[1].result.document as any).questions).toEqual(["fixture unresolved question"]);
});
test("publication retry NEVER restarts analysis", async () => {
  const { engine, bridge, publication, options } = setup(); let fail = true;
  const adapter: PublicationAdapter = { publish: async (r, c) => { if (fail) { fail = false; throw new Error("target temporarily offline"); } return publication.publish(r, c); }, readback: (r, c) => publication.readback(r, c) };
  options.publication = adapter;
  const pending = await until(engine, s => s.reconciliations.some(r => r.publication?.lastError));
  expect(pending.reconciliations[0].outcome).toBe("publication_pending"); const submissions = bridge.submissions.length;
  await until(engine, s => s.status === "complete"); expect(bridge.submissions.length).toBe(submissions); expect(publication.counts().writes).toBe(1);
});
test("lost admission reply retries persisted identical intent after controller restart", async () => {
  const { engine, bridge, store, options } = setup(); bridge.loseReply = true;
  await until(engine, s => s.intents.some(i => i.error?.includes("lost reply")));
  const persisted = engine.snapshot("fixture-m").intents[0].intent;
  const restarted = new Engine(options); restarted.attach("fixture-m"); await until(restarted, s => s.status === "complete");
  expect(bridge.submissions.filter(i => i.executionId === persisted.executionId).length).toBe(1);
  expect(store.load("fixture-m").intents[0].intent.idempotencyKey).toBe(persisted.idempotencyKey);
});
for (const defect of ["missing", "invalid", "wrongModel", "sameAuthor"] as const) test(`completed task ${defect} is blocked, not resolved/publication`, async () => {
  const { engine, bridge, publication } = setup(); bridge[defect] = true;
  const s = await until(engine, s => ["complete", "suspended"].includes(s.status)); expect(s.candidates[0].outcome).toBe("blocked"); expect(publication.counts().writes).toBe(0);
});
test("explicit maximum cycles terminates unresolved work", async () => {
  const c = config(); c.maxCycles = 1; const { engine, bridge } = setup(c); bridge.decisions = ["unlikely"];
  const s = await until(engine, s => s.status === "complete"); expect(s.reason).toBe("max_cycles"); expect(s.reconciliations[0].outcome).toBe("retained_uncertain");
});
test("pause/stop are durable admission controls; stale revisions rejected", async () => {
  const { engine, bridge } = setup(); const s = engine.snapshot("fixture-m");
  const paused = await engine.pause("fixture-m", s.revision); expect(paused.status).toBe("paused");
  await engine.tick("fixture-m"); expect(bridge.submissions.length).toBe(0);
  await expect(engine.resume("fixture-m", s.revision)).rejects.toThrow(/revision/i);
  await engine.resume("fixture-m", paused.revision); const stopped = await engine.stop("fixture-m"); expect(stopped.status).toBe("stopped");
  await expect(engine.resume("fixture-m")).rejects.toThrow(/stopped/i);
});
test("every native admission observes its complete already-persisted intent", async () => {
  const { engine, bridge, store } = setup();
  bridge.observeSubmit = i => { const entry = store.load(i.missionId).intents.find(e => e.intent.executionId === i.executionId); expect(entry?.state).toBe("planned"); expect(canonical(entry!.intent)).toBe(canonical(i)); };
  await until(engine, s => s.status === "complete");
});
test("budget subset is deterministic and never fabricates an estimated cost", async () => {
  const a = assessment("0x10", 1), b = assessment("0x20", 2), c = assessment("0x30", 3); a.estimatedCost = 8; b.estimatedCost = 2;
  const cfg = config([candidate("0x30"), candidate("0x20"), candidate("0x10")], [c, b, a]); delete cfg.subsetSize; cfg.budget = 3;
  const { engine } = setup(cfg); const s = await until(engine, s => s.cycles[0].frozen);
  expect(s.cycles[0].subset).toEqual([identityKey(identity("0x20"))]); expect(s.candidates.find(c => c.candidate.identity.ea === "0x30")!.reason).toBe("budget_requires_explicit_estimated_cost");
});
test("equal-score order uses numerical EA and ignores exploration input order", async () => {
  const cfg = config([candidate("0x100"), candidate("0x20"), candidate("0x3")], [assessment("0x100", 1), assessment("0x20", 1), assessment("0x3", 1)]);
  const { engine } = setup(cfg); const s = await until(engine, s => s.cycles[0].frozen);
  expect(s.cycles[0].subset).toEqual([identityKey(identity("0x3")), identityKey(identity("0x20"))]);
});
test("fixture without approved seeds actually explores and evaluates worker artifacts", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const { engine, bridge } = setup(cfg);
  const s = await until(engine, s => s.cycles[0].frozen);
  expect(bridge.submissions.map(i => i.role)).toEqual(["explore", "evaluate"]);
  expect(s.candidates[0].assessments[0].accepted).toBe(true); expect(s.candidates[0].assessments[0].assessment.reasons).toEqual(["fixture reason"]);
});
test("nested WorkerResult header is rejected intact, never flattened or scientifically accepted", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const f = setup(cfg);
  f.bridge.transform = document => {
    if (document.kind !== "explore") return document;
    const { kind, candidates, ...resultHeader } = document;
    return { kind, resultHeader, candidates } as unknown as WorkerResult;
  };
  const s = await until(f.engine, s => s.status === "suspended");
  expect(s.intents[0].error).toContain("unsupported result schema"); expect(s.intents[0].result).toBeUndefined();
  expect(s.candidates).toHaveLength(0); expect(f.publication.counts()).toEqual({ writes: 0, readbacks: 0 });
});

/** Manual clock/heartbeat: no wall-clock sleeps or timing-dependent assertions. */
function heartbeatFixture(customize?: (cfg: MissionConfig) => void) {
  const cfg = config(); delete cfg.fixtureSeeds; customize?.(cfg);
  const fixture = setup(cfg); let now = 100, scheduled = 0, cancelled = 0;
  fixture.publication.seedTarget(`fixture:${identityKey(identity("0x10"))}`);
  const callbacks = new Set<() => void>();
  fixture.options.now = () => now; fixture.options.leaseMs = 90;
  fixture.options.scheduleLeaseHeartbeat = (callback, intervalMs) => {
    expect(intervalMs).toBe(30); scheduled++; callbacks.add(callback);
    return () => { cancelled++; callbacks.delete(callback); };
  };
  const engine = new Engine(fixture.options); engine.attach(cfg.missionId);
  const longOperation = async () => {
    for (let n = 0; n < 12; n++) {
      now += 30; for (const callback of [...callbacks]) callback();
      expect(() => fixture.store.acquireLease(cfg.missionId, "other-controller", now, 90)).toThrow("already held");
      await Promise.resolve();
    }
  };
  return { ...fixture, engine, longOperation, callbacks, advance: (ms: number) => { now += ms; }, counts: () => ({ scheduled, cancelled }) };
}
for (const operation of ["ensureTeam", "submit", "inspect"] as const) test(`heartbeat preserves exclusive local lease during long ${operation}`, async () => {
  const f = heartbeatFixture(), original = f.bridge[operation].bind(f.bridge);
  (f.bridge as any)[operation] = async (...args: unknown[]) => { await f.longOperation(); return (original as any)(...args); };
  const s = await until(f.engine, s => s.status === "complete");
  expect(s.candidates[0].outcome).toBe("saved_certain"); expect(f.bridge.executions.size).toBe(5);
  expect(f.publication.counts()).toEqual({ writes: 1, readbacks: 1 });
  expect(f.counts().scheduled).toBeGreaterThan(0); expect(f.counts().cancelled).toBe(f.counts().scheduled); expect(f.callbacks.size).toBe(0);
});
for (const operation of ["publish", "readback"] as const) test(`heartbeat covers long ${operation} without duplicate publication`, async () => {
  const f = heartbeatFixture(), original = f.publication[operation].bind(f.publication);
  (f.options.publication as any)[operation] = async (...args: unknown[]) => { await f.longOperation(); return (original as any)(...args); };
  await until(f.engine, s => s.status === "complete");
  expect(f.publication.counts()).toEqual({ writes: 1, readbacks: 1 }); expect(f.callbacks.size).toBe(0);
});
test("heartbeat covers durable pause/stop and stops after a bridge error", async () => {
  const f = heartbeatFixture(); f.bridge.pauseAdmissions = f.longOperation; f.bridge.stop = f.longOperation;
  expect((await f.engine.pause("fixture-m")).status).toBe("paused");
  expect((await f.engine.stop("fixture-m")).status).toBe("stopped"); expect(f.callbacks.size).toBe(0);
  const g = heartbeatFixture(); g.bridge.ensureTeam = async () => { await g.longOperation(); throw new Error("long transport failure"); };
  const s = await g.engine.tick("fixture-m");
  expect(s.failureHistory?.at(-1)?.operation).toBe("ensureTeam"); expect(s.reason).toBe("bridge_ensureTeam_retry_pending");
  expect(g.counts().cancelled).toBe(g.counts().scheduled); expect(g.callbacks.size).toBe(0);
});
test("heartbeat covers slow input checks and immutable knowledge materialization", async () => {
  const f = heartbeatFixture(cfg => { cfg.requiredTools = ["read"]; });
  f.options.inputAccess.tool = async () => { await f.longOperation(); return true; };
  f.bridge.transform = document => document.kind === "reconciliation" ? { ...document, conclusion: { text: "validated synthetic return contract", evidence } } : document;
  f.options.knowledgeArtifactSink = { writeImmutable: async request => {
    await f.longOperation(); return { path: request.file.path, sha256: hash(request.content) };
  } };
  const s = await until(f.engine, s => s.status === "complete");
  expect(s.validatedFacts?.[0].materialization).toBe("verified"); expect(f.callbacks.size).toBe(0);
  expect(f.counts().cancelled).toBe(f.counts().scheduled);
});
test("heartbeat never revives an expired fence or commits after same-owner reattach", async () => {
  for (const lost of ["expired", "fenced"] as const) {
    const f = heartbeatFixture(); let revision = -1;
    f.bridge.ensureTeam = async () => {
      revision = f.engine.snapshot("fixture-m").revision;
      if (lost === "expired") f.advance(1000);
      else new Engine(f.options).attach("fixture-m");
      for (const callback of [...f.callbacks]) callback();
      await Promise.resolve();
    };
    await expect(f.engine.tick("fixture-m")).rejects.toThrow("stale or expired controller lease");
    expect(f.engine.snapshot("fixture-m").revision).toBe(revision); expect(f.bridge.submissions).toHaveLength(0);
    expect(f.counts().cancelled).toBe(f.counts().scheduled); expect(f.callbacks.size).toBe(0);
  }
});
test("evaluation method/version mismatch is blocked without invented replacement scores", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const { engine, bridge } = setup(cfg);
  bridge.transform = doc => { if (doc.kind === "evaluate") doc.assessments[0].method = "unauthorized-method"; return doc; };
  const s = await until(engine, s => s.status === "complete");
  expect(s.candidates[0].outcome).toBe("blocked"); expect(s.candidates[0].assessments).toEqual([]);
});
for (const status of ["missing", "denied-read", "unavailable-tool"] as const) test(`engine blocks effective ${status} input before submission`, async () => {
  const cfg = config(); const file = { path: "C:/fixture/input/native.asm", sha256: hash("asm"), version: "1", provenance: "fixture native", kind: "native" as const }; cfg.commonInputs = [file];
  const { engine, options, bridge } = setup(cfg); options.inputAccess.read = async () => ({ status });
  const s = await until(engine, s => s.status === "complete"); expect(bridge.submissions.length).toBe(0);
  expect(s.intents[0].inputIssues!.some(i => i.kind === status)).toBe(true); expect(s.candidates[0].outcome).toBe("blocked");
});
test("changed native bytes and denied listing are distinct durable input failures", async () => {
  const cfg = config(); cfg.commonInputs = [{ path: "C:/fixture/input/native.asm", sha256: hash("asm"), version: "1", provenance: "fixture native", kind: "native" }];
  const { engine, options } = setup(cfg); options.inputAccess.read = async () => ({ status: "ok", content: "modified" }); options.inputAccess.list = async () => ({ status: "denied-list" });
  const s = await until(engine, s => s.status === "complete"); expect(s.intents[0].inputIssues!.map(i => i.kind)).toEqual(["altered", "denied-list"]);
});
test("a new knowledge version alone cannot restart identical expensive work", async () => {
  const { engine, bridge } = setup(); bridge.decisions = ["unlikely"]; const s = await until(engine, s => s.status === "suspended");
  const n = bridge.submissions.length; const resumed = await engine.resume("fixture-m", s.revision, { ...s.config.knowledge, version: "meaningless-version-bump" });
  expect(resumed.status).toBe("suspended"); await engine.tick("fixture-m"); expect(bridge.submissions.length).toBe(n);
});
test("publication lost reply is idempotent even after target write, no analysis repeats", async () => {
  const { engine, bridge, publication, options } = setup(); let lose = true;
  options.publication = { publish: async (r, c) => { const receipt = await publication.publish(r, c); if (lose) { lose = false; throw new Error("lost publication reply"); } return receipt; }, readback: (r, c) => publication.readback(r, c) };
  await until(engine, s => s.reconciliations.some(r => r.publication?.lastError)); const n = bridge.submissions.length;
  const s = await until(engine, s => s.status === "complete"); expect(s.reconciliations[0].publication!.attempts).toBe(2); expect(bridge.submissions.length).toBe(n); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
});
test("readback failure retries readback only; saved_certain waits for verification", async () => {
  const { engine, bridge, publication, options } = setup(); let fail = true, publishCalls = 0;
  options.publication = { publish: (r, c) => { publishCalls++; return publication.publish(r, c); }, readback: async (r, c) => { if (fail) { fail = false; throw new Error("readback unavailable"); } return publication.readback(r, c); } };
  const pending = await until(engine, s => s.reconciliations.some(r => r.publication?.lastError)); expect(pending.reconciliations[0].publication!.state).toBe("published"); expect(pending.candidates[0].outcome).not.toBe("saved_certain");
  const n = bridge.submissions.length; await until(engine, s => s.status === "complete"); expect(publishCalls).toBe(1); expect(bridge.submissions.length).toBe(n); expect(publication.counts().readbacks).toBe(1);
});
test("certain without explicit R publication gate facts cannot publish", async () => {
  const { engine, bridge, publication } = setup(); bridge.transform = doc => { if (doc.kind === "reconciliation") delete doc.publicationGate; return doc; };
  const s = await until(engine, s => s.status === "complete"); expect(s.candidates[0].outcome).toBe("blocked"); expect(publication.counts().writes).toBe(0);
});
test("fixture target CAS conflict stays publication_pending; never reanalyses", async () => {
  const { engine, bridge, publication } = setup(); bridge.transform = doc => { if (doc.kind === "reconciliation") doc.publicationGate!.targetRevision = 9; return doc; };
  const s = await until(engine, s => s.reconciliations.some(r => r.publication?.lastError)); const n = bridge.submissions.length;
  expect(s.reconciliations[0].outcome).toBe("publication_pending"); await engine.tick("fixture-m"); expect(bridge.submissions.length).toBe(n); expect(publication.counts().writes).toBe(0);
});
test("fixture publisher rejects real mode and altered idempotent requests", async () => {
  const { engine, publication } = setup(); const s = await until(engine, s => s.status === "complete"); const request = s.reconciliations[0].publication!.request;
  const context: ControllerContext = { lease: { missionId: s.missionId, owner: "fixture", token: 1, expiresAt: 1000 }, revision: s.revision };
  await expect(publication.publish({ ...request, fixture: false }, context)).rejects.toThrow(/fixture/i);
  await expect(publication.publish({ ...request, expectedRevision: 99 }, context)).rejects.toThrow(/idempotency/i);
  expect(await publication.publish(request, context)).toEqual(s.reconciliations[0].publication!.receipt!);
  expect(await publication.readback(s.reconciliations[0].publication!.receipt!, context)).toEqual(s.reconciliations[0].publication!.receipt!); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
});
test("interrupted controller lease cannot commit/admit after native ensureTeam await", async () => {
  const { engine, bridge, store } = setup(); bridge.ensureTeam = async () => { store.acquireLease("fixture-m", "controller", 100, 10000); };
  await until(engine, s => s.stage === "analyse");
  await expect(engine.tick("fixture-m")).rejects.toThrow(/lease/i); expect(bridge.submissions.length).toBe(0);
});
test("downward reevaluation needs ADDITIONAL evidence, not just removed evidence", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const { engine, bridge } = setup(cfg); bridge.decisions = ["unlikely"];
  const extra = { id: "extra", source: "extra.asm", sha256: hash("extra native"), detail: "additional fixture evidence" };
  bridge.transform = (doc, intent) => {
    if (doc.kind === "explore") { doc.candidates[0].evidence = intent.cycle === 1 ? [...evidence, extra] : evidence; }
    if (doc.kind === "evaluate") { doc.assessments[0].difficulty = intent.cycle === 1 ? 10 : 1; doc.assessments[0].evidence = intent.cycle === 1 ? [...evidence, extra] : evidence; }
    return doc;
  };
  let s = await until(engine, s => s.stage === "consolidate" && s.reconciliations.length === 1);
  s = await engine.pause("fixture-m", s.revision);
  s = await engine.resume("fixture-m", s.revision, { ...s.config.knowledge, leadsFingerprint: "new-cycle-lead" });
  s = await until(engine, s => s.status === "complete" || s.status === "suspended");
  expect(s.candidates[0].assessments.length).toBe(2); expect(s.candidates[0].assessments[1].accepted).toBe(false); expect(s.candidates[0].outcome).toBe("blocked");
});
test("a lost pause reply is replayed while paused, without any native admission", async () => {
  const { engine, bridge } = setup(); let calls = 0;
  bridge.pauseAdmissions = async () => { calls++; if (calls === 1) throw new Error("lost pause reply"); };
  try { await engine.pause("fixture-m"); } catch {}
  expect(engine.snapshot("fixture-m").status).toBe("paused"); await engine.tick("fixture-m");
  expect(calls).toBe(2); expect(bridge.submissions.length).toBe(0);
});
test("lost readback response does not cause a second fixture target read or write", async () => {
  const { engine, publication, options } = setup(); let lose = true;
  options.publication = { publish: (r, c) => publication.publish(r, c), readback: async (r, c) => { const receipt = await publication.readback(r, c); if (lose) { lose = false; throw new Error("lost readback reply"); } return receipt; } };
  await until(engine, s => s.reconciliations.some(r => r.publication?.lastError));
  expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 }); await until(engine, s => s.status === "complete"); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
});
test("input bytes altered AFTER admission prevent resolving that completed task", async () => {
  const cfg = config(); cfg.commonInputs = [{ path: "C:/fixture/input/asm", sha256: hash("asm"), version: "1", provenance: "fixture", kind: "native" }];
  const { engine, bridge, options } = setup(cfg); let altered = false;
  options.inputAccess.read = async path => {
    if (path === cfg.commonInputs[0].path) return { status: "ok", content: altered ? "changed after admission" : "asm" };
    return { status: "missing" };
  };
  bridge.observeSubmit = () => { altered = true; };
  const s = await until(engine, s => s.status === "complete"); expect(s.intents[0].state).toBe("blocked"); expect(s.intents[0].inputIssues![0].kind).toBe("altered");
});
test("new native evidence permits a lower score and preserves both assessments", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const { engine, bridge } = setup(cfg); bridge.decisions = ["unlikely"];
  const extra = { id: "native-new", source: "new.asm", sha256: hash("new proof"), detail: "fixture new proof" };
  bridge.transform = (doc, intent) => {
    if (doc.kind === "explore" && intent.cycle > 1) doc.candidates[0].evidence = [...evidence, extra];
    if (doc.kind === "evaluate") { doc.assessments[0].difficulty = intent.cycle === 1 ? 10 : 1; if (intent.cycle > 1) doc.assessments[0].evidence = [...evidence, extra]; }
    return doc;
  };
  const s = await until(engine, s => s.reconciliations.length === 2 && (s.status === "suspended" || s.status === "complete"));
  expect(s.candidates[0].assessments.map(a => a.assessment.difficulty)).toEqual([10, 1]); expect(s.candidates[0].assessments.every(a => a.accepted)).toBe(true); expect(s.reconciliations.length).toBe(2);
});
test("SQLite reopening during pending readback resumes publication without scientific rework", async () => {
  const root = `${process.env.TEMP || "."}/opencode/ff8-recovery-${crypto.randomUUID()}`;
  const storePath = `${root}-engine.sqlite`, publicationPath = `${root}-target.sqlite`;
  let store = new Store(storePath), publication = new FixturePublicationAdapter(publicationPath); const bridge = new FixtureBridge();
  const cfg = config(); publication.seedTarget(`fixture:${identityKey(identity("0x10"))}`);
  const inputAccess = { read: async (path: string) => { const intent = bridge.submissions.find(i => i.outputPath === path); if (!intent) return { status: "missing" as const }; const result = await bridge.inspect(intent); return { status: "ok" as const, content: result.artifact!.content }; }, list: async () => ({ status: "ok" as const, entries: [] }), tool: async () => true };
  try {
    let engine = new Engine({ store, bridge, publication: { publish: (r, c) => publication.publish(r, c), readback: async () => { throw new Error("interruption before readback"); } }, inputAccess, controllerId: "same-controller", now: () => 100 });
    engine.create(cfg); const pending = await until(engine, s => s.reconciliations.some(r => r.publication?.lastError));
    expect(pending.reconciliations[0].publication!.state).toBe("published"); const count = bridge.submissions.length;
    store.close(); publication.close(); store = new Store(storePath); publication = new FixturePublicationAdapter(publicationPath);
    engine = new Engine({ store, bridge, publication, inputAccess, controllerId: "same-controller", now: () => 100 }); engine.attach(cfg.missionId);
    const s = await until(engine, s => s.status === "complete"); expect(s.candidates[0].outcome).toBe("saved_certain"); expect(bridge.submissions.length).toBe(count); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
  } finally {
    store.close(); publication.close();
    for (const path of [storePath, publicationPath]) for (const suffix of ["", "-wal", "-shm"]) { try { require("node:fs").unlinkSync(path + suffix); } catch {} }
  }
});
test("an invalid exploration manifest cannot partially introduce candidates", async () => {
  const cfg = config(); delete cfg.fixtureSeeds; const { engine, bridge } = setup(cfg);
  bridge.transform = doc => { if (doc.kind === "explore") doc.candidates = [candidate("0x10"), candidate("0x10")]; return doc; };
  const s = await until(engine, s => s.status === "suspended"); expect(s.candidates).toEqual([]); expect(s.intents[0].state).toBe("blocked");
});
test("historical prose model metadata cannot override matching effective native refs", async () => {
  const { engine, bridge, publication } = setup(); bridge.transform = doc => { (doc as any).historicalModel = { providerID: "old", id: "old-model#default", variant: "default" }; return doc; };
  const s = await until(engine, s => s.status === "complete"); expect(s.candidates[0].outcome).toBe("saved_certain"); expect(publication.counts().writes).toBe(1);
});
test("EA alias is normalized, but binary hash AND binary version remain in identity", () => {
  expect(identityKey(identity("0x0a"))).toBe(identityKey(identity("0xA")));
  expect(identityKey(identity("0x10"))).not.toBe(identityKey({ ...identity("0x10"), sha256: "b".repeat(64) }));
  expect(identityKey(identity("0x10"))).not.toBe(identityKey({ ...identity("0x10"), version: "another-binary-version" }));
});
describe("typed bridge admission hardening", () => {
  for (const category of ["permission", "input", "auth"] as const) test(`explicit nonrecoverable ${category} admission is attempted once, blocks the function, and preserves cause`, async () => {
    const { engine, bridge } = setup(); const rejection = { category, recoverable: false, status: 403, details: { deniedPath: "C:/fixture/inputs/native.asm" } }; let calls = 0;
    bridge.submit = async () => { calls++; throw rejection; };
    await until(engine, s => s.status === "complete"); for (let n = 0; n < 4; n++) await engine.tick("fixture-m");
    const s = engine.snapshot("fixture-m"); expect(calls).toBe(1); expect(s.candidates[0].outcome).toBe("blocked"); expect(s.candidates[0].reason).toBe(`bridge_submit_nonrecoverable:${category}`);
    expect(s.intents[0].state).toBe("blocked"); expect(s.intents[0].failureHistory?.[0].cause).toEqual(rejection); expect(s.failureHistory?.[0].cause).toEqual(rejection);
  });
  test("nonrecoverable ensureTeam suspends and blocks every frozen selected function once", async () => {
    const cfg = config([candidate("0x10"), candidate("0x20")], [assessment("0x10", 1), assessment("0x20", 2)]);
    const { engine, bridge } = setup(cfg); const rejection = { category: "auth", recoverable: false, code: "AUTH_DENIED", metadata: { provider: "fixture" } }; let calls = 0;
    bridge.ensureTeam = async () => { calls++; throw rejection; };
    const frozen = await until(engine, s => s.cycles[0].frozen); const subset = canonical(frozen.cycles[0].subset);
    const s = await until(engine, s => s.status === "suspended"); expect(calls).toBe(1); expect(s.reason).toBe("bridge_ensureTeam_nonrecoverable:auth");
    expect(s.candidates.every(c => c.outcome === "blocked")).toBe(true); expect(s.intents.every(i => i.state === "blocked")).toBe(true);
    expect(s.intents.every(i => canonical(i.failureHistory?.[0].cause) === canonical(rejection))).toBe(true); expect(canonical(s.cycles[0].subset)).toBe(subset);
    for (let n = 0; n < 4; n++) await engine.tick("fixture-m"); expect(calls).toBe(1); expect(bridge.submissions).toEqual([]);
  });
  test("recoverable client/lost reply retries the exact execution only after durable delay", async () => {
    const cfg = config(); cfg.retryPolicy = { maxAttempts: 3, retryDelayMs: 500 }; const { engine, bridge, options } = setup(cfg);
    let now = 100; options.now = () => now; // Engine captures the function; use a second controller with the advancing clock.
    const controlled = new Engine(options); controlled.attach("fixture-m"); const original = bridge.submit.bind(bridge); const calls: Intent[] = [];
    bridge.submit = async (intent, control) => { if (intent.role === "A") calls.push(structuredClone(intent)); await original(intent, control); if (intent.role === "A" && calls.length === 1) throw { category: "transport", recoverable: true, code: "LOST_REPLY" }; };
    let s = await until(controlled, s => s.intents.some(i => i.intent.role === "A" && !!i.error)); const first = s.intents.find(i => i.intent.role === "A")!;
    expect(first.admissionAttempts).toBe(1); expect(first.nextAdmissionAt).toBe(600); expect(calls.length).toBe(1);
    for (let n = 0; n < 3; n++) await controlled.tick("fixture-m"); expect(calls.length).toBe(1);
    now = 599; await controlled.tick("fixture-m"); expect(calls.length).toBe(1); now = 600;
    s = await until(controlled, s => s.status === "complete"); expect(calls.length).toBe(2); expect(canonical(calls[0])).toBe(canonical(calls[1])); expect(bridge.executions.size).toBe(3);
    expect(s.intents.find(i => i.intent.role === "A")!.failureHistory?.[0].cause).toEqual({ category: "transport", recoverable: true, code: "LOST_REPLY" });
    expect(s.candidates[0].outcome).toBe("saved_certain"); expect(engine.snapshot("fixture-m").status).toBe("complete");
  });
  test("maxAdmission retry limit blocks instead of admitting identical failures forever", async () => {
    const cfg = config(); cfg.retryPolicy = { maxAttempts: 2, retryDelayMs: 0 }; const { engine, bridge } = setup(cfg); const calls: Intent[] = [];
    bridge.submit = async i => { calls.push(structuredClone(i)); throw { category: "transport", recoverable: true, code: "TIMEOUT" }; };
    const s = await until(engine, s => s.status === "complete"); expect(s.candidates[0].outcome).toBe("blocked"); expect(s.candidates[0].reason).toBe("max_admission_attempts");
    expect(calls.filter(i => i.role === "A").length).toBe(2); expect(canonical(calls[0])).toBe(canonical(calls.findLast(i => i.role === "A")));
    expect(s.intents.find(i => i.intent.role === "A")!.failureHistory?.length).toBe(2); const count = calls.length; await engine.tick("fixture-m"); expect(calls.length).toBe(count);
  });
  test("recoverable ensureTeam failures have their own bounded durable admission attempts", async () => {
    const cfg = config(); cfg.retryPolicy = { maxAttempts: 2, retryDelayMs: 0 }; const { engine, bridge } = setup(cfg); let calls = 0;
    bridge.ensureTeam = async () => { calls++; throw { category: "transport", recoverable: true, code: "TEAM_TIMEOUT" }; };
    const s = await until(engine, s => s.status === "suspended"); expect(calls).toBe(2); expect(s.reason).toBe("max_team_admission_attempts"); expect(s.candidates[0].outcome).toBe("blocked");
    expect(s.failureHistory?.length).toBe(2); await engine.tick("fixture-m"); expect(calls).toBe(2);
  });
  test("untyped permission-looking prose is not classified as a permanent rejection", async () => {
    const cfg = config(); cfg.retryPolicy = { maxAttempts: 2, retryDelayMs: 0 }; const { engine, bridge } = setup(cfg); const original = bridge.submit.bind(bridge); let calls = 0;
    bridge.submit = async (intent, control) => { if (intent.role === "A" && calls++ === 0) throw new Error("permission/auth/input permanently denied (untyped transport prose)"); await original(intent, control); };
    const s = await until(engine, s => s.status === "complete"); expect(s.candidates[0].outcome).toBe("saved_certain");
  });
  test("inspect error stays submitted and retries inspection, not admission or analysis", async () => {
    const cfg = config(); cfg.retryPolicy = { maxAttempts: 1, retryDelayMs: 0 }; const { engine, bridge } = setup(cfg); const inspect = bridge.inspect.bind(bridge); const calls: string[] = [];
    bridge.inspect = async intent => { if (intent.role === "A") { calls.push(intent.executionId); if (calls.length === 1) throw { category: "auth", recoverable: false, status: 403 }; } return inspect(intent); };
    const pending = await until(engine, s => s.intents.some(i => i.intent.role === "A" && !!i.error)); expect(pending.intents.find(i => i.intent.role === "A")!.state).toBe("submitted");
    const s = await until(engine, s => s.status === "complete"); expect(new Set(calls).size).toBe(1); expect(bridge.submissions.filter(i => i.role === "A").length).toBe(1);
    expect(s.intents.find(i => i.intent.role === "A")!.failureHistory?.[0].cause).toEqual({ category: "auth", recoverable: false, status: 403 });
  });
});
describe("explicit retry configuration", () => {
  function realConfig() { const cfg = config(); cfg.fixture = false; delete cfg.fixtureSeeds; cfg.commonInputs = [{ path: "C:/fixture/input/native.asm", kind: "native", sha256: hash("asm"), version: "1", provenance: "test native manifest, no live dispatch" }]; return cfg; }
  test("real mode requires explicit maxAttempts AND retryDelayMs without production defaults", () => {
    const cfg = realConfig(); expect(() => validateConfig(cfg)).toThrow(/retry/i);
    expect(() => validateConfig({ ...cfg, retryPolicy: { maxAttempts: 2 } })).toThrow(/retryDelayMs/i);
    expect(() => validateConfig({ ...cfg, retryPolicy: { retryDelayMs: 50 } })).toThrow(/maxAttempts/i);
    expect(validateConfig({ ...cfg, retryPolicy: { maxAttempts: 2, retryDelayMs: 50 } }).retryPolicy).toEqual({ maxAttempts: 2, retryDelayMs: 50 });
  });
  test("fixture-only synthesized policy is labelled and cannot be carried into real mode", () => {
    const validated = validateConfig(config()); expect(validated.retryPolicy).toEqual({ maxAttempts: 3, retryDelayMs: 0, fixtureSynthetic: true });
    expect(() => validateConfig({ ...realConfig(), retryPolicy: validated.retryPolicy })).toThrow(/fixture/i);
  });
  test("retry bounds must be explicit finite integer counts and delays", () => {
    for (const retryPolicy of [{ maxAttempts: 0, retryDelayMs: 0 }, { maxAttempts: 1.5, retryDelayMs: 0 }, { maxAttempts: 2, retryDelayMs: -1 }, { maxAttempts: 2, retryDelayMs: Number.POSITIVE_INFINITY }]) expect(() => validateConfig({ ...config(), retryPolicy })).toThrow(/retry|maxAttempts/i);
  });
});
describe("verified explicit R conclusions become immutable public knowledge", () => {
  function publicConclusionSetup(nativeExplore = false) {
    const cfg = config([candidate("0x10"), candidate("0x20", [identity("0x10")])], [assessment("0x10", 1), assessment("0x20", 2)]); cfg.subsetSize = 1;
    if (nativeExplore) delete cfg.fixtureSeeds;
    const state = setup(cfg), artifacts = new Map<string, string>(); let writes = 0;
    if (nativeExplore) for (const ea of ["0x10", "0x20"]) state.publication.seedTarget(`fixture:${identityKey(identity(ea))}`);
    state.options.knowledgeArtifactSink = { writeImmutable: async ({ file, content }) => { writes++; const previous = artifacts.get(file.path); if (previous !== undefined && previous !== content) throw new Error("immutable knowledge altered"); artifacts.set(file.path, content); return { sha256: hash(content) }; } };
    const read = state.options.inputAccess.read;
    state.options.inputAccess.read = async (path, context) => artifacts.has(path) ? { status: "ok", content: artifacts.get(path)! } : read(path, context);
    state.bridge.transform = (doc, intent) => {
      if (doc.kind === "explore") doc.candidates = [candidate("0x10"), candidate("0x20", [identity("0x10")])];
      if (doc.kind === "proposal") doc.propositions[0].text = `${intent.role}-PRIVATE-HYPOTHESIS`;
      if (doc.kind === "reconciliation") { doc.propositions[0].text = "R-EXAMINED-PRIVATE-PROPOSITION"; doc.conclusion = { text: `PUBLIC-CONCLUSION-${intent.identity!.ea}`, evidence }; }
      return doc;
    };
    return { ...state, artifacts, writes: () => writes };
  }
  test("certain publication updates only NEXT cycle knowledge; threshold and frozen cycle do not change", async () => {
    const { engine, bridge, artifacts, writes } = publicConclusionSetup(); const initial = await until(engine, s => s.cycles[0].frozen); const freeze = canonical(initial.cycles[0]);
    const next = await until(engine, s => s.cycle === 2 && s.stage === "explore"); expect(next.config.evaluation.maxDifficulty).toBe(10); expect(canonical(next.cycles[0])).toBe(freeze);
    expect(next.validatedFacts?.length).toBe(1); const fact = next.validatedFacts![0]; expect(fact.materialization).toBe("verified"); expect(fact.conclusion.text).toBe("PUBLIC-CONCLUSION-0x10");
    expect(fact.resultId).toBe(next.reconciliations[0].result.resultId); expect(fact.resultHash).toBe(next.reconciliations[0].publication!.request.resultHash); expect(fact.publicationReceipt).toEqual(next.reconciliations[0].publication!.receipt!);
    expect(fact.file.path.replaceAll("\\", "/")).toBe(`C:/fixture/outputs/knowledge/${fact.resultHash}.json`); expect(fact.file.approvedForBlind).toBe(true); expect(fact.file.sha256).toBe(hash(fact.content)); expect(artifacts.get(fact.file.path)).toBe(fact.content);
    expect(fact.content).not.toContain("PRIVATE"); expect(next.config.knowledge.files).toEqual([fact.file]); expect(next.config.knowledge.fingerprint).not.toBe(initial.config.knowledge.fingerprint);
    expect(next.config.knowledge.validatedFacts?.[0].publicationReceipt).toEqual(fact.publicationReceipt); expect(next.cycles[1].knowledge.files).toEqual([fact.file]); expect(writes()).toBe(1);
    await until(engine, s => s.intents.some(i => i.intent.cycle === 2 && i.intent.role === "A"));
    const authors = bridge.submissions.filter(i => i.cycle === 2 && (i.role === "A" || i.role === "B")); expect(authors.length).toBe(2);
    for (const author of authors) { expect(author.inputs.knowledge.files).toEqual([fact.file]); expect(canonical(author.inputs)).not.toContain("PRIVATE"); expect(author.inputs.proposals).toBeUndefined(); }
    expect(engine.snapshot("fixture-m").candidates.every(c => c.assessments.length === 1)).toBe(true); expect(writes()).toBe(1);
  });
  test("worker exploration receives only verified public fact files before new exploration", async () => {
    const { engine, bridge } = publicConclusionSetup(true); await until(engine, s => s.cycle === 2); await engine.tick("fixture-m");
    const snapshot = engine.snapshot("fixture-m"); expect(snapshot.cycles[1].knowledge.files.length).toBe(1);
    expect(snapshot.cycles[1].knowledge.validatedFacts?.[0].conclusion.text).toBe("PUBLIC-CONCLUSION-0x10");
    expect(canonical(snapshot.cycles[1].knowledge)).not.toContain("PRIVATE"); const exploration = bridge.submissions.find(i => i.cycle === 2 && i.role === "explore")!;
    expect(exploration.inputs.knowledge.files).toEqual(snapshot.config.knowledge.files); expect(canonical(exploration.inputs.knowledge)).not.toContain("PRIVATE");
  });
  test("publication failure adds NO validated fact, manifest or public conclusion", async () => {
    const { engine, publication, options, writes } = publicConclusionSetup(); options.publication = { publish: async () => { throw { category: "target", recoverable: false, code: "CAS_REJECTED" }; }, readback: (r, c) => publication.readback(r, c) };
    const s = await until(engine, s => s.reconciliations.some(r => r.publication?.lastError)); expect(s.reconciliations[0].outcome).toBe("publication_pending"); expect(s.validatedFacts ?? []).toEqual([]); expect(s.config.knowledge.files).toEqual([]); expect(writes()).toBe(0);
    expect(s.reconciliations[0].publication!.failureHistory?.[0].cause).toEqual({ category: "target", recoverable: false, code: "CAS_REJECTED" });
  });
  test("knowledge materialization retry changes no science or publication work", async () => {
    const { engine, bridge, publication, options, writes } = publicConclusionSetup(); const sink = options.knowledgeArtifactSink!; let fail = true;
    options.knowledgeArtifactSink = { writeImmutable: async artifact => { if (fail) { fail = false; throw { category: "filesystem", recoverable: true, code: "TEMP_UNAVAILABLE" }; } return sink.writeImmutable(artifact); } };
    const pending = await until(engine, s => s.validatedFacts?.[0].materialization === "pending"); const admissions = bridge.submissions.length;
    expect(pending.config.knowledge.files).toEqual([]); expect(pending.reconciliations[0].outcome).toBe("saved_certain"); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
    const next = await until(engine, s => s.cycle === 2); expect(next.validatedFacts![0].materialization).toBe("verified"); expect(bridge.submissions.length).toBe(admissions); expect(writes()).toBe(1); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
  });
  test("fact and file are not regenerated after controller reopen; source hypotheses remain in history", async () => {
    const { engine, store, options, writes } = publicConclusionSetup(); const next = await until(engine, s => s.cycle === 2); const fact = canonical(next.validatedFacts![0]);
    const reopened = new Engine(options); reopened.attach("fixture-m"); await reopened.tick("fixture-m"); expect(canonical(store.load("fixture-m").validatedFacts![0])).toBe(fact); expect(writes()).toBe(1);
    expect(canonical(store.load("fixture-m").reconciliations[0].result.document)).toContain("R-EXAMINED-PRIVATE-PROPOSITION"); expect(canonical(store.load("fixture-m").intents.find(i => i.intent.role === "A")!.result!.document)).toContain("A-PRIVATE-HYPOTHESIS");
  });
  test("verified fact metadata/content cannot be rewritten and explicit resume retains public facts", async () => {
    const { engine, store } = publicConclusionSetup(); const next = await until(engine, s => s.cycle === 2);
    const paused = await engine.pause("fixture-m"); const resumed = await engine.resume("fixture-m", paused.revision, { version: "k2", fingerprint: "new-native-knowledge", leadsFingerprint: "new-lead", files: [] });
    expect(resumed.config.knowledge.validatedFacts).toEqual(next.config.knowledge.validatedFacts); expect(resumed.config.knowledge.files).toEqual(next.config.knowledge.files);
    const lease = store.acquireLease("fixture-m", "fact-checker", 50_000, 10_000); const changed = store.load("fixture-m"); changed.validatedFacts![0].content = "altered public fact";
    expect(() => store.commit(changed, changed.revision, lease, 50_001)).toThrow(/validated fact|immutable/i);
  });
  test("legacy fixture certain without conclusion creates no fabricated public fact", async () => {
    const { engine } = setup(); const s = await until(engine, s => s.status === "complete"); expect(s.validatedFacts ?? []).toEqual([]); expect(s.config.knowledge.files).toEqual([]);
  });
  test("real reconciliation requires a distinct conclusion with 3-8 explicit evidence refs", async () => {
    const { engine, bridge } = setup(); await until(engine, s => s.stage === "validate"); const intent = bridge.submissions.find(i => i.role === "R")!; const inspection = await bridge.inspect(intent);
    const validate = (conclusion: { text: string; evidence: typeof evidence } | undefined) => { const doc: unknown = JSON.parse(inspection.artifact!.content); expect(typeof doc).toBe("object"); const content = JSON.stringify({ ...(doc as Record<string, unknown>), conclusion }); return validateResult({ ...intent, fixture: false }, { ...inspection, artifact: { ...inspection.artifact!, content, sha256: hash(content) } }); };
    expect(() => validate(undefined)).toThrow(/conclusion/i); expect(() => validate({ text: "R explicit conclusion", evidence })).toThrow(/3.*8|evidence/i);
    expect(() => validate({ text: "R explicit conclusion", evidence: [evidence[0], { ...evidence[0], id: "e2", source: "native-2.asm" }, { ...evidence[0], id: "e3", source: "native-3.asm" }] })).not.toThrow();
    expect(() => validate({ text: "R explicit conclusion", evidence: Array.from({ length: 9 }, (_, n) => ({ ...evidence[0], id: `e${n}`, source: `native-${n}.asm` })) })).toThrow(/3.*8|evidence/i);
  });
  test("public fact and file survive closing/reopening BOTH owned SQLite databases without regeneration", async () => {
    const fs = await import("node:fs/promises"), path = await import("node:path"); const root = path.join(process.env.TEMP || ".", "opencode", `ff8-public-reopen-${crypto.randomUUID()}`);
    await fs.mkdir(root); const storePath = path.join(root, "engine.sqlite"), publicationPath = path.join(root, "target.sqlite");
    let store = new Store(storePath), publication = new FixturePublicationAdapter(publicationPath); const cfg = config(); cfg.outputDirectory = path.join(root, "outputs");
    const bridge = new FixtureBridge(); bridge.transform = doc => { if (doc.kind === "reconciliation") doc.conclusion = { text: "only explicit verified fixture conclusion", evidence }; return doc; };
    publication.seedTarget(`fixture:${identityKey(identity("0x10"))}`); const sink = new FileKnowledgeArtifactSink(path.join(cfg.outputDirectory, "knowledge")); let writes = 0, factPath: string | undefined;
    const options: EngineOptions = { store, bridge, publication, controllerId: "public-recovery", now: () => 100, knowledgeArtifactSink: { writeImmutable: artifact => { writes++; return sink.writeImmutable(artifact); } }, inputAccess: {
      read: async p => { const intent = bridge.submissions.find(i => i.outputPath === p); if (intent) return { status: "ok", content: (await bridge.inspect(intent)).artifact!.content }; try { return { status: "ok", content: await fs.readFile(p, "utf8") }; } catch { return { status: "missing" }; } }, list: async () => ({ status: "ok", entries: [] }), tool: async () => true } };
    try {
      let engine = new Engine(options); engine.create(cfg); const complete = await until(engine, s => s.status === "complete"); const fact = complete.validatedFacts![0]; factPath = fact.file.path;
      const before = canonical(fact), mtime = (await fs.stat(factPath)).mtimeMs; store.close(); publication.close();
      store = new Store(storePath); publication = new FixturePublicationAdapter(publicationPath); options.store = store; options.publication = publication;
      engine = new Engine(options); engine.attach(cfg.missionId); const reopened = await engine.tick(cfg.missionId);
      expect(canonical(reopened.validatedFacts![0])).toBe(before); expect(await fs.readFile(factPath, "utf8")).toBe(fact.content); expect((await fs.stat(factPath)).mtimeMs).toBe(mtime); expect(writes).toBe(1); expect(publication.counts()).toEqual({ writes: 1, readbacks: 1 });
    } finally {
      store.close(); publication.close(); if (factPath) { try { await fs.unlink(factPath); } catch {} }
      for (const p of [storePath, publicationPath]) for (const suffix of ["", "-wal", "-shm"]) { try { await fs.unlink(p + suffix); } catch {} }
      for (const p of [path.join(cfg.outputDirectory, "knowledge"), cfg.outputDirectory, root]) { try { await fs.rmdir(p); } catch {} }
    }
  });
});
describe("per-function relevant scientific input stagnation", () => {
  function scopedSetup(linkAtCycle3: boolean) {
    const cfg = config(); delete cfg.fixtureSeeds; cfg.maxCycles = 4; cfg.stagnationLimit = 10; cfg.subsetSize = 2;
    const state = setup(cfg), artifacts = new Map<string, string>(); state.publication.seedTarget(`fixture:${identityKey(identity("0x10"))}`);
    state.options.knowledgeArtifactSink = { writeImmutable: async ({ file, content }) => { const old = artifacts.get(file.path); if (old !== undefined && old !== content) throw new Error("immutable knowledge"); artifacts.set(file.path, content); return { sha256: hash(content) }; } };
    const read = state.options.inputAccess.read; state.options.inputAccess.read = (path, context) => artifacts.has(path) ? Promise.resolve({ status: "ok", content: artifacts.get(path)! }) : read(path, context);
    state.bridge.transform = (doc, intent) => {
      if (doc.kind === "explore") doc.candidates = [candidate("0x10"), candidate("0x20", linkAtCycle3 && intent.cycle >= 3 ? [identity("0x10")] : []), ...(intent.cycle >= 2 ? [candidate("0x30")] : []), candidate("0x40")];
      if (doc.kind === "evaluate") doc.assessments[0].difficulty = intent.identity!.ea === "0x10" ? 1 : intent.identity!.ea === "0x20" ? 2 : intent.identity!.ea === "0x30" ? 3 : 90;
      if (doc.kind === "proposal") doc.propositions[0].text = `PRIVATE-${intent.role}-${intent.identity!.ea}`;
      if (doc.kind === "reconciliation") {
        doc.decision = intent.identity!.ea === "0x10" ? "certain" : intent.identity!.ea === "0x20" ? "likely" : "unlikely";
        doc.contradictions = doc.decision === "certain" ? [] : ["private unresolved contradiction"]; doc.questions = doc.decision === "certain" ? [] : ["private unresolved lead"];
        if (doc.decision === "certain") doc.conclusion = { text: "PUBLIC-VERIFIED-0x10", evidence }; else delete doc.publicationGate;
      }
      return doc;
    };
    return state;
  }
  test("unrelated saved fact and changed subset do not rerun likely; explicit dependency unlocks only that function", async () => {
    const { engine, bridge } = scopedSetup(true); const second = await until(engine, s => s.cycle === 2 && s.cycles[1].frozen);
    expect(second.cycles[1].subset).toEqual([identityKey(identity("0x30"))]); expect(bridge.submissions.filter(i => i.cycle === 2 && i.identity?.ea === "0x20" && i.role === "A")).toEqual([]);
    const s = await until(engine, s => s.status === "suspended");
    expect(bridge.submissions.filter(i => i.identity?.ea === "0x20" && i.role === "A").map(i => i.cycle)).toEqual([1, 3]);
    expect(bridge.submissions.filter(i => i.identity?.ea === "0x30" && i.role === "A").map(i => i.cycle)).toEqual([2]);
    expect(bridge.submissions.some(i => i.identity?.ea === "0x40" && ["A", "B", "R"].includes(i.role))).toBe(false);
    const third = bridge.submissions.find(i => i.cycle === 3 && i.identity?.ea === "0x20" && i.role === "A")!; expect(third.inputs.knowledge.validatedFacts?.map(f => f.identity.ea)).toEqual(["0x10"]); expect(canonical(third.inputs.knowledge)).not.toContain("PRIVATE");
    const unrelated = bridge.submissions.find(i => i.cycle === 2 && i.identity?.ea === "0x30" && i.role === "A")!; expect(unrelated.inputs.knowledge.validatedFacts ?? []).toEqual([]); expect(unrelated.inputs.knowledge.files).toEqual([]);
    const target = s.candidates.find(c => c.candidate.identity.ea === "0x20")!; expect(target.assessments.map(a => a.assessment.difficulty)).toEqual([2, 2]);
    expect(target.scientificHistory?.filter(h => h.phase === "reconciled").length).toBe(2); expect(s.config.evaluation.maxDifficulty).toBe(10); expect(s.reason).toBe("unchanged_inputs");
  });
  test("global subset composition alone never fills capacity by repeating unchanged uncertainty", async () => {
    const { engine, bridge } = scopedSetup(false); const s = await until(engine, s => s.status === "suspended");
    expect(s.reason).toBe("unchanged_inputs"); expect(bridge.submissions.filter(i => i.identity?.ea === "0x20" && i.role === "A").map(i => i.cycle)).toEqual([1]);
    expect(bridge.submissions.filter(i => i.identity?.ea === "0x30" && i.role === "A").map(i => i.cycle)).toEqual([2]);
    expect(s.reconciliations.filter(r => r.decision === "likely").length).toBe(1); expect(s.reconciliations.filter(r => r.decision === "unlikely").length).toBe(1);
  });
  test("explicit scoped new lead unlocks the matching uncertain function, not an unrelated neighbor", async () => {
    const { engine, bridge } = scopedSetup(false); const paused = await until(engine, s => s.status === "suspended");
    await engine.resume("fixture-m", paused.revision, { ...paused.config.knowledge, scopedLeads: [{ identity: identity("0x20"), fingerprint: "new-relevant-20-proof" }] });
    await until(engine, s => s.status === "suspended" || s.status === "complete");
    expect(bridge.submissions.filter(i => i.identity?.ea === "0x20" && i.role === "A").map(i => i.cycle)).toEqual([1, 3]);
    expect(bridge.submissions.filter(i => i.identity?.ea === "0x30" && i.role === "A").map(i => i.cycle)).toEqual([2]);
  });
  test("uncertain conclusions stay private; explorer receives result pointers, never the private hypotheses", async () => {
    const { engine, bridge } = scopedSetup(false); const transform = bridge.transform!;
    bridge.transform = (doc, intent) => { doc = transform(doc, intent); if (doc.kind === "reconciliation" && doc.decision !== "certain") doc.conclusion = { text: "PRIVATE-UNCERTAIN-CONCLUSION", evidence }; return doc; };
    await until(engine, s => s.cycle === 2 && s.stage === "evaluate"); const explore = bridge.submissions.find(i => i.cycle === 2 && i.role === "explore")!;
    expect(explore.inputs.unresolvedResults?.map(r => r.decision)).toEqual(["likely"]); expect(canonical(explore.inputs)).not.toContain("PRIVATE-UNCERTAIN"); expect(explore.inputs.knowledge.validatedFacts?.map(f => f.identity.ea)).toEqual(["0x10"]);
  });
});
