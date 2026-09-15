# MusicPerformance_IsSegmentPlaying @ 0x46FA10

- Instr (live): 17
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=129
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MusicPerformance_IsSegmentPlaying(int)
- Notes parent: COM stdcall this-pushed IsPlaying [+38h] pSegmentState=0; this=dword_1CD2C88; Pred_IsZero(HRESULT) add esp,0Ch leftover file+0x31A; return 0 si this nul. Occupancy/OT07/AL2/+44h/ja absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* MusicPerformance_IsSegmentPlaying @ 0x46FA10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 17 instr, size 0x2D, end exclusive 0x46FA3D. cdecl, 1 arg, retn C3, no EBP frame.
 * No saved regs. COM stdcall: this is pushed, then call [vtable+slot]. NOT thiscall
 * (ECX is vtbl after mov ecx,[eax], not this).
 * [ecx+38h] = IDirectMusicPerformance::IsPlaying (3 stdcall args, pSegmentState hardcoded 0).
 * this = dword_1CD2C88. Pred_IsZero @ 0x46FD60: cdecl, reads only arg0, eax=(arg==0). add esp,0Ch
 * cleans hr + unused aCFf8MusicDxMus + line 0x31A.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 / TEST AL,2 / +44h: ABSENT.
 * ja/jg: ABSENT (only jz). Widths: DWORD only. No presentation::.
 */

int __cdecl Pred_IsZero(int);
extern int dword_1CD2C88;

int __cdecl MusicPerformance_IsSegmentPlaying(int pSegment)
{
    int hr;
    int *vtbl;

    if (dword_1CD2C88 == 0)
        return 0;

    vtbl = *(int **)dword_1CD2C88;
    hr = ((int (__stdcall *)(int, int, int))vtbl[0x38 / 4])(
        dword_1CD2C88,
        pSegment,
        0);
    return Pred_IsZero(hr);
}
```
