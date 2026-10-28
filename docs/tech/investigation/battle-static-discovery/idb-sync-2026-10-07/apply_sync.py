"""Guarded IDA knowledge mutation; no patch/debugger/process operations."""
import datetime
import importlib.util
import json
from pathlib import Path
import traceback

import ida_auto
import ida_bytes
import ida_dbg
import ida_funcs
import ida_idaapi
import ida_loader
import ida_name
import ida_nalt
import ida_typeinf
import idautils
import idc

WORK = Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
spec = importlib.util.spec_from_file_location('capture_sync', WORK / 'capture_idb.py')
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)
PLAN = json.loads((WORK / 'plan.json').read_text(encoding='utf-8'))
BASE = json.loads((WORK / 'baseline.json').read_text(encoding='utf-8'))
SUPPLEMENT = json.loads((WORK / 'supplement.json').read_text(encoding='utf-8'))
BEFORE = dict(BASE['functions'], **SUPPLEMENT['functions'])


def event(kind, **detail):
    row = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), event=kind, **detail)
    with (WORK / 'mutation_journal.jsonl').open('a', encoding='utf-8') as stream:
        stream.write(json.dumps(row, ensure_ascii=False) + '\n')


def parse_decl(decl):
    tif = ida_typeinf.tinfo_t()
    assert ida_typeinf.parse_decl(tif, None, decl, ida_typeinf.PT_SIL), decl
    return tif


def value_type(text):
    if '[' in text:
        head, tail = text.split('[', 1)
        decl = head + ' value[' + tail + ';'
    else:
        decl = text + ' value;'
    return parse_decl(decl)


def drawlist_type(refine_pointers):
    old = ida_typeinf.tinfo_t()
    assert old.get_named_type(None, 'GfxDrawList236')
    udt = ida_typeinf.udt_type_data_t()
    assert old.get_udt_details(udt)
    replacement_names = {'reserved_04', 'reserved_1C', 'reserved_38', 'reserved_5C'}
    members = [ida_typeinf.udm_t(m) for m in udt if m.name not in replacement_names]
    for offset, name, text, comment in PLAN['types']['drawlist_fields']:
        member = ida_typeinf.udm_t(name, value_type(text), offset * 8)
        member.cmt = comment
        members.append(member)
    for m in members:
        if refine_pointers and m.name in {'current_node', 'head', 'tail'}:
            m.type = value_type('GfxBatch30 *')
            assert m.size == 32
    members.sort(key=lambda m: m.offset)
    cursor = 0
    for m in members:
        assert m.offset == cursor, (m.name, m.offset, cursor)
        cursor += m.size
    assert cursor == 236 * 8
    udt.clear()
    for m in members:
        udt.push_back(m)
    result = ida_typeinf.tinfo_t()
    assert result.create_udt(udt, ida_typeinf.BTF_STRUCT)
    assert result.get_size() == 236
    return result


def stripped_function(value):
    return json.loads(json.dumps({key: val for key, val in value.items() if key != 'asm'}))


def names_dict():
    return {ea: name for ea, name in idautils.Names()}


def current_types():
    names = [ida_typeinf.get_numbered_type_name(None, n)
             for n in range(1, ida_typeinf.get_ordinal_limit(None))]
    return {name: capture.type_state(name) for name in names if name}


