#!/usr/bin/env python3
"""Make an honest, read-only comparison of existing historical FF8 images.

No renderer/oracle is changed or rerun. This is not a same-frame fidelity test.
The destination must not already exist; source images are never overwritten.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def sha_file(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--native', type=Path, required=True)
    parser.add_argument('--replay', type=Path, required=True)
    parser.add_argument('--entities', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(argv)
    sources = [args.native.resolve(), args.replay.resolve(), args.entities.resolve()]
    before = [sha_file(path) for path in sources]
    args.out.mkdir(parents=True, exist_ok=False)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 21)
        small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    except OSError:
        font = small = ImageFont.load_default()
    width, height, gap = 800, 600, 16
    sheet = Image.new('RGB', (width * 3 + gap * 4, height + 210), '#171b21')
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 12), 'FF8 - avancement visuel historique : lot 20 / captures du 29 septembre 2026',
              fill='#f0f2f5', font=font)
    draw.text((gap, 46), 'Comparaison qualitative NON SYNCHRONISEE. Ce ne sont pas des resultats v17.',
              fill='#d6b982', font=small)
    labels = [('JEU NATIF - capture de reference', '20260929172809_1.jpg'),
              ('REPLAY BRUT EXISTANT - incomplet', 'Decors visibles, ciel incorrect, acteurs manquants'),
              ('COMPOSITE EXPERIMENTAL - entites', 'Acteurs textures visibles, decor et interface absents')]
    for index, (source, (label, subtitle)) in enumerate(zip(sources, labels)):
        x = gap + index * (width + gap)
        draw.text((x, 90), label, fill='#f0f2f5', font=font)
        draw.text((x, 124), subtitle, fill='#b3bbc6', font=small)
        with Image.open(source) as image:
            image = image.convert('RGB')
            scale = min(width / image.width, height / image.height)
            size = (round(image.width * scale), round(image.height * scale))
            # Nearest preserves existing pixels; no fabricated visual smoothing.
            image = image.resize(size, Image.Resampling.NEAREST)
            sheet.paste(image, (x + (width - size[0]) // 2, 162 + (height - size[1]) // 2))
    draw.text((gap, height + 176),
              'Stage0 : diagnostic de binding encore ouvert. Aucun score de fidelite, STP/depth/OT non inferes.',
              fill='#b3bbc6', font=small)
    output = args.out / 'FF8_visual_progress.png'
    sheet.save(output)
    after = [sha_file(path) for path in sources]
    if after != before:
        raise RuntimeError('source changed while generating the comparison')
    receipt = {'schema': 'ff8-visual-progress-v1', 'historical_lot': 20,
               'source_date': '2026-09-29', 'same_frame_proven': False,
               'v17_result': False, 'fidelity_score': None,
               'presentation': 'aspect-preserved nearest-neighbor resize, no crop',
               'sources': [{'role': role, 'path': str(path), 'sha256': digest}
                           for role, path, digest in zip(('native', 'raw_replay', 'experimental_entities'),
                                                         sources, before)],
               'sources_unchanged': True, 'script_sha256': sha_file(Path(__file__)),
               'output': str(output.resolve()), 'output_sha256': sha_file(output)}
    (args.out / 'provenance.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': receipt['output'], 'sha256': receipt['output_sha256'],
                      'sources_unchanged': True, 'same_frame_proven': False}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
