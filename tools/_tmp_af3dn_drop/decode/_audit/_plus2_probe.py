import struct, sys

sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')

data = open(r'tools\_tmp_af3dn_drop\captures\menu.bin', 'rb').read()

# Header field order: magic, slot, seq, ctx, node_addr, geom_kind, fails, payload_size
for off in (56, 1438, 3520):
    magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, off)
    vc, ic = struct.unpack_from('<2I', data, off + 32 + 24)
    idx_bytes = ic * 2
    pad = (4 - (idx_bytes % 4)) % 4
    declared = 24 + 8 + idx_bytes + pad + vc * 32
    print(f'off={off} psize(hdr)={psize} vc={vc} ic={ic} idx={idx_bytes} pad={pad} '
          f'declared(24+8+idx+pad+fvf)={declared} declared-32={declared-32}')
    # dump the 8 bytes right after idx+pad (the aligned start of the fvf blob)
    after = off + 32 + 24 + 8 + idx_bytes + pad
    print('   bytes at idx+pad start (expected FVF X0 lo 2):', data[after:after + 8].hex(' '))
    print('   bytes 2 earlier (the +2 prefix):', data[after - 2:after + 6].hex(' '))
    # prefix = last_idx+1 of ids stream at node+0x28
    ids_addr = node_addr + 0x28
    print(f'   node_addr={node_addr:#x} ids@+0x28 VA={ids_addr:#x}')
    # read u16 at after-2
    pre = struct.unpack_from('<H', data, after - 2)[0]
    print(f'   prefix u16 = {pre} (0x{pre:x}); vc={vc} -> vc-10={vc-10}, idx_last+1? ic=54 -> 54*2')
    # recompute magic-next
    nxt = off + 32 + psize
    print(f'   magic@off+32+psize = {data[nxt:nxt+4].hex(" ")} ; magic@+2 = {data[nxt+2:nxt+6].hex(" ")}')
    # check idx blob end: first u16 of padding
    print(f'   idx zone last 8 bytes: {data[off+32+24+8+idx_bytes-8:off+32+24+8+idx_bytes].hex(" ")}')
