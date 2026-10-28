import { Database } from "bun:sqlite";
import { constants, existsSync, lstatSync, realpathSync } from "node:fs";
import { link, open, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, join, normalize, win32 } from "node:path";
import type { BinaryIdentity, ControllerContext, FunctionIdentity, PublicationAdapter, PublicationReceipt, PublicationRequest, ResultHeader } from "./domain";
import { canonical, exactPath, fingerprint, hash, identityKey, normalizeEA, validateIdentity, validateSHA } from "./validation";

/** Configured, owned native supervisor identity; never taken from a worker request. */
export interface NativeSupervisorRef { sessionID: string; profile: string; directory: string }
/** Parent-provided native execution primitive; there is no HTTP or shell fallback. */
export interface NativeToolCaller {
  call(toolId: string, input: { code: string }, nativeSupervisorRef?: NativeSupervisorRef): Promise<unknown>;
}
/** Mandatory native checks from HANDOFF §5.6, evaluated by the supervisor. */
export type NativeGateCheck = "callees-cdecl" | "callers-code-data" | "expanded-strides" | "signedness" | "return-width" | "name-evidence";
/** Recheckable native instruction or xref, not a worker's evidence prose. */
export type NativeGateEvidence =
  { id: string; kind: "asm"; ea: string; bytesHex: string; disassembly: string } |
  { id: string; kind: "xref"; from: string; to: string; isCode: boolean; type: number };
