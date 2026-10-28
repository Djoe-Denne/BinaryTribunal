#!/usr/bin/env python3
"""v10.2 patch: palMgr lives on v11 (+0xA0), not on T."""
from pathlib import Path

py = Path(r'docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.c')
c = py.read_text(encoding='utf-8')

# 1) hoist v11 to function scope: the chain block declares it locally
old_decl = '''    {
        unsigned long override38 = 0;
        unsigned long backend = 0;
        unsigned long v11 = 0;'''
new_decl = '''    {
        unsigned long override38 = 0;
        unsigned long backend = 0;'''
assert old_decl in c, 'local decl block not found'
c = c.replace(old_decl, new_decl)

# add v11 to the function-scope locals (next to holder)
old_locals = '    unsigned long        holder = 0;'
new_locals = '    unsigned long        holder = 0;\n    unsigned long        v11 = 0;'
assert old_locals in c
c = c.replace(old_locals, new_locals, 1)

# remove the local v11 decl inside the block if still present (second occurrence)
c = c.replace('''        unsigned long override38 = 0;
        unsigned long backend = 0;
        unsigned long v11 = 0;''', '''        unsigned long override38 = 0;
        unsigned long backend = 0;''')

# remove the (void)v11; no-op
c = c.replace('        (void)v11;\n', '')

# 2) palMgr read: v11 + 0xA0 (was texObj + 0xA0)
old_pm = 'if (!GFXPT_ReadU32((const void*)(texObj + 0xA0), &palMgr) || palMgr == 0)'
assert old_pm in c, 'palMgr read not found'
c = c.replace(old_pm, 'if (!GFXPT_ReadU32((const void*)(v11 + 0xA0), &palMgr) || palMgr == 0)')

# 3) build bump 0x563B -> 0x563C
c = c.replace('#define GFXPT_BUILD_ID              0x563Bul', '#define GFXPT_BUILD_ID              0x563Cul')

py.write_text(c, encoding='utf-8')
print('patched OK')
