// Parent source pin of the corrected projection candidate; no harness execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const revision=process.argv[2];
if(!/^r[1-9][0-9]*$/.test(revision??'')||process.argv.length!==3)throw Error('Explicit rN required');
const E=path.join(import.meta.dirname,'evidence');
const root='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-projection-contexte/tools/ff8-harness';
const output=path.join(E,'projection-'+revision+'-manifest.json');
if(fs.existsSync(output))throw Error('Never overwrite candidate pins');
const sha=b=>createHash('sha256').update(b).digest('hex');
const base=JSON.parse(fs.readFileSync(path.join(E,'publication-r3-manifest.json')));
const expected={
  'src/engine.ts':'9d13eda2437a10193c0c51bb4e93d2468c75dfc530699ef68034535ba49319db',
  'src/graph-adapter.ts':'130f270807cdea951c418b8c6616f46d4f5009ab37a14f1016ab9c132a5f4de7',
  'src/graph-engine.ts':'1931bbe4e09612b10749bb4426360342fe5b1b56df440b19b117910da3fde9c4',
  'src/graph-store.ts':'cd8249cda7d902ff32adfcc1fb6a3adde24615e242e21579bdd3f6422d7f9a29',
  'src/graph-next-context.ts':'3a4b127a6e647a4e5f19f9308a8eaa6c4c14f73c7111bd253af18c41a1e243a5',
  'test/graph-integration/next-context.test.ts':'8d86ab93382c1356867039574dc47e8b0da2cf68c77df84ee40c210028d598de',
  'test/eventlog.test.ts':'52f87ae116d3e3805d600fdc722942a2595706b562d3264072e34b8990408eef'
};
const files=[...new Set([...base.rows.map(r=>r.file),...Object.keys(expected)])].sort(),rows=[];
for(const file of files){
  const f=path.join(root,file),s=fs.lstatSync(f);if(!s.isFile()||s.isSymbolicLink())throw Error('Nonregular source: '+file);
  const b=fs.readFileSync(f),hash=sha(b),old=base.rows.find(r=>r.file===file);
  if(revision==='r1'&&hash!==(expected[file]??old?.sha256))throw Error('Source outside delivered pins: '+file);
  rows.push({file,bytes:b.length,sha256:hash});
}
const deps=JSON.parse(fs.readFileSync(path.join(E,'projection-dependencies.json')));
for(const r of deps.rows){const b=fs.readFileSync(path.join(root,'node_modules',r.path));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Dependency drift: '+r.path);}
const changes=rows.filter(r=>base.rows.find(b=>b.file===r.file)?.sha256!==r.sha256);
const doc={schema:'rms-projection-candidate-v1',revision,root,rows,changes,rowsSha256:sha(JSON.stringify(rows)),baseManifest:'publication-r3-manifest.json',dependencyManifest:'projection-dependencies.json',dependencyFilesVerified:deps.rows.length,scope:'First parent pin r1 refers to corrected contract32 candidate, not superseded worker dba86c50. No behavioral or native proof.'};
fs.writeFileSync(output,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manifest:output,manifestSha256:sha(fs.readFileSync(output)),files:rows.length,changes:changes.map(r=>r.file),dependencies:deps.rows.length}));
