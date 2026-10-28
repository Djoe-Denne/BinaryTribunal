import { describe, expect, test } from "bun:test";
import { clusterMultiview, defaultMultiviewConfig, type LinkConstraint, type MultiviewResult } from "../../src/semantic-index";
import { assessKnowledgeDelta, comparePartitions, planAdoption, type FrozenActiveUnit, type KnowledgeDeltaView,
  type ProposalWitness, type UnitQuiescenceProof } from "../../src/lineage";
import { planMission } from "../../src/planner";
import { fixture, jsonClone, memberships, oracleCanonical, oracleDigest, policyFor, snapshotOf, SOURCE, sha256 } from "./graph-interop-support";

function noViews() {
  return { ...defaultMultiviewConfig(), views: { structure: false, data: false, lexical: false,
    embeddings: false, validatedRelations: false, capabilities: false } };
}
function constraint(snapshot: ReturnType<typeof snapshotOf>, kind: LinkConstraint["kind"], left: number, right: number): LinkConstraint {
  // Declared validated links in a synthetic truth fixture, not native validation.
  // L4 deliberately ignores the weaker `fixture-only` transport label.
  return { kind, leftId: snapshot.nodes[left]!.id, rightId: snapshot.nodes[right]!.id, validation: "validated",
    provenance: { ...snapshot.binaryArtifacts[0]!.provenance, source: SOURCE, sourceHash: sha256(SOURCE) } };
}
function witness(result: MultiviewResult): ProposalWitness {
  if (!result.proposalEvidence || !result.proposalReceipt) throw new Error("fixture proposal has no local receipt");
  return { evidence: result.proposalEvidence, localReceipt: result.proposalReceipt };
}
function adoption(result: MultiviewResult, explicit = true) {
  if (!result.partition || !result.lineageSidecar) throw new Error("fixture proposal has no partition");
  return { partition: result.partition, explicit, units: [] as FrozenActiveUnit[], lineageSidecar: result.lineageSidecar,
    proposalDiagnostics: result.diagnostics, proposalWitness: witness(result) };
}

