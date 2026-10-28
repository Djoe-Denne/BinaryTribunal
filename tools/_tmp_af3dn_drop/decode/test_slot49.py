#!/usr/bin/env python3
"""Test C: analyze slot-49 records + their TR08 linkage."""
import sys, struct
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump

data = Path(r'tools\_tmp_af3dn_drop\captures\lot14\battle13\battle13.bin').read_bytes()
recs, warns, txt, trs = parse_dump(data)
tr_by_obj = {t.texobj: t for t in trs}
frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)
seq = sorted(frames)[8]

print('=== slot 49 records (frame %d) ===' % seq)
for r in frames[seq]:
    if r.geom_kind == 2 and r.slot == 49:
        tobj = getattr(r, 'texobj', 0)
        tr = tr_by_obj.get(tobj)
        has = 'OUI' if tr else 'NON'
        print('slot 49: texobj=0x%08X TR=%s vcount=%d icount=%d clut=0x%X' %
              (tobj, has, r.vcount, r.icount, r.clut))
        if tr:
            print('   TR: w=%d h=%d entries=%d palcount=%d' % (tr.w, tr.h, tr.pal_entries, tr.pal_count))
            # UVs of the first vertices
            for v in list(struct.iter_unpack('<4f2I2f', r.fvf))[:4]:
                print('   uv=(%.3f, %.3f) diffuse=0x%08X' % (v[6], v[7], v[4]))

print('=== setup records (kind0) ===')
for r in frames[seq]:
    if r.geom_kind == 0:
        print('slot %d: texobj=0x%08X' % (r.slot, getattr(r, 'texobj', 0)))

print('=== slot-51 record count per texobj (frame %d) ===' % seq)
import collections
cnt = collections.Counter()
for r in frames[seq]:
    if r.geom_kind == 2 and r.slot == 51:
        cnt[hex(getattr(r, 'texobj', 0))] += 1
for k, c in cnt.most_common():
    print('  texobj', k, 'x', c)
