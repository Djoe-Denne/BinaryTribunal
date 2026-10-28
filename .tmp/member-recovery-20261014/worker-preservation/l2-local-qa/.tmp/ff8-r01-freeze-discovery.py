import json, pathlib, re, hashlib, datetime, sys
root=pathlib.Path.cwd()
mission=root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
group=sys.argv[1]
file=mission/sys.argv[2]
obj=json.loads(file.read_text(encoding='utf-8-sig'))
found=[]
for m in obj['messages']['data']:
    for c in m.get('content',[]):
        s=c.get('state',{})
        code=s.get('input',{}).get('code','')
        if s.get('status')=='completed' and 'COMMON_COMPACTION' in code and 'tools.team_message' in code:
            match=re.search(r'<details>\s*(.*?)\s*</details>',code,re.S)
            if match and 'COMMON_COMPACTION' in match.group(1): found.append((m['id'],match.group(1)))
assert found, 'No completed report found; do not synthesize missing report'
message_id,compaction=found[0]
out=root/'inputs/ff8-decomp-semantics-20261011-r01'/group
out.mkdir(parents=True,exist_ok=True)
p=out/'common-compaction.md'
assert not p.exists(), 'Compaction already frozen'
p.write_text(compaction+'\n',encoding='utf-8')
graph=json.loads((mission/'native-groups.json').read_text(encoding='utf-8'))
eas=next(g['eas'] for g in graph['groups'] if g['id']==group)
payloads=mission/'classifier-payloads'
payloads.mkdir(exist_ok=True)
for ea in eas:
    native=root/'.tmp/ff8-decomp-semantics-20261011-r01/native'/f'{ea}.json'
    raw=native.read_bytes()
    (out/f'{ea}.json').write_bytes(raw)
    objn=json.loads(raw)
    # Full discovery text is included verbatim as assembly comments, not assumed to be consumed from an undocumented metadata field.
    annotated='; COMMON FACTUAL DISCOVERY (not target code)\n'+'\n'.join('; '+l for l in compaction.splitlines())+'\n; TARGET ASM COMPLETE\n'+objn['assembly']
    payload={'assembly':annotated,'architecture':'x86-32','metadata':{'cfg':objn['cfg'],'basic_blocks':len(objn['cfg'])}}
    (payloads/f'{ea}.request.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
event={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'DISCOVERY_COMPACTION_FROZEN','group':group,'session_id':obj['session']['id'],'message_id':message_id,'compaction':str(p.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'native_receipt':str(file.relative_to(root)).replace('\\','/'),'eas':eas,'payloads':'classifier-payloads/<EA>.request.json','classifier_input_format':'full_compaction_as_comments_then_complete_native_asm_v1'}
with (mission/'ledger.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(event)+'\n')
print(json.dumps(event))
