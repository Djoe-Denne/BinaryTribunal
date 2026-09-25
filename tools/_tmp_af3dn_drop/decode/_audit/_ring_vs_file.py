import struct

r = open(r'tools\_tmp_af3dn_drop\decode\_audit\live_ring.bin', 'rb').read()   # 1400 bytes, rec@0x38 = seq 1998
f = open(r'tools\_tmp_af3dn_drop\captures\reverify.bin', 'rb').read()        # rec@0x38 = seq 1983

ra, fa = 0x38, 0x38
print('rec seq ring=%d file=%d' % (struct.unpack_from('<I', r, ra + 8)[0], struct.unpack_from('<I', f, fa + 8)[0]))
diffs = [(k, r[ra + k], f[fa + k]) for k in range(1324) if r[ra + k] != f[fa + k]]
print('diffs (excl. seq):', len(diffs))
# seq field = [8..12)
diffs2 = [(k, a, b) for (k, a, b) in diffs if not (8 <= k < 12)]
print('diffs excluding seq field:', len(diffs2))
for k, a, b in diffs2[:20]:
    print(f'  rec+{k:#05x}: ring={a:02x} file={b:02x}')
# where do diffs cluster?
if diffs2:
    lo = diffs2[0][0]; hi = diffs2[-1][0]
    print('diff range:', hex(lo), hex(hi))
