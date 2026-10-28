import pathlib,json,struct,hashlib,datetime
import idaapi,ida_bytes
r=pathlib.Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
m=r/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
pe=pathlib.Path(idaapi.get_input_file_path()).read_bytes()
sha=hashlib.sha256(pe).hexdigest();assert sha=='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
off=struct.unpack_from('<I',pe,0x3c)[0];n=struct.unpack_from('<H',pe,off+6)[0];sz=struct.unpack_from('<H',pe,off+20)[0]
base=struct.unpack_from('<I',pe,off+24+28)[0];va=0x50EE1C;size=163*4;rva=va-base;fileoff=None
for i in range(n):
 vs,sv,rs,rp=struct.unpack_from('<IIII',pe,off+24+sz+40*i+8)
 if sv<=rva and rva+size<=sv+rs:fileoff=rp+rva-sv
assert fileoff is not None
raw=pe[fileoff:fileoff+size];values=list(struct.unpack('<163I',raw));expected=[0x50E531+14*i for i in range(163)]
assert values==expected,'dispatch table mapping differs'
assert hashlib.sha256(raw).hexdigest()=='61ba449f67a8dab7b273a85d004bcdd3edcbdfaae340d3229b5c2d2c73b89cb5'
assert ida_bytes.get_bytes(va,size)==raw,'live IDB table differs from authenticated PE'
packet=json.loads((r/'inputs/ff8-decomp-semantics-20261011-r01/g23/0x50E510.json').read_text(encoding='utf-8'))
chunk=packet['chunks'][0];start=int(chunk['start'],16);code=bytes.fromhex(chunk['hex'])
assert ida_bytes.get_bytes(start,len(code))==code,'live native code changed since freeze'
targets=[]
for i,dest in enumerate(values):
 p=dest-start;stub=code[p:p+14]
 assert len(stub)==14 and stub[5]==0xE8 and stub[10:]==bytes.fromhex('83c404c3'),f'bad stub {i}'
 targets.append(hex((dest+10+struct.unpack_from('<i',stub,6)[0])&0xffffffff))
folder=m/'supplemental-native/g23';folder.mkdir(parents=True,exist_ok=True)
binary=folder/'0x50EE1C__dispatch163.bin';proof=folder/'0x50EE1C__dispatch163.json';assert not binary.exists() and not proof.exists()
binary.write_bytes(raw)
e={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'SUPPLEMENTAL_NATIVE_TABLE_FROZEN','group':'g23','ea':'0x50E510','pe_sha256':sha,'table_va':hex(va),'file_offset':hex(fileoff),'size':size,'entries':163,'table_sha256':hashlib.sha256(raw).hexdigest(),'live_idb_equals_pe':True,'live_root_equals_frozen':True,'entry_formula':'0x50E531+14*i, i=0..162','stub_call_targets':targets,'artifact':'supplemental-native/g23/0x50EE1C__dispatch163.bin','classifier_v1':'unchanged; original compaction already describes this exact table/hash; no enrichment of archived request','mutations':'file evidence only; no IDB/Git/live process writes'}
proof.write_text(json.dumps(e,indent=2)+'\n',encoding='utf-8')
with (m/'ledger.jsonl').open('a',encoding='utf-8') as fp:fp.write(json.dumps(e)+'\n')
print(json.dumps({'group':'g23','ea':'0x50E510','entries':163,'bytes':size,'checks':'authenticated PE / live IDB / full frozen root / all163 stubs PASS','artifact':e['artifact']}))
