# DecByte_Obj18_Plus28 @ 0x8DC530

- Instr (live): 6
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DecByte_Obj18_Plus28(int)
- Notes parent: jz nested ptr==0 (pas ja/jg). FE 48 28 = dec BYTE [eax+28h]. EAX leftover = ptr [arg+0x18] ou 0. Occupancy absente. Pas de callee.

## C réconcilié

```c
/* DecByte_Obj18_Plus28 @ 0x8DC530
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 6 instr, size 0xF, end 0x8DC53F. cdecl, 1 arg, retn C3. No saved regs. No callees.
 * 1 JCC: jz locret_8DC53E after test eax,eax (nested ptr == 0). No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: FE 48 28 dec BYTE only. No 66. DWORD load [arg0+0x18], BYTE at [nested+0x28].
 * EAX leftover: 0 if nested NULL, else nested ptr (dec does not change EAX).
 */

int __cdecl DecByte_Obj18_Plus28(int arg0)
{
    int nested;

    nested = *(int *)(arg0 + 0x18); /* mov eax,[esp+arg_0]; mov eax,[eax+18h] */
    if (nested == 0)                 /* test eax,eax; jz locret_8DC53E */
        return 0;

    --*(unsigned char *)(nested + 0x28); /* FE 48 28: BYTE only */
    return nested;                    /* EAX still nested */
}
```
