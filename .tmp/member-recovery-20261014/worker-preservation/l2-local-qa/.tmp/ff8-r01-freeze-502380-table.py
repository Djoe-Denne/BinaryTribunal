"""Supervisor-only static IDB/PE capture. No IDB/debugger mutation."""
import datetime
import hashlib
import json
import struct
from pathlib import Path
import ida_bytes
import ida_nalt
import idautils
import idc

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
packet_rel = 'inputs/ff8-decomp-semantics-20261011-r01/g17/0x502380.json'
packet_data = (root / packet_rel).read_bytes()
packet = json.loads(packet_data)
expected_packet_sha = '1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09'
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(packet_data) == expected_packet_sha, 'Frozen packet changed'
pe_path = Path(ida_nalt.get_input_file_path())
pe = pe_path.read_bytes()
pe_sha = sha(pe)
assert pe_sha == packet['native']['input_sha256'], 'Native PE hash differs from frozen provenance'
assert pe[:2] == b'MZ'
nt = struct.unpack_from('<I', pe, 0x3c)[0]
assert pe[nt:nt + 4] == b'PE\0\0'
section_count = struct.unpack_from('<H', pe, nt + 6)[0]
optional_size = struct.unpack_from('<H', pe, nt + 20)[0]
optional = nt + 24
assert struct.unpack_from('<H', pe, optional)[0] == 0x10b
imagebase = struct.unpack_from('<I', pe, optional + 28)[0]
assert imagebase == ida_nalt.get_imagebase() == 0x400000
sections = []
for i in range(section_count):
    at = optional + optional_size + i * 40
    vs, va, rawsize, rawptr = struct.unpack_from('<IIII', pe, at + 8)
    sections.append((va, rawsize, rawptr))

def pe_slice(ea, size):
    rva = ea - imagebase
    for va, rawsize, rawptr in sections:
        if va <= rva and rva + size <= va + rawsize:
            offset = rawptr + rva - va
            data = pe[offset:offset + size]
            assert len(data) == size
            return data, offset
    raise AssertionError('Range not backed by PE raw section')

def addr(s):
    return int(s, 0) if isinstance(s, str) else s

root_checks = []
for chunk in packet['chunks']:
    lo, hi = addr(chunk['start']), addr(chunk['end'])
    frozen = bytes.fromhex(chunk['hex'])
    native = ida_bytes.get_bytes(lo, hi - lo)
    disk, offset = pe_slice(lo, hi - lo)
    assert len(frozen) == hi - lo and frozen == native == disk, 'Root frozen/IDB/PE byte mismatch'
    root_checks.append({'start':hex(lo),'end_exclusive':hex(hi),'bytes':len(frozen),
                        'sha256':sha(frozen),'pe_file_offset':hex(offset),'frozen_idb_pe_equal':True})

lo, size = 0x502628, 72
table = ida_bytes.get_bytes(lo, size)
disk, table_offset = pe_slice(lo, size)
assert table == disk and len(table) == size, 'Table IDB/PE mismatch'
entries = struct.unpack('<18I', table)
assert all(0x502380 <= ea < 0x502628 for ea in entries), 'Unexpected out-of-root table destination'
dispatch = ida_bytes.get_bytes(0x502380, 0x21)
assert dispatch == pe_slice(0x502380, len(dispatch))[0]
asm = []
for ea in idautils.Heads(0x502380, 0x5023a1):
    if not ida_bytes.is_code(ida_bytes.get_flags(ea)):
        continue
    n = idc.get_item_size(ea)
    asm.append('%08X  %-24s %s' % (ea, ida_bytes.get_bytes(ea,n).hex(' '),
                                   (idc.generate_disasm_line(ea,0) or '').split(';',1)[0].rstrip()))

dest = root / 'inputs/ff8-decomp-semantics-20261011-r01/g17/0x502380.supplemental-v1'
assert not dest.exists(), 'Supplement already exists; never overwrite a freeze'
dest.mkdir(parents=True)
table_doc = {'target':'0x502380','base':hex(lo),'end_exclusive':hex(lo+size),'size_bytes':size,
             'encoding':'18 little-endian DWORDs; positional indices only, no semantic arm labels',
             'sha256':sha(table),'hex':table.hex(),
             'entries':[{'index':i,'slot_ea':hex(lo+4*i),'destination':hex(ea)} for i,ea in enumerate(entries)]}
provenance = {'captured_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'capture_kind':'static IDB reads plus on-disk authenticated PE; no process execution',
              'idb':idc.get_idb_path(),'pe_path':str(pe_path),'pe_sha256':pe_sha,'imagebase':hex(imagebase),
              'original_packet':packet_rel,'original_packet_sha256':expected_packet_sha,
              'root_checks':root_checks,'table_pe_file_offset':hex(table_offset),
              'table_idb_pe_equal':True,'table_sha256':sha(table),
              'dispatch_window':{'start':'0x502380','end_exclusive':'0x5023a1','hex':dispatch.hex(),'sha256':sha(dispatch),'idb_pe_equal':True},
              'limitations':'Dispatch index normalization and all C/semantic conclusions remain for independent authors. Existing labels/comments are not proof. No IDB write or RE promotion.'}
contents = {'table.json':json.dumps(table_doc,indent=2)+'\n',
            'provenance.json':json.dumps(provenance,indent=2)+'\n',
            'dispatch.txt':'\n'.join(asm)+'\n'}
files=[]
for name, text in contents.items():
    data=text.encode('utf8')
    with (dest/name).open('xb') as f: f.write(data)
    files.append({'file':name,'bytes':len(data),'sha256':sha(data)})
manifest={'version':1,'target':'0x502380','role':'Common blind factual supplement for C A/B and semantic A/B',
          'original_packet_sha256':expected_packet_sha,'existing_freezes_unchanged':True,
          'table_range':['0x502628','0x502670'],'table_sha256':sha(table),'files':files}
data=(json.dumps(manifest,indent=2)+'\n').encode('utf8')
with (dest/'manifest.json').open('xb') as f: f.write(data)
print(json.dumps({'status':'PASS','directory':str(dest),'manifest_sha256':sha(data),'pe_sha256':pe_sha,
                  'table_sha256':sha(table),'entries':list(map(hex,entries)),'dispatch_asm':asm,
                  'root_matches_frozen_and_pe':True,'table_idb_pe_equal':True}))
