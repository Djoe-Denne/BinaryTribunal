# BattleAction_ApplyEventGroup0 @ 0x50A670

- Instr (live): 9
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAction_ApplyEventGroup0(void)
- Notes parent: Occupancy 1+2 ABSENTE. Stride records 0x18 ABSENTE de CE corps (callee 0x506BA0 seulement). BYTE [ctx+0x10] zero-extend = count; DWORD [ctx+8] = result_event; A1 g_GfSequenceContextSharedB. cdecl 0 args; add esp,8; EAX leftover callee. Pas 66 / 0xD0 / 0x1D0 / 0x44. Opcode AA / GF / ParamBZero / PhysicalWithEvents = callers.

## C réconcilié

```c
/* BattleAction_ApplyEventGroup0 @ 0x50A670
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 9 instr, size 0x18.
 * cdecl; 0 args; no saved regs; retn C3.
 * EAX leftover from BattleAction_ApplyEventRecords (no mov eax before retn).
 * Occupancy 1+2 ABSENT (no AND 0xFC / OR 1|2).
 * Event-record stride 0x18 ABSENT from THIS listing (no add esi,18h).
 * No 66 prefix. BYTE count [ctx+0x10]; DWORD pointer [ctx+8].
 */

int __cdecl BattleAction_ApplyEventGroup0(void)
{
    unsigned char *ctx;
    unsigned char *result_event;
    int count;

    ctx = g_GfSequenceContextSharedB; /* A1 50 9A D9 01 */
    count = ctx[0x10]; /* 33 C9; 8A 48 10  BYTE zero-extend */
    result_event = *(unsigned char **)(ctx + 8); /* 8B 50 08 DWORD */
    return BattleAction_ApplyEventRecords(result_event, count); /* 51; 52; E8; 83 C4 08 */
}
```
