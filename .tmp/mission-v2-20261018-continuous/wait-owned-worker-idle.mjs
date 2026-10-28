// One event-driven native wait, not a polling loop. No messages/reasoning read.
import {writeFileSync} from 'node:fs';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const [member,sessionID]=process.argv.slice(2);if(!member||!sessionID)throw Error('Owned member/session required');
const endpoint=await Service.discover(),client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const started=new Date().toISOString();await client.session.wait({sessionID});
const session=await client.session.get({sessionID});const result={started,at:new Date().toISOString(),member,sessionID,time:session.time,model:session.model,outcome:session.outcome,event:'native-session-wait-returned',taskCompletionNotAssumed:true,noMessagesOrReasoningRead:true};
writeFileSync(new URL('./'+member+'-wait-'+Date.now()+'.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
