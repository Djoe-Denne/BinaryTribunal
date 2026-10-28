import json, re, hashlib, pathlib, datetime

root = pathlib.Path.cwd()
out = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
out.mkdir(parents=True, exist_ok=True)
brief = root / 'docs/missions/ff8-decomp-semantics-2026-10-11.md'
text = brief.read_text(encoding='utf-8-sig')
main = text.split('### 3.')[0]
addresses = re.findall(r'0x[0-9A-Fa-f]{6}', main)
addresses = [f'0x{int(a, 16):06X}' for a in addresses]
extension = [f'0x{int(a, 16):06X}' for a in re.findall(r'[0-9]{3}=0x([0-9A-Fa-f]{6})', text.split('### 5.')[1])]
assert len(addresses) == len(set(addresses)) == 98
assert len(extension) == len(set(extension)) == 151
assert not set(addresses) & set(extension)
manifest = {'mission':'ff8-decomp-semantics-20261011-r01','brief_sha256':hashlib.sha256(brief.read_bytes()).hexdigest(),'scope':addresses,'extension_excluded':extension,'counts':{'main':98,'extension':151,'intersection':0}}
(out/'inventory.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
catalog = pathlib.Path('C:/Users/djden/.config/opencode/ensemble.json').read_bytes()
assert len(json.loads(catalog)['modelRouting']['models']) == 17
(out/'catalogue.snapshot.json').write_bytes(catalog)
event = {'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'GO_AND_INVENTORY_VERIFIED','mission':manifest['mission'],'scope_count':98,'extension_authorized':False,'live_authorized':False,'cost_ceiling':None,'concurrency_ceiling':None,'catalogue_sha256':hashlib.sha256(catalog).hexdigest(),'contract':'CONTRACT.md','status':'PREFLIGHT'}
with (out/'ledger.jsonl').open('a',encoding='utf-8') as f: f.write(json.dumps(event)+'\n')
print(json.dumps({'mission':manifest['mission'],'main':98,'extension_excluded':151,'intersection':0,'catalogue':17,'ledger':str(out/'ledger.jsonl')}))
