// M1/B owned preservation producer. No compiler, test, helper, shell or Git call.
// --plan is read-only. --apply only creates new files under this directory.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAIN = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const WT = 'C:/Users/djden/source/repos/retro-eng/re-ff8-helper-win-wt';
const OWN = WT + '/windows-process-supervision';
const TEMP = 'C:/Users/djden/AppData/Local/Temp/opencode';
const INVENTORY = MAIN + '/docs/missions/re-graph-scheduler/M1_INVENTAIRE_CSHARP_20261020.json';
const EXPECTED_HEAD = 'bba8eb91f38828cab88251a9be0de1f5f179fb1b';
const EXPECTED_INDEX = 'd51d5957af0af0ccb953d30d8ac2164f90e356aad6d394926f6ad80b6c932ceb';
const MAX_FILE = 2 * 1024 * 1024;
const MAX_TOTAL = 64 * 1024 * 1024;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const norm = p => path.resolve(p).replaceAll('\\', '/');
const rel = (root, p) => path.relative(root, p).replaceAll('\\', '/');
const inventoryBytes = fs.readFileSync(INVENTORY);
const inventory = JSON.parse(inventoryBytes);
const expand = p => p.replace(/^[^/]+/, x => inventory.prefixes[x] || x);
const entries = new Map();
const references = new Map();

function control() {
  return {
    head: fs.readFileSync(MAIN + '/.git/HEAD', 'utf8').trim(),
    mainCommit: fs.readFileSync(MAIN + '/.git/refs/heads/main', 'utf8').trim(),
    mainIndexSha256: sha(fs.readFileSync(MAIN + '/.git/index')),
    inventorySha256: sha(fs.readFileSync(INVENTORY))
  };
}
function assertControl(c) {
  if (c.head !== 'ref: refs/heads/main' || c.mainCommit !== EXPECTED_HEAD ||
      c.mainIndexSha256 !== EXPECTED_INDEX || c.inventorySha256 !== sha(inventoryBytes)) {
    throw Error('Main HEAD/index or T1 inventory changed; stop before further mutation');
  }
}
function destination(source) {
  const p = norm(source);
  if (p.startsWith(MAIN + '/')) return OWN + '/preserved/re-ff8/' + rel(MAIN, p);
  if (p.startsWith(TEMP + '/')) return OWN + '/preserved/external/' + rel(TEMP, p);
  throw Error('Source outside the authorized roots: ' + p);
}
function add(source, role, expectedSha256) {
  const p = norm(source);
  if (p.endsWith('/suspend-after-campaign-2026-10-09.ps1')) throw Error('Power scripts are reference-only');
  const st = fs.lstatSync(p);
  if (!st.isFile() || st.isSymbolicLink()) throw Error('Not a plain file: ' + p);
  if (st.size > MAX_FILE) {
    references.set(p, { origin: p, bytes: st.size, sha256: sha(fs.readFileSync(p)), reason: 'Over the 2 MiB per-file preservation cap; original retained, no RAW bulk copy' });
    return;
  }
  const bytes = fs.readFileSync(p);
  const hash = sha(bytes);
  if (expectedSha256 && hash !== expectedSha256) throw Error('Pinned source drift: ' + p);
  if (/\.(?:cs|ps1|py|cjs|mjs|js|ts)$/i.test(p) && bytes.includes(Buffer.from('CampaignSuspend20261009'))) {
    throw Error('Power source content is prohibited');
  }
  const previous = entries.get(p);
  if (previous) { previous.roles.add(role); return; }
  entries.set(p, { origin: p, destination: destination(p), bytes: bytes.length, sha256: hash, roles: new Set([role]) });
}
function direct(dir, role, extension = /\.(?:md|json|ps1)$/i) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && extension.test(e.name)) add(dir + '/' + e.name, role);
  }
}
function tree(dir, role, depth = 0) {
  if (!fs.existsSync(dir)) throw Error('Referenced preservation root missing: ' + dir);
  if (depth > 8) throw Error('Unexpected deep preservation tree: ' + dir);
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isSymbolicLink()) throw Error('Do not follow a preservation symlink: ' + p);
    if (e.isDirectory()) tree(p, role, depth + 1);
    else if (e.isFile()) add(p, role);
  }
}

