import struct

data = open(r'tools\_tmp_af3dn_drop\captures\menu.bin', 'rb').read()

def probe(off):
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, off)
    print(f'=== off={off} slot={slot} psize={psize} node={node_addr:#x}')
    vc, ic = struct.unpack_from('<2I', data, off + 32 + 24)
    idx_b = ic * 2
    idx0 = off + 32 + 24 + 8
    ids = struct.unpack_from(f'<{ic}H', data, idx0)
    print(f'vc={vc} ic={ic} caught-idx-words: {list(ids)}')
    exp = [(2,1,0,3,1,2) for _ in range(vc//4)]
    pat = [v + g*4 for g in range(vc//4) for v in (2,1,0,3,1,2)]
    if ic == vc//4*6:
        for g in range(vc//4):
            seg = ids[g*6:(g+1)*6]
            ok = all(seg[i] == pat[g*6+i] for i in range(len(seg)))
            print(f'  group {g}: captured={seg} expected_base+pat={[p+g*4 for p in (2,1,0,3,1,2)]} match={ok}')
    after = idx0 + idx_b
    print(f'  after idx @ {after}: {data[after:after+6].hex(" ")}')
    fvf_end_decl = off + 32 + psize
    fvf_end_real  = after + 2 + vc*32
    print(f'  fvf declared end={fvf_end_decl} real end={fvf_end_real} (diff {fvf_end_real-fvf_end_decl})')
    fvf0 = after + 2
    v0 = data[fvf0:fvf0+32]
    x0, y0, z0, rhw0 = struct.unpack_from('<4f', v0, 0)
    print(f'  fvf@+2: v0 X={x0:.2f} Y={y0:.2f} Z={z0:.4f} rhw={rhw0:.4f} diff={struct.unpack_from("<I",v0,16)[0]:#x} U={struct.unpack_from("<f",v0,24)[0]:.4f}')
    vlast = data[fvf0 + (vc-1)*32 : fvf0 + vc*32]
    xl, yl = struct.unpack_from('<2f', vlast, 0)
    print(f'  fvf@+2: vLast X={xl:.2f} Y={yl:.2f}')
    # also try fvf at declared alignment (no +2) to show misalignment
    v0b = data[after:after+32]
    x0b = struct.unpack_from('<f', v0b, 0)[0]
    print(f'  fvf@+0 (declared): v0 X = {x0b!r}')

for o in (56, 1438, 3520, 67198, 69280):
    probe(o)
