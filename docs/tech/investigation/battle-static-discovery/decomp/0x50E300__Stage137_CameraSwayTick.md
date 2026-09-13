# Stage137_CameraSwayTick @ 0x50E300

- Instr (live): 38
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=65
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=59
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=65
- A==B: non
- Push IDB: oui
- SetType: void Stage137_CameraSwayTick(void)
- Notes parent: CMP WORD flags+0. TEST AH,80h (0x8000). X: sin*2000 SAR 12 + DWORD B8B800, MOV WORD XZ+0. Z: -sin*500 SAR 12 + WORD B8B800+2, MOV WORD XZ+2. add esp,8. phase DWORD inc puis reset 0. Pas d'occupancy/0xD0/0x1D0/0x44. EAX leftover.

## C réconcilié

```c
/* Stage137_CameraSwayTick @ 0x50E300
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 38 instr, size 0x92, end 0x50E392. IDA type void().
 * cdecl, 0 args, no saved regs, no locals. retn C3. VOID leftover EAX.
 * Callee: Fixed_Sin4096_Q12(int) cdecl; two pushes; add esp,8 after 2nd call.
 * Gate: CMP WORD g_BattleCameraFlags,+0 == 0 (66 83 3D); else reset phase.
 *        TEST AH,80h on dword_1D97704 (bit 15 / 0x8000); else reset phase.
 * X: sin(phase*8)*125, shl 4, SAR 0Ch, DWORD add dword_B8B800, MOV WORD XZ+0.
 * Z: -5*sin, *25 → -125, shl 2, SAR 0Ch, ADD DX WORD B8B800+2, MOV WORD XZ+2.
 * Phase dword_1D99BB8: DWORD inc after Z scale, store before WORD Z. Skip: DWORD 0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::. Caller: BS_Stage137_RenderTick only.
 */

extern unsigned int g_BattleCameraFlags;        /* 0x1D97718; this site WORD CMP +0 */
extern unsigned int dword_1D97704;              /* 0x1D97704; TEST AH,80h */
extern unsigned int dword_1D99BB8;              /* 0x1D99BB8 DWORD phase */
extern unsigned int dword_B8B800;               /* 0xB8B800 cached world XZ */
extern unsigned int Battle_Camera_world_XZ_s16; /* 0xB8B7F0 two packed s16 */

unsigned int __cdecl Fixed_Sin4096_Q12(int angle);

void Stage137_CameraSwayTick(void)
{
    unsigned int phase;
    int sin_q12;
    int dx;
    int dz;

    if (*(unsigned short *)&g_BattleCameraFlags != 0)
        goto loc_50E387;

    if (dword_1D97704 & 0x8000u) /* TEST AH,80h after DWORD load */
        goto loc_50E387;

    phase = dword_1D99BB8;

    sin_q12 = (int)Fixed_Sin4096_Q12((int)(phase * 8u));
    dx = sin_q12 + sin_q12 * 4; /* *5 */
    dx = dx + dx * 4;           /* *25 */
    dx = dx + dx * 4;           /* *125 */
    dx = (dx << 4) >> 12;       /* *2000 / 4096, SAR */
    dx += (int)dword_B8B800;    /* 03 D0 DWORD */
    *(unsigned short *)&Battle_Camera_world_XZ_s16 = (unsigned short)dx;

    sin_q12 = (int)Fixed_Sin4096_Q12((int)(phase * 8u));
    dz = -sin_q12;
    dz = (dz << 2) - sin_q12; /* -5 * sin */
    dz = dz + dz * 4;         /* *5 = -25 */
    dz = dz + dz * 4;         /* *5 = -125 */
    dz = (dz << 2) >> 12;     /* *4 / 4096 = -500/4096, SAR */
    dword_1D99BB8 = phase + 1u;
    *(unsigned short *)((char *)&Battle_Camera_world_XZ_s16 + 2) =
        (unsigned short)dz + *(unsigned short *)((char *)&dword_B8B800 + 2);
    return;

loc_50E387:
    dword_1D99BB8 = 0;
}
```
