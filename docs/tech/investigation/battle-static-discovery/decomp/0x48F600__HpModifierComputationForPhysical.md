# HpModifierComputationForPhysical @ 0x48F600

- Instr (live): 287
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8716
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=10167
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=13342
- A==B: non
- Push IDB: oui
- SetType: int __cdecl HpModifierComputationForPhysical(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int p_damage_done)
- Notes parent: Protect status_2 0x20 SAR+byte_1D27ADD 0x10. Double test eax,800000h (pas 0x04000000). Crit lea [ebp+ebp]. Zombie status_1 WORD 0x40 SAR. Element out[0], Holy=7 -> 0x2BC, dmg+=dmg*PCT*(800-elem_def)/10000 (68DB8BAD). HIT_STATUS_2 &= ~0x04000000 puis drain ah 80h. mental_res[0x17] BYTE. Cap 9999 jle. Loops jl. Heal-flip jge HIT_TYPE_2|=1. Stride 0xD0. Occupancy 1+2 absente. Pas setcc/ja/jg/jpt_/GetRandomInt. add esp 8/20h/8/10h. EAX=EBP.

## C réconcilié

```c
/* HpModifierComputationForPhysical @ 0x48F600
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 287 instr, size 0x39c, end 0x48F99C. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0 from BATTLE_SLOT_DATA @ 0x1D27B10. No F_CHAR 0x1D0.
 * Occupancy 1+2 unused. No GetRandomInt. No setcc. No ja/jg. No jpt_.
 * Widths: 66 WORD status_1 / HIT_STATUS_1 / elem_def; DWORD HIT_STATUS_2 / max_hp /
 * LINKED_TO_DRAIN; BYTE flags. HIT_STATUS_2 &= ~0x04000000 then test ah,80h (0x8000).
 * Doubling is test eax,800000h (A9 00 00 80 00), not 0x04000000.
 * mental_res[0x17] at +0xA7 (not packed Regen). EAX = EBP after heal-flip.
 */

typedef struct {
    unsigned char  pad00[0x08];
    unsigned int   status_2;              /* +0x08 */
    unsigned char  pad0C[0x10];
    unsigned int   max_hp;                /* +0x1C */
    unsigned char  pad20[0x24];
    unsigned short elem_def[8];           /* +0x44 ; 66 movzx via xor+mov ax */
    unsigned char  pad54[0x28];
    unsigned int   flag_data;             /* +0x7C DWORD load (WORD flag + WORD immunity) */
    unsigned short status_1;             /* +0x80 */
    unsigned char  pad82[0x0E];
    unsigned char  mental_res[0x28];     /* +0x90 */
    unsigned char  padB8[0x05];
    unsigned char  str;                   /* +0xBD */
    unsigned char  vit;                   /* +0xBE */
    unsigned char  padBF[0x0A];
    unsigned char  scripted_invuln_flag; /* +0xC9 */
    unsigned char  padCA[0x06];           /* stride 0xD0 */
} FF8BattleSlotData_s;

extern FF8BattleSlotData_s BATTLE_SLOT_DATA[11]; /* 0x1D27B10 */

extern unsigned char  HIT_ELEMENT;                 /* 0x1D2A244 */
extern unsigned char  HIT_ELEMENT_PERCENT;          /* 0x1D2A241 */
extern unsigned int   HIT_STATUS_2;               /* 0x1D2A234 */
extern unsigned short HIT_STATUS_1;              /* 0x1D2A23E */
extern unsigned char  BOOL_ATTACK_CRITED;
extern unsigned char  HIT_ATTACK_ENABLER;
extern unsigned char  HIT_TYPE_2;                 /* 0x1D27ADE */
extern unsigned char  ATTACK_TYPE_PHY_OR_MAG;     /* 0x1D27AE2 ATTACK_TYPE_PHY_OR_MAG? */
extern unsigned char  RELATED_TO_ATTACKER_SLOT_ID; /* 0x1D27ADF */
extern unsigned int   LINKED_TO_DRAIN;            /* 0x1D27AEC */
extern unsigned char  byte_1D27ADD;

int  __cdecl Battle_GetElementFlagged(unsigned short p_element, unsigned char *p_list);
int  __cdecl DoesMentalStatusHit(int p_attacker_slot_id, unsigned int p_target_slot_id,
                                   int p_index, int p_mask, int p_status_list_to_check,
                                   int p_attacker_str, int p_target_vit,
                                   int p_hit_attack_enabler);
void __cdecl UpdateSpeedAndAuraCurseStatus(int p_old_status_2, unsigned int *p_status_2);

int __cdecl HpModifierComputationForPhysical(int p_attacker_slot_id, int p_target_slot_id,
                                            int p_attack_power, int p_damage_done)
{
    FF8BattleSlotData_s *target = &BATTLE_SLOT_DATA[p_target_slot_id];
    FF8BattleSlotData_s *attacker;
    unsigned int *pointer_target_status_8_38 = &target->status_2;
    unsigned int status_2 = *pointer_target_status_8_38;
    unsigned short target_zombie; /* DI = status_1 & 0x40 */
    unsigned char elem_out[4];
    unsigned int snapshot;
    int damage = p_damage_done; /* EBP */
    int drain;                  /* ESI in drain / charged-counter */
    int acc;
    int str_v;
    int vit_v;
    int i;
    int mask;

    /* Protect: status_2 & 0x20 and damage != 0 -> SAR 1, or byte_1D27ADD 0x10 */
    if ((status_2 & 0x20) != 0 && damage != 0) {
        unsigned char fl = byte_1D27ADD;
        damage >>= 1; /* sar */
        byte_1D27ADD = (unsigned char)(fl | 0x10);
    }

    /* status-doubling: test eax, 800000h (A9 00 00 80 00) then SHL 1 */
    if ((status_2 & 0x00800000u) != 0)
        damage <<= 1;

    /* crit: lea ecx,[ebp+ebp+0] */
    if (BOOL_ATTACK_CRITED)
        damage = damage + damage;

    /* Zombie: 66 mov di,status_1; and di,40h */
    target_zombie = (unsigned short)(target->status_1 & 0x40);
    if (target_zombie != 0)
        damage >>= 1; /* sar */

    /* Elemental blend if HIT_ELEMENT != 0 */
    if (HIT_ELEMENT != 0) {
        int elem_index;
        int elem_def_val;
        int t;

        /* 66 0F B6 C0 movzx ax,al ; push eax ; add esp,8 */
        Battle_GetElementFlagged((unsigned short)HIT_ELEMENT, elem_out);
        elem_index = elem_out[0] & 0xFF; /* mov eax,[list]; and eax,0FFh */

        target_zombie = (unsigned short)(target->status_1 & 0x40);
        if (target_zombie != 0 && elem_index == 7)
            elem_def_val = 0x2BC; /* Holy vs Zombie hardcoded 700 */
        else {
            /* xor eax,eax; 66 mov ax,elem_def[ecx*2] — zero-extend WORD */
            elem_def_val = (int)target->elem_def[elem_index];
        }

        /* ecx = 320h - elem_def; imul percent; imul damage; 68DB8BADh sar 0Ch signed /10000 */
        t = (0x320 - elem_def_val) * (int)(unsigned char)HIT_ELEMENT_PERCENT;
        t = t * damage;
        damage += t / 10000;
    }

    /* HIT_STATUS_2 &= ~0x04000000 always, then test ah,80h (bit 0x8000 Drain) */
    attacker = &BATTLE_SLOT_DATA[p_attacker_slot_id];
    HIT_STATUS_2 &= ~0x04000000u;
    if ((HIT_STATUS_2 & 0x8000u) != 0) {
        int p = (int)(unsigned char)HIT_ATTACK_ENABLER
              - (int)target->mental_res[0x17]; /* BYTE +0xA7 */

        RELATED_TO_ATTACKER_SLOT_ID = (unsigned char)p_attacker_slot_id;
        if (p <= 0) { /* jle signed */
            ATTACK_TYPE_PHY_OR_MAG = (unsigned char)(ATTACK_TYPE_PHY_OR_MAG | 1);
            drain = 0;
        } else {
            int atk_zombie;
            int amt = p * damage / 100; /* 51EB851Fh sar 5 signed */

            atk_zombie = attacker->status_1 & 0x40; /* 66 mov ax,status_1; and ax,40h */
            if (atk_zombie == 0 && target_zombie != 0)
                amt = -amt;
            if (atk_zombie != 0 && target_zombie == 0)
                amt = -amt;
            amt = -amt; /* unconditional neg */
            if (amt < 0) { /* jns skip */
                ATTACK_TYPE_PHY_OR_MAG = (unsigned char)(ATTACK_TYPE_PHY_OR_MAG | 1);
                amt = -amt; /* not + inc */
            }
            if (amt > 0x270F) /* jle signed cap 9999 */
                amt = 0x270F;
            drain = amt;
        }
        LINKED_TO_DRAIN = (unsigned int)drain;
        HIT_STATUS_2 &= ~0x8000u; /* and ah,7Fh */
    } else {
        drain = (int)LINKED_TO_DRAIN;
    }

    snapshot = *pointer_target_status_8_38; /* list local reused as status_2 snapshot */

    /* Charged-counter: target status_2 & 0x400000 AND DWORD flag_data test ch,10h */
    if ((snapshot & 0x400000u) != 0 && (attacker->flag_data & 0x1000u) != 0) {
        int elem2;
        int hp10;

        if ((ATTACK_TYPE_PHY_OR_MAG & 1) != 0)
            drain = -drain; /* not + inc */

        elem2 = (int)attacker->elem_def[2]; /* 66 mov cx,(elem_def+4) zero-extend */
        hp10 = (int)attacker->max_hp / 10;  /* 66666667h sar 2 signed */
        drain += (0x384 - elem2) * hp10 / 100; /* 51EB851Fh sar 5 */

        if (drain < 0) { /* jns */
            ATTACK_TYPE_PHY_OR_MAG = (unsigned char)(ATTACK_TYPE_PHY_OR_MAG | 1);
            drain = -drain;
        } else {
            ATTACK_TYPE_PHY_OR_MAG = (unsigned char)(ATTACK_TYPE_PHY_OR_MAG & 0xFE);
        }

        RELATED_TO_ATTACKER_SLOT_ID = (unsigned char)p_attacker_slot_id;
        if (drain > 0x270F) /* jle signed */
            drain = 0x270F;
        LINKED_TO_DRAIN = (unsigned int)drain;
    }

    acc = 0; /* mov [p_attacker_slot_id], 0 */
    if (target->scripted_invuln_flag != 0)
        goto loc_48F958; /* ebp still damage; skip vit overwrite + loops */

    str_v = (int)(unsigned char)attacker->str;
    vit_v = (int)(unsigned char)target->vit;
    if ((snapshot & 0x01000000u) != 0) /* VIT_0_STATUS_MASK */
        vit_v = 0;

    /* status_1 bits 0..6: 66 mov dx,HIT_STATUS_1; jl signed vs 7; list=0 */
    for (i = 0, mask = 1; i < 7; ++i, mask <<= 1) {
        if (((unsigned int)HIT_STATUS_1 & (unsigned int)mask) != 0)
            acc += DoesMentalStatusHit(p_attacker_slot_id, (unsigned int)p_target_slot_id,
                                        i, mask, 0, str_v, vit_v,
                                        (int)(unsigned char)HIT_ATTACK_ENABLER);
    }
    /* status_2 bits, edi 8..0x27, esi starts 1, list=1; jl signed vs 28h */
    for (i = 8, mask = 1; i < 0x28; ++i, mask <<= 1) {
        if ((HIT_STATUS_2 & (unsigned int)mask) != 0)
            acc += DoesMentalStatusHit(p_attacker_slot_id, (unsigned int)p_target_slot_id,
                                        i, mask, 1, str_v, vit_v,
                                        (int)(unsigned char)HIT_ATTACK_ENABLER);
    }

    UpdateSpeedAndAuraCurseStatus((int)snapshot, pointer_target_status_8_38);

    if ((unsigned char)acc != 0) { /* mov al, byte ptr acc; test al */
        if (p_attack_power == 0)
            byte_1D27ADD = (unsigned char)(byte_1D27ADD | 1);
        goto loc_48F97C; /* loc_48F969 path: no HIT_TYPE_2 miss bit */
    }

    /* loc_48F954: reload ebp from p_damage_done (already in `damage`) */
loc_48F958:
    if (p_attack_power == 0)
        HIT_TYPE_2 = (unsigned char)(HIT_TYPE_2 | 4); /* miss */

loc_48F97C:
    if (damage < 0) { /* jge signed */
        HIT_TYPE_2 = (unsigned char)(HIT_TYPE_2 | 1);
        damage = -damage; /* not + inc */
    }
    return damage; /* mov eax, ebp */
}
```
