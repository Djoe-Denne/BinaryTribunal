# Mat3S16_MakeRotX_Q12 @ 0x701220

- Instr (live): 29
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=17
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=44
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=282
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Mat3S16_MakeRotX_Q12(__int16, int)
- Notes parent: Rx Q12 3x3 s16. MOVSX arg_0. 5 DWORD zeros (89/8941, +10h déborde 2 octets) puis Sin/Cos add esp,8. F7 DA neg edx copie ; EBX reste +sin. WORD 66 : m00=0x1000, m11=m22=AX cos, m12=BX sin, m21=DX -sin. EAX leftover = Cos. Pas de jcc/ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 absents. A/B sans decls callees — réconcilié C+ASM.

## C réconcilié

```c
/* Mat3S16_MakeRotX_Q12 @ 0x701220
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 29 instr, size 0x4c, end 0x70126c. cdecl, 2 args, retn C3. Saves EBX ESI EDI.
 * Rx Q12 3x3 s16: m00=0x1000, m11=m22=cos, m12=sin, m21=-sin.
 * Five DWORD zeros (incl. +10h past 18-byte matrix) then five WORD 66 stores.
 * add esp,8 after Sin+Cos. EAX leftover = Fixed_Cos4096_Q12.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * No domain::.
 */

unsigned int __cdecl Fixed_Sin4096_Q12(int);
unsigned int __cdecl Fixed_Cos4096_Q12(int);

unsigned int __cdecl Mat3S16_MakeRotX_Q12(__int16 arg_0, int arg_4)
{
    int angle;
    int sinv;
    unsigned int cosv;
    int neg_sin;
    _DWORD *d;
    _WORD *m;

    m = (_WORD *)arg_4; /* esi = arg_4 */
    d = (_DWORD *)arg_4; /* ecx = esi */
    angle = (int)arg_0; /* movsx edi, word arg_0 */

    d[0] = 0; /* [ecx+00h] DWORD 89 01  m00,m01 */
    d[1] = 0; /* [ecx+04h] DWORD 89 41 04  m02,m10 */
    d[2] = 0; /* [ecx+08h] DWORD 89 41 08  m11,m12 */
    d[3] = 0; /* [ecx+0Ch] DWORD 89 41 0C  m20,m21 */
    d[4] = 0; /* [ecx+10h] DWORD 89 41 10  m22 + 2 bytes past matrix */

    sinv = (int)Fixed_Sin4096_Q12(angle); /* ebx = eax */
    cosv = Fixed_Cos4096_Q12(angle); /* eax kept until ret; add esp,8 */
    neg_sin = -sinv; /* F7 DA neg edx 32-bit copy; ebx stays +sin */

    m[0] = 0x1000; /* [esi] WORD imm 66 C7 06 00 10  m00 Q12 1.0 */
    m[4] = (_WORD)cosv; /* [esi+8] AX m11 = cos */
    m[7] = (_WORD)neg_sin; /* [esi+0Eh] DX m21 = -sin */
    m[5] = (_WORD)sinv; /* [esi+0Ah] BX m12 = +sin */
    m[8] = (_WORD)cosv; /* [esi+10h] AX m22 = cos */
    return cosv;
}
```
