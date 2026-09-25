# -*- coding: utf-8 -*-
"""Exports corrects + desassembly GFXPT_DumpNode via capstone."""
import struct

path = r"docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll"
d = open(path, 'rb').read()
e = struct.unpack_from('<I', d, 0x3C)[0]
coff = e + 4
nsec = struct.unpack_from('<H', d, coff + 2)[0]
opt_size = struct.unpack_from('<H', d, coff + 16)[0]
opt = coff + 20
secs = []
so = opt + opt_size
for i in range(nsec):
    s = so + i * 40
    name = ''.join(c if 32 <= ord(c) < 127 else '?' for c in d[s:s+8].rstrip(b'\0').decode('latin-1'))
    vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
    secs.append(dict(name=name, va=va, vsize=vsize, roff=roff, rsize=rsize))

def r2o(rva):
    for s in secs:
        if s['va'] <= rva < s['va'] + s['vsize']:
            off = rva - s['va']
            if off < s['rsize']:
                return s['roff'] + off
    return None

exp_rva = struct.unpack_from('<I', d, opt + 96)[0]
eo = r2o(exp_rva)
print('exp dir @file', hex(eo))
raw = d[eo:eo+40]
(charac, stamp, majv, minv, nameRva, base, nfuncs, nnames,
 afn, anm, aord) = struct.unpack('<IIHHIIIIIII', raw)
print(f'nfuncs={nfuncs} nnames={nnames} afn=0x{afn:X} anm=0x{anm:X} aord=0x{aord:X}')
fo, no, oo = r2o(afn), r2o(anm), r2o(aord)
for i in range(nnames):
    nva = struct.unpack_from('<I', d, no + i*4)[0]
    noff = r2o(nva)
    end = d.index(b'\0', noff)
    nm = d[noff:end].decode('latin-1')
    ordinal = struct.unpack_from('<H', d, oo + i*2)[0]
    fn_rva = struct.unpack_from('<I', d, fo + ordinal*4)[0]
    fwd = ''
    if exp_rva <= fn_rva < exp_rva + 0x324:
        fo2 = r2o(fn_rva)
        end2 = d.index(b'\0', fo2)
        fwd = ' -> forward ' + d[fo2:end2].decode('latin-1')
    print(f'  {nm:35s} ord={ordinal:2d} RVA 0x{fn_rva:06X}{fwd}')
