# Battle_GetRandom1ToMax @ 0x48F120

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=51
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=37
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_GetRandom1ToMax(int max_value)
- Notes parent: GetRandomInt AL only puis `and eax,0FFh` (25 FF 00 00 00). `cdq` + `idiv` DWORD `[esp+4]` (`F7 7C 24 04`, pas `66`, pas `div`). Remainder EDX puis `inc eax`. Pas de setcc. Pas de ja/jg. 0 add esp. EAX = (byte % max_value) + 1.

## C réconcilié

```c
/* Battle_GetRandom1ToMax @ 0x48F120
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 7 instr, size 0x13. End 0x48F132. IDA type int __cdecl(int max_value).
 * No domain::. Callee Battle_GetRandomInt AL-only, 0 args, no add esp.
 * Widths: DWORD AND 25 FF 00 00 00; DWORD idiv F7 7C 24 04; no 66.
 * No setcc. No ja/jg. No branches. No packed struct. No slot stride.
 * EAX = (byte % max_value) + 1. Single retn. No div-by-zero guard.
 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */

int __cdecl Battle_GetRandom1ToMax(int max_value)
{
    int r;

    /* call Battle_GetRandomInt ; and eax, 0FFh (25 FF 00 00 00)
     * callee writes AL only — do not treat EAX as a clean int. */
    r = Battle_GetRandomInt() & 0xFF;

    /* cdq (99); idiv dword ptr [esp+4] (F7 7C 24 04, signed, no 66)
     * remainder EDX; mov eax, edx (8B C2); inc eax (40); retn (C3) */
    return (r % max_value) + 1;
}
```
