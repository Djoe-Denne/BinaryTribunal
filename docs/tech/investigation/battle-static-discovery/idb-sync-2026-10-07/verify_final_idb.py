"""Independent read-only final verifier, deliberately not importing apply scripts."""
import datetime
import hashlib
import json
from pathlib import Path

import ida_auto
import ida_bytes
import ida_dbg
import ida_funcs
import ida_hexrays
import ida_loader
import ida_name
import ida_nalt
import ida_segment
import ida_typeinf
import idautils
import idc

WORK = Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
ROOT = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')


def read(name):
    return json.loads((WORK/name).read_text(encoding='utf-8'))


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def main():
    base, post = read('baseline.json'), read('final_post_state.json')
    plan, follow = read('plan.json'), read('followup_plan.json')
    r1, r2 = read('receipt.json'), read('followup_receipt.json')
    assert not ida_dbg.is_debugger_on() and ida_auto.get_auto_state()==0
    assert ida_loader.get_path(ida_loader.PATH_TYPE_IDB)==base['idb']
    assert ida_nalt.retrieve_input_file_md5().hex()==base['input_md5']
    file_checks = [
        ('baseline.json',plan['baseline_sha256']), ('supplement.json',plan['supplement_sha256']),
        ('plan.json',r1['plan_sha256']), ('post_state.json',r1['post_state_sha256']),
        ('mutation_journal.jsonl',r1['journal_sha256']), ('receipt.json',r2['first_receipt_sha256']),
        ('followup_plan.json',r2['followup_plan_sha256']),
        ('followup_journal.jsonl',r2['journal_sha256']),
        ('final_post_state.json',r2['final_post_state_sha256']),
    ]
    for file,digest in file_checks:
        assert sha(WORK/file)==digest,file
    assert sha(base['backup'])==base['backup_sha256']
    assert sha(base['idb'])==r2['final_idb_sha256']
    sources=dict(plan['source_hashes'],**follow['source_hashes'])
    for path,digest in sources.items():
        assert sha(ROOT/path)==digest,path

    # Smoke the actual decompiler after the type application, keeping complete
    # output in files and exposing only signatures in the receipt.
    smoke=[]
    for ea in [0x416D82,0x417464,0x4178D7,0x41EF3C]:
        func=ida_hexrays.decompile(ea)
        assert func is not None,hex(ea)
        text=str(func)
        path=WORK/('post_decompile_%08X.c'%ea)
        with path.open('x',encoding='utf-8') as stream:
            stream.write(text)
        smoke.append(dict(ea=hex(ea),name=ida_name.get_name(ea),signature=idc.get_type(ea),
                          pseudocode_sha256=sha(path),pseudocode_bytes=path.stat().st_size))
    assert ida_auto.auto_wait()
    assert dict(idautils.Names())==dict(post['names'])
    assert ida_funcs.get_func_qty()==base['function_count']
    functions=[]
    for address,expected in post['functions'].items():
        ea=int(address,16)
        f=ida_funcs.get_func(ea)
        assert f and f.start_ea==ea
        chunks=list(idautils.Chunks(ea))
        code=hashlib.sha256(b''.join(ida_bytes.get_bytes(a,b-a) for a,b in chunks)).hexdigest()
        actual=dict(ea=address,name=ida_name.get_name(ea),type=idc.get_type(ea),end=hex(f.end_ea),
                    chunks=[list(c) for c in chunks],code_sha256=code,
                    comment=ida_funcs.get_func_cmt(f,False) or '',
                    repeatable=ida_funcs.get_func_cmt(f,True) or '')
        assert actual==expected,('function postimage',address)
        if address in base['functions']:
            assert actual['repeatable']==base['functions'][address]['repeatable']
            assert actual['comment'].startswith(base['functions'][address]['comment'])
        functions.append(address)
    for address,expected in post['data'].items():
        ea=int(address,16)
        assert ida_name.get_name(ea)==expected['name']
        assert idc.get_type(ea)==expected['type']
        assert (ida_bytes.get_cmt(ea,False) or '')==expected['comment']
        assert (ida_bytes.get_cmt(ea,True) or '')==expected['repeatable']
    type_names=[]
    for ordinal in range(1,ida_typeinf.get_ordinal_limit(None)):
        name=ida_typeinf.get_numbered_type_name(None,ordinal)
        if name:type_names.append(name)
    assert set(type_names)==set(post['types'])
    for name,expected in post['types'].items():
        t=ida_typeinf.tinfo_t()
        assert t.get_named_type(None,name)
        assert t.get_size()==expected['size']
        serialized=[x.hex() if isinstance(x,bytes) else x for x in t.serialize()]
        assert serialized==expected['serialized']
        u=ida_typeinf.udt_type_data_t()
        if t.get_udt_details(u):
            fields=[dict(name=m.name,offset=m.offset,size=m.size,type=str(m.type),comment=m.cmt) for m in u]
            assert fields==expected['members'],name
    segments=[]
    for start in idautils.Segments():
        segment=ida_segment.getseg(start)
        digest=hashlib.sha256()
        for pos in range(start,segment.end_ea,65536):
            parts=ida_bytes.get_bytes_and_mask(pos,min(65536,segment.end_ea-pos))
            assert parts is not None
            for part in parts:
                if isinstance(part,str):part=part.encode('latin1')
                digest.update(len(part).to_bytes(4,'little'));digest.update(part)
        segments.append(dict(start=hex(start),end=hex(segment.end_ea),name=ida_segment.get_segm_name(segment),
                             bytes_mask_sha256=digest.hexdigest()))
    assert segments==base['segment_hashes']
    for ea in [0x41EF5D,0x41EF72]:
        assert ida_bytes.get_bytes(ea,6)==bytes.fromhex('FF9098000000')
    assert ida_bytes.get_bytes(0x41EF78,2)==bytes.fromhex('5DC3')
    assert sha(base['idb'])==r2['final_idb_sha256']
    result=dict(status='PASS',utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        idb=base['idb'],idb_sha256=r2['final_idb_sha256'],backup=base['backup'],backup_sha256=base['backup_sha256'],
        input_file=ida_nalt.get_input_file_path(),input_file_sha256=sha(ida_nalt.get_input_file_path()),
        counts=r2['aggregate_counts'],checked_functions=len(functions),checked_local_types=len(type_names),
        checked_source_documents=len(sources),checked_receipt_hashes=len(file_checks),
        original_segments_unchanged=segments,native_stage0_calls_unchanged=True,
        decompiler_smoke=smoke,all_names_match=True,comments_append_only=True,
        repeatable_comments_preserved=True,debugger_active=False,verified_without_save_or_mutation=True)
    with (WORK/'independent_validation.json').open('x',encoding='utf-8') as stream:
        json.dump(result,stream,ensure_ascii=False,indent=2)
    print(json.dumps({k:result[k] for k in ['status','checked_functions','checked_local_types','checked_source_documents',
                                          'checked_receipt_hashes','idb_sha256','decompiler_smoke']}))


if __name__=='__main__':
    main()
