# Mat3S16_MakeRotY_Q12 @ 0x6D9510

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Mat3S16_MakeRotY_Q12(__int16, _WORD *)
- Notes parent: Ry Q12 3x3 s16 row-major. MOVSX arg_0. Sin puis Cos, add esp,8. EAX leftover = Cos. WORD 66 partout. m02=SI sin puis F7 DE neg esi puis m20=SI -sin. m00=m22=AX cos. m11=0x1000. EDX=0 → m01/m10/m12/m21. Pas de jcc/ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 absents. C : 2e Cos fantôme, Sin EAX droppé — rejeté.

## C réconcilié

```c
/* Mat3S16_MakeRotY_Q12 @ 0x6D9510
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x48, end 0x6d9558. cdecl, 2 args, retn C3. Saves ESI EDI.
 * Ry Q12 3x3 s16: m00=m22=cos, m02=sin, m20=-sin, m11=0x1000. All WORD 66.
 * add esp,8 after Sin+Cos. EAX leftover = Fixed_Cos4096_Q12.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * No domain::.
 */

unsigned int __cdecl Fixed_Sin4096_Q12(int);
unsigned int __cdecl Fixed_Cos4096_Q12(int);

unsigned int __cdecl Mat3S16_MakeRotY_Q12(__int16 arg_0, _WORD *arg_4)
{
    int angle;
    int sinv;
    unsigned int cosv;
    _WORD *m;

    angle = (int)arg_0; /* movsx edi, word arg_0 */
    sinv = (int)Fixed_Sin4096_Q12(angle); /* esi = eax */
    cosv = Fixed_Cos4096_Q12(angle); /* eax kept until ret; add esp,8 */
    m = arg_4;

    m[2] = (_WORD)sinv; /* [ecx+4] SI = sin, before neg */
    sinv = -sinv; /* F7 DE neg esi 32-bit */
    m[6] = (_WORD)sinv; /* [ecx+0Ch] SI = -sin */
    m[0] = (_WORD)cosv; /* [ecx+0] AX = cos */
    m[1] = 0; /* [ecx+2] DX */
    m[3] = 0; /* [ecx+6] DX */
    m[4] = 0x1000; /* [ecx+8] WORD imm Q12 1.0 */
    m[5] = 0; /* [ecx+0Ah] DX */
    m[7] = 0; /* [ecx+0Eh] DX */
    m[8] = (_WORD)cosv; /* [ecx+10h] AX = cos */
    return cosv;
}
```
