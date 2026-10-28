/**93 Private final-inventory fixture boundary. No native/IO/producer discovery. */
import type { Database } from "bun:sqlite";
import type { BoundDocument, ByteRef, CandidateRefV1 } from "./graph-execution-envelope";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { EventLog, immutableCopy, invariant, integer } from "./eventlog";
import { canonical, fingerprint, hash } from "./validation";
import { closedResourceFieldsV1, resourceDocumentV1, readResourceInventoryV1 } from "./graph-resource-ledger";
import { readTransitionDocumentV1, type OriginOwnershipV1 } from "./graph-generation-transition";

export const finalCategoriesV1 = ["origins", "families", "units", "executions", "intents", "outboxes", "attemptsL6", "claims", "publications",
  "publicationReadbacks", "materializations", "materializationReadbacks", "proofs", "releases", "sourceCapabilities", "controllerLeases",
  "physicalAllocations", "stagedUnits", "stagedBlobs", "requiredFiles"] as const;
export type FinalCategoryV1 = typeof finalCategoriesV1[number];
export interface FinalDomainV1 { universeId: string; missionId: string; lineageId: string; rootAccountId: string; owner: string; connectionPath: string; originOwnershipRef: ByteRef }
export interface FinalProducerV1 { producerId: "own-control92" | "parent-policy-file92"; authorityRef: ByteRef; operationPolicyRef: ByteRef; writes: FinalCategoryV1[] }
export interface FinalProducerRegistryV1 { version: "l8-final-producer-registry-fixture-v1"; domain: FinalDomainV1; allocationRef: ByteRef; producers: FinalProducerV1[]; externalProducerAdmissionRef: ByteRef }
export interface FinalProducerJournalV1 { version: "l8-final-producer-journal-fixture-v1"; producerId: FinalProducerV1["producerId"]; creationRef: ByteRef;
  entries: { sequence: number; operation: string; sourceRef: ByteRef; ownEventKey: string | null }[]; lastSequence: number }
