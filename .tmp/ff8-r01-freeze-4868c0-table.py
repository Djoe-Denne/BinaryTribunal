import pathlib,json,struct,hashlib,datetime
import idaapi,ida_bytes
r=pathlib.Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
pe=pathlib.Path(idaapi.get_input_file_path()).read_bytes()
sha=hashlib.sha256(pe).hexdigest()
assert sha=='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
off=struct.unpack_from('<I',pe,0x3c)[0]
n=struct.unpack_from('<H',pe,off+6)[0];sz=struct.unpack_from('<H',pe,off+20)[0]
base=struct.unpack_from('<I',pe,off+24+28)[0]
va=0x4869F4;size=20;rva=va-base;fo=None
for i in range(n):
 vs,sv,rs,rp=struct.unpack_from('<IIII',pe,off+24+sz+40*i+8)
 if sv<=rva and rva+size<=sv+rs:fo=rp+rva-sv
assert fo is not None
raw=pe[fo:fo+size]
assert ida_bytes.get_bytes(va,size)==raw,'Live IDB differs from PE'
packet=json.loads((r/'inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json').read_text(encoding='utf-8'))
for c in packet['chunks']:
 b=bytes.fromhex(c['hex']);assert ida_bytes.get_bytes(int(c['start'],16),len(b))==b,'Target changed since freeze'
values=list(struct.unpack('<5I',raw))
dest=r/'inputs/ff8-decomp-semantics-20261011-r01/g07/supplemental-0x4868C0';dest.mkdir(parents=True,exist_ok=True)
proof={'captured_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ea':'0x4868C0','table_va':hex(va),'size':size,'hex':raw.hex(),'sha256':hashlib.sha256(raw).hexdigest(),'pe_sha256':sha,'pe_file_offset':hex(fo),'idb_table_equals_pe':True,'idb_target_equals_frozen':True,'entries':[{'index':i,'target':hex(v)} for i,v in enumerate(values)],'scope':'Supplemental raw bytes only; original common compaction and classifier payloads unchanged; no name/role claims'}
content=json.dumps(proof,indent=2)+'\n';file=dest/'dispatch-table.json'
assert not file.exists(),'Do not overwrite immutable capture'
file.write_text(content,encoding='utf-8');(dest/'dispatch-table.bin').write_bytes(raw)
ledger=r/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl'
with ledger.open('a',encoding='utf-8') as fp:fp.write(json.dumps({'event':'SUPPLEMENTAL_NATIVE_TABLE_FROZEN','group':'g07','artifact':str(file.relative_to(r)),**proof})+'\n')
print(json.dumps(proof))
