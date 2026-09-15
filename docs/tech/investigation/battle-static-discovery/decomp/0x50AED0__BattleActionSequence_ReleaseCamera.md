# BattleActionSequence_ReleaseCamera @ 0x50AED0

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=36
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=162
- A==B: non
- Push IDB: oui
- SetType: int *BattleActionSequence_ReleaseCamera(void)
- Notes parent: 16 instr. BYTE2==3 saute les stores flags/blend. WORD flags!=0 ou bit15 (TEST AH,80h) → flags=0 + blend 0x1000. Toujours AND WORD 7FFFh puis 7 acteurs stride 0x9C AND WORD 87FFh, JL signé jusqu'à 0x1D97704. Occupancy 1+2 absente. EAX leftover = 0x1D97704. A1=load vs B8/3D=offset.

## C réconcilié

```c
/* BattleActionSequence_ReleaseCamera @ 0x50AED0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x4F, end 0x50AF1F. No args, no frame, retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Presentation stride 0x9C used: 0x1D972C0 + 7*0x9C == 0x1D97704.
 * Widths: BYTE cmp at +2; WORD (66) stores/ANDs; A1 DWORD load then TEST AH,80h.
 * A1=load dword_1D97704; B8=offset g_BattlePresentationActors; 3D=offset dword_1D97704.
 * Loop JL signed (not JA). EAX leftover = 0x1D97704.
 * No domain::.
 */

extern unsigned int g_BattleCameraFlags; /* 0x1D97718 */
extern unsigned int dword_1D97704;       /* 0x1D97704 */
extern unsigned short word_1D9771E;      /* 0x1D9771E */
extern int g_BattlePresentationActors[]; /* 0x1D972C0 */

int *BattleActionSequence_ReleaseCamera(void)
{
    unsigned char *p;

    if (*((unsigned char *)&g_BattleCameraFlags + 2) != 3)
    {
        if (*(unsigned short *)&g_BattleCameraFlags != 0)
            goto loc_50AEED;
        if (((dword_1D97704 >> 8) & 0x80) != 0)
        {
loc_50AEED:
            *(unsigned short *)&g_BattleCameraFlags = 0;
            word_1D9771E = 0x1000;
        }
    }

    *(unsigned short *)&dword_1D97704 &= 0x7FFF;

    p = (unsigned char *)g_BattlePresentationActors;
    do
    {
        *(unsigned short *)p &= 0x87FF;
        p += 0x9C;
    } while ((int)p < (int)&dword_1D97704);

    return (int *)p;
}
```
