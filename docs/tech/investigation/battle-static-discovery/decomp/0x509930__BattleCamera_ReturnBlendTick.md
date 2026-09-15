# BattleCamera_ReturnBlendTick @ 0x509930

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=82
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=752
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=171
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleCamera_ReturnBlendTick(int)
- Notes parent: BYTE +0Ch frame pre-inc / +0Dh duration u8. phase=(u8<<10)/dur idiv signé. WORD 66 AX→word_1D9771E. sbb/and 0FEh/+2 → 0 ou 2. Pas occupancy 1+2. Pas OR 80h dword_1D97704+1. add esp,4.

## C réconcilié

```c
/* BattleCamera_ReturnBlendTick @ 0x509930
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x3D, end 0x50996D. cdecl, 1 arg, ESI saved, retn C3.
 * BYTE [task+0Ch] frame (pre-inc FE C0); BYTE [task+0Dh] duration u8 (xor ecx; mov cl).
 * phase = (u8_frame << 10) / duration; cdq; idiv ECX SIGNED (F7 F9). duration=0 unguarded.
 * Fixed_Sin4096_Q12 cdecl 1 arg, add esp,4. WORD 66 A3 word_1D9771E = AX only.
 * Return: cmp DL,AL unsigned; sbb EAX,EAX; AND AL,0FEh; ADD EAX,2 → 0 if frame<duration else 2.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / dword_1D97704 OR 80h: absent.
 * No domain::.
 */

extern unsigned short word_1D9771E; /* 0x1D9771E WORD item_size=2 */

unsigned int __cdecl Fixed_Sin4096_Q12(int); /* 0x56D130; add esp,4 */

int __cdecl BattleCamera_ReturnBlendTick(int task)
{
    unsigned char *node;
    unsigned char frame;
    unsigned char duration;
    int phase;
    unsigned int sin_q12;

    node = (unsigned char *)task; /* 8B 74 24 08 ESI=arg_0 */

    duration = node[0x0D]; /* 8A 4E 0D CL, ECX already 0 */
    frame = (unsigned char)(node[0x0C] + 1); /* 8A 46 0C; FE C0 wrap */
    node[0x0C] = frame; /* 88 46 0C BYTE */

    phase = ((int)frame << 10) / (int)duration; /* 25 FF000000; C1 E0 0A; 99; F7 F9 */

    sin_q12 = Fixed_Sin4096_Q12(phase); /* 50; E8; 83 C4 04 */

    word_1D9771E = (unsigned short)sin_q12; /* 66 A3 WORD AX */

    frame = node[0x0C]; /* 8A 56 0C DL re-read */
    duration = node[0x0D]; /* 8A 46 0D AL re-read */

    /* 3A D0; 1B C0; 24 FE; 83 C0 02 */
    if (frame < duration)
        return 0;
    return 2;
}
```
