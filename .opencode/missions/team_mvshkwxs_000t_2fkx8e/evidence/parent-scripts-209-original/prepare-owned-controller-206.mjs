// One-shot parent act. No host, model, session, grant, publication or retry.
// Execute only immediately before the separately reviewed readonly qualification.
import { readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { Database } from 'bun:sqlite';
const missionDir = dirname(fileURLToPath(import.meta.url));
const harness = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198/tools/ff8-harness';
const host = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const newAttempt = process.argv.length === 3 && process.argv[2] === 'new-attempt-after-preload-hold-207';
if (!(process.argv.length === 2 || newAttempt)) throw new Error('closed parent act arguments required');
const priorFence = newAttempt ? 2 : 1;
const out = join(missionDir, newAttempt ? 'owned-direct-209' : 'owned-direct-206');
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, m) => { if (!v) throw new Error(m); };
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2), { flag: 'wx' });
function pin(path, expected, length) {
  const bytes = readFileSync(path), stat = lstatSync(path, { bigint: true });
  need(stat.isFile() && !stat.isSymbolicLink() && sha(bytes) === expected && (length === undefined || bytes.length === length), 'pin mismatch');
  // The retained plan's byte-level JSON pins use forward slashes exactly.
  return { path: path.replaceAll('\\', '/'), byteLength: bytes.length, sha256: expected };
}
need(!existsSync(out), 'one-shot namespace already exists; preserve, no retry');
if (newAttempt) {
  const old = json(join(missionDir, 'owned-direct-206/FINALOUTCOME.json'));
  const bytes = readFileSync(join(missionDir, 'owned-direct-206/invocation.stdout.bin'));
  need(old.status === 'HOLD' && old.exitCode === 1 && old.stdoutSha256 === sha(bytes), 'previous HOLD proof changed');
  const previous = JSON.parse(bytes.toString('utf8')).data;
  need(previous.status === 'HOLD' && previous.pid === null && !previous.outputRoot && previous.checks.length === 0, 'prior attempt not proved pre-spawn');
  const chain = json(join(missionDir, 'evidence/direct-bun-chain-facts-native-208.json'));
  need(chain.exit === 0 && chain.stderr === '' && JSON.parse(chain.stdout).matched === true, 'clean native chain unproved');
}
const cfg = json(join(missionDir, 'operational-168-output/native-request.json'));
const prepared = json(join(missionDir, 'evidence/owned-runtime-authority-preparation-205.json'));
need(cfg.missionId === 'rms-qualification-6356b01f78a79192' && cfg.ownPath === prepared.ownPath && cfg.controllerId === prepared.expectedControllerId, 'scope mismatch');
const qa = json(join(missionDir, 'qa-owned-runtime-203/typecheck.json'));
need(qa.exit === 0 && qa.sourcePinsRecheckedAfter === true && qa.cwd.replaceAll('\\', '/') === harness, 'QA scope mismatch');
for (const [p, digest] of Object.entries(qa.sourcePins)) pin(join(harness, p), digest);
const storePins = {
  'src/store.ts': 'e40958217aa7a170e8968dc214aa3d8d95a5ea2097de39468f5ba2d219dce1fe',
  'src/validation.ts': '9f15f63c8c5b7ca39a3729be59b866f68f7ff6dc1f15655b0cb569d1498acb50',
  'src/re-policy.ts': 'c3714c3120d3e8f87a044ef6857ca40c41900a6c74647d1bfdc6205371dfc365',
};
for (const [p, digest] of Object.entries(storePins)) pin(join(harness, p), digest);
const bun = pin('C:/Users/djden/.bun/bin/bun.exe', '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4');
const provenance = {
  version: 'rms-owned-npm-host-provenance-v1',
  runtime: { name: 'bun', version: '1.4.2', executable: bun },
  rawSource: { meaning: 'PUBLISHED_NPM_SERVER_DISTRIBUTION_TARBALL', archive: pin(join(host, 'provenance/server-2.2.1.tgz'), '216d297fe87af4f1937c85cdcfae6ae552edc72eaa1f43305defe150c439bc8f', 62480) },
  closure: {
    archives: pin(join(host, 'provenance/archives.json'), '329b744c3520380553e68331cc203f14b1d8995fc49e2f09de6c1532f38c938e', 350336),
    installed: pin(join(host, 'provenance/installed-files.json'), '5e03043e9d68835d5a0bc5b6ee9d627c20e63202c36ddaf9756fb6db5dc80708', 5991608), archiveCount: 367, fileCount: 32227,
  },
  bootstrap: pin(join(host, 'bootstrap-host.mjs'), 'e25c43c7b4b2fd9a9f1dba7ece1dcc42d27a7650ee3444f9b2c2eec340cf9a99', 10061),
  plan: pin(join(host, 'host-plan.json'), '5d147c490a05f61323fb05436f835b058275c6933c3c6c9cd12494d83029ed67', 16302),
  custodyPolicy: { version: 'rms-owned-http-readonly-policy-v1', rawTargets: ['/api/info', '/openapi.json'], nativeOptions204: true, post: 'DENY_ALL' },
};
const ident = lstatSync(cfg.ownPath, { bigint: true });
need(ident.isFile() && !ident.isSymbolicLink(), 'OWN must already be a regular file');
const quoteId = s => '"' + s.replaceAll('"', '""') + '"';
function observe() {
  const db = new Database(cfg.ownPath, { readonly: true, strict: true });
  try { return db.transaction(() => {
    need(db.query('SELECT count(*) AS n FROM ff8_missions').get().n === 1, 'foreign mission present');
    const schema = db.query("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
    const tableDigests = {};
    for (const { name } of schema.filter(x => x.type === 'table')) {
      const cols = db.query('PRAGMA table_info(' + quoteId(name) + ')').all().map(x => x.name);
      // SQLite quote preserves 64-bit integers without conversion to JS Number.
      const projections = cols.map(c => (name === 'ff8_missions' && ['lease_owner', 'lease_token', 'lease_until'].includes(c) ? "'LEASE_EXCLUDED'" : 'quote(' + quoteId(c) + ')') + ' AS ' + quoteId(c));
      const rows = db.query('SELECT ' + projections.join(',') + ' FROM ' + quoteId(name)).all().map(x => JSON.stringify(x)).sort();
      tableDigests[name] = { rows: rows.length, sha256: sha(JSON.stringify(rows)) };
    }
    const parent = db.query('SELECT document,digest,event_key FROM ff8_graph_parent_authorities WHERE mission=?').get(cfg.missionId);
    need(parent && sha(parent.document) === parent.digest && JSON.stringify(JSON.parse(parent.document)) === JSON.stringify(prepared.state.parentIdentity), 'parent identity changed');
    const event = db.query('SELECT kind,payload FROM ff8_events WHERE mission=? AND key=?').get(cfg.missionId, parent.event_key);
    need(event?.kind === 'parent_authority_bootstrapped' && event.payload === parent.document && parent.event_key === prepared.state.parentEventKey, 'parent event mismatch');
    const roots = db.query('SELECT root_id,revision,document,digest FROM ff8_graph_native_roots WHERE mission=?').all(cfg.missionId);
    need(roots.length === 1 && roots[0].root_id === prepared.state.roots[0].rootId && roots[0].revision === 3 && sha(roots[0].document) === roots[0].digest && JSON.parse(roots[0].document).origins.length === 1, 'root continuity failed');
    return { schemaSha256: sha(JSON.stringify(schema)), tableDigests, lease: db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(cfg.missionId) };
  })(); } finally { db.close(); }
}
const before = observe();
need(before.lease.lease_owner === cfg.controllerId && before.lease.lease_token === priorFence && (newAttempt || before.lease.lease_until < Date.now()), 'expected prior controller fence absent');
mkdirSync(out);
write(join(out, 'before.json'), before);
let store;
try {
  const { Store } = await import(pathToFileURL(join(harness, 'src/store.ts')).href);
  store = new Store(cfg.ownPath);
  const afterConstructor = observe();
  write(join(out, 'after-constructor.json'), afterConstructor);
  need(JSON.stringify(before) === JSON.stringify(afterConstructor), 'constructor changed logical OWN state');
  const now = Date.now(), lease = store.acquireLease(cfg.missionId, cfg.controllerId, now, 300000);
  const after = observe();
  write(join(out, 'after-acquisition.json'), after);
  need(after.schemaSha256 === before.schemaSha256 && JSON.stringify(after.tableDigests) === JSON.stringify(before.tableDigests), 'non-lease state changed; stop, no compensation');
  need(lease.token === priorFence + 1 && after.lease.lease_token === lease.token && after.lease.lease_owner === cfg.controllerId && after.lease.lease_until === lease.expiresAt, 'new fence readback mismatch');
  const z = lstatSync(cfg.ownPath, { bigint: true });
  need(z.dev === ident.dev && z.ino === ident.ino, 'OWN file identity changed');
  const request = { version: 'rms-parent-owned-readonly-request-v2', purpose: 'inspect-owned-http-readonly-v1', missionId: cfg.missionId, ownPath: cfg.ownPath, controllerId: cfg.controllerId, principalId: cfg.principalId, actorId: cfg.actorId, mandateRef: cfg.mandateRef, expiresAt: now + 180000, expectedControllerFence: lease.token, connection: { kind: 'owned-bun-http-readonly-v1', namespace: host, provenance } };
  write(join(out, 'request-v2.json'), request);
  write(join(out, 'controller-act.json'), { version: 'rms-parent-controller-act-206-v1', status: 'LEASE_ACQUIRED_NO_HOST_STARTED', lease, acquiredAt: now, unchangedExceptLease: true, ownIdentity: { devDecimal: ident.dev.toString(), inoDecimal: ident.ino.toString() }, sourcePins: qa.sourcePins, storePins, requestSha256: sha(readFileSync(join(out, 'request-v2.json'))), modelPermitReactivated: false, newRmsOrigins: 0 });
  console.log(JSON.stringify({ status: 'LEASE_ACQUIRED_NO_HOST_STARTED', fence: lease.token, expiresAt: lease.expiresAt, requestExpiresAt: request.expiresAt, unchangedExceptLease: true }));
} catch (e) {
  write(join(out, 'hold.json'), { status: 'HOLD', message: String(e.message), retry: false, compensation: false });
  throw e;
} finally { store?.close(); }
