# DSoundBuffer_Unlock_I4C_Dup @ 0x46E2A0

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DSoundBuffer_Unlock_I4C_Dup(int, int, int, int, int)
- Notes parent: COM stdcall this-pushed Unlock [+4Ch]; leftovers 1ECh+dx_snd.cpp; Pred_IsZero cdecl 1 arg add esp,0Ch; null xor dédié; occupancy/OT07/AL2/+44h/ja absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* DSoundBuffer_Unlock_I4C_Dup @ 0x46E2A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 22 instr, size 0x39, end exclusive 0x46E2D9. cdecl, 5 args, retn C3, no EBP.
 * No saved regs. No sub esp.
 * COM stdcall: this is pushed, then call [vtable+slot]. NOT thiscall
 * (ECX = vtable from [eax], not this).
 * [ecx+4Ch] = IDirectSoundBuffer::Unlock (5 stdcall args).
 * Wrapper C order matches COM: this, pv1, cb1, pv2, cb2.
 * Debug leftovers push 1ECh + aCFf8SoundDxSou are NOT Unlock args; add esp,0Ch
 * after Pred_IsZero cleans hr + unused file + unused line.
 * Pred_IsZero @ 0x46FD60: cdecl, reads only arg0, eax=(arg==0).
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 / TEST AL,2 / +44h: ABSENT.
 * ja/jg: ABSENT (only jz). Widths: DWORD only. No presentation::.
 * Sibling 0x46DF50 is the canonical Unlock (line 128h, shared retn); this Dup
 * uses line 1ECh and a dedicated xor+retn so success does not fall into xor.
 */

int __cdecl Pred_IsZero(int);

int __cdecl DSoundBuffer_Unlock_I4C_Dup(
    int pBuffer,
    int pvAudioPtr1,
    int dwAudioBytes1,
    int pvAudioPtr2,
    int dwAudioBytes2)
{
    int hr;
    int *vtbl;

    if (pBuffer == 0)
        return 0;

    vtbl = *(int **)pBuffer;
    hr = ((int (__stdcall *)(int, int, int, int, int))vtbl[0x4C / 4])(
        pBuffer,
        pvAudioPtr1,
        dwAudioBytes1,
        pvAudioPtr2,
        dwAudioBytes2);
    return Pred_IsZero(hr);
}
```
