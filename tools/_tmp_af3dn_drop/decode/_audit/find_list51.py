# -*- coding: utf-8 -*-
"""Trouve Proxy_List51 (wrapper slot 51) : la fonction qui appelle GFXPT_DumpNode
(0x1910) avec 51 (0x33) en premier push, et Proxy_List60."""
import struct
from capstone import Cs, CS_ARCH_X86, CS_MODE_32

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
    vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
    secs.append((va, vsize, roff, rsize))
va0, vsize0, roff0, rsize0 = secs[0]
text = d[roff0:roff0 + rsize0]

md = Cs(CS_ARCH_X86, CS_MODE_32)
# scan tout le .text : instruction push 0x33 suivi (proche) d'un call 0x1910
import re
hits = []
code = text
for m in re.finditer(b'\x6a\x33', code):
    off = m.start()
    rva = 0x1000 + off
    chunk = code[off:off + 64]
    ins = list(md.disasm(chunk, rva))
    txt = ' ; '.join(f'{i.mnemonic} {i.op_str}' for i in ins[:8])
    if 'call 0x1910' in txt:
        hits.append((rva, txt))
for rva, txt in hits:
    print(f'push 0x33 + call DumpNode @ RVA 0x{rva:06X}: {txt}')
# idem 0x3C (60)
hits60 = []
for m in re.finditer(b'\x6a\x3c', code):
    off = m.start()
    rva = 0x1000 + off
    chunk = code[off:off + 64]
    ins = list(md.disasm(chunk, rva))
    txt = ' ; '.join(f'{i.mnemonic} {i.op_str}' for i in ins[:8])
    if 'call 0x1910' in txt:
        hits60.append((rva, txt))
for rva, txt in hits60:
    print(f'push 0x3c + call DumpNode @ RVA 0x{rva:06X}: {txt}')
