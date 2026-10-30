// Reject only a cleanup tool's unaccepted source proposal; never run that source.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),out='docs/missions/rms-plugin-recovery-20261030/native-cleanup';
const before=JSON.parse(fs.readFileSync(path.join(root,out,'before.json'),'utf8'));
const restore=process.argv[2]==='--restore';
if(!restore&&process.argv[2]!=='--check')throw Error('Explicit --check or --restore required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=args=>{const p=spawnSync('git',args,{cwd:root,timeout:20000,maxBuffer:2000000});if(p.status!==0)throw Error('Git operation failed: '+args[0]);return p.stdout;};
const proposal='archive/rms-partial-20261030/raccord-native-runtime';
const replacements=[];
for(const p of before.affectedMain){
  if(!p.path.startsWith('tools/ff8-harness/')&&!p.path.startsWith('.opencode/missions/team_mvshkwxs_000t_2fkx8e/native-runtime-r'))throw Error('Unexpected proposal scope');
  const original=p.exists?git(['show',before.baseMain+':'+p.path]):null;
  if(p.exists&&sha(original)!==p.sha256)throw Error('Cannot reproduce exact preimage: '+p.path);
  const full=path.join(root,p.path),exists=fs.existsSync(full),current=exists?fs.readFileSync(full):null;
  if(exists===p.exists&&(!exists||sha(current)===p.sha256))continue;
  if(!restore)throw Error('Source changed before cleanup');
  if(!exists||sha(current)!==sha(git(['show',proposal+':'+p.path])))throw Error('Refusing to overwrite unexpected bytes: '+p.path);
  replacements.push({p,original,full});
}
const staged=git(['diff','--cached','--name-only']).toString('utf8').trim().split('\n').filter(Boolean);
if(staged.some(p=>!before.affectedMain.some(v=>v.path===p)))throw Error('Unexpected staged path');
if(!restore&&staged.length)throw Error('Index not empty');
if(restore){
  if(staged.length)git(['restore','--staged','--',...staged]);
  for(const {p,original,full} of replacements){if(p.exists)fs.writeFileSync(full,original);else fs.unlinkSync(full);}
  for(const p of before.affectedMain){const full=path.join(root,p.path),exists=fs.existsSync(full);if(exists!==p.exists||(exists&&sha(fs.readFileSync(full))!==p.sha256))throw Error('Readback failed');}
  const receipt={status:'EXACT_PREIMAGES_RESTORED_NO_SOURCE_ACCEPTANCE',checked:before.affectedMain.length,rejectedProposalFiles:replacements.map(x=>x.p.path),productExecuted:false,indexEmpty:git(['diff','--cached','--name-only']).toString('utf8').trim()===''};
  fs.writeFileSync(path.join(root,out,'source-readback.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({status:receipt.status,checked:receipt.checked,rejected:replacements.length,indexEmpty:receipt.indexEmpty}));
}else console.log('42 exact preimages and empty index verified; no source executed');
