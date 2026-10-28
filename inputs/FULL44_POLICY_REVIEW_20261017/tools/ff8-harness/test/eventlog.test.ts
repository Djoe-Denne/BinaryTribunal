import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, readFileSync, unlinkSync, rmdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { Store } from "../src/store";
import type { InputBundle, Snapshot } from "../src/domain";
import { GraphStore, graphErrorClass, validateGraphDocument, type Admission, type KnowledgeCommit, type WorkUnit, type PersistenceSidecar, type ReservationExpectation, type GraphStoreOptions, type ParentAuthorityProvider, type NativeAuthorIdentity, type ParentAttestationRequest, type ArtifactBinding, type ArtifactReceipt } from "../src/graph-store";
import { EventLog } from "../src/eventlog";
import { assertCanonicalUnitProjection, type ControllerAuthority, type UnitLease } from "../src/unit-lease";
import { canonical, fingerprint, hash } from "../src/validation";
import { planMission, type PlannerPolicy } from "../src/planner";

const fixture = (id: string): any => JSON.parse(readFileSync(join(import.meta.dir, "fixtures", "graph", id, "content.json"), "utf8"));
const opened: Array<{ close(): void }> = [], dirs: string[] = [];
afterEach(() => {
  for (const resource of opened.splice(0)) { try { resource.close(); } catch {} }
  for (const dir of dirs.splice(0)) {
    for (const name of ["own.db", "foreign.db", "ensemble.db"]) for (const suffix of ["", "-wal", "-shm"]) { try { unlinkSync(join(dir, name + suffix)); } catch {} }
    rmdirSync(dir);
  }
});
function path(): string { const dir = mkdtempSync(join(process.env.TEMP!, "opencode", "ff8-graph-")); dirs.push(dir); return join(dir, "own.db"); }
function empty(missionId = "m"): Snapshot { return { schemaVersion: 1, missionId, revision: 0, config: {}, status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 } as unknown as Snapshot; }
function setup(options: GraphStoreOptions = {}) {
  const p = path(), store = new Store(p); opened.push(store); store.create(empty());
  const authority: ControllerAuthority = { lease: store.acquireLease("m", "controller", 10, 100000), now: 11 };
  const graph = new GraphStore(p, options); opened.push(graph);
  const snapshot = fixture("communities-obvious"); snapshot.missionId = "m";
  const partition = fixture("hub-external-context"); partition.snapshotId = snapshot.snapshotId; partition.snapshotFingerprint = snapshot.normalizedFingerprint;
  partition.communities = [{ ...partition.communities[0], memberIds: snapshot.nodes.map((n: any) => n.id), kernelIds: [snapshot.nodes[0].id], externalContextIds: [] }];
  graph.putSnapshot(authority, snapshot); graph.putPartition(authority, partition);
  return { p, store, graph, authority, snapshot, partition };
}
type Setup = ReturnType<typeof setup>;
/** In-memory boundary fixture. Engine CAS integration and reopening are tested
 * separately on the real shared file. This seed is explicitly offline. */
function memorySetup(options: GraphStoreOptions = {}): Setup {
  const store = new Store(":memory:"); opened.push(store); store.create(empty());
  const authority: ControllerAuthority = { lease: store.acquireLease("m", "controller", 10, 100000), now: 11 };
  const graph = new GraphStore(":memory:", options); opened.push(graph);
  graph.db.exec("CREATE TABLE ff8_missions(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,snapshot TEXT NOT NULL,lease_owner TEXT,lease_token INTEGER NOT NULL,lease_until INTEGER NOT NULL)");
  graph.db.query("INSERT INTO ff8_missions VALUES(?,?,?,?,?,?)").run("m", 0, canonical(empty()), authority.lease.owner, authority.lease.token, authority.lease.expiresAt);
  const snapshot = fixture("communities-obvious"); snapshot.missionId = "m";
  const partition = fixture("hub-external-context"); partition.snapshotId = snapshot.snapshotId; partition.snapshotFingerprint = snapshot.normalizedFingerprint;
  partition.communities = [{ ...partition.communities[0], memberIds: snapshot.nodes.map((n: any) => n.id), kernelIds: [snapshot.nodes[0].id], externalContextIds: [] }];
  graph.putSnapshot(authority, snapshot); graph.putPartition(authority, partition);
  return { p: ":memory:", store, graph, authority, snapshot, partition };
}
function unit(s: Setup, id = "unit", index = 0, state: WorkUnit["state"] = "READY"): WorkUnit {
  id = id.padEnd(4, "_");
  const u = fixture("work-unit-aggregate") as WorkUnit, node = s.snapshot.nodes[index];
  const source = u.subIntents.slice(0, 3), ids = new Map(source.map(x => [x.subIntentId, `${id}:${x.role}`]));
  return { ...u, unitId: id, snapshotId: s.snapshot.snapshotId, partitionId: s.partition.partitionId, knowledgeRevision: 1,
    ownedFunctionIds: [node.id], contextFunctionIds: [], requiredPublicationLevel: 1, state, conflicts: [],
    subIntents: source.map(x => ({ ...x, subIntentId: ids.get(x.subIntentId)!, functionId: node.id, harnessIdentity: { sha256: node.moduleSha256, version: "fixture-v1", ea: node.ea }, waitsForSubIntentIds: x.waitsForSubIntentIds.map(i => ids.get(i)!) })) };
}
function body(u: WorkUnit, role: string, suffix = ""): Admission {
  const sub = u.subIntents.find(s => s.role === role)!, executionId = `exec:${u.unitId}:${role}${suffix}`, attemptId = `attempt:${executionId}`;
  const inputs = inputsFor(sub), inputFingerprint = fingerprint(inputs), model = { providerID: "fixture", id: "local", variant: "high" };
  const header = { schemaVersion: 1, missionId: "m", taskId: `task:${executionId}`, executionId, attemptId, cycle: inputs.cycle, authorId: executionId, identity: sub.harnessIdentity, inputFingerprint, inputVersions: inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: [] };
  return { executionId, attemptId, role, subIntentId: sub.subIntentId, idempotencyKey: executionId,
    command: { taskId: `task:${executionId}`, executionId, attemptId, idempotencyKey: executionId, profile: "fixture-worker", model, prompt: "Frozen fixture inputs only", dossier: { version: 1, functionId: sub.functionId, function: sub.harnessIdentity, role, cycle: inputs.cycle, effectiveModel: model, inputs, resultHeader: header }, metadata: { inputFingerprint }, context: { mode: "fresh" }, worktree: false, requiredAccess: [] } };
}
function inputsFor(sub: WorkUnit["subIntents"][number]): InputBundle {
  return { schemaVersion: 1, role: sub.role, cycle: 1, identity: structuredClone(sub.harnessIdentity), files: [], accessibleRules: [], requiredTools: [], knowledge: { version: "fixture-known-inputs-v1", fingerprint: fingerprint("fixture-known-inputs"), leadsFingerprint: fingerprint([]), files: [] } };
}
function pinUnit(graph: GraphStore, authority: ControllerAuthority, lease: UnitLease): void {
  for (const sub of graph.unit(lease.missionId, lease.unitId).subIntents) graph.freezeAdmissionInputs(authority, lease, sub.subIntentId, inputsFor(sub));
}
function proof(graph: GraphStore, executionId: string, status = "completed") { return { executionId, state: status, requestDigest: graph.admission(executionId)!.digest, quiescent: true, source: "fixture-native-readback" }; }
async function complete(s: Setup, u: WorkUnit, lease: UnitLease): Promise<string[]> {
  const resultIds: string[] = [];
  for (const sub of u.subIntents) {
    const b = body({ ...u, subIntents: [sub] }, sub.role, u.ownedFunctionIds.length > 1 ? `:${sub.subIntentId}` : ""); s.graph.prepareAdmission(s.authority, lease, b);
    await s.graph.dispatch(s.authority, lease, b.executionId, { async submit(_mission, command) { return { executionId: command.executionId, revision: 1, state: "accepted" }; } });
    s.graph.proveTerminal(s.authority, u.unitId, b.executionId, "completed", proof(s.graph, b.executionId));
    const resultId = `result:${b.executionId}`;
    expect(s.graph.retainResult(s.authority, lease, b.executionId, resultId, { role: b.role, executionId: b.executionId, certain: true })).toBe(true); resultIds.push(resultId);
  }
  return resultIds;
}
function publication(s: Setup, u: WorkUnit, resultIds: string[]): KnowledgeCommit {
  const c = fixture("knowledge-commit-level1") as KnowledgeCommit;
  return identified({ ...c, unitId: u.unitId, inputRevision: 1, outputRevision: 2, resultIds, publicationLevel: u.requiredPublicationLevel, readbackStatus: "pending", futurePrerequisiteEffect: "does_not_satisfy" });
}
/** Independent contract oracle: complete document minus ONLY commitId, using
 * node:crypto rather than the implementation's scientificCommitId routine. */
