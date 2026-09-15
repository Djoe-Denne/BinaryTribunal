# Gfx_WalkDrawList @ 0x4178D7

- Instr (live): 65
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_WalkDrawList(_DWORD *, int)
- Notes parent: cdecl 2 args (callers add esp,8). jz/jnz only (pas ja/jg). stamp +88 vs *gen +52. setup +156 once then walk +160 from same head. walk +A0 et gen-ptr non null-check. var_10 ctx+38h/3Ch/68h dead. DWORD only. Occupancy absente. void, EAX leftover. usercall IDA rejeté.

## C réconcilié

```c
/* Gfx_WalkDrawList @ 0x4178D7
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 65 instr, size 0xBF, end 0x417996. cdecl, 2 args, retn C3. Callers add esp,8.
 * Frame: push ebp / mov ebp,esp / sub esp,10h.
 * JCC: jz (list==0, ctx+3Ch==0, var_10==0, head==0, setup==0) / jnz (stamp mismatch, loop).
 * No ja/jg/setcc/jpt. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD (83 7D/78/B9, 3B 08, 8B/89, 8B 11). No 66 prefix.
 * Indirect cdecl: [list+9Ch] setup once, [list+0A0h] walk per node; add esp,0Ch each.
 * Walk +0xA0 not null-checked. generation_ptr +0x34 not null-checked.
 * var_10 (ctx+38h/3Ch/68h) written then dead. void: EAX leftover.
 */

void __cdecl Gfx_WalkDrawList(_DWORD *list, int cookie)
{
    _DWORD *generation_ptr;                  /* var_C  [ebp-0Ch] */
    _DWORD *node;                            /* var_8  [ebp-8]   */
    _DWORD *ctx;                             /* var_4  [ebp-4]   */
    _DWORD var_10;                           /* [ebp-10h] dead after loc_417936 */

    if (list == 0)                           /* 83 7D 08 00 ; jz loc_417992 */
        return;

    generation_ptr = (_DWORD *)list[0x34 / 4]; /* 8B 48 34 */
    if (list[0x58 / 4] != *generation_ptr)   /* 8B 4A 58 ; 3B 08 ; jnz loc_417992 */
        return;

    ctx = (_DWORD *)list[0x18 / 4];          /* 8B 42 18 */

    var_10 = ctx[0x38 / 4];                  /* 8B 51 38 */
    if (ctx[0x3C / 4] != 0)                  /* 83 78 3C 00 ; jz loc_417936 */
    {
        var_10 = ctx[0x68 / 4];              /* 8B 51 68 */
        if (var_10 == 0)                     /* 83 7D F0 00 ; jz loc_41792D */
            var_10 = ctx[0x38 / 4];          /* loc_41792D: 8B 48 38 */
    }

    node = (_DWORD *)list[0x94 / 4];         /* 8B 82 94 00 00 00 head +148 */
    if (node == 0)                           /* 83 7D F8 00 ; jz loc_417992 */
        return;

    if (list[0x9C / 4] == 0)                 /* 83 B9 9C 00 00 00 00 ; jz */
        return;

    ((void (__cdecl *)(_DWORD *, _DWORD *, int))list[0x9C / 4])(ctx, node, cookie);
                                             /* push cookie, node, ctx ; add esp,0Ch */

    do                                       /* loc_41796C: first node = same head */
    {
        ((void (__cdecl *)(_DWORD *, _DWORD *, int))list[0xA0 / 4])(ctx, node, cookie);
                                             /* add esp,0Ch ; +0xA0 not null-checked */
        node = (_DWORD *)*node;              /* 8B 11 DWORD next at node+0 */
    } while (node != 0);                     /* 83 7D F8 00 ; jnz loc_41796C */
}
```
