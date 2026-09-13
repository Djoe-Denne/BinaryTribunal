# battle_run_battle_file_callback_2_sub_482590 @ 0x482590

- Instr (live): 27
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=65
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12
- A==B: non
- Push IDB: oui
- SetType: __int16 battle_run_battle_file_callback_2_sub_482590(void)
- Notes parent: scan 16 slots SIGNED jl; un call indirect 0-arg; sentinel WORD 0xFFFF à word_1D29A08+slot*12; empty AX=0x10; hit AX=slot movsx. Occupancy 1+2 / 0xD0 / F_CHAR 0x1D0 absents. TYPE_AFTER `__int16()`. Pas de Hex-Rays.

## C réconcilié

```c
/* battle_run_battle_file_callback_2_sub_482590 @ 0x482590
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes.txt.
 * 27 instr, size 0x73, end 0x482603. IDA type __int16(). No domain::.
 * One pending battle_file_callback_2 slot per call. Indirect 0-arg, no add esp.
 * lea ecx,[eax+eax*2]; WORD at word_1D29A08[ecx*4] (slot*12) vs 0xFFFF.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * jl signed bound 16. No ja/jg. No setcc. No jpt. No Hex-Rays.
 */

extern int battle_file_callback_2[16]; /* 0x1D29638 DWORD[16] */
extern __int16 word_1D29A08[];         /* 0x1D29A08 WORD at record+0, stride 12 */
extern __int16 word_1D29AD0;           /* 0x1D29AD0 pending count */
extern __int16 word_1D2A200;           /* 0x1D2A200 current slot */

__int16 battle_run_battle_file_callback_2_sub_482590(void)
{
    __int16 slot;
    int rec3;

    word_1D2A200 = 0; /* 66 xor ax,ax ; 66 mov word_1D2A200, ax */
    for (slot = 0; slot < 16; ++slot) { /* inc ax ; cmp ax,10h ; jl SIGNED */
        if (battle_file_callback_2[slot] != 0) /* cmp DWORD [...*4], esi */
            break;
    }
    if (slot >= 16) {
        word_1D2A200 = slot; /* dead-store AX=0x10 */
        word_1D2A200 = 0;    /* mov word_1D2A200, si */
        return slot;         /* AX leftover 0x10 */
    }

    word_1D2A200 = slot;
    ((void (__cdecl *)(void))battle_file_callback_2[slot])(); /* call DWORD, 0-arg */

    slot = word_1D2A200;           /* 0F BF movsx eax, word_1D2A200 */
    rec3 = slot + slot * 2;        /* 8D 0C 40 lea ecx,[eax+eax*2] */
    if (*(__int16 *)((char *)word_1D29A08 + rec3 * 4) == (__int16)0xFFFF) {
        --word_1D29AD0;            /* 66 dec WORD */
        *(__int16 *)((char *)word_1D29A08 + rec3 * 4) = 0; /* 66 mov WORD, si */
        battle_file_callback_2[slot] = 0; /* 89 mov DWORD, esi */
    }

    word_1D2A200 = 0; /* loc_4825FA */
    return slot;      /* EAX leftover = movsx slot */
}
```
