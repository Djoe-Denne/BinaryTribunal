# CameraBasis_CopyDefaultAndApplyEulerS16 @ 0x56CD50

- Instr (live): 31
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=18
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int *__cdecl CameraBasis_CopyDefaultAndApplyEulerS16(__int16 *, int *)
- Notes parent: 5 DWORD dest[+0,+4,+8,+0C,+10] depuis C78BD0..C78BE0. Euler MOVSX WORD [edi+4]/[+2]/[+0] → RotZ, RotY, sub_56CFB0. add esp,18h. EAX=dest. Pas d'occupancy/0xD0/0x1D0/0x44. Pas de 66-store.

## C réconcilié

```c
/* CameraBasis_CopyDefaultAndApplyEulerS16 @ 0x56CD50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 31 instr, size 0x5c, end 0x56CDAC. IDA type int *__cdecl(__int16 *, int *).
 * cdecl, 2 args, saved ESI/EDI, no locals. retn C3. EAX = dest (mov eax, esi).
 * Copy five DWORD default basis C78BD0..C78BE0 into dest[+0,+4,+8,+0C,+10],
 * then RotZ(MOVSX [edi+4]) / RotY(MOVSX [edi+2]) / sub_56CFB0(MOVSX [edi+0]).
 * Callees cdecl (angle, dest); one add esp,18h after all three. Callee EAX unused.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::. Shared helper (708 xrefs), not Odin-specific.
 */

extern int dword_C78BD0; /* 0xC78BD0 live 0x1000 */
extern int dword_C78BD4; /* 0xC78BD4 live 0 */
extern int dword_C78BD8; /* 0xC78BD8 live 0x1000 */
extern int dword_C78BDC; /* 0xC78BDC live 0 */
extern int dword_C78BE0; /* 0xC78BE0 live 0x1000 */

int __cdecl Mat3S16_MulByRotZ_Q12(int angle, int *dest);
int __cdecl Mat3S16_MulByRotY_Q12(int angle, int *dest);
int __cdecl sub_56CFB0(int angle, int *dest);

int *__cdecl CameraBasis_CopyDefaultAndApplyEulerS16(__int16 *euler_s16, int *dest)
{
    dest[0] = dword_C78BD0;
    dest[1] = dword_C78BD4;
    dest[2] = dword_C78BD8;
    dest[3] = dword_C78BDC;
    dest[4] = dword_C78BE0;

    Mat3S16_MulByRotZ_Q12((int)euler_s16[2], dest);
    Mat3S16_MulByRotY_Q12((int)euler_s16[1], dest);
    sub_56CFB0((int)euler_s16[0], dest);

    return dest;
}
```
