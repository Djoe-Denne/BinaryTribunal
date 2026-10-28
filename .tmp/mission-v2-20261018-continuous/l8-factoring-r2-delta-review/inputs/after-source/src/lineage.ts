import { compareFunctionIds, sortFunctionIds, communityContentId, partitionProposalFingerprint, inspectProposalEvidence, matchesPreviousProposal, resolveLineage, detectSplits, membership, sameIdSet, prefixedId, overlapCandidates, validIntegerMetric, partitionInvariants, hasKeys, strictSchemaErrors, SHA, FUNCTION_ID, type OverlapCandidate, PARTITION_SCHEMA } from "./lineage-pure-codecs";
export { compareFunctionIds, sortFunctionIds, communityContentId, proposalEvidenceFingerprint, partitionProposalFingerprint, isSerializableProposalData, inspectProposalEvidence } from "./lineage-pure-codecs";
import { immutableSnapshot } from "./semantic-config-codec";
export { immutableSnapshot } from "./semantic-config-codec";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { canonical, hash } from "./validation";
// Read-only capability lookup; semantic-index alone mints receipts after evaluation.
// This module cycle has no top-level calls into either module.
import { configFingerprint, validConfig, provenanceReady, readLocalProposalReceipt, type GraphSnapshotView, type MultiviewConfig, type LinkConstraint, type FrozenEncoder } from "./semantic-index";

/**
 * Projection locale du contrat v1 (L2 possède graph.ts, absent de ce worktree).
 * Les identifiants restent moduleSha256:RVA. L8 adapte ; ceci n'est pas une seconde identité.
 */

export const LINEAGE_ALGORITHM = "multiview-lineage";
export const LINEAGE_VERSION = "2";

const DELTA_SCHEMA = JSON.parse(readFileSync(new URL("../schemas/knowledge-delta-v1.schema.json", import.meta.url), "utf8"));

export interface UnknownableInteger {
  known: boolean;
  value: number | null;
}

/** Lossless numeric sidecar, explicitly NOT the v1 KnownInteger transport type. */
export interface LosslessMetric {
  known: boolean;
  value: number | null;
  numerator?: number;
  denominator?: number;
}

export interface CommunityView {
  contentId: string;
  lineageId: string;
  parentContentIds: string[];
  memberIds: string[];
  kernelIds: string[];
  externalContextIds: string[];
  conductance: UnknownableInteger;
}

export interface ClusterPartitionView {
  schemaVersion: 1;
  partitionId: string;
  lineageId: string;
  parentLineageId: string | null;
  snapshotId: string;
  snapshotFingerprint: string;
  regime: "A" | "B";
  algorithm: string;
  algorithmVersion: string;
  configFingerprint: string;
  seed: string;
  communities: CommunityView[];
  modularity: UnknownableInteger;
  maturity: "structural" | "partial" | "multiview";
  adopted: boolean;
}

export interface EvidenceRefView {
  id: string;
  source: string;
  sha256: string;
  detail: string;
}

export interface KnowledgeDeltaView {
  schemaVersion: 1;
  deltaId: string;
  fromRevision: number;
  toRevision: number;
  affectedFunctionIds: string[];
  factIds: string[];
  evidence: EvidenceRefView[];
  origin: string;
  validation: "parent-validated" | "fixture-only" | "unvalidated";
  invalidations: string[];
  potentialImpact: "local" | "structural" | "none";
}

export type WorkUnitState =
  | "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING"
  | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED"
  | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";

export interface FrozenActiveUnit {
  unitId: string;
  state: WorkUnitState;
  snapshotId: string;
  ownedFunctionIds: string[];
  /** Absence is unknown, not an empty authoritative inventory. */
  attemptIds?: string[];
  claimIds?: string[];
  workerStillExecutable?: boolean;
  leaseHeld?: boolean;
  attempts?: Array<{ attemptId: string; snapshotId: string; workerStillExecutable: boolean }>;
  claims?: Array<{ claimId: string; snapshotId: string; leaseHeld: boolean }>;
  executionContext?: unknown;
}

export interface CommunityDraft {
  memberIds: string[];
  kernelIds: string[];
  externalContextIds: string[];
  conductance: UnknownableInteger;
}

export interface Diagnostic {
  code: string;
  severity: "info" | "warning" | "fail";
  detail: string;
  functionIds: string[];
}

const LAUNCHED: ReadonlySet<WorkUnitState> = new Set(["RESERVED", "RUNNING", "VALIDATING", "STOP_PENDING"]);
const MIGRATABLE: ReadonlySet<WorkUnitState> = new Set(["PENDING", "BLOCKED", "READY"]);
const UNKNOWN_METRIC: UnknownableInteger = { known: false, value: null };





export function knowledgeDeltaId(body: Omit<KnowledgeDeltaView, "deltaId">): string {
  return hash(canonical(body));
}

export function isEmptyKnowledgeDelta(delta: KnowledgeDeltaView): boolean {
  return delta.fromRevision === delta.toRevision
    && delta.affectedFunctionIds.length === 0
    && delta.factIds.length === 0
    && delta.evidence.length === 0
    && delta.invalidations.length === 0
    && delta.potentialImpact === "none";
}

export interface DeltaAssessment {
  pass: boolean;
  transportPass: boolean;
  admissible: boolean;
  admittedDelta: KnowledgeDeltaView | null;
  empty: boolean;
  idempotent: boolean;
  digestMatches: boolean;
  nextRevision: number;
  diagnostics: Diagnostic[];
}

