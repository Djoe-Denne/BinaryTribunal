# -*- coding: utf-8 -*-
"""Skew correctement attribue au record PRECEDENT (gap apres record k -> slot/psize de k)."""
import struct, sys, collections

def audit(path):
    d = open(path, 'rb').read()
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
        if o + 32 > len(d):
            break
        m, slot, seq, ctx, na, geom, fails, psize = struct.unpack_from('<8I', d, o)
        recs.append((o, slot, seq, geom, fails, psize))
    print(f'=== {path}  len={len(d)} records={len(recs)} ===')
    skew = collections.Counter(); clean = collections.Counter(); other = collections.Counter()
    total_decl = 0
    for k in range(len(recs)):
        o, slot, seq, geom, fails, psize = recs[k]
        total_decl += 32 + psize
        if k + 1 < len(recs):
            gap = recs[k+1][0] - o
            exp = 32 + psize
            key = (slot, psize)
            if gap == exp: clean[key] += 1
            elif gap == exp + 2: skew[key] += 1
            else: other[key] += (gap - exp)
    print(f'  exact={sum(clean.values())}  +2={sum(skew.values())}  autre={len(other)} types')
    print(f'  somme declares = {total_decl} vs taille {len(d)}  delta = {len(d)-total_decl}')
    print('  skew +2 par (slot,psize):')
    for k in sorted(skew): print(f'    slot={k[0]} psize={k[1]} x{skew[k]}')
    print('  exact par (slot,psize) pour slot 51/60:')
    for k in sorted(clean):
        if k[0] in (51,60): print(f'    slot={k[0]} psize={k[1]} x{clean[k]}')
    if other:
        print('  gaps autres (delta cumule):')
        for k in sorted(other): print(f'    slot={k[0]} psize={k[1]} delta_cum={other[k]}')

for p in sys.argv[1:]:
    audit(p)
