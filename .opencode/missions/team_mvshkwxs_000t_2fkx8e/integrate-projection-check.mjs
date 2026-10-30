// Parent integration pin/readback. Read-only Git and source observations.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const phase=process.argv[2];
if(!['premerge','postmerge','postcommit'].includes(phase)||process.argv.length!==3)throw Error('Explicit phase required');
const R=path.resolve(import.meta.dirname,'../../..'),E=path.join(import.meta.dirname,'evidence');
const W='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-projection-contexte';
const output=path.join(E,phase+'-projection-r6.json');
const need=(x,s)=>{if(!x)throw Error(s);},sha=b=>createHash('sha256').update(b).digest('hex');
function pin(f){const b=fs.readFileSync(f);return{bytes:b.length,sha256:sha(b)};}
function git(args,cwd=R){const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout:10000});need(r.status===0,'Git observation failed');return r.stdout.trimEnd();}
need(!fs.existsSync(output),'Never overwrite integration observations');
const manifestFile=path.join(E,'projection-r6-manifest.json'),m=JSON.parse(fs.readFileSync(manifestFile));
need(sha(fs.readFileSync(manifestFile))==='2c2fd2893e6b8482eb17cd774c5108ba1a52a17f001078d86840336ca9689545','Manifest drift');
const expected=m.changes.map(r=>'tools/ff8-harness/'+r.file).sort();
function verifySources(root){for(const row of m.rows){const got=pin(path.join(root,row.file));need(got.bytes===row.bytes&&got.sha256===row.sha256,'Source drift: '+row.file);}}
function verifyDeps(root){const d=JSON.parse(fs.readFileSync(path.join(E,'projection-dependencies.json')));for(const row of d.rows){const got=pin(path.join(root,'node_modules',row.path));need(got.bytes===row.bytes&&got.sha256===row.sha256,'Dependency drift: '+row.path);}return d.rows.length;}
let result;
if(phase==='premerge'){
  const head='5a9845e2f7b7cf4778a0f8399a0ea3c2adc3296f';
  need(git(['rev-parse','HEAD'],W)===head,'Writer HEAD changed');
  need(git(['status','--short','--untracked-files=no'],W)==='','Writer tracked changes');
  need(git(['rev-parse','HEAD'])==='56d6a35d01a8ab802e46e05bf3c3d4b8bebe002b','Parent HEAD changed');
  need(git(['diff','--cached','--name-only'])==='','Index not empty');
  const paths=git(['diff','--name-only','HEAD...'+head]).split('\n').filter(Boolean).sort();
  need(paths.length===7&&JSON.stringify(paths)===JSON.stringify(expected),'Unexpected seven-path scope');
  const preservedParentChanges=git(['status','--porcelain=v1','--untracked-files=no']).split('\n').filter(Boolean).map(s=>{need(s.startsWith(' M '),'Unexpected status');const file=s.slice(3);need(!paths.includes(file),'Preexisting edit overlaps');return{file,...pin(path.join(R,file))};});
  const untracked=git(['ls-files','--others','--exclude-standard','--','tools/ff8-harness']).split('\n');need(!untracked.some(f=>paths.includes(f)),'Untracked collision');
  verifySources(m.root);
  result={schema:'rms-projection-integration-preflight-v1',parentHead:git(['rev-parse','HEAD']),writerHead:head,sourcePaths:paths,preservedParentChanges,sourceFilesCompared:m.rows.length,dependencyFilesCompared:verifyDeps(m.root),indexEmpty:true};
}else{
  const pre=JSON.parse(fs.readFileSync(path.join(E,'premerge-projection-r6.json')));
  verifySources(path.join(R,'tools/ff8-harness'));
  for(const row of pre.preservedParentChanges){const got=pin(path.join(R,row.file));need(got.bytes===row.bytes&&got.sha256===row.sha256,'Preexisting edit drift: '+row.file);}
  if(phase==='postcommit')need(JSON.stringify(git(['diff-tree','--no-commit-id','--name-only','-r','HEAD']).split('\n').filter(Boolean).sort())===JSON.stringify(expected),'Commit scope changed');
  result={schema:'rms-projection-integration-readback-v1',phase,head:git(['rev-parse','HEAD']),sourceFilesCompared:m.rows.length,sourceDrift:[],dependencyFilesCompared:verifyDeps(path.join(R,'tools/ff8-harness')),dependencyDrift:[],preservedFiles:pre.preservedParentChanges.length,preservedDrift:[],indexEmpty:git(['diff','--cached','--name-only'])==='',remainingTrackedChanges:git(['status','--porcelain=v1','--untracked-files=no']).split('\n').filter(Boolean).length};
}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,preservedParentChanges:result.preservedParentChanges?.length,sourcePaths:result.sourcePaths?.length,receipt:output}));
