# PendingCmd_QueueOrStore @ 0x484FD0

- Instr (live): 26
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=14
- A==B: non
- Push IDB: oui
- SetType: BYTE __cdecl PendingCmd_QueueOrStore(int, int, BYTE, char, char, __int16)
- Notes parent: slot stride `0xD0` (pas F_CHAR `0x1D0`) ; pending `0x1D28D44 + slot*0x18` toujours entry 0 (pas occupancy 1+2) ; Death BYTE `status_1` `0x1D27B90` bit0 ; WORD mask prefix 66 ; `cmp DWORD command_id, 4` Item → BYTE `magic_to_blow_away` `+0xC8` ; pas de callee / pas `add esp` ; EAX leftover pointeur pending (sauf Item mort = AL arg).

## C réconcilié

```c
/* PendingCmd_QueueOrStore @ 0x484FD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 26 instr, size 0x5E. IDA type BYTE __cdecl(int, int, BYTE, char, char, __int16).
 * No callees / no add esp. Unique caller BattleDrawMenu_StateMachine @ 0x4AF05F.
 * Two retn: live and dead-not-Item leftover EAX = pending entry pointer (lea 0x1D28D44).
 * Dead+Item (command_id==4): AL = command_arg after BYTE store to magic_to_blow_away.
 */

extern unsigned char BATTLE_SLOT_DATA[];              /* 0x1D27B00 ; stride 0xD0 */
extern unsigned char BATTLE_PENDING_ACTION_BUFFER[]; /* 0x1D28D44 ; 9 x 8 */

BYTE __cdecl PendingCmd_QueueOrStore(
    int slot,
    int command_id,
    BYTE command_arg,
    char aux_6,
    char aux_5,
    __int16 target_mask)
{
    unsigned char *slot_row; /* edx after shl 4 */
    unsigned char *entry;    /* eax after lea 1D28D44h[eax*8] */

    /* lea edx,[ecx+ecx*2]; lea edx,[ecx+edx*4]; shl edx,4 → slot * 0xD0.
     * BATTLE_SLOT, not F_CHAR 0x1D0. */
    slot_row = &BATTLE_SLOT_DATA[(unsigned int)slot * 0xD0];

    /* lea eax,[ecx+ecx*2]; lea eax, ds:1D28D44h[eax*8]
     * = first of the 3-entry slot block (stride 0x18). No occupancy scan of entries 1+2. */
    entry = &BATTLE_PENDING_ACTION_BUFFER[(unsigned int)slot * 0x18];

    /* test BYTE [edx+0x1D27B90], 1  (status_1 bit0 Death). Not flag_data +0x7C. */
    if (slot_row[0x90] & 1) {
        /* loc_48501C: cmp DWORD [esp+arg_4], 4 ; jnz locret_48502D */
        if (command_id != 4)
            return (BYTE)(unsigned int)entry; /* EAX leftover = lea pending */

        /* mov al, [esp+arg_8] ; mov [edx+0x1D27BC8], al  (magic_to_blow_away +0xC8) */
        slot_row[0xC8] = command_arg;
        return command_arg;
    }

    /* live path: overwrite block[slot][0] (store order as encoded) */
    entry[2] = (unsigned char)slot;           /* attacker_slot BYTE CL */
    entry[3] = (unsigned char)command_id;    /* command_id BYTE */
    entry[4] = command_arg;                   /* command_arg BYTE */
    entry[5] = (unsigned char)aux_5;          /* aux_5 BYTE */
    *(_WORD *)entry = (_WORD)target_mask;    /* target_mask WORD prefix 66 */
    entry[6] = (unsigned char)aux_6;          /* aux_6 BYTE */
    entry[7] = 1;                             /* active BYTE */
    return (BYTE)(unsigned int)entry;
}
```
