# Magic_ArenaSize_1MiB @ 0x571B60

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int Magic_ArenaSize_1MiB(void)
- Notes parent: B8 00 00 10 00 C3 → EAX=0x100000 DWORD puis retn. 0 args, pas de callee, pas de 66. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Unique FL MAG_140 @ 0x6A6310 (2 appels).

## C réconcilié

```c
/* Magic_ArenaSize_1MiB @ 0x571B60
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 2 instr, size 0x6, end 0x571B66. IDA type int().
 * cdecl, 0 args. No prologue, no saved regs, no locals. retn C3.
 * B8 00 00 10 00 = mov eax, 100000h (DWORD imm). C3 = retn.
 * EAX return = 0x100000 (1 MiB). No 66, no mem R/W.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed struct. No domain::.
 */

int Magic_ArenaSize_1MiB(void)
{
    return 0x100000;
}
```