def preflight():
    assert not (WORK / 'receipt.json').exists(), 'Already completed; use verifier, not reapply.'
    if (WORK / 'mutation_journal.jsonl').exists():
        prior = [json.loads(line) for line in (WORK / 'mutation_journal.jsonl').read_text(encoding='utf-8').splitlines()]
        assert all(row['event'] in {'preflight_pass', 'failed'} for row in prior), 'Prior mutation: inspect/reconcile first.'
    assert not ida_dbg.is_debugger_on()
    assert ida_auto.get_auto_state() == 0
    assert ida_loader.get_path(ida_loader.PATH_TYPE_IDB) == PLAN['idb']
    assert ida_nalt.retrieve_input_file_md5().hex() == PLAN['input_md5']
    assert capture.digest_file(WORK / 'baseline.json') == PLAN['baseline_sha256']
    assert capture.digest_file(WORK / 'supplement.json') == PLAN['supplement_sha256']
    assert capture.digest_file(PLAN['backup']) == PLAN['backup_sha256']
    for path, digest in PLAN['source_hashes'].items():
        assert capture.digest_file(capture.ROOT / path) == digest, path
    for key, old in BEFORE.items():
        assert stripped_function(capture.function_state(int(key, 16))) == stripped_function(old), ('function drift', key)
    assert names_dict() == dict(BASE['names']), 'Name drift outside plan'
    assert current_types() == BASE['types'], 'Type drift before applying'
    assert capture.segment_hashes() == BASE['segment_hashes'], 'Byte drift'
    planned_names = set()
    for row in PLAN['functions'] + PLAN['data']:
        if 'name' in row:
            assert row['name'] not in planned_names
            planned_names.add(row['name'])
            target = ida_name.get_name_ea(ida_idaapi.BADADDR, row['name'])
            assert target in (ida_idaapi.BADADDR, int(row['ea'], 16)), (row['name'], hex(target))
        if 'declaration' in row:
            parse_decl(row['declaration'])
    for row in PLAN['data']:
        ea, old = int(row['ea'], 16), row['before']
        assert ida_name.get_name(ea) == old['name']
        assert idc.get_type(ea) == old['type']
        assert (ida_bytes.get_cmt(ea, False) or '') == old['comment']
        assert (ida_bytes.get_cmt(ea, True) or '') == old['repeatable']
        assert ida_bytes.get_bytes(ea - 4, 14).hex() == old['bytes14']
    assert capture.type_state('GfxBatch30') is None
    drawlist_type(False)  # Detached type: check all offsets before the first mutation.


