# BattleAction_ApplyNextEventRecord @ 0x50A690

- Instr (live): 11
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAction_ApplyNextEventRecord(void)
- Notes parent: Stride 0x18 presente (83 C0 18). Occupancy 1+2 absente. Cursor DWORD A1/A3 avance AVANT call 0x506690; reload A1 apres (EAX callee discard). Latch BYTE [eax] -> byte_1D99A48. add esp,4. EAX leftover = cursor. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleAction_ApplyNextEventRecord @ 0x50A690
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 11 instr, size 0x26, end 0x50A6B6. cdecl, 0 args. No saved regs. retn C3.
 * Bytes: A1609AD901 8BC8 83C018 51 A3609AD901 E8EBBFFFFF A1609AD901 83C404 8A08 880D489AD901 C3
 * DWORD A1/A3 result_event @ 0x1D99A60. add eax,18h (83 C0 18) stride PRESENT.
 * Store new cursor (A3) BEFORE call; reload A1 AFTER call (callee EAX discarded).
 * BYTE 8A 08 / 88 0D latch [eax] -> byte_1D99A48 @ 0x1D99A48.
 * add esp,4 (83 C4 04) after call. EAX leftover = reloaded cursor pointer.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66 / WORD store. No setcc / jcc / jpt / ja/jg.
 * No domain::.
 */

extern char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned __int8 *rec); /* 0x506690 */
extern unsigned __int8 *result_event; /* 0x1D99A60 */
extern unsigned __int8 byte_1D99A48; /* 0x1D99A48 */

int __cdecl BattleAction_ApplyNextEventRecord(void)
{
    unsigned __int8 *old_rec; /* ecx */
    unsigned __int8 *cur;     /* eax */

    cur = result_event; /* A1 */
    old_rec = cur;      /* 8B C8 */
    cur += 0x18;        /* 83 C0 18 */
    result_event = cur; /* A3 BEFORE call; 51 already pushed old_rec */
    BattleAction_ApplyResultAndSpawnPresentation(old_rec); /* E8; 83 C4 04 */
    cur = result_event; /* A1 reload; not leftover callee EAX */
    byte_1D99A48 = *cur; /* 8A 08; 88 0D BYTE */
    return (int)cur;    /* EAX = reloaded pointer */
}
```
