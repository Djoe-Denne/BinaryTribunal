/** Real OWN persistence APIs with local fixture callbacks only. No native client,
 * network transport, real author, scientific attestation or IDB publication. */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Store } from "../../src/store";
import type { InputBundle, Snapshot } from "../../src/domain";
import { GraphStore, type Admission, type ArtifactReceipt, type GraphStoreOptions, type KnowledgeCommit,
  type NativeAuthorIdentity, type ParentAttestationRequest, type ParentAuthorityProvider } from "../../src/graph-store";
import type { ControllerAuthority, UnitLease } from "../../src/unit-lease";
import { planMission, type PlannerPolicy, type WorkUnit } from "../../src/planner";
import { clusterMultiview } from "../../src/semantic-index";
import { planAdoption, type FrozenActiveUnit, type UnitQuiescenceProof } from "../../src/lineage";
import { groupsFor, jsonClone, MISSION, oracleCanonical, oracleDigest, policyFor, readiness, receiptFor, sha256, snapshotOf } from "./graph-interop-support";

const resources: Array<{ close(): void }> = [], artifacts: string[] = [];
afterEach(() => {
  for (const resource of resources.splice(0).reverse()) { try { resource.close(); } catch { /* a reopen test closed this handle already */ } }
  for (const path of artifacts.splice(0)) for (const suffix of ["", "-wal", "-shm"]) {
    if (existsSync(path + suffix)) {
      const bytes = readFileSync(path + suffix);
      console.info(JSON.stringify({ evidence: "graph-interop-owned-offline-db", path: path + suffix, bytes: bytes.length,
        sha256: sha256(bytes), retained: true, native: false }));
    }
  }
});
let executionSequence = 0;
const MODEL = { providerID: "offline-fixture", id: "no-runtime", variant: "fixture" };

