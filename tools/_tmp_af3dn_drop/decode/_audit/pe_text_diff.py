# -*- coding: utf-8 -*-
"""Diff .text de deux PE 32-bit, stdlib pur. Localise les divergences par RVA,
mappe sur exports/sections, dump hex autour des zones touchees."""
import struct, sys

def parse_pe(path):
    d = open(path, 'rb').read()
    e_lfanew = struct.unpack_from('<I', d, 0x3C)[0]
    assert d[e_lfanew:e_lfanew+4] == b'PE\0\0', 'not PE'
    coff = e_lfanew + 4
    nsec = struct.unpack_from('<H', d, coff + 2)[0]
    opt_size = struct.unpack_from('<H', d, coff + 16)[0]
    opt = coff + 20
    magic = struct.unpack_from('<H', d, opt)[0]
    assert magic == 0x10B, 'not PE32'
    image_base = struct.unpack_from('<I', d, opt + 28)[0]
    secs = []
    so = opt + opt_size
    for i in range(nsec):
        s = so + i * 40
        name = d[s:s+8].rstrip(b'\0').decode('ascii', 'replace')
        vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
        chars = struct.unpack_from('<I', d, s + 36)[0]
        secs.append(dict(name=name, va=va, vsize=vsize, roff=roff, rsize=rsize, chars=chars))
    # exports
    exp_rva, exp_size = struct.unpack_from('<II', d, opt + 96)
    exports = {}
    if exp_rva:
        def r2o(rva):
            for s in secs:
                if s['va'] <= rva < s['va'] + s['vsize']:
                    off = rva - s['va']
                    if off < s['rsize']:
                        return s['roff'] + off
            return None
        eo = r2o(exp_rva)
        nnames = struct.unpack_from('<I', d, eo + 20)[0]
        names_rva, ord_rva, eot_rva = struct.unpack_from('<III', d, eo + 32)
        no, oo = r2o(names_rva), r2o(ord_rva)
        for i in range(nnames):
            nva = struct.unpack_from('<I', d, no + i*4)[0]
            noff = r2o(nva)
            end = d.index(b'\0', noff)
            nm = d[noff:end].decode('ascii')
            ordinal = struct.unpack_from('<H', d, oo + i*2)[0]
            fn_rva = struct.unpack_from('<I', d, r2o(eot_rva) + ordinal*4)[0]
            exports[nm] = fn_rva
    return d, secs, exports, image_base

def rva_of(d, secs, fileoff):
    for s in secs:
        if s['roff'] <= fileoff < s['roff'] + s['rsize']:
            return s['va'] + (fileoff - s['roff'])
    return None

a_path, b_path = sys.argv[1], sys.argv[2]
da, sa, exa, base_a = parse_pe(a_path)
db, sb, exb, base_b = parse_pe(b_path)

print('=== headers ===')
for nm, sa_ in zip(('A', 'B'), (sa, sb)):
    print(f'[{nm}] sections:')
    for s in sa_:
        print(f"  {s['name']:8s} va=0x{s['va']:06X} vsize=0x{s['vsize']:06X} roff=0x{s['roff']:06X} rsize=0x{s['rsize']:06X} chars=0x{s['chars']:08X}")
print('[A] exports:', {k: hex(v) for k, v in sorted(exa.items(), key=lambda x: x[1])})
print('[B] exports:', {k: hex(v) for k, v in sorted(exb.items(), key=lambda x: x[1])})

ta = next(s for s in sa if s['name'] == '.text')
tb = next(s for s in sb if s['name'] == '.text')
at = da[ta['roff']:ta['roff']+ta['rsize']]
bt = db[tb['roff']:tb['roff']+tb['rsize']]
print(f'.text A rsize=0x{len(at):X}  B rsize=0x{len(bt):X}')

n = min(len(at), len(bt))
diffs = [i for i in range(n) if at[i] != bt[i]]
print(f'=== diff bytes (0..{n}): {len(diffs)} ===')
if len(at) != len(bt):
    # zone de queue differente par longueur
    longer = at if len(at) > len(bt) else bt
    print(f'tail delta: {abs(len(at)-len(bt))} bytes (A={len(at)}, B={len(bt)})')

# grouper en hunks (gap > 32 => nouveau hunk)
hunks = []
for i in diffs:
    if hunks and i - hunks[-1][1] <= 32:
        hunks[-1][1] = i
    else:
        hunks.append([i, i])

def nearest_export(secs, exports, rva):
    best = None
    for nm, frva in exports.items():
        if frva <= rva and (best is None or frva > best[1]):
            best = (nm, frva)
    return best

for h0, h1 in hunks:
    lo = max(0, h0 - 16); hi = min(n, h1 + 17)
    rva0 = ta['va'] + lo
    exp = nearest_export(sa, exa, ta['va'] + h0)
    print(f'\n--- hunk file 0x{h0:06X}-0x{h1:06X}  RVA 0x{rva0:06X}-0x{ta["va"]+h1:06X}  ({h1-h0+1} bytes)  near_export={exp} ---')
    for row in range(lo, hi, 16):
        ra = ' '.join(f'{at[i]:02X}' if i < len(at) else '  ' for i in range(row, row+16))
        rb = ' '.join(f'{bt[i]:02X}' if i < len(bt) else '  ' for i in range(row, row+16))
        mark = '<<' if any(h0 <= i <= h1 for i in range(row, min(row+16, hi))) else '  '
        print(f'  0x{ta["va"]+row:06X}  {ra}  |  {rb}  {mark}')
