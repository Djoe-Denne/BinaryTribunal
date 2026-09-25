# -*- coding: utf-8 -*-
"""Disassembly GFXPT_DumpNode (RVA ~0x19D0) + Proxy_List51, capstone, A et B."""
import struct
from capstone import Cs, CS_ARCH_X86, CS_MODE_32

A = r"C:\Users\djden\AppData\Local\Temp\opencode\v7smoke\gfx_driver_passthrough.dll"
B = r"docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll"

def load(path):
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
    return d, secs

def text_of(path):
    d, secs = load(path)
    va, vsize, roff, rsize = secs[0]
    return d[roff:roff + rsize]

def disasm(ta, tb, rva_start, length, tagA, tagB):
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    off = rva_start - 0x1000
    code_a = ta[off:off + length]
    code_b = tb[off:off + length]
    if code_a == code_b:
        print(f'--- bytes identiques A/B sur [{rva_start:#x}..{rva_start+length:#x}) ---')
    ia = list(md.disasm(code_a, rva_start))
    ib = list(md.disasm(code_b, rva_start))
    same = len(ia) == len(ib) and all(a.bytes == b.bytes and a.mnemonic == b.mnemonic and a.op_str == b.op_str
                                      for a, b in zip(ia, ib))
    if same:
        print(f'--- disasm identique A/B, {len(ia)} instrs @ RVA {rva_start:#x} ---')
    for i, ins in enumerate(ia):
        if i < len(ib) and (ib[i].bytes != ins.bytes or ib[i].op_str != ins.op_str):
            print(f'A {ins.address:#x}: {ins.mnemonic} {ins.op_str}   ; {ins.bytes.hex()}')
            print(f'B {ib[i].address:#x}: {ib[i].mnemonic} {ib[i].op_str}   ; {ib[i].bytes.hex()}')
        else:
            print(f'= {ins.address:#x}: {ins.mnemonic} {ins.op_str}')

ta, tb = text_of(A), text_of(B)
print('text len', len(ta), len(tb), 'identical:', ta == tb)
# GFXPT_DumpNode ~0x19D0 : fenetre generee ; on prend une fenetre large de 0x1900 a 0x2000
disasm(ta, tb, 0x1900, 0x700, 'A', 'B')
