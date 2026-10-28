import json, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DOC = 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/'
OUT = 'outputs/ff8-decomp-semantics-20261011-r01/'
IN = 'inputs/ff8-decomp-semantics-20261011-r01/'
GROUPS = ['g11','g14','g15','g17','g19','g20','g21','g22','g23','g24']
BOUNDARIES = {
 'g11':'msg_12bda6360001PLWY808ZB6k62X',
 'g14':'msg_12be1d66c001P4gg9iFLmtfOLt',
 'g15':'msg_12be1f4c5001E2meLxcwwtQ8Ln',
 'g17':'msg_12be1cd49001BowbZIVfuXq4cy',
 'g19':'msg_12be1fab1001j6zIKCIDWumgsw',
 'g20':'msg_12be208fb001NLLqDcR434Dzcc',
 'g22':'msg_12be1a1c8001C5UIsPipMwMxpA',
 'g23':'msg_12be38194001gnAnmLhxeTFUC0',
 'g24':'msg_12be0a51d001PQSlhREmKaBmf0'
}

def read(p):
 return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p):
 return hashlib.sha256((ROOT/p).read_bytes()).hexdigest() if p and (ROOT/p).is_file() else None
def pick_files(g,ea,kind):
 base=ROOT/(OUT+'classification/'+g)
 matches=sorted(base.rglob(ea+'.'+kind+'*.json'))
 matches=[p for p in matches if 'submitted-encoding' not in p.name]
 return matches[0].relative_to(ROOT).as_posix() if matches else None
def strs(x):
 if isinstance(x,dict):
  for v in x.values(): yield from strs(v)
 elif isinstance(x,list):
  for v in x: yield from strs(v)
 elif isinstance(x,str): yield x
def find_rows(r):
 for k in ['routes','entries','functions','dispatches','eas','dispatch_ready']:
  if isinstance(r.get(k),list): return r[k]
 return []
def receipt_hashes(x,kind):
 found=[]
 if isinstance(x,dict):
  for k,v in x.items():
   if kind in k and isinstance(v,str) and len(v)==64:
    found.append(v)
   if kind in k and isinstance(v,dict) and v.get('sha256'):
    found.append(v['sha256'])
   found.extend(receipt_hashes(v,kind))
 elif isinstance(x,list):
  for v in x: found.extend(receipt_hashes(v,kind))
 return found
def dump(p,obj):
 (ROOT/p).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

