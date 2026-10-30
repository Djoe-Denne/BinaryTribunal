// Immutable public source capture for contract research only. Never imported/executed.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const commit='68bc26b7da1990ce10ffecfbc1e09eb13aa5d824';
const mode=process.argv[2]??'base';
const scopes={base:{name:'public-core-v2.1.4-r1',files:['packages/core/src/session.ts','packages/core/src/session/inbox.ts','packages/core/src/session/session.ts','packages/core/src/session/execution.ts','packages/core/src/session/execution/restart.ts']},observation:{name:'public-core-v2.1.4-observation-r1',files:['packages/core/src/session/projector.ts','packages/core/src/session/runner/step.ts','packages/core/src/permission.ts','packages/core/src/session/runner/publish-llm-event.ts','packages/core/src/session/run-coordinator.ts']},contract:{name:'public-core-v2.1.4-observation-contract-r1',files:['packages/schema/src/event-log.ts','packages/schema/src/event.ts','packages/schema/src/session.ts','packages/core/src/bus.ts','packages/core/src/session/event.ts','packages/core/src/session/message.ts','packages/server/src/handlers/session.ts','packages/server/test/sse-failure.test.ts']}};
scopes.shapes={name:'public-core-v2.1.4-observation-shapes-r1',files:['packages/schema/src/session-event.ts','packages/schema/src/session-message.ts','packages/protocol/src/groups/session.ts','packages/protocol/src/client.ts','packages/server/src/api.ts']};
scopes.message={name:'public-core-v2.1.4-observation-message-r1',files:['packages/protocol/src/groups/message.ts']};
scopes.owner={name:'public-core-v2.1.4-owner-r1',files:['packages/plugin/src/effect/session.ts','packages/plugin/src/effect/event.ts']};
if(!Object.hasOwn(scopes,mode)||process.argv.length>3)throw Error('Invalid capture scope');
const files=scopes[mode].files,root=path.join(import.meta.dirname,'evidence',scopes[mode].name);
if(fs.existsSync(root))throw Error('Source evidence already captured; no overwrite');
const responses=await Promise.all(files.map(async file=>{const url=`https://raw.githubusercontent.com/anomalyco/opencode/${commit}/${file}`,r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Public source fetch HTTP '+r.status+' '+file);return{file,url,bytes:Buffer.from(await r.arrayBuffer())};}));
fs.mkdirSync(root);
const rows=[];
for(const r of responses){const local=r.file.replaceAll('/','__'),target=path.join(root,local);fs.writeFileSync(target,r.bytes,{flag:'wx'});rows.push({file:r.file,url:r.url,local,bytes:r.bytes.length,sha256:createHash('sha256').update(r.bytes).digest('hex')});}
const manifest={schema:'rms-public-source-evidence-v1',upstream:'https://github.com/anomalyco/opencode',claimedTag:'v2.1.4',commit,rows,executed:false,scope:'Static public source contract evidence only; source-to-current-binary correspondence not yet established'};
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,commit,rows,executed:false}));
