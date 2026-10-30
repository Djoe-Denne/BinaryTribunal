// Preserve public untracked worker inputs before native team retirement.
// No candidate imports, DB, network, profile-content inspection or product execution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(), out='docs/missions/rms-plugin-recovery-20261030/native-cleanup';
const parent='C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-';
const workers=['raccord-runtime-public','publication-durable','projection-contexte','admission-native-repos','observations-native-data','commandes-obsolescence','raccord-native-runtime'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(cwd,args)=>{const p=spawnSync('git',args,{cwd,encoding:'utf8',timeout:20000,maxBuffer:2000000});if(p.status!==0)throw Error('Git read failed: '+args[0]);return p.stdout;};
const put=(p,b)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),b);};
const report={schema:1,baseMain:git(root,['rev-parse','HEAD']).trim(),strategy:'Preserve all public untracked inputs; native cleanup only; any proposed unaccepted source merge will be rejected before commit, without execution',workers:[],affectedMain:[]};
const secret=/(?:\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}|Bearer\s+[A-Za-z0-9._~-]{24,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,})/;
for(const name of workers){
  const cwd=parent+name, files=[], mirroredProfiles=[];
  const status=git(cwd,['status','--porcelain=v1','--untracked-files=all']).split('\n').filter(Boolean);
  for(const line of status){
    const p=line.slice(3);
    if(p.startsWith('.opencode/agents/')&&line.startsWith(' M ')){
      // Compare opaque bytes only; leave the canonical user's files untouched.
      const a=fs.readFileSync(path.join(cwd,p)),b=fs.readFileSync(path.join(root,p));
      if(!a.equals(b))throw Error('Worker profile differs from canonical copy: '+name+'/'+p);
      mirroredProfiles.push({path:p,sha256:sha(a),canonicalCopyRetained:true});continue;
    }
    if(!line.startsWith('?? ')||!(/^\.opencode\/missions\/team_mvshkwxs_000t_2fkx8e\//.test(p)||p.startsWith('.tmp/L8_PHASE_A_V2/')))throw Error('Unexpected dirty path: '+name+'/'+p);
    if(!/\.(?:md|json|jsonl|ts|mjs|ps1|py|txt)$/.test(p)||/node_modules|\.sqlite|auth-private-/.test(p))throw Error('Unsafe untracked input: '+p);
    const stat=fs.lstatSync(path.join(cwd,p));if(!stat.isFile()||stat.isSymbolicLink())throw Error('Not a plain input');
    const b=fs.readFileSync(path.join(cwd,p));if(secret.test(b.toString('utf8')))throw Error('Credential-pattern hold: '+p);
    const target=out+'/worker-inputs/'+name+'/'+p;put(target,b);files.push({source:p,target,bytes:b.length,sha256:sha(b)});
  }
  report.workers.push({name,files,mirroredProfiles});
}
const branch='ensemble/preserved/re-ff8/mission-91f7c6bb382078be#2fkx8e/raccord-native-runtime';
const base=git(root,['merge-base','HEAD',branch]).trim();
for(const p of git(root,['diff','--name-only',base,branch]).trim().split('\n').filter(Boolean)){
  const status=git(root,['status','--porcelain=v1','--',p]).trim();if(status)throw Error('Canonical overlap before cleanup: '+p);
  const full=path.join(root,p),exists=fs.existsSync(full);
  report.affectedMain.push({path:p,exists,sha256:exists?sha(fs.readFileSync(full)):null});
}
put(out+'/before.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({workers:report.workers.length,publicInputs:report.workers.reduce((n,w)=>n+w.files.length,0),mirroredProfiles:report.workers.reduce((n,w)=>n+w.mirroredProfiles.length,0),affectedMain:report.affectedMain.length,baseMain:report.baseMain}));
