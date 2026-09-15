# Gfx_SetPrimBlendMode @ 0x407162

- Instr (live): 86
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_SetPrimBlendMode(int, int, _DWORD *)
- Notes parent: ja unsigned var_108>3u (jpt 4 cases @ 0x40728B). Mode 6 relit [prim+44h]. OR/AND DH bit 0x400 on +8/+0C. DWORD +5C = 80/FF/FF/40/FF. Occupancy absente (+44 = blend mode, pas GF Exists). applyLookup==0 saute FFGetBufferAddress. void. ≠Driver 0x41E752.

## C réconcilié

```c
/* Gfx_SetPrimBlendMode @ 0x407162
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 86 instr, size 0x129, end exclusive 0x40728B. cdecl, 3 args, retn C3. EBP frame, sub esp,108h.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * prim+0x44 is Gfx desc blend-mode DWORD (InitDrawListDesc writes 1), not F_CHAR GF Exists.
 * JCC: jz prim==0; jz mode==6; ja (unsigned) var_108>3u; jz applyLookup==0; jz found==0.
 * No jg/jl/setcc/66. Jump table jpt_4071C5 @ 0x40728B: 0x4071CC/1D8/1E4/1F0 (cases 0..3).
 * Widths: DWORD cmp/store +44/+5C (89/C7); BYTE 80 CE 04 / 80 E6 FB on DH of dwords +8/+0C (mask 0x400).
 * Callees: FFGetBufferAddress 0 args; sub_4187F7(mode, buf) add esp,8; sub_4187B0(found, prim) add esp,8;
 *   _sprintf add esp,0Ch; OutputDebugString_1 add esp,4.
 * Mode 6: do not write +44; arg_4 = [prim+44h]; OR 0x400 then switch still run.
 * Default (mode>3u): AND-clear 0x400 on +8/+0C AFTER the earlier OR, then +5C=0xFF.
 * applyLookup==0: skip lookup (no FFGetBufferAddress). Void: leftover EAX ignored.
 * Not GfxDriver_SetBlendMode 0x41E752.
 */

int __cdecl FFGetBufferAddress(void);
int __cdecl sub_4187F7(int, int);
_DWORD *__cdecl sub_4187B0(_DWORD *, _DWORD *);
int _sprintf(char *Buffer, const char *Format, ...);
void __cdecl OutputDebugString_1(const char *lpOutputString);

void __cdecl Gfx_SetPrimBlendMode(int applyLookup, int mode, _DWORD *prim)
{
    unsigned int switchVal; /* [ebp-108h] var_108 */
    int found;              /* [ebp-104h] var_104 */
    char OutputString[0x100]; /* [ebp-100h] */

    if (prim == 0) /* cmp [ebp+arg_8],0 ; jz loc_407287 */
        return;

    if (mode != 6) { /* cmp [ebp+arg_4],6 ; jz loc_407186 */
        *(_DWORD *)((char *)prim + 0x44) = (_DWORD)mode; /* 89 48 44 */
    } else {
        mode = (int)*(_DWORD *)((char *)prim + 0x44); /* 8B 42 44 ; 89 45 0C */
    }

    /* 80 CE 04: or dh,4 on DWORD [prim+0Ch] then [prim+8] — bit 10, mask 0x400 */
    *(_DWORD *)((char *)prim + 0x0C) |= 0x400u;
    *(_DWORD *)((char *)prim + 8) |= 0x400u;

    switchVal = (unsigned int)mode; /* 89 8D F8 FE FF FF */
    switch (switchVal) {            /* cmp var_108,3 ; ja def_4071C5 (unsigned) */
    case 0: /* loc_4071CC */
        *(_DWORD *)((char *)prim + 0x5C) = 0x80; /* C7 40 5C 80 00 00 00 */
        break;
    case 1: /* loc_4071D8 */
        *(_DWORD *)((char *)prim + 0x5C) = 0xFF;
        break;
    case 2: /* loc_4071E4 */
        *(_DWORD *)((char *)prim + 0x5C) = 0xFF;
        break;
    case 3: /* loc_4071F0 */
        *(_DWORD *)((char *)prim + 0x5C) = 0x40;
        break;
    default: /* def_4071C5 */
        /* 80 E6 FB: and dh,0FBh — clears the same bit after the OR above */
        *(_DWORD *)((char *)prim + 0x0C) &= ~0x400u;
        *(_DWORD *)((char *)prim + 8) &= ~0x400u;
        *(_DWORD *)((char *)prim + 0x5C) = 0xFF;
        break;
    }

    if (applyLookup == 0) /* cmp [ebp+arg_0],0 ; jz loc_407287 */
        return;

    found = sub_4187F7(mode, FFGetBufferAddress()); /* push buf; push mode; add esp,8 */
    if (found != 0) {
        sub_4187B0((_DWORD *)found, prim); /* push prim; push found; add esp,8 */
        return;
    }

    _sprintf(OutputString, "BLEND MODE NOT FOUND FOR MODE %d \n", mode); /* add esp,0Ch */
    OutputDebugString_1(OutputString); /* add esp,4 */
}
```
