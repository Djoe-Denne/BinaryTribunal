# -*- coding: utf-8 -*-
"""Audit skew de tous les dumps live de la campagne : stride vs declare, par slot/psize."""
import struct, sys, collections

def audit(path, maxrec=None):
    d = open(path, 'rb').read()
    offs = []
    i = 0
    while True:
        j = d.find(b'ND07', i)
        if j < 0:
            break
        offs.append(j)
        i = j + 4
    print(f'=== {path}  len={len(d)} records={len(offs)} ===')
    skew = collections.Counter()
    clean = collections.Counter()
    prev = None
    bad_magic_gaps = 0
    for k, o in enumerate(offs):
        if o + 32 > len(d):
            print('  truncated header at', o)
            break
        magic, slot, seq, ctx, na, geom, fails, psize = struct.unpack_from('<8I', d, o)
        if prev is not None:
            gap = o - prev
            exp = 32 + prev_psize
            key = (slot, prev_psize)
            if gap == exp:
                clean[key] += 1
            elif gap == exp + 2:
                skew[key] += 1
            else:
                print(f'  ANOMALIE autre: gap={gap} exp={exp} @off {o} slot={slot} psize={prev_psize}')
        prev = o
        prev_psize = psize
        if maxrec and k >= maxrec:
            break
    # fin de fichier vs dernier record declare
    if offs:
        last = offs[-1]
        psize = struct.unpack_from('<I', d, last + 28)[0]
        print(f'  tail: dernier record fin declaree = {last+32+psize}, fichier = {len(d)}')
    tot_skew = sum(skew.values()); tot_clean = sum(clean.values())
    print(f'  strides exacts: {tot_clean}, strides +2: {tot_skew}')
    for key, n in sorted(skew.items()):
        print(f'    +2  slot={key[0]} psize={key[1]}  x{n}')
    for key, n in sorted(clean.items()):
        if key[0] in (51, 60):
            print(f'    =0  slot={key[0]} psize={key[1]}  x{n}')
    # somme des declares vs taille fichier
    tot_decl = sum(32 + struct.unpack_from('<I', d, o + 28)[0] for o in offs if o + 32 <= len(d))
    print(f'  somme declares (32+psize) = {tot_decl}  vs taille fichier = {len(d)}  delta = {len(d)-tot_decl}')

for p in sys.argv[1:]:
    audit(p)
