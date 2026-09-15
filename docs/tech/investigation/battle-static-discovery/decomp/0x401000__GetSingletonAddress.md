# GetSingletonAddress @ 0x401000

- Instr (live): 3
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl GetSingletonAddress(int)
- Notes parent: LEA 8D 04 85 [eax*4+0x1A77238] = &FIELD_COORD_X[index]. Load DWORD index 8B 44 24 04. Pas de deref slot, pas de jcc/ja/jg, pas de store. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 absents. A/B/C même return ; réconcilié + extern int FIELD_COORD_X[].

## C réconcilié

```c
/* GetSingletonAddress @ 0x401000
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 3 instr, size 0xC, end 0x40100C. cdecl, 1 arg, retn C3. No saved regs. No callees.
 * mov eax,[esp+arg_0] (8B 44 24 04 DWORD index); lea eax,[eax*4+0x1A77238] (8D 04 85);
 * retn C3. Address-of FIELD_COORD_X[arg_0], no memory load from the slot.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No jcc / ja / jg / setcc / jpt. No add esp. No domain::.
 */

extern int FIELD_COORD_X[]; /* 0x1A77238, IDA type int[] */

int __cdecl GetSingletonAddress(int arg_0)
{
    return (int)&FIELD_COORD_X[arg_0]; /* EAX = &base[index], scale 4 */
}
```
