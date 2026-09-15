# Mat3S16_MakeRotZ_NegSin_Q12 @ 0x6CF070

- Instr (live): 25
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Mat3S16_MakeRotZ_NegSin_Q12(__int16, _WORD *)
- Notes parent: 9 stores WORD (prefix 66). Rz standard row-major `[cos,-sin,0; sin,cos,0; 0,0,0x1000]`. `NEG` sin into m01 avant `xor edx,edx`. `add esp,8` après sin+cos cdecl. EAX = cosine leftover. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Distinct de 0x7012C0 transposée.

## C réconcilié

```c
/* Mat3S16_MakeRotZ_NegSin_Q12 @ 0x6CF070
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 25 instr, size 0x4A, end 0x6CF0BA. cdecl. retn C3.
 * Callees: Fixed_Sin4096_Q12(int), Fixed_Cos4096_Q12(int); one add esp,8.
 * All 9 matrix stores are WORD (prefix 66). EAX leftover = cosine Q12.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No jump table. Distinct from 0x7012C0 (transposed Rz).
 */

extern unsigned int __cdecl Fixed_Sin4096_Q12(int);
extern unsigned int __cdecl Fixed_Cos4096_Q12(int);

unsigned int __cdecl Mat3S16_MakeRotZ_NegSin_Q12(__int16 angle, _WORD *out_m)
{
    int s;
    int c;

    s = (int)Fixed_Sin4096_Q12((int)angle);
    c = (int)Fixed_Cos4096_Q12((int)angle);

    out_m[1] = (_WORD)(-s); /* [ecx+2]  m01 = -sin (NEG EDX then DX, before xor) */
    out_m[3] = (_WORD)s;    /* [ecx+6]  m10 = +sin */
    out_m[0] = (_WORD)c;    /* [ecx+0]  m00 = cos */
    out_m[2] = 0;           /* [ecx+4]  m02 = 0 */
    out_m[4] = (_WORD)c;    /* [ecx+8]  m11 = cos */
    out_m[5] = 0;           /* [ecx+0Ah] m12 = 0 */
    out_m[6] = 0;           /* [ecx+0Ch] m20 = 0 */
    out_m[7] = 0;           /* [ecx+0Eh] m21 = 0 */
    out_m[8] = 0x1000;      /* [ecx+10h] m22 = 1.0 Q12 */

    return (unsigned int)c;
}
```
