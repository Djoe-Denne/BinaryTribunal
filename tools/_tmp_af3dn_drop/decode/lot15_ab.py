#!/usr/bin/env python3
"""Lot 15 offline tests on battle13 dump:
A) LUT channel order A/B: (a) byte0=R,byte1=G,byte2=B (current), (b) byte2=R,byte1=G,byte0=B (BGR order)
B) Upscale 800x600 for side-by-side
C) Semi-transparent blend (50%) for alpha=127 tris
Canari = sky must be BLUE (not orange).
Outputs: LOT15_ab_dec(a).png, LOT15_ab_dec(b).png, LOT15_ab_pair.png, LOT15_upscaled800.png
"""
import sys, struct, os
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump
from PIL import Image, ImageDraw

HERE = Path(r'tools\_tmp_af3dn_drop\captures\lot14\battle13')
OUT = HERE
data = (HERE / 'battle13.bin').read_bytes()
recs, warns, txt, trs = parse_dump(data)
tx_by_seq = {t.seq: t for t in txt}
tr_by_obj = {t.texobj: t for t in trs}

frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)
# pick same frame as render_tim.py (seq index 8)
seq = sorted(frames)[8]
rs = [r for r in frames[seq] if r.slot == 51 and r.geom_kind == 2]
print(f'frame {seq}: {len(rs)} slot-51 records')

# find the sky/background tris: usually large tris with low diffuse alpha / late slot 51
# For A/B we rerender the *ENTIRE* frame and check the upper band color.

W, H = 640, 480

