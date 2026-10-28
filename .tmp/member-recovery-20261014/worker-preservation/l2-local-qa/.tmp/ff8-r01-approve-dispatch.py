import pathlib,json,hashlib,datetime,sys
r=pathlib.Path.cwd();m=r/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
s=sys.argv[1];src=r/f'outputs/ff8-decomp-semantics-20261011-r01/admission/{s}.json'
manifest=json.loads(src.read_text(encoding='utf-8'))
gate={x['ea']:x for x in json.loads((m/'native-pe-verification.json').read_text(encoding='utf-8'))['results']}
ledger=[json.loads(x) for x in (m/'ledger.jsonl').read_text(encoding='utf-8-sig').splitlines() if x.strip()]
existing={x.get('ea') for x in ledger if x['event'] in ('PRODUCTION_ADMISSION','SESSION_ADMISSION_VERIFIED') and x.get('ea') and x.get('role')!='R'}
catalogue={x['id'] for x in json.loads((m/'catalogue.snapshot.json').read_text(encoding='utf-8'))['modelRouting']['models']}
plan=[];blocked=[];events=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for g in manifest['groups']:
 hist=json.loads((m/f"discovery-harvest/{g['group']}.source.native.json").read_text(encoding='utf-8'))
 msgs=sorted(hist['messages']['data'],key=lambda x:x['time']['created'])
 context=dict(g['context']);assert context['from'] in (g['source'],hist['session']['id'])
 if context['mode']=='checkpoint':assert any(x['id']==context['messageID'] for x in msgs)
 # Conservatively exclude even historical target-path snippets, never splice history.
 current=next((i for i,x in enumerate(msgs) if x['id']==context.get('messageID')),len(msgs))
 eas=[x['ea'].lower() for x in g['rows']]
 for i,x in enumerate(msgs[:current]):
  hit=False
  for c in x.get('content',[]):
   if c.get('type')!='tool':continue
   t=json.dumps(c.get('state',{}).get('content',[])).lower().replace('\\\\','/')
   if any(('/decomp/'+ea in t or '/semantic/'+ea in t or ea+'__' in t) for ea in eas):hit=True
  if hit:
   context={'mode':'checkpoint','from':g['source'],'messageID':x['id']};break
 for x in g['rows']:
  ea=x['ea']
  if x['status']!='READY':blocked.append({'ea':ea,'reason':x.get('blocker')});continue
  if ea in existing:continue
  assert gate[ea]['idb_equals_pe_and_freeze'],ea
  for field in ['request','response','packet','compaction']:
   assert sha(r/x[field+'_path'])==x[field+'_sha256'],f'{ea} {field} hash mismatch'
  request=json.loads((r/x['request_path']).read_text(encoding='utf-8'));response=json.loads((r/x['response_path']).read_text(encoding='utf-8'))
  prepared=json.loads((m/f'classifier-payloads/{ea}.request.json').read_text(encoding='utf-8'))
  packet=json.loads((r/x['packet_path']).read_text(encoding='utf-8'))
  assert request==prepared and request['assembly'].endswith(packet['assembly']),ea
  comp=(r/x['compaction_path']).read_text(encoding='utf-8')
  expected='; COMMON FACTUAL DISCOVERY (not target code)\n'+'\n'.join('; '+line for line in comp.rstrip('\n').splitlines())+'\n; TARGET ASM COMPLETE\n'+packet['assembly']
  assert request['assembly']==expected,ea+' common compaction mismatch'
  assert response.get('evidence',{}).get('answers') and 'complexity' in response and 'uncertainty' in response,ea
  assert request['architecture']=='x86-32' and request['metadata']['cfg']==packet['cfg'],ea
  for a in x['authors']:
   assert a['model'] in catalogue and not a['model'].startswith('zai-coding-plan/'),ea+' unavailable model'
   assert a['output'].startswith(f"outputs/ff8-decomp-semantics-20261011-r01/production/{g['group']}/{ea}/"),ea+' output scope'
   name=('c' if a['volet']=='C' else 'sem')+'-'+a['role'].lower()+'-'+ea[2:].lower()
   plan.append({'name':name,'ea':ea,'group':g['group'],'context':context,'tier':x['tier'],'mode':x['mode'],**a})
  event={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'CLASSIFICATION_ACCEPTED_NATIVE','ea':ea,'group':g['group'],'manifest':str(src.relative_to(r)).replace('\\','/'),'manifest_sha256':sha(src),'request_path':x['request_path'],'response_path':x['response_path'],'request':request,'response':response,'input_hashes':{f:x[f+'_sha256'] for f in ['request','response','packet','compaction']},'source_context':context,'mode':x['mode'],'tier':x['tier'],'approval':'parent exact payload/full native response/hash/PE/source boundary checks; not final RE promotion'}
  events.append(event)
out=r/f'.tmp/ff8-r01-approved-{s}.json';assert not out.exists();out.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
with (m/'ledger.jsonl').open('a',encoding='utf-8') as f:
 for event in events:f.write(json.dumps(event,ensure_ascii=False)+'\n')
print(json.dumps({'slice':s,'author_tasks':len(plan),'functions':len(set(x['ea'] for x in plan)),'blocked':blocked,'already_admitted_skipped':sorted(existing),'plan':str(out.relative_to(r))}))
