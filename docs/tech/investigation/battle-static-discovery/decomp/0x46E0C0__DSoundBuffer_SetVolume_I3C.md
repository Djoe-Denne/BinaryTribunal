# DSoundBuffer_SetVolume_I3C @ 0x46E0C0

- Instr (live): 20
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DSoundBuffer_SetVolume_I3C(int, int)
- Notes parent: jl 7C / jg 7F SIGNED reject −10000..0 (pas clamp, pas ja). COM stdcall this empilé puis call [vtable+3Ch] SetVolume. Pred_IsZero(HRESULT) + add esp,0Ch (hr+file+17Fh). SETTYPE True SAVE True. Occupancy 1+2 / +44h / OT 07/24 / TEST AL,2 absents.

## C réconcilié

```c
/* DSoundBuffer_SetVolume_I3C @ 0x46E0C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 20 instr, size 0x36, end exclusive 0x46E0F6. cdecl, 2 args, retn C3 x2, no EBP.
 * Range gate SIGNED: cmp ecx,0FFFFD8F0h / jl (7C) then test ecx / jg (7F).
 * Out of [-10000, 0] or NULL buffer: xor eax,eax; retn. REJECT, not saturate.
 * COM stdcall C-style: push 17Fh; push aCFf8SoundDxSou; push ecx (lVolume);
 *   push eax (this); call [edx+3Ch]. Callee pops this+volume only.
 * Pred_IsZero(HRESULT); add esp,0Ch cleans hr + leftover file + line 0x17F.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 / TEST AL,2 / +44h: ABSENT.
 * ja unsigned ABSENT. gfx_driver slots ≠ occupancy. No presentation::.
 */

int __cdecl Pred_IsZero(int);

int __cdecl DSoundBuffer_SetVolume_I3C(int buffer, int lVolume)
{
    int *vtbl;
    int hr;

    if (lVolume < -10000)
        return 0;
    if (lVolume > 0)
        return 0;
    if (buffer == 0)
        return 0;

    vtbl = *(int **)buffer;
    hr = ((int (__stdcall *)(int, int))vtbl[0x3C / 4])(buffer, lVolume);
    return Pred_IsZero(hr);
}
```
