# -*- coding: utf-8 -*-
"""Show the 2 bytes diff detail between A and B at RVA 0x1fb0c."""
import struct

def rva2off(path, rva):
    d = open(path, 'rb').read()
    e = struct.unpack_from('<I', d, 0x3C)[0]
    coff = e + 4
    nsec = struct.unpack_from('<H', d, coff + 2)[0]
    optsz = struct.unpack_from('<H', d, coff + 16)[0]
    so = coff + 20 + optsz
    for i in range(nsec):
        s = so + i * 40
        vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
        if va <= rva < va + max(vsize, rsize):
            return d, roff + (rva - va)
    return d, None

A = r"C:\Users\djden\AppData\Local\Temp\opencode\v7smoke\gfx_driver_passthrough.dll"
B = r"docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll"
da, oa = rva2off(A, 0x1fb0c)
db, ob = rva2off(B, 0x1fb0c)
print('A bytes @fileoff:', hex(ob), da[ob-8:ob+8].hex(' '))
print('B bytes @fileoff:', hex(ob), db[ob-8:ob+8].hex(' '))
# what string is this? dump surrounding ASCII
ctx = db[ob-64:ob+64]
print('B context ascii:', ''.join(chr(c) if 32 <= c < 127 else '.' for c in ctx))
ctxa = da[ob-64:ob+64]
print('A context ascii:', ''.join(chr(c) if 32 <= c < 127 else '.' for c in ctxa))
