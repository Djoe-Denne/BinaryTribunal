import fs from 'node:fs';
import path from 'node:path';
import * as a from './ff8-r01-repair-audit-20261012.mjs';

const mission='docs/missions/ff8-decomp-semantics-2026-10-11-run01';
const folder=path.join(a.root,mission,'closure-20261012');
const t=await a.state();
const active=(await a.native('/api/session/active')).data;
const activeMembers=t.members.filter(m=>active[m.sessionId]&&active[m.sessionId].type!=='idle');
if(t.capacity.running||t.capacity.starting||t.capacity.waiting||activeMembers.length||t.tasks.some(x=>x.status==='in_progress')||t.scheduling.autoScale||t.scheduling.autoDispatch)throw Error('Mission is not stopped');
const groupPath=path.join(a.root,mission,'native-groups.json'),groupBytes=fs.readFileSync(groupPath),g=JSON.parse(groupBytes);
const inventory=JSON.parse(fs.readFileSync(path.join(a.root,mission,'inventory.json')));
const pe=JSON.parse(fs.readFileSync(path.join(a.root,mission,'native-pe-verification.json')));
const commits=fs.readdirSync(folder).filter(x=>/^0x[0-9A-F]+-idb-commit\.json$/.test(x)).map(x=>JSON.parse(fs.readFileSync(path.join(folder,x))));
const roles=['c_a','c_b','c_r','semantic_a','semantic_b','semantic_r'];
const rows=[];
for(const group of g.groups)for(const ea of group.eas) {
  const spec=g.functions.find(x=>x.ea===ea);
  const tasks=t.tasks.filter(x=>/^(PRODUCE|RECONCILE) /.test(x.content)&&x.content.includes(group.id+'/'+ea));
  const sessions=[];
  for(const task of tasks) {
    const profile=task.content.startsWith('RECONCILE')?'re-reconcile-ensemble':task.content.startsWith('PRODUCE C ')?'re-decompile-ensemble':'re-semantic-ensemble';
    const output=a.expectedOutput(task);
    for(const m of t.members.filter(x=>x.agent===profile&&x.sessionId)) {
      const assigned=m.name===task.assignee;
      const explicitTask=m.prompt?.includes(task.id);
      const exactOutput=m.prompt?.includes(output);
      if(assigned||explicitTask&&exactOutput)sessions.push({member:m.name,session:m.sessionId,task:task.id,role:path.basename(output,'.md'),status:m.status,evidence:assigned?'task.assignee':'persisted native member admission prompt with exact task+output'});
    }
  }
  const base=`outputs/ff8-decomp-semantics-20261011-r01/production/${group.id}/${ea}`;
  const deposits=roles.flatMap(role=>{
    const p=base+'/'+role+'.md',full=path.join(a.root,p);
    if(!fs.existsSync(full))return [];
    const bytes=fs.readFileSync(full);return [{role,path:p,bytes:bytes.length,sha256:a.sha(bytes),scientific_acceptance:false}];
  });
  const committed=commits.find(x=>x.ea===ea);
  const started=sessions.length>0||deposits.length>0;
  const reason=tasks.filter(x=>x.context?.decision?.mode==='pending').map(x=>({task:x.id,reason:x.context.decision.reason}));
  const nativePE=pe.results.find(x=>x.ea===ea);
  rows.push({group:group.id,ea,label:spec.label,instructions:spec.instructions,
    state:started||committed?'PARTIELLE':'NON_COMMENCEE_PRODUCTION',production_started:started,
    initial_native_packet:{path:spec.path,sha256:spec.sha256,idb_pe_equal_at_initial_gate:nativePE?.idb_equals_pe_and_freeze},
    deposits,missing_deposits:roles.filter(x=>!deposits.some(d=>d.role===x)),all_six_deposited:deposits.length===6,
    admitted_sessions:sessions,idb_certain_facts:committed?{kind:committed.kind,receipt:`${mission}/closure-20261012/${ea}-idb-commit.json`,sha256:committed.after_sha256}:null,
    blocked_context_decisions:reason,final_C_and_semantic_acceptance:false,
    scope_note:'Deposits/admissions and local IDB facts do not imply completed native C validation or whole-function scientific promotion.'});
}
const ids=rows.map(x=>x.ea);
if(ids.length!==98||new Set(ids).size!==98||g.groups.length!==36||inventory.scope.some(x=>!ids.includes(x)))throw Error('Group/scope coverage mismatch');
const counts={functions:rows.length,groups:g.groups.length,partial:rows.filter(x=>x.state==='PARTIELLE').length,
  not_started_production:rows.filter(x=>x.state==='NON_COMMENCEE_PRODUCTION').length,
  admitted_or_deposited:rows.filter(x=>x.production_started).length,
  with_deposit:rows.filter(x=>x.deposits.length).length,
  all_six_deposited_not_finally_validated:rows.filter(x=>x.all_six_deposited).length,
  idb_local_certain_facts:commits.length,fully_closed_functions:0};
const record={at:new Date().toISOString(),event:'USER_STOP_CLOSURE_INVENTORY',mission:'ff8-decomp-semantics-20261011-r01',team:a.teamID,
  stop:{...a.summary(t),native_active_members:[],verified:true},group_source:'docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json',group_source_sha256:a.sha(groupBytes),
  definitions:{partial:'Any admitted C/semantic/R session, deposited candidate, or supervisor-certified local fact. This includes blocked or interrupted attempts.',not_started:'No C/semantic/R admission or deposit and no committed local fact. Prior discovery/classification may still exist.',complete_deposits:'All six files exist; not a claim of native correctness or final promotion.'},counts,rows};