const before = control();
assertControl(before);
let pinnedSourceCount = 0;
for (const [directory, ids] of inventory.occurrenceDirectories) {
  const relative = expand(directory);
  for (const value of ids) {
    const [id, basename] = value.split('@');
    const source = inventory.sources[id];
    add(MAIN + '/' + relative + '/' + (basename || source.name), 'T1-source-' + id + ':' + source.category, source.sha256);
    pinnedSourceCount++;
  }
  // Direct siblings and enclosing packet contracts are scoped to a source packet,
  // not to the whole .tmp/inputs tree or to other mission work.
  const stop = MAIN + '/' + expand(directory.split('/')[0]);
  for (let current = MAIN + '/' + relative; current !== stop;) {
    if (!current.startsWith(stop + '/')) throw Error('Packet ancestor escaped its prefix');
    direct(current, 'source-packet-contract-manifest-or-wrapper');
    if (fs.existsSync(current + '/contracts')) tree(current + '/contracts', 'source-packet-contracts');
    current = norm(path.dirname(current));
  }
}
if (pinnedSourceCount !== 325) throw Error('Unexpected T1 source count');
for (const file of ['M1_INVENTAIRE_CSHARP_20261020.json', 'M1_INVENTAIRE_CSHARP_20261020.md']) {
  add(MAIN + '/docs/missions/re-graph-scheduler/' + file, 'accepted-T1-inventory');
}
const docs = MAIN + '/docs/missions/re-graph-scheduler';
for (const e of fs.readdirSync(docs, { withFileTypes: true })) {
  if (e.isFile() && /^(?:JOB_|V3_|FULL44_|FULL_ROUTE)/.test(e.name) && e.name.endsWith('.md')) {
    add(docs + '/' + e.name, 'helper-contract-qualification-or-limit');
  }
}
const coordination = MAIN + '/.tmp/coordination-three-20261014';
for (const e of fs.readdirSync(coordination, { withFileTypes: true })) {
  if (e.isFile() && /^(?:job|v3|budget|host|g-corrections|realnative|collect-job|invoke-budget|qualify-job|fetch-job|prepare-(?:job|budget|core|v3)|build-(?:budget|g-corrections|host|realnative|review))/i.test(e.name) &&
      /\.(?:ts|ps1|json|txt|log)$/i.test(e.name)) add(coordination + '/' + e.name, 'helper-parent-gate-receipt-or-preparation');
}
const continuous = MAIN + '/.tmp/mission-v2-20261018-continuous';
for (const e of fs.readdirSync(continuous, { withFileTypes: true })) {
  if (e.isFile() && (/^(?:full44-|FULL44_|v3-|audit-full44-|freeze-full44-|prepare-full44-|verify-full44-)/.test(e.name) ||
      /^(?:count-full44-qa-call-sites|prepare-v3-evidence-review|prepare-q2b1-r2-and-numeric-review-packets)\.cjs$/.test(e.name)) &&
      /\.(?:cjs|json|md|txt|log|diff)$/i.test(e.name)) add(continuous + '/' + e.name, 'helper-parent-gate-receipt-or-preparation');
}
tree(continuous + '/v3-evidence-review/inputs', 'scoped-native-V3-evidence-packet');
for (const f of ['prepare-capture-supplement.cjs', 'prepare-packets.cjs', 'prepare-v3-review.cjs']) {
  add(MAIN + '/.tmp/mission-v2-20261018-r1/' + f, 'V3-matrix-preparation');
}
for (const [file, , hash] of inventory.externalSourcesNotDuplicatedInRepository) add(expand(file), 'external-only-CSharp-runner', hash);
for (const [file, , hash] of inventory.externalManagedPe) add(expand(file), 'external-managed-binary', hash);
add(MAIN + '/' + expand(inventory.managedPe.path), 'internal-managed-RunnerMatrix', inventory.managedPe.sha256);
// Exact external roots from the T1 receipt investigation; no global Temp scan.
const externalRoots = [
  'BMC-0944a3bbf9', 'JFC-069bf4510d', 'JCC-cb3a6dfd3f', 'JCC2-cb3a6dfd3f',
  'V3ASM-a7cda4f9a6', 'V3ASM2-77be4f35f8', 'V3MEM-9c1ae2d7b4', 'V3MEM2-14f33243e3',
  'FULL44-Q1-DATA-COMPILE-1792395951508', 'FULL44-Q1-DATA-RUN-1792396207281',
  'FULL44-Q2A-R2-COMPILE-1792405656750', 'FULL44-Q2A-R2-HEAP-RUN-1792405813958',
  'FULL44-Q2B1-R2-COMPILE-1792411744038', 'FULL44-Q2B1-R2-HEAP-RUN-1792411798841',
  'V3MATRIX-489c77e321-1792322489278'
];
for (const root of externalRoots) tree(TEMP + '/' + root, 'external-bounded-compile-run-or-red-evidence');
const planned = [...entries.values()].sort((a, b) => a.origin.localeCompare(b.origin));
const bytes = planned.reduce((n, e) => n + e.bytes, 0);
if (bytes > MAX_TOTAL) throw Error('Aggregate preservation exceeds 64 MiB; ask before expanding scope');
const guardsReceipt = JSON.parse(fs.readFileSync(continuous + '/planner-fixed-projections-r2-qualification-gate-receipt.json', 'utf8'));
const guards = guardsReceipt.source269;
function verifyGuards() {
  const bad = guards.filter(f => sha(fs.readFileSync(f.path)) !== f.sha256);
  if (guards.length !== 269 || bad.length) throw Error('Main harness guard mismatch: ' + bad.length);
  return 269;
}
const guardsBefore = verifyGuards();
const planHash = sha(Buffer.from(JSON.stringify(planned.map(e => [e.origin, rel(WT, e.destination), e.bytes, e.sha256]))));
const summary = {
  mode: process.argv[2] || '--plan', files: planned.length, bytes, pinnedSourcePaths: pinnedSourceCount,
  csharpCopies: planned.filter(e => e.origin.endsWith('.cs')).length,
  managedBinaryCopiesNamedByT1: inventory.externalManagedPe.length + 1,
  referenceOnlyOverCap: references.size, planSha256: planHash, controlsBefore: before, mainHarnessGuardsBefore: guardsBefore
};
if (summary.mode === '--plan') {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.mode === '--apply') {
  if (planHash !== 'ad057c20df5fc556ca27049849bf7ea5987e89a6ecc80924cd27d6a8e5f3b133') {
    throw Error('Read-only reviewed preservation plan drifted; stop without copying');
  }
  const manifestPath = OWN + '/PRESERVATION_MANIFEST.json';
  if (fs.existsSync(manifestPath) || fs.existsSync(OWN + '/preserved')) throw Error('Archive already exists; no overwrite/retry');
  assertControl(control());
  for (const e of planned) {
    const sourceBefore = sha(fs.readFileSync(e.origin));
    if (sourceBefore !== e.sha256) throw Error('Source changed before copy: ' + e.origin);
    fs.mkdirSync(path.dirname(e.destination), { recursive: true });
    fs.copyFileSync(e.origin, e.destination, fs.constants.COPYFILE_EXCL);
    const sourceAfter = sha(fs.readFileSync(e.origin));
    const destinationAfter = sha(fs.readFileSync(e.destination));
    if (sourceAfter !== e.sha256 || destinationAfter !== e.sha256) throw Error('Copy identity mismatch: ' + e.origin);
    e.sourceBeforeSha256 = sourceBefore;
    e.sourceAfterSha256 = sourceAfter;
    e.destinationSha256 = destinationAfter;
    e.byteExact = true;
  }
  for (const e of planned) {
    if (sha(fs.readFileSync(e.origin)) !== e.sha256 || sha(fs.readFileSync(e.destination)) !== e.sha256) throw Error('Final readback mismatch');
  }
  const after = control();
  assertControl(after);
  const guardsAfter = verifyGuards();
  const manifest = {
    schemaVersion: 1, mission: 'M1-stage-B-Windows-helper-preservation-20261020', at: new Date().toISOString(),
    status: 'PRESERVED_BYTE_EXACT_NOT_REBUILT_NOT_TESTED_NO_WITHDRAWAL', main: MAIN, worktree: WT,
    branch: 'dev/windows-process-supervision', baseCommit: EXPECTED_HEAD,
    producer: { path: rel(WT, __filename), sha256: sha(fs.readFileSync(__filename)) },
    inventory: { origin: INVENTORY, sha256: sha(inventoryBytes) },
    summary: { ...summary, mode: '--apply', verifiedCopies: planned.length, mismatches: 0, identityPercent: 100 },
    controlsBefore: before, controlsAfter: after, mainHarnessGuardsBefore: guardsBefore, mainHarnessGuardsAfter: guardsAfter,
    noOtherUserWorkingChangesCopied: 'New worktree created from the exact base commit; only this explicit helper inventory/packet/gate whitelist was copied. No whole-repository or whole-.tmp copy.',
    noBuildTestHelperImportLivePowerOrDeletion: true,
    powerReferenceOnly: inventory.runtimeEmbeddedCSharp.filter(x => x.class === 'CampaignSuspend20261009'),
    outsideHelperReferenceOnly: inventory.runtimeEmbeddedCSharp.filter(x => x.class === 'ConsoleProbe'),
    largeArtifactsReferenceOnly: [...references.values()],
    limits: ['Cross-process budgets NOT_PROVEN', 'last-close/case6 NOT_ESTABLISHED', 'D/S events and G postRun thread are not full multiprocess-loss proofs', 'Heap tests do not prove native pipes/cancel/join/ACK/Closed/release or sandbox isolation'],
    entries: planned.map(e => ({ ...e, destination: rel(WT, e.destination), roles: [...e.roles].sort() }))
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ ...summary, verifiedCopies: planned.length, identityPercent: 100, guardsAfter,
    controlsAfter: after, manifest: manifestPath, manifestSha256: sha(fs.readFileSync(manifestPath)) }, null, 2));
} else {
  throw Error('Only --plan or --apply are accepted');
}
