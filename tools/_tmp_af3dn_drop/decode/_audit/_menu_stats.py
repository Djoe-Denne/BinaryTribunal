import json, struct, sys

sys.path.insert(0, r'tools\_tmp_af3dn_drop\decode')
from ff8dump import parse_dump, HDR, NODE_SIZE

data = open(r'tools\_tmp_af3dn_drop\captures\menu.bin', 'rb').read()
recs, warns = parse_dump(data)
print('file size', len(data), 'records', len(recs))

# Show slot 51 and 60 records
for r in recs:
    if r.slot in (51, 60):
        psize_total_len = None
        print(f'off={r.offset} slot={r.slot} seq={r.seq} kind={r.geom_kind} fails={r.fails} '
              f'vc={r.vcount} ic={r.icount} idx_repaired={r.idx_repaired} node_addr={r.node_addr:#x}')
