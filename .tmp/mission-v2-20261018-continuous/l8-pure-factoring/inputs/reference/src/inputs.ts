import type { AccessContext, ArtifactFile, InputAccess, InputBundle, InputCheck, KnowledgeArtifactSink } from "./domain";
import { posix, win32 } from "node:path";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { canonical, exactPath, hash, validateFile, validateIdentity, validateKnowledge } from "./validation";
/** Opt-in filesystem sink: the caller supplies the explicit owned knowledge boundary. */
export class FileKnowledgeArtifactSink implements KnowledgeArtifactSink {
  constructor(public readonly knowledgeDirectory: string) { exactPath(knowledgeDirectory); }
  async writeImmutable({ file, content }: { file: ArtifactFile; content: string }): Promise<{ sha256: string }> {
    validateFile(file); const path = /^[a-z]:[\\/]|^\\\\/i.test(this.knowledgeDirectory) ? win32 : posix;
    const relative = path.relative(this.knowledgeDirectory, file.path);
    if (!/^[a-f0-9]{64}\.json$/i.test(relative) || file.kind !== "knowledge" || file.approvedForBlind !== true) throw new Error("public knowledge boundary violation");
    if (hash(content) !== file.sha256) throw new Error("public knowledge content hash mismatch");
    await mkdir(this.knowledgeDirectory, { recursive: true });
    if ((await lstat(this.knowledgeDirectory)).isSymbolicLink()) throw new Error("public knowledge boundary is a symbolic link");
    try { await writeFile(file.path, content, { encoding: "utf8", flag: "wx" }); }
    catch (e) { if (!(e !== null && typeof e === "object" && "code" in e && e.code === "EEXIST")) throw e; }
    if ((await lstat(file.path)).isSymbolicLink()) throw new Error("public knowledge boundary target is a symbolic link");
    const actual = await readFile(file.path, "utf8");
    if (actual !== content || hash(actual) !== file.sha256) throw new Error("immutable public knowledge altered");
    return { sha256: hash(actual) };
  }
}
/** No filesystem fallback: an adapter failure does not prove worker access. */
export async function checkInputs(bundle: InputBundle, access: InputAccess, context: AccessContext): Promise<InputCheck> {
  const issues: InputCheck["issues"] = [];
  const issue = (kind: InputCheck["issues"][number]["kind"], path: string, detail: string) => issues.push({ kind, path, detail });
  if (bundle.schemaVersion !== 1 || bundle.role !== context.role || !Number.isSafeInteger(bundle.cycle) || bundle.cycle < 1) issue("invalid-manifest", "bundle", "role/cycle/schema mismatch");
  try { validateKnowledge(bundle.knowledge); if (bundle.identity) validateIdentity(bundle.identity); } catch (e) { issue("invalid-manifest", "bundle", String(e)); }
  const blind = bundle.role === "A" || bundle.role === "B";
  if (blind && bundle.proposals !== undefined) issue("invalid-manifest", "bundle", "blind author received proposals");
  const files = bundle.files;
  if (!Array.isArray(files)) return { ok: false, issues: [{ kind: "invalid-manifest", path: "bundle", detail: "files array missing" }] };
  for (const file of bundle.knowledge?.files ?? []) if (!files.some(f => canonical(f) === canonical(file))) issue("invalid-manifest", file.path, "frozen knowledge absent from exact hashed projection");
  const seen = new Set<string>(); const dirs = new Set<string>();
  for (const file of files) {
    try { validateFile(file); } catch (e) { issue("invalid-manifest", file?.path ?? "file", String(e)); continue; }
    if (seen.has(file.path)) { issue("invalid-manifest", file.path, "duplicate exact input path"); continue; } seen.add(file.path);
    if (blind && (["proposal", "score", "manifest"].includes(file.kind) || (file.kind === "knowledge" && file.approvedForBlind !== true))) issue("invalid-manifest", file.path, "file not approved for blind projection");
    dirs.add(/^[a-z]:[\\/]|^\\\\/i.test(file.path) ? win32.dirname(file.path) : posix.dirname(file.path));
    try {
      const read = await access.read(file.path, context);
      if (read.status !== "ok") issue(read.status, file.path, "effective worker read probe failed");
      else if (hash(read.content) !== file.sha256.toLowerCase()) issue("altered", file.path, "bytes differ from frozen sha256");
    } catch (e) { issue("unavailable-tool", file.path, `read probe unavailable: ${String(e)}`); }
  }
  for (const directory of [...dirs].sort()) {
    try { const listing = await access.list(directory, context); if (listing.status !== "ok") issue(listing.status, directory, "effective worker list probe failed"); }
    catch (e) { issue("unavailable-tool", directory, `list probe unavailable: ${String(e)}`); }
  }
  for (const path of bundle.accessibleRules ?? []) if (!files.some(f => f.path === path && f.kind === "rule")) issue("invalid-manifest", path, "accessible rule missing from exact hashed projection");
  for (const name of bundle.requiredTools ?? []) {
    try { if (!await access.tool(name, context)) issue("unavailable-tool", name, "required worker tool unavailable"); }
    catch (e) { issue("unavailable-tool", name, String(e)); }
  }
  return { ok: issues.length === 0, issues };
}
