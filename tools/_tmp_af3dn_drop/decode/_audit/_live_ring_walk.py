import struct

r = open(r'tools\_tmp_af3dn_drop\decode\_audit\live_ring.bin', 'rb').read()
print('live ring snapshot len', len(r))
print('hdr:', struct.unpack_from('<8I', r, 0))
print('counts:', struct.unpack_from('<2I', r, 56))
pos = 0
n = 1400
while pos + 32 <= n:
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', r, pos)
    if magic != 0x3730444E:
        print('bad magic at', pos, r[pos:pos + 4].hex(' '))
        break
    vc = ic = None
    if kind == 2:
        vc, ic = struct.unpack_from('<2I', r, pos + 56)
    nxt = pos + 32 + psize
    real = None
    for dd in range(0, 17):
        if nxt + dd + 4 <= n and struct.unpack_from('<I', r, nxt + dd)[0] == 0x3730444E:
            real = nxt + dd
            break
    print('rec@%#05x slot=%d seq=%d kind=%d psize=%d vc=%s ic=%s next-magic %s (delta %+d)' % (
        pos, slot, seq, kind, psize, vc, ic, hex(real) if real else 'NONE',
        (real - nxt) if real else -999))
    if kind == 2:
        idx_end = pos + 64 + ic * 2
        pad = (4 - (ic * 2 % 4)) % 4
        print('   idx tail 8:', r[idx_end - 8:idx_end].hex(' '))
        print('   after idx(+pad):', r[idx_end + pad:idx_end + pad + 10].hex(' '))
        print('   fvf tail:', r[pos + 32 + psize - 8:pos + 32 + psize].hex(' '))
    if real is None:
        break
    pos = real