function setup(level: 1 | 2 = 1, options: GraphStoreOptions = {}, count = 1,
  calls: readonly (readonly [number, number])[] = [], configure?: (policy: PlannerPolicy, snapshot: ReturnType<typeof snapshotOf>) => void) {
  const path = join(mkdtempSync("C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-"), "own.sqlite");
  artifacts.push(path);
  const store = new Store(path); resources.push(store);
  store.create({ schemaVersion: 1, missionId: MISSION, revision: 0, config: {}, status: "running", cycle: 1,
    stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 } as unknown as Snapshot);
  const authority: ControllerAuthority = { lease: store.acquireLease(MISSION, "offline-controller", 10, 1_000_000), now: 11 };
  const snapshot = snapshotOf(count, calls), grouped = groupsFor(snapshot), policy = policyFor(snapshot, grouped.partition.partitionId);
  policy.publicationLevel = level;
  configure?.(policy, snapshot);
  const result = planMission(snapshot, grouped.groups, policy), graph = new GraphStore(path, options); resources.push(graph);
  graph.putSnapshot(authority, jsonClone(snapshot) as unknown as Record<string, unknown>);
  graph.putPartition(authority, jsonClone(grouped.partition) as unknown as Record<string, unknown>);
  for (const unit of result.units) graph.addUnit(authority, unit);
  expect(graph.freezePlan(authority, result.plan, result.sidecar, result.binding)).toBe(1);
  for (const unit of result.units) if (readiness(result, unit).ready) graph.transition(authority, unit.unitId, "READY", "offline fixture is initially ready");
  return { path, store, graph, authority, snapshot, partition: grouped.partition, result };
}
type Setup = ReturnType<typeof setup>;
function reserve(s: Setup): UnitLease {
  return s.graph.reserve(s.authority, s.result.units[0]!.unitId, 1000, s.graph.reservationExpectation(MISSION));
}
function inputsFor(sub: WorkUnit["subIntents"][number]): InputBundle {
  return { schemaVersion: 1, role: sub.role, cycle: 1, identity: jsonClone(sub.harnessIdentity), files: [],
    accessibleRules: [], requiredTools: [], knowledge: { version: "offline-fixture-inputs-1", fingerprint: sha256("fixture-knowledge"),
      leadsFingerprint: oracleDigest([]), files: [] } };
}
function pinInputs(s: Setup, lease: UnitLease): void {
  for (const sub of s.graph.unit(MISSION, lease.unitId).subIntents) s.graph.freezeAdmissionInputs(s.authority, lease, sub.subIntentId, inputsFor(sub));
}
function admission(sub: WorkUnit["subIntents"][number]): Admission {
  const executionId = `offline:${++executionSequence}`, attemptId = `attempt:${executionId}`, taskId = `task:${executionId}`;
  const inputs = inputsFor(sub), inputFingerprint = oracleDigest(inputs);
  return { executionId, attemptId, idempotencyKey: executionId, subIntentId: sub.subIntentId, role: sub.role,
    command: { executionId, attemptId, idempotencyKey: executionId, taskId, profile: "offline-fixture", model: MODEL,
      prompt: "Known synthetic bytes only; no runtime dispatch", context: { mode: "fresh" }, worktree: false, requiredAccess: [],
      metadata: { inputFingerprint }, dossier: { version: 1, functionId: sub.functionId, function: sub.harnessIdentity,
        role: sub.role, cycle: 1, effectiveModel: MODEL, inputs, resultHeader: { schemaVersion: 1, missionId: MISSION, taskId,
          executionId, attemptId, cycle: 1, authorId: executionId, identity: sub.harnessIdentity, inputFingerprint,
          inputVersions: [], previousResultIds: [] } } } };
}
function terminal(s: Setup, unitId: string, body: Admission, state: "completed" | "absent" = "completed"): void {
  s.graph.proveTerminal(s.authority, unitId, body.executionId, state, { executionId: body.executionId,
    requestDigest: oracleDigest(body), state, quiescent: true, source: "offline-fixture-readback-NOT-native" });
}
function offlineAuthority() {
  const authors = new Map<string, NativeAuthorIdentity>();
  const provider: ParentAuthorityProvider = {
    verifyParent: authority => ({ version: 1, role: "parent", missionId: MISSION, controllerOwner: authority.lease.owner,
      actorId: "offline-parent", principalId: "fixture-principal", source: "offline-trust-fixture-NOT-authentication", sourceHash: sha256("parent-fixture") }),
    verifyNativeAuthor: (_authority, expected) => authors.get(expected.executionId),
  };
  return { provider, authors };
}
async function complete(s: Setup, lease: UnitLease, authors?: Map<string, NativeAuthorIdentity>) {
  const unit = s.graph.unit(MISSION, lease.unitId), resultIds: string[] = [], documents = new Map<string, Record<string, unknown>>();
  pinInputs(s, lease);
  for (const sub of unit.subIntents) {
    const body = admission(sub), digest = s.graph.prepareAdmission(s.authority, lease, body);
    expect(digest).toBe(oracleDigest(body));
    await s.graph.dispatch(s.authority, lease, body.executionId, { async submit(_mission, command) {
      const author: NativeAuthorIdentity = { version: 1, missionId: MISSION, executionId: body.executionId, requestDigest: digest,
        authorId: body.executionId, sessionId: `fixture-session:${body.executionId}`, profile: "offline-fixture", model: MODEL,
        fresh: true, parentSessionId: null, source: "offline-author-fixture-NOT-native", sourceHash: sha256(body.executionId) };
      authors?.set(body.executionId, author);
      return { executionId: command.executionId, revision: 1, state: "accepted", nativeSessionId: author.sessionId, authorId: author.authorId };
    } });
    terminal(s, unit.unitId, body);
    const resultId = `result:${body.executionId}`, document = { executionId: body.executionId, resultId,
      role: sub.role, identity: sub.harnessIdentity, authorId: body.executionId, fixture: "not a scientific result", value: `known-${sub.role}` };
    expect(s.graph.retainResult(s.authority, lease, body.executionId, resultId, document)).toBe(true);
    resultIds.push(resultId); documents.set(resultId, document);
  }
  return { resultIds, documents };
}
function pendingPublication(s: Setup, lease: UnitLease, resultIds: string[]): KnowledgeCommit {
  const content: KnowledgeCommit = { schemaVersion: 1, commitId: "", unitId: lease.unitId,
    inputRevision: 1, outputRevision: 2, resultIds, validatedFactIds: ["fact:offline-interop"],
    evidence: [{ id: "evidence:offline-interop", source: "fixture-only", sha256: sha256("explicit fixture evidence"), detail: "No scientific/native authority claimed" }],
    publicationLevel: s.result.units[0]!.requiredPublicationLevel, publicationTargetId: "fixture:graph-interop",
    readbackStatus: "pending", readbackHash: sha256("fixture publication bytes"), futurePrerequisiteEffect: "does_not_satisfy", isGitCommit: false };
  content.commitId = oracleDigest(content, "commitId"); return content;
}
function readback(commit: KnowledgeCommit) {
  return { targetId: commit.publicationTargetId, hash: commit.readbackHash, requestDigest: oracleDigest(commit), source: "offline-fixture-publication-readback" };
}

