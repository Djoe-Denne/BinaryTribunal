import type { Bridge, ControllerContext, Inspection, Intent, MissionConfig, Role } from "./domain";
import type { ExecutionClient } from "./client";
import { resolve } from "node:path";
import { ProjectionAccess, projectDossierInputsV1, persistDossierV1, collectFileArtifactV1, persistStructuredArtifactV1 } from "./adapters/projection-files";
export { ProjectionAccess } from "./adapters/projection-files";
import { compileDossierV1, compileCollectedResultV1 } from "./ports/dossier";
import { canonical, hash, identityKey } from "./validation";
import { buildStructuredResultSchema, decodeStructuredPayload } from "./structured-result";
import { assertNativeREAccess, effectiveREPolicy, validateREMode, type REPolicy } from "./re-policy";
import { auditCommunication } from "./bulletin-audit";
export type OutputMode = "file" | "json-schema-strict";
export interface AdapterOptions { client: ExecutionClient; directory: string; profiles: Record<Role, string>; approvedSources: string[]; projectionRoot: string; outputDirectory: string; roleInstructions: Record<Role, string>; allowedTools: string[]; admissionMode: "native-query" | "native-boundary-witness"; outputMode?: OutputMode; rePolicy?: REPolicy }
const dossierCodec = { canonical, sha256: hash };
/** An explicit supported protocol, never an inference from catalogue JSON-mode flags. */
export function strictOutputFor(intent: Intent) {
  if (intent.requestedModel.providerID !== "openai") throw new Error("strict-output route is not implemented for the selected provider; no model substitution");
  const schema = buildStructuredResultSchema(intent.role);
  return { mode: "json_schema" as const, strict: true as const, name: `ff8_${intent.role.toLowerCase()}_payload_v1`, schema, schemaSha256: hash(canonical(schema)), route: "openai-responses-v1" as const };
}
function assertNativeReadLineLimit(content: string, path: string): void {
  const lines = content.split("\n");
  const index = lines.findIndex(line => line.length > 2000);
  if (index !== -1) throw new Error(`native_read_line_limit: ${path}:${index + 1} has ${lines[index]!.length} characters; limit 2000`);
}
/** Scientific roles submit ready work only; Ensemble owns sessions and capacity. */
export class EnsembleBridge implements Bridge {
  readonly access: ProjectionAccess<AdapterOptions>;
  constructor(readonly options: AdapterOptions) {
    validateREMode(options.rePolicy, options);
    if (options.outputMode !== undefined && !["file", "json-schema-strict"].includes(options.outputMode)) throw new Error("unknown output mode; no silent fallback");
    if (options.outputMode === "json-schema-strict" && options.allowedTools.includes("edit")) throw new Error("strict output is controller-owned; worker edit permission must be removed");
    this.access = new ProjectionAccess(options);
  }
  async ensureTeam(config: MissionConfig, _controller: ControllerContext): Promise<void> {
    if (canonical(config.rePolicy) !== canonical(this.options.rePolicy)) throw new Error("RE policy differs from persisted mission");
    if (resolve(config.outputDirectory) !== resolve(this.options.outputDirectory)) throw new Error("output boundary differs from admitted configuration");
    this.access.approveKnowledge(config.knowledge);
    const c = await this.options.client.capabilities();
    if (this.options.rePolicy && (c.nativeToolBindings !== true || (this.options.rePolicy.reconcilerSharing && c.scopedBulletin !== true))) throw new Error("RE policy: nativeToolBindings/scopedBulletin capabilities required before admission");
    if (this.options.admissionMode === "native-query" && c.permissionPreflight !== true) throw new Error("native worker permission-query capability required; no silent alternate mode");
    if (this.options.admissionMode === "native-boundary-witness" && (c.resourceBoundary !== true || c.nativeAccessWitness !== true)) throw new Error("native boundary/tool-witness capabilities required; no simulated permissions");
    if (this.options.outputMode === "json-schema-strict") {
      if (c.outputSchemaStrict !== true) throw new Error("strict native output capability required; no file/prompt-only fallback");
      if (Object.values(config.models).some(model => model.providerID !== "openai")) throw new Error("selected strict-output route unavailable; no provider fallback");
    }
    await this.options.client.ensure(config.missionId);
  }
  async submit(intent: Intent, _controller: ControllerContext): Promise<void> {
    validateREMode(this.options.rePolicy, this.options);
    const rePolicy = this.options.rePolicy ? effectiveREPolicy(this.options.rePolicy, intent, this.options.profiles[intent.role], this.options.roleInstructions[intent.role]) : undefined;
    const output = this.options.outputMode === "json-schema-strict" ? strictOutputFor(intent) : undefined;
    const projectionPolicy = { strict: !!output, assertReadable: assertNativeReadLineLimit };
    const { paths, dossierPath, certificate } = await projectDossierInputsV1(intent, this.access, projectionPolicy);
    const { dossier, text: dossierText } = compileDossierV1({ intent, instructions: this.options.roleInstructions[intent.role], approvedPaths: paths, outputContract: output, controllerInputIntegrity: certificate, rePolicy }, dossierCodec);
    const dossierBytes = persistDossierV1(dossierPath, this.options.outputDirectory, dossierText, projectionPolicy);
    const conclusion = output ? "Return ONE final assistant JSON payload conforming to outputContract.schema. Do not write a file, call team_message, include envelope fields, markdown fences or text outside JSON. The controller validates and serializes your result." : "Write ONE flat WorkerResult JSON: resultEnvelope fields belong at the root, not nested under resultHeader or resultEnvelope. Keep those fields EXACTLY and add your scientific payload at the same root. Then report completion to the lead via team_message if permitted.";
    const nativeScope = rePolicy?.access === "ida-readonly" ? " and the exact native IDA bindings declared by rePolicy.idaReadBindings" : "";
    const bulletinScope = rePolicy?.communication ? " with optional pull-only provisional leads through rePolicy.communication" : "";
    const prompt = `Role ${intent.role}, mission ${intent.missionId}, cycle ${intent.cycle}. Read the approved projection ${dossierPath} AND EVERY approvedPaths.projected file${output ? " in full" : ""} using the native read tool before analysis. Native successful input reads are witnessed; quoting inline facts is not a substitute for input verification. The following dossier and scientific instructions are authoritative for this execution.${output ? " The instructions field is an array of lines; read them in order. Dossier v3 inputs are a transport projection, not a directly serializable domain InputBundle. In inputs.proposals, contentEncoding 'utf8-lines-lf' means contentLines.join(\"\\n\") reconstructs the original content exactly, including CRLF, accents and blank lines; metadata and document are unchanged. controllerInputIntegrity reports controller-measured source/projection byte hashes only, not worker computations, provider signatures or native/semantic validation." : ""} Use ONLY the approved role projection${output ? "" : " and exact output path"}${nativeScope}${bulletinScope}. Never list/read neighboring outputs or reuse context. Persisted effectiveModel (or explicit override) is authority; historical prose model mentions are not overrides. No shell, subagents, git, IDA mutation or other index tools. If input missing/denied/tool unavailable, report that exact cause, do not bypass it.\n${dossierText}\n${conclusion}${intent.fixture ? " This is an isolated synthetic fixture, not a real FF8 finding." : " Real publication requires an independent native gate; never publish yourself."}`;
    const requiredAccess = [
      ...[dossierPath, ...paths.map(p => p.projected)].map(resource => ({ action: "read", resource })),
      ...(output ? [] : [{ action: "edit", resource: intent.outputPath }]),
    ];
    const nativeAccess = rePolicy?.idaReadBindings.flatMap(binding => binding.accesses) ?? [];
    const expectedNativeAccess = intent.role === "R" ? rePolicy?.idaReadBindings.filter(binding => binding.operation === "disasm").flatMap(binding => binding.accesses) ?? [] : [];
    const permissionPlan = this.options.admissionMode === "native-query" ? { requiredAccess, ...(output ? { expectedAccess: requiredAccess } : {}) } : { expectedAccess: [...requiredAccess, ...expectedNativeAccess], resourceBoundary: [...requiredAccess, ...nativeAccess, ...this.options.allowedTools.filter(action => !["read", "edit"].includes(action)).map(action => ({ action, resource: "*" }))] };
    await this.options.client.submit(intent.missionId, { taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, idempotencyKey: intent.idempotencyKey, profile: this.options.profiles[intent.role], model: intent.requestedModel, prompt, dossier, metadata: { inputFingerprint: intent.inputFingerprint, roleInstructionsHash: hash(this.options.roleInstructions[intent.role]), dossierHash: hash(dossierBytes ?? dossierText), admissionMode: this.options.admissionMode, ...(rePolicy ? { rePolicyHash: hash(canonical(rePolicy)) } : {}) }, context: { mode: "fresh" }, worktree: false, ...(output ? { output } : {}),
      ...(rePolicy ? { nativeTools: rePolicy.idaReadBindings.map(binding => binding.tool), ...(rePolicy.communication ? { communication: rePolicy.communication } : {}) } : {}), ...permissionPlan });
  }
  async inspect(intent: Intent): Promise<Inspection> {
    await this.options.client.replay(intent.missionId);
    const r = await this.options.client.inspect(intent.missionId, intent.executionId); const execution = r.execution as Record<string, unknown> | undefined;
    if (!execution || execution.executionId !== intent.executionId) throw new Error("native execution identity unavailable");
    const native = execution.native as { model: import("./domain").ModelRef; directory: string; profile: string } | undefined;
    const state = execution.state;
    const status = ["failed", "stopped", "stop_requested"].includes(String(state)) ? "failed" : state === "completed" ? "completed" : state === "observed_running" ? "running" : "pending";
    const inspection: Inspection = { status, executionId: intent.executionId, authorId: intent.executionId, sessionId: String(execution.nativeSessionId), effectiveModel: native?.model, fresh: !!native && native.directory === this.options.directory && native.profile === this.options.profiles[intent.role], error: execution.failure ? canonical(execution.failure) : undefined };
    if (this.options.rePolicy && execution.communicationTrace !== undefined) inspection.communicationTrace = structuredClone(execution.communicationTrace);
    if (this.options.rePolicy && status === "completed") {
      try {
        const policy = effectiveREPolicy(this.options.rePolicy, intent, this.options.profiles[intent.role], this.options.roleInstructions[intent.role]);
        if (canonical((execution.dossier as Record<string, unknown> | undefined)?.rePolicy) !== canonical(policy)
          || (execution.metadata as Record<string, unknown> | undefined)?.rePolicyHash !== hash(canonical(policy))) throw new Error("native RE policy readback mismatch");
        assertNativeREAccess(policy, execution, inspection.sessionId!);
        if (policy.communication) {
          inspection.communicationAudit = await auditCommunication(this.options.client, intent, policy, execution, this.options.directory);
          this.options.client.retainCommunicationAudit(inspection.communicationAudit);
        } else if (execution.communication !== undefined || execution.communicationTrace !== undefined) throw new Error("RE communication audit: unselected peer authority");
      } catch (error) { return { ...inspection, status: "failed", error: error instanceof Error ? error.message : String(error) }; }
    }
    if (this.options.outputMode === "json-schema-strict") return this.inspectStructured(intent, execution, inspection);
    if (status !== "completed" && status !== "failed") return inspection;
    if (status === "completed" && this.options.admissionMode === "native-boundary-witness" && execution.accessVerified !== true) { inspection.status = "failed"; inspection.error = "Native task ended without all expected successful input/output access witnesses; artifacts retained, no scientific acceptance"; }
    return collectFileArtifactV1(intent, inspection, this.options.outputDirectory);
  }
  private inspectStructured(intent: Intent, execution: Record<string, unknown>, inspection: Inspection): Inspection {
    if (inspection.status !== "completed") return inspection;
    const reject = (error: string): Inspection => ({ ...inspection, status: "failed", error: `strict output rejected: ${error}` });
    const contract = strictOutputFor(intent);
    const result = execution.structuredResult as { value: unknown; sha256: string; schemaSha256: string; native?: { sessionId: string; messageID: string; model: unknown; profile: string } } | undefined;
    const witnesses = execution.outputWitnesses as Array<{ executionId: string; sessionId: string; transport: string; schemaSha256: string; requestBodySha256: string; endpoint: string; model: unknown }> | undefined;
    if (execution.accessVerified !== true || !inspection.fresh || canonical(inspection.effectiveModel) !== canonical(intent.requestedModel)) return reject("native identity/access not verified");
    if (!result || canonical(execution.output) !== canonical(contract) || result.schemaSha256 !== contract.schemaSha256 || result.sha256 !== hash(canonical(result.value))) return reject("missing result or mismatched contract/payload hash");
    if (!result.native || result.native.sessionId !== inspection.sessionId || typeof result.native.messageID !== "string" || !result.native.messageID || result.native.profile !== this.options.profiles[intent.role] || canonical(result.native.model) !== canonical(intent.requestedModel)) return reject("native message provenance mismatch");
    const endpoints = { http: ["https://api.openai.com/v1/responses", "https://chatgpt.com/backend-api/codex/responses"], websocket: ["wss://api.openai.com/v1/responses", "wss://chatgpt.com/backend-api/codex/responses"] };
    if (!Array.isArray(witnesses) || witnesses.length === 0 || !witnesses.every(w => !!w && typeof w.executionId === "string" && w.executionId === intent.executionId && typeof w.sessionId === "string" && w.sessionId === inspection.sessionId && ["http", "websocket"].includes(w.transport) && endpoints[w.transport as keyof typeof endpoints].includes(w.endpoint) && w.schemaSha256 === contract.schemaSha256 && /^[a-f0-9]{64}$/.test(w.requestBodySha256) && canonical(w.model) === canonical(intent.requestedModel))) return reject("strict request witness missing or inconsistent");
    let payload: Record<string, unknown>;
    try { payload = decodeStructuredPayload(intent.role, result.value); } catch (error) { return reject(error instanceof Error ? error.message : String(error)); }
    const content = compileCollectedResultV1(intent, payload, dossierCodec);
    try { assertNativeReadLineLimit(content, intent.outputPath); } catch (error) { return reject(error instanceof Error ? error.message : String(error)); }
    return persistStructuredArtifactV1(intent, content, inspection, this.options.outputDirectory);
  }
  async pauseAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "pause"); }
  async resumeAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "resume"); }
  async stop(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.stopMission(id); }
}
