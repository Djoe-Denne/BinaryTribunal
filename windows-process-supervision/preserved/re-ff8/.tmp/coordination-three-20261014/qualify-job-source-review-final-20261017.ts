import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('job-source-review-r1-packet-admission-20261017.json'),q=load('job-source-review-r1-request-20261017.json'),v=load('job-source-review-r1-parent-packet-verification-20261017.json'),ref=load('job-newline-reference-request-20261017.json'),rv=load('job-newline-reference-parent-verification-20261017.json');
const ep=await Service.discover();assert(ep);const cli=OpenCode.make({baseUrl:ep.url,headers:Service.headers(ep)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===q.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert(['in_progress','completed'].includes(task.status));assert.equal(task.assignee,'job-source-review-r1');assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const reports:Array<{messageId:string;toolId:string;text:string}>=[];let cursor:string|undefined,pages=0;
do{assert(++pages<=5);const page=await cli.message.list({sessionID:a.session,...(cursor?{cursor}:{limit:100,order:'asc'})});for(const m of page.data){if(m.type!=='assistant')continue;for(const part of m.content??[]){const code=part.state?.input?.code;if(part.type!=='tool'||typeof code!=='string'||!code.includes('<task-result>')||!code.includes('UNCERTAIN'))continue;const ast=ts.createSourceFile('public-result.js',code,ts.ScriptTarget.Latest,true);assert.equal(ast.parseDiagnostics.length,0);const walk=(node:ts.Node)=>{if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&node.text.includes('<task-result>')&&node.text.includes('UNCERTAIN'))reports.push({messageId:m.id,toolId:part.id,text:node.text});ts.forEachChild(node,walk);};walk(ast);}}cursor=page.cursor.next??undefined;}while(cursor);
assert.equal(reports.length,1);const r=reports[0]!,b=Buffer.from(r.text),start=r.text.indexOf('<details>')+9,end=r.text.lastIndexOf('</details>');assert(start>=9&&end>start&&r.text.includes('<status>completed</status>'));const details=Buffer.from(r.text.slice(start,end));
for(const required of ['NONBLIND','211','CRLF','900','UNCERTAIN','67108864','Invoke-JobRunner.ps1','aucun','prospect'])assert(r.text.toLowerCase().includes(required.toLowerCase()),required);
for(const input of [q,ref])for(const f of input.files){const path=input.destinationRoot+'/'+f.path;assert.equal(sha(readFileSync(path)),f.sha256);assert.equal(statSync(path).mode&0o222,0);assert.equal(statSync(path).nlink,1);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());}
assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),v.receiptSha256);assert.equal(sha(readFileSync(ref.destinationRoot+'/.preparation-receipt.json')),rv.receiptSha256);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
assert(!existsSync(a.outputDirectory));mkdirSync(a.outputDirectory);writeFileSync(a.outputDirectory+'/WORKER_PUBLIC_RESULT.xml',b,{flag:'wx'});writeFileSync(a.outputDirectory+'/WORKER_PUBLIC_REVIEW.md',details,{flag:'wx'});
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,nativeTaskStatusAtQualification:task.status,proofDirectory:a.outputDirectory,
 publicResult:{bytes:b.length,sha256:sha(b)},publicDetails:{bytes:details.length,sha256:sha(details)},publicSource:{messageId:r.messageId,toolId:r.toolId,method:'public tool string literal via AST only, no eval or private reasoning'},
 verdict:'UNCERTAIN',certainFinding:'U1 incorrect newline byte counter: successful complete writes realBytes=counter+lineCount under default CRLF UTF8 no BOM',
 notEstablished:'Reachable physical 64MiB violation within deadline/polling/job/identity limits; no executed overflow or OS/ABI/confinement BLOCK claimed',
 independentEightSourceAnchorsAndMicrosoftReferenceCheckedNoCompilationOrProbe:true,
 allOriginal10PlusReference8AndBothReceiptsMain275Exact:true,
 priorCoverageParentEndorsedOnlyForUnchangedSourceSurfacesNotHostCorrectness:['validation/quoting/env','ABI declarations inspection','handles and assignment barrier','job0 control flow','timeout/refusal/publication','PS wrapper static'],
 parentDecision:'retain UNCERTAIN; eliminate certain counting error by separately authorized deterministic one-line candidate, preserve old bytes/verdict, fresh bounded delta review before any compile',
 stage:'INDEPENDENT_JOB_SOURCE_REVIEW_RECEIVABLE_UNCERTAIN_U1_NO_COMPILATION_ADOPTION_OR_DYNAMIC_GO',
 noFixCodeOrFrameworkProbeInThisQualification:true,globalL9L10MainNativeIntegrationStillHeld:true};
writeFileSync(phase+'/job-source-review-final-parent-verification-20261017.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