export interface DeltaAdmissionContext {
  currentRevision: number;
  mode: "fixture" | "parent";
  parentReceipt?: {
    deltaId: string;
    fromRevision: number;
    toRevision: number;
    authorityRef: string;
    evidenceSha256s: string[];
  };
  /** L8 must verify this against durable parent authority, not a payload boolean. */
  verifyParentReceipt?: (receipt: NonNullable<DeltaAdmissionContext["parentReceipt"]>, delta: KnowledgeDeltaView) => boolean;
}

export function assessKnowledgeDelta(value: unknown, admission?: DeltaAdmissionContext): DeltaAssessment {
  const diagnostics: Diagnostic[] = [];
  const errors = strictSchemaErrors(value, DELTA_SCHEMA);
  const safeRevision = Number.isSafeInteger(admission?.currentRevision) && admission!.currentRevision >= 0 ? admission!.currentRevision : 0;
  if (errors.length > 0) {
    diagnostics.push(fail("delta-schema", errors.join("; "), []));
    return { pass: false, transportPass: false, admissible: false, admittedDelta: null, empty: false, idempotent: false, digestMatches: false, nextRevision: safeRevision, diagnostics };
  }
  const delta = structuredClone(value) as KnowledgeDeltaView;
  const body = stripDeltaId(delta);
  const digestMatches = knowledgeDeltaId(body) === delta.deltaId;
  if (Object.is(delta.fromRevision, -0) || Object.is(delta.toRevision, -0)) diagnostics.push(fail("delta-negative-zero", "canonical revisions cannot contain negative zero", []));
  if (!SHA.test(delta.deltaId) || delta.evidence.some(item => !SHA.test(item.sha256))) diagnostics.push(fail("delta-sha256", "digests must be lowercase SHA-256", []));
  if (delta.affectedFunctionIds.some(id => !FUNCTION_ID.test(id))) diagnostics.push(fail("delta-function-id", "function identity must be canonical module hash plus RVA", []));
  if (canonical(delta.affectedFunctionIds) !== canonical(sortFunctionIds(delta.affectedFunctionIds))) diagnostics.push(fail("delta-function-order", "function identities must be in canonical numeric RVA order", delta.affectedFunctionIds));
  for (const [label, ids] of [["affectedFunctionIds", delta.affectedFunctionIds], ["factIds", delta.factIds], ["invalidations", delta.invalidations], ["evidence", delta.evidence.map(item => item.id)]] as const) {
    if (new Set(ids).size !== ids.length) diagnostics.push(fail("delta-duplicate", `${label} contains duplicate identities`, []));
  }
  if (!digestMatches) diagnostics.push(fail("delta-digest-mismatch", "deltaId is not the canonical digest of the body", []));
  if (delta.origin.startsWith("bulletin")) diagnostics.push(fail("bulletin-origin", "a bulletin is not a knowledge delta", []));
  const empty = isEmptyKnowledgeDelta(delta);
  if (empty && delta.potentialImpact !== "none") diagnostics.push(fail("empty-impact", "an empty delta must declare potentialImpact none", []));
  if (!empty && delta.toRevision !== delta.fromRevision + 1) diagnostics.push(fail("revision-step", "a non-empty delta advances exactly one revision", delta.affectedFunctionIds));
  if (!empty && delta.potentialImpact === "none") diagnostics.push(fail("impact-none-on-change", "a non-empty delta cannot declare impact none", delta.affectedFunctionIds));
  if (delta.validation === "parent-validated" && delta.evidence.length === 0) diagnostics.push(fail("parent-validation-without-evidence", "parent-validated knowledge requires evidence", delta.affectedFunctionIds));
  const transportPass = diagnostics.every(item => item.severity !== "fail");
  let admissible = transportPass && empty;
  if (transportPass && admission) {
    if (!Number.isSafeInteger(admission.currentRevision) || admission.currentRevision < 0 || admission.currentRevision !== delta.fromRevision) {
      diagnostics.push(fail("delta-current-revision", "admission must be bound to the current durable revision", delta.affectedFunctionIds));
      admissible = false;
    } else if (!empty) {
      if (admission.mode === "fixture" && delta.validation === "fixture-only") admissible = true;
      if (admission.mode === "parent" && delta.validation === "parent-validated") {
        const receipt = admission.parentReceipt;
        try {
          admissible = !!receipt && receipt.deltaId === delta.deltaId && receipt.fromRevision === delta.fromRevision
            && receipt.toRevision === delta.toRevision && typeof receipt.authorityRef === "string" && receipt.authorityRef.length > 0
            && Array.isArray(receipt.evidenceSha256s) && sameIdSet(receipt.evidenceSha256s, delta.evidence.map(item => item.sha256))
            && admission.verifyParentReceipt?.(structuredClone(receipt), structuredClone(delta)) === true;
        } catch { admissible = false; }
      }
    }
  }
  if (transportPass && !empty && !admissible) diagnostics.push(fail("delta-not-admitted", "transport validity is not scientific trust; an explicit revision-bound fixture or verified parent admission is required", delta.affectedFunctionIds));
  const pass = transportPass && admissible && diagnostics.every(item => item.severity !== "fail");
  return {
    pass,
    transportPass,
    admissible: pass,
    admittedDelta: pass ? structuredClone(delta) : null,
    empty,
    idempotent: pass && empty && digestMatches,
    digestMatches,
    nextRevision: pass ? (empty ? delta.fromRevision : delta.toRevision) : (admission ? safeRevision : delta.fromRevision),
    diagnostics,
  };
}

