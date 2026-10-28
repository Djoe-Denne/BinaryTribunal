/**93 New per-case privileged fixture sources. Functions are NOT executed by author.
 * Future IO requires parent-owned asset manifest and a distinct runtime gate. */
import { randomUUID } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { readFileSync, openSync, writeFileSync, closeSync, lstatSync, realpathSync, mkdirSync, existsSync } from "node:fs";
import type { Database } from "bun:sqlite";
import type { GraphEvent } from "../../src/eventlog";
import { createResourceCompleteInput } from "./resource-fixtures";
import { canonical, decoded, digest, rawHash, valueDigest, document, functionId, type AuthorFixture } from "./s1-source-fixtures";
import type { GraphInputSource, GraphExecutionSource } from "../../src/domain";
import type { PlannerResult } from "../../src/planner";
import type { ExecutionMissionSnapshotV1, RootLimitsV1, RootSlotGrantsV1, RootModelBindingsV1, ByteRef } from "../../src/graph-execution-envelope";
import type { OriginIssuerProvenanceV1, OriginOwnershipV1, OriginFirstIssuanceV1, OriginHostCurrentV1, OriginHostRecordsV1, FixtureOriginHostPortV1 } from "../../src/graph-generation-transition";
import type { FinalHostPortV1, FinalProducerJournalV1, FinalProducerRegistryV1, PolicyAssetPortV1, PolicyAssetLeaseV1, PolicyAssetReadbackV1, FinalCategoryV1 } from "../../src/graph-final-inventory";
import { POLICY_UTF8_92, POLICY_SHA256_92 } from "../../../../../../.opencode/missions/team_mvnxgnse_0000_39vpc8/inputs/s2-t2-fixture-r2/activation-fixtures";

