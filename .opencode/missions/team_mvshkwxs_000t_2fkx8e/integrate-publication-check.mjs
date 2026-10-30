// Parent integration observations only; no Git mutation or harness execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const phase=process.argv[2];
if(!['premerge','postmerge','postcommit'].includes(phase)||process.argv.length!==3)throw Error('Explicit observation phase required');
const R=path.resolve(import.meta.dirname,'../../..'),E=path.join(import.meta.dirname,'evidence');
const W='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-publication-durable';
const output=path.join(E,phase+'-publication-r3.json');
const need=(x,s)=>{if(!x)throw Error(s);};
const sha=b=>createHash('sha256').update(b).digest('hex');
const hashfile=f=>{const b=fs.readFileSync(f);return{bytes:b.length,sha256:sha(b)};};
function git(args,cwd=R){const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout:10000});need(r.status===0,'Git observation failed');return r.stdout.trimEnd();}
need(!fs.existsSync(output),'Never overwrite a receipt');
const m=JSON.parse(fs.readFileSync(path.join(E,'publication-r3-manifest.json')));
need(sha(fs.readFileSync(path.join(E,'publication-r3-manifest.json')))==='6982f54bd4bfee58be7fdde9228b8a3ea6c21dd1856ae5bddce65ae0c8a83d1c','Reviewed manifest drift');
let receipt;
if(phase==='premerge'){
  const expectedHead='7d3fae678032a86964a98ab09c12c330dadf9d50';
  need(git(['rev-parse','HEAD'],W)===expectedHead,'Writer HEAD drift');
  need(git(['status','--short','--untracked-files=no'],W)==='','Writer tracked dirty');
  need(git(['diff','--cached','--name-only'])==='','Parent index not empty');
  need(git(['rev-parse','HEAD'])==='87a933fafdbe7e94305d5de6d3aae66c806e94b5','Parent HEAD changed; inspect before integration');
  const sourcePaths=git(['diff','--name-only','HEAD...'+expectedHead]).split('\n').filter(Boolean);
  const expected=m.changes.map(r=>'tools/ff8-harness/'+r.file).sort();
  need(JSON.stringify([...sourcePaths].sort())===JSON.stringify(expected)&&sourcePaths.length===6,'Unexpected integration scope');
  const status=git(['status','--porcelain=v1','--untracked-files=no']).split('\n').filter(Boolean);
  const preservedParentChanges=status.map(s=>{need(s.startsWith(' M '),'Unexpected status shape');const rel=s.slice(3);need(!sourcePaths.includes(rel),'User edit overlaps integration');return{path:rel,...hashfile(path.join(R,rel))};});
  const untracked=git(['ls-files','--others','--exclude-standard','--','tools/ff8-harness']).split('\n').filter(Boolean);
  need(!untracked.some(f=>sourcePaths.includes(f)),'Untracked parent source collision');
  for(const row of m.rows){const a=hashfile(path.join(m.root,row.file));need(a.bytes===row.bytes&&a.sha256===row.sha256,'Reviewed writer source drift: '+row.file);}
  receipt={schema:'rms-publication-premerge-v1',parentHead:git(['rev-parse','HEAD']),writerHead:expectedHead,sourcePaths,preservedParentChanges,indexEmpty:true,reviewedFiles:m.rows.length};
}else{
  const pre=JSON.parse(fs.readFileSync(path.join(E,'premerge-publication-r3.json')));
  for(const row of m.rows){const a=hashfile(path.join(R,'tools/ff8-harness',row.file));need(a.bytes===row.bytes&&a.sha256===row.sha256,'Integrated source drift: '+row.file);}
  for(const row of pre.preservedParentChanges){const a=hashfile(path.join(R,row.path));need(a.bytes===row.bytes&&a.sha256===row.sha256,'Preexisting edit changed: '+row.path);}
  receipt={schema:'rms-publication-readback-v1',phase,head:git(['rev-parse','HEAD']),reviewedFiles:m.rows.length,sourceDrift:[],preservedFiles:pre.preservedParentChanges.length,preservedDrift:[],indexEmpty:git(['diff','--cached','--name-only'])==='',remainingTrackedChanges:git(['status','--porcelain=v1','--untracked-files=no']).split('\n').filter(Boolean).length};
}
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...receipt,preservedParentChanges:receipt.preservedParentChanges?.length,sourcePaths:receipt.sourcePaths?.length,receipt:output}));
