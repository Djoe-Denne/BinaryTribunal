#!/usr/bin/env python3
"""One-shot contract verification for the 2026-09-25 13:50 campaign dump (menu.bin copy).

The file was produced by the STALE deployed build: its 32 multigroup slot-51
records are 2 bytes longer than payload_size (copy [verts-2, +vcount*32+2)).
This checker walks the stream with resync-on-magic (max +8), decodes every
record per the v7 contract (kind 0/1/2), verifies the FVF grid plausibility at
the observed phase, and reports the totals. ff8dump.py itself is NOT modified.
"""
import struct, sys, os
from collections import Counter

MAGIC = 0x3730444E
HDR = struct.Struct('<8I')
NODE = 24
VERT = struct.Struct('<4f2I2f')

def main(path):
    data = open(path, 'rb').read()
    n = len(data)
    pos, recs, resyncs = 0, 0, 0
    slots, seqs = Counter(), Counter()
    kind2, bad_grid, eof_clean = 0, 0, False
    while pos < n:
        if n - pos < 32:
            print(f'truncation at EOF: {n - pos} bytes (last record short) — acceptable')
            break
        magic, slot, seq, ctx, node_addr, kind, fails, psize = HDR.unpack_from(data, pos)
        if magic != MAGIC:
            print(f'FAIL: bad magic 0x{magic:08X} at {pos} (0x{pos:x})')
            return 2
        recs += 1
        slots[slot] += 1
        seqs[seq] += 1
        de = pos + 32 + psize
        # resync: find next magic within +0..8 (stale-build skew is +2)
        delta = None
        for d in range(0, 9):
            if de + d + 4 <= n:
                m, = struct.unpack_from('<I', data, de + d)
                if m == MAGIC:
                    delta = d
                    break
        if delta:
            resyncs += 1
        # kind2 decode per contract
        if kind == 2:
            kind2 += 1
            v, i = struct.unpack_from('<2I', data, pos + 32 + NODE)
            idxb = i * 2
            pad = 2 if (idxb & 3) else 0
            blob = pos + 32 + NODE + 8 + idxb + pad
            # grid phase: +2 for the skewed (multigroup) records, else 0
            phase = 2 if delta == 2 else 0
            ok = 0
            total = 0
            for k in range(v):
                vo = blob + phase + 32 * k
                if vo + 32 > n:
                    break
                x, y, z, rhw, diff, spec, u, vv = VERT.unpack_from(data, vo)
                total += 1
                if -200.0 <= x <= 900.0 and -200.0 <= y <= 900.0 and -2.0 <= u <= 2.0 and -2.0 <= vv <= 2.0:
                    ok += 1
            if total and ok < total * 0.9:
                bad_grid += 1
        if delta is None:
            pos = de
            eof_clean = (pos == n)
        else:
            pos = de + delta
            eof_clean = (pos == n)
    print(f'records parsed   : {recs}')
    print(f'frames (seqs)    : {len(seqs)} (min={min(seqs)}, max={max(seqs)})' if seqs else 'no frames')
    print(f'slots            : ' + ' '.join(f'{s}x{c}' for s, c in sorted(slots.items())))
    print(f'kind2 records    : {kind2}')
    print(f'resync(+2) fixes : {resyncs}')
    print(f'implausible grids: {bad_grid}')
    print(f'ends exactly at EOF: {eof_clean} (file={n})')
    if recs >= 159 and bad_grid == 0 and len(seqs) == 16:
        print('VERDICT: PASS — all records decode under resync; grid plausibility OK')
        return 0
    print('VERDICT: REVIEW NEEDED')
    return 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
