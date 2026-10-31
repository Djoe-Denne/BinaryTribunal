import type { AccessContext, ArtifactFile, FrozenKnowledge, InputAccess, Inspection, Intent } from "../domain";
import type { InputIntegrityFileV1, InputIntegrityCertificateV1 } from "../ports/dossier";
import { mkdirSync, readFileSync, writeFileSync, lstatSync, existsSync, realpathSync } from "node:fs";
import { join, resolve, dirname, basename, relative, isAbsolute } from "node:path";
import { canonical, hash } from "../validation";

export interface ProjectionAccessOptions { approvedSources: string[]; projectionRoot: string; outputDirectory: string; allowedTools: string[] }
/** Only four dependencies are consumed; generic inference preserves historical options. */
export class ProjectionAccess<Options extends ProjectionAccessOptions = ProjectionAccessOptions> implements InputAccess {
  private publicFacts = new Map<string, ArtifactFile>();
  constructor(readonly options: Options) {}
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
  async read(path: string, context: AccessContext): Promise<import("../domain").ReadAccess> {
    if (!this.authorized(path, context)) return { status: "denied-read" };
    try {
      const content = readFileSync(path); const projected = this.projected(path, context);
      mkdirSync(dirname(projected), { recursive: true });
      if (!existsSync(projected)) writeFileSync(projected, content, { flag: "wx" });
      if (lstatSync(projected).isSymbolicLink()) throw new Error("projection symlink refused");
      return { status: "ok", content };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return { status: "missing" };
      if (code === "EACCES" || code === "EPERM") return { status: "denied-read" }; throw error;
    }
  }
  async list(path: string, context: AccessContext): Promise<import("../domain").ListAccess> {
    const sources = [...this.options.approvedSources, ...this.publicFacts.keys()].filter(p => dirname(resolve(p)) === resolve(path));
    if (!sources.length && !(context.role === "R" && resolve(path) === resolve(this.options.outputDirectory))) return { status: "denied-list" };
    return { status: "ok", entries: sources.map(p => this.projected(p, context)) };
  }
  async tool(name: string, _context: AccessContext): Promise<boolean> { return this.options.allowedTools.includes(name); }
  projected(path: string, context: AccessContext): string { return join(this.options.projectionRoot, context.role, hash(context.executionId), `${hash(resolve(path)).slice(0, 20)}-${basename(path)}`); }
}
export interface ProjectionPolicyV1 { strict: boolean; assertReadable?: (content: string, path: string) => void }
export async function projectDossierInputsV1(intent: Intent, access: ProjectionAccess, policy: ProjectionPolicyV1) {
  const context = { missionId: intent.missionId, executionId: intent.executionId, role: intent.role };
  const files = [...intent.inputs.files.map(f => f.path), ...intent.inputs.accessibleRules];
  const paths = [...new Set(files)].map(path => ({ original: path, projected: access.projected(path, context) }));
  const directory = join(access.options.projectionRoot, intent.role, hash(intent.executionId)), dossierPath = join(directory, "dossier.json");
  const replayingDossier = policy.strict && existsSync(dossierPath);
  const integrityFiles: InputIntegrityFileV1[] = [];
  for (const f of paths) {
    const expected = intent.inputs.files.find(x => x.path === f.original)?.sha256;
    if (policy.strict && !expected) throw new Error(`missing manifest hash: ${f.original}`);
    if (replayingDossier && !existsSync(f.projected)) throw new Error(`missing immutable projection: ${f.projected}`);
    const read = await access.read(f.original, context);
    if (read.status !== "ok") throw new Error(`${read.status}: ${f.original}`);
    const sourceSha256 = hash(read.content);
    if (expected && sourceSha256 !== expected) throw new Error(`altered: ${f.original}`);
    const projectedBytes = readFileSync(f.projected), projectedSha256 = hash(projectedBytes);
    if (projectedSha256 !== sourceSha256) throw new Error(`immutable projection conflict: ${f.projected}`);
    if (policy.strict && expected) {
      policy.assertReadable?.(projectedBytes.toString("utf8"), f.projected);
      integrityFiles.push({ source: f.original, projected: f.projected, expectedSha256: expected, sourceSha256, projectedSha256, verified: true });
    }
  }
  const certificate: InputIntegrityCertificateV1 = { version: 1, verifier: "ff8-harness.sha256-source-projection-readback.v1", scope: "approved source and frozen projection bytes only; not native ABI/IDA or semantic truth", files: integrityFiles };
  return { paths, directory, dossierPath, certificate };
}
export function persistDossierV1(dossierPath: string, outputDirectory: string, text: string, policy: ProjectionPolicyV1): Uint8Array | undefined {
  mkdirSync(dirname(dossierPath), { recursive: true }); mkdirSync(outputDirectory, { recursive: true });
  if (policy.strict) policy.assertReadable?.(text, dossierPath);
  if (existsSync(dossierPath)) { if (readFileSync(dossierPath, "utf8") !== text) throw new Error("immutable dossier conflict"); } else writeFileSync(dossierPath, text, { flag: "wx" });
  const bytes = policy.strict ? readFileSync(dossierPath) : undefined;
  if (bytes && !bytes.equals(Buffer.from(text))) throw new Error("immutable dossier readback mismatch");
  return bytes;
}
function artifactBoundary(path: string, outputDirectory: string) {
  const output = resolve(path), boundary = resolve(outputDirectory), rel = relative(boundary, output);
  if (rel.startsWith("..") || isAbsolute(rel) || dirname(output) !== boundary) throw new Error("artifact outside exact output boundary");
  return { output, boundary };
}
export function collectFileArtifactV1(intent: Intent, inspection: Inspection, outputDirectory: string): Inspection {
  const { output, boundary } = artifactBoundary(intent.outputPath, outputDirectory);
  if (!existsSync(output)) return inspection;
  if (lstatSync(output).isSymbolicLink() || realpathSync(dirname(output)) !== realpathSync(boundary)) throw new Error("artifact symlink boundary refused");
  const content = readFileSync(output, "utf8"); inspection.artifact = { path: intent.outputPath, sha256: hash(content), content }; return inspection;
}
function assertArtifactPathWithoutSymlinks(path: string): void {
  const ancestors: string[] = [];
  for (let current = resolve(path); ; current = dirname(current)) { ancestors.push(current); if (dirname(current) === current) break; }
  for (const current of ancestors.reverse()) {
    try { if (lstatSync(current).isSymbolicLink()) throw new Error("artifact symlink boundary refused"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}
/** Controller-only persistence, after native identity/provenance/schema validation. */
export function persistStructuredArtifactV1(intent: Intent, content: string, inspection: Inspection, outputDirectory: string): Inspection {
  const { output, boundary } = artifactBoundary(intent.outputPath, outputDirectory);
  // Fail closed before creation and recheck; not atomic protection against hostile swaps.
  assertArtifactPathWithoutSymlinks(output); mkdirSync(boundary, { recursive: true }); assertArtifactPathWithoutSymlinks(output);
  if (realpathSync(boundary) !== boundary || realpathSync(dirname(output)) !== boundary) throw new Error("artifact symlink boundary refused");
  if (existsSync(output)) { if (readFileSync(output, "utf8") !== content) throw new Error("immutable structured artifact conflict"); }
  else writeFileSync(output, content, { flag: "wx" });
  const readback = readFileSync(output); if (!readback.equals(Buffer.from(content))) throw new Error("structured artifact readback mismatch");
  return { ...inspection, artifact: { path: intent.outputPath, sha256: hash(readback), content: readback.toString("utf8") } };
}
