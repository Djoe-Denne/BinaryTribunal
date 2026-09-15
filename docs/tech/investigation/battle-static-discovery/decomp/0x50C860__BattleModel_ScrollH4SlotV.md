# BattleModel_ScrollH4SlotV @ 0x50C860

- Instr (live): 79
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3459
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7080
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3991
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl BattleModel_ScrollH4SlotV(int actor, int tableIndex, __int16 scrollV)
- Notes parent: table [actor+84h]+30h u16 offsets. Scan 12 bits jl SIGNE sur masque WORD [state+2], rec[0] = index 0-based parmi bits set. Deux EnqueueType3 + un add esp,18h. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents (pas de test [actor],2). ja/jg absents. Loads DWORD chevauches 8B, stores WORD 66, word1 -= bx. EAX early-out 0 ou table ptr; succes = leftover EnqueueType3. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleModel_ScrollH4SlotV @ 0x50C860
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 79 instr, size 0xE9, end 0x50C949. cdecl, 3 args. sub esp,8; esi/edi; ebx on success only.
 * retn C3. Caller AdvanceH4Frame @ 0x50C9F8 cleans add esp,0Ch.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. Bit-scan bound is jl SIGNED (ecx < 0Ch). No setcc. No jump table.
 * Two EnqueueType3 then one add esp,18h. No domain::.
 */

char *__cdecl BattleTimQueue_EnqueueType3(unsigned int *packed, __int16 a, __int16 b);

char *__cdecl BattleModel_ScrollH4SlotV(int actor, int tableIndex, __int16 scrollV)
{
    unsigned short packed[4]; /* var_8, var_8+2, var_4, var_2 — 8-byte blob */
    unsigned char *state;
    unsigned short *table;
    unsigned char *rec;
    unsigned short off;
    unsigned int mask;
    int idx;
    int bit;
    int odd;
    int d0;
    int d1;
    int scroll;

    state = *(unsigned char **)(actor + 0x84);
    table = *(unsigned short **)(state + 0x30);
    if (table == 0)
        return 0; /* EAX leftover 0; ebx never pushed */

    off = table[tableIndex]; /* 66: WORD [table+index*2] */
    if (off == 0)
        return (char *)table; /* EAX leftover = table; ebx never pushed */

    rec = (unsigned char *)table + off; /* and edi,0FFFFh; add edi,eax */

    idx = (int)rec[0]; /* 0-based index among SET bits of WORD [state+2] */
    mask = *(unsigned short *)(state + 2);
    for (bit = 0; bit < 12; bit++) { /* cmp ecx,0Ch / jl SIGNED */
        if (mask & (1u << bit)) {
            if (idx == 0) {
                idx = bit; /* loc_50C8B9: mov eax,ecx */
                break;
            }
            idx--; /* mov esi,eax; dec eax; test esi (not yet zero) */
        }
    }
    /* miss: idx leftover = rec[0] - set-bits-seen (may be negative); still pack */

    scroll = (int)scrollV; /* ebx = DWORD arg_8; this caller zero-extends rec[+6] */
    odd = idx & 1; /* esi; later shl 7 */

    /* cdq; sub eax,edx; sar eax,1 = signed /2 toward 0, then +0Ah, shl 6 */
    packed[0] = (unsigned short)((((idx / 2) + 10) << 6) + rec[1]);
    packed[1] = (unsigned short)(rec[2] + (odd << 7));
    packed[2] = (unsigned short)rec[3]; /* 66 store of movzx cx, rec[3] */

    /* 8B overlapping DWORD loads (no 66). packed[3] stored AFTER dword[+2] load. */
    d1 = (int)((unsigned int)packed[1] | ((unsigned int)packed[2] << 16));
    d1 -= scroll;
    d0 = (int)((unsigned int)packed[0] | ((unsigned int)packed[1] << 16));
    packed[3] = (unsigned short)rec[4];
    BattleTimQueue_EnqueueType3((unsigned int *)packed, (__int16)d0, (__int16)d1);

    packed[1] = (unsigned short)(packed[1] - (unsigned short)scroll); /* 66 29 word1 -= bx */
    packed[3] = (unsigned short)scroll; /* WORD [var_2] = bx */

    d0 = (int)((unsigned int)packed[0] | ((unsigned int)packed[1] << 16));
    d1 = rec[4] + (odd << 7) + (rec[2] - scroll);
    return BattleTimQueue_EnqueueType3((unsigned int *)packed, (__int16)d0, (__int16)d1);
    /* add esp,18h; pop ebx; loc_50C943: pop edi; pop esi; add esp,8; retn */
}
```
