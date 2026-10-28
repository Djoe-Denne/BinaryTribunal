#!/usr/bin/env python3
"""One-shot diagnostic v2 for menu_copy.bin: raw walk + wide resync + hex around boundaries."""
import struct, sys

MAGIC = 0x3730444E
HDR = struct.Struct('<8I')

def main(path):
    data = open(path, 'rb').read()
    n = len(data)
    print(f'file {n} bytes (0x{n:x})')
    pos = 0
    recno = 0
    while pos + 32 <= n:
        magic, slot, seq, ctx, node_addr, kind, fails, psize = HDR.unpack_from(data, pos)
        if slot == 43 and magic != MAGIC and recno < 3:
            print(f'start region not a record header? hex: {data[pos:pos+32].hex()}')
        if magic != MAGIC:
            print(f'REC{recno} @{pos} (0x{pos:x}): BAD MAGIC {magic:08x}')
            print('  hex32: ' + data[pos:pos+32].hex())
            break
        vcount = icount = None
        if len(data) >= pos + 32 + 24 + 8 and kind == 2:
            vcount, icount = struct.unpack_from('<2I', data, pos + 32 + 24)
        print(f'REC{recno:>3} @{pos:>6} (0x{pos:x}) slot={slot:>2} seq={seq} kind={kind} '
              f'fails={fails} psize={psize} headder={"" if vcount is None else f"vc={vcount} ic={icount}"}')
        declared_end = pos + 32 + psize
        # wide resync: find next magic within +0..64
        found = None
        for d in range(0, 65):
            if declared_end + d + 4 <= n:
                m, = struct.unpack_from('<I', data, declared_end + d)
                if m == MAGIC:
                    found = d
                    break
        if found is None and declared_end + 32 > n:
            print(f'   EOF after this record (decl_end at file end)')
            pos = n
            recno += 1
            break
        print(f'   next magic at declared_end+{found}')
        recno += 1
        # print boundary hex: 12 bytes before declared_end .. +16 after
        s, e = declared_end - 12, min(declared_end + (found or 0) + 12, n)
        print('   boundary: ' + data[s:e].hex())
        pos = declared_end + (found or 0)
    print(f'stopped at pos={pos} recno={recno}')

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
