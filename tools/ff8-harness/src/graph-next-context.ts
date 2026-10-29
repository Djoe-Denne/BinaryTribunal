/** Prospective OFFLINE input acquisition. Images retain bytes, never authority.
 * No scientific codec, cycle knowledge, native port or scheduler is replaced. */
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { ArtifactFile, GraphRun, InputBundle } from "./domain";
import type { ArtifactBinding } from "./graph-store";
import { canonical, fingerprint, hash } from "./validation";

type Role = "A" | "B" | "R";
export interface NextContextGrantV1 {
  id: string; producerUnitId: string; producerFunctionId: string; artifactKind: ArtifactBinding["artifactKind"];
  knowledgeRevision: number; publicationLevel: number; consumerUnitId: string; consumerFunctionId: string; roles: Role[];
}
export interface NextContextPolicyV1 {
  version: "rms-next-context-policy-v1"; targetRoot: string; targetNamespace: string; ownerActorId: string; grants: NextContextGrantV1[];
}
export interface NextContextApprovalRequestV1 {
  approvalKey: string; grantId: string; producerUnitId: string; producerFunctionId: string; commitId: string; artifactId: string; artifactSha256: string;
  knowledgeRevision: number; publicationLevel: number; consumerUnitId: string; consumerFunctionId: string; roles: Role[];
}
export interface NextContextApprovalV1 extends NextContextApprovalRequestV1 {
  version: "rms-next-context-approval-v1"; missionId: string; runFingerprint: string; planFingerprint: string; bindingFingerprint: string; policySha256: string;
  artifactKind: ArtifactBinding["artifactKind"];
  sourceBindingSha256: string; publicationManifestSha256: string; parentAttestationId: string; parentAttestationSha256: string;
  parentActorId: string; parentAuthorityDigest: string; approvalId: string;
}
export interface NextContextProjectionV1 {
  version: "rms-next-context-projection-v1"; missionId: string; runFingerprint: string; planFingerprint: string; bindingFingerprint: string;
  unitId: string; familyToken: number; controllerToken: number; baseKnowledgeRevision: number;
  rootIdentity: { dev: string; ino: string };
  policy: NextContextPolicyV1; policySha256: string;
  /** Missing approval is inspectable pre-amendment history ONLY; every current
   * effect requires an exact private approval row and its full image. */
  entries: Array<{ grantId: string; roles: Role[]; binding: ArtifactBinding; approval?: NextContextApprovalV1; file: ArtifactFile }>;
  fingerprint: string;
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`rms-next-context: ${message}`); }
function object(v: unknown, keys: string[]): Record<string, any> {
  check(v !== null && typeof v === "object" && !Array.isArray(v), "object required");
  const r = v as Record<string, any>; check(Object.keys(r).length === keys.length && keys.every(k => Object.hasOwn(r, k)), "exact fields required"); return r;
}
function text(v: unknown): asserts v is string { check(typeof v === "string" && v.trim().length > 0 && !v.includes("*"), "exact nonempty text required"); }
function integer(v: unknown): void { check(Number.isSafeInteger(v) && Number(v) >= 1, "positive safe integer required"); }
function digest(v: unknown): void { check(typeof v === "string" && /^[a-f0-9]{64}$/.test(v), "SHA256 required"); }
function roles(v: unknown): asserts v is Role[] {
  check(Array.isArray(v) && v.length > 0 && new Set(v).size === v.length && v.every(r => ["A", "B", "R"].includes(r)), "exact roles required");
}
const approvalRequestKeys = ["approvalKey", "grantId", "producerUnitId", "producerFunctionId", "commitId", "artifactId", "artifactSha256", "knowledgeRevision", "publicationLevel", "consumerUnitId", "consumerFunctionId", "roles"];
export function parseNextContextApprovalRequestV1(value: unknown): NextContextApprovalRequestV1 {
  const r = object(value, approvalRequestKeys);
  [r.approvalKey, r.grantId, r.producerUnitId, r.producerFunctionId, r.artifactId, r.consumerUnitId, r.consumerFunctionId].forEach(text);
  [r.commitId, r.artifactSha256].forEach(digest); [r.knowledgeRevision, r.publicationLevel].forEach(integer); roles(r.roles);
  check([1, 2].includes(r.publicationLevel) && r.producerUnitId !== r.consumerUnitId, "approval level/family");
  return structuredClone(r) as unknown as NextContextApprovalRequestV1;
}
/** Shape/digest only. Possession of this document or an event is NOT approval. */
export function parseNextContextApprovalV1(value: unknown): NextContextApprovalV1 {
  const p = object(value, [...approvalRequestKeys, "version", "missionId", "runFingerprint", "planFingerprint", "bindingFingerprint", "policySha256", "artifactKind", "sourceBindingSha256", "publicationManifestSha256", "parentAttestationId", "parentAttestationSha256", "parentActorId", "parentAuthorityDigest", "approvalId"]);
  parseNextContextApprovalRequestV1(Object.fromEntries(approvalRequestKeys.map(k => [k, p[k]])));
  check(p.version === "rms-next-context-approval-v1", "approval version"); [p.missionId, p.parentAttestationId, p.parentActorId].forEach(text);
  check(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(p.artifactKind), "approval artifact kind");
  [p.runFingerprint, p.planFingerprint, p.bindingFingerprint, p.policySha256, p.sourceBindingSha256, p.publicationManifestSha256, p.parentAttestationSha256, p.parentAuthorityDigest, p.approvalId].forEach(digest);
  const { approvalId: _id, ...body } = p; check(fingerprint(body) === p.approvalId, "approval document digest");
  return structuredClone(p) as unknown as NextContextApprovalV1;
}
export function parseNextContextPolicyV1(value: unknown): NextContextPolicyV1 {
  const p = object(value, ["version", "targetRoot", "targetNamespace", "ownerActorId", "grants"]);
  check(p.version === "rms-next-context-policy-v1", "policy version"); [p.targetRoot, p.targetNamespace, p.ownerActorId].forEach(text);
  check(isAbsolute(p.targetRoot) && resolve(p.targetRoot) === p.targetRoot && /^[a-zA-Z0-9_-]{1,64}$/.test(p.targetNamespace), "closed canonical root/namespace required");
  check(Array.isArray(p.grants), "grants required"); const ids = new Set<string>(), scopes = new Set<string>();
  for (const value of p.grants) {
    const g = object(value, ["id", "producerUnitId", "producerFunctionId", "artifactKind", "knowledgeRevision", "publicationLevel", "consumerUnitId", "consumerFunctionId", "roles"]);
    [g.id, g.producerUnitId, g.producerFunctionId, g.consumerUnitId, g.consumerFunctionId].forEach(text); roles(g.roles);
    integer(g.knowledgeRevision); integer(g.publicationLevel); check([1, 2].includes(g.publicationLevel), "publication level");
    check(["structural_fact", "reconciled_c", "semantic_description", "validated_knowledge"].includes(g.artifactKind), "artifact kind");
    check(g.producerUnitId !== g.consumerUnitId && !ids.has(g.id), "same-family knowledge or duplicate grant"); ids.add(g.id);
    const { id: _id, ...scope } = g, key = canonical(scope); check(!scopes.has(key), "duplicate grant scope"); scopes.add(key);
  }
  return structuredClone(p) as unknown as NextContextPolicyV1;
}
/** Pure run-dependent scope check, not an authorization grant. R receives the
 * exact A+B proposal bytes including their input headers: every projected input
 * exposed there must be explicitly granted to R on that SAME grant/path. Keep
 * historical shape parsing separate; it can never authorize current effects. */
