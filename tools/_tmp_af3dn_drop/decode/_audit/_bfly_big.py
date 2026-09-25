import struct

data = open(r'tools\_tmp_af3dn_drop\captures\battle_base.bin', 'rb').read()
off = 0x240c8
magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', data, off)
print(f'off={off:#x} slot={slot} seq={seq} kind={kind} fails={fails} psize={psize} node={node_addr:#x}')
vc, ic = struct.unpack_from('<2I', data, off + 56)
print(f'vc={vc} ic={ic}  (rating: vc={vc//4} groups of 4, ic={ic//6} groups of 6)')
print('node[24] bytes @+32:', data[off+32:off+56].hex(' '))
# native node view
n = data[off+32:off+56]
nodes = {}
def show(a, b):
    for k in range(a, b):
        if k not in nodes:
            nodes[k] = struct.unpack_from('<I', data, off+32+k*4)[0]
        print(f'  node+{k*4:#04x} : {nodes[k]:#x} ({struct.unpack_from("<i", data, off+32+k*4)[0]})')
show(0, 6)
show(6, 12) if False else None
# need 24 bytes only
print()
idx0 = off + 56 + 8
idx_arr = struct.unpack_from(f'<{ic}H', data, idx0)
mx = max(idx_arr)
mn = min(idx_arr)
print(f'idx max={mx} min={min(idx_arr)} words_ge_4096={sum(1 for x in idx_arr if x>=4096)}')
# check pattern head/tail
pat = (2,1,0,3,1,2)
ok = sum(1 for g in range(ic//6) if all(idx_arr[g*6+i] == ((idx_arr[g*6+i]-idx_arr[g*6+2]) if False else 0) for i in range(6)))
# simpler: base = first element - 2
seg0 = idx_arr[:6]
base = seg0[0] - 2
print('head seg (base-2 pattern?):', seg0, 'expected', [p+base for p in pat])
last6 = idx_arr[-6:]
bl = last6[2]
print('tail seg:', last6, 'base guess', bl, 'expected', [bl+p for p in pat])