let ordinal = 0;
function stamp<T extends { fingerprint: string }>(value: T): T { const { fingerprint: _old, ...content } = value; return { ...value, fingerprint: digest(content) }; }
/** NEW science DATA before any seal/bootstrap; no edit of frozen helper/issuer. */
function perCaseSource(path: string): AuthorFixture {
  const f = createResourceCompleteInput(), mission = decoded<ExecutionMissionSnapshotV1>(f.body.sourceMissionSnapshot);
  const source = decoded<GraphInputSource>(f.body.admissionSource.inputManifestSource.document), spec = decoded<GraphExecutionSource>(f.body.admissionSource.executionSourceSpec);
  const previousPath = source.commonInputs[0]!.path;
  source.commonInputs = source.commonInputs.map(file => ({ ...file, path: file.path === previousPath ? path : file.path }));
  source.accessibleRules = source.accessibleRules.map(rule => rule === previousPath ? path : rule);
  mission.config.commonInputs = structuredClone(source.commonInputs); mission.config.accessibleRules = [...source.accessibleRules];
  mission.config.outputDirectory = join(dirname(dirname(path)), "out"); spec.outputDirectory = mission.config.outputDirectory;
  const manifest = { document: document("l8-input-source-v1", source), files: f.body.admissionSource.inputManifestSource.files.map(item => ({ ...item,
    file: { ...item.file, path: item.file.path === previousPath ? path : item.file.path } })) };
  const missionDoc = document("l8-source-mission-snapshot-v1", mission), specDoc = document("l8-execution-source-v1", spec);
  const context = { ...f.body.admissionSource.context, missionConfigFingerprint: digest(mission.config), executionSpecFingerprint: digest(spec), inputManifestFingerprint: digest(source) };
  const policy = structuredClone(f.policy); if (!policy.admissionBudget) throw new Error("explicit root allocation required");
  policy.admissionBudget = stamp({ ...policy.admissionBudget, context });
  const planning = decoded<PlannerResult>(f.body.planning), planId = `plan:${digest({ snapshot: f.snapshot.normalizedFingerprint, policy, families: [[functionId]],
    relationViewVersion: "planner-relations-v1", relationPolicyVersion: "planner-relation-policy-v2", admissionAccountingVersion: "planner-admission-accounting-v1", admissionBudgetContext: context })}`;
  planning.plan = stamp({ ...planning.plan, planId }); if (!planning.sidecar.admissionBudget) throw new Error("budget sidecar required");
  planning.sidecar = stamp({ ...planning.sidecar, planId, planFingerprint: planning.plan.fingerprint, policy,
    admissionBudget: { ...planning.sidecar.admissionBudget, context, allocationFingerprint: policy.admissionBudget.fingerprint } });
  planning.binding = stamp({ ...planning.binding, planFingerprint: planning.plan.fingerprint, sidecarFingerprint: planning.sidecar.fingerprint });
  const planningDoc = document("l8-planning-source-v1", planning), policyDoc = document("l8-planning-policy-source-v1", policy), allocation = document("l8-admission-allocation-source-v1", policy.admissionBudget);
  const root = decoded<RootLimitsV1>(f.body.admissionSource.budgetLineage.rootLimits); if (!root.rootSlotGrants || !root.rootModelBindings || !f.body.rootBootstrapSources) throw new Error("complete root sources required");
  const rootAccountId = valueDigest("l8-budget-root-v1", { missionId: f.body.missionId, lineageId: f.body.generation.lineageId, rootAllocationRef: allocation.ref });
  const grants = decoded<RootSlotGrantsV1>(root.rootSlotGrants); Object.assign(grants, { rootAccountId, rootAllocationRef: allocation.ref, sourcePlanningRef: planningDoc.ref, sourcePolicyRef: policyDoc.ref });
  grants.grants = grants.grants.map(grant => ({ ...grant, slot: { ...grant.slot, rootAccountId } }));
  const models = decoded<RootModelBindingsV1>(root.rootModelBindings); Object.assign(models, { rootAccountId, sourceExecutionSpecRef: specDoc.ref });
  root.allocation = allocation; root.rootSlotGrants = document(root.rootSlotGrants.ref.kind, grants); root.rootModelBindings = document(root.rootModelBindings.ref.kind, models);
  const rootDoc = document("l8-root-limits-v1", root), bootstrap = { ...f.body.rootBootstrapSources, missionSnapshot: missionDoc, executionSourceSpec: specDoc, planning: planningDoc, planningPolicy: policyDoc };
  Object.assign(f.body, { sourceMissionSnapshot: missionDoc, planning: planningDoc, planningPolicy: policyDoc, rootBootstrapSources: bootstrap });
  Object.assign(f.body.admissionSource, { executionSourceSpec: specDoc, inputManifestSource: manifest, context, allocation: policy.admissionBudget,
    budgetLineage: { ...f.body.admissionSource.budgetLineage, rootAccountId, rootAllocationRef: allocation.ref, rootLimits: rootDoc },
    sourceFingerprints: { ...f.body.admissionSource.sourceFingerprints, executionSourceSpec: digest(spec), inputManifest: digest(source), context: digest(context), allocation: policy.admissionBudget.fingerprint } });
  Object.assign(f.body.preparationObservationT0, { rootLimitsRef: rootDoc.ref, rootSlotGrantsRef: root.rootSlotGrants.ref, rootModelBindingsRef: root.rootModelBindings.ref });
  Object.assign(f.independent, { sourceMissionSnapshot: structuredClone(missionDoc), executionSourceSpec: structuredClone(specDoc), inputManifestSource: structuredClone(manifest),
    rootLimits: structuredClone(rootDoc), rootBootstrapSources: structuredClone(bootstrap), planningPolicy: structuredClone(policyDoc) });
  f.policy = policy; return f;
}
export type AssetFault93 = "valid" | "absent" | "altered" | "false-readback" | "unknown-writer";
export function allocateFinalCase93(crossEpoch = false) {
  const root = process.env.FF8_S2_T2_ASSET_DIRECTORY, manifestPath = process.env.FF8_S2_T2_ASSET_MANIFEST;
  if (!root || !manifestPath) throw new Error("parent-owned T2 asset directory AND lease manifest required; no fallback");
  const manifestBytes = readFileSync(manifestPath, "utf8"), manifest = JSON.parse(manifestBytes) as {
    version: string; parentOwner: string; assetDirectory: string; directoryIdentity: string; cases: { ordinal: number; caseRoot: string; leaseId: string }[] };
  const stat = lstatSync(root, { bigint: true });
  if (manifest.version !== "ff8-t2-parent-asset-leases-v1" || !manifest.parentOwner || typeof stat.dev !== "bigint" || typeof stat.ino !== "bigint" || stat.isSymbolicLink() || realpathSync(root) !== resolve(root)
    || resolve(manifest.assetDirectory) !== resolve(root) || manifest.directoryIdentity !== `${stat.dev}:${stat.ino}`) throw new Error("parent asset ownership/identity mismatch");
  const n = ++ordinal, assignment = manifest.cases.find(entry => entry.ordinal === n), caseRoot = join(root, `case-${n}`);
  if (!assignment || resolve(assignment.caseRoot) !== resolve(caseRoot) || !assignment.leaseId) throw new Error("case asset lease not reserved by parent");
  const path = join(caseRoot, "synthetic", "activation.json"), source = perCaseSource(path), universeId = `host93:${randomUUID()}`;
  const domain = { universeId, domainId: "only-origin-budget", missionId: source.body.missionId, lineageId: source.body.generation.lineageId, rootAccountId: source.body.admissionSource.budgetLineage.rootAccountId };
  const issuerValue: OriginIssuerProvenanceV1 = { version: "l8-fixture-origin-host-issuer-v1", revision: 1, issuer: "synthetic-parent85", universeId,
    isolation: "independent-synthetic-fixture", completeDomains: [domain], approvedDecision: "three-durable-origins-bootstrap-included", ceiling: 3, unit: "durable-origin" };
  const issuer = document(issuerValue.version, issuerValue), parentLease = document("l8-parent-asset-assignment93", { version: "l8-parent-asset-assignment93",
    manifestSha: rawHash(manifestBytes), manifestUtf8: manifestBytes, manifestPath, assignment, parentOwner: manifest.parentOwner, directoryIdentity: manifest.directoryIdentity });
  let originRecords: OriginHostRecordsV1 | null = null, assigned = false;
  function assign(db: Database, ownPath: string): FixtureOriginHostPortV1 {
    if (assigned) throw new Error("HOST93 domain already assigned"); assigned = true;
    const ownershipValue: OriginOwnershipV1 = { version: "l8-fixture-origin-host-ownership-v1", revision: 1, domain, issuerProvenanceRef: issuer.ref,
      connectionScopeId: `owned:${assignment!.leaseId}`, connectionPath: ownPath, sourceMissionRef: source.body.sourceMissionSnapshot.ref,
      rootAllocationRef: source.body.admissionSource.budgetLineage.rootAllocationRef, rootLimitsRef: source.body.admissionSource.budgetLineage.rootLimits.ref };
    const ownership = document(ownershipValue.version, ownershipValue), firstValue: OriginFirstIssuanceV1 = { version: "l8-fixture-origin-host-first-issuance-v1", revision: 1,
      domain, rootLineageOwnershipRef: ownership.ref, enumeration: "complete-before-first-issuance", issuedGrantRefs: [], committedOrigins: [] };
    const firstIssuance = document(firstValue.version, firstValue), currentValue: OriginHostCurrentV1 = { version: "l8-fixture-origin-host-current-v1", revision: 1, domain,
      issuerProvenanceRef: issuer.ref, rootLineageOwnershipRef: ownership.ref, firstIssuanceEmptyHistoryProofRef: firstIssuance.ref,
      issuerRevision: 1, ownershipRevision: 1, firstIssuanceRevision: 1, revokedProofRefs: [] };
    originRecords = { issuer, ownership, firstIssuance, current: document(currentValue.version, currentValue) }; return { connection: db, records: structuredClone(originRecords) };
  }
  const producerSource = document("l8-host93-producer-allocation", { version: "l8-host93-producer-allocation", domain, parentLeaseRef: parentLease.ref,
    ...(crossEpoch ? { terminalWorkProfile: "never-sent-cross-epoch108" } : {}),
    roster: ["own-control92", "parent-policy-file92"], noExternalProducerAdmission: { executor: "NOT_ADMITTED", dispatcher: "NOT_ADMITTED", scientificPublisher: "NOT_ADMITTED", native: "NOT_ADMITTED" } });
  const logs: { own: FinalProducerJournalV1; file: FinalProducerJournalV1 } = {
    own: { version: "l8-final-producer-journal-fixture-v1", producerId: "own-control92", creationRef: producerSource.ref, entries: [], lastSequence: 0 },
    file: { version: "l8-final-producer-journal-fixture-v1", producerId: "parent-policy-file92", creationRef: producerSource.ref, entries: [], lastSequence: 0 } };
  const operationCategories: Record<string, FinalCategoryV1[]> = {
    bootstrap: ["origins", "units", "sourceCapabilities", "controllerLeases"], "prepare-initial": ["origins", "proofs", "sourceCapabilities"],
    "request-drain": ["origins", "proofs", "sourceCapabilities"], "retain-pointed-candidate-units": ["units", "stagedUnits", "stagedBlobs"],
    "activate-a": ["origins", "units", "sourceCapabilities"], "register-source-controller": ["sourceCapabilities"],
    "create-policy-exclusive": ["materializations", "requiredFiles"], "close-policy": ["materializations", "proofs"],
    "readback-policy": ["materializationReadbacks", "proofs", "requiredFiles"],
    "reserve-family": ["families", "units", "claims", "intents"], "allocate-resource": ["claims", "physicalAllocations"],
    "prepare-admission": ["executions", "intents", "outboxes", "attemptsL6"], "burn-slot": ["intents", "proofs"],
    "observe-execution": ["proofs", "outboxes", "attemptsL6"], "release-resource": ["claims", "releases", "physicalAllocations"],
    "release-family": ["families", "units", "claims", "releases"],
  };
  function note(which: "own" | "file", operation: string, sourceRef: ByteRef, ownEventKey: string | null = null, categories = operationCategories[operation]) {
    if (!categories) throw new Error("unadmitted HOST operation");
    const log = logs[which]; log.entries.push({ sequence: ++log.lastSequence, operation, sourceRef, ownEventKey,
      actor: which === "own" ? "synthetic-parent" : manifest.parentOwner, categories: [...categories] });
  }
  function grantSources(): OriginHostRecordsV1 { if (!originRecords) throw new Error("HOST93 not assigned"); return structuredClone(originRecords); }
  function provider(db: Database, ownPath: string, fault: AssetFault93): FinalHostPortV1 {
    const records = grantSources(), finalDomain = { universeId, missionId: domain.missionId, lineageId: domain.lineageId, rootAccountId: domain.rootAccountId,
      owner: "synthetic-parent", connectionPath: ownPath, originOwnershipRef: records.ownership.ref };
    const registryValue: FinalProducerRegistryV1 = { version: "l8-final-producer-registry-fixture-v1", domain: finalDomain, allocationRef: producerSource.ref,
      externalProducerAdmissionRef: producerSource.ref, producers: [
        { producerId: "own-control92", authorityRef: producerSource.ref, operationPolicyRef: producerSource.ref, writes: crossEpoch
          ? ["origins", "families", "units", "executions", "intents", "outboxes", "attemptsL6", "claims", "proofs", "releases", "sourceCapabilities", "controllerLeases", "physicalAllocations", "stagedUnits", "stagedBlobs"]
          : ["origins", "units", "proofs", "sourceCapabilities", "controllerLeases", "stagedUnits", "stagedBlobs"] },
        { producerId: "parent-policy-file92", authorityRef: parentLease.ref, operationPolicyRef: producerSource.ref, writes: ["materializations", "materializationReadbacks", "proofs", "requiredFiles"] }] };
    const registry = document(registryValue.version, registryValue), policyRef = source.body.activationPolicy.sourcePolicyRef, manifestRef = source.body.admissionSource.inputManifestSource.document.ref;
    const leaseValue: PolicyAssetLeaseV1 = { version: "l8-policy-asset-lease-fixture-v1", parentOwner: manifest.parentOwner, assetId: assignment!.leaseId, path,
      directoryOwnershipRef: parentLease.ref, assignmentRef: parentLease.ref, sourcePolicyRef: policyRef, sourceManifestRef: manifestRef, exclusiveWriterRef: parentLease.ref };
    const lease = document(leaseValue.version, leaseValue), asset: PolicyAssetPortV1 = { lease, readback: null, current: null, evidence: [] };
    if (existsSync(caseRoot)) throw new Error("unowned/preexisting case path is a collision, never adopt by hash");
    mkdirSync(caseRoot); mkdirSync(dirname(path));
    if (lstatSync(caseRoot).isSymbolicLink() || lstatSync(dirname(path)).isSymbolicLink() || realpathSync(caseRoot) !== resolve(caseRoot)
      || realpathSync(dirname(path)) !== resolve(dirname(path))) throw new Error("case asset ancestry/identity changed");
    if (fault !== "absent") {
      const utf8 = fault === "altered" ? `${POLICY_UTF8_92}\n` : POLICY_UTF8_92;
      const fd = openSync(path, "wx"); try {
        writeFileSync(fd, utf8, { encoding: "utf8" });
        const created = document("l8-real-policy-create95", { version: "l8-real-policy-create95", producerId: "parent-policy-file92", actor: manifest.parentOwner,
          parentAssignmentRef: parentLease.ref, leaseRef: lease.ref, path, mode: "wx", utf8, sha256: rawHash(utf8), byteLength: Buffer.byteLength(utf8, "utf8") });
        asset.evidence.push(created); note("file", "create-policy-exclusive", created.ref);
      } finally { closeSync(fd); }
      const closed = document("l8-real-policy-close93", { version: "l8-real-policy-close93", path, closed: true, leaseRef: lease.ref }); note("file", "close-policy", closed.ref);
      let actualPath = path;
      if (fault === "false-readback") { actualPath = join(caseRoot, "negative-readback.json"); const other = openSync(actualPath, "wx");
        try { writeFileSync(other, POLICY_UTF8_92); } finally { closeSync(other); }
        const diagnostic = document("l8-negative-owned-asset93", { version: "l8-negative-owned-asset93", actualPath, parentLeaseRef: parentLease.ref });
        asset.evidence.push(diagnostic); note("file", "create-policy-exclusive", diagnostic.ref); }
      const before = lstatSync(actualPath, { bigint: true }), bytes = readFileSync(actualPath), after = lstatSync(actualPath, { bigint: true });
      if (typeof after.dev !== "bigint" || typeof after.ino !== "bigint" || typeof after.mtimeNs !== "bigint") throw new Error("actual precise file identity unknown");
      if (before.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs) throw new Error("actual file identity/readback race");
      const identity = document("l8-real-policy-identity93", { version: "l8-real-policy-identity93", actualPath, dev: String(after.dev), ino: String(after.ino), size: String(after.size), mtime: String(after.mtimeNs) });
      const observation = document("l8-real-policy-observation93", { version: "l8-real-policy-observation93", actualPath, utf8: bytes.toString("utf8"), sha256: rawHash(bytes), identityRef: identity.ref });
      asset.evidence.push(closed, identity, observation);
      const readbackValue: PolicyAssetReadbackV1 = { version: "l8-policy-asset-readback-fixture-v1", leaseRef: lease.ref, path: actualPath,
        sourcePolicyRef: policyRef, sourceManifestRef: manifestRef, closeRecordRef: closed.ref, actualReadRef: observation.ref, identityRef: identity.ref,
        utf8: bytes.toString("utf8"), byteLength: bytes.length, sha256: rawHash(bytes) };
      asset.readback = document(readbackValue.version, readbackValue); note("file", "readback-policy", observation.ref);
    } else {
      try { readFileSync(path); throw new Error("reserved absent asset unexpectedly exists"); }
      catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
        const absent = document("l8-real-policy-absence93", { version: "l8-real-policy-absence93", path, leaseRef: lease.ref, actualErrorCode: "ENOENT" });
        asset.evidence.push(absent); note("file", "readback-policy", absent.ref); }
    }
    asset.current = { revision: 1, leaseRef: lease.ref, readbackRef: asset.readback?.ref ?? null, revocationRef: null,
      unknownWriterRef: fault === "unknown-writer" ? document("l8-unknown-writer93", { version: "l8-unknown-writer93", leaseRef: lease.ref }).ref : null };
    return { connection: db, registry, creationBeforeBootstrapRef: issuer.ref, asset, journals: [document(logs.own.version, logs.own), document(logs.file.version, logs.file)], snapshot: null, current: null, cases: [],
      allocation: producerSource, parentAssignment: parentLease };
  }
  function refreshPolicySource(port: FinalHostPortV1): void {
    if (!port.asset.readback || !port.asset.current) throw new Error("no actual policy readback to refresh");
    const previous = decoded<PolicyAssetReadbackV1>(port.asset.readback), before = lstatSync(path, { bigint: true }), bytes = readFileSync(path), after = lstatSync(path, { bigint: true });
    if (typeof after.dev !== "bigint" || typeof after.ino !== "bigint" || typeof after.mtimeNs !== "bigint") throw new Error("actual precise file identity unknown");
    if (before.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs) throw new Error("actual policy observation race");
    const identity = document("l8-real-policy-identity93", { version: "l8-real-policy-identity93", actualPath: path, dev: String(after.dev), ino: String(after.ino), size: String(after.size), mtime: String(after.mtimeNs) });
    const observation = document("l8-real-policy-observation93", { version: "l8-real-policy-observation93", actualPath: path, utf8: bytes.toString("utf8"), sha256: rawHash(bytes),
      identityRef: identity.ref, revision: port.asset.current.revision + 1 });
    if (!port.asset.evidence.some(doc => canonical(doc.ref) === canonical(identity.ref))) port.asset.evidence.push(identity);
    port.asset.evidence.push(observation);
    port.asset.readback = document(previous.version, { ...previous, actualReadRef: observation.ref, identityRef: identity.ref, utf8: bytes.toString("utf8"), byteLength: bytes.length, sha256: rawHash(bytes) });
    port.asset.current = { ...port.asset.current, revision: port.asset.current.revision + 1, readbackRef: port.asset.readback.ref };
    note("file", "readback-policy", observation.ref);
    port.journals = [document(logs.own.version, logs.own), document(logs.file.version, logs.file)];
    if (port.current) { port.current.journalRefs = port.journals.map(j => j.ref); port.current.revision += 1; }
  }
  function noteWork108(events: GraphEvent[]): void {
    if (!crossEpoch) throw new Error("terminal operations not admitted by prebootstrap allocation");
    const operations: Record<string, string> = { g3_family_reserved: "reserve-family", g3_resource_allocated: "allocate-resource", g3_admission_prepared: "prepare-admission",
      g3_slot_burned: "burn-slot", g3_fixture_observation: "observe-execution", g3_resource_released: "release-resource", g3_family_released: "release-family" };
    for (const event of events) if (Object.prototype.hasOwnProperty.call(operations, event.kind) && !logs.own.entries.some(entry => entry.ownEventKey === event.key))
      note("own", operations[event.kind]!, document("l8-host-own-event-source95", { version: "l8-host-own-event-source95", event }).ref, event.key);
  }
  return { source, domain, issuer, assign, grantSources, provider, logs, note, noteWork108, path, caseRoot, parentLease, refreshPolicySource, expectedPolicySha: POLICY_SHA256_92 };
}
