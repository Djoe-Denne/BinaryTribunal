"""Parent-only closure: append verified dispatch facts, save/read back each IDB comment."""
from pathlib import Path
import datetime
import hashlib
import json
import struct
import ida_bytes
import ida_nalt
import idc

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
folder = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/closure-20261012'
sha = lambda b: hashlib.sha256(b).hexdigest()
tag = '[semantic-triple 2026-10-12]'
pe_path = Path(ida_nalt.get_input_file_path())
pe = pe_path.read_bytes()
assert sha(pe) == '064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
nt = struct.unpack_from('<I', pe, 0x3c)[0]
optional = nt + 24
assert pe[nt:nt+4] == b'PE\0\0' and struct.unpack_from('<H', pe, optional)[0] == 0x10b
assert struct.unpack_from('<I', pe, optional+28)[0] == ida_nalt.get_imagebase() == 0x400000
count = struct.unpack_from('<H', pe, nt+6)[0]
osize = struct.unpack_from('<H', pe, nt+20)[0]
sections = [struct.unpack_from('<IIII', pe, optional+osize+i*40+8) for i in range(count)]

def disk_bytes(ea, size):
    rva = ea - 0x400000
    for vs, va, rs, rp in sections:
        if va <= rva and rva+size <= va+rs:
            return pe[rp+rva-va:rp+rva-va+size]
    raise AssertionError('Unbacked native range')

specs = [
    ('0x502380', 0x502394, 0x50239A,
     'MOVSX EAX,WORD [ctx+2]; ADD EAX,-102; unsigned CMP/JA against 17. In-range selectors are the signed-word values 102..119. Index stride is exactly 4 bytes.'),
    ('0x50B2A0', 0x50B2B7, 0x50B2BD,
     'Selector is BYTE [arg0+0x0D], masked to 0..255 in EAX; unsigned CMP/JA against 9. Valid table indices are 0..9; stride is exactly 4 bytes.'),
    ('0x50B830', 0x50B84D, 0x50B853,
     'EAX is zeroed before loading AL from BYTE [arg0+0x0D]; unsigned CMP/JA against 7. Valid table indices are 0..7; stride is exactly 4 bytes.'),
]
receipts = []
for target, ja_ea, jump_ea, selector_fact in specs:
    ea = int(target, 16)
    supplement = root / ('inputs/ff8-decomp-semantics-20261011-r01/g17/'+target+'.supplemental-v1')
    mb = (supplement/'manifest.json').read_bytes()
    mf = json.loads(mb)
    for f in mf['files']:
        b = (supplement/f['file']).read_bytes()
        assert len(b) == f['bytes'] and sha(b) == f['sha256']
    provenance = json.loads((supplement/'provenance.json').read_bytes())
    packet_bytes = (root/provenance['original_packet']).read_bytes()
    assert sha(packet_bytes) == mf['original_packet_sha256']
    packet = json.loads(packet_bytes)
    for chunk in packet['chunks']:
        lo, hi = int(chunk['start'],0), int(chunk['end'],0)
        frozen = bytes.fromhex(chunk['hex'])
        assert len(frozen) == hi-lo and frozen == ida_bytes.get_bytes(lo,hi-lo) == disk_bytes(lo,hi-lo)
    table = json.loads((supplement/'table.json').read_bytes())
    lo, size = int(table['base'],0), table['size_bytes']
    raw = bytes.fromhex(table['hex'])
    assert raw == ida_bytes.get_bytes(lo,size) == disk_bytes(lo,size)
    assert sha(raw) == table['sha256'] == mf['table_sha256']
    assert idc.print_insn_mnem(ja_ea).lower() == 'ja'
    jump = ida_bytes.get_bytes(jump_ea,7)
    assert jump[:3] == bytes.fromhex('ff2485') and struct.unpack_from('<I',jump,3)[0] == lo
    entries = list(struct.unpack('<'+'I'*(size//4),raw))
    assert entries == [int(x['destination'],0) for x in table['entries']]
    assert all(ida_bytes.is_code(ida_bytes.get_flags(x)) for x in entries)
    default = idc.get_operand_value(ja_ea,0)
    mapping = ', '.join(str(i)+'->0x%X'%dest for i,dest in enumerate(entries))
    old = idc.get_func_cmt(ea,0) or ''
    if tag in old:
        receipts.append({'ea':target,'status':'SKIP_EXISTING_TAG'})
        continue
    note = ('\n\n'+tag+' run01 closure; CERTAIN local dispatch facts only.\n'
            +selector_fact+' Out-of-range branch goes to 0x%X.\n'%default
            +'Verified native table [0x%X,0x%X), %d little-endian DWORDs: '%(lo,lo+size,len(entries))+mapping+'.\n'
            +'Parent static readback: frozen function bytes == current IDB == authenticated FF8_EN.exe; table IDB == PE. '
            +'Supplement manifest SHA256 '+sha(mb)+'.\n'
            +'No claim of full C/semantic closure, helper behavior or business-name certainty. Function name/type unchanged. '
            +'Evidence: inputs/ff8-decomp-semantics-20261011-r01/g17/'+target+'.supplemental-v1/.')
    record = {'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ea':target,
              'event':'IDB_CERTAIN_LOCAL_FACTS_COMMITTED','kind':'switch_table',
              'idb':idc.get_idb_path(),'pe_sha256':sha(pe),'name':idc.get_func_name(ea),
              'before':old,'before_sha256':sha(old.encode()),'append':note,
              'gates':{'root_and_table_native_pe_equal':True,'unsigned_ja':hex(ja_ea),
                       'indexed_jump_stride':4,'entries_are_code':True,
                       'callees_callers_return':'Not claimed','name_verdict':'Not adjudicated; no rename'},
              'supplement_manifest_sha256':sha(mb)}
    before_file = folder/(target+'-idb-before.json')
    with before_file.open('x',encoding='utf8') as f: json.dump(record,f,indent=2)
    assert idc.set_func_cmt(ea,old+note,0), 'set_func_cmt failed'
    saved = idc.save_database(idc.get_idb_path())
    assert saved is not False and saved != 0, 'IDB save failed'
    after = idc.get_func_cmt(ea,0)
    assert after == old+note, 'Comment readback mismatch'
    record.update({'status':'COMMITTED_SAVED_READBACK_OK','save_result':repr(saved),
                   'after_sha256':sha(after.encode()),'before_receipt':str(before_file)})
    del record['before']
    with (folder/(target+'-idb-commit.json')).open('x',encoding='utf8') as f: json.dump(record,f,indent=2)
    with (root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl').open('a',encoding='utf8') as f:
        f.write(json.dumps(record)+'\n')
    receipts.append({'ea':target,'status':record['status'],'after_sha256':record['after_sha256']})
print(json.dumps(receipts))
