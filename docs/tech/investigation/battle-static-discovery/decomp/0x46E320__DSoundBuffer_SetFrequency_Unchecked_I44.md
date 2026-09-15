# DSoundBuffer_SetFrequency_Unchecked_I44 @ 0x46E320

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=42
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=14
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=450
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DSoundBuffer_SetFrequency_Unchecked_I44(int, int, int)
- Notes parent: COM stdcall this-poussé [ecx+44h] arity 3 (pBuffer, arg_4, arg_8); FF 51 44; file+line 200h leftover + Pred_IsZero add esp,0Ch; pas de clamp 46E100; jz only; occupancy/OT07/AL2/GF+44 absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* DSoundBuffer_SetFrequency_Unchecked_I44 @ 0x46E320
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x2F, end exclusive 0x46E34F. cdecl, 3 DWORD args, retn C3 x2.
 * No EBP, no saved regs, no sub esp. No 66h. DWORD only.
 * COM stdcall: this is pushed, then call [vtable+44h]. NOT thiscall (ECX is vtable).
 * FF 51 44 = call dword ptr [ecx+44h]. Slot I44. +44h is NOT GF Exists.
 * Stdcall arity 3 (this, arg_4, arg_8). File aCFf8SoundDxSou + line 200h are
 * leftover debug; Pred_IsZero @ 0x46FD60 cdecl reads only HRESULT; add esp,0Ch
 * cleans hr + unused file + unused line. No clamp (that is 0x46E100).
 * Occupancy 1+2 / 0xD0 / 0x1D0 / OT07 / code 24 / TEST AL,2: ABSENT.
 * ja/jg ABSENT (only jz). No presentation::.
 */

int __cdecl Pred_IsZero(int);

int __cdecl DSoundBuffer_SetFrequency_Unchecked_I44(int pBuffer, int arg_4, int arg_8)
{
    int hr;
    int *vtbl;

    if (pBuffer == 0)
        return 0;

    vtbl = *(int **)pBuffer;
    hr = ((int (__stdcall *)(int, int, int))vtbl[0x44 / 4])(pBuffer, arg_4, arg_8);
    return Pred_IsZero(hr);
}
```
