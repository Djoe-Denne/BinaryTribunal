# BattleAction_SelectCoverRedirect @ 0x48EB90

- Instr (live): 144
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5373
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5098
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2984
- A==B: non
- Push IDB: oui
- SetType: unsigned __int16 __cdecl BattleAction_SelectCoverRedirect(int hit_context, unsigned __int16 target_mask)
- Notes parent: Cover G08 avant G09, hit_context==1, attacker jb UNSIGNED >=3, COMMAND_TYPE_ID==8, RELATED high bit4 clear, attackFlags BYTE bits 0|1. Stride slot 0xD0 / F_CHAR 0x1D0. Occupancy 1+2 non (party 0/1/2). HP_LT_25pct byte +0x81. Cover CHARA_ABILITIES 0x10. GetRandomInt AL only (cmp 7Fh,al → slot 0 si AL>0x7F). Unpack BYTE sur arg0. Passthrough `66 8B C7` AX=DI. add esp=4 IsEligible/getSlot/power_of_two. Pas de setcc. Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleAction_SelectCoverRedirect @ 0x48EB90
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes.txt, not Hex-Rays.
 * 144 instr, size 0x20e. IDA type unsigned __int16 __cdecl(int, unsigned __int16).
 * No domain::. Slot stride 0xD0, F_CHAR 0x1D0. Occupancy 1+2 unused (party 0/1/2).
 * GetRandomInt = AL only. Unpack BYTE stores (88). Passthrough ret WORD (66 8B C7).
 * attackFlags BYTE +8. status_1 BYTE test 0x25, status_2 DWORD 0x02004009.
 * HP_LT_25pct = status_1 bit 0x100 (BYTE +0x81 bit0). Cover = CHARA_ABILITIES bit 0x10.
 * Loop jl SIGNED vs 10h. Attacker vs 3 is jb UNSIGNED. No setcc (sbb for coin flip).
 * Caller 0x48E8E1 BattleAction_ResolveTargetAndHitCount (G08, hit_context==1).
 */

extern unsigned char ATTACKER_SLOT_ID;                       /* 0x1D27AD8 */
extern unsigned char COMMAND_TYPE_ID;                      /* 0x1D27AD9 */
extern unsigned char RELATED_TO_TARGET_MASK_HIGH;          /* 0x1D28E0F */
extern unsigned int  CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 */
extern unsigned char K_ENEMY_ATTACK[];                       /* 0x1CF5600, row 20, attackFlags +8 */
extern unsigned char BATTLE_SLOT_DATA[];                    /* 0x1D27B10 */
extern unsigned char CHARA_ABILITIES[];                     /* 0x1CFF190 */
extern unsigned char byte_1D28E19;                         /* 0x1D28E19 */

int __cdecl BattleTarget_IsEligibleByStatusMask(int slot_index);
int __cdecl getSlotIdOr255_254(int slot_id);
unsigned char __cdecl Battle_GetRandomInt(void);
int __cdecl power_of_two(int exposant);

