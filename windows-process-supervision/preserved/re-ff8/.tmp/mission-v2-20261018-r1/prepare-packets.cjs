// Parent-only data preparation. Copies/hashes files; imports no product code.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/coordination-three-20261014';
const base = root + '/.tmp/mission-v2-20261018-r1';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const policy = JSON.parse(fs.readFileSync(root + '/.opencode/missions/team_mvdlecqs_000i_wny3o5/model-policy.json', 'utf8'));
if (sha(JSON.stringify(policy)) !== 'b97d940a25f7e2db6feab6224441e5f5a12e4d81e22220a80ce84aee00586f11') throw Error('Policy drift');
function packet(name, entries) {
  const destination = base + '/' + name + '/inputs';
  if (fs.existsSync(destination)) throw Error('Packet already exists: ' + name);
  const checked = entries.map(e => {
    const bytes = fs.readFileSync(e.source);
    if (e.expected && sha(bytes) !== e.expected) throw Error('Input pin drift: ' + e.source);
    if (bytes.length > 4 * 1024 * 1024) throw Error('Per-file bound');
    return { ...e, bytes, digest: sha(bytes) };
  });
  if (checked.length > 80 || checked.reduce((n,e) => n+e.bytes.length,0) > 4*1024*1024) throw Error('Packet bound');
  const files = [];
  for (const e of checked) {
    const target = path.join(destination, e.name);
    if (!path.resolve(target).startsWith(path.resolve(destination) + path.sep)) throw Error('Path escape');
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, e.bytes, {flag:'wx'});
    fs.chmodSync(target, 0o444);
    files.push({path:e.name, source:e.source, bytes:e.bytes.length, sha256:e.digest, provenance:e.provenance || 'parent-selected current snapshot'});
  }
  const manifest = {mission:'team_mvdlecqs_000i_wny3o5', policyRevision:1, policyHash:sha(JSON.stringify(policy)), at:new Date().toISOString(), role:name, mode:'frozen-readonly-copies', files};
  const manifestBytes = JSON.stringify(manifest,null,2) + '\n';
  fs.writeFileSync(destination + '/INPUT_MANIFEST.json', manifestBytes, {flag:'wx'});
  fs.chmodSync(destination + '/INPUT_MANIFEST.json', 0o444);
  const receipt = {at:new Date().toISOString(), destination, inputFiles:files.length, inputBytes:files.reduce((n,f)=>n+f.bytes,0), manifestSha256:sha(manifestBytes), allSourcePinsChecked:true, permission:'ACK-HOLD only; separate parent GO required', historicalOwnershipUnchanged:true};
  fs.writeFileSync(base + '/' + name + '/PARENT_ACCESS_RECEIPT.json', JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(receipt));
}
const contract = {name:'CONTRACT.md', source:base+'/CONTRACT.md'};
const gel = root + '/.tmp/re-graph-scheduler/review-20261014/L7QA_INITIAL_E03';
const qaManifestBytes = fs.readFileSync(gel+'/QA_INPUT_MANIFEST.json');
if (sha(qaManifestBytes) !== '4590f09af2c5d4a4f72ee281e8f0e28705e3a4b940a645578b27cc7534fe9b1e') throw Error('QA manifest pin drift');
const qa = JSON.parse(qaManifestBytes);
const selected = qa.files.filter(f =>
  (f.kind === 'test' && f.path.endsWith('.ts')) ||
  f.path.startsWith('tools/ff8-harness/test/fixtures/graph/bridges-rare/') ||
  ['tools/ff8-harness/src/graph-normalize.ts','PARENT/BRIDGES_DECISION.md','PARENT/BRIDGES_PARENT_REPRO.json'].includes(f.path));
packet('l1-b1-search', [contract,
  ...selected.map(f=>({name:'gel/'+f.path,source:gel+'/'+f.path,expected:f.sha256,provenance:f.origin})),
  {name:'QA_INPUT_MANIFEST.json',source:gel+'/QA_INPUT_MANIFEST.json',expected:sha(qaManifestBytes)},
  {name:'L1_ARBITRATION_PROPOSAL.md',source:phase+'/V3_Q1_L1_ARBITRATION_OUTPUT_20261018/L1_ARBITRATION_PROPOSAL.md',expected:'01365c743ad78de6640b3bc4461469c4f56a24ef0c37fad9c7a8ba6b891a43fa'},
  {name:'PARENT_DISPOSITION.json',source:phase+'/l1-arbitration-intake-disposition-20261018.json'}
]);
const real = JSON.parse(fs.readFileSync(phase+'/V3_REALNATIVE_REVIEW_INPUTS_20261017/INPUT_MANIFEST.json','utf8'));
packet('v3-matrix-source', [contract,
  ...real.files.filter(f=>f.path.endsWith('.cs') || f.path.endsWith('/DESIGN.md') || f.path.endsWith('/REALNATIVE_PLAN.md')).map(f=>({name:'frozen/'+path.relative(phase,f.path).replaceAll('\\','/'),source:f.path,expected:f.sha256,provenance:'V3_REALNATIVE_REVIEW_INPUTS_20261017 pinned source'})),
  {name:'SLICE2_RECEIPT.json',source:phase+'/v3-slice2-receipt-20261017.json'},
  {name:'ORDER.md',source:root+'/docs/missions/re-graph-scheduler/ORDRE_MISSION_V2_20261018.md'}
]);
