/**88 Privileged synthetic HOST fixture source, separate from grant construction.
 * Each allocation creates a self-contained one-domain test universe whose full
 * initial inventory is stated here BEFORE any grant request or OWN inspection.
 * UUIDs name allocations; their independence/limits come from these records,
 * not filenames, grant.scope, an empty DB, or a process-global ownership Map.
 * No native/global issuer, file access, DB query or service is implemented. */
import { randomUUID } from "node:crypto";
import type { Database } from "bun:sqlite";
import { createResourceCompleteInput } from "./resource-fixtures";
import { document } from "./s1-source-fixtures";
import type { FixtureOriginHostPortV1, OriginHostDomainV1, OriginHostRecordsV1, OriginHostCurrentV1,
  OriginIssuerProvenanceV1, OriginOwnershipV1, OriginFirstIssuanceV1 } from "../../src/graph-generation-transition";

export type OriginHostFault88 = "none" | "unknown-current" | "stale-current" | "revoked-issuer" | "revoked-ownership" | "revoked-first";
export function allocateOriginHostFixture(cap = 100000, fault: OriginHostFault88 = "none") {
  // The host owns the scientific input; seed obtains it FROM this allocation.
  // No grant/request DTO or caller's f is accepted as authority/provenance.
  const source = createResourceCompleteInput(cap), universeId = `synthetic-universe:${randomUUID()}`;
  const domain: OriginHostDomainV1 = { universeId, domainId: "only-origin-budget", missionId: source.body.missionId,
    lineageId: source.body.generation.lineageId, rootAccountId: source.body.admissionSource.budgetLineage.rootAccountId };
  const issuerValue: OriginIssuerProvenanceV1 = { version: "l8-fixture-origin-host-issuer-v1", revision: 1, issuer: "synthetic-parent85",
    universeId, isolation: "independent-synthetic-fixture", completeDomains: [domain],
    approvedDecision: "three-durable-origins-bootstrap-included", ceiling: 3, unit: "durable-origin" };
  const issuer = document(issuerValue.version, issuerValue);
  let assigned: FixtureOriginHostPortV1 | null = null;
  let retained: OriginHostRecordsV1 | null = null;
  function assign(connection: Database, path: string): FixtureOriginHostPortV1 {
    if (assigned) throw new Error("HOST fixture: retained domain already assigned; no reallocation by rename/reopen");
    const ownershipValue: OriginOwnershipV1 = { version: "l8-fixture-origin-host-ownership-v1", revision: 1, domain,
      issuerProvenanceRef: issuer.ref, connectionScopeId: `synthetic-connection:${randomUUID()}`, connectionPath: path,
      sourceMissionRef: source.body.sourceMissionSnapshot.ref, rootAllocationRef: source.body.admissionSource.budgetLineage.rootAllocationRef,
      rootLimitsRef: source.body.admissionSource.budgetLineage.rootLimits.ref };
    const ownership = document(ownershipValue.version, ownershipValue);
    // Full history for the newly allocated, explicitly isolated fixture domain,
    // NOT a query of the new OWN and NOT a default inferred from a missing Map.
    const firstValue: OriginFirstIssuanceV1 = { version: "l8-fixture-origin-host-first-issuance-v1", revision: 1, domain,
      rootLineageOwnershipRef: ownership.ref, enumeration: "complete-before-first-issuance", issuedGrantRefs: [], committedOrigins: [] };
    const firstIssuance = document(firstValue.version, firstValue);
    const revoked = fault === "revoked-issuer" ? [issuer.ref] : fault === "revoked-ownership" ? [ownership.ref]
      : fault === "revoked-first" ? [firstIssuance.ref] : [];
    const currentValue: OriginHostCurrentV1 = { version: "l8-fixture-origin-host-current-v1", revision: 1, domain,
      issuerProvenanceRef: issuer.ref, rootLineageOwnershipRef: ownership.ref, firstIssuanceEmptyHistoryProofRef: firstIssuance.ref,
      issuerRevision: fault === "stale-current" ? 2 : 1, ownershipRevision: 1, firstIssuanceRevision: 1, revokedProofRefs: revoked };
    const records: OriginHostRecordsV1 = { issuer, ownership, firstIssuance, current: document(currentValue.version, currentValue) };
    retained = structuredClone(records);
    assigned = { connection, records: fault === "unknown-current" ? null : records };
    return assigned;
  }
  function grantSources(): OriginHostRecordsV1 {
    if (!retained) throw new Error("HOST fixture domain not yet assigned");
    return structuredClone(retained); // request DATA, never a provider substitute
  }
  return { source, domain, issuer, assign, grantSources };
}