function oracleCommitId(commit: KnowledgeCommit): string {
  const { commitId: _id, ...content } = commit;
  const stable = (value: any): string => value === null || typeof value !== "object" ? JSON.stringify(value)
    : Array.isArray(value) ? `[${value.map(stable).join(",")}]` : `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  return createHash("sha256").update(stable(content), "utf8").digest("hex");
}
function identified(commit: KnowledgeCommit): KnowledgeCommit { return { ...commit, commitId: oracleCommitId(commit) }; }
/** Normative L1 cross-field oracle, independent from the persistence validator. */
function oracleCommitViolations(c: KnowledgeCommit): string[] {
  const errors: string[] = [];
  if (c.commitId !== oracleCommitId(c)) errors.push("content identity");
  if (c.isGitCommit !== false) errors.push("git");
  if (c.outputRevision - c.inputRevision !== 1) errors.push("revision");
  if (c.futurePrerequisiteEffect === "satisfies" && c.readbackStatus !== "verified") errors.push("unverified effect");
  if (c.publicationTargetId.toLowerCase().includes("idb")) errors.push("IDB scope");
  if (c.publicationLevel !== 1 && c.publicationLevel !== 2) errors.push("level");
  return errors;
}
function artifactReceipt(binding: ArtifactBinding): ArtifactReceipt {
  const { version: _v, missionId: _m, materialization: _material, content: _bytes, sources: _sources, evidenceDigest: _e, parentAuthorityDigest: _p, parentActorId: _actor, parentAttestationId: _a, ...tuple } = binding;
  return { ...tuple, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
}
function validation(c: KnowledgeCommit) { return { evidence: c.evidence, validatedFactIds: c.validatedFactIds, source: "artifact" as const, parentValidated: false }; }
function readback(c: KnowledgeCommit) { return { targetId: c.publicationTargetId, hash: c.readbackHash, requestDigest: fingerprint(c), source: "fixture-publication-readback" }; }
function freeze(graph: GraphStore, authority: ControllerAuthority, unitIds: string[], overrides: Partial<PersistenceSidecar> = {}, legacyUnits?: WorkUnit[]): ReservationExpectation {
  const units = legacyUnits ?? unitIds.map(id => graph.unit(authority.lease.missionId, id)), first = units[0]!;
  const source = JSON.parse((graph.db.query("SELECT document FROM ff8_graph_snapshots WHERE id=?").get(first.snapshotId) as { document: string }).document);
  const plan = fixture("plan-scc-cycle");
  let revision = 0; try { revision = graph.reservationExpectation(authority.lease.missionId).activePlanRevision; } catch {}
  Object.assign(plan, { planId: `plan:test:${revision + 1}`, missionId: authority.lease.missionId, snapshotId: first.snapshotId, partitionId: first.partitionId, knowledgeRevision: first.knowledgeRevision,
    units: units.map(u => ({ unitId: u.unitId, ownedFunctionIds: u.ownedFunctionIds, contextFunctionIds: u.contextFunctionIds, requiredPublicationLevel: u.requiredPublicationLevel, state: u.state, contextEnvelopeUtf8Bytes: { known: true, value: 4096 } })), prerequisites: units.flatMap(u => u.prerequisites.map(p => ({ ...p, consumerUnitId: u.unitId }))), g1Edges: [], g2Conflicts: [], g3Affinities: [], sccs: [], selectedUnitIds: unitIds, decisions: unitIds.map(id => ({ id: `decision:${id}`, unitId: id, action: "include", reason: "test frozen plan" })) });
  const { fingerprint: _old, ...content } = plan; plan.fingerprint = fingerprint(content);
  const sidecar = { schemaVersion: 1 as const, planId: plan.planId, planFingerprint: plan.fingerprint, snapshotFingerprint: source.normalizedFingerprint, knowledgeRevision: first.knowledgeRevision, policyVersion: plan.policyVersion, estimationVersion: plan.estimationVersion, policy: { version: plan.policyVersion }, unitFingerprints: Object.fromEntries(units.map(u => { const { state: _state, ...content } = u; return [u.unitId, fingerprint(content)]; })), envelopeBytesByUnit: Object.fromEntries(unitIds.map(id => [id, 4096])), requirementById: {}, dispensationById: {}, externalReceiptById: {}, diagnostics: [], ...overrides };
  const withDigest = { ...sidecar, fingerprint: fingerprint(sidecar) };
  const binding = { schemaVersion: 1 as const, planFingerprint: plan.fingerprint, sidecarFingerprint: withDigest.fingerprint };
  const bound = { ...binding, fingerprint: fingerprint(binding) };
  if (legacyUnits) {
    // Test-only import of a pre-guard OWN6 database, not a production admission.
    graph.db.query("INSERT INTO ff8_graph_plans VALUES(?,?,?,?,?,?)").run(authority.lease.missionId, plan.planId, bound.fingerprint, canonical(plan), canonical(withDigest), canonical(bound));
    graph.db.query("INSERT INTO ff8_graph_active_plan VALUES(?,?,?)").run(authority.lease.missionId, plan.planId, revision + 1);
    graph.events.append(authority.lease.missionId, `plan:${revision + 1}`, "plan_frozen", authority.now, { plan, sidecar: withDigest, binding: bound, activePlanRevision: revision + 1 });
  } else graph.freezePlan(authority, plan, withDigest, bound, revision);
  return graph.reservationExpectation(authority.lease.missionId);
}
function reserve(graph: GraphStore, authority: ControllerAuthority, unitId: string, ttlEvents = 100): UnitLease {
  const lease = graph.reserve(authority, unitId, ttlEvents, freeze(graph, authority, [unitId])); pinUnit(graph, authority, lease); return lease;
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
/** Test-only trusted host cache; no claims of native/live verification. */
function parentHost(actorId = "actor:verified-parent") {
  const authors = new Map<string, NativeAuthorIdentity>();
  const identity = { version: 1 as const, role: "parent" as const, missionId: "m", controllerOwner: "controller", principalId: "operator:test-parent", actorId, source: "offline-authenticated-host-fixture", sourceHash: fingerprint("parent-host-authority-v1") };
  const provider: ParentAuthorityProvider = {
    verifyParent(authority) { return authority.lease.owner === identity.controllerOwner ? { ...identity } : undefined; },
    verifyNativeAuthor(_authority, expected) { return authors.get(expected.executionId); },
  };
  const populate = (s: Setup, lease: UnitLease) => {
    const rows = s.graph.db.query("SELECT execution_id,digest,body FROM ff8_graph_outbox WHERE mission=? AND unit_id=? AND token=?").all("m", lease.unitId, lease.token) as Array<{ execution_id: string; digest: string; body: string }>;
    for (const row of rows) {
      const command = JSON.parse(row.body).command;
      authors.set(row.execution_id, { version: 1, missionId: "m", executionId: row.execution_id, requestDigest: row.digest, authorId: `author:${row.execution_id}`, sessionId: `native-session:${row.execution_id}`, profile: command.profile, model: command.model, fresh: true, parentSessionId: null, source: "offline-authenticated-native-cache-fixture", sourceHash: fingerprint({ executionId: row.execution_id, native: "offline-fixture" }) });
    }
  };
  return { identity, authors, provider, populate };
}
function attestationRequest(s: Setup, u: WorkUnit, lease: UnitLease, ids: string[], c: KnowledgeCommit): ParentAttestationRequest {
  const expected = s.graph.reservationExpectation("m");
  const resultDigests = Object.fromEntries(ids.map(id => [id, (s.graph.db.query("SELECT digest FROM ff8_graph_results WHERE mission=? AND unit_id=? AND result_id=? AND token=?").get("m", u.unitId, id, lease.token) as { digest: string }).digest]));
  return { bindingFingerprint: expected.bindingFingerprint, planFingerprint: expected.planFingerprint, snapshotId: u.snapshotId, knowledgeRevision: u.knowledgeRevision,
    resultIds: [...ids], resultDigests, evidence: structuredClone(c.evidence), validatedFactIds: [...c.validatedFactIds],
    checks: [{ id: "fixture-scientific-check", kind: "offline-ASM-reconciliation-fixture", outcome: "pass", evidenceDigest: fingerprint(c.evidence), detail: "Executed deterministic fixture check by the trusted host; NOT native scientific verification" }] };
}

/** Complete L1 graphViolations oracle (graph-contract.test.ts), kept independent
 * of the production owned-function projection guard. */
function oracleGraphViolations(doc: any): string[] {
  const addr = (value: unknown): bigint | null => typeof value === "string" && /^0x[0-9A-F]+$/.test(value) && !(value.length > 3 && value[2] === "0") ? BigInt(value) : null;
  const compareAddr = (a: string, b: string): number => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;
  const compareFn = (a: string, b: string): number => {
    const split = (id: string) => { const i = id.lastIndexOf(":0x"); return i < 0 ? null : [id.slice(0, i), id.slice(i + 1)]; };
    const left = split(a), right = split(b);
    if (!left || !right) return a < b ? -1 : a > b ? 1 : 0;
    return left[0] !== right[0] ? left[0]! < right[0]! ? -1 : 1 : compareAddr(left[1]!, right[1]!);
  };
  const checkUnknownable = (value: any, path: string, violations: string[]) => {
    if (!value || typeof value !== "object" || !("known" in value) || !("value" in value)) return;
    if (value.known === false && value.value !== null) violations.push(`${path} unknown metric encoded as a value`);
    if (value.known === true && (typeof value.value !== "number" || value.value < 0)) violations.push(`${path} known metric missing a non-negative value`);
    if (value.known === false && value.value === 0) violations.push(`${path} uses zero as unknown`);
  };
  const KIND_ORDER = ["direct_call", "tail_jump", "indirect_resolved", "thunk", "callback_candidate"], CODE_KINDS = new Set(KIND_ORDER.slice(0, 4));
  const violations: string[] = [], { normalizedFingerprint: _fingerprint, ...content } = doc;
  if (doc.normalizedFingerprint !== hash(canonical(content))) violations.push("normalizedFingerprint mismatch");
  if (doc.scope.functionCount !== doc.nodes.length) violations.push("functionCount mismatch");
  if (doc.coverage.selfLoopsPreserved !== true) violations.push("self-loop preservation is required");
  if (doc.coverage.status === "complete" && doc.coverage.uncoveredReason !== null) violations.push("complete coverage cannot carry an uncovered reason");
  if (doc.coverage.status !== "complete" && (typeof doc.coverage.uncoveredReason !== "string" || doc.coverage.uncoveredReason.length === 0)) violations.push("partial or diagnostic coverage needs an explicit reason");
  const nodeIds = new Set(doc.nodes.map((n: any) => n.id)), objectIds = new Set(doc.objects.map((o: any) => o.id)), artifacts = new Map(doc.binaryArtifacts.map((a: any) => [a.contentSha256, a]));
  for (let i = 1; i < doc.nodes.length; i++) if (compareFn(doc.nodes[i - 1].id, doc.nodes[i].id) > 0) violations.push("nodes are not canonically ordered");
  for (const node of doc.nodes) {
    const rva = addr(node.rva), ea = addr(node.ea), base = addr(node.imageBase);
    if (rva === null || rva <= 0n) violations.push(`function RVA is zero or uncanonical: ${node.rva}`);
    if (ea === null || ea <= 0n) violations.push(`function EA is zero or uncanonical: ${node.ea}`);
    if (base === null || rva === null || ea === null || ea !== base + rva) violations.push(`EA is not imageBase + RVA for ${node.id}`);
    if (node.id !== `${node.moduleSha256}:${node.rva}`) violations.push(`function id is not module hash + RVA: ${node.id}`);
    if (!/^[a-f0-9]{64}$/.test(node.moduleSha256)) violations.push("module hash is not lowercase sha256");
    const artifact = artifacts.get(node.moduleSha256) as any;
    if (!artifact || artifact.imageBase !== node.imageBase) violations.push(`node image base does not match its artifact: ${node.id}`);
    checkUnknownable(node.sizeBytes, `${node.id}.sizeBytes`, violations);
    checkUnknownable(node.instructionCount, `${node.id}.instructionCount`, violations);
    checkUnknownable(node.basicBlockCount, `${node.id}.basicBlockCount`, violations);
    if (node.admissibleAsOracle !== false) violations.push("oracle admission is forbidden in v1");
    if (node.status === "quarantined" && ["reconciled", "published-local"].includes(node.semanticMaturity)) violations.push("quarantined node cannot be semantically published");
    const div = node.byteDivergence;
    if (div.known === false && (div.peMismatchByteCount !== null || div.frozenSha256 !== null || div.peSha256 !== null || node.byteAgreement !== "unknown")) violations.push("unknown byte divergence is not explicit");
    if (div.known === true && div.peMismatchByteCount === 0 && node.byteAgreement !== "concordant") violations.push("known zero mismatches must be concordant, not unknown");
    if (div.known === true && div.peMismatchByteCount > 0) {
      if (node.byteAgreement !== "divergent" || node.status !== "quarantined") violations.push("divergent bytes must be quarantined");
      if (div.frozenSha256 === div.peSha256 || !/^[a-f0-9]{64}$/.test(div.frozenSha256 ?? "") || !/^[a-f0-9]{64}$/.test(div.peSha256 ?? "")) violations.push("divergent citation needs two distinct hashes");
    }
  }
  for (let i = 1; i < doc.edges.length; i++) {
    const prev = doc.edges[i - 1], next = doc.edges[i];
    const cmp = compareFn(prev.sourceId, next.sourceId) || compareFn(prev.destinationId, next.destinationId) || KIND_ORDER.indexOf(prev.kind) - KIND_ORDER.indexOf(next.kind) || compareAddr(prev.sites[0].siteRva, next.sites[0].siteRva);
    if (cmp > 0) violations.push("edges are not canonically ordered");
  }
  for (const edge of doc.edges) {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.destinationId)) violations.push(`edge endpoint is not a function: ${edge.id}`);
    if (objectIds.has(edge.destinationId) || objectIds.has(edge.sourceId)) violations.push("data object used as a callee");
    if (edge.direction !== "source_to_destination") violations.push("call direction reversed");
    if (edge.kind === "callback_candidate") {
      if (edge.status === "observed" || edge.status === "validated" || edge.schedulerRelevance !== "hypothesis_not_call") violations.push("callback candidate promoted toward a call");
      if (edge.sites.some((site: any) => site.xrefType !== "data")) violations.push("callback candidate has a code site");
    }
    if (CODE_KINDS.has(edge.kind) && edge.sites.some((site: any) => site.xrefType !== "code")) violations.push("code edge has a DATA site");
    for (const site of edge.sites) if (addr(site.siteRva) === null || addr(site.siteRva)! <= 0n) violations.push("edge site RVA is zero");
  }
  for (const object of doc.objects) {
    if (nodeIds.has(object.id)) violations.push("object id collides with a function id");
    if (object.kind === "import" && object.rva !== null) violations.push("pure import must not be given a fake local RVA in this fixture shape");
    if (object.rva !== null && (addr(object.rva) === null || addr(object.rva)! <= 0n)) violations.push("object RVA is zero");
    checkUnknownable(object.widthBytes, object.id, violations);
  }
  for (const item of doc.unresolved) {
    if (item.fabricatedFunction !== false) violations.push("fabricated function");
    if (!nodeIds.has(item.fromFunctionId)) violations.push("unresolved reference has no source function");
    if (addr(item.siteRva) === null || addr(item.siteRva)! <= 0n) violations.push("unresolved site is zero");
    if (item.referencedObjectId !== null && !objectIds.has(item.referencedObjectId)) violations.push("unresolved object missing");
    if (item.kind === "data_xref" && item.provenance.xrefType !== "data") violations.push("DATA xref provenance is not data");
  }
  return violations;
}
function projectionSetup({ rva = "0x0", imageBase = "0x400000", architecture = "x86-32", ea, sizeBytes = 16, unownedZero = false }: { rva?: string; imageBase?: string; architecture?: "x86-32" | "x86-64"; ea?: string; sizeBytes?: number; unownedZero?: boolean } = {}): Setup {
  const s = setup(), snapshot = structuredClone(s.snapshot), hex = (n: bigint) => `0x${n.toString(16).toUpperCase()}`;
  snapshot.snapshotId += ":rva-boundary"; snapshot.nodes = snapshot.nodes.slice(0, 1); snapshot.edges = []; snapshot.objects = []; snapshot.unresolved = []; snapshot.capabilities = [];
  const node = snapshot.nodes[0]; Object.assign(node, { id: `${node.moduleSha256}:${rva}`, rva, imageBase, ea: ea ?? hex(BigInt(imageBase) + BigInt(rva)), sizeBytes: { known: true, value: sizeBytes }, boundaries: [{ ordinal: 0, rva, endRvaExclusive: hex(BigInt(rva) + BigInt(sizeBytes)), role: "entry" }] });
  Object.assign(snapshot.binaryArtifacts[0], { imageBase, architecture, format: architecture === "x86-32" ? "PE32" : "PE32+" });
  if (unownedZero) snapshot.nodes.unshift({ ...structuredClone(node), id: `${node.moduleSha256}:0x0`, rva: "0x0", ea: imageBase, boundaries: [{ ordinal: 0, rva: "0x0", endRvaExclusive: "0x10", role: "entry" }] });
  snapshot.scope.functionCount = snapshot.nodes.length;
  const { normalizedFingerprint: _old, ...content } = snapshot; snapshot.normalizedFingerprint = hash(canonical(content));
  const partition = structuredClone(s.partition); Object.assign(partition, { partitionId: `${partition.partitionId}:rva-boundary`, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint });
  const memberIds = snapshot.nodes.map((n: any) => n.id); Object.assign(partition.communities[0], { memberIds, kernelIds: memberIds, externalContextIds: [], contentId: fingerprint({ algorithm: partition.algorithm, algorithmVersion: partition.algorithmVersion, configFingerprint: partition.configFingerprint, memberIds }) });
  s.graph.putSnapshot(s.authority, snapshot); s.graph.putPartition(s.authority, partition);
  return { ...s, snapshot, partition };
}

describe("RV6V6-01 positive owned-function RVA boundary", () => {
  test("complete one-node RVA-zero snapshot has exactly the L1 RVA error and cannot reach admission or I/O", async () => {
    const s = projectionSetup(), u = unit(s), before = s.graph.events.read("m"); let sends = 0;
    expect(() => validateGraphDocument("graph-snapshot", s.snapshot)).not.toThrow();
    expect(oracleGraphViolations(s.snapshot)).toEqual(["function RVA is zero or uncanonical: 0x0"]);
    expect(s.snapshot.nodes[0].ea).toBe("0x400000"); expect(s.snapshot.nodes[0].boundaries).toEqual([{ ordinal: 0, rva: "0x0", endRvaExclusive: "0x10", role: "entry" }]);
    expect(s.snapshot.nodes).toHaveLength(1); expect(s.snapshot.edges).toEqual([]);
    await expect((async () => {
      s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), request = body(u, "A");
      s.graph.prepareAdmission(s.authority, lease, request);
      await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { sends++; return { executionId: request.executionId, state: "accepted" }; } });
    })()).rejects.toThrow(/noncanonical module-hash\/RVA/);
    expect(sends).toBe(0); expect(s.graph.events.read("m")).toEqual(before);
    for (const table of ["ff8_graph_units", "ff8_unit_leases", "ff8_unit_claims", "ff8_graph_input_pins", "ff8_graph_outbox"]) expect(s.graph.db.query(`SELECT count(*) n FROM ${table}`).get()).toEqual({ n: 0 });
  });
  test("imported OWN6 zero unit fails common projection, reserve and primitive without acquiring claims, also after reopen", () => {
    const s = projectionSetup(), u = unit(s);
    s.graph.db.query("INSERT INTO ff8_graph_units(mission,unit_id,document,digest,state) VALUES(?,?,?,?,?)").run("m", u.unitId, canonical(u), fingerprint(u), u.state);
    s.graph.events.append("m", `unit:${u.unitId}`, "unit_added", s.authority.now, u, u.unitId);
    const expected = freeze(s.graph, s.authority, [u.unitId], {}, [u]), before = s.graph.events.read("m");
    for (let pass = 0; pass < 2; pass++) {
      expect(() => assertCanonicalUnitProjection(s.graph.db, "m", u)).toThrow(/canonical EA\/imageBase\/RVA/);
      expect(() => s.graph.reserve(s.authority, u.unitId, 100, expected)).toThrow(/canonical EA\/imageBase\/RVA/);
      expect(() => s.graph.leases.reserve(s.authority, u.unitId, [`fn:${u.ownedFunctionIds[0]}`], 100, expected)).toThrow(/canonical EA\/imageBase\/RVA/);
      expect(s.graph.leases.get("m", u.unitId)).toBeNull(); expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get()).toEqual({ n: 0 });
      expect(s.graph.events.read("m")).toEqual(before);
      if (pass === 0) { s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); }
    }
    expect(s.graph.db.query("SELECT document,digest FROM ff8_graph_units WHERE unit_id=?").get(u.unitId)).toEqual({ document: canonical(u), digest: fingerprint(u) });
    expect(s.graph.db.query("SELECT version FROM ff8_graph_metadata").get()).toEqual({ version: 6 });
  });
  test("legacy zero active family cannot pin, prepare or reuse durable admission after reopen; history and claims survive", async () => {
    const s = projectionSetup(), u = unit(s), request = body(u, "A"), sub = u.subIntents[0]!, inputs = inputsFor(sub);
    s.graph.db.query("INSERT INTO ff8_graph_units(mission,unit_id,document,digest,state) VALUES(?,?,?,?,?)").run("m", u.unitId, canonical(u), fingerprint(u), "RESERVED");
    s.graph.events.append("m", `unit:${u.unitId}`, "unit_added", s.authority.now, u, u.unitId);
    const expected = freeze(s.graph, s.authority, [u.unitId], {}, [u]);
    const lease: UnitLease = { missionId: "m", unitId: u.unitId, owner: s.authority.lease.owner, token: 1, expiresAtEvent: 1000, state: "active", resourceKeys: [`fn:${u.ownedFunctionIds[0]}`] };
    s.graph.db.query("INSERT INTO ff8_unit_leases VALUES(?,?,?,?,?,?,?)").run("m", u.unitId, lease.owner, lease.token, lease.expiresAtEvent, lease.state, canonical(lease.resourceKeys));
    s.graph.db.query("INSERT INTO ff8_unit_claims VALUES(?,?,?,?)").run(lease.resourceKeys[0]!, "m", u.unitId, lease.token);
    s.graph.events.append("m", `reserve:${u.unitId}:${lease.token}`, "unit_reserved", s.authority.now, { lease, controllerToken: s.authority.lease.token, bindingFingerprint: expected.bindingFingerprint }, u.unitId);
    const beforePin = s.graph.events.read("m");
    expect(() => s.graph.freezeAdmissionInputs(s.authority, lease, sub.subIntentId, inputs)).toThrow(/canonical EA\/imageBase\/RVA/);
    expect(() => s.graph.prepareAdmission(s.authority, lease, request)).toThrow(/canonical EA\/imageBase\/RVA/);
    expect(s.graph.events.read("m")).toEqual(beforePin); expect(s.graph.admission(request.executionId)).toBeNull();
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_input_pins").get()).toEqual({ n: 0 });
    // Import the independently pinned, prepared rows an older writer could emit.
    const pin = { version: 1, missionId: "m", unitId: u.unitId, familyToken: lease.token, controllerToken: s.authority.lease.token, missionRevision: expected.missionRevision, bindingFingerprint: expected.bindingFingerprint, planFingerprint: expected.planFingerprint, snapshotId: u.snapshotId, partitionId: u.partitionId, knowledgeRevision: u.knowledgeRevision, subIntentId: sub.subIntentId, functionId: sub.functionId, role: sub.role, inputFingerprint: fingerprint(inputs), inputs, inputVersions: [] };
    const eventKey = `input_pin:${u.unitId}:${lease.token}:${sub.subIntentId}`, digest = fingerprint(request);
    s.graph.db.query("INSERT INTO ff8_graph_input_pins VALUES(?,?,?,?,?,?,?)").run("m", u.unitId, lease.token, sub.subIntentId, canonical(pin), fingerprint(pin), eventKey);
    s.graph.events.append("m", eventKey, "admission_inputs_frozen", s.authority.now, pin, u.unitId);
    s.graph.db.query("INSERT INTO ff8_graph_outbox(mission,unit_id,execution_id,sub_intent,token,body,digest,state,max_attempts,retry_delay) VALUES(?,?,?,?,?,?,?,'PREPARED',3,1000)").run("m", u.unitId, request.executionId, sub.subIntentId, lease.token, canonical(request), digest);
    s.graph.events.append("m", `admission:${request.executionId}`, "admission_prepared", s.authority.now, { body: request, digest, token: lease.token, maxAttempts: 3, retryDelayMs: 1000 }, u.unitId);
    for (const accepted of [false, true]) {
      if (accepted) {
        const receipt = { executionId: request.executionId, state: "accepted", requestDigest: digest };
        s.graph.db.query("UPDATE ff8_graph_outbox SET receipt=?,state='ACCEPTED',attempts=1 WHERE execution_id=?").run(canonical(receipt), request.executionId);
        s.graph.events.append("m", `receipt:${request.executionId}`, "admission_accepted", s.authority.now, { receipt, requestDigest: digest, token: lease.token, attempt: 1, source: "dispatch" }, u.unitId);
      }
      const before = s.graph.events.read("m"), admission = s.graph.admission(request.executionId);
      s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); let sends = 0;
      await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { sends++; return { executionId: request.executionId, state: "accepted" }; } })).rejects.toThrow(/canonical EA\/imageBase\/RVA/);
      expect(() => s.graph.unit("m", u.unitId)).toThrow(/canonical EA\/imageBase\/RVA/);
      expect(sends).toBe(0); expect(s.graph.admission(request.executionId)).toEqual(admission); expect(s.graph.events.read("m")).toEqual(before);
      expect(s.graph.leases.get("m", u.unitId)).toEqual(lease); expect(s.graph.db.query("SELECT resource_key FROM ff8_unit_claims").all()).toEqual([{ resource_key: lease.resourceKeys[0] }]);
    }
  });
  test("positive canonical RVAs, zero image base and x86 width endpoints remain admissible across reopen", async () => {
    for (const options of [
      { rva: "0x1" }, { rva: "0xA", imageBase: "0x0" }, { rva: "0xFFFFFFFF", imageBase: "0x0", sizeBytes: 1 },
      { rva: "0x100000000", imageBase: "0x0", architecture: "x86-64" as const },
      { rva: "0xFFFFFFFFFFFFFFEF", imageBase: "0x0", architecture: "x86-64" as const },
      { rva: "0x1", imageBase: "0xFFFFFFFFFFFFFFFE", architecture: "x86-64" as const },
    ]) {
      const s = projectionSetup(options), u = unit(s); expect(oracleGraphViolations(s.snapshot)).toEqual([]);
      s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
      s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); let sends = 0;
      const client = { async submit() { sends++; return { executionId: request.executionId, state: "accepted", requestDigest: fingerprint(request) }; } };
      const receipt = await s.graph.dispatch(s.authority, lease, request.executionId, client); expect(await s.graph.dispatch(s.authority, lease, request.executionId, client)).toEqual(receipt);
      expect(sends).toBe(1); expect(s.graph.leases.get("m", u.unitId)!.resourceKeys).toEqual([`fn:${u.ownedFunctionIds[0]}`]);
    }
  });
  test("RVA, base and EA width overflow stays rejected by the existing projection/schema boundaries", () => {
    for (const options of [{ rva: "0x100000000", imageBase: "0x0" }, { rva: "0x1", imageBase: "0x100000000" }, { rva: "0x1", imageBase: "0xFFFFFFFF" }]) {
      const s = projectionSetup(options), before = s.graph.events.read("m"); expect(() => s.graph.addUnit(s.authority, unit(s))).toThrow(/canonical EA\/imageBase\/RVA/);
      expect(s.graph.events.read("m")).toEqual(before); expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get()).toEqual({ n: 0 });
    }
    for (const options of [{ rva: "0x10000000000000000", imageBase: "0x0" }, { rva: "0x1", imageBase: "0x10000000000000000" }, { rva: "0x1", imageBase: "0xFFFFFFFFFFFFFFFF" }]) expect(() => projectionSetup({ ...options, architecture: "x86-64" })).toThrow(/text bounds/);
  });
  test("zero aliases, leading zeros and lowercase remain noncanonical without banning canonical base zero", () => {
    for (const rva of ["0x00", "0x01", "0x0A", "0xa"]) {
      const s = projectionSetup({ rva }), u = unit(s); expect(() => s.graph.addUnit(s.authority, u)).toThrow(/noncanonical module-hash\/RVA/);
      expect(() => assertCanonicalUnitProjection(s.graph.db, "m", u)).toThrow(/noncanonical projection address/);
    }
    for (const options of [{ rva: "0x1", imageBase: "0x00" }, { rva: "0x1", ea: "0x0400001" }]) {
      const s = projectionSetup(options); expect(() => s.graph.addUnit(s.authority, unit(s))).toThrow(/noncanonical projection address/);
    }
  });
  test("the owned-function gate does not invent a whole-snapshot or context admission rule", () => {
    for (const context of [false, true]) {
      const s = projectionSetup({ rva: "0x100", unownedZero: true }), u = unit(s, "positive", 1);
      if (context) u.contextFunctionIds = [s.snapshot.nodes[0].id];
      expect(oracleGraphViolations(s.snapshot)).toEqual(["function RVA is zero or uncanonical: 0x0"]);
      expect(() => assertCanonicalUnitProjection(s.graph.db, "m", u)).not.toThrow(); s.graph.addUnit(s.authority, u);
      expect(reserve(s.graph, s.authority, u.unitId).resourceKeys).toEqual([`fn:${u.ownedFunctionIds[0]}`]);
    }
  });
});

describe("RV6R2 canonical projection and immutable callback boundaries", () => {
  test("two owned RVAs cannot declare the same native EA or a foreign module/version", () => {
    const s = setup(), wrong = unit(s, "wrong", 0), correct = unit(s, "correct", 1);
    for (const identity of [correct.subIntents[0]!.harnessIdentity, { ...wrong.subIntents[0]!.harnessIdentity, sha256: "0".repeat(64) }, { ...wrong.subIntents[0]!.harnessIdentity, version: "declared-fallback" }]) {
      const attack = structuredClone(wrong); attack.subIntents.forEach(sub => sub.harnessIdentity = structuredClone(identity));
      expect(() => s.graph.addUnit(s.authority, attack)).toThrow(/canonical function projection/);
    }
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_units").get()).toEqual({ n: 0 });
    s.graph.addUnit(s.authority, correct); expect(reserve(s.graph, s.authority, correct.unitId).resourceKeys).toEqual([`fn:${correct.ownedFunctionIds[0]}`]);
  });
  test("missing/ambiguous canonical module, unknown architecture and EA arithmetic fail closed", () => {
    for (const mutate of [
      (s: any) => s.binaryArtifacts[0].contentSha256 = "0".repeat(64),
      (s: any) => s.binaryArtifacts.push(structuredClone(s.binaryArtifacts[0])),
      (s: any) => s.binaryArtifacts[0].architecture = "unknown",
      (s: any) => s.nodes[0].ea = s.nodes[1].ea,
      (s: any) => s.nodes[0].imageBase = "0x500000",
    ]) {
      const s = setup(), snapshot = structuredClone(s.snapshot); snapshot.snapshotId += ":bad"; mutate(snapshot);
      const partition = { ...s.partition, partitionId: "part:bad", snapshotId: snapshot.snapshotId };
      s.graph.putSnapshot(s.authority, snapshot); s.graph.putPartition(s.authority, partition);
      const u = { ...unit(s), snapshotId: snapshot.snapshotId, partitionId: partition.partitionId };
      expect(() => s.graph.addUnit(s.authority, u)).toThrow(/canonical|projection/);
      expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get()).toEqual({ n: 0 });
    }
  });
  test("legacy self-consistent forged units are refused by lease primitive, pin and reopened dispatch", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const expected = freeze(s.graph, s.authority, [u.unitId]);
    const lease = s.graph.reserve(s.authority, u.unitId, 1000, expected); pinUnit(s.graph, s.authority, lease);
    const request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    const forged = structuredClone(u); forged.subIntents.forEach(sub => sub.harnessIdentity.ea = s.snapshot.nodes[1].ea);
    s.graph.db.query("UPDATE ff8_graph_units SET document=?,digest=? WHERE unit_id=?").run(canonical(forged), fingerprint(forged), u.unitId);
    expect(() => s.graph.freezeAdmissionInputs(s.authority, lease, forged.subIntents[0]!.subIntentId, inputsFor(forged.subIntents[0]!))).toThrow(/canonical function projection/);
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); let sends = 0;
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { sends++; return {}; } })).rejects.toThrow(/canonical function projection/);
    expect(sends).toBe(0); expect(s.graph.leases.get("m", u.unitId)!.state).toBe("active");
    s.graph.db.query("UPDATE ff8_graph_units SET state='READY' WHERE unit_id=?").run(u.unitId);
    expect(() => s.graph.leases.reserve(s.authority, u.unitId, [`fn:${u.ownedFunctionIds[0]}`], 100, expected)).toThrow(/canonical function projection/);
  });
  test("native callbacks cannot mutate validated checks, evidence, authority or previously returned identities", async () => {
    const host = parentHost(); let request: ParentAttestationRequest, originalAuthority: ControllerAuthority, lastNative: NativeAuthorIdentity | undefined;
    host.provider.verifyNativeAuthor = (authority, expected) => {
      (request.checks[0] as any).outcome = "fail"; request.evidence.splice(0); request.validatedFactIds[0] = "fact:mutated";
      authority.lease.owner = "mutated-copy"; originalAuthority.lease.owner = "mutated-original";
      if (lastNative) lastNative.model.id = "mutated-returned-object";
      lastNative = host.authors.get(expected.executionId); return lastNative;
    };
    const s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = publication(s, u, ids);
    host.populate(s, lease); request = attestationRequest(s, u, lease, ids, c); const before = structuredClone(request); originalAuthority = s.authority;
    const attestation = s.graph.recordParentAttestation(s.authority, lease, request); s.authority.lease.owner = "controller";
    expect((request.checks[0] as any).outcome).toBe("fail"); expect(attestation.checks).toEqual(before.checks); expect(attestation.validatedFactIds).toEqual(before.validatedFactIds);
    expect(attestation.evidenceDigest).toBe(fingerprint(before.evidence)); expect(s.graph.parentAttestation("m", attestation.attestationId)).toEqual(attestation);
    s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentAttestationId: attestation.attestationId });
    expect(s.graph.unit("m", u.unitId).state).toBe("VALIDATING");
  });
});

describe("OWN graph persistence, additive migration and journal", () => {
  test("same engine DB, preserves Store CAS/history and metadata version", () => {
    const s = setup(); s.graph.addUnit(s.authority, unit(s));
    expect(s.store.commit(empty(), 0, s.authority.lease, 12).revision).toBe(1);
    expect(s.graph.db.query("SELECT version FROM ff8_harness_metadata WHERE component='engine'").get()).toEqual({ version: 1 });
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_history").get()).toEqual({ n: 2 });
    expect(s.graph.unit("m", "unit").ownedFunctionIds).toEqual([s.snapshot.nodes[0].id]);
  });
  test("refuses Ensemble paths, foreign schemas, forged metadata and newer extension", () => {
    const p = path(); expect(() => new GraphStore(join(p, "..", "ensemble.db"))).toThrow(/ensemble/);
    const db = new Database(p); db.exec("CREATE TABLE alien(value TEXT)"); db.close();
    expect(() => new GraphStore(p)).toThrow(/foreign/);
    const forged = new Database(p); forged.exec("CREATE TABLE ff8_harness_metadata(component TEXT PRIMARY KEY,version INTEGER); INSERT INTO ff8_harness_metadata VALUES('engine',1)"); forged.close();
    expect(() => new GraphStore(p)).toThrow(/foreign/);
    const s = setup(); s.graph.db.exec("UPDATE ff8_graph_metadata SET version=99"); expect(() => new GraphStore(s.p)).toThrow(/unsupported graph/);
  });
  test("v1 additive upgrade and reopen do not erase own rows", () => {
    const p = path(), store = new Store(p); opened.push(store); store.create(empty());
    const prior = new Database(p); prior.exec("CREATE TABLE ff8_graph_metadata(id INTEGER PRIMARY KEY,version INTEGER); INSERT INTO ff8_graph_metadata VALUES(1,1); CREATE TABLE ff8_graph_snapshots(id TEXT PRIMARY KEY,digest TEXT NOT NULL,document TEXT NOT NULL); INSERT INTO ff8_graph_snapshots VALUES('historical','digest','{}')"); prior.close();
    const graph = new GraphStore(p); opened.push(graph); expect(graph.db.query("SELECT document FROM ff8_graph_snapshots WHERE id='historical'").get()).toEqual({ document: "{}" });
    graph.close(); const reopened = new GraphStore(p); opened.push(reopened); expect(reopened.db.query("SELECT version FROM ff8_graph_metadata").get()).toEqual({ version: 6 });
    expect(store.load("m").revision).toBe(0);
  });
  test("immutable documents, canonical identity, exact schema and partition binding", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    s.graph.addUnit(s.authority, structuredClone(u));
    expect(() => s.graph.addUnit(s.authority, { ...u, knowledgeRevision: 2 })).toThrow(/immutable/);
    const other = unit(s, "invalid"); other.ownedFunctionIds[0] = "x".repeat(64) + ":0x1000"; expect(() => s.graph.addUnit(s.authority, other)).toThrow(/canonical/);
    expect(() => s.graph.putPartition(s.authority, { ...s.partition, partitionId: "wrong", snapshotFingerprint: "0".repeat(64) })).toThrow(/fingerprint/);
    expect(() => s.graph.addUnit(s.authority, { ...unit(s, "x"), extraProperty: true } as WorkUnit)).toThrow(/unexpected/);
  });
  test("RV6M-01 same snapshot/partition at a new time and after controller reopen are audit-preserving no-ops", () => {
    const s = setup(), original = s.graph.events.read("m"), cursor = s.graph.events.cursor("m");
    const later = { ...s.authority, now: 12 };
    s.graph.putSnapshot(later, structuredClone(s.snapshot)); s.graph.putPartition(later, structuredClone(s.partition));
    expect(s.graph.events.read("m")).toEqual(original); expect(s.graph.events.cursor("m")).toEqual(cursor);
    const next = { lease: s.store.acquireLease("m", "new-controller", s.authority.lease.expiresAt + 1, 10000), now: s.authority.lease.expiresAt + 2 };
    expect(() => s.graph.putSnapshot(later, s.snapshot)).toThrow(/controller/);
    expect(() => s.graph.putPartition(later, s.partition)).toThrow(/controller/);
    s.graph.close(); const reopened = new GraphStore(s.p); opened.push(reopened);
    reopened.putSnapshot(next, structuredClone(s.snapshot)); reopened.putPartition(next, structuredClone(s.partition));
    expect(reopened.events.read("m")).toEqual(original); expect(reopened.events.cursor("m")).toEqual(cursor);
    expect(original.map(e => e.time)).toEqual([11, 11]);
    expect(() => reopened.putSnapshot(next, { ...s.snapshot, normalizedFingerprint: "0".repeat(64) })).toThrow(/immutable/);
    expect(() => reopened.putPartition(next, { ...s.partition, seed: s.partition.seed + 1 })).toThrow(/immutable/);
    expect(reopened.events.read("m")).toEqual(original);
    expect(() => reopened.events.append("m", `snapshot:${s.snapshot.snapshotId}`, "snapshot_stored", next.now, s.snapshot)).toThrow(/idempotency/);
    expect(() => reopened.events.append("m", `snapshot:${s.snapshot.snapshotId}`, "changed-kind", 11, s.snapshot)).toThrow(/idempotency/);
    expect(() => reopened.events.append("m", `snapshot:${s.snapshot.snapshotId}`, "snapshot_stored", 11, s.snapshot, "unit")).toThrow(/idempotency/);
    expect(reopened.replay("m").sequence).toBe(cursor.sequence);
  });
  test("journal counters, CAS, digest idempotency, corruption detection and exact replay", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    const before = s.graph.events.cursor("m"); const event = s.graph.events.append("m", "aging", "aging", 12, { age: 3 }, u.unitId, before.sequence);
    expect(s.graph.events.append("m", "aging", "aging", 12, { age: 3 }, u.unitId)).toEqual(event);
    expect(() => s.graph.events.append("m", "aging", "aging", 12, { age: 4 }, u.unitId)).toThrow(/idempotency/);
    expect(() => s.graph.events.append("m", "new", "aging", 12, {}, u.unitId, before.sequence)).toThrow(/revision/);
    expect(() => s.graph.events.append("m", "backwards", "aging", 1, {})).toThrow(/backwards/);
    const replay = s.graph.replay("m"); s.graph.close(); const again = new GraphStore(s.p); opened.push(again); expect(again.replay("m")).toEqual(replay);
    again.db.exec("UPDATE ff8_events SET digest='altered' WHERE key='aging'"); expect(() => again.replay("m")).toThrow(/corrupt/);
  });
});

describe("canonical family exclusivity and fenced execution", () => {
  test("two connections and changed partition cannot acquire the same function", () => {
    const s = setup(), a = unit(s, "one"), b = unit(s, "two"); s.graph.addUnit(s.authority, a);
    const partition = { ...s.partition, partitionId: "part:new" }; s.graph.putPartition(s.authority, partition); b.partitionId = partition.partitionId; s.graph.addUnit(s.authority, b);
    const second = new GraphStore(s.p); opened.push(second); reserve(s.graph, s.authority, a.unitId);
    expect(() => reserve(second, s.authority, b.unitId)).toThrow(/owned/);
    expect(second.unit("m", b.unitId).state).toBe("READY");
  });
  test("actual concurrent SQLite processes have exactly one reservation winner", async () => {
    const s = setup(); s.graph.addUnit(s.authority, unit(s, "left")); s.graph.addUnit(s.authority, unit(s, "right"));
    const expected = freeze(s.graph, s.authority, ["left", "right"]);
    const moduleUrl = pathToFileURL(join(import.meta.dir, "..", "src", "graph-store.ts")).href;
    const run = (id: string) => {
      const code = `import {GraphStore} from ${JSON.stringify(moduleUrl)}; const g=new GraphStore(${JSON.stringify(s.p)}); try {g.reserve(${JSON.stringify(s.authority)},${JSON.stringify(id)},100,${JSON.stringify(expected)}); console.log('won');} catch(e) { console.log('lost:'+e.message); } finally {g.close();}`;
      const child = Bun.spawn([process.execPath, "-e", code], { cwd: join(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" });
      return Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    };
    const results = await Promise.all([run("left"), run("right")]); expect(results.map(r => r[1])).toEqual(["", ""]); expect(results.every(r => r[2] === 0)).toBe(true);
    expect(results.filter(r => (r[0] as string).trim() === "won")).toHaveLength(1);
    expect((s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get() as { n: number }).n).toBe(1);
  });
  test("resource exclusivity is independent of function and partition", () => {
    const s = setup(), a = unit(s, "a", 0), b = unit(s, "b", 1);
    a.conflicts = b.conflicts = [{ id: "file", kind: "non_isolated_file", resourceKey: "file:canonical-shared", withUnitId: null }];
    s.graph.addUnit(s.authority, a); s.graph.addUnit(s.authority, b); reserve(s.graph, s.authority, a.unitId);
    expect(() => reserve(s.graph, s.authority, b.unitId)).toThrow(/owned/);
  });
  test("atomic prerequisite recheck rejects insufficient publication and unknown producers", () => {
    const s = setup(), u = unit(s, "consumer", 1, "BLOCKED");
    u.prerequisites = [{ id: "must", kind: "obligatory", producerUnitId: "producer", requiredPublicationLevel: 2, artifactKind: "validated_knowledge", dispensed: false, dispensationReason: null }];
    s.graph.addUnit(s.authority, u);
    expect(() => s.graph.transition(s.authority, u.unitId, "READY", "test")).toThrow(/unsatisfied/);
    expect(s.graph.leases.get("m", u.unitId)).toBeNull(); expect(() => reserve(s.graph, s.authority, u.unitId)).toThrow(/READY/);
  });
  test("controller attach fences the old owner without stealing its running family", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId);
    const fresh = { lease: s.store.acquireLease("m", "controller", 12, 10000), now: 13 };
    expect(() => s.graph.prepareAdmission(s.authority, lease, body(u, "A"))).toThrow(/controller/);
    expect(() => s.graph.prepareAdmission(fresh, lease, body(u, "A"))).toThrow(/controller fence/);
    expect(s.graph.leases.get("m", u.unitId)!.token).toBe(lease.token);
  });
  test("heartbeat bounded; expiry fences commit but worker may run, no automatic redispatch", async () => {
    const s = setup(), u = unit(s), next = unit(s, "next"); s.graph.addUnit(s.authority, u); s.graph.addUnit(s.authority, next);
    const lease = reserve(s.graph, s.authority, u.unitId, 10), b = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, b);
    await s.graph.dispatch(s.authority, lease, b.executionId, { async submit() { return { executionId: b.executionId, state: "accepted" }; } });
    expect(() => s.graph.leases.heartbeat(s.authority, lease, 10001)).toThrow(/bound/);
    const renewed = s.graph.leases.heartbeat(s.authority, lease, 10); s.graph.tick(s.authority, "heartbeat-lost", 12);
    const fenced = s.graph.expire(s.authority, u.unitId); expect(fenced.token).toBeGreaterThan(renewed.token);
    expect(s.graph.unit("m", u.unitId).state).toBe("QUARANTINED");
    expect(() => reserve(s.graph, s.authority, next.unitId)).toThrow(/owned/);
    expect(() => s.graph.releaseQuarantine(s.authority, u.unitId)).toThrow(/active/);
    expect(() => s.graph.leases.releaseProven(s.authority, fenced)).toThrow(/quiescence/);
    s.graph.proveTerminal(s.authority, u.unitId, b.executionId, "completed", proof(s.graph, b.executionId));
    expect(s.graph.retainResult(s.authority, lease, b.executionId, "late", { result: "late" })).toBe(false);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    s.graph.releaseQuarantine(s.authority, u.unitId); const newLease = reserve(s.graph, s.authority, next.unitId); expect(newLease.token).toBeGreaterThan(fenced.token);
    expect(s.graph.unit("m", u.unitId).state).toBe("QUARANTINED");
  });
});

describe("durable admissions at crash and ambiguous response boundaries", () => {
  test("complete request before effects, immutable digest, crash before send/reopen", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), b = body(u, "A");
    expect(() => s.graph.prepareAdmission(s.authority, lease, { ...b, command: {} })).toThrow(/complete/);
    const huge = { ...b, command: { ...b.command, prompt: "🙂".repeat(10000) } };
    expect(() => s.graph.prepareAdmission(s.authority, lease, huge)).toThrow(/UTF-8 byte budget/);
    s.graph.prepareAdmission(s.authority, lease, b); expect(s.graph.admission(b.executionId)!.attempts).toBe(0);
    expect(() => s.graph.prepareAdmission(s.authority, lease, { ...b, command: { ...b.command, prompt: "changed" } })).toThrow(/idempotency/);
    s.graph.close(); const reopened = new GraphStore(s.p); opened.push(reopened); let calls = 0;
    await reopened.dispatch(s.authority, lease, b.executionId, { async submit(_mission, command) { calls++; expect(command).toEqual(b.command); return { executionId: b.executionId, state: "accepted" }; } }); expect(calls).toBe(1);
    await reopened.dispatch(s.authority, lease, b.executionId, { async submit() { throw new Error("duplicate effect"); } });
    expect(reopened.admission(b.executionId)!.attempts).toBe(1);
  });
  test("response lost after native acceptance: no retry until authoritative reconciliation", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), b = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, b); let calls = 0;
    const transport = { async submit() { calls++; throw new Error("response lost"); } };
    await expect(s.graph.dispatch(s.authority, lease, b.executionId, transport)).rejects.toThrow(/lost/);
    await expect(s.graph.dispatch(s.authority, lease, b.executionId, transport)).rejects.toThrow(/ambiguous/); expect(calls).toBe(1);
    s.graph.close(); const reopened = new GraphStore(s.p); opened.push(reopened);
    reopened.reconcileAdmission(s.authority, lease, { executionId: b.executionId, requestDigest: fingerprint(b), state: "accepted", receipt: { executionId: b.executionId, state: "accepted", nativeSessionId: "session-1" }, proof: "transactional native execution snapshot" });
    await reopened.dispatch(s.authority, lease, b.executionId, transport); expect(calls).toBe(1); expect(reopened.unit("m", u.unitId).state).toBe("RUNNING");
  });
  test("crash during SENDING conservatively blocks; unknown readback is not absence", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), b = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, b);
    s.graph.db.query("UPDATE ff8_graph_outbox SET state='SENDING',attempts=1 WHERE execution_id=?").run(b.executionId);
    s.graph.reconcileAdmission(s.authority, lease, { executionId: b.executionId, requestDigest: fingerprint(b), state: "unknown", receipt: null, proof: "outage observation" });
    await expect(s.graph.dispatch(s.authority, lease, b.executionId, { async submit() { throw new Error("not reached"); } })).rejects.toThrow(/ambiguous/);
    s.graph.reconcileAdmission(s.authority, lease, { executionId: b.executionId, requestDigest: fingerprint(b), state: "absent", receipt: null, proof: "transactional native snapshot absence with controller fencing" });
    expect(s.graph.admission(b.executionId)!.state).toBe("SENDING");
  });
  test("bounded quota retries; auth/input/schema remain permanently distinct", async () => {
    for (const category of ["auth", "input", "schema", "quota"]) {
      const s = setup(), u = unit(s, category); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), b = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, b, 2, 0);
      const client = { async submit(): Promise<Record<string, unknown>> { throw { type: "execution_rejected", category, recoverable: category === "quota" }; } };
      await expect(s.graph.dispatch(s.authority, lease, b.executionId, client)).rejects.toBeDefined();
      expect(s.graph.admission(b.executionId)!.state).toBe(category === "quota" ? "PREPARED" : "REJECTED");
      if (category === "quota") { await expect(s.graph.dispatch(s.authority, lease, b.executionId, client)).rejects.toBeDefined(); expect(s.graph.admission(b.executionId)!.state).toBe("REJECTED"); }
      await expect(s.graph.dispatch(s.authority, lease, b.executionId, client)).rejects.toThrow(/exhausted/);
      expect(s.graph.events.read("m").filter(e => e.kind === "admission_error").every(e => (e.payload as any).errorClass === category)).toBe(true);
    }
    expect(graphErrorClass({ category: "scientific_block", recoverable: false })).toBe("scientific_block"); expect(graphErrorClass(new Error("auth text is not a category"))).toBe("outage");
  });
  test("unconfirmed stop does not free the resource or admit another attempt", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), b = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, b);
    await s.graph.dispatch(s.authority, lease, b.executionId, { async submit() { return { executionId: b.executionId, state: "accepted" }; } });
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "operator stop requested; not confirmed");
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, b.executionId, "stopped", { ...proof(s.graph, b.executionId, "stop_requested"), quiescent: false })).toThrow(/terminal/);
    expect(() => s.graph.prepareAdmission(s.authority, lease, body(u, "A", "retry"))).toThrow(/stop-pending/);
    expect(() => s.graph.transition(s.authority, u.unitId, "CANCELLED", "pretend stop")).toThrow(/active family/);
  });
});

describe("validation, unit-only COMMITTED and unique durable publication", () => {
  test("A/B family parallel, R gate attributable by function, bulletin satisfies nothing", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId);
    expect(() => s.graph.prepareAdmission(s.authority, lease, body(u, "R"))).toThrow(/A\+B/);
    const a = body(u, "A"), b = body(u, "B"); s.graph.prepareAdmission(s.authority, lease, a); s.graph.prepareAdmission(s.authority, lease, b);
    for (const request of [a, b]) {
      await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return { executionId: request.executionId, state: "accepted" }; } });
      s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
      expect(s.graph.retainResult(s.authority, lease, request.executionId, `bulletin:${request.role}`, { certain: true }, "bulletin")).toBe(false);
    }
    expect(() => s.graph.prepareAdmission(s.authority, lease, body(u, "R"))).toThrow(/A\+B/);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    for (const request of [a, b]) s.graph.retainResult(s.authority, lease, request.executionId, `artifact:${request.role}`, { certain: true });
    s.graph.prepareAdmission(s.authority, lease, body(u, "R")); expect(s.graph.admission(body(u, "R").executionId)!.state).toBe("PREPARED");
  });
  test("crash at validation/publication/readback and double commit yields one unit commit", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), resultIds = await complete(s, u, lease), c = publication(s, u, resultIds);
    s.graph.validateUnit(s.authority, lease, resultIds, validation(c)); expect(s.graph.unit("m", u.unitId).state).toBe("VALIDATING");
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    s.graph.preparePublication(s.authority, lease, c, { verifiedEffect: "satisfies" }); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(() => s.graph.commitReadback(s.authority, lease, { ...readback(c), hash: "0".repeat(64) })).toThrow(/mismatch/);
    s.graph.observePublication(s.authority, u.unitId, readback(c)); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    const done = s.graph.commitReadback(s.authority, lease, readback(c)); expect(done.readbackStatus).toBe("verified");
    expect(s.graph.commitReadback(s.authority, lease, readback(c))).toEqual(done); expect(s.graph.unit("m", u.unitId).state).toBe("COMMITTED");
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 1 }); expect(s.graph.replay("m").committed).toEqual([u.unitId]);
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("released");
    expect(s.graph.events.read("m").filter(e => e.kind === "knowledge_committed")).toHaveLength(1);
  });
  test("expired publication readback retained without satisfying prerequisites", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 100), ids = await complete(s, u, lease), c = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(c)); s.graph.preparePublication(s.authority, lease, c);
    s.graph.tick(s.authority, "publication-response-lost", 110); s.graph.expire(s.authority, u.unitId);
    expect(() => s.graph.commitReadback(s.authority, lease, readback(c))).toThrow(/family fence/);
    expect(() => s.graph.releaseQuarantine(s.authority, u.unitId)).toThrow(/publication still ambiguous/);
    s.graph.observePublication(s.authority, u.unitId, readback(c)); s.graph.releaseQuarantine(s.authority, u.unitId);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false); expect(s.graph.unit("m", u.unitId).state).toBe("BLOCKED");
    expect(() => s.graph.transition(s.authority, u.unitId, "READY", "retry old publication")).toThrow(/recovery under a new unit\/revision/);
    expect(() => reserve(s.graph, s.authority, u.unitId)).toThrow(/recovery under a new unit\/revision/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_publications").get()).toEqual({ n: 1 });
  });
  test("level 2 refuses both false and true parentValidated booleans without an attestation", async () => {
    const s = setup(), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 };
    expect(() => s.graph.validateUnit(s.authority, lease, ids, validation(c))).toThrow(/boolean is not a parent attestation/);
    expect(() => s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentValidated: true })).toThrow(/boolean is not a parent attestation/);
    expect(s.graph.unit("m", u.unitId).state).toBe("RUNNING"); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false);
  });
});

describe("transactional L5 binding and exact prerequisite receipts", () => {
  test("there is no unbound reservation path; stale mission/binding/sidecar is rejected", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    expect(() => s.graph.reserve(s.authority, u.unitId)).toThrow(/binding expectation/);
    const expected = freeze(s.graph, s.authority, [u.unitId]);
    expect(() => s.graph.reserve(s.authority, u.unitId, 100, { ...expected, sidecarFingerprint: "0".repeat(64) })).toThrow(/stale binding/);
    s.store.commit(empty(), 0, s.authority.lease, 12);
    expect(() => s.graph.reserve(s.authority, u.unitId, 100, expected)).toThrow(/mission/);
    const current = s.graph.reservationExpectation("m"); freeze(s.graph, s.authority, [u.unitId]);
    expect(() => s.graph.reserve(s.authority, u.unitId, 100, current)).toThrow(/active-plan/);
    expect(s.graph.leases.get("m", u.unitId)).toBeNull();
  });
  test("durable sidecar corruption fails closed before acquiring any claim", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const expected = freeze(s.graph, s.authority, [u.unitId]);
    const row = s.graph.db.query("SELECT sidecar FROM ff8_graph_plans WHERE mission='m'").get() as { sidecar: string }, sidecar = JSON.parse(row.sidecar);
    sidecar.envelopeBytesByUnit[u.unitId] = 2;
    s.graph.db.query("UPDATE ff8_graph_plans SET sidecar=? WHERE mission='m'").run(JSON.stringify(sidecar));
    expect(() => s.graph.reserve(s.authority, u.unitId, 100, expected)).toThrow(/corrupt immutable/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get()).toEqual({ n: 0 });
  });
  test("G2 conflicts are direct, never transitive component locks", () => {
    const s = setup(), a = unit(s, "unitA", 0), b = unit(s, "unitB", 1), c = unit(s, "unitC", 2);
    const conflict = (resourceKey: string) => ({ id: resourceKey, resourceKey, kind: "exclusive_write", withUnitId: null });
    a.conflicts = [conflict("resource:AB")]; b.conflicts = [conflict("resource:AB"), conflict("resource:BC")]; c.conflicts = [conflict("resource:BC")];
    for (const u of [a, b, c]) s.graph.addUnit(s.authority, u);
    const expected = freeze(s.graph, s.authority, [a.unitId, b.unitId, c.unitId]);
    s.graph.reserve(s.authority, a.unitId, 100, expected); s.graph.reserve(s.authority, c.unitId, 100, expected);
    expect(() => s.graph.reserve(s.authority, b.unitId, 100, expected)).toThrow(/owned/);
    expect(s.graph.unit("m", a.unitId).state).toBe("RESERVED"); expect(s.graph.unit("m", c.unitId).state).toBe("RESERVED");
  });
  test("COMMITTED level alone is insufficient: exact artifact, hash, kind and revision are rechecked", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), producer = unit(s, "producer", 0); s.graph.addUnit(s.authority, producer);
    const lease = reserve(s.graph, s.authority, producer.unitId, 1000), ids = await complete(s, producer, lease), c = publication(s, producer, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(c)); s.graph.preparePublication(s.authority, lease, c, { verifiedEffect: "satisfies" }); const committed = s.graph.commitReadback(s.authority, lease, readback(c));
    const binding = s.graph.recordArtifactBinding(s.authority, { commitId: committed.commitId, artifactId: ids[2]!, functionId: producer.ownedFunctionIds[0]!, artifactKind: "validated_knowledge", sourceResultIds: [ids[2]!] });
    const consumer = unit(s, "consumer", 1), requirement = { artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, functionId: producer.ownedFunctionIds[0]!, moduleSha256: producer.ownedFunctionIds[0]!.split(":")[0]!, artifactKind: "validated_knowledge", minimumRevision: 2, maximumRevision: 2, publicationLevel: 1, validation: "fixture-only" as const };
    consumer.prerequisites = [{ id: "required", kind: "obligatory", producerUnitId: producer.unitId, artifactKind: "validated_knowledge", requiredPublicationLevel: 1, dispensed: false, dispensationReason: null }];
    s.graph.addUnit(s.authority, consumer);
    const bind = (r = requirement) => freeze(s.graph, s.authority, [consumer.unitId], { requirementById: { required: r } });
    const missing = bind(); expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, missing)).toThrow(/missing artifact receipt/);
    const { minimumRevision: _min, maximumRevision: _max, ...base } = requirement;
    const receipt = { ...base, knowledgeRevision: 2, producerUnitId: producer.unitId, commitId: committed.commitId, readbackStatus: "verified" as const, futurePrerequisiteEffect: "satisfies" as const };
    expect(() => s.graph.recordKnowledgeReceipt(s.authority, { ...receipt, readbackStatus: "pending" })).toThrow(/verified publication/);
    s.graph.recordKnowledgeReceipt(s.authority, receipt);
    for (const bad of [{ ...requirement, artifactSha256: "0".repeat(64) }, { ...requirement, minimumRevision: 3, maximumRevision: 3 }, { ...requirement, functionId: consumer.ownedFunctionIds[0]! }]) {
      const expected = bind(bad); expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, expected)).toThrow(/stale\/missing artifact/);
    }
    const expected = bind(); s.graph.reserve(s.authority, consumer.unitId, 100, expected); expect(s.graph.unit("m", consumer.unitId).state).toBe("RESERVED");
  });
  test("a prepared but unsent sibling cannot dispatch after STOP_PENDING", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), a = body(u, "A"), b = body(u, "B");
    s.graph.prepareAdmission(s.authority, lease, a); s.graph.prepareAdmission(s.authority, lease, b);
    await s.graph.dispatch(s.authority, lease, a.executionId, { async submit() { return { executionId: a.executionId, state: "accepted" }; } });
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "native stop not confirmed");
    let effects = 0;
    await expect(s.graph.dispatch(s.authority, lease, b.executionId, { async submit() { effects++; return { executionId: b.executionId, state: "accepted" }; } })).rejects.toThrow(/prevents dispatch/);
    expect(effects).toBe(0);
  });
  test("confirmed terminal family can retry under a new fence; old artifacts cannot satisfy R", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const old = reserve(s.graph, s.authority, u.unitId), request = body(u, "A");
    s.graph.prepareAdmission(s.authority, old, request);
    await s.graph.dispatch(s.authority, old, request.executionId, { async submit() { return { executionId: request.executionId, state: "accepted" }; } });
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
    s.graph.retainResult(s.authority, old, request.executionId, "old:artifact:A", { useful: true });
    s.graph.retireFamily(s.authority, old, "RETRYABLE", "validated artifact insufficient", "scientific_block");
    s.graph.transition(s.authority, u.unitId, "READY", "explicit authorized retry after proven quiescence");
    const next = reserve(s.graph, s.authority, u.unitId); expect(next.token).toBeGreaterThan(old.token);
    expect(() => s.graph.prepareAdmission(s.authority, next, body(u, "R", ":retry"))).toThrow(/A\+B/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_results").get()).toEqual({ n: 1 });
  });
  test("multifunction R gate never substitutes the other function's A/B artifacts", async () => {
    const s = setup(), first = unit(s, "first", 0), second = unit(s, "second", 1);
    const aggregate = { ...first, unitId: "aggregate", ownedFunctionIds: [...first.ownedFunctionIds, ...second.ownedFunctionIds], subIntents: [...first.subIntents, ...second.subIntents] };
    s.graph.addUnit(s.authority, aggregate); const lease = reserve(s.graph, s.authority, aggregate.unitId, 1000);
    for (const sub of first.subIntents.filter(x => x.role !== "R")) {
      const request = body({ ...aggregate, subIntents: [sub] }, sub.role, ":first"); s.graph.prepareAdmission(s.authority, lease, request);
      await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return { executionId: request.executionId, state: "accepted" }; } });
      s.graph.proveTerminal(s.authority, aggregate.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
      s.graph.retainResult(s.authority, lease, request.executionId, `artifact:${sub.subIntentId}`, { useful: true });
    }
    s.graph.prepareAdmission(s.authority, lease, body({ ...aggregate, subIntents: [first.subIntents[2]!] }, "R", ":first"));
    expect(() => s.graph.prepareAdmission(s.authority, lease, body({ ...aggregate, subIntents: [second.subIntents[2]!] }, "R", ":second"))).toThrow(/A\+B/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_leases").get()).toEqual({ n: 1 });
  });
});

describe("L6 independent-review regressions", () => {
  test("D1 lost reply cannot be scientifically completed without accepted durable receipt", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), request = body(u, "A");
    s.graph.prepareAdmission(s.authority, lease, request);
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { throw new Error("accepted remotely; response lost"); } })).rejects.toThrow(/lost/);
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId))).toThrow(/durable accepted receipt/);
    expect(s.graph.retainResult(s.authority, lease, request.executionId, "unaccepted:artifact", { useful: true })).toBe(false);
    for (const invalid of [{ executionId: "wrong-execution", state: "accepted" }, { executionId: request.executionId, state: "failed" }, { executionId: request.executionId, state: "accepted", requestDigest: "0".repeat(64) }]) {
      expect(() => s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "accepted", receipt: invalid, proof: "native readback" })).toThrow(/receipt execution\/digest\/accepted status/);
      expect(s.graph.admission(request.executionId)!.state).toBe("AMBIGUOUS");
    }
    const accepted = { executionId: request.executionId, state: "accepted", requestDigest: fingerprint(request) };
    s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "accepted", receipt: accepted, proof: "positive native transactional readback" });
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", { ...proof(s.graph, request.executionId), requestDigest: "0".repeat(64) })).toThrow(/terminal native readback/);
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId, "failed"))).toThrow(/terminal native readback/);
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
    expect(s.graph.retainResult(s.authority, lease, request.executionId, "accepted:artifact", { useful: true })).toBe(true);
    expect(s.graph.retainResult(s.authority, lease, request.executionId, "unaccepted:artifact", { useful: true })).toBe(false);
  });
  test("D1 unaccepted stop proves neither quiescence nor artifact eligibility", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { throw new Error("lost"); } })).rejects.toThrow();
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "stopped", proof(s.graph, request.executionId, "stopped"))).toThrow(/accepted receipt/);
    expect(s.graph.retainResult(s.authority, lease, request.executionId, "stopped:artifact", { useful: true })).toBe(false);
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "stop confirmation available, no admission completion");
    expect(() => s.graph.retireFamily(s.authority, lease, "FAILED", "unbound stop is not admission closure", "outage")).toThrow(/active\/ambiguous/);
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("active");
  });
  for (const oldCallback of ["error", "receipt"] as const) test(`D2 deferred old ${oldCallback} cannot overwrite a reconciled/new SENDING generation`, async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request, 3, 0);
    const second = new GraphStore(s.p); opened.push(second);
    const oldIo = deferred<Record<string, unknown>>(), newIo = deferred<Record<string, unknown>>();
    const oldDone = s.graph.dispatch(s.authority, lease, request.executionId, { submit: async () => oldIo.promise }).then(value => ({ value }), error => ({ error }));
    expect(second.admission(request.executionId)!.state).toBe("SENDING");
    second.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "rejected", receipt: { type: "execution_rejected", executionId: request.executionId, requestDigest: fingerprint(request), attempt: 1, token: lease.token, category: "quota", recoverable: true }, proof: "offline explicit negative protocol response; NOT instantaneous absence or native evidence" });
    const newDone = second.dispatch(s.authority, lease, request.executionId, { submit: async () => newIo.promise });
    expect(second.admission(request.executionId)!.attempts).toBe(2);
    if (oldCallback === "error") oldIo.reject(new Error("old I/O error")); else oldIo.resolve({ executionId: request.executionId, state: "accepted" });
    await oldDone;
    expect(second.admission(request.executionId)).toMatchObject({ attempts: 2, state: "SENDING", receipt: null });
    expect(() => second.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(second, request.executionId))).toThrow(/accepted receipt/);
    expect(second.events.read("m").filter(e => e.kind === "admission_late_observation" && (e.payload as any).applied === false)).toHaveLength(1);
    newIo.resolve({ executionId: request.executionId, state: "accepted" }); await newDone;
    second.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(second, request.executionId));
    expect(second.retainResult(s.authority, lease, request.executionId, "current:artifact", { useful: true })).toBe(oldCallback === "error");
    if (oldCallback === "receipt") expect(() => second.leases.releaseProven(s.authority, lease)).toThrow(/contradicted by late accepted/);
  });
  test("D4 sibling traffic consumes v1 event TTL without proving stopped or freeing claims", async () => {
    const s = setup(), slow = unit(s, "slow", 0), sibling = unit(s, "sibling", 1), replacement = unit(s, "replacement", 0);
    for (const u of [slow, sibling, replacement]) s.graph.addUnit(s.authority, u);
    const old = reserve(s.graph, s.authority, slow.unitId, 12), slowRequest = body(slow, "A"); s.graph.prepareAdmission(s.authority, old, slowRequest);
    await s.graph.dispatch(s.authority, old, slowRequest.executionId, { async submit() { return { executionId: slowRequest.executionId, state: "accepted" }; } });
    const live = reserve(s.graph, s.authority, sibling.unitId, 1000);
    await complete(s, sibling, live); // no tick or elapsed-time mutation: only sibling activity
    expect(s.graph.events.cursor("m").sequence).toBeGreaterThanOrEqual(old.expiresAtEvent);
    s.graph.expire(s.authority, slow.unitId);
    expect(s.graph.admission(slowRequest.executionId)!.state).toBe("ACCEPTED");
    expect(() => s.graph.releaseQuarantine(s.authority, slow.unitId)).toThrow(/active\/ambiguous/);
    expect(() => reserve(s.graph, s.authority, replacement.unitId)).toThrow(/owned/);
  });
  test("all applicable diagnostics, including partial-native-scc and mission-wide diagnostics, forbid reserve", () => {
    for (const code of ["partial-native-scc", "missing-cost", "uncovered-function", "oversize-scc"]) for (const global of [false, true]) {
      const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
      const expected = freeze(s.graph, s.authority, [u.unitId], { diagnostics: [{ unitId: global ? null : u.unitId, code } as any] });
      expect(() => s.graph.reserve(s.authority, u.unitId, 100, expected)).toThrow(/diagnostic prevents admission/);
      expect(s.graph.leases.get("m", u.unitId)).toBeNull();
    }
  });
  test("RV unit-envelope budget applies to the complete UTF-8 Admission, not the larger plan ceiling", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    const expected = freeze(s.graph, s.authority, [u.unitId], { envelopeBytesByUnit: { [u.unitId]: 32 } });
    const lease = s.graph.reserve(s.authority, u.unitId, 100, expected), request = body(u, "A");
    expect(Buffer.byteLength(JSON.stringify(request), "utf8")).toBeGreaterThan(32);
    expect(() => s.graph.prepareAdmission(s.authority, lease, request)).toThrow(/unit\/plan UTF-8 byte budget/);
    expect(s.graph.admission(request.executionId)).toBeNull();
  });
  test("F-parent real planMission multifunc caller authors await callee R and publish whole unit only", async () => {
    const s = setup(), snapshot = structuredClone(s.snapshot); snapshot.snapshotId = "snap:planner-interop";
    const caller = snapshot.nodes[0], callee = snapshot.nodes[1];
    snapshot.edges = [{ ...snapshot.edges[0], id: "edge:interop-call", sourceId: caller.id, destinationId: callee.id, kind: "direct_call", status: "observed", schedulerRelevance: "may_block", retiredInRevision: null }];
    snapshot.normalizedFingerprint = fingerprint({ nodes: snapshot.nodes, edges: snapshot.edges });
    const partition = { ...s.partition, partitionId: "part:planner-interop", snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint };
    s.graph.putSnapshot(s.authority, snapshot); s.graph.putPartition(s.authority, partition);
    const policy: PlannerPolicy = { version: "interop-policy-v1", estimationVersion: "interop-estimate-v1", partitionId: partition.partitionId, investigationKind: "decompilation", artifactKind: "validated_knowledge", publicationLevel: 1, contextEnvelopeMaxUtf8Bytes: 65536, totalContextBudgetUtf8Bytes: 1048576, maxSelectedUnits: 100, sccMaxFunctions: 100, sccMaxIterations: 4, sccCostBudget: 10000, requirementsByFunction: {}, estimatesByFunction: {}, resourcesByFunction: {} };
    for (const node of snapshot.nodes) {
      policy.requirementsByFunction[node.id] = { artifactId: `fact:${node.id}`, artifactSha256: fingerprint(node.id), functionId: node.id, moduleSha256: node.moduleSha256, artifactKind: "validated_knowledge", minimumRevision: 0, maximumRevision: 100, publicationLevel: 1, validation: "fixture-only" };
      policy.estimatesByFunction[node.id] = { version: policy.estimationVersion, A: 1, B: 1, R: 1, validation: 1 };
      policy.resourcesByFunction[node.id] = { profiles: ["fixture-worker"], models: ["fixture/local#high"], tools: [], accounts: ["fixture-account"], slots: 1, cpu: 1, gpu: 0, budget: 1 };
    }
    const groups = [{ groupId: "group:caller-callee", partitionId: partition.partitionId, ownedFunctionIds: [caller.id, callee.id], contextFunctionIds: [] }, ...snapshot.nodes.slice(2).map((n: any, i: number) => ({ groupId: `group:other:${i}`, partitionId: partition.partitionId, ownedFunctionIds: [n.id], contextFunctionIds: [] }))];
    const planned = planMission(snapshot, groups, policy);
    const u = planned.units.find(x => x.ownedFunctionIds.includes(caller.id))!;
    expect(u.ownedFunctionIds).toHaveLength(2);
    const callerAuthors = u.subIntents.filter(x => x.functionId === caller.id && x.role !== "R"), calleeR = u.subIntents.find(x => x.functionId === callee.id && x.role === "R")!;
    expect(callerAuthors.every(x => x.waitsForSubIntentIds.length === 1 && x.waitsForSubIntentIds[0] === calleeR.subIntentId)).toBe(true);
    expect(planned.sidecar.localOrders[u.unitId]!.publication).toBe("whole-unit-only");
    for (const candidate of planned.units) s.graph.addUnit(s.authority, candidate);
    s.graph.freezePlan(s.authority, planned.plan, planned.sidecar, planned.binding);
    s.graph.transition(s.authority, u.unitId, "READY", "parent authorized frozen planner readiness");
    const lease = s.graph.reserve(s.authority, u.unitId, 1000, s.graph.reservationExpectation("m"));
    pinUnit(s.graph, s.authority, lease);
    const commandFor = (sub: WorkUnit["subIntents"][number]) => body({ ...u, subIntents: [sub] }, sub.role, `:${sub.functionId.split(":")[1]}`);
    expect(() => s.graph.prepareAdmission(s.authority, lease, commandFor(callerAuthors[0]!))).toThrow(/other-function R/);
    const resultIds: string[] = [];
    const execute = async (sub: WorkUnit["subIntents"][number]) => {
      const request = commandFor(sub); s.graph.prepareAdmission(s.authority, lease, request);
      await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return { executionId: request.executionId, state: "accepted" }; } });
      s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
      const resultId = `result:${sub.subIntentId}`; expect(s.graph.retainResult(s.authority, lease, request.executionId, resultId, { useful: true })).toBe(true); resultIds.push(resultId);
    };
    for (const sub of u.subIntents.filter(x => x.functionId === callee.id && x.role !== "R")) await execute(sub);
    const c = publication(s, u, resultIds);
    expect(() => s.graph.validateUnit(s.authority, lease, resultIds, validation(c))).toThrow(/all attributable family/);
    expect(() => s.graph.prepareAdmission(s.authority, lease, commandFor(callerAuthors[0]!))).toThrow(/other-function R/);
    await execute(calleeR);
    for (const sub of callerAuthors) await execute(sub);
    await execute(u.subIntents.find(x => x.functionId === caller.id && x.role === "R")!);
    const wholeCommit = publication(s, u, resultIds); s.graph.validateUnit(s.authority, lease, resultIds, validation(wholeCommit)); s.graph.preparePublication(s.authority, lease, wholeCommit, { verifiedEffect: "satisfies" }); s.graph.commitReadback(s.authority, lease, readback(wholeCommit));
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true); expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 1 });
    // Exercise L5's REAL diagnostic producer, not just a hand-written code label.
    const cycle = { ...snapshot, snapshotId: "snap:interop-partial-scc", edges: [snapshot.edges[0], { ...snapshot.edges[0], id: "edge:interop-reverse", sourceId: callee.id, destinationId: caller.id }] };
    cycle.normalizedFingerprint = fingerprint({ nodes: cycle.nodes, edges: cycle.edges });
    const cyclePartition = { ...partition, partitionId: "part:interop-partial-scc", snapshotId: cycle.snapshotId, snapshotFingerprint: cycle.normalizedFingerprint };
    s.graph.putSnapshot(s.authority, cycle); s.graph.putPartition(s.authority, cyclePartition);
    const fragment = planMission(cycle, [{ groupId: "group:partial-native-scc", partitionId: cyclePartition.partitionId, ownedFunctionIds: [caller.id], contextFunctionIds: [callee.id] }], { ...policy, partitionId: cyclePartition.partitionId, edgeKinds: { "edge:interop-call": "optional", "edge:interop-reverse": "optional" } });
    expect(fragment.diagnostics.some(d => d.code === "partial-native-scc")).toBe(true);
    for (const candidate of fragment.units) s.graph.addUnit(s.authority, candidate);
    s.graph.freezePlan(s.authority, fragment.plan, fragment.sidecar, fragment.binding, s.graph.reservationExpectation("m").activePlanRevision);
    const fragmentUnit = fragment.units[0]!;
    s.graph.transition(s.authority, fragmentUnit.unitId, "READY", "adversarial attempt to skip planner preflight");
    expect(() => s.graph.reserve(s.authority, fragmentUnit.unitId, 100, s.graph.reservationExpectation("m"))).toThrow(/not selected|diagnostic/);
  });
  test("F-parent rejects asymmetric/same-function/author/duplicate/unknown dependencies and DAG cycles", () => {
    const s = setup(), a = unit(s, "first", 0), b = unit(s, "second", 1);
    const aggregate = { ...a, unitId: "aggregate-negative", ownedFunctionIds: [...a.ownedFunctionIds, ...b.ownedFunctionIds], subIntents: [...a.subIntents, ...b.subIntents] };
    const variants = [
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = [u.subIntents[5]!.subIntentId]; },
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = u.subIntents[1]!.waitsForSubIntentIds = [u.subIntents[2]!.subIntentId]; },
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = u.subIntents[1]!.waitsForSubIntentIds = [u.subIntents[3]!.subIntentId]; },
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = u.subIntents[1]!.waitsForSubIntentIds = [u.subIntents[5]!.subIntentId, u.subIntents[5]!.subIntentId]; },
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = u.subIntents[1]!.waitsForSubIntentIds = ["unknown:sub"]; },
      (u: WorkUnit) => { u.subIntents[0]!.waitsForSubIntentIds = u.subIntents[1]!.waitsForSubIntentIds = [u.subIntents[5]!.subIntentId]; u.subIntents[3]!.waitsForSubIntentIds = u.subIntents[4]!.waitsForSubIntentIds = [u.subIntents[2]!.subIntentId]; },
    ];
    for (const mutate of variants) { const u = structuredClone(aggregate); mutate(u); expect(() => s.graph.addUnit(s.authority, u)).toThrow(); }
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_units").get()).toEqual({ n: 0 });
  });
});

describe("v5 pinned inputs, irreversible-release safety and scientific content IDs", () => {
  test("RV6M-02 direct primitive rejects wrong function, zero hash, unpinned and altered projections before outbox/I/O", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    const lease = s.graph.reserve(s.authority, u.unitId, 1000, freeze(s.graph, s.authority, [u.unitId])), request = body(u, "A"), before = s.graph.events.cursor("m");
    const wrong = structuredClone(request); (wrong.command.dossier as any).functionId = s.snapshot.nodes[1].id; (wrong.command.metadata as any).inputFingerprint = "0".repeat(64);
    expect(() => s.graph.prepareAdmission(s.authority, lease, wrong)).toThrow(/dossier function mismatch/);
    expect(() => s.graph.prepareAdmission(s.authority, lease, request)).toThrow(/durable frozen input pin/);
    expect(s.graph.events.cursor("m")).toEqual(before); expect(s.graph.admission(request.executionId)).toBeNull();
    const inputs = inputsFor(u.subIntents[0]!); s.graph.freezeAdmissionInputs(s.authority, lease, request.subIntentId, inputs);
    const pinned = s.graph.events.cursor("m");
    expect(s.graph.freezeAdmissionInputs({ ...s.authority, now: 12 }, lease, request.subIntentId, structuredClone(inputs))).toBe(fingerprint(inputs));
    expect(s.graph.events.cursor("m")).toEqual(pinned);
    expect(() => s.graph.freezeAdmissionInputs(s.authority, lease, request.subIntentId, { ...inputs, knowledge: { ...inputs.knowledge, version: "altered" } })).toThrow(/immutable admission input pin/);
    const variants = [
      (b: Admission) => { (b.command.metadata as any).inputFingerprint = "0".repeat(64); },
      (b: Admission) => { (b.command.dossier as any).inputs.knowledge.version = "altered"; },
      (b: Admission) => { (b.command.dossier as any).resultHeader.identity.ea = "0x402100"; },
      (b: Admission) => { (b.command.dossier as any).resultHeader.inputFingerprint = "0".repeat(64); },
      (b: Admission) => { (b.command.dossier as any).resultHeader.inputVersions = [{ path: "C:/wrong", version: "wrong", sha256: "0".repeat(64) }]; },
      (b: Admission) => { (b.command.dossier as any).inputs.files.push({ path: "C:/wrong", version: "v1", provenance: "altered", kind: "native", sha256: "0".repeat(64) }); },
    ];
    for (const mutate of variants) {
      const bad = structuredClone(request); mutate(bad); expect(() => s.graph.prepareAdmission(s.authority, lease, bad)).toThrow();
      expect(s.graph.admission(request.executionId)).toBeNull(); expect(s.graph.events.cursor("m")).toEqual(pinned);
    }
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    s.graph.prepareAdmission(s.authority, lease, request); let calls = 0;
    await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { calls++; return { executionId: request.executionId, state: "accepted" }; } }); expect(calls).toBe(1);
  });
  test("RV6M-02 pin freezes exact manifests and v3 LF-line proposals without inventing future output hashes", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    const lease = s.graph.reserve(s.authority, u.unitId, 1000, freeze(s.graph, s.authority, [u.unitId]));
    const proposals: NonNullable<InputBundle["proposals"]> = [];
    for (const role of ["A", "B"] as const) {
      const sub = u.subIntents.find(x => x.role === role)!, request = body(u, role);
      s.graph.freezeAdmissionInputs(s.authority, lease, sub.subIntentId, inputsFor(sub)); s.graph.prepareAdmission(s.authority, lease, request);
      await s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return { executionId: request.executionId, state: "accepted" }; } });
      s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
      const document: any = { kind: "proposal", role, propositions: [], note: "é🙂", blank: "" }, resultId = `frozen:${role}`;
      const content = JSON.stringify(document, null, 2).split("\n").join("\r\n") + "\r\n\r\n";
      s.graph.retainResult(s.authority, lease, request.executionId, resultId, document);
      proposals.push({ resultId, authorId: `author:${role}`, executionId: request.executionId, sessionId: `session:${role}`, sha256: hash(Buffer.from(content, "utf8")), path: `C:/frozen/${role}.json`, content, document });
    }
    const sub = u.subIntents.find(x => x.role === "R")!, inputs = inputsFor(sub); inputs.proposals = proposals;
    inputs.files = proposals.map(p => ({ path: p.path, sha256: p.sha256, version: p.resultId, provenance: `frozen fixture ${p.executionId}`, kind: "proposal" }));
    const inputFingerprint = s.graph.freezeAdmissionInputs(s.authority, lease, sub.subIntentId, inputs), request = body(u, "R"), dossier = request.command.dossier as any;
    dossier.version = 3; dossier.inputs = { ...inputs, proposals: proposals.map(({ content, ...metadata }) => ({ ...metadata, contentLines: content.split("\n"), contentEncoding: "utf8-lines-lf" })) };
    dossier.resultHeader.inputFingerprint = inputFingerprint; dossier.resultHeader.inputVersions = inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })); dossier.resultHeader.previousResultIds = proposals.map(p => p.resultId);
    (request.command.metadata as any).inputFingerprint = inputFingerprint;
    const corrupt = structuredClone(request); (corrupt.command.dossier as any).inputs.proposals[0].contentLines[0] += "altered";
    expect(() => s.graph.prepareAdmission(s.authority, lease, corrupt)).toThrow(/normalized projection/);
    const wrongVersion = structuredClone(request); (wrongVersion.command.dossier as any).inputs.files[0].version = "future";
    expect(() => s.graph.prepareAdmission(s.authority, lease, wrongVersion)).toThrow(/manifest/);
    s.graph.prepareAdmission(s.authority, lease, request); expect(s.graph.admission(request.executionId)!.state).toBe("PREPARED");
  });
  test("RV6M-02 stale mission revision and family fence cannot dispatch a pinned command", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A");
    s.graph.prepareAdmission(s.authority, lease, request); s.store.commit(empty(), 0, s.authority.lease, 12); let calls = 0;
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { calls++; return {}; } })).rejects.toThrow(/stale admission input pin/);
    expect(calls).toBe(0); expect(s.graph.admission(request.executionId)).toMatchObject({ attempts: 0, state: "PREPARED" });
    expect(() => s.graph.freezeAdmissionInputs(s.authority, { ...lease, token: lease.token + 1 }, request.subIntentId, inputsFor(u.subIntents[0]!))).toThrow(/family fence/);
  });
  test("RV6M-02 two independent processes freeze at most one conflicting pin and preserve the winner on reopen", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u);
    const lease = s.graph.reserve(s.authority, u.unitId, 1000, freeze(s.graph, s.authority, [u.unitId])), sub = u.subIntents[0]!, moduleUrl = pathToFileURL(join(import.meta.dir, "..", "src", "graph-store.ts")).href;
    const run = async (version: string) => {
      const inputs = inputsFor(sub); inputs.knowledge.version = version;
      const code = `import {GraphStore} from ${JSON.stringify(moduleUrl)}; const g=new GraphStore(${JSON.stringify(s.p)}); try {g.freezeAdmissionInputs(${JSON.stringify(s.authority)},${JSON.stringify(lease)},${JSON.stringify(sub.subIntentId)},${JSON.stringify(inputs)}); console.log('won');} catch(e) {console.log('lost:'+e.message);} finally {g.close();}`;
      const child = Bun.spawn([process.execPath, "-e", code], { cwd: join(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" });
      return Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    };
    const results = await Promise.all([run("one"), run("two")]); expect(results.every(r => r[2] === 0 && r[1] === "")).toBe(true); expect(results.filter(r => (r[0] as string).trim() === "won")).toHaveLength(1);
    expect(s.graph.events.read("m").filter(e => e.kind === "admission_inputs_frozen")).toHaveLength(1);
    const before = s.graph.db.query("SELECT document,digest FROM ff8_graph_input_pins").get(); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.db.query("SELECT document,digest FROM ff8_graph_input_pins").get()).toEqual(before);
  });
  for (const version of [1, 2, 3, 4, 5]) test(`v${version} to v6 preserves unpinned legacy outbox/history but never dispatches or retroactively blesses it`, async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    const before = s.graph.events.read("m"), bodyBefore = s.graph.db.query("SELECT body,digest FROM ff8_graph_outbox").get();
    s.graph.db.exec(`DROP TABLE ff8_graph_input_pins; UPDATE ff8_graph_metadata SET version=${version};`); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.db.query("SELECT version FROM ff8_graph_metadata").get()).toEqual({ version: 6 }); expect(s.graph.db.query("SELECT version FROM ff8_harness_metadata WHERE component='engine'").get()).toEqual({ version: 1 });
    expect(s.graph.events.read("m")).toEqual(before); expect(s.graph.db.query("SELECT body,digest FROM ff8_graph_outbox").get()).toEqual(bodyBefore);
    let calls = 0; await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { calls++; return {}; } })).rejects.toThrow(/durable frozen input pin/);
    expect(calls).toBe(0); expect(() => s.graph.freezeAdmissionInputs(s.authority, lease, request.subIntentId, inputsFor(u.subIntents[0]!))).toThrow(/retroactively authorized/);
    expect(() => s.graph.prepareAdmission(s.authority, lease, request)).toThrow(/durable frozen input pin/);
    s.graph.db.exec("UPDATE ff8_graph_metadata SET version=7"); expect(() => new GraphStore(s.p)).toThrow(/unsupported graph schema/);
  });
  test("RV6M-03 SENDING instantaneous absence cannot retire/release/retry before delayed acceptance", async () => {
    const s = setup(), u = unit(s, "old"), next = unit(s, "next"); s.graph.addUnit(s.authority, u); s.graph.addUnit(s.authority, next);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"), io = deferred<Record<string, unknown>>(); s.graph.prepareAdmission(s.authority, lease, request);
    const pending = s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return io.promise; } });
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "absent", proof(s.graph, request.executionId, "absent"));
    s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "absent", receipt: null, proof: "instantaneous fixture snapshot; NOT permanent admission fence" });
    expect(s.graph.admission(request.executionId)).toMatchObject({ state: "SENDING", attempts: 1, receipt: null });
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { throw new Error("duplicate send"); } })).rejects.toThrow(/ambiguous/);
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "absence is not stop confirmation");
    expect(() => s.graph.retireFamily(s.authority, lease, "CANCELLED", "unsafe absence release", "outage")).toThrow(/active\/ambiguous/);
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/quiescence/);
    expect(() => reserve(s.graph, s.authority, next.unitId)).toThrow(/owned/);
    io.resolve({ executionId: request.executionId, state: "accepted" }); await pending;
    expect(s.graph.admission(request.executionId)!.state).toBe("ACCEPTED"); expect(s.graph.unit("m", u.unitId).state).toBe("STOP_PENDING");
    expect(s.graph.events.read("m").filter(e => e.kind === "terminal_observation")).toHaveLength(1);
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/quiescence/);
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
    s.graph.retireFamily(s.authority, lease, "CANCELLED", "exact accepted execution completed", "outage");
    expect(reserve(s.graph, s.authority, next.unitId).token).toBeGreaterThan(lease.token);
  });
  test("RV6M-03 independent release guard rejects legacy v4 post-I/O absent proofs after reopen", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    s.graph.db.query("UPDATE ff8_graph_outbox SET state='TERMINAL',attempts=1,terminal_proof=? WHERE execution_id=?").run(canonical(proof(s.graph, request.executionId, "absent")), request.executionId);
    s.graph.db.exec("UPDATE ff8_graph_metadata SET version=4"); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/quiescence/);
    s.graph.db.query("UPDATE ff8_graph_outbox SET terminal_proof=? WHERE execution_id=?").run(canonical({ ...proof(s.graph, request.executionId, "absent"), generation: { attempt: 1, token: lease.token }, proofKind: "never_sent" }), request.executionId);
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/absence after I\/O/);
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("active"); expect(s.graph.db.query("SELECT count(*) n FROM ff8_unit_claims").get()).toEqual({ n: 1 });
  });
  test("RV6M-03 zero-attempt absence is independently provable never-sent, not a sent absence waiver", () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "absent", proof(s.graph, request.executionId, "absent"));
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "cancel before any I/O"); s.graph.retireFamily(s.authority, lease, "CANCELLED", "never sent", "input");
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("released"); expect(s.graph.admission(request.executionId)!.attempts).toBe(0);
  });
  for (const category of ["auth", "input", "schema", "quota"]) test(`RV6M-03 classified ${category} without negative protocol provenance stays ambiguous`, async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request, 2, 0);
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { throw { category, recoverable: true }; } })).rejects.toBeDefined();
    expect(s.graph.admission(request.executionId)!.state).toBe("AMBIGUOUS");
    expect(() => s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "rejected", proof(s.graph, request.executionId, "rejected"))).toThrow(/recorded definitive protocol/);
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return {}; } })).rejects.toThrow(/ambiguous/);
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/quiescence/);
  });
  test("RV6M-03 recorded definitive rejection permits release, but contradictory late accepted evidence retains claims", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"), io = deferred<Record<string, unknown>>(); s.graph.prepareAdmission(s.authority, lease, request);
    const pending = s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return io.promise; } });
    const receipt = { type: "execution_rejected", executionId: request.executionId, requestDigest: fingerprint(request), attempt: 1, token: lease.token, category: "input", recoverable: false };
    expect(() => s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "rejected", receipt: { ...receipt, token: lease.token + 1 }, proof: "bad generation" })).toThrow(/exact protocol\/generation/);
    s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "rejected", receipt, proof: "offline definitive negative protocol fixture" });
    expect(s.graph.admission(request.executionId)!.state).toBe("REJECTED");
    io.resolve({ executionId: request.executionId, state: "accepted" }); await pending;
    expect(s.graph.admission(request.executionId)!.state).toBe("REJECTED");
    expect(() => s.graph.leases.releaseProven(s.authority, lease)).toThrow(/contradicted by late accepted/);
    expect(s.graph.events.read("m").filter(e => e.kind === "admission_late_observation" && (e.payload as any).receipt?.state === "accepted")).toHaveLength(1);
  });
  test("RV6M-03 a definitive negative dispatch is bound to the generation and can retire the rejected family", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    await expect(s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { throw { type: "execution_rejected", category: "input", recoverable: false }; } })).rejects.toBeDefined();
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "rejected", proof(s.graph, request.executionId, "rejected"));
    s.graph.transition(s.authority, u.unitId, "STOP_PENDING", "definitively rejected"); s.graph.retireFamily(s.authority, lease, "FAILED", "explicit negative response", "input");
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("released");
  });
  test("RV6M-03 delayed byte-identical acceptance corroborates a receipt-bound completed same generation", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"), io = deferred<Record<string, unknown>>(); s.graph.prepareAdmission(s.authority, lease, request);
    const pending = s.graph.dispatch(s.authority, lease, request.executionId, { async submit() { return io.promise; } }), receipt = { executionId: request.executionId, state: "accepted", nativeSessionId: "session:known" };
    s.graph.reconcileAdmission(s.authority, lease, { executionId: request.executionId, requestDigest: fingerprint(request), state: "accepted", receipt, proof: "offline positive receipt readback" });
    s.graph.proveTerminal(s.authority, u.unitId, request.executionId, "completed", proof(s.graph, request.executionId));
    io.resolve(receipt); await pending;
    expect(s.graph.retainResult(s.authority, lease, request.executionId, "known:artifact", { useful: true })).toBe(true);
    expect((s.graph.events.read("m").find(e => e.kind === "admission_late_observation")!.payload as any).contradiction).toBe(false);
    s.graph.retireFamily(s.authority, lease, "FAILED", "known completed execution; no remaining native work", "scientific_block");
    expect(s.graph.leases.get("m", u.unitId)!.state).toBe("released");
  });
  test("RV6M-04 pending operation and final scientific content IDs satisfy the independent complete-document digest oracle", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    expect(pending.commitId).toBe(oracleCommitId(pending)); validateGraphDocument("knowledge-commit", pending);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); const before = s.graph.events.cursor("m");
    expect(() => s.graph.preparePublication(s.authority, lease, { ...pending, commitId: "a".repeat(64) })).toThrow(/content commitId/);
    expect(() => s.graph.preparePublication(s.authority, lease, identified({ ...pending, readbackStatus: "verified" }))).toThrow(/inadmissible/);
    expect(s.graph.events.cursor("m")).toEqual(before); expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_publications").get()).toEqual({ n: 0 });
    s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const operation = s.graph.db.query("SELECT request,digest,readback FROM ff8_graph_publications").get() as { request: string; digest: string; readback: string | null };
    expect(operation.readback).toBeNull(); expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 0 }); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    const projectedFinal = identified({ ...pending, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" });
    expect(() => s.graph.commitReadback(s.authority, lease, readback(projectedFinal))).toThrow(/readback mismatch/);
    const done = s.graph.commitReadback(s.authority, lease, readback(pending)); validateGraphDocument("knowledge-commit", done);
    expect(done).toEqual(projectedFinal); expect(done.commitId).not.toBe(pending.commitId); expect(done.commitId).toBe(oracleCommitId(done));
    expect(done.outputRevision).toBe(done.inputRevision + 1); expect(done.futurePrerequisiteEffect).toBe("satisfies"); expect(done.readbackStatus).toBe("verified"); expect(done.isGitCommit).toBe(false);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true); expect(s.graph.commitReadback(s.authority, lease, readback(pending))).toEqual(done);
    expect(() => s.graph.commitReadback(s.authority, lease, readback(done))).toThrow(/provenance changed/);
    expect(s.graph.db.query("SELECT request,digest FROM ff8_graph_publications").get()).toEqual({ request: operation.request, digest: operation.digest });
    expect(s.graph.events.read("m").find(e => e.kind === "publication_prepared")!.payload).toEqual(pending);
    const beforeReopen = s.graph.events.read("m"); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.commitReadback(s.authority, lease, readback(pending))).toEqual(done); expect(s.graph.events.read("m")).toEqual(beforeReopen);
    const newController = { lease: s.store.acquireLease("m", "controller", 12, 10000), now: 13 };
    expect(() => s.graph.commitReadback(s.authority, lease, readback(pending))).toThrow(/controller/); expect(s.graph.commitReadback(newController, lease, readback(pending))).toEqual(done);
  });
  test("RV6M-04 legacy arbitrary content IDs survive migration as evidence and never satisfy dependencies", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const done = s.graph.commitReadback(s.authority, lease, readback(pending));
    const legacy = canonical({ ...done, commitId: "a".repeat(64) }), history = s.graph.events.read("m");
    s.graph.db.query("UPDATE ff8_graph_commits SET commit_id=?,document=? WHERE mission=? AND unit_id=?").run("a".repeat(64), legacy, "m", u.unitId); s.graph.db.exec("UPDATE ff8_graph_metadata SET version=4");
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.db.query("SELECT document FROM ff8_graph_commits").get()).toEqual({ document: legacy }); expect(s.graph.events.read("m")).toEqual(history);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false); expect(() => s.graph.commitReadback(s.authority, lease, readback(pending))).toThrow(/scientific content commitId/);
    expect(() => s.graph.recordKnowledgeReceipt(s.authority, { artifactId: done.validatedFactIds[0]!, artifactSha256: done.readbackHash, functionId: u.ownedFunctionIds[0]!, moduleSha256: u.ownedFunctionIds[0]!.split(":")[0]!, artifactKind: "validated_knowledge", knowledgeRevision: 2, publicationLevel: 1, validation: "fixture-only", producerUnitId: u.unitId, commitId: "a".repeat(64), readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" })).toThrow(/verified publication/);
  });
  test("RV6M-04 an L1-valid pending non-satisfying document stays non-satisfying until and after exact readback", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease);
    const pending = identified({ ...publication(s, u, ids), futurePrerequisiteEffect: "does_not_satisfy" });
    validateGraphDocument("knowledge-commit", pending); expect(pending.commitId).toBe(oracleCommitId(pending));
    expect(pending.outputRevision).toBe(pending.inputRevision + 1); expect(pending.futurePrerequisiteEffect === "satisfies" && pending.readbackStatus !== "verified").toBe(false);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    const done = s.graph.commitReadback(s.authority, lease, readback(pending)); validateGraphDocument("knowledge-commit", done);
    expect(done.commitId).toBe(oracleCommitId(done)); expect(done.readbackStatus).toBe("verified"); expect(done.futurePrerequisiteEffect).toBe("does_not_satisfy"); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
  });
  test("RV6M-04 two independent processes commit the same exact readback once with the same final content ID", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" });
    const moduleUrl = pathToFileURL(join(import.meta.dir, "..", "src", "graph-store.ts")).href, expected = oracleCommitId({ ...pending, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" });
    const run = async () => {
      const code = `import {GraphStore} from ${JSON.stringify(moduleUrl)}; const g=new GraphStore(${JSON.stringify(s.p)}); try {console.log(g.commitReadback(${JSON.stringify(s.authority)},${JSON.stringify(lease)},${JSON.stringify(readback(pending))}).commitId);} finally {g.close();}`;
      const child = Bun.spawn([process.execPath, "-e", code], { cwd: join(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" });
      return Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    };
    const results = await Promise.all([run(), run()]); expect(results.every(r => r[2] === 0 && r[1] === "" && (r[0] as string).trim() === expected)).toBe(true);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 1 });
    expect(s.graph.events.read("m").filter(e => e.kind === "knowledge_committed")).toHaveLength(1); expect(s.graph.events.read("m").filter(e => e.kind === "unit_released")).toHaveLength(1);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true);
  });
});

describe("v4 immutable parent authority and durable level-2 attestation", () => {
  test("level 2 cannot bootstrap authority from an unconfigured host or worker payload", async () => {
    const s = setup(), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c);
    expect(() => s.graph.bootstrapParentAuthority(s.authority)).toThrow(/verified host parent authority is not configured/);
    expect(() => s.graph.recordParentAttestation(s.authority, lease, request)).toThrow(/verified host parent authority/);
    expect(() => s.graph.recordParentAttestation(s.authority, lease, { ...request, actorId: "worker:spoofed-parent" } as ParentAttestationRequest)).toThrow(/must not come from payload/);
    expect(() => s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentValidated: true })).toThrow(/boolean is not a parent attestation/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_attestations").get()).toEqual({ n: 0 });
  });
  test("native author absence fails closed despite an authenticated parent bootstrap", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 };
    s.graph.bootstrapParentAuthority(s.authority);
    expect(() => s.graph.recordParentAttestation(s.authority, lease, attestationRequest(s, u, lease, ids, c))).toThrow(/native author identity missing/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_attestations").get()).toEqual({ n: 0 });
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_native_authors").get()).toEqual({ n: 0 });
  });
  test("parent actor must be authorized and distinct from every verified native author/session", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
    expect(() => s.graph.recordParentAttestation({ ...s.authority, lease: { ...s.authority.lease, owner: "worker" } }, lease, request)).toThrow(/controller lease/);
    host.identity.actorId = [...host.authors.values()][0]!.sessionId;
    expect(() => s.graph.recordParentAttestation(s.authority, lease, request)).toThrow(/distinct from all fresh native authors/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_attestations").get()).toEqual({ n: 0 });
    const badHost = parentHost(); badHost.provider.verifyParent = () => ({ ...badHost.identity, role: "worker" } as any);
    const other = setup({ parentAuthority: badHost.provider }); expect(() => other.graph.bootstrapParentAuthority(other.authority)).toThrow(/not an authenticated parent/);
  });
  test("attestation binds exact result/digests/fence/binding/snapshot/revision and nonempty passed checks", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
    const invalid = [
      { ...request, bindingFingerprint: "0".repeat(64) }, { ...request, planFingerprint: "0".repeat(64) },
      { ...request, snapshotId: "snap:wrong" }, { ...request, knowledgeRevision: 2 },
      { ...request, resultIds: ids.slice(1) }, { ...request, resultDigests: { ...request.resultDigests, [ids[0]!]: "0".repeat(64) } },
      { ...request, checks: [] }, { ...request, checks: [{ ...request.checks[0]!, evidenceDigest: "0".repeat(64) }] },
      { ...request, checks: [{ ...request.checks[0]!, outcome: "fail" }] } as unknown as ParentAttestationRequest,
    ];
    for (const bad of invalid) expect(() => s.graph.recordParentAttestation(s.authority, lease, bad)).toThrow();
    expect(() => s.graph.recordParentAttestation(s.authority, { ...lease, token: lease.token + 1 }, request)).toThrow(/family fence/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_attestations").get()).toEqual({ n: 0 });
    const attestation = s.graph.recordParentAttestation(s.authority, lease, request);
    for (const changed of [{ ...validation(c), evidence: [{ fabricated: true }] }, { ...validation(c), validatedFactIds: ["fact:wrong"] }]) expect(() => s.graph.validateUnit(s.authority, lease, ids, { ...changed, parentAttestationId: attestation.attestationId })).toThrow(/result\/evidence\/facts\/checks mismatch/);
  });
  test("native model/profile/freshness and unique author sessions cannot be supplied by artifacts", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
    const [executionId, original] = [...host.authors][0]!;
    for (const bad of [{ ...original, profile: "wrong-profile" }, { ...original, model: { ...original.model, id: "wrong-model" } }, { ...original, fresh: false } as unknown as NativeAuthorIdentity]) {
      host.authors.set(executionId, bad); expect(() => s.graph.recordParentAttestation(s.authority, lease, request)).toThrow();
    }
    host.authors.set(executionId, original);
    const second = [...host.authors][1]!; host.authors.set(second[0], { ...second[1], sessionId: original.sessionId });
    expect(() => s.graph.recordParentAttestation(s.authority, lease, request)).toThrow(/distinct from all fresh native authors/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_native_authors").get()).toEqual({ n: 0 });
  });
  test("parent attestation immutable/idempotent, replay/reopen durable, false boolean can publish only with matching proof", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
    const attestation = s.graph.recordParentAttestation(s.authority, lease, request), before = s.graph.events.cursor("m");
    expect(s.graph.recordParentAttestation(s.authority, lease, request)).toEqual(attestation); expect(s.graph.events.cursor("m")).toEqual(before);
    const replayedAttestations = s.graph.events.replay("m", {} as Record<string, unknown>, (state, event) => {
      if (event.kind === "parent_attested") state[(event.payload as { attestationId: string }).attestationId] = event.payload;
      return state;
    });
    expect(replayedAttestations[attestation.attestationId]).toEqual(attestation);
    attestation.resultDigests[ids[0]!] = "modified-caller-object"; expect(s.graph.parentAttestation("m", attestation.attestationId).resultDigests[ids[0]!]).toBe(request.resultDigests[ids[0]!]);
    const replay = s.graph.replay("m"); s.graph.close(); s.graph = new GraphStore(s.p, { parentAuthority: host.provider }); opened.push(s.graph);
    expect(s.graph.replay("m")).toEqual(replay); expect(s.graph.parentAttestation("m", attestation.attestationId).parentActorId).toBe(host.identity.actorId);
    expect(s.graph.bootstrapParentAuthority(s.authority).identity).toEqual(host.identity);
    s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentValidated: false, parentAttestationId: attestation.attestationId });
    expect(() => s.graph.preparePublication(s.authority, lease, { ...c, evidence: [{ forged: true }] })).toThrow();
    s.graph.preparePublication(s.authority, lease, c, { verifiedEffect: "satisfies" }); s.graph.commitReadback(s.authority, lease, readback(c)); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(true);
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(true); // durable already-authorized fact, not new promotion
    expect(() => s.graph.bootstrapParentAuthority(s.authority)).toThrow(/not configured/);
    s.graph.close(); s.graph = new GraphStore(s.p, { parentAuthority: host.provider }); opened.push(s.graph);
    s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "retract future prerequisite authorization after commit");
    expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 1 });
  });
  test("revocation forbids validation/publication/readback; cannot overwrite or revive the attestation", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
    const attestation = s.graph.recordParentAttestation(s.authority, lease, request);
    s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentAttestationId: attestation.attestationId }); s.graph.preparePublication(s.authority, lease, c, { verifiedEffect: "satisfies" });
    s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "parent discovered invalid native evidence");
    expect(() => s.graph.preparePublication(s.authority, lease, c)).toThrow(/nonrevoked parent attestation/);
    expect(() => s.graph.commitReadback(s.authority, lease, readback(c))).toThrow(/nonrevoked parent attestation/);
    s.graph.observePublication(s.authority, u.unitId, readback(c)); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false);
    expect(() => s.graph.parentAttestation("m", attestation.attestationId)).toThrow(/nonrevoked/);
    const cursor = s.graph.events.cursor("m"); s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "parent discovered invalid native evidence"); expect(s.graph.events.cursor("m")).toEqual(cursor);
    expect(() => s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "rewrite history")).toThrow(/event\/digest mismatch/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_attestations").get()).toEqual({ n: 1 });
  });
  test("revoked or old-family attestations cannot authorize a fresh validation", async () => {
    for (const revoke of [true, false]) {
      const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
      const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }, request = attestationRequest(s, u, lease, ids, c); host.populate(s, lease);
      const attestation = s.graph.recordParentAttestation(s.authority, lease, request);
      if (revoke) {
        s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "before validation");
        expect(() => s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentAttestationId: attestation.attestationId, parentValidated: true })).toThrow(/nonrevoked/);
        expect(() => s.graph.recordParentAttestation(s.authority, lease, request)).toThrow(/revoked parent attestation/);
      } else {
        s.graph.retireFamily(s.authority, lease, "RETRYABLE", "new validation revision required", "scientific_block"); s.graph.transition(s.authority, u.unitId, "READY", "retry with new family");
        const next = reserve(s.graph, s.authority, u.unitId, 1000);
        expect(() => s.graph.validateUnit(s.authority, next, ids, { ...validation(c), parentAttestationId: attestation.attestationId })).toThrow(/stale parent attestation/);
      }
    }
  });
  test("parent bootstrap and attestation documents/events are immutable across reopening", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = { ...publication(s, u, ids), publicationLevel: 2 }; host.populate(s, lease);
    const attestation = s.graph.recordParentAttestation(s.authority, lease, attestationRequest(s, u, lease, ids, c));
    host.identity.actorId = "worker:changed-bootstrap"; expect(() => s.graph.bootstrapParentAuthority(s.authority)).toThrow(/immutable parent bootstrap/);
    host.identity.actorId = attestation.parentActorId;
    const altered = { ...attestation, evidenceDigest: "0".repeat(64) }; s.graph.db.query("UPDATE ff8_graph_parent_attestations SET document=? WHERE attestation_id=?").run(JSON.stringify(altered), attestation.attestationId);
    s.graph.close(); s.graph = new GraphStore(s.p, { parentAuthority: host.provider }); opened.push(s.graph);
    expect(() => s.graph.parentAttestation("m", attestation.attestationId)).toThrow(/attestation digest mismatch/);
    expect(() => s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentAttestationId: attestation.attestationId })).toThrow(/attestation digest mismatch/);
  });
  test("v3 to v6 additive reopen preserves own facts/harness v1; legacy level2 boolean cannot satisfy", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(c)); s.graph.preparePublication(s.authority, lease, c, { verifiedEffect: "satisfies" }); const done = s.graph.commitReadback(s.authority, lease, readback(c));
    const before = s.graph.replay("m");
    s.graph.db.exec("DROP TABLE ff8_graph_parent_attestations; DROP TABLE ff8_graph_native_authors; DROP TABLE ff8_graph_parent_authorities; UPDATE ff8_graph_metadata SET version=3;");
    s.graph.db.query("UPDATE ff8_graph_commits SET document=? WHERE mission=? AND unit_id=?").run(JSON.stringify({ ...done, publicationLevel: 2 }), "m", u.unitId); // fixture of pre-v4 self-asserted level 2
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.db.query("SELECT version FROM ff8_graph_metadata").get()).toEqual({ version: 6 }); expect(s.graph.db.query("SELECT version FROM ff8_harness_metadata WHERE component='engine'").get()).toEqual({ version: 1 });
    expect(s.graph.replay("m")).toEqual(before); expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_commits").get()).toEqual({ n: 1 });
    expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_parent_authorities").get()).toEqual({ n: 0 });
  });
  test("level1 validation with parentValidated true cannot upgrade publication to level2", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), c = identified({ ...publication(s, u, ids), publicationLevel: 2 });
    s.graph.validateUnit(s.authority, lease, ids, { ...validation(c), parentValidated: true });
    expect(() => s.graph.preparePublication(s.authority, lease, c)).toThrow(/boolean is not a parent attestation/);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_publications").get()).toEqual({ n: 0 });
  });
});

describe("OWN v6 exact artifact witnesses and L1-valid publication operations", () => {
  test("RV6R2-03 multifunction R/F0 result cannot become F1 receipt or unlock its consumer", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), a = unit(s, "fn0", 0), b = unit(s, "fn1", 1);
    const u = { ...a, unitId: "aggregate", ownedFunctionIds: [...a.ownedFunctionIds, ...b.ownedFunctionIds], subIntents: [...a.subIntents, ...b.subIntents] };
    s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const commit = s.graph.commitReadback(s.authority, lease, readback(pending));
    const request = { commitId: commit.commitId, artifactId: ids[2]!, functionId: a.ownedFunctionIds[0]!, artifactKind: "reconciled_c" as const, sourceResultIds: [ids[2]!] };
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, functionId: b.ownedFunctionIds[0]! })).toThrow(/another canonical function/);
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, sourceResultIds: [ids[5]!] })).toThrow(/another canonical function/);
    const binding = s.graph.recordArtifactBinding(s.authority, request), receipt = artifactReceipt(binding);
    const bytes = (s.graph.db.query("SELECT document FROM ff8_graph_results WHERE result_id=?").get(ids[2]!) as { document: string }).document;
    expect(receipt.artifactSha256).toBe(createHash("sha256").update(bytes, "utf8").digest("hex")); expect(receipt.artifactSha256).not.toBe(commit.readbackHash);
    const cursor = s.graph.events.cursor("m"); expect(s.graph.recordArtifactBinding({ ...s.authority, now: 12 }, structuredClone(request))).toEqual(binding); expect(s.graph.events.cursor("m")).toEqual(cursor);
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, artifactKind: "semantic_description" })).toThrow(/immutable artifact binding/);
    const wrong = { ...receipt, functionId: b.ownedFunctionIds[0]! };
    for (const attack of [wrong, { ...receipt, artifactKind: "validated_knowledge" }, { ...receipt, artifactSha256: commit.readbackHash }, { ...receipt, knowledgeRevision: 3 }, { ...receipt, validation: "parent-validated" as const }]) expect(() => s.graph.recordKnowledgeReceipt(s.authority, attack)).toThrow(/authoritative artifact tuple/);
    // Simulate a preserved v5 receipt: G1 must independently revalidate the tuple.
    s.graph.db.query("INSERT INTO ff8_graph_receipts VALUES(?,?,?,?)").run("m", wrong.commitId, wrong.artifactId, canonical(wrong));
    const consumer = unit(s, "consumer", 2); consumer.prerequisites = [{ id: "need-fn1", kind: "obligatory", producerUnitId: u.unitId, requiredPublicationLevel: 1, artifactKind: "reconciled_c", dispensed: false, dispensationReason: null }]; s.graph.addUnit(s.authority, consumer);
    const requirement = { artifactId: wrong.artifactId, artifactSha256: wrong.artifactSha256, functionId: wrong.functionId, moduleSha256: wrong.moduleSha256, artifactKind: wrong.artifactKind, minimumRevision: 2, maximumRevision: 2, publicationLevel: 1, validation: "fixture-only" as const };
    let expected = freeze(s.graph, s.authority, [consumer.unitId], { requirementById: { "need-fn1": requirement } });
    expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, expected)).toThrow(/missing artifact receipt/);
    s.graph.close(); s.graph = new GraphStore(s.p, { parentAuthority: host.provider }); opened.push(s.graph);
    expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, expected)).toThrow(/missing artifact receipt/);
    const right = artifactReceipt(s.graph.recordArtifactBinding(s.authority, { ...request, artifactId: ids[5]!, functionId: b.ownedFunctionIds[0]!, sourceResultIds: [ids[5]!] })); s.graph.recordKnowledgeReceipt(s.authority, right);
    expected = freeze(s.graph, s.authority, [consumer.unitId], { requirementById: { "need-fn1": { ...requirement, artifactId: right.artifactId, artifactSha256: right.artifactSha256 } } });
    expect(s.graph.reserve(s.authority, consumer.unitId, 100, expected).unitId).toBe(consumer.unitId);
  });
  test("RV6R2-03 no host or missing witness cannot manufacture typed facts; old receipt cannot satisfy after reopen", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const commit = s.graph.commitReadback(s.authority, lease, readback(pending));
    const request = { commitId: commit.commitId, artifactId: ids[2]!, functionId: u.ownedFunctionIds[0]!, artifactKind: "reconciled_c" as const, sourceResultIds: [ids[2]!] };
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, artifactId: commit.validatedFactIds[0]!, content: "actual local fact" })).toThrow(/parent-attested fact identity/);
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, content: "replacement result bytes" })).toThrow(/rematerialized/);
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, commitId: pending.commitId })).toThrow(/final scientific/);
    const binding = s.graph.recordArtifactBinding(s.authority, request), receipt = artifactReceipt(binding); s.graph.recordKnowledgeReceipt(s.authority, receipt);
    const history = s.graph.events.read("m"), cursor = s.graph.events.cursor("m"); s.graph.recordKnowledgeReceipt({ ...s.authority, now: 20 }, structuredClone(receipt)); expect(s.graph.events.cursor("m")).toEqual(cursor);
    s.graph.db.exec("DROP TABLE ff8_graph_artifact_bindings; UPDATE ff8_graph_metadata SET version=5"); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.events.read("m")).toEqual(history); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true);
    expect(() => s.graph.recordKnowledgeReceipt(s.authority, receipt)).toThrow(/missing authoritative artifact binding/);
    expect(() => s.graph.recordArtifactBinding(s.authority, request)).toThrow(/host parent authority/);
    const consumer = unit(s, "later", 1); consumer.prerequisites = [{ id: "required", kind: "obligatory", producerUnitId: u.unitId, requiredPublicationLevel: 1, artifactKind: receipt.artifactKind, dispensed: false, dispensationReason: null }]; s.graph.addUnit(s.authority, consumer);
    const expected = freeze(s.graph, s.authority, [consumer.unitId], { requirementById: { required: { ...receipt, minimumRevision: 2, maximumRevision: 2 } } });
    expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, expected)).toThrow(/missing artifact receipt/);
  });
  test("RV6R2-03 derived known bytes require exact attested facts/sources and revocation invalidates receipt reuse", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids); host.populate(s, lease);
    const attestation = s.graph.recordParentAttestation(s.authority, lease, attestationRequest(s, u, lease, ids, pending));
    s.graph.validateUnit(s.authority, lease, ids, { ...validation(pending), parentAttestationId: attestation.attestationId }); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const commit = s.graph.commitReadback(s.authority, lease, readback(pending));
    const request = { commitId: commit.commitId, artifactId: commit.validatedFactIds[0]!, functionId: u.ownedFunctionIds[0]!, artifactKind: "validated_knowledge" as const, sourceResultIds: [ids[2]!], content: "Fact local validé — bytes réellement connus" };
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, artifactId: "fact:not-attested" })).toThrow(/parent-attested/);
    expect(() => s.graph.recordArtifactBinding(s.authority, { ...request, sourceResultIds: [] })).toThrow(/nonempty artifact sources/);
    const binding = s.graph.recordArtifactBinding(s.authority, request), receipt = artifactReceipt(binding); s.graph.recordKnowledgeReceipt(s.authority, receipt);
    expect(binding.artifactSha256).toBe(createHash("sha256").update(request.content, "utf8").digest("hex"));
    request.content = "caller mutation"; binding.sources[0]!.digest = "caller mutation";
    expect(s.graph.artifactBinding("m", commit.commitId, receipt.artifactId).content).not.toBe(request.content);
    const consumer = unit(s, "later", 1); consumer.prerequisites = [{ id: "required", kind: "obligatory", producerUnitId: u.unitId, requiredPublicationLevel: 2, artifactKind: receipt.artifactKind, dispensed: false, dispensationReason: null }]; s.graph.addUnit(s.authority, consumer);
    const expected = freeze(s.graph, s.authority, [consumer.unitId], { requirementById: { required: { ...receipt, minimumRevision: 2, maximumRevision: 2 } } });
    s.graph.close(); s.graph = new GraphStore(s.p, { parentAuthority: host.provider }); opened.push(s.graph); expect(s.graph.artifactBinding("m", commit.commitId, receipt.artifactId).parentAttestationId).toBe(attestation.attestationId);
    s.graph.revokeParentAttestation(s.authority, attestation.attestationId, "offline fixture retraction");
    expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false); expect(() => s.graph.recordKnowledgeReceipt(s.authority, receipt)).toThrow(/verified publication/);
    expect(() => s.graph.reserve(s.authority, consumer.unitId, 100, expected)).toThrow(/missing artifact receipt/);
    expect(() => s.graph.commitReadback(s.authority, lease, readback(pending))).toThrow(/parent attestation/);
  });
  test("RV6R2-04 every normative L1 cross-invariant is enforced before publishing or consuming", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); const before = s.graph.events.cursor("m");
    const invalid = [{ ...pending, commitId: "a".repeat(64) }, identified({ ...pending, isGitCommit: true } as any), identified({ ...pending, outputRevision: 5 }), identified({ ...pending, futurePrerequisiteEffect: "satisfies" }), identified({ ...pending, publicationTargetId: "local:cache:idb-snapshot" }), identified({ ...pending, publicationLevel: 3 })];
    for (const attack of invalid) { expect(oracleCommitViolations(attack).length).toBeGreaterThan(0); expect(() => s.graph.preparePublication(s.authority, lease, attack, { verifiedEffect: "satisfies" })).toThrow(); }
    expect(s.graph.events.cursor("m")).toEqual(before); expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_publication_effects").get()).toEqual({ n: 0 });
    expect(oracleCommitViolations(pending)).toEqual([]); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" });
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false); const history = s.graph.events.read("m"), cursor = s.graph.events.cursor("m");
    s.graph.preparePublication({ ...s.authority, now: 12 }, lease, pending, { verifiedEffect: "satisfies" }); expect(s.graph.events.cursor("m")).toEqual(cursor);
    expect(() => s.graph.preparePublication(s.authority, lease, pending)).toThrow(/immutable publication effect changed/);
    s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph); expect(s.graph.events.read("m")).toEqual(history);
    expect(() => s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "invalidates_future" })).toThrow(/immutable publication effect changed/);
    const final = s.graph.commitReadback(s.authority, lease, readback(pending)); expect(oracleCommitViolations(final)).toEqual([]); expect(final.futurePrerequisiteEffect).toBe("satisfies"); expect(final.commitId).not.toBe(pending.commitId);
    const stored = s.graph.db.query("SELECT request,digest FROM ff8_graph_publications").get() as { request: string; digest: string }; expect(JSON.parse(stored.request)).toEqual(pending); expect(stored.digest).toBe(fingerprint(pending));
  });
  test("RV6R2-04 migration preserves v5 evidence and never retroactively adds a verified-effect authorization", async () => {
    const s = setup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" });
    const original = s.graph.db.query("SELECT * FROM ff8_graph_publications").get(), history = s.graph.events.read("m");
    s.graph.db.exec("DROP TABLE ff8_graph_publication_effects; UPDATE ff8_graph_metadata SET version=5"); s.graph.close(); s.graph = new GraphStore(s.p); opened.push(s.graph);
    expect(s.graph.db.query("SELECT * FROM ff8_graph_publications").get()).toEqual(original); expect(s.graph.events.read("m")).toEqual(history);
    expect(() => s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" })).toThrow(/legacy publication/);
    expect(() => s.graph.commitReadback(s.authority, lease, readback(pending))).toThrow(/legacy publication/);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false); expect(s.graph.leases.get("m", u.unitId)!.state).toBe("active");
  });
  for (const backend of ["memory", "disk"]) test(`RV6R2 independent ${backend} oracle sees only valid pending/final docs and exact result tuples`, async () => {
    const host = parentHost(), s = (backend === "memory" ? memorySetup : setup)({ parentAuthority: host.provider }), u = unit(s);
    const wrong = structuredClone(u); wrong.subIntents.forEach(sub => sub.harnessIdentity.ea = s.snapshot.nodes[1].ea);
    expect(() => s.graph.addUnit(s.authority, wrong)).toThrow(/canonical function projection/);
    s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending));
    expect(() => s.graph.preparePublication(s.authority, lease, identified({ ...pending, futurePrerequisiteEffect: "satisfies" }))).toThrow(/unverified publication/);
    expect(() => s.graph.preparePublication(s.authority, lease, identified({ ...pending, publicationTargetId: "local:cache:IDB-snapshot" }))).toThrow(/outside mission/);
    s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); expect(s.graph.satisfies("m", u.unitId, 1)).toBe(false);
    const final = s.graph.commitReadback(s.authority, lease, readback(pending)); expect(oracleCommitViolations(pending)).toEqual([]); expect(oracleCommitViolations(final)).toEqual([]);
    const binding = s.graph.recordArtifactBinding(s.authority, { commitId: final.commitId, artifactId: ids[2]!, functionId: u.ownedFunctionIds[0]!, artifactKind: "reconciled_c", sourceResultIds: [ids[2]!] }), receipt = artifactReceipt(binding);
    s.graph.recordKnowledgeReceipt(s.authority, receipt); expect(() => s.graph.recordKnowledgeReceipt(s.authority, { ...receipt, functionId: s.snapshot.nodes[1].id })).toThrow(/authoritative artifact tuple/);
    expect(s.graph.satisfies("m", u.unitId, 1)).toBe(true);
  });
  test("RV6R2-02 self-consistently rehashed FAIL/empty/mismatched checks and provenance never survive reuse", async () => {
    const attacks: Array<(a: any) => void> = [a => a.checks[0].outcome = "fail", a => a.checks = [], a => a.checks[0].evidenceDigest = "0".repeat(64), a => a.checks[0].detail = " ", a => a.resultDigests[a.resultIds[0]] = "0".repeat(64), a => a.authorDigests = {}, a => a.evidenceDigest = "0".repeat(64)];
    for (const mutate of attacks) {
      const host = parentHost(), s = memorySetup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
      const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids); host.populate(s, lease);
      const original = s.graph.recordParentAttestation(s.authority, lease, attestationRequest(s, u, lease, ids, pending));
      s.graph.validateUnit(s.authority, lease, ids, { ...validation(pending), parentAttestationId: original.attestationId }); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); s.graph.commitReadback(s.authority, lease, readback(pending));
      const altered = structuredClone(original); mutate(altered); const { attestationId: oldId, ...content } = altered; altered.attestationId = fingerprint(content);
      s.graph.db.query("UPDATE ff8_graph_parent_attestations SET attestation_id=?,document=?,digest=?,event_key=? WHERE attestation_id=?").run(altered.attestationId, canonical(altered), fingerprint(altered), `parent_attestation:${altered.attestationId}`, oldId);
      // Rehash every affected journal reference too: digest checking alone would
      // accept this fixture. Scientific semantics must still reject it.
      for (const event of s.graph.events.read("m")) {
        const payload = event.kind === "parent_attested" ? altered : JSON.parse(canonical(event.payload).split(oldId).join(altered.attestationId));
        const key = event.key.split(oldId).join(altered.attestationId);
        s.graph.db.query("UPDATE ff8_events SET key=?,payload=?,digest=? WHERE mission=? AND sequence=?").run(key, canonical(payload), fingerprint({ kind: event.kind, time: event.time, payload, unitId: event.unitId }), "m", event.sequence);
      }
      expect(s.graph.replay("m").states[u.unitId]).toBe("COMMITTED"); // audit projection is deliberately not scientific authorization
      expect(() => s.graph.parentAttestation("m", altered.attestationId)).toThrow(); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(false);
      expect(() => s.graph.commitReadback(s.authority, lease, readback(pending))).toThrow(/parent attestation/);
    }
  });
  test("RV6R2-02 parent callbacks cannot mutate validation, pending effect or readback snapshots", async () => {
    const host = parentHost(); let mutate = () => {};
    host.provider.verifyParent = authority => { mutate(); authority.lease.owner = "host-mutated-argument"; return { ...host.identity }; };
    const s = setup({ parentAuthority: host.provider }), u = unit(s); u.requiredPublicationLevel = 2; s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids); host.populate(s, lease);
    const attestation = s.graph.recordParentAttestation(s.authority, lease, attestationRequest(s, u, lease, ids, pending));
    const callerIds = [...ids], callerValidation = { ...structuredClone(validation(pending)), parentAttestationId: attestation.attestationId };
    mutate = () => { callerIds.splice(0); callerValidation.evidence.splice(0); callerValidation.validatedFactIds[0] = "mutated"; };
    s.graph.validateUnit(s.authority, lease, callerIds, callerValidation); expect(callerIds).toEqual([]);
    const callerPending = structuredClone(pending), effect = { verifiedEffect: "satisfies" as const };
    mutate = () => { callerPending.publicationTargetId = "local:cache:idb-snapshot"; (effect as any).verifiedEffect = "invalidates_future"; };
    s.graph.preparePublication(s.authority, lease, callerPending, effect);
    const callerReadback = readback(pending); mutate = () => { callerReadback.hash = "0".repeat(64); callerReadback.source = ""; };
    const committed = s.graph.commitReadback(s.authority, lease, callerReadback); mutate = () => {};
    expect(committed.publicationTargetId).toBe(pending.publicationTargetId); expect(committed.futurePrerequisiteEffect).toBe("satisfies"); expect(s.graph.satisfies("m", u.unitId, 2)).toBe(true);
    expect(oracleCommitViolations(committed)).toEqual([]);
  });
  test("RV6R2-03 two independent processes record one immutable exact artifact witness", async () => {
    const host = parentHost(), s = setup({ parentAuthority: host.provider }), u = unit(s); s.graph.addUnit(s.authority, u);
    const lease = reserve(s.graph, s.authority, u.unitId, 1000), ids = await complete(s, u, lease), pending = publication(s, u, ids);
    s.graph.validateUnit(s.authority, lease, ids, validation(pending)); s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" }); const commit = s.graph.commitReadback(s.authority, lease, readback(pending));
    const request = { commitId: commit.commitId, artifactId: ids[2]!, functionId: u.ownedFunctionIds[0]!, artifactKind: "reconciled_c", sourceResultIds: [ids[2]!] };
    const moduleUrl = pathToFileURL(join(import.meta.dir, "..", "src", "graph-store.ts")).href;
    const run = () => {
      const code = `import {GraphStore} from ${JSON.stringify(moduleUrl)}; const g=new GraphStore(${JSON.stringify(s.p)},{parentAuthority:{verifyParent(){return ${JSON.stringify(host.identity)}},verifyNativeAuthor(){return undefined}}}); try {console.log(JSON.stringify(g.recordArtifactBinding(${JSON.stringify(s.authority)},${JSON.stringify(request)})));} finally {g.close();}`;
      const child = Bun.spawn([process.execPath, "-e", code], { cwd: join(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" }); return Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    };
    const results = await Promise.all([run(), run()]); expect(results.every(r => r[2] === 0 && r[1] === "")).toBe(true); expect(results[0]![0]).toBe(results[1]![0]);
    expect(s.graph.db.query("SELECT count(*) n FROM ff8_graph_artifact_bindings").get()).toEqual({ n: 1 }); expect(s.graph.events.read("m").filter(e => e.kind === "artifact_binding_verified")).toHaveLength(1);
  });
  test("RV6R2 deferred dispatch and result/proof/receipt mutation cannot change frozen attribution", async () => {
    const s = memorySetup(), u = unit(s); s.graph.addUnit(s.authority, u); const lease = reserve(s.graph, s.authority, u.unitId, 1000), request = body(u, "A"); s.graph.prepareAdmission(s.authority, lease, request);
    const io = deferred<Record<string, unknown>>(), callerAuthority = structuredClone(s.authority), callerLease = structuredClone(lease);
    let sent: any;
    const pending = s.graph.dispatch(callerAuthority, callerLease, request.executionId, { async submit(_mission, command) { sent = command; return io.promise; } });
    expect(() => sent.dossier.function.ea = s.snapshot.nodes[1].ea).toThrow();
    callerAuthority.lease.owner = "mutated"; callerAuthority.lease.token++; callerLease.unitId = "mutated"; callerLease.token++;
    const receipt = { executionId: request.executionId, state: "accepted" }, original = structuredClone(request); (request.command.dossier as any).function.ea = s.snapshot.nodes[1].ea;
    io.resolve(receipt); const returned = await pending; receipt.state = "failed"; returned.state = "failed";
    expect(s.graph.admission(original.executionId)!.receipt).toMatchObject({ executionId: original.executionId, state: "accepted" });
    const terminal = proof(s.graph, original.executionId); s.graph.proveTerminal(s.authority, u.unitId, original.executionId, "completed", terminal); terminal.state = "failed";
    const output = { useful: true }; expect(s.graph.retainResult(s.authority, lease, original.executionId, "owned-result", output)).toBe(true); output.useful = false;
    const b = body(u, "B"); s.graph.prepareAdmission(s.authority, lease, b); await s.graph.dispatch(s.authority, lease, b.executionId, { async submit() { return { executionId: b.executionId, state: "accepted" }; } });
    s.graph.proveTerminal(s.authority, u.unitId, b.executionId, "completed", proof(s.graph, b.executionId));
    expect(() => s.graph.retainResult(s.authority, lease, b.executionId, "owned-result", { useful: true })).toThrow(/attribution changed/);
    expect(s.graph.db.query("SELECT execution_id,document FROM ff8_graph_results WHERE result_id='owned-result'").get()).toEqual({ execution_id: original.executionId, document: canonical({ useful: true }) });
  });
});