def install_types():
    ordinal = ida_typeinf.get_type_ordinal(None, 'GfxDrawList236')
    decl = 'typedef struct GfxBatch30 {\n' + '\n'.join(
        (('struct GfxBatch30 *' if text == 'GfxBatch30 *' else text) + ' ' + name + ';')
        for _, name, text in PLAN['types']['batch_fields']) + '\n} GfxBatch30;'
    errors = ida_typeinf.idc_parse_types(decl, ida_typeinf.PT_SIL)
    event('create_type', name='GfxBatch30', errors=errors)
    assert errors == 0
    batch = capture.type_state('GfxBatch30')
    assert batch['size'] == 48
    assert [(m['offset']//8, m['name']) for m in batch['members']] == [
        (off, name) for off, name, _ in PLAN['types']['batch_fields']]
    candidate = drawlist_type(True)
    status = candidate.set_named_type(None, 'GfxDrawList236', ida_typeinf.NTF_REPLACE)
    event('refine_type', name='GfxDrawList236', status=status)
    assert status == ida_typeinf.TERR_OK
    assert ida_typeinf.get_type_ordinal(None, 'GfxDrawList236') == ordinal
    assert capture.type_state('GfxDrawList236')['size'] == 236


def apply_rows():
    for row in PLAN['functions'] + PLAN['data']:
        ea = int(row['ea'], 16)
        if 'name' in row:
            ok = ida_name.set_name(ea, row['name'], ida_name.SN_CHECK)
            event('rename', ea=row['ea'], old=row['before']['name'], new=row['name'], success=ok)
            assert ok and ida_name.get_name(ea) == row['name']
        if 'declaration' in row:
            tif = parse_decl(row['declaration'])
            ok = ida_typeinf.apply_tinfo(ea, tif, ida_typeinf.TINFO_DEFINITE)
            event('apply_type', ea=row['ea'], declaration=row['declaration'], success=ok)
            assert ok
        if row in PLAN['functions']:
            ok = ida_funcs.set_func_cmt(ida_funcs.get_func(ea), row['comment'], False)
        else:
            ok = ida_bytes.set_cmt(ea, row['comment'], False)
        event('append_comment', ea=row['ea'], success=ok)
        assert ok


def validate():
    assert not ida_dbg.is_debugger_on()
    assert ida_loader.get_path(ida_loader.PATH_TYPE_IDB) == PLAN['idb']
    planned_functions = {r['ea']: r for r in PLAN['functions']}
    expected_names = dict(BASE['names'])
    for row in PLAN['functions'] + PLAN['data']:
        if 'name' in row:
            expected_names[int(row['ea'], 16)] = row['name']
    assert names_dict() == expected_names, 'Unplanned name mutation'
    post_functions = {}
    for key, old in BEFORE.items():
        ea = int(key, 16)
        state = stripped_function(capture.function_state(ea))
        post_functions[key] = state
        plan = planned_functions.get(key)
        expected = stripped_function(old)
        if plan:
            expected = dict(expected, comment=plan['comment'])
            if 'name' in plan:
                expected['name'] = plan['name']
            if 'declaration' in plan:
                actual_tif = ida_typeinf.tinfo_t()
                assert ida_nalt.get_tinfo(actual_tif, ea)
                assert actual_tif.equals_to(parse_decl(plan['declaration'])), key
                expected['type'] = state['type']
            assert state['comment'].startswith(old['comment'])
            assert state['comment'].count(PLAN['tag']) == 1
        assert state == expected, ('unplanned function change', key,
                                   {k: (expected[k], state[k]) for k in state if expected[k]!=state[k]})
    post_data = {}
    for row in PLAN['data']:
        ea, old = int(row['ea'], 16), row['before']
        assert (ida_bytes.get_cmt(ea, False) or '') == row['comment']
        assert (ida_bytes.get_cmt(ea, True) or '') == old['repeatable']
        assert ida_bytes.get_bytes(ea - 4, 14).hex() == old['bytes14']
        if 'declaration' in row:
            actual = ida_typeinf.tinfo_t()
            assert ida_nalt.get_tinfo(actual, ea)
            assert actual.equals_to(parse_decl(row['declaration']))
        else:
            assert idc.get_type(ea) == old['type']
        post_data[row['ea']] = dict(name=ida_name.get_name(ea), type=idc.get_type(ea),
                                    comment=ida_bytes.get_cmt(ea, False) or '', repeatable=old['repeatable'])
    types = current_types()
    assert set(types) == set(BASE['types']) | {'GfxBatch30'}, 'Unexpected new/deleted types'
    for name in PLAN['types']['preserve_types']:
        assert types[name] == BASE['types'][name], ('unplanned type change', name)
    assert types['GfxBatch30']['size'] == 48
    draw = types['GfxDrawList236']
    assert draw['size'] == 236
    members = {m['name']: m for m in draw['members']}
    for m in BASE['types']['GfxDrawList236']['members']:
        if m['name'] in {'reserved_04', 'reserved_1C', 'reserved_38', 'reserved_5C'}:
            continue
        expected = dict(m)
        if m['name'] in {'current_node', 'head', 'tail'}:
            expected['type'] = 'GfxBatch30 *'
        assert members[m['name']] == expected, ('member preservation', m['name'])
    for off, name, text, comment in PLAN['types']['drawlist_fields']:
        m = members[name]
        assert m['offset'] == off*8 and m['size'] == value_type(text).get_size()*8
        assert m['type'] == str(value_type(text)) and m['comment'] == comment
    segments = capture.segment_hashes()
    assert segments == BASE['segment_hashes'], 'Executable/data bytes changed'
    assert ida_funcs.get_func_qty() == BASE['function_count']
    return dict(functions=post_functions, data=post_data, types=types, segment_hashes=segments,
                function_count=ida_funcs.get_func_qty(), names=list(idautils.Names()))


def main():
    preflight()
    event('preflight_pass', plan_sha256=capture.digest_file(WORK/'plan.json'))
    auto_was_enabled = ida_auto.is_auto_enabled()
    try:
        ida_auto.enable_auto(False)
        install_types()
        apply_rows()
    except Exception:
        event('failed', traceback=traceback.format_exc())
        raise
    finally:
        ida_auto.enable_auto(auto_was_enabled)
    assert ida_auto.auto_wait()
    finish()


def finish():
    assert not (WORK/'receipt.json').exists()
    # IDA's argument-name propagation created four unrelated bare names after
    # the typed prototypes were applied. Revert only this observed spill;
    # the preimage had no explicit names at these addresses.
    for ea, generated in [(0x1CCFD6C, 'list'), (0x1D96E9C, 'src'),
                          (0x1D96EAC, 'size'), (0x1D99760, 'dst')]:
        assert ea not in dict(BASE['names'])
        if ea not in names_dict():
            continue
        assert ida_name.get_name(ea) == generated, ('unexpected changed spill', hex(ea))
        observed_type = idc.get_type(ea)
        assert ida_name.set_name(ea, '', ida_name.SN_CHECK)
        event('auto_name_spill_reverted', ea=hex(ea), generated=generated,
              observed_type=observed_type,
              note='Type preimage at this non-target global was not captured; no type change is claimed or reversed.')
    result = validate()
    capture.dump_json(WORK/'post_state.json', result)
    event('post_validation_pass', post_state_sha256=capture.digest_file(WORK/'post_state.json'))
    assert ida_loader.save_database(None, 0)
    assert ida_loader.get_path(ida_loader.PATH_TYPE_IDB) == PLAN['idb']
    event('saved', idb=PLAN['idb'])
    receipt = dict(status='APPLIED_VERIFIED_SAVED', utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        input_md5=PLAN['input_md5'], idb=PLAN['idb'], idb_sha256=capture.digest_file(PLAN['idb']),
        backup=PLAN['backup'], backup_sha256=capture.digest_file(PLAN['backup']),
        plan_sha256=capture.digest_file(WORK/'plan.json'), baseline_sha256=PLAN['baseline_sha256'],
        post_state_sha256=capture.digest_file(WORK/'post_state.json'),
        journal_sha256=capture.digest_file(WORK/'mutation_journal.jsonl'),
        counts=dict(function_renames=sum('name' in r for r in PLAN['functions']),
                    data_renames=sum('name' in r for r in PLAN['data']),
                    function_prototypes=sum('declaration' in r for r in PLAN['functions']),
                    global_types=sum('declaration' in r for r in PLAN['data']),
                    function_comment_blocks=len(PLAN['functions']), data_site_comment_blocks=len(PLAN['data']),
                    types_added=1, types_refined=1, prior_types_preserved=len(PLAN['types']['preserve_types']),
                    functions_guarded=len(BEFORE), segments_byte_mask_hashes_unchanged=len(result['segment_hashes'])),
        comments_append_only=True, repeatable_comments_preserved=True, code_data_bytes_unchanged=True,
        debugger_started=False, source_hashes=PLAN['source_hashes'], limits=PLAN['limits'],
        analyzer_note='Four auto-propagated bare global names list/src/size/dst were removed to restore the name baseline. '
                      'IDA type propagation was allowed; non-target global type preimages were not inventoried. '
                      'Explicit global type count covers only the two requested graphics globals; all 557 inventoried '
                      'function signatures and all pre-existing local types were compared.')
    assert receipt['backup_sha256'] == PLAN['backup_sha256']
    capture.dump_json(WORK/'receipt.json',receipt)
    print(json.dumps({key:receipt[key] for key in ['status','idb_sha256','backup_sha256','counts']}))


if __name__ == '__main__':
    main()