export function assertNextContextRunScopesV1(policy: NextContextPolicyV1, run: GraphRun): void {
  for (const grant of policy.grants) {
    const consumer = run.prepared.planning.units.find(u => u.unitId === grant.consumerUnitId);
    const reconciles = consumer?.subIntents.some(s => s.functionId === grant.consumerFunctionId && s.role === "R");
    check(!reconciles || !grant.roles.some(role => role === "A" || role === "B") || grant.roles.includes("R"),
      "projected A/B inputs require explicit R authorization on the same grant for exact proposals");
  }
}
export function nextContextRootIdentityV1(policy: NextContextPolicyV1): NextContextProjectionV1["rootIdentity"] {
  const stat = lstatSync(policy.targetRoot, { bigint: true });
  check(stat.isDirectory() && !stat.isSymbolicLink() && realpathSync(policy.targetRoot) === policy.targetRoot, "existing canonical parent-owned root required");
  return { dev: String(stat.dev), ino: String(stat.ino) };
}
export function nextContextFileV1(image: Pick<NextContextProjectionV1, "missionId" | "runFingerprint" | "unitId" | "familyToken" | "policy" | "policySha256">, grant: NextContextGrantV1, binding: ArtifactBinding, approval?: NextContextApprovalV1): ArtifactFile {
  // Do not expose the common policy/image digest: either could reference grants
  // belonging exclusively to another role. This file describes its own scope.
  const source = { ownerActorId: image.policy.ownerActorId, namespace: image.policy.targetNamespace, missionId: image.missionId, runFingerprint: image.runFingerprint, unitId: image.unitId, familyToken: image.familyToken,
    grantId: grant.id, ...(approval ? { approvalId: approval.approvalId } : {}), producerUnitId: binding.producerUnitId, producerFunctionId: binding.functionId, artifactKind: binding.artifactKind,
    commitId: binding.commitId, artifactId: binding.artifactId, sha256: binding.artifactSha256, knowledgeRevision: binding.knowledgeRevision };
  const id = fingerprint(source);
  return { path: join(image.policy.targetRoot, `${image.policy.targetNamespace}-${id}.utf8`), sha256: binding.artifactSha256,
    version: `rms-next-context-v1:${binding.knowledgeRevision}:${id}`, provenance: `parent-approved published input ${canonical(source)}`,
    kind: "knowledge", ...(grant.roles.some(r => r === "A" || r === "B") ? { approvedForBlind: true } : {}) };
}
/** Historical parsing deliberately performs NO current-authority or filesystem read. */
export function parseNextContextProjectionV1(value: unknown): NextContextProjectionV1 {
  const p = object(value, ["version", "missionId", "runFingerprint", "planFingerprint", "bindingFingerprint", "unitId", "familyToken", "controllerToken", "baseKnowledgeRevision", "rootIdentity", "policy", "policySha256", "entries", "fingerprint"]);
  check(p.version === "rms-next-context-projection-v1", "projection version"); [p.missionId, p.unitId].forEach(text);
  [p.runFingerprint, p.planFingerprint, p.bindingFingerprint, p.policySha256, p.fingerprint].forEach(digest);
  [p.familyToken, p.controllerToken, p.baseKnowledgeRevision].forEach(integer);
  const rootIdentity = object(p.rootIdentity, ["dev", "ino"]); check(Object.values(rootIdentity).every(v => typeof v === "string" && /^\d+$/.test(v)), "root identity required");
  const policy = parseNextContextPolicyV1(p.policy); check(fingerprint(policy) === p.policySha256, "policy digest");
  check(Array.isArray(p.entries), "projection entries"); const ids = new Set<string>(), paths = new Set<string>();
  for (const value of p.entries) {
    const e = object(value, ["grantId", "roles", "binding", "file", ...(value && Object.hasOwn(value, "approval") ? ["approval"] : [])]), g = policy.grants.find(g => g.id === e.grantId);
    check(g && !ids.has(g.id) && g.consumerUnitId === p.unitId && canonical(g.roles) === canonical(e.roles), "projection grant/roles"); ids.add(g.id);
    const b = object(e.binding, ["version", "missionId", "commitId", "producerUnitId", "artifactId", "functionId", "moduleSha256", "artifactKind", "artifactSha256", "knowledgeRevision", "publicationLevel", "validation",
      "materialization", "content", "sources", "evidenceDigest", "parentAuthorityDigest", "parentActorId", "parentAttestationId"]) as unknown as ArtifactBinding;
    [b.commitId, b.moduleSha256, b.artifactSha256, b.evidenceDigest, b.parentAuthorityDigest].forEach(digest);
    [b.missionId, b.producerUnitId, b.artifactId, b.functionId, b.parentActorId, b.parentAttestationId].forEach(text);
    check(["stored-result", "parent-derived"].includes(b.materialization) && ["fixture-only", "parent-validated"].includes(b.validation) && Array.isArray(b.sources) && b.sources.length > 0, "source provenance required");
    for (const source of b.sources) { const s = object(source, ["resultId", "executionId", "subIntentId", "digest"]); [s.resultId, s.executionId, s.subIntentId].forEach(text); digest(s.digest); }
    check(b && b.version === 1 && b.missionId === p.missionId && b.producerUnitId === g.producerUnitId && b.producerUnitId !== p.unitId
      && b.functionId === g.producerFunctionId && b.artifactKind === g.artifactKind && b.knowledgeRevision === g.knowledgeRevision && b.publicationLevel === g.publicationLevel
      && b.parentActorId === policy.ownerActorId && typeof b.parentAttestationId === "string" && b.parentAttestationId.length > 0
      && typeof b.content === "string" && hash(b.content) === b.artifactSha256, "source image tuple/raw bytes");
    const approval = Object.hasOwn(e, "approval") ? parseNextContextApprovalV1(e.approval) : undefined;
    if (approval) check(approval.missionId === p.missionId && approval.runFingerprint === p.runFingerprint && approval.planFingerprint === p.planFingerprint && approval.bindingFingerprint === p.bindingFingerprint
      && approval.policySha256 === p.policySha256 && approval.grantId === g.id && approval.producerUnitId === b.producerUnitId && approval.producerFunctionId === b.functionId
      && approval.commitId === b.commitId && approval.artifactId === b.artifactId && approval.artifactKind === b.artifactKind && approval.artifactSha256 === b.artifactSha256 && approval.knowledgeRevision === b.knowledgeRevision
      && approval.publicationLevel === b.publicationLevel && approval.consumerUnitId === p.unitId && approval.consumerFunctionId === g.consumerFunctionId && canonical(approval.roles) === canonical(g.roles)
      && approval.sourceBindingSha256 === fingerprint(b) && approval.parentAttestationId === b.parentAttestationId && approval.parentActorId === policy.ownerActorId && approval.parentAuthorityDigest === b.parentAuthorityDigest,
      "projection/approval exact tuple changed");
    check(canonical(e.file) === canonical(nextContextFileV1(p as unknown as NextContextProjectionV1, g, b, approval)) && !paths.has(e.file.path), "exact derived input file"); paths.add(e.file.path);
  }
  const expected = policy.grants.filter(g => g.consumerUnitId === p.unitId).map(g => g.id).sort();
  check(canonical([...ids].sort()) === canonical(expected), "projection requires every exact consumer grant");
  const { fingerprint: _fingerprint, ...body } = p; check(fingerprint(body) === p.fingerprint, "projection digest");
  return structuredClone(p) as unknown as NextContextProjectionV1;
}
/** Only this role's files and references cross the worker boundary, never the
 * family image, other-role entries, source documents or their shared digest. */
