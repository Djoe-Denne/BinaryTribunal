#!/usr/bin/env python3
"""v10.1 patch: fix the TrEmit chain (ctx -> backend -> v11 -> T)."""
from pathlib import Path

py = Path(r'docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.c')
c = py.read_text(encoding='utf-8')

# 1) signature
old_sig = 'static void GFXPT_TrEmit(unsigned long seq, const void* node)'
assert old_sig in c, 'sig not found'
c = c.replace(old_sig, 'static void GFXPT_TrEmit(unsigned long seq, const void* node, const void* ctx)')

# 2) chain replacement
oldA = 'if (!GFXPT_ReadU32((const char*)node + 0x2C, &holder) || holder == 0)\n        return;'
oldB = 'if (!GFXPT_ReadU32((const void*)(holder + 0x10), &texObj) || texObj == 0)\n        return;'
assert oldA in c, 'chainA not found'
assert oldB in c, 'chainB not found'

new_chain = '''{
        unsigned long override38 = 0;
        unsigned long backend = 0;
        unsigned long v11 = 0;
        if (!GFXPT_ReadU32((const char*)ctx + 0x3C, &override38))
            return;
        if (override38 != 0) {
            if (!GFXPT_ReadU32((const char*)ctx + 0x68, &backend) || backend == 0)
                return;
        } else {
            if (!GFXPT_ReadU32((const char*)ctx + 0x38, &backend) || backend == 0)
                return;
        }
        if (!GFXPT_ReadU32((const void*)(backend + 20), &v11) || v11 == 0)
            return;
        if (!GFXPT_ReadU32((const void*)(v11 + 152), &texObj) || texObj == 0)
            return;
        (void)holder;
    }'''

c = c.replace(oldA + '\n    ' + oldB, new_chain, 1)

# 3) build bump + version
c = c.replace('#define GFXPT_BUILD_ID              0x5639ul', '#define GFXPT_BUILD_ID              0x563Bul')
c = c.replace('#define GFXPT_BUILD_ID              0x563Aul', '#define GFXPT_BUILD_ID              0x563Bul')
c = c.replace('"v10"', '"v10.1"')

# 4) call site: pass ctx
c = c.replace('GFXPT_TrEmit(g_frameSeq, node);', 'GFXPT_TrEmit(g_frameSeq, node, ctx);')

py.write_text(c, encoding='utf-8')
print('patched OK')
