// Parent-owned immutable source pin. Does not import or execute harness code.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const revision=process.argv[2];
if(!/^r[1-9][0-9]*$/.test(revision??'')||process.argv.length!==3)throw Error('Explicit revision rN required');
const E=path.join(import.meta.dirname,'evidence');
const root='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-publication-durable/tools/ff8-harness';
const file=path.join(E,'publication-'+revision+'-manifest.json');
if(fs.existsSync(file))throw Error('Never overwrite an existing pin');
const sha=b=>createHash('sha256').update(b).digest('hex');
const base=JSON.parse(fs.readFileSync(path.join(E,'writer-r6-manifest.json')));
const expected={
  'src/engine.ts':['4e6d80c1ba86d1789bb047efbfe6ad6ecb104bb7280d17499e317f6d70d3a30f',53224],
  'src/graph-engine.ts':['b11baecf0d06a4c5c690277b1ddf0ee17ec8af6927ba54735da27d1fa1711622',63544],
  'src/graph-store.ts':['f46ced014f5c6e5d3fd7ded170339292b50528a21fb647a1b9292dcfabd6dfb2',143702],
  'src/graph-publication-materialization.ts':['3e1767919a91883608d3b3a1871010d1a46a195a066f265ea6f9ec92774d1430',10616],
  'src/graph-static-publication.ts':['a7871b3f39453ec5d971e31a1e27c7834b232cea41a16c438a3a5f719f19ac9d',4561],
  'test/graph-integration/publication.test.ts':['6ea75d3bfc9f886ab478a4af1a9655da29c8291c2c69e652494194171ca9a774',20429]
};
const files=new Set([...base.rows.map(r=>r.file),...Object.keys(expected)]),rows=[];
for(const rel of [...files].sort()){
  const full=path.join(root,rel),stat=fs.lstatSync(full);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('Not a regular source: '+rel);
  const b=fs.readFileSync(full),h=sha(b),old=base.rows.find(r=>r.file===rel);
  if(revision==='r1'){
    const pin=expected[rel];
    if(pin?(h!==pin[0]||b.length!==pin[1]):(!old||h!==old.sha256||b.length!==old.bytes))throw Error('Unexpected source drift: '+rel);
  }
  rows.push({file:rel,bytes:b.length,sha256:h});
}
const deps=JSON.parse(fs.readFileSync(path.join(E,'publication-dependencies.json')));
for(const r of deps.rows){const b=fs.readFileSync(path.join(root,'node_modules',r.path));if(b.length!==r.bytes||sha(b)!==r.sha256)throw Error('Dependency drift: '+r.path);}
const changes=rows.filter(r=>base.rows.find(b=>b.file===r.file)?.sha256!==r.sha256);
const result={schema:'rms-publication-candidate-v1',revision,root,rows,changes,baseManifest:'writer-r6-manifest.json',dependencyManifest:'publication-dependencies.json',dependencyFilesVerified:deps.rows.length,rowsSha256:sha(JSON.stringify(rows)),scope:'Exact source pin only; no test or native authority'};
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manifest:file,manifestSha256:sha(fs.readFileSync(file)),files:rows.length,changes:changes.map(r=>r.file),dependencyFilesVerified:deps.rows.length}));
