# BattleAction_ApplyEventRecordB7 @ 0x50A6C0

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: char BattleAction_ApplyEventRecordB7(void)
- Notes parent: 5 instr. A1 load DWORD result_event @ 1D99A60; push; call 506690; pop ecx (cdecl 1-arg); retn C3. EAX leftover. Occupancy 1+2 absente. Stride 0x18 absente (pas add eax,18h; contrast B2/50A690). Opcode B7 case 183. Pas de 66.

## C réconcilié

```c
/* BattleAction_ApplyEventRecordB7 @ 0x50A6C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0xD, end 0x50A6CD. No args, no frame, retn C3.
 * Bytes: A1 60 9A D9 01 / 50 / E8 C5 BF FF FF / 59 / C3
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Event-record stride 0x18 unused (no add eax,18h). Contrast 0x50A690 (opcode B2).
 * Widths: DWORD pointer load + DWORD push. No 66 prefix. No BYTE/WORD store.
 * pop ecx (59) = cdecl 1-arg cleanup, not a return. EAX leftover from callee.
 * No domain::.
 */

extern unsigned __int8 *result_event; /* 0x1D99A60 */

char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned __int8 *); /* 0x506690 */

char BattleAction_ApplyEventRecordB7(void)
{
    return BattleAction_ApplyResultAndSpawnPresentation(result_event);
}
```
