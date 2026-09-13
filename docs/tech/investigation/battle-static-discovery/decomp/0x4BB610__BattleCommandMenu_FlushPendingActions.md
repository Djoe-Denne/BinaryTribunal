# BattleCommandMenu_FlushPendingActions @ 0x4BB610

- Instr (live): 35
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=404
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=177
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=140
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleCommandMenu_FlushPendingActions(int attacker_slot);
- Notes parent: stride staging `add esi,0Ch` (pas 0xD0 / 0x1D0 / Exists 0x44). BYTE `[esi-1]` id, BYTE `[esi]` arg, WORD `[esi+1]` mask puis `AND 0xFF7F`. `jle`/`jl` signés. `add esp,14h`. Deux stores DWORD COUNT=0. EAX leftover. Occupancy/GetRandomInt/thunk 0x4BA1B0 absents.

## C réconcilié

```c
/* BattleCommandMenu_FlushPendingActions @ 0x4BB610
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 35 instr, size 0x5D. cdecl. Staging stride 0x0C.
 */

extern signed int BATTLE_MENU_PENDING_CMD_COUNT; /* 0x1D76718, dword */
extern unsigned char BATTLE_MENU_PENDING_CMD_BUFFER[]; /* 0x1D76721, unsigned __int8[36] */

extern char __cdecl BattlePendingAction_Write(
    int entry_index,
    int attacker_slot,
    unsigned char command_id,
    unsigned char command_arg,
    unsigned short target_mask);

int __cdecl BattleCommandMenu_FlushPendingActions(int attacker_slot)
{
    int entry_index;
    int count;
    unsigned char *cursor;
    unsigned short target_mask;
    unsigned char command_arg;
    unsigned char command_id;

    count = BATTLE_MENU_PENDING_CMD_COUNT; /* A1 dword */
    entry_index = 0;                       /* xor edi, edi */
    if (count <= 0) {                      /* test eax,eax; jle loc_4BB661 (7E signed) */
        BATTLE_MENU_PENDING_CMD_COUNT = 0; /* C7 05 dword */
        return count;                      /* leftover EAX = original COUNT (<= 0) */
    }

    cursor = BATTLE_MENU_PENDING_CMD_BUFFER; /* ESI = 0x1D76721 */

    do {
        target_mask = *(unsigned short *)(cursor + 1); /* 66 8B 46 01 */
        command_arg = cursor[0];                       /* 8A 0E after xor ecx,ecx */
        target_mask &= 0xFF7Fu;                        /* 25 7F FF 00 00, bit 7 only */
        command_id = cursor[-1];                       /* 8A 56 FF */

        BattlePendingAction_Write(
            entry_index,
            attacker_slot,
            command_id,
            command_arg,
            target_mask); /* cdecl 5 args, add esp 14h; EAX discarded */

        count = BATTLE_MENU_PENDING_CMD_COUNT; /* A1 reload */
        entry_index++;                         /* inc edi */
        cursor += 0x0C;                        /* add esi, 0Ch */
    } while (entry_index < count);             /* cmp edi,eax; jl 7C signed */

    BATTLE_MENU_PENDING_CMD_COUNT = 0;         /* C7 05 dword */
    return count;                              /* leftover EAX = last reloaded COUNT */
}
```