export interface AffectedRegion {
  pass: boolean;
  empty: boolean;
  idempotent: boolean;
  impact: "local" | "structural" | "none";
  functionIds: string[];
  diagnostics: Diagnostic[];
}

export interface RegionGraph {
  functionIds: readonly string[];
  callNeighbors: ReadonlyMap<string, readonly string[]>;
  dataNeighbors: ReadonlyMap<string, readonly string[]>;
}

export function affectedRegion(delta: KnowledgeDeltaView, graph: RegionGraph, admission?: DeltaAdmissionContext): AffectedRegion {
  const assessment = assessKnowledgeDelta(delta, admission);
  if (!assessment.pass) {
    return { pass: false, empty: false, idempotent: false, impact: delta.potentialImpact, functionIds: [], diagnostics: assessment.diagnostics };
  }
  if (assessment.empty) {
    return { pass: true, empty: true, idempotent: true, impact: "none", functionIds: [], diagnostics: assessment.diagnostics };
  }
  const known = new Set(graph.functionIds);
  const seed = sortFunctionIds(delta.affectedFunctionIds.filter(id => known.has(id)));
  const missing = delta.affectedFunctionIds.filter(id => !known.has(id));
  const diagnostics = [...assessment.diagnostics];
  if (missing.length > 0) diagnostics.push({ code: "affected-id-absent", severity: "warning", detail: "delta names functions outside the snapshot", functionIds: sortFunctionIds(missing) });
  if (delta.potentialImpact === "structural") {
    return { pass: true, empty: false, idempotent: false, impact: "structural", functionIds: sortFunctionIds(graph.functionIds), diagnostics };
  }
  const region = new Set<string>(seed);
  for (const id of seed) {
    for (const neighbor of graph.callNeighbors.get(id) ?? []) region.add(neighbor);
    for (const neighbor of graph.dataNeighbors.get(id) ?? []) region.add(neighbor);
  }
  return { pass: true, empty: region.size === 0, idempotent: false, impact: "local", functionIds: sortFunctionIds([...region]), diagnostics };
}

export interface PartitionComparison {
  sameConfig: boolean;
  churn: number;
  stable: boolean;
  membershipStable: boolean;
  scientificStable: boolean;
  snapshotChanged: boolean;
  maturityChanged: boolean;
  detailsComplete: boolean;
  kernelChanges: Array<{ contentId: string; before: string[]; after: string[] }>;
  contextChanges: Array<{ contentId: string; before: string[]; after: string[] }>;
  coverageChanges: Array<{ functionId: string; before: string | null; after: string | null }>;
  costChanges: Array<{ functionId: string; before: UnknownableInteger | null; after: UnknownableInteger | null }>;
  hysteresisHeld: boolean;
  merges: Array<{ parentContentIds: string[]; childContentId: string; memberIds: string[] }>;
  splits: Array<{ parentContentId: string; childContentIds: string[] }>;
  moves: Array<{ functionId: string; fromContentId: string; toContentId: string }>;
  unchangedContentIds: string[];
  counters: LineageCounters;
}

export interface LineageCounters {
  draftMembers: number;
  indexedMemberVisits: number;
  overlapMemberVisits: number;
  overlapPairs: number;
}

/** Sidecar only: coverage and cost do not change the frozen L1 partition schema. */
export interface PartitionDetails {
  partitionId: string;
  coverage: Array<{ functionId: string; coverage: string }>;
  costs: Array<{ functionId: string; estimatedCost: UnknownableInteger }>;
}

