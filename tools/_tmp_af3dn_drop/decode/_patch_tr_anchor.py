#!/usr/bin/env python3
"""v10.1 decoder patch: TR08 anchor recognition in the resync machinery."""
from pathlib import Path

py = Path(r'tools\_tmp_af3dn_drop\decode\ff8dump.py')
c = py.read_text(encoding='utf-8')

# 1) _cand_ok: accept TR08 as anchor
old = "            if not ((m2 == MAGIC_ND or m2 == MAGIC_ND8) and 43 <= s2 <= 64 and k2 <= 2 and p2 <= 262144):"
new = ("            if m2 == MAGIC_TR:\n"
       "                return b2 == BUILD_ID\n"
       "            if not ((m2 == MAGIC_ND or m2 == MAGIC_ND8) and 43 <= s2 <= 64 and k2 <= 2 and p2 <= 262144):")
assert old in c, 'cand_ok not found'
c = c.replace(old, new)

# 2) _cand_tr_ok helper
old2 = "def _cand_tx_ok(off: int, data: bytes, n: int) -> bool:"
new2 = ('''def _cand_tr_ok(off: int, data: bytes, n: int) -> bool:
    """Structural plausibility of a TR08 record start (v10 texture resource)."""
    if off + 40 > n:
        return False
    m2, b2 = struct.unpack_from('<2I', data, off)
    return m2 == MAGIC_TR and b2 == BUILD_ID


def _cand_tx_ok(off: int, data: bytes, n: int) -> bool:''')
assert old2 in c, 'cand_tx_ok not found'
c = c.replace(old2, new2, 1)

# 3) resync scan sites (2 occurrences)
old3 = """                    if w4 == TX_BYTES and _cand_tx_ok(probe, data, n):
                        found = probe
                        break"""
new3 = """                    if w4 == TX_BYTES and _cand_tx_ok(probe, data, n):
                        found = probe
                        break
                    if w4 == TR_BYTES and _cand_tr_ok(probe, data, n):
                        found = probe
                        break"""
cnt = c.count(old3)
assert cnt == 2, f'expected 2 scan sites, found {cnt}'
c = c.replace(old3, new3)

# 4) TR_BYTES constant
old4 = "TX_BYTES = struct.pack('<I', MAGIC_TX)"
assert old4 in c
c = c.replace(old4, "TX_BYTES = struct.pack('<I', MAGIC_TX)\n    TR_BYTES = struct.pack('<I', MAGIC_TR)")

py.write_text(c, encoding='utf-8')
print('patched OK')
