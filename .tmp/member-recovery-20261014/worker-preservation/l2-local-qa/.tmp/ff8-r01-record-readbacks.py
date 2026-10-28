import pathlib, json, hashlib, datetime
p=pathlib.Path('docs/missions/ff8-decomp-semantics-2026-10-11-run01')
seen=set()
oversize_recorded=False
for line in (p/'ledger.jsonl').read_text(encoding='utf-8').splitlines():
    event=json.loads(line)
    if event.get('event')=='NATIVE_MODEL_READBACK': seen.add(event['session_id'])
    if event.get('event')=='USER_STEERING_OVERSIZE': oversize_recorded=True
events=[]
for file in sorted(p.glob('*.readback.json')):
    obj=json.loads(file.read_text(encoding='utf-8-sig'))
    session=obj['session']
    if session['id'] in seen: continue
    errors=[m['error'] for m in (obj.get('messages') or {}).get('data',[]) if m.get('error')]
    events.append({'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'NATIVE_MODEL_READBACK','session_id':session['id'],'model_ref':session.get('model'),'outcome':session.get('outcome'),'errors':errors,'artifact':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
with (p/'ledger.jsonl').open('a',encoding='utf-8') as f:
    for e in events: f.write(json.dumps(e)+'\n')
    if not oversize_recorded: f.write(json.dumps({'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'USER_STEERING_OVERSIZE','target':'0x487DF0','production':'GLM 5.3 Flash dedicated 2+1 per volet','oversize_classifier':'openai/gpt-6-luna-fast','variant':'medium','archive_exact_request_response':True})+'\n')
print(json.dumps({'readbacks_recorded':len(events),'error_routes':[e['model_ref'] for e in events if e['errors']]}))