export function nextContextRoleFilesV1(raw: NextContextProjectionV1, functionId: string, role: string): ArtifactFile[] {
  const p = parseNextContextProjectionV1(raw);
  return p.entries.filter(e => e.roles.includes(role as Role) && p.policy.grants.find(g => g.id === e.grantId)!.consumerFunctionId === functionId).map(e => structuredClone(e.file));
}
export function acquireNextContextInputsV1(bundle: InputBundle, image: NextContextProjectionV1, functionId: string): InputBundle {
  const files = nextContextRoleFilesV1(image, functionId, bundle.role); if (!files.length) return structuredClone(bundle);
  const merge = (base: ArtifactFile[]) => {
    const byPath = new Map(base.map(f => [f.path, f]));
    for (const f of files) { const old = byPath.get(f.path); check(!old || canonical(old) === canonical(f), "conflicting projected input path"); byPath.set(f.path, f); }
    return structuredClone([...byPath.values()]).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  };
  const knowledgeFiles = merge(bundle.knowledge.files), view = { baseVersion: bundle.knowledge.version, baseFingerprint: bundle.knowledge.fingerprint, files };
  const viewDigest = fingerprint(view);
  return { ...structuredClone(bundle), files: merge(bundle.files), knowledge: { ...structuredClone(bundle.knowledge), files: knowledgeFiles,
    version: `rms-next-context-input-view-v1:${viewDigest}`, fingerprint: fingerprint({ ...view, knowledgeFiles }) } };
}
/** Synchronous physical boundary. The caller checks CURRENT rights/fences before
 * and after EACH file; no await or callback receives the internal family image. */
