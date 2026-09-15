# Mat3S16_MulByRotZ_Q12 @ 0x56D090

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=48
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: __int16 *__cdecl Mat3S16_MulByRotZ_Q12(int p_angle, __int16 *p_dst)
- Notes parent: RotZ Q12 row-major s16 [cos,-sin,0; sin,cos,0; 0,0,0x1000] puis sub_56C270(local, dst). 9 stores WORD (66), m22=66 C7 0x1000. neg ecx seulement; m10=AX +sin. add esp,10h = 4 cdecl. EAX=arg_4. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de Jcc. Call GLM tous inversés, corrigé.

## C réconcilié

```c
/* Mat3S16_MulByRotZ_Q12 @ 0x56D090
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. Not Hex-Rays.
 * 32 instr, size 0x66, end 0x56D0F6. cdecl. retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * No Jcc / setcc / jpt. All nine local stores are WORD (66 prefix).
 * add esp,10h = cos-arg + sin-arg + dst + &local (four cdecl leftovers).
 * Local RotZ Q12 (row-major s16), then sub_56C270(local, dst):
 *   [ cos, -sin,     0 ]
 *   [ sin,  cos,     0 ]
 *   [   0,    0, 0x1000 ]
 * EAX = ESI = arg_4 (dest). No domain::.
 */

extern unsigned int __cdecl Fixed_Cos4096_Q12(int p_angle);
extern unsigned int __cdecl Fixed_Sin4096_Q12(int p_angle);
extern __int16 *__cdecl sub_56C270(__int16 *p_lhs, __int16 *p_dst);

__int16 *__cdecl Mat3S16_MulByRotZ_Q12(int p_angle, __int16 *p_dst)
{
    __int16 local_mat[9]; /* var_20 .. var_10, nine consecutive WORDs */
    unsigned int cosv;
    unsigned int sinv;
    int sin_neg;

    cosv = Fixed_Cos4096_Q12(p_angle);
    sinv = Fixed_Sin4096_Q12(p_angle);

    local_mat[0] = (__int16)cosv;          /* m00 = SI = cos */
    sin_neg = -(int)sinv;                  /* neg ecx; AX keeps +sin */
    local_mat[4] = (__int16)cosv;          /* m11 = SI = cos */
    local_mat[1] = (__int16)sin_neg;       /* m01 = CX = -sin */
    local_mat[2] = 0;                      /* m02 = 0 (xor ecx after m01) */
    local_mat[3] = (__int16)sinv;          /* m10 = AX = +sin */
    local_mat[5] = 0;                      /* m12 */
    local_mat[6] = 0;                      /* m20 */
    local_mat[7] = 0;                      /* m21 */
    local_mat[8] = 0x1000;                 /* m22 WORD 4096, 66 C7 */

    sub_56C270(local_mat, p_dst);          /* push dst; push &local; cdecl */
    return p_dst;                          /* mov eax, esi */
}
```
