"""Materialize two already-annotated native identities and six proven UV globals."""
import datetime
import importlib.util
import json
from pathlib import Path

import ida_auto
import ida_bytes
import ida_funcs
import ida_idaapi
import ida_loader
import ida_name
import ida_typeinf
import idautils
import idc

WORK = Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
spec = importlib.util.spec_from_file_location('first_pass', WORK/'apply_sync.py')
first = importlib.util.module_from_spec(spec)
spec.loader.exec_module(first)
TAG = '[idb-sync 2026-10-07]'


def data_state(ea):
    return dict(ea=hex(ea), name=ida_name.get_name(ea), type=idc.get_type(ea),
                comment=ida_bytes.get_cmt(ea, False) or '', repeatable=ida_bytes.get_cmt(ea, True) or '',
                bytes14=ida_bytes.get_bytes(ea-4,14).hex())


def main():
    assert not (WORK/'followup_plan.json').exists()
    first.validate()
    first_receipt = json.loads((WORK/'receipt.json').read_text(encoding='utf-8'))
    assert first.capture.digest_file(first.PLAN['idb']) == first_receipt['idb_sha256']
    source_root = 'docs/tech/investigation/battle-static-discovery/decomp/'
    window_doc = source_root+'0x45BC60__Gpu_SetTextureWindow_PageRectScales.md'
    clut_doc = source_root+'0x509E00__BattleActor_StageUploadCLUTBand.md'
    function_specs = [
        (0x45BC60, 'Gpu_SetTextureWindow_PageRectScales', window_doc,
         'Materialized the identity already recorded by lot17/lot21. Native 55-instruction body '
         'reads packet+4, latches low 24 bits at 0x1CA8848, decodes x/y and width/height into '
         '0x1CA8870/74/76, substitutes 256 for zero extents, then clamps to the 256-page boundary. '
         'No call instruction. EAX is residual: the old source return 0 is not an ABI guarantee. '
         'No capture-specific W_window claim is promoted; existing lot21 zero-window observation remains scoped.'),
        (0x509E00, 'BattleActor_StageUploadCLUTBand', clut_doc,
         'Materialized the already-annotated actor CLUT-band role. Native 160-instruction function '
         'through RET at 0x509FF7 (not the abbreviated historical header extent) uses actor index from '
         'stride 156, source band byte_1D98B60 + index*1024, and y=0xE0+2*index. Enqueues type-0 '
         'uploads through 0x505DF0 at 0x509EBA/0x509FA2/0x509FEB; the 0x400 path calls sine at '
         '0x509F44. The source document footer-id=2g conclusion is superseded by the existing '
         'lot17 annotation: capture footer IDs are local cache slots, not a universal actor-to-row mapping.'),
    ]
    functions = []
    for ea, name, src, fact in function_specs:
        before = first.stripped_function(first.capture.function_state(ea))
        assert name in before['comment']+before['repeatable']
        assert TAG not in before['comment']
        functions.append(dict(ea=hex(ea), name=name, before=before, source=src,
                              comment=before['comment']+('\n\n' if before['comment'] else '')+TAG+' '+fact+'\nSource: '+src))
    specs = [
        (0x1CA8848, 'g_gpuTextureWindowWord', 'unsigned int',
         'Low 24-bit texture-window latch written at 0x45BC74. Zero/nonzero selects LUT/window-scale UV paths; no general width inferred from captures.'),
        (0x1CA8870, 'g_gpuTextureWindowOriginXY', 'unsigned int',
         'Packed texture-page window origin: low u16 x, high u16 y, written at 0x45BCB1/0x45BC9B. Origin is a staging/selection input, not an added normalized UV offset.'),
        (0x1CA8874, 'g_gpuTextureWindowWidth', 'unsigned short',
         'Texture-window width in texels, decoded at 0x45BCC2; zero becomes 256, then clamped against x. Used to derive slot reciprocal U scale.'),
        (0x1CA8876, 'g_gpuTextureWindowHeight', 'unsigned short',
         'Texture-window height in texels, decoded at 0x45BCBB; zero becomes 256, then clamped against y. Used to derive slot reciprocal V scale.'),
        (0x1CB603C, 'g_gpuTextureUScale', 'float',
         'Float U scale copied from selected slot+0x18 at 0x465FC5; reciprocal width used by x87 multiply in the texture-window path.'),
        (0x1CB6038, 'g_gpuTextureVScale', 'float',
         'Float V scale copied from selected slot+0x1C at 0x465FCB; reciprocal height used by x87 multiply, e.g. 0x4618A0.'),
    ]
    data = []
    for ea,name,ctype,fact in specs:
        before = data_state(ea)
        data.append(dict(ea=hex(ea),name=name,before=before,declaration=ctype+' '+name+';',
                         comment=before['comment']+('\n\n' if before['comment'] else '')+TAG+' '+fact+'\nSource: '+window_doc))
    for row in functions+data:
        assert ida_name.get_name_ea(ida_idaapi.BADADDR,row['name']) == ida_idaapi.BADADDR
        if 'declaration' in row:
            first.parse_decl(row['declaration'])
    expected_names = first.names_dict()
    for row in functions+data:
        expected_names[int(row['ea'],16)] = row['name']
    plan = dict(functions=functions,data=data,previous_receipt_sha256=first.capture.digest_file(WORK/'receipt.json'),
                source_hashes={p:first.capture.digest_file(first.capture.ROOT/p) for p in [window_doc,clut_doc]},
                identity=first_receipt['idb_sha256'], tag=TAG)
    first.capture.dump_json(WORK/'followup_plan.json',plan)
    auto = ida_auto.is_auto_enabled()
    try:
        ida_auto.enable_auto(False)
        for row in functions+data:
            ea=int(row['ea'],16)
            assert ida_name.set_name(ea,row['name'],ida_name.SN_CHECK)
            if 'declaration' in row:
                assert ida_typeinf.apply_tinfo(ea,first.parse_decl(row['declaration']),ida_typeinf.TINFO_DEFINITE)
            if row in functions:
                assert ida_funcs.set_func_cmt(ida_funcs.get_func(ea),row['comment'],False)
            else:
                assert ida_bytes.set_cmt(ea,row['comment'],False)
            with (WORK/'followup_journal.jsonl').open('a',encoding='utf-8') as stream:
                stream.write(json.dumps(dict(event='followup_applied',ea=row['ea'],name=row['name'],
                                             utc=datetime.datetime.now(datetime.timezone.utc).isoformat()))+'\n')
    finally:
        ida_auto.enable_auto(auto)
    assert ida_auto.auto_wait()
    assert first.names_dict() == expected_names
    post = json.loads((WORK/'post_state.json').read_text(encoding='utf-8'))
    for row in functions:
        expected=dict(row['before'],name=row['name'],comment=row['comment'])
        actual=first.stripped_function(first.capture.function_state(int(row['ea'],16)))
        assert actual==expected
        post['functions'][row['ea']]=actual
    for key,old in post['functions'].items():
        assert first.stripped_function(first.capture.function_state(int(key,16)))==old
    for row in data:
        ea=int(row['ea'],16)
        after=data_state(ea)
        assert after['name']==row['name'] and after['comment']==row['comment']
        assert after['repeatable']==row['before']['repeatable'] and after['bytes14']==row['before']['bytes14']
        assert after['type']==str(first.parse_decl(row['declaration']))
        post['data'][row['ea']]=after
    assert first.current_types()==post['types']
    assert first.capture.segment_hashes()==post['segment_hashes']
    post['names']=list(idautils.Names())
    first.capture.dump_json(WORK/'final_post_state.json',post)
    assert ida_loader.save_database(None,0)
    receipt=dict(status='APPLIED_VERIFIED_SAVED',utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                 first_receipt_sha256=first.capture.digest_file(WORK/'receipt.json'),
                 followup_plan_sha256=first.capture.digest_file(WORK/'followup_plan.json'),
                 journal_sha256=first.capture.digest_file(WORK/'followup_journal.jsonl'),
                 final_post_state_sha256=first.capture.digest_file(WORK/'final_post_state.json'),
                 final_idb_sha256=first.capture.digest_file(first.PLAN['idb']),
                 added_function_renames=2,added_data_renames=6,added_data_types=6,
                 aggregate_counts=dict(first_receipt['counts'],function_renames=41,data_renames=8,
                                       global_types=8,function_comment_blocks=56,data_site_comment_blocks=12),
                 source_hashes=plan['source_hashes'],code_data_bytes_unchanged=True,
                 repeatable_comments_preserved=True)
    first.capture.dump_json(WORK/'followup_receipt.json',receipt)
    print(json.dumps({k:receipt[k] for k in ['status','aggregate_counts','final_idb_sha256']}))


if __name__=='__main__':
    main()
