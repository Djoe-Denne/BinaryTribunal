# RenderGL_CommitRenderState @ 0x438682

- Instr (live): 464
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2323
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1445
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2525
- A==B: non
- Push IDB: oui
- SetType: int __cdecl RenderGL_CommitRenderState(_DWORD *, _DWORD *)
- Notes parent: jz/jnz only. Masks 0xFFFDFBFD then 0xFFFDFFFD. Type 14 bit 0x4000 -> glDisable_CullFace. Type 16 = ZWRITE/glDepthMask != list-16. Type 5 writes +0x14 enabled / +0x18 GL arg. BYTE 8A then DWORD stores. Pas occupancy. EAX leftover. jmp 0x438AE6. loc_438B7A kept. Pas de presentation::.

## C réconcilié

```c
/* RenderGL_CommitRenderState @ 0x438682
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 464 instr, size 0x647, end 0x438CC9. cdecl, 2 args, retn C3. EBP frame, sub esp,24h.
 * jz/jnz only. No ja/jg/jl/jb, no setcc, no jump table, no call [reg], no occupancy 0xF8.
 * Slot 30 GL commit: dirty bits in *(rs+0xC) as (1<<type); enable bits in *(rs+8).
 * Cache = *(engine+0xA84). No NULL-guard on cache (unlike Gfx_ShadowSetRenderState).
 * Type 14 bit 0x4000 -> glDisable_CullFace (GL_CULL_FACE 0xB44). Type 13 nested under type14.
 * Type 16 bit 0x10000 = ZWRITE / au_re_glDepthMask. Distinct from dead draw-list type 16.
 * Type 5 quirk: enabled writes cache+0x14=1 but GL always reads cache+0x18.
 * BYTE load 8A 0C 10 then and 1; all other stores DWORD (89/C7). No 66 prefix.
 * +0x44 on rs / *(engine+0xA80) is blend mode, not GF Exists. No slot 0xD0 / F_CHAR 0x1D0.
 * First region (dirty & 0xFFFDFBFD) ends jmp loc_438CC5 @ 0x438AE6. Second = loc_438AEB.
 * EAX leftover at epilogue (cmp/jz does not zero EAX on rs==0).
 * Distinct from Gfx_ShadowSetRenderState 0x438599 (slot 29) and RenderGL_ApplyBlendMode 0x4385E9.
 */

int __cdecl RenderGL_CommitRenderState(_DWORD *rs, _DWORD *engine)
{
    _DWORD var_4;                       /* ebp-4:  *(rs+0xC) dirty mask */
    _DWORD *var_8;                      /* ebp-8:  *(engine+0xA84) cache */
    _DWORD var_C;                       /* ebp-0xC flag 0/1 */
    _DWORD *var_10;                     /* ebp-0x10: obj+0xA0 (region 1) */
    _DWORD *var_14;                     /* ebp-0x14: obj+0x98 (region 1) */
    _DWORD *var_18;                     /* ebp-0x18: *(rs+0x14) (region 1) */
    _DWORD *var_1C;                     /* ebp-0x1C: obj+0xA0 (region 2) */
    _DWORD *var_20;                     /* ebp-0x20: obj+0x98 (region 2) */
    _DWORD *var_24;                     /* ebp-0x24: *(rs+0x14) (region 2) */

    if (rs == 0)
        goto loc_438CC5;

    var_4 = rs[0xC / 4];
    var_8 = (_DWORD *)engine[0xA84 / 4];

    if ((var_4 & 0xFFFDFBFD) != 0)      /* ~0x20402: not only types 1/10/17 */
    {
        /* type 1 bit 0x2 @ 0x4386B8 */
        if (var_4 & 2)
        {
            var_18 = (_DWORD *)rs[0x14 / 4];
            var_8[0x78 / 4] = (_DWORD)var_18;   /* written even if NULL */
            if (var_18 != 0 && (rs[8 / 4] & 2))
            {
                var_14 = (_DWORD *)var_18[0x98 / 4];
                var_10 = (_DWORD *)var_18[0xA0 / 4];
                if (var_10 != 0)
                {
                    if (var_10[0x1C / 4] != 0)
                    {
                        if ((*(_BYTE *)(var_10[0x20 / 4] + var_18[0x9C / 4]) & 1) != 0)
                            var_C = 1;
                        else
                            var_C = 0;
                    }
                    else if (var_14[8 / 4] != 0)
                    {
                        var_C = 1;
                    }
                    else
                    {
                        var_C = 0;
                    }
                }
                else if (var_14[8 / 4] != 0)
                {
                    var_C = 1;
                }
                else
                {
                    var_C = 0;
                }
                var_8[0x20 / 4] = var_C;
            }
        }

        /* type 9 bit 0x200 @ 0x438784 */
        if (var_4 & 0x200)
        {
            if (rs[8 / 4] & 0x200)
                var_C = 1;
            else
                var_C = 0;
            var_8[0x24 / 4] = var_C;
            sub_445247(var_C);          /* add esp,4 */
        }

        /* type 2 bit 0x4 @ 0x4387C5 — no cache store */
        if (var_4 & 4)
        {
            if (rs[8 / 4] & 4)
                sub_4453F1(1);
            else
                sub_4453F1(0);
        }

        /* type 3 bit 0x8 @ 0x4387F2 */
        if (var_4 & 8)
        {
            if (rs[8 / 4] & 8)
                var_C = 1;
            else
                var_C = 0;
            var_8[0x0C / 4] = var_C;
            sub_445452(var_C);          /* add esp,4 */
        }

        /* type 14 bit 0x4000 cull @ 0x43882E; type 13 bit 0x2000 nested */
        if (var_4 & 0x4000)
        {
            if (rs[8 / 4] & 0x4000)
            {
                var_8[0x38 / 4] = 1;
                glDisable_CullFace();   /* GL_CULL_FACE 0xB44 */
            }
            else if (var_4 & 0x2000)
            {
                if (rs[8 / 4] & 0x2000)
                {
                    var_8[0x34 / 4] = 1;
                    sub_444B8D();
                }
                else
                {
                    var_8[0x34 / 4] = 0;
                    sub_444B72();
                }
            }
        }
        else if (var_4 & 0x2000)
        {
            if (rs[8 / 4] & 0x2000)
            {
                var_8[0x34 / 4] = 1;
                sub_444B8D();
            }
            else
            {
                var_8[0x34 / 4] = 0;
                sub_444B72();
            }
        }

        /* type 15 bit 0x8000 @ 0x4388D5 */
        if (var_4 & 0x8000)
        {
            if (rs[8 / 4] & 0x8000)
                var_C = 1;
            else
                var_C = 0;
            var_8[0x3C / 4] = var_C;
            sub_44526A(var_C);          /* add esp,4 */
        }

        /* type 16 bit 0x10000 ZWRITE @ 0x438917 — not list-16 */
        if (var_4 & 0x10000)
        {
            if (rs[8 / 4] & 0x10000)
                var_C = 1;
            else
                var_C = 0;
            var_8[0x40 / 4] = var_C;
            au_re_glDepthMask((GLboolean)var_C); /* add esp,4 */
        }

        /* type 8 bit 0x100 @ 0x438959 — cache only, no GL */
        if (var_4 & 0x100)
        {
            if (rs[8 / 4] & 0x100)
                var_C = 1;
            else
                var_C = 0;
            var_8[0x20 / 4] = var_C;
        }

        /* type 10 bit 0x400 blend @ 0x43898F */
        if (var_4 & 0x400)
        {
            if (rs[8 / 4] & 0x400)
                var_C = 1;
            else
                var_C = 0;
            if (var_C != 0)
            {
                if (engine[0xA7C / 4] != 0)
                    var_8[0x70 / 4] = *(_DWORD *)(engine[0xA80 / 4] + 0x44);
                else
                    var_8[0x70 / 4] = rs[0x44 / 4];
            }
            else
            {
                var_8[0x70 / 4] = 4;
            }
            RenderGL_ApplyBlendMode(var_8[0x70 / 4], (int)engine); /* add esp,8 */
        }

        /* type 17 bit 0x20000 shade @ 0x438A0C */
        if (var_4 & 0x20000)
        {
            if ((rs[8 / 4] & 0x20000) && engine[0xA6C / 4] == 0)
            {
                if (rs[0x24 / 4] == 1)
                {
                    var_8[0x74 / 4] = 0;
                    au_re_glShadeModel();
                }
                else
                {
                    var_8[0x74 / 4] = 1;
                    au_re_glShadeModel_0();
                }
            }
            else
            {
                var_8[0x74 / 4] = 0;
                au_re_glShadeModel();
            }
        }

        /* type 5 bit 0x20 quirk @ 0x438A6E */
        if (var_4 & 0x20)
        {
            if (rs[8 / 4] & 0x20)
                var_8[0x14 / 4] = 1;    /* does not write +0x18 */
            else
                var_8[0x18 / 4] = 0;
            au_re_glTexParameteri(var_8[0x18 / 4]); /* add esp,4; reads +0x18 */
        }

        /* type 6 bit 0x40 @ 0x438AAA */
        if (var_4 & 0x40)
        {
            if (rs[8 / 4] & 0x40)
                var_8[0x18 / 4] = 1;
            else
                var_8[0x18 / 4] = 0;
            au_re_glTexParameteri_0(var_8[0x18 / 4]); /* add esp,4 */
        }

        goto loc_438CC5;                /* jmp @ 0x438AE6 */
    }

    /* loc_438AEB — types 1/10/17 remainder */
    if ((var_4 & 0xFFFDFFFD) != 0)      /* ~0x20002 */
    {
        if (var_4 & 0x400)
        {
            if (rs[8 / 4] & 0x400)
                var_C = 1;
            else
                var_C = 0;
            if (var_C != 0)
            {
                if (engine[0xA7C / 4] != 0)
                    var_8[0x70 / 4] = *(_DWORD *)(engine[0xA80 / 4] + 0x44);
                else
                    var_8[0x70 / 4] = rs[0x44 / 4];
            }
            else
            {
                var_8[0x70 / 4] = 4;
            }
            RenderGL_ApplyBlendMode(var_8[0x70 / 4], (int)engine); /* add esp,8 */
        }
        else                            /* loc_438B7A */
        {
            var_8[0x70 / 4] = 4;
            RenderGL_ApplyBlendMode(var_8[0x70 / 4], (int)engine); /* add esp,8 */
        }
    }

    /* type 1 bit 0x2 @ 0x438B97 — same nest, var_24/var_20/var_1C */
    if (var_4 & 2)
    {
        var_24 = (_DWORD *)rs[0x14 / 4];
        var_8[0x78 / 4] = (_DWORD)var_24;
        if (var_24 != 0 && (rs[8 / 4] & 2))
        {
            var_20 = (_DWORD *)var_24[0x98 / 4];
            var_1C = (_DWORD *)var_24[0xA0 / 4];
            if (var_1C != 0)
            {
                if (var_1C[0x1C / 4] != 0)
                {
                    if ((*(_BYTE *)(var_1C[0x20 / 4] + var_24[0x9C / 4]) & 1) != 0)
                        var_C = 1;
                    else
                        var_C = 0;
                }
                else if (var_20[8 / 4] != 0)
                {
                    var_C = 1;
                }
                else
                {
                    var_C = 0;
                }
            }
            else if (var_20[8 / 4] != 0)
            {
                var_C = 1;
            }
            else
            {
                var_C = 0;
            }
            var_8[0x20 / 4] = var_C;
        }
    }

    /* type 17 bit 0x20000 shade @ 0x438C63 */
    if (var_4 & 0x20000)
    {
        if ((rs[8 / 4] & 0x20000) && engine[0xA6C / 4] == 0)
        {
            if (rs[0x24 / 4] == 1)
            {
                var_8[0x74 / 4] = 0;
                au_re_glShadeModel();
            }
            else
            {
                var_8[0x74 / 4] = 1;
                au_re_glShadeModel_0();
            }
        }
        else
        {
            var_8[0x74 / 4] = 0;
            au_re_glShadeModel();
        }
    }

loc_438CC5:
    return 0;                           /* leftover EAX; not an intentional 0 */
}
```
