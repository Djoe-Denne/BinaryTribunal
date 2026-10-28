/** Contracts for a future, offline-first harness. No native worker or IDB implementation. */
export type Role = "explore" | "evaluate" | "A" | "B" | "R";
export type Stage = "explore" | "group" | "evaluate" | "freeze" | "analyse" | "reconcile" | "validate" | "consolidate";
export type Decision = "certain" | "likely" | "unlikely" | "blocked";
export type Outcome = "saved_certain" | "retained_uncertain" | "blocked";
export interface BinaryIdentity { sha256: string; version: string }
export interface FunctionIdentity extends BinaryIdentity { ea: string }
export interface ModelRef { providerID: string; id: string; variant: string }
export interface Evidence { id: string; source: string; sha256: string; detail: string }
export interface ArtifactFile {
  path: string; sha256: string; version: string; provenance: string;
  kind: "native" | "rule" | "knowledge" | "proposal" | "score" | "manifest";
  /** Explicit approval of knowledge for a blind projection, not an inferred permission. */
  approvedForBlind?: boolean;
  /** Optional explicit scope; absent means an operator-approved common input. */
  identity?: FunctionIdentity;
}
export interface FrozenKnowledge {
  version: string; fingerprint: string; leadsFingerprint: string; files: ArtifactFile[];
  validatedFacts?: ValidatedFactMetadata[];
  /** Operator-common evidence, separated from the aggregate acquired-fact fingerprint. */
  commonFingerprint?: string;
  scopedLeads?: Array<{ identity: FunctionIdentity; fingerprint: string }>;
}
export interface Candidate {
  identity: FunctionIdentity; manifestVersion: string; evidence: Evidence[];
  inputs: ArtifactFile[]; dependencies: FunctionIdentity[];
}
export interface Assessment {
  identity: FunctionIdentity; method: string; version: string; difficulty: number;
  reasons: string[]; evidence: Evidence[]; estimatedCost?: number;
}
export interface FixtureSeeds { approved: true; candidates: Candidate[]; assessments: Assessment[] }
export interface AdmissionRetryPolicy {
  maxAttempts: number; retryDelayMs: number;
  /** Synthetic defaults are admissible only when the mission explicitly sets fixture=true. */
  fixtureSynthetic?: true;
}
export type FailureCause = null | boolean | number | string | FailureCause[] | { [key: string]: FailureCause };
export interface FailureTrace {
  operation: "ensureTeam" | "submit" | "inspect" | "pauseAdmissions" | "stop" | "resumeAdmissions" | "publish" | "readback" | "materializeKnowledge";
  at: number; cause: FailureCause; executionId?: string; attempt?: number;
}
export interface MissionConfig {
  schemaVersion: 1; missionId: string; binary: BinaryIdentity; fixture: boolean;
  evaluation: { method: string; version: string; maxDifficulty: number };
  subsetSize?: number; budget?: number; maxCycles: number; stagnationLimit: number;
  models: Record<Role, ModelRef>; knowledge: FrozenKnowledge; commonInputs: ArtifactFile[];
  accessibleRules: string[]; requiredTools: string[]; outputDirectory: string;
  fixtureSeeds?: FixtureSeeds;
  retryPolicy?: AdmissionRetryPolicy;
  /** Explicit opt-in; absent preserves the legacy frozen-only execution contract. */
  rePolicy?: import("./re-policy").REPolicy;
}
export interface Proposition { id: string; text: string; evidence: Evidence[]; contradictions: string[]; questions: string[] }
export interface ReconciliationConclusion { text: string; evidence: Evidence[] }
export interface PublicationGateFacts {
  nativeAsmChecked: true; independentAuthors: true; inputHashesVerified: true;
  opcodeCoverageComplete: true; abiChecked: true; contradictionsResolved: true;
  readbackPlan: true; targetId: string; targetRevision: number; evidence: Evidence[];
}
export interface ResultHeader {
  schemaVersion: 1; missionId: string; taskId: string; attemptId: string; executionId: string;
  cycle: number; authorId: string; inputFingerprint: string;
  inputVersions: Array<{ path: string; version: string; sha256: string }>;
  previousResultIds: string[]; identity?: FunctionIdentity;
}
export type WorkerResult = ResultHeader & (
  { kind: "explore"; candidates: Candidate[] } |
  { kind: "evaluate"; assessments: Assessment[] } |
  { kind: "proposal"; role: "A" | "B"; propositions: Proposition[] } |
  { kind: "reconciliation"; decision: Decision; propositions: Proposition[];
    contradictions: string[]; questions: string[]; publicationGate?: PublicationGateFacts; conclusion?: ReconciliationConclusion }
);
export interface FrozenProposal {
  resultId: string; sha256: string; path: string; authorId: string; executionId: string;
  sessionId: string; content: string; document: WorkerResult;
}
export interface InputBundle {
  schemaVersion: 1; role: Role; cycle: number; identity?: FunctionIdentity;
  files: ArtifactFile[]; accessibleRules: string[]; requiredTools: string[];
  knowledge: FrozenKnowledge; candidates?: Candidate[]; proposals?: FrozenProposal[];
  evaluation?: { method: string; version: string; budget?: number };
  unresolvedResults?: Array<{ resultId: string; identity: FunctionIdentity; decision: "likely" | "unlikely"; cycle: number; sha256: string }>;
  /** R-only descriptor projected from the frozen cycle's dependency group. */
  neighborhood?: import("./re-policy").Neighborhood;
}
export interface Intent {
  schemaVersion: 1; missionId: string; taskId: string; attemptId: string; executionId: string;
  binary: BinaryIdentity;
  fixture: boolean;
  idempotencyKey: string; cycle: number; role: Role; identity?: FunctionIdentity;
  fresh: true; requestedModel: ModelRef; inputs: InputBundle; inputFingerprint: string;
  outputPath: string; previousResultIds: string[];
}
/** Additive offline graph envelope; never an extension of MissionConfig/L1. */
export interface PreparedGraph {
  version: "l8-prepared-graph-v1";
  snapshot: import("./graph").GraphSnapshotV1;
  partition: import("./cluster").ClusterPartition;
  groups: import("./investigation-groups").InvestigationGroup[];
  planning: import("./planner").PlannerResult;
  fingerprint: string;
}
export interface GraphRun {
  version: "l8-graph-run-v1"; fixture: true; missionId: string; cycle: number; missionRevision: number;
  missionConfigFingerprint: string; prepared: PreparedGraph;
  settings: {
    profiles: Record<"A" | "B" | "R", string>; maxConcurrent: number; familyTtlEvents: number;
    maxAdmissionAttempts: number; retryDelayMs: number;
  };
  workers: import("./planner").WorkerCapacity[];
  accounts: import("./planner").AccountCapacity[];
  inputsByFunction: Record<string, ArtifactFile[]>;
  publicationsByFunction: Record<string, { artifactId: string; artifactKind: import("./planner").ArtifactKind; content: string }>;
  fingerprint: string;
}
export interface ControllerLease { missionId: string; owner: string; token: number; expiresAt: number }
export interface ControllerContext { lease: ControllerLease; revision: number }
export interface Inspection {
  status: "pending" | "running" | "completed" | "failed";
  executionId: string; authorId?: string; sessionId?: string; effectiveModel?: ModelRef;
  /** Native session facts; historical prose is never model authority. */
  fresh?: boolean; parentSessionId?: string;
  artifact?: { path: string; sha256: string; content: string }; error?: string;
  /** Audit-only native trace; never part of WorkerResult or common knowledge. */
  communicationTrace?: unknown;
  communicationAudit?: import("./bulletin-audit").CommunicationAudit;
}
/** Adapter owns capacity, sessions, output collection and effective permission probes. */
export interface Bridge {
  ensureTeam(config: MissionConfig, controller: ControllerContext): Promise<void>;
  submit(intent: Intent, controller: ControllerContext): Promise<void>;
  inspect(intent: Intent): Promise<Inspection>;
  pauseAdmissions(missionId: string, controller: ControllerContext): Promise<void>;
  stop(missionId: string, controller: ControllerContext): Promise<void>;
  /** Needed when the adapter also maintains an external admission pause. */
  resumeAdmissions?(missionId: string, controller: ControllerContext): Promise<void>;
}
export interface PublicationRequest {
  idempotencyKey: string; missionId: string; identity: FunctionIdentity;
  reconciliationId: string; resultHash: string; document: WorkerResult;
  targetId: string; expectedRevision: number; fixture: boolean;
}
export interface PublicationReceipt { idempotencyKey: string; targetId: string; revision: number; resultHash: string }
export interface ValidatedFactMetadata {
  schemaVersion: 1; resultId: string; identity: FunctionIdentity;
  inputVersions: ResultHeader["inputVersions"]; resultHash: string;
  publicationReceipt: PublicationReceipt; conclusion: ReconciliationConclusion;
}
export interface ValidatedFact extends ValidatedFactMetadata {
  file: ArtifactFile; content: string; materialization: "pending" | "verified"; lastError?: string;
}
export interface KnowledgeArtifactSink {
  /** Must reject alteration of an existing path and return the hash of verified bytes. */
  writeImmutable(artifact: { file: ArtifactFile; content: string }): Promise<{ sha256: string }>;
}
export interface PublicationAdapter {
  publish(request: PublicationRequest, controller: ControllerContext): Promise<PublicationReceipt>;
  readback(receipt: PublicationReceipt, controller: ControllerContext): Promise<PublicationReceipt>;
}
export type InputProblem = "missing" | "altered" | "denied-read" | "denied-list" | "unavailable-tool" | "invalid-manifest";
export interface AccessContext { missionId: string; executionId: string; role: Role }
export type ReadAccess = { status: "ok"; content: string | Uint8Array } | { status: "missing" | "denied-read" | "unavailable-tool" };
export type ListAccess = { status: "ok"; entries: string[] } | { status: "missing" | "denied-list" | "unavailable-tool" };
/** Must probe the worker's effective access, never the controller's filesystem rights. */
export interface InputAccess {
  read(path: string, context: AccessContext): Promise<ReadAccess>;
  list(directory: string, context: AccessContext): Promise<ListAccess>;
  tool(name: string, context: AccessContext): Promise<boolean>;
}
export interface InputCheck { ok: boolean; issues: Array<{ kind: InputProblem; path: string; detail: string }> }
export interface StoredResult {
  resultId: string; path: string; sha256: string; authorId: string; executionId: string;
  sessionId: string; effectiveModel: ModelRef; content: string; document: WorkerResult;
}
export interface StoredIntent {
  intent: Intent; state: "planned" | "submitted" | "resolved" | "blocked";
  result?: StoredResult; error?: string; inputIssues?: InputCheck["issues"];
  admissionAttempts?: number; inspectionHistory?: Inspection[];
  nextAdmissionAt?: number; failureHistory?: FailureTrace[];
}
export interface AssessmentRecord {
  assessment: Assessment; resultId: string; cycle: number; evidenceFingerprint: string;
  manifestFingerprint: string; accepted: boolean; rejectionReason?: string;
}
export interface CandidateState {
  candidate: Candidate; manifestFingerprint: string; assessments: AssessmentRecord[];
  eligibleCycle: number; outcome?: Outcome; reason?: string;
  scientificHistory?: Array<{ cycle: number; fingerprint: string; phase: "attempted" | "reconciled"; resultId?: string; decision?: Decision }>;
}
export interface CycleRecord {
  number: number; knowledge: FrozenKnowledge; subset: string[]; frozen: boolean;
  fingerprint?: string; groups: Array<{ id: string; members: string[] }>;
  /** Routing/binding only, never scientific or parent authority. Frozen with the cycle. */
  graph?: { version: "l8-frozen-cycle-v1"; runFingerprint: string; preparedFingerprint: string; planFingerprint: string; snapshotId: string; partitionId: string; knowledgeRevision: number };
  functionFingerprints?: Record<string, string>;
}
export interface PublicationState {
  request: PublicationRequest; state: "pending" | "published" | "verified";
  receipt?: PublicationReceipt; attempts: number; lastError?: string;
  failureHistory?: FailureTrace[];
}
export interface ReconciliationRecord {
  result: StoredResult; proposalResultIds: string[]; previousResultIds: string[];
  decision: Decision; outcome: Outcome | "publication_pending"; publication?: PublicationState;
  scientificInputFingerprint?: string;
}
export interface Snapshot {
  schemaVersion: 1; missionId: string; revision: number; config: MissionConfig;
  status: "running" | "paused" | "stopped" | "suspended" | "complete";
  reason?: string; cycle: number; stage: Stage; candidates: CandidateState[];
  cycles: CycleRecord[]; intents: StoredIntent[]; reconciliations: ReconciliationRecord[];
  noProgressCycles: number;
  controlPending?: "pause" | "stop" | "resume"; controlError?: string;
  teamAdmissionAttempts?: number; nextTeamAdmissionAt?: number; failureHistory?: FailureTrace[];
  validatedFacts?: ValidatedFact[];
}
