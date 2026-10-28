#!/usr/bin/env python3
"""Battle9 texture decode experiment: per-group sub-palette rendering.

Hypothesis under test (battle TIM sprites, slot 51 VB batch):
  - texture = 4bpp page (mode 0), tpage from the dense-tile scan
  - per GROUP: palette = 16 u16 at mirror word ((clut_g >> 6) << 10) | ((clut_g & 0x3F) << 4)
    where clut_g = base_clut + ids[g] (or absolute ids[g] -- both tried)
  - the ND08 footer's clut field = base clut of the node
"""
import sys, struct, glob
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump
from PIL import Image

HERE = Path(r'tools\_tmp_af3dn_drop\captures\lot14\battle9')
data = (HERE / 'battle9.bin').read_bytes()
recs, warns, txt = parse_dump(data)
tx = txt[0]
M = struct.unpack('<524288H', tx.mirror[:1048576])

def palette(clut_id):
    """16 u16 at mirror word ((c>>6)<<10)|((c&0x3F)<<4)."""
    c = clut_id & 0x7FFF
    base = ((c >> 6) << 10) | ((c & 0x3F) << 4)
    return M[base:base + 16]

def expand(w):
    e = lambda x: (x << 3) | (x >> 2)
    return (e((w >> 10) & 0x1F), e((w >> 5) & 0x1F), e(w & 0x1F))

# Dense battle tiles (from the earlier scan): rows 0..255, tx 0..4 / 10..14
TPAGES = [0, 1, 2, 3, 4, 10, 11, 12, 13, 14]

# take one mid frame's records, slot 51 only, group them
frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)
seq = sorted(frames)[8]
rs = [r for r in frames[seq] if r.slot == 51 and r.geom_kind == 2]

W, H = 640, 480
for tpage in TPAGES:
    fb = Image.new('RGB', (W, H), (0, 0, 0))
    px = fb.load()
    base_clut = rs[0].clut
    for rec in rs:
        ids = list(rec.ids) if rec.ids else [0]
        vcount, icount = rec.vcount, rec.icount
        pad = (4 - (icount * 2 % 4)) % 4
        fvf = rec.fvf
        verts = list(struct.iter_unpack('<4f2I2f', fvf))
        idx = struct.unpack(f'<{icount}H', rec.indices) if icount else ()
        tris = []
        if idx:
            for i in range(0, len(idx) - len(idx) % 3, 3):
                tris.append((verts[idx[i]], verts[idx[i+1]], verts[idx[i+2]]))
        else:
            for i in range(0, len(verts) - len(verts) % 3, 3):
                tris.append((verts[i], verts[i+1], verts[i+2]))
        # per-triangle: group id = triangle index // (per-group tris) -- perV=4 perI=6
        per_t = max(1, (rec.vcount // 4))   # tris per group if FT4 quads
        for ti, (a, b, c) in enumerate(tris):
            g = (ti * 2) // per_t if per_t else 0          # 2 tris per quad-group
            gid = ids[g] if g < len(ids) else ids[-1]
            pal = palette(base_clut + gid)
            cols = [expand(pal[(int(v[6] * 256) >> 2) & 0xF]) if False else None for v in ()]
            # sample UVs from the 3 vertices (average for a flat probe)
            us = [v[6] for v in (a, b, c)]
            vs = [v[7] for v in (a, b, c)]
            # rasterize via bbox+barycentric (quick)
            ax, ay = a[0], a[1]; bx, by = b[0], b[1]; cx, cy = c[0], c[1]
            area = (bx-ax)*(cy-ay) - (by-ay)*(cx-ax)
            if area == 0: continue
            minx = max(0, int(min(ax,bx,cx))); maxx = min(W-1, int(max(ax,bx,cx))+1)
            miny = max(0, int(min(ay,by,cy))); maxy = min(H-1, int(max(ay,by,cy))+1)
            dr, dg, db_, _al = ((a[4] >> 16) & 0xFF, (a[4] >> 8) & 0xFF, a[4] & 0xFF, (a[4] >> 24) & 0xFF)
            for Y in range(miny, maxy+1):
                for X in range(minx, maxx+1):
                    w0 = (bx-ax)*(Y-ay) - (by-ay)*(X-ax)
                    w1 = (cx-bx)*(Y-by) - (cy-by)*(X-bx)
                    w2 = (ax-cx)*(Y-cy) - (ay-cy)*(X-cx)
                    if (w0 < 0) != (area < 0) or (w1 < 0) != (area < 0) or (w2 < 0) != (area < 0):
                        continue
                    uf = (w0*us[0] + w1*us[1] + w2*us[2]) / area
                    vf = (w0*vs[0] + w1*vs[1] + w2*vs[2]) / area
                    txl = int(uf * 256) & 0xFF
                    tyl = int(vf * 256) & 0xFF
                    # 4bpp page: word at ((tpage&0xF)*64 + (txl>>2)) col, row tyl
                    col = ((tpage & 0xF) * 64) + (txl >> 2)
                    wv = M[(tyl << 10) | col]
                    byt = (wv >> (8 * ((txl >> 1) & 1))) & 0xFF
                    v4 = (byt >> ((txl & 1) * 4)) & 0xF
                    pr, pg, pb = expand(pal[v4])
                    px[X, Y] = ((pr * dr + 127) // 255, (pg * dg + 127) // 255, (pb * db_ + 127) // 255)
    fb.save(HERE / f'exp_t{tpage}.png')
    print(f'tpage {tpage}: saved')
print('done')