describe("L7 interop: actual L2/L3/L5 plans in OWN L6 persistence", () => {
  test("immutable real plan survives reopen and same-resource reservations across two handles are fenced", () => {
    const s = setup(), before = oracleCanonical(s.result);
    s.graph.close();
    const reopened = new GraphStore(s.path); resources.push(reopened); s.graph = reopened;
    const expected = reopened.reservationExpectation(MISSION);
    expect(expected.bindingFingerprint).toBe(oracleDigest(s.result.binding, "fingerprint"));
    const second = new GraphStore(s.path); resources.push(second);
    const lease = reopened.reserve(s.authority, s.result.units[0]!.unitId, 1000, expected);
    expect(() => second.reserve(s.authority, lease.unitId, 1000, expected)).toThrow();
    expect(reopened.leases.get(MISSION, lease.unitId)!.resourceKeys).toEqual(s.result.units[0]!.ownedFunctionIds.map(id => `fn:${id}`));
    const changed = jsonClone(s.snapshot); changed.nodes[0]!.name = "rewritten same snapshot ID";
    changed.normalizedFingerprint = oracleDigest(changed, "normalizedFingerprint");
    expect(() => second.putSnapshot(s.authority, changed as unknown as Record<string, unknown>)).toThrow();
    expect(oracleCanonical(s.result)).toBe(before);
    expect(second.replay(MISSION).states[lease.unitId]).toBe("RESERVED");
  });

  test("reattaching even the same controller fences the old family, retaining claims", () => {
    const s = setup(), lease = reserve(s), second = new Store(s.path); resources.push(second);
    const next: ControllerAuthority = { lease: second.acquireLease(MISSION, s.authority.lease.owner, 12, 1_000_000), now: 13 };
    expect(next.lease.token).toBeGreaterThan(s.authority.lease.token);
    expect(() => s.graph.tick(s.authority, "stale-controller")).toThrow();
    expect(() => s.graph.leases.assert(lease, next)).toThrow();
    expect(s.graph.leases.get(MISSION, lease.unitId)!.state).toBe("active");
    expect(s.graph.db.query("SELECT resource_key FROM ff8_unit_claims").all()).toHaveLength(1);
    expect(() => s.graph.reserve(next, lease.unitId, 1000, s.graph.reservationExpectation(MISSION))).toThrow();
  });

  test("real new-plan activation uses CAS; stale active-plan expectations cannot reserve unchanged function IDs", () => {
    const s = setup(1, {}, 2), previous = s.graph.reservationExpectation(MISSION);
    const policy = policyFor(s.snapshot, s.partition.partitionId); policy.version = "graph-interop-policy-2";
    const grouped = groupsFor(s.snapshot), next = planMission(s.snapshot, grouped.groups, policy);
    expect(next.plan.planId).not.toBe(s.result.plan.planId);
    expect(() => s.graph.freezePlan(s.authority, next.plan, next.sidecar, next.binding, 0)).toThrow();
    expect(s.graph.freezePlan(s.authority, next.plan, next.sidecar, next.binding, 1)).toBe(2);
    expect(() => s.graph.reserve(s.authority, next.units[0]!.unitId, 1000, previous)).toThrow();
    const current = s.graph.reservationExpectation(MISSION);
    expect(current.activePlanRevision).toBe(2);
    expect(s.graph.reserve(s.authority, next.units[0]!.unitId, 1000, current).state).toBe("active");
    expect(s.graph.db.query("SELECT plan_id FROM ff8_graph_plans WHERE mission=?").all(MISSION)).toHaveLength(2);
  });

  test("L5 external fixture receipt is not laundered into a durable L6 authority binding", () => {
    const s = setup(1, {}, 2, [[0, 1]], (policy, snapshot) => {
      const requirement = policy.requirementsByFunction[snapshot.nodes[1]!.id]!;
      policy.edgeKinds = Object.fromEntries(snapshot.edges.map(e => [e.id, "external_satisfied"]));
      policy.externalReceiptsByEdge = Object.fromEntries(snapshot.edges.map(e => [e.id, receiptFor(requirement, null)]));
    });
    const caller = s.result.units.find(u => u.ownedFunctionIds.includes(s.snapshot.nodes[0]!.id))!;
    expect(readiness(s.result, caller).ready).toBe(true); // algorithmic input declaration only
    expect(caller.prerequisites[0]!.producerUnitId).toBeNull();
    expect(() => s.graph.reserve(s.authority, caller.unitId, 1000, s.graph.reservationExpectation(MISSION))).toThrow();
    expect(s.graph.leases.get(MISSION, caller.unitId)).toBeNull();
    expect(s.graph.db.query("SELECT resource_key FROM ff8_unit_claims").all()).toEqual([]);
  });

  test("an unsent exact admission can be released; an ambiguous sent one cannot use absence", async () => {
    const unsent = setup(), lease = reserve(unsent); pinInputs(unsent, lease);
    const body = admission(unsent.result.units[0]!.subIntents[0]!); unsent.graph.prepareAdmission(unsent.authority, lease, body);
    terminal(unsent, lease.unitId, body, "absent");
    unsent.graph.leases.releaseProven(unsent.authority, lease);
    expect(unsent.graph.leases.get(MISSION, lease.unitId)!.state).toBe("released");
    const sent = setup(), running = reserve(sent); pinInputs(sent, running);
    const ambiguous = admission(sent.result.units[0]!.subIntents[0]!); sent.graph.prepareAdmission(sent.authority, running, ambiguous);
    await expect(sent.graph.dispatch(sent.authority, running, ambiguous.executionId, { async submit() { throw new Error("offline lost reply"); } })).rejects.toThrow("offline lost reply");
    terminal(sent, running.unitId, ambiguous, "absent");
    expect(sent.graph.admission(ambiguous.executionId)!.state).toBe("AMBIGUOUS");
    sent.graph.leases.quarantine(sent.authority, running, "offline uncertain execution");
    expect(() => sent.graph.releaseQuarantine(sent.authority, running.unitId)).toThrow();
    expect(sent.graph.db.query("SELECT resource_key FROM ff8_unit_claims").all()).toHaveLength(1);
  });

  test("L4 quiescence callback resolves actual OWN L6 release/terminal inventory, not READY payload flags", () => {
    const s = setup(), lease = reserve(s); pinInputs(s, lease);
    const body = admission(s.result.units[0]!.subIntents[0]!); s.graph.prepareAdmission(s.authority, lease, body);
    const proposal = clusterMultiview({ snapshot: s.snapshot });
    expect(proposal.pass).toBe(true);
    const unit: FrozenActiveUnit = { unitId: lease.unitId, state: "READY", snapshotId: s.snapshot.snapshotId,
      ownedFunctionIds: s.result.units[0]!.ownedFunctionIds, attemptIds: [body.attemptId], claimIds: lease.resourceKeys,
      leaseHeld: false, workerStillExecutable: false };
    const proof: UnitQuiescenceProof = { unitId: unit.unitId, snapshotId: unit.snapshotId, attemptIds: [body.attemptId],
      claimIds: lease.resourceKeys, authorityRef: s.result.binding.fingerprint, revision: 1, quiescent: true, released: true,
      leaseHeld: false, workerStillExecutable: false };
    const input = { partition: proposal.partition!, lineageSidecar: proposal.lineageSidecar!, proposalDiagnostics: proposal.diagnostics,
      explicit: true, units: [unit], quiescence: [proof], proposalWitness: { evidence: proposal.proposalEvidence!, localReceipt: proposal.proposalReceipt },
      verifyQuiescence: (candidate: UnitQuiescenceProof, payload: FrozenActiveUnit) => {
        const actual = s.graph.unit(MISSION, payload.unitId), current = s.graph.leases.get(MISSION, payload.unitId);
        return actual.state === payload.state && actual.snapshotId === candidate.snapshotId && actual.knowledgeRevision === candidate.revision
          && current?.state === "released" && s.graph.admission(body.executionId)?.state === "TERMINAL"
          && oracleCanonical(candidate) === oracleCanonical(proof)
          && s.graph.db.query("SELECT resource_key FROM ff8_unit_claims WHERE unit_id=?").all(payload.unitId).length === 0;
      } };
    expect(planAdoption(input).migratableUnitIds).toEqual([]);
    terminal(s, lease.unitId, body, "absent"); s.graph.leases.releaseProven(s.authority, lease);
    s.graph.transition(s.authority, lease.unitId, "READY", "offline old family is actually released");
    expect(planAdoption(input).migratableUnitIds).toEqual([lease.unitId]);
    expect(planAdoption({ ...input, quiescence: [{ ...proof, revision: 2 }] }).migratableUnitIds).toEqual([]);
  });

  test("a late accepted reply/result after event expiry is retained, never commits/unblocks; complete quiescence releases claims only", async () => {
    const s = setup(), lease = reserve(s); pinInputs(s, lease);
    const body = admission(s.result.units[0]!.subIntents[0]!); s.graph.prepareAdmission(s.authority, lease, body);
    let deliver!: (receipt: Record<string, unknown>) => void;
    const waiting = s.graph.dispatch(s.authority, lease, body.executionId, { submit: async () => new Promise(resolve => { deliver = resolve; }) });
    s.graph.tick(s.authority, "expire-family", 1000); s.graph.expire(s.authority, lease.unitId);
    expect(() => s.graph.releaseQuarantine(s.authority, lease.unitId)).toThrow();
    deliver({ executionId: body.executionId, state: "accepted", revision: 1 }); await waiting;
    terminal(s, lease.unitId, body);
    expect(s.graph.retainResult(s.authority, lease, body.executionId, "result:late", { executionId: body.executionId, fixture: true })).toBe(false);
    expect(s.graph.satisfies(MISSION, lease.unitId, 1)).toBe(false);
    expect(s.graph.db.query("SELECT eligible FROM ff8_graph_results WHERE result_id=?").get("result:late")).toEqual({ eligible: 0 });
    s.graph.releaseQuarantine(s.authority, lease.unitId);
    expect(s.graph.leases.get(MISSION, lease.unitId)!.state).toBe("released");
    expect(s.graph.unit(MISSION, lease.unitId).state).toBe("QUARANTINED");
    expect(s.graph.replay(MISSION).committed).toEqual([]);
  });

  test("actual family/fixture commit/readback/artifact binding reopens with exact hashes, provenance and levels", async () => {
    const trust = offlineAuthority(), s = setup(1, { parentAuthority: trust.provider }), lease = reserve(s);
    const { resultIds, documents } = await complete(s, lease), pending = pendingPublication(s, lease, resultIds);
    s.graph.validateUnit(s.authority, lease, resultIds, { evidence: pending.evidence, validatedFactIds: pending.validatedFactIds, source: "artifact", parentValidated: false });
    s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" });
    expect(s.graph.satisfies(MISSION, lease.unitId, 1)).toBe(false);
    expect(() => s.graph.commitReadback(s.authority, lease, { ...readback(pending), hash: sha256("wrong bytes") })).toThrow();
    const committed = s.graph.commitReadback(s.authority, lease, readback(pending));
    expect(committed.commitId).toBe(oracleDigest(committed, "commitId"));
    expect(committed.commitId).not.toBe(pending.commitId);
    expect(s.graph.satisfies(MISSION, lease.unitId, 1)).toBe(true);
    expect(s.graph.satisfies(MISSION, lease.unitId, 2)).toBe(false);
    const artifactId = resultIds.at(-1)!, functionId = s.snapshot.nodes[0]!.id;
    const bound = s.graph.recordArtifactBinding(s.authority, { commitId: committed.commitId, artifactId, functionId,
      artifactKind: "reconciled_c", sourceResultIds: [artifactId] });
    expect(bound.content).toBe(oracleCanonical(documents.get(artifactId)));
    expect(bound.artifactSha256).toBe(sha256(oracleCanonical(documents.get(artifactId))));
    expect(bound.knowledgeRevision).toBe(2); expect(bound.validation).toBe("fixture-only");
    const receipt: ArtifactReceipt = { artifactId, artifactSha256: bound.artifactSha256, functionId, moduleSha256: bound.moduleSha256,
      artifactKind: bound.artifactKind, knowledgeRevision: 2, publicationLevel: 1, validation: "fixture-only", producerUnitId: lease.unitId,
      commitId: committed.commitId, readbackStatus: "verified", futurePrerequisiteEffect: "satisfies" };
    s.graph.recordKnowledgeReceipt(s.authority, receipt);
    for (const forged of [{ ...receipt, knowledgeRevision: 3 }, { ...receipt, artifactSha256: sha256("relabeled bytes") },
      { ...receipt, functionId: `${bound.moduleSha256}:0x2000` }, { ...receipt, publicationLevel: 2 }])
      expect(() => s.graph.recordKnowledgeReceipt(s.authority, forged)).toThrow();
    s.graph.close(); const reopened = new GraphStore(s.path, { parentAuthority: trust.provider }); resources.push(reopened);
    expect(reopened.artifactBinding(MISSION, committed.commitId, artifactId)).toEqual(bound);
    expect(reopened.satisfies(MISSION, lease.unitId, 1)).toBe(true);
    expect(reopened.commitReadback(s.authority, lease, readback(pending))).toEqual(committed);
    expect(reopened.replay(MISSION).committed).toEqual([lease.unitId]);
  });

  test("level2 fixture requires complete host-author evidence; boolean/self-label/revoked record cannot authorize", async () => {
    const trust = offlineAuthority(), s = setup(2, { parentAuthority: trust.provider }), lease = reserve(s);
    const { resultIds, documents } = await complete(s, lease, trust.authors), pending = pendingPublication(s, lease, resultIds);
    const validation = { evidence: pending.evidence, validatedFactIds: pending.validatedFactIds, source: "artifact" as const, parentValidated: true };
    expect(() => s.graph.validateUnit(s.authority, lease, resultIds, validation)).toThrow();
    const request: ParentAttestationRequest = { bindingFingerprint: s.result.binding.fingerprint, planFingerprint: s.result.plan.fingerprint,
      snapshotId: s.snapshot.snapshotId, knowledgeRevision: 1, resultIds,
      resultDigests: Object.fromEntries([...documents].map(([id, document]) => [id, oracleDigest(document)])),
      evidence: pending.evidence, validatedFactIds: pending.validatedFactIds,
      checks: [{ id: "fixture-check:1", kind: "offline-only", outcome: "pass", evidenceDigest: oracleDigest(pending.evidence), detail: "No native/scientific validation is claimed" }] };
    expect(() => s.graph.recordParentAttestation(s.authority, lease, { ...request, knowledgeRevision: 2 })).toThrow();
    expect(() => s.graph.recordParentAttestation(s.authority, lease, { ...request, resultIds: resultIds.slice(0, 2) })).toThrow();
    const verified = s.graph.recordParentAttestation(s.authority, lease, request);
    expect(verified.resultIds).toEqual(resultIds); expect(Object.keys(verified.authorDigests)).toHaveLength(3);
    s.graph.validateUnit(s.authority, lease, resultIds, { ...validation, parentAttestationId: verified.attestationId });
    s.graph.revokeParentAttestation(s.authority, verified.attestationId, "offline authority revocation test");
    expect(() => s.graph.preparePublication(s.authority, lease, pending, { verifiedEffect: "satisfies" })).toThrow();
    expect(s.graph.satisfies(MISSION, lease.unitId, 2)).toBe(false);
  });
});
