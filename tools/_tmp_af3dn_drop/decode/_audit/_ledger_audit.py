# -*- coding: utf-8 -*-
"""Ledger audit: DumpNode's own DW counter [14054EA0] vs real byte gap between records.
Chained walk with +2 delta per slot51 multigroup (extra byte mode), full file."""
import struct
from collections import defaultdict

# Historic deployed build recount (battle_base sequences):
# -',\ #audit guard: re-derive chain with skip-distance, not fixed +2 (multi-frame file)

HIST = r'tools\_tmp_af3dn_drop\captures\battle_base.bin'
data = open(HIST, 'rb').read()
n = len(data)
recs = []
pos = 0
last_bad = 0
while pos + 32 <= n:
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, pos)
    if magic != 0x3730444E:
        last_bad = pos
        break
    vc = ic = None
    da = 0
    if kind == 2:
        vc, ic = struct.unpack_from('<2I', data, pos + 56)
        if vc > 4:
            da = 2
    recs.append((pos, slot, seq, kind, psize, da))
    pos = pos + 32 + psize + da

print('records walked:', len(recs), 'stopping pos', hex(pos), 'of', hex(n), 'bad magic bytes', data[pos:pos+8].hex(' ') if pos+8 <= n else '')
print('remaining unparsed:', n - pos)

# Check last entry: is it the 658820 or after?
last = recs[-1]
print('last rec:', last, ' physical size to end:', n - last[0])
for pos, slot, seq, kind, psize, da in recs[-6:]:
    print(f'  tail off={pos:#x} slot={slot} seq={seq} kind={kind} psize={psize} da={da}')

from collections import defaultdict
per = defaultdict(lambda: [0, 0])
for pos, slot, seq, kind, psize, da in recs[:1120]:
    per[seq][0] += 32 + psize
    per[seq][1] += da
for s in sorted(per)[:6]:
    decl, extra = per[s]
    print(f'  seq {s}: declared {decl} + extra {extra} = {decl+extra}')
print('frames:', len(per))
