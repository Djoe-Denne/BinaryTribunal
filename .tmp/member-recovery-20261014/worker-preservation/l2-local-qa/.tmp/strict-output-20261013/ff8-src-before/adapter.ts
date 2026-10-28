import type { AccessContext, ArtifactFile, Bridge, ControllerContext, FrozenKnowledge, InputAccess, Inspection, Intent, MissionConfig, Role } from "./domain";
import type { ExecutionClient } from "./client";
import { mkdirSync, readFileSync, writeFileSync, lstatSync, existsSync, realpathSync } from "node:fs";
import { join, resolve, dirname, basename, relative, isAbsolute } from "node:path";
import { canonical, hash, identityKey } from "./validation";
export interface AdapterOptions { client: ExecutionClient; directory: string; profiles: Record<Role, string>; approvedSources: string[]; projectionRoot: string; outputDirectory: string; roleInstructions: Record<Role, string>; allowedTools: string[]; admissionMode: "native-query" | "native-boundary-witness" }
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
  constructor(readonly options: AdapterOptions) { this.access = new ProjectionAccess(options); }
  async ensureTeam(config: MissionConfig, _controller: ControllerContext): Promise<void> {
    if (resolve(config.outputDirectory) !== resolve(this.options.outputDirectory)) throw new Error("output boundary differs from admitted configuration");
    this.access.approveKnowledge(config.knowledge);
    const c = await this.options.client.capabilities();
    if (this.options.admissionMode === "native-query" && c.permissionPreflight !== true) throw new Error("native worker permission-query capability required; no silent alternate mode");
    if (this.options.admissionMode === "native-boundary-witness" && (c.resourceBoundary !== true || c.nativeAccessWitness !== true)) throw new Error("native boundary/tool-witness capabilities required; no simulated permissions");
    await this.options.client.ensure(config.missionId);
  }
  async submit(intent: Intent, _controller: ControllerContext): Promise<void> {
    const context = { missionId: intent.missionId, executionId: intent.executionId, role: intent.role };
    const files = [...intent.inputs.files.map(f => f.path), ...intent.inputs.accessibleRules];
    const paths = [...new Set(files)].map(path => ({ original: path, projected: this.access.projected(path, context) }));
    for (const f of paths) {
      const access = await this.access.read(f.original, context);
      if (access.status !== "ok") throw new Error(`${access.status}: ${f.original}`);
      const expected = intent.inputs.files.find(x => x.path === f.original)?.sha256;
      if (expected && hash(access.content) !== expected) throw new Error(`altered: ${f.original}`);
      if (hash(readFileSync(f.projected)) !== hash(access.content)) throw new Error(`immutable projection conflict: ${f.projected}`);
    }
    const header = { schemaVersion: 1, missionId: intent.missionId, taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, cycle: intent.cycle, authorId: intent.executionId, identity: intent.identity, inputFingerprint: intent.inputFingerprint, inputVersions: intent.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })), previousResultIds: intent.previousResultIds };
    const resultEnvelope = { ...header, kind: intent.role === "A" || intent.role === "B" ? "proposal" : intent.role === "R" ? "reconciliation" : intent.role, ...(intent.role === "A" || intent.role === "B" ? { role: intent.role } : {}) };
    const directory = join(this.options.projectionRoot, intent.role, hash(intent.executionId)); mkdirSync(directory, { recursive: true }); mkdirSync(this.options.outputDirectory, { recursive: true });
    const dossier = { version: 1, role: intent.role, cycle: intent.cycle, fixture: intent.fixture, binary: intent.binary, function: intent.identity, effectiveModel: intent.requestedModel, inputs: intent.inputs, approvedPaths: paths, outputPath: intent.outputPath, resultHeader: header, resultEnvelope, instructions: this.options.roleInstructions[intent.role], criteria: "One complete WorkerResult JSON at exact outputPath. Copy resultEnvelope fields directly to the ROOT object and add the scientific payload; never nest resultHeader/resultEnvelope. No markdown fences, absent scientific fields or fabricated native facts. Execution completion is not scientific acceptance." };
    const dossierPath = join(directory, "dossier.json"); const dossierText = canonical(dossier);
    if (existsSync(dossierPath)) { if (readFileSync(dossierPath, "utf8") !== dossierText) throw new Error("immutable dossier conflict"); } else writeFileSync(dossierPath, dossierText, { flag: "wx" });
    const prompt = `Role ${intent.role}, mission ${intent.missionId}, cycle ${intent.cycle}. Read the approved projection ${dossierPath} AND EVERY approvedPaths.projected file using the native read tool before analysis. Native successful reads/writes are witnessed; quoting inline facts is not a substitute for input verification. The following dossier and scientific instructions are authoritative for this execution. Use ONLY the approved role projection and exact output path. Never list/read neighboring outputs or reuse context. Persisted effectiveModel (or explicit override) is authority; historical prose model mentions are not overrides. No shell, subagents, git, IDA mutation or other index tools. If input missing/denied/tool unavailable, report that exact cause, do not bypass it.\n${dossierText}\nWrite ONE flat WorkerResult JSON: resultEnvelope fields belong at the root, not nested under resultHeader or resultEnvelope. Keep those fields EXACTLY and add your scientific payload at the same root. Then report completion to the lead via team_message if permitted.${intent.fixture ? " This is an isolated synthetic fixture, not a real FF8 finding." : " Real publication requires an independent native gate; never publish yourself."}`;
    const requiredAccess = [
      ...[dossierPath, ...paths.map(p => p.projected)].map(resource => ({ action: "read", resource })),
      { action: "edit", resource: intent.outputPath },
    ];
    const permissionPlan = this.options.admissionMode === "native-query" ? { requiredAccess } : { expectedAccess: requiredAccess, resourceBoundary: [...requiredAccess, ...this.options.allowedTools.filter(action => !["read", "edit"].includes(action)).map(action => ({ action, resource: "*" }))] };
    await this.options.client.submit(intent.missionId, { taskId: intent.taskId, attemptId: intent.attemptId, executionId: intent.executionId, idempotencyKey: intent.idempotencyKey, profile: this.options.profiles[intent.role], model: intent.requestedModel, prompt, dossier, metadata: { inputFingerprint: intent.inputFingerprint, roleInstructionsHash: hash(this.options.roleInstructions[intent.role]), dossierHash: hash(dossierText), admissionMode: this.options.admissionMode }, context: { mode: "fresh" }, worktree: false, ...permissionPlan });
  }
  async inspect(intent: Intent): Promise<Inspection> {
    await this.options.client.replay(intent.missionId);
    const r = await this.options.client.inspect(intent.missionId, intent.executionId); const execution = r.execution as Record<string, unknown> | undefined;
    if (!execution || execution.executionId !== intent.executionId) throw new Error("native execution identity unavailable");
    const native = execution.native as { model: import("./domain").ModelRef; directory: string; profile: string } | undefined;
    const state = execution.state;
    const status = ["failed", "stopped", "stop_requested"].includes(String(state)) ? "failed" : state === "completed" ? "completed" : state === "observed_running" ? "running" : "pending";
    const inspection: Inspection = { status, executionId: intent.executionId, authorId: intent.executionId, sessionId: String(execution.nativeSessionId), effectiveModel: native?.model, fresh: !!native && native.directory === this.options.directory && native.profile === this.options.profiles[intent.role], error: execution.failure ? canonical(execution.failure) : undefined };
    if (status !== "completed" && status !== "failed") return inspection;
    if (status === "completed" && this.options.admissionMode === "native-boundary-witness" && execution.accessVerified !== true) { inspection.status = "failed"; inspection.error = "Native task ended without all expected successful input/output access witnesses; artifacts retained, no scientific acceptance"; }
    const output = resolve(intent.outputPath); const boundary = resolve(this.options.outputDirectory); const rel = relative(boundary, output);
    if (rel.startsWith("..") || isAbsolute(rel) || dirname(output) !== boundary) throw new Error("artifact outside exact output boundary");
    if (!existsSync(output)) return inspection; if (lstatSync(output).isSymbolicLink() || realpathSync(dirname(output)) !== realpathSync(boundary)) throw new Error("artifact symlink boundary refused");
    const content = readFileSync(output, "utf8"); inspection.artifact = { path: intent.outputPath, sha256: hash(content), content }; return inspection;
  }
  async pauseAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "pause"); }
  async resumeAdmissions(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.control(id, "resume"); }
  async stop(id: string, _controller: ControllerContext): Promise<void> { await this.options.client.stopMission(id); }
}
