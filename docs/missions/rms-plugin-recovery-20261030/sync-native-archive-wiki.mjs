// Append final native archive evidence to existing local wiki bookkeeping.
// Does not reload a plugin, execute the prototype, contact a server or compile QMD.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),mission='.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const raw='obsidian-docs/_raw/rms-implementation-opencode-20261030';
const read=p=>fs.readFileSync(path.join(root,p));
const write=(p,b)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),b);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const reports=['242-archivage-natif-sans-accepter-le-prototype.md','243-equipe-archivee-et-prototype-non-active.md'];
for(const n of reports)write(raw+'/reports/'+n,read(mission+'/reports/'+n));
const sourceJson='docs/missions/rms-plugin-recovery-20261030/native-cleanup/FINALOUTCOME.json';
const sources=[...reports.map(n=>mission+'/reports/'+n),sourceJson,'docs/missions/rms-plugin-recovery-20261030/CLOSURE.md'];
const catalogPath=raw+'/catalogue.md';let catalog=read(catalogPath).toString('utf8');
for(const s of sources.slice(0,3))if(!catalog.includes('  - '+s+'\n'))catalog=catalog.replace('provenance:', '  - '+s+'\nprovenance:');
if(!catalog.includes('## Archivage natif final'))catalog+='\n## Archivage natif final\n\n'+reports.map(n=>'- [[_raw/rms-implementation-opencode-20261030/reports/'+n.slice(0,-3)+'|'+n+']]').join('\n')+'\n\nÉquipe archivée nativement ; ancien pending administratif résolu, bilan technique toujours partiel. Reçu public final : `'+sourceJson+'`. Deux copies Markdown supplémentaires, JSON final sélectionné en plus des sept historiques. QMD non recompilé.\n';
write(catalogPath,catalog);
const mp='obsidian-docs/.manifest.json',m=JSON.parse(read(mp).toString('utf8').replace(/^\uFEFF/,'')),now=new Date().toISOString();let added=0,changed=0;
for(const p of sources){const b=read(p),old=m.sources[p],hash='sha256:'+sha(b);if(!old)added++;else if(old.content_hash!==hash)changed++;m.sources[p]={...old,ingested_at:old?.ingested_at||now,last_ingested:now,size_bytes:b.length,modified_at:fs.statSync(path.join(root,p)).mtime.toISOString(),content_hash:hash,source_type:'document',project:'re-ff8',pages_created:[],pages_updated:['projects/re-ff8/references/rms-implementation-cloture-partielle-20261030.md','_raw/rms-implementation-opencode-20261030/catalogue.md']};}
m.last_updated=now;m.projects['re-ff8'].last_synced=now;m.stats.total_sources_ingested=Object.keys(m.sources).length;
m.stats.last_batch={batch:'rms-native-archive-20261030',sources:sources.length,sources_added:added,sources_changed:changed,pages_created:0,pages_updated:2,raw_markdown_total:262,selected_json_total:8,prior_implementation_batch_sources:269,index_status:'files_ready_not_recompiled_commands_prohibited',managed_sources:sources};
function count(d){return fs.readdirSync(path.join(root,d),{withFileTypes:true}).reduce((s,e)=>s+(e.isDirectory()?count(d+'/'+e.name):e.name.endsWith('.md')?1:0),0);}
m.stats.total_pages=count('obsidian-docs');write(mp,JSON.stringify(m,null,2)+'\n');
const lp='obsidian-docs/log.md',log=read(lp).toString('utf8');if(!log.includes('NATIVE_ARCHIVE_FINAL_243'))write(lp,log+`\n- [${now}] INGEST_NATIVE_ARCHIVE marker=NATIVE_ARCHIVE_FINAL_243 project=re-ff8 sources_added=3 sources_changed=1 markdown_total=262 selected_json_total=8 status=team-archived-technical-partial note="Native cleanup confirmé, session hors équipe ; 95 inputs exacts conservés dans main, 14 références d'archive et sept worktrees retirés ; proposition42fichiers rejetée sans exécution,20profils canoniques inchangés ; aucun purge/force/test/OAuth/IDA/push ; QMD non recompilé."\n`);
console.log(JSON.stringify({sources:sources.length,added,changed,markdownTotal:262,selectedJsonTotal:8,qmdCompiled:false}));
