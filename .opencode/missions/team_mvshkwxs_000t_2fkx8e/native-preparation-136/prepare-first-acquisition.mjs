// Parent-only static DATA preparation and narrow checks. Never opens OWN or issues a grant.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const root = join(repo, mission), target = join(root, 'first-acquisition-151');
const producerPath = join(wt, mission, 'preparation-candidates/first-acquisition-data.mjs');
const PRODUCER_SHA = '1dd57d660c93a6c86b4ddcacbf399831a68e0334539e45847fa8227eefa58294';
const sha = b => createHash('sha256').update(b).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const clone = v => JSON.parse(JSON.stringify(v));
const image = path => {
  const b = readFileSync(path);
  return { path, base64: b.toString('base64'), byteLength: b.length, sha256: sha(b) };
};
const rawRef = f => ({ kind: 'rms-parent-file-bytes-v1', encoding: 'raw-v1', byteLength: f.byteLength, sha256: f.sha256 });
const text = f => new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(f.base64, 'base64'));
const created = [], cases = [], started = Date.now();
try {
  const action = process.argv[2];
  need(process.argv.length === 3 && ['--inspect-missing', '--prepare-and-check-data'].includes(action), 'Explicit static action required');
  need(!existsSync(target), 'Parent DATA namespace exists; no overwrite or automatic rerun');
  need(sha(readFileSync(producerPath)) === PRODUCER_SHA, 'Producer not pinned to the reviewed final bytes');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim()
    === '782ec396a2a7866d30645c32ca8ab864dcca5960', 'Product HEAD differs');
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'tools/ff8-harness/src', 'tools/ff8-harness/schemas'],
    { cwd: wt, stdio: ['ignore', 'pipe', 'pipe'] });
  const manifest = image(join(root, 'native-preparation-136/source-bundle-v3/manifest.json'));
  need(manifest.sha256 === '34ffa53959bf44e6023071d4f27fb939732c719bf2bad681a1bea1e877410d68', 'Wrong source manifest');
  const m = JSON.parse(text(manifest));
  const loadSource = name => {
    const p = m.files.find(f => f.path.replaceAll('\\', '/').endsWith('/'+name+'.json'));
    need(p, 'Source pin absent'); const f = image(p.path);
    need(f.sha256 === p.sha256 && f.byteLength === p.byteLength, 'Source file differs from pin'); return f;
  };
  const quotationSources = [
    'reports/107-premiere-acquisition-possible-sans-reset-ni-autorite-fictive.md',
    'reports/109-entree-locale-parent-concrete-autorisee.md',
    'reports/143-intention-statique-retenue-verification-bornee-des-pieces-historiques.md'
  ].map(p => image(join(root, p)));
  const resourceFiles = [
    'evidence/native-core-at-rest-r1/plan.json', 'evidence/native-core-at-rest-r1/result.json',
    'native-preparation-136/local-stage-qa-139/receipt.json', 'evidence/native-service-identity-refresh-v1.json'
  ].map(p => image(join(root, p)));
  const input = { version: 'rms-first-acquisition-data-input-v1', files: {
    manifest, body: loadSource('body'), independentSources: loadSource('independentSources'), policy: loadSource('policy'),
    intention: image(join(root, 'native-preparation-136/admission-a-static-intention.json')),
    catalog: image(join(root, 'evidence/native-catalog-preparation-readback-20261030.json')), quotationSources },
    firstUse: null, budget: null, sourceQuotations: null, resourceFiles };
  const { prepareFirstAcquisitionDataV1: prepare } = await import(pathToFileURL(producerPath).href);
  const { canonical, hash } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/validation.ts')).href);
  const runCase = (name, fn) => {
    const start = performance.now();
    try { fn(); cases.push({ name, pass: true, durationMs: performance.now()-start }); }
    catch(e) { cases.push({ name, pass: false, durationMs: performance.now()-start, error: String(e?.message||e) }); throw e; }
  };
  const reject = (fn, expected) => {
    let message; try { fn(); } catch(e) { message = String(e?.message||e); }
    need(message?.includes(expected), `Expected ${expected}; got ${message??'success'}`);
  };
  let pending;
  runCase('Missing three parent pieces produces scoped HOLD and zero draft provenance', () => {
    pending = prepare(input);
    need(pending.status === 'HOLD_MISSING_MATERIALIZED_PARENT_FILES' && pending.missing.length === 3
      && pending.draftDocuments.length === 0 && pending.nativeAuthority === 'NONE' && pending.acquisitionArgument === null,
      'Missing pieces became apparently usable acquisition');
  });
  if (action === '--inspect-missing') {
    console.log(JSON.stringify({ status: pending.status, scope: pending.scope, functionIdentity: pending.functionIdentity,
      missing: pending.missing, draftDocuments: 0, cases, durationMs: Date.now()-started,
      filesWritten: 0, databaseOpened: false, grantsIssued: 0 })); process.exit(0);
  }
  const writeNew = (path, value) => {
    const utf8 = canonical(value); writeFileSync(path, utf8, { flag: 'wx', encoding: 'utf8' });
    const actual = image(path); need(text(actual) === utf8, 'Parent DATA exact readback failed');
    created.push({ path, byteLength: actual.byteLength, sha256: actual.sha256 }); return actual;
  };
  const spans = [[5,15],[3,25],[3,13]];
  const quotations = quotationSources.map((f,i) => {
    const [startLine,endLine] = spans[i], lines = text(f).split(/\r?\n/);
    need(lines.length >= endLine, 'Quotation source span missing');
    return { sourceRef: rawRef(f), startLine, endLine, text: lines.slice(startLine-1,endLine).join('\n') };
  });
  const scope = pending.scope;
  const qValue = { version: 'rms-parent-first-acquisition-source-quotations-v1', scope, quotations, scopeUnresolved: [],
    resourceRefs: resourceFiles.map(rawRef), preservedUnknowns: [
      'Prospective first RMS use confirmed by user145; current operative root absence must still be read and checked at commit',
      'Old OpenCode session is retained outside presumed RMS ancestry; no universal inactivity or zero physical cost asserted',
      'Local QA139 database is evidence only and is not adopted as operational ownership',
      'Service identity observation is dated; source-binary coupling, future enforcement, quota and terminality not established',
      'Controller/family operational fences, deadlines and actual issuer invocation are not supplied by static DATA'
    ] };
  mkdirSync(target);
  input.sourceQuotations = writeNew(join(target, 'source-quotations.json'), qValue);
  input.firstUse = writeNew(join(target, 'first-use.json'), { version: 'rms-parent-first-operational-use-v1',
    factId: 'user145', userStatement: "on ne s'est jamais servi de RMS",
    interpretation: 'first-operational-rms-genesis-not-opencode-or-qa-continuity', scope,
    sourceQuotationsRef: rawRef(input.sourceQuotations) });
  const slotKey = 'slot-A:'+hash(canonical({ rootAccountId: scope.rootAccountId,
    functionIdentity: pending.functionIdentity, role: 'A', pass: 1 }));
  input.budget = writeNew(join(target, 'budget-decision.json'), { version: 'rms-parent-prospective-slot-A-decision-v1',
    scope, firstUseRef: rawRef(input.firstUse), sourceQuotationsRef: rawRef(input.sourceQuotations),
    grant: { slotKey, functionIdentity: pending.functionIdentity, role: 'A', pass: 1, capUtf8Bytes: 262144, acquiredUtf8Bytes: 262144 } });
  let complete;
  runCase('Real canonical parent pieces produce exactly five unissued draft documents', () => {
    complete = prepare(input);
    need(complete.status === 'FIRST_ACQUISITION_INTENTION_NATIVE_HOLD' && complete.draftDocuments.length === 5
      && complete.scopeUnresolved.length === 0 && complete.acquisitionArgument === null && complete.nativeAuthority === 'NONE', 'Wrong static domain');
    const docs = Object.fromEntries(complete.draftDocuments.map(d => {
      need(d.materialization === 'NOT_OBSERVED', 'Pure producer asserted file observation'); return [d.name,JSON.parse(d.document.utf8)];
    }));
    need(docs.inventory.rootAccountId === scope.rootAccountId && !Object.hasOwn(docs.inventory,'rootAllocationRef')
      && docs.slotA.capUtf8Bytes === 262144 && docs.slotA.acquiredUtf8Bytes === 262144
      && !Object.hasOwn(docs.slotA,'grantRef'), 'Scope or issuer-generated grant reference fabricated');
  });
  // These test-only RAM mutations are not claimed to be independently loaded real files.
  const changedImage = (f, value) => {
    const b = Buffer.from(canonical(value)); return { ...f, base64:b.toString('base64'), byteLength:b.length, sha256:sha(b) };
  };
  const changed = (which, change) => { const v=clone(input), o=JSON.parse(text(v[which])); change(o); v[which]=changedImage(v[which],o); return v; };
  runCase('Corrupt retained source pin refused', () => { const v=clone(input);v.files.body.sha256='0'.repeat(64);reject(()=>prepare(v),'actual supplied bytes/pin differ'); });
  runCase('Different budget root scope refused', () => reject(()=>prepare(changed('budget',o=>{o.scope.rootAccountId='0'.repeat(64);})), 'budget scope'));
  runCase('Wrong cap refused without inferred credit', () => reject(()=>prepare(changed('budget',o=>{o.grant.capUtf8Bytes=262143;})), 'ratified A-only cap/debit262144'));
  runCase('Unapproved role B refused', () => reject(()=>prepare(changed('budget',o=>{o.grant.role='B';})), 'ratified A-only cap/debit262144'));
  runCase('Quotation text not in source refused', () => reject(()=>prepare(changed('sourceQuotations',o=>{o.quotations[0].text+=' fabricated';})), 'quotation text/line span differs'));
  runCase('Unresolved scoped issue preserved, never converted into issuance', () => {
    const v=changed('sourceQuotations',o=>{o.scopeUnresolved=['OFFLINE_TEST_UNRESOLVED_SCOPE'];});
    const first=JSON.parse(text(v.firstUse));first.sourceQuotationsRef=rawRef(v.sourceQuotations);v.firstUse=changedImage(v.firstUse,first);
    const budget=JSON.parse(text(v.budget));budget.firstUseRef=rawRef(v.firstUse);budget.sourceQuotationsRef=rawRef(v.sourceQuotations);v.budget=changedImage(v.budget,budget);
    const r=prepare(v), inventory=JSON.parse(r.draftDocuments.find(d=>d.name==='inventory').document.utf8);
    need(r.scopeUnresolved[0]==='OFFLINE_TEST_UNRESOLVED_SCOPE' && inventory.unresolved[0]==='OFFLINE_TEST_UNRESOLVED_SCOPE'
      && r.acquisitionArgument===null && r.nativeAuthority==='NONE', 'Unresolved issue erased or granted');
  });
  for (const d of complete.draftDocuments) {
    const path=join(target,d.name+'.json');writeFileSync(path,d.document.utf8,{flag:'wx',encoding:'utf8'});
    const f=image(path);need(f.sha256===d.document.ref.sha256&&f.byteLength===d.document.ref.byteLength,'Draft exact readback mismatch');
    created.push({path,byteLength:f.byteLength,sha256:f.sha256});
  }
  // Reload the three actual source pieces separately, without promoting the pure producer's output labels.
  const reloaded={...input,sourceQuotations:image(input.sourceQuotations.path),firstUse:image(input.firstUse.path),budget:image(input.budget.path)};
  need(canonical(prepare(reloaded).draftDocuments)===canonical(complete.draftDocuments),'Draft refs changed after separate source reload');
  const userReport=image(join(root,'reports/145-premier-usage-rms-confirme-par-utilisateur.md'));
  const receipt={version:'rms-first-acquisition-static-parent-qa-v1',status:'PARENT_STATIC_GENESIS_PIECES_ONLY_NATIVE_HOLD',
    producerSha256:PRODUCER_SHA,scope,created:created.slice(),cases,durationMs:Date.now()-started,
    userFact145Report:{path:userReport.path,byteLength:userReport.byteLength,sha256:userReport.sha256},
    acquisitionArgument:null,grantRefProduced:false,operationalOwnCreated:false,grantsIssued:0,rmsOriginsCommitted:0,
    meaning:'New prospective local RMS allocation only. Actual issuer must check fresh ownership/root absence and generate the grant reference; no provider quota or native exercise attested.'};
  writeNew(join(target,'receipt.json'),receipt);
  console.log(JSON.stringify({status:receipt.status,passed:cases.length,failed:0,durationMs:receipt.durationMs,
    cases,scope,filesCreated:created.length,receiptPath:join(target,'receipt.json'),receiptSha256:created.at(-1).sha256,
    acquisitionArgument:null,grantsIssued:0,rmsOriginsCommitted:0}));
} catch(e) {
  const failure={status:'STATIC_GENESIS_REFUSED_PRESERVE_PARTIAL',durationMs:Date.now()-started,
    error:String(e?.message||e).slice(0,3500),cases,created,grantsIssued:0,rmsOriginsCommitted:0};
  if(existsSync(target)&&!existsSync(join(target,'failure.json')))
    writeFileSync(join(target,'failure.json'),JSON.stringify(failure,null,2)+'\n',{flag:'wx'});
  console.error(JSON.stringify(failure));process.exitCode=1;
}