export function comparePartitions(
  previous: ClusterPartitionView,
  next: ClusterPartitionView,
  hysteresis = 0.85,
  details?: { previous: PartitionDetails; next: PartitionDetails },
): PartitionComparison {
  const counters: LineageCounters = { draftMembers: 0, indexedMemberVisits: 0, overlapMemberVisits: 0, overlapPairs: 0 };
  const sameConfig = previous.configFingerprint === next.configFingerprint && previous.algorithm === next.algorithm && previous.algorithmVersion === next.algorithmVersion && previous.seed === next.seed && previous.regime === next.regime;
  const previousOf = membership(previous, counters);
  const nextOf = membership(next, counters);
  const functions = sortFunctionIds([...new Set([...previousOf.keys(), ...nextOf.keys()])]);
  const moves: PartitionComparison["moves"] = [];
  let changed = 0;
  for (const functionId of functions) {
    const from = previousOf.get(functionId);
    const to = nextOf.get(functionId);
    if (from?.contentId === to?.contentId) continue;
    changed += 1;
    if (from && to) moves.push({ functionId, fromContentId: from.contentId, toContentId: to.contentId });
  }
  const churn = functions.length === 0 ? 0 : changed / functions.length;
  const merges = detectMerges(previous, next, counters);
  const splits = detectSplits(previous, next, counters);
  const before = new Map(previous.communities.map(item => [item.contentId, item]));
  const after = new Map(next.communities.map(item => [item.contentId, item]));
  const unchangedContentIds = [...after.keys()].filter(id => before.has(id)).sort();
  const kernelChanges: PartitionComparison["kernelChanges"] = [];
  const contextChanges: PartitionComparison["contextChanges"] = [];
  for (const contentId of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const old = before.get(contentId), current = after.get(contentId);
    if (!sameIdSet(old?.kernelIds ?? [], current?.kernelIds ?? [])) kernelChanges.push({ contentId, before: sortFunctionIds(old?.kernelIds ?? []), after: sortFunctionIds(current?.kernelIds ?? []) });
    if (!sameIdSet(old?.externalContextIds ?? [], current?.externalContextIds ?? [])) contextChanges.push({ contentId, before: sortFunctionIds(old?.externalContextIds ?? []), after: sortFunctionIds(current?.externalContextIds ?? []) });
  }
  const oldCoverage = new Map(details?.previous.coverage.map(item => [item.functionId, item.coverage]) ?? []);
  const newCoverage = new Map(details?.next.coverage.map(item => [item.functionId, item.coverage]) ?? []);
  const oldCosts = new Map(details?.previous.costs.map(item => [item.functionId, item.estimatedCost]) ?? []);
  const newCosts = new Map(details?.next.costs.map(item => [item.functionId, item.estimatedCost]) ?? []);
  const detailsComplete = !!details && details.previous.partitionId === previous.partitionId && details.next.partitionId === next.partitionId
    && details.previous.coverage.length === oldCoverage.size && details.next.coverage.length === newCoverage.size
    && details.previous.costs.length === oldCosts.size && details.next.costs.length === newCosts.size
    && functions.every(id => typeof oldCoverage.get(id) === "string" && typeof newCoverage.get(id) === "string" && oldCoverage.get(id) !== "unknown" && newCoverage.get(id) !== "unknown"
      && validIntegerMetric(oldCosts.get(id)) && validIntegerMetric(newCosts.get(id)) && oldCosts.get(id)!.known && newCosts.get(id)!.known && oldCosts.get(id)!.value! >= 0 && newCosts.get(id)!.value! >= 0);
  const coverageChanges = functions.filter(id => oldCoverage.get(id) !== newCoverage.get(id)).map(functionId => ({ functionId, before: oldCoverage.get(functionId) ?? null, after: newCoverage.get(functionId) ?? null }));
  const costChanges = functions.filter(id => canonical(oldCosts.get(id) ?? null) !== canonical(newCosts.get(id) ?? null)).map(functionId => ({ functionId, before: structuredClone(oldCosts.get(functionId) ?? null), after: structuredClone(newCosts.get(functionId) ?? null) }));
  const membershipStable = sameConfig && churn === 0 && merges.length === 0 && splits.length === 0;
  const snapshotChanged = previous.snapshotFingerprint !== next.snapshotFingerprint;
  const maturityChanged = previous.maturity !== next.maturity;
  const scientificStable = membershipStable && !snapshotChanged && !maturityChanged && detailsComplete && kernelChanges.length === 0 && contextChanges.length === 0 && coverageChanges.length === 0 && costChanges.length === 0;
  const hysteresisHeld = sameConfig && Number.isFinite(hysteresis) && hysteresis >= 0 && hysteresis <= 1 && churn > 0 && churn <= 1 - hysteresis && merges.length === 0 && splits.length === 0;
  return {
    sameConfig,
    churn,
    stable: scientificStable,
    membershipStable,
    scientificStable,
    snapshotChanged,
    maturityChanged,
    detailsComplete,
    kernelChanges,
    contextChanges,
    coverageChanges,
    costChanges,
    hysteresisHeld,
    merges,
    splits,
    moves,
    unchangedContentIds,
    counters,
  };
}

export interface LineageAssignment {
  communities: CommunityView[];
  partitionLineageId: string;
  parentLineageId: string | null;
  partitionId: string;
  diagnostics: Diagnostic[];
  counters: LineageCounters;
  previousSource: PreviousProposalSource | null;
  sidecar: {
    version: "l4-lineage-2";
    partitionId: string;
    v1Compatible: boolean;
    proposalPass: boolean;
    projectionFingerprint?: string;
    communities: Array<{ contentId: string; parentContentIds: string[]; conductance: LosslessMetric }>;
  };
}

/** Serializable evidence, not authority by itself. Previous history is referenced,
 * not recursively embedded: storage is O(current source + immediate previous).
 * The host owns retention/budgets and durable receipt authentication in L8.
 */
export interface ProposalEvidence {
  version: "l4-proposal-evidence-1";
  evidenceFingerprint: string;
  source: {
    snapshot: GraphSnapshotView;
    config: MultiviewConfig;
    constraints: readonly LinkConstraint[];
    encoderIdentity: Omit<FrozenEncoder, "encode"> | null;
    encoderIdentityStatus: "absent" | "captured" | "unreadable";
    previous: PreviousProposalSource | null;
  };
  result: {
    partition: ClusterPartitionView;
    lineageSidecar: LineageAssignment["sidecar"];
    diagnostics: Diagnostic[];
    constraints: { status: "satisfied" | "unsatisfiable" | "none"; applied: number; rejected: number };
  };
}

export interface PreviousProposalSource {
  partition: ClusterPartitionView;
  sidecar: LineageAssignment["sidecar"] | null;
  /** Full authority-owned result when available, including negative evidence. */
  authoritative: ProposalEvidence["result"] | null;
  binding: {
    version: "l4-previous-binding-1";
    evidenceFingerprint: string | null;
    receiptRef: string | null;
    status: "verified-pass" | "verified-fail" | "unverified";
  };
}

