#!/usr/bin/env python3
"""Test A: render ALL 16 frames of battle13, no alpha filter, count per-frame content."""
import sys, struct
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump
from PIL import Image

HERE = Path(r'tools\_tmp_af3dn_drop\captures\lot14\battle13')
data = (HERE / 'battle13.bin').read_bytes()
recs, warns, txt, trs = parse_dump(data)
tx_by_seq = {t.seq: t for t in txt}
tr_by_obj = {t.texobj: t for t in trs}
M_cache = {seq: struct.unpack('<524288H', t.mirror[:1048576]) for seq, t in tx_by_seq.items()}

def e(x): return (x << 3) | (x >> 2)
def exp3(w): return (e((w >> 10) & 0x1F), e((w >> 5) & 0x1F), e(w & 0x1F))

frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)

W, H = 640, 480
for seq in sorted(frames)[:16]:
    rs = [r for r in frames[seq] if r.slot == 51 and r.geom_kind == 2]
    M = M_cache.get(seq)
    if M is None:
        continue
    tx = tx_by_seq[seq]
    fb = Image.new('RGB', (W, H), (0, 0, 0))
    px = fb.load()
    st = {'tim': 0, 'mirror': 0, 'notex': 0, 'tris': 0, 'alpha_mid': 0}
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
                    st['notex'] += 1
                    continue
                pal_n = tr.pal_entries
                raw = tr.raw_clut
                def sample(u, v, tr=tr, gid=gid, w_=w_, h_=h_, pal_n=pal_n, raw=raw):
                    txl = int(u * w_) % w_
                    tyl = int(v * h_) % h_
                    idxb = tr.pixels[tyl * w_ + txl]
                    off = 4 * (pal_n * gid + idxb)
                    if off + 4 > len(raw):
                        return (0, 0, 0)
                    cw = struct.unpack_from('<I', raw, off)[0]
                    return (cw & 0xFF, (cw >> 8) & 0xFF, (cw >> 16) & 0xFF)
                st['tim'] += 1
            else:
                def sample(u, v, rec=rec, tx=tx, M=M):
                    txl = int(u * 256) & 0xFF
                    tyl = int(v * 256) & 0xFF
                    col = 64 + (txl >> 2)
                    wv = M[(tyl << 10) | col]
                    byt = (wv >> (8 * ((txl >> 1) & 1))) & 0xFF
                    v4 = (byt >> ((txl & 1) * 4)) & 0xF
                    c2 = (rec.clut & 0x7FFF) or (tx.clut_now & 0x7FFF)
                    base = ((c2 >> 6) << 10) | ((c2 & 0x3F) << 4)
                    return exp3(M[base + (v4 % 16)])
                st['mirror'] += 1
            ax, ay = a[0], a[1]; bx, by = b[0], b[1]; cx, cy = c[0], c[1]
            area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
            if area == 0:
                continue
            dr = (a[4] >> 16) & 0xFF; dg = (a[4] >> 8) & 0xFF; db_ = a[4] & 0xFF
            al = (a[4] >> 24) & 0xFF
            if al != 255:
                st['alpha_mid'] += 1
            minx = max(0, int(min(ax, bx, cx))); maxx = min(W - 1, int(max(ax, bx, cx)) + 1)
            miny = max(0, int(min(ay, by, cy))); maxy = min(H - 1, int(max(ay, by, cy)) + 1)
            st['tris'] += 1
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
    fb.save(str(HERE / f'all16_{seq:06d}.png'))
    colors = len(set(px[x, y] for x in range(0, W, 16) for y in range(0, H, 16)))
    print(f'seq {seq}: tris={st["tris"]} tim={st["tim"]} mirror={st["mirror"]} alpha_mid={st["alpha_mid"]} sampled-colors~{colors}')
print('done')
