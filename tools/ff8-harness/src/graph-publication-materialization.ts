/** Prospective OFFLINE publication data. References are pins, never authority. */
import type { Evidence, GraphRun, StoredResult } from "./domain";
import type { WorkUnit } from "./planner";
import type { ByteRef } from "./graph-execution-envelope";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import { canonical, fingerprint, hash } from "./validation";

export interface StaticPublicationPolicyV1 {
  version: "rms-static-publication-policy-v1";
  targetRoot: string; targetNamespace: string; ownerActorId: string;
}
export interface RetainedPublicationSourceV1 {
  version: "rms-retained-publication-source-v1"; policy: StaticPublicationPolicyV1;
}
export interface PublicationContextV1 {
  missionId: string; runFingerprint: string; unitId: string; familyToken: number; controllerToken: number;
  bindingFingerprint: string; planFingerprint: string; snapshotId: string;
  inputRevision: number; outputRevision: number; publicationLevel: number; policy: StaticPublicationPolicyV1;
}
export interface PublicationResultPinV1 {
  resultId: string; executionId: string; subIntentId: string; functionId: string; role: "A" | "B" | "R";
  rawContentSha256: string; documentDigest: string; recordDigest: string;
}
export interface PublicationArtifactSelectionV1 {
  artifactId: string; functionId: string;
  artifactKind: "structural_fact" | "reconciled_c" | "semantic_description" | "validated_knowledge";
  sourceResultIds: string[]; materialization: "stored-result" | "parent-derived"; content: string;
}
export interface PublicationArtifactV1 extends PublicationArtifactSelectionV1 { bytesRef: ByteRef }
export interface PublicationMaterializationV1 extends Omit<PublicationContextV1, "policy"> {
  version: "rms-publication-materialization-v1"; policySha256: string; targetId: string;
  resultPins: PublicationResultPinV1[]; artifacts: PublicationArtifactV1[];
}
export const MATERIALIZATION_EVIDENCE_SOURCE = "rms-publication-materialization-v1";
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`rms-publication: ${message}`); }
function closed(value: unknown, fields: string[]): Record<string, any> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  const r = value as Record<string, any>;
  check(Object.keys(r).length === fields.length && fields.every(k => Object.hasOwn(r, k)), "exact fields required"); return r;
}
function text(value: unknown): asserts value is string { check(typeof value === "string" && value.trim().length > 0, "nonempty text required"); }
function digest(value: unknown): void { check(typeof value === "string" && /^[a-f0-9]{64}$/.test(value), "SHA256 required"); }
function count(value: unknown, min = 0): void { check(Number.isSafeInteger(value) && !Object.is(value, -0) && Number(value) >= min, "safe integer required"); }
export function parseStaticPublicationPolicyV1(value: unknown): StaticPublicationPolicyV1 {
  assertExecutionJsonV1(value); const p = closed(value, ["version", "targetRoot", "targetNamespace", "ownerActorId"]);
  check(p.version === "rms-static-publication-policy-v1", "policy version"); [p.targetRoot, p.targetNamespace, p.ownerActorId].forEach(text);
  check(/^[a-zA-Z0-9_-]{1,80}$/.test(p.targetNamespace), "target namespace");
  return structuredClone(p) as StaticPublicationPolicyV1;
}
export function parseRetainedPublicationSourceV1(value: unknown): RetainedPublicationSourceV1 {
  assertExecutionJsonV1(value); const s = closed(value, ["version", "policy"]);
  check(s.version === "rms-retained-publication-source-v1", "source version"); parseStaticPublicationPolicyV1(s.policy);
  return structuredClone(s) as RetainedPublicationSourceV1;
}
export function publicationContextV1(run: GraphRun, unit: WorkUnit, familyToken: number, controllerToken: number, policy: StaticPublicationPolicyV1): PublicationContextV1 {
  return { missionId: run.missionId, runFingerprint: run.fingerprint, unitId: unit.unitId, familyToken, controllerToken,
    bindingFingerprint: run.prepared.planning.binding.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint, snapshotId: unit.snapshotId,
    inputRevision: unit.knowledgeRevision, outputRevision: unit.knowledgeRevision + 1, publicationLevel: unit.requiredPublicationLevel, policy: parseStaticPublicationPolicyV1(policy) };
}
export function publicationTargetIdV1(context: Pick<PublicationContextV1, "missionId" | "runFingerprint" | "unitId" | "familyToken">, policy: StaticPublicationPolicyV1): string {
  return `${policy.targetNamespace}:${fingerprint({ missionId: context.missionId, runFingerprint: context.runFingerprint, unitId: context.unitId, familyToken: context.familyToken })}`;
}
export function makePublicationMaterializationV1(context: PublicationContextV1, unit: WorkUnit, results: StoredResult[], selections: PublicationArtifactSelectionV1[]): PublicationMaterializationV1 {
  assertExecutionJsonV1(context); assertExecutionJsonV1(results); assertExecutionJsonV1(selections);
  const { policy, ...scope } = context;
  const resultPins = results.map(result => {
    const sub = unit.subIntents.find(s => canonical(s.harnessIdentity) === canonical(result.document.identity) && s.role === (result.document.kind === "reconciliation" ? "R" : result.document.kind === "proposal" ? result.document.role : null));
    check(sub && (sub.role === "A" || sub.role === "B" || sub.role === "R"), "result has no exact functional role");
    return { resultId: result.resultId, executionId: result.executionId, subIntentId: sub.subIntentId, functionId: sub.functionId, role: sub.role,
      rawContentSha256: result.sha256, documentDigest: fingerprint(result.document), recordDigest: fingerprint(result) };
  }).sort((a, b) => a.resultId.localeCompare(b.resultId));
  const artifacts = selections.map(a => ({ ...structuredClone(a), bytesRef: { kind: "rms-publication-artifact-v1", encoding: "raw-v1" as const, byteLength: Buffer.byteLength(a.content, "utf8"), sha256: hash(a.content) } }));
  return parsePublicationMaterializationV1({ version: "rms-publication-materialization-v1", ...scope, policySha256: fingerprint(policy), targetId: publicationTargetIdV1(context, policy), resultPins, artifacts });
}
export function parsePublicationMaterializationV1(value: unknown): PublicationMaterializationV1 {
  assertExecutionJsonV1(value);
  const m = closed(value, ["version", "missionId", "runFingerprint", "unitId", "familyToken", "controllerToken", "bindingFingerprint", "planFingerprint", "snapshotId", "inputRevision", "outputRevision", "publicationLevel", "policySha256", "targetId", "resultPins", "artifacts"]);
  check(m.version === "rms-publication-materialization-v1", "manifest version");
  [m.missionId, m.unitId, m.snapshotId, m.targetId].forEach(text);
  [m.runFingerprint, m.bindingFingerprint, m.planFingerprint, m.policySha256].forEach(digest);
  [m.familyToken, m.controllerToken].forEach(v => count(v, 1)); count(m.inputRevision); count(m.outputRevision);
  check(m.outputRevision === m.inputRevision + 1 && [1, 2].includes(m.publicationLevel), "revision/level mismatch");
  check(Array.isArray(m.resultPins) && m.resultPins.length > 0 && Array.isArray(m.artifacts) && m.artifacts.length > 0, "nonempty exact results/artifacts required");
  for (const value of m.resultPins) {
    const p = closed(value, ["resultId", "executionId", "subIntentId", "functionId", "role", "rawContentSha256", "documentDigest", "recordDigest"]);
    [p.resultId, p.executionId, p.subIntentId, p.functionId].forEach(text); check(["A", "B", "R"].includes(p.role), "result role");
    [p.rawContentSha256, p.documentDigest, p.recordDigest].forEach(digest);
  }
  check(new Set(m.resultPins.map((p: PublicationResultPinV1) => p.resultId)).size === m.resultPins.length && new Set(m.resultPins.map((p: PublicationResultPinV1) => p.subIntentId)).size === m.resultPins.length, "duplicate result/sub-intent");
  for (const value of m.artifacts) {
    const a = closed(value, ["artifactId", "functionId", "artifactKind", "sourceResultIds", "materialization", "content", "bytesRef"]);
    [a.artifactId, a.functionId, a.content].forEach(text);
    check(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(a.artifactKind) && ["stored-result", "parent-derived"].includes(a.materialization), "artifact semantics");
    check(Array.isArray(a.sourceResultIds) && a.sourceResultIds.length > 0 && new Set(a.sourceResultIds).size === a.sourceResultIds.length, "exact artifact sources"); a.sourceResultIds.forEach(text);
    check(a.sourceResultIds.every((id: string) => m.resultPins.some((p: PublicationResultPinV1) => p.resultId === id && p.functionId === a.functionId && p.role === "R")), "artifact must derive from retained same-function R");
    const ref = closed(a.bytesRef, ["kind", "encoding", "byteLength", "sha256"]); count(ref.byteLength); digest(ref.sha256);
    check(ref.kind === "rms-publication-artifact-v1" && ref.encoding === "raw-v1" && ref.byteLength === Buffer.byteLength(a.content, "utf8") && ref.sha256 === hash(a.content), "artifact UTF8 bytes/ref mismatch");
    check(a.materialization !== "stored-result" || (a.sourceResultIds.length === 1 && a.artifactId === a.sourceResultIds[0]), "stored result cannot be relabeled");
  }
  check(new Set(m.artifacts.map((a: PublicationArtifactV1) => a.artifactId)).size === m.artifacts.length, "duplicate artifact");
  return structuredClone(m) as PublicationMaterializationV1;
}
export function publicationManifestEvidenceV1(raw: PublicationMaterializationV1): Evidence {
  const m = parsePublicationMaterializationV1(raw), sha256 = hash(canonical(m));
  return { id: `publication-materialization:${sha256}`, source: MATERIALIZATION_EVIDENCE_SOURCE, sha256,
    detail: canonical({ version: "rms-publication-manifest-evidence-v1", policySha256: m.policySha256, runFingerprint: m.runFingerprint, unitId: m.unitId,
      familyToken: m.familyToken, controllerToken: m.controllerToken, targetId: m.targetId, inputRevision: m.inputRevision, outputRevision: m.outputRevision }) };
}
export function assertPublicationManifestEvidenceV1(manifest: PublicationMaterializationV1, evidence: unknown[]): void {
  const expected = publicationManifestEvidenceV1(manifest);
  const matches = evidence.filter(v => v !== null && typeof v === "object" && ((v as Evidence).source === MATERIALIZATION_EVIDENCE_SOURCE || String((v as Evidence).id).startsWith("publication-materialization:")));
  check(matches.length === 1 && canonical(matches[0]) === canonical(expected), "exact unique attested manifest evidence required");
}
