// Read-only native session API; does not start/resume/modify any session.
import {writeFileSync} from 'node:fs';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const [member,sessionID,providerID,id,variant] = process.argv.slice(2);
if (!member || !sessionID || !providerID || !id || !variant) throw Error('Five arguments required');
const endpoint = await Service.discover();
const client = OpenCode.make({baseUrl:endpoint.url,headers:Service.headers(endpoint)});
const session = await client.session.get({sessionID});
const expected = {providerID,id,variant};
const model = session.model;
const matches = !!model && model.providerID===providerID && model.id===id && model.variant===variant && !model.id.includes('#');
const receipt = {at:new Date().toISOString(),member,sessionID,directory:session.directory,expectedFromApprovedRouting:expected,nativeModelRef:model,matches,policyRevision:1};
writeFileSync(new URL('./'+member+'-native-ref.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt));
if (!matches) process.exitCode=2;
