# DSound_StopChannel_1CD0B00 @ 0x46A0A0

- Instr (live): 50
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl DSound_StopChannel_1CD0B00(unsigned int)
- Notes parent: jbe UNSIGNED 0..31; stride lea*3<<5 = 0x60; [esi+0] primary / [esi+8] secondary / DWORD [esi+10h]=0 under CS; Stop_I48 + sub_46DF90(buf,0) x2 add esp,0Ch; pas Play/Release; occupancy 1+2 / +44h / OT 07/24 / TEST AL,2 absents; COM dans wrappers stdcall C-style.

## C réconcilié

```c
/* DSound_StopChannel_1CD0B00 @ 0x46A0A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 50 instr, size 0x9E, end exclusive 0x46A13E. cdecl, 1 unsigned arg, retn C3 x4.
 * Saved esi only. Debug string "sfx_stop ()". Does not play, does not Release.
 * Channel: lea [eax+eax*2]; shl 5 => index * 0x60 from dword_1CD0B00.
 * Bound: cmp eax,1Fh / jbe (76) UNSIGNED, valid 0..31.
 * [esi+0] primary IDirectSoundBuffer*; [esi+8] secondary; [esi+10h] DWORD flag.
 * Secondary: EnterCS; DWORD [esi+10h]=0; LeaveCS; Stop_I48; sub_46DF90(buf,0).
 * Primary: Stop_I48; sub_46DF90(buf,0). add esp,0Ch per pair.
 * Wrappers do COM stdcall C-style (push this; call [vtable+48h]/[+34h]), not thiscall.
 * Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT 07/24: ABSENT.
 */

extern int dword_1CD0AE8;
extern int dword_1CD0B00[];
extern char CriticalSection[];
extern char aSoundErrorSoun[];
extern char aSoundParameter_7[];
extern char aWilliamPleaseC[];

extern void __cdecl OutputDebugString(const char *lpOutputString);
extern void __stdcall EnterCriticalSection(void *lpCriticalSection);
extern void __stdcall LeaveCriticalSection(void *lpCriticalSection);
extern int __cdecl DSoundBuffer_Stop_I48(int);
extern int __cdecl sub_46DF90(int, int);

void __cdecl DSound_StopChannel_1CD0B00(unsigned int arg_0)
{
    int *chan;

    if (dword_1CD0AE8 == 0) {
        OutputDebugString(aSoundErrorSoun);
        return;
    }

    if (arg_0 > 0x1Fu) {
        OutputDebugString(aSoundParameter_7);
        OutputDebugString(aWilliamPleaseC);
        return;
    }

    chan = (int *)((char *)dword_1CD0B00 + arg_0 * 0x60);

    if (chan[0] == 0)
        return;

    if (chan[2] != 0) {
        EnterCriticalSection(CriticalSection);
        chan[4] = 0;
        LeaveCriticalSection(CriticalSection);
        DSoundBuffer_Stop_I48(chan[2]);
        sub_46DF90(chan[2], 0);
    }

    DSoundBuffer_Stop_I48(chan[0]);
    sub_46DF90(chan[0], 0);
}
```
