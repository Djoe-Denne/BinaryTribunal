# BattleTask_CameraBarrier70_Worker @ 0x5085F0

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTask_CameraBarrier70_Worker(int)
- Notes parent: 3 gates BYTE/call puis BYTE [ctx+1]=0xFF ret 2; stall xor eax,eax. A0 moffs8 byte_1D96A88 + low BYTE g_BattleCameraFlags (pas dword_1D97704). FindFlag2(0x18,0x40) add esp,8. Pas occupancy 1+2. Pas 0xD0. Pas 66.

## C réconcilié

```c
/* BattleTask_CameraBarrier70_Worker @ 0x5085F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 19 instr, size 0x36.
 * cdecl; 1 arg; no ebp; no saved regs; retn C3.
 * EAX = 2 complete / 0 stall.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 */

extern unsigned char byte_1D96A88; /* 0x1D96A88, A0 moffs8 BYTE */
extern unsigned char g_BattleCameraFlags; /* 0x1D97718 IDA dword SIZE 4; THIS insn A0 low BYTE only */

int __cdecl BattleActor_FindFlag2_Match(int, unsigned __int16); /* 0x508580; add esp,8 */

int __cdecl BattleTask_CameraBarrier70_Worker(int task)
{
    int ctx;

    if (byte_1D96A88)
        return 0; /* 752A jnz loc_508623 */

    if (BattleActor_FindFlag2_Match(0x18, 0x40))
        return 0; /* 6A40 6A18 call; add esp,8; 751A jnz */

    if (g_BattleCameraFlags)
        return 0; /* A0 byte ptr 0x1D97718; 7511 jnz loc_508623 */

    ctx = *(int *)(task + 0x10);         /* 8B442404; 8B4810 DWORD [task+10h] */
    *(unsigned char *)(ctx + 1) = 0xFFu; /* C64101FF BYTE */
    return 2;                            /* B802000000 then C3; EAX set before store */
}
```
