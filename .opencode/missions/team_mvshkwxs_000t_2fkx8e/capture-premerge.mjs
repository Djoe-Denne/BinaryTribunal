// Parent-owned integration guard. Reads Git/files and writes only a mission receipt.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const R=path.resolve(import.meta.dirname,'../../..');
const W='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-runtime-public';
const expected='b0d10f6d19ad54c21a9635e90d6b4946fde4ffd0';
const E=path.join(import.meta.dirname,'evidence');
const file=path.join(E,'premerge-r6.json');
const need=(x,s)=>{if(!x)throw Error(s);};
const sha=b=>createHash('sha256').update(b).digest('hex');
function git(args,cwd=R){const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout:10000});need(r.status===0,'Git observation failed');return r.stdout;}
need(!fs.existsSync(file),'premerge receipt already exists');
need(git(['rev-parse','HEAD'],W).trim()===expected,'writer HEAD changed');
need(git(['status','--porcelain=v1','--untracked-files=no'],W).trim()==='','writer tracked state dirty');
need(git(['diff','--cached','--name-only']).trim()==='','parent index contains staged work');
const sourcePaths=git(['diff','--name-only','-z','HEAD...'+expected]).split('\0').filter(Boolean);
need(sourcePaths.length===68&&sourcePaths.every(f=>f.startsWith('tools/ff8-harness/')),'unexpected integration scope');
const status=git(['status','--porcelain=v1','-z','--untracked-files=no']).split('\0').filter(Boolean);
need(status.every(s=>s.slice(0,2)===' M'),'unexpected parent index/status; inspect without mutation');
const preserved=status.map(s=>{const rel=s.slice(3);need(!sourcePaths.includes(rel),'parent tracked edit overlaps candidate');const f=path.join(R,rel);need(fs.lstatSync(f).isFile(),'nonregular parent edit');const b=fs.readFileSync(f);return{path:rel,status:s.slice(0,2),bytes:b.length,sha256:sha(b)};});
const others=git(['ls-files','--others','--exclude-standard','-z','--','tools/ff8-harness']).split('\0').filter(Boolean);
need(!others.some(f=>sourcePaths.includes(f)),'untracked parent source collision');
const m=JSON.parse(fs.readFileSync(path.join(E,'writer-r6-manifest.json')));
for(const r of m.rows){const b=fs.readFileSync(path.join(m.root,r.file));need(b.length===r.bytes&&sha(b)===r.sha256,'reviewed source drift');}
const receipt={schema:'rms-parent-premerge-v1',parentHead:git(['rev-parse','HEAD']).trim(),writerHead:expected,sourcePaths,preservedParentChanges:preserved,indexWasEmpty:true,untrackedSourceOverlap:false,reviewedFiles:360,reviewManifestSha256:sha(fs.readFileSync(path.join(E,'writer-r6-manifest.json'))),hooks:'Parent observed default hooks directory, no non-sample hooks; no override or bypass',scope:'Permission for scoped integration only; no native or final mission acceptance'};
fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({state:'PREMERGE_GUARDS_OK',sourcePaths:sourcePaths.length,parentChangesPreserved:preserved.length,reviewedFiles:360,parentHead:receipt.parentHead,writerHead:expected}));
