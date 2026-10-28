"""Produce an explicit, preimage-guarded IDB-only knowledge sync plan."""
import hashlib
import json
from pathlib import Path

WORK = Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
ROOT = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
DOC = 'docs/tech/investigation/battle-static-discovery/'
TAG = '[idb-sync 2026-10-07]'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    baseline = json.loads((WORK / 'baseline.json').read_text(encoding='utf-8'))
    supplement = json.loads((WORK / 'supplement.json').read_text(encoding='utf-8'))
    before = dict(baseline['functions'], **supplement['functions'])
    triage = json.loads((WORK / 'triage_v2.json').read_text(encoding='utf-8'))
    audit = json.loads(Path(triage['snapshot']).read_text(encoding='utf-8'))
    docs = {x['ea']: x['file'].replace('\\', '/') for x in audit['decomp_rows']}
    operations = {}
    sources = {}

    def source(path):
        path = path.replace('\\', '/')
        sources[path] = sha(ROOT / path)
        return path

    def function(ea, fact='', name=None, decl=None, paths=None):
        key = hex(ea)
        paths = paths or ([docs[key]] if key in docs else [])
        row = operations.setdefault(key, dict(ea=key, before=before[key], sources=[], facts=[]))
        row['before'] = {k: v for k, v in row['before'].items() if k != 'asm'}
        if name:
            row['name'] = name
        if decl:
            row['declaration'] = decl
        if fact:
            row['facts'].append(fact)
        for path in paths:
            if path not in row['sources']:
                row['sources'].append(source(path))

    certain = triage['confirmed_header_renames'] + [
        x for x in triage['name_deltas'] if x['ea'] == '0x6a30c0']
    assert len(certain) == 37
    for row in certain:
        ea = int(row['ea'], 16)
        assert 'CERTAIN' in (ROOT / row['file']).read_text(encoding='utf-8-sig')
        assert before[row['ea']]['comment'] or before[row['ea']]['repeatable']
        function(ea, 'Materialized the CERTAIN documented identity; historical symbol: '
                 + before[row['ea']]['name'] + '. Existing semantic evidence and uncertainty notes are preserved.',
                 name=row['doc_name'], paths=[row['file']])

    stage_doc = DOC + 'driver-passthrough/DOSSIER_lot23_stage0_depth.md'
    function(0x41EF3C,
        'Native stage-0 SetTexture request, cdecl(texobj, device). device==NULL exits without a device call '
        'and without defining EAX: it is neither unbind nor HRESULT success. With device: texobj!=NULL '
        'passes *(texobj+0x0C) at 0x41EF5D; texobj==NULL passes NULL at 0x41EF72. Both call vtable+0x98 '
        'with three stdcall arguments (device, stage=0, texture); method EAX is propagated and must be '
        'preserved. The function itself ends in C3. SDK Device3 layout is compatible; the old D3D9 '
        'identification and unconditional return-0 pseudocode are not adopted. Requested/result-observed/'
        'applied remain distinct. texobj, its +0x0C device object, and its +0x98 data token are distinct. '
        'EA 0x41EF3C is a preferred VA; RVA is 0x1EF3C. No instrumentation is installed by this sync.',
        name='Gfx_SetTextureStage0',
        decl='int __cdecl Gfx_SetTextureStage0(void *texobj, void *device);',
        paths=[stage_doc, docs['0x41ef3c']])
    function(0x4623A0,
        'PSX primitive dispatch 0x02: pack packet RGB bytes +4/+5/+6 into 15-bit color; write a '
        'rectangle in the CPU VRAM image at 0x1B47818, stride 0x800 bytes. Native signed guards require '
        'x>=640, y>=240, x+width<=1024, y+height<=512; do not rewrite this as a generic full-VRAM fill. '
        'Row fill uses rep stosd plus an odd-width word. No native device call in this function.',
        name='GpuPrimDispatch02_FillRectVRAM')

    facts = {
        0x407EB4: 'Palette-index/texture-object resolution path for a palette-device wrapper. Calls '
            '0x4221E6 and 0x4223B8, obtains/creates a texture object, and reaches 0x41ED69 for the '
            'native stage0 request. Mechanical call edges rechecked; the old pseudo-C mixes return '
            'conventions and pointer arithmetic. It is evidence for these edges, not an importable ABI '
            'or proof that a texture bind was applied.',
        0x41EF7A: 'Descriptor-controlled native state application: third argument supplies device '
            'at +0x314; descriptor mask at +0x0C. Device render-state calls use vtable+0x58. '
            'Texture paths reach 0x41ED69 at 0x41F0FC and 0x41F942. Keep numeric device states raw '
            'except independently verified mappings; old informal labels for states 8/17/18/41 '
            'are not authoritative. Caller 0x41F99A fixes the first argument to 1.',
        0x41F99A: 'Two-argument cdecl wrapper: pushes arg1, arg0, literal 1, calls 0x41EF7A at '
            '0x41F9A7, then caller-cleans 12 bytes. Wrapper activates the enabled descriptor path. '
            'No independent native bind-result or success observation.',
        0x421C41: 'TIM palette-remap initializer used by 0x4221E6. Clears output +0x2C/+0x30, '
            'guards source and 8-bit format, allocates a palette/remap table and output pixel data. '
            'Native allocations at 0x421CB2/0x421D05/0x421EBD; output slots +0x2C palette and '
            '+0x30 remapped pixels. Historical C has mixed byte/DWORD arithmetic; do not import it '
            'as a complete structure layout or interpret its alpha-byte test as proven PSX STP.',
        0x4221E6: 'Indexed palette-cache path, record stride 0x48. Initializes a new entry through '
            '0x421C41, then conditionally creates the backend texture through 0x421F9A. Entry '
            '+0x40 is compared to engine+0xBD8; entry+0x44 is the same-frame hit counter. '
            'Memory-pressure path calls 0x422451 and 0x42206E. These offsets are mechanical; '
            'no complete native object typedef inferred from the old pseudo-C.',
        0x43DF2A: 'Three-argument cdecl callback. When *(arg0+0x30)!=0, calls 0x441581 '
            'with (*(arg0+0x38), arg2); otherwise returns without that call. arg1 unused here. '
            'Return EAX is residual and is not a boolean success contract.',
        0x43DF54: 'Three-argument callback: gate *(arg0+0x30), setup 0x441581(*(arg0+0x38), '
            'arg2), then if *(*(arg1+0x2C)+0x80)!=-1 call 0x407EB4 with that palette index '
            'and *(arg0+0x38). Exact calls 0x43DF72/0x43DF9A.',
        0x43E0E2: 'DDrawAlt direct callback: gate +0x30, setup wrapper +0x38 through 0x441581, '
            'conditional palette resolution via 0x407EB4 when node.owner(+0x2C).palette(+0x80)!=-1. '
            'Then calls device vtable+0x64 with literal 1 and either owner+0xA8 pointer or inline '
            'owner+0xAC address, selected by owner+0xA4. Call sites 0x43E167/0x43E190. '
            'The documented PaletteSpriteNode alias is retained as a research label; this body '
            'alone does not justify labeling the +0x64 call a sprite draw.',
        0x461100: 'Current draw-list switch helper. Same-list path increments 0x1CA9EA4; '
            'different-list path first calls 0x460C90, selects render target using primitive-code '
            'bit 1, requests raw render states, then writes current list 0x1CA9A88. '
            'Native branches and calls rechecked. Keep primitive/raw state labels separate from '
            'observed device application; no depth/blend policy inferred from this helper.',
    }
    for ea, fact in facts.items():
        function(ea, fact)

    function(0x416D82, 'Typed return is the allocated 0xEC-byte GfxDrawList236, not float*. '
        'Five cdecl arguments retained; mode/descriptor/owner internals stay opaque. Original list '
        'type is stored even when dispatch normalizes 0x11 to 0x0C.',
        decl='GfxDrawList236 *__cdecl Gfx_CreateDrawList(int mode, int list_type, void *desc, const char *tim_path, void *owner);')
    function(0x417464, 'Applied GfxBatch30 and typed list argument. Reservation publishes +0x74/+0x78/'
        '+0x7C before advancing +0x84/+0x88/+0x8C. Signed counts/strides and unsigned generation '
        'comparison are preserved.',
        decl='int __cdecl Gfx_ReserveDrawListEntries(int count, GfxDrawList236 *list);')
    function(0x4178D7, 'Typed draw-list and opaque engine/cookie pointer; two cdecl arguments, '
        'setup callback once and walk callback per linked GfxBatch30. Function has no meaningful return.',
        decl='void __cdecl Gfx_WalkDrawList(GfxDrawList236 *list, void *cookie);')
    function(0x460C20, 'No arguments. EAX is residual context/device return and remains typed int; '
        'do not interpret it as a boolean. Cached engine and current-list globals are now named.',
        decl='int __cdecl Gpu_BeginPrimitivePass(void);')
    function(0x460C90, 'No arguments; current-list pointer is now typed GfxDrawList236*. '
        'EAX remains residual and is not promoted to a new success contract.',
        decl='int __cdecl Gpu_FlushCurrentDrawList(void);')
    function(0x509B50, 'Preserved void return and unsigned 32-bit length; source pointer '
        'qualified const. This implementation is not the CRT memmove return-value ABI.',
        decl='void __cdecl MemMove_OverlapSafe(unsigned char *dst, const unsigned char *src, unsigned int size);')
    function(0x41ED69, 'Immediate stage0 caller; calls 0x41EF3C at 0x41ED8B/0x41EF0E/0x41EF20 '
        'with two cdecl arguments and add esp,8. Does not test returned EAX before propagation. '
        'A native call request and residual return are not same-frame applied state.', paths=[stage_doc])
    function(0x440FF0, 'Lot23 native depth mapping: raw type 15 at 0x44133C requests device state '
        '7 (ZENABLE), value (raw!=0), call 0x441361; then state 23 (ZFUNC), value 4 (LESSEQUAL), '
        'call 0x441371. Raw type 16 at 0x441379 requests state 14 (ZWRITEENABLE), value '
        '(raw!=0), call 0x44139E. vtable offset +0x58. SDK Device3-compatible static mapping '
        'only; no measured device success/applied-at-draw guarantee. Raw 0..25 and blend 0..4 '
        'retain numeric identity.', paths=[stage_doc])
    correction = ('Correction to historical GPU-commit wording: the complete 0x43B57F function '
        '(390 native instructions) has no CALL instructions. It reads a mask at arg0+0x0C, '
        'loads the CPU state table from engine+0xA84, and performs mask-controlled state writes. '
        'A proposed RenderDDraw_CommitRenderState name implying a direct GPU commit is not '
        'applied. This does not negate the verified slot-29 CPU shadow setter.')
    function(0x43B57F, correction, paths=[docs['0x43b50c']])
    function(0x43B50C, correction)

    for row in operations.values():
        block = TAG + ' ' + '\n'.join(row.pop('facts')) + '\nSources: ' + '; '.join(row['sources'])
        old = row['before']['comment']
        assert TAG not in old
        row['comment'] = old + ('\n\n' if old else '') + block

    data = []
    data_specs = [
        (0x1CA9A88, 'g_gpuCurrentDrawList', 'GfxDrawList236 *g_gpuCurrentDrawList;',
         'Current primitive-pass draw-list. Read/cleared by 0x460C90; selected by 0x461100; reset by 0x460C20.'),
        (0x1CA9A8C, 'g_gpuPrimitivePassContext', 'void *g_gpuPrimitivePassContext;',
         'Cached FFGetBufferAddress result, stored by 0x460C20 and passed to primitive-pass driver/list helpers. Opaque engine pointer.'),
        (0xB7CC20, None, None,
         'Native begin-pass gate: nonzero makes 0x460C20 skip scene/target setup after caching FFGetBufferAddress. Exact domain-wide flag meaning remains open.'),
        (0x1CA9E98, None, None,
         'Branch marker written by 0x460C20: 0 after BeginScene, 1 after SelectRenderTarget. Not itself a device-success or applied-state witness.'),
        (0x41EF5D, None, None,
         'Native stage0 texobj-present call: FF 90 98 00 00 00; arguments (device,0,*(texobj+0x0C)), stdcall cleanup 12. The texture field may itself be NULL. Method EAX propagated; request is not proof of applied binding.'),
        (0x41EF72, None, None,
         'Native stage0 texobj-NULL/unbind call: FF 90 98 00 00 00; arguments (device,0,NULL), stdcall cleanup 12. This path is distinct from device==NULL (no call). Method EAX propagated.'),
    ]
    for ea, name, decl, fact in data_specs:
        key = hex(ea)
        old = baseline['data'][key]
        row = dict(ea=key, before=old,
                   comment=old['comment'] + ('\n\n' if old['comment'] else '') + TAG + ' ' + fact)
        if name:
            row['name'] = name
        if decl:
            row['declaration'] = decl
        data.append(row)

    # All non-reserved members retain their offsets, sizes, names and comments.
    # Only batch pointers refine an already-known pointer at the same width.
    fields = [
        (0x04, 'has_vertices', 'int', 'desc+0x14 > 0, signed SETNLE at 0x4170FF; store 0x417105'),
        (0x08, 'reserved_08', 'unsigned char[4]', ''),
        (0x0C, 'descriptor_word_2C', 'unsigned int', 'Copied from desc+0x2C at 0x41710E/0x417111; exact semantic name open'),
        (0x10, 'texture', 'void *', 'Texture resource stored at 0x4170F3'),
        (0x14, 'vertex_buffer', 'void *', 'Optional buffer from 0x412883 in Gfx_CreateDrawList'),
        (0x1C, 'descriptor_28_is_zero', 'int', 'Set to 1, cleared when desc+0x28 != 0; 0x417117..0x41712A'),
        (0x20, 'reserved_20', 'unsigned char[16]', ''),
        (0x38, 'reserved_38', 'unsigned char[4]', ''),
        (0x3C, 'stream0_accounting_stride', 'int', 'Signed per-entry batch->stream0_bytes increment in 0x417464'),
        (0x40, 'stream1_accounting_stride', 'int', 'Signed per-entry batch->stream1_bytes increment in 0x417464'),
        (0x44, 'stream0_cursor_stride', 'int', 'Signed per-entry cursor +0x84 increment in 0x417464'),
        (0x48, 'stream1_cursor_stride', 'int', 'Signed per-entry cursor +0x88 increment in 0x417464'),
        (0x4C, 'reserved_4C', 'unsigned char[4]', ''),
        (0x50, 'used_count', 'int', 'Incremented by count; cleared on generation reset'),
        (0x54, 'remaining_count', 'int', 'Signed capacity guard; decremented by count'),
        (0x5C, 'shared_stream1', 'void *', 'Shared base selected for count <= 0x200'),
        (0x60, 'reserved_60', 'unsigned char[20]', ''),
        (0x74, 'reserved_stream0_begin', 'void *', 'Published from +0x84 before advancing cursor'),
        (0x78, 'reserved_stream1_begin', 'void *', 'Published from +0x88 before advancing cursor'),
        (0x7C, 'reserved_stream2_begin', 'void *', 'Published from +0x8C before advancing cursor'),
        (0x80, 'palette_index', 'int', 'Reset to -1; direct callback reads owner+0x80 for palette resolution'),
        (0x84, 'stream0_cursor', 'unsigned char *', 'Advanced by count * signed stride at +0x44'),
        (0x88, 'stream1_cursor', 'unsigned char *', 'Advanced by count * signed stride at +0x48'),
        (0x8C, 'stream2_cursor', 'unsigned char *', 'Advanced by count bytes'),
    ]
    batch = [
        (0x00, 'next', 'GfxBatch30 *'), (0x04, 'field_04', 'unsigned int'),
        (0x08, 'used_count', 'int'), (0x0C, 'stream0_bytes', 'int'),
        (0x10, 'stream0_begin', 'void *'), (0x14, 'stream0_base', 'void *'),
        (0x18, 'stream1_bytes', 'int'), (0x1C, 'stream1_begin', 'void *'),
        (0x20, 'stream1_base', 'void *'), (0x24, 'stream2_begin', 'void *'),
        (0x28, 'stream2_base', 'void *'), (0x2C, 'owner', 'GfxDrawList236 *'),
    ]
    source(docs['0x417464'])
    source(docs['0x416d82'])
    source(docs['0x43e0e2'])
    remaining = []
    for row in triage['name_deltas']:
        op = operations.get(row['ea'], {})
        if op.get('name'):
            status = 'APPLY_VERIFIED_NAME'
        elif row['doc_name'].startswith(('sub_', 'nullsub_', 'j_')) and not row['idb_name'].startswith(('sub_', 'nullsub_', 'j_')):
            status = 'PRESERVE_EXISTING_DESCRIPTIVE_NAME_OVER_OLD_FILENAME'
        elif any(word in ' '.join(row['verdict']) for word in ['LIKELY', 'UNCERTAIN', 'CONFLICT']):
            status = 'PRESERVE_VERDICT_IN_EXISTING_COMMENTS_NO_CONFIDENCE_PROMOTION'
        elif row['ea'] in operations:
            status = 'SYNC_MECHANICAL_FACTS_NAME_NOT_CERTIFIED'
        else:
            status = 'PRESERVE_EXISTING_IDENTITY_NO_NEW_CERTIFIED_NAME'
        remaining.append(dict(ea=row['ea'], documented_name=row['doc_name'], current_name=row['idb_name'],
                              disposition=status, source=row['file'], verdict=row['verdict']))

    plan = dict(schema=1, tag=TAG, input_md5=baseline['input_md5'], idb=baseline['idb'],
        baseline_sha256=sha(WORK/'baseline.json'), supplement_sha256=sha(WORK/'supplement.json'),
        backup=baseline['backup'], backup_sha256=baseline['backup_sha256'],
        functions=list(operations.values()), data=data,
        types=dict(drawlist_fields=fields, batch_fields=batch, drawlist_size=236, batch_size=48,
                   preserve_types=[n for n in baseline['types'] if n!='GfxDrawList236']),
        source_hashes=sources, name_delta_dispositions=remaining,
        limits=['Not a new semantic promotion for LIKELY/UNCERTAIN/CONFLICT entries.',
                'No executable bytes, hooks, capture sidecars, readers or writer artifacts are changed.',
                'AF3DN.P writer-local structures and lifetime globals belong to the DLL, not this EXE IDB.'])
    with (WORK/'plan.json').open('x',encoding='utf-8') as stream:
        json.dump(plan,stream,ensure_ascii=False,indent=2)
    print(json.dumps(dict(functions=len(operations), function_renames=sum('name' in x for x in operations.values()),
        function_prototypes=sum('declaration' in x for x in operations.values()), data_annotations=len(data),
        data_renames=sum('name' in x for x in data), source_documents=len(sources), plan_sha256=sha(WORK/'plan.json'))))


if __name__ == '__main__':
    main()