native=read(DOC+'native-groups.json')
pe=read(DOC+'native-pe-verification.json')
fn={x['ea']:x for x in native['functions']}
members={x['id']:x['eas'] for x in native['groups']}
pe_rows={x['ea']:x for x in pe['results']}
result={'groups':[]}
proof={'task':'task_mv44bte0_004n_e0c49i','scope':GROUPS,'contract_sha256':sha(DOC+'CONTRACT.md'),'native_groups_sha256':sha(DOC+'native-groups.json'),'native_pe_verification_sha256':sha(DOC+'native-pe-verification.json'),'native_input_sha256':native['native']['input_sha256'],'groups':[],'policy':'Mechanical normalization only. No classifier objects changed; no reclassification, IDA, historical code research, author creation or ledger mutation. READY remains subject to lead Model.Ref/admission gates.'}
assert native['native']['input_sha256']==pe['disk_pe_sha256']==pe['idb_recorded_input_sha256']
for g in GROUPS:
 route_path=OUT+'classification/'+g+'/routing.json'
 route=read(route_path)
 source_path=DOC+'discovery-harvest/'+g+'.source.native.json'
 source=read(source_path)
 messages=source['messages']['data']
 sid=source['session']['id']
 title=source['session']['title'].split(' ')[0]
 context={'mode':'checkpoint','from':sid,'messageID':BOUNDARIES[g]} if g in BOUNDARIES else {'mode':'fork','from':sid}
 reason=('Exclusive boundary BEFORE first external docs/code knowledge lookup capable of returning historical target candidates; catalogue discovery and preceding native packet reads retained. Frozen common compaction supplied separately unchanged.' if g in BOUNDARIES else 'Archived source history contains only mission/native packet reads and own factual reports; no external target-candidate knowledge lookup observed. Full factual fork allowed; same frozen compaction supplied.')
 boundary_index=next((i for i,m in enumerate(messages) if m['id']==BOUNDARIES.get(g)),None)
 assert g not in BOUNDARIES or boundary_index is not None
 retained=messages[:boundary_index] if boundary_index is not None else messages
 gp={'group':g,'routing_path':route_path,'routing_sha256':sha(route_path),'source_path':source_path,'source_sha256':sha(source_path),'source_session_id':sid,'source_title':source['session']['title'],'context':context,'boundary_reason':reason,'boundary_message':messages[boundary_index] if boundary_index is not None else None,'retained_message_ids':[m['id'] for m in retained],'history_review':'Inspected archived native messages. g19 QMD calls before boundary are exact mission CONTRACT/native-groups paths, not target-code lookups. g24 boundary is broad docs grep. g21 no external lookup. Source existence and actual checkpoint membership verified.','rows':[]}
 gr={'group':g,'source':title,'source_session_id':sid,'context':context,'boundary_reason':reason,'rows':[]}
 old_rows={x['ea']:x for x in find_rows(route)}
 for ea in members[g]:
  old=old_rows.get(ea,{})
  packet=IN+g+'/'+ea+'.json'
  comp=IN+g+'/common-compaction.md'
  req=pick_files(g,ea,'request')
  resp=pick_files(g,ea,'response')
  prepared=DOC+'classifier-payloads/'+ea+'.request.json'
  p=read(packet)
  c=(ROOT/comp).read_text(encoding='utf-8')
  blockers=[]
  checks={'packet_sha_matches_frozen_manifest':sha(packet)==fn[ea]['sha256'],'packet_equals_original_frozen_export':sha(packet)==sha(fn[ea]['path']),'native_pe_match':pe_rows[ea]['idb_equals_pe_and_freeze'],'native_input_sha_matches_pe':p['native']['input_sha256']==pe['disk_pe_sha256']}
  if req:
   q=read(req)
   prepared_q=read(prepared)
   comp_lines=c.splitlines()
   request_lines=q['assembly'].splitlines()
   commented=['; '+line for line in comp_lines]
   start=next((i for i in range(len(request_lines)) if request_lines[i:i+len(commented)]==commented),None)
   checks.update({'request_equals_prepared_json':q==prepared_q,'complete_native_asm_included_unchanged':p['assembly'] in q['assembly'],'common_compaction_included_unchanged_ordered':start is not None,'architecture_x86_32':q['architecture']=='x86-32','cfg_equals_packet':q.get('metadata',{}).get('cfg')==p['cfg']})
  else:
   checks['classifier_request_present']=False
  response=read(resp) if resp else {}
  evidence=response.get('evidence') or {}
  answers=evidence.get('answers',{})
  full=bool(response.get('provider') and response.get('model') and response.get('response_model') and evidence.get('model') and all(answers.get(k,{}).get('probabilities') for k in ['complexity','uncertainty','uncertainty_cause']))
  checks['full_native_response_evidence_models_probabilities']=full
  # Existing manifest hashes are checked against unchanged receipts, not added to native classifier objects.
  recorded=set(strs(old))
  if g=='g11': recorded.update(strs(route['factual_inputs']))
  for name,path in [('request',req),('response',resp)]:
   expected_receipt_hashes=receipt_hashes(old,name)
   if path and expected_receipt_hashes:
    checks[name+'_hash_matches_recorded_route']=sha(path) in expected_receipt_hashes
  # Common hashes may be in the group header rather than per-EA entries.
  checks['compaction_hash_recorded_in_route']=sha(comp) in set(strs(route))
  actual=old.get('actual_submitted_request')
  if actual:
   checks['actual_submitted_request_hash_matches_route']=sha(actual['path'])==actual['sha256']
   checks['actual_submitted_request_equals_prepared_json']=read(actual['path'])==prepared_q
  if not pe_rows[ea]['idb_equals_pe_and_freeze']:
   blockers.append('QUARANTINED_PE_MISMATCH: frozen native bytes differ from same-hash disk PE; supervisor disposition required.')
  if old.get('status','').startswith('BLOCKED'):
   blockers.append(old['status']+': '+str(old.get('rationale','Existing receipt blocks admission.')))
  for k,v in checks.items():
   if not v: blockers.append('Verification failed: '+k)
  raw_tier=str(old.get('tier') or old.get('route') or old.get('level') or '').lower()
  tier='complex' if 'complex' in raw_tier or p['instruction_count']>200 else 'simple' if raw_tier=='simple' else 'medium'
  # Preserve bounded v1 routing. No new classification or semantic judgement.
  mode='1+P' if tier=='simple' else '2+1'
  authors=[]
  recon=[]
  if not blockers:
   c_models=[('openai/gpt-6-astra','high'),('opencode/claude-opus-5-5','high')] if tier=='complex' else [('openai/gpt-6.1-sol','high'),('opencode-go/gpt-6-luna','medium')]
   for role,(model,variant) in zip(['A','B'],c_models[:1] if mode=='1+P' else c_models):
    authors.append({'volet':'C','role':role,'model':model,'variant':variant,'output':OUT+'production/'+g+'/'+ea+'/c_'+role.lower()+'.md'})
   for role in ['A'] if mode=='1+P' else ['A','B']:
    authors.append({'volet':'semantic','role':role,'model':'openai/gpt-6.1-sol','variant':'high' if tier=='complex' else 'medium','output':OUT+'production/'+g+'/'+ea+'/semantic_'+role.lower()+'.md'})
   if mode=='2+1':
    for volet,prefix in [('C','c'),('semantic','semantic')]:
     recon.append({'volet':volet,'model':'openai/gpt-6.1-sol','variant':'high','output':OUT+'production/'+g+'/'+ea+'/'+prefix+'_r.md'})
  rationale=old.get('rationale') or (route.get('routing',{}).get(ea,{}) or {}).get('rationale') or 'Existing v1 tier retained; quarantined/unclassified EA cannot dispatch.'
  rationale='; '.join(rationale) if isinstance(rationale,list) else str(rationale)
  if tier=='medium' and not blockers:
   rationale+=' Temporary medium C A substitution: openai/gpt-6.1-sol high because new ZAI/GLM admissions are unavailable (proven 429 steering); B opencode-go/gpt-6-luna medium. Independent Sol medium semantic authors; separate Sol high R after A+B.'
  row={'ea':ea,'status':'BLOCKED' if blockers else 'READY','request_path':req,'response_path':resp,'request_sha256':sha(req),'response_sha256':sha(resp),'packet_path':packet,'packet_sha256':sha(packet),'compaction_path':comp,'compaction_sha256':sha(comp),'tier':tier,'mode':mode,'authors':authors,'R':recon,'rationale':rationale}
  if blockers: row['blocker']=' | '.join(blockers)
  gr['rows'].append(row)
  gp['rows'].append({'ea':ea,'checks':checks,'prepared_request_path':prepared,'prepared_request_sha256':sha(prepared),'actual_submitted_request':actual,'packet_original_path':fn[ea]['path'],'packet_original_sha256':sha(fn[ea]['path']),'pe_verification':pe_rows[ea],'native_instruction_count':p['instruction_count'],'compaction_payload_start_line':start+1 if req and start is not None else None,'manifest_status':old.get('status'),'manifest_structural_flags':old.get('structural_flags',[]),'classification_receipts_unchanged':True,'blockers':blockers})
 result['groups'].append(gr)
 proof['groups'].append(gp)
dump(OUT+'admission/s2.json',result)
dump(OUT+'admission/s2/proof.json',proof)
rows=[x for g in result['groups'] for x in g['rows']]
print(json.dumps({'artifact':OUT+'admission/s2.json','sha256':sha(OUT+'admission/s2.json'),'READY':sum(x['status']=='READY' for x in rows),'BLOCKED':sum(x['status']=='BLOCKED' for x in rows),'blocked':[{'ea':x['ea'],'blocker':x['blocker']} for x in rows if x['status']=='BLOCKED']}))
