import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',base=root+'/.tmp/re-graph-scheduler/review-20261014';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
if(!readFileSync(root+'/docs/missions/re-graph-scheduler/L2_V5_OFFLINE_ACCEPTANCE.md','utf8').includes('Le parent accepte la livraison L2 v5 offline'))throw Error('No parent L2 decision');
const tranche=process.argv[2];
const selection=tranche==='L2L3'?[['L2IDSV5',['src/graph.ts','src/graph-normalize.ts','src/capabilities.ts','test/graph-extract.test.ts']],['L3NUM',['src/cluster.ts','src/investigation-groups.ts','test/cluster.test.ts']]]:tranche==='L4L5'?[['L4ADOPTFIX',['src/semantic-index.ts','src/lineage.ts','test/lineage.test.ts']],['L5EXTERNALFIX',['src/planner.ts','test/planner.test.ts']]]:null;
if(!selection)throw Error('Explicit parent tranche required');
const oldExpected:Record<string,string>={
 'tools/ff8-harness/src/planner.ts':'6ed71229c67f01a08dfd6fffcc23205706f3437a5d2eb490e46ea48694707c89',
 'tools/ff8-harness/test/planner.test.ts':'68dbb98706c4e1d8fb3c29cb6542fd1e88ffc53c906bc270a3664557b9db02b7'
};
const files:{path:string,from:string,sha256:string,beforeSha256:string|null}[]=[];
for(const [label,names]of selection as [string,string[]][]){
 const m=JSON.parse(readFileSync(base+'/'+label+'/manifest.json','utf8').replace(/^\uFEFF/,''));
 for(const name of names){const path='tools/ff8-harness/'+name,pin=m.files.find((f:any)=>f.path===path);if(!pin)throw Error('Missing canonical pin');const from=base+'/'+label+'/'+path;if(sha(readFileSync(from))!==pin.sha256)throw Error('Source drift '+path);
  const status=spawnSync('git',['status','--porcelain','--',path],{cwd:root,encoding:'utf8'});if(status.status!==0||status.stdout.trim())throw Error('Target dirty '+path);
  const beforeSha256=existsSync(root+'/'+path)?sha(readFileSync(root+'/'+path)):null;if(beforeSha256!==(oldExpected[path]??null))throw Error('Unexpected target baseline '+path);
  files.push({path,from,sha256:pin.sha256,beforeSha256});
 }
}
const dest=phase+'/main-transfer-'+tranche;if(existsSync(dest))throw Error('Transfer receipt already exists; no replay');mkdirSync(dest);
writeFileSync(dest+'/intent.json',JSON.stringify({tranche,files,acceptance:'offline module acceptance only; main gates still required'},null,2)+'\n',{flag:'wx'});
for(const f of files){if(f.beforeSha256){const backup=dest+'/'+f.path.replaceAll('/','__');copyFileSync(root+'/'+f.path,backup);}const bytes=readFileSync(f.from);writeFileSync(root+'/'+f.path,bytes,{flag:f.beforeSha256?'w':'wx'});if(sha(readFileSync(root+'/'+f.path))!==f.sha256)throw Error('Transfer readback failed');}
writeFileSync(dest+'/readback.json',JSON.stringify({tranche,files,byteExact:true,sourceGelsPreserved:true,productionAndTestsTogether:true,centralFilesTouched:false,mainGatesPending:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({tranche,files:files.map(f=>({path:f.path,sha256:f.sha256})),byteExact:true,mainGatesPending:true},null,2));
