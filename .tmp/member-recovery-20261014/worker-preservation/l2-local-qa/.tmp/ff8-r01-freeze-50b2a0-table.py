"""Supervisor-only static capture of the missing ten-DWORD switch table."""
from pathlib import Path
import hashlib

template = Path('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-r01-freeze-502380-table.py')
source = template.read_text(encoding='utf8')
replacements = [
    ('0x502380', '0x50B2A0'),
    ('1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09',
     'a2948fb2cfed39d50786de24509013d91ce4e411862d0610508c371e3ce3bbaf'),
    ('0x502628', '0x50B7E8'),
    ('0x502670', '0x50B810'),
    ('0x5023a1', '0x50B2C4'),
    ('lo, size = 0x50B7E8, 72', 'lo, size = 0x50B7E8, 40'),
    ("struct.unpack('<18I', table)", "struct.unpack('<10I', table)"),
    ('18 little-endian DWORDs', '10 little-endian DWORDs'),
    ('ida_bytes.get_bytes(0x50B2A0, 0x21)', 'ida_bytes.get_bytes(0x50B2A0, 0x24)'),
]
for old, new in replacements:
    assert old in source, 'Capture template changed: ' + old
    source = source.replace(old, new)
assert '0x502380' not in source and '0x502628' not in source
print('capture_template_sha256=' + hashlib.sha256(template.read_bytes()).hexdigest())
exec(compile(source, str(template), 'exec'))