export function materializeNextContextV1(raw: NextContextProjectionV1, assertCurrent: () => void): void {
  const image = parseNextContextProjectionV1(raw), root = image.policy.targetRoot;
  assertCurrent(); check(canonical(nextContextRootIdentityV1(image.policy)) === canonical(image.rootIdentity), "frozen input root replaced"); const rootStat = lstatSync(root);
  check(rootStat.isDirectory() && !rootStat.isSymbolicLink() && realpathSync(root) === root, "existing canonical parent-owned root required");
  const assertRoot = () => { const s = lstatSync(root); check(s.isDirectory() && !s.isSymbolicLink() && s.dev === rootStat.dev && s.ino === rootStat.ino && realpathSync(root) === root, "root changed"); };
  for (const entry of image.entries) {
    assertCurrent(); assertRoot(); const bytes = Buffer.from(entry.binding.content, "utf8"), path = entry.file.path;
    let fd: number;
    try { fd = openSync(path, "wx", 0o600); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; fd = -1; }
    if (fd !== -1) { try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); } }
    const before = lstatSync(path); check(before.isFile() && !before.isSymbolicLink(), "regular non-symlink input required");
    const readFd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const stat = fstatSync(readFd), actual = readFileSync(readFd), after = lstatSync(path);
      check(stat.isFile() && stat.dev === before.dev && stat.ino === before.ino && after.isFile() && !after.isSymbolicLink() && after.dev === stat.dev && after.ino === stat.ino
        && after.size === actual.length && actual.equals(bytes) && actual.length === bytes.length && hash(actual) === entry.file.sha256, "missing/divergent/existing input byte readback");
    } finally { closeSync(readFd); }
    assertRoot(); assertCurrent();
  }
}
/** Current admission checks READ the selected role's real files; never repair
 * missing or corrupt images, and never require today's files to inspect history. */
