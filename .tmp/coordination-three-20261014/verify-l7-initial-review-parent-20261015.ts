import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Service} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import {OpenCode} from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sid='ses_ec0d1b02affeIvtVOYGjNaLIBJ';
const e=await Service.discover();if(!e)throw Error('No public API');const cli=OpenCode.make({baseUrl:e.url,headers:Service.headers(e)}),session=await cli.session.get({sessionID:sid});
if(session.model?.providerID!=='openai'||session.model.id!=='gpt-6.1-sol'||session.model.variant!=='max')throw Error('Reviewer Model.Ref drift');
const reports:string[]=[];function scan(x:any){if(!x||typeof x!=='object')return;if(x.input?.to==='lead'&&typeof x.input.text==='string')reports.push(x.input.text);for(const v of Object.values(x))if(v&&typeof v==='object')scan(v);}
let cursor:string|undefined;do{const p=await cli.message.list({sessionID:sid,...(cursor?{cursor}:{limit:100,order:'asc'})});for(const m of p.data)if(m.type==='assistant')scan(m.content);cursor=p.cursor.next??undefined;}while(cursor);
const joined=reports.join('\n');if(!joined.includes('ACCEPTABLE')||!joined.includes('SCOP')||!joined.includes('512'))throw Error('Full scoped report not recovered');
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const input=root+'/inputs/L7QA_INITIAL_E03_NATIVE_MAIN_V2',receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8'));
for(const f of receipt.files){const b=readFileSync(input+'/'+f.path);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Frozen QA package drift');}
const checkout='C:/Users/djden/.local/share/opencode/worktree/68ae5f/re-graph-qa-readonly-20261015',paths=receipt.files.filter((f:any)=>f.path.startsWith('tools/ff8-harness/')||f.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/'));
for(const f of paths)if(sha(readFileSync(checkout+'/'+f.path))!==f.sha256)throw Error('Readonly review runtime drift');
const refs=['docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json','docs/tech/investigation/battle-static-discovery/magic-registry.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json','docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json'];
for(const p of refs){const f=receipt.files.find((f:any)=>f.path===p);if(!f||sha(readFileSync(checkout+'/'+p))!==f.sha256)throw Error('Runtime reference drift');}
const ledger='docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json';if(sha(readFileSync(checkout+'/'+ledger))!=='b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4')throw Error('Tracked ledger drift');
const dbs=new Map<string,{name:string,bytes:number,sha256:string,path:string}>();
for(const m of joined.matchAll(/\b(graph-interop-[A-Za-z0-9-]+)\s+(\d+)B\s+([a-f0-9]{64})/g)){const name=m[1]!,path='C:/Users/djden/AppData/Local/Temp/opencode/'+name+'/own.sqlite',b=readFileSync(path);if(b.length!==Number(m[2])||sha(b)!==m[3])throw Error('Reviewer DB evidence drift '+name);if(existsSync(path+'-wal')||existsSync(path+'-shm'))throw Error('Unexpected remaining SQLite sidecar');dbs.set(name,{name,bytes:b.length,sha256:sha(b),path});}
if(dbs.size!==12)throw Error('Expected 12 declared DB fixture artifacts, got '+dbs.size);
const qa=JSON.parse(readFileSync(input+'/PARENT/DELIVERY_MANIFEST.json','utf8')).frozenSources,aggregate=sha([...qa.files].map((f:any)=>f.path+':'+f.sha256).sort().join('|'));if(aggregate!=='b190378cd9bd2a250029f6e122cc5760092ff5ff500f2e7023e2e1512914bec7')throw Error('Seven QA pins drift');
const result={session:{id:session.id,model:session.model,directory:session.location.directory},task:'task_mv9f1srm_002v_u1khxa',reports,reviewerClosed:true,verdict:'ACCEPTABLE OFFLINE SCOPED initial QA only',parentInputPinsExact:receipt.files.length,parentRuntimeHarnessRawPinsExact:paths.length,parentRuntimeRefsExact:refs.length,parentSevenSourceAggregate:aggregate,reviewerDatabases:[...dbs.values()],reviewerDatabaseBytes:[...dbs.values()].reduce((n,d)=>n+d.bytes,0),postL8AndGlobalL7NotClosed:true,parentMainTransferNotYetApproved:true};
writeFileSync(phase+'/l7-initial-qa-review-parent-verification.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,reports:reports.length,reviewerDatabases:dbs.size}));
