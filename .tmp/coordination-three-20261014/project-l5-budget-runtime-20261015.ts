import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',admission=JSON.parse(readFileSync(phase+'/l5-budget-admission-post.json','utf8')),input=admission.owned+'/inputs/L5_BUDGET_FIX_13874bc';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8')),manifest=JSON.parse(readFileSync(input+'/INPUT_MANIFEST.json','utf8'));
if(receipt.targetSessionId!==admission.sessionID||receipt.taskId!==admission.taskId||receipt.fingerprint!=='05d86508481d98a3bde603d73d3f24d75de95b92c06d62ef6bdf3dca38446ed3')throw Error('Wrong preparation binding');
for(const f of receipt.files){const b=readFileSync(input+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Prepared pin drift');}
let exact=0,copied=0;
for(const f of manifest.files){if(f.origin.startsWith('owned committed HEAD')){if(sha(readFileSync(admission.owned+'/'+f.path))!==f.sha256)throw Error('HEAD differs '+f.path);exact++;}else if(f.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/')){const to=admission.owned+'/'+f.path,b=readFileSync(input+'/'+f.path);if(existsSync(to)){if(sha(readFileSync(to))!==f.sha256)throw Error('Existing raw differs');}else{mkdirSync(dirname(to),{recursive:true});writeFileSync(to,b,{flag:'wx'});copied++;}}}
if(existsSync(admission.owned+'/tools/ff8-harness/src/graph-pipeline.ts')||existsSync(admission.owned+'/tools/ff8-harness/src/simulator.ts'))throw Error('Unaccepted candidate unexpectedly projected into ROOT');
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json',ledgerSha=sha(readFileSync(admission.owned+'/'+ledger));if(ledgerSha!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Tracked ledger differs');
const audit={session:admission.sessionID,task:admission.taskId,model:admission.model,nativeOwnedDirectory:admission.owned,head:admission.head,preparedPinsVerified:receipt.files.length,bytes:receipt.totalBytes,receipt:receipt.fingerprint,preexistingHeadAndRefsExact:exact,originalRawExplicitlyCopied:copied,noReferenceL8OrSimulatorCopiedIntoRoot:true,ledgerPreexistingTrackedSha256:ledgerSha,ledgerNotTransferred:true,codeApprovalPending:true,actualWorkerAccessPending:true};
writeFileSync(phase+'/l5-budget-runtime-readback.json',JSON.stringify(audit,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(audit));
