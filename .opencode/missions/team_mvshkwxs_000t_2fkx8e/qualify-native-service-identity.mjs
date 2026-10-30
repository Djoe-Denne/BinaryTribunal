// Read-only identity of the existing server. No command line, URL, headers or credentials persisted.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Service} from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
const output=path.join(import.meta.dirname,'evidence','native-service-identity-r1.json');
if(fs.existsSync(output))throw Error('Identity evidence exists; no overwrite');
const endpoint=await Service.discover();if(!endpoint)throw Error('No existing service; no startup permitted');
async function info(){const r=await fetch(new URL('/api/info',endpoint.url),{headers:Service.headers(endpoint),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Info HTTP '+r.status);return r.json();}
const before=await info();
if(!Number.isSafeInteger(before.pid)||before.pid<=0||before.pid>0xffffffff)throw Error('Invalid observed PID');
const command=`Get-CimInstance Win32_Process -Filter "ProcessId=${before.pid}" | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CreationDate | ConvertTo-Json -Compress`;
const query=spawnSync('powershell',['-NoProfile','-Command',command],{encoding:'utf8',timeout:15000});
if(query.status!==0||!query.stdout.trim())throw Error('Owned server process metadata unavailable');
const processInfo=JSON.parse(query.stdout.trim());
if(processInfo.ProcessId!==before.pid||!processInfo.ExecutablePath)throw Error('Server executable identity not readable');
const file=processInfo.ExecutablePath,a=fs.statSync(file),hash=createHash('sha256');
for await(const chunk of fs.createReadStream(file))hash.update(chunk);
const z=fs.statSync(file),after=await info();
if(a.size!==z.size||a.mtimeMs!==z.mtimeMs||before.pid!==after.pid||before.version!==after.version)throw Error('Server identity changed during observation');
const result={schema:'rms-existing-native-service-identity-v1',reportedVersion:before.version,pid:before.pid,processName:processInfo.Name,creationDate:processInfo.CreationDate,executable:{path:file,bytes:z.size,sha256:hash.digest('hex'),mtimeMs:z.mtimeMs},sameServerAfterRead:true,scope:'Current server PID/version and present executable hash; not a process-memory dump or a proven correspondence to an upstream source tag',sideEffects:'GET metadata, process metadata query and streaming file hash only; no restart/reload or execution API called',credentialsPersisted:false};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
