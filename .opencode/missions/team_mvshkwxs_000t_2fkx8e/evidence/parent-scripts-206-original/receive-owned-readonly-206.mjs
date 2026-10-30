// External parent receiver, not a capability issuer. One invocation, no retry.
import { readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { Database } from 'bun:sqlite';
const base = dirname(fileURLToPath(import.meta.url)), out = join(base, 'owned-direct-206');
const harness = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198/tools/ff8-harness';
const host = 'C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180';
const bun = 'C:/Users/djden/.bun/bin/bun.exe';
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, m) => { if (!v) throw new Error(m); };
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2), { flag: 'wx' });
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
const act = json(join(out, 'controller-act.json')), reqPath = join(out, 'request-v2.json'), reqBytes = readFileSync(reqPath), req = JSON.parse(reqBytes);
need(!existsSync(join(out, 'attempt.json')) && !existsSync(join(out, 'FINALOUTCOME.json')), 'one-shot attempt already exists');
need(act.status === 'LEASE_ACQUIRED_NO_HOST_STARTED' && act.unchangedExceptLease && sha(reqBytes) === act.requestSha256 && req.expectedControllerFence === 2 && req.expiresAt - Date.now() > 125000 && act.lease.expiresAt > req.expiresAt, 'current request/lease preconditions');
need(sha(readFileSync(bun)) === '15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4', 'Bun pin');
function pins() { for (const [path, digest] of Object.entries(act.sourcePins)) need(sha(readFileSync(join(harness, path))) === digest, 'source changed'); }
function ownSnapshot() {
  const db = new Database(req.ownPath, { readonly: true, strict: true });
  const qi = s => '"' + s.replaceAll('"', '""') + '"';
  try { return db.transaction(() => {
    const schema = db.query("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all(), tableDigests = {};
    for (const { name } of schema.filter(x => x.type === 'table')) {
      const cols = db.query('PRAGMA table_info(' + qi(name) + ')').all().map(x => x.name);
      const rows = db.query('SELECT ' + cols.map(c => (name === 'ff8_missions' && ['lease_owner', 'lease_token', 'lease_until'].includes(c) ? "'LEASE_EXCLUDED'" : 'quote(' + qi(c) + ')') + ' AS ' + qi(c)).join(',') + ' FROM ' + qi(name)).all().map(x => JSON.stringify(x)).sort();
      tableDigests[name] = { rows: rows.length, sha256: sha(JSON.stringify(rows)) };
    }
    return { schemaSha256: sha(JSON.stringify(schema)), tableDigests, lease: db.query('SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?').get(req.missionId) };
  })(); } finally { db.close(); }
}
pins();
const before = ownSnapshot(), expected = json(join(out, 'after-acquisition.json'));
need(canonical(before) === canonical(expected) && before.lease.lease_until > Date.now() + 125000, 'OWN changed or lease too short');
for (const p of ['home', 'appdata', 'localappdata', 'tmp', 'program-data']) mkdirSync(join(out, p));
const env = { SystemRoot: 'C:\\Windows', WINDIR: 'C:\\Windows', ComSpec: 'C:\\Windows\\System32\\cmd.exe', OS: 'Windows_NT', PATH: dirname(bun) + ';C:\\Windows\\System32', HOME: join(out, 'home'), USERPROFILE: join(out, 'home'), APPDATA: join(out, 'appdata'), LOCALAPPDATA: join(out, 'localappdata'), TEMP: join(out, 'tmp'), TMP: join(out, 'tmp'), ProgramData: join(out, 'program-data') };
const argv = ['run', join(harness, 'src/client.ts'), 'native-owned-readonly', 'inspect', reqPath];
write(join(out, 'attempt.json'), { command: [bun, ...argv], cwd: harness, requestSha256: act.requestSha256, sourcePins: act.sourcePins, environmentKeys: Object.keys(env), inheritedEnvironment: false, totalBoundMs: 120000, post: 'DENY_ALL', retry: false });
const startedAt = Date.now(), startMono = performance.now();
const execution = spawnSync(bun, argv, { cwd: harness, env, encoding: 'buffer', timeout: 120000, maxBuffer: 1048576, windowsHide: true });
const invocationDurationMs = performance.now() - startMono, endedAt = Date.now();
const stdout = execution.stdout ?? Buffer.alloc(0), stderr = execution.stderr ?? Buffer.alloc(0);
writeFileSync(join(out, 'invocation.stdout.bin'), stdout, { flag: 'wx' });
writeFileSync(join(out, 'invocation.stderr.bin'), stderr, { flag: 'wx' });
const outcome = { version: 'rms-owned-readonly-parent-FINALOUTCOME-v1', status: 'HOLD', startedAt, endedAt, invocationDurationMs, exitCode: execution.status, signal: execution.signal, errorCode: execution.error?.code ?? null, stdoutSha256: sha(stdout), stderrSha256: sha(stderr), requestSha256: act.requestSha256, noRetry: true, scientificAuthority: false, nativeLoadEvidence: 'UNPROVEN', newRmsOrigins: 0 };
try {
  need(!execution.error && execution.status === 0 && execution.signal === null, 'invocation did not exit normally with zero');
  need(invocationDurationMs <= 120000 && endedAt < req.expiresAt && endedAt < act.lease.expiresAt, 'whole invocation deadline or authority expiry');
  pins();
  const lines = new TextDecoder('utf-8', { fatal: true }).decode(stdout).trim().split(/\r?\n/).filter(Boolean);
  const events = lines.map(line => JSON.parse(line));
  need(events.length === 1 && events[0].event === 'native-owned-readonly-candidate-v2' && stderr.length === 0, 'unknown, refused or invalidated output');
  const candidate = events[0], d = candidate.data;
  need(candidate.nativeQualification === 'NOT_ATTESTED' && candidate.resultSha256 === sha(canonical(d)) && candidate.invocationId === d.invocationId, 'candidate hash/identity');
  need(d.custodyData?.parentPid === execution.pid && d.custodyData.childPid === d.pid && d.custodyData.controllerFence === req.expectedControllerFence
    && d.custodyData.parentProgramSha256 === act.sourcePins['src/client.ts']
    && d.custodyData.scopeSha256 === sha(canonical({ config: req, action: 'inspect-owned-http-readonly-v1', argv: argv.slice(2) })), 'external process/program/scope correspondence');
  need(d.status === 'READONLY_BOUNDARIES_MATCHED_NATIVE_LOAD_UNPROVEN' && d.failure === null && d.childClosed === true && d.scopeClosed === true && d.childExit?.code === 0 && d.childExit?.signal === null && d.forced === false && d.requestedSessionOrModelEffects === 0 && d.scientificAuthority === false, 'candidate semantic outcome');
  need(d.completionProtocol?.provisionalAloneAdoptable === false && d.completionProtocol?.candidateAloneAdoptable === false && d.completionProtocol.hardMaximumTotalMs === 120000 && invocationDurationMs <= d.completionProtocol.requiresParentMeasuredWholeInvocationAtMostMs && d.deadline?.exceeded === false, 'completion protocol or sticky deadline');
  const outputRoot = resolve(d.outputRoot);
  need(dirname(outputRoot).toLowerCase() === resolve(host).toLowerCase() && /^qualification-[a-f0-9-]+$/.test(outputRoot.split(/[\\/]/).at(-1)), 'owned output namespace');
  function readPin(ref) {
    const p = resolve(ref.path), stat = lstatSync(p, { bigint: true });
    need(p.toLowerCase().startsWith(outputRoot.toLowerCase() + '\\') && realpathSync(p).toLowerCase() === p.toLowerCase() && stat.isFile() && !stat.isSymbolicLink(), 'output pin outside owned root');
    const bytes = readFileSync(p);
    need(bytes.length === ref.byteLength && sha(bytes) === ref.sha256, 'output pin bytes');
    return bytes;
  }
  const provisionalBytes = readPin(d.provisionalReceipt), provisional = JSON.parse(provisionalBytes);
  need(resolve(d.provisionalReceipt.path) === join(outputRoot, 'receipt.json') && provisional.version === 'rms-owned-readonly-provisional-receipt-v2' && provisional.status === 'PROVISIONAL_NOT_ADOPTABLE' && provisional.invocationId === d.invocationId && provisional.failure === null && provisional.scopeClosed === true && provisional.childClosed === true && provisional.childExit?.code === 0 && canonical(provisional.checks) === canonical(d.checks) && canonical(provisional.custodyData) === canonical(d.custodyData)
    && canonical(provisional.logs) === canonical(d.logs) && canonical(d.provenance) === canonical(req.connection.provenance) && canonical(provisional.provenance) === canonical(d.provenance), 'provisional receipt exact linkage');
  need(d.checks.length === 2 && canonical(d.checks.map(x => [x.method, x.rawTarget, x.status])) === canonical([['GET', '/api/info', 200], ['GET', '/openapi.json', 200]]), 'HTTP boundary selection');
  const info = JSON.parse(readPin(d.checks[0].response)), openapi = JSON.parse(readPin(d.checks[1].response));
  need(info.pid === d.pid && info.version === '2.2.1' && openapi.openapi.startsWith('3.') && openapi.paths?.['/api/info']?.get, 'response independent shape/readback');
  need(d.logs?.length === 2 && d.logs.every(x => x.byteExact === true && !x.redacted && !x.truncated), 'logs not exact');
  const logPins = d.logs.map((log, index) => {
    need(log.channel === ['stdout', 'stderr'][index], 'log channel order');
    const path = join(outputRoot, log.channel + '.bin'), bytes = readFileSync(path);
    need(bytes.length === log.keptBytes && bytes.length === log.receivedBytes, 'log length readback');
    return { path, byteLength: bytes.length, sha256: sha(bytes) };
  });
  const nativeStat = lstatSync(join(outputRoot, 'native.sqlite'), { bigint: true });
  need(d.custodyData.nativeDb?.encoding === 'decimal-bigint-v1' && resolve(d.custodyData.nativeDb.path) === join(outputRoot, 'native.sqlite')
    && nativeStat.dev.toString() === d.custodyData.nativeDb.devDecimal && nativeStat.ino.toString() === d.custodyData.nativeDb.inoDecimal, 'native DB identity readback');
  const ownStat = lstatSync(req.ownPath, { bigint: true });
  need(ownStat.dev.toString() === act.ownIdentity.devDecimal && ownStat.ino.toString() === act.ownIdentity.inoDecimal
    && d.custodyData.ownDb?.encoding === 'decimal-bigint-v1' && d.custodyData.ownDb.devDecimal === act.ownIdentity.devDecimal && d.custodyData.ownDb.inoDecimal === act.ownIdentity.inoDecimal
    && resolve(d.custodyData.ownDb.path) === resolve(req.ownPath) && canonical(ownSnapshot()) === canonical(before), 'RMS state or OWN identity changed');
  outcome.status = 'READONLY_BUN_TO_BUN_QUALIFICATION_ACCEPTED';
  Object.assign(outcome, { invocationId: d.invocationId, candidateResultSha256: candidate.resultSha256, provisionalReceipt: d.provisionalReceipt, outputRoot, parentPid: execution.pid, pid: d.pid, childClosed: true, scopeClosed: true, sourcePinsRecheckedAfter: true, ownStateUnchanged: true, checks: d.checks, logPins });
} catch (e) { outcome.reason = String(e.message); }
write(join(out, 'FINALOUTCOME.json'), outcome);
console.log(JSON.stringify({ status: outcome.status, reason: outcome.reason ?? null, exitCode: outcome.exitCode, invocationDurationMs, receipt: join(out, 'FINALOUTCOME.json') }));
if (outcome.status !== 'READONLY_BUN_TO_BUN_QUALIFICATION_ACCEPTED') process.exitCode = 1;
