import struct

f = open(r'tools\_tmp_af3dn_drop\decode\_audit\h8_file.bin', 'rb').read()
print('file size', len(f))
pos = 0
while pos + 32 <= len(f):
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', f, pos)
    if magic != 0x3730444E:
        print('bad magic at', pos, f[pos:pos + 4].hex(' '))
        break
    vc = ic = None
    if kind == 2:
        vc, ic = struct.unpack_from('<2I', f, pos + 56)
    nxt = pos + 32 + psize
    real = nxt
    if not (nxt + 4 <= len(f) and struct.unpack_from('<I', f, nxt)[0] == 0x3730444E):
        real = None
        for dd in range(1, 17):
            if nxt + dd + 4 <= len(f) and struct.unpack_from('<I', f, nxt + dd)[0] == 0x3730444E:
                real = nxt + dd
                break
    print('rec@%#06x slot=%2d kind=%d psize=%6d vc=%s ic=%s -> next magic %s (delta %+d)' % (
        pos, slot, kind, psize, vc, ic, hex(real) if real else 'NONE',
        (real - nxt) if real is not None else -999))
    if real is None:
        break
    pos = real
print('walk end', pos, 'file', len(f))
