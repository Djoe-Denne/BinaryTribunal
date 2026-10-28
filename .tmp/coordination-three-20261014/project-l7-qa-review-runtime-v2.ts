import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',input=root+'/inputs/L7QA_INITIAL_E03_NATIVE_MAIN_V2',checkout='C:/Users/djden/.local/share/opencode/worktree/68ae5f/re-graph-qa-readonly-20261015';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8'));
if(receipt.targetSessionId!=='ses_ec0d1b02affeIvtVOYGjNaLIBJ'||receipt.fingerprint!=='750343b91cb74e704a5f67e2ec6dde5e16123d914fa6d4ee0573ea7bac493dcc')throw Error('Receipt differs');
const h=spawnSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'});if(h.status!==0||!h.stdout.startsWith('6ab2680'))throw Error('Checkout HEAD differs');
let copied=0,exact=0,rawCopied=0;
for(const f of receipt.files){const b=readFileSync(input+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Prepared pin drift '+f.path);const isRaw=f.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/');if(!f.path.startsWith('tools/ff8-harness/')&&!isRaw)continue;const to=checkout+'/'+f.path;if(existsSync(to)){if(sha(readFileSync(to))!==f.sha256)throw Error('Existing runtime file differs '+f.path);exact++;}else{mkdirSync(dirname(to),{recursive:true});writeFileSync(to,b,{flag:'wx'});if(isRaw)rawCopied++;else copied++;}}
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json',ledgerSha=sha(readFileSync(checkout+'/'+ledger));if(ledgerSha!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Tracked ledger differs');
const refs=['docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json','docs/tech/investigation/battle-static-discovery/magic-registry.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'];
for(const p of refs){const f=receipt.files.find((f:any)=>f.path===p);if(!f||sha(readFileSync(checkout+'/'+p))!==f.sha256)throw Error('Runtime reference drift');}
const audit={session:'ses_ec0d1b02affeIvtVOYGjNaLIBJ',nativeDirectory:root,testCheckout:checkout,head:h.stdout.trim(),receipt:receipt.fingerprint,pins:receipt.files.length,harnessPreexistingExact:exact,harnessCopiedWithoutOverwrite:copied,originalRawExplicitlyCopied:rawCopied,ledgerPreexistingTrackedSha256:ledgerSha,ledgerNotHelperTransferred:true,refsExact:4,helperBindingAtMainOnly:true,actualWorkerAccessPending:true,sourceWritesByReviewer:false};
writeFileSync(phase+'/l7-initial-qa-runtime-v2-raw.json',JSON.stringify(audit,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(audit));