export function verifyNextContextRoleFilesV1(raw: NextContextProjectionV1, functionId: string, role: string): void {
  const image = parseNextContextProjectionV1(raw), root = image.policy.targetRoot, rootStat = lstatSync(root);
  check(canonical(nextContextRootIdentityV1(image.policy)) === canonical(image.rootIdentity), "frozen input root replaced");
  check(rootStat.isDirectory() && !rootStat.isSymbolicLink() && realpathSync(root) === root, "current input root changed");
  const selected = new Set(nextContextRoleFilesV1(image, functionId, role).map(f => f.path));
  for (const entry of image.entries.filter(e => selected.has(e.file.path))) {
    const before = lstatSync(entry.file.path); check(before.isFile() && !before.isSymbolicLink(), "current input must be regular non-symlink");
    const fd = openSync(entry.file.path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const stat = fstatSync(fd), bytes = readFileSync(fd), after = lstatSync(entry.file.path);
      check(stat.isFile() && stat.dev === before.dev && stat.ino === before.ino && after.isFile() && !after.isSymbolicLink() && after.dev === stat.dev && after.ino === stat.ino
        && after.size === bytes.length && bytes.equals(Buffer.from(entry.binding.content, "utf8")) && hash(bytes) === entry.file.sha256, "current input bytes missing/divergent");
    } finally { closeSync(fd); }
  }
  const after = lstatSync(root); check(after.isDirectory() && !after.isSymbolicLink() && after.dev === rootStat.dev && after.ino === rootStat.ino && realpathSync(root) === root, "current input root replaced");
}
