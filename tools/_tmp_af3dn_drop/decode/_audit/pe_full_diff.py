# -*- coding: utf-8 -*-
"""Diff complet de deux PE : headers + toutes sections, stdlib pur."""
import struct, sys

def parse_pe(path):
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
        name = d[s:s+8].rstrip(b'\0').decode('latin-1')
        name = ''.join(c if 32 <= ord(c) < 127 else '?' for c in name)
        vsize, va, rsize, roff = struct.unpack_from('<IIII', d, s + 8)
        secs.append(dict(name=name, va=va, vsize=vsize, roff=roff, rsize=rsize))
    return d, secs

a_path, b_path = sys.argv[1], sys.argv[2]
da, sa = parse_pe(a_path)
db, sb = parse_pe(b_path)
print(f'A len={len(da)}  B len={len(db)}')

if da[:0x400] != db[:0x400]:
    print('--- header diff (0..0x400) ---')
    for i in range(0x400):
        if da[i] != db[i]:
            print(f'  hdr 0x{i:04X}: A={da[i]:02X} B={db[i]:02X}')

for s in sa:
    key = s['name']
    sb_ = next((x for x in sb if x['name'] == key), None)
    if sb_ is None:
        print(f'section {key}: ABSENT dans B')
        continue
    at = da[s['roff']:s['roff']+s['rsize']]
    bt = db[sb_['roff']:sb_['roff']+sb_['rsize']]
    ndiff = sum(1 for i in range(min(len(at), len(bt))) if at[i] != bt[i])
    extra = abs(len(at) - len(bt))
    print(f"section {key:8s} A.rs=0x{len(at):06X} B.rs=0x{len(bt):06X} diffbytes={ndiff} lenshift={extra}")
    if ndiff == 0 and extra == 0:
        continue
    diffs = [i for i in range(min(len(at), len(bt))) if at[i] != bt[i]]
    hunks = []
    for i in diffs:
        if hunks and i - hunks[-1][1] <= 48:
            hunks[-1][1] = i
        else:
            hunks.append([i, i])
    for h0, h1 in hunks:
        lo = max(0, h0 - 16); hi = min(min(len(at), len(bt)), h1 + 17)
        print(f'  hunk 0x{s["roff"]+h0:06X}-0x{s["roff"]+h1:06X} RVA 0x{s["va"]+h0:06X}-0x{s["va"]+h1:06X} ({h1-h0+1} B)')
        for row in range(lo & ~15, hi, 16):
            ra = ' '.join(f'{at[i]:02X}' for i in range(row, min(row+16, len(at))))
            rb = ' '.join(f'{bt[i]:02X}' for i in range(row, min(row+16, len(bt))))
            mark = '<<' if any(h0 <= i <= h1 for i in range(row, min(row+16, hi))) else '  '
            print(f'    f0x{s["roff"]+row:06X} rva 0x{s["va"]+row:06X}  A {ra}')
            print(f'      {" "*len(f"f0x{s[chr(34)+chr(34)] if False else s[chr(114)+chr(111)+chr(102)+chr(102)]+row:06X}")}B {rb}  {mark}' if False else f'    {" "*len(f"f0x{s[chr(114)+chr(111)+chr(102)+chr(102)]+row:06X}")}   B {rb}  {mark}')
