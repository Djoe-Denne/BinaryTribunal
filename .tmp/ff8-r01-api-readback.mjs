import { Service } from 'file:///C:/Users/djden/source/repos/opencode-ensemble-session/node_modules/@opencode/client/dist/promise/service.js';
import fs from 'node:fs';
const ep = await Service.discover();
if (!ep) throw new Error('No healthy discovered service; no start attempted');
const headers = Service.headers(ep);
const api = await (await fetch(ep.url + '/openapi.json', { headers })).json();
const id = process.argv[2];
if (!id?.startsWith('ses_')) throw new Error('Native session ID required');
const r = await fetch(ep.url + '/api/session/' + id, { headers });
if (!r.ok) throw new Error('Native readback HTTP ' + r.status);
const info = (await r.json()).data;
const candidate = Object.entries(api.paths).find(([p,v]) => p === '/api/session/{sessionID}/message' && v.get);
let messages = null;
if (candidate) {
  const m = await fetch(ep.url + candidate[0].replace('{sessionID}', id), { headers });
  messages = m.ok ? await m.json() : { httpStatus: m.status };
}
const serialized=JSON.stringify({at_utc:new Date().toISOString(),session:info,messages},null,2);
if(process.argv[3]) {
  if(fs.existsSync(process.argv[3])) throw new Error('Immutable receipt already exists');
  fs.writeFileSync(process.argv[3],serialized+'\n','utf8');
  console.log(JSON.stringify({session:info.id,model:info.model,outcome:info.outcome,artifact:process.argv[3]}));
} else console.log(serialized);
