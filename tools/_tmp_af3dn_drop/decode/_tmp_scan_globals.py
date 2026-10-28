#!/usr/bin/env python3
"""Scan whole .text of the deployed DLL for references to dump-ring globals."""
import struct, sys
from capstone import Cs, CS_ARCH_X86, CS_MODE_32

DLL = r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\AF3DN.P'

TARGETS = {
    0x10054e94: 'g_cursor_A(0x10054e94)',
    0x10054e98: 'g_ring_base',
    0x10054e9c: 'g_cnt_9c',
    0x10054ea0: 'g_cnt_a0',
    0x10054ea4: 'g_cnt_a4',
    0x10054ea8: 'g_cnt_a8',
    0x10054eac: 'g_cnt_ac',
    0x10054eb0: 'g_frameSeq',
    0x10054eb4: 'g_cnt_b4',
    0x10054eb8: 'g_cnt_b8',
    0x10054ebc: 'g_cnt_bc',
    0x10054ec0: 'g_cnt_c0',
}

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
        secs.append((name, vaddr, max(vsize, rsize), roff, rsize))
    return data, base, secs

def rva2off(rva, secs):
    for name, vaddr, vsize, roff, rsize in secs:
        if vaddr <= rva < vaddr + vsize:
            return roff + (rva - vaddr)
    return None

def main():
    data, base, secs = load(DLL)
    text = [s for s in secs if s[0] == '.text'][0]
    _, tv, tvs, tro, trs = text
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    code = data[tro:tro + trs]
    hits = {}
    for ins in md.disasm(code, base + tv):
        for t, label in TARGETS.items():
            if f'0x{t:x}' in ins.op_str:
                hits.setdefault(t, []).append((ins.address, ins.mnemonic, ins.op_str))
    for t, lst in sorted(hits.items()):
        print(f'== {TARGETS[t]} (0x{t:x}): {len(lst)} refs')
        for a, m, o in lst:
            print(f'   0x{a:08x}: {m:8} {o}')

if __name__ == '__main__':
    main()
