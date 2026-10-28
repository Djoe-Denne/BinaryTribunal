#!/usr/bin/env python3
from pathlib import Path

py = Path(r'tools\_tmp_af3dn_drop\decode\ff8dump.py')
c = py.read_text(encoding='utf-8')
old = "TX_BYTES = struct.pack('<I', MAGIC_TX)"
assert old in c
c = c.replace(old, old + "\n    TR_BYTES = struct.pack('<I', MAGIC_TR)", 1)
py.write_text(c, encoding='utf-8')
print('TR_BYTES added')