/** Object identity, not these public fields, is the ephemeral capability. */
export interface LocalProposalReceipt { readonly kind: "l4-local-proposal-receipt" }

export interface ProposalVerificationRequest {
  version: "l4-proposal-verification-1";
  purpose: "adoption" | "previous";
  receiptRef: string;
  evidence: ProposalEvidence;
}

export interface AuthoritativeProposalEvidence {
  version: "l4-host-proposal-evidence-1";
  receiptRef: string;
  evidence: ProposalEvidence;
}

export interface ProposalWitness {
  evidence: ProposalEvidence;
  localReceipt?: LocalProposalReceipt | null;
  /** Trusted HOST configuration, never deserialized from scientific payloads.
   * Must resolve/authenticate a durable authority record, not echo the request.
   * A positive decision is only an offline proposal gate, never native admission.
   */
  host?: {
    receiptRef: string;
    verify: (request: ProposalVerificationRequest) => AuthoritativeProposalEvidence | null;
  };
}

export function snapshotProposalWitness(witness?: ProposalWitness): ProposalWitness | undefined {
  if (!witness) return undefined;
  const state = immutableSnapshot({ evidence: witness.evidence, receiptRef: witness.host?.receiptRef });
  return { evidence: state.evidence, localReceipt: witness.localReceipt,
    ...(witness.host ? { host: { receiptRef: state.receiptRef!, verify: witness.host.verify } } : {}) };
}



function verifyProposalWitness(witness: ProposalWitness | undefined, purpose: ProposalVerificationRequest["purpose"],
  partition: ClusterPartitionView, sidecar: LineageAssignment["sidecar"] | undefined, diagnostics?: readonly Diagnostic[]) {
  let authoritative = readLocalProposalReceipt(witness?.localReceipt);
  let receiptRef: string | null = null;
  try {
    if (!authoritative && witness?.host && typeof witness.host.receiptRef === "string" && witness.host.receiptRef.trim().length > 0
      && inspectProposalEvidence(witness.evidence).wellFormed) {
      const response = immutableSnapshot(witness.host.verify(immutableSnapshot({ version: "l4-proposal-verification-1" as const,
        purpose, receiptRef: witness.host.receiptRef, evidence: witness.evidence })));
      if (hasKeys(response, ["version", "receiptRef", "evidence"]) && response.version === "l4-host-proposal-evidence-1"
        && response.receiptRef === witness.host.receiptRef && inspectProposalEvidence(response.evidence).wellFormed) {
        authoritative = response.evidence;
        receiptRef = response.receiptRef;
      }
    }
  } catch { /* Authentication, clone, malformed return and callback mutations fail closed. */ }
  const assessed = inspectProposalEvidence(authoritative);
  const verified = assessed.wellFormed && !!witness && isDeepStrictEqual(witness.evidence, authoritative)
    && (purpose === "previous" ? matchesPreviousProposal(partition, authoritative!.result.partition)
      : isDeepStrictEqual(partition, authoritative!.result.partition))
    && isDeepStrictEqual(sidecar, authoritative!.result.lineageSidecar)
    && (diagnostics === undefined || isDeepStrictEqual(diagnostics, authoritative!.result.diagnostics));
  return { verified, admissible: verified && assessed.admissible,
    authoritative: assessed.wellFormed ? authoritative : null, receiptRef };
}

