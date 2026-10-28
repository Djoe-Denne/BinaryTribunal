#!/usr/bin/env python3
"""LOT15 v11 render: TR08 TIM textures + per-group sub-palettes (adapted from render_tim.py).
Same logic, HERE/data pointed at captures\\lot15\\battle_v11, output FINAL_tim_v11.png."""
import sys, struct
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump
from PIL import Image

HERE = Path(r'tools\_tmp_af3dn_drop\captures\lot15\battle_v11')
TPAGE_FALLBACK = 1
data = (HERE / 'gfx_passthrough_dump.bin').read_bytes()
recs, warns, txt, trs = parse_dump(data)
tx = txt[0]
M = struct.unpack('<524288H', tx.mirror[:1048576])

# texobj -> TR08 map
tr_by_obj = {t.texobj: t for t in trs}
print('TR08 objects:', [hex(k) for k in tr_by_obj])

def e(x): return (x << 3) | (x >> 2)
def exp3(w): return (e((w >> 10) & 0x1F), e((w >> 5) & 0x1F), e(w & 0x1F))

frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)
seq = sorted(frames)[8]
rs = [r for r in frames[seq] if r.slot == 51 and r.geom_kind == 2]
print(f'frame {seq}: {len(rs)} slot-51 records')

W, H = 640, 480
fb = Image.new('RGB', (W, H), (0, 0, 0))
px = fb.load()
stats = {'tim': 0, 'mirror': 0, 'flat': 0}
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
            # TIM path: pixel = 1 byte at [y*w + x]; color = raw_clut u32 at entries*gid + texel
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
                # LOT15 A/B CLOSED (2026-09-26): bytes 0,1,2 = R,G,B is CORRECT.
                r_ = cw & 0xFF; g_ = (cw >> 8) & 0xFF; b_ = (cw >> 16) & 0xFF
                return (r_, g_, b_)
            stats['tim'] += 1
        else:
            def sample(u, v):
                txl = int(u * 256) & 0xFF
                tyl = int(v * 256) & 0xFF
                col = ((TPAGE_FALLBACK & 0xF) * 64) + (txl >> 2)
                wv = M[(tyl << 10) | col]
                byt = (wv >> (8 * ((txl >> 1) & 1))) & 0xFF
                v4 = (byt >> ((txl & 1) * 4)) & 0xFF
                c2 = (rec.clut & 0x7FFF) or (tx.clut_now & 0x7FFF)
                base = ((c2 >> 6) << 10) | ((c2 & 0x3F) << 4)
                return exp3(M[base + (v4 % 16)])
            stats['mirror'] += 1
        ax, ay = a[0], a[1]; bx, by = b[0], b[1]; cx, cy = c[0], c[1]
        area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        if area == 0:
            continue
        dr = (a[4] >> 16) & 0xFF; dg = (a[4] >> 8) & 0xFF; db_ = a[4] & 0xFF
        al = (a[4] >> 24) & 0xFF
        if al < 8:
            continue
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
                px[X, Y] = ((r_ * dr + 127) // 255, (g_ * dg + 127) // 255, (b_ * db_ + 127) // 255)
out = HERE / 'FINAL_tim_v11.png'
fb.save(str(out))
print('stats:', stats)
print('saved:', out)
