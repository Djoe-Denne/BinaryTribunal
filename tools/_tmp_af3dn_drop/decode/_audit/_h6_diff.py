# -*- coding: utf-8 -*-
"""Diff h6_ring.bin (ring state before flush) vs h6_file.bin (what the flush wrote)."""
r = open(r'tools\_tmp_af3dn_drop\decode\_audit\h6_ring.bin', 'rb').read()
f = open(r'tools\_tmp_af3dn_drop\decode\_audit\h6_file.bin', 'rb').read()
print('ring len', len(r), 'file len', len(f))
n = min(len(r), len(f))
diffs = [i for i in range(n) if r[i] != f[i]]
print('num diffs (same-length prefix):', len(diffs))
if diffs:
    first = diffs[0]
    print('first diff at', first)
    # find where the shift becomes constant +1
    shift = None
    for i in diffs[:5]:
        print(f'  @{i}: ring={r[i]:02x} file={f[i]:02x}')
    # detect insertion point: file[k] == ring[k-1] for k >= P
    P = None
    for p in range(0, n):
        ok = all(f[k] == r[k - 1] for k in range(p, min(p + 32, n))) if p >= 1 else False
        if ok and p >= 1:
            P = p
            break
    print('insertion point candidate P =', P, ' inserted byte =', f[P] if P is not None else None)
    print('context around P: ring', r[max(0,P-8):P+8].hex(' '))
    print('context around P: file', f[max(0,P-8):P+9].hex(' '))
# tail check: last bytes of file vs ring
print('ring [1320..1328):', r[1320:1328].hex(' '))
print('file [1321..1325):', f[1321:len(f)].hex(' '))

# Also: does the file parse as valid records per contract?
import struct
pos = 0
while pos + 32 <= len(f):
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', f, pos)
    if magic != 0x3730444E:
        print(f'bad magic at {pos}: {f[pos:pos+4].hex(" ")}')
        break
    print(f'rec@{pos}: slot={slot} kind={kind} psize={psize}')
    nxt = pos + 32 + psize
    print(f'  next magic candidate at {nxt}: {f[nxt:nxt+4].hex(" ")}')
    pos = nxt
print('end walk at', pos, 'file len', len(f))
