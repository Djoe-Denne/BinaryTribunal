# Mat3S16_MulQ12_Copy5 @ 0x56C090

- Instr (live): 116
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2395
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7380 (retry after length/empty)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6166
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl Mat3S16_MulQ12_Copy5(int, __int16 *, _DWORD *)
- Notes parent: 0 CALL. jnz après dec edx (ZF), pas ja/jg. 3 vec s16 stride 6 * 3x3 s16 ; scale flt_B695F8=1/4096 sur arg_0 seulement. Magic 2^52+2^51 puis WORD (66). 9 stores WORD puis 5 DWORD vers arg_8. EAX=arg_8. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. A: src+=2 faux.

## C réconcilié

```c
/* Mat3S16_MulQ12_Copy5 @ 0x56C090
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 116 instr, size 0x18c, end 0x56C21C. cdecl, 3 args, retn C3. Saves ebp/esi.
 * and esp,0FFFFFFF8h ; sub esp,44h. 0 CALL. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Loop: mov edx,3 ; loc_56C12F ; dec edx ; jnz (ZF). 9 WORD stores then 5 DWORD copy-out.
 */

extern float flt_B695F8; /* 0xB695F8 item_size=4 hex 00008039 = 1/4096 */
extern double CONST_4_503601774854144e15; /* 0xB693D8 item_size=8 = 2^52+2^51 ; IDA name CONST_4.503601774854144e15 */

_DWORD *__cdecl Mat3S16_MulQ12_Copy5(int arg_0, __int16 *arg_4, _DWORD *arg_8)
{
    __int16 *vec; /* ecx: arg_0+4, then [ecx-4],[ecx-2],[ecx] */
    __int16 *outp; /* eax: lea var_1C, add 6, WORD [eax-0Ah]/[eax-8]/[eax-6] */
    _DWORD dst[5]; /* var_20..var_10 ; loop writes 18 bytes, last 2 of dst[4] untouched */
    float m00, m10, m20; /* fild M[+0], M[+6], M[+0Ch] ; stay on ST across loop */
    float m01, m11, m21; /* fstp dword var_38/34/30 = M[+2], M[+8], M[+0Eh] */
    float m02, m12, m22; /* fstp dword var_2C/28/24 = M[+4], M[+0Ah], M[+10h] */
    float s0, s1, s2;
    union { double d; unsigned short w[4]; } conv;
    int n; /* edx */

    m00 = (float)arg_4[0];
    m10 = (float)arg_4[3];
    m20 = (float)arg_4[6];
    m01 = (float)arg_4[1];
    m11 = (float)arg_4[4];
    m21 = (float)arg_4[7];
    m02 = (float)arg_4[2];
    m12 = (float)arg_4[5];
    m22 = (float)arg_4[8];

    vec = (__int16 *)arg_0 + 2; /* 56c10f add ecx, 4 */
    outp = (__int16 *)dst + 2; /* 56c11a lea eax, [esp+48h+var_1C] */
    n = 3; /* 56c11e mov edx, 3 */

    do {
        /* loc_56C12F */
        s0 = (float)vec[-2] * flt_B695F8; /* movsx [ecx-4] ; fild ; fmul dword */
        s1 = (float)vec[-1] * flt_B695F8; /* [ecx-2] */
        s2 = (float)vec[0] * flt_B695F8;  /* [ecx] */
        vec += 3; /* add ecx, 6 */
        outp += 3; /* add eax, 6 */
        --n; /* dec edx ; ZF tested by jnz at 56c1e6 */

        /* acc0 = M[+0]*s0 + M[+6]*s1 + M[+0Ch]*s2 ; fadd qword magic ; fstp qword ; mov si, word */
        conv.d = (double)(m00 * s0 + m10 * s1 + m20 * s2) + CONST_4_503601774854144e15;
        outp[-5] = (__int16)conv.w[0]; /* [eax-0Ah] 66 89 */

        /* acc1 = M[+2]*s0 + M[+8]*s1 + M[+0Eh]*s2 */
        conv.d = (double)(m01 * s0 + m11 * s1 + m21 * s2) + CONST_4_503601774854144e15;
        outp[-4] = (__int16)conv.w[0]; /* [eax-8] */

        /* acc2 = M[+4]*s0 + M[+0Ah]*s1 + M[+10h]*s2 */
        conv.d = (double)(m02 * s0 + m12 * s1 + m22 * s2) + CONST_4_503601774854144e15;
        outp[-3] = (__int16)conv.w[0]; /* [eax-6] */
        /* fstp st x3 drops s2,s1,s0 ; m00/m10/m20 stay until copy-out fstp st */
    } while (n != 0); /* jnz loc_56C12F */

    arg_8[0] = dst[0];
    arg_8[1] = dst[1];
    arg_8[2] = dst[2];
    arg_8[3] = dst[3];
    arg_8[4] = dst[4];
    /* 56c1ec mov eax, [ebp+arg_8] ; 5 DWORD 89 stores ; fstp st x3 leftover matrix col */
    return arg_8;
}
```
