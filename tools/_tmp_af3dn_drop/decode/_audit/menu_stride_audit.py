# -*- coding: utf-8 -*-
"""Parse menu.bin : strides reels entre magic ND07, frontieres, skew."""
import struct, sys

path = r"tools\_tmp_af3dn_drop\captures\menu.bin"
d = open(path, 'rb').read()
print('file len', len(d))

MAGIC = 0x3730444E  # 'ND07'
offs = []
i = 0
while True:
    j = d.find(b'ND07', i)
    if j < 0:
        break
    offs.append(j)
    i = j + 1
print('records found:', len(offs))

prev_end = None
for k, o in enumerate(offs):
    if o + 32 > len(d):
        print('truncated hdr at', o); break
    magic, slot, seq, ctx, node_addr, geom, fails, psize = struct.unpack_from('<8I', d, o)
    gap = None if prev_end is None else o - prev_end
    expected = None if prev_end is None else 32 + prev_psize
    flag = '' if gap is None or gap == expected else f'  << stride {gap} vs expected {expected} (delta {gap - expected})'
    print(f'#{k:2d} off={o:7d} slot={slot} seq={seq} geom={geom} fails={fails} psize={psize} '
          f'total={32+psize} stride={gap}{flag}')
    prev_end = o + 32 + psize if False else o  # stride mesure magic->magic
    prev_psize = psize
    # dump premiers octets du payload: node[24] puis kind2: vcount,icount, idx..., fvf...
    p = o + 32
    node = d[p:p+24]
    vc, ic = struct.unpack_from('<II', d, p + 24)
    idxb = ic * 2
    pad = (4 - idxb % 4) % 4
    fvf_off = p + 24 + 8 + idxb + pad
    print(f'     node[0:8]={node[:8].hex()} vc={vc} ic={ic} idxb={idxb} pad={pad} fvf@rec+{fvf_off-o} '
          f'fvf[0:8]={d[fvf_off:fvf_off+8].hex()} fvf16[0:8]={d[fvf_off+16:fvf_off+24].hex()}')
    # si skew: chercher un prefixe u16 avant le debut X du grid attendu
    # grille: vertex = 32 o (nx.ny.nz.f32, x.y.z.f32, tu.tv.f32, b?, u2,v2?)
    # compare fvf[0:4] au motif attendu: X.f32 raisonnable (~petit float)
    xv = struct.unpack_from('<f', d, fvf_off)[0]
    print(f'     fvf[0] as f32 = {xv!r}')
