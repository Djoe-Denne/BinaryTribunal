import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',input=root+'/inputs/L5_BUDGET_REVIEW_985E',sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const review=JSON.parse(readFileSync(phase+'/l5-budget-final-review-parent-verification.json','utf8'));assert(review.reviewerClosed&&review.reviewIndependentNonblind);assert.equal(review.verdict,'ACCEPTABLE allocation correction only; receipt coherence upstream OPEN');
const source='tools/ff8-harness/src/planner.ts',test='tools/ff8-harness/test/planner-admission-budget.test.ts';assert.equal(sha(readFileSync(root+'/'+source)),'37723edf3e365be178bfce2db18e316f9e38efc4e41fbfe16f321760ffecd8b3');assert(!existsSync(root+'/'+test));
const allowed=[{path:source,beforeSha256:sha(readFileSync(root+'/'+source)),sha256:'985e5ead945ac742a7df5370c0009b2e8f1aab357286ad2cb67b3cf01c858988',bytes:84699},{path:test,beforeSha256:null,sha256:'8d02cbec8c7cd8a4f3d8d5a766d18716f9a0bcd370f95fcad74509a4cdff3edb',bytes:39066}];
for(const f of allowed){const b=readFileSync(input+'/'+f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
const list=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','--','tools/ff8-harness'],{cwd:root,encoding:'utf8'});assert.equal(list.status,0);
const preserved=[...new Set(list.stdout.trim().split(/\r?\n/).filter(Boolean))].filter(p=>p!==source).map(path=>({path,sha256:sha(readFileSync(root+'/'+path))}));
const index=spawnSync('git',['diff','--cached','--name-only'],{cwd:root,encoding:'utf8'});assert.equal(index.status,0);assert(!index.stdout.trim());
const rec={reviewTask:review.task,source:allowed,preserved,preservedCount:preserved.length,reason:'Exact reviewed two-file candidate transfer for parent gates, not yet integration/commit approval',receiptsUpstreamOpen:true,L8StillFrozen:true};
writeFileSync(phase+'/l5-budget-main-transfer-before.json',JSON.stringify(rec,null,2)+'\n',{flag:'wx'});
for(const f of allowed)writeFileSync(root+'/'+f.path,readFileSync(input+'/'+f.path),f.beforeSha256===null?{flag:'wx'}:{});
for(const f of [...preserved,...allowed])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256,'Post-transfer drift '+f.path);
console.log(JSON.stringify({reviewedFilesTransferred:allowed.length,preservedHarnessPins:preserved.length,allPinsExact:true,mainGatesPending:true,notYetAcceptedIntegratedOrCommitted:true,noOtherSourcesChanged:true}));
