import { posix, win32 } from "node:path";
import { validateREPolicy } from "./re-policy";
import type { AdmissionRetryPolicy, ArtifactFile, Assessment, BinaryIdentity, Candidate, Evidence, FailureCause, FixtureSeeds, FrozenKnowledge, FunctionIdentity, Intent, MissionConfig, Inspection, ModelRef, Proposition, PublicationGateFacts, ReconciliationConclusion, ResultHeader, ValidatedFactMetadata, WorkerResult } from "./domain";
export function hash(value: string | Uint8Array): string { return new Bun.CryptoHasher("sha256").update(value).digest("hex"); }
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().filter(k => record[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(record[k])}`).join(",")}}`;
}
/** Code-unit ordering is stable across locales and platforms. Addresses use numeric ordering. */
export function compareText(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
export const FIXTURE_RETRY_POLICY: Readonly<AdmissionRetryPolicy> = Object.freeze({ maxAttempts: 3, retryDelayMs: 0, fixtureSynthetic: true });
/** Preserve typed values and Error properties; never infer categories from message text. */
export function failureCause(value: unknown, parents = new Set<object>()): FailureCause {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : { type: "number", value: String(value) };
  if (typeof value !== "object") return { type: typeof value, value: String(value) };
  if (parents.has(value)) return { type: "circular-reference" };
  parents.add(value);
  try {
    if (Array.isArray(value)) return value.map(item => failureCause(item, parents));
    const record = value as Record<string, unknown>;
    const keys = value instanceof Error ? [...new Set([...Object.getOwnPropertyNames(value), "name", "message", ...(bridgeFailureCategory(value) ? ["category", "recoverable"] : [])])] : Object.keys(record);
    return Object.fromEntries(keys.map(key => [key, failureCause(record[key], parents)]));
  } finally { parents.delete(value); }
}
export function bridgeFailureCategory(value: unknown): { category: string; recoverable: boolean } | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return typeof record.category === "string" && record.category.length > 0 && typeof record.recoverable === "boolean" ? { category: record.category, recoverable: record.recoverable } : undefined;
}
export function fingerprint(value: unknown): string { return hash(canonical(value)); }
export function identityKey(identity: FunctionIdentity): string { return `${identity.sha256.toLowerCase()}:${identity.version}:${normalizeEA(identity.ea)}`; }
function requireThat(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`validation: ${message}`); }
function object(value: unknown, name: string): asserts value is Record<string, unknown> { requireThat(value !== null && typeof value === "object" && !Array.isArray(value), `${name} must be an object`); }
function text(value: unknown, name: string): asserts value is string { requireThat(typeof value === "string" && value.trim().length > 0, `${name} must be explicit nonempty text`); }
function array(value: unknown, name: string): asserts value is unknown[] { requireThat(Array.isArray(value), `${name} must be an explicit array`); }
function integer(value: unknown, name: string, minimum = 1): asserts value is number { requireThat(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum, `${name} must be an integer >= ${minimum}`); }
function score(value: unknown, name: string): asserts value is number { requireThat(typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100, `${name} must be an ordinal score in [0,100]`); }
export function validateSHA(value: unknown): asserts value is string { requireThat(typeof value === "string" && /^[a-f0-9]{64}$/i.test(value), "sha256 must be 64 hex characters"); }
export function exactPath(value: unknown): asserts value is string {
  text(value, "path"); requireThat((win32.isAbsolute(value) || posix.isAbsolute(value)) && !value.split(/[\\/]/).includes("..") && !value.includes("\0"), "paths must be exact absolute paths without traversal");
}
export function normalizeEA(value: unknown): string {
  requireThat(typeof value === "string" && /^0x[0-9a-f]+$/i.test(value), "EA must be explicit hexadecimal");
  const ea = BigInt(value); requireThat(ea > 0n && ea <= 0xffffffffffffffffn, "EA out of range"); return `0x${ea.toString(16).toUpperCase()}`;
}
export function validateIdentity(value: unknown, binary?: BinaryIdentity): FunctionIdentity {
  object(value, "identity"); validateSHA(value.sha256); text(value.version, "binary version"); const ea = normalizeEA(value.ea);
  if (binary) requireThat(value.sha256.toLowerCase() === binary.sha256.toLowerCase() && value.version === binary.version, "binary hash/version identity mismatch");
  return { sha256: value.sha256.toLowerCase(), version: value.version, ea };
}
function evidence(value: unknown): asserts value is Evidence[] {
  array(value, "evidence"); requireThat(value.length > 0, "scientific evidence must not be empty");
  for (const e of value) { object(e, "evidence item"); text(e.id, "evidence id"); text(e.source, "evidence source"); validateSHA(e.sha256); text(e.detail, "evidence detail"); }
}
function strings(value: unknown, name: string, nonempty = false): asserts value is string[] { array(value, name); if (nonempty) requireThat(value.length > 0, `${name} cannot be empty`); value.forEach(v => text(v, name)); }
export function validateFile(value: unknown): ArtifactFile {
  object(value, "artifact file"); exactPath(value.path); validateSHA(value.sha256); text(value.version, "artifact version"); text(value.provenance, "artifact provenance");
  requireThat(value.kind === "native" || value.kind === "rule" || value.kind === "knowledge" || value.kind === "proposal" || value.kind === "score" || value.kind === "manifest", "unknown file kind");
  if (value.approvedForBlind !== undefined) requireThat(typeof value.approvedForBlind === "boolean", "blind approval must be boolean");
  const identity = value.identity === undefined ? undefined : validateIdentity(value.identity);
  return { ...value, path: value.path, sha256: value.sha256, version: value.version, provenance: value.provenance, kind: value.kind, ...(value.approvedForBlind === undefined ? {} : { approvedForBlind: value.approvedForBlind }), ...(identity ? { identity } : {}) };
}
export function validateKnowledge(value: unknown): FrozenKnowledge {
  object(value, "knowledge"); text(value.version, "knowledge version"); text(value.fingerprint, "knowledge fingerprint"); text(value.leadsFingerprint, "knowledge leadsFingerprint");
  array(value.files, "knowledge files"); let validatedFacts: ValidatedFactMetadata[] | undefined;
  if (value.validatedFacts !== undefined) { array(value.validatedFacts, "validated facts"); validatedFacts = value.validatedFacts.map(validatedFactMetadata); }
  if (value.commonFingerprint !== undefined) text(value.commonFingerprint, "common knowledge fingerprint");
  let scopedLeads: FrozenKnowledge["scopedLeads"];
  if (value.scopedLeads !== undefined) { array(value.scopedLeads, "scoped leads"); scopedLeads = value.scopedLeads.map(l => { object(l, "scoped lead"); text(l.fingerprint, "scoped lead fingerprint"); return { identity: validateIdentity(l.identity), fingerprint: l.fingerprint }; }); }
  return structuredClone({ ...value, version: value.version, fingerprint: value.fingerprint, leadsFingerprint: value.leadsFingerprint, files: value.files.map(validateFile), ...(validatedFacts ? { validatedFacts } : {}), ...(value.commonFingerprint === undefined ? {} : { commonFingerprint: value.commonFingerprint }), ...(scopedLeads ? { scopedLeads } : {}) });
}
export function validateCandidate(value: unknown, binary: BinaryIdentity, fixture: boolean): Candidate {
  object(value, "candidate"); const identity = validateIdentity(value.identity, binary); text(value.manifestVersion, "manifest version"); evidence(value.evidence);
  array(value.inputs, "candidate inputs"); const inputs = value.inputs.map(validateFile);
  if (!fixture) requireThat(inputs.some(f => f.kind === "native"), "real candidate requires a native freeze (hash is not completeness)");
  array(value.dependencies, "dependencies"); const dependencies = value.dependencies.map(d => validateIdentity(d, binary));
  return structuredClone({ ...value, identity, manifestVersion: value.manifestVersion, evidence: value.evidence, inputs, dependencies });
}
export function validateAssessment(value: unknown, binary: BinaryIdentity, method?: string, version?: string): Assessment {
  object(value, "assessment"); const identity = validateIdentity(value.identity, binary); text(value.method, "evaluation method"); text(value.version, "evaluation version");
  if (method) requireThat(value.method === method, "evaluation method mismatch"); if (version) requireThat(value.version === version, "evaluation version mismatch");
  score(value.difficulty, "difficulty"); strings(value.reasons, "assessment reasons", true); evidence(value.evidence);
  if (value.estimatedCost !== undefined) requireThat(typeof value.estimatedCost === "number" && Number.isFinite(value.estimatedCost) && value.estimatedCost > 0, "estimated cost must be positive");
  return structuredClone({ ...value, identity, method: value.method, version: value.version, difficulty: value.difficulty, reasons: value.reasons, evidence: value.evidence, ...(value.estimatedCost === undefined ? {} : { estimatedCost: value.estimatedCost }) });
}
function model(value: unknown): ModelRef {
  object(value, "native model reference"); text(value.providerID, "native model providerID"); text(value.id, "native model id"); text(value.variant, "native model variant");
  requireThat(!value.id.includes("#"), "native model id must not contain a variant suffix");
  return { ...value, providerID: value.providerID, id: value.id, variant: value.variant };
}
function retryPolicy(value: unknown, fixture: boolean): AdmissionRetryPolicy {
  if (value === undefined && fixture) return { ...FIXTURE_RETRY_POLICY };
  object(value, "retryPolicy (required explicitly in real mode)"); integer(value.maxAttempts, "retryPolicy.maxAttempts"); integer(value.retryDelayMs, "retryPolicy.retryDelayMs", 0);
  if (value.fixtureSynthetic !== undefined) requireThat(fixture && value.fixtureSynthetic === true, "fixtureSynthetic retry policy is fixture-only");
  return { ...value, maxAttempts: value.maxAttempts, retryDelayMs: value.retryDelayMs, ...(value.fixtureSynthetic === true ? { fixtureSynthetic: true } : {}) };
}
export function validateConfig(value: unknown): MissionConfig {
  object(value, "config"); requireThat(value.schemaVersion === 1, "unsupported config schema"); text(value.missionId, "mission id");
  requireThat(/^[a-z0-9][a-z0-9._-]*$/i.test(value.missionId), "mission id must be path safe");
  object(value.binary, "binary"); validateSHA(value.binary.sha256); text(value.binary.version, "binary version");
  requireThat(typeof value.fixture === "boolean", "fixture flag must be explicit"); object(value.evaluation, "evaluation"); text(value.evaluation.method, "evaluation method"); text(value.evaluation.version, "evaluation version"); score(value.evaluation.maxDifficulty, "maxDifficulty");
  requireThat((value.subsetSize !== undefined) !== (value.budget !== undefined), "explicit subsetSize OR budget is required, not both");
  if (value.subsetSize !== undefined) integer(value.subsetSize, "subsetSize");
  if (value.budget !== undefined) requireThat(typeof value.budget === "number" && Number.isFinite(value.budget) && value.budget > 0, "budget must be positive");
  integer(value.maxCycles, "maxCycles"); integer(value.stagnationLimit, "stagnationLimit"); object(value.models, "models");
  const models = { explore: model(value.models.explore), evaluate: model(value.models.evaluate), A: model(value.models.A), B: model(value.models.B), R: model(value.models.R) };
  const knowledge = validateKnowledge(value.knowledge); array(value.commonInputs, "common inputs"); const commonInputs = value.commonInputs.map(validateFile);
  strings(value.accessibleRules, "accessible rules"); value.accessibleRules.forEach(exactPath); strings(value.requiredTools, "required tools"); exactPath(value.outputDirectory);
  const allFiles = [...commonInputs, ...knowledge.files];
  requireThat(value.accessibleRules.every(p => allFiles.some(f => f.path === p && f.kind === "rule")), "accessible rules must have exact hashed rule manifests");
  if (!value.fixture) requireThat(allFiles.some(f => f.kind === "native"), "real mission requires native common inputs");
  const binary = { ...value.binary, sha256: value.binary.sha256.toLowerCase(), version: value.binary.version };
  const evaluation = { ...value.evaluation, method: value.evaluation.method, version: value.evaluation.version, maxDifficulty: value.evaluation.maxDifficulty };
  const retries = retryPolicy(value.retryPolicy, value.fixture); let fixtureSeeds: FixtureSeeds | undefined;
  if (value.fixtureSeeds !== undefined) {
    requireThat(value.fixture === true, "fixture seeds forbidden in real mode"); object(value.fixtureSeeds, "fixture seeds"); requireThat(value.fixtureSeeds.approved === true, "fixture seeds require explicit approval");
    array(value.fixtureSeeds.candidates, "seed candidates"); array(value.fixtureSeeds.assessments, "seed assessments");
    fixtureSeeds = { approved: true, candidates: value.fixtureSeeds.candidates.map(c => validateCandidate(c, binary, true)), assessments: value.fixtureSeeds.assessments.map(a => validateAssessment(a, binary, evaluation.method, evaluation.version)) };
    const keys = fixtureSeeds.candidates.map(c => identityKey(c.identity)); requireThat(new Set(keys).size === keys.length, "duplicate fixture candidate");
    const scoreKeys = fixtureSeeds.assessments.map(a => identityKey(a.identity)); requireThat(new Set(scoreKeys).size === scoreKeys.length && scoreKeys.every(k => keys.includes(k)), "duplicate/orphan seed assessment");
  }
  return structuredClone({ ...value, schemaVersion: 1, missionId: value.missionId, binary, fixture: value.fixture,
    evaluation,
    subsetSize: value.subsetSize, budget: value.budget, maxCycles: value.maxCycles, stagnationLimit: value.stagnationLimit,
    models, knowledge, commonInputs, accessibleRules: value.accessibleRules, requiredTools: value.requiredTools, outputDirectory: value.outputDirectory, fixtureSeeds, retryPolicy: retries,
    ...(value.rePolicy === undefined ? {} : { rePolicy: validateREPolicy(value.rePolicy) }) });
}
export function validateResult(intent: Intent, inspection: Inspection): WorkerResult {
  requireThat(inspection.status === "completed" && inspection.executionId === intent.executionId, "execution identity mismatch");
  const effectiveModel = model(inspection.effectiveModel); requireThat(canonical(effectiveModel) === canonical(intent.requestedModel), "effective native model mismatch");
  requireThat(inspection.fresh === true && !inspection.parentSessionId, "fresh independent native session required"); text(inspection.authorId, "native author"); text(inspection.sessionId, "native session");
  const artifact = inspection.artifact; requireThat(artifact, "completed task missing result artifact");
  requireThat(artifact.path === intent.outputPath, "result must use exact owned output path"); validateSHA(artifact.sha256); requireThat(hash(artifact.content) === artifact.sha256, "altered output artifact");
  const doc: unknown = JSON.parse(artifact.content); object(doc, "result"); requireThat(doc.schemaVersion === 1, "unsupported result schema");
  for (const key of ["missionId", "taskId", "attemptId", "executionId", "cycle", "inputFingerprint"] as const) requireThat(doc[key] === intent[key], `result ${key} mismatch`);
  requireThat(doc.authorId === inspection.authorId, "result/native author mismatch");
  requireThat(fingerprint(intent.inputs) === intent.inputFingerprint, "altered persisted input bundle");
  const expectedVersions = intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 }));
  requireThat(canonical(doc.inputVersions) === canonical(expectedVersions), "input versions mismatch"); requireThat(canonical(doc.previousResultIds) === canonical(intent.previousResultIds), "previous-result links mismatch");
  const identity = intent.identity ? validateIdentity(doc.identity, intent.binary) : undefined;
  if (identity) requireThat(identityKey(identity) === identityKey(intent.identity!), "result function identity mismatch");
  const header: ResultHeader = { schemaVersion: 1, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId: inspection.authorId,
    inputFingerprint: intent.inputFingerprint, inputVersions: expectedVersions, previousResultIds: [...intent.previousResultIds], ...(identity ? { identity } : {}) };
  const kind = intent.role === "A" || intent.role === "B" ? "proposal" : intent.role === "R" ? "reconciliation" : intent.role;
  requireThat(doc.kind === kind, "result kind mismatch");
  if (kind === "explore") { array(doc.candidates, "candidate manifests"); return { ...doc, ...header, kind, candidates: doc.candidates.map(c => validateCandidate(c, intent.binary, intent.fixture)) }; }
  if (kind === "evaluate") {
    array(doc.assessments, "assessments"); requireThat(doc.assessments.length === 1, "one assessment per evaluation intent");
    const assessments = doc.assessments.map(a => validateAssessment(a, intent.binary)); requireThat(identityKey(assessments[0].identity) === identityKey(intent.identity!), "assessment target mismatch");
    return { ...doc, ...header, kind, assessments };
  }
  if (kind === "proposal" || kind === "reconciliation") {
    propositions(doc.propositions);
    if (kind === "proposal") { requireThat((doc.role === "A" || doc.role === "B") && doc.role === intent.role, "proposal role mismatch"); return { ...doc, ...header, kind, role: doc.role, propositions: doc.propositions }; }
    else {
      requireThat(doc.decision === "certain" || doc.decision === "likely" || doc.decision === "unlikely" || doc.decision === "blocked", "decision category invalid (not a probability)"); strings(doc.contradictions, "contradictions"); strings(doc.questions, "questions");
      let gate: PublicationGateFacts | undefined;
      const conclusion = doc.conclusion === undefined && intent.fixture ? undefined : validateConclusion(doc.conclusion, !intent.fixture);
      if (doc.decision === "certain") {
        gate = publicationGate(doc.publicationGate);
        requireThat(doc.contradictions.length === 0 && doc.propositions.every(p => p.contradictions.length === 0), "certain has unresolved contradictions");
      }
      return { ...doc, ...header, kind, decision: doc.decision, propositions: doc.propositions, contradictions: doc.contradictions, questions: doc.questions, ...(gate ? { publicationGate: gate } : {}), ...(conclusion ? { conclusion } : {}) };
    }
  }
  throw new Error("validation: unsupported result kind");
}
function propositions(value: unknown): asserts value is Proposition[] {
  array(value, "propositions"); requireThat(value.length > 0, "propositions required");
  for (const p of value) { object(p, "proposition"); text(p.id, "proposition id"); text(p.text, "proposition text"); evidence(p.evidence); strings(p.contradictions, "proposition contradictions"); strings(p.questions, "proposition questions"); }
}
function publicationGate(value: unknown): PublicationGateFacts {
  object(value, "certain publication gate");
  for (const key of ["nativeAsmChecked", "independentAuthors", "inputHashesVerified", "opcodeCoverageComplete", "abiChecked", "contradictionsResolved", "readbackPlan"]) requireThat(value[key] === true, `explicit gate fact missing: ${key}`);
  text(value.targetId, "publication target"); integer(value.targetRevision, "publication target revision", 0); evidence(value.evidence);
  return { ...value, nativeAsmChecked: true, independentAuthors: true, inputHashesVerified: true, opcodeCoverageComplete: true, abiChecked: true, contradictionsResolved: true, readbackPlan: true, targetId: value.targetId, targetRevision: value.targetRevision, evidence: value.evidence };
}
function validateConclusion(value: unknown, real: boolean): ReconciliationConclusion {
  object(value, "explicit R conclusion"); text(value.text, "R conclusion text"); evidence(value.evidence);
  if (real) requireThat(value.evidence.length >= 3 && value.evidence.length <= 8, "real R conclusion requires 3-8 evidence references");
  return { text: value.text, evidence: value.evidence.map(({ id, source, sha256, detail }) => ({ id, source, sha256, detail })) };
}
function validatedFactMetadata(value: unknown): ValidatedFactMetadata {
  object(value, "validated fact"); requireThat(value.schemaVersion === 1, "unsupported validated fact schema"); text(value.resultId, "validated result id"); const identity = validateIdentity(value.identity);
  validateSHA(value.resultHash); array(value.inputVersions, "validated input versions");
  const inputVersions = value.inputVersions.map(v => { object(v, "validated input version"); exactPath(v.path); text(v.version, "validated input version"); validateSHA(v.sha256); return { path: v.path, version: v.version, sha256: v.sha256 }; });
  const receipt = value.publicationReceipt; object(receipt, "verified publication receipt"); text(receipt.idempotencyKey, "publication idempotency key"); text(receipt.targetId, "publication target id"); integer(receipt.revision, "publication revision"); requireThat(receipt.resultHash === value.resultHash, "validated publication result hash mismatch");
  return { schemaVersion: 1, resultId: value.resultId, identity, inputVersions, resultHash: value.resultHash, publicationReceipt: { idempotencyKey: receipt.idempotencyKey, targetId: receipt.targetId, revision: receipt.revision, resultHash: value.resultHash }, conclusion: validateConclusion(value.conclusion, false) };
}