export function assignCommunityLineage(
  previous: ClusterPartitionView | null,
  drafts: readonly CommunityDraft[],
  meta: { algorithm: string; algorithmVersion: string; configFingerprint: string; snapshotId: string; hysteresis: number },
  previousSidecar?: LineageAssignment["sidecar"],
  previousWitness?: ProposalWitness,
): LineageAssignment {
  ({ previous, drafts, meta, previousSidecar } = immutableSnapshot({ previous, drafts, meta, previousSidecar }));
  previousWitness = snapshotProposalWitness(previousWitness);
  const diagnostics: Diagnostic[] = [];
  const counters: LineageCounters = { draftMembers: 0, indexedMemberVisits: 0, overlapMemberVisits: 0, overlapPairs: 0 };
  let previousSource: PreviousProposalSource | null = null;
  if (previous) {
    const proof = verifyProposalWitness(previousWitness, "previous", previous, previousSidecar);
    previousSource = immutableSnapshot({ partition: previous, sidecar: previousSidecar ?? null, authoritative: proof.authoritative?.result ?? null,
      binding: { version: "l4-previous-binding-1" as const, evidenceFingerprint: proof.authoritative?.evidenceFingerprint ?? null,
        receiptRef: proof.receiptRef, status: proof.verified ? (proof.admissible ? "verified-pass" as const : "verified-fail" as const) : "unverified" as const } });
    if (!proof.verified) diagnostics.push(fail("lineage-previous-unverified", "previous proposal needs exact complete evidence and an evaluated local capability or authenticated host record", []));
    else if (!proof.admissible) diagnostics.push(fail("lineage-previous-incompatible", "authenticated previous proposal failed; a new generation cannot authorize its history", []));
    if (proof.authoritative) {
      // Carry every distinct failure without growing identical replay markers.
      for (const item of proof.authoritative.result.diagnostics.filter(item => item.severity === "fail")) {
        if (!diagnostics.some(existing => isDeepStrictEqual(existing, item))) diagnostics.push(structuredClone(item));
      }
      // Recover complete known ancestry even when the submitted sidecar was edited.
      // The mismatch still fails; no claim that the submitted history was accepted.
      if (matchesPreviousProposal(previous, proof.authoritative.result.partition)) previousSidecar = proof.authoritative.result.lineageSidecar;
    }
  }
  const previousAncestry = new Map<string, string[]>();
  if (previous && previous.algorithm === "multiview-components" && previous.algorithmVersion === "2") {
    const bound = previousSidecar?.version === "l4-lineage-2" && previousSidecar.partitionId === previous.partitionId
      && previousSidecar.projectionFingerprint === partitionProposalFingerprint(previous)
      && Array.isArray(previousSidecar.communities) && previousSidecar.communities.length === previous.communities.length
      && sameIdSet(previousSidecar.communities.map(item => item.contentId), previous.communities.map(item => item.contentId));
    if (!bound) diagnostics.push(fail("lineage-previous-sidecar-missing", "v2 previous lineage needs its bound lossless sidecar; a v1 projection cannot prove complete ancestry", []));
    else {
      for (const item of previousSidecar!.communities) previousAncestry.set(item.contentId, [...item.parentContentIds]);
      if (!previousSidecar!.v1Compatible || !previousSidecar!.proposalPass) diagnostics.push(fail("lineage-previous-incompatible", "the previous lossless lineage was not admissible", []));
    }
  }
  const numericMetrics = new Map<string, LosslessMetric>();
  const seen = new Set<string>();
  const prepared = drafts.map(draft => {
    counters.draftMembers += draft.memberIds.length;
    const memberIds = sortFunctionIds([...new Set(draft.memberIds)]);
    const contentId = communityContentId(meta.algorithm, meta.algorithmVersion, meta.configFingerprint, memberIds);
    if (memberIds.length === 0 || memberIds.length !== draft.memberIds.length || memberIds.some(id => seen.has(id))) diagnostics.push(fail("lineage-membership", "drafts must be a non-overlapping partition with unique members", memberIds));
    memberIds.forEach(id => seen.add(id));
    const members = new Set(memberIds);
    const metric = draft.conductance;
    const valid = metric?.known === false ? metric.value === null : metric?.known === true && typeof metric.value === "number" && Number.isFinite(metric.value) && metric.value >= 0 && metric.value <= 1;
    if (!valid) diagnostics.push(fail("lineage-metric", "conductance must be unknown or finite in [0,1]", memberIds));
    numericMetrics.set(contentId, valid ? { ...metric } : { ...UNKNOWN_METRIC });
    return {
      contentId,
      memberIds,
      kernelIds: sortFunctionIds([...new Set(draft.kernelIds.filter(id => members.has(id)))]),
      externalContextIds: sortFunctionIds([...new Set(draft.externalContextIds.filter(id => !members.has(id)))]),
      conductance: valid && validIntegerMetric(metric) ? { ...metric } : { ...UNKNOWN_METRIC },
    };
  }).sort((a, b) => compareFunctionIds(a.memberIds[0] ?? "", b.memberIds[0] ?? ""));
  const splitParents = new Set<string>();
  const compatiblePrevious = previous && previous.configFingerprint === meta.configFingerprint && previous.algorithm === meta.algorithm && previous.algorithmVersion === meta.algorithmVersion ? previous : null;
  const candidates = compatiblePrevious ? overlapCandidates(compatiblePrevious, prepared, counters) : new Map<string, OverlapCandidate[]>();
  if (compatiblePrevious) {
    for (const split of detectSplits(compatiblePrevious, { ...stubPartition(meta, compatiblePrevious), communities: prepared.map(seedCommunity) }, counters)) splitParents.add(split.parentContentId);
  }
  const sidecarCommunities: LineageAssignment["sidecar"]["communities"] = [];
  const communities: CommunityView[] = prepared.map(draft => {
    const lineage = resolveLineage(compatiblePrevious, draft, candidates.get(draft.contentId) ?? [], meta, splitParents, previousAncestry);
    sidecarCommunities.push({ contentId: draft.contentId, parentContentIds: [...lineage.parentContentIds], conductance: { ...numericMetrics.get(draft.contentId)! } });
    if (lineage.parentContentIds.length > 2) diagnostics.push(fail("lineage-v1-parent-limit", "v1 allows two merge parents; complete ancestry is preserved in the lossless sidecar and this proposal cannot be adopted", draft.memberIds));
    return {
      contentId: draft.contentId,
      lineageId: lineage.lineageId,
      parentContentIds: lineage.parentContentIds.length > 2 ? [] : lineage.parentContentIds,
      memberIds: draft.memberIds,
      kernelIds: draft.kernelIds,
      externalContextIds: draft.externalContextIds,
      conductance: draft.conductance,
    };
  });
  const contentIds = communities.map(item => item.contentId).sort();
  const sameGeneration = previous !== null
    && previous.configFingerprint === meta.configFingerprint
    && previous.algorithm === meta.algorithm
    && previous.algorithmVersion === meta.algorithmVersion
    && sameIdSet(previous.communities.map(item => item.contentId), contentIds);
  const partitionLineageId = sameGeneration && previous
    ? previous.lineageId
    : prefixedId("lin:p:", { role: "partition-lineage", configFingerprint: meta.configFingerprint, snapshotId: meta.snapshotId, contentIds });
  const parentLineageId = previous === null ? null : (sameGeneration ? previous.parentLineageId : previous.lineageId);
  const partitionId = prefixedId("part:", { role: "partition", configFingerprint: meta.configFingerprint, snapshotId: meta.snapshotId, contentIds });
  return { communities, partitionLineageId, parentLineageId, partitionId, diagnostics, counters, previousSource, sidecar: { version: "l4-lineage-2", partitionId, v1Compatible: !diagnostics.some(item => item.severity === "fail"), proposalPass: !diagnostics.some(item => item.severity === "fail"), communities: sidecarCommunities } };
}

