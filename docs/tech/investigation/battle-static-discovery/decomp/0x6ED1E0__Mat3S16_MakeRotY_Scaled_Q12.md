# Mat3S16_MakeRotY_Scaled_Q12 @ 0x6ED1E0

- Instr (live): 37
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=21
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=120
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=32
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Mat3S16_MakeRotY_Scaled_Q12(__int16 angle, __int16 scale, _DWORD *dest)
- Notes parent: 5 DWORD zeros (89) puis 5 WORD (66). Sin/Cos de `-angle` (F7 DB). IMUL+SAR 0Ch. m11=arg_4 passthrough pas 0x1000. NEG ESI après m20. EAX=(cos(-θ)*k)>>12. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg.

## C réconcilié

```c
/* Mat3S16_MakeRotY_Scaled_Q12 @ 0x6ED1E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 37 instr, size 0x62, end 0x6ED242. IDA type int __cdecl(__int16, __int16, _DWORD *).
 * cdecl, 3 args, saved EBX EBP ESI EDI. No EBP frame. No locals. retn C3.
 * Callees: Fixed_Sin4096_Q12(int), Fixed_Cos4096_Q12(int); one add esp,8.
 * MOVSX arg_0 then F7 DB NEG EBX (32-bit); both callees get -angle.
 * Five DWORD zeros (89) via ECX=dest, then five WORD overlays (prefix 66).
 * IMUL signed (0F AF) + SAR 0Ch. NEG ESI 32-bit (F7 DE) after m20 WORD store.
 * m11 = raw WORD arg_4 passthrough, not 0x1000.
 * EAX leftover = (cos(-angle)*scale)>>12.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No branches / ja / jg / setcc / jump table. No domain::.
 */

unsigned int __cdecl Fixed_Sin4096_Q12(int angle);
unsigned int __cdecl Fixed_Cos4096_Q12(int angle);

int __cdecl Mat3S16_MakeRotY_Scaled_Q12(__int16 angle, __int16 scale, _DWORD *dest)
{
    int angle_neg;
    int sinv;
    int cosv;
    __int16 *w;

    dest[0] = 0;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;

    angle_neg = -(int)angle;
    sinv = (int)Fixed_Sin4096_Q12(angle_neg);
    sinv = (sinv * (int)scale) >> 12;
    cosv = (int)Fixed_Cos4096_Q12(angle_neg);
    cosv = (cosv * (int)scale) >> 12;

    w = (__int16 *)dest;
    w[6] = (__int16)sinv;
    w[4] = scale;
    sinv = -sinv;
    w[0] = (__int16)cosv;
    w[2] = (__int16)sinv;
    w[8] = (__int16)cosv;

    return cosv;
}
```
