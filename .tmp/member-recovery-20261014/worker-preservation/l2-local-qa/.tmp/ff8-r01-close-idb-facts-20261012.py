"""Supervisor-only, serialized set_func_cmt/save/readback for individually reviewed facts."""
from pathlib import Path
import datetime
import hashlib
import json
import struct
import ida_bytes
import ida_nalt
import idautils
import idc

root=Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
folder=root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/closure-20261012'
claims=json.loads((folder/'idb-certain-facts.json').read_bytes())['facts']
sha=lambda b:hashlib.sha256(b).hexdigest()
tag='[semantic-triple 2026-10-12]'
pe=Path(ida_nalt.get_input_file_path()).read_bytes()
assert sha(pe)=='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
nt=struct.unpack_from('<I',pe,0x3c)[0]; opt=nt+24
assert ida_nalt.get_imagebase()==struct.unpack_from('<I',pe,opt+28)[0]==0x400000
n=struct.unpack_from('<H',pe,nt+6)[0]; osize=struct.unpack_from('<H',pe,nt+20)[0]
sections=[struct.unpack_from('<IIII',pe,opt+osize+i*40+8) for i in range(n)]

def disk(ea,n):
    for vs,va,rs,rp in sections:
        if va<=ea-0x400000 and ea-0x400000+n<=va+rs:
            at=rp+ea-0x400000-va
            return pe[at:at+n]
    raise AssertionError('Unbacked PE bytes')

receipts=[]
for fact in claims:
    if 'ONLY_EAS' in globals() and fact['ea'] not in ONLY_EAS: continue
    target=fact['ea']; ea=int(target,16)
    proof_path=folder/'native-final'/(target+'.json')
    proof_bytes=proof_path.read_bytes(); proof=json.loads(proof_bytes)
    assert proof['native_frozen_pe_equal']
    # Native readback is repeated immediately before each write, including all chunks.
    for row in proof['asm']:
        at=int(row['ea'],16); b=bytes.fromhex(row['hex'])
        assert b==ida_bytes.get_bytes(at,len(b))==disk(at,len(b)), 'Native code changed'
    by_ea={x['ea']:x for x in proof['asm']}
    assert len(fact['anchors'])>=2 and all(x in by_ea for x in fact['anchors'])
    live_calls=set()
    for at in idautils.FuncItems(ea):
        if idc.print_insn_mnem(at).lower()=='call':
            live_calls.update(idautils.CodeRefsFrom(at,0))
    assert all(int(x,16) in live_calls for x in fact['direct_callees']), 'Cited callee missing'
    live_xrefs={(hex(x.frm),bool(x.iscode)) for x in idautils.XrefsTo(ea,0)}
    assert all((x['from'],x['code']) in live_xrefs for x in fact.get('caller_xrefs',[])), 'Cited caller/xref kind mismatch'
    for table in fact.get('native_tables',[]):
        base=int(table['base'],16); size=table['size']; raw=ida_bytes.get_bytes(base,size)
        assert raw==disk(base,size) and sha(raw)==table['sha256'], 'Native table mismatch'
        if 'entry_base' in table:
            entries=struct.unpack('<'+'I'*table['count'],raw)
            assert list(entries)==[int(table['entry_base'],16)+table['entry_stride']*i for i in range(table['count'])]
            if table.get('verify_forwarding_stubs'):
                for dest in entries:
                    stub=ida_bytes.get_bytes(dest,14)
                    assert stub[0]==0x8B and stub[1] in [0x44,0x4C,0x54] and stub[2:4]==bytes.fromhex('2404')
                    assert stub[4]==0x50+((stub[1]>>3)&7) and stub[5]==0xE8 and stub[10:14]==bytes.fromhex('83c404c3')
                    callee=(dest+10+struct.unpack_from('<i',stub,6)[0])&0xffffffff
                    assert callee in idautils.CodeRefsFrom(dest+5,0), 'Forwarding call target mismatch'
    old=idc.get_func_cmt(ea,0) or ''
    if tag in old:
        receipts.append({'ea':target,'status':'SKIP_EXISTING_TAG'}); continue
    note='\n\n'+tag+' run01 closure; supervisor-verified CERTAIN local mechanics.\n'+fact['text']+'\n'
    note+='Live ASM anchors: '+', '.join(fact['anchors'])+'. Native function chunks match the frozen packet and authenticated PE.\n'
    note+='Limits above are retained; this is not full C acceptance or a promotion of uncertain business names. No rename/type change. Evidence: docs/missions/ff8-decomp-semantics-2026-10-11-run01/closure-20261012/native-final/'+target+'.json.'
    record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':'IDB_CERTAIN_LOCAL_FACTS_COMMITTED','kind':'reviewed_mechanics','ea':target,
            'idb':idc.get_idb_path(),'name':idc.get_func_name(ea),'pe_sha256':sha(pe),'proof_sha256':sha(proof_bytes),
            'before':old,'before_sha256':sha(old.encode()),'append':note,'anchors':[by_ea[x] for x in fact['anchors']],
            'checks':{'native_bytes':True,'cited_callees':True,'cited_xref_kinds':True,
                      'signedness_stride_return_and_role':'Reviewed by parent against live capture; bounded to appended statements',
                      'source_name_or_full_C_promotion':False}}
    before=folder/(target+'-idb-before.json')
    with before.open('x',encoding='utf8') as f:json.dump(record,f,indent=2)
    assert idc.set_func_cmt(ea,old+note,0), 'Comment write failed'
    saved=idc.save_database(idc.get_idb_path())
    assert saved is not False and saved!=0, 'Save failed'
    after=idc.get_func_cmt(ea,0)
    assert after==old+note,'Readback failed'
    del record['before']
    record.update({'status':'COMMITTED_SAVED_READBACK_OK','save_result':repr(saved),'after_sha256':sha(after.encode()),'before_receipt':str(before)})
    with (folder/(target+'-idb-commit.json')).open('x',encoding='utf8') as f:json.dump(record,f,indent=2)
    with (root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl').open('a',encoding='utf8') as f:f.write(json.dumps(record)+'\n')
    receipts.append({'ea':target,'status':record['status'],'after_sha256':record['after_sha256']})
print(json.dumps(receipts))
