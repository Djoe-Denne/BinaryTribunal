import struct

for path in (r'tools\_tmp_af3dn_drop\captures\reverify.bin', r'tools\_tmp_af3dn_drop\captures\menu.bin'):
    d = open(path, 'rb').read()
    n = len(d)
    pos = 0
    print('===', path)
    shown = 0
    while pos + 32 <= n and shown < 6:
        magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', d, pos)
        if magic != 0x3730444E:
            print('bad magic at', hex(pos)); break
        nxt = pos + 32 + psize
        real = None
        for dd in range(0, 17):
            if nxt + dd + 4 <= n and struct.unpack_from('<I', d, nxt + dd)[0] == 0x3730444E:
                real = nxt + dd
                break
        if real != nxt:
            vc = ic = None
            if kind == 2:
                vc, ic = struct.unpack_from('<2I', d, pos + 56)
            print('rec@%#x slot=%d seq=%d psize=%d vc=%s ic=%s : gap %d bytes = %s' % (
                pos, slot, seq, psize, vc, ic, (real - nxt) if real else -1,
                d[nxt:(real if real else nxt + 8)].hex(' ')))
            shown += 1
        pos = real if real else n
