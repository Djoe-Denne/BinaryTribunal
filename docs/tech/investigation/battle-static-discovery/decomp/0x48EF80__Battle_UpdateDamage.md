# Battle_UpdateDamage @ 0x48EF80

- Instr (live): 36
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=32
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_UpdateDamage(char p_target_slot_id)
- Notes parent: event stride 0x18 (pas slot 0xD0). Occupancy absente. Index BYTE ACTION_EVENT_GROUP_INDEX orig puis INC. 14 stores BYTE/WORD(66)/DWORD. DAMAGE_DEAL et LINKED_TO_DRAIN WORD malgré IDA size 4. EAX=pointeur event. Pas de callee/GetRandomInt/setcc/jcc. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_UpdateDamage @ 0x48EF80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 36 instr, size 0xA0. End 0x48F020. IDA type int __cdecl(char p_target_slot_id).
 * No domain::. No callees. No add esp. No GetRandomInt. No occupancy 1+2.
 * No BATTLE_SLOT 0xD0 / F_CHAR 0x1D0. Event stride 0x18 (lea eax,[eax+eax*2]; lea [eax*8+0x1D28344]).
 * No jcc, no setcc, no ja/jg, no jump table. No packed source struct (globals not contiguous).
 * Widths: BYTE 88 at +0,+1,+2,+3,+0C,+0D,+0E,+0F; WORD 66 89 at +4,+6,+10,+12;
 * DWORD 89 (no 66) at +8,+14. DAMAGE_DEAL / LINKED_TO_DRAIN: WORD here (IDA item_size 4).
 * ACTION_EVENT_GROUP_INDEX BYTE @ 0x1D280C1: orig in EAX (AL), INC CL then store.
 * Return EAX leftover = dest pointer. IDA BattleDamageEvent size 24 at 0x1D28344 (offsets only).
 */

extern unsigned char ACTION_EVENT_GROUP_INDEX;          /* 0x1D280C1 */
extern unsigned char HIT_TYPE_TARGET_ANIMATION_TO_PLAY; /* 0x1D27ADC */
extern unsigned char byte_1D27ADD;                      /* 0x1D27ADD */
extern unsigned char HIT_TYPE_2;                       /* 0x1D27ADE */
extern unsigned __int16 CURRENT_MONSTER_STATUS;         /* 0x1D27AF6 */
extern unsigned __int16 DAMAGE_DEAL;                    /* 0x1D27AE4 WORD via 66 */
extern unsigned int dword_1D27AE8;                      /* 0x1D27AE8 */
extern unsigned char RELATED_TO_ATTACKER_SLOT_ID;       /* 0x1D27ADF */
extern unsigned char byte_1D27AE0;                      /* 0x1D27AE0 */
extern unsigned char byte_1D27AE1;                      /* 0x1D27AE1 */
extern unsigned char ATTACK_TYPE_PHY_OR_MAG;            /* 0x1D27AE2 (IDA '?' dropped) */
extern unsigned __int16 word_1D27AF8;                  /* 0x1D27AF8 */
extern unsigned __int16 LINKED_TO_DRAIN;                /* 0x1D27AEC WORD via 66 */
extern unsigned int dword_1D27AF0;                      /* 0x1D27AF0 */
extern unsigned char BATTLE_DAMAGE_RESULT_BUFFER[];      /* 0x1D28344 */

int __cdecl Battle_UpdateDamage(char p_target_slot_id)
{
    unsigned int idx;      /* EAX: xor eax,eax ; mov al,cl */
    unsigned char anim;    /* DL saved before CL reused */
    unsigned char *ev;

    idx = (unsigned int)ACTION_EVENT_GROUP_INDEX;
    anim = HIT_TYPE_TARGET_ANIMATION_TO_PLAY;
    ACTION_EVENT_GROUP_INDEX = (unsigned char)(idx + 1); /* inc cl; 88 0D */

    /* dest = 0x1D28344 + orig * 0x18 */
    ev = &BATTLE_DAMAGE_RESULT_BUFFER[idx * 0x18];

    ev[0x00] = (unsigned char)p_target_slot_id;          /* 88 08 */
    ev[0x01] = anim;                                       /* 88 50 01 */
    ev[0x02] = byte_1D27ADD;                               /* 88 48 02 */
    ev[0x03] = HIT_TYPE_2;                                 /* 88 50 03 */
    *(unsigned __int16 *)(ev + 0x04) = CURRENT_MONSTER_STATUS; /* 66 89 48 04 */
    *(unsigned __int16 *)(ev + 0x06) = DAMAGE_DEAL;       /* 66 89 50 06 */
    *(unsigned int *)(ev + 0x08) = dword_1D27AE8;          /* 89 48 08 */
    ev[0x0C] = RELATED_TO_ATTACKER_SLOT_ID;                /* 88 50 0C */
    ev[0x0D] = byte_1D27AE0;                               /* 88 48 0D */
    ev[0x0E] = byte_1D27AE1;                               /* 88 50 0E */
    ev[0x0F] = ATTACK_TYPE_PHY_OR_MAG;                     /* 88 48 0F */
    *(unsigned __int16 *)(ev + 0x10) = word_1D27AF8;      /* 66 89 50 10 */
    *(unsigned __int16 *)(ev + 0x12) = LINKED_TO_DRAIN;   /* 66 89 48 12 */
    *(unsigned int *)(ev + 0x14) = dword_1D27AF0;          /* 89 50 14 */

    return (int)ev;
}
```
