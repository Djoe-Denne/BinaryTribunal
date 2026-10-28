/**86 HOST inputs, never executed by source-writing work. No native proof. */
import { canonical, document, decoded, digest, rawHash, type AuthorFixture } from "./s1-source-fixtures";
import type { seed } from "./fixtures";
import { sealExecutionEnvelopeV1, makeGraphRunV3, type ExecutionEnvelopeBodyV1, type PreparationObservationT0 } from "../../src/graph-execution-envelope";
import type { PreparationGrantV1, TransitionObservationV1, TransitionCaseV1 } from "../../src/graph-generation-transition";
import type { Database } from "bun:sqlite";
import type { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
export { MANUAL_EXPECTATIONS83 } from "../../../../../../.opencode/missions/team_mvnxgnse_0000_39vpc8/inputs/s2-t1-fixture-r2/transition-fixtures";
type Host = ReturnType<typeof seed>;
/** Privileged host issues a distinct fixture CASE, not permission granted by a
 * new filename. Copying this grant/case to another DB must fail registration. */
export function registerOriginGrant(_db: Database, authority: FixtureTrustedAuthorityV1, f: AuthorFixture, path: string) {
  const approval = document("l8-fixture-origin-approval-v1", { version: "l8-fixture-origin-approval-v1", issuer: "synthetic-parent85", caseId: `approved-case:${path}`,
    decision: "three-durable-origins-bootstrap-included", missionId: f.body.missionId, lineageId: f.body.generation.lineageId,
    rootAccountId: f.body.admissionSource.budgetLineage.rootAccountId, connectionPath: path });
  const proof = authority.registerTransitionDocument(approval);
  const grant: PreparationGrantV1 = { version: "l8-fixture-origin-grant-v1", issuer: "synthetic-parent85", revision: 1,
    scope: { fixtureId: `approved-case:${path}`, missionId: f.body.missionId, lineageId: f.body.generation.lineageId, rootAccountId: f.body.admissionSource.budgetLineage.rootAccountId },
    connectionPath: path, approvalRef: proof, unit: "durable-origin", ceiling: 3,
    sourceMissionRef: f.body.sourceMissionSnapshot.ref, rootAllocationRef: f.body.admissionSource.budgetLineage.rootAllocationRef,
    rootLimitsRef: f.body.admissionSource.budgetLineage.rootLimits.ref };
  const grantRef = authority.registerPreparationGrant(document(grant.version, grant));
  return { grantRef, grant: authority.resolvePreparationGrant(grantRef) };
}
/** Independent HOST read of operational rows. This is source acquisition, NOT a
 * golden transition producer. Numeric state-change expectations stay literals. */
export function hostObservation(x: Host): TransitionObservationV1 {
  const head = x.store.read("author");
  const select = (table: string, order: string) => x.db.query(`SELECT * FROM ${table} WHERE mission=? AND generation=? ORDER BY ${order}`).all("author", head.generationId);
  const families = select("g3_families", "unit"), units = select("g3_units", "unit"), claims = select("g3_claims", "resource_key"), outboxes = select("g3_outbox", "execution_id");
  const slots = [...x.store.slots("author")], sources = x.db.query("SELECT * FROM g3_authority WHERE kind IN ('controller','observation','resource-acquisition','resource-remaining','resource-assignment','resource-current') ORDER BY record_ref").all();
  const pools = x.db.query("SELECT document FROM g3_authority WHERE kind='resource-acquisition' ORDER BY record_ref").all() as { document: string }[];
  const physical = pools.map(row => { const acquisition = JSON.parse(JSON.parse(row.document).utf8); return { poolId: acquisition.poolScope.poolId, inventory: x.store.resourceInventory(acquisition.poolScope.poolId) }; });
  const operational = { families, units, claims, outboxes, slots, sources, physical };
  const refs = (sources as { kind: string; document: string }[]).map(row => {
    const source = JSON.parse(row.document);
    return { kind: row.kind, ref: source.ref && typeof source.utf8 === "string" ? source.ref : { kind: source.version ?? `l8-fixture-${row.kind}-record-v1`,
      encoding: "utf8-json-v1" as const, byteLength: Buffer.byteLength(row.document, "utf8"), sha256: rawHash(row.document) } };
  });
  const knowledge = decoded(x.f.body.admissionSource.knowledgeSource), mission = decoded(x.f.body.sourceMissionSnapshot);
  const root = decoded(x.f.body.admissionSource.budgetLineage.rootLimits);
  const t0: PreparationObservationT0 = { observedEventSequence: x.events.cursor("author").sequence, parentGenerationId: head.generationId,
    headRevision: head.revision, activePlanRevision: head.activePlanRevision, sourceMissionRevision: mission.revision,
    controllerFence: head.controllerFence, knowledgeRevision: knowledge.knowledgeRevision, knowledgeRootHash: knowledge.rootHash,
    knowledgeLedgerRevision: knowledge.ledgerRevision, knowledgeLedgerDigest: knowledge.ledgerDigest,
    budgetLedgerRevision: head.budgetLedgerRevision, budgetLedgerDigest: head.budgetLedgerDigest,
    spentBySlot: slots.filter(s => ["SPENT", "BURNED"].includes(s.state)).map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    encumberedBySlot: slots.filter(s => s.state === "ENCUMBERED").map(s => ({ slotKey: s.slot_key, amount: s.debit })),
    inventoryRevision: head.inventoryRevision, inventoryDigest: digest(operational), partitionStoreDigest: x.f.body.sourceRefs.partitionStoreDigest,
    authorityRecordRefs: refs.filter(r => r.kind !== "observation").map(r => r.ref), proofRecordRefs: refs.filter(r => r.kind === "observation").map(r => r.ref), rootLimitsRef: x.f.body.admissionSource.budgetLineage.rootLimits.ref,
    rootSlotGrantsRef: root.rootSlotGrants!.ref, rootModelBindingsRef: root.rootModelBindings!.ref };
  return { version: "l8-fixture-transition-observation-v1", revision: 1, issuer: "synthetic-parent85", expectedHead: head,
    eventSequence: t0.observedEventSequence, t0, operational, sourceMissionRef: x.f.body.sourceMissionSnapshot.ref,
    knowledgeRef: x.f.body.admissionSource.knowledgeSource.ref, parentOriginRef: x.sealed.document.ref };
}
export function childInput(x: Host) {
  const observation = hostObservation(x), observationRef = x.authority.registerTransitionDocument(document(observation.version, observation));
  const { fingerprint: _old, ...retained } = JSON.parse(x.sealed.document.utf8);
  const body: ExecutionEnvelopeBodyV1 = { ...retained, authorizationKind: "transition-a-fixture-v1", adoptionIntent: null,
    generation: { lineageId: x.sealed.envelope.generation.lineageId, ordinal: x.sealed.envelope.generation.ordinal + 1, parentGenerationId: x.sealed.generationId },
    preparationObservationT0: observation.t0 };
  const result = sealExecutionEnvelopeV1(body); if (!result.ok) throw new Error(result.reasons.join(";"));
  const independent = JSON.parse(canonical(x.f.independent)); independent.parentEnvelope = structuredClone(x.sealed.document);
  const run = makeGraphRunV3(result.value); if (!run.ok) throw new Error(run.reasons.join(";"));
  return { origin: result.value, independent, observation, observationRef, run: run.value };
}
export function prepare(x: Host) {
  const child = childInput(x), before = x.store.read("author");
  const preparation = x.store.prepareInitial(x.handle, before, child.origin, child.independent, x.originGrant, child.observationRef, 2);
  return { child, before, preparation };
}
export function transitionCase(x: Host, p: ReturnType<typeof prepare>) {
  const record: TransitionCaseV1 = { version: "l8-fixture-transition-a-case-v1", revision: 1, issuer: "synthetic-parent85", purpose: "request-drain", caseId: "initial",
    candidateRef: p.preparation.candidateRef, preparationRef: p.preparation.document.ref, observationRef: p.child.observationRef,
    expectedHead: x.store.read("author"), counterRef: x.authority.preparationCounter(p.before.rootAccountId).document.ref,
    owner: p.before.owner, controllerFence: p.before.controllerFence };
  const ref = x.authority.registerTransitionDocument(document(record.version, record));
  return { ref, handle: x.authority.resolveTransitionA(ref) };
}
