#!/usr/bin/env python3
"""Reproducible offline lot17 evidence and conditional battle13 replays.

Final captured FVF UVs are immutable. Missing window/sampler state is not
silently promoted to ground truth. Images with candidate W/H are explicitly
conditional; CORRECTED /255 is unavailable for captures without original u8.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct

import numpy as np
from PIL import Image, ImageDraw

import ff8dump as dump
from lot17_texture_window import (
    MissingEvidence, actor_palette, actor_palette_pc_bgra, convert_uv, extract_index_rect,
    locate_index_rect, locate_pc_bgra_palette, raster_triangle, read_actor_band, read_clut_bytes,
    slot_actor, triangles_with_slots,
)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_capture(path):
    data = Path(path).read_bytes()
    if len(data) < 8:
        raise ValueError('capture header is truncated')
    magic = struct.unpack_from('<I', data)[0]
    if magic in (dump.MAGIC_ND, dump.MAGIC_ND8):
        if len(data) < dump.HDR.size:
            raise ValueError('ND header is truncated')
        build = struct.unpack_from('<I', data, 32)[0]
    elif magic in (dump.MAGIC_TR, dump.MAGIC_TX):
        build = struct.unpack_from('<I', data, 4)[0]
    else:
        raise ValueError('unknown first record magic')
    if build not in dump.SUPPORTED_REPLAY_BUILDS:
        raise ValueError(f'unsupported capture build 0x{build:X}')
    recs, warnings, tx, tr = dump.parse_dump(data, expected_build=build)
    if warnings:
        raise ValueError(f'strict replay rejects {len(warnings)} warnings: {warnings[0]}')
    if any(r.build != build for r in [*recs, *tx, *tr]):
        raise ValueError('mixed capture builds')
    if any(r.fails or r.idx_repaired for r in recs):
        raise ValueError('strict replay rejects failed reads/repaired indices')
    return data, build, recs, tx, tr


def uv_evidence(records):
    result = {}
    for slot in sorted({r.slot for r in records if r.geom_kind == 2}):
        selected = [r for r in records if r.geom_kind == 2 and r.slot == slot]
        pairs = np.array([(v[6], v[7]) for r in selected for v in dump.VERT.iter_unpack(r.fvf)])
        if not len(pairs):
            continue
        if not np.isfinite(pairs).all():
            raise ValueError('nonfinite captured UVs')
        result[str(slot)] = {
            'records': len(selected), 'vertices': len(pairs),
            'min_uv': pairs.min(axis=0).tolist(), 'max_uv': pairs.max(axis=0).tolist(),
            'outside_01_uv': ((pairs < 0) | (pairs > 1)).sum(axis=0).tolist(),
            'grid256_exact_fraction_uv': (np.abs(pairs * 256 - np.rint(pairs * 256)) < 1e-6).mean(axis=0).tolist(),
            'grid128_exact_fraction_uv': (np.abs(pairs * 128 - np.rint(pairs * 128)) < 1e-6).mean(axis=0).tolist(),
        }
    return result


def verify_all_frames(records, mirrors, resources, objects):
    """Cross-frame evidence; never fill a missing frame from another frame."""
    images, palettes, bindings = 0, 0, set()
    for tx in mirrors:
        current = {r.texobj: r for r in resources if r.seq == tx.seq}
        for obj in objects:
            if obj not in current:
                raise MissingEvidence(f'frame {tx.seq}: missing resource {obj:#x}')
            tr = current[obj]
            rects = locate_index_rect(tx.mirror, tr.pixels, tr.w, tr.h)
            if len(rects) != 1:
                raise MissingEvidence(f'frame {tx.seq}: ambiguous index-image binding {obj:#x}')
            images += 1
            ids = {i for r in records if r.seq == tx.seq and getattr(r, 'texobj', None) == obj for i in r.ids}
            for slot in ids:
                rows = locate_pc_bgra_palette(tx.mirror, tr.raw_clut[slot*1024:(slot+1)*1024])
                if len(rows) != 1:
                    raise MissingEvidence(f'frame {tx.seq}: ambiguous palette {obj:#x}/{slot}')
                palettes += 1
                bindings.add((obj, slot, rows[0]))
    return {'frames': len(mirrors), 'byte_exact_index_image_checks': images,
            'full_256_color_palette_checks': palettes,
            'distinct_palette_bindings': len(bindings), 'failures': []}


def labelled(image, title, subtitle='', width=640):
    image = image.convert('RGB')
    if image.width != width:
        image = image.resize((width, round(image.height * width / image.width)))
    panel = Image.new('RGB', (width, image.height + 54), (25, 27, 35))
    panel.paste(image, (0, 54))
    draw = ImageDraw.Draw(panel)
    draw.text((10, 8), title, fill=(230, 235, 242))
    draw.text((10, 28), subtitle, fill=(175, 185, 198))
    return panel


def side_by_side(panels):
    result = Image.new('RGB', (sum(p.width for p in panels), max(p.height for p in panels)), (25, 27, 35))
    x = 0
    for panel in panels:
        result.paste(panel, (x, 0))
        x += panel.width
    return result


def synthetic_comparison(out):
    """Known u8 example; explicitly separate from battle13 evidence."""
    texture = np.tile(np.arange(256, dtype=np.uint8), (256, 1))
    palette = np.array([(i, 255 - i, (i * 17) % 256) for i in range(256)], dtype=np.uint8)
    positions = [(8, 8), (248, 20), (16, 248)]
    raw = [(0, 0), (255, 0), (0, 255)]
    panels = []
    hashes = {}
    for mode in ('exact', 'corrected255'):
        frame = np.zeros((256, 256, 3), dtype=np.uint8)
        tri = []
        for (x, y), (u, v) in zip(positions, raw):
            uu, vv = convert_uv(u, v, provenance='u8', mode=mode, window_word=0)
            tri.append((x, y, 0, 1, 0xFFFFFFFF, 0, uu, vv))
        raster_triangle(frame, tri, texture, palette)
        image = Image.fromarray(frame)
        name = f'synthetic_u8_{mode}.png'
        image.save(out / name)
        hashes[mode] = sha(frame.tobytes())
        panels.append(labelled(image, mode.upper(), 'SYNTHETIC u8, observed latch=0', width=384))
    side_by_side(panels).save(out / 'synthetic_u8_comparison.png')
    return {'source': 'synthetic, not battle13', 'window_word': 0, 'rgb_sha256': hashes}


def run(args):
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    data, build, records, mirrors, resources = load_capture(args.dump)
    seq = args.seq if args.seq is not None else sorted({t.seq for t in mirrors})[0]
    frame_mirrors = [t for t in mirrors if t.seq == seq]
    if len(frame_mirrors) != 1:
        raise ValueError('frame needs exactly one TX07 mirror')
    tx = frame_mirrors[0]
    trs = {t.texobj: t for t in resources if t.seq == seq}
    matches = {}
    for obj, tr in trs.items():
        if len(tr.pixels) == tr.w * tr.h and tr.w and tr.h:
            matches[obj] = locate_index_rect(tx.mirror, tr.pixels, tr.w, tr.h)
    # Battle 8bpp strip starts at x=640 halfwords (0x507400).
    # Eligibility is an exact full-image match, never texobj low bits or a guess.
    actor_objects = {obj: rects[0] for obj, rects in matches.items()
                     if len(rects) == 1 and rects[0][0] >= 1280 and rects[0][1] == 0
                     and trs[obj].w == 256 and trs[obj].h == 256}
    selected = [r for r in records if r.seq == seq and r.slot == 51 and
                r.geom_kind == 2 and getattr(r, 'texobj', 0) in actor_objects]
    if not selected:
        raise MissingEvidence('no byte-exact battle texture resources matched the mirror')
    if any(getattr(r, 'dropped_ids', 0) for r in selected):
        raise MissingEvidence('captured primitive IDs were dropped')
    # Audit every final UV before and after the passthrough; floats are packed
    # again so negative zero and all IEEE-754 bits are checked as well.
    before, after = bytearray(), bytearray()
    for r in selected:
        for off in range(0, len(r.fvf), dump.VERT.size):
            u, v = struct.unpack_from('<2f', r.fvf, off + 24)
            uu, vv = convert_uv(u, v, provenance='final_f32')
            before.extend(r.fvf[off + 24:off + 32])
            after.extend(struct.pack('<2f', uu, vv))
    if before != after:
        raise AssertionError('final FVF UVs changed')
    bands = {g: read_actor_band(tx.mirror, g) for g in range(3)}
    palettes = {g: actor_palette(tx.mirror, g, args.palette_half)[0] for g in range(3)}
    cache_palettes, cache_bindings = {}, []
    for obj in actor_objects:
        tr = trs[obj]
        slots = sorted({i for r in selected if r.texobj == obj for i in r.ids})
        for slot in slots:
            raw = tr.raw_clut[slot*1024:(slot+1)*1024]
            rows = locate_pc_bgra_palette(tx.mirror, raw)
            if len(rows) != 1:
                if args.palette_policy == 'captured-bgra':
                    raise MissingEvidence(f'cache palette {obj:#x}/{slot}: ambiguous VRAM rows {rows}')
                continue
            row = rows[0]
            actor, half = divmod(row-224, 2)
            colors = actor_palette_pc_bgra(tx.mirror, actor, half)
            pc = np.frombuffer(raw, dtype='<u4')
            reference_colors = np.stack([(pc >> 16) & 255, (pc >> 8) & 255, pc & 255], axis=1)
            delta = np.abs(colors.astype(int)-reference_colors.astype(int))
            if delta.max() > 1:
                raise MissingEvidence('BGRA expansion differs by more than transparent-color sentinel')
            cache_palettes[(obj, slot)] = colors
            cache_bindings.append({'texobj': f'0x{obj:X}', 'footer_cache_id': slot,
                                   'VRAM_row': row, 'actor_band_g': actor, 'palette_half': half,
                                   'colors_5bit_equal': 256, 'BGRA_max_channel_delta': int(delta.max()),
                                   'VRAM_palette_sha256': sha(read_clut_bytes(tx.mirror, row << 6)),
                                   'cache_BGRA_sha256': sha(raw)})
    used_actors = {0, 1, 2} | {b['actor_band_g'] for b in cache_bindings}
    bands = {g: read_actor_band(tx.mirror, g) for g in sorted(used_actors)}
    legacy = {}
    for cid in (0x1DA0, 0x1DFF, 0x1E00, 0x1E02):
        p = read_clut_bytes(tx.mirror, cid)
        legacy[f'0x{cid:04X}'] = {
            'interpretation': 'literal packed CLUT reference; other encodings not excluded',
            'sha256': sha(p),
            'equal_actor_half': [[g, half] for g, b in bands.items() for half in (0, 1)
                                 if p == b[half * 512:(half + 1) * 512]],
        }
    bindings = []
    for obj, (x, y) in actor_objects.items():
        rs = [r for r in selected if r.texobj == obj]
        bindings.append({'texobj': f'0x{obj:X}', 'byte_x': x, 'row_y': y,
                         'match_width': trs[obj].w, 'match_height': trs[obj].h,
                         'records': len(rs),
                         'footer_slots': dict(Counter(i for r in rs for i in r.ids)),
                         'index_image_sha256': sha(trs[obj].pixels)})
    render_results = []
    panels = []
    for width in args.width_candidates:
        images = {obj: extract_index_rect(tx.mirror, x, y, width, args.window_height)
                  for obj, (x, y) in actor_objects.items()}
        frame = np.full((480, 640, 3), (29, 30, 39), dtype=np.uint8)
        counts = Counter()
        for r in selected:
            for tri, slot in triangles_with_slots(r):
                if args.palette_policy == 'captured-bgra':
                    palette = cache_palettes[(r.texobj, slot)]
                else:
                    palette = palettes[slot_actor(slot)]
                written = raster_triangle(frame, tri, images[r.texobj], palette,
                                          modulate=not args.no_modulate,
                                          perspective=args.perspective)
                counts[f'footer_cache_id_{slot}_triangles'] += 1
                counts['triangle_pixel_writes'] += written
        name = f'battle13_exact_candidate_W{width}_H{args.window_height}.png'
        image = Image.fromarray(frame)
        image.save(out / name)
        render_results.append({'file': name, 'width': width, 'height': args.window_height,
                               'window_status': 'UNPROVEN candidate; no packet was captured',
                               'rgb_sha256': sha(frame.tobytes()), 'counts': dict(counts)})
        panels.append(labelled(image, f'EXACT UV / window candidate {width}x{args.window_height}',
                              f'UV f32 preserved; palette={args.palette_policy}; W/H UNPROVEN'))
    side_by_side(panels).save(out / 'battle13_window_candidates.png')
    na = Image.new('RGB', (640, 480), (29, 30, 39))
    draw = ImageDraw.Draw(na)
    for y, line in enumerate([
        'CORRECTED /255: NOT AVAILABLE FOR THIS CAPTURE', '',
        'Only final FVF float UVs were captured.',
        'Original u8 UVs and the texture-window packet are absent.',
        'No inverse LUT, guessed W=128, or UV rescaling was applied.', '',
        'See synthetic_u8_comparison.png for a controlled comparison.',
    ]):
        draw.text((24, 130 + y * 24), line, fill=(220, 222, 230))
    na.save(out / 'battle13_corrected255_unavailable.png')
    comparison = [panels[0], labelled(na, 'CORRECTED /255', 'Missing original u8 and window state')]
    if args.reference:
        reference_panel = labelled(Image.open(args.reference), 'GAME REFERENCE', 'Pose/UI differ; no global pixel score')
        comparison.append(reference_panel)
        side_by_side([panels[0], reference_panel]).save(out / 'battle13_vs_reference.png')
    side_by_side(comparison).save(out / 'battle13_comparison.png')
    palette_sheet = Image.new('RGB', (512, len(bands) * 96), (29, 30, 39))
    draw = ImageDraw.Draw(palette_sheet)
    for position, (g, b) in enumerate(bands.items()):
        draw.text((8, position * 96 + 4), f'actor g={g}, staging id={2*g}, rows {224+2*g}/{225+2*g}', fill='white')
        for half in (0, 1):
            pal = (actor_palette_pc_bgra(tx.mirror, g, half) if args.palette_policy == 'captured-bgra'
                   else actor_palette(tx.mirror, g, half)[0])
            for i, col in enumerate(pal):
                x, y = (i % 64) * 8, position * 96 + 24 + half * 32 + (i // 64) * 8
                draw.rectangle((x, y, x + 7, y + 7), fill=tuple(int(c) for c in col))
    palette_sheet.save(out / 'actor_clut_bands.png')
    manifest = {
        'schema': 'lot17-offline-v1', 'dump': str(Path(args.dump).resolve()),
        'dump_sha256': sha(data), 'build': f'0x{build:X}', 'frame': seq,
        'records': len(records), 'TX07': len(mirrors), 'TR08': len(resources),
        'parse_warnings': [], 'selected_records': len(selected),
        'UV_provenance': 'final_f32', 'UV_before_sha256': sha(before),
        'UV_after_sha256': sha(after), 'UV_preserved_bit_exact': before == after,
        'RHW_range': [min(v[3] for r in selected for v in dump.VERT.iter_unpack(r.fvf)),
                      max(v[3] for r in selected for v in dump.VERT.iter_unpack(r.fvf))],
        'UV_evidence_all_frames': uv_evidence(records),
        'window_word': None, 'window_status': 'UNPROVEN',
        'corrected255_status': 'unavailable: original u8 and window/latch not captured',
        'corrected255_recipe_u8': 'u8/255; active window additionally scales by (256/W,256/H)',
        'recipe_status': 'explicit experimental comparison convention, not an FFNx verification',
        'actor_palette_half': args.palette_half, 'actor_slot_rule': 'g=id/2 for ids 0,2,4',
        'palette_policy': args.palette_policy,
        'actor_rule_note': 'physical staging id=2g; captured footer cache IDs are object-local and are not those staging ids',
        'BGR': ('validated PC BGRA: PSX low R5, high B5, floor(c5*255/31)' if args.palette_policy == 'captured-bgra'
                else 'historical high-field-red diagnostic, unchanged texture.py helper'),
        'sampling_assumptions': {'filter': 'point', 'address': 'wrap', 'pixel_centers': 'integer',
                                 'perspective': args.perspective, 'diffuse_modulate': not args.no_modulate,
                                 'ordering': 'capture painter order; no depth reconstruction',
                                 'alpha': 'diffuse alpha threshold 8; no STP blend reconstruction'},
        'bindings_byte_exact': bindings,
        'cache_palette_bindings': cache_bindings,
        'actor_bands': {g: {'sha256': sha(b), 'bytes': len(b),
                            'rows': [224 + 2 * g, 225 + 2 * g],
                            'frame_variants': len({sha(read_actor_band(t.mirror, g)) for t in mirrors})}
                        for g, b in bands.items()},
        'legacy_cid_literal_check': legacy,
        'renders': render_results,
        'synthetic': synthetic_comparison(out),
        'UNPROVEN': ['actual battle13 W/H', 'legacy cid encoding to actor bands',
                     'runtime bias writers if enabled', 'active backend/sampler state'],
    }
    if args.verify_all_frames:
        manifest['cross_frame_validation'] = verify_all_frames(records, mirrors, resources, actor_objects)
    manifest['code_sha256'] = {p.name: sha(p.read_bytes()) for p in
                               (Path(__file__), Path(__file__).with_name('lot17_texture_window.py'),
                                Path(dump.__file__))}
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'out': str(out.resolve()), 'frame': seq, 'selected_records': len(selected),
                      'bindings': len(bindings), 'UV_bit_exact': before == after,
                      'corrected255': manifest['corrected255_status']}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dump')
    parser.add_argument('--out', required=True)
    parser.add_argument('--seq', type=int)
    parser.add_argument('--reference')
    parser.add_argument('--width-candidates', type=int, nargs='+', default=[256, 128])
    parser.add_argument('--window-height', type=int, default=256)
    parser.add_argument('--palette-half', type=int, choices=[0, 1], default=0)
    parser.add_argument('--palette-policy', choices=['captured-bgra', 'actor-slots'], default='captured-bgra',
                        help='captured-bgra resolves all cache colors to VRAM; actor-slots tests the literal brief interpretation')
    parser.add_argument('--no-modulate', action='store_true')
    parser.add_argument('--verify-all-frames', action='store_true')
    parser.add_argument('--perspective', action=argparse.BooleanOptionalAction, default=True,
                        help='use captured RHW for UV interpolation (default); --no-perspective for affine diagnostic')
    args = parser.parse_args()
    if any(w not in range(8, 257, 8) for w in args.width_candidates) or args.window_height not in range(8, 257, 8):
        parser.error('candidate dimensions must be multiples of 8 in [8,256]')
    run(args)


if __name__ == '__main__':
    main()
