import json, hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[4]
DOC = ROOT / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
OUT = ROOT / 'outputs/ff8-decomp-semantics-20261011-r01'
GROUPS = ['g25','g28','g29','g30','g32','g33','g34','g35','g36']
BOUNDARIES = {
 'g25':'msg_12be33994001bBDbXB8gw2l260',
 'g28':'msg_12be385960016ghx1NexgoITBj',
 'g29':'msg_12be244ba0017fkxMu5bLSBPhG',
 'g30':'msg_12be2876f0014Zeu30R4K66d9h',
 'g33':'msg_12be2fa0e001TALFx2sgaRCo6L',
 'g34':'msg_12be25945001z1eTmeIwOzxKcZ',
 'g35':'msg_12be4915a0010zY9Q9WodK8x0n',
 'g36':'msg_12be56592001YMOAqzL1BgzwbA',
}
def load(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p): return p.relative_to(ROOT).as_posix()
def resolve(p,g):
 if isinstance(p,dict):p=p['path']
 p=pathlib.Path(p)
 return ROOT/p if len(p.parts)>1 else OUT/'classification'/g/p
def probabilities(obj):
 if isinstance(obj,dict):
  return 'probabilities' in obj or any(probabilities(v) for v in obj.values())
 if isinstance(obj,list): return any(probabilities(v) for v in obj)
 return False
