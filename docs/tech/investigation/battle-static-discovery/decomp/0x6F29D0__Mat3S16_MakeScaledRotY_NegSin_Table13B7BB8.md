# Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8 @ 0x6F29D0

- Instr (live): 28
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=20
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=17
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=34
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8(__int16, __int16, __int16, _DWORD *)
- Notes parent: 5 DWORD zeros puis 5 WORD (66). Table `word_13B7BB8` stride 4, idx AND 0FFFh. m20=+sin*k puis NEG → m02=-sin*k; m00=m22=cos*k; m11=arg_8. EAX leftover = m02. Occupancy absente. Distinct de 0x6D9510.

## C réconcilié

```c
/* Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8 @ 0x6F29D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 28 instr, size 0x60, end 0x6F2A30. cdecl, 4 args, retn C3. Saves ESI.
 * No callees. No add esp. No ja/jg/setcc/jcc. No jump table.
 * Table word_13B7BB8: 4096 x {sin,cos} int16 Q12, stride 4 (eax*4).
 * Five DWORD zeros (20 bytes) then five WORD (66) punches.
 * Ry NegSin scaled: m00=m22=cos*k, m02=-sin*k, m20=+sin*k, m11=arg_8.
 * Distinct from 0x6D9510 (m02=+sin, m20=-sin, m11=0x1000).
 * EAX leftover = NEG of (sin*k)>>12 (m02 as int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 */

extern __int16 word_13B7BB8[];

int __cdecl Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8(
    __int16 angle, __int16 scale_k, __int16 m11, _DWORD *out_m)
{
    int idx;
    int s;
    int c;
    _WORD *w;

    out_m[0] = 0; /* DWORD [ecx] */
    out_m[1] = 0; /* DWORD [ecx+4] */
    out_m[2] = 0; /* DWORD [ecx+8] */
    out_m[3] = 0; /* DWORD [ecx+0Ch] */
    out_m[4] = 0; /* DWORD [ecx+10h]  m22 + 2 bytes past 3x3 */

    idx = (int)angle & 0xFFF; /* mov eax, arg_0; and eax, 0FFFh — not movsx */
    s = (int)word_13B7BB8[idx * 2];     /* movsx word [table+idx*4+0] sin */
    c = (int)word_13B7BB8[idx * 2 + 1]; /* movsx word [table+idx*4+2] cos */
    s *= (int)scale_k; /* imul eax, esi (esi = movsx arg_4) */
    c *= (int)scale_k; /* imul ecx, esi */
    s >>= 12;          /* sar eax, 0Ch */
    w = (_WORD *)out_m;
    w[6] = (_WORD)s;   /* [edx+0Ch] AX  m20 = +sin*k */
    w[4] = (_WORD)m11; /* [edx+8]   SI  m11 = arg_8 */
    c >>= 12;          /* sar ecx, 0Ch */
    s = -s;            /* neg eax (F7 D8) after m20, before m02 */
    w[0] = (_WORD)c;   /* [edx]     CX  m00 = cos*k */
    w[2] = (_WORD)s;   /* [edx+4]   AX  m02 = -sin*k */
    w[8] = (_WORD)c;   /* [edx+10h] CX  m22 = cos*k */
    /* m01+2 m10+6 m12+0Ah m21+0Eh stay 0 from DWORD clear */
    return s;
}
```