export interface AdoptionPlan {
  explicit: boolean;
  adopted: boolean;
  destructive: false;
  rewroteActiveUnits: false;
  partition: ClusterPartitionView;
  retainedUnits: FrozenActiveUnit[];
  migratableUnitIds: string[];
  untouchedUnitIds: string[];
  diagnostics: Diagnostic[];
}

export interface UnitQuiescenceProof {
  unitId: string;
  snapshotId: string;
  attemptIds: string[];
  claimIds: string[];
  authorityRef: string;
  revision: number;
  quiescent: boolean;
  released: boolean;
  workerStillExecutable: boolean;
  leaseHeld: boolean;
}

export function planAdoption(input: {
  partition: ClusterPartitionView;
  units: readonly FrozenActiveUnit[];
  explicit: boolean;
  lineageSidecar?: LineageAssignment["sidecar"];
  proposalDiagnostics?: readonly Diagnostic[];
  proposalWitness?: ProposalWitness;
  quiescence?: readonly UnitQuiescenceProof[];
  /** This proposal gate is not native admission; L8 must consult real L6 authority. */
  verifyQuiescence?: (proof: UnitQuiescenceProof, unit: FrozenActiveUnit) => boolean;
}): AdoptionPlan {
  const state = immutableSnapshot({ partition: input.partition, units: input.units, explicit: input.explicit,
    lineageSidecar: input.lineageSidecar, proposalDiagnostics: input.proposalDiagnostics, quiescence: input.quiescence });
  input = { ...state, proposalWitness: snapshotProposalWitness(input.proposalWitness), verifyQuiescence: input.verifyQuiescence };
  const partition = clonePartition(input.partition);
  const units = input.units.map(cloneUnit);
  const proof = verifyProposalWitness(input.proposalWitness, "adoption", input.partition, input.lineageSidecar, input.proposalDiagnostics);
  const diagnostics: Diagnostic[] = structuredClone([...(proof.authoritative?.result.diagnostics ?? input.proposalDiagnostics ?? [])]);
  const schemaErrors = strictSchemaErrors(partition, PARTITION_SCHEMA);
  if (schemaErrors.length) diagnostics.push(fail("adoption-partition-schema", schemaErrors.join("; "), []));
  if (!partitionInvariants(partition)) diagnostics.push(fail("adoption-partition-invariants", "partition identities, metrics, ownership or kernel/context invariants are invalid", []));
  const sidecar = input.lineageSidecar ? structuredClone(input.lineageSidecar) : undefined;
  const communityById = new Map(partition.communities.map(item => [item.contentId, item]));
  const compatible = proof.admissible && sidecar?.version === "l4-lineage-2" && sidecar.partitionId === partition.partitionId && sidecar.projectionFingerprint === partitionProposalFingerprint(partition) && sidecar.v1Compatible === true && sidecar.proposalPass === true
    && sidecar.communities.length === partition.communities.length
    && new Set(sidecar.communities.map(item => item.contentId)).size === sidecar.communities.length
    && sidecar.communities.every(item => item.parentContentIds.length <= 2 && communityById.has(item.contentId) && sameIdSet(communityById.get(item.contentId)!.parentContentIds, item.parentContentIds));
  if (!compatible) diagnostics.push(fail("adoption-proposal-unverified", "exact complete evaluated evidence plus local capability or authenticated host record is required; payload flags and content digests are not authority", []));
  const proofs = new Map<string, UnitQuiescenceProof[]>();
  for (const proof of structuredClone([...(input.quiescence ?? [])])) {
    const list = proofs.get(proof.unitId) ?? [];
    list.push(proof);
    proofs.set(proof.unitId, list);
  }
  const inventoryCounts = new Map<string, number>();
  for (const unit of units) inventoryCounts.set(unit.unitId, (inventoryCounts.get(unit.unitId) ?? 0) + 1);
  const adopted = input.explicit && compatible && !diagnostics.some(item => item.severity === "fail");
  const migratableUnitIds: string[] = [];
  for (const unit of units) {
    if (!MIGRATABLE.has(unit.state)) continue;
    const candidates = proofs.get(unit.unitId) ?? [];
    const proof = candidates.length === 1 ? candidates[0] : undefined;
    let verified = false;
    try {
      verified = adopted && inventoryCounts.get(unit.unitId) === 1 && !!proof && !!unit.attemptIds && !!unit.claimIds
        && unit.workerStillExecutable !== true && unit.leaseHeld !== true
        && (!unit.attempts || (sameIdSet(unit.attempts.map(item => item.attemptId), unit.attemptIds) && unit.attempts.every(item => item.snapshotId === unit.snapshotId && item.workerStillExecutable === false)))
        && (!unit.claims || (sameIdSet(unit.claims.map(item => item.claimId), unit.claimIds) && unit.claims.every(item => item.snapshotId === unit.snapshotId && item.leaseHeld === false)))
        && Array.isArray(proof.attemptIds) && Array.isArray(proof.claimIds)
        && new Set(unit.attemptIds).size === unit.attemptIds.length && new Set(unit.claimIds).size === unit.claimIds.length
        && new Set(proof.attemptIds).size === proof.attemptIds.length && new Set(proof.claimIds).size === proof.claimIds.length
        && proof.unitId === unit.unitId && proof.snapshotId === unit.snapshotId
        && sameIdSet(proof.attemptIds, unit.attemptIds) && sameIdSet(proof.claimIds, unit.claimIds)
        && typeof proof.authorityRef === "string" && proof.authorityRef.length > 0 && Number.isSafeInteger(proof.revision) && proof.revision >= 0
        && proof.quiescent === true && proof.released === true && proof.workerStillExecutable === false && proof.leaseHeld === false
        && input.verifyQuiescence?.(structuredClone(proof), cloneUnit(unit)) === true;
    } catch { verified = false; }
    if (verified) migratableUnitIds.push(unit.unitId);
    else diagnostics.push({ code: "unit-quiescence-unverified", severity: "warning", detail: `unit ${unit.unitId} stays snapshot-bound: state alone does not prove release of every attempt and claim`, functionIds: [...unit.ownedFunctionIds] });
  }
  migratableUnitIds.sort();
  const migratable = new Set(migratableUnitIds);
  const retainedUnits = units.filter(unit => !migratable.has(unit.unitId)).map(cloneUnit);
  const untouchedUnitIds = units.filter(unit => !LAUNCHED.has(unit.state) && !migratable.has(unit.unitId)).map(unit => unit.unitId).sort();
  if (!input.explicit) diagnostics.push({ code: "adoption-not-requested", severity: "info", detail: "partition stays unadopted until an explicit decision", functionIds: [] });
  if (retainedUnits.length > 0) diagnostics.push({ code: "active-units-frozen", severity: "info", detail: "launched units stay bound to their snapshot", functionIds: retainedUnits.flatMap(unit => unit.ownedFunctionIds) });
  partition.adopted = adopted;
  return {
    explicit: input.explicit,
    adopted,
    destructive: false,
    rewroteActiveUnits: false,
    partition,
    retainedUnits,
    migratableUnitIds,
    untouchedUnitIds,
    diagnostics,
  };
}