describe("L7 interop: multiview constraints/lineage -> adoption -> immutable planning", () => {
  test("explicit fixture must/cannot links have an independent membership oracle and contradiction", () => {
    const snapshot = snapshotOf(4), config = noViews(), constraints = [constraint(snapshot, "must-link", 0, 1),
      constraint(snapshot, "must-link", 1, 2), constraint(snapshot, "cannot-link", 0, 3)];
    const weak = clusterMultiview({ snapshot, config, constraints: constraints.map(c => ({ ...c, validation: "fixture-only" })) });
    expect(weak.pass).toBe(true); expect(weak.constraints.status).toBe("none");
    expect(weak.constraints.rejected).toBe(3);
    expect(memberships(weak.partition!)).toEqual(snapshot.nodes.map(n => [n.id]));
    expect(weak.diagnostics.filter(d => d.code === "constraint-not-validated")).toHaveLength(3);
    const result = clusterMultiview({ snapshot, config, constraints });
    expect(result.pass).toBe(true); expect(result.constraints.status).toBe("satisfied");
    expect(memberships(result.partition!)).toEqual([[snapshot.nodes[0]!.id, snapshot.nodes[1]!.id, snapshot.nodes[2]!.id], [snapshot.nodes[3]!.id]]);
    const conflict = clusterMultiview({ snapshot, config, constraints: [...constraints, constraint(snapshot, "cannot-link", 0, 2)] });
    expect(conflict.pass).toBe(false); expect(conflict.constraints.status).toBe("unsatisfiable");
    expect(planAdoption(adoption(conflict)).adopted).toBe(false);
    const accepted = planAdoption(adoption(result));
    expect(accepted.adopted).toBe(true);
    const groups = accepted.partition.communities.map((c, i) => ({ groupId: `accepted:${i}`, partitionId: accepted.partition.partitionId,
      ownedFunctionIds: c.memberIds, contextFunctionIds: c.externalContextIds }));
    const plan = planMission(snapshot, groups, policyFor(snapshot, accepted.partition.partitionId));
    expect(plan.units.map(u => u.ownedFunctionIds).sort()).toEqual(memberships(accepted.partition).sort());
    expect(plan.units.flatMap(u => u.subIntents).every(s => snapshot.nodes.some(n => n.id === s.functionId && n.ea === s.harnessIdentity.ea))).toBe(true);
  });

  test("merge then split preserves immediate parent lineage without recycling content identities", () => {
    const snapshot = snapshotOf(4), config = noViews(), pairs = [constraint(snapshot, "must-link", 0, 1), constraint(snapshot, "must-link", 2, 3)];
    const base = clusterMultiview({ snapshot, config, constraints: pairs });
    expect(base.pass).toBe(true); expect(memberships(base.partition!)).toEqual([
      [snapshot.nodes[0]!.id, snapshot.nodes[1]!.id], [snapshot.nodes[2]!.id, snapshot.nodes[3]!.id]]);
    const merged = clusterMultiview({ snapshot, config, constraints: [...pairs, constraint(snapshot, "must-link", 1, 2)],
      previous: base.partition, previousLineageSidecar: base.lineageSidecar!, previousProposalWitness: witness(base) });
    expect(merged.pass).toBe(true); expect(memberships(merged.partition!)).toEqual([snapshot.nodes.map(n => n.id)]);
    expect([...merged.partition!.communities[0]!.parentContentIds].sort()).toEqual(base.partition!.communities.map(c => c.contentId).sort());
    const split = clusterMultiview({ snapshot, config, constraints: pairs, previous: merged.partition,
      previousLineageSidecar: merged.lineageSidecar!, previousProposalWitness: witness(merged) });
    expect(split.pass).toBe(true);
    expect(memberships(split.partition!)).toEqual(memberships(base.partition!));
    for (const child of split.partition!.communities) {
      expect(child.parentContentIds).toEqual([merged.partition!.communities[0]!.contentId]);
      expect(child.contentId).not.toBe(merged.partition!.communities[0]!.contentId);
      expect(child.lineageId).not.toBe(merged.partition!.communities[0]!.lineageId);
    }
    const comparison = comparePartitions(merged.partition!, split.partition!);
    expect(comparison.splits).toHaveLength(1); expect(comparison.membershipStable).toBe(false);
  });

  test("local semantic maturity, not a similar name, enables the lexical relation", () => {
    const immature = snapshotOf(2);
    immature.nodes.forEach(n => { n.observedDescription = "update state buffer"; n.name = "same_name_not_evidence"; });
    const config = noViews(); config.views.lexical = true; config.similarityThreshold = .0001;
    const none = clusterMultiview({ snapshot: immature, config });
    expect(none.pass).toBe(true); expect(none.partition!.communities).toHaveLength(2);
    const mature = jsonClone(immature); mature.nodes.forEach(n => { n.semanticMaturity = "reconciled"; });
    mature.normalizedFingerprint = oracleDigest(mature, "normalizedFingerprint");
    const enriched = clusterMultiview({ snapshot: mature, config });
    expect(enriched.pass).toBe(true); expect(memberships(enriched.partition!)).toEqual([mature.nodes.map(n => n.id)]);
    expect(enriched.embeddings.status).toBe("disabled");
    expect(enriched.architecture.experimental).toBe(true); expect(enriched.architecture.oracle).toBe(false);
  });

  test("copied/self-hashed proposal data is not authority; an independent offline host record is", () => {
    const result = clusterMultiview({ snapshot: snapshotOf(2), config: noViews() });
    expect(planAdoption(adoption(result, false)).adopted).toBe(false);
    expect(planAdoption(adoption(result)).adopted).toBe(true);
    const copied: ProposalWitness = { evidence: jsonClone(result.proposalEvidence!), localReceipt: jsonClone(result.proposalReceipt!) };
    expect(planAdoption({ ...adoption(result), proposalWitness: copied }).adopted).toBe(false);
    const rewritten = jsonClone(result.proposalEvidence!);
    rewritten.source.snapshot.nodes[0]!.observedDescription = "unauthenticated rewrite";
    rewritten.evidenceFingerprint = oracleDigest(rewritten, "evidenceFingerprint");
    expect(planAdoption({ ...adoption(result), proposalWitness: { evidence: rewritten, localReceipt: result.proposalReceipt } }).adopted).toBe(false);
    // The callback resolves retained authority-owned bytes; it does NOT echo request.evidence.
    const receiptRef = "offline-host-record:interop", retained = jsonClone(result.proposalEvidence!);
    const restored: ProposalWitness = { evidence: jsonClone(retained), host: { receiptRef,
      verify: request => request.receiptRef === receiptRef && request.purpose === "adoption"
        ? { version: "l4-host-proposal-evidence-1", receiptRef, evidence: jsonClone(retained) } : null } };
    expect(planAdoption({ ...adoption(result), proposalWitness: restored }).adopted).toBe(true);
    expect(planAdoption({ ...adoption(result), proposalWitness: { ...restored, evidence: rewritten } }).adopted).toBe(false);
    expect(planAdoption({ ...adoption(result), proposalWitness: { evidence: retained, host: { receiptRef, verify() { throw new Error("offline host unavailable"); } } } }).adopted).toBe(false);
  });

  test("migration needs exact claims/attempts/revision authority, and launched units stay byte-exact", () => {
    const snapshot = snapshotOf(2), result = clusterMultiview({ snapshot, config: noViews() });
    const idle: FrozenActiveUnit = { unitId: "unit:idle", state: "READY", snapshotId: snapshot.snapshotId,
      ownedFunctionIds: [snapshot.nodes[0]!.id], attemptIds: ["attempt:old"], claimIds: ["claim:old"],
      workerStillExecutable: false, leaseHeld: false,
      attempts: [{ attemptId: "attempt:old", snapshotId: snapshot.snapshotId, workerStillExecutable: false }],
      claims: [{ claimId: "claim:old", snapshotId: snapshot.snapshotId, leaseHeld: false }] };
    const active: FrozenActiveUnit = { ...jsonClone(idle), unitId: "unit:active", state: "RUNNING", workerStillExecutable: true,
      leaseHeld: true, executionContext: { immutable: ["frozen:old", { revision: 7 }] } };
    const proof: UnitQuiescenceProof = { unitId: idle.unitId, snapshotId: idle.snapshotId, attemptIds: ["attempt:old"],
      claimIds: ["claim:old"], authorityRef: "offline-inventory:7", revision: 7, quiescent: true, released: true,
      workerStillExecutable: false, leaseHeld: false };
    const expectedProof = oracleCanonical(proof), before = oracleCanonical([idle, active]);
    const verifyQuiescence = (candidate: UnitQuiescenceProof, unit: FrozenActiveUnit) =>
      unit.unitId === idle.unitId && oracleCanonical(candidate) === expectedProof;
    const input = { ...adoption(result), units: [idle, active], quiescence: [proof], verifyQuiescence };
    const positive = planAdoption(input);
    expect(positive.adopted).toBe(true); expect(positive.migratableUnitIds).toEqual([idle.unitId]);
    expect(oracleCanonical(positive.retainedUnits)).toBe(oracleCanonical([active]));
    const attacks: UnitQuiescenceProof[] = [
      { ...proof, claimIds: [] }, { ...proof, attemptIds: [] }, { ...proof, snapshotId: "other:snapshot" },
      { ...proof, revision: 8 }, { ...proof, authorityRef: "other-authority" }, { ...proof, workerStillExecutable: true },
      { ...proof, leaseHeld: true }, { ...proof, claimIds: ["claim:old", "claim:old"] },
    ];
    for (const attack of attacks) {
      const denied = planAdoption({ ...input, quiescence: [attack] });
      expect(denied.migratableUnitIds).toEqual([]); expect(oracleCanonical(denied.retainedUnits)).toBe(before);
    }
    expect(planAdoption({ ...input, verifyQuiescence: undefined }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, quiescence: [proof, proof] }).migratableUnitIds).toEqual([]);
    expect(planAdoption({ ...input, verifyQuiescence() { throw new Error("authority unavailable"); } }).migratableUnitIds).toEqual([]);
    expect(oracleCanonical([idle, active])).toBe(before);
  });

  test("empty knowledge delta is idempotent; revision-bound fixture/host admission is not a payload label", () => {
    const empty = fixture<KnowledgeDeltaView>("knowledge-empty"), fresh = fixture<KnowledgeDeltaView>("knowledge-new");
    expect(assessKnowledgeDelta(empty, { mode: "fixture", currentRevision: empty.fromRevision })).toMatchObject({ pass: true, empty: true, idempotent: true, nextRevision: empty.fromRevision });
    expect(assessKnowledgeDelta(fresh).admissible).toBe(false);
    const fixtureDelta = { ...fresh, validation: "fixture-only" as const }; fixtureDelta.deltaId = oracleDigest(fixtureDelta, "deltaId");
    expect(assessKnowledgeDelta(fixtureDelta, { mode: "fixture", currentRevision: fresh.fromRevision }).admissible).toBe(true);
    expect(assessKnowledgeDelta(fixtureDelta, { mode: "fixture", currentRevision: fresh.fromRevision + 1 }).admissible).toBe(false);
    const parentDelta = { ...fresh, validation: "parent-validated" as const }; parentDelta.deltaId = oracleDigest(parentDelta, "deltaId");
    const parentReceipt = { deltaId: parentDelta.deltaId, fromRevision: parentDelta.fromRevision, toRevision: parentDelta.toRevision,
      authorityRef: "offline-host-delta:1", evidenceSha256s: parentDelta.evidence.map(e => e.sha256) };
    expect(assessKnowledgeDelta(parentDelta, { mode: "parent", currentRevision: parentDelta.fromRevision, parentReceipt }).admissible).toBe(false);
    const authorityBytes = oracleCanonical(parentReceipt);
    expect(assessKnowledgeDelta(parentDelta, { mode: "parent", currentRevision: parentDelta.fromRevision, parentReceipt,
      verifyParentReceipt: receipt => oracleCanonical(receipt) === authorityBytes }).admissible).toBe(true);
  });
});
