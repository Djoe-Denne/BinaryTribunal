import struct

d = open(r'tools\_tmp_af3dn_drop\captures\reverify.bin', 'rb').read()
pos = 0x11134
magic, slot, seq, ctx, node_addr, kind, fails, psize = struct.unpack_from('<8I', d, pos)
vc, ic = struct.unpack_from('<2I', d, pos + 56)
print('rec@%#x slot=%d seq=%d kind=%d psize=%d vc=%d ic=%d' % (pos, slot, seq, kind, psize, vc, ic))
nxt = pos + 32 + psize
print('declared end %#x; bytes there: %s' % (nxt, d[nxt:nxt + 24].hex(' ')))
mm = d.find(b'ND07', nxt)
print('next ND07 at', hex(mm), 'delta', mm - nxt)
print('gap bytes:', d[nxt:mm].hex(' '))