def render(rgb_order, alpha_blend=False, out_name='LOT15_dec.png', upscale=False):
    fb = Image.new('RGB', (W, H), (0, 0, 0))
    px = fb.load()
    stats = {'tim': 0, 'mirror': 0, 'notex': 0, 'tris': 0, 'blend': 0}
    for rec in rs:
        texobj = getattr(rec, 'texobj', 0)
        tr = tr_by_obj.get(texobj)
        ids = list(rec.ids) if rec.ids else [0]
        verts = list(struct.iter_unpack('<4f2I2f', rec.fvf))
        icount = rec.icount
        idx = struct.unpack(f'<{icount}H', rec.indices) if icount else ()
        tris = []
        if idx:
            for i in range(0, len(idx) - len(idx) % 3, 3):
                tris.append((verts[idx[i]], verts[idx[i+1]], verts[idx[i+2]]))
        else:
            for i in range(0, len(verts) - len(verts) % 3, 3):
                tris.append((verts[i], verts[i+1], verts[i+2]))
        per_t = max(1, rec.vcount // 4)
        for ti, (a, b, c) in enumerate(tris):
            g = (ti * 2) // per_t if per_t else 0
            gid = ids[g] if g < len(ids) else ids[-1]
            if tr and tr.raw_clut:
                w_, h_ = tr.w, tr.h
                if w_ == 0 or h_ == 0:
                    continue
                pal_n = tr.pal_entries
                raw = tr.raw_clut
                def sample(u, v):
                    txl = int(u * w_) % w_
                    tyl = int(v * h_) % h_
                    idxb = tr.pixels[tyl * w_ + txl]
                    off = 4 * (pal_n * gid + idxb)
                    if off + 4 > len(raw):
                        return (0, 0, 0)
                    cw = struct.unpack_from('<I', raw, off)[0]
                    b0, b1, b2, b3 = (cw & 0xFF), (cw >> 8) & 0xFF, (cw >> 16) & 0xFF, (cw >> 24) & 0xFF
                    if rgb_order == 'rgb':
                        r_, g_, b_ = b0, b1, b2
                    else:
                        r_, g_, b_ = b2, b1, b0
                    return (r_, g_, b_)
                stats['tim'] += 1
            else:
                def sample(u, v):
                    return (0, 0, 0)
                stats['notex'] += 1
                continue  # skip no-texture tri for A/B clarity
            ax, ay = a[0], a[1]; bx, by = b[0], b[1]; cx, cy = c[0], c[1]
            area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
            if area == 0:
                continue
            dr = (a[4] >> 16) & 0xFF; dg = (a[4] >> 8) & 0xFF; db_ = a[4] & 0xFF
            al = (a[4] >> 24) & 0xFF
            if al < 8:
                continue
            if alpha_blend and al < 250:
                stats['blend'] += 1
                blend_frac = 0.5
            else:
                blend_frac = 1.0
            minx = max(0, int(min(ax, bx, cx))); maxx = min(W - 1, int(max(ax, bx, cx)) + 1)
            miny = max(0, int(min(ay, by, cy))); maxy = min(H - 1, int(max(ay, by, cy)) + 1)
            for Y in range(miny, maxy + 1):
                for X in range(minx, maxx + 1):
                    w0 = (bx - ax) * (Y - ay) - (by - ay) * (X - ax)
                    w1 = (cx - bx) * (Y - by) - (cy - by) * (X - bx)
                    w2 = (ax - cx) * (Y - cy) - (ay - cy) * (X - cx)
                    if (w0 < 0) != (area < 0) or (w1 < 0) != (area < 0) or (w2 < 0) != (area < 0):
                        continue
                    uf = (w0 * a[6] + w1 * b[6] + w2 * c[6]) / area
                    vf = (w0 * a[7] + w1 * b[7] + w2 * c[7]) / area
                    r_, g_, b_ = sample(uf, vf)
                    r_ = r_ * dr // 255; g_ = g_ * dg // 255; b_ = b_ * db_ // 255
                    if blend_frac < 1.0:
                        cur = px[X, Y]
                        r_ = int(r_ * blend_frac + cur[0] * (1 - blend_frac))
                        g_ = int(g_ * blend_frac + cur[1] * (1 - blend_frac))
                        b_ = int(b_ * blend_frac + cur[2] * (1 - blend_frac))
                    px[X, Y] = (r_, g_, b_)
    if upscale:
        big = fb.resize((800, 600), Image.LANCZOS)  # smooth upscale (test B)
        big.save(str(OUT / out_name))
        return big
    fb.save(str(OUT / out_name))
    return fb

# --- A/B render
img_a = render('rgb', out_name='LOT15_ab_dec(a)_rgb.png')
img_b = render('bgr', out_name='LOT15_ab_dec(b)_bgr.png')
img_up = render('bgr', alpha_blend=True, out_name='LOT15_upscaled800_bgr_blend.png', upscale=True)
# drop-in ref
ref_candidates = list((HERE / 'refs').glob('ref*')) or list(HERE.glob('ref*'))
ref_path = ref_candidates[0]
ref = Image.open(ref_path).convert('RGB')
print('ref size', ref.size, ref_path.name)

# pair side-by-side (b) + ref upscaled same size
refu = ref.resize((800, 600), Image.NEAREST)
canvas = Image.new('RGB', (800 * 3 + 60, 600 + 28), (32, 32, 32))
d = ImageDraw.Draw(canvas)
d.text((8, 6), 'DEC (a) RGB  bytes 0,1,2 = R,G,B', fill=(140, 255, 140))
d.text((800 + 28, 6), 'DEC (b) BGR-reversed', fill=(255, 255, 100))
d.text((1600 + 48, 6), 'REF (800x600 nearest)', fill=(140, 140, 255))
canvas.paste(img_b.resize((800, 600), Image.NEAREST), (0, 28))
canvas.paste(img_up, (800 + 28, 28))
canvas.paste(refu, (1600 + 56, 28))
canvas.save(str(OUT / 'LOT15_ab_pair.png'))
print('---')
print('wrote', OUT / 'LOT15_ab_pair.png')

# quick band-color check on the top band (sky) of both versions & ref
def sky_color(im, name):
    im_rgb = im.convert('RGB')
    w, h = im_rgb.size
    bux = im_rgb.load()
    top = [0, 0, 0]
    n = 0
    for y in range(h // 10):
        for x in range(0, w, 4):
            r, g, b = bux[x, y]
            top[0] += r; top[1] += g; top[2] += b; n += 1
    avg = tuple(v // max(1, n) for v in top)
    print(f'sky_band {name}: avg {avg}')
    return avg

sky_color(img_a, 'dec-a-rgb')
sky_color(img_b, 'dec-b-bgr')
sky_color(ref, 'ref')
