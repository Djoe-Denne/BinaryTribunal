import struct

data = open(r'tools\_tmp_af3dn_drop\captures\battle_base.bin', 'rb').read()
n = len(data)
pos = 0
kinds = {}
big = []
offout = []
while pos + 32 <= n:
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, pos)
    if magic != 0x3730444E:
        print('bad magic at', hex(pos))
        break
    vc = ic = None
    if kind == 2:
        vc, ic = struct.unpack_from('<2I', data, pos + 56)
    rec_bytes = None
    nxt = pos + 32 + psize
    real = nxt
    if nxt + 32 <= n and struct.unpack_from('<I', data, nxt)[0] == 0x3730444E:
        real = nxt
    else:
        for p in range(nxt, min(nxt + 64, n - 3)):
            if struct.unpack_from('<I', data, p)[0] == 0x3730444E:
                real = p
                break
        else:
            real = n
    rec_bytes = real - pos
    kinds[(slot, kind)] = kinds.get((slot, kind), 0) + 1
    if kind == 2 and ((vc and vc > 4096) or (ic and ic > 16384)):
        big.append((pos, slot, seq, vc or 0, ic or 0, fails, psize, rec_bytes))
    if slot in (51, 60):
        offout.append((pos, slot, seq, kind, fails, vc, ic, psize, rec_bytes))
    pos = real
print('records walked:', sum(kinds.values()))
print('slot/kind counts:', kinds)
print()
print('--- guard-bypass candidates (vc>4096 or ic>16384) ---')
for b in big[:20]:
    print(f'off={b[0]:#x} slot={b[1]} seq={b[2]} vc={b[3]} ic={b[4]} fails={b[5]} psize={b[6]} recb={b[7]}')
print('total big:', len(big))
print()
print('--- slot 51/60 records ---')
for o in offout[:40]:
    print(f'off={o[0]:#x} slot={o[1]} seq={o[2]} kind={o[3]} fails={o[4]} vc={o[5]} ic={o[6]} psize={o[7]} recb={o[8]} delta={o[8]-32-o[7]}')
print('total 51/60:', len(offout))
