# GF_277Carbuncle_InvokeSummonScript @ 0x680C50

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_277Carbuncle_InvokeSummonScript(unsigned __int8 *)
- Notes parent: Wrapper 14o `mov/push/call rel32+0x26/add esp,4/retn`. EAX = Init @ 0x680C80. FUNC_THUNK=0. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents.

## C réconcilié

```c
/* GF_277Carbuncle_InvokeSummonScript @ 0x680C50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0xE, end 0x680C5E. IDA type _DWORD *__cdecl(unsigned __int8 *).
 * cdecl, 1 arg. No prologue, no saved regs, no locals. retn C3 (not retn N).
 * Bytes: 8B 44 24 04 / 50 / E8 26 00 00 00 / 83 C4 04 / C3.
 * call rel32 +0x26 from 0x680C5A -> 0x680C80 GF_277Carbuncle_InitSummonContext.
 * add esp, 4. EAX leftover from callee. FUNC_THUNK=0 (flags 0x5400).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No packed struct. No domain::.
 */

extern _DWORD *__cdecl GF_277Carbuncle_InitSummonContext(unsigned __int8 *);

_DWORD *__cdecl GF_277Carbuncle_InvokeSummonScript(unsigned __int8 *arg_0)
{
    return GF_277Carbuncle_InitSummonContext(arg_0);
}
```
