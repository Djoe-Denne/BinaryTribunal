# DSoundBuffer_Lock_I2C @ 0x46DEB0

- Instr (live): 67
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1524
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=554
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=517
- A==B: non
- Push IDB: oui
- SetType: int __cdecl DSoundBuffer_Lock_I2C(int, int, int, int, int, int, int)
- Notes parent: COM stdcall this-pushed Lock [+2Ch] dwFlags=0 + Restore [+50h] si 88780096h; wrapper arg_4=dwBytes arg_18=dwOffset; Pred_IsZero Restore-fail et retry-hr discarded → return 1; 0x8876021C/occupancy/OT07/AL2/+44h/ja absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* DSoundBuffer_Lock_I2C @ 0x46DEB0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 67 instr, size 0x98, end exclusive 0x46DF48. cdecl, 7 args, retn C3, no EBP frame.
 * Saved EBX EBP ESI EDI. push edi is after test esi and before jz (null path still pops edi).
 * COM stdcall: this is pushed, then call [vtable+slot]. NOT thiscall (ECX is not this).
 * [eax+2Ch] = IDirectSoundBuffer::Lock (8 stdcall args, dwFlags hardcoded 0).
 * [edx+50h] = IDirectSoundBuffer::Restore (1 stdcall arg: this).
 * Wrapper C order != COM: arg_4=dwBytes, arg_18=dwOffset.
 * Retry HRESULT is 88780096h (DSERR_BUFFERLOST). 0x8876021C ABSENT.
 * Pred_IsZero @ 0x46FD60: cdecl, reads only arg0, eax=(arg==0). add esp,0Ch
 * cleans hr + unused aCFf8SoundDxSou + line (0x113 Restore / 0x116 retry Lock).
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 / TEST AL,2 / +44h: ABSENT.
 * ja/jg: ABSENT (only jz). Widths: DWORD only. No presentation::.
 */

int __cdecl Pred_IsZero(int);

int __cdecl DSoundBuffer_Lock_I2C(
    int pBuffer,
    int dwBytes,
    int ppvAudioPtr1,
    int pdwAudioBytes1,
    int ppvAudioPtr2,
    int pdwAudioBytes2,
    int dwOffset)
{
    int hr;
    int *vtbl;

    if (pBuffer == 0)
        return 0;

    vtbl = *(int **)pBuffer;
    hr = ((int (__stdcall *)(int, int, int, int, int, int, int, int))vtbl[0x2C / 4])(
        pBuffer,
        dwOffset,
        dwBytes,
        ppvAudioPtr1,
        pdwAudioBytes1,
        ppvAudioPtr2,
        pdwAudioBytes2,
        0);

    if (hr == (int)0x88780096)
    {
        vtbl = *(int **)pBuffer;
        hr = ((int (__stdcall *)(int))vtbl[0x50 / 4])(pBuffer);
        if (Pred_IsZero(hr) == 0)
            return 1;

        vtbl = *(int **)pBuffer;
        hr = ((int (__stdcall *)(int, int, int, int, int, int, int, int))vtbl[0x2C / 4])(
            pBuffer,
            dwOffset,
            dwBytes,
            ppvAudioPtr1,
            pdwAudioBytes1,
            ppvAudioPtr2,
            pdwAudioBytes2,
            0);
        Pred_IsZero(hr);
        return 1;
    }

    if (hr == 0)
        return 1;
    return 0;
}
```
