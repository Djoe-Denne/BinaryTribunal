"""Supervisor-only reuse of the reviewed static capture, with explicit EA/size substitutions."""
from pathlib import Path
import hashlib

template = Path('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-r01-freeze-502380-table.py')
source = template.read_text(encoding='utf8')
replacements = [
    ('0x502380', '0x50B830'),
    ('1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09',
     'e89c8ab63b9fd82b3051f599dea4bcd4e2d1bc49457d7a0afe239ac230aafbbf'),
    ('0x502628', '0x50BAE0'),
    ('0x502670', '0x50BB00'),
    ('0x5023a1', '0x50B85A'),
    ('lo, size = 0x50BAE0, 72', 'lo, size = 0x50BAE0, 32'),
    ("struct.unpack('<18I', table)", "struct.unpack('<8I', table)"),
    ('18 little-endian DWORDs', '8 little-endian DWORDs'),
    ('ida_bytes.get_bytes(0x50B830, 0x21)', 'ida_bytes.get_bytes(0x50B830, 0x2A)'),
]
for old, new in replacements:
    assert old in source, 'Capture template changed: ' + old
    source = source.replace(old, new)
assert '0x502380' not in source and '0x502628' not in source
print('capture_template_sha256=' + hashlib.sha256(template.read_bytes()).hexdigest())
exec(compile(source, str(template), 'exec'))
