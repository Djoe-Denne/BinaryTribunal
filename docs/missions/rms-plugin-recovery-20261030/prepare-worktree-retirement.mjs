// Archive only already-inventoried child worktree changes in Git stashes.
// Canonical user files remain untouched; no --force, reset, runtime or DB access.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),out='docs/missions/rms-plugin-recovery-20261030/native-cleanup';
const before=JSON.parse(fs.readFileSync(path.join(root,out,'before.json'),'utf8'));
const parent='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(cwd,args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout:30000,maxBuffer:1000000});if(r.status!==0)throw Error('Git '+args[0]+' failed; no retry');return r.stdout;};
const jobs=[];
// Close all source and archive checks before the first mutation.
for(const w of before.workers){
  const cwd=parent+w.name,allowed=new Set([...w.files.map(p=>p.source),...w.mirroredProfiles.map(p=>p.path)]);
  const status=git(cwd,['status','--porcelain=v1','--untracked-files=all']).split('\n').filter(Boolean);
  if(status.length!==allowed.size||status.some(l=>!allowed.has(l.slice(3))))throw Error('Worker changed after inventory: '+w.name);
  for(const p of w.files){
    const original=fs.readFileSync(path.join(cwd,p.source)),copy=fs.readFileSync(path.join(root,p.target));
    if(sha(original)!==p.sha256||!original.equals(copy))throw Error('Untracked archive mismatch');
    const oid=git(root,['rev-parse','HEAD:'+p.target]).trim();
    const expected=crypto.createHash('sha1').update(Buffer.from('blob '+copy.length+'\0')).update(copy).digest('hex');
    if(oid!==expected)throw Error('Archive is not committed exactly');
  }
  for(const p of w.mirroredProfiles)if(sha(fs.readFileSync(path.join(cwd,p.path)))!==p.sha256||sha(fs.readFileSync(path.join(root,p.path)))!==p.sha256)throw Error('Canonical profile no longer matches');
  jobs.push({cwd,w});
}
const receipts=[];
for(const {cwd,w} of jobs){
  const tag='rms-partial-archive-20261030-'+w.name;
  git(cwd,['stash','push','--include-untracked','--message',tag]);
  const oid=git(cwd,['rev-parse','refs/stash']).trim();
  const ref='archive/rms-partial-20261030/uncommitted-'+w.name;
  git(root,['branch',ref,oid]);
  if(git(cwd,['status','--porcelain=v1','--untracked-files=all']).trim())throw Error('Worker still dirty after stash');
  receipts.push({worker:w.name,stash:oid,retainedRef:ref,publicInputs:w.files.length,mirroredProfiles:w.mirroredProfiles.length,clean:true});
  fs.writeFileSync(path.join(root,out,'retirement-stashes.json'),JSON.stringify({schema:1,receipts,canonicalProfilesUntouched:true},null,2)+'\n');
}
console.log(JSON.stringify({stashes:receipts.length,retainedReferences:receipts.length,publicInputs:receipts.reduce((n,r)=>n+r.publicInputs,0),canonicalProfilesUntouched:true,allOwnedWorktreesClean:true}));
