"""Mechanical admission proof; does not read candidate outputs or invoke classifiers."""
import json, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DOC = 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
OUT = 'outputs/ff8-decomp-semantics-20261011-r01'
INP = 'inputs/ff8-decomp-semantics-20261011-r01'
def load(p): return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256((ROOT/p).read_bytes()).hexdigest() if p and (ROOT/p).exists() else None
def text(p): return (ROOT/p).read_text(encoding='utf-8-sig')
boundaries = {
 'g01':'msg_12bdf747c001OEtfdz2CI1AAPd',
 'g02':'msg_12bd911f7001SQIC8TwUq3Vfwq',
 'g03':'msg_12be11e760013ANLmfZpeoo8y3',
 'g04':'msg_12bdfd452001in5d7tzw9BwQoJ',
 'g05':'msg_12bdd212b001gXHEVyI6EbAcNx',
 'g06':'msg_12bdfae830013u3595EkdjBz3F',
 'g07':'msg_12be1e267001VMpP8Xoss7hZv6',
 'g09':'msg_12be8e9d9001XjCoIeWONN7ejr',
 'g10':'msg_12be21847001KRZBH7aVjguHt1',
}
ng=load(DOC+'/native-groups.json'); pe=load(DOC+'/native-pe-verification.json')
facts={x['ea']:x for x in ng['functions']}; per={x['ea']:x for x in pe['results']}
proof={'authority_hashes':{f:sha(DOC+'/'+f) for f in ['CONTRACT.md','native-groups.json','native-pe-verification.json']},'groups':[]}
result={'groups':[]}
for gg in ng['groups'][:10]:
 g=gg['id']; src='discover-'+g; hp=DOC+'/discovery-harvest/'+g+'.source.native.json'; history=load(hp)
 msgs=history['messages']['data']; ids=[m['id'] for m in msgs]; boundary=boundaries.get(g)
 assert not boundary or boundary in ids
 context={'mode':'checkpoint' if boundary else 'fork','from':src}
 if boundary: context['messageID']=boundary
 reason=('Exclusive boundary before first external documentation/code lookup capable of historical target candidate exposure; all preceding native reads retained. SAME frozen compaction supplied separately, not synthetic history.' if boundary else 'Full native history inspected: only mission/native packet reads, inventory and factual report; no external candidate-capable lookup. Full factual reader fork allowed.')
 gp={'group':g,'source_history_path':hp,'source_history_sha256':sha(hp),'session_id':history['session']['id'],'checkpoint_present':not boundary or boundary in ids,'exclusive_boundary':boundary,'retained_message_ids':ids[:ids.index(boundary)] if boundary else ids,'boundary_tool_inputs':[{'tool':p.get('name'),'input':p.get('state',{}).get('input')} for m in msgs if m['id']==boundary for p in m.get('content',[]) if p.get('type')=='tool'],'rows':[]}
 rt=load(OUT+'/classification/'+g+'/routing.json')
 entries=next((rt[k] for k in ['dispatches','entries','routes','functions'] if isinstance(rt.get(k),list)),[])
 er={x['ea']:x for x in entries};
 if g=='g01': er[rt['ea']]={'tier':rt['routing']['tier'],'rationale':rt['routing']['justification'],'classifier':rt['classifier']}
 group={'group':g,'source':src,'source_session_id':history['session']['id'],'context':context,'boundary_reason':reason,'rows':[]}
 cp=INP+'/'+g+'/common-compaction.md'; common=text(cp)
 for ea in gg['eas']:
  entry=er.get(ea,{}); packet=INP+'/'+g+'/'+ea+'.json'; native=facts[ea]; pkt=load(packet)
  candidates=list((ROOT/(OUT+'/classification/'+g)).rglob(ea+'.request.json'))
  req=candidates[0].relative_to(ROOT).as_posix() if candidates else None
  responses=list((ROOT/(OUT+'/classification/'+g)).rglob(ea+'.response*.json'))
  resp=responses[0].relative_to(ROOT).as_posix() if responses else None
  prepared=DOC+'/classifier-payloads/'+ea+'.request.json'
  checks={'packet_matches_native_manifest':sha(packet)==native['sha256'],'packet_bytes_equal_native_freeze':(ROOT/packet).read_bytes()==(ROOT/native['path']).read_bytes(),'native_pe_match':per[ea]['idb_equals_pe_and_freeze'],'immutable_common_hash_in_routing':sha(cp) in json.dumps(rt),'harvest_text_equal_except_terminal_newlines':common.rstrip('\r\n')==text(DOC+'/discovery-harvest/'+g+'.common-compaction.md').rstrip('\r\n'),'native_pe_identity':pkt['native']['input_sha256']==ng['native']['input_sha256']==pe['disk_pe_sha256']==pe['idb_recorded_input_sha256']}
  if req:
   request=load(req); asm=request['assembly']; rawcommon=common.rstrip('\r\n')
   encoded='\n'.join('; '+line for line in common.splitlines())
   checks.update(request_equals_prepared_json=load(req)==load(prepared),request_bytes_equal_prepared=(ROOT/req).read_bytes()==(ROOT/prepared).read_bytes(),complete_asm_unchanged=asm.endswith(pkt['assembly']),complete_common_unchanged=(encoded in asm or rawcommon in asm),architecture_x86_32=request.get('architecture')=='x86-32')
  else: checks['request_exists']=False
  if resp:
   response=load(resp); evidence=response.get('evidence',{}); answers=evidence.get('answers',{})
   checks['complete_native_response']=all(k in response for k in ['complexity','uncertainty','provider','model','response_model','evidence']) and bool(evidence.get('model')) and all(isinstance(answers.get(k,{}).get('probabilities'),dict) and bool(answers[k]['probabilities']) for k in ['complexity','uncertainty','uncertainty_cause'])
  else: response={};checks['complete_native_response']=False
  tier=entry.get('tier',entry.get('route',entry.get('route_v1',entry.get('profile','complex'))))
  tier='complex' if 'complex' in str(tier) else tier
  flags=str(entry.get('structural_flags',[])).lower()
  if pkt['instruction_count']>200 or ('indirect' in flags and any(k in flags for k in ['unresolved','unknown'])):tier='complex'
  if response and (response['complexity']>65 or response['uncertainty']>50):tier='complex'
  blocked=[k for k,v in checks.items() if not v]
  if ea=='0x487DF0':blocked.append('User-special GLM max 2+1 only; pending Luna oversize response and proven429 ZAI availability')
  special=ea=='0x487DF0'; medium=tier=='medium'; authors=[]; recon=[]
  for volet in ['C','semantic']:
   for role in ['A','B']:
    if special:model='zai-coding-plan/glm-5.3-flash';variant='max'
    elif volet=='semantic':model='openai/gpt-6.1-sol';variant='medium' if medium else 'high'
    elif medium:model='openai/gpt-6.1-sol' if role=='A' else 'opencode-go/gpt-6-luna';variant='high' if role=='A' else 'medium'
    else:model='openai/gpt-6-astra' if role=='A' else 'opencode/claude-opus-5-5';variant='high'
    authors.append({'volet':volet,'role':role,'model':model,'variant':variant,'output':OUT+'/production/'+g+'/'+ea+'/'+('c' if volet=='C' else 'semantic')+'_'+role.lower()+'.md'})
   recon.append({'volet':volet,'model':'zai-coding-plan/glm-5.3-flash' if special else 'openai/gpt-6.1-sol','variant':'max' if special else 'high','output':OUT+'/production/'+g+'/'+ea+'/'+('c' if volet=='C' else 'semantic')+'_r.md'})
  rationale=entry.get('rationale','No classifier receipt admitted; preserved native facts only.')
  if medium:rationale=str(rationale)+' Ordinary medium C A explicitly substitutes Sol high for unavailable GLM (proven429); B Luna medium. Separate blind semantic authors. Not reclassification.'
  row={'ea':ea,'status':'BLOCKED' if blocked else 'READY','request_path':req,'response_path':resp,'request_sha256':sha(req),'response_sha256':sha(resp),'packet_path':packet,'packet_sha256':sha(packet),'compaction_path':cp,'compaction_sha256':sha(cp),'tier':tier,'mode':'2+1','authors':authors,'R':recon,'rationale':rationale}
  if blocked:row['blocker']='; '.join(blocked)
  group['rows'].append(row);gp['rows'].append({'ea':ea,'checks':checks,'prepared_request_path':prepared,'prepared_request_sha256':sha(prepared),'native_freeze_path':native['path'],'native_manifest_sha256':native['sha256'],'harvest_compaction_sha256':sha(DOC+'/discovery-harvest/'+g+'.common-compaction.md'),'compaction_note':'Frozen input hash matches routing; harvest differs only by terminal newline, classifier input remains unchanged.','original_routing_sha256':sha(OUT+'/classification/'+g+'/routing.json'),'pe_evidence':per[ea]})
 result['groups'].append(group);proof['groups'].append(gp)
base=ROOT/(OUT+'/admission')
(base/'s1.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
(base/'s1'/'proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
rows=[x for g in result['groups'] for x in g['rows']]
print(json.dumps({'artifact':OUT+'/admission/s1.json','sha256':sha(OUT+'/admission/s1.json'),'READY':sum(x['status']=='READY' for x in rows),'BLOCKED':sum(x['status']=='BLOCKED' for x in rows),'blockers':[(x['ea'],x.get('blocker')) for x in rows if x['status']=='BLOCKED']}))