unsigned __int16 __cdecl BattleAction_SelectCoverRedirect(int hit_context, unsigned __int16 target_mask)
{
    unsigned int saved_mask;      /* edi: DWORD load of WORD arg */
    unsigned char *unp;
    int bit;
    int first_slot;
    int cover_slot;
    int slot0_eval;

    saved_mask = target_mask;

    if (hit_context != 1)
        goto passthrough;
    if ((unsigned char)ATTACKER_SLOT_ID < 3u) /* jb UNSIGNED vs cl=3 */
        goto passthrough;
    if (COMMAND_TYPE_ID != 8)
        goto passthrough;
    if (RELATED_TO_TARGET_MASK_HIGH & 4)
        goto passthrough;
    {
        unsigned int cmd = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID & 0xFFFF;
        if (K_ENEMY_ATTACK[cmd * 20 + 8] & 3) /* cl still 3; bits 0|1 */
            goto passthrough;
    }

    /* Unpack set bits as consecutive BYTES over arg0 (lea edx, &hit_context). */
    unp = (unsigned char *)&hit_context;
    for (bit = 0; bit < 16; bit++) { /* cmp eax, ebx=10h ; jl SIGNED */
        if ((unsigned __int16)(saved_mask & (1u << bit))) { /* test si,si */
            *unp = (unsigned char)bit; /* BYTE 88 02 */
            unp++;
        }
    }
    first_slot = *(unsigned char *)&hit_context; /* DWORD load then and 0xFF */

    if (!(BATTLE_SLOT_DATA[first_slot * 0xD0 + 0x81] & 1)) /* HP_LT_25pct */
        goto passthrough;

    switch (first_slot) {
    case 0: /* loc_48ED15: slot1 then slot2, both inline; occupied-fail does not try slot2 */
        if (BATTLE_SLOT_DATA[0xD0 + 0xBB] != 0xFF) {
            if ((CHARA_ABILITIES[0x1D0] & 0x10)
                && !(BATTLE_SLOT_DATA[0xD0 + 0x80] & 0x25)
                && !(*(unsigned int *)&BATTLE_SLOT_DATA[0xD0 + 0x08] & 0x02004009u))
                cover_slot = 1;
            else
                cover_slot = 0xFF;
        } else {
            if (BATTLE_SLOT_DATA[2 * 0xD0 + 0xBB] == 0xFF)
                goto passthrough;
            if ((CHARA_ABILITIES[2 * 0x1D0] & 0x10)
                && !(BATTLE_SLOT_DATA[2 * 0xD0 + 0x80] & 0x25)
                && !(*(unsigned int *)&BATTLE_SLOT_DATA[2 * 0xD0 + 0x08] & 0x02004009u))
                cover_slot = 2;
            else
                cover_slot = 0xFF;
        }
        break;

    case 1: /* loc_48EC87: slot0 inline; slot2 Cover+IsEligible */
        if (BATTLE_SLOT_DATA[0xBB] == 0xFF)
            slot0_eval = 0xFE;
        else if ((CHARA_ABILITIES[0] & 0x10)
                 && !(BATTLE_SLOT_DATA[0x80] & 0x25)
                 && !(*(unsigned int *)&BATTLE_SLOT_DATA[0x08] & 0x02004009u))
            slot0_eval = 0;
        else
            slot0_eval = 0xFF;

        if (BATTLE_SLOT_DATA[2 * 0xD0 + 0xBB] == 0xFF)
            cover_slot = 0xFE;
        else if ((CHARA_ABILITIES[2 * 0x1D0] & 0x10)
                 && BattleTarget_IsEligibleByStatusMask(2))
            cover_slot = 2;
        else
            cover_slot = 0xFF;

        if (slot0_eval == 0) {
            if (cover_slot == 2) {
                unsigned char r = Battle_GetRandomInt(); /* AL only */
                /* cmp cl=7Fh, al; sbb eax,eax; and al,0FEh; add eax,2 */
                cover_slot = (r > 0x7Fu) ? 0 : 2;
            } else {
                cover_slot = 0; /* xor eax,eax */
            }
        } else if (cover_slot != 2) {
            goto passthrough;
        }
        /* esi!=0 && eax==2: keep 2. Case 1 tails jmp loc_48ED79 (eax is 0 or 2). */
        break;

    case 2: /* loc_48EC3C: slot1 Cover+IsEligible; empty -> getSlotIdOr255_254(0) */
        if (BATTLE_SLOT_DATA[0xD0 + 0xBB] != 0xFF) {
            if (!(CHARA_ABILITIES[0x1D0] & 0x10))
                cover_slot = 0xFF;
            else if (BattleTarget_IsEligibleByStatusMask(1))
                cover_slot = 1;
            else
                cover_slot = 0xFF;
        } else {
            cover_slot = getSlotIdOr255_254(0);
            if (cover_slot == 0xFE)
                goto passthrough;
        }
        break;

    default:
        goto passthrough;
    }

    if (cover_slot == 0xFF) /* loc_48ED72 */
        goto passthrough;

    /* loc_48ED79: BYTE original slot, then 1<<cover_slot */
    byte_1D28E19 = *(unsigned char *)&hit_context;
    return (unsigned __int16)power_of_two(cover_slot);

passthrough: /* loc_48ED90 */
    byte_1D28E19 = 0xFF;
    return (unsigned __int16)saved_mask; /* mov ax, di */
}
```
