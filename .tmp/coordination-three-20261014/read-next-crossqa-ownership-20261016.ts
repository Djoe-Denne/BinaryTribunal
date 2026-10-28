import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const endpoint=await Service.discover();if(!endpoint)throw Error('No native endpoint');
const cli=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const response=await fetch('http://127.0.0.1:4747/api/state');if(!response.ok)throw Error('No mission state');
const state=await response.json(),team=state.teams.find((t:any)=>t.name==='re-graph-scheduler');if(!team)throw Error('No existing mission');
const members=team.members.filter((m:any)=>['l7-copy851-review','l7-copy-astra','l7-interop-r1','l7-qa-r3','l8-integration-r1'].includes(m.name));
const list=[];for(const m of members){const s=await cli.session.get({sessionID:m.sessionId??m.sessionID});list.push({name:m.name,session:s.id,model:s.model,agent:m.agent,status:m.status,directory:s.location.directory,tasks:team.tasks.filter((t:any)=>t.assignee===m.name).map((t:any)=>({id:t.id,status:t.status,content:t.content.slice(0,180)}))});}
const lead=await cli.session.get({sessionID:team.leadSessionId});
console.log(JSON.stringify({at:new Date().toISOString(),id:team.id,lead:{session:lead.id,model:lead.model},members:list,modelRevision:team.modelPolicy.revision,providerRevision:team.routingPolicy.revision,scheduling:team.scheduling??null}));
