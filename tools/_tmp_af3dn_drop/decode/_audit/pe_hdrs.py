# -*- coding: utf-8 -*-
import struct
for path in [r"C:\Users\djden\AppData\Local\Temp\opencode\v7smoke\gfx_driver_passthrough.dll", r"docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll"]:
    d = open(path, 'rb').read()
    e = struct.unpack_from('<I', d, 0x3C)[0]
    coff = e + 4
    nsec, = struct.unpack_from('<H', d, coff + 2)
    opt_size, = struct.unpack_from('<H', d, coff + 16)
    opt = coff + 20
    exp_rva, exp_size = struct.unpack_from('<II', d, opt + 96)
    print(path.split('\\')[-1], 'nsec', nsec, 'exp_rva', hex(exp_rva), 'exp_size', hex(exp_size), 'len', len(d))
    so = opt + opt_size
    for i in range(nsec):
        s = so + i * 40
        name = d[s:s+8].rstrip(b'\0').decode('latin-1')
        name = ''.join(c if 32 <= ord(c) < 127 else '?' for c in name)
        vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
        print(f'  {name:8s} va={va:#x} vs={vsize:#x} ro={roff:#x} rs={rsize:#x}')
