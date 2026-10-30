// Offline closure checks; no candidate imports, product tests, network or DB reads.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=process.cwd(), out='docs/missions/rms-plugin-recovery-20261030';
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,''));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const m=json(`${out}/preservation-manifest.json`), vm=json('obsidian-docs/.manifest.json');
const errors=[];
for (const p of [...m.preserved,...m.artifacts]) {
  const b=read(p.path); if(b.length!==p.bytes||sha(b)!==p.sha256)errors.push('hash:'+p.path);
}
const prefix='.opencode/missions/team_mvshkwxs_000t_2fkx8e/';
const raw='obsidian-docs/_raw/rms-implementation-opencode-20261030/';
let copies=0;
for(const p of [...m.preserved,...m.artifacts].filter(p=>p.path.endsWith('.md'))) {
  const rel=p.path.startsWith(prefix)?p.path.slice(prefix.length):'worker-inputs/'+path.basename(p.path);
  if(sha(read(raw+rel))!==p.sha256)errors.push('raw:'+p.path);
  copies++;
}
for(const p of vm.stats.last_batch.managed_sources)if(vm.sources[p].content_hash!=='sha256:'+sha(read(p)))errors.push('wiki-source:'+p);
const wikiPages=['projects/re-ff8/references/rms-implementation-cloture-partielle-20261030.md','projects/re-ff8/concepts/rms-plugin-hote-opencode-v2.md','_raw/rms-implementation-opencode-20261030/catalogue.md'];
let links=0;
for(const p of wikiPages){
  const t=read('obsidian-docs/'+p).toString('utf8');
  if(!t.startsWith('---\n'))errors.push('frontmatter:'+p);
  if((t.match(/^summary: (.*)$/m)?.[1].length||0)>200)errors.push('summary:'+p);
  for(const hit of t.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)) {
    const q='obsidian-docs/'+hit[1]+(hit[1].endsWith('.md')?'':'.md');
    if(!fs.existsSync(path.join(root,q)))errors.push('link:'+q);links++;
  }
}
const qa=[];
for(const p of m.preserved.filter(p=>p.path.endsWith('.json')&&/\/qa[-/]/.test(p.path))) {
  try {const j=json(p.path);if(j.command&&Number.isFinite(j.durationMs))qa.push({path:p.path,durationMs:j.durationMs,timeoutMs:j.timeoutMs??null});}catch{}
}
const report={status:errors.length?'FAIL':'PASS_SCOPED_CONSERVATION_ONLY',checkedArtifacts:m.artifacts.length,checkedPublicSources:m.preserved.length,rawMarkdownExact:copies,wikiManagedSources:vm.stats.last_batch.managed_sources.length,newWikiLinksChecked:links,qaDurationAudit:{scope:'Only top-level command + numeric durationMs in QA JSON receipts; not an exhaustive replay or timing audit of the mission',count:qa.length,maxMs:Math.max(...qa.map(x=>x.durationMs)),overTenMinutes:qa.filter(x=>x.durationMs>600000),records:qa},productTestsRun:0,qmdCompiled:false,errors};
fs.writeFileSync(path.join(root,out,'verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.log(JSON.stringify(report));process.exit(1);}
const stage=new Set([...m.preserved,...m.artifacts].map(p=>p.path));
stage.add(prefix+'.gitattributes');
function addTree(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())addTree(p);else if(!/closure-stage-paths/.test(p))stage.add(p);}}
addTree(out);addTree(raw.slice(0,-1));
for(const p of ['.opencode/missions/team_mvsc5dqf_0000_cctpvf','.opencode/missions/team_mvsebirm_000e_48pl3y'])addTree(p);
for(const n of ['20261029_01_retours_tardifs_numeric_s1.md','20261029_02_complement_retours_historiques.md'])stage.add('.opencode/missions/team_mvdlecqs_000i_wny3o5/reports/'+n);
const status=spawnSync('git',['status','--porcelain=v1','--untracked-files=all','--','obsidian-docs','docs/missions'],{cwd:root,encoding:'utf8',timeout:15000,maxBuffer:2000000});
if(status.status!==0)throw Error('Scoped status failed');
for(const l of status.stdout.split('\n').filter(Boolean)){
  const p=l.slice(3);
  if(/^obsidian-docs\/(?:\.manifest\.json|index\.md|log\.md|projects\/re-ff8\/.*(?:rms|ensemble-coordination|recuperer-un-resultat|re-ff8\.md)|_raw\/rms-)/.test(p)||/^docs\/missions\/re-graph-scheduler\/(?:ORDRE_MISSION_.*(?:RMS|RMS_STATIC).*\.md|rms-static-documentation-20261028\/)/.test(p))stage.add(p);
}
// Preserve existing local predecessor sources referenced by the wiki, not unrelated dirty work.
for(const p of Object.keys(vm.sources))if(/^\.opencode\/missions\/(?:team_mvsc5dqf_0000_cctpvf|team_mvsebirm_000e_48pl3y)\//.test(p)&&fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile())stage.add(p);
for(const p of stage)if(/(?:^|\/)(?:node_modules|auth-private-[^/]+)\//.test(p)||/\.sqlite(?:-|$)|\.pile$/.test(p))throw Error('Unsafe stage path: '+p);
stage.add(`${out}/closure-stage-paths.txt`);
fs.writeFileSync(path.join(root,out,'closure-stage-paths.txt'),[...stage].sort().join('\n')+'\n');
console.log(JSON.stringify({status:report.status,artifacts:m.artifacts.length,publicSources:m.preserved.length,copies,managed:report.wikiManagedSources,links,qaCount:qa.length,maxQaMs:report.qaDurationAudit.maxMs,overTenMinutes:report.qaDurationAudit.overTenMinutes.length,stagePaths:stage.size}));
