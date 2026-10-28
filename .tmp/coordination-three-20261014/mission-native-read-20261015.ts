import {writeFileSync} from 'node:fs';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const endpoint=await Service.discover(); if(!endpoint)throw Error('No public native API');
const client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const response=await fetch('http://127.0.0.1:4747/api/state'); if(!response.ok)throw Error('No public mission state');
const team=(await response.json()).teams.find((x:any)=>x.name==='re-graph-scheduler');
if(team?.leadSessionId!=='ses_eca40a8e2ffeanEKTBLiGjDNw8')throw Error('Lead identity mismatch');
const names=process.argv.slice(2);
for(const name of ['lead',...names]){
 const member=name==='lead'?{sessionId:team.leadSessionId}:team.members.find((x:any)=>x.name===name);
 if(!member)throw Error('Unknown owned member '+name);
 const session=await client.session.get({sessionID:member.sessionId});
 console.log(JSON.stringify({name,sessionID:member.sessionId,model:session.model,location:session.location,task:member.taskId}));
 if(name==='lead')continue;
 let cursor: string|undefined; const messages:any[]=[];
 const seen=new Set<string>();
 do{const page=await client.message.list({sessionID:member.sessionId,...(cursor?{cursor}:{limit:100,order:'asc' as const})});messages.push(...page.data);cursor=page.cursor.next??undefined;if(cursor&&seen.has(cursor))throw Error('Repeated pagination cursor');if(cursor)seen.add(cursor);}while(cursor);
 const file=root+'/.tmp/coordination-three-20261014/'+name+'-native-messages-20261015.json';
 writeFileSync(file,JSON.stringify({member,session,messages},null,2)+'\n',{flag:'wx'});
 console.log('Preserved '+messages.length+' messages at '+file);
 const reports=messages.filter(m=>JSON.stringify(m).includes('team_message'));
 console.log(JSON.stringify(reports.slice(-3),null,2).slice(-16000));
}
