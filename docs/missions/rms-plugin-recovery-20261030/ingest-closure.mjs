// Generated bookkeeping and source archive only. Does not compile QMD.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd(), vault = 'obsidian-docs';
const mission = '.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const batch = 'rms-implementation-opencode-20261030';
const raw = `${vault}/_raw/${batch}`;
const read = p => fs.readFileSync(path.join(root, p));
const put = (p, b) => { fs.mkdirSync(path.dirname(path.join(root, p)), {recursive:true}); fs.writeFileSync(path.join(root, p), b); };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const inventory = JSON.parse(read('docs/missions/rms-plugin-recovery-20261030/preservation-manifest.json'));
const sources = [...inventory.preserved,...inventory.artifacts].filter(p => p.path.endsWith('.md'));
const selectedJson = [
  'auth-parent-236/prepare-5312262b-f5f9-481f-ad40-29a12dcc9e6f-FINALOUTCOME.json',
  'auth-parent-236/connect-5312262b-f5f9-481f-ad40-29a12dcc9e6f-FINALOUTCOME.json',
  'auth-parent-231/attempt-5312262b-f5f9-481f-ad40-29a12dcc9e6f/rms-auth-audit.json',
  'owned-direct-219/FINALOUTCOME.json',
  'qa-owned-auth-226/typecheck.json',
  'qa-owned-auth-226/auth-envelope-selected.json',
  'qa-owned-auth-226/auth-forged-cap-selected.json',
].map(p => `${mission}/${p}`);
const curated = ['projects/re-ff8/references/rms-implementation-cloture-partielle-20261030.md','projects/re-ff8/concepts/rms-plugin-hote-opencode-v2.md'];
let catalogue = `---\ntitle: RMS — sources de la clôture partielle du 30 octobre\ncategory: reference\ntags: [reverse-engineering, testing, reference]\nsummary: Archive des rapports et sélection limitée de reçus publics ; chronologie historique, pas acceptation M2 ou preuve plugin.\nsources:\n`;
const catalogueSources = [...sources.map(p=>p.path), ...selectedJson];
for (const p of catalogueSources) catalogue += `  - ${p}\n`;
catalogue += `provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}\ncreated: 2026-10-30\nupdated: 2026-10-30\n---\n\n# Sources conservées sans promotion de leur verdict\n\nLes rapports sont historiques et peuvent contenir des plans ensuite corrigés. Le bilan courant est [[projects/re-ff8/references/rms-implementation-cloture-partielle-20261030|la clôture partielle]], la frontière correcte est [[projects/re-ff8/concepts/rms-plugin-hote-opencode-v2|le plugin hôte]]. Retour [[projects/re-ff8/re-ff8|projet]].\n\nLes Markdown sont copiés exactement ; les JSON sélectionnés restent à leur emplacement source avec hash dans le manifeste. Les autres JSON publics sont conservés dans Git sans tous les indexer. Aucune DB, dépendance, credential ou donnée Auth privée n'est copiée. L'index QMD n'est pas recompilé.\n\n## Markdown\n\n`;
for (const p of sources.sort((a,b)=>a.path.localeCompare(b.path,undefined,{numeric:true}))) {
  const b = read(p.path); if (sha(b)!==p.sha256) throw Error('Source changed: '+p.path);
  const rel=p.path.startsWith(mission+'/')?p.path.slice(mission.length+1):'worker-inputs/'+path.basename(p.path); put(`${raw}/${rel}`,b);
  const title=b.toString('utf8').split('\n').find(l=>/^# /.test(l))?.slice(2) || rel;
  catalogue += `- [[_raw/${batch}/${rel.replace(/\.md$/,'')}|${title.replace(/[\[\]|]/g,' ')}]]\n`;
}
catalogue += '\n## JSON retenus\n\n';
for (const p of selectedJson) { JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,'')); catalogue += `- \`${p}\`\n`; }
put(`${raw}/catalogue.md`,catalogue);
const mp=`${vault}/.manifest.json`, m=JSON.parse(read(mp).toString('utf8').replace(/^\uFEFF/,'')), now=new Date().toISOString();
let added=0, changed=0;
const all=[...catalogueSources,'docs/missions/rms-plugin-recovery-20261030/MISSION.md','docs/missions/rms-plugin-recovery-20261030/CLOSURE.md'];
for (const p of all) {
  const b=read(p), old=m.sources[p], h='sha256:'+sha(b);
  if (!old) added++; else if(old.content_hash!==h) changed++;
  m.sources[p]={...old, ingested_at:old?.ingested_at||now,last_ingested:now,size_bytes:b.length,modified_at:fs.statSync(path.join(root,p)).mtime.toISOString(),content_hash:h,source_type:'document',project:'re-ff8',pages_created:curated,pages_updated:[`_raw/${batch}/catalogue.md`]};
}
m.last_updated=now;
m.stats.total_sources_ingested=Object.keys(m.sources).length;
m.stats.last_batch={batch,sources:all.length,sources_added:added+(m.stats.last_batch?.batch===batch?m.stats.last_batch.sources_added:0),sources_changed:changed,pages_created:2,pages_updated:5,raw_markdown_copies:sources.length,json_selected:selectedJson.length,index_status:'files_ready_not_recompiled_commands_prohibited',managed_sources:all};
const pr=m.projects['re-ff8'];pr.last_synced=now;pr.pages_in_vault=[...new Set([...(pr.pages_in_vault||[]),...curated,`_raw/${batch}/catalogue.md`])];
// Recompute the actual Markdown count, without assuming prior statistics were current.
function count(d) { return fs.readdirSync(path.join(root,d),{withFileTypes:true}).reduce((s,e)=>s+(e.isDirectory()?count(`${d}/${e.name}`):e.name.endsWith('.md')?1:0),0); }
m.stats.total_pages=count(vault);
put(mp,JSON.stringify(m,null,2)+'\n');
const logPath=`${vault}/log.md`, log=read(logPath).toString('utf8');
if (!log.includes(`batch=${batch} `)) put(logPath,log+`\n- [${now}] INGEST batch=${batch} project=re-ff8 sources=262 markdown=253 json_selected=7 pages_created=2 pages_updated=5 mode=append status=partial-not-accepted-index-pending note="253 Markdown copiés exactement, reçus publics conservés aux sources avec hashes ; archive inactive340+198 ; plugin hôte requis, pas de M2/IDA complet ; aucun nouveau test/OAuth/IDA ; DB, secrets, dépendances et caches exclus ; QMD NON recompilé, update/embed interdits. Compteur total_pages recalculé sur les Markdown physiques, raw inclus, non comparable au compteur historique des seules pages distillées."\n`);
if(sources.length===259&&!read(logPath).toString('utf8').includes('CLOSURE_SUPPORT_39'))put(logPath,read(logPath).toString('utf8')+`\n- [${now}] INGEST_SUPPLEMENT batch=${batch} marker=CLOSURE_SUPPORT_39 sources_added=6 markdown_total=259 managed_sources_total=268 note="39 entrées publiques supplémentaires du worktree historique conservées ; six Markdown de support copiés exactement, profils étrangers non importés ; index QMD toujours non recompilé."\n`);
if(sources.length===260&&!read(logPath).toString('utf8').includes('CLOSURE_FINAL_241'))put(logPath,read(logPath).toString('utf8')+`\n- [${now}] INGEST_SUPPLEMENT batch=${batch} marker=CLOSURE_FINAL_241 sources_added=1 markdown_total=260 managed_sources_total=269 note="Rapport241 intégré ; clôture partielle, contrôle final main réservé au parent, archivage natif non exécuté pour éviter sa fusion automatique ; QMD non recompilé."\n`);
console.log(JSON.stringify({markdown:sources.length,json:selectedJson.length,added,changed,index:'NOT_RECOMPILED',curated}));
