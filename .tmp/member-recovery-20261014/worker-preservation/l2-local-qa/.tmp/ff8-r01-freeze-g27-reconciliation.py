import pathlib,json,hashlib,datetime,shutil
r=pathlib.Path.cwd();mission=r/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
prod=r/'outputs/ff8-decomp-semantics-20261011-r01/production/g27/0x50BF90'
base=r/'inputs/ff8-decomp-semantics-20261011-r01/g27'
receipts=[]
for volet,files in [('semantic',['semantic_a.md','semantic_b.md']),('C',['c_a.md','c_b.md'])]:
    target=r/'inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g27'/volet
    target.mkdir(parents=True,exist_ok=True)
    entries=[]
    for name in files:
        src=prod/name
        assert src.exists() and src.stat().st_size>100, f'Missing/empty deposited output {name}'
        b=src.read_bytes();dst=target/name
        if dst.exists():assert dst.read_bytes()==b,'Frozen artifact changed'
        else:dst.write_bytes(b)
        entries.append({'file':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
    for name in ['common-compaction.md','0x50BF90.json']:
        b=(base/name).read_bytes();dst=target/name
        if dst.exists():assert dst.read_bytes()==b
        else:dst.write_bytes(b)
    event={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'RECONCILIATION_INPUTS_FROZEN','group':'g27','ea':'0x50BF90','volet':volet,'artifacts':entries,'destination':str(target.relative_to(r)).replace('\\','/'),'acceptance':'deposited outputs only; not final semantic/C acceptance'}
    with (mission/'ledger.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(event)+'\n')
    receipts.append(event)
print(json.dumps(receipts))
