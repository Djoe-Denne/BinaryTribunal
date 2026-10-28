#!/usr/bin/env python3
"""Disassemble the function containing the 0x3730444E store in a PE (x86, capstone)."""
import struct, sys
from capstone import Cs, CS_ARCH_X86, CS_MODE_32

def load(path):
    data = open(path, 'rb').read()
    e = struct.unpack_from('<I', data, 0x3C)[0]
    nsec = struct.unpack_from('<H', data, e + 6)[0]
    optsz = struct.unpack_from('<H', data, e + 20)[0]
    base = struct.unpack_from('<I', data, e + 24 + 28)[0]
    secs = []
    for i in range(nsec):
        s = e + 24 + optsz + 40 * i
        name = data[s:s+8].decode('ascii', 'ignore').rstrip('\x00')
        vsize, vaddr, rsize, roff = struct.unpack_from('<4I', data, s + 8)
        secs.append((vaddr, max(vsize, rsize), roff, rsize))
    return data, base, secs

def rva2off(rva, secs):
    for vaddr, vsize, roff, rsize in secs:
        if vaddr <= rva < vaddr + vsize:
            return roff + (rva - vaddr)
    return None

def disasm_func(path, file_off, back=0x40, length=0x1400, stop_on_ret=True):
    data, base, secs = load(path)
    # find function start: scan back for int3 padding (CC) or ret before hit
    fs = file_off
    i = file_off - 1
    while i > file_off - back and i > 0:
        if data[i] == 0xCC:
            fs = i + 1
            break
        i -= 1
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    code = data[fs:fs + length]
    out = []
    for ins in md.disasm(code, base + rva2off_off(file_off, secs) - rva2off_off(fs, secs) + (base if False else 0) or fs):
        pass
    return out

def rva2off_off(foff, secs):
    for vaddr, vsize, roff, rsize in secs:
        if roff <= foff < roff + rsize:
            return vaddr + (foff - roff)
    return None

def main(path, file_off, length=0x1600):
    data, base, secs = load(path)
    # function start: scan back for CC padding
    fs = file_off
    i = file_off - 1
    while i > file_off - 0x80 and i > 0:
        if data[i] == 0xCC and data[i-1] == 0xCC:
            fs = i + 1
            break
        i -= 1
    if fs == file_off:  # no padding found: scan for standard prologue push ebp; mov ebp,esp
        j = file_off - 1
        while j > file_off - 0x200 and j > 1:
            if data[j] == 0x55 and data[j+1] == 0x8B and data[j+2] == 0xEC:
                fs = j
                break
            j -= 1
    va = base + rva2off_off(fs, secs)
    print(f'func start file=0x{fs:x} va=0x{va:08x} (image base 0x{base:x})')
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    code = data[fs:fs + length]
    n = 0
    for ins in md.disasm(code, va):
        print(f'  0x{ins.address:08x}: {ins.mnemonic:9} {ins.op_str}')
        n += 1
        if ins.mnemonic == 'ret' and n > 40:
            print('  --- ret (func end?)')
            break
    print(f'  ({n} instrs)')

if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2], 0), int(sys.argv[3], 0) if len(sys.argv) > 3 else 0x1600)
