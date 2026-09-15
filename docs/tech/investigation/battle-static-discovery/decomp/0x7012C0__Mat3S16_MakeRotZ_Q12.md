# Mat3S16_MakeRotZ_Q12 @ 0x7012C0

- Instr (live): 29
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=57
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=68
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=83
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Mat3S16_MakeRotZ_Q12(__int16, _WORD *)
- Notes parent: 5 DWORD zeros (no 66, last at +10h dépasse 2 octets) puis 5 stores WORD (prefix 66). Rz transposée `[cos,sin,0; -sin,cos,0; 0,0,0x1000]`. `NEG` sin into m10. `add esp,8`. EAX = cosine leftover. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Distinct de 0x6CF070 (m01=-sin).

## C réconcilié

```c
/* Mat3S16_MakeRotZ_Q12 @ 0x7012C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 29 instr, size 0x4C, end 0x70130C. cdecl. retn C3.
 * Callees: Fixed_Sin4096_Q12(int), Fixed_Cos4096_Q12(int); one add esp,8.
 * 5 DWORD zeros (no 66) then 5 WORD stores (prefix 66). EAX leftover = cosine Q12.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No jump table. Distinct from 0x6CF070 (standard Rz m01=-sin).
 */

extern unsigned int __cdecl Fixed_Sin4096_Q12(int);
extern unsigned int __cdecl Fixed_Cos4096_Q12(int);

unsigned int __cdecl Mat3S16_MakeRotZ_Q12(__int16 angle, _WORD *out_m)
{
    _DWORD *dw;
    int s;
    int c;

    dw = (_DWORD *)out_m;
    dw[0] = 0; /* [ecx+0]  DWORD, covers m00/m01 */
    dw[1] = 0; /* [ecx+4]  DWORD, covers m02/m10 */
    dw[2] = 0; /* [ecx+8]  DWORD, covers m11/m12 */
    dw[3] = 0; /* [ecx+0Ch] DWORD, covers m20/m21 */
    dw[4] = 0; /* [ecx+10h] DWORD: m22 + 2 bytes past 18-byte matrix */

    s = (int)Fixed_Sin4096_Q12((int)angle);
    c = (int)Fixed_Cos4096_Q12((int)angle);

    out_m[0] = (_WORD)c;    /* [esi+0]   m00 = cos */
    out_m[3] = (_WORD)(-s); /* [esi+6]   m10 = -sin (NEG EDX then DX) */
    out_m[1] = (_WORD)s;   /* [esi+2]   m01 = +sin */
    out_m[4] = (_WORD)c;    /* [esi+8]   m11 = cos */
    out_m[8] = 0x1000;      /* [esi+10h] m22 = 1.0 Q12 */

    return (unsigned int)c;
}
```
