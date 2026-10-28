import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',a=JSON.parse(readFileSync(phase+'/l7sim-astra-admission-post.json','utf8')),input=a.owned+'/inputs/L7SIM_ASTRA_FBCA7D9',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8')),m=JSON.parse(readFileSync(input+'/INPUT_MANIFEST.json','utf8'));
if(receipt.targetSessionId!==a.sessionID||receipt.taskId!==a.taskId||receipt.fingerprint!=='54c0c6c976e4b4fe596ab578491fafebe2c45dc21eaa8d5b47c84f5e1fd8ac79')throw Error('Wrong input binding');
for(const p of receipt.files){const b=readFileSync(input+'/'+p.path);if(b.length!==p.bytes||sha(b)!==p.sha256)throw Error('Prepared pin drift');}
let headExact=0,rawCopied=0,candidateCopied=0;
for(const p of m.files){if(p.origin.startsWith('accepted OWN HEAD')){if(sha(readFileSync(a.owned+'/'+p.path))!==p.sha256)throw Error('Fresh HEAD differs');headExact++;continue;}
 const raw=p.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/'),candidate=p.origin.startsWith('unaccepted ac82 corrective simulator candidate');if(!raw&&!candidate)continue;
 const to=a.owned+'/'+p.path;if(existsSync(to)){if(sha(readFileSync(to))!==p.sha256)throw Error('Would overwrite existing runtime bytes');}else{mkdirSync(dirname(to),{recursive:true});writeFileSync(to,readFileSync(input+'/'+p.path),{flag:'wx'});if(raw)rawCopied++;else candidateCopied++;}}
const candidateSha=sha(readFileSync(a.owned+'/tools/ff8-harness/src/simulator.ts'));if(candidateSha!=='ac82e53ab62943dab81d9aa0ad634443f0af28ef06d60ad8d559c00a1b43fb3a')throw Error('Wrong simulator candidate');
const plannerSha=sha(readFileSync(a.owned+'/tools/ff8-harness/src/planner.ts'));if(plannerSha!=='37723edf3e365be178bfce2db18e316f9e38efc4e41fbfe16f321760ffecd8b3')throw Error('Unaccepted parallel L5 leaked');
const ledgerSha=sha(readFileSync(a.owned+'/docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json'));if(ledgerSha!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Tracked ledger drift');
const audit={session:a.sessionID,task:a.taskId,model:a.model,owned:a.owned,head:a.head,preparedFiles:receipt.files.length,bytes:receipt.totalBytes,receipt:receipt.fingerprint,headRefsExact:headExact,originalRawExplicitlyCopied:rawCopied,unacceptedCandidateFilesExplicitlyCopied:candidateCopied,candidateSha,acceptedPlannerSha:plannerSha,ledgerSeparatelyTrackedNotTransferred:ledgerSha,codePlanApprovalPending:true,actualAccessPending:true,mainNotModified:true};
writeFileSync(phase+'/l7sim-astra-runtime-readback.json',JSON.stringify(audit,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(audit));
