// Read-only native metadata discovery, no session resumed/modified, no messages read.
import {writeFileSync} from 'node:fs';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const endpoint=await Service.discover();
const client=OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const targets=[{name:'historical-l8-integration-r1',id:'ses_ec12fcc43ffeI6xXQ5rSTty2mV'},{name:'historical-supervisor',id:'ses_eca40a8e2ffeanEKTBLiGjDNw8'}];
const out={at:new Date().toISOString(),sessionApiMethods:Object.keys(client.session),metadata:[]};
for(const t of targets){try{const s=await client.session.get({sessionID:t.id});out.metadata.push({name:t.name,id:t.id,keys:Object.keys(s),model:s.model,location:s.location,time:s.time,status:s.status,parentID:s.parentID,title:s.title});}catch(e){out.metadata.push({name:t.name,id:t.id,error:String(e.message).slice(0,300)});}}
writeFileSync(new URL('./native-ownership-metadata.json',import.meta.url),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(out));
