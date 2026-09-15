# DSound_SetFrequency @ 0x46E100

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1457
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DSound_SetFrequency(int, unsigned int)
- Notes parent: freq 0 skip clamp; sinon jb 64h / ja 186A0h UNSIGNED; COM stdcall this puis [edx+44h] SetFrequency 2 args; Pred_IsZero + add esp,0Ch; EAX=Pred_IsZero ou 0; +44h vtable pas GF Exists; occupancy/OT07/code24/TEST AL,2 absents.

## C réconcilié

```c
/* DSound_SetFrequency @ 0x46E100
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 22 instr, size 0x3B, end exclusive 0x46E13B. cdecl, 2 args, retn C3, no EBP.
 * COM stdcall: this is PUSHed, then call [vtable+0x44]. NOT thiscall (ECX is not this).
 * [edx+44h] = IDirectSoundBuffer::SetFrequency (2 stdcall args: this, dwFrequency).
 * Filename aCFf8SoundDxSou + line 0x197 are leftover stack; add esp,0Ch after
 * Pred_IsZero cleans HRESULT + unused file + unused line. Pred_IsZero is cdecl 1-arg.
 * Clamp: freq==0 skips; else jb 64h / ja 186A0h UNSIGNED inclusive. Buffer 0 -> EAX 0.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 / TEST AL,2: ABSENT.
 * +44h is vtable slot, NOT GF Exists. gfx_driver slots != occupancy. No presentation::.
 */

int __cdecl Pred_IsZero(int);

int __cdecl DSound_SetFrequency(int pBuffer, unsigned int dwFrequency)
{
    int *vtbl;
    int hr;

    if (dwFrequency != 0)
    {
        if (dwFrequency < 0x64u)
            return 0;
        if (dwFrequency > 0x186A0u)
            return 0;
    }

    if (pBuffer == 0)
        return 0;

    vtbl = *(int **)pBuffer;
    hr = ((int (__stdcall *)(int, unsigned int))vtbl[0x44 / 4])(pBuffer, dwFrequency);
    return Pred_IsZero(hr);
}
```