export function sameMembership(left: ClusterPartitionView, right: ClusterPartitionView): boolean {
  return JSON.stringify(signatures(left)) === JSON.stringify(signatures(right));
}



function detectMerges(previous: ClusterPartitionView, next: ClusterPartitionView, counters?: LineageCounters): PartitionComparison["merges"] {
  const merges: PartitionComparison["merges"] = [];
  const overlaps = overlapCandidates(previous, next.communities, counters);
  for (const child of [...next.communities].sort((a, b) => a.contentId.localeCompare(b.contentId))) {
    const parents = (overlaps.get(child.contentId) ?? []).filter(item => item.common === item.community.memberIds.length && item.common < child.memberIds.length).map(item => item.community);
    if (parents.length < 2) continue;
    if (!sameIdSet(parents.flatMap(item => item.memberIds), child.memberIds)) continue;
    merges.push({
      parentContentIds: parents.map(item => item.contentId).sort(),
      childContentId: child.contentId,
      memberIds: child.memberIds,
    });
  }
  return merges;
}


function signatures(partition: ClusterPartitionView): string[] {
  return partition.communities.map(item => `${item.contentId}:${item.memberIds.join(",")}`).sort();
}




function seedCommunity(draft: { contentId: string; memberIds: string[]; kernelIds: string[]; externalContextIds: string[]; conductance: UnknownableInteger }): CommunityView {
  return { ...draft, lineageId: "lin:pending", parentContentIds: [] };
}

function stubPartition(
  meta: { algorithm: string; algorithmVersion: string; configFingerprint: string; snapshotId: string },
  previous: ClusterPartitionView,
): ClusterPartitionView {
  return {
    ...previous,
    algorithm: meta.algorithm,
    algorithmVersion: meta.algorithmVersion,
    configFingerprint: meta.configFingerprint,
    snapshotId: meta.snapshotId,
    communities: [],
  };
}

function stripDeltaId(delta: KnowledgeDeltaView): Omit<KnowledgeDeltaView, "deltaId"> {
  return {
    schemaVersion: delta.schemaVersion,
    fromRevision: delta.fromRevision,
    toRevision: delta.toRevision,
    affectedFunctionIds: delta.affectedFunctionIds,
    factIds: delta.factIds,
    evidence: delta.evidence,
    origin: delta.origin,
    validation: delta.validation,
    invalidations: delta.invalidations,
    potentialImpact: delta.potentialImpact,
  };
}

function cloneUnit(unit: FrozenActiveUnit): FrozenActiveUnit {
  return structuredClone(unit);
}

function clonePartition(partition: ClusterPartitionView): ClusterPartitionView {
  return structuredClone(partition);
}

















function fail(code: string, detail: string, functionIds: string[]): Diagnostic {
  return { code, severity: "fail", detail, functionIds };
}
