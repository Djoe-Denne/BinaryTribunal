# BattleActionSequence_WaitBusy @ 0x50AE80

- Instr (live): 26
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_WaitBusy(void)
- Notes parent: Stride 0x9C presente (add eax,9Ch), 7 iters, bound jl signe vs 0x1D9776C. Occupancy 1+2 absente (BYTE mask 2 a [eax-68h] seulement). Camera A0 BYTE. Idle EAX=sub_501190 (0 args, pas add esp). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_WaitBusy @ 0x50AE80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 26 instr, size 0x46, end 0x50AEC6. cdecl, 0 args. Saved ESI. retn C3.
 * BYTE TEST 84 48 98 [eax-68h], cl=2. DWORD 8B [eax-4] vs [eax].
 * add eax,9Ch (05 9C000000) stride PRESENT. Bound cmp+jl 7C SIGNED vs 0x1D9776C.
 * A1 DWORD CandidateA @ 0x1D96AAC. A0 BYTE g_BattleCameraFlags @ 0x1D97718.
 * call sub_501190 (0 args, no add esp); idle EAX leftover callee 0; busy B8 1.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66 / WORD. No setcc / jpt / ja. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this site reads low BYTE */
extern int __cdecl sub_501190(void); /* 0x501190: mov eax, dword_1D96DB8; retn */

int __cdecl BattleActionSequence_WaitBusy(void)
{
    unsigned char *cur; /* eax; unk_1D97328 = actors+0x68 */
    int eax;

    cur = g_BattlePresentationActors + 0x68;
    do {
        if ((cur[-0x68] & 2) != 0) { /* BYTE 84, cl=2 */
            if (*(unsigned int *)(cur - 4) != *(unsigned int *)cur)
                return 1; /* loc_50AEBF */
        }
        cur += 0x9C; /* 05 9C000000 */
    } while ((int)cur < (int)0x1D9776C); /* offset dword_1D9776C; jl 7C */

    if (g_GfSequenceContextCandidateA)
        return 1;
    if ((unsigned char)g_BattleCameraFlags)
        return 1; /* A0 low BYTE, not DWORD */
    eax = sub_501190();
    if (eax)
        return 1;
    return eax; /* idle: leftover 0 */
}
```
