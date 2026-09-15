# Mat3S16_MulByRotY_Q12 @ 0x56D020

- Instr (live): 31
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=32
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=32
- A==B: non
- Push IDB: oui
- SetType: __int16 *__cdecl Mat3S16_MulByRotY_Q12(int angle, __int16 *dest)
- Notes parent: Ry 9 WORD 66-prefix [[c,0,s],[0,0x1000,0],[-s,0,c]]; NEG EAX 32-bit puis AX; add esp,10h (Cos+Sin+2); EAX=dest. Occupancy absente.

## C réconcilié

```c
/* Mat3S16_MulByRotY_Q12 @ 0x56D020
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 31 instr, size 0x64, end 0x56D084. IDA type int __cdecl(int, int).
 * cdecl, 2 args, saved ESI/EDI, sub esp,20h / add esp,20h. retn C3.
 * EAX = dest (mov eax, esi after esi=arg_4).
 * Local 9 x WORD Ry at var_20: [[c,0,s],[0,0x1000,0],[-s,0,c]].
 * All Ry stores 66-prefixed WORD (incl. 66 C7 imm 1000h). NEG EAX is 32-bit
 * (F7 D8), then AX -> m20. Cos EAX kept in ESI; SI stored to m00/m22 before
 * esi=arg_4. Cos/Sin cdecl args left on stack; add esp,10h after 56C270
 * (angle Cos + angle Sin + &Ry + dest).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No branches / ja / jg / setcc. No Hex-Rays. No domain::.
 */

unsigned int __cdecl Fixed_Cos4096_Q12(int angle);
unsigned int __cdecl Fixed_Sin4096_Q12(int angle);
__int16 *__cdecl sub_56C270(int src_mat, __int16 *dest);

__int16 *__cdecl Mat3S16_MulByRotY_Q12(int angle, __int16 *dest)
{
    __int16 Ry[9];
    unsigned int c;
    unsigned int s;

    c = Fixed_Cos4096_Q12(angle);
    s = Fixed_Sin4096_Q12(angle);

    Ry[0] = (__int16)c;
    Ry[1] = 0;
    Ry[2] = (__int16)s;
    Ry[3] = 0;
    Ry[4] = 0x1000;
    Ry[5] = 0;
    Ry[6] = (__int16)(0u - s);
    Ry[7] = 0;
    Ry[8] = (__int16)c;

    sub_56C270((int)Ry, dest);
    return dest;
}
```
