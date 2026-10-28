import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',input=root+'/inputs/L7QA_INITIAL_E03_NATIVE_MAIN_V2';
const review=JSON.parse(readFileSync(phase+'/l7-initial-qa-review-parent-verification.json','utf8'));if(!review.reviewerClosed||review.verdict!=='ACCEPTABLE OFFLINE SCOPED initial QA only'||review.parentInputPinsExact!==422)throw Error('Independent scoped review not verified');
const delivery=JSON.parse(readFileSync(input+'/PARENT/DELIVERY_MANIFEST.json','utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const allowed=new Set(['tools/ff8-harness/test/simulator/graph-interop-support.ts','tools/ff8-harness/test/simulator/graph-interop-relations.test.ts','tools/ff8-harness/test/simulator/graph-interop-structure.test.ts','tools/ff8-harness/test/simulator/graph-interop-adoption.test.ts','tools/ff8-harness/test/simulator/graph-interop-planning.test.ts','tools/ff8-harness/test/simulator/graph-interop-durability.test.ts','tools/ff8-harness/test/benchmarks/graph-interop-scale.test.ts']);
if(delivery.frozenSources.files.length!==allowed.size)throw Error('Unexpected transfer count');
for(const f of delivery.frozenSources.files){if(!allowed.has(f.path)||existsSync(root+'/'+f.path)||sha(readFileSync(input+'/'+f.path))!==f.sha256)throw Error('Destination exists or input differs');}
const paths=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','--','tools/ff8-harness'],{cwd:root,encoding:'utf8'});if(paths.status!==0)throw Error('Cannot inventory preserved harness');
const preserved=[...new Set(paths.stdout.trim().split(/\r?\n/).filter(Boolean))].map(path=>({path,sha256:sha(readFileSync(root+'/'+path))}));
const baseline={reviewTask:review.task,sourceAggregate:review.parentSevenSourceAggregate,files:delivery.frozenSources.files,preserved,authorGlobalL7StillOpen:true,parentFullMainGatePending:true};
writeFileSync(phase+'/l7-initial-main-transfer-before.json',JSON.stringify(baseline,null,2)+'\n',{flag:'wx'});
for(const f of delivery.frozenSources.files){mkdirSync(dirname(root+'/'+f.path),{recursive:true});writeFileSync(root+'/'+f.path,readFileSync(input+'/'+f.path),{flag:'wx'});}
for(const f of [...preserved,...delivery.frozenSources.files])if(sha(readFileSync(root+'/'+f.path))!==f.sha256)throw Error('Post-copy file drift');
console.log(JSON.stringify({newFiles:allowed.size,preservedHarnessPins:preserved.length,allHashesExact:true,productionChanged:false,mainFullGatePending:true,noGlobalL7Closure:true}));
