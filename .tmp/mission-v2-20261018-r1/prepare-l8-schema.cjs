// Parent-only bounded source snapshot, hashing and copying; no product imports.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/djden/source/repos/retro-eng/re-ff8';
const base=root+'/.tmp/mission-v2-20261018-r1';
const phase=root+'/.tmp/coordination-three-20261014';
const dst=base+'/l8-schema-source/inputs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(dst))throw Error('L8 packet exists');
const gatePath=root+'/docs/missions/re-graph-scheduler/CORRECTIVE_FINAL_GATES_20261014.json';
const gateBytes=fs.readFileSync(gatePath);const gate=JSON.parse(gateBytes).L8ParserBRatification20261018;
if(gate.stage!=='PARSER_B_CORRIGE_RECORDED_BINDING_PROPOSAL_ADOPTED_SCHEMA_AUTHOR_NEXT')throw Error('L8 stage changed');
const old=JSON.parse(fs.readFileSync(phase+'/V3_L8_PARSER_B_INPUTS_20261018/INPUT_MANIFEST.json','utf8'));
const entries=old.files.filter(f=>!f.path.endsWith('/SCOPE.md')).map(f=>({name:'reference/'+path.relative(root,f.path).replaceAll('\\','/'),source:f.path,expected:f.sha256,provenance:'parser-B original exact pin'}));
for(const rel of ['src/cluster.ts','src/graph-store.ts','src/graph.ts','src/validation.ts','src/planner.ts','schemas/graph-snapshot-v1.schema.json','schemas/work-unit-v1.schema.json'])entries.push({name:'current/tools/ff8-harness/'+rel,source:root+'/tools/ff8-harness/'+rel,provenance:'parent current snapshot; not silently substituted for original eight pins'});
entries.push({name:'SCOPE.md',source:base+'/L8_SCHEMA_SCOPE.md'});
const files=[];
for(const e of entries){const b=fs.readFileSync(e.source);if(e.expected&&sha(b)!==e.expected)throw Error('Source drift '+e.source);if(b.length>2*1024*1024)throw Error('Per-file bound');const p=dst+'/'+e.name;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});fs.chmodSync(p,0o444);files.push({path:e.name,source:e.source,bytes:b.length,sha256:sha(b),provenance:e.provenance||'parent scope'});}
const binding=JSON.stringify({at:new Date().toISOString(),source:gatePath,sourceSha256:sha(gateBytes),key:'L8ParserBRatification20261018',projection:'complete value of named key only; original register not mutated',binding:gate},null,2)+'\n';
fs.writeFileSync(dst+'/BINDING_PROVENANCE.json',binding,{flag:'wx'});fs.chmodSync(dst+'/BINDING_PROVENANCE.json',0o444);files.push({path:'BINDING_PROVENANCE.json',bytes:Buffer.byteLength(binding),sha256:sha(binding),provenance:'parent exact named-key projection'});
const total=files.reduce((n,f)=>n+f.bytes,0);if(files.length>30||total>4*1024*1024)throw Error('L8 total bound');
const bytes=JSON.stringify({at:new Date().toISOString(),role:'L8 schema candidate author',policyRevision:1,files},null,2)+'\n';fs.writeFileSync(dst+'/INPUT_MANIFEST.json',bytes,{flag:'wx'});fs.chmodSync(dst+'/INPUT_MANIFEST.json',0o444);
const receipt={at:new Date().toISOString(),files:files.length,bytes:total,manifestSha256:sha(bytes),sourcePinsChecked:true,permission:'ACK-HOLD only; plan and source need separate parent GO',centralOwnershipUnchanged:true};
fs.writeFileSync(base+'/l8-schema-source/PARENT_ACCESS_RECEIPT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
