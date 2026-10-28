import { readFileSync, writeFileSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('preintegration-boundary-review-native-inputs-20261016.json'),q=load('preintegration-boundary-review-preparation-request-20261016.json'),p=load('preintegration-boundary-review-parent-materialization-20261016.json');
const endpoint=await Service.discover();assert(endpoint);const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)}),session=await cli.session.get({sessionID:a.session});assert.deepEqual(session.model,a.model);
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.id===a.missionId),task=team.tasks.find((t:any)=>t.id===a.task);assert.equal(task.status,'completed');assert.equal(task.assignee,'preintegration-boundary-r1');assert.equal(team.tasks.find((t:any)=>t.id==='task_mv6towry_000d_c1nxby').status,'blocked');
const reports:Array<{messageId:string;toolId:string;text:string}>=[];let cursor:string|undefined,pages=0;
do{assert(++pages<=5);const page=await cli.message.list({sessionID:a.session,...(cursor?{cursor}:{limit:100,order:'asc'})});
 for(const m of page.data){if(m.type!=='assistant')continue;for(const part of m.content??[]){if(part.type!=='tool'||typeof part.state?.input?.code!=='string')continue;
  const code=part.state.input.code;if(!code.includes('<task-result>')||!code.includes('ACCEPTABLE_BOUNDARY_SCOPED'))continue;
  const ast=ts.createSourceFile('public-tool-input.js',code,ts.ScriptTarget.Latest,true);assert.equal(ast.parseDiagnostics.length,0);
  const visit=(node:ts.Node)=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='text'&&node.initializer&&(ts.isStringLiteral(node.initializer)||ts.isNoSubstitutionTemplateLiteral(node.initializer))){assert(node.initializer.text.includes('<task-result>'));reports.push({messageId:m.id,toolId:part.id,text:node.initializer.text});}ts.forEachChild(node,visit);};visit(ast);
 }}cursor=page.cursor.next??undefined;
}while(cursor);
assert.equal(reports.length,1);const report=reports[0]!,xml=Buffer.from(report.text),start=report.text.indexOf('<details>')+9,end=report.text.lastIndexOf('</details>');assert(start>=9&&end>start);const details=Buffer.from(report.text.slice(start,end));
assert(report.text.includes('<status>completed</status>')&&report.text.includes('ACCEPTABLE_BOUNDARY_SCOPED'));for(const s of ['NONBLIND','graph-pipeline.ts','planner.ts','simulator.ts','client.ts','graph-adapter.ts','graph-engine.ts','unit-lease.ts','cli.ts','neuf callbacks','Aucune nouvelle reproduction','globale'])assert(report.text.includes(s),s);
for(const f of q.files){const path=q.destinationRoot+'/'+f.path;assert.equal(sha(readFileSync(path)),f.sha256);assert.equal(statSync(path).mode&0o222,0);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(statSync(path).nlink,1);}
const ledger=q.destinationRoot+'/'+a.ledger.path;assert.equal(sha(readFileSync(ledger)),a.ledger.sha256);assert.equal(statSync(ledger).size,8943882);assert.equal(statSync(ledger).mode&0o222,0);assert.equal(statSync(ledger).nlink,1);assert(!lstatSync(ledger).isSymbolicLink());
assert.equal(sha(readFileSync(q.destinationRoot+'/.preparation-receipt.json')),p.helperReceiptSha256);assert.equal(sha(readFileSync(q.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json')),p.parentReceiptSha256);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync(root+'/'+f.path)),f.sha256);
writeFileSync(a.proofDirectory+'/WORKER_PUBLIC_TASK_RESULT.xml',xml,{flag:'wx'});writeFileSync(a.proofDirectory+'/WORKER_PUBLIC_REVIEW.md',details,{flag:'wx'});
const out={at:new Date().toISOString(),task:task.id,session:session.id,model:session.model,profile:'plan',packet:q.destinationRoot,proofDirectory:a.proofDirectory,
 publicSource:{messageId:report.messageId,toolId:report.toolId,capture:'public tool literal parsed by TypeScript AST, never eval; reasoning parts/text not read or archived'},
 publicTaskResultBytes:xml.length,publicTaskResultSha256:sha(xml),publicDetailsBytes:details.length,publicDetailsSha256:sha(details),detailsExtraction:'exact slice between details tags, no trimming',
 verdict:'ACCEPTABLE_BOUNDARY_SCOPED',parentDecision:'RETAIN_RECEIVABLE_INDEPENDENT_STATIC_BOUNDARY_AUDIT_noGlobalL9L10OrMainAcceptance',
 eightAnchorsAndContrariesAgainstPinnedSourcesExplicitTestAndStaticLimitsRead:true,parentSelectiveChecksPlannerCapFormulaImmediateTransactionRawCapturedAuthorityAndCrossQaControls:true,
 noNewDynamicReproTscTestProbeDbCacheOrProductImportClaimedOrRequiredByThisAudit:true,
 all453RegularReadonlyNonlink1PinsBothReceiptsAndMain275Exact:true,
 workerPlanPublicReportOnlyNoWriteBypassParentArchivedPublicDelivery:true,
 nativeTaskCompletedFreshNonblindBootstrapExposureQualifiedNoCompletedReviewRestart:true,globalL9StillBlocked:true,
 stage:'BOUNDARY_AUDIT_FINAL_RECEIVABLE_PARENT_FULL_NONREGRESSION_VALIDATION_STILL_REQUIRED_BEFORE_INTEGRATION',
 limitations:['no per-admission byte-exact reopen test comparator','no future artifact acquisition or native authority','same Engine/Store/lease reopen not controller restart','unsupported B/adopted/shadow/native CLI remain global gaps','no hostile JS Proxy or100k exhaustive proof']};
writeFileSync(phase+'/preintegration-boundary-final-parent-verification-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