export interface PolicyAssetLeaseV1 {
  version: "l8-policy-asset-lease-fixture-v1"; parentOwner: string; assetId: string; path: string; directoryOwnershipRef: ByteRef;
  assignmentRef: ByteRef; sourcePolicyRef: ByteRef; sourceManifestRef: ByteRef; exclusiveWriterRef: ByteRef;
}
export interface PolicyAssetReadbackV1 {
  version: "l8-policy-asset-readback-fixture-v1"; leaseRef: ByteRef; path: string; sourcePolicyRef: ByteRef; sourceManifestRef: ByteRef;
  closeRecordRef: ByteRef; actualReadRef: ByteRef; identityRef: ByteRef; utf8: string; byteLength: number; sha256: string;
}
export interface PolicyAssetPortV1 {
  lease: BoundDocument<PolicyAssetLeaseV1>; readback: BoundDocument<PolicyAssetReadbackV1> | null;
  evidence: BoundDocument<{ version: string }>[];
  current: { revision: number; leaseRef: ByteRef; readbackRef: ByteRef | null; revocationRef: ByteRef | null; unknownWriterRef: ByteRef | null } | null;
}
export interface FinalCategoryEvidenceV1 {
  version: "l8-final-category-evidence-fixture-v1"; category: FinalCategoryV1; domain: FinalDomainV1; registryRef: ByteRef;
  rows: unknown[]; sourceSnapshotRef: ByteRef; originRefs: ByteRef[];
  producerCuts: { producerId: FinalProducerV1["producerId"]; journalRef: ByteRef; lastSequence: number }[];
}
export interface FinalSnapshotV1 {
  version: "l8-final-snapshot-fixture-v1"; domain: FinalDomainV1; registryRef: ByteRef; expectedHead: unknown;
  categories: { [K in FinalCategoryV1]: BoundDocument<FinalCategoryEvidenceV1> };
  operationalEventKeys: string[]; rootLedger: unknown[]; knowledgeRef: ByteRef; candidateRef: CandidateRefV1; stagingRef: ByteRef;
  assetCurrent: PolicyAssetPortV1["current"];
}
export interface FinalHostPortV1 {
  readonly connection: Database; readonly registry: BoundDocument<FinalProducerRegistryV1>;
  readonly creationBeforeBootstrapRef: ByteRef; readonly asset: PolicyAssetPortV1;
  journals: BoundDocument<FinalProducerJournalV1>[];
  snapshot: BoundDocument<FinalSnapshotV1> | null;
  current: { revision: number; registryRef: ByteRef; snapshotRef: ByteRef | null; journalRefs: ByteRef[]; revocationRef: ByteRef | null } | null;
  cases: { document: BoundDocument<{ version: string }>; revision: number; currentRef: ByteRef; revocationRef: ByteRef | null }[];
  allocation: BoundDocument<{ version: string }>;
  parentAssignment: BoundDocument<{ version: string }>;
}
export const policyUtf8V1 = '{"lineageId":"lineage:author","maxActivationAttempts":2,"maxCandidateReplacements":1,"missionId":"author","version":"l8-activation-policy-source-v1"}';
export const policyShaV1 = "57f51b7201aec0bb8661a96c08d1ae4928d69e85334ea5d8da9cb7bdc2f059ec";
export function finalDocumentV1<T extends { version: string }>(doc: BoundDocument<T>): T {
  const value = JSON.parse(doc.utf8) as T; assertExecutionJsonV1(value);
  invariant(canonical(resourceDocumentV1(value)) === canonical(doc), "HOLD: final source document bytes/ref mismatch"); return immutableCopy(value);
}
const producerWrites: Record<FinalProducerV1["producerId"], FinalCategoryV1[]> = {
  "own-control92": ["origins", "units", "proofs", "sourceCapabilities", "controllerLeases", "stagedUnits", "stagedBlobs"],
  "parent-policy-file92": ["materializations", "materializationReadbacks", "proofs", "requiredFiles"],
};
export function verifyFinalAllocationV1(db: Database, port: FinalHostPortV1): void {
  invariant(port.connection === db, "HOLD: final source wrong connection");
  const registry = finalDocumentV1(port.registry), allocation = finalDocumentV1(port.allocation) as {
    version: string; domain: { universeId: string; missionId: string; lineageId: string; rootAccountId: string }; parentLeaseRef: ByteRef;
    roster: string[]; noExternalProducerAdmission: { executor: string; dispatcher: string; scientificPublisher: string; native: string } };
  const parent = finalDocumentV1(port.parentAssignment) as { version: string; manifestSha: string; manifestUtf8: string; manifestPath: string;
    assignment: { ordinal: number; caseRoot: string; leaseId: string }; parentOwner: string; directoryIdentity: string };
  const manifest = JSON.parse(parent.manifestUtf8) as { version: string; parentOwner: string; directoryIdentity: string; cases: { ordinal: number; caseRoot: string; leaseId: string }[] };
  const lease = finalDocumentV1(port.asset.lease);
  invariant(allocation.version === "l8-host93-producer-allocation" && parent.version === "l8-parent-asset-assignment93"
    && canonical(registry.allocationRef) === canonical(port.allocation.ref) && canonical(registry.externalProducerAdmissionRef) === canonical(port.allocation.ref)
    && canonical(allocation.parentLeaseRef) === canonical(port.parentAssignment.ref)
    && allocation.domain.universeId === registry.domain.universeId && allocation.domain.rootAccountId === registry.domain.rootAccountId
    && allocation.domain.missionId === registry.domain.missionId && allocation.domain.lineageId === registry.domain.lineageId
    && canonical(allocation.roster) === canonical(["own-control92", "parent-policy-file92"])
    && canonical(allocation.noExternalProducerAdmission) === canonical({ executor: "NOT_ADMITTED", dispatcher: "NOT_ADMITTED", scientificPublisher: "NOT_ADMITTED", native: "NOT_ADMITTED" }),
    "HOLD: privileged producer allocation bytes/provenance incomplete");
  invariant(parent.manifestPath.length > 0 && hash(Buffer.from(parent.manifestUtf8, "utf8")) === parent.manifestSha
    && manifest.version === "ff8-t2-parent-asset-leases-v1" && manifest.parentOwner === parent.parentOwner && manifest.directoryIdentity === parent.directoryIdentity
    && manifest.cases.filter(entry => entry.ordinal === parent.assignment.ordinal && entry.leaseId === parent.assignment.leaseId && entry.caseRoot === parent.assignment.caseRoot).length === 1
    && lease.parentOwner === parent.parentOwner && lease.assetId === parent.assignment.leaseId
    && lease.path.replaceAll("\\", "/") === `${parent.assignment.caseRoot.replaceAll("\\", "/")}/synthetic/activation.json`
    && canonical(lease.assignmentRef) === canonical(port.parentAssignment.ref) && canonical(lease.directoryOwnershipRef) === canonical(port.parentAssignment.ref)
    && canonical(lease.exclusiveWriterRef) === canonical(port.parentAssignment.ref), "HOLD: independent parent asset assignment/manifest/source scope mismatch");
}
export function verifyPolicyAssetV1(asset: PolicyAssetPortV1, promisedPath: string, policyRef: ByteRef, manifestRef: ByteRef) {
  const lease = finalDocumentV1(asset.lease), current = asset.current;
  if (current) integer(current.revision, 1);
  invariant(current && current.revision >= 1 && !current.revocationRef && !current.unknownWriterRef && asset.readback
    && canonical(current.leaseRef) === canonical(asset.lease.ref) && canonical(current.readbackRef) === canonical(asset.readback.ref), "HOLD: promised file lease/readback/current unknown/revoked");
  const readback = finalDocumentV1(asset.readback);
  const evidence = (ref: ByteRef) => { const doc = asset.evidence.find(item => canonical(item.ref) === canonical(ref));
    invariant(doc, "HOLD: actual file close/read/identity source bytes unavailable"); return finalDocumentV1(doc); };
  const closed = evidence(readback.closeRecordRef) as { version: string; path: string; closed: boolean; leaseRef: ByteRef };
  const observed = evidence(readback.actualReadRef) as { version: string; actualPath: string; utf8: string; sha256: string; identityRef: ByteRef };
  const identity = evidence(readback.identityRef) as { version: string; actualPath: string; dev: string; ino: string; size: string; mtime: string };
  invariant(closed.version === "l8-real-policy-close93" && closed.closed === true && closed.path === readback.path && canonical(closed.leaseRef) === canonical(asset.lease.ref)
    && observed.version === "l8-real-policy-observation93" && observed.actualPath === readback.path && observed.utf8 === readback.utf8 && observed.sha256 === readback.sha256
    && canonical(observed.identityRef) === canonical(readback.identityRef) && identity.version === "l8-real-policy-identity93" && identity.actualPath === readback.path
    && identity.size === String(readback.byteLength) && identity.dev.length > 0 && identity.ino.length > 0 && identity.mtime.length > 0, "HOLD: actual file evidence/readback identity join mismatch");
  invariant(lease.path === promisedPath && readback.path === promisedPath && canonical(readback.leaseRef) === canonical(asset.lease.ref)
    && canonical(lease.sourcePolicyRef) === canonical(policyRef) && canonical(readback.sourcePolicyRef) === canonical(policyRef)
    && canonical(lease.sourceManifestRef) === canonical(manifestRef) && canonical(readback.sourceManifestRef) === canonical(manifestRef)
    && readback.utf8 === policyUtf8V1 && readback.byteLength === 149 && readback.sha256 === policyShaV1 && policyRef.sha256 === policyShaV1
    && policyRef.byteLength === 149 && lease.parentOwner.length > 0 && lease.assetId.length > 0
    && lease.directoryOwnershipRef && lease.exclusiveWriterRef && readback.closeRecordRef && readback.actualReadRef && readback.identityRef,
    "HOLD: promised actual policy file/source/readback mismatch");
  return { lease, readback };
}
export function verifyFinalHostV1(db: Database, port: FinalHostPortV1): { snapshot: FinalSnapshotV1; registry: FinalProducerRegistryV1 } {
  verifyFinalAllocationV1(db, port);
  invariant(port.connection === db && port.current && !port.current.revocationRef && port.snapshot, "HOLD: final HOST provider/current unavailable");
  integer(port.current.revision, 1);
  const registry = finalDocumentV1(port.registry), snapshot = finalDocumentV1(port.snapshot);
  invariant(registry.version === "l8-final-producer-registry-fixture-v1" && snapshot.version === "l8-final-snapshot-fixture-v1"
    && canonical(port.current.registryRef) === canonical(port.registry.ref) && canonical(port.current.snapshotRef) === canonical(port.snapshot.ref)
    && canonical(snapshot.registryRef) === canonical(port.registry.ref) && canonical(snapshot.domain) === canonical(registry.domain)
    && canonical(registry.producers.map(p => p.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"])
    && port.creationBeforeBootstrapRef && registry.allocationRef && registry.externalProducerAdmissionRef, "HOLD: final HOST universe/closed producer provenance mismatch");
  const file = (db.query("PRAGMA database_list").all() as { name: string; file: string }[]).find(row => row.name === "main")?.file;
  invariant(file?.replaceAll("\\", "/").toLowerCase() === registry.domain.connectionPath.replaceAll("\\", "/").toLowerCase(), "HOLD: final HOST OWN assignment mismatch");
  const ownership = readTransitionDocumentV1<OriginOwnershipV1>(db, registry.domain.originOwnershipRef, true);
  invariant(ownership.domain.universeId === registry.domain.universeId && ownership.domain.rootAccountId === registry.domain.rootAccountId
    && ownership.domain.missionId === registry.domain.missionId && ownership.domain.lineageId === registry.domain.lineageId
    && canonical(ownership.issuerProvenanceRef) === canonical(port.creationBeforeBootstrapRef), "HOLD: final producer allocation lacks issued origin-domain provenance");
  invariant(canonical((finalDocumentV1(port.allocation) as { version: string; domain: unknown }).domain) === canonical(ownership.domain), "HOLD: final producer root domain is not the issued domain");
  for (const producer of registry.producers) invariant(canonical([...producer.writes].sort()) === canonical([...producerWrites[producer.producerId]].sort())
    && canonical(producer.authorityRef) === canonical(producer.producerId === "own-control92" ? port.allocation.ref : port.parentAssignment.ref)
    && canonical(producer.operationPolicyRef) === canonical(port.allocation.ref), "HOLD: unknown producer/operation authority");
  const journals = port.journals.map(doc => ({ doc, value: finalDocumentV1(doc) }));
  invariant(canonical(journals.map(j => j.value.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"])
    && canonical(port.current.journalRefs) === canonical(port.journals.map(j => j.ref)), "HOLD: complete producer journals unknown/stale");
  const allowed = { "own-control92": ["bootstrap", "prepare-initial", "request-drain", "retain-pointed-candidate-units", "register-source-controller", "append-activation-attempt", "append-outcome", "activate-a"],
    "parent-policy-file92": ["create-policy-exclusive", "close-policy", "readback-policy", "share-parent-owned-policy-readonly"] };
  for (const j of journals) invariant(canonical(j.value.creationRef) === canonical(port.allocation.ref) && j.value.lastSequence === j.value.entries.length
    && j.value.entries.every((entry, i) => entry.sequence === i + 1 && allowed[j.value.producerId].includes(entry.operation) && entry.sourceRef), "HOLD: producer operation journal gap/unknown writer");
  closedResourceFieldsV1(snapshot.categories, finalCategoriesV1);
  for (const category of finalCategoriesV1) {
    const evidence = finalDocumentV1(snapshot.categories[category]);
    invariant(evidence.category === category && canonical(evidence.domain) === canonical(registry.domain)
      && canonical(evidence.registryRef) === canonical(port.registry.ref) && Array.isArray(evidence.rows)
      && canonical(evidence.producerCuts.map(c => c.producerId).sort()) === canonical(["own-control92", "parent-policy-file92"]), "HOLD: final category/producer enumeration unknown");
    invariant(canonical(evidence.sourceSnapshotRef) === canonical(resourceDocumentV1({ version: "l8-host-category-raw93", category, rows: evidence.rows }).ref), "HOLD: category source snapshot bytes/ref mismatch");
    for (const cut of evidence.producerCuts) { const journal = journals.find(j => j.value.producerId === cut.producerId)!;
      invariant(canonical(cut.journalRef) === canonical(journal.doc.ref) && cut.lastSequence === journal.value.lastSequence, "HOLD: final producer high-water mark stale/incomplete"); }
  }
  return { snapshot, registry };
}
export function finalOwnRowsV1(db: Database, events: EventLog) {
  const rows = (table: string, order: string) => db.query(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  const origins = rows("g3_origins", "mission,generation"), families = rows("g3_families", "mission,generation,unit"), units = rows("g3_units", "mission,generation,unit"), outboxes = rows("g3_outbox", "execution_id");
  const authority = rows("g3_authority", "record_ref") as { kind: string; record_ref: string; revision: number; document: string; digest: string; revoked: number }[];
  const controlKinds = new Set(["activation-case", "activation-attempt", "activation-receipt", "activation-counter", "activation-counter-current", "activation-outcome", "activation-result", "activation-record", "candidate-staging"]);
  const sources = authority.filter(row => !controlKinds.has(row.kind));
  const sourceKinds = new Set(["controller", "observation", "resource-acquisition", "resource-remaining", "resource-assignment", "resource-current", "transition-source", "origin-grant",
    "origin-counter-record", "origin-counter-current", "origin-host-source", "origin-grant-domain", "initial-preparation", "initial-preparation-record", "transition-case-current", "drain-cut", "drain-entry", "drain-result", "final-host-source"]);
  invariant(sources.every(row => sourceKinds.has(row.kind) && row.digest === fingerprint(JSON.parse(row.document))), "HOLD: unknown/corrupt authority source in final inventory");
  invariant(sources.filter(row => row.kind === "resource-acquisition" || row.kind === "resource-current").every(row => row.revoked === 0), "HOLD: required physical source capability revoked");
  const referenced = new Set<string>();
  for (const row of sources) {
    if (row.kind === "origin-grant") referenced.add(canonical(JSON.parse(JSON.parse(row.document).utf8).approvalRef));
    if (row.kind === "initial-preparation") { const preparation = JSON.parse(JSON.parse(row.document).document.utf8); referenced.add(canonical(preparation.observationRef)); referenced.add(canonical(preparation.expectedT0Ref)); }
    if (row.kind === "drain-result") referenced.add(canonical(JSON.parse(row.document).authorizationRef));
  }
  invariant(sources.filter(row => row.kind === "transition-source").every(row => referenced.has(canonical(JSON.parse(row.document).ref))), "HOLD: orphan transition source not explained by committed history");
  const pools = sources.filter(row => row.kind === "resource-acquisition").map(row => JSON.parse(JSON.parse(row.document).utf8).poolScope.poolId as string);
  const physical = pools.map(poolId => ({ poolId, inventory: readResourceInventoryV1(db, events, poolId) }));
  return { origins, families, units, outboxes, claims: rows("g3_claims", "resource_key"), sources,
    slots: rows("g3_slots", "root_id,slot_key"), roots: rows("g3_root", "root_id"), physical,
    staged: authority.filter(row => row.kind === "candidate-staging") };
}
export function finalAuthorityFactsV1(db: Database, events: EventLog, port: FinalHostPortV1) {
  const sources = finalOwnRowsV1(db, events).sources;
  const refs = sources.map(row => resourceDocumentV1({ version: "l8-final-authority-row-v1", row }).ref);
  const authorityRecords = sources.map((row, i) => ({ recordRef: refs[i]!, revision: row.revision,
    revocationRef: row.revoked ? resourceDocumentV1({ version: "l8-final-authority-revocation-v1", recordRef: refs[i]!, revision: row.revision }).ref : null }));
  return { authorityRecords, proofRecordRefs: [...sources.flatMap((row, i) => row.kind === "observation" ? [refs[i]!] : []), port.asset.readback!.ref],
    releaseRecordRefs: [] as ByteRef[], sourceCapabilityRecordRefs: [...sources.flatMap((row, i) => row.kind !== "observation" ? [refs[i]!] : []), port.registry.ref, port.asset.lease.ref] };
}
export function assertFinalOwnV1(db: Database, events: EventLog, port: FinalHostPortV1, expectedHead: unknown, candidate: CandidateRefV1, stagingRef: ByteRef): FinalSnapshotV1 {
  const { snapshot, registry } = verifyFinalHostV1(db, port), own = finalOwnRowsV1(db, events);
  const category = (name: FinalCategoryV1) => finalDocumentV1(snapshot.categories[name]).rows;
  invariant(canonical(snapshot.expectedHead) === canonical(expectedHead) && canonical(snapshot.candidateRef) === canonical(candidate)
    && canonical(snapshot.stagingRef) === canonical(stagingRef), "HOLD: final inventory/head/candidate/staging stale");
  for (const [name, actual] of [["origins", own.origins], ["families", own.families], ["units", own.units], ["outboxes", own.outboxes], ["claims", own.claims],
    ["sourceCapabilities", own.sources], ["controllerLeases", own.sources.filter(row => row.kind === "controller")], ["proofs", [...own.sources.filter(row => row.kind === "observation"), port.asset.readback]],
    ["stagedUnits", own.units.filter(row => (row as { state: string }).state === "STAGED")], ["stagedBlobs", own.staged]] as const)
    invariant(canonical(category(name)) === canonical(actual), "HOLD: final OWN enumeration incomplete/orphan");
  invariant(canonical(snapshot.rootLedger) === canonical(own.slots), "HOLD: final root slots/SPENT/encumbrance incomplete");
  invariant(own.roots.length === 1 && (own.roots[0] as { root_id: string }).root_id === registry.domain.rootAccountId
    && own.slots.every(row => (row as { root_id: string }).root_id === registry.domain.rootAccountId), "HOLD: orphan logical root/slot outside final domain");
  const allOrigins = (own.origins as { document: string }[]).map(row => JSON.parse(row.document).origin.document.ref as ByteRef);
  for (const name of finalCategoriesV1) invariant(canonical(finalDocumentV1(snapshot.categories[name]).originRefs) === canonical(allOrigins), "HOLD: final enumeration omitted historical origin");
  invariant(port.asset.readback && canonical(category("materializations")) === canonical([port.asset.readback])
    && canonical(category("materializationReadbacks")) === canonical([port.asset.readback])
    && canonical(category("requiredFiles")) === canonical([port.asset.lease]), "HOLD: final materialization/file enumeration incomplete");
  invariant(own.families.length === 0 && own.outboxes.length === 0 && own.claims.length === 0
    && own.physical.every(p => p.inventory.active.length === 0), "HOLD: final fixture work is not quiescent");
  for (const name of ["executions", "intents", "attemptsL6", "publications", "publicationReadbacks", "releases", "physicalAllocations"] as const)
    invariant(category(name).length === 0, "HOLD: unexplained final operation/publication/attempt/release");
  // Emptiness here is opposed to the complete independent producer closure and
  // journals verified above, NOT inferred from absent product APIs/tables.
  const operationalEvents = events.read(registry.domain.missionId).filter(e => !["g3_activation_attempt", "g3_activation_outcome"].includes(e.kind));
  const ownJournal = port.journals.map(doc => finalDocumentV1(doc)).find(j => j.producerId === "own-control92")!;
  invariant(canonical(snapshot.operationalEventKeys) === canonical(operationalEvents.map(e => e.key))
    && operationalEvents.every(e => ownJournal.entries.some(entry => entry.ownEventKey === e.key)), "HOLD: final operation/OWN event journal unexplained");
  return immutableCopy(snapshot);
}
