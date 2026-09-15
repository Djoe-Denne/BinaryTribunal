# Gte_MVMVA @ 0x460860

- Instr (live): 177
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4585
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4083 (retry high/65536 after auto length)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4218 (retry high/65536 after auto length)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gte_MVMVA(int)
- Notes parent: cmd SAR cv/mx/v bits 13/17/15; TEST 80000h sf (pas AL,2); mat s16 xyz1+(mx<<5); TR DWORD world_CameraWorldSpaceX+(cv<<5) skip si cv==3; v==3 IR 34/38/3C sinon Vn*8; dbl_B69600=2^-12; (int) via magic B693D8; MAC 74/78/7C; FLAG MOV 81000000h / OR 80800000h / OR 400000h; jge/jle SIGNED; EAX=MAC3 ou FLAG; occupancy 1+2 / +44h / OT 07/24 absents.

## C réconcilié

```c
/* Gte_MVMVA @ 0x460860
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 177 instr, size 0x28E, end exclusive 0x460AEE. cdecl, 1 int arg, retn C3 x3.
 * sub esp,8 / add esp,8 at each retn (QWORD scratch). Leaf: no CALL.
 * cmd SAR bits: cv=(>>13)&3, mx=(>>17)&3, v=(>>15)&3; TEST EDI,80000h = sf.
 * Matrix: s16 3x3 at xyz1 + (mx<<5). TR: DWORD[3] at world_CameraWorldSpaceX+(cv<<5).
 * Vector: v==3 IR word movsx 34/38/3C else Vn stride 8 at 1CA8A10/12/14.
 * sf: fmul dbl_B69600 (2^-12). Dot via FPU + CONST 2^52+2^51 @ 0xB693D8 + add 80000000h.
 * MAC DWORD 74/78/7C; cv!=3 adds TR then restamp. Sat DWORD 34/38/3C.
 * FLAG 1CA92F8: MOV 0; MAC1 MOV 81000000h; MAC2 OR 80800000h; MAC3 OR 400000h.
 * cmp / jge (7D) / jle (7E) SIGNED vs 0FFFF8000h and 7FFFh. No ja/jbe/jg.
 * EAX leftover = MAC3 if in s16 range, else FLAG after OR 400000h.
 * Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT 07/24: ABSENT.
 */

extern int xyz1[];
extern int world_CameraWorldSpaceX[];
extern double dbl_B69600;
extern int dword_1CA8A10;
extern int dword_1CA8A14;
extern int dword_1CA8A34;
extern int dword_1CA8A38;
extern int dword_1CA8A3C;
extern int dword_1CA8A74;
extern int dword_1CA8A78;
extern int dword_1CA8A7C;
extern unsigned int dword_1CA92F8;

int __cdecl Gte_MVMVA(int cmd)
{
    int cv;
    int mx;
    int v;
    short *m;
    int *tr;
    double vx;
    double vy;
    double vz;
    int mac1;
    int mac2;
    int mac3;

    cv = (cmd >> 13) & 3;
    mx = (cmd >> 17) & 3;
    v = (cmd >> 15) & 3;

    m = (short *)((char *)xyz1 + (mx << 5));
    tr = (int *)((char *)world_CameraWorldSpaceX + (cv << 5));

    if (v == 3) {
        vx = (double)(short)dword_1CA8A34;
        vy = (double)(short)dword_1CA8A38;
        vz = (double)(short)dword_1CA8A3C;
    } else {
        vx = (double)*(short *)((char *)&dword_1CA8A10 + (v << 3));
        vy = (double)*(short *)((char *)&dword_1CA8A10 + (v << 3) + 2);
        vz = (double)*(short *)((char *)&dword_1CA8A14 + (v << 3));
    }

    if (cmd & 0x80000) {
        vx *= dbl_B69600;
        vy *= dbl_B69600;
        vz *= dbl_B69600;
    }

    /* fadd CONST_4.503601774854144e15 @ 0xB693D8; fstp qword; add 80000000h */
    mac1 = (int)((double)m[2] * vz + (double)m[1] * vy + (double)m[0] * vx);
    mac2 = (int)((double)m[5] * vz + (double)m[4] * vy + (double)m[3] * vx);
    mac3 = (int)((double)m[8] * vz + (double)m[7] * vy + (double)m[6] * vx);

    dword_1CA8A74 = mac1;
    dword_1CA8A78 = mac2;
    dword_1CA8A7C = mac3;

    if (cv != 3) {
        mac1 += tr[0];
        mac2 += tr[1];
        mac3 += tr[2];
        dword_1CA8A74 = mac1;
        dword_1CA8A78 = mac2;
        dword_1CA8A7C = mac3;
    }

    dword_1CA92F8 = 0;

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
    } else if (mac2 > 0x7FFF) {
        dword_1CA8A38 = 0x7FFF;
        dword_1CA92F8 |= 0x80800000u;
    } else {
        dword_1CA8A38 = mac2;
    }

    if (mac3 < -0x8000) {
        dword_1CA8A3C = (int)0xFFFF8000;
        dword_1CA92F8 |= 0x400000u;
        return (int)dword_1CA92F8;
    }
    if (mac3 > 0x7FFF) {
        dword_1CA8A3C = 0x7FFF;
        dword_1CA92F8 |= 0x400000u;
        return (int)dword_1CA92F8;
    }

    dword_1CA8A3C = mac3;
    return mac3;
}
```
