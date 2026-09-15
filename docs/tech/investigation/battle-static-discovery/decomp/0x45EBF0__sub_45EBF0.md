# sub_45EBF0 @ 0x45EBF0

- Instr (live): 116
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4786
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4328
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4097
- A==B: non
- Push IDB: oui
- SetType: int __cdecl sub_45EBF0(void)
- Notes parent: GPL-style MAC+= (movsx Word3 * scale/4096) via magic+0x80000000. RGB FIFO DWORD. IR clamp SIGNED jge/jle; RGB UNSIGNED jbe + ~sar31. FLAG 81000000 SET then OR 80800000/400000/200000/100000/80000. jge 45ecd5 delayed from cmp eax. Occupancy 1+2 / 0xD0 / 0x1D0 / +44h / TEST AL,2 / OT 07/24 absents. EAX leftover. KEEP sibling 0x45E9D0.

## C réconcilié

```c
/* sub_45EBF0 @ 0x45EBF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 116 instr, size 0x21D (541), end exclusive 0x45EE0D. cdecl, 0 args, retn C3, no EBP.
 * Leaf: 0 CALL. add esp,8 pairs with sub esp,8 (FPU qword scratch). push esi/ebx + pops.
 * KEEP sibling sub_45E9D0 does NOT add old MAC; this body ADDS dword_1CA8A74/78/7C.
 * Scale = movsx word dword_1CA8A30 * flt_B695F8 (1/4096). Not hardware IR0 in idents.
 * Magic: fadd CONST 2^52+2^51, fstp qword, low dword, lea [old+bits+80000000h].
 * Delayed jge 7D at 45ecd5 uses flags from cmp eax,0FFFF8000h at 45ec7b (FPU/MOV/LEA
 * do not clobber). IR clamps SIGNED jge/jle vs 0xFFFF8000 / 7FFFh. RGB UNSIGNED jbe vs 0xFF.
 * IR/MAC/FLAG stores DWORD (no 66). RGB2 + code BYTE. FIFO RGB DWORD.
 * EAX leftover from RGB/FLAG path, not a documented result. No return 0 / FLAG.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists +44h / TEST AL,2 /
 * OT tag 07 / GPU code 24: ABSENT. byte_1CA8A2B -> RGB2+3 is not packet emit.
 */

extern unsigned int dword_1CA8A60;
extern unsigned int dword_1CA8A64;
extern unsigned int dword_1CA8A68;
extern unsigned int dword_1CA8A30;
extern unsigned int dword_1CA8A34;
extern unsigned int dword_1CA8A38;
extern unsigned int dword_1CA8A3C;
extern unsigned int dword_1CA8A74;
extern unsigned int dword_1CA8A78;
extern unsigned int dword_1CA8A7C;
extern unsigned int dword_1CA92F8;
extern unsigned char byte_1CA8A2B;
extern float flt_B695F8;
extern double CONST_4_503601774854144e15;

int __cdecl sub_45EBF0(void)
{
    union {
        double d;
        unsigned int u[2];
    } cvt;
    double scale;
    int ir1;
    int ir2;
    int ir3;
    int mac1;
    int mac2;
    int mac3;

    dword_1CA8A60 = dword_1CA8A64;
    dword_1CA8A64 = dword_1CA8A68;

    scale = (double)(int)(short)dword_1CA8A30 * (double)flt_B695F8;
    ir1 = (int)(short)dword_1CA8A34;
    ((unsigned char *)&dword_1CA8A68)[3] = byte_1CA8A2B;
    ir2 = (int)(short)dword_1CA8A38;

    dword_1CA92F8 = 0;

    cvt.d = (double)ir1 * scale + CONST_4_503601774854144e15;
    mac1 = (int)(dword_1CA8A74 + cvt.u[0] + 0x80000000u);
    dword_1CA8A74 = (unsigned int)mac1;

    cvt.d = (double)ir2 * scale + CONST_4_503601774854144e15;
    ir3 = (int)(short)dword_1CA8A3C;
    mac2 = (int)(dword_1CA8A78 + cvt.u[0] + 0x80000000u);
    dword_1CA8A78 = (unsigned int)mac2;

    cvt.d = (double)ir3 * scale + CONST_4_503601774854144e15;
    mac3 = (int)(dword_1CA8A7C + cvt.u[0] + 0x80000000u);
    dword_1CA8A7C = (unsigned int)mac3;

    if (mac1 < -32768) {
        dword_1CA92F8 = 0x81000000u;
        dword_1CA8A34 = 0xFFFF8000u;
    } else if (mac1 <= 32767) {
        dword_1CA8A34 = (unsigned int)mac1;
    } else {
        dword_1CA92F8 = 0x81000000u;
        dword_1CA8A34 = 0x7FFFu;
    }

    if (mac2 < -32768) {
        dword_1CA8A38 = 0xFFFF8000u;
        dword_1CA92F8 |= 0x80800000u;
    } else if (mac2 <= 32767) {
        dword_1CA8A38 = (unsigned int)mac2;
    } else {
        dword_1CA8A38 = 0x7FFFu;
        dword_1CA92F8 |= 0x80800000u;
    }

    if (mac3 < -32768) {
        dword_1CA8A3C = 0xFFFF8000u;
        dword_1CA92F8 |= 0x400000u;
    } else if (mac3 <= 32767) {
        dword_1CA8A3C = (unsigned int)mac3;
    } else {
        dword_1CA8A3C = 0x7FFFu;
        dword_1CA92F8 |= 0x400000u;
    }

    if ((unsigned int)mac1 > 0xFFu) {
        dword_1CA92F8 |= 0x200000u;
        mac1 = ~(mac1 >> 31);
    }
    ((unsigned char *)&dword_1CA8A68)[0] = (unsigned char)mac1;

    if ((unsigned int)mac2 > 0xFFu) {
        dword_1CA92F8 |= 0x100000u;
        mac2 = ~(mac2 >> 31);
    }
    ((unsigned char *)&dword_1CA8A68)[1] = (unsigned char)mac2;

    if ((unsigned int)mac3 > 0xFFu) {
        dword_1CA92F8 |= 0x80000u;
        mac3 = ~(mac3 >> 31);
        ((unsigned char *)&dword_1CA8A68)[2] = (unsigned char)mac3;
        return (int)dword_1CA92F8; /* EAX = FLAG|0x80000 */
    }
    ((unsigned char *)&dword_1CA8A68)[2] = (unsigned char)mac3;
    return mac2; /* EAX leftover: mac2 or ~SAR31 after RGB G */
}
```