pe=load(DOC/'native-pe-verification.json')
pe_rows={r['ea']:r['idb_equals_pe_and_freeze'] for r in pe['results']}
native_groups=load(DOC/'native-groups.json')
group_eas={g['id']:set(g['eas']) for g in native_groups['groups']}
proof={'native_groups_sha256':sha(DOC/'native-groups.json'),'native_pe_verification_sha256':sha(DOC/'native-pe-verification.json'),'disk_pe_sha256':pe['disk_pe_sha256'],'idb_recorded_input_sha256':pe['idb_recorded_input_sha256'],'groups':[]}
result={'groups':[]}
for g in GROUPS:
 routing_path=OUT/'classification'/g/'routing.json'
 routing=load(routing_path)
 source_path=DOC/'discovery-harvest'/f'{g}.source.native.json'
 source=load(source_path)
 session=source['session']['id']
 assert session==routing.get('source_session_id',routing.get('source_session',session))
 messages=source['messages']['data']
 ids=[m['id'] for m in messages]
 boundary=BOUNDARIES.get(g)
 assert not boundary or boundary in ids
 context={'mode':'checkpoint','from':session,'messageID':boundary} if boundary else {'mode':'fork','from':session}
 reason=('Exclusive boundary before first external documentation/code lookup that may expose historical candidates; earlier native reads retained; identical frozen compaction supplied separately.' if boundary else 'Entire archived g32 native history inspected: only mission contract/groups and native packets read; no external docs/code lookup or candidate-producing search. Frozen compaction supplied separately.')
 gp={'group':g,'source':'discover-'+g,'source_session_id':session,'context':context,'boundary_reason':reason,'rows':[]}
 history=[]
 for m in messages:
  for c in m.get('content',[]):
   if c.get('type')=='tool': history.append({'messageID':m['id'],'tool':c.get('name'),'input':c.get('state',{}).get('input',{})})
 pg={'group':g,'source_path':rel(source_path),'source_sha256':sha(source_path),'routing_path':rel(routing_path),'routing_sha256':sha(routing_path),'source_exists':True,'checkpoint_present':boundary in ids if boundary else None,'exclusive_boundary':boundary,'native_history_tool_inputs':history,'rows':[]}
 rows=next(routing[k] for k in ['dispatches','routes','rows','functions','eas'] if k in routing)
 assert set(row['ea'] for row in rows)==group_eas[g]
 for row in rows:
  ea=row['ea']; errors=[]
  packet_path=ROOT/'inputs/ff8-decomp-semantics-20261011-r01'/g/(ea+'.json')
  compaction_path=packet_path.parent/'common-compaction.md'
  packet=load(packet_path); compaction=compaction_path.read_text(encoding='utf-8-sig')
  original_path=ROOT/'.tmp/ff8-decomp-semantics-20261011-r01/native'/(ea+'.json')
  original_equal=original_path.read_bytes()==packet_path.read_bytes()
  if not original_equal:errors.append('frozen packet differs from native original')
  req_path=resolve(row.get('request_path',row.get('request')),g)
  res_path=resolve(row.get('response_path',row.get('response')),g)
  request=load(req_path); response=load(res_path)
  prepared_candidates=list((DOC/'classifier-payloads').rglob(ea+'*.json'))
  prepared_matches=[p for p in prepared_candidates if load(p)==request]
  if not prepared_matches: errors.append('request differs from prepared JSON or prepared payload absent')
  assembly=request.get('assembly','')
  asm_ok=packet['assembly'] in assembly
  compaction_ok=compaction in assembly or all('; '+line in assembly for line in compaction.splitlines())
  if not asm_ok: errors.append('full native ASM not preserved unchanged')
  if not compaction_ok: errors.append('common compaction not preserved unchanged')
  full_response=isinstance(response,dict) and all(k in response for k in ['evidence','model']) and probabilities(response)
  if not full_response: errors.append('native response missing evidence/model/probabilities')
  for field,path in [('request_sha256',req_path),('response_sha256',res_path)]:
   if row.get(field) and row[field]!=sha(path): errors.append(field+' mismatch')
   nested=row.get(field.replace('_sha256',''))
   if isinstance(nested,dict) and nested.get('sha256')!=sha(path):errors.append(field+' nested mismatch')
  for field in ['native_facts_sha256','native_packet_sha256','factual_sha256']:
   if row.get(field) and row[field]!=sha(packet_path):errors.append(field+' mismatch')
  if not pe_rows.get(ea,False): errors.append('native PE mismatch')
  if pe['disk_pe_sha256']!=pe['idb_recorded_input_sha256']:errors.append('native PE input identity mismatch')
  if g=='g29': errors.append('pending versioned native supplement and source validation; v1 receipts retained only')
  tier=row.get('tier',row.get('level','medium'))
  if 'complex' in tier: tier='complex'
  elif 'simple' in tier: tier='simple'
  else: tier='medium'
  if packet['instruction_count']>200: tier='complex'
  mode='1+P' if tier=='simple' else '2+1'
  models=([('C','A','openai/gpt-6-astra','high'),('C','B','opencode/claude-opus-5-5','high')] if tier=='complex' else [('C','A','openai/gpt-6.1-sol','high'),('C','B','opencode-go/gpt-6-luna','medium')])
  sv='high' if tier=='complex' else 'medium'
  models += [('semantic','A','openai/gpt-6.1-sol',sv),('semantic','B','openai/gpt-6.1-sol',sv)]
  production=OUT/'production'/g/ea
  authors=[{'volet':v,'role':role,'model':model,'variant':variant,'output':rel(production/((('c' if v=='C' else 'semantic')+'_'+role.lower())+'.md'))} for v,role,model,variant in models if mode!='1+P' or role=='A']
  reconciliators=[{'volet':v,'model':'openai/gpt-6.1-sol','variant':'high','output':rel(production/(('c' if v=='C' else 'semantic')+'_r.md'))} for v in ['C','semantic']] if mode=='2+1' else []
  rationale=row.get('rationale',[])
  if isinstance(rationale,list): rationale='; '.join(rationale)
  rationale+='; Preserve v1 tier; independent per-EA/per-role authors. '+('Complex C Astra/Opus high; semantic Sol high.' if tier=='complex' else 'Medium C A temporary Sol high substitution for unavailable GLM/new ZAI admissions proven429; B OpenCode Go Luna medium. Semantic Sol medium; R Sol high.')
  normalized={'ea':ea,'status':'BLOCKED' if errors else 'READY','request_path':rel(req_path),'response_path':rel(res_path),'request_sha256':sha(req_path),'response_sha256':sha(res_path),'packet_path':rel(packet_path),'packet_sha256':sha(packet_path),'compaction_path':rel(compaction_path),'compaction_sha256':sha(compaction_path),'tier':tier,'mode':mode,'authors':authors,'R':reconciliators,'rationale':rationale}
  if errors:normalized['blocker']='; '.join(errors)
  gp['rows'].append(normalized)
  pg['rows'].append({'ea':ea,'prepared_candidates':[rel(p) for p in prepared_candidates],'prepared_equal':[rel(p) for p in prepared_matches],'native_original_path':rel(original_path),'native_original_sha256':sha(original_path),'frozen_copy_equals_native_original':original_equal,'complete_asm_unchanged':asm_ok,'common_compaction_unchanged':compaction_ok,'full_native_response':full_response,'native_pe_match':pe_rows.get(ea,False),'errors':errors})
 result['groups'].append(gp);proof['groups'].append(pg)
target=OUT/'admission/s3.json';target.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
(OUT/'admission/s3/proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'artifact':rel(target),'sha256':sha(target),'READY':sum(r['status']=='READY' for g in result['groups'] for r in g['rows']),'BLOCKED':sum(r['status']=='BLOCKED' for g in result['groups'] for r in g['rows']),'blockers':[(g['group'],r['ea'],r.get('blocker')) for g in result['groups'] for r in g['rows'] if r['status']=='BLOCKED']}))
