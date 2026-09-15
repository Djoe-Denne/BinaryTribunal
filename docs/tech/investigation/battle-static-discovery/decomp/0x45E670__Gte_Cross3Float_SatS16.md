# Gte_Cross3Float_SatS16 @ 0x45E670

- Instr (live): 92
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=196
- A==B: non
- Push IDB: oui
- SetType: signed int __cdecl Gte_Cross3Float_SatS16()
- Notes parent: leaf 92 instr size 0x1AA. IR word movsx <<12 then OP with Cam_xyz floats. MAC DWORD 1CA8A74/78/7C, sat DWORD 34/38/3C. FLAG MOV 81000000h / OR 80800000h / OR 400000h. jge/jle SIGNED. EAX leftover (FLAG si sat MAC2/MAC3). Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT 07/24 absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* Gte_Cross3Float_SatS16 @ 0x45E670
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 92 instr, size 0x1AA, end 0x45E81A. cdecl, 0 args, retn C3 x3, no EBP, leaf.
 * sub esp,8; add esp,8 at each retn (QWORD scratch). No CALL.
 * IR: 0F BF word movsx dword_1CA8A34/38/3C, SHL 0Ch, FILD.
 * MAC = GTE OP with D=(Cam_xyz1_x, Cam_xyz2_y, Cam_xyz3_z) floats, (int) via
 * fadd CONST_4.503601774854144e15 @ 0xB693D8 + add 80000000h.
 * DWORD stores 1CA8A74/78/7C then sat DWORD back to 34/38/3C.
 * FLAG 1CA92F8: MOV 81000000h (MAC1), OR 80800000h (MAC2), OR 400000h (MAC3).
 * cmp / jge (7D) / jle (7E) SIGNED vs 0FFFF8000h and 7FFFh. No ja/jg. No 66.
 * Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT tag 07 / code 24: ABSENT.
 */

extern int dword_1CA8A34; /* 0x1CA8A34 */
extern int dword_1CA8A38; /* 0x1CA8A38 */
extern int dword_1CA8A3C; /* 0x1CA8A3C */
extern int dword_1CA8A74; /* 0x1CA8A74 */
extern int dword_1CA8A78; /* 0x1CA8A78 */
extern int dword_1CA8A7C; /* 0x1CA8A7C */
extern unsigned int dword_1CA92F8; /* 0x1CA92F8 FLAG */
extern float Cam_xyz1_x_float; /* 0x1CA923C */
extern float Cam_xyz2_y_float; /* 0x1CA9244 */
extern float Cam_xyz3_z_float; /* 0x1CA924C */

signed int __cdecl Gte_Cross3Float_SatS16(void)
{
    int ir1;
    int ir2;
    int ir3;
    int mac1;
    int mac2;
    int mac3;
    int ret;

    ir1 = (int)(short)dword_1CA8A34 << 12;
    ir2 = (int)(short)dword_1CA8A38 << 12;
    ir3 = (int)(short)dword_1CA8A3C << 12;

    dword_1CA92F8 = 0;

    mac1 = (int)(Cam_xyz2_y_float * (float)ir3 - Cam_xyz3_z_float * (float)ir2);
    dword_1CA8A74 = mac1;

    mac2 = (int)(Cam_xyz3_z_float * (float)ir1 - Cam_xyz1_x_float * (float)ir3);
    dword_1CA8A78 = mac2;

    mac3 = (int)(Cam_xyz1_x_float * (float)ir2 - Cam_xyz2_y_float * (float)ir1);
    dword_1CA8A7C = mac3;

    /* EAX leftover starts as mac1; MAC1 sat does not reload EAX (C7 05 FLAG). */
    ret = mac1;

    if (mac1 < -0x8000) {
        dword_1CA92F8 = 0x81000000u;
        dword_1CA8A34 = (int)0xFFFF8000;
    } else if (mac1 > 0x7FFF) {
        dword_1CA92F8 = 0x81000000u;
        dword_1CA8A34 = 0x7FFF;
    } else {
        dword_1CA8A34 = mac1;
    }

    if (mac2 < -0x8000) {
        dword_1CA8A38 = (int)0xFFFF8000;
        dword_1CA92F8 |= 0x80800000u;
        ret = (int)dword_1CA92F8;
    } else if (mac2 > 0x7FFF) {
        dword_1CA8A38 = 0x7FFF;
        dword_1CA92F8 |= 0x80800000u;
        ret = (int)dword_1CA92F8;
    } else {
        dword_1CA8A38 = mac2;
    }

    if (mac3 < -0x8000) {
        dword_1CA8A3C = (int)0xFFFF8000;
        dword_1CA92F8 |= 0x400000u;
        ret = (int)dword_1CA92F8;
    } else if (mac3 > 0x7FFF) {
        dword_1CA8A3C = 0x7FFF;
        dword_1CA92F8 |= 0x400000u;
        ret = (int)dword_1CA92F8;
    } else {
        dword_1CA8A3C = mac3;
    }

    return ret;
}
```
