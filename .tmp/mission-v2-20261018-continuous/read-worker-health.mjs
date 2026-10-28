// Read-only native metadata. No message, prompt, reasoning or session mutation.
import {writeFileSync} from 'node:fs';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const [member,sessionID]=process.argv.slice(2);if(!member||!sessionID)throw Error('member/sessionID required');
const endpoint=await Service.discover(),client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const s=await client.session.get({sessionID});const receipt={at:new Date().toISOString(),member,sessionID,time:s.time,model:s.model,outcome:s.outcome,tokens:s.tokens,cost:s.cost,readOnlyMetadataNoMessages:true};
writeFileSync(new URL('./'+member+'-health-'+Date.now()+'.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
