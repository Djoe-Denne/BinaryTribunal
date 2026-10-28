#!/usr/bin/env python3
"""LOT15 v11 verification: slots 48/49/50 footer texobj + TR08 linkage (frame 8)."""
import sys, struct, collections
from pathlib import Path
sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump

BIN = Path(r'tools\_tmp_af3dn_drop\captures\lot15\battle_v11\gfx_passthrough_dump.bin')
data = BIN.read_bytes()
recs, warns, txt, trs = parse_dump(data)
tr_by_obj = {t.texobj: t for t in trs}
frames = {}
for r in recs:
    frames.setdefault(r.seq, []).append(r)
seq = sorted(frames)[8]

print('=== frame seq=%d (%d records) ===' % (seq, len(frames[seq])))
print('TR08 objects:', [hex(k) for k in tr_by_obj])

verdict = {'texobj_nonzero': False, 'tr_match': False}
for slot in (48, 49, 50):
    rs = [r for r in frames[seq] if r.geom_kind == 2 and r.slot == slot]
    rs0 = [r for r in frames[seq] if r.geom_kind == 0 and r.slot == slot]
    print('--- slot %d: %d kind2, %d kind0 ---' % (slot, len(rs), len(rs0)))
    for r in rs:
        tobj = getattr(r, 'texobj', 0)
        tr = tr_by_obj.get(tobj)
        if tobj != 0:
            verdict['texobj_nonzero'] = True
        if tr is not None:
            verdict['tr_match'] = True
        print('  slot %d: texobj=0x%08X TR=%s vcount=%d icount=%d clut=0x%X ids=%d dropped=%d'
              % (slot, tobj, 'OUI' if tr else 'NON', r.vcount, r.icount, r.clut,
                 getattr(r, 'id_count', 0), getattr(r, 'dropped_ids', 0)))
        if tr:
            print('    TR: w=%d h=%d pal_entries=%d pal_count=%d' %
                  (tr.w, tr.h, tr.pal_entries, tr.pal_count))
    for r in rs0:
        print('  kind0 slot %d setup' % slot)

# also show slot-51 linkage for context (known-good backend chain)
cnt = collections.Counter()
for r in frames[seq]:
    if r.geom_kind == 2 and r.slot == 51:
        cnt[hex(getattr(r, 'texobj', 0))] += 1
print('=== slot-51 texobj distribution (frame %d) ===' % seq)
for k, c in cnt.most_common():
    print('  texobj', k, 'x', c)

print('=== VERDICT ===')
print('slot49 texobj != 0 :', 'OUI' if verdict['texobj_nonzero'] else 'NON')
print('texobj -> TR08 key :', 'OUI' if verdict['tr_match'] else 'NON')
if warns:
    print('warnings: %d' % len(warns))
    for w in warns[:8]:
        print('  ', w)
