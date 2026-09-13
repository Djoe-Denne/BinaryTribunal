# BattlePresentation_SpawnDamagePopup @ 0x5068B0

- Instr (live): 91
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2796
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1844
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2455
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattlePresentation_SpawnDamagePopup(unsigned __int8 *)
- Notes parent: jz gate !(+2&1) OR (+3&0x10). add esp 8. 66 WORD slot +0x18 / amount +6 / bp +0x0E. BYTE glyphs +0x38. flags&4 → 10h ebp=8 ; &10h → 45h ebp=0. DWORD colors 0x00408040 / 0x00808080 (pas des calls). jge/jle/jg/jl signed. Occupancy 1+2 absent. void leftover EAX.

## C réconcilié

```c
/* BattlePresentation_SpawnDamagePopup @ 0x5068B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 91 instr, size 0xFA, end 0x5069AA. cdecl, 1 arg, retn C3. void leftover EAX.
 * Gate: spawn iff !(event[2]&1) OR (event[3]&0x10). jz ZF=1.
 * Alloc: sub_5083F0(dword_1D986A8, sub_5069B0) add esp,8; ebx=EAX; jz fail.
 * Widths: 66 movzx ax,[edi]; 66 mov [ebx+18h],ax WORD slot.
 * BYTE [ebx+0Ch]/[0Dh]=0; spill flags BYTE over arg_0.
 * flags&4: BYTE [ebx+10h]=10h, [ebx+11h]=0, ebp=8.
 * flags&10h: BYTE [ebx+10h]=45h, [ebx+11h]=0, ebp=0.
 * else: WORD amount [edi+6] zero-ext ESI; ecx=2710h; signed jge/jle/jg shrink /10;
 *   digits at [ebx+10h]: quot+38h BYTE, NUL, ebp+=4 per digit; signed jl/jg.
 * loc_506985: 66 mov [ebx+0Eh],bp WORD. flags&1: BYTE [ebx+0Ch]=1, DWORD 0x00408040
 *   else BYTE 0 and DWORD 0x00808080. Colors are immediates, not calls.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No ja/jb, no setcc, no jpt. No domain::.
 */

extern int dword_1D986A8[4]; /* 0x1D986A8 list head */
extern void __cdecl sub_5069B0(void); /* tick callback, address only */
extern unsigned __int8 *__cdecl sub_5083F0(int *list_head, int tick_fn);

void __cdecl BattlePresentation_SpawnDamagePopup(unsigned __int8 *event)
{
    unsigned __int8 *node;
    unsigned __int8 flags;
    int amount;
    int divisor;
    unsigned __int8 *digit;
    int xoff;

    if ((event[2] & 1) && !(event[3] & 0x10)) /* jz loc_5068C6 / jz loc_5069A7 */
        return;

    node = sub_5083F0(dword_1D986A8, (int)sub_5069B0); /* add esp,8 */
    if (!node)
        return;

    *(unsigned __int16 *)(node + 0x18) = event[0]; /* 66 movzx ax; 66 store WORD */
    flags = event[3]; /* 88 44 24 10 spill BYTE over arg_0 */
    node[0x0C] = 0;
    node[0x0D] = 0;

    if (flags & 4) { /* test al,4; jz loc_50690D */
        node[0x10] = 0x10;
        node[0x11] = 0;
        xoff = 8; /* ebp=8 */
    } else if (flags & 0x10) { /* test al,10h; jz loc_50691D */
        node[0x10] = 0x45;
        node[0x11] = 0;
        xoff = 0;
    } else {
        amount = *(unsigned __int16 *)(event + 6); /* xor esi,esi; 66 mov si,[edi+6] */
        divisor = 10000; /* 2710h */
        if (amount < divisor) { /* cmp esi,ecx; jge loc_506949 signed */
            while (divisor > 1) { /* cmp ecx,1; jle loc_506949 */
                divisor /= 10; /* 66666667h imul / sar 2 / shr 1Fh */
                if (divisor <= amount) /* cmp ecx,esi; jg loc_50692D */
                    break;
            }
        }
        digit = node + 0x10; /* lea edi,[ebx+10h] */
        xoff = 0;
        do {
            xoff += 4;
            *digit++ = (unsigned __int8)((amount / divisor) + 0x38); /* add al,38h BYTE */
            amount %= divisor; /* idiv remainder → esi */
            divisor /= 10;
        } while (amount >= 0 && divisor > 0); /* jl loc_50697D; jg loc_50694E signed */
        *digit = 0; /* BYTE NUL */
    }

    *(unsigned __int16 *)(node + 0x0E) = (unsigned __int16)xoff; /* 66 mov [ebx+0Eh],bp */
    if (flags & 1) {
        node[0x0C] = 1;
        *(unsigned __int32 *)(node + 0x1C) = 0x00408040; /* loc_408040 immediate */
    } else {
        node[0x0C] = 0;
        *(unsigned __int32 *)(node + 0x1C) = 0x00808080; /* sub_808080 immediate */
    }
}
```
