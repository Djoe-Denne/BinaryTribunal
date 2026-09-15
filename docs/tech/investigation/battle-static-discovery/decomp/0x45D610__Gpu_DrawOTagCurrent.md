# Gpu_DrawOTagCurrent @ 0x45D610

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gpu_DrawOTagCurrent(unsigned int ot_head)
- Notes parent: thunk 5 instr, size 0xC. mov eax,[esp+4]; push; call Gpu_DrawOTag @ 0x45D080; pop ecx; retn C3. EAX passthrough. Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / tag 07 / code 24 absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* Gpu_DrawOTagCurrent @ 0x45D610
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0xC, end 0x45D61C. cdecl thunk, 1 arg, retn C3, no EBP.
 * 8B 44 24 04 mov eax,[esp+4]; 50 push eax; E8 66 FA FF FF call Gpu_DrawOTag @ 0x45D080;
 * 59 pop ecx (cdecl 4-byte cleanup); C3 retn. EAX passthrough.
 * Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT tag 07 / code 24: absents.
 */

int __cdecl Gpu_DrawOTag(unsigned int ot_head);

int __cdecl Gpu_DrawOTagCurrent(unsigned int ot_head)
{
    return Gpu_DrawOTag(ot_head);
}
```
