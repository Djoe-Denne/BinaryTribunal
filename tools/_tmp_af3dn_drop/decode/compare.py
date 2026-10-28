#!/usr/bin/env python3
"""Offline side-by-side comparison for the FF8 lot-14 texture campaign.

Given a scene dir containing decoded PNGs (rendered by ff8dump v2 --texture)
and operator reference screenshots (ref*.png/jpg/bmp), produces one labelled
side-by-side PNG per pair into out/compare/.

Stdlib + Pillow only.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent          # tools/_tmp_af3dn_drop/decode/


def collect(dirpath: Path, pattern_prefixes=('frame_', 'ref')):
    """Return sorted file list in dirpath matching prefix/suffix rules."""
    if not dirpath.exists():
        return []
    out = [p for p in dirpath.iterdir()
           if p.is_file()
           and p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.bmp')]
    # filter on prefix
    return sorted([p for p in out if any(p.name.startswith(pref) for pref in pattern_prefixes)])


def build_pair_png(dec_png: Path, ref_png: Path | None, out_png: Path) -> bool:
    """Compose a labeled side-by-side image. Returns ref_missing."""
    dec = Image.open(dec_png).convert('RGB')
    w, h = dec.size
    dec_label = 'DECODÉ (point-sampling v2, blend v1 opaque)'
    if ref_png is None:
        canvas = Image.new('RGB', (w, h + 24), (32, 32, 32))
        canvas.paste(dec, (0, 0))
        d = ImageDraw.Draw(canvas)
        d.text((8, h + 8), dec_png.name + '  (référence opérateur absente)',
               fill=(255, 220, 0))
        canvas.save(out_png)
        return True

    ref = Image.open(ref_png).convert('RGB')
    if ref.size != (w, h):
        ref = ref.resize((w, h), Image.NEAREST)
    ref_label = 'RÉFÉRENCE OPÉRATEUR (in-game capture)'
    canvas = Image.new('RGB', (w * 2 + 40, h + 28), (32, 32, 32))
    canvas.paste(dec, (0, 28))
    canvas.paste(ref, (w + 40, 28))
    d = ImageDraw.Draw(canvas)
    d.text((8, 6), dec_label, fill=(140, 255, 140))
    d.text((w + 48, 6), ref_label, fill=(140, 140, 255))
    canvas.save(out_png)
    return False


def main() -> int:
    ap = argparse.ArgumentParser(
        prog='compare.py',
        description='lot14: builds side-by-side PNGs (decoded left, operator ref right).')
    ap.add_argument('scene', help='scene name, e.g. menu / field / world / battle / fireaga')
    ap.add_argument('--out', default=None,
                    help='output dir override (default tools/_tmp_af3dn_drop/captures/lot14_out/compare/<scene>)')
    ap.add_argument('--scenes-root', default=None,
                    help='override root of <scene>/ capture dirs (default captures/lot14)')
    args = ap.parse_args()

    root = Path(args.scenes_root) if args.scenes_root else (HERE.parent / 'captures' / 'lot14')
    scene_dir = root / args.scene
    dec_dir = scene_dir / 'decode' if (scene_dir / 'decode').exists() else (
        next((p for p in sorted(scene_dir.glob('decode_*')) if p.is_dir()), scene_dir))
    ref_dir = scene_dir / 'refs' if (scene_dir / 'refs').exists() else scene_dir

    if not scene_dir.exists():
        print(f'error: scene dir not found: {scene_dir}', file=__import__('sys').stderr)
        return 2

    dec_pngs = collect(dec_dir, ('frame_',))
    ref_pngs = collect(ref_dir, ('ref',))
    if not dec_pngs and not ref_pngs:
        print(f'error: no decode PNG and no refs in {scene_dir}', file=__import__('sys').stderr)
        return 2

    out_dir = Path(args.out) if args.out else root.parent / 'lot14_out' / 'compare' / args.scene
    out_dir.mkdir(parents=True, exist_ok=True)

    n = 0
    for i, dec in enumerate(dec_pngs[:6]):
        ref = ref_pngs[i] if i < len(ref_pngs) else (ref_pngs[-1] if ref_pngs else None)
        out = out_dir / f'pair_{dec.stem}.png'
        missing = build_pair_png(dec, ref, out)
        tag = 'ref missing' if missing else 'pair ok'
        print(f'{out.name}: {tag}')

    if ref_pngs and dec_pngs:
        print(f'{len(dec_pngs[:6])} pair(s) -> {out_dir}')
    elif dec_pngs and not ref_pngs:
        print(f'warning: 0 refs in {ref_dir} — decode frames labelled "ref missing"')
    return 0


if __name__ == '__main__':
    from sys import stderr  # noqa: F401
    raise SystemExit(main())
