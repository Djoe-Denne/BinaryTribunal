# BdLinkTask_CreateAndInitContext @ 0x8DC540

- Instr (live): 80
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2642
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=889
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1115
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkTask_CreateAndInitContext(_DWORD *list_head, int callback, int ctx_size, int parent_ctx)
- Notes parent: Register 2 args add esp 8. Arg0=list_head (pas dst_ctx). stosd depuis +0x0C (pas +0x0D), count signed (size-0xC)/4, jle 7E. Root: DWORD +18/+14=0, +10=self. Parent: BYTE +2A/2B/2E/2F copy, +28 inc, table *[p0C+4]+movsx(2A)*0x14 et *0x18. Occupancy/0xD0/0x1D0/0x44/OR bit0 absents. EAX=node ou 0.

## C réconcilié

```c
/* BdLinkTask_CreateAndInitContext @ 0x8DC540
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 80 instr, size 0xC8, end 0x8DC608. cdecl, 4 args. Saved ESI; EBX after
 * Register success; EDI only around rep stosd. retn C3. No sub esp.
 * add esp,8 once (Register 2 dwords). No other add esp.
 * Callee: BdLinkTask_Register(list_head, callback) @ 0x508360. EAX=node or 0.
 * BYTE OR bit0 is inside Register, not here. No BYTE +0x0D (uses +0x0C like 0x508630).
 * Widths: DWORD 89 46 10/14/18/1C/20 and 89 0B [ebx]; BYTE 8A/88 +2A/2B/2E/2F/28/2C/2D;
 *   FE C3 inc parent[+0x28]; MOVSX 0F BE of +2A and stashed +2B. No 66. No WORD.
 * cdq; and edx,3; add; sar 2 = signed (size-0x0C)/4. jle 7E signed skip stosd.
 * Table: *(parent[+0x0C]+4) + movsx(+2A)*0x14 then BYTE; *([rec+8]+movsx(+2B)*0x18) BYTE.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Catalogue dst_ctx is a lie: arg0 is list_head. EAX=ESI (node) or 0. No setcc/jpt/domain::.
 */

int __cdecl BdLinkTask_Register(int list_head, int callback);

int __cdecl BdLinkTask_CreateAndInitContext(_DWORD *list_head, int callback, int ctx_size, int parent_ctx)
{
    int node;
    int parent;
    int count;
    int table;
    int rec;
    int idx_a;
    int idx_b;
    unsigned __int8 stash_2b;
    unsigned __int8 sel_2a;
    unsigned __int8 nest;
    _DWORD *dst;

    node = BdLinkTask_Register((int)list_head, callback);
    if (node == 0)
        return 0;

    count = ctx_size - 0x0C;
    count = (count + ((count >> 31) & 3)) >> 2; /* cdq; and edx,3; add; sar 2 */
    if (count > 0) {                            /* jle signed 7E */
        dst = (_DWORD *)(node + 0x0C);          /* lea ebx, [esi+0Ch] */
        while (count--)
            *dst++ = 0;                         /* xor eax,eax; rep stosd */
    }

    parent = parent_ctx;
    if (parent == 0) {
        *(_DWORD *)(node + 0x18) = 0;
        *(_DWORD *)(node + 0x14) = 0;
        *(_DWORD *)(node + 0x10) = node;
        return node;
    }

    if (*(_DWORD *)(parent + 0x14) == 0)
        *(_DWORD *)(node + 0x14) = node;
    else
        *(_DWORD *)(node + 0x14) = *(_DWORD *)(parent + 0x14);

    *(_DWORD *)(node + 0x10) = *(_DWORD *)(parent + 0x10);
    *(_DWORD *)(node + 0x0C) = *(_DWORD *)(parent + 0x0C); /* 89 0B via ebx=esi+0Ch */

    stash_2b = *(_BYTE *)(parent + 0x2B);       /* 88 5C 24 10 then 0F BE 4C 24 0C */
    *(_BYTE *)(node + 0x2B) = stash_2b;
    *(_BYTE *)(node + 0x2E) = *(_BYTE *)(parent + 0x2E);
    *(_DWORD *)(node + 0x1C) = *(_DWORD *)(parent + 0x1C);
    *(_DWORD *)(node + 0x20) = *(_DWORD *)(parent + 0x20);
    *(_BYTE *)(node + 0x2F) = *(_BYTE *)(parent + 0x2F);
    sel_2a = *(_BYTE *)(parent + 0x2A);

    nest = *(_BYTE *)(parent + 0x28);
    nest++;                                     /* FE C3 BYTE, not OR bit0 */
    *(_DWORD *)(node + 0x18) = parent;
    *(_BYTE *)(parent + 0x28) = nest;
    *(_BYTE *)(node + 0x2A) = sel_2a;

    table = *(_DWORD *)(*(_DWORD *)(parent + 0x0C) + 4); /* 8B 49 04 */
    idx_a = (signed __int8)sel_2a;              /* 0F BE C2 */
    rec = table + idx_a * 0x14;                 /* lea [eax+eax*4]; [ecx+eax*4] */
    *(_BYTE *)(node + 0x2C) = *(_BYTE *)rec;
    idx_b = (signed __int8)stash_2b;
    *(_BYTE *)(node + 0x2D) = *(_BYTE *)(*(_DWORD *)(rec + 8) + idx_b * 0x18);

    return node;
}
```
