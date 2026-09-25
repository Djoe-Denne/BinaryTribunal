import struct

r = open(r'tools\_tmp_af3dn_drop\decode\_audit\live_ring.bin', 'rb').read()
f = open(r'tools\_tmp_af3dn_drop\captures\reverify.bin', 'rb').read()

roff = 0x38
ring_rec = r[roff:roff + 1324]
lfs = [i for i, b in enumerate(ring_rec) if b == 0x0A]
print('LF positions in ring rec (seq 1998):', [hex(i) for i in lfs])
for i in lfs:
    print('  ring[%#x..%#x) = %s' % (i - 4, i + 4, ring_rec[i - 4:i + 4].hex(' ')))

# file: same record; verify around each LF (accounting for prior expansions)
foff = len(f) - 4384 + 56
frec = f[foff:foff + 1326]
# emulate: expansion positions in file
exp_positions = []
shift = 0
for i, b in enumerate(ring_rec):
    if b == 0x0A:
        exp_positions.append(i + shift)
        shift += 1
print('expected CR insert positions in file rec:', [hex(p) for p in exp_positions])
for p in exp_positions:
    print('  file[%#x..%#x) = %s (expect ...0d 0a...)' % (p - 2, p + 2, frec[p - 2:p + 2].hex(' ')))
