import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { canonical } from "./validation";

export interface PreparationFile {
  path: string; sha256: string; kind: "native" | "source" | "test" | "rule" | "knowledge" | "proposal" | "score" | "manifest";
  approvedForBlind?: boolean;
}
export interface PreparationRequest {
  schemaVersion: 1; missionId: string; taskId: string; cycle: number; role: "A" | "B" | "R" | "implementer" | "reviewer" | "mechanical";
  sourceRoot: string; targetSessionId: string; destinationRoot: string; blind: boolean; files: PreparationFile[];
}
export interface SessionBinding { sessionId: string; projectId: string; directory: string; missionId: string; taskId: string }
export type BindingReader = (sessionId: string) => Promise<SessionBinding>;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const LIMITS = { files: 512, each: 8 * 1024 * 1024, total: 64 * 1024 * 1024 };
const RECEIPT = ".preparation-receipt.json";
const KINDS = new Set(["native", "source", "test", "rule", "knowledge", "proposal", "score", "manifest"]);
const own = (root: string, target: string) => { const r = relative(root, target); return r !== "" && !isAbsolute(r) && r !== ".." && !r.startsWith(`..${sep}`); };
function logicalPath(path: string): void {
  if (!path || path.length > 240 || path.normalize("NFC") !== path || path.includes("\\") || isAbsolute(path) || /[:\x00-\x1f]/.test(path)) throw new Error("Invalid exact relative input path");
  for (const part of path.split("/")) if (!part || part === "." || part === ".." || /[ .]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) throw new Error("Unsafe input path component");
  if (path === RECEIPT || path.startsWith(".git/") || path.includes("node_modules/") || path.endsWith("ensemble.db")) throw new Error("Path outside input preparation boundary");
}
function validatePins(files: PreparationFile[], blind: boolean): void {
  if (!Array.isArray(files) || files.length < 1 || files.length > LIMITS.files) throw new Error("Bounded explicit file list required");
  const paths = new Set<string>();
  for (const file of files) {
    if (!file || typeof file.path !== "string" || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) || !KINDS.has(file.kind)
      || Object.keys(file).some(k => !["path", "sha256", "kind", "approvedForBlind"].includes(k))
      || (file.approvedForBlind !== undefined && typeof file.approvedForBlind !== "boolean")) throw new Error("Invalid frozen input pin");
    logicalPath(file.path); const key = file.path.toLowerCase();
    if (paths.has(key)) throw new Error("Duplicate or case-colliding input path"); paths.add(key);
    if (blind && (["proposal", "score", "manifest"].includes(file.kind) || (["knowledge", "source", "test"].includes(file.kind) && file.approvedForBlind !== true))) throw new Error("Blind input projection violation");
  }
}
export function preparationFingerprint(req: PreparationRequest): string {
  return sha(canonical({ schemaVersion: req.schemaVersion, missionId: req.missionId, taskId: req.taskId, cycle: req.cycle, role: req.role, blind: req.blind,
    files: [...req.files].sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) }));
}
async function noLinks(root: string, path: string, missing = false): Promise<void> {
  if (resolve(path) !== resolve(root) && !own(resolve(root), resolve(path))) throw new Error("Boundary escape");
  let current = resolve(root);
  const paths = [current]; for (const part of relative(root, path).split(sep).filter(Boolean)) { current = join(current, part); paths.push(current); }
  for (const part of paths) {
    try { if ((await lstat(part)).isSymbolicLink()) throw new Error("Symbolic link/junction input boundary"); }
    catch (error) { if (missing && (error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
  }
}
function validateRequest(req: PreparationRequest): void {
  if (req && Object.keys(req).some(k => !["schemaVersion", "missionId", "taskId", "cycle", "role", "sourceRoot", "targetSessionId", "destinationRoot", "blind", "files"].includes(k))) throw new Error("Unexpected preparation request property");
  if (!req || req.schemaVersion !== 1 || !Number.isSafeInteger(req.cycle) || req.cycle < 1 || typeof req.blind !== "boolean") throw new Error("Invalid preparation request");
  for (const id of [req.missionId, req.taskId, req.targetSessionId]) if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("Exact bounded ownership IDs required");
  if (!["A", "B", "R", "implementer", "reviewer", "mechanical"].includes(req.role) || ((req.role === "A" || req.role === "B") && !req.blind)) throw new Error("Invalid role/blind contract");
  if (!isAbsolute(req.sourceRoot) || !isAbsolute(req.destinationRoot) || own(resolve(req.sourceRoot), resolve(req.destinationRoot)) || resolve(req.sourceRoot) === resolve(req.destinationRoot)) throw new Error("Distinct absolute source/destination boundaries required");
  validatePins(req.files, req.blind);
}

/** Deterministic mechanical preparation, never worker allocation or parent acceptance. */
export async function prepareTransfer(req: PreparationRequest, readBinding: BindingReader) {
  validateRequest(req);
  const source = resolve(req.sourceRoot), destination = resolve(req.destinationRoot), initial = await readBinding(req.targetSessionId);
  const bound = (binding: SessionBinding) => {
    if (!binding || binding.sessionId !== req.targetSessionId || binding.missionId !== req.missionId || binding.taskId !== req.taskId || !binding.projectId || !isAbsolute(binding.directory) || !own(join(resolve(binding.directory), "inputs"), destination)) throw new Error("Destination is not the exact native session/task input boundary");
  };
  bound(initial); await noLinks(source, source);
  const data: Array<{ pin: PreparationFile; bytes: Buffer }> = []; let total = 0;
  for (const pin of req.files) {
    const file = join(source, ...pin.path.split("/")); await noLinks(source, file);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.size > LIMITS.each || total + stat.size > LIMITS.total) throw new Error("Source file/byte budget exceeded");
    const bytes = await readFile(file); if (sha(bytes) !== pin.sha256) throw new Error(`Frozen source hash mismatch: ${pin.path}`);
    total += bytes.length; data.push({ pin, bytes });
  }
  const fingerprint = preparationFingerprint(req);
  const receipt = { schemaVersion: 1, missionId: req.missionId, taskId: req.taskId, cycle: req.cycle, role: req.role, blind: req.blind,
    targetSessionId: req.targetSessionId, projectId: initial.projectId, fingerprint, files: data.map(({pin,bytes}) => ({...pin, bytes: bytes.length})), totalBytes: total,
    state: "prepared-not-approved", requiresParentApproval: true, workerAccessVerified: false, nativeValidation: false };
  const verifyBinding = async () => {
    const final = await readBinding(req.targetSessionId); bound(final);
    if (final.projectId !== initial.projectId || resolve(final.directory) !== resolve(initial.directory)) throw new Error("Native ownership changed during preparation");
  };
  const verifyPrepared = async () => {
    await noLinks(initial.directory, destination);
    const expectedFiles = new Set([RECEIPT, ...req.files.map(f => f.path)]), expectedDirs = new Set<string>();
    for (const pin of req.files) {
      const parts = pin.path.split("/"); for (let i = 1; i < parts.length; i++) expectedDirs.add(parts.slice(0, i).join("/"));
    }
    const stack = [""];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of await readdir(join(destination, dir), {withFileTypes:true})) {
        const path = dir ? `${dir}/${entry.name}` : entry.name;
        if (entry.isSymbolicLink() || (entry.isDirectory() ? !expectedDirs.has(path) : !entry.isFile() || !expectedFiles.has(path))) throw new Error("Unexpected prepared file/directory or link");
        if (entry.isDirectory()) stack.push(path);
      }
    }
    const receiptPath = join(destination, RECEIPT); await noLinks(destination, receiptPath);
    if ((await lstat(receiptPath)).size > 512 * 1024) throw new Error("Preparation receipt metadata budget exceeded");
    const existingReceipt = JSON.parse(await readFile(receiptPath, "utf8"));
    if (canonical(existingReceipt) !== canonical(receipt)) throw new Error("Existing destination has a different preparation receipt");
    for (const { pin } of data) { const target = join(destination, ...pin.path.split("/")); await noLinks(destination, target); if (sha(await readFile(target)) !== pin.sha256) throw new Error("Prepared target altered"); }
    return receipt;
  };
  const absent = await lstat(destination).then(stat => {
    if (!stat.isDirectory()) throw new Error("Existing destination is not an owned package directory"); return false;
  }, error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; return true; });
  if (!absent) { const existing = await verifyPrepared(); await verifyBinding(); return existing; }
  await noLinks(initial.directory, dirname(destination), true); await mkdir(dirname(destination), { recursive: true });
  const parent = await realpath(dirname(destination)); if (!own(resolve(initial.directory), parent)) throw new Error("Resolved destination escaped its native owner");
  const staging = destination + ".preparing-" + randomUUID(); await mkdir(staging);
  try {
    for (const { pin, bytes } of data) {
      const target = join(staging, ...pin.path.split("/")); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: "wx" });
      if (sha(await readFile(target)) !== pin.sha256 || sha(await readFile(join(source, ...pin.path.split("/")))) !== pin.sha256) throw new Error("Source/target changed during mechanical transfer");
    }
    await verifyBinding();
    for (const {pin} of data) if (sha(await readFile(join(source, ...pin.path.split("/")))) !== pin.sha256) throw new Error("Source changed at commit boundary");
    await writeFile(join(staging, RECEIPT), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    await noLinks(initial.directory, dirname(destination)); await rename(staging, destination);
    await verifyPrepared(); return receipt;
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
}

