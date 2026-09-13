# BattleAction_ApplyEventRecords @ 0x506BA0

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=106
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=27
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleAction_ApplyEventRecords(unsigned __int8 *result_event, int count)
- Notes parent: jle (7E) signé count<=0 skip (ESI non push). Boucle: eax=esi; esi+=0x18; push eax; call 0x506690 add esp,4; dec edi; jnz. EAX leftover callee, pas xor 0. Occupancy 1+2 / 0xD0 / 0x1D0 / GF 0x44 absents. DWORD only, pas de 66.

## C réconcilié

```c
/* BattleAction_ApplyEventRecords @ 0x506BA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x22, end 0x506BC2. cdecl, 2 args. retn C3.
 * Gate: test edi,edi / jle (7E) signed count<=0 -> pop edi; retn (ESI never saved).
 * Loop loc_506BAE: mov eax,esi; add esi,18h; push eax; call 0x506690; add esp,4; dec edi; jnz.
 * EAX leftover = last callee char if loop ran; unmodified if jle. No explicit mov eax.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent. No setcc. No jpt.
 * No domain::.
 */

extern char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned __int8 *result_event); /* 0x506690 */

char __cdecl BattleAction_ApplyEventRecords(unsigned __int8 *result_event, int count)
{
    unsigned __int8 *rec; /* esi */
    unsigned __int8 *cur; /* eax */
    char last;            /* leftover EAX */

    if (count <= 0) /* 85 FF / 7E 17 signed jle loc_506BC0 */
        return last; /* EAX unmodified — not a written 0 */

    rec = result_event; /* 8B 74 24 0C */
    do { /* loc_506BAE */
        cur = rec;   /* 8B C6 */
        rec += 0x18; /* 83 C6 18 — stride 24, BEFORE the call */
        last = BattleAction_ApplyResultAndSpawnPresentation(cur); /* 50; E8; 83 C4 04 */
        --count;     /* 4F dec edi */
    } while (count != 0); /* 75 EF jnz */

    return last; /* 5E 5F C3 */
}
```
