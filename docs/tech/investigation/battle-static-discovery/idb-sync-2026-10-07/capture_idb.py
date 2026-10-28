"""Read IDA state and save/hash a pre-mutation database backup."""
import datetime
import hashlib
import json
from pathlib import Path
import shutil

import ida_auto
import ida_bytes
import ida_dbg
import ida_funcs
import ida_idaapi
import ida_lines
import ida_loader
import ida_name
import ida_nalt
import ida_segment
import ida_typeinf
import idautils
import idc

WORK = Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
ROOT = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')


def digest_file(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def dump_json(path, value):
    with Path(path).open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)


def segment_hashes():
    result = []
    for start in idautils.Segments():
        seg = ida_segment.getseg(start)
        h = hashlib.sha256()
        for ea in range(start, seg.end_ea, 65536):
            size = min(65536, seg.end_ea - ea)
            value = ida_bytes.get_bytes_and_mask(ea, size)
            assert value is not None, hex(ea)
            for part in value:
                if isinstance(part, str):
                    part = part.encode('latin1')
                h.update(len(part).to_bytes(4, 'little'))
                h.update(part)
        result.append(dict(start=hex(start), end=hex(seg.end_ea),
                           name=ida_segment.get_segm_name(seg), bytes_mask_sha256=h.hexdigest()))
    return result


def type_state(name):
    tif = ida_typeinf.tinfo_t()
    if not tif.get_named_type(None, name):
        return None
    value = dict(name=name, size=tif.get_size(), display=str(tif))
    udt = ida_typeinf.udt_type_data_t()
    if tif.get_udt_details(udt):
        value['members'] = [dict(name=m.name, offset=m.offset, size=m.size,
                                type=str(m.type), comment=getattr(m, 'cmt', '')) for m in udt]
    serialized = tif.serialize()
    value['serialized'] = [x.hex() if isinstance(x, bytes) else x for x in serialized]
    return value


def function_state(ea, include_asm=False):
    func = ida_funcs.get_func(ea)
    assert func and func.start_ea == ea, hex(ea)
    chunks = list(idautils.Chunks(ea))
    code = hashlib.sha256()
    for start, end in chunks:
        code.update(ida_bytes.get_bytes(start, end - start))
    value = dict(ea=hex(ea), name=ida_name.get_name(ea), type=idc.get_type(ea),
                 end=hex(func.end_ea), chunks=chunks, code_sha256=code.hexdigest(),
                 comment=ida_funcs.get_func_cmt(func, False) or '',
                 repeatable=ida_funcs.get_func_cmt(func, True) or '')
    if include_asm:
        value['asm'] = [dict(ea=hex(item), text=ida_lines.tag_remove(idc.generate_disasm_line(item, 0) or ''))
                        for item in idautils.FuncItems(ea) if ida_bytes.is_code(ida_bytes.get_flags(item))]
    return value


def main():
    assert not ida_dbg.is_debugger_on()
    assert ida_auto.get_auto_state() == 0
    assert ida_nalt.retrieve_input_file_md5().hex() == 'be8b278becf6757bb811acd45d717d9c'
    idb = Path(ida_loader.get_path(ida_loader.PATH_TYPE_IDB))
    assert str(idb).lower() == 'd:\\modding\\ff8\\retro-exe\\ff8_en.exe - 9.3.i64'
    assert not (WORK / 'baseline.json').exists()
    # Saving the current path preserves the active database and includes any
    # pre-existing in-memory analysis before the byte-exact backup is copied.
    assert ida_loader.save_database(None, 0)
    backup = WORK / 'FF8_EN.before-sync.i64'
    with idb.open('rb') as source, backup.open('xb') as target:
        shutil.copyfileobj(source, target, 1024 * 1024)
    saved_hash = digest_file(idb)
    assert digest_file(backup) == saved_hash
    triage = json.loads((WORK / 'triage_v2.json').read_text(encoding='utf-8'))
    extra = {0x416D82, 0x417464, 0x4178D7, 0x41ED69, 0x41EF3C, 0x41EF7A,
             0x407EB4, 0x43E0E2, 0x460C20, 0x460C90, 0x460CE0, 0x509B50,
             0x6A30C0}
    extra.update(int(x['ea'], 16) for x in triage['confirmed_header_renames'])
    extra.update(int(x['ea'], 16) for x in triage['unannotated'])
    audit = json.loads(Path(triage['snapshot']).read_text(encoding='utf-8'))
    all_eas = {int(x['ea'], 16) for x in audit['decomp_rows']} | extra
    types = {}
    for ordinal in range(1, ida_typeinf.get_ordinal_limit(None)):
        name = ida_typeinf.get_numbered_type_name(None, ordinal)
        if name:
            types[name] = type_state(name)
    data = {}
    for ea in [0x1CA9A88, 0x1CA9A8C, 0xB7CC20, 0x1CA9E98, 0x41EF5D, 0x41EF72]:
        data[hex(ea)] = dict(name=ida_name.get_name(ea), type=idc.get_type(ea),
                             comment=ida_bytes.get_cmt(ea, False) or '',
                             repeatable=ida_bytes.get_cmt(ea, True) or '',
                             bytes14=ida_bytes.get_bytes(ea - 4, 14).hex())
    value = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                 idb=str(idb), backup=str(backup), backup_sha256=saved_hash,
                 backup_bytes=backup.stat().st_size, active_path_after_save=ida_loader.get_path(ida_loader.PATH_TYPE_IDB),
                 input=ida_nalt.get_input_file_path(), input_md5=ida_nalt.retrieve_input_file_md5().hex(),
                 function_count=ida_funcs.get_func_qty(), names=list(idautils.Names()),
                 functions={hex(ea): function_state(ea, ea in extra) for ea in sorted(all_eas)},
                 data=data, types=types, segment_hashes=segment_hashes())
    dump_json(WORK / 'baseline.json', value)
    print(json.dumps(dict(backup=str(backup), backup_sha256=saved_hash,
                          backup_bytes=value['backup_bytes'], functions=len(value['functions']),
                          asm_functions=len(extra), types=len(types), segments=len(value['segment_hashes']))))


if __name__ == '__main__':
    main()
