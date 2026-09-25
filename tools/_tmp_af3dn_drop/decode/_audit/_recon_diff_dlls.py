# -*- coding: utf-8 -*-
"""Byte-level diff : DLL repo (53464B47) vs DLL smoke (2E417A66), stdlib pur."""
import struct

def sections(path):
    d = open(path, 'rb').read()
    e = struct.unpack_from('<I', d, 0x3C)[0]
    coff = e + 4
    nsec = struct.unpack_from('<H', d, coff + 2)[0]
    optsz = struct.unpack_from('<H', d, coff + 16)[0]
    so = coff + 20 + optsz
    out = []
    for i in range(nsec):
        s = so + i * 40
        name = d[s:s+8].rstrip(b'\0').decode('latin-1')
        vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
        out.append((name, va, vsize, roff, rsize))
    return d, out

A = r"C:\Users\djden\AppData\Local\Temp\opencode\v7smoke\gfx_driver_passthrough.dll"
B = r"docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll"
da, sa = sections(A)
db, sb = sections(B)
print('A len', len(da), 'B len', len(db), 'equal total:', da == db)
for (na, va, vs, ro, rs) in sa:
    nb = next((x for x in sb if x[0] == na), None)
    if nb is None:
        print('ABSENT IN B:', na); continue
    a = da[ro:ro+rs]
    b = db[nb[3]:nb[3]+nb[4]]
    nd = sum(1 for i in range(min(len(a), len(b))) if a[i] != b[i])
    print(f'section {na:8s} va={va:#x} len A={len(a)} len B={len(b)} diffbytes={nd}')
    if a != b:
        diffs = [i for i in range(min(len(a), len(b))) if a[i] != b[i]]
        print('   first diffs at RVA:', ', '.join(hex(va+i) for i in diffs[:8]))
