import type { Intent } from "../domain";

/** Pure serialization dependencies; neither callback grants execution authority. */
export interface DossierCodecV1 {
  canonical(value: unknown): string;
  sha256(value: string | Uint8Array): string;
}
export interface ApprovedProjectionV1 { original: string; projected: string }
export interface InputIntegrityFileV1 { source: string; projected: string; expectedSha256: string; sourceSha256: string; projectedSha256: string; verified: true }
export interface InputIntegrityCertificateV1 { version: 1; verifier: string; scope: string; files: InputIntegrityFileV1[] }
export function resultEnvelopeForV1(intent: Intent) {
  return { ...resultHeaderForV1(intent), kind: intent.role === "A" || intent.role === "B" ? "proposal" : intent.role === "R" ? "reconciliation" : intent.role, ...(intent.role === "A" || intent.role === "B" ? { role: intent.role } : {}) };
}
function resultHeaderForV1(intent: Intent) {
  return { schemaVersion: 1, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId: intent.executionId, identity: intent.identity, inputFingerprint: intent.inputFingerprint, inputVersions: intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: intent.previousResultIds };
}
function readableJson(value: unknown, codec: DossierCodecV1): string { return JSON.stringify(JSON.parse(codec.canonical(value)), null, 2) + "\n"; }
function strictInputs(intent: Intent, integrityFiles: InputIntegrityFileV1[], codec: DossierCodecV1) {
  if (intent.inputs.proposals === undefined) return intent.inputs;
  const proposals = intent.inputs.proposals.map(proposal => {
    const manifest = intent.inputs.files.find(file => file.path === proposal.path);
    const measured = integrityFiles.find(file => file.source === proposal.path);
    if (!manifest || !measured) throw new Error(`frozen proposal manifest hash binding missing: ${proposal.path}`);
    if (typeof proposal.content !== "string" || codec.sha256(proposal.content) !== proposal.sha256) throw new Error(`frozen proposal content hash mismatch: ${proposal.path}`);
    if ([manifest.sha256, measured.expectedSha256, measured.sourceSha256, measured.projectedSha256].some(sha256 => sha256 !== proposal.sha256)) throw new Error(`frozen proposal source/projection hash binding mismatch: ${proposal.path}`);
    let parsed: unknown;
    try { parsed = JSON.parse(proposal.content); } catch { throw new Error(`frozen proposal invalid JSON: ${proposal.path}`); }
    if (codec.canonical(parsed) !== codec.canonical(proposal.document)) throw new Error(`frozen proposal document mismatch: ${proposal.path}`);
    const { content, ...metadata } = proposal;
    return { ...metadata, contentLines: content.split("\n"), contentEncoding: "utf8-lines-lf" as const };
  });
  return { ...intent.inputs, proposals };
}
export interface DossierCompilationInputV1 {
  intent: Intent;
  instructions: string;
  approvedPaths: ApprovedProjectionV1[];
  outputContract?: Record<string, unknown>;
  controllerInputIntegrity?: InputIntegrityCertificateV1;
  /** Opaque historical policy data; validation and authority stay with the adapter. */
  rePolicy?: unknown;
}
/** Historical v1/v3 bytes only. No admission, native evidence or read-limit policy. */
export function compileDossierV1(input: DossierCompilationInputV1, codec: DossierCodecV1) {
  const { intent, instructions, approvedPaths, outputContract: output, rePolicy } = input;
  const resultEnvelope = resultEnvelopeForV1(intent);
  const dossierInputs = output ? strictInputs(intent, input.controllerInputIntegrity?.files ?? [], codec) : intent.inputs;
  const dossier = { version: output ? 3 : 1, role: intent.role, cycle: intent.cycle, fixture: intent.fixture, binary: intent.binary, function: intent.identity, effectiveModel: intent.requestedModel, inputs: dossierInputs, approvedPaths, outputPath: intent.outputPath, resultHeader: resultHeaderForV1(intent), resultEnvelope, instructions: output ? instructions.split("\n") : instructions,
    ...(rePolicy ? { rePolicy } : {}),
    ...(output ? { outputContract: output, controllerInputIntegrity: input.controllerInputIntegrity } : {}),
    criteria: output ? "Return only the scientific payload as the final assistant JSON, conforming to outputContract.schema. Do not include the header, kind, role, wrappers, markdown or prose. Do not write a file or report via team_message; the controller adds the immutable envelope and persists the validated result. Null is allowed only for explicitly nullable optional fields. Execution completion is not scientific acceptance."
      : "One complete WorkerResult JSON at exact outputPath. Copy resultEnvelope fields directly to the ROOT object and add the scientific payload; never nest resultHeader/resultEnvelope. No markdown fences, absent scientific fields or fabricated native facts. Execution completion is not scientific acceptance." };
  return { dossier, text: output ? readableJson(dossier, codec) : codec.canonical(dossier), resultEnvelope };
}
/** The caller must validate provenance/schema before persisting these bytes. */
export function compileCollectedResultV1(intent: Intent, decodedPayload: Record<string, unknown>, codec: DossierCodecV1): string {
  return readableJson({ ...decodedPayload, ...resultEnvelopeForV1(intent) }, codec);
}
