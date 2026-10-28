#!/usr/bin/env python3
"""Fresh rasterization of strict Lot25 bytes using the Lot21 rendering model.

This is NOT an applied-state renderer. Observed RS/blend values stay raw;
unknown stage0 bindings, depth, STP and global OT are not invented. No older
PNG or game screenshot is read to construct the output pixels.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

from PIL import Image

import lot24_contract as contract
from lot25_render_input import load_capture
import render_lot21 as model


def sha_file(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def render_frame(capture, seq):
    records = [r for r in capture['records'] if r.seq == seq]
    mirrors = [r for r in capture['mirrors'] if r.seq == seq]
    textures = [r for r in capture['resources'] if r.seq == seq]
    if any(r.geom_kind == 1 for r in records):
        raise model.MissingEvidence('packet kind1 has no Lot21 raster path; do not omit silently')
    if len(mirrors) != 1:
        raise model.MissingEvidence(f'frame {seq}: exactly one TX07 required')
    if tuple(mirrors[0].texwin) != (0, 0, 0, 0):
        raise model.MissingEvidence('Lot21 model does not implement nonzero TEXWIN')
    resources = {r.texobj: r for r in textures}
    if len(resources) != len(textures):
        raise model.MissingEvidence('duplicate resource tokens in frame')
    classes, bindings = model.classify_resources(records, textures, mirrors[0].mirror)
    geometry = [r for r in records if r.geom_kind == 2]
    roles = {}
    for role in model.BACKGROUND_ORDER:
        tokens = set(classes['background'].get(role, ()))
        roles[role] = [r for r in geometry if r.slot == 51 and r.texobj in tokens]
        if not roles[role]:
            raise model.MissingEvidence(f'no byte-exact mirror-bound {role} for frame {seq}')
    actors = [r for r in geometry if r.slot == 51 and r.texobj in set(classes['actors'])]
    ui = [r for r in geometry if r.slot == 51 and r.texobj in set(classes['ui'])]
    textured = [r for r in geometry if r.slot == 51]
    if any(r.texobj not in resources for r in textured):
        raise model.MissingEvidence('textured geometry without captured TR08')
    selected = [r for role in model.BACKGROUND_ORDER for r in roles[role]] + actors + ui
    if {r.offset for r in selected} != {r.offset for r in textured}:
        raise model.MissingEvidence('semantic classes do not account for every slot51 record')
    totals = {}

    def layered(blend):
        image = model.blank_frame()
        for role, batch in [*((role, roles[role]) for role in model.BACKGROUND_ORDER),
                            ('actors', actors), ('ui', ui)]:
            image, counts = model.render_records(batch, resources, perspective=True,
                                                 initial=image, blend_diffuse=blend,
                                                 palette_zero_transparent=role != 'ui')
            if blend:
                totals[role] = counts
        return image

    composite = layered(True)
    opaque = layered(False)
    host, host_counts = model.render_records(textured, resources, perspective=True)
    direct = [r for r in geometry if r.slot == 49 and r.texobj == 0]
    if any(r.slot != 51 and r not in direct for r in geometry):
        raise model.MissingEvidence('unhandled geometry: do not silently omit it')
    direct_image, direct_counts, direct_description = model.render_slot49(direct)
    events = [e for e in capture['parsed']['events'] if e['seq'] == seq]
    state = {'event_kinds': dict(Counter(e['kind'] for e in events)),
             'RS_raw': sorted({(e['type'], e['value']) for e in events if e['kind'] == 1}),
             'blend_raw': sorted({(e['type'], e['value']) for e in events if e['kind'] == 3}),
             'stage0_requests': sum(e['kind'] == 8 for e in events),
             'stage0_results': sum(e['kind'] == 9 for e in events),
             'stage0_valid_footers': sum(bool(r.state_flags & contract.STAGE0_VALID)
                                       for r in geometry),
             'rendering_uses_observed_RS_or_blend': False}
    return {'composite': composite, 'opaque': opaque, 'host_order': host,
            'direct49_unbound': direct_image,
            'info': {'seq': seq, 'ND_records': len(records), 'kind2': len(geometry),
                     'slot51_textured_records': len(textured), 'slot49_unbound_records': len(direct),
                     'role_records': {role: len(batch) for role, batch in roles.items()} |
                                     {'actors': len(actors), 'ui': len(ui)},
                     'resource_bindings': {hex(k): v for k, v in bindings.items()},
                     'raster_counts': totals, 'host_order_counts': host_counts,
                     'direct_counts': direct_counts, 'direct_description': direct_description,
                     'state_observations': state}}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('--build', type=lambda s: int(s, 0), choices=contract.SUPPORTED_BUILDS,
                        required=True)
    parser.add_argument('--seq', type=int, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(argv)
    source_hash = sha_file(args.capture)
    frozen = {n: sha_file(Path(__file__).with_name(n))
              for n in ['ff8dump.py', 'render_lot17.py', 'render_lot21.py']}
    capture = load_capture(args.capture, build=args.build)
    result = render_frame(capture, args.seq)
    # Refuse overwrite of prior evidence, including failed/partial runs.
    args.out.mkdir(parents=True, exist_ok=False)
    outputs = []
    for key in ['composite', 'opaque', 'host_order', 'direct49_unbound']:
        outputs.append(model.save_png(args.out / f'LOT25_seq{args.seq}_{key}.png', result[key]))
    pair = Image.new('RGB', (1280, 516), (18, 20, 26))
    pair.paste(model.labelled(result['composite'], f'NEW Lot25 / frame {args.seq}',
                             'Lot21 RHW + semantic layers; diffuse-alpha approximation'), (0, 0))
    pair.paste(model.labelled(result['opaque'], 'SAME NEW FRAME / opaque diagnostic',
                             'A/B policy, NOT native reference or proved device state'), (640, 0))
    outputs.append(model.save_png(args.out / f'LOT25_seq{args.seq}_alpha_AB.png', pair))
    manifest = {'schema': 'lot25-fresh-raster-v1', 'source': str(args.capture.resolve()),
                'source_sha256': source_hash, 'build': hex(args.build), 'frame': args.seq,
                'pixels_rasterized_from_capture': True, 'older_PNGs_used_as_input': False,
                'native_reference_available': False, 'same_frame_native_comparison': False,
                'model': 'unchanged Lot21 UV rot0 + RHW + approximate semantic layers',
                'new_applied_state_rendering_since_lot21': False,
                'capture_replay_incomplete': capture['replay']['incomplete'],
                'frame_info': result['info'], 'outputs': outputs,
                'code_sha256': {n: sha_file(Path(__file__).with_name(n))
                                for n in ['render_lot25.py', 'lot25_render_input.py',
                                          'lot24_contract.py', 'render_lot21.py']},
                'limits': ['No native screenshot for this captured frame',
                           'RS/blend are observed raw, not applied by this renderer',
                           'Unbound slot49 excluded from textured composite; separate diffuse diagnostic',
                           'No stage0/depth/STP/global OT inferred',
                           'Diffuse-alpha A/B is inherited model policy, not device evidence']}
    assert sha_file(args.capture) == source_hash, 'source changed during render'
    assert all(sha_file(Path(__file__).with_name(n)) == h for n, h in frozen.items()), 'oracle changed'
    (args.out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'out': str(args.out.resolve()), 'frame': args.seq,
                      'source_sha256': source_hash, 'info': result['info']}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
