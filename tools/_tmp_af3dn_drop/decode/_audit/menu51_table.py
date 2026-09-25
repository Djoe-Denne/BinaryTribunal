# -*- coding: utf-8 -*-
import struct
d = open(r"tools\_tmp_af3dn_drop\captures\menu.bin", 'rb').read()
offs = []
i = 0
while True:
    j = d.find(b'ND07', i)
    if j < 0:
        break
    offs.append(j)
    i = j + 4
recs = []
for o in offs:
    m, slot, seq, ctx, na, geom, fails, psize = struct.unpack_from('<8I', d, o)
    recs.append((o, slot, seq, geom, psize))
print('slot psize    vc  ic  skew')
for k in range(len(recs) - 1):
    o, slot, seq, geom, psize = recs[k]
    if slot != 51:
        continue
    vc, ic = struct.unpack_from('<II', d, o + 56)
    gap = recs[k + 1][0] - o
    sk = '+2' if gap == 32 + psize + 2 else '=0'
    print(f'{slot:4d} {psize:6d} {vc:4d}{ic:4d}  {sk}')
