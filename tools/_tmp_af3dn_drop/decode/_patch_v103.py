#!/usr/bin/env python3
"""v10.3 patch: ND08 footer texobj = T via the ctx chain (not *(texinfo+0x10))."""
from pathlib import Path

py = Path(r'docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.c')
c = py.read_text(encoding='utf-8')

old = '''        if (texinfoPtr != 0)
        {
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x20), &tpage);
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x14), &tmode);
            /* v10 — footer : texobj = *(texinfo+0x10) (VALEUR T) ; échec →
             * 0, non-fatal (diagnostic — style page_probe TX07). Clé de
             * mapping décode-side footer ND08 ↔ TR08.texobj. */
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x10), &texObj);
        }'''
assert old in c, 'footer block not found'

new = '''        if (texinfoPtr != 0)
        {
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x20), &tpage);
            (void)GFXPT_ReadU32((const void*)(texinfoPtr + 0x14), &tmode);
        }
        if (ctx != 0)
        {
            /* v10.3 — footer texobj = T via la CHAÎNE ctx (la même que
             * GFXPT_TrEmit : backend = ctx[0x3C] ? ctx[0x68] : ctx[0x38] ;
             * v11 = *(backend+20) ; T = *(v11+152)) — *(texinfo+0x10) pointait
             * le mauvais objet (le backend, pas les données). */
            unsigned long bkw = 0;
            unsigned long ovl = 0;
            unsigned long v11f = 0;
            if (GFXPT_ReadU32((const char*)ctx + 0x3C, &ovl) && ovl != 0)
            {
                if (GFXPT_ReadU32((const char*)ctx + 0x68, &bkw) && bkw != 0)
                    if (GFXPT_ReadU32((const void*)(bkw + 20), &v11f) && v11f != 0)
                        (void)GFXPT_ReadU32((const void*)(v11f + 152), &texObj);
            }
            else if (GFXPT_ReadU32((const char*)ctx + 0x38, &bkw) && bkw != 0)
            {
                if (GFXPT_ReadU32((const void*)(bkw + 20), &v11f) && v11f != 0)
                    (void)GFXPT_ReadU32((const void*)(v11f + 152), &texObj);
            }
        }'''
c = c.replace(old, new)

# build bump
c = c.replace('#define GFXPT_BUILD_ID              0x563Cul', '#define GFXPT_BUILD_ID              0x563Dul')

py.write_text(c, encoding='utf-8')
print('patched OK')
