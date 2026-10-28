#!/usr/bin/env python3
"""Disassemble FF8_EN.exe 0x43E356..0x43E540 (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB)."""
import struct, sys
from capstone import Cs, CS_ARCH_X86, CS_MODE_32

EXE = r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe'
BASE = 0x400000

def load(path):
    data = open(path, 'rb').read()
    e = struct.unpack_from('<I', data, 0x3C)[0]
    nsec = struct.unpack_from('<H', data, e + 6)[0]
    optsz = struct.unpack_from('<H', data, e + 20)[0]
    secs = []
    for i in range(nsec):
        s = e + 24 + optsz + 40 * i
        name = data[s:s+8].decode('ascii', 'ignore').rstrip('\x00')
        vsize, vaddr, rsize, roff = struct.unpack_from('<4I', data, s + 8)
        secs.append((name, vaddr, max(vsize, rsize), roff, rsize))
    return data, secs

def va2off(va, secs):
    rva = va - BASE
    for name, vaddr, vsize, roff, rsize in secs:
        if vaddr <= rva < vaddr + vsize:
            return roff + (rva - vaddr)
    return None

def main():
    data, secs = load(EXE)
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    start_va = 0x43E356
    end_va = 0x43E545
    off = va2off(start_va, secs)
    code = data[off:off + (end_va - start_va)]
    for ins in md.disasm(code, start_va):
        print(f'0x{ins.address:08x}: {ins.mnemonic:9} {ins.op_str}')

if __name__ == '__main__':
    main()