const jsonPath=path.join(folder,'INVENTAIRE_FONCTIONS.json');
fs.writeFileSync(jsonPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
const shortRole=r=>r.replace('semantic_','S-').replace('c_','C-').toUpperCase();
const md=[
  '# Clôture run01 — inventaire des fonctions',
  '',`État arrêté au ${record.at}. **0 worker actif, 0 tâche en cours, 0 réveil en attente** ; auto-scale et auto-dispatch désactivés.`,
  '',`**${counts.partial} fonctions partiellement traitées ; ${counts.not_started_production} non commencées en production ; 98 fonctions, 36 groupes conservés à l'identique.**`,
  '',`${counts.idb_local_certain_facts} fonctions portent des faits locaux certains inscrits dans l'IDB, sauvegardés et relus. ${counts.all_six_deposited_not_finally_validated} fonctions disposent des six dépôts A/B/R C et sémantique, sans validation finale complète du C. Aucune fonction n'est présentée comme intégralement clôturée scientifiquement.`,
  '', '## Définitions',
  '', '- **Partielle** : au moins une admission auteur/R, un dépôt ou des faits locaux certains inscrits dans l’IDB. Une tentative bloquée/interrompue compte comme partielle, pas comme réussie.',
  '- **Non commencée** : production C/sémantique/R non engagée et aucun fait local inscrit à cette clôture ; discovery, gel et classification préalables peuvent exister.',
  '- `C-A/B/R`, `S-A/B/R` : fichiers présents, hashés dans le JSON ; leur présence ne vaut pas acceptation. `IDB` : faits locaux vérifiés seulement.',
  '- Les noms ci-dessous sont les labels du gel initial, conservés sans rename ni promotion de leur sens métier.',
  '', '## Groupes conservés',
];
for(const group of g.groups) {
  const members=rows.filter(x=>x.group===group.id);
  md.push('',`### ${group.id}`,'');
  for(const r of members) {
    const flags=[];
    if(r.deposits.length)flags.push(r.deposits.map(x=>shortRole(x.role)).join(', '));
    else if(r.production_started)flags.push('admission/tentative sans dépôt');
    else flags.push('aucun dépôt ni admission de production');
    if(r.idb_certain_facts)flags.push('IDB : faits locaux certains');
    if(r.all_six_deposited)flags.push('réconciliations déposées ; contrôle final C restant');
    if(r.initial_native_packet.idb_pe_equal_at_initial_gate===false)flags.push('quarantaine divergence IDB/PE/gel');
    if(r.blocked_context_decisions.length)flags.push('gate contexte/R maintenue');
    md.push(`- **${r.ea} — ${r.state==='PARTIELLE'?'PARTIELLE':'NON COMMENCÉE'}** · \`${r.label}\` — ${flags.join(' ; ')}.`);
  }
}
md.push('', '## Garanties et limites de clôture', '',
  '- Groupes et ordre des EA : source `native-groups.json`, SHA256 `'+record.group_source_sha256+'`. Les 151 EA de l’extension exclue restent hors mission.',
  '- Écritures IDB exclusivement via `set_func_cmt`, ajout sans suppression des commentaires existants ; sauvegarde et readback après chaque fonction. Aucun rename, patch binaire ou SetType.',
  '- Les faits sûrs ont été confrontés au code IDA courant et au PE authentifié. Noms métier, contrats de helpers non observés, candidats incomplets et sorties interrompues ne sont pas promus.',
  '- Le contrôle de callee a bloqué avant écriture une adresse tirée d’un nom trompeur : le CALL à `0x47D277` cible `0x46BD10`, non le suffixe `46BB10` du label. Correction native et receipt conservées.',
  '- Incident de contrôle à l’arrêt : la valeur de plafond `0` a été interprétée par l’outil comme « illimité », réveillant brièvement des sessions existantes. Réduction immédiate, arrêt forcé des propriétaires concernés, puis vérification native : aucun worker ni wake restant. Plafond 5 restauré, admissions automatiques désactivées. Aucune nouvelle session créée.',
  '- Les tâches interrompues ont été restituées en attente par le harness, pas marquées fictivement complètes. Cette file est conservée pour audit/reprise future, mais aucun travail n’est autorisé sans nouveau GO utilisateur.',
  '- Aucun commit Git ni push distant demandé/réalisé ; « commit IDB » désigne ici les annotations sauvegardées dans la base native.',
  '', 'Détail machine (hashes, sessions, tâches et raisons des gates) : [INVENTAIRE_FONCTIONS.json](INVENTAIRE_FONCTIONS.json).',
);
const mdPath=path.join(folder,'INVENTAIRE_FONCTIONS.md');fs.writeFileSync(mdPath,md.join('\n')+'\n',{flag:'wx'});
const event={at:record.at,event:'USER_STOP_FINAL',counts,stop:record.stop,inventory_json:path.relative(a.root,jsonPath).replaceAll('\\','/'),inventory_sha256:a.sha(fs.readFileSync(jsonPath)),group_source_sha256:record.group_source_sha256,no_resume_without_new_user_GO:true};
fs.appendFileSync(path.join(a.root,mission,'ledger.jsonl'),JSON.stringify(event)+'\n');
fs.writeFileSync(path.join(folder,'stop-final.json'),JSON.stringify(event,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({counts,inventory:mdPath,json:jsonPath,stop:record.stop,groups:record.group_source_sha256}));
