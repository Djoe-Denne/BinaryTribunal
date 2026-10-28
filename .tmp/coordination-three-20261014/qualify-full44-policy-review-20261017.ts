import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('full44-policy-r1-packet-admission-20261017.json'),q=load('full44-policy-r1-request-20261017.json'),v=load('full44-policy-r1-parent-packet-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert(['in_progress','completed'].includes(task.status));assert.equal(task.assignee,'full44-policy-r1');assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const candidates:Array<{messageId:string;toolId:string;text:string}>=[];let cursor:string|undefined,pages=0;
do{assert(++pages<=5);const page=await cli.message.list({sessionID:a.session,...(cursor?{cursor}:{limit:100,order:'asc'})});for(const m of page.data){if(m.type!=='assistant')continue;for(const p of m.content??[]){if(p.type!=='tool'||typeof p.state?.input?.code!=='string')continue;const code=p.state.input.code;if(!code.includes('ACCEPTABLE_PROPOSAL_SCOPED')||!code.includes('<task-result>'))continue;
 const ast=ts.createSourceFile('public-result.js',code,ts.ScriptTarget.Latest,true);assert.equal(ast.parseDiagnostics.length,0);const walk=(node:ts.Node)=>{if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&node.text.includes('<task-result>')&&node.text.includes('ACCEPTABLE_PROPOSAL_SCOPED'))candidates.push({messageId:m.id,toolId:p.id,text:node.text});ts.forEachChild(node,walk);};walk(ast);
 }}cursor=page.cursor.next??undefined;}while(cursor);
assert.equal(candidates.length,1);const c=candidates[0]!,b=Buffer.from(c.text),start=c.text.indexOf('<details>')+9,end=c.text.lastIndexOf('</details>');assert(start>=9&&end>start);assert(c.text.includes('<status>completed</status>'));const details=Buffer.from(c.text.slice(start,end));
for(const required of ['NONBLIND','ORDRE_MISSION.md','UNAPPROVED_POLICY.md','store.test.ts','graph-interop-durability.test.ts','fixture-driver.ts','Conditions minimales','Limites','49 payloads'])assert(c.text.includes(required),required);
let bytes=0;for(const f of q.files){const p=a.destinationRoot+'/'+f.path,x=readFileSync(p),s=statSync(p);assert.equal(sha(x),f.sha256);assert.equal(s.mode&0o222,0);assert.equal(s.nlink,1);assert(lstatSync(p).isFile()&&!lstatSync(p).isSymbolicLink());bytes+=x.length;}assert.equal(bytes,921813);assert.equal(sha(readFileSync(a.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
assert(!existsSync(a.outputDirectory));mkdirSync(a.outputDirectory);writeFileSync(a.outputDirectory+'/WORKER_PUBLIC_RESULT.xml',b,{flag:'wx'});writeFileSync(a.outputDirectory+'/WORKER_PUBLIC_REVIEW.md',details,{flag:'wx'});
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',verdict:'ACCEPTABLE_PROPOSAL_SCOPED',proofDirectory:a.outputDirectory,
 publicResult:{bytes:b.length,sha256:sha(b)},publicDetails:{bytes:details.length,sha256:sha(details)},publicSource:{messageId:c.messageId,toolId:c.toolId,method:'exact public tool literal via AST never eval; private reasoning and assistant thought text skipped'},
 independentNonblindPublicBootstrapExposureDeclaredNoFurtherWork:true,nativeTaskStatusAtQualification:task.status,
 publicCompletedReportDoesNotProveNativeTaskClosureParentWillReconcileAfterQualification:true,
 firstQualificationStoppedOnNativeInProgressBeforeAnyArchiveNoProductOrWorkerRerun:true,
 all49Payloads921813BytesReceiptAndMain275Unchanged:true,sourceAndAuthorityEightAnchorsAndStaticCounterexamplesQualified:true,
 reviewAcceptableOnlyForExplicitlyReducedProspectiveGuaranteesNoAtomicCrashOrSandboxClaim:true,
 minimalConditions:['parent written exact CDB1 and synthetic receipt versus real run evidence distinction','new image TEMP registry and source/run binding paths qualified','raw post-exit retained files plus present suffixes; no all-time sidecar claim','root natural zero AND owned JobActiveZero prior to normal acceptance','any ambiguous missing incomplete evidence HOLD no repair rerun cleanup or orphan glob'],
 stage:'POLICY_REVIEW_RECEIVABLE_PROPOSAL_STILL_NOT_RATIFIED_BY_THIS_VERIFICATION_NO_DYNAMIC_GO',
 noCompilerJobApiProductFixtureTestsDbCacheRuntimeSqlGitNativeOrIntegrationByThisVerification:true,
 globalL9StillBlockedL10MainHeld:true};
writeFileSync(phase+'/full44-policy-final-parent-verification-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
