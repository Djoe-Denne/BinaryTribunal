// AUTH231 CANDIDATE. Importing starts nothing. Native PARENT Prepare act only.
import { readFileSync, openSync, writeSync, fsyncSync, closeSync, lstatSync, realpathSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, win32 } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Database } from 'bun:sqlite';
const HERE = dirname(fileURLToPath(import.meta.url)), MISSION = dirname(HERE);
const C = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198/tools/ff8-harness';
const HOST = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const BUN = 'C:/Users/djden/.bun/bin/bun.exe';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v)
  ? '[' + v.map(canonical).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
const need = ok => { if (!ok) throw new Error('AUTH_PREPARE_REFUSED'); };
function write(p, v) {
  const bytes = Buffer.from(JSON.stringify(v, null, 2)), fd = openSync(p, 'wx', 0o600);
  try { let offset = 0, calls = 0;
    while (offset < bytes.length) { need(calls++ < 4096); const n = writeSync(fd, bytes, offset, bytes.length - offset, null);
      need(Number.isInteger(n) && n > 0 && n <= bytes.length - offset); offset += n; }
    fsyncSync(fd);
  } finally { closeSync(fd); }
  identity(p); need(readFileSync(p).equals(bytes));
  return { path: p.replaceAll('\\', '/'), byteLength: bytes.length, sha256: sha(bytes) };
}
const qi = s => '"' + s.replaceAll('"', '""') + '"';
function key(p) {
  need(typeof p === 'string' && /^[A-Za-z]:[\\/]/.test(p)); const parts = p.slice(3).split(/[\\/]/);
  need(parts.every(s => s && s !== '.' && s !== '..' && !/[<>:"|?*\u0000-\u001f]/.test(s) && !/[. ]$/.test(s)));
  return (p.slice(0, 2) + '/' + parts.join('/')).toLowerCase();
}
function identity(path, directory = false) {
  const s = lstatSync(path, { bigint: true }); need((directory ? s.isDirectory() : s.isFile()) && !s.isSymbolicLink() && key(realpathSync(path)) === key(path)
    && typeof s.dev === 'bigint' && typeof s.ino === 'bigint' && s.ino > 0n);
  return { encoding: 'decimal-bigint-v1', devDecimal: s.dev.toString(), inoDecimal: s.ino.toString() };
}
function pin(path, digest, length) {
  const a = lstatSync(path, { bigint: true }); identity(path); const bytes = readFileSync(path), z = lstatSync(path, { bigint: true });
  need(a.dev === z.dev && a.ino === z.ino && a.size === z.size && a.mtimeNs === z.mtimeNs && a.ctimeNs === z.ctimeNs
    && sha(bytes) === digest && (length === undefined || bytes.length === length));
  return { path: path.replaceAll('\\', '/'), byteLength: bytes.length, sha256: digest };
}
const PRODUCT = {
  'src/client.ts': '7266a3affea1caa06b481b721e0c8ac1209166d997673652b6a93a4fffd5ae71',
  'src/native-runtime-transport.ts': '79dd1ef42162a3780eee9926167cc509f3dee96a4becda4c495f048880ac6f39',
  'src/graph-runtime-binding.ts': 'cbe0c5a9f56dde4ffe35eaa5d7290c5f24098ff64e7d6df7d70f6d6f520ea67e',
  'src/graph-store.ts': '8969c150273f3ec1b87fe66153c2fd48c5a825d32278e2e9c7d9dd3f523fb146',
  'test/client.test.ts': 'c64568d2e8e309b36ad4036a545353dc58e27d76c884ad2dd9b13ffcdbc761fd',
  'test/runtime-binding.test.ts': '3137556b476897ad421697b994a97aa53ef614515a89530958f30c4d3d6eb41c',
};
const SUPPORT = { 'src/store.ts': 'e40958217aa7a170e8968dc214aa3d8d95a5ea2097de39468f5ba2d219dce1fe',
  'src/validation.ts': '9f15f63c8c5b7ca39a3729be59b866f68f7ff6dc1f15655b0cb569d1498acb50',
  'src/re-policy.ts': 'c3714c3120d3e8f87a044ef6857ca40c41900a6c74647d1bfdc6205371dfc365' };
function hostProvenance() {
  return { version: 'rms-owned-auth-provenance-v1', base: {
    version: 'rms-owned-npm-host-provenance-v1', runtime: { name: 'bun', version: '1.4.2', executable:
      pin(BUN, '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4', 86096984) },
    rawSource: { meaning: 'PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL', archive: pin(join(HOST, 'provenance/server-2.2.1.tgz'), '216d297fe87af4f1937c85cdcfae6ae552edc72eaa1f43305defe150c439bc8f', 62480) },
    closure: { archives: pin(join(HOST, 'provenance/archives.json'), '329b744c3520380553e68331cc203f14b1d8995fc49e2f09de6c1532f38c938e', 350336),
      installed: pin(join(HOST, 'provenance/installed-files.json'), '5e03043e9d68835d5a0bc5b6ee9d627c20e63202c36ddaf9756fb6db5dc80708', 5991608), archiveCount: 367, fileCount: 32227 },
    bootstrap: pin(join(HOST, 'bootstrap-host.mjs'), 'e25c43c7b4b2fd9a9f1dba7ece1dcc42d27a7650ee3444f9b2c2eec340cf9a99', 10061),
    plan: pin(join(HOST, 'host-plan.json'), '5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67', 16302),
    custodyPolicy: { version: 'rms-owned-http-readonly-policy-v1', rawTargets: ['/api/info', '/openapi.json'], nativeOptions204: true, post: 'DENY_ALL' } },
    bootstrap: pin(join(HOST, 'bootstrap-auth-v1.mjs'), '398a184afe71dc0b7abe41cb0fe1c47a7db0ef0b4b4667c618d009e188c76f76', 10124),
    plan: pin(join(HOST, 'host-plan-auth-v1.json'), '2fdeb0e560621963b9bc53334a7e5b05788ce16b345febbbd28c3c17eac1d880', 1329) };
}
function observeOwn(cfg, prepared) {
  const ownIdentity = identity(cfg.ownPath), db = new Database(cfg.ownPath, { readonly: true, strict: true });
  try { return db.transaction(() => {
    need(db.query('SELECT count(*) AS n FROM ff8_missions').get().n === 1);
    const schema = db.query("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
    const tables = schema.filter(x => x.type === 'table'); need(tables.length === 37); const tableDigests = {};
    for (const { name } of tables) {
      const cols = db.query('PRAGMA table_info(' + qi(name) + ')').all().map(x => x.name);
      const rows = db.query('SELECT ' + cols.map(c => (name === 'ff8_missions' && ['lease_owner', 'lease_token', 'lease_until'].includes(c)
        ? "'LEASE_EXCLUDED'" : 'quote(' + qi(c) + ')') + ' AS ' + qi(c)).join(',') + ' FROM ' + qi(name)).all().map(x => canonical(x)).sort();
      tableDigests[name] = { rows: rows.length, sha256: sha(canonical(rows)) };
    }
    const parent = db.query('SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?').get(cfg.missionId);
    need(parent && parent.document === canonical(prepared.state.parentIdentity) && sha(parent.document) === parent.digest
      && JSON.parse(parent.document).sourceHash === 'ff2eed3ba0834d4867fddadb86e9e698e51774ccc32c54acb38660d8dc08e3e8');
    const pe = db.query('SELECT kind,payload FROM ff8_events WHERE mission=? AND key=?').get(cfg.missionId, parent.event_key);
    need(pe?.kind === 'parent_authority_bootstrapped' && pe.payload === parent.document && parent.event_key === prepared.state.parentEventKey);
    const roots = db.query('SELECT root_id,revision,document,digest,lineage FROM ff8_graph_native_roots WHERE mission=?').all(cfg.missionId);
    need(roots.length === 1 && roots[0].root_id === prepared.state.roots[0].rootId && roots[0].revision === 3 && sha(roots[0].document) === roots[0].digest);
    const root = JSON.parse(roots[0].document); need(root.origins.length === 1 && root.slots.length === 1 && typeof root.lineageId === 'string'
      && root.lineageId === roots[0].lineage && root.rootAccountId === roots[0].root_id && root.missionId === cfg.missionId && root.revision === 3);
    const events = db.query('SELECT mission,sequence,time,key,kind,unit_id,payload,digest FROM ff8_events ORDER BY mission,sequence').all();
    need(events.every(e => e.mission === cfg.missionId));
    const stream = db.query('SELECT mission,sequence,time FROM ff8_graph_streams ORDER BY mission').all();
    need(stream.length === 1 && stream[0].mission === cfg.missionId && stream[0].sequence === events.length);
    need(canonical(identity(cfg.ownPath)) === canonical(ownIdentity));
    return { schemaSha256: sha(canonical(schema)), tableDigests, ownIdentity,
      lease: db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId),
      events: { count: events.length, prefixSha256: sha(canonical(events)), sequence: stream[0].sequence, time: stream[0].time },
      root: { id: roots[0].root_id, revision: 3, documentSha256: roots[0].digest, lineageSha256: sha(root.lineageId), origins: 1, slots: 1 }, parentDigest: parent.digest };
  })(); } finally { db.close(); }
}
async function main() {
  need(process.versions.bun === '1.4.2' && process.platform === 'win32' && process.execArgv.length === 0 && process.argv.length === 4);
  const [id, priorText] = process.argv.slice(2); need(UUID.test(id) && /^[1-9][0-9]*$/.test(priorText));
  const priorFence = Number(priorText); need(Number.isSafeInteger(priorFence));
  const out = join(HERE, `attempt-${id}`), markerPath = join(HERE, `prepare-${id}.marker.json`);
  const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
  need(marker.version === 'rms-auth-native-prepare-marker-v1' && marker.intentId === id && marker.expectedPriorFence === priorFence
    && Number.isSafeInteger(marker.preparedAt) && marker.deadlineAt === marker.preparedAt + 240000 && Date.now() < marker.deadlineAt
    && !existsSync(join(out, 'controller-act.json')) && !existsSync(join(out, 'lease-claim.json')));
  for (const [name, digest] of Object.entries({ ...PRODUCT, ...SUPPORT })) pin(join(C, name), digest);
  pin(join(MISSION, 'auth-parent-225/private-ui-relay-v1.mjs'), '8518b843eab468c34c1b0060f61c06e98cbe499c08079992d718e529c0674053', 11439);
  pin(join(MISSION, 'auth-parent-225/private-ui-window-v1.ps1'), '230f1855d3ffc753def468f5321c4325e864002f668c93decf86d199e22d212f', 9775);
  const cfgPath = join(MISSION, 'operational-168-output/native-request.json'), metaPath = join(MISSION, 'evidence/owned-runtime-authority-preparation-205.json');
  pin(cfgPath, '0ca064d28ec9ec0be2f6ec46b98f16ef0a054517707ffa59e57d32cc1562071e', 2937);
  pin(metaPath, '9a7b8ee68340d5a25d2f1000ce6bc5be50338f71c5205e316f3bd64e0070b052', 2210);
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8')), prepared = JSON.parse(readFileSync(metaPath, 'utf8'));
  need(cfg.missionId === 'rms-qualification-6356b01f78a79192' && cfg.ownPath === prepared.ownPath && cfg.controllerId === prepared.expectedControllerId
    && cfg.principalId === prepared.expectedPrincipalId && cfg.actorId === prepared.expectedActorId && canonical(cfg.mandateRef) === canonical(prepared.mandateRef));
  const privateRoot = join(HOST, `auth-private-${id}`), privateRootIdentity = identity(privateRoot, true); need(readdirSync(privateRoot).length === 0);
  need(key(process.execPath) === key(BUN)); const provenance = hostProvenance();
  const before = observeOwn(cfg, prepared); need(before.lease.lease_owner === cfg.controllerId && before.lease.lease_token === priorFence);
  write(join(out, 'before-prepare.json'), before); let store;
  try {
    const { Store } = await import(pathToFileURL(join(C, 'src/store.ts')).href); store = new Store(cfg.ownPath);
    need(canonical(observeOwn(cfg, prepared)) === canonical(before) && Date.now() < marker.deadlineAt);
    write(join(out, 'lease-claim.json'), { version: 'rms-auth-lease-claim-v1', intentId: id, expectedPriorFence: priorFence, ttlMs: 300000, automaticRetry: false });
    const acquiredAt = Date.now();
    const lease = store.db.transaction(() => {
      const r = store.db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId);
      need(r && canonical(r) === canonical(before.lease));
      const l = store.acquireLease(cfg.missionId, cfg.controllerId, acquiredAt, 300000); need(l.token === priorFence + 1); return l;
    }).immediate();
    const after = observeOwn(cfg, prepared);
    need(after.schemaSha256 === before.schemaSha256 && canonical(after.tableDigests) === canonical(before.tableDigests) && canonical(after.ownIdentity) === canonical(before.ownIdentity)
      && after.lease.lease_token === lease.token && after.lease.lease_until === lease.expiresAt && after.lease.lease_owner === cfg.controllerId && Date.now() < marker.deadlineAt);
    const request = { version: 'rms-parent-owned-auth-request-v1', purpose: 'connect-owned-openai-auth-v1', missionId: cfg.missionId, ownPath: cfg.ownPath,
      controllerId: cfg.controllerId, principalId: cfg.principalId, actorId: cfg.actorId, mandateRef: cfg.mandateRef, expiresAt: marker.deadlineAt,
      expectedControllerFence: lease.token, intentId: id, ui: 'private-parent-ipc-v1', connection: { kind: 'owned-bun-openai-auth-v1', namespace: HOST, provenance } };
    write(join(out, 'after-prepare.json'), after); write(join(out, 'request-auth-v1.json'), request);
    write(join(out, 'controller-act.json'), { version: 'rms-auth-controller-act-v1', status: 'PREPARED_NO_AUTH_CONNECT', intentId: id, preparedAt: marker.preparedAt,
      deadlineAt: marker.deadlineAt, acquiredAt, lease, expectedPriorFence: priorFence, ownIdentity: before.ownIdentity, privateRootIdentity,
      sourcePins: PRODUCT, supportingPins: SUPPORT, requestSha256: sha(readFileSync(join(out, 'request-auth-v1.json'))),
      afterSnapshotSha256: sha(readFileSync(join(out, 'after-prepare.json'))), unchangedExceptLease: true, modelPermitReactivated: false, newRmsOrigins: 0 });
    console.log(JSON.stringify({ status: 'PREPARED_NO_AUTH_CONNECT', intentId: id, fence: lease.token, expiresAt: marker.deadlineAt, newRmsOrigins: 0 }));
  } finally { store?.close(); }
}
// Shared only by the pinned parent receiver. No import starts preparation/DB/UI.
export const parent231 = Object.freeze({ HERE, MISSION, C, HOST, BUN, UUID, sha, canonical, need, write, key, identity, pin, PRODUCT, SUPPORT, hostProvenance, observeOwn });
if (import.meta.main) void main().catch(() => { console.log(JSON.stringify({ status: 'HOLD', code: 'AUTH_PREPARE_REFUSED', automaticRetry: false, compensation: false })); process.exitCode = 1; });
