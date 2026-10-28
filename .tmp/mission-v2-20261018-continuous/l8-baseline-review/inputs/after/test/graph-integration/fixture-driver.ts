/** Central integration fixtures, NOT the historical L7 scheduler/simulator. */
import { afterAll } from "bun:test";
import { appendFileSync, readFileSync, mkdtempSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import type { Bridge, InputAccess, InputBundle, Inspection, MissionConfig, Snapshot, StoredResult } from "../../src/domain";
import type { FixtureExecutionPort, GraphIntentRecord, GraphRunSpec } from "../../src/graph-adapter";
import type { WorkUnit } from "../../src/planner";
import { assertSnapshotContract, type GraphSnapshotV1 } from "../../src/graph";
import { buildGraphSnapshot } from "../../src/graph-normalize";
import { graphCopy, prepareGraph, type GraphPreparation, type GraphPreparationV2 } from "../../src/graph-pipeline";
import { canonical, fingerprint, hash } from "../../src/validation";
import { Engine, type GraphPorts } from "../../src/engine";
import { Store } from "../../src/store";
import { GraphStore } from "../../src/graph-store";
import { prepareGraphExecution, type GraphEngine } from "../../src/graph-engine";
import { BridgeAdmissionError } from "../../src/client";

export function snapshotFixture(count = 4, calls: Array<[number, number]> = []): GraphSnapshotV1 {
  const source = assertSnapshotContract(JSON.parse(readFileSync(join(import.meta.dir, "..", "fixtures/graph/communities-obvious/content.json"), "utf8")));
  const template = source.nodes[0]!, edge = source.edges[0]!;
  const nodes = Array.from({ length: count }, (_, i) => {
    const rva = 0x2000 + i * 0x100, hex = (n: number) => `0x${n.toString(16).toUpperCase()}`;
    return { ...structuredClone(template), id: `${template.moduleSha256}:${hex(rva)}`, rva: hex(rva), ea: hex(0x400000 + rva), boundaries: [{ ordinal: 0, rva: hex(rva), endRvaExclusive: hex(rva + 16), role: "entry" as const }] };
  });
  const edges = calls.map(([from, to], i) => {
    const caller = nodes[from]!, callee = nodes[to]!, siteRva = `0x${(BigInt(caller.rva) + 4n).toString(16).toUpperCase()}`;
    return { ...structuredClone(edge), id: `edge:central-fixture:${i}`, sourceId: caller.id, destinationId: callee.id,
      sites: [{ ...structuredClone(edge.sites[0]!), siteRva, provenance: { ...structuredClone(edge.sites[0]!.provenance), siteRva, evidenceSha256: hash(`offline-site:${siteRva}:${i}`) } }] };
  });
  return buildGraphSnapshot({ missionId: "central-fixture", snapshotId: `snapshot:central:${count}:${hash(JSON.stringify(calls)).slice(0, 12)}`, artifacts: source.binaryArtifacts, nodes, edges,
    objects: [], unresolved: [], capabilities: [], knowledgeRevision: 1, scopeDescription: "Explicit synthetic central integration fixture, no native authority", coverage: source.coverage,
    toolVersions: source.toolVersions, configFingerprint: source.configFingerprint }).snapshot;
}
export function preparation(snapshot = snapshotFixture()): GraphPreparation {
  return { version: "l8-graph-preparation-v1", snapshot, cluster: { algorithm: "historical-cc" }, groups: { minSize: 1, maxSize: 1 },
    policy: { version: "central-fixture-policy-v1", estimationVersion: "central-estimates-v1", investigationKind: "decompilation", artifactKind: "reconciled_c", publicationLevel: 1,
      contextEnvelopeMaxUtf8Bytes: 1_000_000, totalContextBudgetUtf8Bytes: 100_000_000, maxSelectedUnits: 1000, sccMaxFunctions: 1000, sccMaxIterations: 2, sccCostBudget: 1_000_000,
      requirementsByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { functionId: node.id, moduleSha256: node.moduleSha256, artifactId: `artifact:${hash(node.id)}`,
        artifactSha256: hash(`C:${node.id}`), artifactKind: "reconciled_c" as const, minimumRevision: 2, maximumRevision: 2, publicationLevel: 1 as const, validation: "fixture-only" as const }])),
      estimatesByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { version: "central-estimates-v1", A: 1, B: 1, R: 1, validation: 1 }])),
      resourcesByFunction: Object.fromEntries(snapshot.nodes.map(node => [node.id, { profiles: ["fixture-worker"], models: ["fixture/local#high"], tools: [], accounts: ["fixture-account"], slots: 1, cpu: 1, gpu: 0, budget: 1 }])) } };
}
export function preparedFixture(snapshot = snapshotFixture()) { return prepareGraph(preparation(snapshot)); }
/** Unique retained directory: no deletes of fixture databases or WAL evidence. */
const ownedDatabases = new Set<string>();
const fixtureRegistry = resolve(import.meta.dir, "../../../../.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl");
export function preserveFixture(path: string): void {
  if (!existsSync(path)) return;
  const files = [path, `${path}-wal`, `${path}-shm`].filter(existsSync).map(path => { const b = readFileSync(path); return { path, bytes: b.length, sha256: hash(b) }; });
  const body = { version: "l8-v2-closed-fixture-v1", fixtureOnly: true, noDeletes: true, files, closedNoWalShm: files.length === 1 }, receipt = join(dirname(path), `fixture-pin-${fingerprint(body)}.json`);
  if (!existsSync(receipt)) writeFileSync(receipt, JSON.stringify(body, null, 2), { flag: "wx" });
  appendFileSync(fixtureRegistry, JSON.stringify({ event: "closed-and-pinned", taskId: "task_mv6towrm_000c_24005n", time: new Date().toISOString(), path, receipt, sha256: hash(readFileSync(receipt)), closedNoWalShm: body.closedNoWalShm }) + "\n");
  if (!body.closedNoWalShm) throw new Error(`fixture connections not all closed; WAL/SHM retained and hashed: ${receipt}`);
}
export function fixturePath(): string {
  const path = join(mkdtempSync(join(process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Temp/opencode") : process.env.TEMP!, "l8-central-v2-")), "own.db"); ownedDatabases.add(path);
  appendFileSync(fixtureRegistry, JSON.stringify({ event: "reserved", taskId: "task_mv6towrm_000c_24005n", time: new Date().toISOString(), path }) + "\n"); return path;
}
if (isMainThread) afterAll(() => {
  const files = [...ownedDatabases].filter(existsSync).flatMap(path => [path, `${path}-wal`, `${path}-shm`].filter(existsSync).map(path => { const bytes = readFileSync(path); return { path, bytes: bytes.length, sha256: hash(bytes) }; }));
  if (!files.length) return;
  const path = join(dirname(fixturePath()), "retained-databases.json");
  writeFileSync(path, JSON.stringify({ version: "l8-v2-focused-fixtures-v1", fixtureOnly: true, noDeletes: true, files, walOrShmPresent: files.some(f => !f.path.endsWith(".db")) }, null, 2), { flag: "wx" });
  console.log(`L8_RETAINED_FIXTURES ${path} sha256=${hash(readFileSync(path))} databases=${files.filter(f => f.path.endsWith(".db")).length}`);
});
export function missionFixture(snapshot = snapshotFixture()): MissionConfig {
  const artifact = snapshot.binaryArtifacts[0]!, model = { providerID: "fixture", id: "local", variant: "high" };
  return { schemaVersion: 1, missionId: snapshot.missionId, binary: { sha256: artifact.contentSha256, version: artifact.versionLabel }, fixture: true,
    evaluation: { method: "fixture", version: "v1", maxDifficulty: 100 }, subsetSize: snapshot.nodes.length, maxCycles: 2, stagnationLimit: 2,
    models: { A: model, B: model, R: model, explore: model, evaluate: model }, knowledge: { version: "fixture-knowledge-v1", fingerprint: hash("fixture-knowledge"), leadsFingerprint: hash("fixture-leads"), files: [] },
    commonInputs: [], accessibleRules: [], requiredTools: [], outputDirectory: join(dirname(fixturePath()), "output") };
}
export function initialSnapshot(config: MissionConfig): Snapshot {
  return { schemaVersion: 1, missionId: config.missionId, revision: 0, config, status: "running", cycle: 1, stage: "group", candidates: [],
    cycles: [{ number: 1, knowledge: structuredClone(config.knowledge), groups: [], subset: [], frozen: false }], intents: [], reconciliations: [], noProgressCycles: 0 };
}
export function graphSpec(snapshot = snapshotFixture(), maxConcurrent = 4): GraphRunSpec {
  return { prepared: preparedFixture(snapshot), settings: { profiles: { A: "fixture-worker", B: "fixture-worker", R: "fixture-worker" }, maxConcurrent, familyTtlEvents: 10000, maxAdmissionAttempts: 3, retryDelayMs: 10 },
    workers: Array.from({ length: maxConcurrent }, (_, i) => ({ workerId: `fixture-worker:${i}`, profile: "fixture-worker", model: "fixture/local#high", tools: [], accountId: "fixture-account", slots: 1, cpu: 1, gpu: 0, budget: 1000, available: true })),
    accounts: [{ accountId: "fixture-account", slots: maxConcurrent, budget: 10000 }], inputsByFunction: {},
    publicationsByFunction: Object.fromEntries(snapshot.nodes.map(n => [n.id, { artifactId: `artifact:${hash(n.id)}`, artifactKind: "reconciled_c" as const, content: `C:${n.id}` }])) };
}
export function fixtureInputs(snapshot: Snapshot, sub: WorkUnit["subIntents"][number], proposals?: StoredResult[]): InputBundle {
  return { schemaVersion: 1, role: sub.role, cycle: snapshot.cycle, identity: structuredClone(sub.harnessIdentity), files: proposals?.map(p => ({ path: p.path, sha256: p.sha256, version: p.resultId, kind: "proposal" as const, provenance: "explicit fixture proposal" })) ?? [],
    accessibleRules: [], requiredTools: [], knowledge: structuredClone(snapshot.config.knowledge), ...(proposals ? { proposals: proposals.map(({ resultId, sha256, path, authorId, executionId, sessionId, content, document }) => ({ resultId, sha256, path, authorId, executionId, sessionId, content, document })) } : {}) };
}
export function preparationV2(snapshot = snapshotFixture(), maxConcurrent = 4, C = 60000): GraphPreparationV2 {
  const old = preparation(snapshot), spec = graphSpec(snapshot, maxConcurrent);
  old.policy.version = "complete-admission-cap-v1:l8";
  return { ...old, version: "l8-graph-preparation-v2", executionTemplate: { version: "l8-execution-template-v1", settings: spec.settings, workers: spec.workers, accounts: spec.accounts },
    inputsByFunction: spec.inputsByFunction, publicationsByFunction: spec.publicationsByFunction, budgetEpoch: 1,
    capsByFunction: Object.fromEntries(snapshot.nodes.map(n => [n.id, { completeBodyMaxUtf8Bytes: { known: true, value: C }, maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } }])) };
}
/** These fake ports exercise schema/protocol gates ONLY. Every authority/source
 * says offline fixture, and no assertion here represents an actual native check. */
export class FixtureHost {
  readonly files = new Map<string, string>();
  readonly submissions: Array<{ missionId: string; command: Record<string, unknown> }> = [];
  readonly receipts = new Map<string, Record<string, unknown>>();
  readonly holds = new Set<string>();
  readonly targets = new Map<string, { requestDigest: string; content: string }>();
  readonly publications: string[] = [];
  readonly reviews: string[] = [];
  readonly submissionFailures: Array<"quota" | "input" | "ambiguous"> = [];
  readonly loseWrites = new Set<number>();
  corruptReadback = false; invalidReview = false; proposalText = "explicit synthetic fixture proposition"; decision: "certain" | "likely" = "certain";
  readonly access: InputAccess = {
    read: async path => this.files.has(path) ? { status: "ok", content: this.files.get(path)! } : { status: "missing" },
    list: async () => ({ status: "ok", entries: [] }), tool: async () => true,
  };
  readonly executions: FixtureExecutionPort = {
    kind: "offline-fixture-v1",
    submit: async (missionId, raw) => {
      const command = graphCopy(raw); this.submissions.push({ missionId, command }); const failure = this.submissionFailures.shift();
      if (failure === "quota" || failure === "input") throw new BridgeAdmissionError("explicit fixture rejection", failure, failure === "quota", "execution_rejected");
      const b = (command.metadata as any).graphBinding;
      const body = { executionId: command.executionId, attemptId: command.attemptId, role: b.role, subIntentId: b.subIntentId, idempotencyKey: command.idempotencyKey, command };
      const receipt = { executionId: command.executionId, state: "accepted", requestDigest: fingerprint(body), nativeSessionId: `offline-session:${hash(String(command.executionId))}`, authorId: command.executionId, source: "offline-fixture-not-native" };
      this.receipts.set(String(command.executionId), receipt);
      if (failure === "ambiguous") throw new Error("explicit fixture accepted then response lost");
      return graphCopy(receipt);
    },
    observe: async record => {
      const receipt = this.receipts.get(record.intent.executionId);
      if (!receipt) return { inspection: { status: "pending", executionId: record.intent.executionId } };
      const running: Inspection = { status: "running", executionId: record.intent.executionId };
      const binding = (record.admission.command.metadata as any).graphBinding;
      const admissionObservation = { executionId: record.intent.executionId, requestDigest: fingerprint(record.admission), state: "accepted" as const, receipt, proof: "explicit offline fixture observer, no native authority" };
      if (this.holds.has(binding.functionId)) return { inspection: running, admissionObservation };
      const header = (record.admission.command.dossier as any).resultHeader, role = record.intent.role;
      const evidence = [{ id: `evidence:${hash(record.intent.executionId)}`, source: "synthetic offline fixture, no ASM checked", sha256: hash(this.proposalText), detail: "Schema test data ONLY, not scientific/native validation" }];
      const propositions = [{ id: `proposition:${hash(record.intent.executionId)}`, text: this.proposalText, evidence, contradictions: [], questions: [] }];
      const document = role === "R" ? { ...header, kind: "reconciliation", decision: this.decision, propositions, contradictions: [], questions: [],
        ...(this.decision === "certain" ? { publicationGate: { nativeAsmChecked: true, independentAuthors: true, inputHashesVerified: true, opcodeCoverageComplete: true, abiChecked: true, contradictionsResolved: true, readbackPlan: true,
          targetId: "synthetic-fixture-schema-gate-NOT-actual-native", targetRevision: 1, evidence } } : {}) } : { ...header, kind: "proposal", role, propositions };
      const content = canonical(document); this.files.set(record.intent.outputPath, content);
      return { inspection: { status: "completed", executionId: record.intent.executionId, authorId: String(receipt.authorId), sessionId: String(receipt.nativeSessionId), effectiveModel: graphCopy(record.intent.requestedModel), fresh: true,
        artifact: { path: record.intent.outputPath, sha256: hash(content), content } }, admissionObservation,
        terminalProof: { executionId: record.intent.executionId, state: "completed", requestDigest: fingerprint(record.admission), quiescent: true, source: "explicit offline fixture terminal observer NOT native readback" } };
    },
  };
  readonly ports: GraphPorts = {
    executions: this.executions,
    review: { kind: "offline-fixture-v1", review: async ({ run, unit, results }) => {
      this.reviews.push(unit.unitId);
      if (results.length !== unit.subIntents.length) throw new Error("fixture review saw partial family");
      const evidence = [{ id: `fixture-review:${hash(unit.unitId)}`, source: "offline-fixture-review-NOT-native", sha256: fingerprint(results), detail: "Executed schema/attribution test, no RE acceptance" }];
      return { evidence, validatedFactIds: unit.ownedFunctionIds.map(id => run.publicationsByFunction[id]!.artifactId).sort(),
        checks: [{ id: "synthetic-fixture-check", kind: "fixture-schema", outcome: "pass", evidenceDigest: this.invalidReview ? hash("wrong evidence") : fingerprint(evidence), detail: "Explicit fake check; no native-scientific authority" }] };
    } },
    publication: { kind: "offline-fixture-v1", write: async request => {
      const old = this.targets.get(request.targetId); if (old && canonical(old) !== canonical({ requestDigest: request.requestDigest, content: request.content })) throw new Error("fixture double publication changed bytes");
      this.targets.set(request.targetId, { requestDigest: request.requestDigest, content: request.content }); this.publications.push(request.targetId);
      if (this.loseWrites.delete(this.publications.length)) throw new Error("fixture publication applied then reply lost");
    }, read: async request => {
      const target = this.targets.get(request.targetId); if (!target || target.requestDigest !== request.requestDigest) throw new Error("fixture target digest mismatch");
      return { ...request, content: target.content + (this.corruptReadback ? "CORRUPT" : ""), source: "offline-fixture-byte-readback-NOT-native" };
    } },
    parentAuthority: {
      verifyParent: authority => ({ version: 1, role: "parent", missionId: authority.lease.missionId, controllerOwner: authority.lease.owner, principalId: "offline-fixture-test-principal", actorId: "offline-fixture-parent-not-worker", source: "explicit fake fixture parent NOT authenticated native", sourceHash: hash("offline-fixture-parent") }),
      verifyNativeAuthor: (_authority, expected) => {
        const command = this.submissions.find(s => s.command.executionId === expected.executionId)?.command, receipt = this.receipts.get(expected.executionId);
        if (!command || !receipt || receipt.requestDigest !== expected.requestDigest) return;
        return { version: 1, missionId: expected.missionId, executionId: expected.executionId, requestDigest: expected.requestDigest, authorId: String(receipt.authorId), sessionId: String(receipt.nativeSessionId), profile: String(command.profile), model: command.model as any,
          fresh: true, parentSessionId: null, source: "explicit fake fixture identity NOT native observation", sourceHash: fingerprint(command) };
      },
    },
  };
}
export function graphHarness(request = preparationV2(snapshotFixture(1)), mutate?: (s: Snapshot) => void) {
  const path = fixturePath(), store = new Store(path), host = new FixtureHost(), config = missionFixture(request.snapshot), snapshot = initialSnapshot(config);
  mutate?.(snapshot); store.create(snapshot); let clock = 100, runtime: GraphEngine | undefined, closed = false;
  const unexpected = async (): Promise<never> => { throw new Error("legacy/native bridge or publication was touched"); };
  const bridge: Bridge = { ensureTeam: unexpected, submit: unexpected, inspect: unexpected, stop: unexpected, pauseAdmissions: unexpected };
  const engine = new Engine({ store, bridge, publication: { publish: unexpected, readback: unexpected }, inputAccess: host.access, controllerId: "offline-fixture-controller", now: () => clock, leaseMs: 1000000 });
  return { path, store, host, engine, request, missionId: snapshot.missionId, get runtime() { if (!runtime) throw new Error("fixture not started"); return runtime; },
    start() { runtime = engine.startGraph(snapshot.missionId, request, host.ports); return runtime; },
    reopen() { runtime?.close(); runtime = engine.openGraph(snapshot.missionId, host.ports); return runtime; },
    advance(ms = 20) { clock += ms; },
    async step() { clock += 20; return await this.runtime.step(); },
    async complete(max = 20) { let view = this.runtime.view(); for (let n = 0; n < max && !["complete", "blocked"].includes(view.status); n++) view = await this.step(); return view; },
    close() { if (!closed) { runtime?.close(); store.close(); closed = true; preserveFixture(path); } },
  };
}
export function waitSignal(signal: Int32Array, index: number, value: number): void {
  const until = Date.now() + 15000;
  while (Atomics.load(signal, index) !== value) { const left = until - Date.now(); if (left <= 0) throw new Error(`fixture SQLite barrier timeout ${index}`); Atomics.wait(signal, index, Atomics.load(signal, index), left); }
}
/** Local SQLite test thread, NOT an Ensemble/AI/execution worker. */
export function sqliteContender(payload: Record<string, unknown>, signal: Int32Array) {
  const worker = new Worker(new URL(import.meta.url), { workerData: { kind: "l8-integration-sqlite-contender-v1", payload, shared: signal.buffer } });
  const result = new Promise<any>((resolve, reject) => { worker.once("message", resolve); worker.once("error", reject); });
  const exit = new Promise<number>((resolve, reject) => worker.once("exit", code => code === 0 ? resolve(code) : reject(new Error(`SQLite fixture contender exit ${code}`))));
  return { result, exit };
}
if (!isMainThread && workerData?.kind === "l8-integration-sqlite-contender-v1") {
  const signal = new Int32Array(workerData.shared), data = workerData.payload, graph = new GraphStore(data.path), store = new Store(data.path);
  const timing: Record<string, number | string> = {}; let answer: Record<string, unknown>;
  try {
    // Test-only instrumentation of the first REAL public transaction. It records
    // entry order and delegates unmodified; no fabricated return, SQL or guard.
    const db = graph.db as any, real = db.transaction.bind(db); let first = true;
    db.transaction = (callback: (...args: any[]) => any) => {
      if (!first) return real(callback); first = false;
      const tx = real((...args: any[]) => { timing.enterOrder = Atomics.add(signal, 5, 1) + 1; return callback(...args); });
      // Bun's transaction.immediate descriptor is readonly; wrap the callable,
      // never mutate the native transaction object or its SQLite behavior.
      return Object.assign((...args: any[]) => tx(...args), {
        immediate: (...args: any[]) => { timing.beginOrder = Atomics.add(signal, 5, 1) + 1; timing.heldBeforeBegin = Atomics.load(signal, 3); timing.beginNs = process.hrtime.bigint().toString(); Atomics.store(signal, 2, 1); Atomics.notify(signal, 2); return tx.immediate(...args); },
        deferred: (...args: any[]) => tx.deferred(...args), exclusive: (...args: any[]) => tx.exclusive(...args),
      });
    };
    Atomics.store(signal, 0, 1); Atomics.notify(signal, 0); waitSignal(signal, 1, 1);
    try { const claim = prepareGraphExecution(graph, store, data.run, data.authority, data.lease, data.record); answer = { ok: true, claim }; }
    catch (error) { answer = { ok: false, error: String(error) }; }
    timing.endNs = process.hrtime.bigint().toString(); answer.timing = timing; answer.admission = graph.admission(data.record.intent.executionId);
  } catch (error) { answer = { fatal: String(error), timing }; }
  finally { graph.close(); store.close(); }
  Atomics.store(signal, 2, 1); Atomics.notify(signal, 2); // fail-fast also releases the parent barrier; fatal never qualifies as contention
  parentPort!.postMessage({ ...answer!, closed: true }); parentPort!.close();
}
