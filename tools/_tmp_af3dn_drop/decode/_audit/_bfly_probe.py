import struct

def per_frame(path):
    data = open(path, 'rb').read()
    frames = {}
    pos = 0
    n = len(data)
    while pos + 32 <= n:
        magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, pos)
        if magic != 0x3730444E:
            print(f'bad magic at {pos:#x} ({data[pos:pos+4].hex(" ")})')
            break
        real_nxt = None
        # find next magic strictly
        nxt = pos + 32 + psize
        if nxt + 32 <= n:
            m2 = struct.unpack_from('<I', data, nxt)[0]
            real_nxt = nxt if m2 == 0x3730444E else None
            if real_nxt is None:
                # search up to +16
                for p in range(nxt, min(nxt + 16, n - 3)):
                    if struct.unpack_from('<I', data, p)[0] == 0x3730444E:
                        real_nxt = p
                        break
        size = (real_nxt - pos) if real_nxt is not None else (n - pos)
        vc = ic = None
        if kind == 2:
            vc, ic = struct.unpack_from('<2I', data, pos + 32 + 24)
        frames.setdefault(seq, []).append((slot, kind, psize, vc, ic, size))
        pos = real_nxt if real_nxt is not None else n
    for seq in sorted(frames):
        rs = frames[seq]
        total = sum(r[5] for r in rs)
        det = ' | '.join(f's{r[0]} k{r[1]} ps{r[2]}{" vc%d"%r[3] if r[3] is not None else ""}{"+%d"%(r[5]-32-r[2]) if r[5]-32-r[2] else ""}' for r in rs)
        print(f'seq={seq}: {len(rs)} recs total={total} : {det}')
    print('file size check:', data[-4:].hex(' '), 'tail magic?', n)

per_frame(r'tools\_tmp_af3dn_drop\captures\menu.bin')
print('=== battle_base (tail) ===')
data = open(r'tools\_tmp_af3dn_drop\captures\battle_base.bin', 'rb').read()
# count magic occurrences and total
import re
cnt = 0
pos = 0
skews = []
while pos + 32 <= len(data):
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, pos)
    if magic != 0x3730444E:
        print('bad magic at', pos)
        break
    cnt += 1
    nxt = pos + 32 + psize
    real = None
    if nxt + 32 <= len(data) and struct.unpack_from('<I', data, nxt)[0] == 0x3730444E:
        real = nxt
    else:
        for p in range(nxt, min(nxt + 16, len(data) - 3)):
            if struct.unpack_from('<I', data, p)[0] == 0x3730444E:
                real = p; break
    if real is not None and real != nxt:
        skews.append((pos, slot, real - nxt))
    pos = real if real is not None else len(data)
print('records', cnt, 'resync count', len(skews), 'trailing bytes', len(data) - pos)
vals = {}
for pos, slot, d in skews:
    vals[d] = vals.get(d, 0) + 1
print('skew deltas:', vals)