/** Versioned native gate supplied exclusively by the trusted supervisor binding. */
export interface NativeGateAttestation {
  schemaVersion: 1; supervisor: NativeSupervisorRef; capturedAt: string;
  identity: FunctionIdentity; resultHash: string; inputFingerprint: string;
  inputVersions: ResultHeader["inputVersions"];
  targetId: string; docsDirectory: string; idbPath: string;
  functionBytesSha256: string; expectedCommentHash: string; targetRevision: number;
  evidence: NativeGateEvidence[];
  checks: Array<{ check: NativeGateCheck; evidenceIds: string[]; conclusion: string }>;
}
/** Injected docs persistence must be write-once and reopen the exact bound path. */
export interface PublicationDocs {
  writeOnce(path: string, content: string): Promise<void>;
  read(path: string): Promise<string>;
}
/** Trusted operator configuration, separate from publication/science inputs. */
export interface IdaPublicationOptions {
  databasePath: string; docsDirectory: string; idbPath: string; targetId: string;
  binary: BinaryIdentity; publicationDate: string; initialRevision?: number;
  nativeSupervisorRef: NativeSupervisorRef; nativeToolId: string; nativeToolCaller: NativeToolCaller;
  attest(request: PublicationRequest, supervisor: NativeSupervisorRef): Promise<NativeGateAttestation | undefined>;
  /** Must verify current controller ownership/fencing; no permissive default is provided. */
  authorizeController(controller: ControllerContext, request: PublicationRequest): Promise<void>;
  docs?: PublicationDocs;
}
/** Distinguishes binding/permission failure from conflict, gate, save and docs errors. */
export class PublicationError extends Error {
  constructor(public readonly code: "conflict" | "gate" | "save" | "docs" | "binding-unavailable" | "native-tool-denied", message: string) { super(`${code}: ${message}`); this.name = "PublicationError"; }
}
/** Native file-status proof acquired in the same IDA context as comment readback. */
export interface NativeDatabaseStatus { exists: true; size: number; sha256: string }
interface NativeState { idbPath: string; binarySha256: string; functionBytesSha256: string; comment: string; evidenceVerified: boolean; databaseStatus: NativeDatabaseStatus; saveOk?: boolean }
interface Plan {
  request: PublicationRequest; requestHash: string; requestId: string; block: string;
  docsPath: string; docsContent?: string; docsHash?: string; gate?: NativeGateAttestation;
  expectedComment?: string; nextComment?: string; saved?: boolean; saveProof?: NativeDatabaseStatus; receipt?: PublicationReceipt;
}
interface PlanRow { body: string }
const requiredChecks: NativeGateCheck[] = ["callees-cdecl", "callers-code-data", "expanded-strides", "signedness", "return-width", "name-evidence"];
function requirePublication(ok: unknown, code: PublicationError["code"], message: string): asserts ok { if (!ok) throw new PublicationError(code, message); }
function samePath(a: string, b: string): boolean { return /^[a-z]:[\\/]/i.test(a) || /^[a-z]:[\\/]/i.test(b) ? win32.normalize(a).toLowerCase() === win32.normalize(b).toLowerCase() : normalize(a) === normalize(b); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

/** Stable trace identifier derived from the complete immutable publication request. */
export function publicationRequestId(request: PublicationRequest): string { return fingerprint(request); }

function validateGate(gate: NativeGateAttestation | undefined, plan: Plan, options: IdaPublicationOptions): asserts gate is NativeGateAttestation {
  requirePublication(gate && gate.schemaVersion === 1, "gate", "native supervisor attestation is required");
  requirePublication(canonical(gate.supervisor) === canonical(options.nativeSupervisorRef), "gate", "native supervisor identity mismatch");
  requirePublication(Number.isFinite(Date.parse(gate.capturedAt)), "gate", "native capture timestamp required");
  requirePublication(identityKey(validateIdentity(gate.identity, options.binary)) === identityKey(plan.request.identity), "gate", "native gate identity mismatch");
  requirePublication(gate.resultHash === plan.request.resultHash && gate.inputFingerprint === plan.request.document.inputFingerprint && canonical(gate.inputVersions) === canonical(plan.request.document.inputVersions), "gate", "native gate result/input versions mismatch");
  requirePublication(gate.targetId === plan.request.targetId && samePath(gate.docsDirectory, options.docsDirectory) && samePath(gate.idbPath, options.idbPath) && gate.targetRevision === plan.request.expectedRevision, "gate", "native gate target/directory/revision mismatch");
  validateSHA(gate.functionBytesSha256); validateSHA(gate.expectedCommentHash);
  requirePublication(Array.isArray(gate.evidence) && gate.evidence.length > 0 && Array.isArray(gate.checks), "gate", "native proof missing");
  const ids = new Set<string>();
  for (const proof of gate.evidence) {
    requirePublication(proof.id && !ids.has(proof.id), "gate", "duplicate native proof id"); ids.add(proof.id);
    if (proof.kind === "asm") {
      normalizeEA(proof.ea);
      requirePublication(/^(?:[0-9a-f]{2})+$/i.test(proof.bytesHex) && proof.bytesHex.length <= 32 && typeof proof.disassembly === "string" && proof.disassembly.trim(), "gate", "native opcode bytes/disassembly required");
    } else {
      requirePublication(proof.kind === "xref" && typeof proof.isCode === "boolean" && Number.isSafeInteger(proof.type), "gate", "native xref code/DATA/type required");
      normalizeEA(proof.from); normalizeEA(proof.to);
    }
  }
  requirePublication(gate.checks.length === requiredChecks.length && new Set(gate.checks.map(c => c.check)).size === requiredChecks.length, "gate", "incomplete/duplicate §5.6 checks");
  for (const check of requiredChecks) {
    const fact = gate.checks.find(c => c.check === check);
    requirePublication(fact && typeof fact.conclusion === "string" && fact.conclusion.trim() && Array.isArray(fact.evidenceIds) && fact.evidenceIds.length > 0 && fact.evidenceIds.every(id => ids.has(id)), "gate", `native proof required: ${check}`);
    const distinct = new Set(fact.evidenceIds.map(id => { const proof = gate.evidence.find(e => e.id === id)!; const { id: _id, ...observation } = proof; return canonical(observation); }));
    requirePublication(check !== "name-evidence" || distinct.size >= 2, "gate", "name requires at least two distinct ASM/xref observations");
  }
}

function openPublicationDatabase(path: string): Database {
  exactPath(path);
  requirePublication(basename(path).replace(/[ .]+$/, "").toLowerCase() !== "ensemble.db" && (!existsSync(path) || basename(realpathSync(path)).toLowerCase() !== "ensemble.db"), "conflict", "ensemble.db is forbidden");
  const db = new Database(path, { create: true, strict: true });
  try {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
    const owned = new Set(["ff8_ida_publication_metadata", "ff8_ida_publication_targets", "ff8_ida_publication_plans"]);
    requirePublication(tables.every(t => owned.has(t.name)) && (!tables.length || tables.some(t => t.name === "ff8_ida_publication_metadata")), "conflict", "foreign SQLite schema");
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS ff8_ida_publication_metadata(version INTEGER NOT NULL, binding_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ff8_ida_publication_targets(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, pending TEXT);
      CREATE TABLE IF NOT EXISTS ff8_ida_publication_plans(id TEXT PRIMARY KEY, body TEXT NOT NULL);`);
    return db;
  } catch (error) { db.close(); throw error; }
}

/** Decode native py_eval output, including the standard MCP text/result envelope. */
export function decodeNativePublicationState(value: unknown): NativeState {
  const candidates: unknown[] = [value];
  for (let i = 0; i < candidates.length && i < 20; i++) {
    const candidate = candidates[i];
    if (record(candidate)) {
      if (typeof candidate.stderr === "string" && candidate.stderr.trim()) throw new PublicationError("gate", `native Python error: ${candidate.stderr}`);
      if (typeof candidate.error === "string" && candidate.error) throw new PublicationError("conflict", candidate.error);
      if (typeof candidate.idbPath === "string" && typeof candidate.binarySha256 === "string" && typeof candidate.functionBytesSha256 === "string" && typeof candidate.comment === "string" && typeof candidate.evidenceVerified === "boolean" && record(candidate.databaseStatus)) {
        const status = candidate.databaseStatus;
        requirePublication(status.exists === true && typeof status.size === "number" && Number.isSafeInteger(status.size) && status.size > 0, "conflict", "native IDB on-disk status unavailable");
        validateSHA(status.sha256);
        return { idbPath: candidate.idbPath, binarySha256: candidate.binarySha256, functionBytesSha256: candidate.functionBytesSha256, comment: candidate.comment, evidenceVerified: candidate.evidenceVerified, databaseStatus: { exists: true, size: status.size, sha256: status.sha256 }, saveOk: candidate.saveOk === true };
      }
      for (const key of ["result", "stdout", "text", "content"]) if (candidate[key] !== undefined) candidates.push(candidate[key]);
    } else if (Array.isArray(candidate)) candidates.push(...candidate);
    else if (typeof candidate === "string") {
      try { candidates.push(JSON.parse(candidate) as unknown); continue; } catch { /* Try native stdout next, not an embedded JSON envelope's escaped marker. */ }
      const marker = "FF8_PUBLICATION_V1:";
      const payload = candidate.includes(marker) ? candidate.slice(candidate.lastIndexOf(marker) + marker.length).trim().split("\n")[0] : candidate;
      try { candidates.push(JSON.parse(payload) as unknown); } catch { /* No fabricated native state from non-JSON prose. */ }
    }
  }
  throw new PublicationError("binding-unavailable", "native py_eval did not return a verifiable publication state");
}

/** Build only inspect, CAS append or save py_eval; it never renames/types/patches. */
export function buildNativePublicationCode(operation: "inspect" | "append" | "save", gate: NativeGateAttestation, expectedComment?: string, nextComment?: string): string {
  const command = { operation, gate, expectedComment, nextComment };
  return `# ff8-publication ${canonical(command)}
import hashlib, json, os
import ida_bytes, ida_funcs, ida_nalt, idautils, idc
_p = json.loads(${JSON.stringify(canonical(command))})
_g = _p['gate']
_ea = int(_g['identity']['ea'], 16)
def _observe():
    _path = idc.get_idb_path()
    if os.path.normcase(os.path.abspath(_path)) != os.path.normcase(os.path.abspath(_g['idbPath'])):
        raise RuntimeError('IDB path conflict before observation')
    _f = ida_funcs.get_func(_ea)
    if _f is None or _f.start_ea != _ea:
        raise RuntimeError('function boundary conflict')
    _h = hashlib.sha256()
    for _s, _e in idautils.Chunks(_ea):
        _b = ida_bytes.get_bytes(_s, _e - _s)
        if _b is None or len(_b) != _e - _s:
            raise RuntimeError('native function bytes unavailable')
        _h.update(int(_s).to_bytes(8, 'little'))
        _h.update(int(_e).to_bytes(8, 'little'))
        _h.update(_b)
    _sha = ida_nalt.retrieve_input_file_sha256()
    if isinstance(_sha, bytes):
        _sha = _sha.hex()
    _proof = True
    for _v in _g['evidence']:
        if _v['kind'] == 'asm':
            _a = int(_v['ea'], 16)
            _b = ida_bytes.get_bytes(_a, len(_v['bytesHex']) // 2)
            _proof = _proof and _b is not None and _b.hex().lower() == _v['bytesHex'].lower()
            _proof = _proof and idc.generate_disasm_line(_a, 0) == _v['disassembly']
        else:
            _proof = _proof and any(_x.frm == int(_v['from'], 16) and _x.to == int(_v['to'], 16) and bool(_x.iscode) == _v['isCode'] and _x.type == _v['type'] for _x in idautils.XrefsTo(int(_v['to'], 16), 0))
    _stat_before = os.stat(_path)
    _disk = hashlib.sha256()
    with open(_path, 'rb') as _file:
        for _part in iter(lambda: _file.read(1024 * 1024), b''):
            _disk.update(_part)
    _stat_after = os.stat(_path)
    if (_stat_before.st_size, _stat_before.st_mtime_ns, _stat_before.st_ino) != (_stat_after.st_size, _stat_after.st_mtime_ns, _stat_after.st_ino):
        raise RuntimeError('IDB disk changed during readback')
    _status = {'exists': os.path.isfile(_path), 'size': _stat_after.st_size, 'sha256': _disk.hexdigest()}
    return {'idbPath': _path, 'binarySha256': str(_sha).lower(), 'functionBytesSha256': _h.hexdigest(), 'comment': idc.get_func_cmt(_ea, 0) or '', 'evidenceVerified': bool(_proof), 'databaseStatus': _status}
def _guard(_s):
    if os.path.normcase(os.path.abspath(_s['idbPath'])) != os.path.normcase(os.path.abspath(_g['idbPath'])):
        raise RuntimeError('IDB path conflict')
    if _s['binarySha256'] != _g['identity']['sha256'].lower() or _s['functionBytesSha256'] != _g['functionBytesSha256'] or not _s['evidenceVerified']:
        raise RuntimeError('native hash/gate conflict')
_s = _observe()
_guard(_s)
if _p['operation'] == 'append':
    if _s['comment'] != _p['nextComment']:
        if _s['comment'] != _p['expectedComment'] or hashlib.sha256(_s['comment'].encode('utf-8')).hexdigest() != _g['expectedCommentHash']:
            raise RuntimeError('comment CAS conflict')
        if '[semantic-triple' in _s['comment']:
            raise RuntimeError('conflicting prior semantic tag')
        if not idc.set_func_cmt(_ea, _p['nextComment'], 0):
            raise RuntimeError('append failed')
    _s = _observe()
    _guard(_s)
elif _p['operation'] == 'save':
    if _s['comment'] != _p['expectedComment']:
        raise RuntimeError('comment CAS conflict before save')
    _ok = bool(idc.save_database(idc.get_idb_path()))
    _s = _observe()
    _guard(_s)
    _s['saveOk'] = _ok
print('FF8_PUBLICATION_V1:' + json.dumps(_s, sort_keys=True))`;
}

/** Real IDB+docs adapter. Actual execution and supervisor gate remain parent-owned. */
export class IdaPublicationAdapter implements PublicationAdapter {
  private readonly db: Database;
  private readonly options: IdaPublicationOptions;
  private readonly docs: PublicationDocs;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(options: IdaPublicationOptions) {
    this.options = { ...options, binary: structuredClone(options.binary), nativeSupervisorRef: structuredClone(options.nativeSupervisorRef) };
    exactPath(options.docsDirectory); exactPath(options.idbPath); exactPath(options.nativeSupervisorRef.directory);
    validateSHA(options.binary.sha256);
    requirePublication(options.targetId.startsWith("idb+docs:") && options.binary.version.trim(), "conflict", "explicit idb+docs target and binary version required");
    requirePublication(/^\d{4}-\d{2}-\d{2}$/.test(options.publicationDate) && new Date(`${options.publicationDate}T00:00:00Z`).toISOString().startsWith(options.publicationDate), "conflict", "explicit valid publication date required");
    requirePublication(/(?:^|[._-])py_eval$/.test(options.nativeToolId) && options.nativeSupervisorRef.sessionID.trim() && options.nativeSupervisorRef.profile.trim() && typeof options.attest === "function" && typeof options.authorizeController === "function" && typeof options.nativeToolCaller?.call === "function", "binding-unavailable", "owned supervisor, gate and permission-safe native py_eval binding required");
    this.assertDocsDirectory();
    this.docs = options.docs ?? {
      writeOnce: async (path, content) => {
        this.assertDocsDirectory();
        if (existsSync(path)) { requirePublication(!lstatSync(path).isSymbolicLink() && hash(await readFile(path)) === hash(content), "docs", "existing docs conflict"); return; }
        const staging = join(this.options.docsDirectory, `.ff8-publication-${randomUUID()}.pending`);
        const file = await open(staging, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
        try {
          try { await file.writeFile(content, "utf8"); await file.sync(); } finally { await file.close(); }
          try { await link(staging, path); } catch (error) {
            if (!record(error) || error.code !== "EEXIST") throw error;
            requirePublication(!lstatSync(path).isSymbolicLink() && hash(await readFile(path)) === hash(content), "docs", "concurrent docs conflict");
          }
        } finally { await unlink(staging); }
      },
      read: async path => { this.assertDocsDirectory(); requirePublication(!lstatSync(path).isSymbolicLink(), "docs", "docs symlink refused"); return await readFile(path, "utf8"); },
    };
    this.db = openPublicationDatabase(options.databasePath);
    try {
      const bindingHash = fingerprint({ targetId: options.targetId, idbPath: options.idbPath, docsDirectory: options.docsDirectory, binary: options.binary, nativeSupervisorRef: options.nativeSupervisorRef, nativeToolId: options.nativeToolId });
      this.db.transaction(() => {
        const meta = this.db.query("SELECT version,binding_hash FROM ff8_ida_publication_metadata").all() as Array<{ version: number; binding_hash: string }>;
        requirePublication(meta.length === 0 || (meta.length === 1 && meta[0].version === 1 && meta[0].binding_hash === bindingHash), "conflict", "publication binding/version changed");
        if (!meta.length) this.db.query("INSERT INTO ff8_ida_publication_metadata VALUES(1,?)").run(bindingHash);
        const revision = options.initialRevision ?? 0;
        requirePublication(Number.isSafeInteger(revision) && revision >= 0, "conflict", "invalid initial target revision");
        this.db.query("INSERT INTO ff8_ida_publication_targets(id,revision) VALUES(?,?) ON CONFLICT(id) DO NOTHING").run(options.targetId, revision);
      }).immediate();
    } catch (error) { this.db.close(); throw error; }
  }
  private assertDocsDirectory(): void {
    const path = this.options.docsDirectory;
    requirePublication(existsSync(path) && lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink() && samePath(realpathSync(path), path), "docs", "exact existing non-aliased docs directory required");
  }
  private serial<T>(work: () => Promise<T>): Promise<T> { const result = this.queue.then(work); this.queue = result.catch(() => {}); return result; }
  private load(id: string): Plan | undefined { const row = this.db.query("SELECT body FROM ff8_ida_publication_plans WHERE id=?").get(id) as PlanRow | null; return row ? JSON.parse(row.body) as Plan : undefined; }
  private persist(plan: Plan): void {
    this.db.transaction(() => {
      const current = this.load(plan.request.idempotencyKey);
      requirePublication(current && current.requestHash === plan.requestHash, "conflict", "durable publication plan changed");
      for (const key of ["gate", "expectedComment", "nextComment", "docsContent", "docsHash", "saveProof", "receipt"] as const) {
        requirePublication(current[key] === undefined || plan[key] === undefined || canonical(current[key]) === canonical(plan[key]), "conflict", `immutable publication plan ${key} changed`);
      }
      const merged = { ...current, ...plan, saved: current.saved || plan.saved, saveProof: current.saveProof ?? plan.saveProof, receipt: current.receipt ?? plan.receipt };
      this.db.query("UPDATE ff8_ida_publication_plans SET body=? WHERE id=?").run(canonical(merged), plan.request.idempotencyKey);
      Object.assign(plan, merged);
    }).immediate();
  }
  private plan(request: PublicationRequest): Plan {
    requirePublication(request.fixture === false && request.targetId === this.options.targetId, "conflict", "real adapter requires exact configured idb+docs target");
    validateIdentity(request.identity, this.options.binary);
    const doc = request.document;
    requirePublication(doc.kind === "reconciliation" && doc.decision === "certain" && fingerprint(doc) === request.resultHash && doc.missionId === request.missionId && doc.identity && identityKey(doc.identity) === identityKey(request.identity), "gate", "validated certain reconciliation required");
    const workerGate = doc.publicationGate;
    requirePublication(workerGate && workerGate.targetId === request.targetId && workerGate.targetRevision === request.expectedRevision && workerGate.evidence.length > 0 && [workerGate.nativeAsmChecked, workerGate.independentAuthors, workerGate.inputHashesVerified, workerGate.opcodeCoverageComplete, workerGate.abiChecked, workerGate.contradictionsResolved, workerGate.readbackPlan].every(value => value === true), "gate", "engine publication prerequisites missing (not native gate proof)");
    requirePublication(doc.contradictions.length === 0 && doc.questions.length === 0 && doc.propositions.length > 0 && doc.propositions.every(p => p.contradictions.length === 0 && p.questions.length === 0), "gate", "unresolved scientific result cannot publish");
    requirePublication(Number.isSafeInteger(request.expectedRevision) && request.expectedRevision >= 0 && request.idempotencyKey.trim(), "conflict", "explicit request ID and target CAS required");
    const requestHash = fingerprint(request);
    return this.db.transaction(() => {
      const prior = this.load(request.idempotencyKey);
      if (prior) { requirePublication(prior.requestHash === requestHash, "conflict", "idempotency key reused with altered request"); return prior; }
      const target = this.db.query("SELECT revision,pending FROM ff8_ida_publication_targets WHERE id=?").get(request.targetId) as { revision: number; pending: string | null };
      requirePublication(target.revision === request.expectedRevision && !target.pending, "conflict", "publication target CAS/pending conflict");
      const texts = doc.propositions.map(p => p.text);
      requirePublication(texts.every(t => typeof t === "string" && t.trim() && !t.includes("[semantic-triple")) && texts.length <= 5 && texts.join("\n").length <= 6000, "gate", "summary must be bounded, exact R prose without reserved tags");
      const requestId = publicationRequestId(request);
      const block = `[semantic-triple ${this.options.publicationDate}]\nrequest=${requestId}\nresult=${request.resultHash}\nCERTAIN; reconciliation=${JSON.stringify(request.reconciliationId)}\n${texts.join("\n")}`;
      const plan: Plan = { request: structuredClone(request), requestHash, requestId, block, docsPath: join(this.options.docsDirectory, `${normalizeEA(request.identity.ea)}__${requestId}.md`) };
      this.db.query("INSERT INTO ff8_ida_publication_plans VALUES(?,?)").run(request.idempotencyKey, canonical(plan));
      this.db.query("UPDATE ff8_ida_publication_targets SET pending=? WHERE id=?").run(request.idempotencyKey, request.targetId);
      return plan;
    }).immediate();
  }
  private async native(operation: "inspect" | "append" | "save", plan: Plan, controller: ControllerContext): Promise<NativeState> {
    await this.options.authorizeController(controller, plan.request);
    const state = decodeNativePublicationState(await this.options.nativeToolCaller.call(this.options.nativeToolId, { code: buildNativePublicationCode(operation, plan.gate!, operation === "save" ? plan.nextComment : plan.expectedComment, plan.nextComment) }, this.options.nativeSupervisorRef));
    requirePublication(samePath(state.idbPath, this.options.idbPath) && state.binarySha256 === this.options.binary.sha256.toLowerCase() && state.functionBytesSha256 === plan.gate!.functionBytesSha256, "conflict", "native IDB/binary/function hash changed");
    requirePublication(state.evidenceVerified === true, "gate", "native opcode/xref proof no longer matches");
    return state;
  }
  private async verify(plan: Plan, controller: ControllerContext): Promise<PublicationReceipt> {
    requirePublication(plan.receipt && plan.saved && plan.nextComment && plan.docsHash, "conflict", "receipt not acquired");
    const native = await this.native("inspect", plan, controller);
    requirePublication(native.comment === plan.nextComment, "conflict", "native comment readback changed");
    this.assertDocsDirectory();
    requirePublication(hash(await this.docs.read(plan.docsPath)) === plan.docsHash, "docs", "docs reopened hash mismatch");
    return structuredClone(plan.receipt);
  }
  /** Publish or resume the same durable request; no worker science is rerun on retry. */
  async publish(request: PublicationRequest, controller: ControllerContext): Promise<PublicationReceipt> {
    return this.serial(async () => {
      await this.options.authorizeController(controller, request);
      const plan = this.plan(request); // Durable reservation before gate/native/docs I/O.
      if (plan.receipt) return await this.verify(plan, controller);
      if (!plan.gate) {
        const gate = await this.options.attest(structuredClone(request), this.options.nativeSupervisorRef);
        validateGate(gate, plan, this.options); plan.gate = structuredClone(gate); this.persist(plan);
      }
      validateGate(plan.gate, plan, this.options);
      const before = await this.native("inspect", plan, controller);
      requirePublication(!plan.saved || canonical(before.databaseStatus) === canonical(plan.saveProof), "conflict", "saved IDB disk status/hash changed while publication pending");
      if (plan.nextComment === undefined) {
        requirePublication(hash(before.comment) === plan.gate.expectedCommentHash && !before.comment.includes("[semantic-triple"), "conflict", "comment CAS or conflicting semantic tag");
        plan.expectedComment = before.comment;
        const proofs = plan.gate.evidence.slice(0, 8).map(e => e.kind === "asm" ? `ASM ${e.ea}: ${e.disassembly}` : `XREF ${e.from}->${e.to}: ${e.isCode ? "code" : "DATA"}, type=${e.type}`);
        const taggedBlock = `${plan.block}\ngate=${fingerprint(plan.gate)}\n${proofs.join("\n")}`;
        requirePublication(taggedBlock.split("\n").length <= 15, "gate", "append summary exceeds the §5.7 fifteen-line bound");
        plan.nextComment = `${before.comment}${before.comment ? "\n" : ""}${taggedBlock}`;
        plan.docsContent = `# FF8 semantic publication @ ${request.identity.ea}\n\nTarget: ${request.targetId}\nRequest: ${plan.requestId}\nResult: ${request.resultHash}\nNative gate: ${fingerprint(plan.gate)}\n\n## Reconciled result (unchanged)\n\n${request.document.kind === "reconciliation" ? request.document.propositions.map(p => p.text).join("\n\n") : ""}\n\n## Trace\n\n\`\`\`json\n${canonical({ request, nativeGate: plan.gate, expectedCommentHash: plan.gate.expectedCommentHash, commentHash: hash(plan.nextComment) })}\n\`\`\`\n`;
        plan.docsHash = hash(plan.docsContent); this.persist(plan); // Exact CAS preimage + docs plan before mutation.
      }
      requirePublication(before.comment === plan.expectedComment || before.comment === plan.nextComment, "conflict", "native comment CAS conflict");
      if (before.comment !== plan.nextComment) {
        const appended = await this.native("append", plan, controller);
        requirePublication(appended.comment === plan.nextComment, "conflict", "native append readback mismatch");
      }
      if (!plan.saved) {
        const saved = await this.native("save", plan, controller);
        requirePublication(saved.saveOk === true && saved.comment === plan.nextComment, "save", "native save failed; retry same plan");
        const reread = await this.native("inspect", plan, controller);
        requirePublication(reread.comment === plan.nextComment, "conflict", "native post-save readback mismatch");
        requirePublication(canonical(saved.databaseStatus) === canonical(reread.databaseStatus), "conflict", "IDB disk readback changed after save");
        plan.saved = true; plan.saveProof = reread.databaseStatus; this.persist(plan);
      }
      this.assertDocsDirectory();
      await this.options.authorizeController(controller, plan.request);
      await this.docs.writeOnce(plan.docsPath, plan.docsContent!);
      requirePublication(hash(await this.docs.read(plan.docsPath)) === plan.docsHash, "docs", "docs reopened hash mismatch");
      // Native state is checked again after docs I/O, before receipt acquisition.
      const finalNative = await this.native("inspect", plan, controller);
      requirePublication(finalNative.comment === plan.nextComment && canonical(finalNative.databaseStatus) === canonical(plan.saveProof), "conflict", "native IDB/comment changed during docs persistence");
      await this.options.authorizeController(controller, plan.request);
      return this.db.transaction(() => {
        const current = this.load(request.idempotencyKey)!;
        if (current.receipt) return structuredClone(current.receipt);
        const updated = this.db.query("UPDATE ff8_ida_publication_targets SET revision=revision+1,pending=NULL WHERE id=? AND revision=? AND pending=?").run(request.targetId, request.expectedRevision, request.idempotencyKey);
        requirePublication(updated.changes === 1, "conflict", "receipt target CAS conflict");
        plan.receipt = { idempotencyKey: request.idempotencyKey, targetId: request.targetId, revision: request.expectedRevision + 1, resultHash: request.resultHash };
        this.persist(plan); return structuredClone(plan.receipt);
      }).immediate();
    });
  }
  /** Verify acquired receipt against current native IDB and reopened docs, not memory. */
  async readback(receipt: PublicationReceipt, controller: ControllerContext): Promise<PublicationReceipt> {
    return this.serial(async () => {
      const plan = this.load(receipt.idempotencyKey);
      requirePublication(plan && canonical(plan.receipt) === canonical(receipt), "conflict", "unknown or altered publication receipt");
      await this.options.authorizeController(controller, plan.request); return await this.verify(plan, controller);
    });
  }
  /** Close only this adapter's own receipt database after outstanding calls complete. */
  close(): void { this.db.close(); }
}
