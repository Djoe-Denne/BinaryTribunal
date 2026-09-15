# sub_B0C2F0 @ 0xB0C2F0

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl sub_B0C2F0(void)
- Notes parent: push imm32 0x180 puis BattleScratch_Unwind; add esp,4; xor eax,eax → return 0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg. Wiki AllocFrameMemory = faux (unwind).

## C réconcilié

```c
/* sub_B0C2F0 @ 0xB0C2F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0x10, end 0xB0C300. IDA type int(). cdecl, 0 args. No saved regs. retn C3.
 * Callee: BattleScratch_Unwind(int nbytes); one add esp,4 (83 C4 04).
 * push imm32 0x180 (68 80 01 00 00) then call; xor eax,eax (33 C0) discards callee EAX.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No branches / ja / jg / setcc / jump table. No domain::.
 * Wiki alias GF_203Cerberus_AllocFrameMemory is a misnomer (unwind, not alloc).
 */

int __cdecl BattleScratch_Unwind(int nbytes);

int __cdecl sub_B0C2F0(void)
{
    BattleScratch_Unwind(0x180);
    return 0;
}
```
