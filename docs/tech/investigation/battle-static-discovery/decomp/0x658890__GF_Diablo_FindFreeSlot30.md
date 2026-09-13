# GF_Diablo_FindFreeSlot30 @ 0x658890

- Instr (live): 64
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=328
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1118
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=175
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_Diablo_FindFreeSlot30(_DWORD *)
- Notes parent: Ring base+0x7C5C stride 0x30 cap 0x40 wrap jb unsigned base+0x882C. Free = dword[slot]==0 (pas occupancy 1+2). sub_658810 0 args. WORD +0x2C=1 et +0x2E; BYTE byte_25051F0=2. Occupancy/0xD0/0x1D0/GF+0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_Diablo_FindFreeSlot30 @ 0x658890
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 64 instr, size 0xDA, end 0x65896A. cdecl, 1 arg (arg_0 as pointer), retn C3.
 * Callee: sub_658810 @ 0x658810 unsigned int() — 0 args, no add esp. EAX = node or 0.
 * Ring on gfDiablo_textureBasePtr: start +0x7C5C, stride 0x30, scan cap 0x40,
 * wrap bound base+0x882C via UNSIGNED jb. Free test = dword[slot]==0 (not occupancy 1+2).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Widths: node stores DWORD; slot+0x2C WORD=1; slot+0x2E WORD copy; byte_25051F0 BYTE=2.
 */

unsigned int sub_658810(void);

extern unsigned char *gfDiablo_textureBasePtr; /* 0x2505208 */
extern unsigned char *dword_25051FC;         /* 0x25051FC cursor */
extern unsigned char byte_25051F0;          /* 0x25051F0 */

_DWORD *__cdecl GF_Diablo_FindFreeSlot30(_DWORD *src)
{
    unsigned char *base;
    unsigned char *slot;
    unsigned char *srcb;
    unsigned char *node;
    unsigned int cnt;

    base = (unsigned char *)gfDiablo_textureBasePtr;
    slot = dword_25051FC;
    if (*(_DWORD *)slot != 0)
    {
        slot = base + 0x7C5C;
        if (*(_DWORD *)slot != 0)
        {
            cnt = 0x40;
            for (;;)
            {
                slot += 0x30;
                --cnt;
                if (cnt == 0)
                    return 0;
                if (*(_DWORD *)slot == 0)
                    break;
            }
        }
    }

    if ((unsigned int)slot < (unsigned int)(base + 0x882C))
        dword_25051FC = slot + 0x30;
    else
        dword_25051FC = base + 0x7C5C;

    node = (unsigned char *)sub_658810();
    if (!node)
        return 0;

    srcb = (unsigned char *)src;
    *(_DWORD *)(node + 0x14) = 0;
    *(_DWORD *)(node + 0) = *(_DWORD *)(srcb + 8);
    *(_DWORD *)(node + 4) = *(_DWORD *)(srcb + 0x0C);
    *(_DWORD *)(node + 8) = 0;
    *(_DWORD *)(node + 0x0C) = 0;
    *(_DWORD *)(node + 0x10) = *(_DWORD *)(srcb + 0x28);

    *(_WORD *)(slot + 0x2C) = 1;
    *(_DWORD *)(slot + 4) = (_DWORD)node;
    *(_DWORD *)(slot + 0) = (_DWORD)node;
    *(_DWORD *)(slot + 0x28) = *(_DWORD *)(srcb + 0x28);
    *(_DWORD *)(slot + 8) = *(_DWORD *)(srcb + 8);
    *(_DWORD *)(slot + 0x0C) = *(_DWORD *)(srcb + 0x0C);
    *(_DWORD *)(slot + 0x10) = *(_DWORD *)(srcb + 0x10);
    *(_DWORD *)(slot + 0x14) = *(_DWORD *)(srcb + 0x14);
    *(_DWORD *)(slot + 0x18) = *(_DWORD *)(srcb + 0x18);
    *(_DWORD *)(slot + 0x1C) = *(_DWORD *)(srcb + 0x1C);
    *(_DWORD *)(slot + 0x20) = *(_DWORD *)(srcb + 0x20);
    *(_DWORD *)(slot + 0x24) = *(_DWORD *)(srcb + 0x24);
    *(_WORD *)(slot + 0x2E) = *(_WORD *)(srcb + 0x2E);

    byte_25051F0 = 2;
    return (_DWORD *)node;
}
```
