# BattleAction_ResolveSpecialActionAndUpdateDamage @ 0x485160

- Instr (live): 42
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=33
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=19
- A==B: non
- Push IDB: oui
- SetType: int BattleAction_ResolveSpecialActionAndUpdateDamage(void)
- Notes parent: gate WORD `word_1D28D90` ; CX=`word_1D28D92` ; payload[1] BYTE `unk_1D280C5` ; COMMAND_TYPE_ID BYTE 0x0C→0xF8 / setnz 0x1C→0xF3 else 0xFD / else 0xFB ; copy BYTE attacker ; stride `0xD0` Darkness `status_1` @ `0x1D27B90` bit 8 → WORD CRIT=1 ; `ACTION_EVENT_GROUP_INDEX` BYTE=0 (pas occupancy 1+2) ; cdecl + `add esp,8` ; re-read target `&0xFF` ; EAX=UpdateDamage.

## C réconcilié

```c
/* BattleAction_ResolveSpecialActionAndUpdateDamage @ 0x485160
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 42 instr, size 0xb5. IDA type int(). No args. add esp,8 after two cdecl 1-arg calls.
 * EAX leftover = Battle_UpdateDamage result (no mov eax before retn).
 * Occupancy groups 1+2 are arbitration-side; this helper forces event index 0.
 */

char __cdecl BattleAction_ResolveAndApplyDamage(int p_target_slot_id);
int __cdecl Battle_UpdateDamage(char p_target_slot_id);

extern unsigned __int16 word_1D28D90;          /* WORD gate @ 0x1D28D90 */
extern unsigned __int16 word_1D28D92;          /* CX: 1 = attack-supported */
extern unsigned __int8  unk_1D280C5;           /* payload[1] @ 0x1D280C5 */
extern unsigned __int8  COMMAND_TYPE_ID;      /* BYTE @ 0x1D27AD9 */
extern unsigned __int8  ATTACKER_SLOT_ID_1;    /* BYTE @ 0x1D280C4 */
extern unsigned __int8  ATTACKER_SLOT_ID;      /* BYTE @ 0x1D27AD8 */
extern unsigned __int16 CRIT_DAMAGE;            /* WORD @ 0x1D28D94 */
extern unsigned __int8  ACTION_EVENT_GROUP_INDEX; /* BYTE @ 0x1D280C1 event index */
extern unsigned __int8  BATTLE_DAMAGE_RESULT_BUFFER; /* target_slot @ 0x1D28344 */

int BattleAction_ResolveSpecialActionAndUpdateDamage(void)
{
    unsigned __int16 cx;     /* word_1D28D92 */
    unsigned __int8 al;      /* unk_1D280C5 */
    unsigned int slot;
    unsigned int edx;        /* slot * 0xD0 */
    int target;
    int result;

    /* 66 83 3D 90 8D D2 01 00 ; 0F 84 locret_485214 */
    if (word_1D28D90 == 0)
        return 0; /* EAX not written; leftover from caller */

    /* 66 8B 0D 92 8D D2 01 ; A0 C5 80 D2 01 */
    cx = word_1D28D92;
    al = unk_1D280C5;

    if (cx == 1) { /* 66 83 F9 01 ; 75 loc_4851A1 */
        if (al == 0x0C) { /* 3C 0C ; 75 loc_48518D */
            COMMAND_TYPE_ID = 0xF8; /* C6 05 … F8 */
        } else {
            /* loc_48518D: 3C 1C ; 0F 95 C0 setnz ; 48 ; 24 F6 ; 05 FD 00 00 00 ; A2 */
            COMMAND_TYPE_ID = (al == 0x1C) ? 0xF3 : 0xFD;
        }
    } else {
        COMMAND_TYPE_ID = 0xFB; /* loc_4851A1 C6 05 … FB fail-closed */
    }

    /* loc_4851A8: 8A 15 C4 80 D2 01 ; 66 83 F9 01 ; 88 15 D8 7A D2 01 */
    ATTACKER_SLOT_ID = ATTACKER_SLOT_ID_1;

    if (cx == 1) { /* 75 loc_4851DF skips Darkness */
        /* A1 D8 7A D2 01 ; 25 FF 00 00 00 */
        slot = (unsigned int)ATTACKER_SLOT_ID & 0xFF;
        /* 8D 0C 40 ; 8D 14 88 ; C1 E2 04  => edx = slot*0xD0 */
        edx = (slot + slot * 3 * 4) << 4;
        /* F6 82 90 7B D2 01 08  test BYTE [edx+0x1D27B90], 8  Darkness */
        if ((*(unsigned __int8 *)(0x1D27B90 + edx) & 8) != 0)
            CRIT_DAMAGE = 1; /* 66 C7 05 94 8D D2 01 01 00 WORD */
    }

    /* loc_4851DF: A1 44 83 D2 01 ; C6 05 C1 80 D2 01 00 */
    target = *(int *)&BATTLE_DAMAGE_RESULT_BUFFER;
    ACTION_EVENT_GROUP_INDEX = 0;
    BattleAction_ResolveAndApplyDamage(target & 0xFF); /* 50 ; E8 … ; no add esp yet */
    /* 8B 0D 44 83 D2 01 ; 81 E1 FF 00 00 00 ; 51 ; E8 … */
    target = *(int *)&BATTLE_DAMAGE_RESULT_BUFFER;
    result = Battle_UpdateDamage((char)(target & 0xFF));
    /* 83 C4 08 */
    word_1D28D90 = 0; /* 66 C7 05 90 8D D2 01 00 00 */
    return result; /* retn ; EAX leftover from UpdateDamage */
}
```
