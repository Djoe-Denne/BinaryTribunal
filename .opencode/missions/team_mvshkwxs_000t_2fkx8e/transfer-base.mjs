// Mission-owned file transfer only. Never imports or executes harness code.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const R=path.resolve(import.meta.dirname,'../../..');
const M=path.join(R,'.opencode/missions/team_mvnxgnse_0000_39vpc8');
const H=path.join(R,'.tmp/m2-s1-integration-r2/tools/ff8-harness');
const D=path.join(R,'.tmp/rms-static-realisation-20261028-r1');
const E=path.join(import.meta.dirname,'evidence');
const mode=process.argv[2];
if(!['inspect','copy'].includes(mode)||process.argv.length!==3)throw Error('Use inspect or copy');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p));
const need=(ok,s)=>{if(!ok)throw Error(s);};
const safeRel=s=>{need(typeof s==='string'&&!path.isAbsolute(s)&&!s.split(/[\\/]/).includes('..'),'unsafe relative path');return s;};
const receipt=path.join(R,'.tmp/m2-s1-integration-r2/COMPOSITION_RECEIPT.json');
need(sha(read(receipt))==='c6d942afc78a19f02e307d067559a0328d51427e931c068b0f7cbb19e34098bf','composition receipt drift');
const base=json(receipt),s176=json(path.join(M,'evidence/s2-replacement-source-176.json'));
const s113=json(path.join(M,'evidence/s2-cross-epoch-source-113.json'));
const prior=json(path.join(R,'.tmp/m2-s1-integration-r2/evidence/integration-typecheck.result.json'));
const recipeFile=path.join(M,'evidence/check-s2-measure-176-runtime.mjs');
const recipe=read(recipeFile).toString('utf8');
// Parse literal pairs/triples only. No eval/import of the diagnostic executable.
const extrasBlock=recipe.slice(recipe.indexOf('const extras='),recipe.indexOf('const inputs='));
const inputsBlock=recipe.slice(recipe.indexOf('const inputs='),recipe.indexOf('const prior='));
const extras=[...extrasBlock.matchAll(/\['([^']+)','([a-f0-9]{64})'\]/g)].map(m=>({file:m[1],sha256:m[2]}));
const inputs=[...inputsBlock.matchAll(/\['([^']+)','([^']+)','([a-f0-9]{64})'\]/g)].map(m=>({dir:m[1],file:m[2],sha256:m[3]}));
need(base.rows.length===309&&s176.files.length===14&&extras.length===11&&inputs.length===10,'recipe shape drift');
need(sha(JSON.stringify(s176.files))==='ba1d4632a4ac402044709154540e57b569ed542e7d133cde92f2cf1578d3f0e6','source176 pin drift');
need(sha(JSON.stringify(s113.files))==='ef534b1a3eaa27b6db50834bf4ce4ea5da0b65016b35bcfbf5ab7cbfa86e3ff4','source113 pin drift');
const prot=s113.files.filter(f=>!s176.files.some(n=>n.path===f.path));need(prot.length===4,'protected set drift');
const ov=s176.baseOverride;
need(ov.path==='src/graph-execution-envelope.ts'&&ov.priorSha256==='92478d02fa089b48dc54c5c3c13694c3c8c543ad9fb436629ae94d989f8344fc'&&ov.currentSha256==='edd6facbe1d44cf988f6da6739818fe0366cf0ceeec16136f0418b7d7791b714','overlay drift');
const unchanged=base.rows.filter(f=>f.path!==ov.path);need(unchanged.length===308,'base count drift');
const rows=new Map();
function add(src,rel,category,expected={}){
  safeRel(rel);const stat=fs.lstatSync(src);need(stat.isFile()&&!stat.isSymbolicLink(),'not a regular file: '+src);
  const b=read(src),hash=sha(b);need(!expected.sha256||expected.sha256===hash,'pin mismatch: '+src);
  need(expected.bytes===undefined||expected.bytes===b.length,'size mismatch: '+src);
  const old=rows.get(rel);if(old){need(old.source===src&&old.sha256===hash,'destination collision: '+rel);old.categories.push(category);return;}
  rows.set(rel,{source:src,destination:path.join(D,rel),relativePath:rel,bytes:b.length,sha256:hash,categories:[category]});
}
for(const [cat,files] of [['composition308',unchanged],['source176',s176.files],['protected113',prot],['extra',extras],['inheritedControl',prior.controlFiles]]){
  for(const f of files){const rel=safeRel(f.path??f.file);add(path.join(H,rel),'tools/ff8-harness/'+rel,cat,f);}
}
for(const file of ['tsconfig.s2-replacement.json','tsconfig.s2-cross-epoch.json','tsconfig.integration.json','bunfig.integration.toml'])add(path.join(H,file),'tools/ff8-harness/'+file,'currentControl');
need(read(path.join(H,'bunfig.integration.toml')).length===0,'Bun config not empty');
for(const f of inputs)add(path.join(M,'inputs',f.dir,f.file),'inputs/'+f.dir+'/'+f.file,'contractInput',f);
const original=base.rows.find(f=>f.path===ov.path);need(original.sha256===ov.priorSha256,'original codec metadata drift');
add(original.origin,'preserved-qualified-codec/graph-execution-envelope.ts','qualifiedOriginalCodec',original);
function walk(dir,rel=''){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const r=rel?rel+'/'+e.name:e.name,full=path.join(dir,e.name);
    need(!fs.lstatSync(full).isSymbolicLink(),'symlink/reparse entry forbidden: '+full);
    need(!['node_modules','.git','evidence','owned-assets','owned-databases','run-environments'].includes(e.name),'execution/dependency directory forbidden: '+full);
    if(e.isDirectory())walk(full,r);else {need(!/\.(db|sqlite|sqlite3|wal|shm|exe|dll|log)$/i.test(e.name),'runtime artefact forbidden: '+full);add(full,'tools/ff8-harness/'+r,'currentHarnessInventory');}
  }
}
walk(H);
const list=[...rows.values()].sort((a,b)=>a.relativePath.localeCompare(b.relativePath));
const summary={compositionUnchanged:308,codecOverlay:1,source176:14,protected113:4,extras:11,contractInputs:10,inheritedControls:prior.controlFiles.length,currentControls:4,files:list.length,harnessFiles:list.filter(r=>r.categories.includes('currentHarnessInventory')).length,additionalHarnessFiles:list.filter(r=>r.categories.length===1&&r.categories[0]==='currentHarnessInventory').map(r=>r.relativePath)};
const dependencies=[];
for(const row of list){if(/\.(ts|json|toml|mjs)$/.test(row.relativePath)){const text=read(row.source).toString('utf8');if(/(?:C:[/\\]|\.tmp[/\\]|\.opencode[/\\]|node_modules)/.test(text))dependencies.push({path:row.relativePath,requiresPathQualification:true});}}
if(mode==='inspect'){console.log(JSON.stringify({state:'PREFLIGHT_OK_NO_COPY',destinationExists:fs.existsSync(D),summary,pathsRequiringQualification:dependencies.length}));process.exit(0);}
need(!fs.existsSync(D),'destination already exists; never overwrite');
fs.mkdirSync(D);fs.mkdirSync(E,{recursive:true});
for(const row of list){fs.mkdirSync(path.dirname(row.destination),{recursive:true});fs.copyFileSync(row.source,row.destination,fs.constants.COPYFILE_EXCL);}
for(const row of list)for(const file of [row.source,row.destination]){const b=read(file);need(b.length===row.bytes&&sha(b)===row.sha256,'transfer readback drift: '+file);}
const payload={schema:'rms-static-source-transfer-v1',at:new Date().toISOString(),destination:D,sourceHarness:H,policyRevision:1,summary,compositionReceiptSha256:sha(read(receipt)),recipeSha256:sha(read(recipeFile)),baseOverride:ov,rows:list,pathQualificationRequired:dependencies,pathMapping:[{old:H,new:path.join(D,'tools/ff8-harness')},{old:path.join(M,'inputs'),new:path.join(D,'inputs')}],authorityTransferred:false,originsReset:false,databasesCopied:false,productTestsExecuted:false,oldSourceSetReused:false,limits:'Byte identity only; path-bearing inputs require qualification before execution. Historical proofs retain their original scope.'};
const bytes=JSON.stringify(payload,null,2)+'\n';fs.writeFileSync(path.join(D,'TRANSFER_MANIFEST.json'),bytes,{flag:'wx'});fs.writeFileSync(path.join(E,'base-transfer-manifest.json'),bytes,{flag:'wx'});
console.log(JSON.stringify({state:'TRANSFERRED_AND_READBACK_VERIFIED',manifestSha256:sha(bytes),summary,pathsRequiringQualification:dependencies.length}));
