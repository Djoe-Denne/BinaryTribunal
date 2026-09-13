# Battle_EnqueueInitialPartyActions @ 0x47D8A0

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=24
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=24
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_EnqueueInitialPartyActions();
- Notes parent: scan slots 0-6, stride `0xD0`, tests byte (bit0 SET, bit4 `0x10` SET, bit7 `0x80` CLEAR) puis `EnqueueSpecialAction(slot, 0, 0)` + `add esp, 0Ch`. Boucle `cmp esi` / `jl` signé vs `BATTLE_SLOT7_FLAG_DATA`. EAX leftover. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* Battle_EnqueueInitialPartyActions @ 0x47D8A0
 * Ground truth = live ASM (asm_clean.asm + octets IDA), not Hex-Rays.
 * 22 instr, size 0x37, retn. IDA type int() → int __cdecl(void).
 */

typedef struct FF8BattleExecQueueCell FF8BattleExecQueueCell;

extern unsigned char BATTLE_SLOT_DATA_flag_data; /* esi @ 0x1D27B8C */
extern unsigned char BATTLE_SLOT7_FLAG_DATA;     /* cmp  @ 0x1D2813C */

FF8BattleExecQueueCell *__cdecl Battle_EnqueueSpecialAction(int slot, __int16 special_id, int group);

int __cdecl Battle_EnqueueInitialPartyActions(void)
{
    unsigned char *flag; /* esi */
    int slot;             /* edi */

    slot = 0;
    flag = &BATTLE_SLOT_DATA_flag_data;

    do {
        /* test byte ptr [esi]: bit0 SET, bit4 0x10 SET, bit7 0x80 CLEAR ; else skip to add */
        if ((*flag & 1) != 0 &&
            (*flag & 0x10) != 0 &&
            (*flag & 0x80) == 0)
        {
            Battle_EnqueueSpecialAction(slot, 0, 0); /* push 0, push 0, push edi ; add esp, 0Ch */
        }

        flag += 0xD0; /* add esi, 0D0h — not *232 */
        slot++;
    } while ((int)flag < (int)&BATTLE_SLOT7_FLAG_DATA); /* cmp esi, end ; jl (7C) signed, not jb */

    /* retn: no mov eax — leftover from last callee, or caller if never enqueued */
}
```
