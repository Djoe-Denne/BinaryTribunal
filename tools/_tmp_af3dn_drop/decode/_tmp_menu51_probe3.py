#!/usr/bin/env python3
"""One-shot diagnostic v3: full REC1/REC3/REC5 payload analysis + FVF grid phase scan."""
import struct, sys

MAGIC = 0x3730444E
HDR = struct.Struct('<8I')

def f32(b, off):
    return struct.unpack_from('<f', b, off)[0]

def main(path):
    data = open(path, 'rb').read()
    n = len(data)
    # locate records like probe2
    pos, recs = 0, []
    while pos + 32 <= n:
        magic, slot, seq, ctx, node_addr, kind, fails, psize = HDR.unpack_from(data, pos)
        if magic != MAGIC:
            break
        recs.append((pos, slot, seq, psize, kind, node_addr))
        de = pos + 32 + psize
        found = None
        for d in range(0, 65):
            if de + d + 4 <= n:
                m, = struct.unpack_from('<I', data, de + d)
                if m == MAGIC:
                    found = d
                    break
        pos = de + (found or 0)
    # full records of interest
    for want in (1, 3, 5, 11, 13, 15):
        pos, slot, seq, psize, kind, naddr = recs[want]
        total = 32 + psize + (2 if slot in (51, 60) and psize > 200 else 0)
        print(f'--- REC{want} @{pos} slot={slot} psize={psize} node={naddr_s(naddr) if False else hex(naddr)}')
        hdr = data[pos:pos+32]
        h = HDR.unpack_from(data, pos)
        print('  hdr magic/sec:', [hex(x) for x in h])
        print('  node24 hex   : ' + data[pos+32:pos+56].hex(' '))
        v, i = struct.unpack_from('<2I', data, pos+56)
        idxb = i*2
        idx_off = pos+64
        pad = 2 if (idxb & 3) else 0
        blob = pos+64+idxb+pad
        print(f'  vcount={v} icount={i} idxb={idxb} pad={pad} blob_off=+{blob-pos}')
        print(f'  idx first 16: ' + data[idx_off].hex(' ') if False else '  idx first 16: ' + data[idx_off:idx_off+16].hex(' '))
        print(f'  idx last 16 : ' + data[idx_off+idxb-16:idx_off+idxb].hex(' '))
        # blob region: declared [blob, blob+v*32) plus extra (+2 actual for multigroup)
        print(f'  blob head 40: ' + data[blob:blob+40].hex(' '))
        tail_span = v*32 + 6
        print(f'  blob tail(decl, last 40): ' + data[blob+tail_span-46:blob+v*32].hex(' '))
        print(f'  after-blob {6}: ' + blob_after if False else f'  after-blob 6: ' + data[blob+v*32:blob+v*32+6].hex(' '))
        # FVF grid plausibility per phase p in {-2,0,+2}: vertex k at blob+p+32k
        for p in (-2, 0, 2):
            xs, ys, us, vs, spec_ok = [], [], [], [], 0
            cnt = 0
            for k in range(v):
                vo = blob + p + 32*k
                if vo + 32 > pos + 32 + psize + 2:
                    break
                try:
                    x = f32(data, vo)
                    y = f32(data, vo+4)
                    u = f32(data, vo+24)
                    vv = f32(data, vo+28)
                except Exception:
                    break
                xs.append(x); ys.append(y); us.append(u); vs.append(vv)
                spec, = struct.unpack_from('<I', data, vo+20)
                if spec in (0xFF000000, 0xFFFFFFFF, 0x00007FFF, 0x7FFF0000, 0):
                    spec_ok += 1
                cnt += 1
            if cnt:
                print(f'    phase {p:+d}: {cnt} verts  X[{min(xs):.3f},{max(xs):.3f}] Y[{min(ys):.3f},{max(ys):.3f}] '
                      f'U[{min(us):.4f},{max(us):.4f}] V[{min(vs):.4f},{max(vs):.4f}] spec-plausible={spec_ok}/{cnt}')

def naddr_s(a): return hex(a)

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
