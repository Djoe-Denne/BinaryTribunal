// Final parent observations only. No harness/database execution or Git mutations.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const R=path.resolve(import.meta.dirname,'../../..'),E=path.join(import.meta.dirname,'evidence'),H=path.join(R,'tools/ff8-harness');
const output=path.join(E,'final-parent-l10-readback-r1.json');
if(fs.existsSync(output))throw Error('Immutable readback already exists');
const sha=b=>createHash('sha256').update(b).digest('hex');
function git(args){const r=spawnSync('git',args,{cwd:R,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error('Git observation failed');return r.stdout.trimEnd();}
const head=git(['rev-parse','HEAD']);if(head!=='05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9')throw Error('Candidate HEAD changed');
const m=JSON.parse(fs.readFileSync(path.join(E,'projection-r6-manifest.json')));
for(const row of m.rows){const b=fs.readFileSync(path.join(H,row.file));if(b.length!==row.bytes||sha(b)!==row.sha256)throw Error('Final source drift: '+row.file);}
const deps=JSON.parse(fs.readFileSync(path.join(E,'projection-dependencies.json')));
for(const row of deps.rows){const b=fs.readFileSync(path.join(H,'node_modules',row.path));if(b.length!==row.bytes||sha(b)!==row.sha256)throw Error('Final dependency drift: '+row.path);}
const pre=JSON.parse(fs.readFileSync(path.join(E,'premerge-projection-r6.json')));
for(const row of pre.preservedParentChanges){const b=fs.readFileSync(path.join(R,row.file));if(b.length!==row.bytes||sha(b)!==row.sha256)throw Error('Preexisting change drift: '+row.file);}
const labels=['projection-core-ten-minutes-r6','projection-union-ten-minutes-r6','projection-remaining-ten-minutes-r6','projection-integrated-typecheck-r6','projection-integrated-q1-r6','replacement-nominal-ten-minutes-r1','replacement-activation-ten-minutes-r1','replacement-invariants-ten-minutes-r1'];
const receipts=[];
for(const label of labels){const file=path.join(E,label+'.execution.json'),j=JSON.parse(fs.readFileSync(file,'utf8').trimStart());if(j.exitCode!==0||j.sourceDrift?.length)throw Error('Receipt not successful: '+label);for(const stream of ['stdout','stderr'])if(sha(fs.readFileSync(path.join(E,label+'.'+stream+'.log')))!==j[stream+'Sha256'])throw Error('Capture drift: '+label+' '+stream);receipts.push({file:path.basename(file),sha256:sha(fs.readFileSync(file)),exitCode:j.exitCode,elapsedMs:j.elapsedMs});}
const index=git(['diff','--cached','--name-only']);if(index)throw Error('Index unexpectedly nonempty');
const status=git(['status','--porcelain=v1','--untracked-files=no']).split('\n').filter(Boolean);
if(status.length!==pre.preservedParentChanges.length)throw Error('Tracked scope changed');
const result={schema:'rms-final-parent-readback-v1',head,sourceFilesCompared:m.rows.length,sourceDrift:[],dependenciesCompared:deps.rows.length,dependencyDrift:[],preservedPreexistingFiles:pre.preservedParentChanges.length,preservedDrift:[],indexEmpty:true,remainingTrackedChanges:status.length,receiptsVerified:receipts,scope:'Final code/readback and retained test captures only; no new product test, native call or database opening',acceptance:'Offline increments accepted within stated scope; full M2 acceptance not implied'};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,receiptsVerified:receipts.length,receipt:output}));