/** A scope recommendation, not scientific acceptance or permission to skip review. */
export function reviewBaselineFingerprint(files: PreparationFile[]): string { validatePins(files, false); return sha(canonical([...files].sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0))); }
export function planReviewScope(previous: PreparationFile[], current: PreparationFile[], decision?: { priorCoverageSha256: string; baselineFingerprint: string; allowedChangedPaths: string[] }) {
  validatePins(previous, false); validatePins(current, false);
  const old = new Map(previous.map(f => [f.path, canonical(f)])), fresh = new Map(current.map(f => [f.path, canonical(f)]));
  const changed = [...fresh.keys()].filter(p => old.get(p) !== fresh.get(p)).sort();
  const removed = [...old.keys()].filter(p => !fresh.has(p)).sort();
  const approved = !!decision && /^[a-f0-9]{64}$/.test(decision.priorCoverageSha256) && decision.baselineFingerprint === reviewBaselineFingerprint(previous) && decision.allowedChangedPaths.length > 0;
  const allowed = new Set(decision?.allowedChangedPaths ?? []);
  const metadataStable=current.every(pin=>{const before=previous.find(p=>p.path===pin.path);return !before||(before.kind===pin.kind&&before.approvedForBlind===pin.approvedForBlind);});
  const delta = approved && removed.length === 0 && metadataStable && changed.every(p => allowed.has(p));
  return { mode: delta ? "delta" : "full", changed, removed, invariantGateRequired: true, freshReviewerRequired: true, requiresParentApproval: true,
    priorCoverageSha256: approved ? decision!.priorCoverageSha256 : null,
    reason: delta ? "Explicit parent coverage reference and bounded permitted delta" : "No matching prior coverage, removal or change outside approved delta" };
}
