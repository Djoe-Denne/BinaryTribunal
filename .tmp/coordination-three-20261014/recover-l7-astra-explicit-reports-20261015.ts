import {writeFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',sid='ses_ec0192753ffeWKOqq53yPbjVoL';
const e=await Service.discover();assert(e);const cli=OpenCode.make({baseUrl:e.url,headers:Service.headers(e)}),session=await cli.session.get({sessionID:sid});assert.deepEqual(session.model,{id:'gpt-6-astra',providerID:'openai',variant:'max'});
const response=await fetch('http://127.0.0.1:4747/api/state');assert(response.ok);const team=(await response.json()).teams.find((t:any)=>t.name==='re-graph-scheduler');assert.equal(team?.leadSessionId,'ses_eca40a8e2ffeanEKTBLiGjDNw8');const member=team.members.find((m:any)=>m.name==='l7-simulator-fix-astra');assert.equal(member?.sessionId,sid);
const reports:string[]=[],completed:any[]=[];function scan(x:any){if(!x||typeof x!=='object')return;if(x.input?.to==='lead'&&typeof x.input.text==='string')reports.push(x.input.text);if(x.input?.task_id==='task_mv9m9894_0015_cjacy0'||x.input?.taskId==='task_mv9m9894_0015_cjacy0')completed.push(x.input);for(const v of Object.values(x))if(v&&typeof v==='object')scan(v);}
let cursor:string|undefined;do{const p=await cli.message.list({sessionID:sid,...(cursor?{cursor}:{limit:100,order:'asc'})});for(const m of p.data)if(m.type==='assistant')scan(m.content);cursor=p.cursor.next??undefined;}while(cursor);
const result={reason:'team_message reports completed but team_results no unread; recover explicit reports, no task restart',member,session:{id:session.id,model:session.model,directory:session.location.directory},reports,taskInputs:completed};
writeFileSync(root+'/.tmp/coordination-three-20261014/l7-astra-explicit-public-reports.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({memberStatus:member.status,model:session.model,reports:reports.length,taskInputs:completed.length}));console.log(reports.slice(-3).join('\n\n--- REPORT ---\n\n'));
