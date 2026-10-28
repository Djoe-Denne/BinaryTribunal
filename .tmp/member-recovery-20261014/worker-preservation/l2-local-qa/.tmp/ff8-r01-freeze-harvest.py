import pathlib,json,hashlib,datetime
r=pathlib.Path.cwd();m=r/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
records=json.loads((m/'discovery-harvest.json').read_text(encoding='utf-8'))
new=[]
for x in records:
    if not x['report_found'] or x['outcome']!='succeeded':continue
    g=x['group'];out=r/'inputs/ff8-decomp-semantics-20261011-r01'/g
    out.mkdir(parents=True,exist_ok=True)
    comp=out/'common-compaction.md'
    if comp.exists():continue
    text=(m/x['compaction']).read_text(encoding='utf-8')
    comp.write_text(text,encoding='utf-8')
    d=m/'classifier-payloads';d.mkdir(exist_ok=True)
    for ea in x['eas']:
        src=r/'.tmp/ff8-decomp-semantics-20261011-r01/native'/f'{ea}.json'
        raw=src.read_bytes();packet=json.loads(raw);(out/f'{ea}.json').write_bytes(raw)
        annotated='; COMMON FACTUAL DISCOVERY (not target code)\n'+'\n'.join('; '+l for l in text.rstrip('\n').splitlines())+'\n; TARGET ASM COMPLETE\n'+packet['assembly']
        payload={'assembly':annotated,'architecture':'x86-32','metadata':{'cfg':packet['cfg'],'basic_blocks':len(packet['cfg'])}}
        p=d/f'{ea}.request.json';assert not p.exists()
        p.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    event={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'DISCOVERY_COMPACTION_FROZEN','group':g,'session_id':x['session_id'],'message_id':x['report_message'],'compaction':str(comp.relative_to(r)).replace('\\','/'),'sha256':hashlib.sha256(comp.read_bytes()).hexdigest(),'eas':x['eas'],'receipt':x['receipt'],'classifier_input_format':'full_compaction_as_comments_then_complete_native_asm_v1'}
    with (m/'ledger.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(event)+'\n')
    new.append(g)
failed=[x['group'] for x in records if x['outcome']=='failed']
with (m/'ledger.jsonl').open('a',encoding='utf-8') as f:
    f.write(json.dumps({'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'PROVIDER_TEMP_UNAVAILABLE','provider':'zai-coding-plan','reason':'native provider.rate-limit HTTP429','affected_discovery_groups':failed,'scope':'new admissions on shared ZAI route only; do not interrupt existing sessions','retry_after':'not yet extracted; no busy retry','healthy_routes_continue':True,'evidence':'discovery-harvest.json'})+'\n')
print(json.dumps({'new_frozen_groups':new,'failed_discoveries':failed}))
