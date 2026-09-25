import struct

def walk(path):
    data = open(path, 'rb').read()
    n = len(data)
    pos = 0
    plus2 = 0
    clean = 0
    per_frame = {}
    while pos + 32 <= n:
        magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, pos)
        if magic != 0x3730444E:
            print(f'bad magic at {pos:#x}: {data[pos:pos+4].hex(" ")}')
            break
        nxt = pos + 32 + psize
        real = None
        if nxt + 4 <= n and struct.unpack_from('<I', data, nxt)[0] == 0x3730444E:
            real = nxt
            clean += 1
        else:
            for d in range(1, 17):
                if nxt + d + 4 <= n and struct.unpack_from('<I', data, nxt + d)[0] == 0x3730444E:
                    real = nxt + d
                    plus2 += 1
                    per_frame.setdefault(seq, []).append((slot, d))
                    break
            if real is None:
                print(f'no next magic within +16 of {nxt:#x} (rec@{pos:#x} slot={slot})')
                break
        pos = real
    print(f'{path}: clean={clean} +N={plus2} tail={n - pos}')
    for seq, lst in list(per_frame.items())[:4]:
        print('  seq', seq, lst)

walk(r'tools\_tmp_af3dn_drop\captures\reverify.bin')
walk(r'tools\_tmp_af3dn_drop\captures\menu.bin')
