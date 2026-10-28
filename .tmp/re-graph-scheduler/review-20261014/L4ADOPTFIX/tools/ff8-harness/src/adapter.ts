import type { AccessContext, ArtifactFile, Bridge, ControllerContext, FrozenKnowledge, InputAccess, Inspection, Intent, MissionConfig, Role } from "./domain";
import type { ExecutionClient } from "./client";
import { mkdirSync, readFileSync, writeFileSync, lstatSync, existsSync, realpathSync } from "node:fs";
import { join, resolve, dirname, basename, relative, isAbsolute } from "node:path";
import { canonical, hash, identityKey } from "./validation";
import { buildStructuredResultSchema, decodeStructuredPayload } from "./structured-result";
import { assertNativeREAccess, effectiveREPolicy, validateREMode, type REPolicy } from "./re-policy";
import { auditCommunication } from "./bulletin-audit";
export type OutputMode = "file" | "json-schema-strict";
export interface AdapterOptions { client: ExecutionClient; directory: string; profiles: Record<Role, string>; approvedSources: string[]; projectionRoot: string; outputDirectory: string; roleInstructions: Record<Role, string>; allowedTools: string[]; admissionMode: "native-query" | "native-boundary-witness"; outputMode?: OutputMode; rePolicy?: REPolicy }
function envelopeFor(intent: Intent) {
  return { schemaVersion: 1, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId: intent.executionId, identity: intent.identity, inputFingerprint: intent.inputFingerprint, inputVersions: intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: intent.previousResultIds,
    kind: intent.role === "A" || intent.role === "B" ? "proposal" : intent.role === "R" ? "reconciliation" : intent.role, ...(intent.role === "A" || intent.role === "B" ? { role: intent.role } : {}) };
}
/** An explicit supported protocol, never an inference from catalogue JSON-mode flags. */
export function strictOutputFor(intent: Intent) {
  if (intent.requestedModel.providerID !== "openai") throw new Error("strict-output route is not implemented for the selected provider; no model substitution");
  const schema = buildStructuredResultSchema(intent.role);
  return { mode: "json_schema" as const, strict: true as const, name: `ff8_${intent.role.toLowerCase()}_payload_v1`, schema, schemaSha256: hash(canonical(schema)), route: "openai-responses-v1" as const };
}
function readableJson(value: unknown): string { return JSON.stringify(JSON.parse(canonical(value)), null, 2) + "\n"; }
type InputIntegrityFile = { source: string; projected: string; expectedSha256: string; sourceSha256: string; projectedSha256: string; verified: true };
/** Transport-only projection, never a replacement for the persisted InputBundle/FrozenProposal. */
function strictDossierInputs(intent: Intent, integrityFiles: InputIntegrityFile[]) {
  if (intent.inputs.proposals === undefined) return intent.inputs;
  const proposals = intent.inputs.proposals.map(proposal => {
    const manifest = intent.inputs.files.find(file => file.path === proposal.path);
    const measured = integrityFiles.find(file => file.source === proposal.path);
    if (!manifest || !measured) throw new Error(`frozen proposal manifest hash binding missing: ${proposal.path}`);
    if (typeof proposal.content !== "string" || hash(Buffer.from(proposal.content, "utf8")) !== proposal.sha256) throw new Error(`frozen proposal content hash mismatch: ${proposal.path}`);
    if ([manifest.sha256, measured.expectedSha256, measured.sourceSha256, measured.projectedSha256].some(sha256 => sha256 !== proposal.sha256)) throw new Error(`frozen proposal source/projection hash binding mismatch: ${proposal.path}`);
    let parsed: unknown;
    try { parsed = JSON.parse(proposal.content); } catch { throw new Error(`frozen proposal invalid JSON: ${proposal.path}`); }
    if (canonical(parsed) !== canonical(proposal.document)) throw new Error(`frozen proposal document mismatch: ${proposal.path}`);
    const { content, ...metadata } = proposal;
    return { ...metadata, contentLines: content.split("\n"), contentEncoding: "utf8-lines-lf" as const };
  });
  return { ...intent.inputs, proposals };
}
function assertNativeReadLineLimit(content: string, path: string): void {
  const lines = content.split("\n");
  const index = lines.findIndex(line => line.length > 2000);
  if (index !== -1) throw new Error(`native_read_line_limit: ${path}:${index + 1} has ${lines[index]!.length} characters; limit 2000`);
}
function assertArtifactPathWithoutSymlinks(path: string): void {
  const ancestors: string[] = [];
  for (let current = resolve(path); ; current = dirname(current)) {
    ancestors.push(current); if (dirname(current) === current) break;
  }
  for (const current of ancestors.reverse()) {
    try { if (lstatSync(current).isSymbolicLink()) throw new Error("artifact symlink boundary refused"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}
/** Approved role-specific projections; native admission additionally evaluates the worker's permission policy. */
export class ProjectionAccess implements InputAccess {
  private publicFacts = new Map<string, ArtifactFile>();
  constructor(readonly options: AdapterOptions) {}
  /** Admit only acquired conclusions linked to a verified publication, never private author text. */
  approveKnowledge(knowledge: FrozenKnowledge): void {
    for (const metadata of knowledge.validatedFacts ?? []) {
      const path = resolve(this.options.outputDirectory, "knowledge", `${metadata.resultHash}.json`);
      const file = knowledge.files.find(f => resolve(f.path) === path && f.version === `validated-conclusion:v1:${metadata.resultHash}`);
      if (!file || file.kind !== "knowledge" || file.approvedForBlind !== true || metadata.publicationReceipt.resultHash !== metadata.resultHash) throw new Error("acquired public knowledge lacks a matching publication/file binding");
      const previous = this.publicFacts.get(path); if (previous && canonical(previous) !== canonical(file)) throw new Error("immutable public knowledge authority changed"); this.publicFacts.set(path, file);
    }
  }
  private authorized(path: string, context: AccessContext): boolean {
    const file = resolve(path); return this.options.approvedSources.some(p => resolve(p) === file) || this.publicFacts.has(file) || (context.role === "R" && dirname(file) === resolve(this.options.outputDirectory) && file.endsWith(".json"));
  }
  async read(path: string, context: AccessContext): Promise<import("./domain").ReadAccess> {
    if (!this.authorized(path, context)) return { status: "denied-read" };
    try {
      const content = readFileSync(path); const projected = this.projected(path, context);
      mkdirSync(dirname(projected), { recursive: true });
      if (!existsSync(projected)) writeFileSync(projected, content, { flag: "wx" });
      if (lstatSync(projected).isSymbolicLink()) throw new Error("projection symlink refused");
      // A later alteration is returned to integrity validation, never silently copied over a gel.
      return { status: "ok", content };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return { status: "missing" };
      if (code === "EACCES" || code === "EPERM") return { status: "denied-read" }; throw error;
    }
  }
  async list(path: string, context: AccessContext): Promise<import("./domain").ListAccess> {
    const sources = [...this.options.approvedSources, ...this.publicFacts.keys()].filter(p => dirname(resolve(p)) === resolve(path));
    if (!sources.length && !(context.role === "R" && resolve(path) === resolve(this.options.outputDirectory))) return { status: "denied-list" };
    // Only approved projection entries are listed, not the controller's unbounded directory.
    return { status: "ok", entries: sources.map(p => this.projected(p, context)) };
  }
  async tool(name: string, _context: AccessContext): Promise<boolean> { return this.options.allowedTools.includes(name); }
  projected(path: string, context: AccessContext): string {
    return join(this.options.projectionRoot, context.role, hash(context.executionId), `${hash(resolve(path)).slice(0, 20)}-${basename(path)}`);
  }
}
/** Scientific roles submit ready work only; Ensemble owns sessions and capacity. */
export class EnsembleBridge implements Bridge {
  readonly access: ProjectionAccess;
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
    const context = { missionId: intent.missionId, executionId: intent.executionId, role: intent.role };
    const files = [...intent.inputs.files.map(f => f.path), ...intent.inputs.accessibleRules];
    const paths = [...new Set(files)].map(path => ({ original: path, projected: this.access.projected(path, context) }));
    const directory = join(this.options.projectionRoot, intent.role, hash(intent.executionId)), dossierPath = join(directory, "dossier.json");
    const replayingDossier = output && existsSync(dossierPath);
    const integrityFiles: InputIntegrityFile[] = [];
    for (const f of paths) {
      const expected = intent.inputs.files.find(x => x.path === f.original)?.sha256;
      if (output && !expected) throw new Error(`missing manifest hash: ${f.original}`);
      // A replay must measure its frozen projection, never silently recreate a missing gel.
      if (replayingDossier && !existsSync(f.projected)) throw new Error(`missing immutable projection: ${f.projected}`);
      const access = await this.access.read(f.original, context);
      if (access.status !== "ok") throw new Error(`${access.status}: ${f.original}`);
      const sourceSha256 = hash(access.content);
      if (expected && sourceSha256 !== expected) throw new Error(`altered: ${f.original}`);
      const projectedBytes = readFileSync(f.projected), projectedSha256 = hash(projectedBytes);
      if (projectedSha256 !== sourceSha256) throw new Error(`immutable projection conflict: ${f.projected}`);
      if (output && expected) {
        assertNativeReadLineLimit(projectedBytes.toString("utf8"), f.projected);
        integrityFiles.push({ source: f.original, projected: f.projected, expectedSha256: expected, sourceSha256, projectedSha256, verified: true });
      }
    }
    const header = { schemaVersion: 1, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId: intent.executionId, identity: intent.identity, inputFingerprint: intent.inputFingerprint, inputVersions: intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: intent.previousResultIds };
    const resultEnvelope = envelopeFor(intent);
    const dossierInputs = output ? strictDossierInputs(intent, integrityFiles) : intent.inputs;
    mkdirSync(directory, { recursive: true }); mkdirSync(this.options.outputDirectory, { recursive: true });
    const dossier = { version: output ? 3 : 1, role: intent.role, cycle: intent.cycle, fixture: intent.fixture, binary: intent.binary, function: intent.identity, effectiveModel: intent.requestedModel, inputs: dossierInputs, approvedPaths: paths, outputPath: intent.outputPath, resultHeader: header, resultEnvelope, instructions: output ? this.options.roleInstructions[intent.role].split("\n") : this.options.roleInstructions[intent.role],
      ...(rePolicy ? { rePolicy } : {}),
      ...(output ? { outputContract: output, controllerInputIntegrity: { version: 1, verifier: "ff8-harness.sha256-source-projection-readback.v1", scope: "approved source and frozen projection bytes only; not native ABI/IDA or semantic truth", files: integrityFiles } } : {}),
      criteria: output ? "Return only the scientific payload as the final assistant JSON, conforming to outputContract.schema. Do not include the header, kind, role, wrappers, markdown or prose. Do not write a file or report via team_message; the controller adds the immutable envelope and persists the validated result. Null is allowed only for explicitly nullable optional fields. Execution completion is not scientific acceptance."
        : "One complete WorkerResult JSON at exact outputPath. Copy resultEnvelope fields directly to the ROOT object and add the scientific payload; never nest resultHeader/resultEnvelope. No markdown fences, absent scientific fields or fabricated native facts. Execution completion is not scientific acceptance." };
    const dossierText = output ? readableJson(dossier) : canonical(dossier);
    if (output) assertNativeReadLineLimit(dossierText, dossierPath);
    if (existsSync(dossierPath)) { if (readFileSync(dossierPath, "utf8") !== dossierText) throw new Error("immutable dossier conflict"); } else writeFileSync(dossierPath, dossierText, { flag: "wx" });
    const dossierBytes = output ? readFileSync(dossierPath) : undefined;
    if (dossierBytes && !dossierBytes.equals(Buffer.from(dossierText))) throw new Error("immutable dossier readback mismatch");
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
    const output = resolve(intent.outputPath); const boundary = resolve(this.options.outputDirectory); const rel = relative(boundary, output);
    if (rel.startsWith("..") || isAbsolute(rel) || dirname(output) !== boundary) throw new Error("artifact outside exact output boundary");
    if (!existsSync(output)) return inspection; if (lstatSync(output).isSymbolicLink() || realpathSync(dirname(output)) !== realpathSync(boundary)) throw new Error("artifact symlink boundary refused");
    const content = readFileSync(output, "utf8"); inspection.artifact = { path: intent.outputPath, sha256: hash(content), content }; return inspection;
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
    const content = readableJson({ ...payload, ...envelopeFor(intent) });
    try { assertNativeReadLineLimit(content, intent.outputPath); } catch (error) { return reject(error instanceof Error ? error.message : String(error)); }
    const output = resolve(intent.outputPath), boundary = resolve(this.options.outputDirectory), rel = relative(boundary, output);
    if (rel.startsWith("..") || isAbsolute(rel) || dirname(output) !== boundary) throw new Error("artifact outside exact output boundary");
    // Refuse ancestor links before creating directories, then recheck. These
    // fail-closed checks do not provide atomic protection against hostile swaps.
    assertArtifactPathWithoutSymlinks(output);
    mkdirSync(boundary, { recursive: true });
    assertArtifactPathWithoutSymlinks(output);
    if (realpathSync(boundary) !== boundary || realpathSync(dirname(output)) !== boundary) throw new Error("artifact symlink boundary refused");
    if (existsSync(output)) { if (readFileSync(output, "utf8") !== content) throw new Error("immutable structured artifact conflict"); }
    else writeFileSync(output, content, { flag: "wx" });
    const readback = readFileSync(output); if (!readback.equals(Buffer.from(content))) throw new Error("structured artifact readback mismatch");
    return { ...inspection, artifact: { path: intent.outputPath, sha256: hash(readback), content: readback.toString("utf8") } };
  }
  async pauseAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "pause"); }
  async resumeAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "resume"); }
  async stop(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.stopMission(id); }
}
