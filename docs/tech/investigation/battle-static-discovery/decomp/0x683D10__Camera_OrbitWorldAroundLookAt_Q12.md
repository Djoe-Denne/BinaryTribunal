# Camera_OrbitWorldAroundLookAt_Q12 @ 0x683D10

- Instr (live): 51
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=116
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=93
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1152
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Camera_OrbitWorldAroundLookAt_Q12(int, int)
- Notes parent: Z = LookAt.Z + ((world.Z-LookAt.Z)*t>>12) via `add dx,cx` WORD. X/Y = rotate (dx,dy) by sin/cos(arg_0) then DWORD LookAt add-back, WORD stores. `add esp,8`. EAX leftover Y dword. Occupancy / 0xD0 / 0x1D0 / 0x44 / LCG absents.

## C réconcilié

```c
/* Camera_OrbitWorldAroundLookAt_Q12 @ 0x683D10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 51 instr, size 0xA8, end 0x683DB8. cdecl, 2 args. 4 saved regs ebx/ebp/esi/edi, no locals.
 * add esp,8 = 2 cdecl pushes (same arg_0 to Sin then Cos). Callers add esp,8.
 * Z: MOVSX delta * t, SAR 0Ch, then 66 ADD DX,CX and WORD store world_XZ+2.
 * X/Y: MOVSX deltas * t SAR 0Ch (ESI/EDI), 2D rotate (cos*dx-sin*dy, cos*dy+sin*dx) SAR 0Ch.
 * LookAt add-back is DWORD 8B (XZ @ 0xB8B7F8, Y @ 0xB8B7FC) then 66-store DX/AX.
 * EAX leftover = DWORD y after add eax,ecx. No mov eax before retn.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / actor 0x9C / LCG RNG: absent.
 * Linear; no loc_/jpt_/setcc; no ja/jg.
 */

extern int Battle_Camera_world_XZ_s16;  /* 0xB8B7F0, IDA size 4; WORD X +0, WORD Z +2 */
extern int Battle_Camera_world_Y;       /* 0xB8B7F4, IDA size 4; WORD store */
extern int Battle_Camera_LookAt_XZ_s16; /* 0xB8B7F8, IDA size 4; DWORD add-back */
extern int Battle_Camera_LookAt_Y;      /* 0xB8B7FC, IDA size 4; DWORD add-back */

unsigned int __cdecl Fixed_Sin4096_Q12(int);
unsigned int __cdecl Fixed_Cos4096_Q12(int);

int __cdecl Camera_OrbitWorldAroundLookAt_Q12(int angle, int t)
{
    short look_z;
    int z;
    short look_x;
    int dx;
    int dy;
    int sin_q12;
    int cos_q12;
    int x;
    int y;

    look_z = *(short *)((char *)&Battle_Camera_LookAt_XZ_s16 + 2);
    z = *(short *)((char *)&Battle_Camera_world_XZ_s16 + 2);
    z = ((z - look_z) * t) >> 12;
    *(short *)((char *)&Battle_Camera_world_XZ_s16 + 2) =
        (short)((unsigned short)z + (unsigned short)look_z);

    look_x = *(short *)&Battle_Camera_LookAt_XZ_s16;
    dx = ((*(short *)&Battle_Camera_world_XZ_s16 - look_x) * t) >> 12;
    dy = ((*(short *)&Battle_Camera_world_Y - *(short *)&Battle_Camera_LookAt_Y) * t) >> 12;

    sin_q12 = (int)Fixed_Sin4096_Q12(angle);
    cos_q12 = (int)Fixed_Cos4096_Q12(angle);

    x = ((cos_q12 * dx - sin_q12 * dy) >> 12) + Battle_Camera_LookAt_XZ_s16;
    y = ((cos_q12 * dy + sin_q12 * dx) >> 12) + Battle_Camera_LookAt_Y;

    *(short *)&Battle_Camera_world_XZ_s16 = (short)x;
    *(short *)&Battle_Camera_world_Y = (short)y;
    return y;
}
```
